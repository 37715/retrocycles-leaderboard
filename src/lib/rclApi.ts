import type { LeaderboardRow, LeaderboardSeason, Mode, ProfileRow, ProfileView, Region, Season } from "./types";

const DEFAULT_MODE: Mode = "tst";

const RANKINGS_API_BASE = "https://corsapi.armanelgtron.tk/rankings";
const RANKINGS_DATERANGE_URL = `${RANKINGS_API_BASE}/daterange.php`;

const MATCH_HISTORY_BASE_URL = "https://retrocyclesleague.com/api/history";
const SUMOBAR_API_BASE = "https://retrocyclesleague.com/api/v1/sumobar";

export const SEASONS: Record<Season, { start: string; end: string; apiId: string; label: string }> = {
  "2026": { start: "2026-01-01", end: "2026-12-31", apiId: "tst", label: "Season 4 (2026)" },
  "2025": { start: "2025-01-01", end: "2025-12-31", apiId: "tst24", label: "Season 3 (2025)" },
  "2024": { start: "2024-01-01", end: "2024-12-31", apiId: "tst24", label: "Season 2 (2024)" },
  "2023": { start: "2023-01-01", end: "2023-12-31", apiId: "tst24", label: "Season 1 (2023)" }
};

function formatMatchTimestamp(isoString?: string): string {
  if (!isoString) return "unknown time";
  const date = new Date(isoString);
  return date
    .toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    })
    .toLowerCase();
}

function formatPercent(value?: number | null): string {
  if (value === null || value === undefined) return "—";
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return "—";
  const percent = numeric <= 1 ? numeric * 100 : numeric;
  return `${percent.toFixed(1)}%`;
}

export function getRankMeta(elo: number): { name: string; icon: string; class: string } {
  if (elo < 1400) return { name: "bronze", icon: "/images/ranks/bronze.svg", class: "rank-bronze" };
  if (elo < 1600) return { name: "silver", icon: "/images/ranks/silver.svg", class: "rank-silver" };
  if (elo < 1900) return { name: "gold", icon: "/images/ranks/gold.svg", class: "rank-gold" };
  if (elo < 2100) return { name: "platinum", icon: "/images/ranks/platinum.svg", class: "rank-platinum" };
  if (elo < 2200) return { name: "diamond", icon: "/images/ranks/diamond-amethyst-9.svg", class: "rank-diamond" };
  if (elo < 2300) return { name: "master", icon: "/images/ranks/master.svg", class: "rank-master" };
  if (elo < 2400) return { name: "grandmaster", icon: "/images/ranks/grandmaster.svg", class: "rank-grandmaster" };
  return { name: "legend", icon: "/images/ranks/legend.png", class: "rank-legend" };
}

function getRankingsUrl(season: LeaderboardSeason, region: Region): string | null {
  const params: string[] = [];
  let apiId = "tst";

  if (season === "weekly") {
    const today = new Date();
    const start = new Date(today);
    start.setDate(today.getDate() - 6);
    const endExclusive = new Date(today);
    endExclusive.setDate(today.getDate() + 1);
    params.push(`datel=${start.toISOString().slice(0, 10)}`);
    params.push(`date=${endExclusive.toISOString().slice(0, 10)}`);
  } else {
    const yearConfig = SEASONS[season];
    if (!yearConfig) return null;
    if (yearConfig.start) params.push(`datel=${yearConfig.start}`);
    if (yearConfig.end) params.push(`date=${yearConfig.end}`);
    apiId = yearConfig.apiId;
  }

  if (region === "eu") apiId += "-eu";
  else if (region === "us") apiId += "-us";
  params.push(`id=${apiId}`);

  return `${RANKINGS_DATERANGE_URL}?${params.join("&")}`;
}

function parseLastActiveTime(changeDateText: string): string {
  if (!changeDateText) return "Unknown";
  const match = changeDateText.match(/\d+\s+(.+)/);
  if (match) return match[1];
  return changeDateText || "Recently";
}

