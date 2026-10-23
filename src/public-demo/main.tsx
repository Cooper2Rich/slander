import { StrictMode, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  HashRouter,
  Link,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { Leaf, Sparkles } from "lucide-react";
import { WorkspaceContext } from "../context";
import { Logo } from "../components/ui";
import { CampaignsPage, GivingPage } from "../pages/Campaigns";
import type { Role } from "../types";
import { creatorId, ownerId, publicWorkspace } from "./api";
import "../styles.css";
import "./styles.css";

function PublicDemo() {
  const location = useLocation();
  const [role, setRole] = useState<Role>("creator");
  const [workspace, setWorkspace] = useState(publicWorkspace);
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState("");
  const access = useMemo(
    () => ({
      role,
      creatorId: role === "creator" ? creatorId : null,
      nonprofitId: role === "nonprofit" ? ownerId : null,
    }),
    [role],
  );
  const identity =
    role === "admin"
      ? null
      : {
          id: role === "creator" ? creatorId : ownerId,
          name:
            role === "creator"
              ? "Alex River · fictional"
              : "Riverkind Collective · fictional",
        };
  const giving = location.pathname.endsWith("/give");
  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 4500);
  };
  return (
    <WorkspaceContext.Provider
      value={{
        ...workspace,
        role,
        access,
        identity,
        setRole,
        search,
        setSearch,
        refresh: async () => setWorkspace(publicWorkspace()),
        notify,
      }}
    >
      <div className="public-notice">
        <Leaf size={16} />
        <span>
          Public interactive preview · fictional data stays in this browser · no
          real payments
        </span>
        <a href="https://github.com/Cooper2Rich/slander/tree/demo-2">
          Source & full local demo ↗
        </a>
      </div>
      {giving ? (
        <Routes>
          <Route path="/campaigns/:id/give" element={<GivingPage />} />
        </Routes>
      ) : (
        <div className="app-shell public-shell">
          <aside className="sidebar">
            <Link to="/campaigns" className="brand" aria-label="Slander home">
              <Logo />
            </Link>
            <div className="workspace-identity">
              <Sparkles size={22} />
              <div>
                <strong>{identity?.name || "Slander administration"}</strong>
                <small>Fictional demo workspace</small>
              </div>
            </div>
            <Link to="/campaigns" className="public-nav">
              <Sparkles size={18} />
              Campaigns
            </Link>
            <div className="public-sidebar-note">
              <strong>Stories for good.</strong>
              <p>
                Discover a cause, create a story, and follow a simulated gift.
              </p>
              <small>
                Advanced operations are available in the local Node/SQLite demo.
              </small>
            </div>
          </aside>
          <div className="public-main">
            <header className="public-toolbar">
              <Link to="/campaigns">Campaigns</Link>
              <label>
                Demo role{" "}
                <select
                  aria-label="Demo role"
                  value={role}
                  onChange={(e) => {
                    setRole(e.target.value as Role);
                    setToast("");
                  }}
                >
                  <option value="creator">Creator · Alex River</option>
                  <option value="nonprofit">Campaign Owner · Riverkind</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
            </header>
            <main id="main-content" className="public-content">
              <Routes>
                <Route path="/campaigns" element={<CampaignsPage />} />
                <Route path="/campaigns/:id" element={<CampaignsPage />} />
                <Route
                  path="*"
                  element={<Navigate replace to="/campaigns" />}
                />
              </Routes>
            </main>
            <footer className="public-footer">
              Slander · PRD 2.2 demo · browser-only preview
            </footer>
          </div>
        </div>
      )}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </WorkspaceContext.Provider>
  );
}
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <PublicDemo />
    </HashRouter>
  </StrictMode>,
);
