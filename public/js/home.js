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
        console.log(tracks)
        displayTracks(tracks);
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
    }
}

function displayTracks(tracks) {
    const tracksContainer = document.getElementById('tracksContainer');
    tracksContainer.innerHTML = ''; // Clear the tracks container
    tracks.forEach(track => {
      const trackDiv = document.createElement('div');
      trackDiv.classList.add('track');
  
      const trackName = document.createElement('h3');
      trackName.textContent = track['track'].name;
  
      const trackArtists = document.createElement('p');
      trackArtists.textContent = track['track'].artists.map(artist => artist.name).join(', ');
  
      const trackLink = document.createElement('a');
      trackLink.href = track['track'].external_urls.spotify; // Link to the track on Spotify
      trackLink.textContent = 'Listen on Spotify';
      trackLink.target = '_blank'; // Opens the link in a new tab/window
  
      const albumImage = new Image();
      albumImage.src = track['track'].album.images[0].url; // The URL to the album cover image
  
      // Append the new elements to the trackDiv
      trackDiv.appendChild(trackName);
      trackDiv.appendChild(trackArtists);
      trackDiv.appendChild(trackLink);
      trackDiv.appendChild(albumImage);
  
      // Append the trackDiv to the tracksContainer
      tracksContainer.appendChild(trackDiv);
    });
}

document.addEventListener('DOMContentLoaded', function() {
    callApi('/getPlaylists')
        .then(data => {
            populatePlaylists(data);
            document.querySelectorAll('.playlist').forEach(playlist => {
                playlist.addEventListener('click', toggleSelection);
              });
        })
        .catch(error => {
            console.error('Error fetching playlists:', error);
        });
});

document.getElementById('getMeButton').addEventListener('click', function() {
    callApi('/getMe');
});

document.getElementById('getPlaylistsButton').addEventListener('click', function() {
    callApi('/getPlaylists').then(data => {
        console.log(data)
        populatePlaylists(data)
    }).catch (err => console.log(err))
});


document.getElementById('refreshButton').addEventListener('click', function() {
    callApi('/refresh');
});

async function callApi(endpoint) {
    const response = await fetch(endpoint, {
      method: 'POST',
      credentials: 'include' // Needed to send cookies with the request
    });
  
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
  
    return await response.json();
}

function toggleSelection(event) {
    // Get all tracks
    const allPlaylist = document.querySelectorAll('.playlist');
    
    // Remove the 'selected' class from all tracks
    allPlaylist.forEach(playlist => {
      playlist.classList.remove('selected');
    });
    
    // Add the 'selected' class to the clicked track
    event.currentTarget.classList.add('selected');
}
  
  // Add the event listener to each track