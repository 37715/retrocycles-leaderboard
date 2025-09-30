// HTML scraping URLs
const MATCHES_HTML_URL = "https://corsproxy.io/?" + encodeURIComponent("https://rankings.trontimes.tk/history?id=tst");
const MATCHES_DATA_URL = "https://corsproxy.io/?" + encodeURIComponent("https://rankings.trontimes.tk/history?id=tst");

// Unified leaderboard URL builder
const getLeaderboardURL = (timePeriod, gameMode, region) => {
    const baseUrl = "https://rankings.trontimes.tk/daterange.php";
    let url = baseUrl;
    let params = [];

    // Add time period parameter
    if (timePeriod === 'monthly') {
        params.push('datel=30%20days%20ago');
    } else if (timePeriod === 'seasonal') {
        params.push('datel=90%20days%20ago');
    }
    // For 'alltime', no datel parameter needed

    // Add region-specific game mode ID
    let gameId = gameMode;
    if (region === 'eu') {
        gameId = `${gameMode}-eu`;
    } else if (region === 'us') {
        gameId = `${gameMode}-us`;
    }

    // Add id parameter (except for combined all-time which uses no parameters)
    if (!(timePeriod === 'alltime' && region === 'combined')) {
        params.push(`id=${gameId}`);
    }

    // Build final URL
    if (params.length > 0) {
        url += '?' + params.join('&');
    }

    return "https://corsproxy.io/?" + encodeURIComponent(url);
};

let allPlayersData = [];
let allMatchesData = [];

// State management for filters
let currentTimePeriod = 'alltime';
let currentRegion = 'combined';

// Loading and request management
let currentLoadingRequest = null;
let isLoading = false;

// Cache system - Extended to 1 hour for better performance
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
const dataCache = {
    alltime: null,
    monthly: null,
    seasonal: null,
    matches: null
};

// Cache helper functions
function getCachedData(key) {
    const cached = dataCache[key];
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > CACHE_DURATION) {
        dataCache[key] = null; // Expire cache
        return null;
    }

    console.log(`Using cached ${key} data`);
    return cached.data;
}

function setCachedData(key, data) {
    dataCache[key] = {
        data: data,
        timestamp: Date.now()
    };
    console.log(`Cached ${key} data`);
}

// Loading state management
function showLoadingState() {
    isLoading = true;
    const leaderboard = document.getElementById("leaderboard");
    if (leaderboard) {
        leaderboard.innerHTML = `
            <div class="loading-container">
                <div class="loading-text">
                    loading leaderboard<span class="loading-dots">
                        <span>.</span>
                        <span>.</span>
                        <span>.</span>
                    </span>
                </div>
            </div>
        `;
    }
}

function hideLoadingState() {
    isLoading = false;
}

// Theme management
function initializeTheme() {
    // Get saved theme from localStorage, default to 'dark'
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

function saveTheme(theme) {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
}

// Initialize theme on page load
initializeTheme();

// Theme toggle
const themeToggle = document.getElementById('theme-toggle');
if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        saveTheme(newTheme);
    });
}

// Get current game mode
function getCurrentGameMode() {
    const activeNavLink = document.querySelector('.gamemode-nav-menu .nav-link.active[data-mode]');
    return activeNavLink ? activeNavLink.getAttribute('data-mode').toLowerCase() : 'tst';
}

// Game mode navigation functionality
document.querySelectorAll('.gamemode-nav-menu .nav-link[data-mode]').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.gamemode-nav-menu .nav-link').forEach(navLink => {
            navLink.classList.remove('active');
        });
        link.classList.add('active');
        const mode = link.getAttribute('data-mode').toUpperCase();
        const currentModeElement = document.getElementById('current-mode');
        if (currentModeElement) {
            currentModeElement.textContent = mode;
        }

        // Refetch data for the new game mode
        fetchPlayerData(currentTimePeriod, getCurrentGameMode(), currentRegion);
    });
});

// Advanced stats checkbox functionality
const advancedStatsCheckbox = document.getElementById('advanced-stats');
if (advancedStatsCheckbox) {
    const leaderboardWrapper = document.querySelector('.leaderboard-wrapper');
    
    // Set initial state - simple mode by default
    leaderboardWrapper.classList.add('simple-mode');
    advancedStatsCheckbox.checked = false;
    
    advancedStatsCheckbox.addEventListener('change', function() {
        leaderboardWrapper.classList.add('transitioning');
        
        setTimeout(() => {
            if (this.checked) {
                leaderboardWrapper.classList.remove('simple-mode');
            } else {
                leaderboardWrapper.classList.add('simple-mode');
            }
            renderLeaderboard();
            
            setTimeout(() => {
                leaderboardWrapper.classList.remove('transitioning');
            }, 50);
        }, 200);
    });
}

async function fetchPlayerData(timePeriod = 'alltime', gameMode = 'tst', region = 'combined') {
    console.log(`Fetching player data for ${timePeriod} ${region}...`);

    // Cancel any existing request
    if (currentLoadingRequest) {
        currentLoadingRequest.cancelled = true;
        console.log('Cancelled previous request');
    }

    // Create new request tracker
    const requestId = Date.now();
    currentLoadingRequest = { id: requestId, cancelled: false };

    // Create cache key that includes region
    const cacheKey = `${timePeriod}-${region}`;

    // Check cache first
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
        // Even cached data should check if request is still valid
        if (currentLoadingRequest.id !== requestId || currentLoadingRequest.cancelled) {
            console.log('Request cancelled before cached data could be used');
            return;
        }
        allPlayersData = cachedData;
        hideLoadingState();
        renderLeaderboard();
        return;
    }

    // Show loading state for non-cached requests
    showLoadingState();

    // Use unified HTML scraping for all time periods
    await scrapeLeaderboard(timePeriod, gameMode, region, requestId, cacheKey);
}

// Parse last active time from HTML text like "54265 15 hours ago"
function parseLastActiveTime(changeDateText) {
    if (!changeDateText) return 'Unknown';

    // Extract time part (everything after the first space and number)
    const match = changeDateText.match(/\d+\s+(.+)/);
    if (match) {
        return match[1]; // e.g., "15 hours ago"
    }

    return changeDateText || 'Recently';
}

