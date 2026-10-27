import { Compass, House, PanelsTopLeft, Trophy, UserRound } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Logo } from "./ui";

export function WorkspaceRail({
  workspace = false,
  onWorkspace,
}: {
  workspace?: boolean;
  onWorkspace: () => void;
}) {
  const { pathname } = useLocation();
  return (
    <nav className="workspace-rail" aria-label="Workspace shortcuts">
      <Link to="/" className="rail-brand" aria-label="Blue Ripple home">
        <Logo small />
      </Link>
      {[
        { to: "/", label: "Home", Icon: House },
        { to: "/explore", label: "Discover", Icon: Compass },
        { to: "/leaderboard", label: "Leaders", Icon: Trophy },
      ].map(({ to, label, Icon }) => (
        <Link
          key={to}
          to={to}
          className={`rail-item ${!workspace && pathname === to ? "selected" : ""}`}
          aria-current={!workspace && pathname === to ? "page" : undefined}
        >
          <span>
            <Icon size={21} />
          </span>
          <small>{label}</small>
        </Link>
      ))}
      <button
        className={`rail-item ${workspace ? "selected" : ""}`}
        onClick={onWorkspace}
      >
        <span>
          <PanelsTopLeft size={21} />
        </span>
        <small>Studio</small>
      </button>
      <Link
        to="/viewer"
        className="rail-item rail-profile"
        aria-label="Your profile"
      >
        <span>
          <UserRound size={20} />
        </span>
        <small>Profile</small>
      </Link>
    </nav>
  );
}