export async function getLeaderboardRows({
  season,
  region = "combined",
}: {
  season: LeaderboardSeason;
  region?: Region;
  mode?: Mode;
}): Promise<LeaderboardRow[]> {
  const url = getRankingsUrl(season, region);
  if (!url) return [];

  const response = await fetch(url);
  if (!response.ok) throw new Error(`rankings request failed: ${response.status}`);
  const html = await response.text();

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const tableRows = doc.querySelectorAll("table tr");
  const players: LeaderboardRow[] = [];

  tableRows.forEach((row, index) => {
    if (index === 0) return;
    const cells = row.querySelectorAll("td");
    if (cells.length < 3) return;

    const rank = parseInt(cells[0]?.textContent?.trim() || "") || index;
    const name = cells[1]?.textContent?.trim() || "";
    const elo = parseInt(cells[2]?.textContent?.trim() || "") || 1500;
    const latestChange = parseInt(cells[3]?.textContent?.trim() || "") || 0;
    const changeDateText = cells[4]?.textContent?.trim() || "";
    const hasPlayedColumn = cells.length >= 11;

    let matches = 0;
    let pos1Rate = 0,
      pos2Rate = 0,
      pos3Rate = 0,
      pos4Rate = 0;

    const matchesCell = cells[5];
    const progressBars = matchesCell?.querySelectorAll(".progress-bar") || [];

    if (progressBars[0]) {
      pos1Rate = parseFloat(progressBars[0].getAttribute("aria-valuenow") || "") || 0;
    }

    for (const bar of Array.from(progressBars)) {
      const title = bar.getAttribute("title") || "";
      const ariaValue = parseFloat(bar.getAttribute("aria-valuenow") || "") || 0;
      const outOfMatch = title.match(/out of (\d+)/i);
      if (outOfMatch && matches === 0) {
        matches = parseInt(outOfMatch[1]) || 0;
      }
      if (title.match(/^2nd/i)) pos2Rate = ariaValue;
      else if (title.match(/^3rd/i)) pos3Rate = ariaValue;
    }

    pos4Rate = Math.max(0, 100 - pos1Rate - pos2Rate - pos3Rate);
    const winrate = pos1Rate / 100;

    let avgPlace: number, avgScore: number, highScore: number, kd: number;

    if (hasPlayedColumn) {
      if (matches === 0) matches = parseInt(cells[6]?.textContent?.trim() || "") || 0;
      avgPlace = parseFloat(cells[7]?.textContent?.trim() || "") || 0;
      avgScore = parseInt(cells[8]?.textContent?.trim() || "") || 0;
      highScore = parseInt(cells[9]?.textContent?.trim() || "") || 0;
      kd = parseFloat(cells[10]?.textContent?.trim() || "") || 0;
    } else {
      avgPlace = parseFloat(cells[6]?.textContent?.trim() || "") || 0;
      avgScore = parseInt(cells[7]?.textContent?.trim() || "") || 0;
      highScore = parseInt(cells[8]?.textContent?.trim() || "") || 0;
      kd = parseFloat(cells[9]?.textContent?.trim() || "") || 0;
    }

    const lastActive = parseLastActiveTime(changeDateText);

    if (name) {
      players.push({
        rank,
        name,
        elo,
        latestChange,
        lastActive,
        matches,
        winrate,
        avgPlace,
        avgScore,
        highScore,
        kd,
        pos1Rate,
        pos2Rate,
        pos3Rate,
        pos4Rate
      });
    }
  });

  return players;
}

interface RankingsMatch {
  id?: string;
  name?: string;
  date?: string;
  region?: string;
  players?: Array<{
    player?: string;
    team?: number;
    place?: number;
    score?: number;
    alive?: number;
    played?: number;
    entryRating?: number;
    exitRating?: number;
    kd?: [number, number];
  }>;
}

function getPlayerHistoryUrl(username: string, season: Season): string {
  if (season === "2026") {
    return `${RANKINGS_API_BASE}/?id=tst&type=history&mp=${encodeURIComponent(username)}`;
  }
  const startDate = `${season}-01-01`;
  const endDate = `${season}-12-31`;
  return `${RANKINGS_API_BASE}/?id=tst24&type=history&daterange=1&datel=${startDate}&date=${endDate}&mp=${encodeURIComponent(username)}`;
}

function computeIndividualPlace(players: RankingsMatch["players"], playerName: string): number | string {
  if (!players) return "—";
  const sorted = [...players].sort((a, b) => (b.score || 0) - (a.score || 0));
  const idx = sorted.findIndex((p) => p.player === playerName);
  return idx === -1 ? "—" : idx + 1;
}

