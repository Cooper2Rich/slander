import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Wallet } from "lucide-react";
import { useWorkspace } from "../context";
import { EmptyState, Media, Modal, StatusBadge } from "../components/ui";
import { ReviewDialog } from "../components/ReviewDialog";
import type { Post } from "../types";
import { AdStats } from "./AdStats";
import { AdMedia } from "./AdMedia";
import {
  fundedCents,
  loadAds,
  money,
  viewerState,
  type PublicAd,
} from "./catalog";

export function CreatorAds() {
  const { posts, identity, search, access } = useWorkspace();
  const [ads, setAds] = useState<PublicAd[]>([]),
    [tab, setTab] = useState("Current"),
    [selected, setSelected] = useState<Post | null>(null);
  useEffect(() => {
    void loadAds().then(setAds);
  }, [posts]);
  const archived = useWorkspace().ownArchivedPosts || [];
  const own = posts.filter((p) => p.creatorId === identity?.id);
  const filtered = own.filter(
    (p) =>
      (tab === "My archive"
        ? archived.includes(p.id) || !!p.withdrawnAt
        : !archived.includes(p.id) && !p.withdrawnAt) &&
      `${p.title} ${p.caption}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <section className="creator-ads compact-ads" aria-label="Your ads">
      <div className="page-heading">
        <div>
          <h1>
            My ads<span className="title-dot">.</span>
          </h1>
          <p>Manage your ads, performance and archived work.</p>
        </div>
        <Link className="button primary" to="/projects">
          Create an ad <ArrowUpRight size={17} />
        </Link>
      </div>
      <div className="creator-summary">
        <div>
          <small>My ads</small>
          <strong>{own.length}</strong>
        </div>
        <div>
          <small>Eligible now</small>
          <strong>
            {
              own.filter(
                (p) =>
                  p.status === "approved" &&
                  !archived.includes(p.id) &&
                  !p.withdrawnAt,
              ).length
            }
          </strong>
        </div>
        <div>
          <small>My ad spend funded here</small>
          <strong>
            {money(own.reduce((n, p) => n + fundedCents(p.id), 0))}
          </strong>
        </div>
      </div>
      <div
        className="tabs creator-tabs"
        role="tablist"
        aria-label="My ads sections"
      >
        {["Current", "My archive"].map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            className={tab === t ? "active" : ""}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
      <p className="metrics-note">
        Only your ads appear here. Sample performance is illustrative;
        unconnected metrics show N/A.
      </p>
      <div className="ad-grid">
        {filtered.map((post) => {
          const ad = ads.find((a) => a.id === post.id);
          return (
            <article key={post.id} className="ad-card creator-card">
              <div className="ad-card-media">
                <AdMedia ad={{ ...post, poster: ad?.poster }} access={access} />
                <StatusBadge status={post.status} />
                {ad?.durationSeconds && (
                  <span className="ad-duration">0:{ad.durationSeconds}</span>
                )}
              </div>
              <div className="ad-card-copy">
                <h3>{post.title}</h3>
                <AdStats
                  ad={
                    ad || {
                      impressions: null,
                      clicks: null,
                      donatedCents: null,
                    }
                  }
                />
                <div className="creator-card-actions">
                  <button
                    className="button secondary"
                    onClick={(event) => {
                      event.currentTarget
                        .closest(".creator-card")
                        ?.querySelector("video")
                        ?.pause();
                      setSelected(post);
                    }}
                    aria-label={
                      archived.includes(post.id)
                        ? undefined
                        : `View ${post.title}`
                    }
                  >
                    {archived.includes(post.id)
                      ? "View archive"
                      : "View & edit"}
                  </button>
                  {ad && (
                    <Link className="text-button" to={`/ads/${post.id}`}>
                      Public profile ↗
                    </Link>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {!filtered.length && (
        <EmptyState
          title={
            tab === "My archive"
              ? "Your archive is clear."
              : "Your next good story starts here."
          }
          description={
            tab === "My archive"
              ? "Your withdrawn ads and ads from archived campaigns appear here."
              : "Choose a campaign to create an ad. Your ads and results will appear here."
          }
          action={
            <Link className="button primary" to="/projects">
              Explore campaigns
            </Link>
          }
        />
      )}
      {selected &&
        (archived.includes(selected.id) ? (
          <Modal
            title={selected.title}
            subtitle="Your archived creative"
            onClose={() => setSelected(null)}
          >
            <div className="form-content">
              <Media post={selected} />
              <p>{selected.caption}</p>
              <p className="metrics-note">
                Archived campaign · retained for your records.
              </p>
            </div>
          </Modal>
        ) : (
          <ReviewDialog post={selected} onClose={() => setSelected(null)} />
        ))}
    </section>
  );
}
export function SpendingPage() {
  const { posts, role } = useWorkspace();
  const support = viewerState().support.filter(
    (s) => role === "admin" || posts.some((p) => p.id === s.adId),
  );
  const adIds = [...new Set(support.map((s) => s.adId))];
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Ad spending.</h1>
          <p>
            Contributions reserved for ad distribution, separate from gifts to
            the cause.
          </p>
        </div>
        <Wallet size={30} />
      </div>
      <div className="creator-summary">
        <div>
          <small>Ad spend funded here</small>
          <strong>
            {money(support.reduce((n, s) => n + s.amountCents, 0))}
          </strong>
        </div>
        <div>
          <small>Actual ad spend</small>
          <strong>$0.00</strong>
        </div>
        <div>
          <small>Supported ads</small>
          <strong>{adIds.length}</strong>
        </div>
      </div>
      <div className="market-panel">
        <h2>Ad spend contributions</h2>
        <p>
          Browser-local simulations. No ad purchases or money movement. Seed and
          campaign media pools remain in Campaigns → Funding.
        </p>
        {adIds.map((id) => (
          <div className="support-row" key={id}>
            <Link to={`/ads/${id}`}>
              {support.find((s) => s.adId === id)?.title}
            </Link>
            <strong>
              {money(
                support
                  .filter((s) => s.adId === id)
                  .reduce((n, s) => n + s.amountCents, 0),
              )}
            </strong>
          </div>
        ))}
        {!adIds.length && (
          <p>
            No contributions yet. Fund an ad from the public discovery grid to
            try the flow.
          </p>
        )}
      </div>
    </>
  );
}
export function ArchivesPage() {
  const { projects, posts, search } = useWorkspace();
  const archived = projects.filter(
    (p) =>
      p.status === "archived" &&
      `${p.name} ${p.nonprofit}`.toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Archives.</h1>
          <p>Past projects and their creative records in your workspace.</p>
        </div>
      </div>
      {archived.map((p) => (
        <div className="market-panel archive-project" key={p.id}>
          <Link to={`/projects/${p.id}`}>
            <h2>{p.name} ↗</h2>
          </Link>
          <p>
            {p.nonprofit} ·{" "}
            {posts.filter((post) => post.projectId === p.id).length} creative
            records
          </p>
        </div>
      ))}
      {!archived.length && (
        <EmptyState
          title="No archived projects."
          description="Projects you archive will appear here."
        />
      )}
    </>
  );
}
