import { LeaderboardApp } from "@/src/leaderboard/LeaderboardApp";
import { Suspense } from "react";

export default function LeaderboardPage() {
  return (
    <Suspense fallback={<div className="loading-text">loading leaderboard...</div>}>
      <LeaderboardApp />
    </Suspense>
  );
}
