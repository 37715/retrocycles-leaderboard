"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { type LeaderboardRow, type LeaderboardSeason, type Region, type Season } from "@/src/lib/types";
import { PrimaryNav } from "@/src/ui/PrimaryNav";
import {
  SEASONS,
  getLeaderboardRows,
  getMatchDetails,
  getMatchHistory,
  getRankMeta,
  getSumobarLeaderboard,
  getSumobarMatches,
  type SumobarLeaderboardRow,
  type SumobarMatchRow,
  type SumobarPagination
} from "@/src/lib/rclApi";

type SortKey = "rank" | "name" | "elo" | "latestChange" | "lastActive" | "matches" | "winrate" | "avgPlace" | "avgScore" | "highScore" | "kd";
type SumobarSortKey = "rank" | "player" | "elo" | "kills" | "lastActive" | "matches" | "deaths" | "avgPosition" | "avgScore" | "kdDiff" | "kd";

interface MatchHistoryDetailTeamPlayerPosition {
  kills?: number;
  deaths?: number;
  holePoints?: number;
}

interface MatchHistoryDetailTeamPlayer {
  nickname?: string;
  username?: string;
  positions?: MatchHistoryDetailTeamPlayerPosition[];
}

interface MatchHistoryDetailTeam {
  teamName?: string;
  score?: number;
  players?: MatchHistoryDetailTeamPlayer[];
}

interface MatchHistoryDetail {
  teams?: MatchHistoryDetailTeam[];
}

const SORTABLE_COLUMNS: Array<[SortKey, string, string]> = [
  ["rank", "#", "rank-col"],
  ["name", "Player", "player-col"],
  ["elo", "Rating", "rating-col"],
  ["latestChange", "Change", "change-col"],
  ["lastActive", "Last Active", "activity-col"],
  ["matches", "Matches", "matches-col"],
  ["winrate", "Win Rate", "winrate-col"],
  ["avgPlace", "Avg Place", "avg-place-col"],
  ["avgScore", "Avg Score", "avg-score-col"],
  ["highScore", "High Score", "high-score-col"],
  ["kd", "K/D", "kd-col"]
];
const SEASON_ORDER: Season[] = ["2026", "2025", "2024", "2023"];
type BoardMode = "tst" | "sumobar";

const DEFAULT_COLUMN_VISIBILITY = {
  lastActive: true,
  matches: true,
  winrate: true,
  avgPlace: true,
  avgScore: true,
  highScore: true,
  kd: true,
  tier: true
};

function parseRelativeMinutes(label: string): number {
  const value = String(label || "").toLowerCase();
  const match = value.match(/(\d+)\s+(minute|hour|day)/);
  if (!match) return Number.MAX_SAFE_INTEGER;
  const amount = Number(match[1]);
  const unit = match[2];
  if (unit.startsWith("minute")) return amount;
  if (unit.startsWith("hour")) return amount * 60;
  return amount * 24 * 60;
}

function getSortableValue(player: LeaderboardRow, key: SortKey): number | string {
  switch (key) {
    case "rank":
      return player.rank || 0;
    case "name":
      return player.name.toLowerCase();
    case "elo":
      return player.elo;
    case "latestChange":
      return player.latestChange;
    case "lastActive":
      return parseRelativeMinutes(player.lastActive);
    case "matches":
      return player.matches;
    case "winrate":
      return player.winrate;
    case "avgPlace":
      return player.avgPlace;
    case "avgScore":
      return player.avgScore;
    case "highScore":
      return player.highScore;
    case "kd":
      return player.kd;
    default:
      return 0;
  }
}

