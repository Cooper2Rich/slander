# Slander — Stories for good

[**Open the public interactive demo →**](https://cooper2rich.github.io/slander/)

The `working` branch adds a donor-first **Support projects** journey: campaign → project → existing story → simulated support → saved giving. Start at `#/support/adoption-is`, or use **Support Adoption Is** in the workspace sidebar. Compact navigation and media-led browse cards retain Blue Ripple Media branding. Small keyboard-accessible **Video**, **CTR**, **Impressions**, and **Ad spend** tabs separate story playback, sample performance and locally saved support. Reach and actual ad spend remain N/A; live donations, payments, Meta and TikTok connections are unavailable. [Donor demo walkthrough and metric definitions](docs/DONOR-DEMO.md).

The isolated working publication targets **https://cooper2rich.github.io/slander/working/**. Its assets, browser storage and media database are separate from the main URL and John’s frozen snapshot. The working-only workflow preserves the frozen John snapshot and main application, while adding the approved **John — Frozen demo** and **Working — Editable demo** links to the main page. Its guard permits only that exact main-page label bar outside `working/`, and it uses the existing protected Pages environment. That environment must explicitly allow `working` before a deployment can succeed; preparing or pushing source alone does not confirm that the link is live. [Build, publication and preservation checks](docs/WORKING-PREVIEW.md).

No installation or sign-in required. The public demo opens directly to a **compact ad grid**: four cards across on desktop, adapting to three, two or one on smaller screens. Play full videos with sound in the grid, hover anywhere on an ad for its first five seconds on repeat, or select an ad name for its profile. Each card shows the ad name, illustrative impressions/CTR/donations and **Fund ad spend**. Create a separate **viewer profile** to simulate contributions and keep a giving history. Profiles and contributions stay in this browser; there are no passwords, external sign-ins, real charges, or live ad purchases.

The refined public demo includes short ad descriptions and support prompts, creator/campaign search, and a **Leaderboard** with an independent top 25 for each campaign. The October 24 PRD weights are impressions 40%, total link clicks 30%, and funds raised 30%. Components use capped square-root normalization against disclosed, user-approved demo targets: 50,000 impressions, 2,000 clicks and $2,500 raised. Unrounded scores break ties by total clicks, funds raised, then impressions; exact ties share a rank. CTR and ad-spend contributions do not count. The Current leaderboard has Daily and Weekly views with impressions, total links clicked, funding, scores and provisional leader highlights. Daily and Weekly leaderboards automatically update their simulated metrics and rankings every ten minutes. A visible minutes-and-seconds countdown uses the same schedule, resets after each update, and keeps its deadline when switching periods. Delayed browser timers catch up to that schedule. Past winners has separate dropdowns for seven completed days and four completed weeks; saved fictional winners remain fixed, including exact ties. The demo uses UTC days and Monday-to-Sunday weeks, with weekly totals through today. Period selection survives refresh and keeps the campaign filter. Missing daily evidence stays unranked. These are illustrative winners, not live results or payout authorizations. The sample catalog has six ranked ads. Public, Admin, Campaign Owner and Creator views share compact dark panels, styled native dropdowns, and brand-blue controls. Admin and Campaign Owner creatives use full-width rows with muted five-second video previews that repeat until the cursor leaves, creator bylines and searchable ad/campaign names. The sidebar keeps a single profile avatar at the top.

The featured **Nocturne Coffee** collection includes three **16.4-second** ads made from real filmed coffee footage, with ambient audio. Filter by **Coffee & culture**, or switch to Creator and select **Nocturne Studio · fictional** to see all three under My ads. The public demo uses the supplied **Blue Ripple Media** logo, with black backgrounds, white text and the exact blues sampled from its artwork. Compact header/sidebar lockups and the favicon reuse the original monogram and lettering; controls and accents share its blue palette with contrast-checked text. [Asset files, footage credits and rebuild notes](docs/COFFEE-DEMO-ASSETS.md).

**Adoption Is → ACU ad competition** contains **The Girl in the Middle**, the supplied original 60-second ad with audio. Duality has been removed from the project and public ad catalog. Filter Discover ads by **Adoption**, or open the campaign as Admin for its project and creatives. Existing browser workspaces receive the import once without replacing their records. The Girl in the Middle is credited to **Yakira**. Its illustrative weekly metrics are **40,000 impressions, 1,600 clicks and $2,000 raised**; the sample ad-fund allocation records **$200 in creator earnings**. It appears in Adoption Is�s current daily and weekly leaderboards using the PRD score. [Sources and import notes](docs/ADOPTION-DEMO-ASSETS.md).

Use **Preview as** to explore the workspaces. Creators have **My ads**, **Past ads**, **Earnings** and **Projects**. Earnings shows their recorded 10% ad-fund commissions, earnings by ad, existing cause-gift commissions, amounts awaiting payout and completed payouts. The My ads summary links to earnings, and each ad shows its own recorded earnings. Past ads retain their own withdrawn ads and ads from ended, archived or unpublished projects, with search, playback and read-only details. Earnings remain available when an ad leaves discovery. Campaign Owners see their own projects and submit **Project requests** to Admin; they cannot browse internal campaigns. Admin creates campaigns, reviews requests and assigns approved draft projects to a campaign. Projects, ad spending and archived projects sit inside that campaign's sidebar; the main Admin archive contains campaigns. Archiving and restoring a campaign preserves its project statuses, ads and funds. Project setup pricing remains undecided, so newly approved projects cannot publish or incur a setup charge.

Admin **Funding** compares illustrative daily campaign growth and saved ad-fund contributions, with a separate application-fee sort. Each campaign shows its application fees accrued, paid to the application and outstanding; the summary shows the same totals. New contributions allocate **10% to the creator, 5% for application use and 85% to the nonprofit**, with integer-cent rounding recorded per contribution. Historical contributions keep their original allocations. Allocated amounts and completed payments are distinct; sample creator payouts and application payments are enabled by default, while saved contributions have no completed transfers. Public support copy states the creator's 10% share. Legacy cause-gift and seed records remain separate and are available to Admin through the associated campaign. Uploads, revisions, scoped exceptions, creator project terms, tracked simulated gifts and sample statements remain available. These public-demo changes do not amend the PRD or change the local backend's navigation and permissions.

**Sample financial activity** populates creator and Admin views on first load and upgrades existing browsers once without changing their contributions, ads or history. Nocturne Studio shows $1,040 earned, $600 paid and $440 awaiting payout; its campaign shows $520 in application fees, $340 paid and $180 outstanding. Across the sample campaigns, application fees total $1,405, including $890 paid and $515 outstanding (including the Adoption Is sample). Compact payment histories label every payment as fictional. Uncheck **Include sample activity** to view saved contributions alone; the preference is shared across earnings and Admin funding. These samples create no viewer profiles, donation votes, public ranking changes or real transfers.

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

The GitHub Pages demo automatically builds and deploys from **main** through [Publish public demo from main](.github/workflows/public-demo.yml). Every push to main runs the domain tests and `npm run build:public` before publishing the generated site. The workflow can also be run manually from Actions on main. GitHub Pages uses the workflow deployment; `gh-pages` retains generated assets as an archive, not the application source. The staging helper restores and retains historical hashed JS/CSS so already-open tabs can still load lazy modules after publication. Do not delete old assets during deployment. If a required module fails to load, **Reload demo** requests the latest entry point while preserving the route, saved profiles, contributions and browser media; ordinary workspace errors retain **Try again**.

Public discovery and simplified workspaces reuse project, eligibility, revision, scope and exception domain modules through browser adapters. Fictional records live in localStorage; uploaded media lives in IndexedDB. Nothing connects to the local API, database or files. Rebuild the filmed coffee ads with `node scripts/generate-coffee-videos.mjs`; source footage and credits are recorded in `scripts/coffee-footage.mjs`. Verify desktop/mobile workflows with `npm run test:public`. Clearing this site's browser storage starts a fresh fictional workspace.

Data persists in `data/slander.sqlite`; uploads stay in `data/uploads`. `SLANDER_DATA_DIR` selects an isolated directory. Never delete data to refresh the demo. Startup migrates existing records and retains identifiers. Showcase initialization is explicit, never a startup side effect.

```sh
npm run check
npm run test:e2e
npm run format:check
node --test tests/marketplace.test.js tests/finance.test.js tests/analytics.test.js tests/showcase.test.js
```

Browser checks use isolated SQLite data and desktop/mobile Chromium. Tests never run against the user's `data/` directory.

The broader [Slander Rebuild PRD 2.2](outputs/Slander-Rebuild-PRD.md) records product intent. [Revision log](outputs/Slander-Rebuild-PRD-Changes.md) and [original PRD](docs/PRD.md) provide context; a document audit does not prove runtime or production readiness.
