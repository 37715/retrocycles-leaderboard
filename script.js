// HTML scraping URLs
const MATCHES_HTML_URL = "https://corsproxy.io/?" + encodeURIComponent("https://rankings.trontimes.tk/history?id=tst");
const MATCHES_DATA_URL = "https://corsproxy.io/?" + encodeURIComponent("https://rankings.trontimes.tk/history?id=tst");

// Player history endpoint with season support
// For 2026: id=tst (no date filter needed)
// For 2023-2025: id=tst24 with daterange=1 and date params
function getPlayerHistoryUrl(username, season = '2026') {
    let baseUrl;
    
    if (season === '2026') {
        // Current season - use tst
        baseUrl = `https://rankings.trontimes.tk/api.php?id=tst&type=history&mp=${encodeURIComponent(username)}`;
    } else {
        // Historical seasons - use tst24 with date filtering
        const startDate = `${season}-01-01`;
        const endDate = `${season}-12-31`;
        baseUrl = `https://rankings.trontimes.tk/api.php?id=tst24&type=history&daterange=1&datel=${startDate}&date=${endDate}&mp=${encodeURIComponent(username)}`;
    }
    
    return `https://corsproxy.io/?${encodeURIComponent(baseUrl)}`;
}

function getPlayerSummary(matches, username) {
    let totalKills = 0;
    let totalDeaths = 0;
    let totalScore = 0;
    let matchCount = 0;
    let wins = 0;

    matches.forEach((match) => {
        const players = match.players || [];
        const entry = players.find((p) => p.player === username);
        if (!entry) return;
        const kills = entry.kd?.[0] || 0;
        const deaths = entry.kd?.[1] || 0;
        totalKills += kills;
        totalDeaths += deaths;
        totalScore += entry.score ?? 0;
        matchCount += 1;
        // Team win = 1st place
        if (entry.place === 1) wins += 1;
    });

    const winRate = matchCount > 0 ? Math.round((wins / matchCount) * 100) : 0;

    return {
        averageKd: totalDeaths > 0 ? (totalKills / totalDeaths).toFixed(2) : `${totalKills}.00`,
        averageScore: matchCount ? Math.round(totalScore / matchCount) : 0,
        winRate: winRate,
        wins: wins,
        matches: matchCount
    };
}

// Season configs with API IDs for rankings.trontimes.tk
// tst = 2026 league season, tst24 = 2023-2025 league season
const SEASONS = {
    '2026': { start: '2026-01-01', end: '2026-12-31', apiId: 'tst', label: 'Season 4 (2026)' },
    '2025': { start: '2025-01-01', end: '2025-12-31', apiId: 'tst24', label: 'Season 3 (2025)' },
    '2024': { start: '2024-01-01', end: '2024-12-31', apiId: 'tst24', label: 'Season 2 (2024)' },
    '2023': { start: '2023-01-01', end: '2023-12-31', apiId: 'tst24', label: 'Season 1 (2023)' }
};

// Function to fetch player's leaderboard rank for a given season
async function getPlayerLeaderboardRank(username, season) {
    try {
        const url = getLeaderboardURL(season, 'tst', 'combined');
        if (!url) return null;
        
        const response = await fetch(url);
        if (!response.ok) return null;
        
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        const rows = doc.querySelectorAll('table tr');
        
        for (let i = 0; i < rows.length; i++) {
            const cells = rows[i].querySelectorAll('td');
            if (cells.length >= 2) {
                const playerName = cells[1]?.textContent?.trim();
                if (playerName && playerName.toLowerCase() === username.toLowerCase()) {
                    const rank = parseInt(cells[0]?.textContent?.trim()) || (i);
                    return rank;
                }
            }
        }
        
        return null; // Player not found on leaderboard
    } catch (error) {
        return null;
    }
}

// Unified leaderboard URL builder - uses rankings.trontimes.tk for everything
const getLeaderboardURL = (year, gameMode, region) => {
    const baseUrl = "https://rankings.trontimes.tk/daterange.php";
    const yearConfig = SEASONS[year];
    
    if (!yearConfig) {
        return null;
    }
    
    let params = [];
    
    // Add date range parameters
    if (yearConfig.start) {
        params.push(`datel=${yearConfig.start}`);
    }
    if (yearConfig.end) {
        params.push(`date=${yearConfig.end}`);
    }
    
    // Build the API ID with region suffix
    let apiId = yearConfig.apiId;
    if (region === 'eu') {
        apiId += '-eu';
    } else if (region === 'us') {
        apiId += '-us';
    }
    params.push(`id=${apiId}`);
    
    const url = baseUrl + '?' + params.join('&');
    
    return "https://corsproxy.io/?" + encodeURIComponent(url);
};

let allPlayersData = [];
let allMatchesData = [];

// State management for filters
let currentTimePeriod = '2026';
let currentRegion = 'combined';

// Match history endpoints (proxied through retrocyclesleague.com)
const MATCH_HISTORY_BASE_URL = 'https://retrocyclesleague.com/api/history';
const getMatchHistoryListUrl = (page = 1) =>
    `${MATCH_HISTORY_BASE_URL}/tst${page ? `?page=${page}` : ''}`;
const getMatchHistoryDetailUrl = (matchId) =>
    `${MATCH_HISTORY_BASE_URL}/tst?id=${encodeURIComponent(matchId)}`;

function formatMatchTimestamp(isoString) {
    if (!isoString) return 'unknown time';
    const date = new Date(isoString);
    return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    }).toLowerCase();
}

