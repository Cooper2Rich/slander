import { execFileSync } from "node:child_process";
import {
  cpSync,
  mkdtempSync,
  readFileSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";

// Keep John's original application and assets; apply only the approved role restriction.
export const frozenRevision = "47c3b75688110d1b9a8b7111dd46c1f252cc8ccb";
const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();
if (git("branch", "--show-current") !== "working")
  throw new Error("John preview changes must originate on working");
const sourceCommit = git("rev-parse", "HEAD");
const dirty = Boolean(git("status", "--porcelain", "--untracked-files=normal"));
const temporary = mkdtempSync(join(tmpdir(), "john-preview-"));
const snapshot = join(temporary, "source");
function patch(path, before, after) {
  const target = join(snapshot, path);
  const source = readFileSync(target, "utf8");
  if (source.split(before).length !== 2)
    throw new Error(`Frozen source no longer matches expected patch: ${path}`);
  writeFileSync(target, source.replace(before, after));
}
try {
  const archive = join(temporary, "source.tar");
  execFileSync("git", [
    "archive",
    "--format=tar",
    "--prefix=source/",
    `--output=${archive}`,
    frozenRevision,
  ]);
  // Extract generated build input, never check out or edit another source branch.
  execFileSync("tar", ["-xf", archive, "-C", temporary]);
  if (
    readFileSync(join(snapshot, "package-lock.json"), "utf8") !==
    readFileSync("package-lock.json", "utf8")
  )
    throw new Error(
      "Frozen dependencies differ; install and review them separately",
    );
  symlinkSync(
    resolve("node_modules"),
    join(snapshot, "node_modules"),
    process.platform === "win32" ? "junction" : "dir",
  );
  patch("src/App.tsx", '<option value="admin">Admin View</option>', "");
  patch(
    "src/public-demo/PublicApp.tsx",
    '<option value="admin">Admin View</option>',
    "",
  );
  patch(
    "src/useDemoWorkspace.ts",
    '["admin", "nonprofit", "creator"].includes(selected.role)',
    '["nonprofit", "creator"].includes(selected.role)',
  );
  patch("src/useDemoWorkspace.ts", ': "admin",', ': "nonprofit",');
  patch(
    "src/useDemoWorkspace.ts",
    "const setRole = (role: Role) => {",
    'const setRole = (role: Role) => {\n    if (role !== "creator" && role !== "nonprofit") role = "nonprofit";',
  );
  patch(
    "src/public-demo/PublicApp.tsx",
    "  localStorage.setItem(",
    '  if (role !== "creator" && role !== "nonprofit") role = "nonprofit";\n  localStorage.setItem(',
  );
  // Role preferences are separate so another demo's saved Admin role cannot reopen it.
  for (const path of [
    "src/useDemoWorkspace.ts",
    "src/public-demo/PublicApp.tsx",
  ]) {
    const target = join(snapshot, path);
    writeFileSync(
      target,
      readFileSync(target, "utf8")
        .replaceAll(
          '"slander-public-access-v1"',
          '"john:slander-public-access-v1"',
        )
        .replaceAll('"slander-role"', '"john:slander-role"'),
    );
  }
  patch(
    "src/App.tsx",
    '<Route path="/funding" element={<AdminFunding />} />',
    '<Route path="/funding" element={<Navigate to="/projects" replace />} />',
  );
  patch(
    "src/App.tsx",
    "Admin manages campaigns, project requests and funding. Campaign owners request projects for Admin review; pricing remains pending. Open a campaign as Admin for its projects, ad spending and archived projects.",
    "Choose Campaign Owner to explore campaign projects, ad spending and archived projects. Pricing remains pending.",
  );
  patch(
    "src/App.tsx",
    "Admin handles evidence-linked holds and appeals.",
    "Evidence-linked holds and appeals are handled separately from this preview.",
  );
  patch(
    "src/App.tsx",
    "Admin Funding separates allocations from payouts.",
    "Allocations and payouts remain simulated.",
  );
  patch(
    "vite.public.config.ts",
    'base: "/slander/",',
    'base: "/slander/demo-shared-with-john/",',
  );
  execFileSync(
    process.execPath,
    [
      resolve("node_modules/vite/bin/vite.js"),
      "build",
      "--config",
      "vite.public.config.ts",
      "--mode",
      "public",
    ],
    { cwd: snapshot, stdio: "inherit" },
  );
  const output = join(snapshot, "public-site");
  renameSync(join(output, "public-demo.html"), join(output, "index.html"));
  const html = readFileSync(join(output, "index.html"), "utf8").replace(
    /<title>[^<]*<\/title>/,
    "<title>Demo Shared with John</title>",
  );
  writeFileSync(join(output, "index.html"), html);
  writeFileSync(
    join(output, "john-preview.json"),
    JSON.stringify(
      {
        sourceRevision: frozenRevision,
        roleRestrictionCommit: sourceCommit,
        dirty,
        allowedRoles: ["public", "nonprofit", "creator"],
      },
      null,
      2,
    ) + "\n",
  );
  cpSync(output, resolve("john-site"), { recursive: true });
} finally {
  if (!resolve(temporary).startsWith(resolve(tmpdir()) + sep))
    throw new Error("Unexpected temporary path");
  rmSync(temporary, { recursive: true, force: true });
}
