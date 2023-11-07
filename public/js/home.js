
let selectedPlaylistId = null;

function populatePlaylists(playlists) {
    const container = document.getElementById('playlistsContainer');
    container.innerHTML = ''; // Clear previous content
  
    playlists.forEach(playlist => {
      // Create elements for each playlist
      const playlistDiv = document.createElement('div');
      playlistDiv.classList.add('playlist');
      playlistDiv.style.margin = '10px';
      playlistDiv.style.padding = '20px';

      playlistDiv.dataset.playlistId = playlist.id;

      // Title for the playlist
      const title = document.createElement('h3');
      title.textContent = playlist.name;
      playlistDiv.appendChild(title);
  
      // Check if playlist has images
      if (playlist.images && playlist.images.length > 0) {
        // Create anchor element to make the image clickable
        const link = document.createElement('a');
        link.href = playlist.external_urls.spotify; // Use the external Spotify URL here
        link.target = '_blank'; // Open in new tab
  
        // Create image element for the playlist cover
        const image = document.createElement('img');
        image.src = playlist.images[0].url;
        image.alt = playlist.name;
        image.style.width = '150px'; // Set the size as you wish
  
        // Append the image to the link, then the link to the playlistDiv
        link.appendChild(image);
        playlistDiv.appendChild(link);
      }
  
      // Description for the playlist
      const description = document.createElement('p');
      description.textContent = playlist.description;
      playlistDiv.appendChild(description);
      playlistDiv.addEventListener('click', function() {
        selectedPlaylistId = this.dataset.playlistId;
        console.log("ID IS CHANGED TO: %s", selectedPlaylistId)
    });

  
      // Append the playlist div to the container
      container.appendChild(playlistDiv);
    });
}

async function loadPlaylistTracks(playlistId) {
    try {
        const response = await fetch(`/getPlaylistTracks?playlistId=${playlistId}`, {method: "GET", credentials: 'include' });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const tracks = await response.json();
        //displayTracks(tracks)
        startSorting(tracks);
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
    }
}


function displayTop(tracks) {
    const tracksContainer = document.getElementById('tracksTop');
    tracksContainer.style.visibility = 'visible'
    tracksContainer.style.display = 'inherit'
    
    tracksContainer.innerHTML = ''; // Clear the tracks container

    const startDiv = document.createElement('div');
    startDiv.classList.add('track-start');
    const startText = document.createElement('h3');
    startText.textContent = "Your Top Songs:"
    startDiv.appendChild(startText)
    tracksContainer.appendChild(startDiv)

    tracks.forEach((trackInfo, index) => { 
        index++;
        const trackDiv = document.createElement('div');
        trackDiv.classList.add('track');
        
    
        const trackName = document.createElement('h3');
        trackName.textContent = index + ". " + trackInfo.name;
    
        const trackArtists = document.createElement('p');
        trackArtists.textContent = trackInfo.artists.map(artist => artist.name).join(', ');
    
        const trackLink = document.createElement('a');
        trackLink.href = trackInfo.external_urls.spotify; // Link to the track on Spotify
        trackLink.textContent = 'Listen on Spotify';
        trackLink.target = '_blank'; // Opens the link in a new tab/window
    
        const albumImage = new Image();
        albumImage.src = trackInfo.album.images[0].url; // The URL to the album cover image

        // Append the new elements to the trackDiv
        trackDiv.appendChild(trackName);
        trackDiv.appendChild(trackArtists);
        trackDiv.appendChild(trackLink);
        trackDiv.appendChild(albumImage);

        // Append the trackDiv to the tracksContainer
        tracksContainer.appendChild(trackDiv);
    });
}


function displayRecommendations(tracks) {
    const tracksContainer = document.getElementById('tracksRecommendation');
    tracksContainer.style.visibility = 'visible'
    tracksContainer.style.display = 'inherit'
    tracksContainer.innerHTML = ''; // Clear the tracks container


    const startDiv = document.createElement('div');
    startDiv.classList.add('track-start');
    const startText = document.createElement('h3');
    startText.textContent = "Your Recommended Songs:"
    startDiv.appendChild(startText)
    tracksContainer.appendChild(startDiv)

    tracks.forEach((trackInfo, index) => { 
        index++;
        const trackDiv = document.createElement('div');
        trackDiv.classList.add('track');
        
    
        const trackName = document.createElement('h3');
        trackName.textContent = index + ". " + trackInfo.name;
    
        const trackArtists = document.createElement('p');
        trackArtists.textContent = trackInfo.artists.map(artist => artist.name).join(', ');
    
        const trackLink = document.createElement('a');
        trackLink.href = trackInfo.external_urls.spotify; // Link to the track on Spotify
        trackLink.textContent = 'Listen on Spotify';
        trackLink.target = '_blank'; // Opens the link in a new tab/window
    
        const albumImage = new Image();
        albumImage.src = trackInfo.album.images[0].url; // The URL to the album cover image

        // Append the new elements to the trackDiv
        trackDiv.appendChild(trackName);
        trackDiv.appendChild(trackArtists);
        trackDiv.appendChild(trackLink);
        trackDiv.appendChild(albumImage);

        // Append the trackDiv to the tracksContainer
        tracksContainer.appendChild(trackDiv);
    });
}