function formatMatchDuration(totalSeconds) {
    if (!totalSeconds && totalSeconds !== 0) return 'unknown';
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes}m ${seconds}s`;
}

async function fetchMatchHistory(page = 1) {
    const response = await fetch(getMatchHistoryListUrl(page));
    if (!response.ok) {
        throw new Error('failed to fetch match history');
    }
    return response.json();
}

async function fetchMatchDetails(matchId) {
    const response = await fetch(getMatchHistoryDetailUrl(matchId));
    if (!response.ok) {
        throw new Error('failed to fetch match details');
    }
    return response.json();
}

function computePlayerTotals(player) {
    const positions = Array.isArray(player.positions) ? player.positions : [];
    const totals = positions.reduce(
        (acc, entry) => {
            acc.kills += entry.kills || 0;
            acc.deaths += entry.deaths || 0;
            acc.score += (entry.kills || 0) * 30 + (entry.holePoints || 0);
            return acc;
        },
        { kills: 0, deaths: 0, score: 0 }
    );
    return { ...totals, hasData: positions.length > 0 };
}

function renderMatchDetails(container, matchData) {
    if (!matchData || !Array.isArray(matchData.teams)) {
        container.innerHTML = `<div class="match-detail-loading">no match data available</div>`;
        return;
    }

    const teamsSorted = [...matchData.teams].sort((a, b) => (b.score || 0) - (a.score || 0));
    const rows = [];
    teamsSorted.forEach((team) => {
        const players = Array.isArray(team.players) ? team.players : [];
        rows.push({
            type: 'team',
            teamName: team.teamName || 'team',
            teamScore: team.score ?? 0
        });
        players.forEach((player) => {
            const totals = computePlayerTotals(player);
            const kd = totals.hasData
                ? (totals.deaths > 0 ? (totals.kills / totals.deaths).toFixed(2) : `${totals.kills}.00`)
                : '—';
            rows.push({
                type: 'player',
                teamName: team.teamName || 'team',
                playerName: player.nickname || player.username || 'player',
                teamScore: team.score ?? 0,
                playerScore: totals.hasData ? totals.score : '—',
                playerKd: kd,
                kills: totals.kills,
                deaths: totals.deaths,
                hasData: totals.hasData
            });
        });
    });

    if (rows.length === 0) {
        container.innerHTML = `<div class="match-detail-loading">no player stats available</div>`;
        return;
    }

    const header = `
        <div class="match-table-header">
            <span>team</span>
            <span>player</span>
            <span>team score</span>
            <span>player score</span>
            <span>k/d</span>
        </div>
    `;
    const normalizeTeamName = (name = '') => name.toLowerCase().replace('team ', '').trim();

    const body = rows.map((row) => {
        const teamKey = normalizeTeamName(row.teamName);
        if (row.type === 'team') {
            return `
                <div class="match-table-row match-team-row" data-team="${teamKey}">
                    <span class="match-team" data-team="${teamKey}">${row.teamName}</span>
                    <span class="match-player"></span>
                    <span class="match-team-score">${row.teamScore}</span>
                    <span class="match-player-score"></span>
                    <span class="match-player-kd"></span>
                </div>
            `;
        }
        return `
            <div class="match-table-row" data-team="${teamKey}">
                <span class="match-team" data-team="${teamKey}"></span>
                <span class="match-player profile-link" data-username="${row.playerName}">${row.playerName}</span>
                <span class="match-team-score"></span>
                <span class="match-player-score">${row.playerScore}</span>
                <span class="match-player-kd">
                    ${row.playerKd}
                    ${row.hasData ? `
                        <span class="match-kd-breakdown">
                            <span class="match-kills">${row.kills}</span>
                            <span class="match-kd-sep">/</span>
                            <span class="match-deaths">${row.deaths}</span>
                        </span>
                    ` : ''}
                </span>
            </div>
        `;
    }).join('');

    container.innerHTML = `<div class="match-table">${header}${body}</div>`;
}

function formatPercent(value) {
    if (value === null || value === undefined) return '—';
    const numeric = Number(value);
    if (Number.isNaN(numeric)) return '—';
    const percent = numeric <= 1 ? numeric * 100 : numeric;
    return `${percent.toFixed(1)}%`;
}

function formatNetPoints(entryRating, exitRating) {
    if (entryRating === null || entryRating === undefined || exitRating === null || exitRating === undefined) {
        return '—';
    }
    const delta = exitRating - entryRating;
    return `${delta > 0 ? '+' : ''}${delta}`;
}

function computeIndividualPlace(players, playerName) {
    const sorted = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));
    const index = sorted.findIndex((p) => p.player === playerName);
    return index === -1 ? '—' : index + 1;
}

let profileSortConfig = { key: 'date', dir: 'desc' };

// Region colors
const regionColors = {
    'us': '#3b82f6',
    'eu': '#10b981',
    'unknown': '#6b7280',
    'ny': '#8b5cf6',
    'dc': '#f59e0b',
    'la': '#ef4444'
};

// Generate SVG pie chart for regions
function generateRegionPieChart(entries, total) {
    if (!entries || entries.length === 0) {
        return '<div class="region-chart-empty">no region data</div>';
    }
    
    const size = 200;
    const center = size / 2;
    const radius = 85;
    const innerRadius = 50; // Donut style
    
    // Special case: only one region (100%) - draw full donut
    if (entries.length === 1) {
        const [name, count] = entries[0];
        const color = regionColors[name.toLowerCase()] || regionColors['unknown'];
        return `
            <div class="region-pie-container">
                <svg class="region-pie-chart" viewBox="0 0 ${size} ${size}">
                    <circle cx="${center}" cy="${center}" r="${radius}" fill="${color}" stroke="var(--bg-secondary)" stroke-width="2"/>
                    <circle cx="${center}" cy="${center}" r="${innerRadius}" fill="var(--bg-secondary)"/>
                </svg>
                <div class="region-legend">
                    <div class="region-legend-item">
                        <span class="region-legend-color" style="background: ${color}"></span>
                        <span class="region-legend-label">${name}</span>
                        <span class="region-legend-value">100%</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    let currentAngle = -90; // Start from top
    const slices = [];
    
    entries.forEach(([name, count]) => {
        const percent = count / total;
        const angle = percent * 360;
        const startAngle = currentAngle;
        const endAngle = currentAngle + angle;
        
        // Convert to radians
        const startRad = (startAngle * Math.PI) / 180;
        const endRad = (endAngle * Math.PI) / 180;
        
        // Calculate arc points
        const x1 = center + radius * Math.cos(startRad);
        const y1 = center + radius * Math.sin(startRad);
        const x2 = center + radius * Math.cos(endRad);
        const y2 = center + radius * Math.sin(endRad);
        
        // Inner arc points (for donut)
        const ix1 = center + innerRadius * Math.cos(startRad);
        const iy1 = center + innerRadius * Math.sin(startRad);
        const ix2 = center + innerRadius * Math.cos(endRad);
        const iy2 = center + innerRadius * Math.sin(endRad);
        
        const largeArc = angle > 180 ? 1 : 0;
        const color = regionColors[name.toLowerCase()] || regionColors['unknown'];
        
        // Create donut slice path
        const path = `M ${ix1} ${iy1} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix1} ${iy1} Z`;
        
        slices.push({ name, count, percent: Math.round(percent * 100), color, path });
        currentAngle = endAngle;
    });
    
    return `
        <div class="region-pie-container">
            <svg class="region-pie-chart" viewBox="0 0 ${size} ${size}">
                ${slices.map(s => `
                    <path d="${s.path}" fill="${s.color}" stroke="var(--bg-secondary)" stroke-width="2"/>
                `).join('')}
            </svg>
            <div class="region-pie-legend">
                ${slices.map(s => `
                    <div class="region-pie-item">
                        <span class="region-pie-color" style="background: ${s.color}"></span>
                        <span class="region-pie-name">${s.name.toUpperCase()}</span>
                        <span class="region-pie-percent">${s.percent}%</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Generate SVG line chart for ELO progression
