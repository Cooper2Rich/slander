import { currentEligibility } from "../../server/eligibility.js";
import type { ManagedCampaign, Post, Project } from "../types";
import { campaignBudgetBreakdown } from "./campaign-budget.ts";
import { completedAdSpendReport } from "./completed-ad-spend.ts";

export const adPlatforms = ["meta", "tiktok"] as const;
export type AdPlatform = (typeof adPlatforms)[number];
export const platformNames: Record<AdPlatform, string> = {
  meta: "Meta",
  tiktok: "TikTok",
};
type Connection = {
  accountId: string;
  accountName: string;
  targetId: string;
  targetName: string;
  connectedAt: string;
};
export type AdSpendRules = {
  enabled: boolean;
  dailyLimitCents: number;
  campaignLimitCents: number;
  metaPercent: number;
};
type Allocation = {
  platform: AdPlatform;
  adId: string;
  title: string;
  amountCents: number;
  accountId: string;
  targetId: string;
};
export type AdSpendPreview = {
  includesSampleSpend?: boolean;
  at: string;
  budgetCents: number;
  plannedCents: number;
  unallocatedCents: number;
  rows: Allocation[];
  notes: string[];
};
export type CampaignAdSetup = {
  connections: Partial<Record<AdPlatform, Connection>>;
  rules: AdSpendRules;
  preview?: AdSpendPreview;
};
type AdSetupState = {
  projects: Project[];
  posts: Post[];
  adPlatformSetups?: Record<string, CampaignAdSetup>;
};

export function demoAdAccounts(
  campaign: ManagedCampaign,
  platform: AdPlatform,
) {
  return [
    {
      key: "organization",
      id: `demo-${platform}-${campaign.ownerOrganizationId}`,
      name: `${campaign.ownerName} · Demo ad account (USD)`,
    },
    {
      key: "sandbox",
      id: `demo-${platform}-brm-sandbox`,
      name: "BRM sandbox · Demo ad account (USD)",
    },
  ];
}
export function demoAdTargets(campaign: ManagedCampaign, platform: AdPlatform) {
  return [
    {
      key: "traffic",
      id: `demo-${platform}-${campaign.id}-traffic`,
      name: `${campaign.name} · Traffic preview`,
    },
    {
      key: "video",
      id: `demo-${platform}-${campaign.id}-video`,
      name: `${campaign.name} · Video views preview`,
    },
  ];
}
function initialSetup(): CampaignAdSetup {
  return {
    connections: {},
    rules: {
      enabled: false,
      dailyLimitCents: 10000,
      campaignLimitCents: 100000,
      metaPercent: 50,
    },
  };
}
function platform(value: unknown): AdPlatform {
  if (value !== "meta" && value !== "tiktok")
    throw new Error("Choose Meta or TikTok.");
  return value;
}
function positiveCents(value: unknown, label: string) {
  if (
    typeof value !== "number" ||
    !Number.isSafeInteger(value) ||
    value < 1 ||
    value > 100000000
  )
    throw new Error(
      `${label} must be between $0.01 and $1,000,000, in whole cents.`,
    );
  return value;
}
function requireConnections(setup: CampaignAdSetup) {
  for (const provider of adPlatforms) {
    const share =
      provider === "meta"
        ? setup.rules.metaPercent
        : 100 - setup.rules.metaPercent;
    if (share > 0 && !setup.connections[provider])
      throw new Error(
        `Connect a demo ${platformNames[provider]} account or assign it 0% of the budget.`,
      );
  }
}