// Unified HTML leaderboard scraping for all time periods and regions
async function scrapeLeaderboard(timePeriod, gameMode, region, requestId, cacheKey) {
    console.log(`Scraping HTML leaderboard for ${timePeriod} ${region}...`);

    const htmlUrl = getLeaderboardURL(timePeriod, gameMode, region);
    console.log(`Scraping URL: ${htmlUrl}`);

    try {
        const response = await fetch(htmlUrl);

        // Check if request was cancelled during fetch
        if (currentLoadingRequest.id !== requestId || currentLoadingRequest.cancelled) {
            console.log(`Request cancelled during ${timePeriod} ${region} HTML fetch`);
            return;
        }

        const html = await response.text();

        // Check again after HTML parsing
        if (currentLoadingRequest.id !== requestId || currentLoadingRequest.cancelled) {
            console.log(`Request cancelled after ${timePeriod} ${region} HTML parsing`);
            return;
        }

        // Parse HTML to extract player data
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Find the table rows containing player data
        const rows = doc.querySelectorAll('table tr');
        const players = [];

        console.log(`Found ${rows.length} table rows in HTML`);

        // Log the HTML structure to understand the table format
        if (rows.length > 1) {
            const headerRow = rows[0];
            const sampleRow = rows[1];
            console.log('Header row:', headerRow?.textContent);
            console.log('Sample row:', sampleRow?.textContent);
            console.log('Sample row cells:', sampleRow?.querySelectorAll('td').length);
        }

        rows.forEach((row, index) => {
            if (index === 0) return; // Skip header row

            const cells = row.querySelectorAll('td');
            if (cells.length < 3) return; // Skip invalid rows

            // Extract all available data from HTML table (based on 11 columns)
            const rank = parseInt(cells[0]?.textContent?.trim()) || index;
            const name = cells[1]?.textContent?.trim();
            const elo = parseInt(cells[2]?.textContent?.trim()) || 1500;
            const latestChange = parseInt(cells[3]?.textContent?.trim()) || 0;
            const changeDateText = cells[4]?.textContent?.trim() || '';
            // cells[5] is win/loss visual - skip
            const matches = parseInt(cells[6]?.textContent?.trim()) || 0;
            const avgPlace = parseFloat(cells[7]?.textContent?.trim()) || 2.5;
            const avgScore = parseInt(cells[8]?.textContent?.trim()) || 400;
            const highScore = parseInt(cells[9]?.textContent?.trim()) || 600;
            const kd = parseFloat(cells[10]?.textContent?.trim()) || 1.0;

            // Parse the last active time from change date text
            const lastActive = parseLastActiveTime(changeDateText);

            // Calculate win rate from visual data or estimate
            const winrate = matches > 0 ? Math.max(0.1, Math.min(0.9, 1.0 - (avgPlace - 1) / 3)) : 0.5;


            // Log what we're extracting for the first few players
            if (index <= 3) {
                console.log(`Player ${index}:`, {
                    rank, name, elo, latestChange, matches, avgPlace, avgScore, highScore, kd,
                    totalCells: cells.length,
                    allCells: Array.from(cells).map(cell => cell.textContent?.trim())
                });
            }

            if (name) {
                players.push({
                    rank: rank,
                    name: name,
                    elo: elo,
                    rating: elo,
                    numPlay: matches,
                    matches: matches,
                    winrate: winrate,
                    avgPlace: avgPlace,
                    averagePlace: avgPlace,
                    latestChange: latestChange,
                    kd: kd,
                    killDeathRatio: kd,
                    avgScore: avgScore,
                    averageScore: avgScore,
                    highScore: highScore,
                    bestScore: highScore,
                    lastActive: lastActive, // Real timestamp from HTML
                    region: ['US', 'EU', 'Combined'][index % 3] // Simulated
                });
            }
        });

        console.log(`Scraped ${players.length} players from HTML leaderboard`);

        if (players.length > 0) {
            // Final check before applying results
            if (currentLoadingRequest.id !== requestId || currentLoadingRequest.cancelled) {
                console.log(`Request cancelled before applying ${timePeriod} ${region} results`);
                return;
            }

            // Cache the scraped data with region-specific key
            setCachedData(cacheKey, players);

            // Use HTML data directly since it already contains the accurate stats
            allPlayersData = players;
            hideLoadingState();
            renderLeaderboard();
        } else {
            throw new Error('No players found in HTML table');
        }

    } catch (error) {
        if (currentLoadingRequest.id !== requestId || currentLoadingRequest.cancelled) {
            console.log('Request was cancelled, ignoring scraping error');
            return;
        }
        console.error(`Error scraping HTML leaderboard:`, error);
        hideLoadingState();
        // For now, just show empty state instead of fallback
        allPlayersData = [];
        renderLeaderboard();
    }
}

