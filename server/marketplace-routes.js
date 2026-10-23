import { randomUUID } from "node:crypto";
import { z } from "zod";
import { AppError } from "./domain.js";
import { readAccess, requireProject } from "./access.js";
import {
  organization,
  publishTerms,
  assignOrganizations,
  changeOfferState,
  consent,
  createDistribution,
  transitionDistribution,
  capability,
  audit,
} from "./marketplace.js";
import {
  opaqueToken,
  issueLink,
  revokeLink,
  clickLink,
  freezeIntent,
  recordAttributionFixture,
  adjudicate,
} from "./attribution.js";
import { confirmSimulatedGift } from "./finance.js";

export function marketplaceRoutes(app, store, requireRole) {
  const mutate = (req, fn) =>
    store.update((state, records) =>
      fn(state, records, readAccess(req, state)),
    );
  app.get("/api/organizations", (req, res) => {
    const state = store.read();
    const access = readAccess(req, state);
    const query = z
      .object({
        limit: z.coerce.number().int().positive().optional(),
        cursor: z.string().optional(),
      })
      .strict()
      .parse(req.query);
    res.json(
      store.records.organizationsPage({
        ...query,
        organizationId: ["owner", "nonprofit"].includes(access.role)
          ? access.organizationId
          : null,
      }),
    );
  });
  app.post("/api/organizations", requireRole("admin"), (req, res) => {
    const data = z
      .object({
        name: z.string().trim().min(1).max(80),
        type: z.enum(["nonprofit", "business"]),
      })
      .strict()
      .parse(req.body);
    res.status(201).json(
      mutate(req, (state) => {
        const org = { ...data, id: randomUUID() };
        state.organizations.push(org);
        if (org.type === "nonprofit")
          state.nonprofits.push({ id: org.id, name: org.name });
        return org;
      }),
    );
  });
  app.put("/api/projects/:id/organizations", requireRole("admin"), (req, res) =>
    res.json(
      mutate(req, (state, records, access) => {
        const input = z
          .object({
            ownerOrganizationId: z.string(),
            beneficiaryOrganizationId: z.string(),
            sponsorOrganizationIds: z.array(z.string()).max(30),
          })
          .strict()
          .parse(req.body);
        const p = requireProject(state, req.params.id, access, true);
        assignOrganizations(state, p, input);
        return p;
      }),
    ),
  );
  app.get("/api/campaigns/:id/terms", (req, res) => {
    const state = store.read();
    const p = requireProject(state, req.params.id, readAccess(req, state));
    const terms = store.records.get("offer_versions", p.offerVersionId || "");
    res.json({ state: p.offerState || "draft", terms });
  });
  app.post(
    "/api/campaigns/:id/terms",
    requireRole("admin", "owner", "nonprofit"),
    (req, res) =>
      res
        .status(201)
        .json(
          mutate(req, (s, r, a) =>
            publishTerms(s, r, req.params.id, req.body, a),
          ),
        ),
  );
  app.post(
    "/api/campaigns/:id/offer-state",
    requireRole("admin", "owner", "nonprofit"),
    (req, res) =>
      res.json(
        mutate(req, (s, r, a) =>
          changeOfferState(s, r, req.params.id, req.body.state, a),
        ),
      ),
  );
  app.post("/api/campaigns/:id/consent", requireRole("creator"), (req, res) =>
    res
      .status(201)
      .json(
        mutate(req, (s, r, a) =>
          consent(s, r, req.params.id, z.string().parse(req.body.termsId), a),
        ),
      ),
  );
  app.post(
    "/api/campaigns/:id/participation-restrictions",
    requireRole("admin"),
    (req, res) =>
      res.status(201).json(
        mutate(req, (s, r, a) => {
          requireProject(s, req.params.id, a, true);
          const input = z
            .object({
              creatorId: z.string(),
              state: z.enum(["declined", "suspended"]),
              evidence: z.string().trim().min(1).max(2000),
            })
            .strict()
            .parse(req.body);
          if (!s.creators.some((c) => c.id === input.creatorId))
            throw new AppError("Creator not found.", 404);
          return r.append("participation_restrictions", {
            ...input,
            id: randomUUID(),
            campaignId: req.params.id,
            mode: "simulated",
            effectiveAt: new Date().toISOString(),
            actorId: "admin",
          });
        }),
      ),
  );
  app.post(
    "/api/campaigns/:id/distributions",
    requireRole("admin", "owner", "nonprofit", "creator"),
    (req, res) =>
      res
        .status(201)
        .json(
          mutate(req, (s, r, a) =>
            createDistribution(s, r, req.params.id, req.body, a),
          ),
        ),
  );
  app.post(
    "/api/distributions/:id/state",
    requireRole("admin", "owner", "nonprofit"),
    (req, res) =>
      res.json(
        mutate(req, (s, r, a) =>
          transitionDistribution(s, r, req.params.id, req.body.state, a),
        ),
      ),
  );
  app.post("/api/distributions/:id/links", (req, res) =>
    res
      .status(201)
      .json(mutate(req, (s, r, a) => issueLink(s, r, req.params.id, a))),
  );
  app.post(
    "/api/tracking-links/:token/revoke",
    requireRole("admin", "owner", "nonprofit"),
    (req, res) =>
      res.json(mutate(req, (s, r, a) => revokeLink(s, r, req.params.token, a))),
  );
  app.post("/api/capabilities/:name", (req, res) => {
    readAccess(req, store.read());
    res.json(capability(req.params.name, req.body.mode));
  });
  // The only financial/evidence fixture entry point in this story is explicitly Admin-only.
  app.post("/api/admin/attribution-events", requireRole("admin"), (req, res) =>
    res
      .status(201)
      .json(mutate(req, (s, r) => recordAttributionFixture(s, r, req.body))),
  );
  app.post(
    "/api/attribution-events/:id/adjudications",
    requireRole("admin"),
    (req, res) =>
      res.status(201).json(
        mutate(req, (s, r, a) => {
          const row = adjudicate(s, r, req.params.id, req.body);
          audit(
            r,
            row.campaignId,
            a,
            "attribution_adjudicated",
            row.id,
            row.effectiveAt,
          );
          return row;
        }),
      ),
  );
  const visibleTables = {
    terms: "offer_versions",
    participations: "participations",
    distributions: "distributions",
    attribution: "attribution_events",
    adjudications: "attribution_adjudications",
    audit: "audit_events",
  };
  app.get("/api/campaigns/:id/records/:kind", (req, res) => {
    const state = store.read(),
      access = readAccess(req, state);
    requireProject(state, req.params.id, access);
    const table = visibleTables[req.params.kind];
    if (!table) throw new AppError("Record kind unavailable.", 404);
    if (
      ["attribution", "adjudications", "audit"].includes(req.params.kind) &&
      access.role !== "admin"
    )
      throw new AppError("Admin evidence view required.", 403);
    const result = store.records.page(table, {
      campaignId: req.params.id,
      mode: req.query.mode,
      limit: req.query.limit,
      cursor: req.query.cursor,
    });
    if (access.role === "creator" && !["terms"].includes(req.params.kind))
      result.items = result.items.filter(
        (r) => r.creatorId === access.creatorId,
      );
    res.json(result);
  });
  app.get("/api/offers", (req, res) => {
    const state = store.read();
    readAccess(req, state);
    const query = z
      .object({
        cause: z.string().optional(),
        organizationId: z.string().optional(),
        channel: z.string().optional(),
        state: z.enum(["open", "paused", "closed"]).optional(),
        date: z.iso.datetime().optional(),
        limit: z.coerce
          .number()
          .int()
          .positive()
          .default(50)
          .transform((v) => Math.min(v, 100)),
        cursor: z.string().optional(),
      })
      .strict()
      .parse(req.query);
    const page = store.records.discoverOffers(query);
    res.json({
      ...page,
      items: page.items.map(({ campaignId, termsId }) => {
        const p = state.projects.find((p) => p.id === campaignId);
        return {
          id: p.id,
          name: p.name,
          cause: p.category,
          owner: organization(state, p.ownerOrganizationId),
          beneficiary: organization(state, p.beneficiaryOrganizationId),
          state: p.offerState,
          terms: store.records.get("offer_versions", termsId),
        };
      }),
    });
  });
  const visitor = (req, res) => {
    let id = req.headers.cookie
      ?.split(";")
      .map((s) => s.trim())
      .find((s) => s.startsWith("slander_visitor="))
      ?.slice(16);
    if (!/^[A-Za-z0-9_-]{43}$/.test(id || "")) {
      id = opaqueToken();
      res.cookie("slander_visitor", id, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 86400000,
      });
    }
    return id;
  };
  app.get("/r/:token", (req, res) => {
    res.set("Cache-Control", "no-store");
    const id = visitor(req, res);
    const result = store.update((s, r) =>
      clickLink(s, r, req.params.token, id),
    );
    res.redirect(303, result.location);
  });
  app.post("/api/giving/:id/intents", (req, res) => {
    const id = visitor(req, res);
    const intent = store.update((s, r) =>
      freezeIntent(s, r, req.params.id, id, req.body),
    );
    res.status(201).json({
      id: intent.id,
      amountCents: intent.amountCents,
      state: intent.state,
      reason: intent.reason,
      attributionKind: intent.binding?.kind || null,
      simulationDisclosure: intent.simulationDisclosure,
    });
  });
  app.get("/api/giving/:campaignId/intents/:id", (req, res) => {
    const id = visitor(req, res),
      intent = store.records.get("gift_intents", req.params.id);
    if (
      !intent ||
      intent.visitorId !== id ||
      intent.campaignId !== req.params.campaignId
    )
      throw new AppError("Confirmation unavailable.", 404);
    res.json({
      id: intent.id,
      state: intent.state,
      reason: intent.reason,
      simulationDisclosure: intent.simulationDisclosure,
    });
  });
  app.post("/api/giving/:campaignId/intents/:id/confirm", (req, res) => {
    z.object({}).strict().parse(req.body);
    const visitorId = visitor(req, res);
    res.json(
      store.update((s, r) => {
        const intent = r.get("gift_intents", req.params.id);
        if (
          !intent ||
          intent.visitorId !== visitorId ||
          intent.campaignId !== req.params.campaignId
        )
          throw new AppError("Confirmation unavailable.", 404);
        return confirmSimulatedGift(s, r, intent);
      }),
    );
  });
}
