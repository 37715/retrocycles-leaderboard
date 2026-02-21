"use client";

import { useMemo, useState } from "react";
import { PrimaryNav } from "@/src/ui/PrimaryNav";

type AwardGroup = "playstyle" | "personality" | "fortress" | "sumo" | "stats";

interface HighlightStat {
  label: string;
  value: string;
  note: string;
}

interface Award {
  title: string;
  winner: string;
  stat: string;
  runnerUp?: string;
}

interface PodiumEntry {
  player: string;
  note: string;
}

const HIGHLIGHT_STATS: HighlightStat[] = [
  { label: "matches played", value: "3,104", note: "all tracked pickup matches in 2025" },
  { label: "rounds played", value: "51,882", note: "across TST, sumo, and fortress" },
  { label: "kills", value: "329,440", note: "total confirmed eliminations" },
  { label: "zone conquers", value: "248,903", note: "fort + tst aggregate" }
];

const AWARD_GROUPS: Array<{ id: AwardGroup; label: string; subtitle: string }> = [
  { id: "playstyle", label: "playstyle", subtitle: "how people actually play" },
  { id: "personality", label: "personality", subtitle: "community voted chaos" },
  { id: "fortress", label: "fortress", subtitle: "team fortress excellence" },
  { id: "sumo", label: "sumo", subtitle: "sumobar specialists" },
  { id: "stats", label: "stats awards", subtitle: "pure numbers, no voting" }
];

const AWARDS: Record<AwardGroup, Award[]> = {
  playstyle: [
    { title: "cleanest cutter", winner: "Ampz", stat: "136 cuts", runnerUp: "Ninja Potato" },
    { title: "most aggressive", winner: "Gazelle", stat: "21.6 frags/match", runnerUp: "Magi" },
    { title: "most passive", winner: "teejay", stat: "8.1 frags/match", runnerUp: "jZ" },
    { title: "best mazer", winner: "ellis", stat: "3.41 turns/sec", runnerUp: "apple" },
    { title: "biggest tunneler", winner: "Magi", stat: "community pick", runnerUp: "Ninja Potato" }
  ],
  personality: [
    { title: "community mvp", winner: "Nanu", stat: "highest combined vote share", runnerUp: "Z-Man" },
    { title: "funniest", winner: "Sanity", stat: "chat impact award", runnerUp: "Kronkleberry" },
    { title: "most beloved", winner: "Nanu", stat: "cross-category support", runnerUp: "Johnny" },
    { title: "biggest addict", winner: "teejay", stat: "341 tracked hours", runnerUp: "Nelg" },
    { title: "biggest rager", winner: "Nelg", stat: "match chat volume + votes", runnerUp: "apple" }
  ],
  fortress: [
    { title: "best center", winner: "Gazelle", stat: "46.8% center success", runnerUp: "dgm" },
    { title: "best defender", winner: "Wind", stat: "cut in only 5.8% rounds", runnerUp: "Ampz" },
    { title: "best sweeper", winner: "Ampz", stat: "highest cleanup impact", runnerUp: "koala" },
    { title: "best winger", winner: "Ninja Potato", stat: "team utility index leader", runnerUp: "Force" },
    { title: "fort mvp", winner: "Ampz", stat: "overall fortress impact", runnerUp: "koala" }
  ],
  sumo: [
    { title: "best attacker", winner: "Magi", stat: "highest duel conversion", runnerUp: "Gazelle" },
    { title: "best defender", winner: "wolf", stat: "85.1% alive at pos1", runnerUp: "apple" },
    { title: "favorite teammate", winner: "koala", stat: "most teammate votes", runnerUp: "Nanu" },
    { title: "sumo mvp", winner: "N", stat: "top all-around rating", runnerUp: "reserved" },
    { title: "most improved", winner: "Sanity", stat: "+192 rating year-over-year", runnerUp: "ellis" }
  ],
  stats: [
    { title: "highscore in tst", winner: "N", stat: "1185 points", runnerUp: "Gazelle" },
    { title: "highscore in fortress", winner: "Wind", stat: "59 points", runnerUp: "Nelg" },
    { title: "no team needed", winner: "apple", stat: "1874 net points", runnerUp: "N" },
    { title: "kills in a match (sbt)", winner: "apple", stat: "44 kills", runnerUp: "parentaladvsry" },
    { title: "brakes need replacement", winner: "Word", stat: "16.2% time braking", runnerUp: "tatty" }
  ]
};

const PODIUMS: Record<AwardGroup, { first: PodiumEntry; second: PodiumEntry; third: PodiumEntry }> = {
  playstyle: {
    first: { player: "Ampz", note: "overall playstyle excellence" },
    second: { player: "Gazelle", note: "consistent aggression impact" },
    third: { player: "ellis", note: "creative control and execution" }
  },
  personality: {
    first: { player: "Nanu", note: "community favorite presence" },
    second: { player: "Sanity", note: "high entertainment factor" },
    third: { player: "Kronkleberry", note: "strong culture contribution" }
  },
  fortress: {
    first: { player: "Ampz", note: "best all-around fortress impact" },
    second: { player: "Wind", note: "elite defensive consistency" },
    third: { player: "Ninja Potato", note: "high-value wing play" }
  },
  sumo: {
    first: { player: "N", note: "top all-around sumo performance" },
    second: { player: "Magi", note: "best attacker conversion rate" },
    third: { player: "koala", note: "most trusted teammate presence" }
  },
  stats: {
    first: { player: "apple", note: "best total stat portfolio" },
    second: { player: "N", note: "peak scoring and consistency" },
    third: { player: "Wind", note: "fortress statistical dominance" }
  }
};