// Supplement HTML leaderboard data with accurate stats from match history
async function supplementWithMatchData(players, timePeriod) {
    console.log('Supplementing HTML data with match history stats...');

    if (allMatchesData.length === 0) {
        console.log('No match data available for supplementing');
        return players;
    }

    // Filter matches by time period
    const now = new Date();
    const cutoffDate = timePeriod === 'monthly'
        ? new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))
        : new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));

    const recentMatches = allMatchesData.filter(match => {
        const timestamp = match.date;
        const matchDate = new Date(timestamp * 1000);
        return matchDate >= cutoffDate;
    });

    console.log(`Using ${recentMatches.length} recent matches for supplementing stats`);

    // Calculate detailed stats from match history
    const playerMatchStats = {};

    recentMatches.forEach(match => {
        match.players.forEach(playerMatch => {
            const playerName = playerMatch.player;

            if (!playerMatchStats[playerName]) {
                playerMatchStats[playerName] = {
                    matches: 0,
                    totalScore: 0,
                    scores: [],
                    wins: 0,
                    places: [],
                    kills: 0,
                    deaths: 0,
                    ratingChanges: [],
                    firstRating: null,
                    lastRating: null,
                    lastActive: null
                };
            }

            const stats = playerMatchStats[playerName];
            stats.matches++;
            const score = playerMatch.score || 0;
            stats.totalScore += score;
            stats.scores.push(score);
            stats.places.push(playerMatch.place || 4);

            if (playerMatch.place === 1) stats.wins++;

            // Track K/D if available
            if (playerMatch.kd && Array.isArray(playerMatch.kd)) {
                const matchKills = playerMatch.kd.reduce((sum, k) => sum + k, 0);
                stats.kills += matchKills;
                stats.deaths += playerMatch.kd.filter(k => k > 0).length || 1;
            }

            // Track rating changes
            if (playerMatch.entryRating) {
                if (stats.firstRating === null) stats.firstRating = playerMatch.entryRating;
                stats.lastRating = playerMatch.exitRating || playerMatch.entryRating;
                const change = (playerMatch.exitRating || playerMatch.entryRating) - playerMatch.entryRating;
                stats.ratingChanges.push(change);
            }

            // Track last active (use match timestamp)
            const matchTimestamp = match.date * 1000;
            if (!stats.lastActive || matchTimestamp > stats.lastActive) {
                stats.lastActive = matchTimestamp;
            }
        });
    });

    // Enhance each player with match data
    const enhancedPlayers = players.map(player => {
        const matchStats = playerMatchStats[player.name];

        if (!matchStats) {
            // Player not found in recent matches, keep HTML data
            return {
                ...player,
                kd: 1.0,
                avgScore: 0,
                highScore: 0,
                latestChange: 0
            };
        }

        // Calculate accurate stats from match data
        const realWinrate = matchStats.matches > 0 ? matchStats.wins / matchStats.matches : 0;
        const realAvgPlace = matchStats.places.length > 0
            ? matchStats.places.reduce((sum, place) => sum + place, 0) / matchStats.places.length
            : 2.5;
        const realAvgScore = matchStats.matches > 0 ? Math.round(matchStats.totalScore / matchStats.matches) : 0;
        const realHighScore = matchStats.scores.length > 0 ? Math.max(...matchStats.scores) : 0;
        const realKd = matchStats.deaths > 0 ? (matchStats.kills / matchStats.deaths) : matchStats.kills;
        const realLatestChange = matchStats.ratingChanges.length > 0
            ? matchStats.ratingChanges[matchStats.ratingChanges.length - 1]
            : 0;

        // Calculate last active
        const daysSinceActive = matchStats.lastActive
            ? Math.floor((now.getTime() - matchStats.lastActive) / (24 * 60 * 60 * 1000))
            : 999;

        return {
            ...player,
            // Keep HTML values for: rank, name, elo, numPlay (these are correct from HTML)
            // Update with calculated values:
            winrate: realWinrate,
            avgPlace: realAvgPlace,
            averagePlace: realAvgPlace,
            kd: realKd,
            killDeathRatio: realKd,
            avgScore: realAvgScore,
            averageScore: realAvgScore,
            highScore: realHighScore,
            bestScore: realHighScore,
            latestChange: realLatestChange,
            lastActiveDays: daysSinceActive
        };
    });

    console.log(`Enhanced ${enhancedPlayers.length} players with match data`);
    return enhancedPlayers;
}

// Fallback function that uses match history to calculate monthly stats
async function fetchPlayerDataFallback(timePeriod, gameMode) {
    console.log(`Using client-side filtering for ${timePeriod}...`);

    try {
        // Ensure we have match data
        if (allMatchesData.length === 0) {
            console.log('No match data available for filtering');
            renderLeaderboard();
            return;
        }

        // Filter matches by time period
        const now = new Date();
        const cutoffDate = timePeriod === 'monthly'
            ? new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))
            : new Date(now.getTime() - (90 * 24 * 60 * 60 * 1000));

        const recentMatches = allMatchesData.filter(match => {
            // Convert Unix timestamp to milliseconds for proper date parsing
            const timestamp = match.date;
            const matchDate = new Date(timestamp * 1000); // Convert seconds to milliseconds
            return matchDate >= cutoffDate;
        });

        console.log(`Found ${recentMatches.length} matches in the last ${timePeriod === 'monthly' ? '30' : '90'} days`);
        console.log(`Cutoff date: ${cutoffDate}`);
        console.log(`Sample match dates:`, allMatchesData.slice(0, 3).map(m => ({
            date: m.date,
            parsedDate: new Date(m.date * 1000),
            isRecent: new Date(m.date * 1000) >= cutoffDate
        })));

        // Calculate player stats from recent matches
        const playerStats = {};

        recentMatches.forEach(match => {
            match.players.forEach(playerMatch => {
                const playerName = playerMatch.player;

                if (!playerStats[playerName]) {
                    playerStats[playerName] = {
                        name: playerName,
                        matches: 0,
                        totalScore: 0,
                        wins: 0,
                        places: [],
                        kills: 0,
                        deaths: 0,
                        ratingChanges: [],
                        firstRating: null,
                        lastRating: null
                    };
                }

                const stats = playerStats[playerName];
                stats.matches++;
                stats.totalScore += playerMatch.score || 0;
                stats.places.push(playerMatch.place || 4);

                if (playerMatch.place === 1) stats.wins++;

                // Track K/D if available
                if (playerMatch.kd && Array.isArray(playerMatch.kd)) {
                    stats.kills += playerMatch.kd.reduce((sum, k) => sum + k, 0);
                    stats.deaths += playerMatch.kd.length; // Simplified
                }

                // Track rating changes
                if (playerMatch.entryRating) {
                    if (stats.firstRating === null) stats.firstRating = playerMatch.entryRating;
                    stats.lastRating = playerMatch.exitRating || playerMatch.entryRating;
                }
            });
        });

        // Convert to array and calculate derived stats
        const filteredPlayers = Object.values(playerStats).map(player => {
            const avgPlace = player.places.length > 0
                ? player.places.reduce((sum, place) => sum + place, 0) / player.places.length
                : 2.5;

            const winrate = player.matches > 0 ? player.wins / player.matches : 0;
            const avgScore = player.matches > 0 ? Math.round(player.totalScore / player.matches) : 0;
            const highScore = Math.max(...(recentMatches.flatMap(m =>
                m.players.filter(p => p.player === player.name).map(p => p.score || 0)
            )), 0);

            const kd = player.deaths > 0 ? player.kills / player.deaths : player.kills;
            const ratingChange = player.firstRating && player.lastRating
                ? player.lastRating - player.firstRating
                : 0;

            return {
                ...player,
                elo: player.lastRating || 1500,
                rating: player.lastRating || 1500,
                winrate: winrate,
                avgPlace: avgPlace,
                averagePlace: avgPlace,
                kd: kd,
                killDeathRatio: kd,
                avgScore: avgScore,
                averageScore: avgScore,
                highScore: highScore,
                bestScore: highScore,
                numPlay: player.matches,
                latestChange: ratingChange,
                region: ['US', 'EU', 'Combined'][Math.floor(Math.random() * 3)] // Still simulated
            };
        });

        // Sort by rating/elo descending
        filteredPlayers.sort((a, b) => (b.elo || 1500) - (a.elo || 1500));

        // Only show players with at least 1 match in the time period
        const activeFiltered = filteredPlayers.filter(player => player.matches > 0);

        console.log(`Generated stats for ${activeFiltered.length} active players in ${timePeriod}`);

        allPlayersData = activeFiltered;
        renderLeaderboard();

    } catch (fallbackError) {
        console.error('Fallback filtering failed:', fallbackError);
        renderLeaderboard();
    }
}

