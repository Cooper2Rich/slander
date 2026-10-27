import { test } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  rmSync,
  existsSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { execFileSync } from "node:child_process";
import {
  stageWorking,
  assertWorkingChanges,
} from "../scripts/stage-working.mjs";
import { previewStorageKey } from "../src/public-demo/storage.ts";
import {
  withMainDemoLinks,
  withoutMainDemoLinks,
} from "../scripts/main-demo-links.mjs";

test("working storage isolates every key and media database without migrating main or John", () => {
  for (const key of [
    "slander-role",
    "slander-public-access-v1",
    "slander-public-workspace-v1",
    "slander-public-preview-v1",
    "slander-public-viewers-v1",
    "slander-financial-samples-v1",
    "ripple-leaderboard-history-v1",
    "slander-public-media-v1",
  ]) {
    assert.equal(previewStorageKey(key, "/slander/working/"), `working:${key}`);
    assert.equal(previewStorageKey(key, "/slander/"), key);
    assert.equal(
      previewStorageKey(key, "/slander/demo-shared-with-john/"),
      key,
    );
  }
});

test("working staging adds approved main links and working files, preserving the main application, John and old chunks", (t) => {
  const root = mkdtempSync(join(tmpdir(), "working-preview-"));
  t.after(() => {
    if (!resolve(root).startsWith(resolve(tmpdir()) + sep))
      throw new Error("Unexpected cleanup path");
    rmSync(root, { recursive: true, force: true });
  });
  const destination = join(root, "archive"),
    source = join(root, "build");
  mkdirSync(join(destination, "demo-shared-with-john"), { recursive: true });
  mkdirSync(join(destination, "working/assets"), { recursive: true });
  mkdirSync(join(source, "assets"), { recursive: true });
  const git = (...args) =>
    execFileSync("git", ["-C", destination, ...args], {
      encoding: "utf8",
    }).trim();
  git("init", "-b", "gh-pages");
  git("config", "core.autocrlf", "false");
  git("config", "user.name", "Preview test");
  git("config", "user.email", "test@example.test");
  const originalMain =
    '<!doctype html><html><body><div id="root">frozen main</div><script src="/slander/assets/original.js"></script></body></html>';
  writeFileSync(join(destination, "index.html"), originalMain);
  writeFileSync(
    join(destination, "demo-shared-with-john/index.html"),
    "frozen John",
  );
  writeFileSync(
    join(destination, "working/assets/previous-old12345.js"),
    "old lazy module",
  );
  git("add", ".");
  git("commit", "-m", "Existing sites");
  const main = git("rev-parse", "HEAD:index.html"),
    john = git("rev-parse", "HEAD:demo-shared-with-john");
  const manifest = {
    branch: "working",
    dirty: false,
    commit: "a".repeat(40),
    base: "/slander/working/",
    storagePrefix: "working:",
  };
  writeFileSync(join(source, "working-preview.json"), JSON.stringify(manifest));
  writeFileSync(
    join(source, "index.html"),
    '<script src="/slander/working/assets/new-new12345.js"></script>',
  );
  writeFileSync(join(source, "assets/new-new12345.js"), "new preview");
  const result = stageWorking(source, destination);
  assert.equal(result.mainIndex, main);
  assert.equal(result.johnTree, john);
  assert.equal(
    withoutMainDemoLinks(readFileSync(join(destination, "index.html"), "utf8")),
    originalMain,
  );
  assert.equal(
    readFileSync(join(destination, "demo-shared-with-john/index.html"), "utf8"),
    "frozen John",
  );
  assert.ok(
    existsSync(join(destination, "working/assets/previous-old12345.js")),
  );
  const labeled = readFileSync(join(destination, "index.html"), "utf8");
  assert.match(labeled, /John — Frozen demo/);
  assert.match(labeled, /Working — Editable demo/);
  git("add", "--", "working", "index.html");
  assertWorkingChanges(destination, true);
  git("commit", "-m", "Isolated preview");
  assert.notEqual(git("rev-parse", "HEAD:index.html"), main);
  assert.equal(git("rev-parse", "HEAD:demo-shared-with-john"), john);
  stageWorking(source, destination);
  assert.equal(readFileSync(join(destination, "index.html"), "utf8"), labeled);
  assert.equal(git("status", "--porcelain"), "");
  writeFileSync(
    join(destination, "index.html"),
    withMainDemoLinks(originalMain.replace("original.js", "tampered.js")),
  );
  git("add", "index.html");
  assert.throws(
    () => assertWorkingChanges(destination, true),
    /beyond its approved demo links/,
  );
  git("reset", "--hard", "HEAD");
  writeFileSync(
    join(destination, "demo-shared-with-john/index.html"),
    "unexpected John change",
  );
  git("add", "demo-shared-with-john/index.html");
  assert.throws(
    () => assertWorkingChanges(destination, true),
    /outside working/,
  );
  git("reset", "--hard", "HEAD");
  const johnSource = join(root, "restricted-john");
  mkdirSync(join(johnSource, "assets"), { recursive: true });
  writeFileSync(
    join(johnSource, "index.html"),
    '<script src="/slander/demo-shared-with-john/assets/restricted-new12345.js"></script>',
  );
  writeFileSync(
    join(johnSource, "assets/restricted-new12345.js"),
    "restricted role build",
  );
  writeFileSync(
    join(johnSource, "john-preview.json"),
    JSON.stringify({
      sourceRevision: "47c3b75688110d1b9a8b7111dd46c1f252cc8ccb",
      roleRestrictionCommit: "a".repeat(40),
      dirty: false,
      allowedRoles: ["public", "nonprofit", "creator"],
    }),
  );
  stageWorking(source, destination, johnSource);
  git("add", "--", "working", "index.html", "demo-shared-with-john");
  assertWorkingChanges(destination, true, johnSource);
  assert.equal(readFileSync(join(destination, "index.html"), "utf8"), labeled);
  assert.equal(
    readFileSync(join(destination, "demo-shared-with-john/index.html"), "utf8"),
    readFileSync(join(johnSource, "index.html"), "utf8"),
  );
  writeFileSync(
    join(destination, "demo-shared-with-john/index.html"),
    "unexpected replacement",
  );
  git("add", "demo-shared-with-john/index.html");
  assert.throws(
    () => assertWorkingChanges(destination, true, johnSource),
    /differs from the approved/,
  );
  git("reset", "--hard", "HEAD");
});

test("main labels are idempotent and preserve the application payload byte for byte", () => {
  const html =
    '<html>\r\n<body class="demo">\r\n<div id="root"></div><script src="/slander/assets/frozen.js"></script>\r\n</body></html>';
  const labeled = withMainDemoLinks(html);
  assert.equal(withMainDemoLinks(labeled), labeled);
  assert.equal(withoutMainDemoLinks(labeled), html);
  assert.equal((labeled.match(/aria-label="Public demos"/g) || []).length, 1);
  assert.throws(
    () =>
      withoutMainDemoLinks(
        labeled.replace("BRM PUBLIC DEMO LINKS END", "broken"),
      ),
    /Malformed/,
  );
});