function formatNetPoints(entry: number | null | undefined, exit: number | null | undefined): string {
  if (entry === null || entry === undefined || exit === null || exit === undefined) return "—";
  const delta = exit - entry;
  return `${delta > 0 ? "+" : ""}${delta}`;
}

export async function getPlayerProfileView({
  username,
  season,
}: {
  username: string;
  season: Season;
  region?: Region;
  mode?: Mode;
}): Promise<ProfileView> {
  const historyUrl = getPlayerHistoryUrl(username, season);
  const [historyResponse, leaderboardRank] = await Promise.all([
    fetch(historyUrl),
    getPlayerLeaderboardRank(username, season)
  ]);

  if (!historyResponse.ok) throw new Error("failed to load profile");
  const matches: RankingsMatch[] = await historyResponse.json();

  if (!Array.isArray(matches) || matches.length === 0) {
    return {
      rows: [],
      summary: {
        matches: 0,
        avgKd: "0.00",
        avgScore: 0,
        avgAlive: "—",
        winRate: 0,
        rageQuit: "—",
        latestElo: null,
        latestOnline: "—"
      },
      leaderboardRank
    };
  }

  let totalKills = 0;
  let totalDeaths = 0;
  let totalScore = 0;
  let totalAlive = 0;
  let totalPlayed = 0;
  let matchCount = 0;
  let wins = 0;

  const rows: ProfileRow[] = [];

  matches.forEach((match, index) => {
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
    matchCount += 1;
    if (entry.place === 1) wins += 1;

    const teammates = players
      .filter((p) => p.team === entry.team && p.player !== username)
      .map((p) => p.player)
      .join(", ") || "—";

    rows.push({
      id: match.id || `${match.name || match.date || "match"}-${index}`,
      dateRaw: new Date(match.name || match.date || "").getTime() || 0,
      date: formatMatchTimestamp(match.name || match.date),
      teammates,
      exitRating: exitRating ?? "—",
      change: formatNetPoints(entryRating, exitRating),
      teamPlace: entry.place ?? "—",
      individualPlace: computeIndividualPlace(players, entry.player || username),
      played: formatPercent(entry.played),
      alive: formatPercent(entry.alive),
      score,
      kd: deaths > 0 ? (kills / deaths).toFixed(2) : `${kills}.00`
    });
  });

  rows.sort((a, b) => b.dateRaw - a.dateRaw);

  const avgKd = totalDeaths > 0 ? (totalKills / totalDeaths).toFixed(2) : `${totalKills}.00`;
  const avgScore = matchCount ? Math.round(totalScore / matchCount) : 0;
  const avgAlive = matchCount ? formatPercent(totalAlive / matchCount) : "—";
  const winRate = matchCount > 0 ? Math.round((wins / matchCount) * 100) : 0;
  const avgPlayedRatio = matchCount ? totalPlayed / matchCount : null;
  const rageQuitValue = avgPlayedRatio === null ? null : Math.max(0, 100 - avgPlayedRatio * 100);
  const rageQuit = rageQuitValue === null ? "—" : `${rageQuitValue.toFixed(1)}%`;

  const sorted = [...matches].sort(
    (a, b) => new Date(b.name || b.date || "").getTime() - new Date(a.name || a.date || "").getTime()
  );
  const latestMatch = sorted[0];
  const latestEntry = latestMatch?.players?.find((p) => p.player === username);
  const latestElo = latestEntry?.exitRating ?? latestEntry?.entryRating ?? null;
  const latestOnline = latestMatch?.name || latestMatch?.date
    ? formatMatchTimestamp(latestMatch.name || latestMatch.date)
    : "—";

  return {
    rows,
    summary: {
      matches: matchCount,
      avgKd: avgKd,
      avgScore,
      avgAlive,
      winRate,
      rageQuit,
      latestElo: latestElo !== null ? Math.round(latestElo) : null,
      latestOnline
    },
    leaderboardRank
  };
}