async function fetchMatchesData() {
    console.log("Scraping real match data from HTML...");

    try {
        console.log('Fetching from URL:', MATCHES_DATA_URL);
        const response = await fetch(MATCHES_DATA_URL);
        console.log('Response status:', response.status);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const html = await response.text();
        console.log('HTML length:', html.length);

        // Parse HTML to extract match data from tables
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const matches = [];

        // Find all match containers
        const matchContainers = doc.querySelectorAll('div.row#match-name, div.row[id*="match"]');
        console.log(`Found ${matchContainers.length} potential match containers`);

        // If no specific containers, look for tables with match data
        const tables = doc.querySelectorAll('table.table-hover, table.table');
        console.log(`Found ${tables.length} tables to parse`);

        tables.forEach((table, tableIndex) => {
            console.log(`Processing table ${tableIndex + 1}...`);

            const caption = table.querySelector('caption');
            const matchName = caption ? `Match ${tableIndex + 1}` : `Match ${tableIndex + 1}`;

            const rows = table.querySelectorAll('tbody tr');
            console.log(`Table ${tableIndex + 1} has ${rows.length} player rows`);

            if (rows.length === 0) {
                console.log(`Skipping table ${tableIndex + 1} - no data rows`);
                return;
            }

            const players = [];

            rows.forEach((row, rowIndex) => {
                const cells = row.querySelectorAll('td, th');

                if (cells.length >= 5) {
                    const team = cells[0]?.textContent?.trim() || '';
                    const player = cells[1]?.textContent?.trim() || '';
                    const score = parseInt(cells[2]?.textContent?.trim()) || 0;
                    const place = parseInt(cells[4]?.textContent?.trim()) || 4;

                    console.log(`Row ${rowIndex}: team="${team}", player="${player}", score=${score}, place=${place}`);

                    if (player && team) {
                        players.push({
                            team: team,
                            player: player,
                            score: score,
                            place: place
                        });
                    }
                }
            });

            if (players.length > 0) {
                console.log(`Added match with ${players.length} players`);
                matches.push({
                    name: matchName,
                    date: Date.now() / 1000 - (tableIndex * 3600), // Approximate timestamps
                    players: players
                });
            }
        });

        console.log(`Successfully scraped ${matches.length} real matches from HTML`);

        if (matches.length > 0) {
            // Cache and use the real data
            setCachedData('matches', matches);
            allMatchesData = matches;
            renderRecentMatches();
        } else {
            // No sample data fallback - just show empty state
            console.log('No match data found in HTML tables');
            allMatchesData = [];
            renderRecentMatches();
        }

    } catch (error) {
        console.error('Error scraping match data:', error);
        // No fallback - show empty state
        allMatchesData = [];
        renderRecentMatches();
    }
}

// Helper function to parse individual match tables
function parseMatchTable(table, matchIndex) {
    try {
        const rows = table.querySelectorAll('tr');
        const players = [];

        console.log(`Parsing match table ${matchIndex} with ${rows.length} rows`);

        // Skip header row, parse data rows
        for (let i = 1; i < rows.length; i++) {
            const cells = rows[i].querySelectorAll('td, th');
            console.log(`Row ${i} has ${cells.length} cells:`, Array.from(cells).map(c => c.textContent?.trim()));

            if (cells.length >= 4) {
                // Try different column arrangements - inspect actual HTML structure
                const team = cells[0]?.textContent?.trim() || '';
                const player = cells[1]?.textContent?.trim() || '';
                const score = parseInt(cells[2]?.textContent?.trim()) || 0;

                // Place might be in different column
                let place = 4;
                for (let j = 3; j < cells.length; j++) {
                    const cellValue = parseInt(cells[j]?.textContent?.trim());
                    if (cellValue >= 1 && cellValue <= 4) {
                        place = cellValue;
                        break;
                    }
                }

                console.log(`Extracted: team="${team}", player="${player}", score=${score}, place=${place}`);

                if (player && team && !team.toLowerCase().includes('team') === false) {
                    // Ensure team names are in correct format
                    let teamName = team;
                    if (!team.startsWith('Team ')) {
                        teamName = `Team ${team}`;
                    }

                    players.push({
                        team: teamName,
                        player: player,
                        score: score,
                        place: place
                    });
                }
            }
        }

        console.log(`Parsed ${players.length} players from match ${matchIndex}`);

        if (players.length > 0) {
            return {
                name: `Match ${matchIndex + 1}`,
                date: Date.now() / 1000 - (matchIndex * 3600), // Approximate timestamps
                players: players
            };
        }

    } catch (error) {
        console.error('Error parsing match table:', error);
    }

    return null;
}

function getRank(elo) {
    if (elo < 1800) return { name: 'bronze', icon: 'public/images/ranks/bronze.svg', class: 'rank-bronze' };
    if (elo < 1900) return { name: 'silver', icon: 'public/images/ranks/silver.svg', class: 'rank-silver' };
    if (elo < 2000) return { name: 'gold', icon: 'public/images/ranks/gold.svg', class: 'rank-gold' };
    if (elo < 2100) return { name: 'platinum', icon: 'public/images/ranks/platinum.svg', class: 'rank-platinum' };
    if (elo < 2200) return { name: 'diamond', icon: 'public/images/ranks/diamond-amethyst-9.svg', class: 'rank-diamond' };
    if (elo < 2300) return { name: 'master', icon: 'public/images/ranks/master.svg', class: 'rank-master' };
    return { name: 'grandmaster', icon: 'public/images/ranks/grandmaster.svg', class: 'rank-grandmaster' };
}


// Filter functions - Time period filtering now handled by API
function filterPlayersByTimePeriod(players, timePeriod) {
    // Time period filtering is now handled by the API
    // This function is kept for compatibility but doesn't filter anymore
    return players;
}

// Region filtering now handled by server-side URLs, no client-side filtering needed
function filterPlayersByRegion(players, region) {
    // All filtering now done server-side via different URLs
    return players;
}

