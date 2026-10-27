# Isolated working preview

Target: `https://cooper2rich.github.io/slander/working/`. This is separate from the main `/slander/` site and the frozen `/slander/demo-shared-with-john/` site. A target URL is not a confirmation of successful deployment; inspect the workflow and the public `working-preview.json` before declaring it live.

All source changes live on `working`. The working-only workflow uses the existing `public-demo-pages` concurrency group, fetches the latest complete generated `gh-pages` archive after its checks, and merges build output only into `working/`. It preserves old working hashed assets for open tabs. The staging and staged-change guards reject changes outside `working/`; the main index blob and John subtree hashes are reported in the job summary. The full preserved archive is deployed so sibling sites remain available. No main source merge, new video, payment or advertising connection is required.

## Protected publication gate

The inspected `github-pages` environment has custom branch restrictions permitting only `main`. The workflow deliberately retains that environment. An explicitly approved addition of the exact `working` branch is needed for its job to deploy. Do not remove `main`, allow wildcards, disable protection, create an unprotected environment, expand credentials or bypass this gate. The workflow permissions match the existing Pages publisher: contents write, Pages write and OIDC token write for the guarded deployment job.

## Build and isolation

`npm run build:working` requires the exact local `working` branch and builds assets with `/slander/working/`. It emits `working-preview.json` recording the source commit, branch, base and storage prefix. The visible notice says **Working preview** and its source link points at `working`.

Every app localStorage access uses `previewStorageKey`, which prefixes `working:` only for the working build. The media database uses `working:slander-public-media-v1`. Main/John storage is never copied, read as a fallback, migrated or cleared. Existing original build behavior is retained when the base is `/slander/`.

`npm run test:working` builds and verifies desktop/mobile navigation, sample metric tabs, simulated giving persistence, role/history isolation, and private video reads from the working IndexedDB while retaining a sentinel in the main media store. `tests/working-preview.test.js` checks key namespacing and generated-archive preservation, including rejection of root changes. The original `npm run test:public` exercises the unchanged default-base behavior. Use separate output directories and do not rebuild a served directory during an active browser suite.

For local working review, build first, then run `scripts/preview-public.mjs` with `PUBLIC_DEMO_BASE_PATH=/slander/working/` and a free `PUBLIC_DEMO_PORT`. The working browser suite uses port 3300. To verify the live deployed preview, set `WORKING_PREVIEW_BASE_URL` to the public working URL and run Playwright with `playwright.working.config.ts`.