async function getPlayerLeaderboardRank(username: string, season: Season): Promise<number | null> {
  try {
    const url = getRankingsUrl(season, "combined");
    if (!url) return null;
    const response = await fetch(url);
    if (!response.ok) return null;
    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const tableRows = doc.querySelectorAll("table tr");
    for (let i = 0; i < tableRows.length; i++) {
      const cells = tableRows[i].querySelectorAll("td");
      if (cells.length >= 2) {
        const playerName = cells[1]?.textContent?.trim();
        if (playerName && playerName.toLowerCase() === username.toLowerCase()) {
          return parseInt(cells[0]?.textContent?.trim() || "") || i;
        }
      }
    }
    return null;
  } catch {
    return null;
  }
}

export interface MatchHistoryListItem {
  id: string;
  date?: string;
  roundCount?: number;
  totalTimeSeconds?: number;
  winner?: string;
}

export interface SumobarPagination {
  limit: number;
  offset: number;
  returned: number;
}

export interface SumobarLeaderboardRow {
  rank: number;
  playerAuth: string;
  region: string | null;
  elo: number;
  matchesPlayed: number;
  kills: number;
  deaths: number;
  avgScore: number | null;
  avgPosition: number | null;
  placementRates: number[] | null;
  updatedAt: string;
}

export interface SumobarMatchRow {
  matchId: string;
  roundsPlayed: number;
  winnerTeam: string | null;
  winnerPlayers: string[];
  endedAt: string;
}

export interface SumobarLeaderboardResponse {
  rows: SumobarLeaderboardRow[];
  pagination: SumobarPagination;
}

export interface SumobarMatchesResponse {
  rows: SumobarMatchRow[];
  pagination: SumobarPagination;
}

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function toNumber(value: unknown, fallback = 0): number {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

function toPercentages(values: number[], matchesPlayed: number): number[] | null {
  if (values.length !== 8 || values.every((value) => value <= 0)) return null;
  const sum = values.reduce((acc, value) => acc + value, 0);
  if (sum <= 0) return null;

  // Fractions (0..1)
  if (sum <= 1.001) return values.map((value) => Math.max(0, value * 100));
  // Already percentages (roughly 0..100 total)
  if (sum <= 100.5) return values.map((value) => Math.max(0, value));
  // Raw counts where total ~= matches played
  if (matchesPlayed > 0 && sum <= matchesPlayed + 1) {
    return values.map((value) => Math.max(0, (value / matchesPlayed) * 100));
  }
  // Fallback: normalize whatever shape we got into 100%.
  return values.map((value) => Math.max(0, (value / sum) * 100));
}

function extractPlacementRates(row: Record<string, unknown>, matchesPlayed: number): number[] | null {
  const values: number[] = [];
  for (let place = 1; place <= 8; place += 1) {
    const candidates = [
      `place_${place}_rate`,
      `place${place}_rate`,
      `position_${place}_rate`,
      `position${place}_rate`,
      `pos_${place}_rate`,
      `pos${place}_rate`,
      `p${place}_rate`,
      `place_${place}_count`,
      `place${place}_count`,
      `position_${place}_count`,
      `position${place}_count`,
      `pos_${place}_count`,
      `pos${place}_count`,
      `p${place}_count`,
      `place_${place}`,
      `place${place}`,
      `position_${place}`,
      `position${place}`,
      `pos_${place}`,
      `pos${place}`,
      `p${place}`
    ];
    let numericValue: number | null = null;
    for (const key of candidates) {
      const candidate = toNumberOrNull(row[key]);
      if (candidate !== null) {
        numericValue = candidate;
        break;
      }
    }
    values.push(numericValue ?? 0);
  }
  return toPercentages(values, matchesPlayed);
}

function normalizeDateTime(value: unknown): string {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const normalized = raw
    .replace(" ", "T")
    .replace(/(\.\d{3})\d+/, "$1")
    .replace(/([+-]\d{2})$/, "$1:00")
    .replace(/\+00:00$/, "Z");
  const date = new Date(normalized);
  if (!Number.isNaN(date.getTime())) return date.toISOString();
  return raw;
}

async function fetchSumobarJson<T>(path: string, params: URLSearchParams): Promise<T> {
  const url = `${SUMOBAR_API_BASE}${path}?${params.toString()}`;
  const request = (headers?: HeadersInit) => fetch(url, headers ? { headers } : undefined);

  let response = await request();
  if ((response.status === 401 || response.status === 403)) {
    const token = process.env.SUMOBAR_API_TOKEN || process.env.NEXT_PUBLIC_SUMOBAR_API_TOKEN;
    if (token) {
      response = await request({ "X-RCL-Sumobar-Token": token });
      if (response.status === 401 || response.status === 403) {
        response = await request({ Authorization: `Bearer ${token}` });
      }
    }
  }

  if (!response.ok) {
    throw new Error(`sumobar request failed: ${response.status}`);
  }
  return (await response.json()) as T;
}

export async function getSumobarLeaderboard({
  limit = 50,
  offset = 0,
  minMatches = 1,
  region = "combined"
}: {
  limit?: number;
  offset?: number;
  minMatches?: number;
  region?: Region;
}): Promise<SumobarLeaderboardResponse> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
    min_matches: String(minMatches)
  });
  if (region !== "combined") {
    params.set("region", region);
  }
  const payload = await fetchSumobarJson<{ rows?: Array<Record<string, unknown>>; pagination?: Partial<SumobarPagination> }>(
    "/leaderboard",
    params
  );

  const rows = Array.isArray(payload?.rows) ? payload.rows : [];
  return {
    rows: rows.map((row) => {
      const matchesPlayed = toNumber(row.matches_played, 0);
      return {
        rank: toNumber(row.rank, 0),
        playerAuth: String(row.player_auth || ""),
        region: row.region ? String(row.region).toLowerCase() : null,
        elo: toNumber(row.elo, 0),
        matchesPlayed,
        kills: toNumber(row.kills, 0),
        deaths: toNumber(row.deaths, 0),
        avgScore: toNumberOrNull(row.avg_score),
        avgPosition: toNumberOrNull(row.avg_position),
        placementRates: extractPlacementRates(row, matchesPlayed),
        updatedAt: normalizeDateTime(row.updated_at)
      };
    }),
    pagination: {
      limit: toNumber(payload?.pagination?.limit, limit),
      offset: toNumber(payload?.pagination?.offset, offset),
      returned: toNumber(payload?.pagination?.returned, rows.length)
    }
  };
}