function renderLeaderboard() {
    console.log(`Rendering ${allPlayersData.length} total players`);

    const leaderboard = document.getElementById("leaderboard");
    if (!leaderboard) return;

    leaderboard.innerHTML = "";

    if (allPlayersData.length === 0) {
        leaderboard.innerHTML = `
            <div class="loading-container">
                <div class="loading-text">
                    loading leaderboard<span class="loading-dots">
                        <span>.</span>
                        <span>.</span>
                        <span>.</span>
                    </span>
                </div>
            </div>
        `;
        return;
    }

    // Apply filters
    let filteredPlayers = filterPlayersByTimePeriod(allPlayersData, currentTimePeriod);
    filteredPlayers = filterPlayersByRegion(filteredPlayers, currentRegion);

    console.log(`Time period filter "${currentTimePeriod}": ${filteredPlayers.length} players`);
    console.log(`Region filter "${currentRegion}": ${filteredPlayers.length} players`);

    // Add rank numbers
    filteredPlayers = filteredPlayers.map((player, index) => ({
        ...player,
        rank: index + 1
    }));

    console.log(`Displaying ${filteredPlayers.length} filtered players`);

    filteredPlayers.forEach((player, index) => {
        const entry = document.createElement("div");
        entry.className = "leaderboard-entry";
        
        // Get rank info
        const rank = getRank(player.elo || 1500);
        
        // Safe number conversions using actual data structure
        const winrate = Math.round((parseFloat(player.winrate || player.winRate) || 0.5) * 100);
        const avgPlace = parseFloat(player.avgPlace || player.averagePlace || 1.5).toFixed(1);
        const kd = parseFloat(player.kd || player.killDeathRatio || 1.0).toFixed(2);
        const avgScore = parseInt(player.avgScore || player.averageScore || 400);
        const highScore = parseInt(player.highScore || player.bestScore || 600);
        
        // Calculate position percentages based on player stats
        // Better players (lower avg place) get more green (1st place)
        const avgPlaceNum = parseFloat(player.avgPlace || player.averagePlace || 1.8);
        const firstRate = Math.max(0, Math.min(40, 45 - (avgPlaceNum - 1) * 15));
        const secondRate = Math.max(15, Math.min(35, 30 - (avgPlaceNum - 1.5) * 10));
        const thirdRate = Math.max(15, Math.min(35, 25 + (avgPlaceNum - 1.5) * 5));
        const fourthRate = Math.max(10, 100 - firstRate - secondRate - thirdRate);
        
        entry.innerHTML = `
            <div class="rank-position">${player.rank}</div>
            <div class="player">
                <span class="username">${player.name || player.playerName}</span>
            </div>
            <div class="rating">${player.elo || player.rating}</div>
            <div class="change ${player.latestChange >= 0 ? 'positive' : 'negative'}">
                ${player.latestChange >= 0 ? '+' : ''}${player.latestChange || 0}
            </div>
            <div class="last-active">${player.lastActive || 'Recently'}</div>
            <div class="matches">
                <div class="winrate-bar">
                    <div class="winrate-fill" style="width: 100%; background: linear-gradient(90deg, #10b981 ${firstRate}%, #f59e0b ${firstRate + secondRate}%, #fb923c ${firstRate + secondRate + thirdRate}%, #ef4444 100%);"></div>
                </div>
                <span class="matches-count">${player.numPlay || player.matches}</span>
            </div>
            <div class="percentage">${winrate}%</div>
            <div class="stat avg-place">${avgPlace}</div>
            <div class="percentage alive-percent">${winrate}%</div>
            <div class="score">${avgScore}</div>
            <div class="score high-score">${highScore}</div>
            <div class="kd">${kd}</div>
            <div class="tier ${rank.class}">
                <img class="rank-icon" src="${rank.icon}" alt="${rank.name}" />
                <span class="rank-name">${rank.name}</span>
            </div>
        `;
        
        leaderboard.appendChild(entry);
    });
}

// Control buttons functionality
document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentTimePeriod = btn.getAttribute('data-period');
        console.log(`Switched to time period: ${currentTimePeriod}`);

        // Refetch data for the new time period
        fetchPlayerData(currentTimePeriod, getCurrentGameMode(), currentRegion);
    });
});

document.querySelectorAll('.region-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.region-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentRegion = btn.getAttribute('data-region');
        console.log(`Switched to region: ${currentRegion}`);

        // Refetch data for the new region
        fetchPlayerData(currentTimePeriod, getCurrentGameMode(), currentRegion);
    });
});


// Sample data for score tabs
const scoreTabData = {
    scores: [
        { player: 'ellis', value: 856, rank: 1 },
        { player: 'jamie@lt', value: 812, rank: 2 },
        { player: 'Johnny', value: 789, rank: 3 },
        { player: 'yourstar@forums', value: 743, rank: 4 },
        { player: 'jfacas', value: 698, rank: 5 }
    ],
    kd: [
        { player: 'ellis', value: 2.84, rank: 1 },
        { player: 'jamie@lt', value: 2.67, rank: 2 },
        { player: 'Johnny', value: 2.43, rank: 3 },
        { player: 'yourstar@forums', value: 2.19, rank: 4 },
        { player: 'jfacas', value: 1.98, rank: 5 }
    ],
    ratings: [
        { player: 'ellis', value: 2156, rank: 1 },
        { player: 'jamie@lt', value: 2098, rank: 2 },
        { player: 'Johnny', value: 2034, rank: 3 },
        { player: 'yourstar@forums', value: 1987, rank: 4 },
        { player: 'jfacas', value: 1943, rank: 5 }
    ],
    winstreaks: [
        { player: 'ellis', value: 12, rank: 1 },
        { player: 'jamie@lt', value: 8, rank: 2 },
        { player: 'Johnny', value: 7, rank: 3 },
        { player: 'yourstar@forums', value: 5, rank: 4 },
        { player: 'jfacas', value: 4, rank: 5 }
    ],
    lowest: [
        { player: 'ellis', value: 23, rank: 1 },
        { player: 'jamie@lt', value: 28, rank: 2 },
        { player: 'Johnny', value: 31, rank: 3 },
        { player: 'yourstar@forums', value: 35, rank: 4 },
        { player: 'jfacas', value: 38, rank: 5 }
    ],
    suicides: [
        { player: 'ellis', value: 1, rank: 1 },
        { player: 'jamie@lt', value: 3, rank: 2 },
        { player: 'Johnny', value: 5, rank: 3 },
        { player: 'yourstar@forums', value: 8, rank: 4 },
        { player: 'jfacas', value: 12, rank: 5 }
    ],
    holes: [
        { player: 'ellis', value: 234, rank: 1 },
        { player: 'jamie@lt', value: 198, rank: 2 },
        { player: 'Johnny', value: 167, rank: 3 },
        { player: 'yourstar@forums', value: 145, rank: 4 },
        { player: 'jfacas', value: 123, rank: 5 }
    ],
    eradicated: [
        { player: 'ellis', value: 89, rank: 1 },
        { player: 'jamie@lt', value: 76, rank: 2 },
        { player: 'Johnny', value: 65, rank: 3 },
        { player: 'yourstar@forums', value: 54, rank: 4 },
        { player: 'jfacas', value: 43, rank: 5 }
    ],
    addicts: [
        { player: 'ellis', value: 156, rank: 1 },
        { player: 'jamie@lt', value: 134, rank: 2 },
        { player: 'Johnny', value: 123, rank: 3 },
        { player: 'yourstar@forums', value: 109, rank: 4 },
        { player: 'jfacas', value: 98, rank: 5 }
    ]
};

