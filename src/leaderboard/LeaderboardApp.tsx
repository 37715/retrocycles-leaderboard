"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { type LeaderboardRow, type Season } from "@/src/lib/types";
import { SEASONS, getLeaderboardRows, getMatchDetails, getMatchHistory, getRankMeta } from "@/src/lib/rclApi";

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

function getPlayerTotals(player: MatchHistoryDetailTeamPlayer): { kills: number; deaths: number; score: number } {
  const positions = Array.isArray(player.positions) ? player.positions : [];
  return positions.reduce<{ kills: number; deaths: number; score: number }>(
    (acc, entry) => {
      acc.kills += entry.kills || 0;
      acc.deaths += entry.deaths || 0;
      acc.score += (entry.kills || 0) * 30 + (entry.holePoints || 0);
      return acc;
    },
    { kills: 0, deaths: 0, score: 0 }
  );
}

export function LeaderboardPage() {
  const [season, setSeason] = useState<Season>("2026");
  const [region, setRegion] = useState<"combined" | "us" | "eu">("combined");
  const [search, setSearch] = useState("");
  const [advanced, setAdvanced] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [pageSize, setPageSize] = useState(100);
  const [pageIndex, setPageIndex] = useState(0);
  const [sorting, setSorting] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "rank", dir: "asc" });
  const [rows, setRows] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [columnVisibility, setColumnVisibility] = useState(DEFAULT_COLUMN_VISIBILITY);

  const [isMatchOverlayOpen, setIsMatchOverlayOpen] = useState(false);
  const [matchHistoryRows, setMatchHistoryRows] = useState<Array<{ id: string; date?: string; roundCount?: number; totalTimeSeconds?: number; winner?: string }>>([]);
  const [matchDetails, setMatchDetails] = useState<Record<string, MatchHistoryDetail>>({});
  const didMountRef = useRef(false);

  useEffect(() => {
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
  }, [season, region]);

  useEffect(() => {
    if (season === "2023") setRegion("combined");
  }, [season]);

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true;
      return;
    }
    setIsTransitioning(true);
    const timer = window.setTimeout(() => setIsTransitioning(false), 260);
    return () => window.clearTimeout(timer);
  }, [advanced]);

  useEffect(() => {
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
  }, [isMatchOverlayOpen, matchHistoryRows.length]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let nextRows = rows.filter((row) => (q ? row.name.toLowerCase().includes(q) : true));
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
  }, [rows, search, sorting]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const clampedPageIndex = Math.min(pageIndex, totalPages - 1);
  const paged = filtered.slice(clampedPageIndex * pageSize, clampedPageIndex * pageSize + pageSize);

  const toggleSort = (key: SortKey) => {
    setSorting((prev) => {
      if (prev.key === key) {
        return { key, dir: prev.dir === "asc" ? "desc" : "asc" };
      }
      return { key, dir: key === "name" ? "asc" : "desc" };
    });
    setPageIndex(0);
  };

  const loadMatchDetails = async (matchId: string) => {
    if (matchDetails[matchId]) return;
    try {
      const detail = (await getMatchDetails(matchId)) as MatchHistoryDetail;
      setMatchDetails((prev) => ({ ...prev, [matchId]: detail }));
    } catch {
      setMatchDetails((prev) => ({ ...prev, [matchId]: { teams: [] } }));
    }
  };

  return (
    <div className="container">
      <nav className="nav-menu-container">
        <ul className="nav-menu">
          <li className="nav-item">
            <Link href="/mazing" className="nav-link group">
              <span className="nav-text">mazing</span>
              <span className="nav-border-animation"></span>
              <span className="nav-bg-animation"></span>
            </Link>
          </li>
          <li className="nav-item">
            <Link href="/leaderboard" className="nav-link group active">
              <span className="nav-text">leaderboard</span>
              <span className="nav-border-animation"></span>
              <span className="nav-bg-animation"></span>
            </Link>
          </li>
          <li className="nav-item">
            <Link href="/tutorials" className="nav-link group">
              <span className="nav-text">tutorials</span>
              <span className="nav-border-animation"></span>
              <span className="nav-bg-animation"></span>
            </Link>
          </li>
        </ul>
      </nav>

      <header className="header">
        <div className="title-section">
          <div className="title-wrapper">
            <h1 className="title">leaderboard</h1>
          </div>
          <span className="gamemode-badge">TST</span>
          <span className="year-badge">2026</span>
        </div>
        <p className="subtitle">competitive rankings and statistics</p>
        <div className="update-info">• updates hourly •</div>
      </header>

      <div className="controls">
        <div className="control-group">
          <label className="control-label">season</label>
          <select className="season-select" value={season} onChange={(e) => setSeason(e.target.value as Season)}>
            {Object.entries(SEASONS).map(([value, config]) => (
              <option key={value} value={value}>
                {config.label}
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
            <input type="checkbox" checked={advanced} onChange={(e) => setAdvanced(e.target.checked)} />
            <span className="checkmark"></span>
            <span className="control-label">advanced stats</span>
          </label>
        </div>
        <div className="control-group">
          <button className="match-history-btn" type="button" onClick={() => setIsMatchOverlayOpen(true)}>
            match history
          </button>
        </div>
      </div>

      {isMatchOverlayOpen && (
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
                return (
                  <div key={match.id} className="match-item">
                    <div className="match-summary">
                      <span className="match-date">{formatMatchTimestamp(match.date)}</span>
                      <span className="match-sep">|</span>
                      <span className="match-rounds">{match.roundCount || 0} rounds</span>
                      <span className="match-sep">|</span>
                      <span className="match-duration">{formatMatchDuration(match.totalTimeSeconds)}</span>
                      <span className="match-sep">|</span>
                      <span className="match-winner">winner: {String(match.winner || "unknown").toLowerCase()}</span>
                    </div>
                    <div className="match-detail-body">
                      {!detail && (
                        <button className="match-history-more" type="button" onClick={() => loadMatchDetails(match.id)}>
                          load details
                        </button>
                      )}
                      {detail && (
                        <div className="match-table">
                          <div className="match-table-header">
                            <span>team</span>
                            <span>player</span>
                            <span>team score</span>
                            <span>player score</span>
                            <span>k/d</span>
                          </div>
                          {(detail.teams || []).map((team, idx) => (
                            <div key={`${match.id}-${team.teamName || "team"}-${idx}`}>
                              <div className="match-table-row match-team-row">
                                <span className="match-team">{team.teamName || "team"}</span>
                                <span></span>
                                <span className="match-team-score">{team.score ?? 0}</span>
                                <span></span>
                                <span></span>
                              </div>
                              {(team.players || []).map((player, playerIdx) => {
                                const totals = getPlayerTotals(player);
                                const kd = totals.deaths > 0 ? (totals.kills / totals.deaths).toFixed(2) : `${totals.kills}.00`;
                                const name = player.nickname || player.username || "player";
                                return (
                                  <div className="match-table-row" key={`${match.id}-${name}-${playerIdx}`}>
                                    <span className="match-team"></span>
                                    <span className="match-player">{name}</span>
                                    <span></span>
                                    <span className="match-player-score">{totals.score}</span>
                                    <span className="match-player-kd">{kd}</span>
                                  </div>
                                );
                              })}
                            </div>
                          ))}
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

      <div className="main-content">
        <div className={`leaderboard-wrapper ${advanced ? "" : "simple-mode"} ${isTransitioning ? "transitioning" : ""}`}>
          <div className="datatable-toolbar">
            <div className="datatable-toolbar-left">
              <input className="datatable-search" type="text" placeholder="Filter players..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="datatable-toolbar-right">
              <label className="datatable-page-size-label">Rows</label>
              <select
                className="datatable-page-size"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPageIndex(0);
                }}
              >
                {[10, 20, 50, 100].map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <details className="datatable-columns-menu">
                <summary>Columns</summary>
                <div className="datatable-columns-list">
                  {[
                    ["lastActive", "last active"],
                    ["matches", "matches"],
                    ["winrate", "win rate"],
                    ["avgPlace", "avg place"],
                    ["avgScore", "avg score"],
                    ["highScore", "high score"],
                    ["kd", "k/d"],
                    ["tier", "rank"]
                  ].map(([id, label]) => (
                    <label key={id}>
                      <input
                        type="checkbox"
                        checked={columnVisibility[id as keyof typeof DEFAULT_COLUMN_VISIBILITY] !== false}
                        onChange={(e) => setColumnVisibility((prev) => ({ ...prev, [id]: e.target.checked }))}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </details>
            </div>
          </div>

          <div className="leaderboard-header">
            {SORTABLE_COLUMNS.map(([key, label, className]) => (
              <div
                key={key}
                className={`${className} sortable-header ${
                  columnVisibility[key as keyof typeof DEFAULT_COLUMN_VISIBILITY] === false ? "is-hidden-column" : ""
                }`}
                onClick={() => toggleSort(key)}
              >
                {label}
              </div>
            ))}
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
            <button className="datatable-page-btn" type="button" onClick={() => setPageIndex((p) => Math.min(totalPages - 1, p + 1))} disabled={clampedPageIndex >= totalPages - 1}>
              Next
            </button>
          </div>
        </div>
      </div>

      <p className="leaderboard-data-credit">data gracefully provided by Nanu and Nelg</p>
    </div>
  );
}
