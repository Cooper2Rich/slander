import { join } from "node:path";
import { AppError, addSubmission } from "./domain.js";
import { readAccess, requireProject } from "./access.js";
import { configurePolicy, refreshEligibility } from "./eligibility.js";
import { publishTerms, createDistribution } from "./marketplace.js";
import { issueLink } from "./attribution.js";
import { verifyMediaReference } from "./private-media.js";
import { createContribution, ingestEvent } from "./finance.js";
import { definePeriod, previewSettlement } from "./settlements.js";
import { gradeComponents } from "./grading.js";

export const SHOWCASE = "fictional-river-showcase-v1";
const ownerId = `${SHOWCASE}-owner`,
  creatorId = `${SHOWCASE}-creator`;
const admin = { role: "admin" };
const now = () => new Date().toISOString();

export function sampleWeek(at = new Date()) {
  const start = new Date(at);
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
  const startsAt = start.toISOString();
  const endsAt = new Date(start.getTime() + 7 * 86400000).toISOString();
  return { startsAt, endsAt, cutoff: endsAt };
}

// Explicit, append-only and transactionally idempotent. Never replaces seed/user records.
export function initializeShowcase(state, records) {
  if (state.projects.some((p) => p.id === SHOWCASE))
    return { campaignId: SHOWCASE, created: false };
  const at = now();
  state.nonprofits.push({
    id: ownerId,
    name: "Riverkind Collective · fictional",
  });
  state.organizations.push({
    id: ownerId,
    name: "Riverkind Collective · fictional",
    type: "nonprofit",
  });
  state.creators.push({ id: creatorId, name: "Alex River · fictional" });
  const p = {
    id: SHOWCASE,
    name: "A little louder for living rivers",
    nonprofit: "Riverkind Collective · fictional",
    nonprofitId: ownerId,
    ownerOrganizationId: ownerId,
    beneficiaryOrganizationId: ownerId,
    sponsorOrganizationIds: [],
    category: "Environment",
    description:
      "A fictional campaign for cleaner rivers and the communities that care for them.",
    brief:
      "Tell a hopeful story about caring for our rivers. Use the supplied forest image; include the compensation and beneficiary disclosures.",
    cover: "forest",
    color: "green",
    startDate: new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
    status: "active",
    instagram: "fictional.riverkind",
    goalCents: 100000,
    createdAt: at,
  };
  configurePolicy(p);
  state.projects.unshift(p);
  publishTerms(
    state,
    records,
    p.id,
    {
      currency: "USD",
      creatorCommissionBps: 1000,
      effectiveAt: at,
      startsAt: `${p.startDate}T00:00:00.000Z`,
      endsAt: new Date(
        Date.parse(`${p.endDate}T00:00:00Z`) + 86400000,
      ).toISOString(),
      attributionPolicy: "first-party-last-click-v1",
      attributionWindowDays: 7,
      permissions: {
        instagram: {
          state: "allowed",
          approver: "Fictional owner",
          evidence: "Local showcase permission only",
        },
      },
      combinations: [{ channel: "instagram", placement: "feed", paid: false }],
      destinations: [`/campaigns/${p.id}/give`],
      budgetPayer: "unassigned",
      guarantee: null,
      appUseAllocationCents: null,
      refundHoldPolicy: "Hold disputed funds. Zero fixture fees.",
      gradingConfigId: null,
    },
    admin,
    at,
  );
  const c = createContribution(state, records, p.id, {
    source: "showcase-fixture",
    sourceAccountId: "fictional-owner",
    originalTransactionId: `${SHOWCASE}-funding`,
    originalEvidenceId: "Explicit fictional showcase setup",
    currency: "USD",
    amountCents: 100000,
    contributorType: "business",
    purpose: "restricted",
    consent: "Fictional restricted funding: seed guarantee $600; media $400.",
    effectiveAt: at,
    allocations: [
      { purpose: "seed", use: "guarantee", amountCents: 60000 },
      { purpose: "media", use: "ad_budget", amountCents: 40000 },
    ],
  });
  for (const type of ["capture", "settlement"])
    ingestEvent(
      state,
      records,
      {
        contributionId: c.id,
        source: c.source,
        sourceAccountId: c.sourceAccountId,
        originalTransactionId: c.originalTransactionId,
        sourceEventId: `${SHOWCASE}-${type}`,
        type,
        amountCents: c.amountCents,
        effectiveAt: at,
        evidenceRef: "Fictional local showcase funding; no money moved",
      },
      at,
    );
  return { campaignId: p.id, created: true };
}