function displayTracks(tracks) {
    const tracksContainer = document.getElementById('tracksContainer');
    tracksContainer.innerHTML = ''; // Clear the tracks container

    tracks.forEach((track) => {
        trackInfo = track['track']
        const trackDiv = document.createElement('div');
        trackDiv.classList.add('track');
    
        const trackName = document.createElement('h3');
        trackName.textContent = trackInfo.name;
    
        const trackArtists = document.createElement('p');
        trackArtists.textContent = trackInfo.artists.map(artist => artist.name).join(', ');
    
        const trackLink = document.createElement('a');
        trackLink.href = trackInfo.external_urls.spotify; // Link to the track on Spotify
        trackLink.textContent = 'Listen on Spotify';
        trackLink.target = '_blank'; // Opens the link in a new tab/window
    
        const albumImage = new Image();
        albumImage.src = trackInfo.album.images[0].url; // The URL to the album cover image

        // Append the new elements to the trackDiv
        trackDiv.appendChild(trackName);
        trackDiv.appendChild(trackArtists);
        trackDiv.appendChild(trackLink);
        trackDiv.appendChild(albumImage);

        // Append the trackDiv to the tracksContainer
        tracksContainer.appendChild(trackDiv);
    });
}

function createUser(userData) {
    console.log(userData)
    const userContainer = document.getElementById('userContainer');
    userContainer.innerHTML = `
      <div class="user-profile">
        <a href= ${userData.external_urls.spotify}> <img src="${userData.images[0]?.url || 'default-profile.png'}" alt="Profile Picture" class="profile-pic"/> </a>
        <div class="user-info">
          <h2>${userData.display_name}</h2>
          <p><strong>Email:</strong> ${userData.email}</p>
          <p><strong>Followers:</strong> ${userData.followers.total}</p>
          <p><strong>Account Type:</strong> ${userData.product}</p>
        </div>
      </div>
    `;
  }

// This is stuff that will happen when the page finishes loading
document.addEventListener('DOMContentLoaded', function() {
    // Will instantly call getplaylist endpoint to grab data
    callApi('/getPlaylists')
        .then(data => {
            if(data) {
                // After it gets data from express server, populate playlist div
            // Add event handler to toggle selection
                populatePlaylists(data);
                document.querySelectorAll('.playlist').forEach(playlist => {
                    playlist.addEventListener('click', toggleSelection)
                });
            }
        })
        .catch(error => {
            console.error('Error fetching playlists:', error);
        });
    callApi('/getSelf').then(data => {
        createUser(data)
    })
});

// uhhh, doesn't do anything, it's meant to get profile information
document.getElementById('getMeButton').addEventListener('click', function() {
    callApi('/getSelf').then(data => console.log(data))
});

// deprecated function
document.getElementById('getTopArtists').addEventListener('click', function() {
    callApi('/getTopArtists').then(data => {
        console.log(data)
    }).catch (err => console.log(err))
});

// doesn't do anything yet
document.getElementById('getTopTracks').addEventListener('click', function() {
    callApi('/getTopTracks').then(data => {
        console.log(data)
        displayTop(data.items)
    }).catch (err => console.log(err))
});
document.getElementById('logout').addEventListener('click', function() {
    console.log("yippee")
    callApi('/logout')
    window.location.href = "/";
    console.log("wtf??")
});
// small wrapper, idk it's not really necessary
// good to understand tho
async function callApi(endpoint) {
    const response = await fetch(endpoint, {
      method: 'GET',
      credentials: 'include' // Needed to send cookies with the request
    });
  
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
  
    return await response.json();
}

// little helper for selection feature
function toggleSelection(event) {
    // Get all tracks
    const allPlaylist = document.querySelectorAll('.playlist');
    
    // Remove the 'selected' class from all tracks
    allPlaylist.forEach(playlist => {
      playlist.classList.remove('selected');
    });
    
    // Add the 'selected' class to the clicked track
    event.currentTarget.classList.add('selected');
    if (selectedPlaylistId) {
        loadPlaylistTracks(selectedPlaylistId);
    } else {
        console.log('No playlist selected!');
    } 
}




