# Slander demo implementation scope

The 25 September 2026 request authorizes implementing a working web demo from the PRD, focused on pairing a nonprofit’s Instagram account per project and approving posts. It supersedes the original document-only restriction for this implementation. The original PRD remains unchanged as the broader product intent.

## Included behavior

| PRD intent                     | Demo implementation                                                                                                                                                                                          |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| REQ-001: mobile web            | Responsive project, submission, review, and handoff views, tested at desktop and mobile sizes.                                                                                                               |
| REQ-003: configured dates      | Stored exact start/end dates, shown on the project. Only active projects within their UTC calendar dates accept submissions.                                                                                 |
| REQ-004: open submissions      | Any demo creator can submit without an invitation. Every submission enters review.                                                                                                                           |
| REQ-005: prepublication checks | Versioned deterministic checks for rights confirmation and media/format compatibility, alongside server field validation. These are basic demo checks, not policy moderation. Failed checks block approval.  |
| REQ-006: format proposals      | Photo/reel creatives and story/carousel/other proposals are retained. Only individual photos/reels can enter the demo handoff workflow. This is not a verified Instagram API capability matrix.              |
| REQ-007: per-project account   | Each project can store one normalized Instagram username. Account fields can remain empty until later. Saving a username pairs the destination; it does not verify ownership or authorize Meta API access.   |
| Approval workflow              | Nonprofit administrators approve, request changes, or decline. Feedback is required for changes and decline. Revisions rerun checks and require a new review. Review history and workspace activity persist. |
| Handoff                        | Approval, passing checks, supported demo format, an account pairing, and a non-archived project are all required to export approved post details. Removing the pairing blocks handoff immediately.           |

## Deliberately deferred

- Live Instagram authorization, account verification, access-token handling, posting, and publishing retries. No external publication calls exist in this demo.
- Paid advertising versus organic distribution and platform-specific format validation.
- Donation collection, attribution, commissions, payouts, voting, rankings, and winners.
- Production sign-in, verified nonprofit membership, authenticated creator identity, media authorization, and moderation policy. Demo role/profile choices are explicit; the API scopes data and mutations to those choices, which will later come from authenticated sessions.
- Production storage, media transcoding, asynchronous processing, and deployment.

The demo supports manual review without an Instagram account. Approval is not publication. Export produces a handoff package and never marks a post as live.

## Demo access rules

- **Admin View:** full workspace visibility, project creation and assignment, project settings, submission administration, approvals, and handoff.
- **Non-Profit:** organization selection is mandatory before project data is displayed. Only that organization's projects, posts, and activity are returned. It can manage project content, publication state, dates, and Instagram pairing, and review its submissions. It cannot create or reassign projects.
- **Creator:** a selected demo creator sees published (`active`) projects, only their own submissions and review feedback, and approved public creatives across published projects. Other creators' private review history is excluded. Creators cannot see project settings, Instagram configuration, handoff readiness, or activity, and cannot review posts or edit another creator's work.
- The creator leaderboard uses actual approved-post counts in the demo. Equal counts share a rank. It does not implement the PRD's performance/fundraising ranking formula.
- Organization and creator identities have stable IDs. Startup migrates existing projects and submissions without replacing user-created data. New projects with the same normalized nonprofit name belong to the same organization.
- Switching profiles clears the current view immediately. Responses from a previously selected scope cannot repopulate the next scope. Re-entering Non-Profit or Creator and reloading require a fresh selection.

These restrictions model the intended behavior, but the demo selectors are not authentication. API headers are deliberately selectable for demonstration. The later auth layer must supply and verify the role, nonprofit membership, and creator identity on the server.

## Later integration boundary

The Instagram connection belongs to a project and its nonprofit. A later real integration should verify the authenticated nonprofit administrator, perform Meta OAuth, confirm account identity, and store credentials on the server. Keep the existing review revision and policy gates before introducing any publishing worker. A handle entered into this demo must never be treated as OAuth consent or proof of account ownership.

## Architecture

- `server/domain.js`: input rules, project calendar eligibility, review transitions, submission checks, and handoff gates.
- `server/access.js`: identity migration, nonprofit/project scoping, creator ownership, and public approved-post projections.
- `server/store.js`: SQLite transactions around persistent workspace data.
- `server/app.js`: JSON API, demo-role gates, uploads, pairing, and export.
- `src/pages/`: projects, project detail, reviews/submissions, and activity.
- `src/components/`: project/account settings, submission editor, review dialog, shared presentation.
- `src/useDemoWorkspace.ts`: profile selection and responses scoped to the current view.

Data remains on this computer. No credentials, payments, or Instagram API requests are needed to demonstrate the workflow.