export function Tronnies2025Page() {
  const [group, setGroup] = useState<AwardGroup>("playstyle");
  const awards = useMemo(() => AWARDS[group], [group]);
  const podium = PODIUMS[group];
  const groupMeta = AWARD_GROUPS.find((entry) => entry.id === group);
  const activeIndex = AWARD_GROUPS.findIndex((entry) => entry.id === group);

  const goToPreviousGroup = () => {
    const nextIndex = activeIndex <= 0 ? AWARD_GROUPS.length - 1 : activeIndex - 1;
    setGroup(AWARD_GROUPS[nextIndex].id);
  };

  const goToNextGroup = () => {
    const nextIndex = activeIndex >= AWARD_GROUPS.length - 1 ? 0 : activeIndex + 1;
    setGroup(AWARD_GROUPS[nextIndex].id);
  };

  return (
    <div className="container">
      <PrimaryNav active="none" />

      <header className="header tronnies-header">
        <div className="title-section">
          <div className="title-wrapper">
            <h1 className="title">tronnies 2025</h1>
          </div>
          <span className="gamemode-badge tronnies-badge">special</span>
        </div>
        <p className="subtitle">the tron equivalent of the grammys: competitive chaos, community votes, and stat crowns</p>
        <div className="update-info">private showcase build · not linked in navigation</div>
      </header>

      <section className="tronnies-stats-grid" aria-label="Tronnies 2025 highlights">
        {HIGHLIGHT_STATS.map((stat) => (
          <article key={stat.label} className="tronnies-stat-card">
            <div className="tronnies-stat-value">{stat.value}</div>
            <div className="tronnies-stat-label">{stat.label}</div>
            <div className="tronnies-stat-note">{stat.note}</div>
          </article>
        ))}
      </section>

      <section className="tronnies-content-shell">
        <div className="tronnies-tabs-nav">
          <button type="button" className="tronnies-tabs-arrow" aria-label="previous category" onClick={goToPreviousGroup}>
            ←
          </button>
          <div className="tronnies-tabs" role="tablist" aria-label="award groups">
            {AWARD_GROUPS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                role="tab"
                aria-selected={group === entry.id}
                className={`tronnies-tab ${group === entry.id ? "active" : ""}`}
                onClick={() => setGroup(entry.id)}
              >
                {entry.label}
              </button>
            ))}
          </div>
          <button type="button" className="tronnies-tabs-arrow" aria-label="next category" onClick={goToNextGroup}>
            →
          </button>
        </div>

        <div className="tronnies-panel" key={group}>
          <div className="tronnies-panel-head tronnies-animate-in">
            <h2 className="tronnies-panel-title">{groupMeta?.label || "awards"} spotlight</h2>
            <p className="tronnies-panel-subtitle">{groupMeta?.subtitle || ""}</p>
          </div>

          <div className="tronnies-podium tronnies-animate-in" aria-label="top winners">
            <article className="tronnies-podium-item podium-rank-2 podium-slot-left">
              <div className="tronnies-podium-rank">#2 · silver</div>
              <div className="tronnies-podium-name">{podium.second.player}</div>
              <div className="tronnies-podium-title">{podium.second.note}</div>
            </article>
            <article className="tronnies-podium-item podium-rank-1 podium-slot-center">
              <div className="tronnies-podium-rank">#1 · gold</div>
              <div className="tronnies-podium-name">{podium.first.player}</div>
              <div className="tronnies-podium-title">{podium.first.note}</div>
            </article>
            <article className="tronnies-podium-item podium-rank-3 podium-slot-right">
              <div className="tronnies-podium-rank">#3 · bronze</div>
              <div className="tronnies-podium-name">{podium.third.player}</div>
              <div className="tronnies-podium-title">{podium.third.note}</div>
            </article>
          </div>

          <div className="tronnies-awards-grid tronnies-animate-in">
            {awards.map((award, index) => (
              <article key={award.title} className="tronnies-award-card" style={{ animationDelay: `${index * 50}ms` }}>
                <div className="tronnies-award-top">
                  <div className="tronnies-award-title">{award.title}</div>
                  <span className="tronnies-award-rank">#{String(index + 1).padStart(2, "0")}</span>
                </div>
                <div className="tronnies-award-main">
                  <div className="tronnies-winner-row">
                    <span className="tronnies-winner-label">winner</span>
                    <span className="tronnies-winner-name">{award.winner}</span>
                  </div>
                  <div className="tronnies-award-stat">{award.stat}</div>
                </div>
                {award.runnerUp && <div className="tronnies-runnerup">runner-up: {award.runnerUp}</div>}
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
