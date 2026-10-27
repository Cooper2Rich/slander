import {
  ChevronDown,
  Compass,
  Hash,
  Heart,
  House,
  Info,
  Trophy,
  UserRound,
} from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { Avatar, Logo } from "../components/ui";
import { activeViewer, type PublicCampaign } from "./catalog";

export function PublicLinks() {
  const viewer = activeViewer();
  return (
    <>
      <NavLink to="/" end className="nav-item">
        <House size={17} />
        <span>Home</span>
      </NavLink>
      <NavLink to="/explore" className="nav-item">
        <Compass size={17} />
        <span>Discover ads</span>
      </NavLink>
      <NavLink to="/leaderboard" className="nav-item">
        <Trophy size={17} />
        <span>Leaderboard</span>
      </NavLink>
      <NavLink to="/viewer" className="nav-item">
        <UserRound size={17} />
        <span>{viewer ? "My giving" : "Viewer account"}</span>
      </NavLink>
    </>
  );
}

export function PublicNavigation({
  campaigns,
}: {
  campaigns: PublicCampaign[];
}) {
  const viewer = activeViewer();
  return (
    <aside className="sidebar public-sidebar">
      <Link to="/" className="brand" aria-label="Blue Ripple Media home">
        <Logo />
      </Link>
      <div className="public-space-title">
        <span>Blue Ripple community</span>
        <ChevronDown size={15} />
      </div>
      <nav aria-label="Public navigation">
        <PublicLinks />
      </nav>
      <details className="sidebar-group" open>
        <summary>
          <ChevronDown size={13} /> Campaigns <span>{campaigns.length}</span>
        </summary>
        <nav aria-label="Campaign channels">
          {campaigns.map((campaign) => (
            <Link
              key={campaign.id}
              className="channel-link"
              to={`/leaderboard?campaign=${encodeURIComponent(campaign.id)}`}
            >
              <Hash size={16} />
              <span>{campaign.name}</span>
            </Link>
          ))}
        </nav>
      </details>
      <details className="sidebar-group" open>
        <summary>
          <ChevronDown size={13} /> About Blue Ripple
        </summary>
        <Link className="channel-link" to="/?section=mission">
          <Heart size={16} />
          Our mission
        </Link>
        <Link className="channel-link" to="/?section=how-it-works">
          <Info size={16} />
          How it works
        </Link>
      </details>
      <div className="sidebar-bottom">
        <div className="guest-note">
          <span className="live-dot" />
          Open to everyone
          <p>
            Good stories deserve to be seen.
            <br />
            Find one that moves you.
          </p>
        </div>
        <Link to="/viewer" className="public-identity">
          <Avatar name={viewer?.name || "Guest"} />
          <span>
            <strong>{viewer?.name || "You’re browsing as a guest"}</strong>
            <small>
              {viewer ? "Your viewer profile" : "No account needed to explore"}
            </small>
          </span>
        </Link>
      </div>
    </aside>
  );
}
