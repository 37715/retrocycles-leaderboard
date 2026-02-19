"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export function PrimaryNav({ active }: { active: "mazing" | "leaderboard" | "tutorials" | "none" }) {
  const searchParams = useSearchParams();
  const is = (name: string) => (active === name ? " active" : "");
  const leaderboardMode = searchParams.get("mode") === "sumobar" ? "sumobar" : "tst";
  return (
    <nav className="nav-menu-container">
      <ul className="nav-menu">
        <li className="nav-item">
          <Link href="/mazing" className={`nav-link group${is("mazing")}`}>
            <span className="nav-text">mazing</span>
            <span className="nav-border-animation"></span>
            <span className="nav-bg-animation"></span>
          </Link>
        </li>
        <li className="nav-item nav-item-dropdown">
          <Link href="/leaderboard" className={`nav-link group${is("leaderboard")}`}>
            <span className="nav-text">leaderboard</span>
            <span className="nav-border-animation"></span>
            <span className="nav-bg-animation"></span>
          </Link>
          <div className="nav-dropdown-menu" aria-label="leaderboard mode options">
            <Link href="/leaderboard?mode=tst" className={`nav-link group nav-dropdown-link${leaderboardMode === "tst" ? " active" : ""}`}>
              <span className="nav-text">tst</span>
              <span className="nav-border-animation"></span>
              <span className="nav-bg-animation"></span>
            </Link>
            <Link href="/leaderboard?mode=sumobar" className={`nav-link group nav-dropdown-link${leaderboardMode === "sumobar" ? " active" : ""}`}>
              <span className="nav-text">sumobar</span>
              <span className="nav-border-animation"></span>
              <span className="nav-bg-animation"></span>
            </Link>
          </div>
        </li>
        <li className="nav-item">
          <Link href="/tutorials" className={`nav-link group${is("tutorials")}`}>
            <span className="nav-text">tutorials</span>
            <span className="nav-border-animation"></span>
            <span className="nav-bg-animation"></span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}
