
// Config and Modules
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

// Helper functions
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
    console.log('Updated user:');
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
    client.setAccessToken(newTokens.body['access_token'])
    client.setRefreshToken(newTokens.body['refresh_token'])
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

// Middleware, Express Paths, Database
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.json());
app.use(cookieParser(key));

// Home screen route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', '/generic.html'));
});

// Login Oauth Route
// Don't touch this tbh.
app.get('/login', function(req, res) {
    var state = generateRandomString(16);
    var scope = ['user-read-private', 'user-read-email', 'playlist-read-private', 'playlist-read-collaborative', 'user-library-read', 'user-top-read']
    var spotifyClient = new spotifyAPI(credentials)
    
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
        return Promise.all([spotifyClient.getMe(), accessToken, refreshToken, expires_in])

      }).then(([userData, accessToken, refreshToken, expires_in]) => {
        // userData.body.id contains the Spotify user ID
        updateUser(userData.body.id, accessToken, refreshToken, calculateExpiryTime(expires_in))
          const jwtToken = jwt.sign({
          userId: userData.body.id, // Using your database user ID, not Spotify's
          // You can include other information here as needed
          }, key, { expiresIn: 86400 });

          // Redirect to home page with JWT Token
          res.cookie('jwt', jwtToken, { httpOnly: true, secure: false });
          res.redirect('/home.html');
          })
        }
  });


app.post('/getPlaylists', async function(req, res){
  console.log(" ENDPOINT || GET PLAYLIST CALLED || <<")
  try {  
    let jwtCookie = req.cookies['jwt']
    const jwtContent = jwt.verify(jwtCookie, key);
    const spotifyClient = new spotifyAPI(credentials)
    client = await findUser(jwtContent['userId']);
    spotifyClient.setAccessToken(client['spotifyAccessToken'])
    spotifyClient.setRefreshToken(client['spotifyRefreshToken'])

    data = await makeSpotifyApiCall(spotifyClient, 'getUserPlaylists', client, jwtContent['userId'], [jwtContent['userId']])
    res.status(200).send(data['body']['items'])
  } catch(err) {console.log(err)}
});


app.get('/getPlaylistTracks', async function(req, res){
  const playlistId = req.query.playlistId; // This is how you read the query parameter
  console.log(" ENDPOINT || GET TRACKS CALLED || <<")
  try {  
    let jwtCookie = req.cookies['jwt']
    const jwtContent = jwt.verify(jwtCookie, key);
    const spotifyClient = new spotifyAPI(credentials)
    client = await findUser(jwtContent['userId']);
    spotifyClient.setAccessToken(client['spotifyAccessToken'])
    spotifyClient.setRefreshToken(client['spotifyRefreshToken'])

    data = await makeSpotifyApiCall(spotifyClient, 'getPlaylistTracks', client, jwtContent['userId'], [playlistId])
    res.status(200).send(data['body']['items'])
  } catch(err) {console.log(err)}
});


// Start the server

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

