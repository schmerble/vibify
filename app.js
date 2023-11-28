
/********************************************************************
 *                         CONFIGURATION                            *
 ********************************************************************/
require('dotenv').config();
const spotifyAPI = require('spotify-web-api-node');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const express = require('express');
const querystring = require('querystring');
const path = require('path');
const app = express();
const Schema = mongoose.Schema;
const cookieParser = require('cookie-parser');



// Global vars required
const key = process.env.jwtKey
const client_id = process.env.clientID
const client_secret = process.env.secret
const redirectUri = process.env.redirectURL
const credentials = {
  clientId: client_id,
  redirectUri: redirectUri,
  clientSecret: client_secret
}

const userSchema = new Schema({
  spotifyId: String, // Spotify's user ID
  spotifyAccessToken: String,
  spotifyRefreshToken: String,
  expires_in: Number
});

const User = mongoose.model('User', userSchema);

/********************************************************************
 *                           UTILITIES                              *
 ********************************************************************/
function generateRandomString(length) {
    let text = '';
    let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  
    for (let i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}


async function updateUser(userID, accessToken, refreshToken, expires_in) {
  try {
    const result = await User.findOneAndUpdate(
      { spotifyId: userID }, // filter
      { spotifyAccessToken: accessToken,
        spotifyRefreshToken: refreshToken,
        expires_in: expires_in}, // update
      {
        new: true, // return the updated document
        upsert: true, // create a new document if one doesn't exist
        useFindAndModify: false // use native findOneAndUpdate rather than findAndModify
      }
    );
  } catch (error) {
    console.error('Error updating user:', error);
  }
}

const findUser = async (userId) => {
  try {
    const client = await User.findOne({ spotifyId: userId });
    return client
  } catch (err) {
    console.error(err);
    // handle the error
  }
}

function isTokenExpired(accessTokenExpiryTime) {
  const currentTime = new Date().getTime();
  return currentTime > accessTokenExpiryTime;
}


async function makeSpotifyApiCall(spotifyApi, method, client, userId, argsArray) {
  if (isTokenExpired(client.expires_in)) {
    // Token is expired, refresh it
    const newTokens = await spotifyApi.refreshAccessToken();
    spotifyApi.setAccessToken(newTokens.body['access_token']);

    // Update new access token and expiry time in database
    // Remember to calculate the new expiry time based on the current time and the 'expires_in' value
    await User.findOneAndUpdate({ spotifyId: userId }, {
      spotifyAccessToken: newTokens.body['access_token'],
      spotifyRefreshToken: newTokens.body['refresh_token'],
      expires_in: calculateExpiryTime(newTokens.body['expires_in'])
    });
    spotifyApi.setRefreshToken(newTokens.body['refresh_token'])
  }

  if (typeof spotifyApi[method] === 'function') {
    // If the method is a function, call it and return its result
    return await spotifyApi[method](...argsArray);
  } else {
    throw new Error(`Method ${method} is not a function on spotifyApi.`);
  }
}

function calculateExpiryTime(expiresIn) {
  // Get the current timestamp in milliseconds and convert expiresIn to milliseconds, then add them together
  const currentTime = new Date().getTime();
  const expiryTimeMilliseconds = currentTime + (expiresIn * 1000); // expiresIn is in seconds, convert to milliseconds
  return expiryTimeMilliseconds;
}

/********************************************************************
 *                           MIDDLEWARES                            *
 ********************************************************************/
// Middleware, Express Paths, Database
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.json());
app.use(cookieParser(key));

// Home screen route
app.get('/', (req, res) => {
    res.status(200).sendFile(path.join(__dirname, 'public', '/generic.html'));
});

// Login Oauth Route
// Don't touch this tbh.
app.get('/login', function(req, res) {
  // Generates random crypto-key for verifcaiton
  var state = generateRandomString(16);
  var scope = ['user-read-private', 'user-read-email', 'playlist-read-private', 'playlist-read-collaborative', 'user-library-read', 'user-top-read']
  var spotifyClient = new spotifyAPI(credentials)
  
  // our little client can actually generate urls it's quite cool
  var authLink = spotifyClient.createAuthorizeURL(scope, state)
  res.redirect(authLink)
});

// Redirect after oauth flow finishes
app.get('/redirect', function(req, res) {
    var code = req.query.code || null;
    var state = req.query.state || null;

    if (state === null) {
      res.redirect('/#' +
        querystring.stringify({
          error: 'state_mismatch'
        }));
    } else {
      var spotifyClient = new spotifyAPI(credentials)
      spotifyClient.authorizationCodeGrant(code).then(data => {
        const accessToken = data.body['access_token'];
        const refreshToken = data.body['refresh_token'];
        const expires_in = data.body['expires_in'];

      // Set the access token on the API object to use it in later calls
        spotifyClient.setAccessToken(accessToken);
        spotifyClient.setRefreshToken(refreshToken);
        

        // Now we can get the user's Spotify ID
        return Promise.all([spotifyClient.getMe(), accessToken, refreshToken, expires_in])})
      .then(( [userData, accessToken, refreshToken, expires_in] ) => {
        // userData.body.id contains the Spotify user ID
        updateUser(userData.body.id, accessToken, refreshToken, calculateExpiryTime(expires_in))

        // Registers a signed credential token to give to users, this proves that they went through auth already.
        const jwtToken = jwt.sign({
          userId: userData.body.id,
          }, key, { expiresIn: 86400 });

        // Redirect to home page with JWT Token as a cookie
        res.cookie('jwt', jwtToken, { httpOnly: true, secure: false });
        res.redirect('/home.html');
        })
      }
});

