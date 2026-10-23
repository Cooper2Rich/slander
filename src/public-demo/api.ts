import type { DemoAccess, Post, Workspace } from "../types";
import { demoAsset } from "../runtime";

export const campaignId = "fictional-river-showcase-v1";
export const creatorId = `${campaignId}-creator`;
export const ownerId = `${campaignId}-owner`;
const key = "slander-public-preview-v1";
const terms = {
  id: "preview-terms-v1",
  creatorCommissionBps: 1000,
  startsAt: "2026-01-01T00:00:00.000Z",
  endsAt: "2030-12-31T23:59:59.000Z",
  attributionWindowDays: 7,
  refundHoldPolicy:
    "Illustrative terms only. No payments, live publishing or legally binding participation.",
};
const campaign = {
  id: campaignId,
  name: "A little louder for living rivers",
  nonprofit: "Riverkind Collective · fictional",
  description:
    "A fictional campaign for cleaner rivers and the communities that care for them.",
  cover: "forest",
};
type Result = {
  amountCents: number;
  creatorCents: number;
  beneficiaryCents: number;
  votes: number;
  unallocatedCents: number;
};
type Intent = {
  id: string;
  amountCents: number;
  attributed: boolean;
  createdAt: string;
  result?: Result;
};
type Preview = { accepted: boolean; posts: Post[]; intents: Intent[] };

function read(): Preview {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "null");
    if (
      value &&
      typeof value.accepted === "boolean" &&
      Array.isArray(value.posts) &&
      Array.isArray(value.intents)
    )
      return value;
  } catch {
    /* A missing or old browser preview starts fresh. */
  }
  return { accepted: false, posts: [], intents: [] };
}
function write(state: Preview) {
  localStorage.setItem(key, JSON.stringify(state));
}
export function publicWorkspace(): Workspace {
  const posts = read().posts;
  return { projects: [], posts, approvedPosts: posts, activity: [] };
}
function totals(state: Preview) {
  const gifts = state.intents.flatMap((i) => (i.result ? [i.result] : []));
  const sum = (field: keyof Result) =>
    gifts.reduce((n, gift) => n + gift[field], 0);
  return {
    creatorCents: sum("creatorCents"),
    beneficiaryCents: sum("beneficiaryCents"),
    votes: sum("votes"),
    capturedCents: sum("amountCents"),
    availableCreatorCents: sum("creatorCents"),
    availableSeedGuaranteeCents: 60000,
    availableMediaCents: 40000,
    feeAssumption:
      "Browser-only fictional preview; fees assumed zero. No server journal or real money.",
  };
}
function requireRole(access: DemoAccess | undefined, role: string) {
  if (access?.role !== role)
    throw new Error(
      `Switch to ${role === "creator" ? "Creator" : "Admin"} view for this preview action.`,
    );
}

