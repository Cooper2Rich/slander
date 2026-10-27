import { Compass, House, Info, Trophy, UserRound } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Logo } from "./ui";
import { publicArea } from "../public-demo/navigation";
import {
  selectNavigationTab,
  type NavigationControls,
} from "./navigation-controls";

export function WorkspaceRail({
  workspace = false,
  profileLabel = "Your profile",
  hidden = false,
  navigation,
}: {
  workspace?: boolean;
  profileLabel?: string;
  hidden?: boolean;
  navigation?: NavigationControls;
}) {
  const { pathname } = useLocation();
  const area = publicArea(pathname);
  return (
    <nav
      id="public-main-navigation"
      hidden={hidden}
      className="workspace-rail"
      aria-label="Workspace shortcuts"
    >
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
          to: "/about",
          label: "About",
          name: "About BRM",
          area: "about",
          Icon: Info,
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
          aria-expanded={
            navigation
              ? !workspace && area === itemArea && navigation.sidebarOpen
              : undefined
          }
          aria-controls={navigation ? "public-secondary-navigation" : undefined}
          onClick={(event) => selectNavigationTab(event, to, navigation)}
        >
          <span>
            <Icon size={21} />
          </span>
          <small>{label}</small>
        </Link>
      ))}
      <Link
        to="/viewer"
        className={`rail-item rail-profile ${!workspace && area === "profile" ? "selected" : ""}`}
        aria-label={profileLabel}
        aria-current={!workspace && area === "profile" ? "page" : undefined}
        aria-expanded={
          navigation
            ? !workspace && area === "profile" && navigation.sidebarOpen
            : undefined
        }
        aria-controls={navigation ? "public-secondary-navigation" : undefined}
        onClick={(event) => selectNavigationTab(event, "/viewer", navigation)}
      >
        <span>
          <UserRound size={20} />
        </span>
        <small>Profile</small>
      </Link>
    </nav>
  );
}
