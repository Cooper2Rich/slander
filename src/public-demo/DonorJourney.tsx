import { Link, useLocation } from "react-router-dom";
import { ArrowUpRight, Heart, ShieldCheck } from "lucide-react";
import { AdInsightTabs } from "./AdInsightTabs";
import { demoAsset } from "../runtime";
import {
  count,
  ctr,
  fundedCents,
  money,
  type PublicAd,
  type PublicCampaign,
  type PublicProject,
} from "./catalog";

export function DonorJourney({
  ads,
  campaigns,
  projects,
  onSupport,
}: {
  ads: PublicAd[] | null;
  campaigns: PublicCampaign[];
  projects: PublicProject[];
  onSupport: (ad: PublicAd) => void;
}) {
  const { pathname } = useLocation();
  const [, , campaignId, projectId] = pathname.split("/");
  const campaign = campaigns.find((item) => item.id === campaignId);
  const project = projects.find(
    (item) => item.id === projectId && item.campaignId === campaignId,
  );
  if (!ads) return <p role="status">Loading projects for good.</p>;
  if ((campaignId && !campaign) || (projectId && !project))
    return (
      <section className="market-panel">
        <h1>This project or campaign is unavailable.</h1>
        <p>Only active public projects are shown here.</p>
        <Link to="/support">Browse campaigns</Link>
      </section>
    );
  const visibleProjects = projects.filter(
    (item) => !campaignId || item.campaignId === campaignId,
  );
  const projectAds = ads.filter((ad) => ad.projectId === project?.id);
  const totalSupport = projectAds.reduce(
    (sum, ad) => sum + fundedCents(ad.id),
    0,
  );
  return (
    <div className="donor-journey">
      <nav aria-label="Giving journey" className="donor-breadcrumbs">
        <Link to="/support">Campaigns</Link>
        {campaign && (
          <>
            <span aria-hidden="true">/</span>
            <Link to={`/support/${campaign.id}`}>{campaign.name}</Link>
          </>
        )}
        {project && (
          <>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{project.name}</span>
          </>
        )}
      </nav>
      <section className="donor-hero">
        <div>
          <span className="eyebrow">DONOR PREVIEW · NO REAL PAYMENTS</span>
          <h1>
            {project
              ? project.name
              : campaign
                ? campaign.name
                : "Help good stories reach more people."}
          </h1>
          <p>
            {project
              ? project.description
              : campaign
                ? "Explore the projects and creative work in this campaign."
                : "Choose a campaign, explore a project, and preview how you could support its awareness work."}
          </p>
          <p>
            Donors fund projects and their awareness work. Viewers receive
            adoption education through the stories they watch. A click or a
            video view does not establish an adoption outcome.
          </p>
          {project && (
            <p className="donor-owner">
              Project organization: <strong>{project.nonprofit}</strong>
            </p>
          )}
        </div>
        <aside className="donor-boundary">
          <ShieldCheck size={24} aria-hidden="true" />
          <h2>Explore with confidence</h2>
          <p>
            This demo saves simulated support in this browser. It cannot charge
            a card, buy ads, or send funds.
          </p>
          <Link to="/viewer" className="text-button">
            View saved giving <ArrowUpRight size={16} />
          </Link>
        </aside>
      </section>
      {!project ? (
        <>
          <ol className="donor-steps" aria-label="How giving works">
            <li>
              <strong>1. Choose a campaign</strong>
              <span>See the purpose and project organization.</span>
            </li>
            <li>
              <strong>2. Explore a project</strong>
              <span>Watch its stories and understand the sample results.</span>
            </li>
            <li>
              <strong>3. Preview support</strong>
              <span>
                Try a simulated contribution; no charge or ad purchase.
              </span>
            </li>
          </ol>
          <h2>
            {campaign ? "Projects in this campaign" : "Choose your campaign"}
          </h2>
          <div className="donor-grid">
            {(campaign
              ? visibleProjects
              : [...campaigns].sort(
                  (a, b) =>
                    Number(b.id === "adoption-is") -
                    Number(a.id === "adoption-is"),
                )
            ).map((item) => {
              const childProjects = projects.filter(
                (p) => p.campaignId === item.id,
              );
              const cover = ads.find((ad) =>
                campaign ? ad.projectId === item.id : ad.campaignId === item.id,
              );
              return (
                <article className="market-panel donor-card" key={item.id}>
                  {cover && (
                    <img
                      src={
                        cover.poster.startsWith("/")
                          ? demoAsset(cover.poster)
                          : cover.poster
                      }
                      alt=""
                      className="donor-cover"
                    />
                  )}
                  <span className="eyebrow">
                    {campaign
                      ? "PROJECT"
                      : item.id === "adoption-is"
                        ? "FEATURED CAMPAIGN"
                        : "CAMPAIGN"}
                  </span>
                  <h3>{item.name}</h3>
                  <p>
                    {campaign
                      ? (item as PublicProject).description
                      : `${childProjects.length} active ${childProjects.length === 1 ? "project" : "projects"}. Explore the work before choosing how to support it.`}
                  </p>
                  <Link
                    className="button primary"
                    to={
                      campaign
                        ? `/support/${campaign.id}/${item.id}`
                        : `/support/${item.id}`
                    }
                  >
                    {campaign ? "Explore project" : "View campaign"}
                    <ArrowUpRight size={16} />
                  </Link>
                </article>
              );
            })}
          </div>
          {!visibleProjects.length && (
            <p>No active projects are available in this campaign.</p>
          )}
        </>
      ) : (
        <>
          <section className="donor-project-layout">
            <div>
              <h2>Stories supporting this project</h2>
              <p>
                Watch the existing creative, then preview support for its
                distribution.
              </p>
              {projectAds.map((ad) => (
                <article className="market-panel donor-story" key={ad.id}>
                  <AdInsightTabs ad={ad} />
                  <h3>
                    <Link to={`/ads/${ad.id}`}>{ad.title}</Link>
                  </h3>
                  <p>
                    Created by <strong>{ad.creator}</strong>
                  </p>
                  <p>{ad.caption}</p>
                  <MetricEvidence ad={ad} />
                  <button
                    className="button primary"
                    onClick={() => onSupport(ad)}
                  >
                    Preview support <Heart size={16} />
                  </button>
                </article>
              ))}
              {!projectAds.length && (
                <p>
                  No eligible public stories are available. Support preview
                  opens when a story is available.
                </p>
              )}
            </div>
            <aside className="market-panel donor-support-panel">
              <span className="eyebrow">SUPPORT THIS PROJECT</span>
              <h2>A preview of giving</h2>
              <p>
                Explore a simulated ad-fund contribution through a story. Ad
                support and a direct gift to the organization are separate.
              </p>
              <strong className="donor-total">{money(totalSupport)}</strong>
              <p>
                Simulated ad support saved in this browser, across its viewer
                profiles. Separate from sample performance and financial
                records.
              </p>
              <button className="button secondary full" disabled>
                Live donation unavailable
              </button>
              <p>
                Real checkout, project funding terms, tax treatment, and fund
                use require approval and production setup. No funding target or
                guaranteed result is offered here.
              </p>
              <Link
                className="text-button"
                to={`/leaderboard?campaign=${encodeURIComponent(campaign!.id)}`}
              >
                Campaign leaderboard <ArrowUpRight size={16} />
              </Link>
            </aside>
          </section>
          <section className="market-panel donor-delivery">
            <h2>From donor support to public education</h2>
            <p>
              The intended journey is project support, approved creative
              distribution, and viewers learning about adoption. This demo does
              not distribute ads or verify adoption outcomes.
            </p>
            <p>
              Geographic targeting would use the advertising platforms'
              available location controls after account connection and approval.
              BRM has no live targeting controls here. No sensitive audience
              characteristics are inferred.
            </p>
            <div className="donor-gates">
              <span>Meta: not connected</span>
              <span>TikTok: not connected</span>
              <span>Payments: demo only</span>
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export function MetricEvidence({ ad }: { ad: PublicAd }) {
  return (
    <section
      className="donor-evidence"
      aria-label={`Metric evidence for ${ad.title}`}
    >
      <h4>Sample performance · illustrative weekly scenario</h4>
      <dl className="donor-metrics">
        <div>
          <dt>Impressions</dt>
          <dd>{count(ad.impressions)}</dd>
        </div>
        <div>
          <dt>Reach</dt>
          <dd>N/A</dd>
        </div>
        <div>
          <dt>Destination clicks</dt>
          <dd>{count(ad.clicks)}</dd>
        </div>
        <div>
          <dt>CTR</dt>
          <dd>{ctr(ad)}</dd>
        </div>
      </dl>
      <p>
        Source: bundled demo scenario
        {ad.campaign === "Adoption Is"
          ? " for Adoption Is / ACU ad competition"
          : ""}
        . No live platform reporting is connected. Missing values show N/A.
      </p>
      <details>
        <summary>What these metrics mean</summary>
        <p>
          Impressions count displays, including repeated displays to the same
          account. Reach counts unique accounts; it is unavailable and cannot be
          inferred from impressions.
        </p>
        <p>
          Destination clicks count clicks on the ad's destination link. CTR is
          destination clicks ÷ impressions × 100; a missing or zero impression
          denominator shows N/A. Clicks do not prove learning, donations, or
          adoption outcomes.
        </p>
        <p>
          Sample performance does not change when you save simulated support.
          The leaderboard has its own labeled daily and weekly simulation.
        </p>
      </details>
    </section>
  );
}
