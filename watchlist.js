document.addEventListener('DOMContentLoaded', () => {
    const API_KEY = 'c7dfb9bd'; // Move API key to a constant
    const watchlistMoviesEl = document.getElementById('watchlist-listed-movies');
    const msg = document.getElementById('msg');
    
    let watchlist = [];

    // Initialize watchlist from localStorage and render it
    function initWatchlist() {
        watchlist = loadWatchlistFromLS();
        renderWatchlist();
    }

    // Load watchlist from localStorage
    function loadWatchlistFromLS() {
        const storedWatchlist = [];
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('movie-')) {
                storedWatchlist.push(localStorage.getItem(key)); // Directly push item to array
            }
        });
        return storedWatchlist;
    }

    // Render watchlist movies
    async function renderWatchlist() {
        if (!watchlistMoviesEl) return;

        if (watchlist.length === 0) {
            showEmptyWatchlist();
            localStorage.clear(); // Clear localStorage if watchlist is empty
        } else {
            watchlistMoviesEl.innerHTML = ''; // Clear current content
            for (const id of watchlist) {
                try {
                    const movieData = await fetchMovieData(id);
                    if (movieData.Response === 'True') {
                        watchlistMoviesEl.innerHTML += createMovieCard(movieData, id);
                    }
                } catch (error) {
                    console.error(`Error fetching movie with ID ${id}:`, error);
                }
            }
        }
    }
    // Fetch movie data by ID
    async function fetchMovieData(id) {
        const response = await fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&i=${id}`);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    }

    // Create movie card HTML
    function createMovieCard(data, id) {
        return `
            <div class="movie">
                <img class="poster" src="${data.Poster}" alt="${data.Title}">
                <span class="title">${data.Title}
                    <span class="rating">
                        <img src="/images/star.png"> ${data.imdbRating}
                    </span>
                </span>
                <span class="runtime">${data.Runtime}</span>
                <span class="genre">${data.Genre}</span>
                <span class="delete">
                    <button 
                    id="movie-${id}"
                    class="delete-from-watchlist"
                    data-movie="movie"
                    data-id="${id}">Remove</button>
                </span>
                <span class="plot">${data.Plot}</span>
            </div>`;
    }

    // Show message when watchlist is empty
    function showEmptyWatchlist() {
        watchlistMoviesEl.innerHTML = `
            <div class="watchlist-container" id="movies-container">
                <p class="wl-placeholder">Your watchlist is looking a little empty...</p>
                <p class="wl-placeholder">
                    <a href="./index.html">Let’s add some movies!</a>
                </p>
            </div>`;
    }

    // Remove movie from watchlist and update localStorage
    function removeFromWatchlist(id) {
        localStorage.removeItem(`movie-${id}`); // Remove from localStorage
        watchlist = watchlist.filter(item => item !== id); // Filter out removed movie from array
        renderWatchlist(); // Re-render the watchlist
        showMsg("Movie removed from watchlist");
    }

    // Show a temporary message
    function showMsg(message) {
        if (!msg) return;
        msg.textContent = message;
        msg.classList.remove('fade');
        setTimeout(() => msg.classList.add('fade'), 1000);
    }

    // Event listener for removing movies
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-from-watchlist')) {
            const id = e.target.dataset.id;
            removeFromWatchlist(id);
        }
    });

    // Initialize the watchlist
    initWatchlist();
});
