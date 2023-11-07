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
      playlistDiv.style.border = '1px solid #ccc';

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
        image.style.width = '100px'; // Set the size as you wish
  
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

    document.getElementById('loadTracksButton').addEventListener('click', function() {
        if (selectedPlaylistId) {
            loadPlaylistTracks(selectedPlaylistId);
        } else {
            console.log('No playlist selected!');
        }
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
        saveDataAndCreateFaceCards(tracks)
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
    }
}


function displayTop(tracks) {
    const tracksContainer = document.getElementById('tracksContainer');
    tracksContainer.innerHTML = ''; // Clear the tracks container
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
    const userContainer = document.getElementById('userContainer');
    userContainer.innerHTML = `
      <div class="user-profile">
        <a href= https://open.spotify.com/user/ocr69tzun3gvj2g6c3mx43xl8> <img src="${userData.images[0]?.url || 'default-profile.png'}" alt="Profile Picture" class="profile-pic"/> </a>
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
            // After it gets data from express server, populate playlist div
            // Add event handler to toggle selection
            populatePlaylists(data);
            document.querySelectorAll('.playlist').forEach(playlist => {
                playlist.addEventListener('click', toggleSelection);

              });
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












// WORKING ON RIGHT NOW //


function saveDataAndCreateFaceCards(data) {
    const tracksContainer = document.getElementById('tracksContainer');
    tracksContainer.style.visibility = "hidden"
    tracksContainer.style.display = "none"
    // Create face cards
    createFaceCards(data);
}
  

function addAnimationAndReplaceFaceCards(clickedCard, tracks) {
    const container = document.getElementById('facecards-container');
    const allCards = container.getElementsByClassName('track-facecard');
    
    // Add classes for animation
    for (let card of allCards) {
      card.classList.add('fade-out');
      if (card === clickedCard) {
        card.classList.add('slide-up');
      } else {
        card.classList.add('slide-down');
      }
    }
  
    // Wait for the animation to finish before removing and recreating face cards
    setTimeout(() => {
      createFaceCards(tracks);
    }, 500); // This should be the length of your animation
}

  // Function to create face cards div
function createFaceCards(tracks) {
    console.log(tracks)
    // Get the container where face cards will be added
    const container = document.getElementById('facecards-container');
  
    // Clear the previous content
    container.innerHTML = '';
    tracks.sort(() => Math.random() - 0.5);
    // Create two new face card divs for the first two tracks
    tracks.slice(0, 2).forEach((trackdata, index) => {
    
        const track = trackdata.track;
        console.log(track)
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
      faceCard.onclick = () => {
        addAnimationAndReplaceFaceCards(faceCard, tracks);
      };
  
      // Append the new face card to the container
      container.appendChild(faceCard);
    });
}
