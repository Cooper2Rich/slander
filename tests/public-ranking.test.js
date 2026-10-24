import { test } from "node:test";
import assert from "node:assert/strict";
import { rankPublicAds } from "../src/public-demo/ranking.ts";

test("public leaderboard limits known metrics to 25 and preserves input", () => {
  const ads = Array.from({ length: 30 }, (_, i) => ({
    id: `ad-${i}`,
    donatedCents: i * 100,
    clicks: i,
    impressions: 100,
  }));
  ads.push({
    id: "unknown",
    donatedCents: null,
    clicks: null,
    impressions: null,
  });
  const before = structuredClone(ads);
  const ranked = rankPublicAds(ads);
  assert.equal(ranked.length, 25);
  assert.equal(ranked[0].id, "ad-29");
  assert.equal(ranked.at(-1).id, "ad-5");
  assert.deepEqual(ads, before);
});

test("sample ranking uses CTR to break donation ties and admits real zeroes", () => {
  const ranked = rankPublicAds([
    { id: "a", donatedCents: 100, clicks: 1, impressions: 100 },
    { id: "b", donatedCents: 100, clicks: 3, impressions: 100 },
    { id: "zero", donatedCents: 0, clicks: 0, impressions: 0 },
    { id: "missing", donatedCents: 500, clicks: null, impressions: null },
  ]);
  assert.deepEqual(
    ranked.map((ad) => ad.id),
    ["b", "a", "zero"],
  );
});
