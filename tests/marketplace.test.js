import { test } from "node:test";
import assert from "node:assert/strict";
import { join } from "node:path";
import { readdirSync, readFileSync } from "node:fs";
import { fixture } from "./helpers.js";
import { createStore } from "../server/store.js";
import {
  COMPENSATION,
  evaluateSnapshot,
  eligibilityFacts,
  eligibleCounts,
  submissionsOpen,
} from "../server/eligibility.js";

const valid = {
  title: "Automatic creative",
  creator: "Cannot impersonate",
  caption: "Plant a tree with our fictional community.",
  format: "photo",
  media: "/images/forest.jpg",
  mediaType: "image",
  rights: true,
  channel: "instagram",
  destination: "/campaigns/greener-tomorrow/give",
  acceptedTermsVersion: "local-v1",
  disclosures: {
    compensation: COMPENSATION,
    beneficiary: "Beneficiary: One Tree Collective.",
  },
  factualClaims: [],
};
const submit = async (request, changes = {}) =>
  request("/projects/greener-tomorrow/posts", {
    method: "POST",
    role: "creator",
    body: { ...valid, ...changes },
  });
const pair = async (request) => {
  const project = (await request("/workspace")).data.projects.find(
    (p) => p.id === "greener-tomorrow",
  );
  return request(`/projects/${project.id}`, {
    method: "PUT",
    body: { ...project, instagram: "one.tree" },
  });
};

test("automatic evaluation is reproducible, audited and idempotent on snapshot/rule/fact versions", async (t) => {
  const { request, store } = await fixture(t);
  const { data: post, status } = await submit(request);
  assert.equal(status, 201);
  assert.equal(post.revision, 1);
  assert.equal(post.history[0].action, "submitted");
  assert.match(post.history[0].note, /Checking/);
  assert.equal(post.eligibility.outcome, "eligible");
  assert.equal(post.snapshots[0].submittedBy, store.read().creators[0].id);
  const project = store.read().projects[0];
  const facts = eligibilityFacts(store.read(), post, project);
  const result = evaluateSnapshot(
    post.snapshots[0],
    project.eligibilityPolicy,
    facts,
  );
  assert.deepEqual(
    result,
    evaluateSnapshot(post.snapshots[0], project.eligibilityPolicy, facts),
  );
  assert.deepEqual(result.reasons, []);
  for (let i = 0; i < 2; i++)
    assert.equal(
      (
        await request(`/posts/${post.id}/evaluate`, {
          method: "POST",
          body: { snapshotId: post.snapshotId },
        })
      ).data.id,
      post.eligibility.id,
    );
  assert.equal(store.read().posts[0].evaluations.length, 1);
});

test("mandatory rights, exact disclosure, destination, channel and current terms cannot be waived", async (t) => {
  const { request, store } = await fixture(t);
  for (const [changes, code] of [
    [{ rights: false }, "RIGHTS_REQUIRED"],
    [
      { disclosures: { ...valid.disclosures, compensation: "Optional" } },
      "COMPENSATION_DISCLOSURE_REQUIRED",
    ],
    [
      {
        disclosures: {
          ...valid.disclosures,
          beneficiary: "Different beneficiary",
        },
      },
      "BENEFICIARY_DISCLOSURE_REQUIRED",
    ],
    [{ destination: "https://evil.example" }, "DESTINATION_NOT_ALLOWED"],
    [{ channel: "unapproved" }, "CHANNEL_NOT_ALLOWED"],
    [{ acceptedTermsVersion: "old" }, "CURRENT_TERMS_REQUIRED"],
  ]) {
    const { data: post } = await submit(request, changes);
    assert.equal(post.eligibility.outcome, "needs_fix");
    assert.deepEqual(
      post.eligibility.reasons.map((r) => r.code),
      [code],
    );
    const result = await request(`/posts/${post.id}/review`, {
      method: "POST",
      role: "nonprofit",
      body: { decision: "approved", revision: 1 },
    });
    assert.equal(result.status, 409);
    assert.equal((await request(`/posts/${post.id}/export`)).status, 409);
  }
  const project = store.read().projects[0];
  const attempt = await request(`/projects/${project.id}`, {
    method: "PUT",
    body: {
      ...project,
      policyConfig: { ...project.eligibilityPolicy, rightsRequired: false },
    },
  });
  assert.equal(attempt.status, 400);
});

