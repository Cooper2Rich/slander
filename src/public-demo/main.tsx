import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { Leaf } from "lucide-react";
import PublicApp from "./PublicApp";
import "../styles.css";
import "./styles.css";

document.body.classList.add("public-demo");
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <div className="public-notice">
        <Leaf size={16} />
        <span>
          Public demo · fictional workspace saved in this browser · no real
          payments
        </span>
        <a href="https://github.com/Cooper2Rich/slander/tree/demo-2">
          Source & local version ↗
        </a>
      </div>
      <PublicApp />
    </HashRouter>
  </StrictMode>,
);