// Wrapper function made to process endpoints, don't touch this unless you need a foundational change
// Which I don't think is necessary(?), not sure tbh.
async function processEndpoint(req, method, ...kwargs) {
  try {  
    // Read cookies from browser
    let jwtCookie = req.cookies['jwt']
    // Decode cookies from request
    const jwtContent = jwt.verify(jwtCookie, key);

    // Instantiate spotifyApiClient
    let spotifyClient = await new spotifyAPI(credentials)

    // Look for specific clientId in mongoDB Atlas database (This command holds until we have the data)
    client = await findUser(jwtContent['userId']);

    // After a successful look up, grab the access token and refresh token for ApiClient to use to represent the user
    spotifyClient.setAccessToken(client['spotifyAccessToken'])
    spotifyClient.setRefreshToken(client['spotifyRefreshToken'])

    // Calls the wrapper function to process the api request and returns received data.
    data = await makeSpotifyApiCall(spotifyClient, method, client, jwtContent['userId'], ...kwargs)
    return data;
} catch (err){
  console.log("Error Occured: ProcessEndpoints: ", err)
}};

/********************************************************************
 *                              ROUTES                              *
 ********************************************************************/
//
// getPlayLists endpoint, this is the api url for requesting a user's saved playlists
app.get('/getPlaylists', async function(req, res) {
  
  console.log(" ENDPOINT || /getPlayLists")

  try {  
    processEndpoint(req, 'getUserPlaylists', [])
    .then(data => res.status(200).send(data.body.items))
  } catch(err) {console.log(err)}
});

// getRecent endpoint, this is the api url for requesting a user's recently played
app.get('/getRecent', async function(req, res) {
  console.log(" ENDPOINT || /getRecent")
  try {  
    processEndpoint(req, 'getMyRecentlyPlayedTracks', [])
    .then(data => res.status(200).send(data.body.items))
  } catch(err) {console.log(err)}
});

// getRecommendations endpoint, this is the api url for requesting recommendations based on seeds
app.get('/getRecommendations', async function(req, res) {
  console.log(" ENDPOINT || /getRecommendations")
  const seed_tracks = req.query.seed_tracks;
  try {
    processEndpoint(req, 'getRecommendations', [{ seed_tracks: seed_tracks }])
    .then(data => res.status(200).send(data.body))
  } catch(err) {console.log(err)}
});

app.get('/logout', async function(req, res) {
  console.log(" ENDPOINT || /logout")
  res.clearCookie('jwt')
  res.redirect('/');
});

// getCurrent endpoint, this is the api url for requesting a user's current track
app.get('/getCurrent', async function(req, res) {
  console.log(" ENDPOINT || /getRecent")
  try {  
    processEndpoint(req, 'getMyCurrentPlayingTrack', [])
    .then(data => res.status(200).send(data.body.items))
    .catch(err => {
      console.error(err);
      res.status(500).send('An error occurred');
    });
  } catch(err) {console.log(err)}
});

// getSelf endpoint, this is the api url for requesting own user's info.
app.get('/getSelf', async function(req, res) {
  console.log(" ENDPOINT || /getSelf")
  try {
    processEndpoint(req, 'getMe', [])
    .then(data => res.status(200).send(data.body))
    .catch(err => {
      console.error(err);
      res.status(500).send('An error occurred');
    });
  } catch(err) {console.log(err)}
})

// getSelf endpoint, this is the api url for requesting own user's top artists
app.get('/getTopArtists', async function(req, res) {
  console.log(" ENDPOINT || /getTopArtists")
  try {
    processEndpoint(req, 'getMyTopArtists', [])
    .then(data => res.status(200).send(data.body))
    .catch(err => {
      console.error(err);
      res.status(500).send('An error occurred');
    });
  } catch(err) {console.log(err)}
})

// getTopTracks endpoint, this is the api url for requesting own user's top songs
app.get('/getTopTracks', async function(req, res) {
  console.log(" ENDPOINT || /getTopTracks")
  try {
    processEndpoint(req, 'getMyTopTracks', [])
    .then(data => res.status(200).send(data.body))
    .catch(err => {
      console.error(err);
      res.status(500).send('An error occurred');
    });
  } catch(err) {console.log(err)}
})

// getPlaylistTracks endpoint, this is the api url for requesting a playlist's tracks
app.get('/getPlaylistTracks', async function(req, res){
  // This is how you read the query parameter
  const playlistId = req.query.playlistId;
  console.log(" ENDPOINT || /getPlaylistTracks")

  try {  
    processEndpoint(req, 'getPlaylistTracks',[playlistId])
    .then(data => res.status(200).send(data.body.items))
  } catch(err) {console.log(err)}
});

/********************************************************************
 *                            STARTUP                               *
 ********************************************************************/
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

