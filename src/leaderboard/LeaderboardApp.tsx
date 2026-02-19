"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { type LeaderboardRow, type Season } from "@/src/lib/types";
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

function shortMatchId(matchId: string): string {
  if (!matchId) return "-";
  return matchId.length > 8 ? `${matchId.slice(0, 8)}…` : matchId;
}

export function LeaderboardApp() {
  const searchParams = useSearchParams();
  const [boardMode, setBoardMode] = useState<BoardMode>("tst");
  const [season, setSeason] = useState<Season>("2026");
  const [region, setRegion] = useState<"combined" | "us" | "eu">("combined");
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
  const [sumobarMatches, setSumobarMatches] = useState<SumobarMatchRow[]>([]);
  const [sumobarMatchesLoading, setSumobarMatchesLoading] = useState(false);
  const [sumobarMatchesError, setSumobarMatchesError] = useState("");
  const [isSumobarMatchesOpen, setIsSumobarMatchesOpen] = useState(false);

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
      const payload = await getSumobarLeaderboard({ limit: 50, offset: 0, minMatches: 1 });
      setSumobarRows(payload.rows);
      setSumobarPagination(payload.pagination);
    } catch (err) {
      const message = err instanceof Error ? err.message : "failed to load sumobar leaderboard";
      setSumobarError(message);
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
  }, [boardMode]);

  useEffect(() => {
    if (boardMode !== "sumobar") return;
    const interval = window.setInterval(() => {
      refreshSumobar();
    }, 30000);
    return () => window.clearInterval(interval);
  }, [boardMode]);

  return (
    <div className="container">
      <PrimaryNav active="leaderboard" />

      <header className="header">
        <div className="title-section">
          <div className="title-wrapper">
            <h1 className="title">leaderboard</h1>
          </div>
          <span className="gamemode-badge">{boardMode === "sumobar" ? "SUMOBAR" : "TST"}</span>
          {boardMode === "tst" && <span className="year-badge">{season}</span>}
        </div>
        <p className="subtitle">competitive rankings and statistics</p>
        <div className="update-info">{boardMode === "sumobar" ? "• updates every 30s •" : "• updates hourly •"}</div>
      </header>

      <div className="controls">
        {boardMode === "tst" && (
          <>
            <div className="control-group">
          <label className="control-label">season</label>
          <select className="season-select" value={season} onChange={(e) => setSeason(e.target.value as Season)}>
            {SEASON_ORDER.map((value) => (
              <option key={value} value={value}>
                {SEASONS[value].label}
              </option>
            ))}
          </select>
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
          <div className="sumobar-layout">
            <section className="sumobar-panel">
              <div className="sumobar-meta">
                <span>showing {sumobarRows.length} players</span>
                <span>api rows: {sumobarPagination.returned}</span>
              </div>
              <div className="sumobar-table-wrap">
                <table className="sumobar-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Player</th>
                      <th>Elo</th>
                      <th>Matches</th>
                      <th>Kills</th>
                      <th>Deaths</th>
                      <th>K/D</th>
                      <th>Avg Score</th>
                      <th>Avg Position</th>
                      <th>Updated</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sumobarLoading && (
                      <tr>
                        <td colSpan={10} className="sumobar-state-cell">
                          loading sumobar leaderboard...
                        </td>
                      </tr>
                    )}
                    {!sumobarLoading && sumobarError && (
                      <tr>
                        <td colSpan={10} className="sumobar-state-cell">
                          {sumobarError}
                        </td>
                      </tr>
                    )}
                    {!sumobarLoading && !sumobarError && sumobarRows.length === 0 && (
                      <tr>
                        <td colSpan={10} className="sumobar-state-cell">
                          no players found
                        </td>
                      </tr>
                    )}
                    {!sumobarLoading &&
                      !sumobarError &&
                      sumobarRows.map((row) => {
                        const kd = (row.kills / Math.max(row.deaths, 1)).toFixed(2);
                        return (
                          <tr key={row.playerAuth}>
                            <td>{row.rank}</td>
                            <td className="sumobar-player-cell">{row.playerAuth}</td>
                            <td>{row.elo}</td>
                            <td>{row.matchesPlayed}</td>
                            <td>{row.kills}</td>
                            <td>{row.deaths}</td>
                            <td>{kd}</td>
                            <td>{row.avgScore === null ? "-" : row.avgScore.toFixed(1)}</td>
                            <td>{row.avgPosition === null ? "-" : row.avgPosition.toFixed(2)}</td>
                            <td>{formatDateTime(row.updatedAt)}</td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}
      </div>

      <p className="leaderboard-data-credit">data gracefully provided by Nanu and Nelg</p>
    </div>
  );
}
