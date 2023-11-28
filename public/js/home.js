
let selectedPlaylistId = null;
let currentPlayButton = null; // Variable to keep track of the currently playing play button
let playListData = [];
let userID = null;
let maxNumTracks = 1;

function populatePlaylists(playlists) {
    const container = document.getElementById('playlistsContainer');
    container.innerHTML = ''; // Clear previous content
    playlists.forEach(playlist => {
      // Create element node for each playlist
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
      if(playlist.tracks.total > maxNumTracks) {
        console.log("true", playlist.tracks.total);
        maxNumTracks = playlist.tracks.total;
        console.log("sanity check", maxNumTracks);

      }
      playListData.push(
        {
        'title': playlist.name,
        'numTracks': playlist.tracks.total,
        'madeBy': playlist.owner.id === userID ? true : false,
        'public': playlist.public,
        'collaborative': playlist.collaborative,
        'object': playlistDiv
        }
      );
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
        scrollToBottomOfWindow();
    } catch (error) {
        console.error('There was a problem with the fetch operation:', error);
    }
}



function displayTop(tracks) {
    const gameContainer = document.getElementById('gameContainer')
    gameContainer.style.display = "none";
    const trackWrapper = document.getElementById('trackContainer');
    trackWrapper.style.visibility = 'visible';
    trackWrapper.style.display = 'flex';
    const tracksContainer = document.getElementById('tracksTop');
    tracksContainer.style.visibility = 'visible'
    tracksContainer.style.display = 'flex'
    
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
    
        // const trackLink = document.createElement('a');
        // trackLink.href = trackInfo.external_urls.spotify; // Link to the track on Spotify
        // trackLink.textContent = 'Listen on Spotify';
        // trackLink.target = '_blank'; // Opens the link in a new tab/window

        const playButton = document.createElement('button');
        playButton.textContent = '▶';
        playButton.className = 'play-button';

        let audio = document.getElementById("myAudio");

       // Toggle between play and pause on button click
      playButton.addEventListener('click', (event) => {      
      event.stopPropagation();//ensures the track card won't get clicked and generate two different track cards when the play button is clicked
      
      // audio stream is initialized and its not paused, so pause the audio
      if (audio && !audio.paused) {
          audio.pause();
          if (currentPlayButton) {
            currentPlayButton.textContent = '▶'; // Change it back to the play symbol
        }
      } else { // audio stream is initialized and is paused, so play the audio
          if (audio) audio.pause(); // Pause any currently playing audio
          audio = new Audio(trackInfo.preview_url); // get an audio preview of the track
          audio.play(); // 
          playButton.textContent = '| |'; // change playButton to contain text symbolizing pause button
          currentPlayButton = playButton; // keep track of the playButton that is currently active

          setTimeout(() => { // Stop playing after 30 seconds
              audio.pause();
              playButton.textContent = '▶';
          }, 30000);
      }
  });

  trackDiv.addEventListener('click', () => {
    // Assuming trackInfo.external_urls.spotify contains the Spotify track URL
    window.open(trackInfo.external_urls.spotify, '_blank');
});
    
        const albumImage = new Image();
        albumImage.src = trackInfo.album.images[0].url; // The URL to the album cover image

        // Append the new elements to the trackDiv
        trackDiv.appendChild(trackName);
        trackDiv.appendChild(trackArtists);
        trackDiv.appendChild(playButton);
        trackDiv.appendChild(albumImage);

        // Append the trackDiv to the tracksContainer
        tracksContainer.appendChild(trackDiv);
    });
}

