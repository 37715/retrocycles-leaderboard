// Leaderboard data - manually entered from the provided image
const leaderboardData = {
    alltime: [
        { rank: 1, username: "ellis", flag: "gb", rating: 2500, change: "+50", changeType: "positive", lastActive: "14 hours ago", delta: "+50", deltaType: "positive", matches: 273, winRate: 85, avgPlace: 1.2, alive: 85, netPoints: 1500, avgScore: 750, highScore: 1200, kd: 3.5 },
        { rank: 2, username: "koala", flag: "de", rating: 2377, change: "+2", changeType: "positive", lastActive: "19 hours ago", delta: "0", deltaType: "neutral", matches: 210, winRate: 75, avgPlace: 1.5, alive: 75, netPoints: 952, avgScore: 628, highScore: 1050, kd: 1.98 },
        { rank: 3, username: "Ninja Potato", flag: "de", rating: 2320, change: "+1", changeType: "positive", lastActive: "5 days ago", delta: "-2", deltaType: "negative", matches: 55, winRate: 74, avgPlace: 1.7, alive: 74, netPoints: 817, avgScore: 591, highScore: 840, kd: 1.9 },
        { rank: 4, username: "N", flag: "us", rating: 2278, change: "+1", changeType: "positive", lastActive: "2 weeks ago", delta: "-3", deltaType: "negative", matches: 68, winRate: 76, avgPlace: 1.9, alive: 76, netPoints: 994, avgScore: 649, highScore: 1020, kd: 1.93 },
        { rank: 5, username: "Ampz", flag: "us", rating: 2264, change: "+4", changeType: "positive", lastActive: "6 months ago", delta: "0", deltaType: "neutral", matches: 13, winRate: 80, avgPlace: 1.3, alive: 80, netPoints: 1167, avgScore: 662, highScore: 900, kd: 2.67 },
        { rank: 6, username: "rookie", flag: "us", rating: 2210, change: "-1", changeType: "negative", lastActive: "1 month ago", delta: "0", deltaType: "neutral", matches: 63, winRate: 75, avgPlace: 1.9, alive: 75, netPoints: 875, avgScore: 569, highScore: 1020, kd: 1.97 },
        { rank: 7, username: "Nelg", flag: "us", rating: 2208, change: "0", changeType: "neutral", lastActive: "5 days ago", delta: "+11", deltaType: "positive", matches: 63, winRate: 73, avgPlace: 2.0, alive: 73, netPoints: 693, avgScore: 487, highScore: 870, kd: 1.42 },
        { rank: 8, username: "Gazelle", flag: "us", rating: 2201, change: "+6", changeType: "positive", lastActive: "5 months ago", delta: "0", deltaType: "neutral", matches: 15, winRate: 68, avgPlace: 1.7, alive: 68, netPoints: 698, avgScore: 535, highScore: 810, kd: 1.75 },
        { rank: 9, username: "Magi", flag: "us", rating: 2179, change: "-5", changeType: "negative", lastActive: "7 months ago", delta: "0", deltaType: "neutral", matches: 52, winRate: 70, avgPlace: 2.0, alive: 70, netPoints: 732, avgScore: 584, highScore: 960, kd: 1.57 },
        { rank: 10, username: "apple", flag: "us", rating: 2177, change: "0", changeType: "neutral", lastActive: "4 days ago", delta: "+90", deltaType: "positive", matches: 16, winRate: 72, avgPlace: 1.6, alive: 72, netPoints: 1101, avgScore: 647, highScore: 960, kd: 2.14 },
        { rank: 11, username: "olive", flag: "de", rating: 2145, change: "0", changeType: "neutral", lastActive: "1 day ago", delta: "+10", deltaType: "positive", matches: 90, winRate: 62, avgPlace: 2.1, alive: 62, netPoints: 650, avgScore: 548, highScore: 970, kd: 1.5 },
        { rank: 12, username: "NoBrain", flag: "de", rating: 2134, change: "+12", changeType: "positive", lastActive: "11 months ago", delta: "0", deltaType: "neutral", matches: 37, winRate: 73, avgPlace: 2.0, alive: 73, netPoints: 734, avgScore: 514, highScore: 870, kd: 1.53 },
        { rank: 13, username: "ppotter", flag: "gb", rating: 2118, change: "0", changeType: "neutral", lastActive: "4 months ago", delta: "0", deltaType: "neutral", matches: 108, winRate: 68, avgPlace: 2.3, alive: 68, netPoints: 638, avgScore: 538, highScore: 990, kd: 1.43 },
        { rank: 14, username: "parentala...", flag: "", rating: 2118, change: "-14", changeType: "negative", lastActive: "12 months ago", delta: "0", deltaType: "neutral", matches: 23, winRate: 70, avgPlace: 1.8, alive: 70, netPoints: 757, avgScore: 570, highScore: 850, kd: 1.72 },
        { rank: 15, username: "Nate", flag: "de", rating: 2113, change: "+4", changeType: "positive", lastActive: "6 days ago", delta: "+4", deltaType: "positive", matches: 90, winRate: 67, avgPlace: 2.1, alive: 67, netPoints: 652, avgScore: 553, highScore: 1020, kd: 1.49 },
        { rank: 16, username: "doov", flag: "us", rating: 2100, change: "-27", changeType: "negative", lastActive: "1 month ago", delta: "0", deltaType: "neutral", matches: 17, winRate: 64, avgPlace: 1.6, alive: 64, netPoints: 483, avgScore: 488, highScore: 930, kd: 1.26 },
        { rank: 17, username: "dgm", flag: "us", rating: 2089, change: "+28", changeType: "positive", lastActive: "10 months ago", delta: "0", deltaType: "neutral", matches: 14, winRate: 72, avgPlace: 2.2, alive: 72, netPoints: 662, avgScore: 470, highScore: 660, kd: 1.53 },
        { rank: 18, username: "Johnny", flag: "us", rating: 2087, change: "+5", changeType: "positive", lastActive: "14 hours ago", delta: "+11", deltaType: "positive", matches: 65, winRate: 66, avgPlace: 2.3, alive: 66, netPoints: 568, avgScore: 494, highScore: 810, kd: 1.26 },
        { rank: 19, username: "Andrei", flag: "gb", rating: 2086, change: "+4", changeType: "positive", lastActive: "14 hours ago", delta: "+5", deltaType: "positive", matches: 154, winRate: 65, avgPlace: 2.4, alive: 65, netPoints: 551, avgScore: 458, highScore: 900, kd: 1.25 },
        { rank: 20, username: "Nanu", flag: "us", rating: 2083, change: "-4", changeType: "negative", lastActive: "4 months ago", delta: "0", deltaType: "neutral", matches: 49, winRate: 64, avgPlace: 2.3, alive: 64, netPoints: 581, avgScore: 496, highScore: 820, kd: 1.37 },
        { rank: 21, username: "pizza", flag: "us", rating: 2083, change: "+2", changeType: "positive", lastActive: "19 hours ago", delta: "-4", deltaType: "negative", matches: 129, winRate: 63, avgPlace: 2.3, alive: 63, netPoints: 534, avgScore: 498, highScore: 870, kd: 1.34 },
        { rank: 22, username: "Sanity", flag: "us", rating: 2072, change: "-3", changeType: "negative", lastActive: "1 day ago", delta: "+5", deltaType: "positive", matches: 216, winRate: 61, avgPlace: 2.4, alive: 61, netPoints: 469, avgScore: 461, highScore: 850, kd: 1.19 },
        { rank: 23, username: "Cadillac", flag: "us", rating: 2068, change: "-4", changeType: "negative", lastActive: "2 days ago", delta: "-9", deltaType: "negative", matches: 106, winRate: 60, avgPlace: 2.3, alive: 60, netPoints: 521, avgScore: 472, highScore: 840, kd: 1.24 },
        { rank: 24, username: "Illusion", flag: "us", rating: 2029, change: "+1", changeType: "positive", lastActive: "2 days ago", delta: "+1", deltaType: "positive", matches: 81, winRate: 65, avgPlace: 2.5, alive: 65, netPoints: 478, avgScore: 421, highScore: 810, kd: 1.15 },
        { rank: 25, username: "M3l0n", flag: "gb", rating: 2027, change: "-4", changeType: "negative", lastActive: "14 hours ago", delta: "-3", deltaType: "negative", matches: 262, winRate: 63, avgPlace: 2.3, alive: 63, netPoints: 432, avgScore: 428, highScore: 990, kd: 1.09 },
        { rank: 26, username: "waffle", flag: "us", rating: 2016, change: "+28", changeType: "positive", lastActive: "10 months ago", delta: "0", deltaType: "neutral", matches: 4, winRate: 71, avgPlace: 1.5, alive: 71, netPoints: 636, avgScore: 475, highScore: 520, kd: 1.52 },
        { rank: 27, username: "Noodles", flag: "au", rating: 2011, change: "+2", changeType: "positive", lastActive: "3 weeks ago", delta: "+38", deltaType: "positive", matches: 9, winRate: 74, avgPlace: 2.1, alive: 74, netPoints: 578, avgScore: 426, highScore: 720, kd: 1.2 },
        { rank: 28, username: "Cookie", flag: "us", rating: 2009, change: "-4", changeType: "negative", lastActive: "2 days ago", delta: "-2", deltaType: "negative", matches: 91, winRate: 67, avgPlace: 2.4, alive: 67, netPoints: 542, avgScore: 464, highScore: 900, kd: 1.23 },
        { rank: 29, username: "Rudycant...", flag: "ca", rating: 2006, change: "-6", changeType: "negative", lastActive: "3 months ago", delta: "0", deltaType: "neutral", matches: 54, winRate: 64, avgPlace: 2.5, alive: 64, netPoints: 431, avgScore: 428, highScore: 750, kd: 1.11 },
        { rank: 30, username: "Force", flag: "us", rating: 1995, change: "-13", changeType: "negative", lastActive: "4 months ago", delta: "0", deltaType: "neutral", matches: 15, winRate: 59, avgPlace: 2.1, alive: 59, netPoints: 359, avgScore: 445, highScore: 730, kd: 1.05 },
        { rank: 31, username: "jZ", flag: "us", rating: 1979, change: "-2", changeType: "negative", lastActive: "5 weeks ago", delta: "-2", deltaType: "negative", matches: 74, winRate: 65, avgPlace: 2.4, alive: 65, netPoints: 352, avgScore: 396, highScore: 850, kd: 1.04 }
    ],
    seasonal: [
        // Sample seasonal data - showing top performers this season
        { rank: 1, username: "ellis", flag: "gb", rating: 2500, change: "+100", changeType: "positive", lastActive: "14 hours ago", delta: "+100", deltaType: "positive", matches: 273, winRate: 85, avgPlace: 1.2, alive: 85, netPoints: 1500, avgScore: 750, highScore: 1200, kd: 3.5 },
        { rank: 2, username: "apple", flag: "us", rating: 2177, change: "+90", changeType: "positive", lastActive: "4 days ago", delta: "+90", deltaType: "positive", matches: 16, winRate: 72, avgPlace: 1.6, alive: 72, netPoints: 1101, avgScore: 647, highScore: 960, kd: 2.14 },
        { rank: 2, username: "Noodles", flag: "au", rating: 2011, change: "+38", changeType: "positive", lastActive: "3 weeks ago", delta: "+38", deltaType: "positive", matches: 9, winRate: 74, avgPlace: 2.1, alive: 74, netPoints: 578, avgScore: 426, highScore: 720, kd: 1.2 },
        { rank: 3, username: "dgm", flag: "us", rating: 2089, change: "+28", changeType: "positive", lastActive: "10 months ago", delta: "+28", deltaType: "positive", matches: 14, winRate: 72, avgPlace: 2.2, alive: 72, netPoints: 662, avgScore: 470, highScore: 660, kd: 1.53 },
        { rank: 4, username: "waffle", flag: "us", rating: 2016, change: "+28", changeType: "positive", lastActive: "10 months ago", delta: "+28", deltaType: "positive", matches: 4, winRate: 71, avgPlace: 1.5, alive: 71, netPoints: 636, avgScore: 475, highScore: 520, kd: 1.52 },
        { rank: 5, username: "ellis", flag: "gb", rating: 2186, change: "+18", changeType: "positive", lastActive: "14 hours ago", delta: "+18", deltaType: "positive", matches: 273, winRate: 70, avgPlace: 2.0, alive: 70, netPoints: 765, avgScore: 528, highScore: 990, kd: 1.59 },
        { rank: 6, username: "NoBrain", flag: "de", rating: 2134, change: "+12", changeType: "positive", lastActive: "11 months ago", delta: "+12", deltaType: "positive", matches: 37, winRate: 73, avgPlace: 2.0, alive: 73, netPoints: 734, avgScore: 514, highScore: 870, kd: 1.53 },
        { rank: 7, username: "Nelg", flag: "us", rating: 2208, change: "+11", changeType: "positive", lastActive: "5 days ago", delta: "+11", deltaType: "positive", matches: 63, winRate: 73, avgPlace: 2.0, alive: 73, netPoints: 693, avgScore: 487, highScore: 870, kd: 1.42 },
        { rank: 8, username: "Johnny", flag: "us", rating: 2087, change: "+11", changeType: "positive", lastActive: "14 hours ago", delta: "+11", deltaType: "positive", matches: 65, winRate: 66, avgPlace: 2.3, alive: 66, netPoints: 568, avgScore: 494, highScore: 810, kd: 1.26 },
        { rank: 9, username: "olive", flag: "de", rating: 2145, change: "+10", changeType: "positive", lastActive: "1 day ago", delta: "+10", deltaType: "positive", matches: 90, winRate: 62, avgPlace: 2.1, alive: 62, netPoints: 650, avgScore: 548, highScore: 970, kd: 1.5 },
        { rank: 10, username: "Gazelle", flag: "us", rating: 2201, change: "+6", changeType: "positive", lastActive: "5 months ago", delta: "+6", deltaType: "positive", matches: 15, winRate: 68, avgPlace: 1.7, alive: 68, netPoints: 698, avgScore: 535, highScore: 810, kd: 1.75 }
    ],
    monthly: [
        // Sample monthly data - showing this month's top performers
        { rank: 1, username: "ellis", flag: "gb", rating: 2500, change: "+75", changeType: "positive", lastActive: "14 hours ago", delta: "+75", deltaType: "positive", matches: 273, winRate: 85, avgPlace: 1.2, alive: 85, netPoints: 1500, avgScore: 750, highScore: 1200, kd: 3.5 },
        { rank: 2, username: "Johnny", flag: "us", rating: 2087, change: "+11", changeType: "positive", lastActive: "14 hours ago", delta: "+11", deltaType: "positive", matches: 65, winRate: 66, avgPlace: 2.3, alive: 66, netPoints: 568, avgScore: 494, highScore: 810, kd: 1.26 },
        { rank: 3, username: "olive", flag: "de", rating: 2145, change: "+10", changeType: "positive", lastActive: "1 day ago", delta: "+10", deltaType: "positive", matches: 90, winRate: 62, avgPlace: 2.1, alive: 62, netPoints: 650, avgScore: 548, highScore: 970, kd: 1.5 },
        { rank: 4, username: "Sanity", flag: "us", rating: 2072, change: "+5", changeType: "positive", lastActive: "1 day ago", delta: "+5", deltaType: "positive", matches: 216, winRate: 61, avgPlace: 2.4, alive: 61, netPoints: 469, avgScore: 461, highScore: 850, kd: 1.19 },
        { rank: 5, username: "Andrei", flag: "gb", rating: 2086, change: "+5", changeType: "positive", lastActive: "14 hours ago", delta: "+5", deltaType: "positive", matches: 154, winRate: 65, avgPlace: 2.4, alive: 65, netPoints: 551, avgScore: 458, highScore: 900, kd: 1.25 },
        { rank: 6, username: "Nate", flag: "de", rating: 2113, change: "+4", changeType: "positive", lastActive: "6 days ago", delta: "+4", deltaType: "positive", matches: 90, winRate: 67, avgPlace: 2.1, alive: 67, netPoints: 652, avgScore: 553, highScore: 1020, kd: 1.49 },
        { rank: 7, username: "koala", flag: "de", rating: 2377, change: "+2", changeType: "positive", lastActive: "19 hours ago", delta: "+2", deltaType: "positive", matches: 210, winRate: 75, avgPlace: 1.5, alive: 75, netPoints: 952, avgScore: 628, highScore: 1050, kd: 1.98 },
        { rank: 8, username: "pizza", flag: "us", rating: 2083, change: "+2", changeType: "positive", lastActive: "19 hours ago", delta: "+2", deltaType: "positive", matches: 129, winRate: 63, avgPlace: 2.3, alive: 63, netPoints: 534, avgScore: 498, highScore: 870, kd: 1.34 },
        { rank: 9, username: "Illusion", flag: "us", rating: 2029, change: "+1", changeType: "positive", lastActive: "2 days ago", delta: "+1", deltaType: "positive", matches: 81, winRate: 65, avgPlace: 2.5, alive: 65, netPoints: 478, avgScore: 421, highScore: 810, kd: 1.15 },
        { rank: 10, username: "Ninja Potato", flag: "de", rating: 2320, change: "+1", changeType: "positive", lastActive: "5 days ago", delta: "+1", deltaType: "positive", matches: 55, winRate: 74, avgPlace: 1.7, alive: 74, netPoints: 817, avgScore: 591, highScore: 840, kd: 1.9 }
    ]
};

