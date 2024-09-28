document.addEventListener('DOMContentLoaded', () => {
    const API_KEY = 'c7dfb9bd'; // Store API key in a variable
    const movieTitleSearch = document.getElementById('search-movie-title-input');
    const searchBtn = document.getElementById('search-btn');
    const moviesList = document.getElementById('listed-movies');
    const watchlistMoviesEl = document.getElementById('watchlist-listed-movies');
    const msg = document.getElementById('msg');

    // Initialize the watchlist array here to make it accessible globally within the DOMContentLoaded function
    let watchlist = [];

    // Fetch movie data by ID
    async function fetchMovieData(imdbID) {
        const response = await fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&i=${imdbID}`);
        const movieData = await response.json();

        if (response.ok) {
            return movieData;
        }

        throw new Error(`Failed to fetch movie with ID ${imdbID}: ${movieData.Error}`);
    }
    // Create HTML for movie card
    function createMovieCard(movieData, isWatchlist) {
        const { Poster, Title, imdbRating, Runtime, Genre, Plot, imdbID } = movieData;

        return `
        <div class="movie">
            <img class="poster" src="${Poster}">
            <span class="title">${Title}
                <span class="rating">
                    <img src="./images/star.png"> ${imdbRating}
                </span>
            </span>
            <span class="runtime">${Runtime}</span>
            <span class="genre">${Genre}</span>
            <span class="button-container">
                <button 
                class="${isWatchlist ? 'delete-from-watchlist' : 'add-to-watchlist'}"
                data-movie="${isWatchlist ? 'delete-movie' : 'add-movie'}"
                data-id="${imdbID}">
                    ${isWatchlist ? 'Remove' : 'Add to Watchlist'}
                </button>
            </span>
            <span class="plot">${Plot}</span>
        </div>`;
    }

    // Search movies by title
    function searchMovies() {
        if (!movieTitleSearch || !moviesList) return; // Check if elements exist
        fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&s=${movieTitleSearch.value}`)
            .then(res => res.json())
            .then(data => {
                if (data.Response === "False") {
                    moviesList.innerHTML = `
                    <div class="movies-container transform-left">
                        <p>Unable to find what you’re looking for.<br> Please try another search.</p>
                    </div>`;
                } else {
                    moviesArr = data.Search.map(movie => movie.imdbID);
                    renderMovies(moviesArr, "search");
                }
            });
    }

    // Render movies from array
    async function renderMovies(array, element = "search") {
        let html = '';
        for (const id of array) {
            const movieData = await fetchMovieData(id);
            if (movieData.Response === "True") {
                html += createMovieCard(movieData, element === "watchlist");
            }
        }

        if (element === "search" && moviesList) { // Ensure moviesList exists
            moviesList.innerHTML = html;
        } else if (element === "watchlist" && watchlistMoviesEl) { // Ensure watchlistMoviesEl exists
            watchlistMoviesEl.innerHTML = html || `
            <div class="watchlist-container" id="movies-container">
                <p class="wl-placeholder">Your watchlist is looking a little empty...</p>
                <p class="wl-placeholder">
                    <a href="./index.html">Let’s add some movies!</a>
                </p>
            </div>`;
        }
    }

    // Add movie to watchlist
    function addToWatchlist(id) {
        if (!watchlist.includes(id)) {
            watchlist.push(id);
            localStorage.setItem(`movie-${id}`, id);
            if (msg) msg.textContent = "Added to Watchlist"; // Ensure msg exists
        } else {
            if (msg) msg.textContent = "Already added to Watchlist"; // Ensure msg exists
        }
        showMsg();
        renderMovies(watchlist, "watchlist");
    }

    // Remove movie from watchlist
    function removeFromWatchlist(id) {
        const index = watchlist.indexOf(id);
        if (index > -1) {
            watchlist.splice(index, 1);
            localStorage.removeItem(`movie-${id}`);
        }
        showMsg();
        renderMovies(watchlist, "watchlist");
    }
    // Event listeners for adding/removing movies using event delegation
    document.addEventListener('click', e => {
        const id = e.target.dataset.id;
        if (e.target.dataset.movie === "add-movie") {
            addToWatchlist(id);
        } else if (e.target.dataset.movie === "delete-movie") {
            removeFromWatchlist(id);
        }
    });

    // Show temporary message for added/removed movies
    function showMsg() {
        if (!msg) return; // Ensure msg exists
        msg.classList.remove('fade', 'hide-behind');
        setTimeout(() => msg.classList.add('fade'), 800);
        setTimeout(() => msg.classList.add('hide-behind'), 1100);
    }

    // Initialize watchlist from localStorage
    function loadWatchlistFromLS() {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('movie-')) {
                watchlist.push(localStorage.getItem(key));
            }
        });
        renderMovies(watchlist, "watchlist");
    }

    // Ensure DOM is ready and search button exists
    if (searchBtn) {
        searchBtn.addEventListener('click', searchMovies);
    }

    loadWatchlistFromLS(); // Load watchlist when page is ready
});
