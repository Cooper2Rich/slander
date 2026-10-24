import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { api } from "../api";
import { useWorkspace } from "../context";
import { EmptyState } from "../components/ui";
import { money } from "./catalog";
import type { CreatorEarningsReport } from "./creator-earnings";

export function useCreatorEarnings() {
  const { access, posts } = useWorkspace();
  const [loaded, setLoaded] = useState<{
    creatorId: string;
    report?: CreatorEarningsReport;
    error?: string;
  }>();
  useEffect(() => {
    let current = true;
    async function load() {
      if (access.role !== "creator" || !access.creatorId) return;
      try {
        const report = await api<CreatorEarningsReport>(
          "/creator-earnings",
          access,
        );
        if (current) setLoaded({ creatorId: access.creatorId, report });
      } catch (error) {
        if (current)
          setLoaded({
            creatorId: access.creatorId,
            error: (error as Error).message,
          });
      }
    }
    void load();
    window.addEventListener("storage", load);
    window.addEventListener("focus", load);
    return () => {
      current = false;
      window.removeEventListener("storage", load);
      window.removeEventListener("focus", load);
    };
  }, [access, posts]);
  return loaded?.creatorId === access.creatorId ? loaded : undefined;
}

export function CreatorEarnings() {
  const { role, search } = useWorkspace();
  const loaded = useCreatorEarnings();
  if (role !== "creator") return <Navigate to="/projects" replace />;
  const report = loaded?.report;
  const ads =
    report?.ads.filter((ad) =>
      ad.title.toLowerCase().includes(search.toLowerCase()),
    ) || [];
  return (
    <section className="creator-earnings">
      <div className="page-heading">
        <div>
          <h1>Earnings.</h1>
          <p>Your recorded commissions and payout status.</p>
        </div>
        <Link className="button secondary" to="/review">
          My ads ↗
        </Link>
      </div>
      {loaded?.error && <p role="alert">{loaded.error}</p>}
      <div
        className="creator-summary earnings-summary"
        aria-label="Your earnings"
      >
        {[
          { label: "Total earned · demo", amount: report?.earnedCents },
          { label: "Awaiting payout", amount: report?.pendingCents },
          { label: "Paid to you", amount: report?.paidCents },
        ].map(({ label, amount }) => (
          <div key={label}>
            <small>{label}</small>
            <strong>{amount === undefined ? "—" : money(amount)}</strong>
          </div>
        ))}
      </div>
      <p className="metrics-note">
        Earnings use saved commission records, including past ads. The demo has
        no completed payouts or money transfers.
      </p>
      <div className="earnings-sources">
        <span>
          Ad-fund commissions · 10%{" "}
          <strong>{report ? money(report.adFundCents) : "—"}</strong>
        </span>
        <span>
          Recorded cause-gift commissions{" "}
          <strong>{report ? money(report.causeGiftCents) : "—"}</strong>
        </span>
      </div>
      {!!report?.legacyCents && (
        <p className="info-banner">
          Historical ad funding of {money(report.legacyCents)} has no recorded
          creator allocation and is excluded from earnings.
        </p>
      )}
      <h2 className="earnings-section-title">Earnings by ad</h2>
      <div className="earnings-list">
        {ads.map((ad) => (
          <article className="earnings-row" key={ad.adId}>
            <div>
              <h3>{ad.title}</h3>
              <p>
                {ad.contributionCount}{" "}
                {ad.contributionCount === 1 ? "contribution" : "contributions"}{" "}
                with a recorded creator allocation
              </p>
              {ad.legacyCents > 0 && (
                <p>Historical funding excluded: {money(ad.legacyCents)}</p>
              )}
            </div>
            <div>
              <small>Earned · ad funds</small>
              <strong>{money(ad.earnedCents)}</strong>
            </div>
          </article>
        ))}
      </div>
      {report && !ads.length && (
        <EmptyState
          title={
            search ? "No ads match your search." : "No ad-fund earnings yet."
          }
          description={
            search
              ? "Search for another ad name."
              : "Your recorded 10% share appears here when your ads receive new contributions."
          }
        />
      )}
    </section>
  );
}