// This plans fictional allocations only. It never places orders, consumes
// contributions, records actual spend or calls a platform API.
export function previewAdSpend(
  state: AdSetupState,
  campaign: ManagedCampaign,
  setup: CampaignAdSetup,
  includeSamples = false,
): AdSpendPreview {
  if (campaign.status !== "active")
    throw new Error("Open an active campaign before previewing spending.");
  if (!setup.rules.enabled)
    throw new Error(
      "Enable and save demo automation before running a preview.",
    );
  requireConnections(setup);
  const projects = state.projects.filter(
    (project) => project.campaignId === campaign.id,
  );
  const eligible = state.posts
    .filter((post) => {
      const project = projects.find((project) => project.id === post.projectId);
      return (
        project &&
        post.status === "approved" &&
        currentEligibility(post, project)
      );
    })
    .sort((a, b) => a.id.localeCompare(b.id));
  const breakdown = campaignBudgetBreakdown(
    setup.rules,
    completedAdSpendReport(projects, includeSamples).byPlatform,
  );
  const budgetCents = Math.min(
    setup.rules.dailyLimitCents,
    Math.max(0, breakdown.remainingCents),
  );
  const metaCents = Math.floor((budgetCents * setup.rules.metaPercent) / 100);
  const rows: Allocation[] = [],
    notes: string[] = [];
  if (!budgetCents)
    notes.push(
      "The campaign budget has no remaining funds in this preview. Increase the cap or review the included sample history.",
    );
  for (const provider of adPlatforms) {
    const requested = provider === "meta" ? metaCents : budgetCents - metaCents;
    if (!requested) continue;
    const remaining = Math.max(
      0,
      breakdown.rows.find((row) => row.platform === provider)!.remainingCents,
    );
    const amount = Math.min(requested, remaining);
    if (amount < requested)
      notes.push(
        `${platformNames[provider]} is limited by its remaining allocation. Unused budget is not shifted to another platform.`,
      );
    if (!amount) continue;
    const connection = setup.connections[provider]!;
    const requiresVideo =
      provider === "tiktok" || connection.targetId.endsWith("-video");
    const ads = eligible.filter(
      (ad) => !requiresVideo || ad.mediaType === "video",
    );
    if (!ads.length) {
      notes.push(
        `${platformNames[provider]} has no eligible ${requiresVideo ? "video " : ""}creatives. Its share stays unallocated.`,
      );
      continue;
    }
    const base = Math.floor(amount / ads.length),
      remainder = amount % ads.length;
    ads.forEach((ad, index) => {
      const cents = base + (index < remainder ? 1 : 0);
      if (cents)
        rows.push({
          platform: provider,
          adId: ad.id,
          title: ad.title,
          amountCents: cents,
          accountId: connection.accountId,
          targetId: connection.targetId,
        });
    });
  }
  const plannedCents = rows.reduce((sum, row) => sum + row.amountCents, 0);
  return {
    includesSampleSpend: includeSamples,
    at: new Date().toISOString(),
    budgetCents,
    plannedCents,
    unallocatedCents: budgetCents - plannedCents,
    rows,
    notes,
  };
}

export function campaignAdPlatformAction(
  state: AdSetupState,
  campaign: ManagedCampaign,
  action: string | undefined,
  method: string,
  body: Record<string, unknown> = {},
) {
  const current = state.adPlatformSetups?.[campaign.id] || initialSetup();
  if (!action && method === "GET") return { data: structuredClone(current) };
  if (method !== "POST") throw new Error("Ad platform action unavailable.");
  if (campaign.status === "archived")
    throw new Error(
      "Restore this campaign before changing its ad platform setup.",
    );
  const next = structuredClone(current);
  if (action === "connect") {
    const provider = platform(body.platform);
    const account = demoAdAccounts(campaign, provider).find(
      (account) => account.key === body.account,
    );
    const target = demoAdTargets(campaign, provider).find(
      (target) => target.key === body.target,
    );
    if (!account || !target)
      throw new Error("Choose a demo ad account and target campaign.");
    next.connections[provider] = {
      accountId: account.id,
      accountName: account.name,
      targetId: target.id,
      targetName: target.name,
      connectedAt: new Date().toISOString(),
    };
    // Selecting a new destination always requires explicit re-enabling.
    next.rules.enabled = false;
    delete next.preview;
  } else if (action === "disconnect") {
    delete next.connections[platform(body.platform)];
    next.rules.enabled = false;
    delete next.preview;
  } else if (action === "rules") {
    if (typeof body.enabled !== "boolean")
      throw new Error("Choose whether demo automation is enabled.");
    const daily = positiveCents(body.dailyLimitCents, "Daily limit");
    const cap = positiveCents(body.campaignLimitCents, "Campaign cap");
    if (daily > cap)
      throw new Error("The daily limit cannot exceed the campaign cap.");
    if (
      typeof body.metaPercent !== "number" ||
      !Number.isInteger(body.metaPercent) ||
      body.metaPercent < 0 ||
      body.metaPercent > 100
    )
      throw new Error(
        "Meta allocation must be a whole percentage from 0 to 100.",
      );
    next.rules = {
      enabled: body.enabled,
      dailyLimitCents: daily,
      campaignLimitCents: cap,
      metaPercent: body.metaPercent,
    };
    if (next.rules.enabled) {
      if (campaign.status !== "active")
        throw new Error("Demo automation requires an active campaign.");
      requireConnections(next);
    }
    delete next.preview;
  } else if (action === "preview")
    next.preview = previewAdSpend(
      state,
      campaign,
      next,
      body.includeSamples === true,
    );
  else throw new Error("Ad platform action unavailable.");
  state.adPlatformSetups ||= {};
  state.adPlatformSetups[campaign.id] = next;
  return { data: structuredClone(next) };
}