let currentPeriod = 'alltime';
let currentRegion = 'combined';
let currentSort = 'normal';
let currentScoreTab = 'scores';

// Region filtering logic
const regionFilters = {
    'combined': () => true,
    'us': (player) => player.flag === 'us',
    'eu': (player) => ['de', 'gb'].includes(player.flag)
};

// Recent matches data from the screenshot
const recentMatches = [
    { time: "14 hours ago", details: "jamie@lt & Andrei wins vs yourstar@forums & Johnny, jfacas & ellis, M3l0n & delinquent" },
    { time: "15 hours ago", details: "ellis & jfacas wins vs Johnny & jamie@lt, thyst@l_OP & delinquent, yourstar@forums & stereo" },
    { time: "15 hours ago", details: "Johnny & thyst@l_OP wins vs stereo & jfacas, delinquent & teejay, yourstar@forums & jamie@lt" },
    { time: "19 hours ago", details: "pizza & teejay wins vs koala, yourstar@forums & M3l0n, Mikemacx & jamie@lt" },
    { time: "1 day ago", details: "FoFo & pizza wins vs ellis & jamie@lt, Hades & M3l0n, Mikemacx & Johnny" },
    { time: "1 day ago", details: "ellis & Johnny wins vs Hades & FoFo, jamie@lt & M3l0n, yourstar@l_OP & Mikemacx" }
];

