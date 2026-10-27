import { CheckCircle2 } from "lucide-react";
import { useWorkspace } from "../context";
import { completedAdSpendReport } from "./completed-ad-spend";
import {
  FinancialSampleControl,
  useFinancialSamples,
} from "./FinancialSamples";
import { money } from "./catalog";
import { platformNames } from "./ad-platforms";
import "./ad-platforms.css";

export function CompletedAdSpend() {
  const { projects } = useWorkspace();
  const { enabled } = useFinancialSamples();
  const report = completedAdSpendReport(projects, enabled);
  return (
    <section
      className="ad-platform-panel completed-ad-spend"
      aria-labelledby="completed-ad-spend-title"
    >
      <div className="ad-platform-section-heading">
        <CheckCircle2 size={20} />
        <div>
          <h2 id="completed-ad-spend-title">Completed ad spend</h2>
          <p>
            Historical examples of Meta and TikTok delivery for this workspace.
          </p>
        </div>
        <span className="ad-platform-state selected">Sample history</span>
      </div>
      <FinancialSampleControl description="Historical ad spend examples only. No real ad purchases." />
      <div className="ad-platform-summary">
        <div>
          <small>Completed · sample</small>
          <strong>{money(report.totalCents)}</strong>
        </div>
        <div>
          <small>Meta · sample</small>
          <strong>{money(report.byPlatform.meta)}</strong>
        </div>
        <div>
          <small>TikTok · sample</small>
          <strong>{money(report.byPlatform.tiktok)}</strong>
        </div>
      </div>
      {report.rows.length ? (
        <div className="ad-platform-table">
          <table>
            <caption className="sr-only">Completed ad spend examples</caption>
            <thead>
              <tr>
                <th>Completed</th>
                <th>Platform / creative</th>
                <th>Status</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {report.rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    {new Date(row.completedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                      timeZone: "UTC",
                    })}
                  </td>
                  <td>
                    <strong>{platformNames[row.platform]}</strong>
                    <span className="completed-ad-creative">
                      {row.creative}
                    </span>
                  </td>
                  <td>
                    <span className="ad-platform-state selected">
                      Completed · sample
                    </span>
                  </td>
                  <td>{money(row.amountCents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="ad-platform-help">
          {enabled
            ? "No completed spend examples for these projects yet. New campaigns start with an empty history."
            : "Sample history is hidden. Enable Include sample activity to view the examples."}
        </p>
      )}
      <p className="ad-platform-help">
        These fixed historical examples do not change contributions, creator
        earnings, future allocation caps or actual platform spend. Live platform
        spend remains $0.00.
      </p>
    </section>
  );
}
