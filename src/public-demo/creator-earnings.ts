import type { Post } from "../types";
import type { Support } from "./catalog";
import { recordedAdFundAllocation } from "./ad-fund-policy.ts";

type Gift = {
  id: string;
  creatorId?: string;
  attributed: boolean;
  result?: { creatorCents: number };
};
export type CreatorEarningsReport = ReturnType<typeof creatorEarningsReport>;

// Saved attribution owns earnings even when an ad is no longer discoverable.
// Donor identities and other creators' financial records never enter the projection.
export function creatorEarningsReport(
  creatorId: string,
  posts: Pick<Post, "id" | "title" | "creatorId">[],
  support: Support[],
  gifts: Gift[] = [],
) {
  const own = new Map(
    posts.filter((p) => p.creatorId === creatorId).map((p) => [p.id, p]),
  );
  const ads = new Map<
    string,
    {
      adId: string;
      title: string;
      earnedCents: number;
      contributionCount: number;
      legacyCents: number;
    }
  >();
  for (const contribution of support) {
    if (
      contribution.creatorId
        ? contribution.creatorId !== creatorId
        : !own.has(contribution.adId)
    )
      continue;
    const amount = contribution.amountCents;
    if (!Number.isSafeInteger(amount) || amount <= 0) continue;
    const row = ads.get(contribution.adId) || {
      adId: contribution.adId,
      title: own.get(contribution.adId)?.title || contribution.title,
      earnedCents: 0,
      contributionCount: 0,
      legacyCents: 0,
    };
    const allocation = recordedAdFundAllocation(
      amount,
      contribution.allocation,
    );
    if (allocation && contribution.creatorId === creatorId) {
      row.earnedCents += allocation.creatorCents;
      row.contributionCount++;
    } else row.legacyCents += amount;
    ads.set(row.adId, row);
  }
  const adRows = [...ads.values()].sort(
    (a, b) => b.earnedCents - a.earnedCents || a.title.localeCompare(b.title),
  );
  const adFundCents = adRows.reduce((sum, row) => sum + row.earnedCents, 0);
  const causeGiftCents = gifts.reduce(
    (sum, gift) =>
      gift.attributed &&
      gift.creatorId === creatorId &&
      Number.isSafeInteger(gift.result?.creatorCents) &&
      (gift.result?.creatorCents || 0) > 0
        ? sum + gift.result!.creatorCents
        : sum,
    0,
  );
  const earnedCents = adFundCents + causeGiftCents;
  return {
    creatorId,
    earnedCents,
    adFundCents,
    causeGiftCents,
    paidCents: 0,
    pendingCents: earnedCents,
    legacyCents: adRows.reduce((sum, row) => sum + row.legacyCents, 0),
    ads: adRows,
  };
}
