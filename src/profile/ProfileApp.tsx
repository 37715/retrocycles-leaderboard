"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SEASONS, SUMOBAR_SEASONS, getPlayerProfileView, getPlayerSumobarProfileView, getRankMeta } from "@/src/lib/rclApi";
import type { ProfileRow, ProfileSummary, Season } from "@/src/lib/types";
import { PrimaryNav } from "@/src/ui/PrimaryNav";

const DEFAULT_SUMMARY: ProfileSummary = {
  matches: 0,
  avgKd: "0.00",
  avgScore: 0,
  avgAlive: "—",
  winRate: 0,
  rageQuit: "—",
  latestElo: null,
  latestOnline: "—"
};
const SEASON_ORDER: Season[] = ["2026", "2025", "2024", "2023"];
type ProfileMode = "tst" | "sumobar";

type ProfileSortKey = "date" | "teammate" | "exitRating" | "change" | "teamPlace" | "individualPlace" | "played" | "alive" | "score" | "kd";

function parseNumeric(v: string | number): number {
  if (typeof v === "number") return v;
  const n = parseFloat(v.replace(/[^0-9.\-]/g, ""));
  return isNaN(n) ? 0 : n;
}

function parseChange(v: string): number {
  const n = parseInt(v.replace(/[^0-9\-]/g, ""), 10);
  return isNaN(n) ? 0 : n;
}

const PAGE_SIZE = 20;

