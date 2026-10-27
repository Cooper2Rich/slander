import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

const branch = execFileSync("git", ["branch", "--show-current"], {
  encoding: "utf8",
}).trim();
if (branch !== "working")
  throw new Error("The working preview must build from working");
const commit = execFileSync("git", ["rev-parse", "HEAD"], {
  encoding: "utf8",
}).trim();
const dirty = Boolean(
  execFileSync("git", ["status", "--porcelain"], { encoding: "utf8" }).trim(),
);
execFileSync(process.execPath, ["scripts/build-public.mjs"], {
  stdio: "inherit",
  env: { ...process.env, PUBLIC_DEMO_BASE_PATH: "/slander/working/" },
});
writeFileSync(
  "public-site/working-preview.json",
  JSON.stringify(
    {
      branch,
      commit,
      dirty,
      base: "/slander/working/",
      storagePrefix: "working:",
    },
    null,
    2,
  ) + "\n",
);