// This adapter is included only in the public build. It never requests local
// Express APIs, uploads, account data or credentials. All records are fictional
// browser-local illustrations; the full backend remains a separate local app.
export function publicApi(
  path: string,
  access?: DemoAccess,
  method = "GET",
  body?: unknown,
): unknown {
  const state = read();
  const input = (body || {}) as Record<string, unknown>;
  if (method === "GET" && path === "/offers")
    return {
      items: [
        {
          ...campaign,
          cause: "Environment",
          beneficiary: { name: campaign.nonprofit },
          terms,
        },
      ],
    };
  if (method === "GET" && path === "/demo/showcase")
    return { ready: true, campaignId, creatorId, ownerId };
  if (method === "GET" && path === `/giving/${campaignId}/campaign`)
    return campaign;
  if (method === "GET" && path === `/campaigns/${campaignId}/finance`)
    return totals(state);
  if (
    method === "GET" &&
    path === `/campaigns/${campaignId}/records/participations`
  )
    return { items: state.accepted ? [{ termsId: terms.id }] : [] };
  if (method === "POST" && path === `/campaigns/${campaignId}/consent`) {
    requireRole(access, "creator");
    if (input.termsId !== terms.id)
      throw new Error("Please reload the current preview terms.");
    state.accepted = true;
    write(state);
    return { termsId: terms.id };
  }
  if (
    method === "POST" &&
    path === `/campaigns/${campaignId}/sample-creative`
  ) {
    requireRole(access, "creator");
    if (!state.accepted)
      throw new Error("Accept the illustrative campaign terms first.");
    if (!state.posts.length) {
      const at = new Date().toISOString();
      state.posts.push({
        id: "public-sample-creative",
        projectId: campaignId,
        creatorId,
        creator: "Alex River · fictional",
        title: "Small acts. Living rivers.",
        format: "photo",
        caption:
          "A little care can go a long way. Join this fictional river campaign.",
        status: "approved",
        media: demoAsset("images/forest.jpg"),
        mediaType: "image",
        revision: 1,
        createdAt: at,
        updatedAt: at,
        feedback: "Illustrative automatic eligibility",
        history: [],
      });
      write(state);
    }
    return state.posts[0];
  }
  if (method === "POST" && path === `/campaigns/${campaignId}/demo-link`) {
    requireRole(access, "creator");
    if (!state.accepted || !state.posts.some((p) => p.id === input.postId))
      throw new Error("Submit the sample creative first.");
    return {
      link: { path: `#/campaigns/${campaignId}/give?ref=alex-preview` },
    };
  }
  if (method === "POST" && path === `/giving/${campaignId}/intents`) {
    const amountCents = Number(input.amountCents);
    if (
      !Number.isSafeInteger(amountCents) ||
      amountCents <= 0 ||
      amountCents > 100000000
    )
      throw new Error("Enter a simulated amount between $0.01 and $1,000,000.");
    const intent: Intent = {
      id: crypto.randomUUID(),
      amountCents,
      createdAt: new Date().toISOString(),
      attributed:
        new URLSearchParams(location.hash.split("?")[1] || "").get("ref") ===
          "alex-preview" &&
        state.accepted &&
        state.posts.length > 0,
    };
    state.intents.push(intent);
    write(state);
    return { id: intent.id };
  }
  if (
    method === "POST" &&
    path.startsWith(`/giving/${campaignId}/intents/`) &&
    path.endsWith("/confirm")
  ) {
    const intent = state.intents.find(
      (i) => path === `/giving/${campaignId}/intents/${i.id}/confirm`,
    );
    if (!intent)
      throw new Error(
        "Preview gift unavailable. Return to the campaign and create a tracked link.",
      );
    if (!intent.result) {
      const creatorCents = intent.attributed
        ? Math.round(intent.amountCents / 10)
        : 0;
      intent.result = {
        amountCents: intent.amountCents,
        creatorCents,
        beneficiaryCents: intent.attributed
          ? intent.amountCents - creatorCents
          : 0,
        votes: intent.attributed ? 1 : 0,
        unallocatedCents: intent.attributed ? 0 : intent.amountCents,
      };
      write(state);
    }
    return intent.result;
  }
  if (method === "GET" && path === "/demo/grade-example")
    return {
      illustrative: true,
      score: 77.5,
      components: { ctr: 1, views: 0.75, votes: 1, amount: 0.5 },
    };
  if (method === "POST" && path === "/demo/sample-statement") {
    requireRole(access, "admin");
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
    const end = new Date(start.getTime() + 7 * 86400000);
    const current = {
      ...state,
      intents: state.intents.filter(
        (i) =>
          i.createdAt >= start.toISOString() && i.createdAt < end.toISOString(),
      ),
    };
    return {
      disclosure:
        "Fictional browser-local preview only. No server journal, approved batch or payment.",
      campaignId,
      creatorId,
      currency: "USD",
      mode: "simulated",
      period: { startsAt: start.toISOString(), endsAt: end.toISOString() },
      statement: {
        ...totals(current),
        paidCents: 0,
        seedTopUpCents: 0,
        gifts: current.intents.flatMap((i) => (i.result ? [i.result] : [])),
      },
    };
  }
  throw new Error(
    "This feature is available in the full local demo. The public preview covers the campaign walkthrough.",
  );
}