test("eligible revisions retain snapshots and exported evidence, reject stale edits/results and retain identity", async (t) => {
  const { request, store } = await fixture(t);
  await pair(request);
  const { data: post } = await submit(request);
  const original = structuredClone(post.snapshots[0]);
  const exported = (await request(`/posts/${post.id}/export`)).data;
  const revised = await request(`/posts/${post.id}`, {
    method: "PUT",
    role: "creator",
    body: {
      ...valid,
      creator: "Spoof",
      creatorId: "spoof",
      caption: "A fresh tree story.",
      revision: 1,
    },
  });
  assert.equal(revised.status, 200);
  assert.equal(revised.data.eligibility.outcome, "eligible");
  assert.equal(revised.data.creatorId, post.creatorId);
  assert.equal(revised.data.creator, post.creator);
  assert.deepEqual(revised.data.snapshots[0], original);
  assert.equal(
    (
      await request(`/posts/${post.id}`, {
        method: "PUT",
        role: "creator",
        body: { ...valid, revision: 1 },
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await request(`/posts/${post.id}/evaluate`, {
        method: "POST",
        body: { snapshotId: original.id },
      })
    ).status,
    409,
  );
  assert.deepEqual(store.read().exports.at(-1), exported);
  assert.equal(exported.snapshot.content.caption, valid.caption);
  assert.equal(store.read().posts[0].revision, 2);
});

test("evidence-linked rights holds follow revisions and copied IDs, with scoped appeals and mandatory rules", async (t) => {
  const { request, store, baseURL } = await fixture(t);
  await pair(request);
  const { data: post } = await submit(request);
  const hold = await request(`/posts/${post.id}/holds`, {
    method: "POST",
    body: {
      code: "RIGHTS_COMPLAINT",
      reason: "Owner disputes license",
      evidence: "Complaint case DEMO-7",
    },
  });
  assert.equal(hold.status, 201);
  const failedHold = await request("/posts/sample-2/holds", {
    method: "POST",
    role: "nonprofit",
    body: hold.data,
  });
  assert.equal(failedHold.status, 403);
  const copied = (await submit(request, { title: "Copied creative" })).data;
  assert.equal(copied.status, "held");
  const uploadForm = new FormData();
  uploadForm.append(
    "media",
    new Blob([readFileSync("public/images/forest.jpg")], {
      type: "image/jpeg",
    }),
    "same-content.jpg",
  );
  const uploaded = await (
    await fetch(baseURL + "/api/uploads", {
      method: "POST",
      headers: { "x-demo-role": "admin" },
      body: uploadForm,
    })
  ).json();
  const copiedUpload = (
    await submit(request, {
      title: "Same bytes under new filename",
      ...uploaded,
    })
  ).data;
  assert.equal(copiedUpload.status, "held");
  const revised = await request(`/posts/${post.id}`, {
    method: "PUT",
    role: "creator",
    body: {
      ...valid,
      caption: "Changed but same held logical item",
      rights: false,
      revision: 1,
    },
  });
  assert.equal(revised.data.status, "held");
  assert.equal((await request(`/posts/${post.id}/export`)).status, 409);
  assert.equal(
    store.read().posts.find((p) => p.id === "sample-2").eligibility.outcome,
    "eligible",
  );
  const appeal = await request(`/posts/${post.id}/appeals`, {
    method: "POST",
    role: "creator",
    body: { holdId: hold.data.id, note: "License evidence supplied" },
  });
  assert.equal(appeal.status, 201);
  const resolution = await request(`/appeals/${appeal.data.id}/resolve`, {
    method: "POST",
    body: {
      holdIncorrect: true,
      correctedFact: "Complaint identified wrong asset",
      evidence: "Verified license DEMO-8",
    },
  });
  assert.equal(resolution.status, 200);
  const current = store.read().posts.find((p) => p.id === post.id);
  assert.equal(current.status, "changes");
  assert.deepEqual(
    current.eligibility.reasons.map((r) => r.code),
    ["RIGHTS_REQUIRED"],
  );
  assert.equal(
    store.read().posts.find((p) => p.id === copied.id).status,
    "approved",
  );
  assert.equal(store.read().creativeHolds[0].evidence, "Complaint case DEMO-7");
});

test("policy edits append versions and immediately invalidate current library and handoff", async (t) => {
  const { request, store } = await fixture(t);
  await pair(request);
  const { data: post } = await submit(request);
  const project = store.read().projects[0];
  const config = Object.fromEntries(
    [
      "allowedChannels",
      "allowedFormats",
      "destinations",
      "compensationDisclosure",
      "beneficiaryDisclosure",
      "factualClaims",
      "termsVersion",
      "maxFileBytes",
    ].map((key) => [key, project.eligibilityPolicy[key]]),
  );
  const updated = await request(`/projects/${project.id}`, {
    method: "PUT",
    role: "nonprofit",
    body: {
      ...project,
      policyConfig: {
        ...config,
        factualClaims: [
          "Fictional campaign: one tree planted per local event.",
        ],
        termsVersion: "local-v2",
      },
    },
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.data.eligibilityPolicy.version, 2);
  assert.deepEqual(updated.data.policyHistory[0], project.policyHistory[0]);
  const workspace = (await request("/workspace")).data;
  assert.equal(workspace.approvedPosts.length, 1); // The independent food campaign remains eligible.
  assert.equal((await request(`/posts/${post.id}/export`)).status, 409);
  const current = store.read().posts[0];
  assert.deepEqual(
    current.eligibility.reasons.map((r) => r.code),
    ["CURRENT_TERMS_REQUIRED", "FACT_BLOCK_REQUIRED"],
  );
  assert.equal(current.evaluations[0].outcome, "eligible");
});

test("inclusive UTC dates share creation/revision/readiness rules and never partially mutate", async (t) => {
  const { request, store } = await fixture(t);
  const today = new Date().toISOString().slice(0, 10);
  const project = store.read().projects[0];
  assert(
    submissionsOpen({ ...project, startDate: today, endDate: today }, today),
  );
  assert(
    !submissionsOpen(
      { ...project, startDate: "2099-01-01", endDate: "2099-01-02" },
      today,
    ),
  );
  await request(`/projects/${project.id}`, {
    method: "PUT",
    body: {
      ...project,
      startDate: today,
      endDate: today,
      instagram: "one.tree",
    },
  });
  const { data: post } = await submit(request);
  assert.equal(post.status, "approved");
  assert.equal((await request(`/posts/${post.id}/export`)).status, 200);
  for (const change of [
    { status: "draft" },
    { status: "archived" },
    { startDate: "2099-01-01", endDate: "2099-01-02" },
    { startDate: "2000-01-01", endDate: "2000-01-02" },
  ]) {
    await request(`/projects/${project.id}`, {
      method: "PUT",
      body: { ...project, ...change },
    });
    const before = store.read();
    assert.equal(
      (
        await request(`/projects/${project.id}/posts`, {
          method: "POST",
          body: valid,
        })
      ).status,
      409,
    );
    assert.equal(
      (
        await request(`/posts/${post.id}`, {
          method: "PUT",
          body: { ...valid, revision: 1 },
        })
      ).status,
      409,
    );
    assert.equal((await request(`/posts/${post.id}/export`)).status, 409);
    assert.deepEqual(store.read(), before);
  }
});

test("private evidence never enters another creator's public projection, and unpublishing removes discovery", async (t) => {
  const { request, store } = await fixture(t);
  const { data: post } = await submit(request);
  const alex = store.read().creators.find((c) => c.name === "Alex Rivera");
  const result = (
    await request("/workspace", {
      role: "creator",
      headers: { "x-demo-creator": alex.id },
    })
  ).data;
  const publicPost = result.approvedPosts.find((p) => p.id === post.id);
  for (const privateKey of [
    "eligibility",
    "evaluations",
    "snapshots",
    "appeals",
    "rights",
    "disclosures",
    "policy",
  ])
    assert(!(privateKey in publicPost));
  assert.deepEqual(publicPost.history, []);
  assert.deepEqual(result.activity, []);
  const project = store.read().projects[0];
  await request(`/projects/${project.id}`, {
    method: "PUT",
    body: { ...project, status: "draft" },
  });
  const hidden = (
    await request("/workspace", {
      role: "creator",
      headers: { "x-demo-creator": alex.id },
    })
  ).data;
  assert(!hidden.approvedPosts.some((p) => p.id === post.id));
  assert(store.read().posts.some((p) => p.id === post.id));
});

test("eligible count uses one logical creative and stable creator ID with competition ties", async (t) => {
  const { request, store } = await fixture(t);
  const { data: post } = await submit(request);
  for (let revision = 1; revision <= 5; revision++)
    assert.equal(
      (
        await request(`/posts/${post.id}`, {
          method: "PUT",
          role: "creator",
          body: { ...valid, revision },
        })
      ).status,
      200,
    );
  const rows = (await request("/workspace")).data.eligibleCounts;
  assert.equal(rows.find((r) => r.creatorId === post.creatorId).count, 2);
  const counted = eligibleCounts([
    { id: "a", creatorId: "1", creator: "A" },
    { id: "a", creatorId: "1", creator: "A" },
    { id: "b", creatorId: "2", creator: "B" },
    { id: "c", creatorId: "3", creator: "C" },
    { id: "d", creatorId: "3", creator: "C" },
  ]);
  assert.deepEqual(
    counted.map((r) => [r.name, r.count, r.rank]),
    [
      ["C", 2, 1],
      ["A", 1, 2],
      ["B", 1, 2],
    ],
  );
  assert.equal(store.read().posts[0].snapshots.length, 6);
});

test("legacy migration preserves IDs, historical decisions and content; repeat startup never grants approval bypass", async (t) => {
  const { store, dir } = await fixture(t);
  store.update((state) => {
    const post = state.posts[0];
    for (const key of [
      "snapshots",
      "snapshotId",
      "evaluations",
      "evaluationId",
      "eligibility",
      "disclosures",
      "acceptedTermsVersion",
    ])
      delete post[key];
    post.status = "approved";
    post.history.push({
      id: "legacy-decision",
      action: "approved",
      actor: "Past owner",
      note: "Historical approval preserved",
      at: "2025-01-01T00:00:00Z",
    });
  });
  const original = store.read();
  const migrated = createStore(join(dir, "test.sqlite"));
  const after = migrated.read();
  assert.deepEqual(after.creators, original.creators);
  assert.equal(after.posts[0].id, original.posts[0].id);
  assert.equal(after.posts[0].caption, original.posts[0].caption);
  assert(after.posts[0].history.some((e) => e.id === "legacy-decision"));
  assert.equal(after.posts[0].eligibility.outcome, "needs_fix");
  migrated.close();
  const reopened = createStore(join(dir, "test.sqlite"));
  assert.deepEqual(reopened.read(), after);
  reopened.close();
});

test("withdrawal blocks new handoff but retains immutable prior export and evaluated snapshot", async (t) => {
  const { request, store } = await fixture(t);
  await pair(request);
  const { data: post } = await submit(request);
  const exported = (await request(`/posts/${post.id}/export`)).data;
  assert.equal(
    (
      await request(`/posts/${post.id}/withdraw`, {
        method: "POST",
        role: "creator",
        body: { revision: 1 },
      })
    ).status,
    200,
  );
  assert.equal((await request(`/posts/${post.id}/export`)).status, 409);
  assert.deepEqual(store.read().exports.at(-1), exported);
  assert.deepEqual(store.read().posts[0].snapshots[0], post.snapshots[0]);
});

test("upload boundaries, signature rejection cleanup and persisted media survive isolated restart", async (t) => {
  const { request, baseURL, store, dir } = await fixture(t);
  async function upload(bytes, type = "image/jpeg", name = "creative.jpg") {
    const form = new FormData();
    form.append("media", new Blob([bytes], { type }), name);
    const response = await fetch(`${baseURL}/api/uploads`, {
      method: "POST",
      headers: { "x-demo-role": "admin" },
      body: form,
    });
    return { status: response.status, data: await response.json() };
  }
  assert.equal((await upload(Buffer.from("forged"))).status, 400);
  assert.equal(
    (await upload(Buffer.from("pdf"), "application/pdf", "bad.pdf")).status,
    400,
  );
  assert.deepEqual(readdirSync(join(dir, "uploads")), []);
  const limit = new Uint8Array(30 * 1024 * 1024);
  limit.set([255, 216, 255]);
  const maximum = await upload(limit);
  assert.equal(maximum.status, 201);
  const oversized = new Uint8Array(limit.length + 1);
  oversized.set([255, 216, 255]);
  assert.equal((await upload(oversized)).status, 400);
  assert.equal(readdirSync(join(dir, "uploads")).length, 1);
  const actualImage = readFileSync("public/images/forest.jpg");
  const uploaded = await upload(actualImage);
  assert.equal(uploaded.status, 201);
  assert.notEqual(uploaded.data.media, maximum.data.media);
  assert.equal(
    (await submit(request, { media: uploaded.data.media, mediaType: "video" }))
      .status,
    400,
  );
  const created = await submit(request, uploaded.data);
  assert.equal(created.status, 201);
  assert.equal(created.data.eligibility.outcome, "eligible");
  const reopened = createStore(join(dir, "test.sqlite"));
  assert.equal(reopened.read().posts[0].media, uploaded.data.media);
  assert.deepEqual(reopened.read().creators, store.read().creators);
  reopened.close();
  const media = await fetch(`${baseURL}${uploaded.data.media}`);
  assert.deepEqual(Buffer.from(await media.arrayBuffer()), actualImage);
});
