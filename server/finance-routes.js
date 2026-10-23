import { z } from "zod";
import { AppError } from "./domain.js";
import { readAccess, requireProject } from "./access.js";
import {
  createContribution,
  ingestEvent,
  publicFinance,
  reconcile,
  adjudicateContribution,
} from "./finance.js";

export function financeRoutes(app, store, requireRole) {
  const mutate = (req, fn) =>
    store.update((s, r) => fn(s, r, readAccess(req, s)));
  app.post(
    "/api/contributions/:id/attribution-adjudications",
    requireRole("admin"),
    (req, res) =>
      res
        .status(201)
        .json(
          mutate(req, (s, r) =>
            adjudicateContribution(s, r, req.params.id, req.body),
          ),
        ),
  );
  app.post(
    "/api/campaigns/:id/contributions",
    requireRole("admin"),
    (req, res) =>
      res.status(201).json(
        mutate(req, (s, r, a) => {
          requireProject(s, req.params.id, a, true);
          return createContribution(s, r, req.params.id, req.body);
        }),
      ),
  );
  app.post("/api/admin/finance-events", requireRole("admin"), (req, res) =>
    res.status(201).json(mutate(req, (s, r) => ingestEvent(s, r, req.body))),
  );
  app.post("/api/campaigns/:id/reconcile", requireRole("admin"), (req, res) =>
    res.json(
      mutate(req, (s, r, a) => {
        requireProject(s, req.params.id, a, true);
        const q = z
          .object({
            mode: z.literal("simulated").default("simulated"),
            limit: z.number().int().positive().max(100).default(100),
            cursor: z
              .object({ at: z.iso.datetime(), id: z.string() })
              .strict()
              .optional(),
          })
          .strict()
          .parse(req.body);
        return reconcile(s, r, { ...q, campaignId: req.params.id });
      }),
    ),
  );
  app.get("/api/giving/:id/progress", (req, res) =>
    res.json(publicFinance(store.read(), store.records, req.params.id)),
  );
  app.get("/api/campaigns/:id/finance", (req, res) => {
    const s = store.read(),
      a = readAccess(req, s);
    requireProject(s, req.params.id, a);
    const mode = z
      .enum(["simulated", "live"])
      .default("simulated")
      .parse(req.query.mode);
    const totals = store.records.financeTotals(
      req.params.id,
      mode,
      a.role === "creator" ? a.creatorId : null,
    );
    res.json({
      campaignId: req.params.id,
      mode,
      currency: "USD",
      ...totals,
      feeAssumption:
        mode === "simulated"
          ? "Zero processing fees; fixture assumption."
          : "Unknown fees and payer; live capability blocked.",
    });
  });
  const tables = {
    contributions: "contributions",
    events: "source_events",
    conflicts: "source_conflicts",
    journal: "journal_transactions",
    entries: "journal_entries",
    reconciliation: "reconciliation_runs",
  };
  app.get(
    "/api/campaigns/:id/finance/:kind",
    requireRole("admin"),
    (req, res) => {
      const s = store.read(),
        a = readAccess(req, s);
      requireProject(s, req.params.id, a);
      const table = tables[req.params.kind];
      if (!table) throw new AppError("Financial record kind unavailable.", 404);
      res.json(
        store.records.page(table, {
          campaignId: req.params.id,
          mode: req.query.mode,
          limit: req.query.limit,
          cursor: req.query.cursor,
        }),
      );
    },
  );
}