function createTrackComponent(trackdata){
    const track = trackdata.track;
        const faceCard = document.createElement('div');
        faceCard.className = 'track-facecard';
        const image = document.createElement('img');
        image.src = track.album.images[0].url;
        image.alt = track.album.name;
        image.className = 'track-image';
        
        const trackInfo = document.createElement('div');
        trackInfo.className = 'track-info';
        
        const artistName = document.createElement('h3');
        artistName.textContent = track.artists.map(artist => artist.name).join(', ');

        const songName = document.createElement('p');
        songName.textContent = track.name;

        const albumName = document.createElement('small');
        albumName.textContent = track.album.name;

        // Append elements to trackInfo
        trackInfo.appendChild(artistName);
        trackInfo.appendChild(songName);
        trackInfo.appendChild(albumName);
        
        // Append image and trackInfo to faceCard
        faceCard.appendChild(image);
        faceCard.appendChild(trackInfo);
    
        // Add click event to refresh both cards
    
        // Append the new face card to the container
        return faceCard;
}






// WORKING ON RIGHT NOW //

function startSorting(tracks) {
  const tracksContainer = document.getElementById('trackContainer');
  tracksContainer.style.visibility = "hidden"
  tracksContainer.style.display = "none"

  let state = {
    items: [],
    left: [],
    right: [],
    merged: [],
    mergedRunningTotal: 0
  }
  let quizCompleted = false;

  tracks = tracks.map(function(item) {
    return [item];
  });
  state.items = tracks.sort(function() {
    return Math.random() > 0.5 ? 1 : -1;
  }).reverse();

  console.log(state);

  nextItems(state);
}

function nextItems(state) {
    
    if (!state) {
        // Swap Cards
        let temp = state.left;
        state.left = state.right;
        state.right = temp;
    }

    let remaining = state.left.length + state.right.length;

    if (remaining > 0) {
        if (state.right.length == 0) {
            while (state.left.length) {
                state.merged.push(state.left.shift());
            }
            state.items.push(state.merged);
            state.mergedRunningTotal += state.merged.length;
            nextItems(state);
            return;
        } else if (state.left.length == 0) {
        while (state.right.length) {
            state.merged.push(state.right.shift());
        }
        state.items.push(state.merged);
        state.mergedRunningTotal += state.merged.length;
        nextItems(state);
        return;

        } else {
        let trackOne = state.left[0];
        let trackTwo = state.right[0];
        let trackDuo = [ trackOne, trackTwo ];
        
        // Get the container where face cards will be added
        const container = document.getElementById('facecards-container');
        
        // Clear the previous content
        container.innerHTML = '';
        
        // Create two new face card divs for the first two tracks
        trackDuo.forEach(async (trackdata, index) => {
            trackComp = createTrackComponent(trackdata)
            trackComp.onclick = function () {
                state.numComparisons++
                selected(state, index);
            }
            container.append(trackComp)
        });
        }
    } else {
    if (state.items.length > 1) {
      // Initiate sorting
      state.left = state.items.shift();
      state.right = state.items.shift();
      state.merged = [];
      nextItems(state);
      return;
    } else {
      // Sorting is complete, return the results in rankedTracks
      let rankedTracks = state.merged.reverse();
      console.log(rankedTracks)
      returnResults(rankedTracks);
    }
  }
}

function selected(state, index) {
    switch (index) {
      case 0:
        state.merged.push(state.right.shift());
        break;
      case 1:
        state.merged.push(state.left.shift());
        break
    }
  
    nextItems(state);
}

async function returnResults(tracks) {
  const facecardsContainer = document.getElementById('facecards-container');
  facecardsContainer.innerHTML = '';

  // Build string of ranked songs
  let seedTracks = [];
  let topTracks = tracks.map(item => item.track);
  for (let i = 0; i < topTracks.length; i++) {
    if (seedTracks.length < 5)
      seedTracks.push(topTracks[i].id);
  }

  // Build Recommendations
  let seedTrackString = seedTracks.join(',');

  const response = await fetch(`/getRecommendations?seed_tracks=${seedTrackString}`, {
    method: 'GET',
    credentials: 'include' // Needed to send cookies with the request
  });

  let responseReco = await response.json();
  let recommendedTracks = responseReco.tracks;
  displayTop(topTracks)
  displayRecommendations(recommendedTracks.slice(0, topTracks.length))
  document.getElementById('trackContainer').style.display = 'flex'
}