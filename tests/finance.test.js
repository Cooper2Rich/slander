import { test } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import {
  cpSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
  readFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { DatabaseSync } from "node:sqlite";
import { financeFixture } from "./finance-helpers.js";
import { createStore } from "../server/store.js";
import {
  createContribution,
  ingestEvent,
  reconcile,
  rebuildPosition,
} from "../server/finance.js";
import {
  splitGift,
  refundSplit,
  recoveryBalance,
  remainingAllocations,
} from "../server/finance-money.js";
import { freezeIntent } from "../server/attribution.js";
import { changeOfferState } from "../server/marketplace.js";

test("USD BigInt fixed 1000bps handles cent boundaries and cumulative refunds without floating multiplication", () => {
  assert.deepEqual(splitGift(10000), {
    creatorCents: 1000,
    beneficiaryCents: 9000,
  });
  assert.deepEqual(splitGift(5), { creatorCents: 1, beneficiaryCents: 4 });
  assert.deepEqual(splitGift(1), { creatorCents: 0, beneficiaryCents: 1 });
  assert.deepEqual(refundSplit(15, 10), {
    creatorCents: 1,
    beneficiaryCents: 4,
  });
  for (const n of [0, 4, 5, 14, 15, 10000, Number.MAX_SAFE_INTEGER]) {
    const split = splitGift(n);
    assert.equal(
      BigInt(split.creatorCents),
      (BigInt(n) * 1000n + 5000n) / 10000n,
    );
    assert.equal(split.creatorCents + split.beneficiaryCents, n);
  }
  for (const n of [-1, 1.5, Infinity, Number.MAX_SAFE_INTEGER + 1])
    assert.throws(() => splitGift(n));
  assert.throws(() => refundSplit(5, 6), /REFUND_EXCEEDS_CAPTURE/);
  assert.equal(recoveryBalance(1000, 2500), 1500);
});

test("captured gifts accrue exact immutable terms/snapshots and balanced liabilities; settlement adds cash without another commission", async (t) => {
  const f = await financeFixture(t);
  for (const n of [10000, 5, 1]) {
    const c = f.gift(n);
    const captured = f.send(c, "capture").position;
    assert.equal(captured.state, "captured");
    assert.equal(captured.settledCents, 0);
    assert.equal(captured.availableCreatorCents, 0);
    assert.equal(captured.availableBeneficiaryCents, 0);
    assert.equal(captured.votes, 1);
    assert.equal(captured.settledVotes, 0);
    assert.deepEqual(
      {
        creatorCents: captured.creatorCents,
        beneficiaryCents: captured.beneficiaryCents,
      },
      splitGift(n),
    );
    const settled = f.send(c, "settlement").position;
    assert.equal(settled.state, "settled");
    assert.equal(settled.settledVotes, 1);
  }
  const entries = f.rows("journal_entries"),
    transactions = f.rows("journal_transactions");
  assert.equal(transactions.length, 6);
  for (const tx of transactions) {
    const lines = entries.filter((e) => e.transactionId === tx.id);
    assert.equal(
      lines.reduce(
        (n, e) => n + BigInt(e.debitCents) - BigInt(e.creditCents),
        0n,
      ),
      0n,
    );
    assert(f.store.records.get("source_events", tx.sourceRecordId));
    assert.deepEqual(tx.terms, f.terms);
    assert.equal(tx.attribution.binding.snapshotId, f.post.snapshotId);
    assert.equal(tx.attribution.binding.evaluationId, f.post.eligibility.id);
    assert.equal(tx.creatorCommissionBps, 1000);
    assert.equal(tx.currency, "USD");
    assert.match(tx.feeAssumption, /fixture assumption/);
  }
  const count = transactions.length;
  f.store.update((s) => {
    s.projects[0].ctr = 99;
    s.projects[0].tier = "platinum";
    s.projects[0].adSpendCents = 999999;
  });
  assert.equal(f.rows("journal_transactions").length, count);
  assert.equal(f.store.records.financeTotals(f.project.id).creatorCents, 1001);
  assert.throws(
    () => f.store.records.append("journal_entries", {}),
    /transaction owner/,
  );
});

test("restricted multipurpose consent conserves $100=$60 seed+$40 media; pending/captured/failed support is unavailable and public progress excludes it", async (t) => {
  const f = await financeFixture(t);
  const c = f.support();
  let p = f.store.records.position(c.id);
  assert.equal(p.state, "pending");
  assert.equal(p.availableMediaCents, 0);
  p = f.send(c, "capture").position;
  assert.equal(p.seedGuaranteeCents, 6000);
  assert.equal(p.mediaCents, 4000);
  assert.equal(p.availableSeedGuaranteeCents + p.availableMediaCents, 0);
  p = f.send(c, "settlement").position;
  assert.equal(p.availableSeedGuaranteeCents, 6000);
  assert.equal(p.availableMediaCents, 4000);
  assert.equal(p.availableSeedGuaranteeCents + p.availableMediaCents, 10000);
  assert(p.availableSeedGuaranteeCents + p.availableMediaCents < 11000);
  assert.equal(p.creatorCents, 0);
  assert.equal(p.votes, 0);
  const fail = f.support(100, [
    { purpose: "seed", use: "app_use", amountCents: 100 },
  ]);
  assert.equal(f.send(fail, "failed").position.availableSeedAppUseCents, 0);
  const before = f.rows("contributions").length;
  assert.throws(
    () =>
      f.support(10000, [
        ...c.allocations,
        { purpose: "seed", use: "app_use", amountCents: 1000 },
      ]),
    /Allocations must equal/,
  );
  assert.throws(
    () =>
      f.support(10000, [
        { purpose: "media", use: "guarantee", amountCents: 10000 },
      ]),
    /Invalid purpose/,
  );
  assert.throws(() =>
    f.support(1, [{ purpose: "seed", use: "guarantee", amountCents: 1 }], {
      mode: "live",
    }),
  );
  assert.throws(() =>
    f.support(1, [{ purpose: "seed", use: "guarantee", amountCents: 1 }], {
      currency: "EUR",
    }),
  );
  assert.equal(f.rows("contributions").length, before);
  const publicView = (await f.request(`/giving/${f.project.id}/progress`)).data;
  assert.equal(publicView.netProgressCents, 0);
  assert.equal(publicView.pendingCents, 0);
  assert.equal(publicView.unallocatedCents, 0);
  const gift = f.gift(100);
  f.send(gift, "capture");
  f.send(gift, "refund", 50);
  const progress = (await f.request(`/giving/${f.project.id}/progress`)).data;
  assert.equal(progress.eligibleGrossCents, 100);
  assert.equal(progress.refundCents, 50);
  assert.equal(progress.netProgressCents, 50);
});

test("late financial evidence uses exact historical completion/terms rather than arrival time or currently edited offer policy", async (t) => {
  const f = await financeFixture(t),
    c = f.gift(100);
  const event = f.eventData(c, "capture");
  const after = new Date(Date.parse(event.effectiveAt) + 1000).toISOString();
  f.store.update((s, r) => {
    changeOfferState(s, r, f.project.id, "closed", { role: "admin" }, after);
    s.projects[0].eligibilityPolicy.version = "future edited policy";
  });
  const captured = f.store.update((s, r) =>
    ingestEvent(s, r, event, new Date(Date.parse(after) + 1000).toISOString()),
  ).position;
  assert.equal(captured.creatorCents, 10);
  assert.equal(captured.votes, 1);
  assert.equal(f.rows("journal_transactions")[0].terms.id, f.terms.id);
  const closed = f.gift(100);
  const result = f.store.update((s, r) =>
    ingestEvent(
      s,
      r,
      f.eventData(closed, "capture", 100, { effectiveAt: after }),
      new Date(Date.parse(after) + 1000).toISOString(),
    ),
  ).position;
  assert.equal(result.creatorCents, 0);
  assert.equal(result.unallocatedCents, 100);
  const before = f.rows("source_events").length;
  assert.throws(() =>
    f.send(c, "capture", 100, { creatorCommissionBps: 2000 }),
  );
  assert.equal(f.rows("source_events").length, before);
});

test("ten capture/settlement replays and differently named cumulative events create one gift/one vote; source account and intent binding cannot change", async (t) => {
  const f = await financeFixture(t),
    c = f.gift(15);
  const capture = f.eventData(c, "capture"),
    settlement = f.eventData(c, "settlement");
  for (let i = 0; i < 10; i++)
    for (const e of [capture, settlement])
      f.store.update((s, r) => ingestEvent(s, r, e));
  for (let i = 0; i < 10; i++) {
    f.send(c, "capture");
    f.send(c, "settlement");
  }
  assert.equal(f.rows("contributions").length, 1);
  assert.equal(f.rows("journal_transactions").length, 2);
  assert.equal(f.store.records.position(c.id).votes, 1);
  assert.equal(f.store.records.position(c.id).creatorCents, 2);
  const input = Object.fromEntries(
    Object.entries(c).filter(
      ([k]) =>
        !["id", "campaignId", "definitionDigest", "recordedAt"].includes(k),
    ),
  );
  for (const change of [
    { source: "another" },
    { sourceAccountId: "another" },
    { originalTransactionId: "another" },
    { amountCents: 16 },
  ])
    assert.throws(
      () =>
        f.store.update((s, r) =>
          createContribution(s, r, f.project.id, { ...input, ...change }),
        ),
      /CONFLICT|FIXED_INTENT/,
    );
  assert.throws(
    () => f.send(c, "capture", 15, { originalTransactionId: "replacement" }),
    /ORIGINAL_TRANSACTION_CONFLICT/,
  );
  assert.throws(() => f.send(c, "capture", 16), /AMOUNT_EXCEEDS_INTENT/);
  assert.equal(f.rows("contributions").length, 1);
  const otherAccount = f.gift(5, {
    sourceAccountId: "another-account",
    originalTransactionId: c.originalTransactionId,
  });
  f.send(otherAccount, "capture", 5, { sourceEventId: capture.sourceEventId });
  assert.equal(f.store.records.position(otherAccount.id).creatorCents, 1);
  assert.equal(f.store.records.financeTotals(f.project.id).votes, 2);
});

test("changed source digest is immutable evidence held for review; affected liability availability and votes are held", async (t) => {
  const f = await financeFixture(t),
    c = f.support();
  const e = f.eventData(c, "capture");
  f.store.update((s, r) => ingestEvent(s, r, e));
  f.send(c, "settlement");
  const original = f
    .rows("source_events")
    .find((row) => row.sourceEventId === e.sourceEventId);
  const conflict = f.store.update((s, r) =>
    ingestEvent(s, r, { ...e, evidenceRef: "Changed payload" }),
  );
  assert.equal(conflict.state, "held");
  assert.equal(conflict.position.availableMediaCents, 0);
  assert.equal(conflict.position.heldCents, 10000);
  assert.deepEqual(f.store.records.get("source_events", original.id), original);
  assert.equal(f.rows("source_conflicts").length, 1);
  f.store.update((s, r) =>
    ingestEvent(s, r, { ...e, evidenceRef: "Changed payload" }),
  );
  assert.equal(f.rows("source_conflicts").length, 1);
  assert.equal(f.rows("journal_transactions").length, 2);
  const g = f.gift();
  const ce = f.eventData(g, "capture");
  f.store.update((s, r) => ingestEvent(s, r, ce));
  assert.equal(
    f.store.update((s, r) => ingestEvent(s, r, { ...ce, amountCents: 9999 }))
      .position.votes,
    0,
  );
});

test("out-of-order refund and settlement wait for capture; cumulative partial refunds conserve cents and remove the vote only on full refund", async (t) => {
  const f = await financeFixture(t),
    c = f.gift(15);
  assert.equal(f.send(c, "refund", 5).state, "pending");
  assert.equal(f.send(c, "settlement").state, "pending");
  assert.equal(f.rows("journal_transactions").length, 0);
  const captured = f.send(c, "capture").position;
  assert.equal(captured.refundedCents, 5);
  assert.equal(captured.settledCents, 15);
  assert.equal(captured.creatorCents, 1);
  assert.equal(captured.votes, 1);
  const second = f.send(c, "refund", 10).position;
  assert.equal(second.creatorCents, 1);
  assert.equal(second.beneficiaryCents, 4);
  assert.equal(second.votes, 1);
  for (let i = 0; i < 3; i++) f.send(c, "refund", 10);
  assert.equal(f.store.records.position(c.id).refundedCents, 10);
  const full = f.send(c, "refund", 15).position;
  assert.equal(full.votes, 0);
  assert.equal(full.creatorCents, 0);
  assert.equal(full.beneficiaryCents, 0);
  f.send(c, "pending", 0);
  f.send(c, "failed", 0);
  f.send(c, "capture", 5);
  f.send(c, "settlement", 5);
  assert.equal(f.store.records.position(c.id).state, "refunded");
  assert.equal(f.store.records.position(c.id).settledCents, 15);
  const installments = f.gift(15);
  f.send(installments, "capture", 5);
  f.send(installments, "capture", 15);
  assert.equal(f.store.records.position(installments.id).creatorCents, 2);
  assert.equal(f.store.records.position(installments.id).votes, 1);
});

test("excess refunds and injected cross-workspace/journal failure roll back every fact and projection", async (t) => {
  const f = await financeFixture(t),
    c = f.gift(100);
  f.send(c, "capture", 50);
  const before = {
    state: f.store.read(),
    p: f.store.records.position(c.id),
    events: f.rows("source_events"),
    journal: f.rows("journal_transactions"),
    entries: f.rows("journal_entries"),
  };
  assert.throws(
    () =>
      f.store.update((s, r) => {
        s.projects[0].name = "Must roll back";
        ingestEvent(s, r, f.eventData(c, "refund", 51));
      }),
    /REFUND_EXCEEDS_CAPTURE/,
  );
  assert.throws(
    () =>
      f.store.update((s, r) => {
        s.projects[0].name = "Must also roll back";
        ingestEvent(s, r, f.eventData(c, "capture", 100));
        throw new Error("Injected after journal writes");
      }),
    /Injected/,
  );
  assert.deepEqual(f.store.read(), before.state);
  assert.deepEqual(f.store.records.position(c.id), before.p);
  assert.deepEqual(f.rows("source_events"), before.events);
  assert.deepEqual(f.rows("journal_transactions"), before.journal);
  assert.deepEqual(f.rows("journal_entries"), before.entries);
  const uncaptured = f.gift(5),
    count = f.rows("source_events").length;
  assert.throws(
    () => f.send(uncaptured, "refund", 6),
    /REFUND_EXCEEDS_CAPTURE/,
  );
  assert.equal(f.rows("source_events").length, count);
});

test("disputes hold liabilities and confirmed loss reverses them; recovery seam represents post-payment shortfall without a debit", async (t) => {
  const f = await financeFixture(t),
    c = f.gift(10000);
  f.send(c, "capture");
  f.send(c, "settlement");
  const disputed = f.send(c, "dispute").position;
  assert.equal(disputed.heldCents, 10000);
  assert.equal(disputed.votes, 0);
  assert.equal(disputed.creatorCents, 1000);
  assert.equal(f.send(c, "dispute_release").position.votes, 1);
  f.send(c, "dispute");
  const lost = f.send(c, "dispute_loss").position;
  assert.equal(lost.refundedCents, 10000);
  assert.equal(lost.creatorCents, 0);
  assert.equal(lost.votes, 0);
  const tx = f.rows("journal_transactions").at(-1);
  assert.equal(tx.type, "dispute_loss");
  assert(tx.correctingTransactionId);
  assert.equal(recoveryBalance(lost.creatorCents, 1000), 1000);
  assert(
    !f
      .rows("journal_entries")
      .some((e) => e.account.includes("external_debit")),
  );
});

test("unattributed captured money remains explicit suspense and never creates protected commission or progress", async (t) => {
  const f = await financeFixture(t);
  const intent = f.store.update((s, r) =>
    freezeIntent(s, r, f.project.id, "unattributed visitor", {
      amountCents: 100,
    }),
  );
  const c = f.gift(100, { intentId: intent.id });
  const p = f.send(c, "capture").position;
  assert.equal(p.unallocatedCents, 100);
  assert.equal(p.creatorCents, 0);
  assert.equal(p.publicGrossCents, 0);
  assert.equal(p.votes, 0);
  assert(
    f
      .rows("journal_entries")
      .some((e) => e.account === "suspense" && e.creditCents === 100),
  );
  const publicView = (await f.request(`/giving/${f.project.id}/progress`)).data;
  assert.equal(publicView.unallocatedCents, 100);
});

test("Admin adjudication resolves captured suspense at its original completion time with an immutable balanced correction and no second cash/gift", async (t) => {
  const f = await financeFixture(t);
  const intent = f.store.update((s, r) =>
    freezeIntent(s, r, f.project.id, "suspense visitor", { amountCents: 100 }),
  );
  const c = f.gift(100, { intentId: intent.id });
  f.send(c, "capture");
  f.send(c, "settlement");
  const original = f.store.records.position(c.id);
  const url = `/contributions/${c.id}/attribution-adjudications`;
  const body = {
    distributionId: f.distribution.id,
    evidence: "Admin verified fictional original-time distribution evidence",
  };
  assert.equal(
    (await f.request(url, { method: "POST", role: "creator", body })).status,
    403,
  );
  assert.equal(
    (
      await f.request(url, {
        method: "POST",
        body: { ...body, distributionId: "missing" },
      })
    ).status,
    409,
  );
  assert.equal(f.rows("journal_transactions").length, 2);
  assert.throws(
    () =>
      f.send(c, "attribution_resolution", 100, {
        distributionId: f.distribution.id,
        effectiveAt: new Date(
          Date.parse(original.eligibility.effectiveAt) - 1,
        ).toISOString(),
      }),
    /ORIGINAL_COMPLETION_TIME_REQUIRED/,
  );
  const result = await f.request(url, { method: "POST", body });
  assert.equal(result.status, 201, JSON.stringify(result.data));
  const p = result.data.position;
  assert.equal(p.unallocatedCents, 0);
  assert.equal(p.creatorCents, 10);
  assert.equal(p.beneficiaryCents, 90);
  assert.equal(p.votes, 1);
  assert.equal(p.capturedCents, 100);
  assert.equal(p.settledCents, 100);
  const tx = f
    .rows("journal_transactions")
    .find((tx) => tx.type === "attribution_resolution");
  assert(tx.correctingTransactionId);
  assert.deepEqual(tx.terms, f.terms);
  const entries = f
    .rows("journal_entries")
    .filter((e) => e.transactionId === tx.id);
  assert.deepEqual(entries.map((e) => e.account).sort(), [
    "beneficiary",
    "creator",
    "suspense",
  ]);
  assert.equal(
    entries.reduce((n, e) => n + e.debitCents - e.creditCents, 0),
    0,
  );
  assert.equal(
    (await f.request(url, { method: "POST", body })).data.state,
    "duplicate",
  );
  assert.throws(
    () =>
      f.send(c, "attribution_resolution", 100, {
        distributionId: f.distribution.id,
        effectiveAt: original.eligibility.effectiveAt,
      }),
    /ATTRIBUTION_ALREADY_ALLOCATED/,
  );
  assert.equal(f.rows("journal_transactions").length, 3);
  assert.equal(f.rows("contributions").length, 1);
  const rebuilt = f.store.update((s, r) => rebuildPosition(s, r, c.id));
  assert.deepEqual(rebuilt.position, p);
  const restart = createStore(join(f.dir, "test.sqlite"));
  assert.deepEqual(restart.records.position(c.id), p);
  restart.close();
});

test("Admin financial fixtures are scoped; public confirmation owns an immutable intent and emits trusted local evidence only once", async (t) => {
  const f = await financeFixture(t),
    c = f.gift();
  for (const role of ["creator", "nonprofit"]) {
    assert.equal(
      (
        await f.request("/admin/finance-events", {
          method: "POST",
          role,
          body: f.eventData(c, "capture"),
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await f.request(`/campaigns/${f.project.id}/contributions`, {
          method: "POST",
          role,
          body: {},
        })
      ).status,
      403,
    );
    assert.equal(
      (await f.request(`/campaigns/${f.project.id}/finance/events`, { role }))
        .status,
      403,
    );
  }
  const start = await fetch(`${f.baseURL}/api/giving/${f.project.id}/intents`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ amountCents: 5, distributionId: f.distribution.id }),
  });
  assert.equal(start.status, 201);
  const cookie = start.headers.get("set-cookie").split(";")[0],
    intent = await start.json();
  const url = `${f.baseURL}/api/giving/${f.project.id}/intents/${intent.id}/confirm`;
  const call = (headers = {}, body = {}) =>
    fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json", ...headers },
      body: JSON.stringify(body),
    });
  assert.equal((await call()).status, 404);
  assert.equal((await call({ cookie }, { amountCents: 100000 })).status, 400);
  let confirmation;
  for (let i = 0; i < 2; i++) {
    const res = await call({ cookie });
    assert.equal(res.status, 200);
    confirmation = await res.json();
  }
  assert.equal(confirmation.amountCents, 5);
  assert.equal(confirmation.creatorCents, 1);
  assert.equal(confirmation.votes, 1);
  assert.equal(f.rows("journal_transactions").length, 2);
  const owner = (
    await f.request(`/campaigns/${f.project.id}/finance`, { role: "nonprofit" })
  ).data;
  const publicView = (await f.request(`/giving/${f.project.id}/progress`)).data;
  for (const view of [owner, publicView, confirmation])
    for (const key of [
      "sourceAccountId",
      "visitorId",
      "payloadDigest",
      "sourceEventId",
      "payoutId",
      "termsId",
    ])
      assert(!JSON.stringify(view).includes(key));
  const workspace = (await f.request("/workspace")).data;
  for (const key of ["source_events", "journal_entries", "contributions"])
    assert(!Object.hasOwn(workspace, key));
  assert.equal(
    (await f.request(`/campaigns/${f.project.id}/finance?mode=live`)).data
      .capturedCents,
    0,
  );
  assert.equal(
    (
      await f.request(`/campaigns/seat-at-the-table/finance`, {
        role: "nonprofit",
      })
    ).status,
    404,
  );
});

