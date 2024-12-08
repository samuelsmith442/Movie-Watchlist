document.addEventListener('DOMContentLoaded', () => {
    const API_KEY = 'c7dfb9bd'; // Store API key in a variable
    const movieTitleSearch = document.getElementById('search-movie-title-input');
    const searchBtn = document.getElementById('search-btn');
    const moviesList = document.getElementById('listed-movies');
    const watchlistMoviesEl = document.getElementById('watchlist-listed-movies');
    const msg = document.getElementById('msg');

    let watchlist = new Set(); // Using Set for more efficient lookups
    let searchTimeout = null;

    // Debounced search function
    function debounceSearch(func, delay) {
        return function() {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => func.apply(this, arguments), delay);
        };
    }

    // Fetch movie data in batches
    async function fetchMoviesInBatch(imdbIDs) {
        try {
            const promises = imdbIDs.map(id => 
                fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&i=${id}`)
                    .then(res => res.json())
            );
            return await Promise.all(promises);
        } catch (error) {
            console.error('Error fetching movies:', error);
            throw error;
        }
    }

    // Show loading state
    function setLoading(element, isLoading) {
        if (!element) return;
        if (isLoading) {
            element.innerHTML = '<div class="loading">Loading...</div>';
        }
    }

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
    async function searchMovies() {
        if (!movieTitleSearch?.value?.trim() || !moviesList) return;
        
        try {
            setLoading(moviesList, true);
            const response = await fetch(`https://www.omdbapi.com/?apikey=${API_KEY}&s=${movieTitleSearch.value.trim()}`);
            const data = await response.json();

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            if (data.Response === "False") {
                moviesList.innerHTML = `
                    <div class="movies-container transform-left">
                        <p>${data.Error || 'Unable to find what you\'re looking for. Please try another search.'}</p>
                    </div>`;
                return;
            }

            const moviesArr = data.Search.map(movie => movie.imdbID);
            await renderMovies(moviesArr, "search");
        } catch (error) {
            console.error('Search error:', error);
            moviesList.innerHTML = `
                <div class="movies-container transform-left">
                    <p>An error occurred while searching. Please try again later.</p>
                </div>`;
        } finally {
            setLoading(moviesList, false);
        }
    }

    // Render movies from array
    async function renderMovies(array, element = "search") {
        if (!array?.length) return;

        const targetElement = element === "search" ? moviesList : watchlistMoviesEl;
        if (!targetElement) return;

        try {
            setLoading(targetElement, true);
            const movieDataArray = await fetchMoviesInBatch(array);
            const validMovies = movieDataArray.filter(movie => movie.Response === "True");
            
            const html = validMovies.map(movieData => 
                createMovieCard(movieData, element === "watchlist")
            ).join('');

            if (element === "watchlist") {
                targetElement.innerHTML = html || `
                    <div class="watchlist-container" id="movies-container">
                        <p class="wl-placeholder">Your watchlist is looking a little empty...</p>
                        <p class="wl-placeholder">
                            <a href="./index.html">Let's add some movies!</a>
                        </p>
                    </div>`;
            } else {
                targetElement.innerHTML = html;
            }
        } catch (error) {
            console.error('Render error:', error);
            targetElement.innerHTML = `
                <div class="error-message">
                    <p>An error occurred while loading movies. Please try again later.</p>
                </div>`;
        } finally {
            setLoading(targetElement, false);
        }
    }

    // Add movie to watchlist
    function addToWatchlist(id) {
        if (!id) return;
        
        if (!watchlist.has(id)) {
            watchlist.add(id);
            localStorage.setItem(`movie-${id}`, id);
            if (msg) msg.textContent = "Added to Watchlist";
        } else {
            if (msg) msg.textContent = "Already added to Watchlist";
        }
        showMsg();
        renderMovies([...watchlist], "watchlist");
    }

    // Remove movie from watchlist
    function removeFromWatchlist(id) {
        if (!id) return;
        
        if (watchlist.has(id)) {
            watchlist.delete(id);
            localStorage.removeItem(`movie-${id}`);
        }
        showMsg();
        renderMovies([...watchlist], "watchlist");
    }

    // Show temporary message for added/removed movies
    function showMsg() {
        if (!msg) return; // Ensure msg exists
        msg.classList.remove('fade', 'hide-behind');
        setTimeout(() => msg.classList.add('fade'), 800);
        setTimeout(() => msg.classList.add('hide-behind'), 1100);
    }

    // Initialize watchlist from localStorage
    function loadWatchlistFromLS() {
        watchlist.clear();
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('movie-')) {
                watchlist.add(localStorage.getItem(key));
            }
        }
        if (watchlist.size > 0) {
            renderMovies([...watchlist], "watchlist");
        }
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

    // Event listeners
    if (searchBtn) {
        const debouncedSearch = debounceSearch(searchMovies, 500);
        searchBtn.addEventListener('click', debouncedSearch);
        movieTitleSearch?.addEventListener('input', debouncedSearch);
    }

    loadWatchlistFromLS(); // Load watchlist when page is ready
});
