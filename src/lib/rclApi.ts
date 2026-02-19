import type { LeaderboardRow, Mode, ProfileRow, ProfileSummary, ProfileView, Region, Season } from "./types";

const RCL_API_BASE = (process.env.NEXT_PUBLIC_RCL_API_BASE || "https://retrocyclesleague.com/api/v1").replace(/\/$/, "");
const DEFAULT_MODE: Mode = "tst";

export const SEASONS: Record<Season, { start: string; end: string; apiId: string; label: string }> = {
  "2026": { start: "2026-01-01", end: "2026-12-31", apiId: "tst", label: "Season 4 (2026)" },
  "2025": { start: "2025-01-01", end: "2025-12-31", apiId: "tst24", label: "Season 3 (2025)" },
  "2024": { start: "2024-01-01", end: "2024-12-31", apiId: "tst24", label: "Season 2 (2024)" },
  "2023": { start: "2023-01-01", end: "2023-12-31", apiId: "tst24", label: "Season 1 (2023)" }
};

interface ApiLeaderboardRow {
  rank?: number;
  username?: string;
  name?: string;
  playerName?: string;
  rating?: number;
  elo?: number;
  latestChange?: number;
  change?: number;
  lastActiveLabel?: string;
  lastActive?: string;
  lastActiveAt?: string;
  changeDate?: string;
  matches?: number;
  played?: number;
  numPlay?: number;
  winRate?: number;
  winrate?: number;
  avgPlace?: number;
  averagePlace?: number;
  avgScore?: number;
  averageScore?: number;
  highScore?: number;
  bestScore?: number;
  kd?: number;
  killDeathRatio?: number;
  pos1Rate?: number;
  pos2Rate?: number;
  pos3Rate?: number;
  pos4Rate?: number;
  positionRates?: {
    first?: number;
    second?: number;
    third?: number;
    fourth?: number;
  };
}

interface ApiEnvelope<T> {
  data?: T[];
}

interface ApiSummary {
  leaderboardRank?: number;
  rating?: number;
  lastOnlineAt?: string;
  stats?: {
    matches?: number;
    avgKd?: number | string;
    averageKd?: number | string;
    avgScore?: number;
    avgAliveRate?: number;
    winRate?: number;
    rageQuitRate?: number;
  };
}

interface ApiMatchRow {
  matchId?: string;
  date?: string;
  teammates?: string[] | string;
  entryRating?: number;
  exitRating?: number;
  change?: number;
  teamPlace?: number;
  individualPlace?: number;
  playedRate?: number;
  aliveRate?: number;
  score?: number;
  kills?: number;
  deaths?: number;
  kd?: number;
}

interface ApiErrorResponse {
  error?: {
    code?: string;
    message?: string;
  };
}

interface MatchHistoryLegacyListPayload {
  matches?: MatchHistoryListItem[];
}

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

function relativeFromIso(isoString?: string): string {
  if (!isoString) return "Recently";
  const date = new Date(isoString);
  const diffMs = Date.now() - date.getTime();
  if (!Number.isFinite(diffMs) || diffMs < 0) return "Recently";
  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  return `${Math.floor(hours / 24)} days ago`;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    let message = `request failed: ${response.status}`;
    try {
      const errorBody = (await response.json()) as ApiErrorResponse;
      if (errorBody?.error?.message) message = errorBody.error.message;
    } catch {
      // no-op
    }
    throw new Error(message);
  }
  return (await response.json()) as T;
}

