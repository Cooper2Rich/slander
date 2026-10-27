import { readAccess, requireProject } from "./access.js";
import { AppError } from "./domain.js";
import {
  reserveMedia,
  spendMedia,
  cancelMedia,
  mediaBalance,
} from "./media-budgets.js";
import { seedCapacity, chargeAppUse } from "./seed-commitments.js";
import {
  definePeriod,
  previewSettlement,
  approveBatch,
  exportBatch,
  executeBatch,
} from "./settlements.js";

export function settlementRoutes(app, store, requireRole) {
  const mutate = (req, fn) =>
    store.update((s, r) => fn(s, r, readAccess(req, s)));
  app.post("/api/distributions/:id/reservations", (req, res) =>
    res
      .status(201)
      .json(
        mutate(req, (s, r, a) =>
          reserveMedia(s, r, req.params.id, req.body, a),
        ),
      ),
  );
  app.post("/api/reservations/:id/spend", requireRole("admin"), (req, res) =>
    res
      .status(201)
      .json(
        mutate(req, (s, r, a) => spendMedia(s, r, req.params.id, req.body, a)),
      ),
  );
  app.post("/api/reservations/:id/cancel", (req, res) =>
    res.json(mutate(req, (s, r, a) => cancelMedia(s, r, req.params.id, a))),
  );
  app.get("/api/campaigns/:id/budgets", (req, res) => {
    const s = store.read(),
      a = readAccess(req, s);
    requireProject(s, req.params.id, a, true);
    res.json({
      campaignId: req.params.id,
      mode: "simulated",
      currency: "USD",
      media: mediaBalance(store.records, req.params.id),
      seed: seedCapacity(store.records, req.params.id),
    });
  });
  app.post(
    "/api/campaigns/:id/app-use/charge",
    requireRole("admin"),
    (req, res) =>
      res
        .status(201)
        .json(
          mutate(req, (s, r, a) =>
            chargeAppUse(s, r, req.params.id, req.body, a),
          ),
        ),
  );
  app.post(
    "/api/campaigns/:id/settlement-periods",
    requireRole("admin"),
    (req, res) =>
      res
        .status(201)
        .json(
          mutate(req, (s, r, a) =>
            definePeriod(s, r, req.params.id, req.body, a),
          ),
        ),
  );
  app.get("/api/campaigns/:id/settlement-preview", (req, res) =>
    res.json(
      previewSettlement(
        store.read(),
        store.records,
        req.params.id,
        req.query.periodId,
        req.query.creatorId,
        readAccess(req, store.read()),
      ),
    ),
  );
  app.post("/api/campaigns/:id/settlements", requireRole("admin"), (req, res) =>
    res
      .status(201)
      .json(
        mutate(req, (s, r, a) =>
          approveBatch(s, r, req.params.id, req.body, a),
        ),
      ),
  );
  app.get("/api/settlements/:id/export", requireRole("admin"), (req, res) => {
    const result = exportBatch(
      store.read(),
      store.records,
      req.params.id,
      readAccess(req, store.read()),
      req.query.format || "json",
    );
    res
      .set("X-Settlement-Batch", result.batchId)
      .type(result.format === "csv" ? "text/csv" : "application/json")
      .send(result.content);
  });
  app.post("/api/settlements/:id/execute", requireRole("admin"), (req, res) =>
    res.json(
      mutate(req, (s, r, a) => executeBatch(s, r, req.params.id, req.body, a)),
    ),
  );
  app.get("/api/campaigns/:id/settlement-records/:kind", (req, res) => {
    const s = store.read(),
      a = readAccess(req, s);
    requireProject(s, req.params.id, a, true);
    const table = {
      periods: "settlement_periods",
      batches: "settlement_manifests",
      results: "settlement_results",
      reservations: "reservations",
      operations: "finance_operations",
    }[req.params.kind];
    if (!table) throw new AppError("Settlement record kind unavailable.", 404);
    res.json(
      store.records.page(table, {
        campaignId: req.params.id,
        limit: req.query.limit,
        cursor: req.query.cursor,
      }),
    );
  });
}
