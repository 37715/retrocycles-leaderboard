"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { SEASONS, getPlayerProfileView, getRankMeta } from "@/src/lib/rclApi";
import type { ProfileRow, ProfileSummary, Season } from "@/src/lib/types";

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

export function ProfileApp() {
  const params = useSearchParams();
  const username = params.get("user") || params.get("username") || "";
  const [season, setSeason] = useState<Season>("2026");
  const [rows, setRows] = useState<ProfileRow[]>([]);
  const [summary, setSummary] = useState<ProfileSummary>(DEFAULT_SUMMARY);
  const [leaderboardRank, setLeaderboardRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    if (!username) {
      setLoading(false);
      return;
    }
    let ignore = false;
    setLoading(true);
    setError("");

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

    return () => {
      ignore = true;
    };
  }, [season, username]);

  const rankInfo = getRankMeta(summary.latestElo || 0);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      // no-op
    }
  };

  return (
    <div className="container profile-container">
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
            <Link href="/leaderboard" className="nav-link group">
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

      <Link href="/leaderboard" className="profile-back">
        ← back to leaderboard
      </Link>

      <header className="profile-hero">
        <div className="profile-hero-inner">
          <div className="profile-hero-left">
            <div className="profile-hero-meta">
              <span>player profile</span>
              <select className="profile-season-select" value={season} onChange={(e) => setSeason(e.target.value as Season)}>
                {Object.entries(SEASONS).map(([value, info]) => (
                  <option key={value} value={value}>
                    {info.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="profile-last-online">
              <span className="profile-status-dot"></span>
              <span>last online {summary.latestOnline}</span>
            </div>
            <h1 className="profile-hero-name">{username || "unknown player"}</h1>
            <button className="profile-share-btn profile-share-btn-hero" type="button" onClick={() => setShowShare(true)}>
              share card
            </button>
          </div>
          <div className="profile-hero-right">
            <div className="profile-leaderboard-rank">{leaderboardRank ? `#${leaderboardRank}` : ""}</div>
            <div className="profile-hero-rank">
              <img className="profile-rank-icon" src={rankInfo.icon} alt="rank icon" />
              <div className="profile-rank-info">
                <div className="profile-rank-elo">{summary.latestElo ?? "—"}</div>
                <div className="profile-rank-name">{rankInfo.name}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="profile-body">
        {!username && <div className="profile-loading">no player selected</div>}
        {username && loading && <div className="profile-loading">loading {season} profile...</div>}
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
              <div className="profile-card profile-card-rage">
                <span className="profile-card-label">rage quit rate</span>
                <span className="profile-card-value">{summary.rageQuit}</span>
              </div>
            </div>

            <div className="profile-table" data-collapsed="false">
              <div className="profile-table-title">match history</div>
              <div className="profile-table-header">
                <button type="button">match</button>
                <button type="button">teammate</button>
                <button type="button">exit rating</button>
                <button type="button">change</button>
                <button type="button">team place</button>
                <button type="button">indv place</button>
                <button type="button">played %</button>
                <button type="button">alive %</button>
                <button type="button">score</button>
                <button type="button">k/d</button>
              </div>
              {rows.length === 0 && <div className="profile-loading">no matches found for {season}</div>}
              {rows.slice(0, 40).map((row) => (
                <div key={row.id} className="profile-table-row">
                  <span className="profile-highlight">{row.date}</span>
                  <span>{row.teammates}</span>
                  <span>{row.exitRating}</span>
                  <span>{row.change}</span>
                  <span>{row.teamPlace}</span>
                  <span>{row.individualPlace}</span>
                  <span>{row.played}</span>
                  <span>{row.alive}</span>
                  <span className="profile-highlight">{row.score}</span>
                  <span>{row.kd}</span>
                </div>
              ))}
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
