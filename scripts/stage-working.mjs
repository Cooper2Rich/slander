import {
  cpSync,
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { execFileSync } from "node:child_process";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { withMainDemoLinks } from "./main-demo-links.mjs";
import { assertJohnChange, stageJohn } from "./stage-john.mjs";

function git(destination, ...args) {
  return execFileSync("git", ["-C", destination, ...args], {
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
}
function noLinks(path) {
  if (lstatSync(path).isSymbolicLink())
    throw new Error("Preview paths cannot contain symlinks");
  if (lstatSync(path).isDirectory())
    for (const entry of readdirSync(path)) noLinks(join(path, entry));
}
export function assertWorkingChanges(destination, staged = false, johnSource) {
  const changed = git(
    destination,
    "diff",
    ...(staged ? ["--cached"] : []),
    "--name-only",
    "-z",
  )
    .split("\0")
    .filter(Boolean);
  const untracked = git(
    destination,
    "ls-files",
    "--others",
    "--exclude-standard",
    "-z",
  )
    .split("\0")
    .filter(Boolean);
  if (
    [...changed, ...untracked].some(
      (path) =>
        path !== "index.html" &&
        !path.startsWith("working/") &&
        !(johnSource && path.startsWith("demo-shared-with-john/")),
    )
  )
    throw new Error(
      "Refusing publication: a path outside working/ and the approved main links changed",
    );
  for (const path of new Set([...changed, ...untracked]))
    if (path.startsWith("demo-shared-with-john/"))
      assertJohnChange(destination, path, johnSource, staged);
  if (changed.includes("index.html") || untracked.includes("index.html")) {
    const original = git(destination, "show", "HEAD:index.html");
    const current = staged
      ? git(destination, "show", ":index.html")
      : readFileSync(join(destination, "index.html"), "utf8");
    if (current !== withMainDemoLinks(original))
      throw new Error(
        "Refusing publication: main entry changed beyond its approved demo links",
      );
  }
  return changed;
}
export function stageWorking(source, destination, johnSource) {
  source = resolve(source);
  destination = resolve(destination);
  if (git(destination, "branch", "--show-current").trim() !== "gh-pages")
    throw new Error("Destination must be the generated gh-pages archive");
  if (git(destination, "status", "--porcelain").trim())
    throw new Error("Archive has changes; preserve them before staging");
  const manifest = JSON.parse(
    readFileSync(join(source, "working-preview.json"), "utf8"),
  );
  if (
    manifest.branch !== "working" ||
    manifest.dirty !== false ||
    manifest.base !== "/slander/working/" ||
    manifest.storagePrefix !== "working:" ||
    !/^[a-f0-9]{40}$/.test(manifest.commit)
  )
    throw new Error("Expected an isolated working build manifest");
  const html = readFileSync(join(source, "index.html"), "utf8");
  if (!html.includes("/slander/working/assets/"))
    throw new Error("Build assets must use the working URL");
  noLinks(source);
  const target = join(destination, "working");
  if (existsSync(target)) noLinks(target);
  mkdirSync(target, { recursive: true });
  for (const entry of readdirSync(source)) {
    if (entry === ".git") throw new Error("Build cannot contain Git metadata");
    // Merge within working/ to retain hashed assets needed by already-open tabs.
    cpSync(join(source, entry), join(target, entry), { recursive: true });
  }
  const mainPath = join(destination, "index.html");
  noLinks(mainPath);
  writeFileSync(mainPath, withMainDemoLinks(readFileSync(mainPath, "utf8")));
  if (johnSource) stageJohn(johnSource, destination);
  assertWorkingChanges(destination, false, johnSource);
  if (readFileSync(join(target, "index.html"), "utf8") !== html)
    throw new Error("Working entry point differs from build");
  return {
    ...manifest,
    target,
    mainIndex: git(destination, "rev-parse", "HEAD:index.html").trim(),
    mainIndexWithLinks: git(destination, "hash-object", mainPath).trim(),
    johnTree: git(
      destination,
      "rev-parse",
      "HEAD:demo-shared-with-john",
    ).trim(),
  };
}
if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const i = process.argv.indexOf("--destination");
  if (i < 0 || !process.argv[i + 1])
    throw new Error("Expected --destination <gh-pages checkout>");
  const destination = process.argv[i + 1];
  const johnIndex = process.argv.indexOf("--john-source");
  const johnSource = johnIndex >= 0 ? process.argv[johnIndex + 1] : undefined;
  console.log(
    JSON.stringify(
      process.argv.includes("--verify-staged")
        ? assertWorkingChanges(destination, true, johnSource)
        : stageWorking("public-site", destination, johnSource),
    ),
  );
}
