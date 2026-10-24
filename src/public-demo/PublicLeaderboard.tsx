import { Link } from "react-router-dom";
import { ArrowUpRight, Trophy } from "lucide-react";
import { count, ctr, money, type PublicAd } from "./catalog";
import { demoAsset } from "../runtime";
import { rankPublicAds } from "./ranking";

export function PublicLeaderboard({
  ads,
  campaign,
  onCampaign,
  search,
}: {
  ads: PublicAd[] | null;
  campaign: string;
  onCampaign: (value: string) => void;
  search: string;
}) {
  const scoped = (ads || []).filter(
    (ad) => campaign === "all" || ad.projectId === campaign,
  );
  const ranked = rankPublicAds(scoped);
  const visible = ranked
    .map((ad, index) => ({ ad, rank: index + 1 }))
    .filter(({ ad }) =>
      `${ad.title} ${ad.creator} ${ad.project}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    );
  const campaigns = [
    ...new Map(ads?.map((ad) => [ad.projectId, ad.project])).entries(),
  ];
  return (
    <section className="public-leaderboard" aria-label="Campaign leaderboard">
      <div className="section-toolbar">
        <h2>
          <Trophy size={17} /> Top 25 ads{" "}
          <span className="count-pill">{ranked.length}</span>
        </h2>
        <select
          aria-label="Leaderboard campaign"
          value={campaign}
          onChange={(event) => onCampaign(event.target.value)}
        >
          <option value="all">All campaigns</option>
          {campaigns.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
      </div>
      <p className="leaderboard-note">
        Sample ranking · ordered by cause donations for now. PRD scoring
        pending; these are illustrative metrics, not live results.
      </p>
      <div className="leaderboard-table-wrap">
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th scope="col">Rank</th>
              <th scope="col">Ad / creator</th>
              <th scope="col">Campaign</th>
              <th scope="col">Impressions</th>
              <th scope="col">CTR</th>
              <th scope="col">Donated</th>
            </tr>
          </thead>
          <tbody>
            {visible.map(({ ad, rank }) => (
              <tr key={ad.id}>
                <td className="rank-cell">{String(rank).padStart(2, "0")}</td>
                <td>
                  <Link className="leaderboard-ad" to={`/ads/${ad.id}`}>
                    <img src={demoAsset(ad.poster)} alt="" />
                    <span>
                      <strong>{ad.title}</strong>
                      <small>{ad.creator}</small>
                    </span>
                    <ArrowUpRight size={14} />
                  </Link>
                </td>
                <td>{ad.project}</td>
                <td>{count(ad.impressions)}</td>
                <td>{ctr(ad)}</td>
                <td className="leaderboard-amount">
                  {money(ad.donatedCents!)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!ads ? (
        <p role="status">Loading leaderboard…</p>
      ) : !visible.length ? (
        <div className="compact-empty">
          <h3>No ranked ads found.</h3>
          <p>
            Try another campaign or search. Ads need performance data to appear
            here.
          </p>
        </div>
      ) : null}
      {ads &&
        scoped.some(
          (ad) => ad.donatedCents === null || ad.impressions === null,
        ) && (
          <p className="leaderboard-note">
            Ads without performance data are awaiting a ranking.
          </p>
        )}
    </section>
  );
}