test("bounded reconciliation checkpoints at 100 and declared source/journal/queue indexes support scoped capped pages", async (t) => {
  const f = await financeFixture(t),
    c = f.gift(100);
  for (let i = 0; i < 105; i++) f.send(c, "refund", 1);
  const first = f.store.update((s, r) =>
    reconcile(s, r, { campaignId: f.project.id }),
  );
  assert.equal(first.processed, 100);
  assert(first.nextCursor);
  assert.equal(first.applied, 0);
  assert(first.durationMs >= 0);
  const second = f.store.update((s, r) =>
    reconcile(s, r, { campaignId: f.project.id, cursor: first.nextCursor }),
  );
  assert.equal(second.processed, 5);
  assert.equal(second.nextCursor, null);
  f.send(c, "capture");
  assert.equal(
    f.store.records.pendingPage({ campaignId: f.project.id }).items.length,
    5,
  );
  const last = f.store.update((s, r) =>
    reconcile(s, r, { campaignId: f.project.id }),
  );
  assert.equal(last.processed, 5);
  assert.equal(last.applied, 5);
  assert.equal(f.store.records.position(c.id).refundedCents, 1);
  const expected = f.store.records.position(c.id);
  let rebuilt;
  do {
    rebuilt = f.store.update((s, r) =>
      rebuildPosition(s, r, c.id, rebuilt?.checkpoint),
    );
    assert(rebuilt.processed <= 100);
  } while (rebuilt.checkpoint);
  assert.deepEqual(rebuilt.position, expected);
  for (const [name, plan] of Object.entries(
    f.store.records.financeQueryPlans(),
  ))
    assert.match(
      plan.map((row) => row.detail).join(" "),
      new RegExp(
        name === "source"
          ? "source_evidence_unique"
          : name === "journal"
            ? "journal_subject"
            : "finance_pending_page",
      ),
    );
  const page = f.store.records.page("source_events", {
    campaignId: f.project.id,
    limit: 1000,
  });
  assert.equal(page.items.length, 100);
  assert(page.nextCursor);
  const next = f.store.records.page("source_events", {
    campaignId: f.project.id,
    cursor: page.nextCursor,
    limit: 100,
  });
  assert.equal(next.items.length, 6);
  assert(!next.items.some((r) => page.items.some((p) => p.id === r.id)));
  assert.throws(
    () =>
      f.store.records.page("source_events", {
        campaignId: "different",
        cursor: page.nextCursor,
      }),
    /Invalid scoped cursor/,
  );
});