function displayRecommendations(tracks) {
    const tracksContainer = document.getElementById('tracksRecommendation');
    tracksContainer.style.visibility = 'visible'
    tracksContainer.style.display = 'flex'
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
    
        const playButton = document.createElement('button');
        playButton.textContent = '▶';
        playButton.className = 'play-button';

        let audio = document.getElementById("myAudio");


        playButton.addEventListener('click', (event) => {      
          event.stopPropagation();//ensures the track card won't get clicked and generate two different track cards when the play button is clicked
          
          // audio stream is initialized and its not paused, so pause the audio
          if (audio && !audio.paused) {
              audio.pause();
              if (currentPlayButton) {
                currentPlayButton.textContent = '▶'; // Change it back to the play symbol
            }
          } else { // audio stream is initialized and is paused, so play the audio
              if (audio) audio.pause(); // Pause any currently playing audio
              audio = new Audio(trackInfo.preview_url); // get an audio preview of the track
              audio.play(); // 
              playButton.textContent = '| |'; // change playButton to contain text symbolizing pause button
              currentPlayButton = playButton; // keep track of the playButton that is currently active
    
              setTimeout(() => { // Stop playing after 30 seconds
                  audio.pause();
                  playButton.textContent = '▶';
              }, 30000);
          }
      });

      trackDiv.addEventListener('click', () => {
        // Assuming trackInfo.external_urls.spotify contains the Spotify track URL
        window.open(trackInfo.external_urls.spotify, '_blank');
    });
    
        const albumImage = new Image();
        albumImage.src = trackInfo.album.images[0].url; // The URL to the album cover image

        // Append the new elements to the trackDiv
        trackDiv.appendChild(trackName);
        trackDiv.appendChild(trackArtists);
        trackDiv.appendChild(playButton);
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
    
        // const trackLink = document.createElement('a');
        // trackLink.href = trackInfo.external_urls.spotify; // Link to the track on Spotify
        // trackLink.textContent = 'Listen on Spotify';
        // trackLink.target = '_blank'; // Opens the link in a new tab/window

        const playButton = document.createElement('a');
        playButton.textContent = '▶';
        playButton.className = 'play-button';

        // const playButtonDiv = document.createElement('div');
        // playButtonDiv.appendChild(playButton);
    
        const albumImage = new Image();
        albumImage.src = trackInfo.album.images[0].url; // The URL to the album cover image

        // Append the new elements to the trackDiv
        trackDiv.appendChild(trackName);
        trackDiv.appendChild(trackArtists);
        trackDiv.appendChild(playButton);
        trackDiv.appendChild(albumImage);

        // Append the trackDiv to the tracksContainer
        tracksContainer.appendChild(trackDiv);
    });
}



function createUser(userData) {
    console.log(userData)
    const iconDiv = document.getElementById('icon');
    const email = document.getElementById('email');
    const name = document.getElementById('name');
    const followers = document.getElementById('followers');
    const type = document.getElementById('type');
    const imageUrl = userData.images && userData.images[0] ? userData.images[0].url : 'default-profile.png';
    iconDiv.innerHTML = `<img src="${imageUrl}" alt="Profile Picture" class="profile-pic" id='icon'/>`;
    name.innerHTML = "<h2 id='name'>" +  userData.display_name + "</h2>";
    followers.innerHTML = "<p id='followers'> Followers: " +  userData.followers.total + "</strong></p>";
    type.innerHTML = "<p id='type'> Type: " +  userData.product + "</strong></p>";
    email.innerHTML = "Email: <strong>" + userData.email + "</strong>";

    userID = userData.id;
  }

// This is stuff that will happen when the page finishes loading
document.addEventListener('DOMContentLoaded', function() {
    // Will instantly call getplaylist endpoint to grab data
    callApi('/getSelf').then(data => {
      createUser(data)
    })
    callApi('/getPlaylists')
        .then(data => {
            if(data) {
                // After it gets data from express server, populate playlist div
            // Add event handler to toggle selection
                populatePlaylists(data);
                document.querySelectorAll('.playlist').forEach(playlist => {
                    playlist.addEventListener('click', toggleSelection)
                })
                updateFilters();
            }
        })
        .catch(error => {
            console.error('Error fetching playlists:', error);
        });
});

// uhhh, doesn't do anything, it's meant to get profile information


function printData(item) {
  console.log(item);
};



// deprecated function
document.getElementById('getTopArtists').addEventListener('click', function() {
    callApi('/getTopArtists').then(data => {
        console.log(data)
        displayArtists(data.items)
        window.scrollTo({top: document.body.scrollHeight / 3, behavior: 'smooth'});
    }).catch (err => console.log(err))
});