function generateEloChart(data) {
    if (!data || data.length < 2) {
        return '<div class="elo-chart-empty">not enough data for chart</div>';
    }
    
    const width = 580;
    const height = 220;
    const padding = { top: 20, right: 50, bottom: 35, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    
    // Get min/max ELO with some padding
    const elos = data.map(d => d.elo);
    const minElo = Math.min(...elos);
    const maxElo = Math.max(...elos);
    const eloRange = maxElo - minElo || 100;
    const eloPadding = eloRange * 0.1;
    const yMin = Math.floor((minElo - eloPadding) / 50) * 50;
    const yMax = Math.ceil((maxElo + eloPadding) / 50) * 50;
    
    // Scale functions
    const xScale = (i) => padding.left + (i / (data.length - 1)) * chartWidth;
    const yScale = (elo) => padding.top + chartHeight - ((elo - yMin) / (yMax - yMin)) * chartHeight;
    
    // Generate path
    const pathPoints = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(i).toFixed(1)} ${yScale(d.elo).toFixed(1)}`).join(' ');
    
    // Generate area fill (gradient under line)
    const areaPath = `M ${xScale(0).toFixed(1)} ${yScale(data[0].elo).toFixed(1)} ` +
        data.slice(1).map((d, i) => `L ${xScale(i + 1).toFixed(1)} ${yScale(d.elo).toFixed(1)}`).join(' ') +
        ` L ${xScale(data.length - 1).toFixed(1)} ${padding.top + chartHeight} L ${xScale(0).toFixed(1)} ${padding.top + chartHeight} Z`;
    
    // Y-axis labels (every 50 or 100 ELO depending on range)
    const yStep = yMax - yMin > 200 ? 100 : 50;
    const yLabels = [];
    for (let elo = yMin; elo <= yMax; elo += yStep) {
        yLabels.push(elo);
    }
    
    // Calculate trend (up or down)
    const startElo = data[0].elo;
    const endElo = data[data.length - 1].elo;
    const trend = endElo >= startElo ? 'up' : 'down';
    const trendColor = trend === 'up' ? '#10b981' : '#ef4444';
    
    // Generate x-axis date labels (just first and last)
    const xLabels = [
        { index: 0, date: data[0].date },
        { index: data.length - 1, date: data[data.length - 1].date }
    ];
    
    return `
        <div class="elo-chart-container">
            <div class="elo-chart-title">elo progression</div>
            <svg class="elo-chart" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">
                <defs>
                    <linearGradient id="eloGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style="stop-color:${trendColor};stop-opacity:0.3"/>
                        <stop offset="100%" style="stop-color:${trendColor};stop-opacity:0.02"/>
                    </linearGradient>
                </defs>
                
                <!-- Grid lines -->
                ${yLabels.map(elo => `
                    <line x1="${padding.left}" y1="${yScale(elo).toFixed(1)}" x2="${width - padding.right}" y2="${yScale(elo).toFixed(1)}" stroke="var(--border-color)" stroke-opacity="0.5" stroke-dasharray="4,4"/>
                    <text x="${padding.left - 8}" y="${yScale(elo).toFixed(1)}" fill="var(--text-muted)" font-size="10" text-anchor="end" dominant-baseline="middle">${elo}</text>
                `).join('')}
                
                <!-- Area fill -->
                <path d="${areaPath}" fill="url(#eloGradient)"/>
                
                <!-- Line -->
                <path d="${pathPoints}" fill="none" stroke="${trendColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                
                <!-- Data points -->
                ${data.map((d, i) => `
                    <circle cx="${xScale(i).toFixed(1)}" cy="${yScale(d.elo).toFixed(1)}" r="4" fill="var(--bg-primary)" stroke="${trendColor}" stroke-width="2"/>
                `).join('')}
                
                <!-- X-axis date labels -->
                ${xLabels.map((label, i) => `
                    <text x="${xScale(label.index).toFixed(1)}" y="${height - 8}" fill="var(--text-muted)" font-size="9" text-anchor="${i === 0 ? 'start' : 'end'}">${label.date}</text>
                `).join('')}
            </svg>
            <div class="elo-chart-legend">
                <span class="elo-chart-stat">start: <strong>${startElo}</strong></span>
                <span class="elo-chart-stat">end: <strong>${endElo}</strong></span>
                <span class="elo-chart-stat elo-chart-${trend}">change: <strong>${endElo >= startElo ? '+' : ''}${endElo - startElo}</strong></span>
            </div>
        </div>
    `;
}

function renderPlayerProfile(username, matches) {
    if (!Array.isArray(matches) || matches.length === 0) {
        return `<div class="profile-loading">no matches found for this player</div>`;
    }

    const rows = [];
    let totalKills = 0;
    let totalDeaths = 0;
    let totalScore = 0;
    let totalAlive = 0;
    let totalPlayed = 0;
    let totalEntry = 0;
    let totalExit = 0;
    let entryCount = 0;
    let exitCount = 0;

    const teammateCounts = {};
    const regionCounts = {};

    matches.forEach((match) => {
        const players = match.players || [];
        const entry = players.find((p) => p.player === username);
        if (!entry) return;

        const kills = entry.kd?.[0] || 0;
        const deaths = entry.kd?.[1] || 0;
        const score = entry.score ?? 0;
        const entryRating = entry.entryRating ?? null;
        const exitRating = entry.exitRating ?? null;

        totalKills += kills;
        totalDeaths += deaths;
        totalScore += score;
        totalAlive += entry.alive ?? 0;
        totalPlayed += entry.played ?? 0;

        if (entryRating !== null) {
            totalEntry += entryRating;
            entryCount += 1;
        }
        if (exitRating !== null) {
            totalExit += exitRating;
            exitCount += 1;
        }

        const teammates = players.filter((p) => p.team === entry.team && p.player !== username);
        teammates.forEach((mate) => {
            teammateCounts[mate.player] = (teammateCounts[mate.player] || 0) + 1;
        });

        const region = match.region || 'unknown';
        regionCounts[region] = (regionCounts[region] || 0) + 1;

        rows.push({
            matchId: match.id,
            date: formatMatchTimestamp(match.name || match.date),
            dateValue: new Date(match.name || match.date).getTime() || 0,
            teammate: teammates.map((mate) => mate.player).join(', ') || '—',
            exitRating,
            change: formatNetPoints(entryRating, exitRating),
            changeValue: (entryRating === null || exitRating === null) ? 0 : (exitRating - entryRating),
            teamPlace: entry.place ?? '—',
            teamPlaceValue: entry.place ?? 0,
            indvPlace: computeIndividualPlace(players, entry.player),
            indvPlaceValue: computeIndividualPlace(players, entry.player) === '—' ? 0 : computeIndividualPlace(players, entry.player),
            played: formatPercent(entry.played),
            playedValue: entry.played ?? 0,
            alive: formatPercent(entry.alive),
            aliveValue: entry.alive ?? 0,
            score,
            scoreValue: score ?? 0,
            net: formatNetPoints(entry.entryRating, entry.exitRating),
            kd: deaths > 0 ? (kills / deaths).toFixed(2) : `${kills}.00`,
            kdValue: deaths > 0 ? (kills / deaths) : kills
        });
    });

    const averageKd = totalDeaths > 0 ? (totalKills / totalDeaths).toFixed(2) : `${totalKills}.00`;
    const averageScore = rows.length ? Math.round(totalScore / rows.length) : 0;
    const averageAlive = rows.length ? formatPercent(totalAlive / rows.length) : '—';
    const averagePlayedRatio = rows.length ? totalPlayed / rows.length : null;
    const averagePlayed = averagePlayedRatio === null ? '—' : formatPercent(averagePlayedRatio);
    const rageQuitValue = averagePlayedRatio === null ? null : Math.max(0, 100 - averagePlayedRatio * 100);
    const rageQuit = rageQuitValue === null ? '—' : `${rageQuitValue.toFixed(1)}%`;
    let rageEmoji = '';
    if (rageQuitValue !== null) {
        if (rageQuitValue > 7) {
            rageEmoji = '😡';
        } else if (rageQuitValue > 2) {
            rageEmoji = '😐';
        } else {
            rageEmoji = '🙂';
        }
    }
    const rageLevel = rageQuitValue === null ? 'unknown' : (rageQuitValue > 7 ? 'high' : (rageQuitValue > 2 ? 'mid' : 'low'));
    const averageEntry = entryCount ? Math.round(totalEntry / entryCount) : '—';
    const averageExit = exitCount ? Math.round(totalExit / exitCount) : '—';

    const teammateEntries = Object.entries(teammateCounts).sort((a, b) => b[1] - a[1]);
    const regionEntries = Object.entries(regionCounts).sort((a, b) => b[1] - a[1]);
    const teammateTotal = teammateEntries.reduce((sum, [, count]) => sum + count, 0) || 1;
    const regionTotal = regionEntries.reduce((sum, [, count]) => sum + count, 0) || 1;
    const teammateTop = teammateEntries.slice(0, 10);
    const teammateExtra = teammateEntries.slice(10);
    const regionTop = regionEntries.slice(0, 10);
    const regionExtra = regionEntries.slice(10);

    const sortMap = {
        date: (a, b) => a.dateValue - b.dateValue,
        teammate: (a, b) => a.teammate.localeCompare(b.teammate),
        exitRating: (a, b) => (a.exitRating ?? 0) - (b.exitRating ?? 0),
        change: (a, b) => a.changeValue - b.changeValue,
        teamPlace: (a, b) => a.teamPlaceValue - b.teamPlaceValue,
        indvPlace: (a, b) => a.indvPlaceValue - b.indvPlaceValue,
        played: (a, b) => a.playedValue - b.playedValue,
        alive: (a, b) => a.aliveValue - b.aliveValue,
        score: (a, b) => a.scoreValue - b.scoreValue,
        kd: (a, b) => a.kdValue - b.kdValue
    };
    const sorter = sortMap[profileSortConfig.key] || sortMap.date;
    const sortedRows = [...rows].sort((a, b) =>
        sorter(a, b) * (profileSortConfig.dir === 'asc' ? 1 : -1)
    );

    const sortDir = (key) => (profileSortConfig.key === key ? profileSortConfig.dir : undefined);

    // Generate ELO chart data (sorted chronologically)
    const chartData = rows
        .filter(r => r.exitRating !== null && r.exitRating !== undefined)
        .sort((a, b) => a.dateValue - b.dateValue)
        .map(r => ({ date: r.date, elo: r.exitRating }));
    
    const eloChart = generateEloChart(chartData);

    return `
        <div class="profile-summary">
            <div class="profile-card">
                <span class="profile-card-label">matches</span>
                <span class="profile-card-value">${rows.length}</span>
            </div>
            <div class="profile-card">
                <span class="profile-card-label">avg k/d</span>
                <span class="profile-card-value">${averageKd}</span>
            </div>
            <div class="profile-card">
                <span class="profile-card-label">avg score</span>
                <span class="profile-card-value">${averageScore}</span>
            </div>
            <div class="profile-card">
                <span class="profile-card-label">avg alive</span>
                <span class="profile-card-value">${averageAlive}</span>
            </div>
            <div class="profile-card profile-card-rage" data-rage="${rageLevel}">
                <span class="profile-card-label">rage quit rate</span>
                <span class="profile-card-value">${rageQuit} ${rageEmoji}</span>
            </div>
        </div>
        <div class="profile-breakdowns">
            <div class="profile-breakdown" data-collapsed="true">
                <h4>teammates</h4>
                <div class="profile-breakdown-list">
                ${teammateTop.map(([name, count]) => {
                    const percent = Math.round((count / teammateTotal) * 100);
                    return `
                        <div class="profile-breakdown-item">
                            <span>${name}</span>
                            <div class="profile-breakdown-bar">
                                <div class="profile-breakdown-fill" style="width: ${percent}%"></div>
                            </div>
                            <span>${percent}%</span>
                        </div>
                    `;
                }).join('')}
                ${teammateExtra.length ? `
                    <div class="profile-breakdown-extra">
                        ${teammateExtra.map(([name, count]) => {
                            const percent = Math.round((count / teammateTotal) * 100);
                            return `
                                <div class="profile-breakdown-item">
                                    <span>${name}</span>
                                    <div class="profile-breakdown-bar">
                                        <div class="profile-breakdown-fill" style="width: ${percent}%"></div>
                                    </div>
                                    <span>${percent}%</span>
                                </div>
                            `;
                        }).join('')}
                    </div>
                ` : ''}
                </div>
                ${teammateEntries.length > 10 ? `<button class="profile-breakdown-toggle" type="button">show more</button>` : ''}
            </div>
            <div class="profile-region-summary">
                <h4>regions</h4>
                ${generateRegionPieChart(regionEntries, regionTotal)}
            </div>
        </div>
        ${eloChart}
        <div class="profile-table" data-collapsed="true">
            <div class="profile-table-title">match history</div>
            <div class="profile-table-header">
                <button data-sort="date" data-sort-dir="${sortDir('date') || ''}">match</button>
                <button data-sort="teammate" data-sort-dir="${sortDir('teammate') || ''}">teammate</button>
                <button data-sort="exitRating" data-sort-dir="${sortDir('exitRating') || ''}">exit rating</button>
                <button data-sort="change" data-sort-dir="${sortDir('change') || ''}">change</button>
                <button data-sort="teamPlace" data-sort-dir="${sortDir('teamPlace') || ''}">team place</button>
                <button data-sort="indvPlace" data-sort-dir="${sortDir('indvPlace') || ''}">indv place</button>
                <button data-sort="played" data-sort-dir="${sortDir('played') || ''}">played %</button>
                <button data-sort="alive" data-sort-dir="${sortDir('alive') || ''}">alive %</button>
                <button data-sort="score" data-sort-dir="${sortDir('score') || ''}">score</button>
                <button data-sort="kd" data-sort-dir="${sortDir('kd') || ''}">k/d</button>
            </div>
            ${sortedRows.slice(0, 10).map((row) => `
                <div class="profile-table-row">
                    <span class="profile-highlight">${row.date}</span>
                    <span>${row.teammate}</span>
                    <span>${row.exitRating ?? '—'}</span>
                    <span>${row.change}</span>
                    <span>${row.teamPlace}</span>
                    <span>${row.indvPlace}</span>
                    <span>${row.played}</span>
                    <span>${row.alive}</span>
                    <span class="profile-highlight">${row.score}</span>
                    <span>${row.kd}</span>
                </div>
            `).join('')}
            ${sortedRows.length > 10 ? `
                <div class="profile-table-extra">
                    ${sortedRows.slice(10).map((row) => `
                        <div class="profile-table-row">
                            <span class="profile-highlight">${row.date}</span>
                            <span>${row.teammate}</span>
                            <span>${row.exitRating ?? '—'}</span>
                            <span>${row.change}</span>
                            <span>${row.teamPlace}</span>
                            <span>${row.indvPlace}</span>
                            <span>${row.played}</span>
                            <span>${row.alive}</span>
                            <span class="profile-highlight">${row.score}</span>
                            <span>${row.kd}</span>
                        </div>
                    `).join('')}
                </div>
                <button class="profile-table-toggle" type="button">show all ${sortedRows.length} matches</button>
            ` : ''}
        </div>
    `;
}

function renderMatchHistoryList(matches, listElement) {
    if (!Array.isArray(matches) || matches.length === 0) {
        listElement.innerHTML = `<div class="match-empty">no matches found</div>`;
        return;
    }

    listElement.innerHTML = matches.map((match) => {
        const winner = match.winner || 'unknown';
        const winnerKey = winner.toLowerCase();
        return `
            <div class="match-item" data-match-id="${match.id}">
                <div class="match-summary">
                    <span class="match-date">${formatMatchTimestamp(match.date)}</span>
                    <span class="match-sep">|</span>
                    <span class="match-rounds">${match.roundCount || 0} rounds</span>
                    <span class="match-sep">|</span>
                    <span class="match-duration">${formatMatchDuration(match.totalTime)}</span>
                    <span class="match-sep">|</span>
                    <span class="match-winner">winner: <span class="match-winner-team" data-team="${winnerKey}">${winner.toLowerCase()}</span></span>
                </div>
                <div class="match-detail-body"></div>
            </div>
        `;
    }).join('');
}

// Loading and request management
let currentLoadingRequest = null;
let isLoading = false;

// Cache system - Extended to 1 hour for better performance
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds
const dataCache = {
    // Dynamic keys: '2026-combined', '2025-eu', etc.
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

    return cached.data;
}

function setCachedData(key, data) {
    dataCache[key] = {
        data: data,
        timestamp: Date.now()
    };
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

// Get current game mode
function getCurrentGameMode() {
    const activeNavLink = document.querySelector('.gamemode-nav-menu .nav-link.active[data-mode]');
    return activeNavLink ? activeNavLink.getAttribute('data-mode').toLowerCase() : 'tst';
}

// Game mode navigation functionality
document.querySelectorAll('.gamemode-nav-menu .nav-link[data-mode]').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        if (link.classList.contains('is-disabled')) {
            return;
        }
        const mode = link.getAttribute('data-mode').toLowerCase();

        // Only update active state and fetch data for TST
        document.querySelectorAll('.gamemode-nav-menu .nav-link').forEach(navLink => {
            navLink.classList.remove('active');
        });
        link.classList.add('active');
        const modeUpper = mode.toUpperCase();
        const currentModeElement = document.getElementById('current-mode');
        if (currentModeElement) {
            currentModeElement.textContent = modeUpper;
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

async function fetchPlayerData(year = '2026', gameMode = 'tst', region = 'combined') {

    // Cancel any existing request
    if (currentLoadingRequest) {
        currentLoadingRequest.cancelled = true;
    }

    // Create new request tracker
    const requestId = Date.now();
    currentLoadingRequest = { id: requestId, cancelled: false };

    // Create cache key that includes region
    const cacheKey = `${year}-${region}`;

    // Check cache first
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
        // Even cached data should check if request is still valid
        if (currentLoadingRequest.id !== requestId || currentLoadingRequest.cancelled) {
            return;
        }
        allPlayersData = cachedData;
        hideLoadingState();
        renderLeaderboard();
        return;
    }

    // Show loading state for non-cached requests
    showLoadingState();

    // All years use HTML scraping from rankings.trontimes.tk
    await scrapeLeaderboard(year, gameMode, region, requestId, cacheKey);
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

// Unified HTML leaderboard scraping for all years
async function scrapeLeaderboard(year, gameMode, region, requestId, cacheKey) {

    const htmlUrl = getLeaderboardURL(year, gameMode, region);
    // Log the decoded URL for debugging
    const decodedUrl = decodeURIComponent(htmlUrl.replace('https://corsproxy.io/?', ''));

    try {
        const response = await fetch(htmlUrl);

        // Check if request was cancelled during fetch
        if (currentLoadingRequest.id !== requestId || currentLoadingRequest.cancelled) {
            return;
        }

        const html = await response.text();

        // Check again after HTML parsing
        if (currentLoadingRequest.id !== requestId || currentLoadingRequest.cancelled) {
            return;
        }

        // Parse HTML to extract player data
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Find the table rows containing player data
        const rows = doc.querySelectorAll('table tr');
        const players = [];


        // Log the HTML structure to understand the table format
        if (rows.length > 1) {
            const headerRow = rows[0];
            const sampleRow = rows[1];
        }

        rows.forEach((row, index) => {
            if (index === 0) return; // Skip header row

            const cells = row.querySelectorAll('td');
            if (cells.length < 3) return; // Skip invalid rows

            // Extract data from HTML table - rankings.trontimes.tk has 11 columns:
            // Columns: # | Username | Rating | Latest change | Change date | Matches W/L | Played | Avg place | Avg score | High score | K/D
            const rank = parseInt(cells[0]?.textContent?.trim()) || index;
            const name = cells[1]?.textContent?.trim();
            const elo = parseInt(cells[2]?.textContent?.trim()) || 1500;
            const latestChange = parseInt(cells[3]?.textContent?.trim()) || 0;
            const changeDateText = cells[4]?.textContent?.trim() || '';
            
            // Detect if 11 columns (has "Played" column) or 10 columns
            const hasPlayedColumn = cells.length >= 11;
            
            let matches = 0, avgPlace, avgScore, highScore, kd, wins = 0, losses = 0;
            let winrate = 0;
            // Team position percentages (1st, 2nd, 3rd, 4th)
            let pos1Rate = 0, pos2Rate = 0, pos3Rate = 0, pos4Rate = 0;
            
            // The Matches W/L column (index 5) has progress bars
            // Structure: titles like "2nd: 8 out of 47" contain total matches and position counts
            // Progress bars show: 1st (green), 2nd (yellow), 3rd (orange), 4th (red background)
            const matchesCell = cells[5];
            
            // Get all progress bars - they represent team positions 1-4
            const progressBars = matchesCell?.querySelectorAll('.progress-bar') || [];
            
            // First bar = 1st place (wins), get percentage from aria-valuenow
            if (progressBars[0]) {
                pos1Rate = parseFloat(progressBars[0].getAttribute('aria-valuenow')) || 0;
            }
            
            // 2nd and 3rd bars have titles like "2nd: 8 out of 47"
            for (const bar of progressBars) {
                const title = bar.getAttribute('title') || '';
                const ariaValue = parseFloat(bar.getAttribute('aria-valuenow')) || 0;
                
                // Get total matches from "out of X"
                const outOfMatch = title.match(/out of (\d+)/i);
                if (outOfMatch && matches === 0) {
                    matches = parseInt(outOfMatch[1]) || 0;
                }
                
                // Parse position from title
                if (title.match(/^2nd/i)) {
                    pos2Rate = ariaValue;
                } else if (title.match(/^3rd/i)) {
                    pos3Rate = ariaValue;
                }
            }
            
            // 4th place is the remainder (shown as red background)
            pos4Rate = Math.max(0, 100 - pos1Rate - pos2Rate - pos3Rate);
            
            // Win rate is 1st place percentage
            winrate = pos1Rate / 100;
            
            // Calculate actual wins from percentage
            if (matches > 0 && winrate > 0) {
                wins = Math.round(matches * winrate);
                losses = matches - wins;
            }
            
            if (hasPlayedColumn) {
                // 11-column format: Played is at index 6
                if (matches === 0) matches = parseInt(cells[6]?.textContent?.trim()) || 0;
                avgPlace = parseFloat(cells[7]?.textContent?.trim()) || 2.5;
                avgScore = parseInt(cells[8]?.textContent?.trim()) || 400;
                highScore = parseInt(cells[9]?.textContent?.trim()) || 600;
                kd = parseFloat(cells[10]?.textContent?.trim()) || 1.0;
            } else {
                // 10-column format: no separate Played column
                avgPlace = parseFloat(cells[6]?.textContent?.trim()) || 2.5;
                avgScore = parseInt(cells[7]?.textContent?.trim()) || 400;
                highScore = parseInt(cells[8]?.textContent?.trim()) || 600;
                kd = parseFloat(cells[9]?.textContent?.trim()) || 1.0;
            }

            // Parse the last active time from change date text
            const lastActive = parseLastActiveTime(changeDateText);



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
                    lastActive: lastActive,
                    // Team position percentages (actual data from HTML)
                    pos1Rate: pos1Rate,
                    pos2Rate: pos2Rate,
                    pos3Rate: pos3Rate,
                    pos4Rate: pos4Rate,
                    region: ['US', 'EU', 'Combined'][index % 3] // Simulated
                });
            }
        });


        if (players.length > 0) {
            // Final check before applying results
            if (currentLoadingRequest.id !== requestId || currentLoadingRequest.cancelled) {
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
            return;
        }
        hideLoadingState();
        // For now, just show empty state instead of fallback
        allPlayersData = [];
        renderLeaderboard();
    }
}

// Supplement HTML leaderboard data with accurate stats from match history
async function supplementWithMatchData(players, timePeriod) {

    if (allMatchesData.length === 0) {
        return players;
    }

    // Filter matches by year date range
    const yearConfig = SEASONS[timePeriod];
    let recentMatches = allMatchesData;
    
    if (yearConfig && yearConfig.start) {
        const startDate = new Date(yearConfig.start);
        const endDate = yearConfig.end ? new Date(yearConfig.end + 'T23:59:59') : new Date();
        
        recentMatches = allMatchesData.filter(match => {
            const timestamp = match.date;
            const matchDate = new Date(timestamp * 1000);
            return matchDate >= startDate && matchDate <= endDate;
        });
    }


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

    return enhancedPlayers;
}

// Fallback function that uses match history to calculate season stats
async function fetchPlayerDataFallback(timePeriod, gameMode) {

    try {
        // Ensure we have match data
        if (allMatchesData.length === 0) {
            renderLeaderboard();
            return;
        }

        // Filter matches by year date range
        const yearConfig = SEASONS[timePeriod];
        let recentMatches = allMatchesData;
        
        if (yearConfig && yearConfig.start) {
            const startDate = new Date(yearConfig.start);
            const endDate = yearConfig.end ? new Date(yearConfig.end + 'T23:59:59') : new Date();
            
            recentMatches = allMatchesData.filter(match => {
                const timestamp = match.date;
                const matchDate = new Date(timestamp * 1000);
                return matchDate >= startDate && matchDate <= endDate;
            });
        }


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


        allPlayersData = activeFiltered;
        renderLeaderboard();

    } catch (fallbackError) {
        renderLeaderboard();
    }
}

async function fetchMatchesData() {

    try {
        const response = await fetch(MATCHES_DATA_URL);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const html = await response.text();

        // Parse HTML to extract match data from tables
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        const matches = [];

        // Find all match containers
        const matchContainers = doc.querySelectorAll('div.row#match-name, div.row[id*="match"]');

        // If no specific containers, look for tables with match data
        const tables = doc.querySelectorAll('table.table-hover, table.table');

        tables.forEach((table, tableIndex) => {

            const caption = table.querySelector('caption');
            const matchName = caption ? `Match ${tableIndex + 1}` : `Match ${tableIndex + 1}`;

            const rows = table.querySelectorAll('tbody tr');

            if (rows.length === 0) {
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
                matches.push({
                    name: matchName,
                    date: Date.now() / 1000 - (tableIndex * 3600), // Approximate timestamps
                    players: players
                });
            }
        });


        if (matches.length > 0) {
            // Cache and use the real data
            setCachedData('matches', matches);
            allMatchesData = matches;
            renderRecentMatches();
        } else {
            // No sample data fallback - just show empty state
            allMatchesData = [];
            renderRecentMatches();
        }

    } catch (error) {
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


        // Skip header row, parse data rows
        for (let i = 1; i < rows.length; i++) {
            const cells = rows[i].querySelectorAll('td, th');

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


        if (players.length > 0) {
            return {
                name: `Match ${matchIndex + 1}`,
                date: Date.now() / 1000 - (matchIndex * 3600), // Approximate timestamps
                players: players
            };
        }

    } catch (error) {
    }

    return null;
}

function getRank(elo) {
    if (elo < 1400) return { name: 'bronze', icon: 'images/ranks/bronze.svg', class: 'rank-bronze' };
    if (elo < 1600) return { name: 'silver', icon: 'images/ranks/silver.svg', class: 'rank-silver' };
    if (elo < 1900) return { name: 'gold', icon: 'images/ranks/gold.svg', class: 'rank-gold' };
    if (elo < 2100) return { name: 'platinum', icon: 'images/ranks/platinum.svg', class: 'rank-platinum' };
    if (elo < 2200) return { name: 'diamond', icon: 'images/ranks/diamond-amethyst-9.svg', class: 'rank-diamond' };
    if (elo < 2300) return { name: 'master', icon: 'images/ranks/master.svg', class: 'rank-master' };
    if (elo < 2400) return { name: 'grandmaster', icon: 'images/ranks/grandmaster.svg', class: 'rank-grandmaster' };
    return { name: 'legend', icon: 'images/ranks/legend.png', class: 'rank-legend' };
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


    // Add rank numbers
    filteredPlayers = filteredPlayers.map((player, index) => ({
        ...player,
        rank: index + 1
    }));


    filteredPlayers.forEach((player, index) => {
        const entry = document.createElement("div");
        entry.className = "leaderboard-entry";
        
        // Get rank info
        const rank = getRank(player.elo || 1500);
        
        // Safe number conversions using actual data structure
        const winrate = Math.round((parseFloat(player.winrate ?? player.winRate ?? 0)) * 100);
        const avgPlace = parseFloat(player.avgPlace || player.averagePlace || 1.5).toFixed(1);
        const kd = parseFloat(player.kd || player.killDeathRatio || 1.0).toFixed(2);
        const avgScore = parseInt(player.avgScore || player.averageScore || 400);
        const highScore = parseInt(player.highScore || player.bestScore || 600);
        
        // Team position percentages (1st green, 2nd yellow, 3rd orange, 4th red)
        // Use actual data from HTML, or estimate from avg place as fallback
        let firstRate, secondRate, thirdRate, fourthRate;
        if (player.pos1Rate !== undefined && player.pos1Rate > 0) {
            // Real data from HTML
            firstRate = player.pos1Rate;
            secondRate = player.pos2Rate || 0;
            thirdRate = player.pos3Rate || 0;
            fourthRate = player.pos4Rate || 0;
        } else {
            // Fallback: estimate from average place
            const avgPlaceNum = parseFloat(player.avgPlace || player.averagePlace || 2.5);
            firstRate = Math.max(0, Math.min(50, 60 - (avgPlaceNum - 1) * 20));
            secondRate = Math.max(10, Math.min(35, 30 - (avgPlaceNum - 2) * 5));
            thirdRate = Math.max(10, Math.min(35, 25 + (avgPlaceNum - 2) * 5));
            fourthRate = Math.max(0, 100 - firstRate - secondRate - thirdRate);
        }
        
        entry.classList.add(`rank-tint-${rank.class}`);
        entry.innerHTML = `
            <div class="rank-position">${player.rank}</div>
            <div class="player">
                <span class="username profile-link" data-username="${player.name || player.playerName}">${player.name || player.playerName}</span>
            </div>
            <div class="rating">${player.elo || player.rating}</div>
            <div class="change ${player.latestChange >= 0 ? 'positive' : 'negative'}">
                ${player.latestChange >= 0 ? '+' : ''}${player.latestChange || 0}
            </div>
            <div class="last-active">${player.lastActive || 'Recently'}</div>
            <div class="matches">
                <div class="winrate-bar">
                    <div class="winrate-fill" style="width: 100%; background: linear-gradient(90deg, #10b981 0%, #10b981 ${Math.max(0, firstRate - 1)}%, #fcd34d ${firstRate + 1}%, #fcd34d ${Math.max(0, firstRate + secondRate - 1)}%, #f97316 ${firstRate + secondRate + 1}%, #f97316 ${Math.max(0, firstRate + secondRate + thirdRate - 1)}%, #ef4444 ${firstRate + secondRate + thirdRate + 1}%, #ef4444 100%);"></div>
                </div>
                <span class="matches-count">${player.numPlay || player.matches}</span>
            </div>
            <div class="percentage">${winrate}%</div>
            <div class="stat avg-place">${avgPlace}</div>
            <div class="score">${avgScore}</div>
            <div class="score high-score">${highScore}</div>
            <div class="kd">${kd}</div>
            <a href="/ranks" class="tier ${rank.class}">
                <img class="rank-icon" src="${rank.icon}" alt="${rank.name}" />
                <span class="rank-name">${rank.name}</span>
            </a>
        `;
        
        leaderboard.appendChild(entry);
    });
}

// Helper to show/hide region controls based on year
// 2023 doesn't have region filtering available
function updateRegionControlVisibility(year) {
    const regionControl = document.getElementById('region-control');
    if (regionControl) {
        if (year === '2023') {
            regionControl.style.display = 'none';
            // Reset to combined when switching to 2023
            currentRegion = 'combined';
            document.querySelectorAll('.region-btn').forEach(b => b.classList.remove('active'));
            document.querySelector('.region-btn[data-region="combined"]')?.classList.add('active');
        } else {
            regionControl.style.display = '';
        }
    }
}

// Season select dropdown functionality
const seasonSelect = document.getElementById('season-select');
if (seasonSelect) {
    seasonSelect.addEventListener('change', () => {
        currentTimePeriod = seasonSelect.value;

        // Update region visibility based on year
        updateRegionControlVisibility(currentTimePeriod);

        // Refetch data for the new year
        fetchPlayerData(currentTimePeriod, getCurrentGameMode(), currentRegion);
    });
    
    // Initialize visibility on page load
    updateRegionControlVisibility(currentTimePeriod);
}

// Region button functionality (works for all years now)
document.querySelectorAll('.region-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.region-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentRegion = btn.getAttribute('data-region');

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


    // No sample data - show real data or empty state
    if (allMatchesData.length === 0) {
        recentMatchesContainer.innerHTML = '<div style="text-align: center; padding: 1rem; color: var(--text-secondary);">No recent matches available</div>';
        return;
    }

    // Show recent matches from all data
    const recentMatches = allMatchesData.slice(0, 10);


    if (recentMatches.length === 0) {
        recentMatchesContainer.innerHTML = '<div style="text-align: center; padding: 1rem; color: var(--text-secondary);">No recent matches available</div>';
        return;
    }

    recentMatchesContainer.innerHTML = recentMatches.map(match => {
        // Get all unique teams from players
        const teamNames = [...new Set(match.players.map(p => p.team))];

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

    const matchHistoryOverlay = document.getElementById('match-history-overlay');
    const matchHistoryPanel = document.getElementById('match-history-panel');
    const matchHistoryList = document.getElementById('match-history-list');
    const matchHistoryButton = document.querySelector('.match-history-btn');
    const matchHistoryClose = document.querySelector('.match-history-close');
    const matchHistoryMore = document.querySelector('.match-history-more');
    let globalProgress = document.querySelector('.scroll-progress');

    const ensureProgressBar = (container, className) => {
        if (!container) return null;
        let bar = container.querySelector(`.${className}`);
        if (!bar) {
            bar = document.createElement('div');
            bar.className = className;
            bar.innerHTML = '<div class="scroll-progress-fill"></div>';
            container.appendChild(bar);
        }
        return bar;
    };

    const updateProgressFill = (container, fill, baseMultiplier = 0.6, growthMultiplier = 2.4) => {
        if (!container || !fill) return;
        const scrollable = container.scrollHeight - container.clientHeight;
        const ratio = scrollable > 0 ? container.scrollTop / scrollable : 0;
        const base = container.clientHeight * baseMultiplier;
        const height = base + container.clientHeight * growthMultiplier * ratio;
        fill.style.height = `${height}px`;
    };

    if (matchHistoryOverlay && matchHistoryPanel && matchHistoryList && matchHistoryButton) {
        matchHistoryOverlay.setAttribute('hidden', '');
        document.body.classList.remove('no-scroll');
        const matchHistoryProgress = ensureProgressBar(matchHistoryPanel, 'match-history-progress');
        const matchHistoryFill = matchHistoryProgress?.querySelector('.scroll-progress-fill');
        let matchHistoryData = [];
        let matchHistoryExpanded = false;

        const renderMatchHistory = () => {
            const list = matchHistoryExpanded ? matchHistoryData : matchHistoryData.slice(0, 10);
            renderMatchHistoryList(list, matchHistoryList);
            if (matchHistoryMore) {
                matchHistoryMore.style.display = matchHistoryData.length > 10 ? 'inline-flex' : 'none';
                matchHistoryMore.textContent = matchHistoryExpanded ? 'show less' : 'show more';
            }
        };

        const openMatchHistory = async () => {
            matchHistoryOverlay.removeAttribute('hidden');
            matchHistoryButton.setAttribute('aria-expanded', 'true');
            document.body.classList.add('no-scroll');

            if (!matchHistoryPanel.dataset.loaded) {
                matchHistoryList.innerHTML = `<div class="match-empty">loading matches...</div>`;
                try {
                    const matches = await fetchMatchHistory(1);
                    matchHistoryData = matches;
                    renderMatchHistory();
                    matchHistoryPanel.dataset.loaded = 'true';
                    updateProgressFill(matchHistoryList, matchHistoryFill);

                    matchHistoryList.querySelectorAll('.match-item').forEach((item) => {
                        const matchId = item.getAttribute('data-match-id');
                        const detailBody = item.querySelector('.match-detail-body');
                        if (!matchId || !detailBody) {
                            return;
                        }
                        fetchMatchDetails(matchId)
                            .then((details) => {
                                renderMatchDetails(detailBody, details);
                                item.dataset.loaded = 'true';
                            })
                            .catch(() => {
                                detailBody.innerHTML = `<div class="match-detail-loading">failed to load match details</div>`;
                            });
                    });
                } catch (error) {
                    matchHistoryList.innerHTML = `<div class="match-empty">failed to load matches</div>`;
                }
            }
        };

        const closeMatchHistory = () => {
            matchHistoryOverlay.setAttribute('hidden', '');
            matchHistoryButton.setAttribute('aria-expanded', 'false');
            document.body.classList.remove('no-scroll');
        };

        matchHistoryButton.addEventListener('click', () => {
            const isHidden = matchHistoryOverlay.hasAttribute('hidden');
            if (isHidden) {
                openMatchHistory();
            } else {
                closeMatchHistory();
            }
        });

        if (matchHistoryClose) {
            matchHistoryClose.addEventListener('click', closeMatchHistory);
        }

        if (matchHistoryMore) {
            matchHistoryMore.addEventListener('click', () => {
                matchHistoryExpanded = !matchHistoryExpanded;
                renderMatchHistory();
            });
        }

        matchHistoryOverlay.addEventListener('click', (event) => {
            if (event.target === matchHistoryOverlay) {
                closeMatchHistory();
            }
        });

        matchHistoryList.addEventListener('scroll', () => {
            updateProgressFill(matchHistoryList, matchHistoryFill);
        }, { passive: true });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && !matchHistoryOverlay.hasAttribute('hidden')) {
                closeMatchHistory();
            }
        });
    }

    const profileNameEl = document.getElementById('profile-name');
    const profileBody = document.getElementById('profile-body');
    const profileEloEl = document.getElementById('profile-elo');
    const profileRankNameEl = document.getElementById('profile-rank-name');
    const profileRankIconEl = document.getElementById('profile-rank-icon');
    const profileLastOnlineEl = document.getElementById('profile-last-online');
    const profileShareButton = document.getElementById('profile-share-btn');
    const profileCardOverlay = document.getElementById('profile-card-overlay');
    const profileCardModal = document.getElementById('profile-card-modal');
    const profileCardClose = document.querySelector('.profile-card-close');
    const profileShareCard = document.getElementById('profile-share-card');
    const profileShareName = document.getElementById('profile-share-name');
    const profileShareIcon = document.getElementById('profile-share-icon');
    const profileShareRankName = document.getElementById('profile-share-rank-name');
    const profileShareElo = document.getElementById('profile-share-elo');
    const profileShareWinrate = document.getElementById('profile-share-winrate');
    const profileShareKd = document.getElementById('profile-share-kd');
    const profileCardShare = document.getElementById('profile-card-share');
    // Profile season select
    const profileSeasonSelect = document.getElementById('profile-season-select');
    const profileLeaderboardRankEl = document.getElementById('profile-leaderboard-rank');
    const profileShareLeaderboardRank = document.getElementById('profile-share-leaderboard-rank');
    let currentProfileSeason = '2026';
    
    // Function to load player profile for a given season
    async function loadPlayerProfile(username, season) {
        if (!username || !profileBody) return;
        
        profileBody.innerHTML = `<div class="profile-loading">loading ${season} profile...</div>`;
        
        // Clear leaderboard rank while loading
        if (profileLeaderboardRankEl) profileLeaderboardRankEl.textContent = '';
        if (profileShareLeaderboardRank) profileShareLeaderboardRank.textContent = '—';
        
        try {
            // Fetch profile data and leaderboard rank in parallel
            const [response, leaderboardRank] = await Promise.all([
                fetch(getPlayerHistoryUrl(username, season)),
                getPlayerLeaderboardRank(username, season)
            ]);
            
            if (!response.ok) {
                throw new Error('failed to load profile');
            }
            const data = await response.json();
            window.profileMatches = data;
            
            // Display leaderboard rank
            if (leaderboardRank !== null) {
                if (profileLeaderboardRankEl) profileLeaderboardRankEl.textContent = `#${leaderboardRank}`;
                if (profileShareLeaderboardRank) profileShareLeaderboardRank.textContent = `#${leaderboardRank}`;
            } else {
                if (profileLeaderboardRankEl) profileLeaderboardRankEl.textContent = '';
                if (profileShareLeaderboardRank) profileShareLeaderboardRank.textContent = '—';
            }
            
            if (!Array.isArray(data) || data.length === 0) {
                profileBody.innerHTML = `<div class="profile-loading">no matches found for ${season}</div>`;
                // Clear stats for empty season
                if (profileEloEl) profileEloEl.textContent = '—';
                if (profileRankNameEl) profileRankNameEl.textContent = 'no data';
                return;
            }
            
            profileBody.innerHTML = renderPlayerProfile(username, data);
            const summary = getPlayerSummary(data, username);
            
            if (profileEloEl && profileRankNameEl && profileRankIconEl) {
                const sorted = [...data].sort((a, b) => new Date(b.name || b.date) - new Date(a.name || a.date));
                const latestMatch = sorted[0];
                
                if (profileLastOnlineEl) {
                    const latestTime = latestMatch?.name || latestMatch?.date;
                    profileLastOnlineEl.textContent = latestTime
                        ? `last online ${formatMatchTimestamp(latestTime)}`
                        : 'last online —';
                }
                
                const latestEntry = latestMatch?.players?.find((p) => p.player === username);
                const latestElo = latestEntry?.exitRating ?? latestEntry?.entryRating ?? null;
                
                if (latestElo !== null && latestElo !== undefined) {
                    profileEloEl.textContent = Math.round(latestElo);
                    const rankInfo = getRank(latestElo);
                    profileRankNameEl.textContent = rankInfo.name;
                    profileRankIconEl.src = rankInfo.icon;
                    profileRankIconEl.alt = rankInfo.name;
                    document.body.dataset.rank = rankInfo.name;
                    
                    if (profileShareCard && profileShareName && profileShareIcon && profileShareRankName && profileShareElo && profileShareKd) {
                        profileShareCard.dataset.rank = rankInfo.name;
                        profileShareName.textContent = username.toLowerCase();
                        profileShareIcon.src = rankInfo.icon;
                        profileShareIcon.alt = rankInfo.name;
                        profileShareRankName.textContent = rankInfo.name;
                        profileShareElo.textContent = Math.round(latestElo);
                        if (profileShareWinrate) profileShareWinrate.textContent = `${summary.winRate}%`;
                        profileShareKd.textContent = summary.averageKd;
                    }
                }
            }
        } catch (error) {
            profileBody.innerHTML = `<div class="profile-loading">failed to load player profile</div>`;
        }
    }
    
    if (profileNameEl && profileBody) {
        const params = new URLSearchParams(window.location.search);
        const username = params.get('user') || params.get('username');
        
        if (!username) {
            profileNameEl.textContent = 'unknown player';
            profileBody.innerHTML = `<div class="profile-loading">no player selected</div>`;
        } else {
            profileNameEl.textContent = username;
            profileBody.dataset.username = username;
            
            // Load initial profile
            loadPlayerProfile(username, currentProfileSeason);
            
            // Season dropdown change handler
            if (profileSeasonSelect) {
                profileSeasonSelect.addEventListener('change', () => {
                    currentProfileSeason = profileSeasonSelect.value;
                    loadPlayerProfile(username, currentProfileSeason);
                });
            }
        }
    }

    if (profileBody) {
        profileBody.addEventListener('click', (event) => {
            const button = event.target.closest('.profile-table-header button');
            if (!button || !window.profileMatches) return;
            const username = profileBody.dataset.username;
            const key = button.getAttribute('data-sort');
            if (!username || !key) return;
            if (profileSortConfig.key === key) {
                profileSortConfig.dir = profileSortConfig.dir === 'asc' ? 'desc' : 'asc';
            } else {
                profileSortConfig = { key, dir: 'desc' };
            }
            profileBody.innerHTML = renderPlayerProfile(username, window.profileMatches);
            bindProfileBreakdowns(profileBody);
        });
    }

    document.addEventListener('click', (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        const username = target.dataset.username;
        if (!username) return;
        window.location.href = `/profile?user=${encodeURIComponent(username)}`;
    });

    if (profileShareButton && profileCardOverlay && profileCardModal && profileShareCard) {
        const openCard = () => {
            profileCardOverlay.removeAttribute('hidden');
        };
        const closeCard = () => {
            profileCardOverlay.setAttribute('hidden', '');
            if (profileShareCard) {
                profileShareCard.style.transform = '';
            }
        };

        profileShareButton.addEventListener('click', openCard);

        if (profileCardClose) {
            profileCardClose.addEventListener('click', closeCard);
        }

        profileCardOverlay.addEventListener('click', (event) => {
            if (event.target === profileCardOverlay) {
                closeCard();
            }
        });

        profileShareCard.addEventListener('mousemove', (event) => {
            const rect = profileShareCard.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            const rotateX = ((y / rect.height) - 0.5) * -8;
            const rotateY = ((x / rect.width) - 0.5) * 8;
            profileShareCard.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });

        profileShareCard.addEventListener('mouseleave', () => {
            profileShareCard.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg)';
        });

        if (profileCardShare) {
            profileCardShare.addEventListener('click', async () => {
                const shareUrl = window.location.href;
                try {
                    await navigator.clipboard.writeText(shareUrl);
                    profileCardShare.textContent = 'link copied';
                } catch (error) {
                    profileCardShare.textContent = shareUrl;
                }
                setTimeout(() => {
                    profileCardShare.textContent = 'copy share link';
                }, 1200);
            });
        }
    }

    document.addEventListener('click', (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;
        
        // Handle profile breakdown toggle
        if (target.classList.contains('profile-breakdown-toggle')) {
            const card = target.closest('.profile-breakdown');
            if (!card) return;
            const isCollapsed = card.getAttribute('data-collapsed') === 'true';
            card.setAttribute('data-collapsed', isCollapsed ? 'false' : 'true');
            target.textContent = isCollapsed ? 'show less' : 'show more';
            return;
        }
        
        // Handle match history table toggle
        if (target.classList.contains('profile-table-toggle')) {
            const table = target.closest('.profile-table');
            if (!table) return;
            table.setAttribute('data-collapsed', 'false');
            return;
        }
    });

    if (!globalProgress) {
        globalProgress = document.createElement('div');
        globalProgress.className = 'scroll-progress';
        globalProgress.innerHTML = '<div class="scroll-progress-fill"></div>';
        document.body.appendChild(globalProgress);
    }
    const globalFill = globalProgress.querySelector('.scroll-progress-fill');
    const updateGlobalProgress = () => {
        updateProgressFill(document.documentElement, globalFill);
    };
    updateGlobalProgress();
    window.addEventListener('scroll', updateGlobalProgress, { passive: true });
    window.addEventListener('resize', updateGlobalProgress);
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
            videoUrl: `assets/mazes/${difficulty}/${i}.webm`,
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
        video.play().catch(() => {});
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
        return false;
    }
}