test("restart, immutable SQL facts, and full-directory backup/restore preserve source IDs, media, and every per-purpose total", async (t) => {
  const f = await financeFixture(t),
    publicGift = f.gift(10000),
    support = f.support();
  for (const c of [publicGift, support]) {
    f.send(c, "capture");
    f.send(c, "settlement");
  }
  f.send(publicGift, "refund", 500);
  const totals = f.store.records.financeTotals(f.project.id),
    ids = f.rows("source_events").map((e) => e.id),
    media = f.store.read().posts.map((p) => p.media);
  const purposeTotals = (r) =>
    r
      .page("journal_entries", { campaignId: f.project.id, limit: 100 })
      .items.reduce((totals, e) => {
        const key = `${e.purpose}:${e.account}`;
        totals[key] = (totals[key] || 0) + e.debitCents - e.creditCents;
        return totals;
      }, {});
  const journalTotals = purposeTotals(f.store.records);
  const db = new DatabaseSync(join(f.dir, "test.sqlite"));
  for (const table of [
    "source_events",
    "contributions",
    "journal_transactions",
    "journal_entries",
  ]) {
    assert.throws(
      () => db.exec(`UPDATE ${table} SET effective_at='changed'`),
      /Immutable financial fact/,
    );
    assert.throws(
      () => db.exec(`DELETE FROM ${table}`),
      /Immutable financial fact/,
    );
  }
  const backup = mkdtempSync(join(tmpdir(), "slander-finance-backup-"));
  t.after(() => rmSync(backup, { recursive: true, force: true }));
  writeFileSync(
    join(f.dir, "uploads", "fictional-media.txt"),
    "retained media",
  );
  db.prepare("VACUUM INTO ?").run(join(backup, "test.sqlite"));
  db.close();
  cpSync(join(f.dir, "uploads"), join(backup, "uploads"), { recursive: true });
  const restarted = createStore(join(f.dir, "test.sqlite"));
  assert.deepEqual(restarted.records.financeTotals(f.project.id), totals);
  restarted.close();
  for (let i = 0; i < 2; i++) {
    const restored = createStore(join(backup, "test.sqlite"));
    assert.deepEqual(restored.records.financeTotals(f.project.id), totals);
    assert.deepEqual(purposeTotals(restored.records), journalTotals);
    assert.deepEqual(
      restored.records
        .page("source_events", { campaignId: f.project.id })
        .items.map((e) => e.id),
      ids,
    );
    assert.deepEqual(
      restored.read().posts.map((p) => p.media),
      media,
    );
    restored.close();
  }
  assert.equal(
    readFileSync(join(backup, "uploads", "fictional-media.txt"), "utf8"),
    "retained media",
  );
  const reversed = remainingAllocations(support.allocations, 10000, 9999);
  assert.equal(
    reversed.reduce((n, a) => n + a.amountCents, 0),
    9999,
  );
});

