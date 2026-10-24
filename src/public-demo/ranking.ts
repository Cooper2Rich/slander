import type { PublicAd } from "./catalog";

// Temporary display order until the campaign scoring PRD is supplied.
// Distribution funding must never count as donations to the cause.
export function rankPublicAds(ads: PublicAd[]) {
  return ads
    .filter((ad) => ad.donatedCents !== null && ad.impressions !== null)
    .sort(
      (a, b) =>
        b.donatedCents! - a.donatedCents! ||
        (b.clicks || 0) / (b.impressions || 1) -
          (a.clicks || 0) / (a.impressions || 1) ||
        a.id.localeCompare(b.id),
    )
    .slice(0, 25);
}