export function showcaseRoutes(app, store, dataDir, requireRole) {
  app.post("/api/demo/showcase", requireRole("admin"), (_req, res) =>
    res.json(store.update(initializeShowcase)),
  );
  app.get("/api/demo/showcase", (req, res) => {
    const s = store.read();
    readAccess(req, s);
    res.json({
      ready: s.projects.some((p) => p.id === SHOWCASE),
      campaignId: SHOWCASE,
      creatorId,
      ownerId,
    });
  });
  app.get("/api/giving/:id/campaign", (req, res) => {
    const p = store
      .read()
      .projects.find(
        (p) =>
          p.id === req.params.id &&
          p.status === "active" &&
          p.offerState === "open",
      );
    if (!p) throw new AppError("Giving campaign unavailable.", 404);
    res.json({
      id: p.id,
      name: p.name,
      nonprofit: p.nonprofit,
      description: p.description,
      cover: p.cover,
    });
  });
  app.post(
    "/api/campaigns/:id/sample-creative",
    requireRole("creator"),
    (req, res) =>
      res.status(201).json(
        store.update((s, r) => {
          const a = readAccess(req, s),
            p = requireProject(s, req.params.id, a);
          if (p.id !== SHOWCASE)
            throw new AppError(
              "Sample shortcut is available for the fictional showcase only.",
              409,
            );
          refreshEligibility(s);
          const policy = p.eligibilityPolicy;
          const body = {
            title: "Small acts. Living rivers.",
            creator: s.creators.find((c) => c.id === a.creatorId).name,
            creatorId: a.creatorId,
            caption:
              "A little care can go a long way. Join this fictional river campaign.",
            format: "photo",
            media: "/images/forest.jpg",
            mediaType: "image",
            rights: true,
            channel: "instagram",
            destination: policy.destinations[0],
            disclosures: {
              compensation: policy.compensationDisclosure,
              beneficiary: policy.beneficiaryDisclosure,
            },
            factualClaims: [],
            acceptedTermsVersion: policy.termsVersion,
          };
          return addSubmission(
            s,
            p.id,
            body,
            verifyMediaReference(s, r, join(dataDir, "uploads"), body, a, p.id),
          );
        }),
      ),
  );
  app.post("/api/campaigns/:id/demo-link", requireRole("creator"), (req, res) =>
    res.status(201).json(
      store.update((s, r) => {
        const a = readAccess(req, s),
          p = requireProject(s, req.params.id, a),
          post = s.posts.find((p) => p.id === req.body.postId);
        if (!post) throw new AppError("Choose an eligible creative.", 404);
        const d = createDistribution(
          s,
          r,
          p.id,
          {
            postId: post.id,
            snapshotId: post.snapshotId,
            revision: post.revision,
            termsId: p.offerVersionId,
            channel: "instagram",
            placement: "feed",
            paid: false,
            destination: `/campaigns/${p.id}/give`,
            payer: "unassigned",
            mode: "simulated",
          },
          a,
        );
        return { distribution: d, link: issueLink(s, r, d.id, a) };
      }),
    ),
  );
  app.get("/api/demo/grade-example", (req, res) => {
    readAccess(req, store.read());
    res.json({
      illustrative: true,
      ...gradeComponents(
        {
          priorStrength: 100,
          priorCTR: 0.02,
          ctrTarget: 0.04,
          viewTarget: 10000,
          voteTarget: 100,
          amountTargetCents: 100000,
        },
        {
          validOutboundClicks: 42,
          validImpressions: 1000,
          validViews: 5625,
          eligibleSettledGiftCount: 100,
          netSettledEligibleGrossCents: 25000,
        },
      ),
    });
  });
  app.post("/api/demo/sample-statement", requireRole("admin"), (req, res) =>
    res.json(
      store.update((s, r) => {
        if (!s.projects.some((p) => p.id === SHOWCASE))
          throw new AppError("Initialize the fictional showcase first.", 409);
        const period =
          r.periodAt(SHOWCASE, now()) ||
          definePeriod(s, r, SHOWCASE, sampleWeek(), admin);
        return {
          disclosure:
            "Fictional current sample week preview. Cutoff has not passed. No approved batch or payment.",
          period,
          statement: previewSettlement(
            s,
            r,
            SHOWCASE,
            period.id,
            req.body.creatorId || creatorId,
            admin,
          ),
        };
      }),
    ),
  );
}