// Score tab functionality
document.querySelectorAll('.score-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.score-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        const tabType = tab.getAttribute('data-tab');
        document.getElementById('highest-scores-title').textContent = `highest ${tabType}`;

        renderScoreTabContent(tabType);
    });
});

function renderScoreTabContent(tabType) {
    const scoresContainer = document.getElementById('highest-scores');
    if (!scoresContainer) return;

    const data = scoreTabData[tabType] || [];

    if (data.length === 0) {
        scoresContainer.innerHTML = '<div style="text-align: center; padding: 1rem; color: var(--text-secondary);">No data available</div>';
        return;
    }

    scoresContainer.innerHTML = data.map(item => {
        let displayValue = item.value;

        // Format values based on category
        if (tabType === 'kd') {
            displayValue = item.value.toFixed(2);
        } else if (tabType === 'lowest') {
            displayValue = item.value;
        } else if (tabType === 'ratings') {
            displayValue = item.value.toLocaleString();
        } else if (tabType === 'winstreaks' || tabType === 'suicides' || tabType === 'holes' || tabType === 'eradicated' || tabType === 'addicts') {
            displayValue = item.value.toLocaleString();
        }

        return `
            <div class="score-item">
                <span class="score-rank">#${item.rank}</span>
                <span class="score-player">${item.player}</span>
                <span class="score-value">${displayValue}</span>
            </div>
        `;
    }).join('');
}

