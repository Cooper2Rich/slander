# Slander — Stories for good

[**Open the public interactive demo →**](https://cooper2rich.github.io/slander/)

No installation or sign-in required. The public demo opens to a **video discovery grid**: hover for a muted preview, click for an ad profile, see illustrative impressions/CTR/donations, and choose **Fund ad spend**. Create a separate **viewer profile** to simulate contributions and keep a giving history. Profiles and contributions stay in this browser; there are no passwords, external sign-ins, real charges, or live ad purchases.

The featured **Nocturne Coffee** collection includes three finished **16.4-second** motion ads with ambient audio. Choose **Watch coffee collection**, or switch to Creator and select **Nocturne Studio · fictional** to see all three under My ads. The public demo uses a midnight/plum/amber palette. [Asset files, generation prompts and rebuild notes](docs/COFFEE-DEMO-ASSETS.md).

Use **Preview as** to explore the workspaces. Creators have two navigation tabs: **My ads** (their own creatives, results, and archive) and **Campaigns**. Admin and Campaign Owner views include creatives, spending, archives, and activity. Project creation, uploads, revisions, scoped exceptions, campaign consent, tracked simulated gifts, reports, and sample statements remain available. These public-demo UX experiments do not amend the PRD or change the local backend's navigation and permissions.

A responsive, provider-free local campaign marketplace demo built with React, Express and SQLite. It has three selectable workspaces: **Admin**, **Campaign Owner**, and **Creator**. Role selection models scope; it is not authentication.

## Run

Use Node.js **24 or later** (built-in SQLite).

```sh
npm install
npm run build
npm start
```

Open [the campaign demo](http://localhost:3000/campaigns). Development: `npm run dev`.

## Take the working demo journey

1. In Admin view, open **Campaigns** and choose **Initialize fictional showcase**. This explicit, idempotent action appends one fictional campaign, organization, creator and $1,000 of restricted simulated funding. It preserves existing records and never resets the workspace.
2. Switch to **Creator**, choose **Alex River · fictional**, and open the Riverkind campaign in Campaigns.
3. Read and **accept campaign terms**, then **submit sample creative**. The supplied image, rights and disclosures pass deterministic automatic eligibility. No owner sign-off is required.
4. **Create tracked giving link**, then **open tracked giving page**. Confirm a simulated **$100** gift. The shared journal confirms **$10 creator / $90 nonprofit before fixture fees**, plus **one eligible gift vote**. No card details or money movement.
5. Switch to **Campaign Owner**, select **Riverkind Collective · fictional**, and inspect Funding and Performance. Seed ($600) and media ($400) are separate from public gifts. The 77.5 grading-v2 illustration is labeled and separate from campaign results.
6. In **Admin**, open Settlement and **Preview & export sample week**. This exports a JSON statement from the shared settlement engine. The current sample week has not reached cutoff; no batch is approved and no creator is paid.

Original projects, submissions, private uploads, immutable revisions, automatic eligibility evidence, and scoped exception handling remain available through the existing navigation. Legacy `nonprofit` browser preferences are mapped to the Campaign Owner API view.

## Scope and limits

This is a clickable local demo, not a claim of complete PRD 2.2 implementation. Working shared domain modules cover campaign terms/consent/distributions, first-party attribution, simulated contributions and balanced accounting, refunds/replay protection, restricted pools and bounded reservations, weekly settlement/exports, economics, and grading-v2. The visible journey intentionally uses a small coherent slice of those APIs.

The showcase supplies fictional settled funding and sample media. Reports do not invent platform performance: missing denominators show N/A; the actual grade is provisional without evidence. The **77.5** example uses shared `gradeComponents` with fixed weights CTR 15 / views 10 / votes 35 / amount 40. It cannot award money or buy ads. The $25 floor / $10 commission / $15 top-up text is illustrative; initialization creates no guarantee promise.

Live payments, payouts, OAuth, social publishing, ad delivery, production identity verification, external metric ingestion and production backend deployment are unavailable. Advanced grading configuration, exposure scheduling/opportunity verification and settlement administration remain API previews or deferred UI. Disabled live controls are labeled. [Full demo capabilities and API notes](docs/DEMO.md).

## Data and verification

The GitHub Pages demo is built with `npm run build:public`; only the generated `public-site/` assets are published to `gh-pages`. Source lives on `demo-2`. Public discovery and simplified workspaces reuse project, eligibility, revision, scope and exception domain modules through browser adapters. Fictional records live in localStorage; uploaded media lives in IndexedDB. Nothing connects to the local API, database or files. Bundled motion-story previews are generated from sample images with `node scripts/generate-preview-videos.mjs`. Verify desktop/mobile workflows with `npm run test:public`. Clearing this site's browser storage starts a fresh fictional workspace.

Data persists in `data/slander.sqlite`; uploads stay in `data/uploads`. `SLANDER_DATA_DIR` selects an isolated directory. Never delete data to refresh the demo. Startup migrates existing records and retains identifiers. Showcase initialization is explicit, never a startup side effect.

```sh
npm run check
npm run test:e2e
npm run format:check
node --test tests/marketplace.test.js tests/finance.test.js tests/analytics.test.js tests/showcase.test.js
```

Browser checks use isolated SQLite data and desktop/mobile Chromium. Tests never run against the user's `data/` directory.

The broader [Slander Rebuild PRD 2.2](outputs/Slander-Rebuild-PRD.md) records product intent. [Revision log](outputs/Slander-Rebuild-PRD-Changes.md) and [original PRD](docs/PRD.md) provide context; a document audit does not prove runtime or production readiness.
