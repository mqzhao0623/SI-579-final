// Track the number of quotes viewed in this session
let quotesViewed = 0;
let currentQuote = '';
let quoteCache = [];

// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
    const quoteText = document.getElementById('quote-text');
    const quoteCount = document.getElementById('count');
    const nextQuoteBtn = document.getElementById('next-quote');
    const favoriteQuoteBtn = document.getElementById('favorite-quote');
    const favoriteText = document.getElementById('favorite-text');
    const clearFavoritesBtn = document.getElementById('clear-favorites');

    /**
     * Fetches quotes from ZenQuotes API
     * @async
     * @returns {Promise<Quote[]|null>} Array of quotes or null if fetch fails
     * @throws {Error} When network request fails
     */
    async function fetchQuotes() {
        try {
            const response = await fetch('https://zenquotes.io/api/quotes/');
            const data = await response.json();
            quoteCache = data;
            return data;
        } catch (error) {
            console.error('Error fetching quotes:', error);
            return null;
        }
    }

    /**
     * Returns a random quote from the cache or API
     * @async
     * @returns {Promise<string>} A formatted quote string in the format "quote - author"
     */
    async function getRandomQuote() {
        if (quoteCache.length === 0) {
            const quotes = await fetchQuotes();
            if (!quotes) {
                return 'Failed to load quotes. Please try again later.';
            }
        }
        const randomIndex = Math.floor(Math.random() * quoteCache.length);
        const quote = quoteCache[randomIndex];
        return `${quote.q} - ${quote.a}`;
    }

    /**
     * Checks if user has generated too many quotes in the last hour
     * @async
     * @returns {Promise<boolean>} Returns true if user can generate more quotes, false if limit reached
     */
    async function checkQuoteFrequency() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['quoteGenerationTimes'], (result) => {
                const now = Date.now();
                let timestamps = result.quoteGenerationTimes || [];

                // Remove timestamps older than 1 hour
                timestamps = timestamps.filter(time => now - time < 3600000);

                // Check if limit reached
                if (timestamps.length >= 4) {
                    const oldestTimestamp = timestamps[0];
                    const timeRemaining = Math.ceil((3600000 - (now - oldestTimestamp)) / 60000);
                    alert(`You've reached the hourly quote limit (4 quotes per hour). Please wait ${timeRemaining} minutes before generating more quotes. Remember to focus on your work! 😊`);
                    chrome.storage.local.set({ quoteGenerationTimes: timestamps });
                    resolve(false);
                    return;
                }

                resolve(true);
            });
        });
    }

    /**
     * Records a new quote generation timestamp
     * @async
     * @returns {Promise<void>}
     */
    async function recordQuoteGeneration() {
        return new Promise((resolve) => {
            chrome.storage.local.get(['quoteGenerationTimes'], (result) => {
                const now = Date.now();
                let timestamps = result.quoteGenerationTimes || [];

                // Remove timestamps older than 1 hour
                timestamps = timestamps.filter(time => now - time < 3600000);

                // Add new timestamp
                timestamps.push(now);

                // Save updated timestamps
                chrome.storage.local.set({ quoteGenerationTimes: timestamps }, () => {
                    resolve();
                });
            });
        });
    }

    /**
     * Updates the displayed quote and quote count
     * @async
     * @param {boolean} [isInitialLoad=false] - Whether this is the initial load of the extension
     * @returns {Promise<void>}
     */
    async function updateQuote(isInitialLoad = false) {
        // Only check frequency and record generation if not initial load
        if (!isInitialLoad) {
            const canGenerateQuote = await checkQuoteFrequency();
            if (!canGenerateQuote) {
                return;
            }
        }

        currentQuote = await getRandomQuote();
        if (currentQuote !== 'Failed to load quotes. Please try again later.') {
            if (!isInitialLoad) {
                await recordQuoteGeneration();
                quotesViewed++;
                quoteCount.textContent = quotesViewed;
            }
        }
        quoteText.textContent = currentQuote;
    }

    /**
     * Deletes a specific quote from favorites
     * @param {string} quoteToDelete - The quote to be deleted
     */
    function deleteQuote(quoteToDelete) {
        chrome.storage.local.get(['favoriteQuotes'], (result) => {
            let favoriteQuotes = result.favoriteQuotes || [];
            favoriteQuotes = favoriteQuotes.filter(quote => quote !== quoteToDelete);
            chrome.storage.local.set({ favoriteQuotes }, () => {
                if (chrome.runtime.lastError) {
                    console.error('Error deleting quote:', chrome.runtime.lastError);
                    return;
                }
                updateFavoriteQuotesDisplay(favoriteQuotes);
            });
        });
    }

    /**
     * Clears all favorite quotes after user confirmation
     * @returns {void}
     */
    function clearAllFavorites() {
        if (confirm('Are you sure you want to delete all favorite quotes?')) {
            chrome.storage.local.set({ favoriteQuotes: [] }, () => {
                if (chrome.runtime.lastError) {
                    console.error('Error clearing favorites:', chrome.runtime.lastError);
                    return;
                }
                updateFavoriteQuotesDisplay([]);
            });
        }
    }

    /**
     * Saves the current quote to favorite quotes list if not already present
     * @returns {void}
     */
    function saveFavoriteQuote() {
        if (!currentQuote) return;

        chrome.storage.local.get(['favoriteQuotes'], (result) => {
            let favoriteQuotes = result.favoriteQuotes || [];
            if (!favoriteQuotes.includes(currentQuote)) {
                favoriteQuotes.push(currentQuote);
                chrome.storage.local.set({ favoriteQuotes }, () => {
                    if (chrome.runtime.lastError) {
                        console.error('Error saving quote:', chrome.runtime.lastError);
                        return;
                    }
                    updateFavoriteQuotesDisplay(favoriteQuotes);
                    favoriteQuoteBtn.style.backgroundColor = '#28a745';
                    setTimeout(() => {
                        favoriteQuoteBtn.style.backgroundColor = '#dc3545';
                    }, 500);
                });
            }
        });
    }

    /**
     * Updates the display of favorite quotes in the UI
     * @param {string[]} quotes - Array of favorite quotes to display
     * @returns {void}
     */
    function updateFavoriteQuotesDisplay(quotes) {
        if (!quotes || quotes.length === 0) {
            favoriteText.textContent = 'No favorite quotes yet';
            return;
        }
        favoriteText.innerHTML = quotes.map(quote => `
            <div class="favorite-quote">
                <span>${quote}</span>
                <button class="delete-quote" data-quote="${quote}">🗑️</button>
            </div>
        `).join('');

        // Add event listeners to delete buttons
        document.querySelectorAll('.delete-quote').forEach(button => {
            button.addEventListener('click', (e) => {
                const quoteToDelete = e.target.getAttribute('data-quote');
                deleteQuote(quoteToDelete);
            });
        });
    }

    /**
     * Loads the favorite quotes from storage and updates the display
     * @returns {void}
     */
    function loadFavoriteQuotes() {
        chrome.storage.local.get(['favoriteQuotes'], (result) => {
            if (chrome.runtime.lastError) {
                console.error('Error loading quotes:', chrome.runtime.lastError);
                return;
            }
            updateFavoriteQuotesDisplay(result.favoriteQuotes);
        });
    }

    // Event Listeners
    nextQuoteBtn.addEventListener('click', () => updateQuote(false));
    favoriteQuoteBtn.addEventListener('click', saveFavoriteQuote);
    clearFavoritesBtn.addEventListener('click', clearAllFavorites);

    // Initialize the extension
    updateQuote(true);  // Pass true to indicate this is the initial load
    loadFavoriteQuotes();
}); 