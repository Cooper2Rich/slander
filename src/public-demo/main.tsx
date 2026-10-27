import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { Waves } from "lucide-react";
import PublicApp from "./PublicApp";
import "../styles.css";
import "./styles.css";
import "./night-theme.css";
import "./refinements.css";
import "./donor.css";

const working = import.meta.env.BASE_URL === "/slander/working/";
document.body.classList.add("public-demo");
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <div className="public-notice">
        <Waves size={16} />
        <span>
          {working
            ? "Working preview · isolated demo workspace · no real payments"
            : "Public demo · fictional workspace saved in this browser · no real payments"}
        </span>
        <a
          href={`https://github.com/Cooper2Rich/slander/tree/${working ? "working" : "main"}`}
        >
          Source & local version ↗
        </a>
      </div>
      <PublicApp />
    </HashRouter>
  </StrictMode>,
);