test("commit-time invariants reject unbalanced journals and appending to closed transactions; goal is a scoped integer-cent campaign setting", async (t) => {
  const f = await financeFixture(t),
    c = f.gift();
  f.send(c, "capture");
  const tx = f.rows("journal_transactions")[0],
    before = f.rows("journal_entries");
  const entry = {
    id: randomUUID(),
    campaignId: f.project.id,
    mode: "simulated",
    effectiveAt: tx.effectiveAt,
    currency: "USD",
    transactionId: tx.id,
    sourceRecordId: tx.sourceRecordId,
    contributionId: c.id,
    account: "creator",
    purpose: "public",
    debitCents: 1,
    creditCents: 0,
  };
  assert.throws(
    () => f.store.update((s, r) => r.append("journal_entries", entry)),
    /already closed/,
  );
  const uncaptured = f.gift();
  const pending = f.send(uncaptured, "settlement").event;
  assert.throws(
    () =>
      f.store.update((s, r) => {
        const bad = {
          ...tx,
          id: randomUUID(),
          sourceRecordId: pending.id,
          contributionId: uncaptured.id,
        };
        r.append("journal_transactions", bad);
        r.append("journal_entries", {
          ...entry,
          id: randomUUID(),
          transactionId: bad.id,
          sourceRecordId: pending.id,
          contributionId: uncaptured.id,
        });
        r.append("source_event_results", {
          id: randomUUID(),
          campaignId: f.project.id,
          mode: "simulated",
          effectiveAt: tx.effectiveAt,
          sourceRecordId: pending.id,
          contributionId: uncaptured.id,
          state: "applied",
          lastTransactionId: bad.id,
        });
      }),
    /Unbalanced/,
  );
  assert.deepEqual(f.rows("journal_entries"), before);
  const project = f.store.read().projects[0];
  assert.equal(
    (
      await f.request(`/projects/${project.id}`, {
        method: "PUT",
        body: { ...project, goalCents: 100000 },
      })
    ).status,
    200,
  );
  assert.equal(
    (await f.request(`/giving/${project.id}/progress`)).data.goalCents,
    100000,
  );
  assert.equal(
    (
      await f.request(`/projects/${project.id}`, {
        method: "PUT",
        body: { ...project, goalCents: 1.5 },
      })
    ).status,
    400,
  );
});

