import { Compass, House, PanelsTopLeft, Trophy, UserRound } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Logo } from "./ui";
import { publicArea } from "../public-demo/navigation";

export function WorkspaceRail({
  workspace = false,
  onWorkspace,
  profileLabel = "Your profile",
}: {
  workspace?: boolean;
  onWorkspace: () => void;
  profileLabel?: string;
}) {
  const { pathname } = useLocation();
  const area = publicArea(pathname);
  return (
    <nav className="workspace-rail" aria-label="Workspace shortcuts">
      <Link to="/" className="rail-brand" aria-label="Blue Ripple home">
        <Logo small />
      </Link>
      {[
        { to: "/", label: "Home", name: "Home", area: "home", Icon: House },
        {
          to: "/explore",
          label: "Discover",
          name: "Discover ads",
          area: "discover",
          Icon: Compass,
        },
        {
          to: "/leaderboard",
          label: "Leaders",
          name: "Leaderboard",
          area: "leaders",
          Icon: Trophy,
        },
      ].map(({ to, label, name, area: itemArea, Icon }) => (
        <Link
          key={to}
          to={to}
          className={`rail-item ${!workspace && area === itemArea ? "selected" : ""}`}
          aria-label={name}
          aria-current={!workspace && area === itemArea ? "page" : undefined}
        >
          <span>
            <Icon size={21} />
          </span>
          <small>{label}</small>
        </Link>
      ))}
      <button
        className={`rail-item ${workspace ? "selected" : ""}`}
        aria-current={workspace ? "page" : undefined}
        onClick={onWorkspace}
      >
        <span>
          <PanelsTopLeft size={21} />
        </span>
        <small>Studio</small>
      </button>
      <Link
        to="/viewer"
        className={`rail-item rail-profile ${!workspace && area === "profile" ? "selected" : ""}`}
        aria-label={profileLabel}
        aria-current={!workspace && area === "profile" ? "page" : undefined}
      >
        <span>
          <UserRound size={20} />
        </span>
        <small>Profile</small>
      </Link>
    </nav>
  );
}
