import { PrimaryNav } from "@/src/ui/PrimaryNav";

export default function AboutPage() {
  return (
    <div className="container">
      <PrimaryNav active="none" />
      <header className="header">
        <div className="title-section">
          <h1 className="title">about</h1>
        </div>
        <p className="subtitle">retrocycles league</p>
      </header>
      <div className="main-content">
        <div className="page-content" style={{ maxWidth: 720, textTransform: "lowercase" }}>
          <p style={{ marginBottom: "1rem" }}>
            retrocycles league (rcl) is the home of competitive retrocycles. this site is the <strong>hub</strong> and <strong>leaderboard</strong> for the community: a place to learn,
            check rankings, and follow the game.
          </p>
          <p style={{ marginBottom: "1rem" }}>
            the <strong>leaderboard</strong> tracks elo, stats, and rank tiers so you can see where you stand and follow other players. the <strong>hub</strong> is where you create an
            account, log in with <code>/login &lt;user&gt;@rcl</code> in-game, and get into pickup or ranked play.
          </p>
          <p style={{ marginBottom: "1rem" }}>
            going forward, rcl is building toward a clearer <strong>competitive landscape</strong>-structured seasons, tournaments, and better support for both casual and serious play.
          </p>
        </div>
      </div>
    </div>
  );
}
