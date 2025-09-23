# RETROCYCLES Leaderboard Demo

A comprehensive leaderboard application for the RETROCYCLES game that displays real-time player statistics, match history, and rankings with advanced filtering capabilities.

## 📋 Table of Contents

- [Overview](#overview)
- [Technical Architecture](#technical-architecture)
- [Project Structure](#project-structure)
- [API Integration](#api-integration)
- [Data Models](#data-models)
- [Core Functionality](#core-functionality)
- [Configuration](#configuration)
- [Development Setup](#development-setup)
- [CORS Handling](#cors-handling)
- [Error Handling](#error-handling)
- [Performance Considerations](#performance-considerations)
- [Deployment](#deployment)

## 🎯 Overview

The RETROCYCLES Leaderboard Demo is a vanilla JavaScript web application that provides real-time access to player statistics and match data from the RETROCYCLES gaming platform. It features a responsive dark-themed interface with comprehensive filtering options and real-time data visualization.

### Key Features

- **Real-time Player Data**: Fetches live statistics from official APIs
- **Advanced Filtering**: Filter by time period (Monthly/Seasonal/All-time) and region (US/EU/Combined)
- **Match History**: Displays recent match results with team compositions
- **Responsive Design**: Dark theme with mobile-friendly layout
- **Loading States**: Visual feedback during data fetching operations
- **Performance Optimized**: Efficient rendering of 260+ players

## 🏗️ Technical Architecture

### Technology Stack

- **Frontend**: Vanilla JavaScript (ES6+)
- **Styling**: Pure CSS with CSS Grid and Flexbox
- **Data Fetching**: Fetch API with CORS proxy support
- **Development**: Python HTTP server (localhost:8000)
- **Version Control**: Git-ready structure

### Architecture Pattern

The application follows a **modular vanilla JS architecture** with clear separation of concerns:

```
┌─────────────────┐
│   index.html    │ ← Main HTML structure
├─────────────────┤
│   styles.css    │ ← CSS styling and animations
├─────────────────┤
│   script.js     │ ← Core application logic
└─────────────────┘
```

## 📁 Project Structure

```
retrocycles-leaderboard/
├── public/             # Static assets served by web server
│   ├── index.html      # Main HTML file with semantic structure
│   ├── styles.css      # Comprehensive CSS styling
│   └── assets/         # Static assets directory
│       └── rank-icons/ # Player rank tier icons
│           ├── bronze.svg
│           ├── silver.svg
│           ├── gold.svg
│           ├── platinum.svg
│           ├── master.svg
│           ├── grandmaster.svg
│           └── diamond-amethyst-9.svg
├── src/                # Source code directory
│   └── script.js       # Core application logic
├── .gitignore          # Git ignore configuration
├── package.json        # Project metadata and scripts
├── vercel.json         # Vercel deployment configuration
└── README.md           # This documentation file
```

### File Responsibilities

#### `public/index.html`
- Semantic HTML5 structure
- Accessibility features
- Loading containers for dynamic content
- Filter controls and navigation
- Dark theme default (`data-theme="dark"`)

#### `public/styles.css`
- CSS Grid layout system
- Dark theme color scheme
- Responsive design patterns
- Loading animations and transitions
- Component-specific styling

#### `src/script.js`
- API integration logic
- Data processing and transformation
- DOM manipulation and rendering
- Event handling and state management
- Error handling and fallbacks

#### `public/assets/rank-icons/`
- Player rank tier visual indicators
- SVG icons for bronze, silver, gold, platinum, master, grandmaster, diamond
- PNG fallbacks for compatibility

## 🔌 API Integration

### Primary Data Sources

#### Player Statistics API
```javascript
const PLAYER_API_URL = "https://corsproxy.io/?" +
    encodeURIComponent("https://www.armanelgtron.tk/tststats/api.php?type=history");
```

**Data Structure:**
```json
{
  "rank": 1,
  "name": "apple",
  "elo": 2340,
  "latestChange": 2,
  "numPlay": 393,
  "winrate": 0.75,
  "avgPlace": 1.5,
  "avgScore": 568,
  "highScore": 1050,
  "kd": 1.97,
  "netPoints": 982
}
```

#### Match History API
```javascript
const MATCHES_API_URL = "https://corsproxy.io/?" +
    encodeURIComponent("https://rankings.trontimes.tk/api.php?id=tst&type=history");
```

**Data Structure:**
```json
{
  "matchName": "2025-09-21T20:00:27.209Z",
  "players": [
    {
      "name": "Player1",
      "team": "Team Red",
      "score": 100
    }
  ]
}
```

### CORS Proxy Configuration

The application uses **corsproxy.io** to handle Cross-Origin Resource Sharing:

```javascript
const CORS_PROXY = "https://corsproxy.io/?";
const USE_CORS_PROXY = true;

const API_ENDPOINTS = {
    PLAYER_DATA: "https://www.armanelgtron.tk/tststats/api.php?type=history",
    MATCH_DATA: "https://rankings.trontimes.tk/api.php?id=tst&type=history"
};
```

## 📊 Data Models

### Player Data Model

```javascript
interface Player {
    // Core ranking data
    rank: number;
    name: string;
    elo: number;
    latestChange: number;

    // Performance statistics
    numPlay: number;
    winrate: number;
    avgPlace: number;
    avgScore: number;
    highScore: number;
    kd: number;
    netPoints: number;

    // Enhanced fields (added by application)
    lastActiveDays: number;
    region: string;
    delta30d: number;
}
```

### Match Data Model

```javascript
interface Match {
    matchName: string;      // ISO timestamp
    players: Array<{        // Array of 8 players
        name: string;
        team: string;
        score: number;
    }>;
}
```

### Application State

```javascript
interface AppState {
    allPlayersData: Player[];
    allMatchesData: Match[];
    currentTimePeriod: 'monthly' | 'seasonal' | 'alltime';
    currentRegion: 'us' | 'eu' | 'combined';
    isLoading: boolean;
}
```

## ⚙️ Core Functionality

### Data Fetching

#### `fetchPlayerData()`
- Fetches player statistics from primary API
- Processes and enhances data with simulated fields
- Handles real vs. simulated data detection
- Updates global `allPlayersData` state

#### `fetchMatchesData()`
- Fetches recent match history
- Processes match data for display
- Updates global `allMatchesData` state

### Data Processing

#### `enhancePlayerData(players)`
```javascript
// Adds computed fields to raw API data
players.forEach(player => {
    // Real field detection
    player.lastActiveDays = detectRealDates(player);
    player.region = detectRealRegions(player);
    player.latestChange = detectRealChanges(player);
    player.delta30d = detectRealDeltas(player);

    // Fallback simulations if real data not available
    if (!player.lastActiveDays) {
        player.lastActiveDays = simulateActivity(player.elo);
    }
});
```

#### `filterPlayersByTimePeriod(players, period)`
```javascript
switch(period) {
    case 'monthly':
        return players.filter(p => p.lastActiveDays <= 30);
    case 'seasonal':
        return players.filter(p => p.lastActiveDays <= 90);
    case 'alltime':
        return players; // No filtering
}
```

#### `filterPlayersByRegion(players, region)`
```javascript
switch(region) {
    case 'us':
        return players.filter(p => p.region === 'US');
    case 'eu':
        return players.filter(p => p.region === 'EU');
    case 'combined':
        return players; // No filtering
}
```

### Rendering Engine

#### `renderLeaderboard()`
- Applies current filters to player data
- Generates HTML for leaderboard entries
- Handles loading states
- Updates DOM with new content

#### `renderRecentMatches()`
- Processes and displays recent matches
- Formats match data for readability
- Handles match detail expansion

### Event System

```javascript
// Time period filter buttons
document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        updateTimePeriod(e.target.dataset.period);
        renderLeaderboard();
    });
});

// Region filter buttons
document.querySelectorAll('.region-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        updateRegion(e.target.dataset.region);
        renderLeaderboard();
    });
});

// Advanced stats toggle
document.getElementById('advanced-stats').addEventListener('change', (e) => {
    document.querySelector('.leaderboard-wrapper').classList.toggle('simple-mode');
});
```

## 🎨 Configuration

### Theme Settings

```html
<!-- Default dark theme -->
<html data-theme="dark">

<!-- Available themes: dark, light -->
```

### Filter Configuration

```javascript
const TIME_PERIODS = {
    monthly: { label: 'Monthly', maxDays: 30 },
    seasonal: { label: 'Seasonal', maxDays: 90 },
    alltime: { label: 'All Time', maxDays: Infinity }
};

const REGIONS = {
    us: { label: 'US', filter: 'US' },
    eu: { label: 'EU', filter: 'EU' },
    combined: { label: 'Combined', filter: null }
};
```

### Display Settings

```css
:root {
    --primary-bg: #0f0f0f;
    --secondary-bg: #1a1a1a;
    --text-primary: #ffffff;
    --text-secondary: #a0a0a0;
    --accent-green: #10b981;
    --accent-yellow: #f59e0b;
    --accent-orange: #fb923c;
    --accent-red: #ef4444;
}
```

## 🚀 Development Setup

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- Python 3.x (for local development server)
- Git (optional, for version control)

### Local Development

1. **Clone or download the project**
   ```bash
   # Navigate to project directory
   cd retrocycles-leaderboard

   # Or download and extract the project files
   ```

2. **Start local development server**
   ```bash
   # From project root directory, serve the public folder
   python -m http.server 8000 --directory public

   # Alternative: Navigate to public and serve from there
   cd public && python -m http.server 8000
   ```

3. **Access the application**
   ```
   http://localhost:8000
   ```

4. **Development workflow**
   ```bash
   # Edit source files
   # - src/script.js (for functionality)
   # - public/styles.css (for styling)
   # - public/index.html (for structure)

   # Refresh browser to see changes
   # Check browser console for errors
   # Verify filtering functionality
   ```

### Troubleshooting

#### Common Issues

**CORS Errors**
```bash
# Solution: Ensure running from HTTP server
python -m http.server 8000
# Then access: http://localhost:8000
```

**API Rate Limiting**
- Implement exponential backoff
- Add retry logic with increasing delays
- Cache responses to reduce API calls

**Missing Assets**
- Verify all rank icons are in `public/assets/rank-icons/`
- Check browser console for 404 errors
- Ensure proper file extensions (.svg, .png)

**Path Resolution Issues**
- Use `python -m http.server 8000 --directory public` from project root
- Ensure script path is `/src/script.js` (absolute from server root)
- Check browser Network tab for failed requests
- Verify all file paths in HTML match the new structure

3. **Debug API issues**
   - Check Network tab for failed requests
   - Verify CORS proxy functionality
   - Monitor console logs for data processing

## 🌐 CORS Handling

### CORS Challenge

The application faces CORS restrictions when accessing external APIs directly from `file://` or `http://localhost:8000` origins.

### Solution Strategy

#### Primary CORS Proxy
```javascript
const CORS_PROXY = "https://corsproxy.io/?";
const USE_CORS_PROXY = true;

// Usage
const proxiedUrl = CORS_PROXY + encodeURIComponent(targetUrl);
```

#### Fallback Proxies
```javascript
const FALLBACK_PROXIES = [
    "https://cors-anywhere.herokuapp.com/",
    "https://api.allorigins.win/raw?url=",
    "https://corsproxy.io/?"
];
```

#### Error Handling
```javascript
async function fetchWithCORS(url, options = {}) {
    const proxiedUrl = CORS_PROXY + encodeURIComponent(url);

    try {
        const response = await fetch(proxiedUrl, options);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('CORS fetch failed:', error);
        // Attempt fallback proxies
        for (const proxy of FALLBACK_PROXIES) {
            try {
                const fallbackUrl = proxy + encodeURIComponent(url);
                const response = await fetch(fallbackUrl, options);
                if (response.ok) return await response.json();
            } catch (e) {
                continue;
            }
        }
        throw new Error('All CORS proxies failed');
    }
}
```

## ⚠️ Error Handling

### API Error Handling

```javascript
async function fetchPlayerData() {
    try {
        const response = await fetch(PLAYER_API_URL);
        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error('Invalid API response format');
        }

        allPlayersData = data;
        renderLeaderboard();

    } catch (error) {
        console.error('Error fetching player data:', error);

        // Graceful degradation
        document.getElementById('leaderboard').innerHTML = `
            <div class="loading-container">
                <div class="loading-text" style="color: var(--text-secondary);">
                    Failed to load leaderboard. Check connection.
                </div>
            </div>
        `;
    }
}
```

### Data Validation

```javascript
function validatePlayerData(player) {
    const requiredFields = ['name', 'elo', 'rank'];
    const missingFields = requiredFields.filter(field => !player[field]);

    if (missingFields.length > 0) {
        console.warn(`Player missing required fields: ${missingFields.join(', ')}`);
    }

    return missingFields.length === 0;
}
```

### Loading States

```javascript
function showLoadingState(containerId, message = 'Loading...') {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
        <div class="loading-container">
            <div class="loading-text">
                ${message}<span class="loading-dots">
                    <span>.</span><span>.</span><span>.</span>
                </span>
            </div>
        </div>
    `;
}
```

## ⚡ Performance Considerations

### Rendering Optimization

#### Virtual Scrolling (Not Implemented)
- For 260+ players, consider implementing virtual scrolling
- Only render visible rows to improve performance

#### Efficient DOM Updates
```javascript
// Batch DOM updates
function renderLeaderboard() {
    const container = document.getElementById('leaderboard');
    const fragment = document.createDocumentFragment();

    // Create all elements in fragment first
    filteredPlayers.forEach(player => {
        const entry = createPlayerEntry(player);
        fragment.appendChild(entry);
    });

    // Single DOM update
    container.innerHTML = '';
    container.appendChild(fragment);
}
```

### Memory Management

#### Data Cleanup
```javascript
function cleanup() {
    // Clear large data structures when not needed
    if (allPlayersData.length > 1000) {
        allPlayersData = [];
    }
}
```

#### Event Listener Cleanup
```javascript
function removeEventListeners() {
    // Remove all event listeners before re-rendering
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.removeEventListener('click', handleFilterChange);
    });
}
```

### Caching Strategy

#### API Response Caching
```javascript
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cache = new Map();

async function fetchWithCache(url, cacheKey) {
    if (cache.has(cacheKey)) {
        const { data, timestamp } = cache.get(cacheKey);
        if (Date.now() - timestamp < CACHE_DURATION) {
            return data;
        }
    }

    const data = await fetch(url);
    cache.set(cacheKey, { data, timestamp: Date.now() });
    return data;
}
```

## 🚀 Deployment

### Production Considerations

#### HTTPS Requirement
- APIs require secure context for CORS
- Deploy to HTTPS-enabled hosting

#### Recommended Hosting Platforms
- **Vercel**: Zero-config deployment
- **Netlify**: Static site hosting
- **GitHub Pages**: Free hosting with custom domains

### Environment Configuration

#### Production API URLs
```javascript
const PRODUCTION_CONFIG = {
    CORS_PROXY: "https://corsproxy.io/?",
    PLAYER_API: "https://www.armanelgtron.tk/tststats/api.php?type=history",
    MATCH_API: "https://rankings.trontimes.tk/api.php?id=tst&type=history"
};
```

#### Build Process
```bash
# For production build (if needed)
# 1. Minify CSS and JS
# 2. Optimize images
# 3. Add cache headers
# 4. Configure CDN
```

### Monitoring and Analytics

#### Error Tracking
```javascript
// Add error tracking in production
window.addEventListener('error', (event) => {
    // Send error to tracking service
    console.error('Runtime error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    // Send unhandled promise rejection to tracking
    console.error('Unhandled promise rejection:', event.reason);
});
```

## 🔧 Troubleshooting

### Common Issues

#### CORS Errors
```bash
# Solution: Ensure running from HTTP server
python -m http.server 8000
# Then access: http://localhost:8000
```

#### API Rate Limiting
- Implement exponential backoff
- Add retry logic with increasing delays
- Cache responses to reduce API calls

#### Large Dataset Performance
- Consider pagination for large player lists
- Implement search functionality
- Add sorting options

### Debug Mode

Enable debug logging:
```javascript
const DEBUG_MODE = true;

if (DEBUG_MODE) {
    console.log('Player Data:', allPlayersData);
    console.log('Match Data:', allMatchesData);
    console.log('Current Filters:', { currentTimePeriod, currentRegion });
}
```

## 📈 Future Enhancements

### Planned Features

1. **Real-time Updates**: WebSocket integration for live data
2. **Search Functionality**: Player name search
3. **Sorting Options**: Sort by various metrics
4. **Charts and Graphs**: Visual data representation
5. **Mobile App**: Progressive Web App (PWA)
6. **Internationalization**: Multi-language support

### Technical Improvements

1. **TypeScript Migration**: Add type safety
2. **Component Architecture**: Modular component system
3. **State Management**: Centralized state with Redux/Context
4. **Testing Suite**: Unit and integration tests
5. **CI/CD Pipeline**: Automated testing and deployment

---

## 📞 Support

For technical issues or questions about this codebase:

1. Check the browser console for error messages
2. Verify API endpoints are accessible
3. Ensure CORS proxy is functioning
4. Review network tab for failed requests
5. Check data structure against expected models

**Development Server**: `http://localhost:8000`
**Production URL**: `https://your-domain.com/leaderboard-demo`

---

*This documentation provides comprehensive technical context for any developer working on the RETROCYCLES Leaderboard Demo project.*
