import Link from "next/link";

export function PrimaryNav({ active }: { active: "mazing" | "leaderboard" | "tutorials" | "none" }) {
  const is = (name: string) => (active === name ? " active" : "");
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
        <li className="nav-item">
          <Link href="/leaderboard" className={`nav-link group${is("leaderboard")}`}>
            <span className="nav-text">leaderboard</span>
            <span className="nav-border-animation"></span>
            <span className="nav-bg-animation"></span>
          </Link>
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