async function fetchJsonOrNull<T>(url: string): Promise<T | null> {
  try {
    return await fetchJson<T>(url);
  } catch {
    return null;
  }
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

function normalizeLeaderboardEntry(entry: ApiLeaderboardRow, fallbackRank: number): LeaderboardRow {
  const name = entry.username || entry.name || entry.playerName || "unknown";
  const elo = Number(entry.rating ?? entry.elo ?? 1500);
  const latestChange = Number(entry.latestChange ?? entry.change ?? 0);
  const matches = Number(entry.matches ?? entry.numPlay ?? 0);
  const played = Number(entry.played ?? 0);
  const winrateRaw = entry.winRate ?? entry.winrate ?? 0;
  let winrate = Number(winrateRaw) > 1 ? Number(winrateRaw) / 100 : Number(winrateRaw || 0);
  if ((!Number.isFinite(winrate) || winrate <= 0) && matches > 0 && played > 0 && played <= matches) {
    // Fallback when API omits explicit winRate but returns wins/played counts.
    winrate = played / matches;
  }
  if (!Number.isFinite(winrate) || winrate < 0) winrate = 0;
  if (winrate > 1) winrate = 1;
  const avgPlace = Number(entry.avgPlace ?? entry.averagePlace ?? 0);
  const avgScore = Number(entry.avgScore ?? entry.averageScore ?? 0);
  const highScore = Number(entry.highScore ?? entry.bestScore ?? 0);
  const kd = Number(entry.kd ?? entry.killDeathRatio ?? 0);
  const positionRates = entry.positionRates || {};
  const pos1Rate = Number(entry.pos1Rate ?? positionRates.first ?? winrate * 100);
  const pos2Rate = Number(entry.pos2Rate ?? positionRates.second ?? 0);
  const pos3Rate = Number(entry.pos3Rate ?? positionRates.third ?? 0);
  const pos4Rate = Number(entry.pos4Rate ?? positionRates.fourth ?? Math.max(0, 100 - pos1Rate - pos2Rate - pos3Rate));

  return {
    rank: Number(entry.rank ?? fallbackRank),
    name,
    elo,
    latestChange,
    lastActive: entry.lastActiveLabel || entry.lastActive || entry.changeDate || relativeFromIso(entry.lastActiveAt),
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
  };
}

export async function getLeaderboardRows({
  season,
  region = "combined",
  mode = DEFAULT_MODE
}: {
  season: Season;
  region?: Region;
  mode?: Mode;
}): Promise<LeaderboardRow[]> {
  const params = new URLSearchParams({
    season,
    mode,
    region,
    page: "1",
    pageSize: "500"
  });
  const payload = await fetchJson<ApiEnvelope<ApiLeaderboardRow>>(`${RCL_API_BASE}/leaderboard?${params.toString()}`);
  const rows = Array.isArray(payload?.data) ? payload.data : [];
  return rows.map((entry, index) => normalizeLeaderboardEntry(entry, index + 1));
}

function mapRclMatchesToProfileRows(rows: ApiMatchRow[] = []): ProfileRow[] {
  return rows
    .map((row, index) => {
      const change =
        row.change ??
        (row.entryRating !== undefined && row.exitRating !== undefined ? row.exitRating - row.entryRating : null);
      const kdNumeric = row.kd ?? (row.deaths && row.deaths > 0 ? (row.kills || 0) / row.deaths : null);
      return {
        id: row.matchId || `${row.date || "match"}-${index}`,
        dateRaw: new Date(row.date || "").getTime() || 0,
        date: formatMatchTimestamp(row.date),
        teammates: Array.isArray(row.teammates) ? row.teammates.join(", ") || "—" : row.teammates || "—",
        exitRating: row.exitRating ?? "—",
        change: change === null || change === undefined ? "—" : `${change > 0 ? "+" : ""}${change}`,
        teamPlace: row.teamPlace ?? "—",
        individualPlace: row.individualPlace ?? "—",
        played: formatPercent(row.playedRate),
        alive: formatPercent(row.aliveRate),
        score: row.score ?? 0,
        kd: kdNumeric === null || kdNumeric === undefined ? "—" : Number(kdNumeric).toFixed(2)
      };
    })
    .sort((a, b) => b.dateRaw - a.dateRaw);
}

export async function getPlayerProfileView({
  username,
  season,
  region = "combined",
  mode = DEFAULT_MODE
}: {
  username: string;
  season: Season;
  region?: Region;
  mode?: Mode;
}): Promise<ProfileView> {
  const summaryParams = new URLSearchParams({ season, mode, region });
  const matchesParams = new URLSearchParams({ season, mode, region, page: "1", pageSize: "200" });

  const [summaryPayload, matchesPayload] = await Promise.all([
    fetchJsonOrNull<ApiSummary>(`${RCL_API_BASE}/players/${encodeURIComponent(username)}/summary?${summaryParams.toString()}`),
    fetchJsonOrNull<ApiEnvelope<ApiMatchRow>>(`${RCL_API_BASE}/players/${encodeURIComponent(username)}/matches?${matchesParams.toString()}`)
  ]);

  const rows = mapRclMatchesToProfileRows(Array.isArray(matchesPayload?.data) ? matchesPayload.data : []);
  const stats = summaryPayload?.stats || {};
  const winRateRaw = stats.winRate ?? 0;
  const winRate = Number(winRateRaw) <= 1 ? Math.round(Number(winRateRaw) * 100) : Math.round(Number(winRateRaw));
  const rageQuitRaw = stats.rageQuitRate;
  const rageQuit =
    rageQuitRaw === null || rageQuitRaw === undefined
      ? "—"
      : Number(rageQuitRaw) <= 1
        ? `${(Number(rageQuitRaw) * 100).toFixed(1)}%`
        : `${Number(rageQuitRaw).toFixed(1)}%`;

  const summary: ProfileSummary = {
    matches: Number(stats.matches ?? rows.length),
    avgKd: String(stats.avgKd ?? stats.averageKd ?? "0.00"),
    avgScore: Number(stats.avgScore ?? 0),
    avgAlive: formatPercent(stats.avgAliveRate),
    winRate: Number.isFinite(winRate) ? winRate : 0,
    rageQuit,
    latestElo: summaryPayload?.rating ?? null,
    latestOnline: summaryPayload?.lastOnlineAt ? formatMatchTimestamp(summaryPayload.lastOnlineAt) : "—"
  };

  let leaderboardRank = summaryPayload?.leaderboardRank ?? null;
  if (leaderboardRank === null || summary.latestElo === null || summary.latestOnline === "—") {
    const leaderboardRows = await fetchJsonOrNull<ApiEnvelope<ApiLeaderboardRow>>(
      `${RCL_API_BASE}/leaderboard?${new URLSearchParams({
        season,
        mode,
        region,
        page: "1",
        pageSize: "500"
      }).toString()}`
    );
    const normalizedRows = Array.isArray(leaderboardRows?.data)
      ? leaderboardRows.data.map((entry, index) => normalizeLeaderboardEntry(entry, index + 1))
      : [];
    const current = normalizedRows.find((row) => row.name.toLowerCase() === username.toLowerCase());
    if (current) {
      leaderboardRank = current.rank;
      if (summary.latestElo === null) summary.latestElo = current.elo;
      if (summary.latestOnline === "—") summary.latestOnline = current.lastActive;
      if (!summary.winRate && current.winrate > 0) summary.winRate = Math.round(current.winrate * 100);
    }
  }

  return {
    rows,
    summary,
    leaderboardRank
  };
}

export interface MatchHistoryListItem {
  id: string;
  date?: string;
  roundCount?: number;
  totalTimeSeconds?: number;
  winner?: string;
}

export async function getMatchHistory(mode: Mode = DEFAULT_MODE, page = 1): Promise<MatchHistoryListItem[]> {
  const params = new URLSearchParams({ mode, page: String(page), pageSize: "20" });
  const payload = await fetchJsonOrNull<ApiEnvelope<MatchHistoryListItem>>(`${RCL_API_BASE}/matches?${params.toString()}`);
  if (Array.isArray(payload?.data)) return payload.data;

  // Fallback for legacy history endpoint still used by backend infra.
  const legacyPayload = await fetchJsonOrNull<MatchHistoryLegacyListPayload>(`https://retrocyclesleague.com/api/history/${mode}?page=${page}`);
  return Array.isArray(legacyPayload?.matches) ? legacyPayload.matches : [];
}

export async function getMatchDetails(matchId: string): Promise<unknown> {
  const details = await fetchJsonOrNull<unknown>(`${RCL_API_BASE}/matches/${encodeURIComponent(matchId)}`);
  if (details) return details;
  return fetchJson<unknown>(`https://retrocyclesleague.com/api/history/${DEFAULT_MODE}?id=${encodeURIComponent(matchId)}`);
}

export function getRclApiBase(): string {
  return RCL_API_BASE;
}