// doesn't do anything yet
document.getElementById('getTopTracks').addEventListener('click', function() {
    callApi('/getTopTracks').then(data => {
        console.log(data)
        displayTop(data.items)
        window.scrollTo({top: document.body.scrollHeight / 3, behavior: 'smooth'});
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
    const track = trackdata.track; // extracting track specific data from 'trackdata'
    const faceCard = document.createElement('div'); // Creating div called facecard to hold track specific information
    faceCard.className = 'track-facecard'; // Let our facecard inherit the CSS styling declared in main.css
    const image = document.createElement('img'); // Create an img to hold the song cover art 
    image.src = track.album.images[0].url; // attribute that holds the album cover for the track
    image.alt = track.album.name; // attribute that holds the name for the 
    image.className = 'track-image';
        
    const trackInfo = document.createElement('div');
    trackInfo.className = 'track-info';
        
    const artistName = document.createElement('h3');
    artistName.textContent = track.artists.map(artist => artist.name).join(', ');

    const songName = document.createElement('p');
    songName.textContent = track.name;

    const albumName = document.createElement('small');
    albumName.textContent = track.album.name;

    const playButton = document.createElement('button');
    playButton.textContent = '▶';
    playButton.className = 'play-button';

    const playButtonDiv = document.createElement('div');
    playButtonDiv.appendChild(playButton);

    let audio = document.getElementById("myAudio");

     // Toggle between play and pause on button click
    playButton.addEventListener('click', (event) => {      
      event.stopPropagation();//ensures the track card won't get clicked and generate two different track cards when the play button is clicked
      
      // audio stream is initialized and its not paused, so pause the audio
      if (audio && !audio.paused) {
          audio.pause();
          if (currentPlayButton) {
            currentPlayButton.textContent = '▶'; // Change it back to the play symbol
        }
      } else { // audio stream is initialized and is paused, so play the audio
          if (audio) audio.pause(); // Pause any currently playing audio
          audio = new Audio(track.preview_url); // get an audio preview of the track
          audio.play(); // 
          playButton.textContent = '| |'; // change playButton to contain text symbolizing pause button
          currentPlayButton = playButton; // keep track of the playButton that is currently active

          setTimeout(() => { // Stop playing after 30 seconds
              audio.pause();
              playButton.textContent = '▶';
          }, 30000);
      }
  });

    // Append elements to trackInfo
    trackInfo.appendChild(artistName);
    trackInfo.appendChild(songName);
    trackInfo.appendChild(albumName);
    trackInfo.appendChild(playButtonDiv);
        
    // Append image and trackInfo to faceCard
    faceCard.appendChild(image);
    faceCard.appendChild(trackInfo);

    // FaceCard click event that should cut audio channels for both track cards when clicked. Currently doesn't work when audio from one track is playing and the other track card is clicked.
    faceCard.addEventListener('click', () => {
    if (audio && !audio.paused) {
        audio.pause(); // pause audio channels
        if (currentPlayButton) {
            currentPlayButton.textContent = '▶'; // Change it back to the play symbol
        }
      }
  });
    
    // Append the new face card to the container
    return faceCard; 
 } 

// WORKING ON RIGHT NOW //
function startSorting(tracks) {
  const tracksContainer = document.getElementById('trackContainer');
  tracksContainer.style.visibility = "hidden"
  tracksContainer.style.display = "none"
  const gameContainer = document.getElementById("gameContainer");
  gameContainer.style.visibility = "visible";
  gameContainer.style.display = "flex";

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
                state.numComparisons++;
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



document.getElementById('filters').addEventListener('click', function() {
  console.log("click!")
  const filterMenu = document.getElementById('filterMenu');
  if (filterMenu.classList.contains('hidden')) {
    filterMenu.classList.remove('hidden');
    filterMenu.classList.add('visible');
    this.innerHTML = "&#11165;"
  } else {
    
    filterMenu.classList.remove('visible');
    filterMenu.classList.add('hidden');
    this.innerHTML = "&#11167;"
  }
});


// DO NOT TOUCH THIS, THIS SHIT DROVE ME CRAZY FUCK


const ownerCheck = document.getElementById('ownerCheck');
const collabCheck = document.getElementById('collabCheck');
const publicCheck = document.getElementById('publicCheck');

// Checkbox stuff ugh.
const checkboxes = document.querySelectorAll('.checkContainer input[type="checkbox"]');
checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', function() {
        if (this.checked) {
            this.parentNode.classList.add('checked');
        } else {
            this.parentNode.classList.remove('checked');
        }
    });
  
});

document.getElementById('searchInput').addEventListener('input', function(e) {
  const searchTerm = e.target.value.toLowerCase();
  const filterByOwner = ownerCheck.checked;
  const filterByCollab = collabCheck.checked;
  const filterByPublic = publicCheck.checked;
  playListData.forEach(playlist => {
      const title = playlist.title.toLowerCase();
      let showPlaylist = (!filterByOwner || playlist.madeBy) && // Show if 'By you' is not checked or if the playlist is made by the user
      (!filterByCollab || playlist.collaborative) && // Show if 'Collaborative' is not checked or if the playlist is collaborative
      (!filterByPublic || playlist.public) &&
      (title.includes(searchTerm));
      if (showPlaylist) {
          playlist.object.classList.remove('hidden');
          playlist.object.style.display = 'block'; // Reset to default or 'block'
      } else {
          if (!playlist.object.classList.contains('hidden')) {
              playlist.object.classList.add('hidden');
              playlist.object.addEventListener('transitionend', function() {
                  // Only set display to none after the fade out
                  if (playlist.object.classList.contains('hidden')) {
                      playlist.object.style.display = 'none';
                  }
              }, { once: true }); // Ensure the listener is called only once
          }
      }
  });
});

