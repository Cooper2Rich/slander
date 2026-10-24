import { Link } from "react-router-dom";
import { ArrowUpRight, Trophy } from "lucide-react";
import { count, money, type PublicAd, type PublicCampaign } from "./catalog";
import { demoAsset } from "../runtime";
import { DEMO_TARGETS, rankPublicAds, scorePublicAd } from "./ranking";

export function PublicLeaderboard({
  ads,
  campaigns,
  campaign,
  onCampaign,
  search,
}: {
  ads: PublicAd[] | null;
  campaigns: PublicCampaign[];
  campaign: string;
  onCampaign: (value: string) => void;
  search: string;
}) {
  const boards = campaigns
    .filter(({ id }) => campaign === "all" || campaign === id)
    .map(({ id, name }) => {
      const ranked = rankPublicAds(ads || [], id);
      return {
        id,
        name,
        ranked,
        visible: ranked.filter((ad) =>
          `${ad.title} ${ad.creator} ${ad.project}`
            .toLowerCase()
            .includes(search.trim().toLowerCase()),
        ),
      };
    });
  return (
    <section className="public-leaderboard" aria-label="Campaign leaderboard">
      <div className="section-toolbar">
        <h2>
          <Trophy size={17} /> Top 25 per campaign
        </h2>
        <select
          aria-label="Leaderboard campaign"
          value={campaign}
          onChange={(event) => onCampaign(event.target.value)}
        >
          <option value="all">All campaigns</option>
          {campaigns.map(({ id, name }) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
      </div>
      <p className="leaderboard-note">
        PRD scoring: impressions 40% · total link clicks 30% · funds raised 30%.
        Illustrative demo window; no live daily or weekly results or payouts.
      </p>
      <details className="leaderboard-scoring">
        <summary>Scoring method & demo targets</summary>
        <p>
          Each component is capped at 1 using √(result ÷ target). Score = 40 ×
          impressions component + 30 × link-click component + 30 × funds-raised
          component.
        </p>
        <p>
          Demo targets per campaign: {count(DEMO_TARGETS.impressions)}{" "}
          impressions · {count(DEMO_TARGETS.clicks)} total link clicks ·{" "}
          {money(DEMO_TARGETS.donatedCents)} raised. These are sample targets,
          not official campaign settings. Missing inputs remain unranked; known
          zeroes are scored.
        </p>
        <p>
          Ties use unrounded score, then most total link clicks, funds raised,
          and impressions. Ads still equal share a rank. CTR and ad-spend
          contributions do not affect scores.
        </p>
      </details>
      {boards
        .filter(
          (board) =>
            !search.trim() ||
            board.visible.length > 0 ||
            board.name.toLowerCase().includes(search.trim().toLowerCase()),
        )
        .map((board) => (
          <section
            className="campaign-board"
            aria-label={`${board.name} leaderboard`}
            key={board.id}
          >
            <div className="section-toolbar">
              <h3>{board.name}</h3>
              <span className="count-pill">{board.ranked.length} / 25 ads</span>
            </div>
            <div className="leaderboard-table-wrap">
              <table className="leaderboard-table">
                <caption className="sr-only">
                  Top 25 ads for {board.name}
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Rank</th>
                    <th scope="col">Ad / creator</th>
                    <th scope="col">Impressions</th>
                    <th scope="col">Link clicks</th>
                    <th scope="col">Raised</th>
                    <th scope="col">Score / 100</th>
                  </tr>
                </thead>
                <tbody>
                  {board.visible.map((ad) => (
                    <tr key={ad.id}>
                      <td className="rank-cell">
                        {String(ad.rank).padStart(2, "0")}
                      </td>
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
                      <td>{count(ad.impressions)}</td>
                      <td>{count(ad.clicks)}</td>
                      <td>{money(ad.donatedCents!)}</td>
                      <td
                        className="leaderboard-amount"
                        title={String(ad.score)}
                      >
                        {ad.score.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!board.visible.length && (
              <div className="compact-empty">
                <h3>No ranked ads found.</h3>
                <p>
                  Ads need impressions, total link clicks and funds-raised data
                  to receive a score.
                </p>
              </div>
            )}
            {ads?.some(
              (ad) => ad.projectId === board.id && scorePublicAd(ad) === null,
            ) && (
              <p className="leaderboard-note">
                Ads missing performance data are awaiting a ranking.
              </p>
            )}
          </section>
        ))}
      {!ads ? (
        <p role="status">Loading leaderboard…</p>
      ) : (
        !boards.some((board) => board.visible.length > 0) && (
          <p className="leaderboard-note">
            No matching ranked ads. Try another campaign or search.
          </p>
        )
      )}
    </section>
  );
}
