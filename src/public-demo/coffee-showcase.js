import {
  configurePolicy,
  snapshotPost,
  refreshEligibility,
} from "../../server/eligibility.js";
import { coffeeAds, coffeeCreatorId, coffeeProjectId } from "./coffee-ads.js";
import { mediaEvidence } from "./media";

// Append to old browser workspaces once. Preserve uploads, identities and gifts.
export async function addCoffeeShowcase(value) {
  if (value.coffeeShowcaseVersion === 1) return;
  const ownerId = `${coffeeProjectId}-owner`;
  if (!value.creators.some((c) => c.id === coffeeCreatorId))
    value.creators.unshift({
      id: coffeeCreatorId,
      name: "Nocturne Studio · fictional",
    });
  if (!value.nonprofits.some((n) => n.id === ownerId))
    value.nonprofits.push({ id: ownerId, name: "Nocturne Coffee · fictional" });
  let project = value.projects.find((p) => p.id === coffeeProjectId);
  if (!project) {
    project = {
      id: coffeeProjectId,
      name: "Nocturne Coffee — after dark",
      nonprofit: "Nocturne Coffee · fictional",
      nonprofitId: ownerId,
      ownerOrganizationId: ownerId,
      beneficiaryOrganizationId: ownerId,
      category: "Coffee & culture",
      description:
        "Three finished films for a fictional neighborhood coffee shop. A midnight ritual, a carefully pulled espresso, and a place to stay awhile.",
      brief:
        "An atmospheric coffee shop campaign in midnight, plum and amber. Explore the finished 16-second films or create your own story.",
      cover: "forest",
      coverMedia: "/images/coffee-midnight.png",
      color: "purple",
      status: "active",
      startDate: "2026-01-01",
      endDate: "2030-12-31",
      instagram: "fictional.nocturne",
      createdAt: new Date().toISOString(),
    };
    configurePolicy(project);
    value.projects.unshift(project);
  }
  const created = [];
  for (const ad of coffeeAds) {
    if (value.posts.some((p) => p.id === ad.id)) continue;
    const now = new Date().toISOString();
    const policy = project.eligibilityPolicy;
    const post = {
      id: ad.id,
      projectId: project.id,
      title: ad.title,
      creator: "Nocturne Studio · fictional",
      creatorId: coffeeCreatorId,
      caption: ad.caption,
      format: "reel",
      media: `/videos/${ad.id}.webm`,
      mediaType: "video",
      rights: true,
      channel: "instagram",
      destination: policy.destinations[0],
      disclosures: {
        compensation: policy.compensationDisclosure,
        beneficiary: policy.beneficiaryDisclosure,
      },
      factualClaims: [],
      acceptedTermsVersion: policy.termsVersion,
      revision: 1,
      createdAt: now,
      updatedAt: now,
      feedback: "",
      history: [],
    };
    snapshotPost(post, await mediaEvidence(post.media));
    created.push(post);
  }
  value.posts.unshift(...created);
  value.coffeeShowcaseVersion = 1;
  refreshEligibility(value);
}