// Highest scores data
const highestScoresData = {
    scores: [
        { rank: 1, username: "koala", value: 1050, date: "2025-05-23" },
        { rank: 2, username: "N", value: 1020, date: "2024-05-27" },
        { rank: 3, username: "rookie", value: 1020, date: "2024-06-13" },
        { rank: 4, username: "Nate", value: 1020, date: "2025-02-23" },
        { rank: 5, username: "ppotter", value: 990, date: "2024-05-16" }
    ],
    netpoints: [
        { rank: 1, username: "ellis", value: 1500, date: "2025-09-22" },
        { rank: 2, username: "Ampz", value: 1167, date: "2024-03-15" },
        { rank: 3, username: "apple", value: 1101, date: "2025-09-18" },
        { rank: 4, username: "N", value: 994, date: "2024-08-12" },
        { rank: 5, username: "koala", value: 952, date: "2025-09-21" }
    ],
    kd: [
        { rank: 1, username: "ellis", value: 3.5, date: "2025-09-22" },
        { rank: 2, username: "Ampz", value: 2.67, date: "2024-03-15" },
        { rank: 3, username: "apple", value: 2.14, date: "2025-09-18" },
        { rank: 4, username: "koala", value: 1.98, date: "2025-09-21" },
        { rank: 5, username: "rookie", value: 1.97, date: "2024-06-13" }
    ],
    ratings: [
        { rank: 1, username: "ellis", value: 2500, date: "2025-09-22" },
        { rank: 2, username: "koala", value: 2377, date: "2025-09-21" },
        { rank: 3, username: "Ninja Potato", value: 2320, date: "2025-09-17" },
        { rank: 4, username: "N", value: 2278, date: "2025-09-08" },
        { rank: 5, username: "Ampz", value: 2264, date: "2024-03-15" }
    ],
    winstreaks: [
        { rank: 1, username: "ellis", value: 15, date: "2025-09-22" },
        { rank: 2, username: "koala", value: 12, date: "2025-09-20" },
        { rank: 3, username: "Ampz", value: 8, date: "2024-03-15" },
        { rank: 4, username: "N", value: 7, date: "2024-08-12" },
        { rank: 5, username: "apple", value: 6, date: "2025-09-18" }
    ],
    lowest: [
        { rank: 1, username: "jZ", value: 352, date: "2025-08-15" },
        { rank: 2, username: "Force", value: 359, date: "2025-05-20" },
        { rank: 3, username: "Rudycant...", value: 431, date: "2025-06-10" },
        { rank: 4, username: "M3l0n", value: 432, date: "2025-09-21" },
        { rank: 5, username: "Sanity", value: 469, date: "2025-09-20" }
    ],
    suicides: [
        { rank: 1, username: "M3l0n", value: 47, date: "2025-09-21" },
        { rank: 2, username: "Sanity", value: 32, date: "2025-09-20" },
        { rank: 3, username: "Cookie", value: 28, date: "2025-09-19" },
        { rank: 4, username: "Cadillac", value: 24, date: "2025-09-18" },
        { rank: 5, username: "pizza", value: 21, date: "2025-09-21" }
    ],
    holes: [
        { rank: 1, username: "Sanity", value: 89, date: "2025-09-20" },
        { rank: 2, username: "M3l0n", value: 76, date: "2025-09-21" },
        { rank: 3, username: "Cookie", value: 65, date: "2025-09-19" },
        { rank: 4, username: "Cadillac", value: 52, date: "2025-09-18" },
        { rank: 5, username: "pizza", value: 48, date: "2025-09-21" }
    ],
    eradicated: [
        { rank: 1, username: "M3l0n", value: 156, date: "2025-09-21" },
        { rank: 2, username: "Andrei", value: 134, date: "2025-09-21" },
        { rank: 3, username: "Sanity", value: 128, date: "2025-09-20" },
        { rank: 4, username: "pizza", value: 115, date: "2025-09-21" },
        { rank: 5, username: "ppotter", value: 98, date: "2024-05-16" }
    ],
    addicts: [
        { rank: 1, username: "ellis", value: 273, date: "2025-09-22" },
        { rank: 2, username: "M3l0n", value: 262, date: "2025-09-21" },
        { rank: 3, username: "Sanity", value: 216, date: "2025-09-20" },
        { rank: 4, username: "koala", value: 210, date: "2025-09-21" },
        { rank: 5, username: "Andrei", value: 154, date: "2025-09-21" }
    ]
};

