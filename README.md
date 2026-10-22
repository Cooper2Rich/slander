# Slander — Stories for good

Slander is being developed into an external campaign marketplace where nonprofits and businesses run cause campaigns, creators promote eligible campaigns, and public donations fund nonprofit beneficiaries.

**The current application is a local demo.** It implements projects, creator submissions, manual nonprofit review, project-specific Instagram username pairing, and content export. The marketplace, automatic eligibility, crowdfunding/accounting, and official performance grade below are requirements for the next implementation; they are not features already available in the demo.

## Current specification

The [Slander Rebuild PRD, version 2.2](outputs/Slander-Rebuild-PRD.md) is the source of truth for current product requirements. See the [revision log](outputs/Slander-Rebuild-PRD-Changes.md) for the decisions and removed redundancies, and the [documentation audit](outputs/Slander-Rebuild-PRD.audit.json) for specification checks. That audit does not establish passing application behavior or live-launch readiness.

The [original PRD](docs/PRD.md) records earlier product intent. The [demo scope](docs/DEMO.md) describes the existing implementation against that earlier intent. Neither overrides the current rebuild PRD.

## Required product behavior

- **Fixed creator commission:** 10% of each eligible completed attributed donation's gross amount before processor fees, with the remaining 90% allocated to the nonprofit before fees. Refunds and eligibility corrections follow the PRD. Creating an ad, obtaining views, or receiving clicks alone earns no commission.
- **Crowdfunding:** Public supporters contribute to nonprofit campaigns. Businesses can own or sponsor cause campaigns with an explicit nonprofit beneficiary.
- **Separate funding purposes:** Public donations, seed support, and advertising funds remain separate. Seed can support configured minimum guarantees and a separately recorded app-use payment. A dollar cannot fund two purposes, and advertising costs cannot silently consume the protected donation allocations.
- **Automatic eligibility:** Creators accept published campaign terms and receive deterministic participation/content checks without routine organizational sign-off. Owners configure campaign and channel rules once. Appeals, substantiated complaints, and unresolved evidence conflicts use exception handling. Platform ad reviews and account authorization remain separate requirements.
- **Incremental implementation:** Extend the current React, Express, and SQLite application while preserving existing records, identifiers, media, and working scope controls.

### Official performance grade

All four metrics are required by policy `grading-v2`:

| Metric                            | Weight |
| --------------------------------- | -----: |
| Outbound click-through rate (CTR) |    15% |
| Views                             |    10% |
| Donation-linked votes             |    35% |
| Donation amount                   |    40% |

REQ-215 in the current PRD defines the full calculation: frozen cohort-specific targets, smoothed CTR, capped square-root volume components, and comparable channel/exposure windows. Missing configuration, incomplete metrics, or insufficient evidence produces an unavailable/provisional grade with reasons. Unknown data must not be converted to zero or dropped from the formula. Refunds and invalid-traffic corrections retain an audit trail.

Grades cannot change or withhold the fixed 10% commission or minimum guarantees. Any additional performance bonus requires its own earmarked funding and published allocation rules. The demo's approved-post-count leaderboard is a different feature and does not implement this grade.

## Implementation status

| Area                       | Working local demo                                                       | Required by PRD v2.2                                                                                                           |
| -------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ |
| Campaigns                  | Nonprofit projects with scoped Admin, Non-Profit, and Creator views      | Multi-organization offers, business owners/sponsors, explicit nonprofit beneficiaries, and immutable terms                     |
| Creative workflow          | Manual approve/request-changes/decline after basic checks                | Automatic eligibility, revision-bound snapshots, and exception-only human handling                                             |
| Distribution               | Instagram username pairing and manual JSON/media handoff                 | Channel-specific distribution records and deterministic initial exposure planning for Instagram, Facebook, TikTok, and YouTube |
| Funding and accounting     | Not implemented                                                          | Locally simulated crowdfunding, separate seed/media pools, a 10% commission ledger, refunds, and bounded budget reservations   |
| Grading                    | Approved-post counts only                                                | Official four-metric grade with evidence/configuration gates                                                                   |
| Settlement                 | Not implemented                                                          | Reconciled weekly previews and exports; simulation is clearly labeled and export never means paid                              |
| Identity and private media | Selectable demo identities; upload paths lack private-access enforcement | Scoped private-media ownership/retrieval; verified sessions and memberships before hosted/live use                             |

The next phases demonstrate the full workflow locally with simulated transactions and metrics. No third-party provider has been selected or connected. Real ad delivery, donation collection, creator transfers, and verified social metrics remain later integration gates. There is no requirement to choose an external provider merely to build the local model. Financial and performance simulation features still need implementation.

## Run

Use Node.js **24 or later** (the server uses built-in SQLite).

