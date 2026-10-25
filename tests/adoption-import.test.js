import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { adoptionAds } from "../src/public-demo/adoption-ads.js";
import {
  addAdoptionShowcase,
  adoptionCampaignId,
  adoptionProjectId,
} from "../src/public-demo/adoption-showcase.js";
import { currentEligibility } from "../server/eligibility.js";

test("the supplied adoption films retain their original full-length bytes, distinct identities and audio tracks", () => {
  assert.deepEqual(
    adoptionAds.map((ad) => ad.title),
    ["The Girl in the Middle", "Duality"],
  );
  for (const ad of adoptionAds) {
    const bytes = readFileSync(
      new URL(`../public${ad.media}`, import.meta.url),
    );
    assert.equal(bytes.length, ad.bytes);
    assert.equal(createHash("sha256").update(bytes).digest("hex"), ad.digest);
    assert.ok(ad.durationSeconds >= 60 && ad.durationSeconds < 61);
    assert.ok(
      bytes.includes(Buffer.from("mp4a")),
      "original AAC audio is retained",
    );
    assert.ok(
      readFileSync(new URL(`../public${ad.poster}`, import.meta.url)).length >
        1000,
    );
  }
  assert.notEqual(adoptionAds[0].digest, adoptionAds[1].digest);
});

test("the explicit import creates one campaign with one child project and two ads, without replaying or replacing records", () => {
  const state = {
    nonprofits: [],
    creators: [],
    managedCampaigns: [],
    projects: [],
    posts: [],
    activity: [],
    projectRequests: [{ id: "preserved" }],
    sampleFinancials: { marker: "preserved" },
    support: [{ id: "retained" }],
  };
  addAdoptionShowcase(state);
  assert.equal(state.managedCampaigns.length, 1);
  assert.equal(state.managedCampaigns[0].name, "Adoption Is");
  assert.equal(state.projects.length, 1);
  assert.equal(state.projects[0].name, "ACU ad competition");
  assert.equal(state.projects[0].campaignId, adoptionCampaignId);
  assert.notEqual(adoptionCampaignId, adoptionProjectId);
  assert.equal(state.posts.length, 2);
  assert.ok(
    state.posts.every(
      (p) =>
        p.projectId === adoptionProjectId &&
        currentEligibility(p, state.projects[0]),
    ),
  );
  state.posts[0].caption = "A retained edit";
  state.posts[0].withdrawnAt = new Date().toISOString();
  state.managedCampaigns[0].status = "archived";
  const before = structuredClone(state);
  addAdoptionShowcase(state);
  assert.deepEqual(state, before);
});