function filterPlaylists() {
  const filterByOwner = ownerCheck.checked;
  const filterByCollab = collabCheck.checked;
  const filterByPublic = publicCheck.checked;

  playListData.forEach(playlist => {
      // Determine if the playlist should be shown based on the filters

      const showPlaylist = (!filterByOwner || playlist.madeBy) && // Show if 'By you' is not checked or if the playlist is made by the user
                           (!filterByCollab || playlist.collaborative) && // Show if 'Collaborative' is not checked or if the playlist is collaborative
                           (!filterByPublic || playlist.public); // Show if 'Public' is not checked or if the playlist is public
      if (showPlaylist) {
          playlist.object.classList.remove('hidden');
          playlist.object.style.display = ''; // Reset to default or 'block'

      } else {
          playlist.object.classList.add('hidden');
          playlist.object.addEventListener('transitionend', function() {
              if (playlist.object.classList.contains('hidden')) {
                  playlist.object.style.display = 'none';
              }
          }, { once: true });
      }
  });
}


ownerCheck.addEventListener('change', filterPlaylists);
collabCheck.addEventListener('change', filterPlaylists);
publicCheck.addEventListener('change', filterPlaylists);



function scrollToBottomOfWindow() {
  window.scrollTo({top:document.body.scrollHeight, behavior: 'smooth'});

}

window.addEventListener('scroll', function() {
  var scrollPosition = window.scrollY; // Current vertical scroll position
  var windowHeight = window.innerHeight; // Height of the viewport
  var documentHeight = document.documentElement.scrollHeight; // Total height of the document

  // Calculate the halfway point
  var halfwayPoint = documentHeight / 2;

  // Get the button element
  var myButton = document.getElementById('scrollUp');

  // Show or hide the button based on scroll position
  if (scrollPosition >= halfwayPoint - windowHeight / 2) {
      myButton.style.display = 'block'; // Show the button
  } else {
      myButton.style.display = 'none'; // Hide the button
  }
});


var myButton = document.getElementById('scrollUp');
document.getElementById('scrollUp').addEventListener('click', function() {
  window.scrollTo({top: 0, behavior: 'smooth'});
})




var maxTrackSpan = document.getElementById('maxTrackSpan');
var trackRange = document.getElementById('trackRange');
trackRange.addEventListener('input', function() {
  // Update the span's text with the slider's current value
  maxTrackSpan.textContent = 'Max Tracks: ' + this.value;
  playListData.forEach(playlist => {
    if (playlist.numTracks <= this.value) {
        playlist.object.classList.remove('hidden');
        playlist.object.style.display = 'flex'; // Reset to default or 'block'
    } else {
        if (!playlist.object.classList.contains('hidden')) {
            playlist.object.classList.add('hidden');
            playlist.object.addEventListener('transitionend', function() {
                // Only set display to none after the fade out
                if (playlist.object.classList.contains('hidden')) {
                    playlist.object.style.display = 'none';
                }
            }, { once: true }); // Ensure the listener is called only once
        }
    }
  });
});



function updateFilters() {
  console.log("called");
  var trackRange = document.getElementById('trackRange');
  trackRange.max = maxNumTracks;
}



function toggleMenu() {
  console.log('click');
  var menu = document.getElementById("profileMenu");
  menu.style.display = menu.style.display === "block" ? "none" : "block";
}




function displayArtists(artist) {
  const gameContainer = document.getElementById('gameContainer')
  gameContainer.style.display = "none";
  const trackWrapper = document.getElementById('trackContainer');
  trackWrapper.style.visibility = 'visible';
  trackWrapper.style.display = 'flex';
  const tracksContainer = document.getElementById('tracksTop');
  tracksContainer.style.visibility = 'visible'
  tracksContainer.style.display = 'flex'
  
  tracksContainer.innerHTML = ''; // Clear the tracks container

  const startDiv = document.createElement('div');
  startDiv.classList.add('track-start');
  const startText = document.createElement('h3');
  startText.textContent = "Your Top Artists:"
  startDiv.appendChild(startText)
  tracksContainer.appendChild(startDiv)
  artist.forEach((artistInfo, index) => { 
      index++;
      const trackDiv = document.createElement('div');
      trackDiv.classList.add('track');
      
  
      const trackName = document.createElement('h3');
      trackName.textContent = index + ". " + artistInfo.name;
  
      trackDiv.addEventListener('click', () => {
        window.open(artistInfo.external_urls.spotify, '_blank');
      });
  
      const albumImage = new Image();
      albumImage.src = artistInfo.images[0].url; // The URL to the album cover image

      // Append the new elements to the trackDiv
      trackDiv.appendChild(trackName);
      trackDiv.appendChild(albumImage);

      // Append the trackDiv to the tracksContainer
      tracksContainer.appendChild(trackDiv);
  });
}