// Flag mapping for country codes
const flagMap = {
    'de': 'de',
    'us': 'us', 
    'gb': 'gb',
    'ca': 'ca',
    'au': 'au'
};

// Initialize the leaderboard
document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
    renderLeaderboard();
    renderRecentMatches();
    renderHighestScores();
    setupEventListeners();
});

// Theme management
function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const slider = document.querySelector('.theme-toggle-slider');
    const icon = document.querySelector('.theme-toggle-icon');
    
    if (icon && slider) {
        if (theme === 'dark') {
            // Show moon icon in slider
            icon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>';
        } else {
            // Show sun icon in slider
            icon.innerHTML = `
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            `;
        }
    }
}

function setupEventListeners() {
    // Time period toggle buttons
    document.querySelectorAll('.toggle-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentPeriod = this.dataset.period;
            renderLeaderboard();
        });
    });

    // Region toggle buttons  
    document.querySelectorAll('.region-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.region-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentRegion = this.dataset.region;
            renderLeaderboard();
        });
    });

    // Sort toggle buttons
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentSort = this.dataset.sort;
            renderLeaderboard();
        });
    });

    // Score tab buttons
    document.querySelectorAll('.score-tab').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.score-tab').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentScoreTab = this.dataset.tab;
            renderHighestScores();
        });
    });

    // Theme toggle button
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
}

