import type { ManagedCampaign, Project } from "../types";
import type { PublicAd, Support } from "./catalog";
import { leaderboardWindow, periodAd } from "./leaderboard-periods.ts";

export function campaignFundingReport(
  campaigns: ManagedCampaign[],
  projects: Project[],
  ads: PublicAd[],
  support: Support[],
  now = new Date(),
) {
  const today = leaderboardWindow("daily", now);
  const previous = leaderboardWindow(
    "daily",
    new Date(now.getTime() - 86400000),
  );
  return campaigns.map((campaign) => {
    const projectIds = new Set(
      projects.filter((p) => p.campaignId === campaign.id).map((p) => p.id),
    );
    const measured = ads.filter(
      (ad) => (ad.campaignId || ad.projectId) === campaign.id,
    );
    const days = measured.map((ad) => ({
      current: periodAd(ad, today),
      previous: periodAd(ad, previous),
    }));
    const known =
      days.length > 0 &&
      days.every(
        (day) =>
          day.current.donatedCents !== null &&
          day.previous.donatedCents !== null,
      );
    const currentRaised = known
      ? days.reduce((sum, day) => sum + day.current.donatedCents!, 0)
      : null;
    const previousRaised = known
      ? days.reduce((sum, day) => sum + day.previous.donatedCents!, 0)
      : null;
    const contributions = support.filter((s) =>
      s.campaignId
        ? s.campaignId === campaign.id
        : projectIds.has(
            s.projectId || ads.find((ad) => ad.id === s.adId)?.projectId || "",
          ),
    );
    const allocation = {
      grossCents: 0,
      creatorCents: 0,
      appUseFeeCents: 0,
      beneficiaryCents: 0,
      legacyCents: 0,
      paidCents: 0,
    };
    for (const contribution of contributions) {
      allocation.grossCents += contribution.amountCents;
      const a = contribution.allocation;
      const fields = a && [
        a.creatorCents,
        a.appUseFeeCents,
        a.beneficiaryCents,
      ];
      if (
        a?.policy === "ad-fund-10-5-85-v1" &&
        fields?.every((n) => Number.isSafeInteger(n) && n >= 0) &&
        fields.reduce((sum, n) => sum + n, 0) === contribution.amountCents
      ) {
        allocation.creatorCents += a.creatorCents;
        allocation.appUseFeeCents += a.appUseFeeCents;
        allocation.beneficiaryCents += a.beneficiaryCents;
      } else allocation.legacyCents += contribution.amountCents;
    }
    return {
      campaign,
      ...allocation,
      currentRaised,
      previousRaised,
      growthCents:
        currentRaised === null || previousRaised === null
          ? null
          : currentRaised - previousRaised,
      growthPercent:
        currentRaised !== null && previousRaised
          ? (100 * (currentRaised - previousRaised)) / previousRaised
          : null,
    };
  });
}