test("v2 migration failure rolls back and an existing v1 upgrade backs up committed state before schema changes", async (t) => {
  const f = await financeFixture(t),
    c = f.support();
  f.send(c, "capture");
  f.send(c, "settlement");
  const raw = new DatabaseSync(join(f.dir, "test.sqlite"));
  raw.exec("DELETE FROM schema_migrations WHERE version=2");
  raw.close();
  const state = f.store.read(),
    totals = f.store.records.financeTotals(f.project.id);
  assert.throws(
    () =>
      createStore(join(f.dir, "test.sqlite"), true, {
        migrationHook(stage) {
          if (stage === "afterSchema")
            throw new Error("Injected v2 migration failure");
        },
      }),
    /Injected v2 migration/,
  );
  const afterFailure = new DatabaseSync(join(f.dir, "test.sqlite"));
  assert.equal(
    afterFailure
      .prepare("SELECT MAX(version) AS version FROM schema_migrations")
      .get().version,
    1,
  );
  afterFailure.close();
  const reopened = createStore(join(f.dir, "test.sqlite"));
  assert(reopened.migrationBackup.includes("backup-v2"));
  t.after(() =>
    rmSync(reopened.migrationBackup, { recursive: true, force: true }),
  );
  assert.deepEqual(reopened.read(), state);
  assert.deepEqual(reopened.records.financeTotals(f.project.id), totals);
  reopened.close();
});
