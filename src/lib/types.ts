export type Season = "2023" | "2024" | "2025" | "2026";
export type LeaderboardSeason = Season | "weekly";
export type Region = "combined" | "us" | "eu";
export type Mode = "tst" | "sbt";

export interface LeaderboardRow {
  rank: number;
  name: string;
  elo: number;
  latestChange: number;
  lastActive: string;
  matches: number;
  winrate: number;
  avgPlace: number;
  avgScore: number;
  highScore: number;
  kd: number;
  pos1Rate: number;
  pos2Rate: number;
  pos3Rate: number;
  pos4Rate: number;
}

export interface ProfileSummary {
  matches: number;
  avgKd: string;
  avgScore: number;
  avgAlive: string;
  winRate: number;
  rageQuit: string;
  latestElo: number | null;
  latestOnline: string;
}

export interface ProfileRow {
  id: string;
  dateRaw: number;
  date: string;
  teammates: string;
  exitRating: number | string;
  change: string;
  teamPlace: number | string;
  individualPlace: number | string;
  played: string;
  alive: string;
  score: number;
  kd: string;
}

export interface ProfileView {
  rows: ProfileRow[];
  summary: ProfileSummary;
  leaderboardRank: number | null;
}
