# Slander — Stories for good

A working local web demo for nonprofit projects, creator submissions, project-specific Instagram account pairing, and post approvals.

## Run

Use Node.js **24 or later** (the server uses built-in SQLite).

```sh
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To run the production build:

```sh
npm run build
npm start
```

The server binds to `127.0.0.1`. Set `PORT` to use a different port.

## Try the demo

1. In **Admin View**, open a sample project or create a new one. Assign its nonprofit, set its status to **Published**, and choose dates that include today to accept submissions.
2. Select **Creator** in the top bar, then choose a creator profile or create a demo profile. Open a published project and select **Submit a post**. Upload an image/video or use a sample, write a caption, and confirm the media rights.
3. Select **Non-Profit**, choose the project's nonprofit, and open the submission or visit **Review inbox**. The selection screen shows no project data until an organization is chosen.
4. Approve the post, request changes, or decline. Changes and declines require feedback. In Creator view, the selected creator can edit and resubmit their own pending posts or requested changes.
5. As Admin or the project's nonprofit, open **Add Instagram account** when you have the nonprofit's account. Enter its username or profile URL. This pairing applies only to that project and persists after refresh/restart.
6. An approved photo or reel with passing submission checks and a paired account becomes ready for handoff. Download its approved details and creative from the review dialog.

## The three views

| View       | Visible data                                                                                                             | Available actions                                                                                                    |
| ---------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Admin View | Every project, submission, approved post, and activity entry                                                             | Create and assign projects; manage settings and Instagram; submit, review, and export posts                          |
| Non-Profit | Only projects, submissions, approvals, and activity for the selected organization                                        | Manage its projects and Instagram pairing; review and export its posts; cannot create or reassign projects           |
| Creator    | Published projects; the selected creator's submissions and review feedback; public approved posts and a demo leaderboard | Submit to published projects and revise their own work; no project, account, approval, handoff, or activity controls |

**Published** is the user-facing label for the existing `active` project status. Draft and archived projects are hidden from creators, and dates independently control whether submissions are open. The creator review inbox includes pending posts and changes requested. The demo leaderboard ranks creators by approved-post count, with ties sharing a rank; it does not claim engagement or fundraising performance.

Use **Change nonprofit** or **Change creator** in the sidebar to choose a different profile. Switching into either view or reloading requires selection again. Existing data is preserved and receives stable nonprofit/creator IDs on startup.

The role switch and profile selectors are **demo controls, not authentication**. The API enforces the selected scope, but these request headers are user-selectable. Before deployment, replace them with an authenticated server session and authorize media access. Sample organizations and creators are fictional. Basic submission checks verify required fields, media/format compatibility, and a rights confirmation; they do not perform image moderation or enforce Meta policies.

Pairing records a project’s Instagram destination. It **does not authorize access to Instagram**. Live OAuth, account ownership verification, token storage, and publication are not implemented. Posts are never labeled as published or sent externally. Payments, donations, commissions, and performance rankings are excluded from this demo.

## Storage

SQLite stores projects, account pairings, posts, review revisions, and activity in `data/slander.sqlite`. Uploaded media lives in `data/uploads/`. Both are ignored by Git. The server seeds sample projects only when creating a new database.

`SLANDER_DATA_DIR` overrides the data location. `SLANDER_EMPTY=1` starts a **new database** without sample projects. Existing data is preserved. Back up the data directory with the server stopped when moving the demo.

## Verification

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

See [the demo scope](docs/DEMO.md) for the relationship to the original PRD and the later Instagram integration boundary.

## Visual assets

Sample photography is served locally from `public/images/`, sourced from Unsplash:

- [Forest](https://images.unsplash.com/photo-1441974231531-c6227db76b6e)
- [Community food](https://images.unsplash.com/photo-1547592180-85f173990554)
- [Education](https://images.unsplash.com/photo-1503676260728-1c00da094a0b)
- [Gardening](https://images.unsplash.com/photo-1416879595882-3373a0480b5b)

DM Sans and Manrope use Google Fonts with system fallbacks. Icons use Lucide plus a small inline Instagram outline.
