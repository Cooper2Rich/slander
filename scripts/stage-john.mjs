import {
  cpSync,
  existsSync,
  lstatSync,
  readFileSync,
  readdirSync,
} from "node:fs";
import { execFileSync } from "node:child_process";
import { join, resolve } from "node:path";

const prefix = "demo-shared-with-john/";
const frozenRevision = "47c3b75688110d1b9a8b7111dd46c1f252cc8ccb";
const git = (destination, ...args) =>
  execFileSync("git", ["-C", destination, ...args], {
    maxBuffer: 32 * 1024 * 1024,
  });
function files(root, path = "") {
  const target = join(root, path);
  if (lstatSync(target).isSymbolicLink())
    throw new Error("John preview cannot contain symlinks");
  return lstatSync(target).isDirectory()
    ? readdirSync(target).flatMap((name) =>
        files(root, path ? `${path}/${name}` : name),
      )
    : [path];
}
function expected(source) {
  source = resolve(source);
  const manifest = JSON.parse(
    readFileSync(join(source, "john-preview.json"), "utf8"),
  );
  if (
    manifest.sourceRevision !== frozenRevision ||
    manifest.dirty !== false ||
    !/^[a-f0-9]{40}$/.test(manifest.roleRestrictionCommit) ||
    JSON.stringify(manifest.allowedRoles) !== '["public","nonprofit","creator"]'
  )
    throw new Error("Expected clean restricted John build");
  const paths = [
    "index.html",
    "john-preview.json",
    ...files(join(source, "assets")).map((path) => `assets/${path}`),
  ];
  if (
    !readFileSync(join(source, "index.html"), "utf8").includes(
      "/slander/demo-shared-with-john/assets/",
    )
  )
    throw new Error("Expected John's isolated asset base");
  return paths;
}
export function assertJohnChange(destination, path, source, staged) {
  if (!source || !expected(source).some((item) => prefix + item === path))
    throw new Error("John change is outside the approved restricted build");
  const relative = path.slice(prefix.length);
  const desired = readFileSync(join(source, relative));
  const current = staged
    ? git(destination, "show", `:${path}`)
    : readFileSync(join(destination, path));
  if (!current.equals(desired))
    throw new Error("John entry differs from the approved restricted build");
  // Preserve all previously published content-addressed assets for open tabs.
  if (
    relative.startsWith("assets/") &&
    git(destination, "ls-tree", "HEAD", "--", path).length &&
    !git(destination, "show", `HEAD:${path}`).equals(desired)
  )
    throw new Error("Cannot overwrite a frozen John asset");
}
export function stageJohn(source, destination) {
  const target = join(destination, "demo-shared-with-john");
  if (!existsSync(target)) throw new Error("Missing existing frozen John site");
  files(target);
  for (const path of expected(source))
    cpSync(join(source, path), join(target, path), { recursive: true });
}
