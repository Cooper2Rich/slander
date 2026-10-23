import { useEffect, useState } from "react";
import {
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Activity,
  ArrowUpRight,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  FolderHeart,
  Inbox,
  Layers3,
  Menu,
  Search,
  ShieldCheck,
  Sparkles,
  X,
  Trophy,
} from "lucide-react";
import { WorkspaceContext } from "./context";
import type { Role } from "./types";
import { useDemoWorkspace } from "./useDemoWorkspace";
import { IdentityPicker } from "./components/IdentityPicker";
import { Avatar, Logo, Modal } from "./components/ui";
import { ProjectsPage } from "./pages/Projects";
import { PostsPage } from "./pages/Posts";
import { ProjectDetail } from "./pages/ProjectDetail";
import { ActivityPage } from "./pages/Activity";
import { CampaignsPage, GivingPage } from "./pages/Campaigns";

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    access,
    role,
    setRole: changeRole,
    chooseIdentity,
    identity,
    options,
    needsSelection,
    workspace,
    error,
    refresh,
    load,
    loadOptions,
    scopeKey,
  } = useDemoWorkspace();
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");
  const [help, setHelp] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  useEffect(() => {
    setMobileNav(false);
    setSearch("");
  }, [location.pathname]);
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);
  const setRole = (value: Role) => {
    changeRole(value);
    setMobileNav(false);
    setSearch("");
    setToast("");
    setHelp(false);
  };
  const pending =
    workspace?.posts.filter((p) =>
      role === "creator"
        ? ["pending", "changes"].includes(p.status)
        : p.status === "held",
    ).length || 0;
  const title = location.pathname.startsWith("/campaigns")
    ? "Campaigns"
    : location.pathname === "/review"
      ? role === "creator"
        ? "My creatives"
        : "Platform exceptions"
      : location.pathname === "/approved"
        ? role === "creator"
          ? "Eligible library & counts"
          : "Eligible creatives"
        : location.pathname === "/activity"
          ? "Activity"
          : location.pathname === "/posts"
            ? "All submissions"
            : "Projects";
  useEffect(() => {
    document.title = `${title} · Slander`;
  }, [title]);
  const nav = [
    { to: "/campaigns", icon: Sparkles, label: "Campaigns" },
    {
      to: "/projects",
      icon: FolderHeart,
      label:
        role === "creator"
          ? "Published projects"
          : role === "nonprofit"
            ? "Our projects"
            : "Projects",
    },
    {
      to: "/review",
      icon: Inbox,
      label: role === "creator" ? "My creatives" : "Platform exceptions",
      count: pending,
    },
    { to: "/posts", icon: Layers3, label: "All submissions" },
    {
      to: "/approved",
      icon: role === "creator" ? Trophy : CheckCheck,
      label:
        role === "creator" ? "Eligible library & counts" : "Eligible creatives",
    },
    ...(role !== "creator"
      ? [{ to: "/activity", icon: Activity, label: "Activity" }]
      : []),
  ];
  if (/^\/campaigns\/[^/]+\/give\/?$/.test(location.pathname)) {
    return (
      <Routes>
        <Route path="/campaigns/:id/give" element={<GivingPage />} />
      </Routes>
    );
  }
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      {mobileNav && (
        <button
          className="mobile-backdrop"
          onClick={() => setMobileNav(false)}
          aria-label="Close navigation"
        />
      )}
      <aside className={`sidebar ${mobileNav ? "open" : ""}`}>
        <NavLink to="/projects" className="brand" aria-label="Slander home">
          <Logo />
        </NavLink>
        <div className="workspace-identity">
          <span className="workspace-symbol">
            <Sparkles size={19} />
          </span>
          <div>
            <strong>
              {role === "admin"
                ? "Slander administration"
                : identity?.name || "Choose a profile"}
            </strong>
            <small>
              {role === "admin"
                ? "All organizations & projects"
                : role === "nonprofit"
                  ? "Campaign Owner workspace"
                  : "Creator studio"}
            </small>
          </div>
        </div>
        {role !== "admin" && identity && (
          <button
            className="change-identity"
            onClick={() => {
              chooseIdentity(null);
              setMobileNav(false);
              setSearch("");
              setToast("");
              navigate("/projects");
            }}
          >
            Change {role === "nonprofit" ? "nonprofit" : "creator"}
            <ArrowUpRight size={13} />
          </button>
        )}
        <span className="nav-label">WORKSPACE</span>
        <nav aria-label="Main navigation">
          {!needsSelection &&
            nav.map((item) => (
              <NavLink
                to={item.to}
                onClick={() => setMobileNav(false)}
                key={item.to}
                className={({ isActive }) =>
                  `nav-item ${isActive ? "active" : ""}`
                }
              >
                <item.icon size={19} />
                <span>{item.label}</span>
                {item.count ? (
                  <span className="nav-count">{item.count}</span>
                ) : null}
              </NavLink>
            ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <span className="note-doodle">✳</span>
            <h3>
              Built for the
              <br />
              good you do.
            </h3>
            <p>
              Your mission deserves
              <br />
              to be heard.
            </p>
            <button onClick={() => setHelp(true)}>
              Take a quick tour
              <ArrowUpRight size={14} />
            </button>
          </div>
          <button className="help-button" onClick={() => setHelp(true)}>
            <CircleHelp size={18} />
            How this demo works
            <ArrowUpRight size={15} />
          </button>
          <div className="sidebar-user">
            <Avatar
              name={
                role === "admin"
                  ? "Demo Administrator"
                  : identity?.name || "Select Profile"
              }
              index={2}
            />
            <div>
              <strong>
                {role === "admin"
                  ? "Administrator"
                  : identity?.name || "Select your profile"}
              </strong>
              <small>
                {role === "admin"
                  ? "Admin View"
                  : role === "nonprofit"
                    ? "Campaign Owner"
                    : "Creator"}
              </small>
            </div>
            <span className="online-dot" />
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <button
            className="icon-button mobile-menu"
            onClick={() => setMobileNav(true)}
            aria-label="Open navigation"
          >
            <Menu size={22} />
          </button>
          <div className="breadcrumb">
            <span>Workspace</span>
            <ChevronRight size={13} />
            <strong>{title}</strong>
          </div>
          <div className="topbar-right">
            {!needsSelection && (
              <div className="search-box">
                <Search size={17} />
                <input
                  aria-label="Search workspace"
                  placeholder="Search workspace..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            )}
            <span className="demo-pill">
              <span />
              DEMO
            </span>
            <label className="role-switch">
              <span className="sr-only">Demo role</span>
              <ShieldCheck size={16} />
              <select
                aria-label="Demo role"
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
              >
                <option value="admin">Admin View</option>
                <option value="nonprofit">Campaign Owner</option>
                <option value="creator">Creator</option>
              </select>
              <ChevronDown size={13} />
            </label>
          </div>
        </header>
        <main id="main-content" className="main-content">
          {error && (
            <div className="load-error" role="alert">
              <p>{error}</p>
              <button className="button secondary" onClick={load}>
                Try again
              </button>
            </div>
          )}
          {needsSelection && (
            <IdentityPicker
              key={role}
              access={access}
              options={options}
              onSelect={(id) => {
                chooseIdentity(id);
                navigate("/projects");
              }}
              refreshOptions={loadOptions}
            />
          )}
          {!workspace && !needsSelection && !error && (
            <div className="loading-state">
              <Logo small />
              <p>Making room for good things…</p>
            </div>
          )}
          {workspace && (
            <WorkspaceContext.Provider
              key={scopeKey}
              value={{
                ...workspace,
                role,
                access,
                identity,
                setRole,
                search,
                setSearch,
                refresh,
                notify: setToast,
              }}
            >
              <Routes>
                <Route path="/campaigns" element={<CampaignsPage />} />
                <Route path="/campaigns/:id" element={<CampaignsPage />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/projects/:id" element={<ProjectDetail />} />
                <Route
                  path="/review"
                  element={<PostsPage key="review" mode="review" />}
                />
                <Route
                  path="/approved"
                  element={<PostsPage key="approved" mode="approved" />}
                />
                <Route
                  path="/posts"
                  element={<PostsPage key="posts" mode="all" />}
                />
                <Route
                  path="/activity"
                  element={
                    role === "creator" ? (
                      <Navigate to="/projects" replace />
                    ) : (
                      <ActivityPage />
                    )
                  }
                />
                <Route path="*" element={<Navigate to="/projects" replace />} />
              </Routes>
            </WorkspaceContext.Provider>
          )}
        </main>
        <footer className="app-footer">
          <span>Stories for good. A little louder.</span>
          <span>SLANDER © {new Date().getFullYear()}</span>
        </footer>
      </div>
      {toast && (
        <div className="toast" role="status">
          <span>
            <Check size={17} />
          </span>
          {toast}
          <button
            onClick={() => setToast("")}
            aria-label="Dismiss notification"
          >
            <X size={15} />
          </button>
        </div>
      )}
      {help && (
        <Modal
          title="A little tour. A lot of possibility."
          subtitle="Welcome to your Slander demo workspace."
          onClose={() => setHelp(false)}
        >
          <div className="form-content help-content">
            <div>
              <span>01</span>
              <section>
                <h3>Start with a project</h3>
                <p>
                  Open Campaigns as Admin and initialize the fictional showcase.
                  Switch to Campaign Owner to explore scoped funding and
                  reports.
                </p>
              </section>
            </div>
            <div>
              <span>02</span>
              <section>
                <h3>Bring a story to the table</h3>
                <p>
                  Select Alex River in Creator view. Open Campaigns, accept the
                  frozen terms, and submit the supplied sample creative.
                </p>
              </section>
            </div>
            <div>
              <span>03</span>
              <section>
                <h3>Automatic checks, visible evidence</h3>
                <p>
                  Valid creatives become eligible automatically. Creators can
                  revise eligible work; each revision keeps its own snapshot.
                  Admin handles evidence-linked holds and appeals.
                </p>
              </section>
            </div>
            <div>
              <span>04</span>
              <section>
                <h3>Get ready for Instagram</h3>
                <p>
                  Create a tracked giving link, open it, and confirm a simulated
                  $100 gift. See $10 creator, $90 beneficiary, and one vote.
                  Admin can export a sample week statement from Settlement.
                </p>
              </section>
            </div>
            <div className="callout">
              <p>
                This is a local demo with sample organizations and selectable
                roles, not account sign-in. Changes persist on this computer.
                Payments, live Instagram authorization, and publishing are not
                enabled.
              </p>
            </div>
          </div>
          <div className="modal-footer">
            <button className="button primary" onClick={() => setHelp(false)}>
              Let’s make something good
              <ArrowUpRight size={16} />
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