```sh
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To build and serve the compiled application locally:

```sh
npm run build
npm start
```

The server binds to `127.0.0.1`. Set `PORT` to use a different port.

## Try the current demo

These steps describe the code available today, including its legacy manual review. PRD v2.2 replaces that review with automatic eligibility in the planned implementation.

1. In **Admin View**, open a sample project or create a new one. Assign its nonprofit, set its status to **Published**, and choose dates that include today to accept submissions.
2. Select **Creator** in the top bar, then choose a creator profile or create a demo profile. Open a published project and select **Submit a post**. Upload an image/video or use a sample, write a caption, and confirm the media rights.
3. Select **Non-Profit**, choose the project's nonprofit, and open the submission or visit **Review inbox**. The selection screen shows no project data until an organization is chosen.
4. Approve the post, request changes, or decline. Changes and declines require feedback. In Creator view, the selected creator can edit and resubmit their own pending posts or requested changes.
5. As Admin or the project's nonprofit, open **Add Instagram account** when you have the nonprofit's account. Enter its username or profile URL. This pairing applies only to that project and persists after refresh/restart.
6. An approved photo or reel with passing submission checks and a paired account becomes ready for handoff. Download its approved details and creative from the review dialog.

## Current demo views

| View       | Visible data                                                                                                             | Available actions                                                                                                    |
| ---------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Admin View | Every project, submission, approved post, and activity entry                                                             | Create and assign projects; manage settings and Instagram; submit, review, and export posts                          |
| Non-Profit | Only projects, submissions, approvals, and activity for the selected organization                                        | Manage its projects and Instagram pairing; review and export its posts; cannot create or reassign projects           |
| Creator    | Published projects; the selected creator's submissions and review feedback; public approved posts and a demo leaderboard | Submit to published projects and revise their own work; no project, account, approval, handoff, or activity controls |

**Published** is the user-facing label for the existing `active` project status. Draft and archived projects are hidden from creators, and dates independently control whether submissions are open. The creator review inbox includes pending posts and changes requested. The demo leaderboard ranks creators by approved-post count, with ties sharing a rank; it does not claim engagement or fundraising performance.

Use **Change nonprofit** or **Change creator** in the sidebar to choose a different profile. Switching into either view or reloading requires selection again. Existing data is preserved and receives stable nonprofit/creator IDs on startup.

The role switch and profile selectors are **demo controls, not authentication**. The API enforces the selected scope, but these request headers are user-selectable. Before deployment, replace them with an authenticated server session and authorize media access. Sample organizations and creators are fictional. Basic submission checks verify required fields, media/format compatibility, and a rights confirmation; they do not perform image moderation or enforce Meta policies.

Pairing records a project’s Instagram destination. It **does not authorize access to Instagram**. Live OAuth, account ownership verification, token storage, and publication are not implemented. Posts are never labeled as published or sent externally. Payments, donations, commissions, and performance rankings are not implemented in this demo; their required local simulation and accounting behavior is defined in the current PRD.

## Storage

SQLite stores projects, account pairings, posts, review revisions, and activity in `data/slander.sqlite`. Uploaded media lives in `data/uploads/`. Both are ignored by Git. The server seeds sample projects only when creating a new database.

`SLANDER_DATA_DIR` overrides the data location. `SLANDER_EMPTY=1` starts a **new database** without sample projects. Existing data is preserved. Back up the data directory with the server stopped when moving the demo.

## Development checks

The existing suites exercise the current demo, including its manual review behavior. The new marketplace, automatic eligibility, finance, and grading acceptance cases in the PRD still require implementation and tests. Running these commands alone does not establish compliance with all of PRD v2.2; no fresh passing application test run is claimed by this README update.

```sh
npm run check
npx playwright install chromium
npm run test:e2e
npm run format:check
```

`npm test` runs HTTP integration tests for pairing isolation and persistence, approval and handoff gates, revision history, stale reviews, role restrictions, organization scoping, creator ownership, project dates, validation, and uploads. Playwright tests the real production build at desktop (1440 × 1050) and mobile (390 × 664 CSS pixels, iPhone 13 profile) sizes. It exercises profile selection and switching, private-project and control visibility, personal submissions, project creation, file upload, feedback, revision, approval, pairing, reload persistence, export, search, filters, keyboard close, and horizontal overflow. Browser tests use a separate server and database, never the default demo data.

## Implementation

- React + TypeScript + Vite, with responsive CSS and accessible native dialogs.
- Express API, server-side Zod validation, local media uploads, and SQLite transactions.
- Server-enforced review transitions and optimistic post revisions prevent stale decisions from silently replacing another review.
- A downloadable JSON handoff records the caption, destination, media path, and approval history. Download the media separately; the JSON is not a portable media archive.

Follow the [current rebuild PRD](outputs/Slander-Rebuild-PRD.md) for future changes. Preserve the existing stack and data while replacing routine manual approval with the specified automatic eligibility workflow; add local simulation before enabling external effects.

## Visual assets

Sample photography is served locally from `public/images/`, sourced from Unsplash:

- [Forest](https://images.unsplash.com/photo-1441974231531-c6227db76b6e)
- [Community food](https://images.unsplash.com/photo-1547592180-85f173990554)
- [Education](https://images.unsplash.com/photo-1503676260728-1c00da094a0b)
- [Gardening](https://images.unsplash.com/photo-1416879595882-3373a0480b5b)

DM Sans and Manrope use Google Fonts with system fallbacks. Icons use Lucide plus a small inline Instagram outline.