function getSumobarSortableValue(player: SumobarLeaderboardRow, key: SumobarSortKey): number | string {
  switch (key) {
    case "rank":
      return player.rank || 0;
    case "player":
      return player.playerAuth.toLowerCase();
    case "elo":
      return player.elo;
    case "kills":
      return player.kills;
    case "lastActive": {
      const ts = new Date(player.updatedAt || "").getTime();
      return Number.isNaN(ts) ? 0 : ts;
    }
    case "matches":
      return player.matchesPlayed;
    case "deaths":
      return player.deaths;
    case "avgPosition":
      return player.avgPosition ?? Number.POSITIVE_INFINITY;
    case "avgScore":
      return player.avgScore ?? Number.NEGATIVE_INFINITY;
    case "kdDiff":
      return player.kills - player.deaths;
    case "kd":
      return player.kills / Math.max(player.deaths, 1);
    default:
      return 0;
  }
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

function formatMatchDuration(totalSeconds?: number): string {
  if (!totalSeconds && totalSeconds !== 0) return "unknown";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}m ${seconds}s`;
}

function getPlayerTotals(player: MatchHistoryDetailTeamPlayer): { kills: number; deaths: number; score: number; hasData: boolean } {
  const positions = Array.isArray(player.positions) ? player.positions : [];
  const totals = positions.reduce<{ kills: number; deaths: number; score: number }>(
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

function normalizeTeamName(name?: string): string {
  return String(name || "").toLowerCase().replace("team ", "").trim();
}

function formatDateTime(value?: string): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
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

function formatLastActive(value?: string): string {
  if (!value) return "unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "unknown";

  const diffMs = Date.now() - date.getTime();
  if (diffMs <= 0) return "just now";

  const minutes = Math.floor(diffMs / (1000 * 60));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function getEstimatedPlacementRates(avgPosition: number | null, matchesPlayed: number): number[] {
  const rates = Array.from({ length: 8 }, () => 0);
  const safeAvg = avgPosition && avgPosition > 0 ? Math.min(8, Math.max(1, avgPosition)) : 4.5;
  const safeMatches = Math.max(0, Math.floor(matchesPlayed));

  // With no matches data, show a neutral center split.
  if (safeMatches <= 0) {
    rates[3] = 50;
    rates[4] = 50;
    return rates;
  }

  // One match must map to one exact finishing position.
  if (safeMatches === 1) {
    const placeIndex = Math.min(7, Math.max(0, Math.round(safeAvg) - 1));
    rates[placeIndex] = 100;
    return rates;
  }

  // For aggregated data without true place counts, distribute only between nearest buckets
  // and quantize by match count so slices are realistic.
  const lowPlace = Math.floor(safeAvg);
  const highPlace = Math.ceil(safeAvg);
  const lowIndex = Math.min(7, Math.max(0, lowPlace - 1));
  const highIndex = Math.min(7, Math.max(0, highPlace - 1));

  if (lowIndex === highIndex) {
    rates[lowIndex] = 100;
    return rates;
  }

  const highWeight = safeAvg - lowPlace;
  const lowWeight = 1 - highWeight;
  const lowCount = Math.max(0, Math.min(safeMatches, Math.round(lowWeight * safeMatches)));
  const highCount = safeMatches - lowCount;

  rates[lowIndex] = (lowCount / safeMatches) * 100;
  rates[highIndex] = (highCount / safeMatches) * 100;
  return rates;
}

function getSumobarMatchesGradient(placementRates: number[] | null, avgPosition: number | null, matchesPlayed: number): string {
  const palette = ["#22c55e", "#84cc16", "#eab308", "#facc15", "#fb923c", "#f97316", "#ef4444", "#dc2626"];
  const rates = placementRates && placementRates.length === 8 ? placementRates : getEstimatedPlacementRates(avgPosition, matchesPlayed);
  let cursor = 0;
  const segments: string[] = ["90deg"];

  rates.forEach((rate, idx) => {
    const color = palette[idx];
    const start = Math.max(0, Math.min(100, cursor));
    const end = Math.max(0, Math.min(100, cursor + rate));
    segments.push(`${color} ${start.toFixed(2)}%`);
    segments.push(`${color} ${end.toFixed(2)}%`);
    cursor = end;
  });
  if (cursor < 100) {
    const last = palette[palette.length - 1];
    segments.push(`${last} ${cursor.toFixed(2)}%`);
    segments.push(`${last} 100%`);
  }

  return `linear-gradient(${segments.join(", ")})`;
}

function shortMatchId(matchId: string): string {
  if (!matchId) return "-";
  return matchId.length > 8 ? `${matchId.slice(0, 8)}…` : matchId;
}

export function LeaderboardApp() {
  const searchParams = useSearchParams();
  const [boardMode, setBoardMode] = useState<BoardMode>("tst");
  const [season, setSeason] = useState<LeaderboardSeason>("2026");
  const [region, setRegion] = useState<Region>("combined");
  const [advanced, setAdvanced] = useState(false);
  const [pageIndex, setPageIndex] = useState(0);
  const [sorting, setSorting] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "elo", dir: "desc" });
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [columnVisibility, setColumnVisibility] = useState(DEFAULT_COLUMN_VISIBILITY);
  const [transitioning, setTransitioning] = useState(false);

  const [isMatchOverlayOpen, setIsMatchOverlayOpen] = useState(false);
  const [matchHistoryRows, setMatchHistoryRows] = useState<Array<{ id: string; date?: string; roundCount?: number; totalTimeSeconds?: number; winner?: string }>>([]);
  const [matchDetails, setMatchDetails] = useState<Record<string, MatchHistoryDetail>>({});
  const pageSize = 100;
  const inFlightMatchDetailsRef = useRef<Set<string>>(new Set());

  const [sumobarRows, setSumobarRows] = useState<SumobarLeaderboardRow[]>([]);
  const [sumobarPagination, setSumobarPagination] = useState<SumobarPagination>({ limit: 50, offset: 0, returned: 0 });
  const [sumobarLoading, setSumobarLoading] = useState(false);
  const [sumobarError, setSumobarError] = useState("");
  const [sumobarSorting, setSumobarSorting] = useState<{ key: SumobarSortKey; dir: "asc" | "desc" }>({ key: "elo", dir: "desc" });
  const [sumobarMatches, setSumobarMatches] = useState<SumobarMatchRow[]>([]);
  const [sumobarMatchesLoading, setSumobarMatchesLoading] = useState(false);
  const [sumobarMatchesError, setSumobarMatchesError] = useState("");
  const [isSumobarMatchesOpen, setIsSumobarMatchesOpen] = useState(false);
  const [seasonMenuOpen, setSeasonMenuOpen] = useState(false);
  const selectedSeason: Season = SEASON_ORDER.includes(season as Season) ? (season as Season) : "2026";

  useEffect(() => {
    if (boardMode !== "tst") return;
    let ignore = false;
    setLoading(true);
    setError("");
    setPageIndex(0);

    getLeaderboardRows({ season, region: season === "2023" ? "combined" : region, mode: "tst" })
      .then((data) => {
        if (!ignore) setRows(data);
      })
      .catch((err: Error) => {
        if (!ignore) setError(err.message || "failed to load leaderboard");
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [boardMode, season, region]);

  useEffect(() => {
    if (season === "2023") setRegion("combined");
  }, [season]);

  useEffect(() => {
    const mode = searchParams.get("mode");
    if (mode === "sumobar") {
      setBoardMode("sumobar");
      return;
    }
    if (mode === "tst") {
      setBoardMode("tst");
    }
  }, [searchParams]);

  useEffect(() => {
    if (boardMode !== "tst") {
      setIsMatchOverlayOpen(false);
      setIsSumobarMatchesOpen(false);
    }
  }, [boardMode]);

  useEffect(() => {
    if (boardMode !== "tst") return;
    if (!isMatchOverlayOpen || matchHistoryRows.length > 0) return;
    let ignore = false;
    getMatchHistory("tst", 1)
      .then((rowsPayload) => {
        if (!ignore) setMatchHistoryRows(rowsPayload.map((row) => ({ id: row.id, date: row.date, roundCount: row.roundCount, totalTimeSeconds: row.totalTimeSeconds, winner: row.winner })));
      })
      .catch(() => {
        if (!ignore) setMatchHistoryRows([]);
      });
    return () => {
      ignore = true;
    };
  }, [boardMode, isMatchOverlayOpen, matchHistoryRows.length]);

  useEffect(() => {
    if (boardMode !== "tst") return;
    if (!isMatchOverlayOpen || matchHistoryRows.length === 0) return;
    matchHistoryRows.forEach((match) => {
      void loadMatchDetails(match.id);
    });
  }, [boardMode, isMatchOverlayOpen, matchHistoryRows]);

  const filtered = useMemo(() => {
    let nextRows = [...rows];
    nextRows = [...nextRows].sort((a, b) => {
      const av = getSortableValue(a, sorting.key);
      const bv = getSortableValue(b, sorting.key);
      if (typeof av === "string" && typeof bv === "string") {
        return sorting.dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      if (sorting.key === "lastActive") {
        return sorting.dir === "asc" ? Number(bv) - Number(av) : Number(av) - Number(bv);
      }
      return sorting.dir === "asc" ? Number(av) - Number(bv) : Number(bv) - Number(av);
    });
    return nextRows.map((row, index) => ({ ...row, rank: index + 1 }));
  }, [rows, sorting]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const clampedPageIndex = Math.min(pageIndex, totalPages - 1);
  const paged = filtered.slice(clampedPageIndex * pageSize, clampedPageIndex * pageSize + pageSize);

  const toggleSort = (key: SortKey) => {
    if (key === "rank") return;
    setSorting((prev) => {
      if (prev.key === key) {
        return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
      }
      return { key, dir: key === "name" ? "asc" : "desc" };
    });
    setPageIndex(0);
  };

  const loadMatchDetails = async (matchId: string) => {
    if (matchDetails[matchId] || inFlightMatchDetailsRef.current.has(matchId)) return;
    inFlightMatchDetailsRef.current.add(matchId);
    try {
      const detail = (await getMatchDetails(matchId)) as MatchHistoryDetail;
      setMatchDetails((prev) => (prev[matchId] ? prev : { ...prev, [matchId]: detail }));
    } catch {
      setMatchDetails((prev) => (prev[matchId] ? prev : { ...prev, [matchId]: { teams: [] } }));
    } finally {
      inFlightMatchDetailsRef.current.delete(matchId);
    }
  };

  const loadSumobarLeaderboard = async () => {
    setSumobarLoading(true);
    setSumobarError("");
    try {
      const payload = await getSumobarLeaderboard({ limit: 50, offset: 0, minMatches: 1, region });
      setSumobarRows(payload.rows);
      setSumobarPagination(payload.pagination);
    } catch {
      setSumobarError("coming soon");
      setSumobarRows([]);
    } finally {
      setSumobarLoading(false);
    }
  };

  const loadSumobarMatches = async () => {
    setSumobarMatchesLoading(true);
    setSumobarMatchesError("");
    try {
      const payload = await getSumobarMatches({ limit: 10, offset: 0 });
      setSumobarMatches(payload.rows);
    } catch (err) {
      const message = err instanceof Error ? err.message : "failed to load sumobar matches";
      setSumobarMatchesError(message);
      setSumobarMatches([]);
    } finally {
      setSumobarMatchesLoading(false);
    }
  };

  const refreshSumobar = () => {
    void loadSumobarLeaderboard();
    void loadSumobarMatches();
  };

  useEffect(() => {
    if (boardMode !== "sumobar") return;
    refreshSumobar();
  }, [boardMode, region]);

  useEffect(() => {
    if (boardMode !== "sumobar") return;
    const interval = window.setInterval(() => {
      refreshSumobar();
    }, 30000);
    return () => window.clearInterval(interval);
  }, [boardMode, region]);

  const filteredSumobarRows = useMemo(() => {
    if (region === "combined") return sumobarRows;
    return sumobarRows.filter((row) => !row.region || row.region === region);
  }, [sumobarRows, region]);

  const sortedSumobarRows = useMemo(() => {
    const nextRows = [...filteredSumobarRows];
    nextRows.sort((a, b) => {
      const av = getSumobarSortableValue(a, sumobarSorting.key);
      const bv = getSumobarSortableValue(b, sumobarSorting.key);
      if (typeof av === "string" && typeof bv === "string") {
        return sumobarSorting.dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return sumobarSorting.dir === "asc" ? Number(av) - Number(bv) : Number(bv) - Number(av);
    });
    return nextRows;
  }, [filteredSumobarRows, sumobarSorting]);

  const toggleSumobarSort = (key: SumobarSortKey) => {
    setSumobarSorting((prev) => {
      if (prev.key === key) {
        return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
      }
      return { key, dir: key === "player" || key === "avgPosition" ? "asc" : "desc" };
    });
  };

  return (
    <div className="container">
      <PrimaryNav active="leaderboard" leaderboardMode={boardMode} />

      <header className="header">
        <div className="title-section">
          <div className="title-wrapper">
            <h1 className="title">leaderboard</h1>
          </div>
          <span className="gamemode-badge">{boardMode === "sumobar" ? "SUMOBAR" : "TST"}</span>
          {boardMode === "tst" && <span className="year-badge">{season === "weekly" ? "WEEKLY" : season}</span>}
        </div>
        <p className="subtitle">competitive rankings and statistics</p>
        <div className="update-info">{boardMode === "sumobar" ? "• updates every 30s •" : "• updates hourly •"}</div>
      </header>

      <div className="controls">
        {boardMode === "tst" && (
          <>
            <div className="control-group weekly-control-group">
              <button
                type="button"
                data-range="weekly"
                className={`weekly-pill-btn ${season === "weekly" ? "active" : ""}`}
                title="Last 7 days"
                onClick={() => setSeason("weekly")}
              >
                <span className="weekly-pill-dot" aria-hidden="true"></span>
                <span className="weekly-pill-title">this week</span>
              </button>
              <span className="weekly-subtitle">last 7 days</span>
            </div>
            <div className="control-group">
              <label className="control-label">season</label>
              <div
                className={`season-dropdown ${seasonMenuOpen ? "is-open" : ""}`}
                onMouseEnter={() => setSeasonMenuOpen(true)}
                onMouseLeave={() => setSeasonMenuOpen(false)}
              >
                <button type="button" className="season-dropdown-btn" aria-haspopup="listbox">
                  <span>{SEASONS[selectedSeason].label}</span>
                  <span className="season-dropdown-caret" aria-hidden="true">▾</span>
                </button>
                <div className="season-dropdown-menu" role="listbox" aria-label="select season">
                  {SEASON_ORDER.map((value) => {
                    const isWeekly = season === "weekly";
                    const isSelected = !isWeekly && selectedSeason === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        role="option"
                        data-season={value}
                        aria-selected={isSelected}
                        className={`season-dropdown-option ${isSelected ? "active" : ""}`}
                        onClick={() => {
                          setSeason(value);
                          setSeasonMenuOpen(false);
                        }}
                      >
                        {SEASONS[value].label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
        {season !== "2023" && (
          <div className="control-group">
            <label className="control-label">region</label>
            <div className="region-toggle">
              {(["combined", "us", "eu"] as const).map((value) => (
                <button key={value} type="button" className={`region-btn ${region === value ? "active" : ""}`} onClick={() => setRegion(value)}>
                  {value.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="control-group">
          <label className="checkbox-container">
            <input
              type="checkbox"
              checked={advanced}
              onChange={(e) => {
                const next = e.target.checked;
                setTransitioning(true);
                setTimeout(() => {
                  setAdvanced(next);
                  setTimeout(() => setTransitioning(false), 50);
                }, 200);
              }}
            />
            <span className="checkmark"></span>
            <span className="control-label">advanced stats</span>
          </label>
        </div>
        <div className="control-group">
          <button className="match-history-btn" type="button" onClick={() => setIsMatchOverlayOpen(true)}>
            match history
          </button>
        </div>
          </>
        )}
        {boardMode === "sumobar" && (
          <>
            <div className="control-group">
              <label className="control-label">region</label>
              <div className="region-toggle">
                {(["combined", "us", "eu"] as const).map((value) => (
                  <button key={value} type="button" className={`region-btn ${region === value ? "active" : ""}`} onClick={() => setRegion(value)}>
                    {value.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div className="control-group">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={advanced}
                  onChange={(e) => {
                    const next = e.target.checked;
                    setTransitioning(true);
                    setTimeout(() => {
                      setAdvanced(next);
                      setTimeout(() => setTransitioning(false), 50);
                    }, 200);
                  }}
                />
                <span className="checkmark"></span>
                <span className="control-label">advanced stats</span>
              </label>
            </div>
            <div className="control-group">
              <button className="match-history-btn" type="button" onClick={refreshSumobar}>
                refresh
              </button>
            </div>
            <div className="control-group">
              <button className="match-history-btn" type="button" onClick={() => setIsSumobarMatchesOpen(true)}>
                recent matches
              </button>
            </div>
          </>
        )}
      </div>

      {boardMode === "tst" && isMatchOverlayOpen && (
        <div className="match-history-overlay" onClick={() => setIsMatchOverlayOpen(false)}>
          <div className="match-history-panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="match history">
            <div className="match-history-header">
              <div className="match-history-title">match history</div>
              <div className="match-history-meta">tst · recent</div>
              <button className="match-history-close" type="button" onClick={() => setIsMatchOverlayOpen(false)} aria-label="close match history">
                ×
              </button>
            </div>
            <div className="match-history-list">
              {matchHistoryRows.length === 0 && <div className="match-empty">loading matches...</div>}
              {matchHistoryRows.map((match) => {
                const detail = matchDetails[match.id];
                const winnerTeam = String(match.winner || "unknown").toLowerCase();
                return (
                  <div key={match.id} className="match-item">
                    <div className="match-summary">
                      <span className="match-date">{formatMatchTimestamp(match.date)}</span>
                      <span className="match-sep">|</span>
                      <span className="match-rounds">{match.roundCount || 0} rounds</span>
                      <span className="match-sep">|</span>
                      <span className="match-duration">{formatMatchDuration(match.totalTimeSeconds)}</span>
                      <span className="match-sep">|</span>
                      <span className="match-winner">
                        winner:{" "}
                        <span className="match-winner-team" data-team={winnerTeam}>
                          {winnerTeam}
                        </span>
                      </span>
                    </div>
                    <div className="match-detail-body">
                      {!detail && <div className="match-detail-loading">loading details...</div>}
                      {detail && (
                        <div className="match-table">
                          <div className="match-table-header">
                            <span>team</span>
                            <span>player</span>
                            <span>team score</span>
                            <span>player score</span>
                            <span>k/d</span>
                          </div>
                          {[...(detail.teams || [])].sort((a, b) => (b.score || 0) - (a.score || 0)).map((team, idx) => {
                            const teamKey = normalizeTeamName(team.teamName);
                            return (
                            <div key={`${match.id}-${team.teamName || "team"}-${idx}`}>
                              <div className="match-table-row match-team-row" data-team={teamKey}>
                                <span className="match-team" data-team={teamKey}>
                                  {team.teamName || "team"}
                                </span>
                                <span></span>
                                <span className="match-team-score">{team.score ?? 0}</span>
                                <span></span>
                                <span></span>
                              </div>
                              {(team.players || []).map((player, playerIdx) => {
                                const totals = getPlayerTotals(player);
                                const kd = totals.hasData ? (totals.deaths > 0 ? (totals.kills / totals.deaths).toFixed(2) : `${totals.kills}.00`) : "—";
                                const name = player.nickname || player.username || "player";
                                return (
                                  <div className="match-table-row" key={`${match.id}-${name}-${playerIdx}`} data-team={teamKey}>
                                    <span className="match-team"></span>
                                    <span className="match-player">{name}</span>
                                    <span></span>
                                    <span className="match-player-score">{totals.hasData ? totals.score : "—"}</span>
                                    <span className="match-player-kd">
                                      {kd}
                                      {totals.hasData && (
                                        <span className="match-kd-breakdown">
                                          <span className="match-kills">{totals.kills}</span>
                                          <span className="match-kd-sep">/</span>
                                          <span className="match-deaths">{totals.deaths}</span>
                                        </span>
                                      )}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {boardMode === "sumobar" && isSumobarMatchesOpen && (
        <div className="match-history-overlay" onClick={() => setIsSumobarMatchesOpen(false)}>
          <div className="match-history-panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="sumobar recent matches">
            <div className="match-history-header">
              <div className="match-history-title">match history</div>
              <div className="match-history-meta">sumobar · recent</div>
              <button className="match-history-close" type="button" onClick={() => setIsSumobarMatchesOpen(false)} aria-label="close sumobar matches">
                ×
              </button>
            </div>
            <div className="match-history-list">
              {sumobarMatchesLoading && <div className="match-empty">loading recent matches...</div>}
              {!sumobarMatchesLoading && sumobarMatchesError && <div className="match-empty">{sumobarMatchesError}</div>}
              {!sumobarMatchesLoading && !sumobarMatchesError && sumobarMatches.length === 0 && <div className="match-empty">no recent matches</div>}
              {!sumobarMatchesLoading &&
                !sumobarMatchesError &&
                sumobarMatches.map((match) => (
                  <div key={match.matchId} className="sumobar-popup-row">
                    <span className="sumobar-popup-id" title={match.matchId}>
                      {shortMatchId(match.matchId)}
                    </span>
                    <span className="sumobar-popup-sep">|</span>
                    <span className="sumobar-popup-rounds">{match.roundsPlayed} rounds</span>
                    <span className="sumobar-popup-sep">|</span>
                    <span className="sumobar-popup-team">winner: {match.winnerTeam || "-"}</span>
                    <span className="sumobar-popup-sep">|</span>
                    <span className="sumobar-popup-players">
                      {match.winnerPlayers.length > 0 ? match.winnerPlayers.join(", ") : "-"}
                    </span>
                    <span className="sumobar-popup-sep">|</span>
                    <span className="sumobar-popup-time">{formatDateTime(match.endedAt)}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      <div className="main-content">
        {boardMode === "tst" && (
          <div className={`leaderboard-wrapper ${advanced ? "" : "simple-mode"}${transitioning ? " transitioning" : ""}`}>
            <div className="leaderboard-header">
              {SORTABLE_COLUMNS.map(([key, label, className]) =>
                (() => {
                  const isSortable = key !== "rank";
                  return (
                    <div
                      key={key}
                      className={`${className} ${isSortable ? "sortable-header" : ""} ${sorting.key === key ? "is-active-sort" : ""} ${
                        columnVisibility[key as keyof typeof DEFAULT_COLUMN_VISIBILITY] === false ? "is-hidden-column" : ""
                      }`}
                      onClick={isSortable ? () => toggleSort(key) : undefined}
                      aria-sort={isSortable ? (sorting.key === key ? (sorting.dir === "asc" ? "ascending" : "descending") : "none") : undefined}
                    >
                      <span className="sortable-header-label">{label}</span>
                      {isSortable && sorting.key === key && (
                        <span className="sort-indicator active" aria-hidden="true">
                          {sorting.dir === "asc" ? "↑" : "↓"}
                        </span>
                      )}
                    </div>
                  );
                })()
              )}
              <div className={`tier-col ${columnVisibility.tier === false ? "is-hidden-column" : ""}`}>Rank</div>
            </div>

            <div className="leaderboard-content" id="leaderboard">
              {loading && (
                <div className="loading-container">
                  <div className="loading-text">loading leaderboard...</div>
                </div>
              )}
              {!loading && error && (
                <div className="loading-container">
                  <div className="loading-text">{error}</div>
                </div>
              )}
              {!loading &&
                !error &&
                paged.map((player) => {
                  const rank = getRankMeta(player.elo || 1500);
                  const winrate = Math.round((player.winrate || 0) * 100);
                  return (
                    <div key={player.name} className={`leaderboard-entry rank-tint-${rank.class}`}>
                      <div className="rank-position">{player.rank}</div>
                      <div className="player">
                        <Link className="username profile-link" href={`/profile?user=${encodeURIComponent(player.name)}`}>
                          {player.name}
                        </Link>
                      </div>
                      <div className="rating">{player.elo}</div>
                      <div className={`change ${player.latestChange >= 0 ? "positive" : "negative"}`}>
                        {player.latestChange >= 0 ? "+" : ""}
                        {player.latestChange}
                      </div>
                      <div className={`last-active ${columnVisibility.lastActive === false ? "is-hidden-column" : ""}`}>{player.lastActive}</div>
                      <div className={`matches ${columnVisibility.matches === false ? "is-hidden-column" : ""}`}>
                        <div className="winrate-bar">
                          <div
                            className="winrate-fill"
                            style={{
                              width: "100%",
                              background: `linear-gradient(90deg, #10b981 0%, #10b981 ${Math.max(0, player.pos1Rate - 1)}%, #fcd34d ${
                                player.pos1Rate + 1
                              }%, #fcd34d ${Math.max(0, player.pos1Rate + player.pos2Rate - 1)}%, #f97316 ${player.pos1Rate + player.pos2Rate + 1}%, #f97316 ${Math.max(
                                0,
                                player.pos1Rate + player.pos2Rate + player.pos3Rate - 1
                              )}%, #ef4444 ${player.pos1Rate + player.pos2Rate + player.pos3Rate + 1}%, #ef4444 100%)`
                            }}
                          />
                        </div>
                        <span className="matches-count">{player.matches}</span>
                      </div>
                      <div className={`percentage ${columnVisibility.winrate === false ? "is-hidden-column" : ""}`}>{winrate}%</div>
                      <div className={`stat avg-place ${columnVisibility.avgPlace === false ? "is-hidden-column" : ""}`}>{player.avgPlace.toFixed(1)}</div>
                      <div className={`score avg-score-cell ${columnVisibility.avgScore === false ? "is-hidden-column" : ""}`}>{player.avgScore}</div>
                      <div className={`score high-score ${columnVisibility.highScore === false ? "is-hidden-column" : ""}`}>{player.highScore}</div>
                      <div className={`kd ${columnVisibility.kd === false ? "is-hidden-column" : ""}`}>{player.kd.toFixed(2)}</div>
                      <Link href="/ranks" className={`tier ${rank.class} ${columnVisibility.tier === false ? "is-hidden-column" : ""}`}>
                        <img className="rank-icon" src={rank.icon} alt={rank.name} />
                        <span className="rank-name">{rank.name}</span>
                      </Link>
                    </div>
                  );
                })}
            </div>

            <div className="datatable-pagination">
              <button className="datatable-page-btn" type="button" onClick={() => setPageIndex((p) => Math.max(0, p - 1))} disabled={clampedPageIndex <= 0}>
                Previous
              </button>
              <div className="datatable-page-indicator">
                Page {clampedPageIndex + 1} of {totalPages}
              </div>
              <button
                className="datatable-page-btn"
                type="button"
                onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))}
                disabled={clampedPageIndex >= totalPages - 1}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {boardMode === "sumobar" && (
          <div className={`leaderboard-wrapper ${advanced ? "" : "simple-mode"}${transitioning ? " transitioning" : ""}`}>
            <div className="leaderboard-header">
              <div
                className={`rank-col sortable-header ${sumobarSorting.key === "rank" ? "is-active-sort" : ""}`}
                onClick={() => toggleSumobarSort("rank")}
                aria-sort={sumobarSorting.key === "rank" ? (sumobarSorting.dir === "asc" ? "ascending" : "descending") : "none"}
              >
                <span className="sortable-header-label">#</span>
                {sumobarSorting.key === "rank" && <span className="sort-indicator active">{sumobarSorting.dir === "asc" ? "↑" : "↓"}</span>}
              </div>
              <div
                className={`player-col sortable-header ${sumobarSorting.key === "player" ? "is-active-sort" : ""}`}
                onClick={() => toggleSumobarSort("player")}
                aria-sort={sumobarSorting.key === "player" ? (sumobarSorting.dir === "asc" ? "ascending" : "descending") : "none"}
              >
                <span className="sortable-header-label">Player</span>
                {sumobarSorting.key === "player" && <span className="sort-indicator active">{sumobarSorting.dir === "asc" ? "↑" : "↓"}</span>}
              </div>
              <div
                className={`rating-col sortable-header ${sumobarSorting.key === "elo" ? "is-active-sort" : ""}`}
                onClick={() => toggleSumobarSort("elo")}
                aria-sort={sumobarSorting.key === "elo" ? (sumobarSorting.dir === "asc" ? "ascending" : "descending") : "none"}
              >
                <span className="sortable-header-label">Rating</span>
                {sumobarSorting.key === "elo" && <span className="sort-indicator active">{sumobarSorting.dir === "asc" ? "↑" : "↓"}</span>}
              </div>
              <div
                className={`change-col sortable-header ${columnVisibility.lastActive === false ? "is-hidden-column" : ""} ${sumobarSorting.key === "kills" ? "is-active-sort" : ""}`}
                onClick={() => toggleSumobarSort("kills")}
                aria-sort={sumobarSorting.key === "kills" ? (sumobarSorting.dir === "asc" ? "ascending" : "descending") : "none"}
              >
                <span className="sortable-header-label">Kills</span>
                {sumobarSorting.key === "kills" && <span className="sort-indicator active">{sumobarSorting.dir === "asc" ? "↑" : "↓"}</span>}
              </div>
              <div
                className={`activity-col sortable-header ${columnVisibility.lastActive === false ? "is-hidden-column" : ""} ${sumobarSorting.key === "lastActive" ? "is-active-sort" : ""}`}
                onClick={() => toggleSumobarSort("lastActive")}
                aria-sort={sumobarSorting.key === "lastActive" ? (sumobarSorting.dir === "asc" ? "ascending" : "descending") : "none"}
              >
                <span className="sortable-header-label">Last Active</span>
                {sumobarSorting.key === "lastActive" && <span className="sort-indicator active">{sumobarSorting.dir === "asc" ? "↑" : "↓"}</span>}
              </div>
              <div
                className={`matches-col sortable-header ${columnVisibility.matches === false ? "is-hidden-column" : ""} ${sumobarSorting.key === "matches" ? "is-active-sort" : ""}`}
                onClick={() => toggleSumobarSort("matches")}
                aria-sort={sumobarSorting.key === "matches" ? (sumobarSorting.dir === "asc" ? "ascending" : "descending") : "none"}
              >
                <span className="sortable-header-label">Matches</span>
                {sumobarSorting.key === "matches" && <span className="sort-indicator active">{sumobarSorting.dir === "asc" ? "↑" : "↓"}</span>}
              </div>
              <div
                className={`winrate-col sortable-header ${columnVisibility.winrate === false ? "is-hidden-column" : ""} ${sumobarSorting.key === "deaths" ? "is-active-sort" : ""}`}
                onClick={() => toggleSumobarSort("deaths")}
                aria-sort={sumobarSorting.key === "deaths" ? (sumobarSorting.dir === "asc" ? "ascending" : "descending") : "none"}
              >
                <span className="sortable-header-label">Deaths</span>
                {sumobarSorting.key === "deaths" && <span className="sort-indicator active">{sumobarSorting.dir === "asc" ? "↑" : "↓"}</span>}
              </div>
              <div
                className={`avg-place-col sortable-header ${columnVisibility.avgPlace === false ? "is-hidden-column" : ""} ${sumobarSorting.key === "avgPosition" ? "is-active-sort" : ""}`}
                onClick={() => toggleSumobarSort("avgPosition")}
                aria-sort={sumobarSorting.key === "avgPosition" ? (sumobarSorting.dir === "asc" ? "ascending" : "descending") : "none"}
              >
                <span className="sortable-header-label">Avg Pos</span>
                {sumobarSorting.key === "avgPosition" && <span className="sort-indicator active">{sumobarSorting.dir === "asc" ? "↑" : "↓"}</span>}
              </div>
              <div
                className={`avg-score-col sortable-header ${columnVisibility.avgScore === false ? "is-hidden-column" : ""} ${sumobarSorting.key === "avgScore" ? "is-active-sort" : ""}`}
                onClick={() => toggleSumobarSort("avgScore")}
                aria-sort={sumobarSorting.key === "avgScore" ? (sumobarSorting.dir === "asc" ? "ascending" : "descending") : "none"}
              >
                <span className="sortable-header-label">Avg Score</span>
                {sumobarSorting.key === "avgScore" && <span className="sort-indicator active">{sumobarSorting.dir === "asc" ? "↑" : "↓"}</span>}
              </div>
              <div
                className={`high-score-col sortable-header ${columnVisibility.highScore === false ? "is-hidden-column" : ""} ${sumobarSorting.key === "kdDiff" ? "is-active-sort" : ""}`}
                onClick={() => toggleSumobarSort("kdDiff")}
                aria-sort={sumobarSorting.key === "kdDiff" ? (sumobarSorting.dir === "asc" ? "ascending" : "descending") : "none"}
              >
                <span className="sortable-header-label">K-D Diff</span>
                {sumobarSorting.key === "kdDiff" && <span className="sort-indicator active">{sumobarSorting.dir === "asc" ? "↑" : "↓"}</span>}
              </div>
              <div
                className={`kd-col sortable-header ${columnVisibility.kd === false ? "is-hidden-column" : ""} ${sumobarSorting.key === "kd" ? "is-active-sort" : ""}`}
                onClick={() => toggleSumobarSort("kd")}
                aria-sort={sumobarSorting.key === "kd" ? (sumobarSorting.dir === "asc" ? "ascending" : "descending") : "none"}
              >
                <span className="sortable-header-label">K/D</span>
                {sumobarSorting.key === "kd" && <span className="sort-indicator active">{sumobarSorting.dir === "asc" ? "↑" : "↓"}</span>}
              </div>
              <div className={`tier-col ${columnVisibility.tier === false ? "is-hidden-column" : ""}`}>Rank</div>
            </div>
            <div className="leaderboard-content" id="sumobar-leaderboard">
              {sumobarLoading && (
                <div className="loading-container">
                  <div className="loading-text">loading sumobar leaderboard...</div>
                </div>
              )}
              {!sumobarLoading && sumobarError && (
                <div className="loading-container">
                  <div className="loading-text">{sumobarError}</div>
                </div>
              )}
              {!sumobarLoading && !sumobarError && sortedSumobarRows.length === 0 && (
                <div className="loading-container">
                  <div className="loading-text">no players found</div>
                </div>
              )}
              {!sumobarLoading &&
                !sumobarError &&
                sortedSumobarRows.map((row) => {
                  const rankMeta = getRankMeta(row.elo || 1500);
                  const kd = (row.kills / Math.max(row.deaths, 1)).toFixed(2);
                  const kdDiff = row.kills - row.deaths;
                  return (
                    <div key={`${row.playerAuth}-${row.rank}`} className={`leaderboard-entry rank-tint-${rankMeta.class}`}>
                      <div className="rank-position">{row.rank}</div>
                      <div className="player">
                        <span className="username">{row.playerAuth}</span>
                      </div>
                      <div className="rating">{row.elo}</div>
                      <div className={`change ${columnVisibility.lastActive === false ? "is-hidden-column" : ""}`}>{row.kills}</div>
                      <div className={`last-active ${columnVisibility.lastActive === false ? "is-hidden-column" : ""}`}>{formatLastActive(row.updatedAt)}</div>
                      <div className={`matches ${columnVisibility.matches === false ? "is-hidden-column" : ""}`}>
                        <div className="winrate-bar">
                          <div
                            className="winrate-fill"
                            style={{
                              width: "100%",
                              background: getSumobarMatchesGradient(row.placementRates, row.avgPosition, row.matchesPlayed)
                            }}
                          />
                        </div>
                        <span className="matches-count">{row.matchesPlayed}</span>
                      </div>
                      <div className={`percentage ${columnVisibility.winrate === false ? "is-hidden-column" : ""}`}>{row.deaths}</div>
                      <div className={`stat avg-place ${columnVisibility.avgPlace === false ? "is-hidden-column" : ""}`}>
                        {row.avgPosition === null ? "-" : row.avgPosition.toFixed(2)}
                      </div>
                      <div className={`score avg-score-cell ${columnVisibility.avgScore === false ? "is-hidden-column" : ""}`}>
                        {row.avgScore === null ? "-" : row.avgScore.toFixed(1)}
                      </div>
                      <div className={`score high-score ${columnVisibility.highScore === false ? "is-hidden-column" : ""}`}>
                        {kdDiff >= 0 ? "+" : ""}
                        {kdDiff}
                      </div>
                      <div className={`kd ${columnVisibility.kd === false ? "is-hidden-column" : ""}`}>{kd}</div>
                      <Link href="/ranks" className={`tier ${rankMeta.class} ${columnVisibility.tier === false ? "is-hidden-column" : ""}`}>
                        <img className="rank-icon" src={rankMeta.icon} alt={rankMeta.name} />
                        <span className="rank-name">{rankMeta.name}</span>
                      </Link>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </div>

      <p className="leaderboard-data-credit">
        {boardMode === "sumobar" ? "data provided by RCL" : "data gracefully provided by Nanu and Nelg"}
      </p>
    </div>
  );
}
