"use client";

import { useMemo, useState } from "react";
import { PrimaryNav } from "@/src/ui/PrimaryNav";

type Difficulty = "basic" | "intermediate" | "advanced" | "expert" | "demon" | "transcendent";

const difficultyConfig: Record<Difficulty, { description: string; complexity: string; count: number; titles: string[] }> = {
  basic: {
    description: "you must learn these! lay the foundations. very important.",
    complexity: "starter",
    count: 5,
    titles: ["captain hook", "mrs hook", "auntie hookies", "the bucaneer", "the hook twins"]
  },
  intermediate: {
    description: "keep going! you're starting to look kinda cool...",
    complexity: "moderate",
    count: 6,
    titles: ["parox", "the elderflower", "uncle hook", "the crusader", "the bandit", "step-hookster"]
  },
  advanced: {
    description: "you are starting to show off now...",
    complexity: "complex",
    count: 9,
    titles: ["mrs hook is pregnant", "atonement", "captain hook's secret lover", "sleepyhead", "velvet", "hibiscus", "little doov", "the threesome", "amnesia"]
  },
  expert: {
    description: "there's more to life than tron you know...",
    complexity: "extreme",
    count: 8,
    titles: ["paroxysm", "paroxysm's sister", "paroxysm's brother", "evil twins", "apache", "ataraxia", "the mockingbird", "TIGHT TIGHT TIGHT"]
  },
  demon: {
    description: "congrats... you have mastered mazing, now go touch some grass.",
    complexity: "demonic",
    count: 9,
    titles: ["the summit", "cthulu", "labrynth", "big doov", "big paroxysm", "big BIG paroxysm", "frantic frank", "quadraparox", "how to feel alive"]
  },
  transcendent: {
    description: "beyond the veil. only legends dare.",
    complexity: "transcendent",
    count: 0,
    titles: []
  }
};

interface MazeItem {
  id: string;
  title: string;
  videoUrl: string;
  complexity: string;
  difficulty: Difficulty;
}

function getMazes(difficulty: Difficulty): MazeItem[] {
  const cfg = difficultyConfig[difficulty];
  return Array.from({ length: cfg.count }).map((_, index) => ({
    id: `${difficulty}_${String(index + 1).padStart(3, "0")}`,
    title: cfg.titles[index] || `${difficulty} maze ${index + 1}`,
    videoUrl: `/assets/mazes/${difficulty}/${index + 1}.webm`,
    complexity: cfg.complexity,
    difficulty
  }));
}

export function MazingPage() {
  const [difficulty, setDifficulty] = useState<Difficulty>("basic");
  const [activeMaze, setActiveMaze] = useState<MazeItem | null>(null);
  const mazes = useMemo(() => getMazes(difficulty), [difficulty]);
  const config = difficultyConfig[difficulty];

  return (
    <div className="container">
      <PrimaryNav active="mazing" />
      <div className="gallery-header">
        <h2 className="gallery-title">{difficulty} mazes</h2>
        <p className="gallery-subtitle">{config.description}</p>
        <div className="gallery-stats">
          <span className="maze-count">{mazes.length} mazes</span>
          <span className="difficulty-indicator">{difficulty}</span>
        </div>
      </div>

      <div className="mazing-main-content">
        <nav className="difficulty-nav-container">
          <ul className="difficulty-nav-menu">
            {(Object.keys(difficultyConfig) as Difficulty[]).map((value) => (
              <li key={value} className="nav-item">
                <button
                  type="button"
                  className={`nav-link group ${difficulty === value ? "active" : ""}`}
                  data-difficulty={value}
                  onClick={() => setDifficulty(value)}
                >
                  <span className="nav-text">{value}</span>
                  <span className="nav-border-animation"></span>
                  <span className="nav-bg-animation"></span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="mazing-gallery">
          {mazes.length === 0 && (
            <div className="gallery-empty" style={{ display: "block" }}>
              <div className="empty-icon">📁</div>
              <h3>no mazes found</h3>
              <p>this difficulty level doesn't have any mazes yet.</p>
            </div>
          )}
          <div className="maze-grid" id="maze-grid" style={{ display: mazes.length ? "grid" : "none" }}>
            {mazes.map((maze) => (
              <div key={maze.id} className="maze-card" data-difficulty={maze.difficulty} onClick={() => setActiveMaze(maze)}>
                <div className="maze-video-container">
                  <video className="maze-video" muted loop preload="metadata">
                    <source src={maze.videoUrl} type="video/webm" />
                  </video>
                  <div className="maze-video-overlay">
                    <div className="play-button">▶</div>
                  </div>
                </div>
                <div className="maze-info">
                  <h3 className="maze-title">{maze.title}</h3>
                  <div className="maze-meta">
                    <span className="maze-complexity">{maze.complexity}</span>
                    <span className="maze-id">#{maze.id}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {activeMaze && (
        <div className="video-modal active" onClick={() => setActiveMaze(null)}>
          <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setActiveMaze(null)}>
              ×
            </button>
            <video className="modal-video" controls autoPlay>
              <source src={activeMaze.videoUrl} type="video/webm" />
            </video>
          </div>
        </div>
      )}
    </div>
  );
}