function renderLeaderboard() {
    const container = document.getElementById('leaderboard');
    const data = leaderboardData[currentPeriod];
    const regionFilter = regionFilters[currentRegion];

    container.innerHTML = '';

    // Filter data based on region
    const filteredData = data.filter(regionFilter);

    // Sort data if needed (for now just use the existing order)
    const sortedData = currentSort === 'position' ?
        filteredData.sort((a, b) => b.rating - a.rating) :
        filteredData;

    sortedData.forEach((player, index) => {
        const entry = createLeaderboardEntry(player, index + 1);
        container.appendChild(entry);
    });
}

function createLeaderboardEntry(player, displayRank) {
    const entry = document.createElement('div');
    entry.className = 'leaderboard-entry';

    entry.innerHTML = `
        <div class="rank">${displayRank}</div>
        <div class="player">
            ${player.flag ? `<span class="flag ${player.flag}"></span>` : ''}
            <span class="username">${player.username}</span>
        </div>
        <div class="rating">${player.rating}</div>
        <div class="change ${player.changeType}">${player.change}</div>
        <div class="last-active">${player.lastActive}</div>
        <div class="delta ${player.deltaType}">${player.delta}</div>
        <div class="matches">
            <div class="winrate-bar">
                <div class="winrate-fill" style="width: ${player.winRate}%; background: linear-gradient(90deg, #10b981 ${Math.min(player.winRate, 50)}%, #f59e0b ${Math.min(player.winRate, 50)}%, #ef4444 ${player.winRate}%);"></div>
            </div>
            <span class="matches-count">${player.matches}</span>
        </div>
        <div class="percentage">${player.winRate}%</div>
        <div class="stat">${player.avgPlace}</div>
        <div class="percentage">${player.alive}%</div>
        <div class="points">${player.netPoints}</div>
        <div class="score">${player.avgScore}</div>
        <div class="score">${player.highScore}</div>
        <div class="kd">${player.kd}</div>
    `;

    return entry;
}

function renderRecentMatches() {
    const container = document.getElementById('recent-matches');
    container.innerHTML = '';
    
    recentMatches.forEach(match => {
        const matchEntry = document.createElement('div');
        matchEntry.className = 'match-entry';
        matchEntry.innerHTML = `
            <div class="match-time">${match.time}</div>
            <div class="match-details">${match.details}</div>
        `;
        container.appendChild(matchEntry);
    });
}

function renderHighestScores() {
    const container = document.getElementById('highest-scores');
    const data = highestScoresData[currentScoreTab];
    
    container.innerHTML = '';
    
    if (data) {
        data.forEach(entry => {
            const scoreEntry = document.createElement('div');
            scoreEntry.className = 'score-entry';
            scoreEntry.innerHTML = `
                <div class="score-rank">${entry.rank}</div>
                <div class="score-username">${entry.username}</div>
                <div class="score-value">${entry.value}</div>
                <div class="score-date">${entry.date}</div>
            `;
            container.appendChild(scoreEntry);
        });
    }
}