function renderRecentMatches() {
    const recentMatchesContainer = document.getElementById('recent-matches');
    if (!recentMatchesContainer) return;

    console.log(`Rendering recent matches: ${allMatchesData.length} matches available`);

    // No sample data - show real data or empty state
    if (allMatchesData.length === 0) {
        console.log('No match data available');
        recentMatchesContainer.innerHTML = '<div style="text-align: center; padding: 1rem; color: var(--text-secondary);">No recent matches available</div>';
        return;
    }

    // Show recent matches from all data
    const recentMatches = allMatchesData.slice(0, 10);

    console.log(`Displaying ${recentMatches.length} recent matches`);

    if (recentMatches.length === 0) {
        recentMatchesContainer.innerHTML = '<div style="text-align: center; padding: 1rem; color: var(--text-secondary);">No recent matches available</div>';
        return;
    }

    recentMatchesContainer.innerHTML = recentMatches.map(match => {
        console.log('Processing match:', {
            matchName: match.name,
            players: match.players,
            fullMatchData: match
        });

        // Get all unique teams from players
        const teamNames = [...new Set(match.players.map(p => p.team))];
        console.log('Found teams:', teamNames);

        // Enhanced team emoji mapping with more variations
        function getTeamEmoji(teamName) {
            const name = teamName.toLowerCase();
            if (name.includes('purple')) return '🟣';
            if (name.includes('ugly') || name.includes('turquoise') || name.includes('teal')) return '🟢';
            if (name.includes('gold') || name.includes('yellow')) return '🟡';
            if (name.includes('orange') || name.includes('red')) return '🟠';

            // Fallback: assign colors by hash for consistent team colors
            const colors = ['🟣', '🟢', '🟡', '🟠'];
            const hash = teamName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            return colors[hash % colors.length];
        }

        const teams = teamNames.map(teamName => {
            const teamPlayers = match.players.filter(p => p.team === teamName);
            const teamScore = teamPlayers.reduce((sum, p) => sum + (p.score || 0), 0);
            const teamPlace = Math.min(...teamPlayers.map(p => p.place || 4));

            // Award winning bonus: if team place is 1, add 2000 points
            const bonusScore = teamPlace === 1 ? 2000 : 0;
            const finalScore = teamScore + bonusScore;

            console.log(`Team ${teamName}: ${teamPlayers.length} players, base score=${teamScore}, place=${teamPlace}, final score=${finalScore}`);

            return {
                name: teamName,
                emoji: getTeamEmoji(teamName),
                players: teamPlayers,
                playerNames: teamPlayers.map(p => p.player).join(', '),
                score: finalScore,
                baseScore: teamScore,
                place: teamPlace,
                playerCount: teamPlayers.length
            };
        });

        // Sort teams by place (winners first), then by score
        teams.sort((a, b) => {
            if (a.place !== b.place) return a.place - b.place;
            return b.score - a.score;
        });

        const time = formatMatchTime(match.date);

        return `
            <div class="match-item">
                <div class="match-info">
                    <div class="match-result">
                        ${teams.map((team, index) => `
                            <div class="team-result ${team.place === 1 ? 'winner' : ''}" data-team="${team.name.toLowerCase()}">
                                <span class="team-emoji">${team.emoji}</span>
                                <span class="team-players">${team.playerNames}</span>
                                <span class="team-score">${team.score.toLocaleString()}</span>
                                ${team.place === 1 ? '<span class="win-indicator">👑</span>' : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="match-time">${time}</div>
            </div>
        `;
    }).join('');
}

// Create sample matches with real player names and team structure
function createSampleMatches() {
    const teams = ['Ugly', 'Orange', 'Gold', 'Purple'];

    // Use real player names from the leaderboard if available
    const getRealPlayerNames = () => {
        if (allPlayersData && allPlayersData.length >= 8) {
            // Take top 8 players and distribute them across teams
            return allPlayersData.slice(0, 8).map(p => p.name);
        }
        // Fallback to sample names
        return ['alice', 'bob', 'charlie', 'diana', 'eve', 'frank', 'grace', 'henry'];
    };

    const playerNames = getRealPlayerNames();
    const samplePlayers = {
        'Ugly': [playerNames[0], playerNames[1]],
        'Orange': [playerNames[2], playerNames[3]],
        'Gold': [playerNames[4], playerNames[5]],
        'Purple': [playerNames[6], playerNames[7]]
    };

    const matches = [];

    for (let i = 0; i < 5; i++) {
        const matchPlayers = [];
        const shuffledTeams = [...teams].sort(() => Math.random() - 0.5);

        shuffledTeams.forEach((team, teamIndex) => {
            const teamPlace = teamIndex + 1; // Team placement 1st, 2nd, 3rd, 4th
            const players = samplePlayers[team];

            players.forEach(playerName => {
                // More realistic base scores (400-900)
                const baseScore = Math.floor(Math.random() * 500) + 400;
                matchPlayers.push({
                    team: team,
                    player: playerName,
                    score: baseScore,
                    place: teamPlace
                });
            });
        });

        matches.push({
            name: `Match ${i + 1}`,
            date: Date.now() / 1000 - (i * 3600), // Hours ago
            players: matchPlayers
        });
    }

    console.log('Created sample matches with real player names:', matches);
    return matches;
}

function formatMatchTime(timestamp) {
    try {
        // Handle both integer and decimal timestamps
        const timestampInt = Math.floor(timestamp);
        const date = new Date(timestampInt * 1000); // Convert Unix timestamp to date
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffMinutes = Math.ceil(diffTime / (1000 * 60));
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMinutes < 60) {
            return `${diffMinutes} minutes ago`;
        } else if (diffHours < 24) {
            return `${diffHours} hours ago`;
        } else {
            return `${diffDays} days ago`;
        }
    } catch (error) {
        console.error('Error formatting time:', error, timestamp);
        return 'Recently';
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    // Check if we're on the leaderboard page
    if (document.getElementById('leaderboard')) {
        // Show loading spinner immediately for both sections
        renderLeaderboard();
        renderRecentMatches(); // Show loading for matches too
        renderScoreTabContent('scores'); // Show initial scores content

        // Load both player data and matches in parallel for better performance
        const loadPromises = [
            fetchPlayerData(currentTimePeriod, getCurrentGameMode(), currentRegion),
            fetchMatchesData()
        ];

        // Wait for both to complete (or fail) without blocking each other
        await Promise.allSettled(loadPromises);
    }

    // Check if we're on the mazing page
    if (document.getElementById('maze-grid')) {
        initializeMazingGallery();
    }
});

// =====================================
// MAZING GALLERY FUNCTIONALITY
// =====================================

let currentDifficulty = 'basic';
let mazeData = {};

// Difficulty configurations
const difficultyConfig = {
    basic: {
        title: 'Basic Mazes',
        description: 'you must learn these! lay the foundations. very important.',
        complexity: 'starter'
    },
    easy: {
        title: 'Easy Mazes',
        description: 'straightforward challenges with clear solutions',
        complexity: 'simple'
    },
    intermediate: {
        title: 'Intermediate Mazes',
        description: 'keep going! you\'re starting to look kinda cool...',
        complexity: 'moderate'
    },
    medium: {
        title: 'Medium Mazes',
        description: 'balanced difficulty requiring strategy',
        complexity: 'moderate'
    },
    advanced: {
        title: 'Advanced Mazes',
        description: 'you are starting to show off now...',
        complexity: 'complex'
    },
    hard: {
        title: 'Hard Mazes',
        description: 'challenging puzzles with dead ends',
        complexity: 'complex'
    },
    expert: {
        title: 'Expert Mazes',
        description: 'there\'s more to life than tron you know...',
        complexity: 'extreme'
    },
    infinite: {
        title: 'Infinite Mazes',
        description: 'these vary wildly in difficulty, but they are all good fun and good practice.',
        complexity: 'extreme'
    },
    nightmare: {
        title: 'Nightmare Mazes',
        description: 'the ultimate test of maze solving skills',
        complexity: 'insane'
    },
    demon: {
        title: 'Demon Mazes',
        description: 'congrats... you have mastered mazing, now go touch some grass.',
        complexity: 'demonic'
    }
};

// Custom maze titles
const customMazeTitles = {
    basic: [
        'captain hook',
        'mrs hook',
        'auntie hookies',
        'the bucaneer',
        'the hook twins'
    ],
    intermediate: [
        'parox',
        'the elderflower',
        'uncle hook',
        'the crusader',
        'the bandit',
        'step-hookster'
    ],
    advanced: [
        'mrs hook is pregnant',
        'atonement',
        'captain hook\'s secret lover',
        'sleepyhead',
        'velvet',
        'hibiscus',
        'little doov',
        'the threesome',
        'amnesia'
    ],
    expert: [
        'paroxysm',
        'paroxysm\'s sister',
        'paroxysm\'s brother',
        'evil twins',
        'apache',
        'ataraxia',
        'the mockingbird',
        'TIGHT TIGHT TIGHT'
    ],
    demon: [
        'the summit',
        'cthulu',
        'labrynth',
        'big doov',
        'big paroxysm',
        'big BIG paroxysm',
        'frantic frank',
        'quadraparox',
        'how to feel alive'
    ],
    infinite: [
        'simple steve',
        'rainy boy',
        'jack the ripper',
        'eternal green',
        'daddy doov'
    ]
};

// Generate maze data from file structure
function generateMazeDataForDifficulty(difficulty, fileCount) {
    const config = difficultyConfig[difficulty];
    const customTitles = customMazeTitles[difficulty];
    const mazes = [];

    for (let i = 1; i <= fileCount; i++) {
        const customTitle = customTitles && customTitles[i - 1] ? customTitles[i - 1] : `${config.title.toLowerCase()} ${i}`;

        mazes.push({
            id: `${difficulty}_${String(i).padStart(3, '0')}`,
            title: customTitle,
            description: config.description,
            videoUrl: `public/assets/mazes/${difficulty}/${i}.webm`,
            complexity: config.complexity,
            difficulty: difficulty
        });
    }

    return mazes;
}

async function initializeMazingGallery() {
    // Load actual maze data from file system
    await loadMazeDataFromFiles();

    // Set up difficulty navigation
    setupDifficultyNavigation();

    // Load initial difficulty
    loadMazesForDifficulty(currentDifficulty);

    // Set up video modal
    setupVideoModal();
}

// Load maze data by detecting actual files
async function loadMazeDataFromFiles() {
    // Only include difficulties that have actual maze files
    const difficultiesWithFiles = {
        basic: 5,        // 5 maze files
        intermediate: 6, // 6 maze files
        advanced: 9,     // 9 maze files
        expert: 8,       // 8 maze files
        infinite: 5,     // 5 maze files
        demon: 9         // 9 maze files
    };

    // Generate maze data only for difficulties with files
    for (const [difficulty, count] of Object.entries(difficultiesWithFiles)) {
        mazeData[difficulty] = generateMazeDataForDifficulty(difficulty, count);
    }

    console.log('Loaded maze data:', mazeData);
}

function setupDifficultyNavigation() {
    const difficultyLinks = document.querySelectorAll('.difficulty-nav-menu .nav-link[data-difficulty]');

    difficultyLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            // Update active state
            document.querySelectorAll('.difficulty-nav-menu .nav-link').forEach(navLink => {
                navLink.classList.remove('active');
            });
            link.classList.add('active');

            // Get selected difficulty
            const difficulty = link.getAttribute('data-difficulty');
            currentDifficulty = difficulty;

            // Load mazes for selected difficulty
            loadMazesForDifficulty(difficulty);
        });
    });
}

function loadMazesForDifficulty(difficulty) {
    const galleryLoading = document.getElementById('gallery-loading');
    const mazeGrid = document.getElementById('maze-grid');
    const galleryEmpty = document.getElementById('gallery-empty');
    const difficultyTitle = document.getElementById('current-difficulty-title');
    const mazeCount = document.getElementById('maze-count');
    const difficultyIndicator = document.getElementById('difficulty-indicator');

    // Show loading state
    galleryLoading.style.display = 'flex';
    mazeGrid.style.display = 'none';
    galleryEmpty.style.display = 'none';

    // Update title and indicators
    if (difficultyTitle) {
        difficultyTitle.textContent = `${difficulty} mazes`;
    }
    if (difficultyIndicator) {
        difficultyIndicator.textContent = difficulty;
    }

    // Update gallery subtitle with difficulty description
    const gallerySubtitle = document.querySelector('.gallery-subtitle');
    if (gallerySubtitle && difficultyConfig[difficulty]) {
        gallerySubtitle.textContent = difficultyConfig[difficulty].description;
    }

    // Simulate loading delay (remove in production)
    setTimeout(() => {
        const mazes = mazeData[difficulty] || [];

        if (mazes.length === 0) {
            // Show empty state
            galleryLoading.style.display = 'none';
            galleryEmpty.style.display = 'block';
            mazeGrid.style.display = 'none';
            if (mazeCount) {
                mazeCount.textContent = '0 mazes';
            }
        } else {
            // Render mazes
            renderMazeGrid(mazes);
            galleryLoading.style.display = 'none';
            galleryEmpty.style.display = 'none';
            mazeGrid.style.display = 'grid';
            if (mazeCount) {
                mazeCount.textContent = `${mazes.length} maze${mazes.length !== 1 ? 's' : ''}`;
            }
        }
    }, 800); // Simulated loading time
}

function renderMazeGrid(mazes) {
    const mazeGrid = document.getElementById('maze-grid');
    if (!mazeGrid) return;

    mazeGrid.innerHTML = '';

    mazes.forEach(maze => {
        const mazeCard = createMazeCard(maze);
        mazeGrid.appendChild(mazeCard);
    });
}

function createMazeCard(maze) {
    const card = document.createElement('div');
    card.className = 'maze-card';
    card.setAttribute('data-maze-id', maze.id);

    card.innerHTML = `
        <div class="maze-video-container">
            <video class="maze-video" muted loop preload="metadata">
                <source src="${maze.videoUrl}" type="video/webm">
                Your browser does not support the video tag.
            </video>
            <div class="maze-video-overlay">
                <div class="play-button">▶</div>
            </div>
        </div>
        <div class="maze-info">
            <h3 class="maze-title">${maze.title}</h3>
            <div class="maze-meta">
                <span class="maze-complexity">${maze.complexity}</span>
                <span class="maze-id">#${maze.id}</span>
            </div>
        </div>
    `;

    // Add event listeners
    const video = card.querySelector('.maze-video');
    const playButton = card.querySelector('.play-button');

    // Auto play on hover
    card.addEventListener('mouseenter', () => {
        video.play().catch(e => console.log('Auto-play prevented:', e));
    });

    card.addEventListener('mouseleave', () => {
        video.pause();
        video.currentTime = 0;
    });

    // Full screen on click
    playButton.addEventListener('click', (e) => {
        e.stopPropagation();
        openVideoModal(maze);
    });

    // Full screen on card click
    card.addEventListener('click', () => {
        openVideoModal(maze);
    });

    return card;
}

function setupVideoModal() {
    // Create modal if it doesn't exist
    let modal = document.getElementById('video-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'video-modal';
        modal.className = 'video-modal';
        modal.innerHTML = `
            <div class="video-modal-content">
                <button class="modal-close">×</button>
                <video class="modal-video" controls>
                    <source src="" type="video/webm">
                    Your browser does not support the video tag.
                </video>
            </div>
        `;
        document.body.appendChild(modal);

        // Close modal events
        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.addEventListener('click', closeVideoModal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeVideoModal();
            }
        });

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('active')) {
                closeVideoModal();
            }
        });
    }
}

function openVideoModal(maze) {
    const modal = document.getElementById('video-modal');
    const video = modal.querySelector('.modal-video source');
    const videoElement = modal.querySelector('.modal-video');

    video.src = maze.videoUrl;
    videoElement.load();
    modal.classList.add('active');

    // Prevent body scrolling
    document.body.style.overflow = 'hidden';
}

function closeVideoModal() {
    const modal = document.getElementById('video-modal');
    const video = modal.querySelector('.modal-video');

    modal.classList.remove('active');
    video.pause();
    video.currentTime = 0;

    // Restore body scrolling
    document.body.style.overflow = '';
}

// Function to validate maze files exist
async function validateMazeFile(videoUrl) {
    try {
        const response = await fetch(videoUrl, { method: 'HEAD' });
        return response.ok;
    } catch (error) {
        console.warn(`Could not validate maze file: ${videoUrl}`, error);
        return false;
    }
}