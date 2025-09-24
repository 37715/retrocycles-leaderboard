// Unified HTML scraping API URLs
const MATCHES_API_URL = "https://corsproxy.io/?" + encodeURIComponent("https://rankings.trontimes.tk/api.php?id=tst&type=history");

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

// Theme toggle
const themeToggle = document.getElementById('theme-toggle');
if (themeToggle) {
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', newTheme);
    });
}

// Get current game mode
function getCurrentGameMode() {
    const activeNavLink = document.querySelector('.nav-link.active');
    return activeNavLink ? activeNavLink.getAttribute('data-mode').toLowerCase() : 'tst';
}

// Navigation functionality
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        document.querySelectorAll('.nav-link').forEach(navLink => {
            navLink.classList.remove('active');
        });
        link.classList.add('active');
        const mode = link.getAttribute('data-mode').toUpperCase();
        document.getElementById('current-mode').textContent = mode;

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
    console.log("Fetching matches data...");

    // Check cache first
    const cachedMatches = getCachedData('matches');
    if (cachedMatches) {
        allMatchesData = cachedMatches;
        renderRecentMatches();
        return;
    }

    try {
        const response = await fetch(MATCHES_API_URL);
        const data = await response.json();
        console.log("Matches Data:", data);

        const processedMatches = Array.isArray(data) ? data : (data.matches || data || []);

        // Cache the matches data
        setCachedData('matches', processedMatches);

        allMatchesData = processedMatches;
        console.log(`Loaded ${allMatchesData.length} matches`);

        renderRecentMatches();

    } catch (error) {
        console.error('Error fetching matches data:', error);
        // Show error state for matches
        const recentMatchesContainer = document.getElementById('recent-matches');
        if (recentMatchesContainer) {
            recentMatchesContainer.innerHTML = `
                <div class="loading-container">
                    <div class="loading-text" style="color: var(--text-secondary);">
                        Failed to load matches. Check connection.
                    </div>
                </div>
            `;
        }
    }
}

function getRank(elo) {
    if (elo < 1800) return { name: 'bronze', icon: 'bronze.svg', class: 'rank-bronze' };
    if (elo < 1900) return { name: 'silver', icon: 'silver.svg', class: 'rank-silver' };
    if (elo < 2000) return { name: 'gold', icon: 'gold.svg', class: 'rank-gold' };
    if (elo < 2100) return { name: 'platinum', icon: 'platinum.svg', class: 'rank-platinum' };
    if (elo < 2200) return { name: 'diamond', icon: 'diamond-amethyst-9.svg', class: 'rank-diamond' };
    if (elo < 2300) return { name: 'master', icon: 'master.svg', class: 'rank-master' };
    return { name: 'grandmaster', icon: 'grandmaster.svg', class: 'rank-grandmaster' };
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

    if (allMatchesData.length === 0) {
        recentMatchesContainer.innerHTML = `
            <div class="loading-container">
                <div class="loading-text">
                    loading matches<span class="loading-dots">
                        <span>.</span>
                        <span>.</span>
                        <span>.</span>
                    </span>
                </div>
            </div>
        `;
        return;
    }

    // Add legend at the top
    const legend = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.5rem;">
            <span style="font-size: 0.75rem; color: var(--text-tertiary);">Recent matches</span>
            <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.7rem; color: var(--text-tertiary);">
                <span>🟣 Purple | 🟦 Ugly | 🟡 Gold | 🟠 Orange</span>
            </div>
        </div>
    `;

        // Show recent matches from all data
        const recentMatches = allMatchesData.slice(0, 10);

        console.log(`Displaying ${recentMatches.length} recent matches`);

    if (recentMatches.length === 0) {
        recentMatchesContainer.innerHTML = '<div style="text-align: center; padding: 1rem; color: var(--text-secondary);">No recent matches available</div>';
        return;
    }

    recentMatchesContainer.innerHTML = legend + recentMatches.map(match => {
        console.log('Processing match:', {
            matchName: match.name,
            players: match.players
        });

        // Show all teams and their players
        const team1 = match.players.filter(p => p.team === 'Team Purple');
        const team2 = match.players.filter(p => p.team === 'Team Ugly');
        const team3 = match.players.filter(p => p.team === 'Team Gold');
        const team4 = match.players.filter(p => p.team === 'Team Orange');

        const team1Names = team1.map(p => p.player).join(', ');
        const team2Names = team2.map(p => p.player).join(', ');
        const team3Names = team3.map(p => p.player).join(', ');
        const team4Names = team4.map(p => p.player).join(', ');

        const team1Score = team1.reduce((sum, p) => sum + p.score, 0);
        const team2Score = team2.reduce((sum, p) => sum + p.score, 0);
        const team3Score = team3.reduce((sum, p) => sum + p.score, 0);
        const team4Score = team4.reduce((sum, p) => sum + p.score, 0);

        const time = formatMatchTime(match.date);

        return `
            <div class="match-item">
                <div class="match-info">
                    <div class="match-teams">
                        <div class="team-line">
                            <span class="team-color">🟣</span>
                            <span class="team-players">${team1Names}</span>
                            <span class="team-score">(${team1Score})</span>
                        </div>
                        <div class="team-line">
                            <span class="team-color">🟦</span>
                            <span class="team-players">${team2Names}</span>
                            <span class="team-score">(${team2Score})</span>
                        </div>
                        <div class="team-line">
                            <span class="team-color">🟡</span>
                            <span class="team-players">${team3Names}</span>
                            <span class="team-score">(${team3Score})</span>
                        </div>
                        <div class="team-line">
                            <span class="team-color">🟠</span>
                            <span class="team-players">${team4Names}</span>
                            <span class="team-score">(${team4Score})</span>
                        </div>
                    </div>
                </div>
                <div class="match-time">${time}</div>
            </div>
        `;
    }).join('');
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
});