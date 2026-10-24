import type { PublicAd, PublicCampaign } from "./catalog";
import {
  leaderboardWindow,
  periodAd,
  type LeaderboardPeriod,
  type LeaderboardWindow,
} from "./leaderboard-periods.ts";
import { rankPublicAds, type ScoredAd } from "./ranking.ts";

const DAY = 86400000;
const key = "ripple-leaderboard-history-v1";
export type PastResult = {
  campaignId: string;
  campaignName: string;
  period: LeaderboardPeriod;
  date: string;
  winners: ScoredAd[];
};

export function pastPeriods(period: LeaderboardPeriod, now = new Date()) {
  const start = Date.parse(leaderboardWindow(period, now).startsOn);
  return Array.from({ length: period === "daily" ? 7 : 4 }, (_, index) =>
    new Date(start - (index + 1) * (period === "daily" ? DAY : 7 * DAY))
      .toISOString()
      .slice(0, 10),
  );
}

export function completedWindow(
  period: LeaderboardPeriod,
  date: string,
  now = new Date(),
): LeaderboardWindow | null {
  if (!pastPeriods(period, now).includes(date)) return null;
  const window = leaderboardWindow(period, new Date(`${date}T12:00:00Z`));
  return {
    ...window,
    through: new Date(Date.parse(window.endsBefore) - DAY)
      .toISOString()
      .slice(0, 10),
  };
}

// Freeze completed sample results independently from animated current leaders.
// Previously captured periods are retained when today's metrics or ads change.
export function capturePastResults(
  ads: PublicAd[],
  campaigns: PublicCampaign[],
  prior: PastResult[] = [],
  now = new Date(),
): PastResult[] {
  const results = [...prior];
  const existing = new Set(
    prior.map(
      (result) => `${result.campaignId}:${result.period}:${result.date}`,
    ),
  );
  for (const period of ["daily", "weekly"] as const) {
    for (const date of pastPeriods(period, now)) {
      const window = completedWindow(period, date, now)!;
      const periodAds = ads.map((ad) => periodAd(ad, window));
      for (const campaign of campaigns) {
        const id = `${campaign.id}:${period}:${date}`;
        if (existing.has(id)) continue;
        const winners = rankPublicAds(periodAds, campaign.id)
          .filter((ad) => ad.rank === 1)
          .map(({ performanceDays: _days, ...ad }) => ad);
        results.push({
          campaignId: campaign.id,
          campaignName: campaign.name,
          period,
          date,
          winners,
        });
        existing.add(id);
      }
    }
  }
  return results;
}

export function loadPastResults(ads: PublicAd[], campaigns: PublicCampaign[]) {
  const raw = localStorage.getItem(key);
  const prior: PastResult[] = raw ? JSON.parse(raw) : [];
  const results = capturePastResults(ads, campaigns, prior);
  if (results.length !== prior.length)
    localStorage.setItem(key, JSON.stringify(results));
  return results;
}
