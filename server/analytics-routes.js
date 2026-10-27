import { readAccess, requireProject } from "./access.js";
import { AppError } from "./domain.js";
import {
  publishGradingConfig,
  recordMetricEvidence,
  publishGrade,
  gradeBoard,
  rejectGradeObligation,
} from "./grading.js";
import { economicsReport } from "./economics.js";
import {
  publishExposurePolicy,
  scheduleExposure,
  finishTrial,
} from "./exposure-queue.js";

export function analyticsRoutes(app, store, requireRole) {
  const mutate = (req, fn) =>
    store.update((s, r) => fn(s, r, readAccess(req, s)));
  for (const [path, operation] of [
    ["grading-configs", publishGradingConfig],
    ["metric-evidence", recordMetricEvidence],
    ["grades", publishGrade],
    ["exposure-policies", publishExposurePolicy],
  ]) {
    app.post(`/api/campaigns/:id/${path}`, (req, res) =>
      res
        .status(201)
        .json(
          mutate(req, (s, r, a) => operation(s, r, req.params.id, req.body, a)),
        ),
    );
  }
  app.get("/api/campaigns/:id/economics", (req, res) => {
    const s = store.read();
    res.json(
      economicsReport(
        s,
        store.records,
        req.params.id,
        req.query.evidenceId,
        readAccess(req, s),
      ),
    );
  });
  app.get("/api/grading-configs/:id/board", (req, res) => {
    const s = store.read();
    res.json(gradeBoard(s, store.records, req.params.id, readAccess(req, s)));
  });
  app.post("/api/exposure-policies/:id/schedule", (req, res) =>
    res.json(
      mutate(req, (s, r, a) =>
        scheduleExposure(s, r, req.params.id, req.body, a),
      ),
    ),
  );
  app.post("/api/exposure-assignments/:id/complete", (req, res) =>
    res.json(
      mutate(req, (s, r, a) => finishTrial(s, r, req.params.id, req.body, a)),
    ),
  );
  app.post(
    "/api/campaigns/:id/grade-obligations",
    requireRole("admin"),
    (req) => {
      requireProject(
        store.read(),
        req.params.id,
        readAccess(req, store.read()),
        true,
      );
      rejectGradeObligation();
    },
  );
  app.get("/api/campaigns/:id/performance-records/:kind", (req, res) => {
    const s = store.read();
    requireProject(s, req.params.id, readAccess(req, s), true);
    const table = {
      configs: "grading_configs",
      evidence: "metric_evidence",
      grades: "grade_snapshots",
      policies: "exposure_policies",
      runs: "exposure_runs",
      assignments: "exposure_assignments",
      events: "exposure_events",
    }[req.params.kind];
    if (!table) throw new AppError("Performance record kind unavailable.", 404);
    res.json(
      store.records.page(table, {
        campaignId: req.params.id,
        limit: req.query.limit,
        cursor: req.query.cursor,
      }),
    );
  });
}