export async function getSumobarMatches({
  limit = 10,
  offset = 0
}: {
  limit?: number;
  offset?: number;
}): Promise<SumobarMatchesResponse> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset)
  });
  const payload = await fetchSumobarJson<{ rows?: Array<Record<string, unknown>>; pagination?: Partial<SumobarPagination> }>(
    "/matches",
    params
  );
  const rows = Array.isArray(payload?.rows) ? payload.rows : [];
  return {
    rows: rows.map((row) => ({
      matchId: String(row.match_id || ""),
      roundsPlayed: toNumber(row.rounds_played, 0),
      winnerTeam: row.winner_team === null || row.winner_team === undefined ? null : String(row.winner_team),
      winnerPlayers: Array.isArray(row.winner_players) ? row.winner_players.map((player) => String(player)) : [],
      endedAt: normalizeDateTime(row.ended_at)
    })),
    pagination: {
      limit: toNumber(payload?.pagination?.limit, limit),
      offset: toNumber(payload?.pagination?.offset, offset),
      returned: toNumber(payload?.pagination?.returned, rows.length)
    }
  };
}

export async function getMatchHistory(mode: Mode = DEFAULT_MODE, page = 1): Promise<MatchHistoryListItem[]> {
  const url = `${MATCH_HISTORY_BASE_URL}/${mode}${page ? `?page=${page}` : ""}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("failed to fetch match history");
  const data = await response.json();
  if (!Array.isArray(data)) return [];
  return data.map((m: Record<string, unknown>) => ({
    id: String(m.id ?? m.matchId ?? ""),
    date: m.date as string | undefined,
    roundCount: m.roundCount as number | undefined,
    totalTimeSeconds: (m.totalTime ?? m.totalTimeSeconds) as number | undefined,
    winner: m.winner as string | undefined
  }));
}

export async function getMatchDetails(matchId: string): Promise<unknown> {
  const url = `${MATCH_HISTORY_BASE_URL}/tst?id=${encodeURIComponent(matchId)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("failed to fetch match details");
  return response.json();
}
