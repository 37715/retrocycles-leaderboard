# RCL API Contract (Client Standardization)

This document defines the API contract the frontend now targets via `src/lib/rclApi.ts`.

## Base URL

- Default: `https://retrocyclesleague.com/api/v1`
- Override with env: `NEXT_PUBLIC_RCL_API_BASE`
- Example override: `https://staging.retrocyclesleague.com/api/v1`

## Core Query Dimensions

- `season`: `2023 | 2024 | 2025 | 2026`
- `mode`: currently `tst` (client is mode-ready)
- `region`: `combined | us | eu`

## Endpoints Required

### 1) Leaderboard

`GET /api/v1/leaderboard`

#### Query
- `season` (required)
- `mode` (required)
- `region` (required)
- `page` (recommended)
- `pageSize` (recommended)

#### Response (preferred)
```json
{
  "data": [
    {
      "rank": 1,
      "username": "ellis",
      "rating": 2156,
      "latestChange": 12,
      "lastActiveAt": "2026-02-12T13:00:00Z",
      "lastActiveLabel": "2 hours ago",
      "matches": 47,
      "winRate": 0.553,
      "avgPlace": 1.9,
      "avgScore": 812,
      "highScore": 1103,
      "kd": 2.14,
      "positionRates": {
        "first": 55.3,
        "second": 22.0,
        "third": 14.7,
        "fourth": 8.0
      }
    }
  ],
  "meta": {
    "season": "2026",
    "mode": "tst",
    "region": "combined",
    "page": 1,
    "pageSize": 500,
    "totalRows": 632
  }
}
```

#### Accepted aliases (backward-friendly)
The client also accepts:
- `name` instead of `username`
- `elo` instead of `rating`
- `winrate` instead of `winRate`
- `averagePlace` / `averageScore` instead of `avgPlace` / `avgScore`
- `killDeathRatio` instead of `kd`

---

### 2) Player Summary

`GET /api/v1/players/{username}/summary`

#### Query
- `season` (required)
- `mode` (required)
- `region` (required)

#### Response (preferred)
```json
{
  "username": "ellis",
  "season": "2026",
  "mode": "tst",
  "region": "combined",
  "leaderboardRank": 1,
  "rating": 2156,
  "lastOnlineAt": "2026-02-12T13:00:00Z",
  "stats": {
    "matches": 47,
    "avgKd": 2.14,
    "avgScore": 812,
    "avgAliveRate": 0.91,
    "winRate": 0.553,
    "rageQuitRate": 0.02
  }
}
```

---

### 3) Player Match History

`GET /api/v1/players/{username}/matches`

#### Query
- `season` (required)
- `mode` (required)
- `region` (required)
- `page` (recommended)
- `pageSize` (recommended)

#### Response (preferred)
```json
{
  "data": [
    {
      "matchId": "abc123",
      "date": "2026-02-11T21:40:00Z",
      "teammates": ["jamie", "johnny"],
      "entryRating": 2140,
      "exitRating": 2156,
      "change": 16,
      "teamPlace": 1,
      "individualPlace": 2,
      "playedRate": 0.99,
      "aliveRate": 0.92,
      "score": 873,
      "kills": 21,
      "deaths": 8,
      "kd": 2.63
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 200,
    "totalRows": 47
  }
}
```

---

## Error Contract

All endpoints should return:

```json
{
  "error": {
    "code": "INVALID_QUERY",
    "message": "season must be one of 2023-2026",
    "details": {}
  }
}
```

Recommended status codes:
- `400` bad input
- `404` not found
- `422` unsupported season/mode/region combination
- `500` internal

---

## Client Field Expectations (Normalized Shape)

The frontend standardizes all responses into these UI shapes:

### Leaderboard row
- `rank`, `name`, `elo`, `latestChange`, `lastActive`
- `matches`, `winrate`, `avgPlace`, `avgScore`, `highScore`, `kd`
- `pos1Rate`, `pos2Rate`, `pos3Rate`, `pos4Rate`

### Profile view
- `leaderboardRank`
- `summary`: `matches`, `avgKd`, `avgScore`, `avgAlive`, `winRate`, `rageQuit`, `latestElo`, `latestOnline`
- `rows`: `id`, `date`, `teammates`, `exitRating`, `change`, `teamPlace`, `individualPlace`, `played`, `alive`, `score`, `kd`

---

## Current Migration Status

- Standardized client API adapter file: `src/lib/rclApi.ts`
- React pages using standardized adapter:
  - `src/leaderboard/LeaderboardApp.tsx`
  - `src/profile/ProfileApp.tsx`
- Client is now strict RCL API (`/api/v1`) with no legacy fallback path.