export function ProfileApp() {
  const params = useSearchParams();
  const username = params.get("user") || params.get("username") || "";
  const [mode, setMode] = useState<ProfileMode>("tst");
  const [season, setSeason] = useState<Season>("2026");
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [summary, setSummary] = useState<ProfileSummary>(DEFAULT_SUMMARY);
  const [leaderboardRank, setLeaderboardRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showShare, setShowShare] = useState(false);
  const [hoveredDot, setHoveredDot] = useState<number | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [sorting, setSorting] = useState<{ key: ProfileSortKey; dir: "asc" | "desc" }>({ key: "date", dir: "desc" });
  const [chartShowAll, setChartShowAll] = useState(false);

  useEffect(() => {
    if (!username) {
      setLoading(false);
      return;
    }
    let ignore = false;
    setLoading(true);
    setError("");

    if (mode === "sumobar") {
      getPlayerSumobarProfileView(username)
        .then((result) => {
          if (ignore) return;
          setRows(Array.isArray(result?.rows) ? result.rows : []);
          setSummary(result?.summary || DEFAULT_SUMMARY);
          setLeaderboardRank(result?.leaderboardRank ?? null);
        })
        .catch((err: Error) => {
          if (!ignore) setError(err.message || "failed to load player profile");
        })
        .finally(() => {
          if (!ignore) setLoading(false);
        });
    } else {
      getPlayerProfileView({ username, season, mode: "tst", region: "combined" })
        .then((result) => {
          if (ignore) return;
          setRows(Array.isArray(result?.rows) ? result.rows : []);
          setSummary(result?.summary || DEFAULT_SUMMARY);
          setLeaderboardRank(result?.leaderboardRank ?? null);
        })
        .catch((err: Error) => {
          if (!ignore) setError(err.message || "failed to load player profile");
        })
        .finally(() => {
          if (!ignore) setLoading(false);
        });
    }

    return () => {
      ignore = true;
    };
  }, [season, username, mode]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
    setSorting({ key: "date", dir: "desc" });
    setChartShowAll(false);
  }, [season, username, mode]);

  const rankInfo = getRankMeta(summary.latestElo || 0);

  const CHART_WINDOW = 60;

  const eloChartData = useMemo(() => {
    if (mode === "sumobar") return null;
    const allPoints = rows
      .filter((r) => typeof r.exitRating === "number")
      .map((r) => ({ elo: r.exitRating as number, date: r.date, dateRaw: r.dateRaw }))
      .reverse();
    if (allPoints.length < 2) return null;

    const totalPoints = allPoints.length;
    const points = (!chartShowAll && totalPoints > CHART_WINDOW)
      ? allPoints.slice(totalPoints - CHART_WINDOW)
      : allPoints;

    const elos = points.map((p) => p.elo);
    const rawMin = Math.min(...elos);
    const rawMax = Math.max(...elos);
    const rawRange = rawMax - rawMin || 1;

    const minVisibleRange = 60;
    let min = rawMin;
    let max = rawMax;
    if (rawRange < minVisibleRange) {
      const mid = (rawMin + rawMax) / 2;
      min = mid - minVisibleRange / 2;
      max = mid + minVisibleRange / 2;
    }
    const range = max - min;

    const padX = 32;
    const padTop = 34;
    const padBottom = 28;
    const w = 600;
    const h = 194;
    const plotW = w - padX * 2;
    const plotH = h - padTop - padBottom;

    const coords = points.map((p, i) => ({
      x: padX + (i / (points.length - 1)) * plotW,
      y: padTop + plotH - ((p.elo - min) / range) * plotH,
      elo: p.elo,
      date: p.date,
    }));

    const gridLines: number[] = [];
    const step = range <= 50 ? 10 : range <= 150 ? 25 : range <= 400 ? 50 : 100;
    const gridStart = Math.ceil(min / step) * step;
    for (let v = gridStart; v <= max; v += step) gridLines.push(v);

    return { coords, min, max, range, w, h, padX, padTop, padBottom, plotH, plotW, gridLines, step, totalPoints };
  }, [rows, chartShowAll, mode]);

  const eloNetChange = useMemo(() => {
    if (rows.length === 0) return null;
    let total = 0;
    for (const r of rows) total += parseChange(r.change);
    return total;
  }, [rows]);

  const bestMatchIndices = useMemo(() => {
    const indices = new Set<number>();
    for (let i = 0; i < rows.length; i++) {
      if (rows[i].score > 1000) indices.add(i);
    }
    return indices;
  }, [rows]);

  const sortedRows = useMemo(() => {
    const indexed = rows.map((r, i) => ({ ...r, _origIdx: i }));
    const { key, dir } = sorting;
    const mult = dir === "asc" ? 1 : -1;

    indexed.sort((a, b) => {
      let va: number, vb: number;
      switch (key) {
        case "date": va = a.dateRaw; vb = b.dateRaw; break;
        case "teammate": return mult * String(a.teammates).localeCompare(String(b.teammates));
        case "exitRating": va = parseNumeric(a.exitRating); vb = parseNumeric(b.exitRating); break;
        case "change": va = parseChange(a.change); vb = parseChange(b.change); break;
        case "teamPlace": va = parseNumeric(a.teamPlace); vb = parseNumeric(b.teamPlace); break;
        case "individualPlace": va = parseNumeric(a.individualPlace); vb = parseNumeric(b.individualPlace); break;
        case "played": va = parseNumeric(a.played); vb = parseNumeric(b.played); break;
        case "alive": va = parseNumeric(a.alive); vb = parseNumeric(b.alive); break;
        case "score": va = a.score; vb = b.score; break;
        case "kd": va = parseNumeric(a.kd); vb = parseNumeric(b.kd); break;
        default: va = a.dateRaw; vb = b.dateRaw;
      }
      return mult * (va - vb);
    });
    return indexed;
  }, [rows, sorting]);

  const handleSort = useCallback((key: ProfileSortKey) => {
    setSorting((prev) => ({
      key,
      dir: prev.key === key && prev.dir === "desc" ? "asc" : "desc",
    }));
  }, []);

  const sortIndicator = (key: ProfileSortKey) => {
    if (sorting.key !== key) return null;
    return sorting.dir === "asc" ? " ▲" : " ▼";
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      // no-op
    }
  };

  const splitTeammates = (raw: string) =>
    raw.split(/[,&+\/]/).map((t) => t.trim()).filter(Boolean);

  return (
    <div className="container profile-container">
      <PrimaryNav active="none" />

      <div className="profile-top-bar">
        <Link href="/leaderboard" className="profile-back">
          ← back to leaderboard
        </Link>
        <div className="profile-controls">
          <div className="profile-mode-toggle">
            <button
              type="button"
              className={`profile-mode-btn ${mode === "tst" ? "active" : ""}`}
              onClick={() => setMode("tst")}
            >
              tst
            </button>
            <button
              type="button"
              className={`profile-mode-btn ${mode === "sumobar" ? "active" : ""}`}
              onClick={() => setMode("sumobar")}
            >
              sumobar
            </button>
          </div>
          {mode === "tst" ? (
            <select className="profile-season-select" value={season} onChange={(e) => setSeason(e.target.value as Season)}>
              {SEASON_ORDER.map((value) => (
                <option key={value} value={value}>
                  {SEASONS[value].label}
                </option>
              ))}
            </select>
          ) : (
            <span className="profile-season-label">{SUMOBAR_SEASONS["2026"].label}</span>
          )}
        </div>
      </div>

      <header className="profile-hero">
        <div className="profile-hero-inner">
          <div className="profile-hero-left">
            <h1 className="profile-hero-name">{username || "unknown player"}</h1>
            <div className="profile-hero-meta">
              <span>player profile</span>
              <span className="profile-hero-mode"> · {mode === "sumobar" ? "sumobar" : "tst"}</span>
            </div>
            <div className="profile-last-online">
              <span className="profile-status-dot"></span>
              <span>last online {summary.latestOnline}</span>
            </div>
            <button className="profile-share-btn profile-share-btn-hero" type="button" onClick={() => setShowShare(true)}>
              share card
            </button>
          </div>
          <div className="profile-hero-right">
            <div className="profile-hero-rank">
              <img className="profile-rank-icon" src={rankInfo.icon} alt="rank icon" />
              <div className="profile-rank-info">
                <div className="profile-rank-elo">{summary.latestElo ?? "—"}</div>
                <div className="profile-rank-name">{rankInfo.name}</div>
                {leaderboardRank && <div className="profile-rank-position">#{leaderboardRank}</div>}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="profile-body">
        {!username && <div className="profile-loading">no player selected</div>}
        {username && loading && <div className="profile-loading">loading {mode === "sumobar" ? "sumobar" : season} profile...</div>}
        {username && !loading && error && <div className="profile-loading">{error}</div>}
        {username && !loading && !error && (
          <>
            <div className="profile-summary">
              <div className="profile-card">
                <span className="profile-card-label">matches</span>
                <span className="profile-card-value">{summary.matches}</span>
              </div>
              <div className="profile-card">
                <span className="profile-card-label">avg k/d</span>
                <span className="profile-card-value">{summary.avgKd}</span>
              </div>
              <div className="profile-card">
                <span className="profile-card-label">avg score</span>
                <span className="profile-card-value">{summary.avgScore}</span>
              </div>
              <div className="profile-card">
                <span className="profile-card-label">avg alive</span>
                <span className="profile-card-value">{summary.avgAlive}</span>
              </div>
              <div className="profile-card">
                <span className="profile-card-label">win rate</span>
                <span className="profile-card-value">{summary.winRate}%</span>
                <div className="profile-winrate-bar">
                  <div className="profile-winrate-fill" style={{ width: `${Math.min(100, summary.winRate)}%` }} />
                </div>
              </div>
              <div className="profile-card profile-card-rage">
                <span className="profile-card-label">rage quit rate</span>
                <span className="profile-card-value">{summary.rageQuit}</span>
              </div>
            </div>

            {eloChartData && (
              <div className="profile-elo-chart">
                <div className="profile-elo-chart-header">
                  <div className="profile-elo-chart-title">elo progression</div>
                  {eloChartData.totalPoints > CHART_WINDOW && (
                    <button
                      type="button"
                      className="profile-elo-chart-toggle"
                      data-mode={chartShowAll ? "full" : "zoomed"}
                      onClick={() => setChartShowAll((v) => !v)}
                    >
                      {chartShowAll ? `⟨ last ${CHART_WINDOW}` : `all ${eloChartData.totalPoints} matches ⟩`}
                    </button>
                  )}
                </div>
                <svg
                  className="profile-elo-svg"
                  viewBox={`0 0 ${eloChartData.w} ${eloChartData.h}`}
                  preserveAspectRatio="xMidYMid meet"
                >
                  <defs>
                    <linearGradient id="eloFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(124,58,237,0.25)" />
                      <stop offset="100%" stopColor="rgba(124,58,237,0)" />
                    </linearGradient>
                  </defs>
                  {eloChartData.gridLines.map((v) => {
                    const y = eloChartData.padTop + eloChartData.plotH - ((v - eloChartData.min) / eloChartData.range) * eloChartData.plotH;
                    return (
                      <g key={v}>
                        <line x1={eloChartData.padX} y1={y} x2={eloChartData.w - eloChartData.padX} y2={y} stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
                        <text x={eloChartData.padX - 6} y={y + 3} textAnchor="end" fill="rgba(255,255,255,0.25)" fontSize="9" fontFamily="inherit">{v}</text>
                      </g>
                    );
                  })}
                  <polygon
                    points={[
                      ...eloChartData.coords.map((c) => `${c.x},${c.y}`),
                      `${eloChartData.coords[eloChartData.coords.length - 1].x},${eloChartData.padTop + eloChartData.plotH}`,
                      `${eloChartData.coords[0].x},${eloChartData.padTop + eloChartData.plotH}`,
                    ].join(" ")}
                    fill="url(#eloFill)"
                  />
                  <polyline
                    points={eloChartData.coords.map((c) => `${c.x},${c.y}`).join(" ")}
                    fill="none"
                    stroke="#7c3aed"
                    strokeWidth="2"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                  {eloChartData.coords.map((c, i) => (
                    <g key={i}>
                      <circle
                        cx={c.x} cy={c.y}
                        r={hoveredDot === i ? 4.5 : 2.5}
                        fill={hoveredDot === i ? "#a78bfa" : "#7c3aed"}
                        stroke="rgba(255,255,255,0.5)" strokeWidth="1"
                        className="elo-chart-dot"
                        onMouseEnter={() => setHoveredDot(i)}
                        onMouseLeave={() => setHoveredDot(null)}
                      />
                      {hoveredDot === i && (
                        <g style={{ pointerEvents: "none" }}>
                          <rect x={c.x - 20} y={c.y - 22} width="40" height="16" rx="4" fill="rgba(11,11,11,0.9)" stroke="rgba(124,58,237,0.4)" strokeWidth="1" />
                          <text x={c.x} y={c.y - 11} textAnchor="middle" fill="#e9e9ef" fontSize="9" fontFamily="inherit">{c.elo}</text>
                        </g>
                      )}
                    </g>
                  ))}
                </svg>
              </div>
            )}

            <div className="profile-table" data-collapsed="false">
              <div className="profile-table-title">match history</div>
              <div className="profile-table-header">
                <button type="button" onClick={() => handleSort("date")} className={sorting.key === "date" ? "active" : ""}>match{sortIndicator("date")}</button>
                <button type="button" onClick={() => handleSort("teammate")} className={sorting.key === "teammate" ? "active" : ""}>teammate{sortIndicator("teammate")}</button>
                <button type="button" onClick={() => handleSort("exitRating")} className={sorting.key === "exitRating" ? "active" : ""}>exit rating{sortIndicator("exitRating")}</button>
                <button type="button" onClick={() => handleSort("change")} className={sorting.key === "change" ? "active" : ""}>change{sortIndicator("change")}</button>
                <button type="button" onClick={() => handleSort("teamPlace")} className={sorting.key === "teamPlace" ? "active" : ""}>team place{sortIndicator("teamPlace")}</button>
                <button type="button" onClick={() => handleSort("individualPlace")} className={sorting.key === "individualPlace" ? "active" : ""}>indv place{sortIndicator("individualPlace")}</button>
                <button type="button" onClick={() => handleSort("played")} className={sorting.key === "played" ? "active" : ""}>played %{sortIndicator("played")}</button>
                <button type="button" onClick={() => handleSort("alive")} className={sorting.key === "alive" ? "active" : ""}>alive %{sortIndicator("alive")}</button>
                <button type="button" onClick={() => handleSort("score")} className={sorting.key === "score" ? "active" : ""}>score{sortIndicator("score")}</button>
                <button type="button" onClick={() => handleSort("kd")} className={sorting.key === "kd" ? "active" : ""}>k/d{sortIndicator("kd")}</button>
              </div>
              {rows.length === 0 && <div className="profile-loading">no matches found for {mode === "sumobar" ? "sumobar" : season}</div>}
              {sortedRows.slice(0, visibleCount).map((row) => {
                const changeVal = parseChange(row.change);
                const isBest = bestMatchIndices.has(row._origIdx);
                const rowClass = [
                  "profile-table-row",
                  changeVal > 0 ? "profile-row-positive" : changeVal < 0 ? "profile-row-negative" : "",
                  isBest ? "profile-row-best" : "",
                ].filter(Boolean).join(" ");

                const teammates = splitTeammates(String(row.teammates));

                return (
                  <div key={row.id} className={rowClass}>
                    <span className="profile-highlight">{row.date}</span>
                    <span className="profile-teammates">
                      {teammates.map((t, ti) => (
                        <span key={ti}>
                          {ti > 0 && ", "}
                          <Link href={`/profile?user=${encodeURIComponent(t)}`} className="profile-teammate-link">{t}</Link>
                        </span>
                      ))}
                    </span>
                    <span>{row.exitRating}</span>
                    <span className={changeVal > 0 ? "change-positive" : changeVal < 0 ? "change-negative" : ""}>{row.change}</span>
                    <span>{row.teamPlace}</span>
                    <span>{row.individualPlace}</span>
                    <span>{row.played}</span>
                    <span>{row.alive}</span>
                    <span className="profile-highlight">{row.score}</span>
                    <span>{row.kd}</span>
                  </div>
                );
              })}
              {sortedRows.length > visibleCount && (
                <button
                  type="button"
                  className="profile-show-more"
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                >
                  show more ({sortedRows.length - visibleCount} remaining)
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {showShare && (
        <div className="profile-card-overlay" onClick={() => setShowShare(false)}>
          <div className="profile-card-modal" onClick={(e) => e.stopPropagation()}>
            <div className="profile-card-close-row">
              <button className="profile-card-close" type="button" aria-label="close profile card" onClick={() => setShowShare(false)}>
                ×
              </button>
            </div>
            <div className="profile-share-card">
              <div className="profile-share-gloss"></div>
              <div className="profile-share-meta">rcl player</div>
              <div className="profile-share-name">{username || "player"}</div>
              <div className="profile-share-rank">
                <img src={rankInfo.icon} alt="rank icon" />
                <span>{rankInfo.name}</span>
              </div>
              <div className="profile-share-stats">
                <div className="profile-share-stat">
                  <span>rank</span>
                  <strong>{leaderboardRank ? `#${leaderboardRank}` : "—"}</strong>
                </div>
                <div className="profile-share-stat">
                  <span>elo</span>
                  <strong>{summary.latestElo ?? "—"}</strong>
                </div>
                <div className="profile-share-stat">
                  <span>win rate</span>
                  <strong>{summary.winRate}%</strong>
                </div>
                <div className="profile-share-stat">
                  <span>k/d</span>
                  <strong>{summary.avgKd}</strong>
                </div>
              </div>
            </div>
            <button className="profile-card-share" type="button" onClick={copyLink}>
              copy share link
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
