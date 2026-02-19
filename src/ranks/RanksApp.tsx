import Link from "next/link";

const RANKS = [
  { name: "bronze", range: "< 1400 ELO", icon: "/images/ranks/bronze.svg", className: "rank-bronze" },
  { name: "silver", range: "1400 - 1599 ELO", icon: "/images/ranks/silver.svg", className: "rank-silver" },
  { name: "gold", range: "1600 - 1899 ELO", icon: "/images/ranks/gold.svg", className: "rank-gold" },
  { name: "platinum", range: "1900 - 2099 ELO", icon: "/images/ranks/platinum.svg", className: "rank-platinum" },
  { name: "diamond", range: "2100 - 2199 ELO", icon: "/images/ranks/diamond-amethyst-9.svg", className: "rank-diamond" },
  { name: "master", range: "2200 - 2299 ELO", icon: "/images/ranks/master.svg", className: "rank-master" },
  { name: "grandmaster", range: "2300 - 2399 ELO", icon: "/images/ranks/grandmaster.svg", className: "rank-grandmaster" },
  { name: "legend", range: "2400+ ELO", icon: "/images/ranks/legend.png", className: "rank-legend", legendary: true }
];

export function RanksPage() {
  return (
    <div className="container">
      <div className="back-button-container">
        <Link href="/leaderboard" className="nav-link group">
          <span className="nav-text">← back to leaderboard</span>
          <span className="nav-border-animation"></span>
          <span className="nav-bg-animation"></span>
        </Link>
      </div>

      <header className="header">
        <div className="title-section">
          <h1 className="title">ranking system</h1>
        </div>
        <p className="subtitle">elo ratings and rank tiers</p>
      </header>

      <div className="ranks-container">
        {RANKS.map((rank) => (
          <div key={rank.name} className={`rank-card ${rank.legendary ? "rank-card-legendary" : ""}`}>
            <div className="rank-icon-container">
              <img src={rank.icon} alt={rank.name} className="rank-display-icon" />
            </div>
            <div className="rank-details">
              <h2 className={`rank-name ${rank.className}`}>{rank.name}</h2>
              <p className="rank-range">{rank.range}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
