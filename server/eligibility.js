import { createHash, randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { z } from "zod";
import { submissionsOpen, utcDate } from "../src/calendar.ts";
export { submissionsOpen, utcDate };

export const RULE_VERSION = "creative-eligibility-v3";
const recordContexts = new WeakMap();
export function bindEligibilityRecords(state, records) {
  recordContexts.set(state, records);
  return state;
}
export const COMPENSATION =
  "Creators receive 10% of eligible attributed donations; 90% belongs to the nonprofit before fees.";
export const digest = (value) =>
  createHash("sha256").update(JSON.stringify(value)).digest("hex");
export const mediaDigest = (bytes) =>
  createHash("sha256").update(bytes).digest("hex");
const list = z.array(z.string().trim().min(1).max(600)).min(1).max(30);
const creativeFields = z.object({
  title: z.string().trim().min(1).max(100),
  creator: z.string().trim().min(1).max(80),
  creatorId: z.string().min(1),
  caption: z.string().trim().min(1).max(2200),
  format: z.enum(["photo", "reel", "carousel", "story", "other"]),
  media: z.string().min(1).max(300),
  mediaType: z.enum(["image", "video"]),
  rights: z.boolean(),
});
export const policyInput = z
  .object({
    allowedChannels: list.default(["instagram"]),
    allowedFormats: z
      .array(z.enum(["photo", "reel", "carousel", "story", "other"]))
      .min(1)
      .default(["photo", "reel", "carousel", "story", "other"]),
    destinations: list,
    beneficiaryDisclosure: z.string().trim().min(1).max(600),
    compensationDisclosure: z.literal(COMPENSATION).default(COMPENSATION),
    factualClaims: z
      .array(z.string().trim().min(1).max(600))
      .max(20)
      .default([]),
    termsVersion: z.string().trim().min(1).max(80).default("local-v1"),
    maxFileBytes: z
      .number()
      .int()
      .positive()
      .max(30 * 1024 * 1024)
      .default(30 * 1024 * 1024),
  })
  .strict();

export function configurePolicy(project, input) {
  const existing =
    project.eligibilityPolicy &&
    Object.fromEntries(
      Object.keys(policyInput.shape).map((key) => [
        key,
        project.eligibilityPolicy[key],
      ]),
    );
  const config = policyInput.parse(
    input ||
      existing || {
        destinations: [`/campaigns/${project.id}/give`],
        beneficiaryDisclosure: `Beneficiary: ${project.nonprofit}.`,
      },
  );
  const policyData = {
    ...config,
    startDate: project.startDate,
    endDate: project.endDate,
  };
  if (project.eligibilityPolicy?.digest === digest(policyData)) return;
  project.policyHistory ||= [];
  const policy = {
    ...policyData,
    version: project.policyHistory.length + 1,
    digest: digest(policyData),
  };
  project.policyHistory.push(structuredClone(policy));
  project.eligibilityPolicy = policy;
}

export function snapshotPost(post, mediaEvidence) {
  if (
    !mediaEvidence &&
    /^\/images\/(forest|food|education|seedling)\.jpg$/.test(post.media)
  ) {
    const bytes = readFileSync(
      new URL(`../public${post.media}`, import.meta.url),
    );
    mediaEvidence = {
      verified: true,
      bytes: bytes.length,
      digest: mediaDigest(bytes),
      source: "approved-sample",
    };
  }
  const content = Object.fromEntries(
    [
      "title",
      "creator",
      "creatorId",
      "caption",
      "format",
      "media",
      "mediaType",
      "rights",
      "channel",
      "destination",
      "disclosures",
      "factualClaims",
      "acceptedTermsVersion",
    ].map((key) => [key, post[key] ?? null]),
  );
  const snapshot = {
    id: randomUUID(),
    revision: post.revision,
    content,
    mediaEvidence: mediaEvidence || {
      verified: false,
      bytes: 0,
      digest: digest(post.media),
      source: "legacy-reference",
    },
    submittedBy: post.creatorId || post.creator,
    at: post.updatedAt,
  };
  snapshot.contentKey = digest({
    media: snapshot.mediaEvidence.digest,
    caption: content.caption,
  });
  snapshot.digest = digest({ content, mediaEvidence: snapshot.mediaEvidence });
  post.snapshots ||= [];
  post.snapshots.push(snapshot);
  post.snapshotId = snapshot.id;
  return snapshot;
}

export function eligibilityFacts(state, post, project, today = utcDate()) {
  const snapshot = post.snapshots.find((s) => s.id === post.snapshotId);
  const holds = (state.creativeHolds || [])
    .filter(
      (h) =>
        !h.resolvedAt &&
        (h.postId === post.id || h.contentKey === snapshot.contentKey),
    )
    .map((h) => ({
      id: h.id,
      code: h.code,
      reason: h.reason,
      evidence: h.evidence,
    }));
  const facts = {
    today,
    projectStatus: project.status,
    withdrawn: !!post.withdrawnAt,
    holds,
  };
  if (project.offerVersionId) {
    const records = recordContexts.get(state);
    const participation = records?.get(
      "participations",
      `${post.creatorId}:${project.offerVersionId}`,
    );
    const restriction = records?.restrictionFor(
      project.id,
      post.creatorId,
      new Date().toISOString(),
    );
    facts.marketplace = {
      termsId: project.offerVersionId,
      participationId: participation?.id || null,
      restrictionId: restriction?.id || null,
    };
  }
  return { ...facts, version: digest(facts) };
}

// Pure evaluator: IDs and wall-clock timestamps are added only by the audit writer.
export function evaluateSnapshot(snapshot, policy, facts) {
  const c = snapshot.content;
  const reasons = [];
  const fail = (code, message) => reasons.push({ code, message });
  if (!creativeFields.safeParse(c).success)
    fail(
      "CREATIVE_SCHEMA_INVALID",
      "Correct the required title, caption, creator identity, media and format fields.",
    );
  if (!c.rights)
    fail("RIGHTS_REQUIRED", "Confirm media rights and permission to share.");
  if (c.disclosures?.compensation !== policy.compensationDisclosure)
    fail(
      "COMPENSATION_DISCLOSURE_REQUIRED",
      "Include the exact required compensation disclosure block.",
    );
  if (c.disclosures?.beneficiary !== policy.beneficiaryDisclosure)
    fail(
      "BENEFICIARY_DISCLOSURE_REQUIRED",
      "Include the exact required beneficiary disclosure block.",
    );
  if (!policy.destinations.includes(c.destination))
    fail(
      "DESTINATION_NOT_ALLOWED",
      "Choose a campaign-authorized destination.",
    );
  if (!policy.allowedChannels.includes(c.channel))
    fail(
      "CHANNEL_NOT_ALLOWED",
      "This campaign has not authorized this channel.",
    );
  if (!policy.allowedFormats.includes(c.format))
    fail("FORMAT_NOT_ALLOWED", "Choose a campaign-authorized format.");
  if (c.acceptedTermsVersion !== policy.termsVersion)
    fail(
      "CURRENT_TERMS_REQUIRED",
      "Accept the current campaign terms version.",
    );
  if (
    facts.marketplace &&
    (!facts.marketplace.participationId ||
      facts.marketplace.termsId !== c.acceptedTermsVersion)
  )
    fail(
      "ACCEPTED_PARTICIPATION_REQUIRED",
      "Accept the current published campaign terms with your selected creator profile.",
    );
  if (facts.marketplace?.restrictionId)
    fail(
      "PARTICIPATION_HELD",
      "Existing identity/campaign restrictions require platform review.",
    );
  if (policy.factualClaims.some((claim) => !c.factualClaims?.includes(claim)))
    fail(
      "FACT_BLOCK_REQUIRED",
      "Include the exact factual claim blocks supplied by the campaign.",
    );
  if (!snapshot.mediaEvidence.verified)
    fail(
      "MEDIA_EVIDENCE_REQUIRED",
      "Re-upload the legacy file so its signature can be verified.",
    );
  if (snapshot.mediaEvidence.bytes > policy.maxFileBytes)
    fail("FILE_TOO_LARGE", "The file exceeds the campaign file limit.");
  if (
    (c.format === "photo" && c.mediaType !== "image") ||
    (c.format === "reel" && c.mediaType !== "video")
  )
    fail(
      "FORMAT_MEDIA_MISMATCH",
      "A photo needs an image; a reel needs a video.",
    );
  if (facts.projectStatus !== "active")
    fail("CAMPAIGN_INACTIVE", "The campaign must be published for new use.");
  if (facts.today < policy.startDate || facts.today > policy.endDate)
    fail(
      "CAMPAIGN_OUTSIDE_DATES",
      "The campaign is outside its inclusive UTC dates.",
    );
  if (facts.withdrawn)
    fail(
      "CREATIVE_WITHDRAWN",
      "This creative has been withdrawn from new use.",
    );
  for (const hold of facts.holds) fail(hold.code, hold.reason);
  return {
    outcome: facts.holds.length
      ? "held"
      : reasons.length
        ? "needs_fix"
        : "eligible",
    reasons,
    ruleVersion: RULE_VERSION,
    policyVersion: policy.version,
    factVersion: facts.version,
    snapshotId: snapshot.id,
    snapshotDigest: snapshot.digest,
  };
}

export function evaluatePost(state, post, project) {
  const snapshot = post.snapshots.find((s) => s.id === post.snapshotId);
  const facts = eligibilityFacts(state, post, project);
  const result = evaluateSnapshot(snapshot, project.eligibilityPolicy, facts);
  const key = digest(result);
  post.evaluations ||= [];
  let evaluation = post.evaluations.find((e) => e.key === key);
  if (!evaluation) {
    evaluation = {
      ...result,
      id: randomUUID(),
      key,
      facts,
      policy: structuredClone(project.eligibilityPolicy),
      at: new Date().toISOString(),
    };
    post.evaluations.push(evaluation);
    post.history.push({
      id: randomUUID(),
      action: "evaluated",
      actor: "Deterministic eligibility",
      note: `${result.outcome}: ${result.reasons.map((r) => `${r.code}: ${r.message}`).join("; ") || "All required checks passed."}`,
      at: evaluation.at,
    });
    state.activity.unshift({
      id: randomUUID(),
      action: "evaluated",
      title: `Evaluated “${post.title}”: ${result.outcome}`,
      detail:
        result.reasons.map((r) => r.message).join(" ") ||
        "Automatically eligible. Live authorization remains pending.",
      projectId: post.projectId,
      at: evaluation.at,
    });
  }
  post.evaluationId = evaluation.id;
  post.eligibility = evaluation;
  post.status = post.withdrawnAt
    ? "rejected"
    : { eligible: "approved", needs_fix: "changes", held: "held" }[
        result.outcome
      ];
  post.policy = {
    passed: result.outcome === "eligible",
    reasons: result.reasons.map((r) => r.message),
    version: RULE_VERSION,
  };
  return evaluation;
}

export function refreshEligibility(state) {
  state.creativeHolds ||= [];
  state.creativeAppeals ||= [];
  state.exports ||= [];
  for (const project of state.projects) {
    const terms = project.offerVersionId
      ? recordContexts.get(state)?.get("offer_versions", project.offerVersionId)
      : null;
    const config = project.eligibilityPolicy
      ? Object.fromEntries(
          Object.keys(policyInput.shape).map((key) => [
            key,
            project.eligibilityPolicy[key],
          ]),
        )
      : undefined;
    configurePolicy(
      project,
      terms
        ? {
            ...config,
            termsVersion: terms.id,
            allowedChannels: [
              ...new Set(terms.combinations.map((c) => c.channel)),
            ],
            destinations: terms.destinations,
          }
        : config,
    );
  }
  for (const post of state.posts) {
    post.history ||= [];
    if (!post.snapshotId) {
      post.legacyStatus = post.status;
      snapshotPost(post);
    }
    evaluatePost(
      state,
      post,
      state.projects.find((p) => p.id === post.projectId),
    );
  }
  return state;
}

export function currentEligibility(post, project) {
  if (
    !post.eligibility ||
    !post.snapshots?.some(
      (s) =>
        s.id === post.snapshotId &&
        s.digest === post.eligibility.snapshotDigest,
    )
  )
    return false;
  return (
    post.eligibility.outcome === "eligible" &&
    post.eligibility.policyVersion === project.eligibilityPolicy?.version &&
    submissionsOpen(project) &&
    !post.withdrawnAt
  );
}

export function eligibleCounts(posts) {
  const rows = new Map();
  for (const post of new Map(posts.map((p) => [p.id, p])).values()) {
    const row = rows.get(post.creatorId) || {
      creatorId: post.creatorId,
      name: post.creator,
      count: 0,
    };
    row.count++;
    rows.set(post.creatorId, row);
  }
  return [...rows.values()]
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .map((row, _, all) => ({
      ...row,
      rank: 1 + all.filter((r) => r.count > row.count).length,
    }));
}
