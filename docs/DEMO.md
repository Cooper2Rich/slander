# Slander local demo

Public visitors can open the [GitHub Pages interactive preview](https://cooper2rich.github.io/slander/). It uses the same campaign screens with a browser-only fictional adapter, a hash router and no server connection. Terms/sample creative/giving/report/export interactions are illustrations stored separately in each visitor's browser. The full domain accounting and eligibility evidence described below belong to the local Express/SQLite version. The public preview never publishes the user's local workspace or private uploads.

The current scope follows the user's instruction: this is a demo and not every aspect needs to function. The working core journey is discovery → frozen terms/consent → sample creative → automatic eligibility → tracked local gift → reports → exportable current sample week preview. See the README for exact click steps.

## Visible capabilities

| Area               | Working behavior                                                                                                                                                                                                                                                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Workspaces         | Admin, Campaign Owner, Creator; explicit organization/profile selection and scoped API access. Selectors are demo access, not sign-in.                                                                                                                                                                                                           |
| Campaigns          | Open offer discovery, campaign details, fixed 1,000bps USD terms, dates, attribution window, creator acceptance.                                                                                                                                                                                                                                 |
| Creative           | Automatic versioned deterministic eligibility, immutable snapshots/revisions, evidence-linked holds/appeals. No routine manual approval. Existing upload/sample submission editor and library remain.                                                                                                                                            |
| Sharing            | The showcase creates an organic Instagram feed distribution bound to the eligible revision and frozen terms, then an opaque first-party local link. This is local handoff, not a social post.                                                                                                                                                    |
| Giving             | Public page works without choosing a private identity. Positive USD amounts become immutable intents; confirmation uses shared contribution/capture/settlement operations. A tracked $100 gift yields $10/$90 before zero fixture fees and one vote. Confirmation replay cannot duplicate money. Unresolved attribution is shown as unallocated. |
| Funding            | Explicit fictional settled $600 seed-guarantee pool and $400 media pool. Public proceeds, creator commission and restricted funds stay separate. Initialization creates no guarantee promise, ad spend or creator payout.                                                                                                                        |
| Performance        | Journal-derived donation votes and proceeds. Unknown outbound metrics/cost ratios show N/A. Actual grade remains provisional. Separately labeled grading-v2 example scores 77.5 using shared formulas, with fixed 15/10/35/40 weights.                                                                                                           |
| Settlement         | Admin exports a JSON sample statement computed from shared current-week facts for Alex River. Accrual, settled availability, holds and prior payments are separate. The sample week cutoff is still in the future: no approved batch or simulated/real transfer is created.                                                                      |
| Existing workspace | Projects, scoped settings, Instagram username pairing, creator submission editor, library/counts, activity and exception handling remain usable. Username pairing is not OAuth.                                                                                                                                                                  |
| Media and tracking | Private upload retrieval is scoped; public media checks fresh eligibility including immediate participation suspension. Seven-day visitor cookie expiration renews on visits while keeping the same visitor ID.                                                                                                                                  |

## Explicit fictional setup

Admin action: `POST /api/demo/showcase` with `x-demo-role: admin` and `{}`. It appends stable IDs under `fictional-river-showcase-v1`. A second call returns `created:false` and does not add funding again. It never deletes or replaces existing projects, posts, identities or media. All initialized identities and funding are fictional. Showcase terms are active from seven days before setup until ninety days after setup; initialize a new designed scenario if demonstrating after that offer has ended rather than resetting historical records.

`GET /api/demo/showcase` returns readiness and IDs. Creator shortcut `POST /api/campaigns/:id/sample-creative` uses approved sample bytes, shared submission/snapshot/evaluation and selected identity. Consent is recorded through normal `/consent`; the sample shortcut does not manufacture participation. `POST /api/campaigns/:id/demo-link` uses shared distribution/link operations and enforces creator ownership. `/r/:token` must be visited through an ordinary anchor so Express records the click before redirecting to public giving.

`POST /api/demo/sample-statement` is Admin-only and limited to the fictional campaign. It defines an exact current seven-day UTC sample period and returns the shared creator statement with a disclosure. This is an exportable preview, not a backdated/closed settlement or a future-clock payout simulation.

The browser keeps the legacy internal `nonprofit` option for compatibility and stores/maps it to `owner`; API requests use `x-demo-role: owner` plus `x-demo-organization`. Legacy nonprofit headers remain a compatibility alias server-side. Original records keep stable IDs.

## Existing domain APIs and deliberate limits

The accepted backend includes explicit organization ownership/beneficiaries, frozen offers, consent, distribution gates, source evidence/replay handling, balanced integer-cent journal, bounded restricted reservations/spend, finite seed promises/app-use, weekly manifests and simulated results, economics and evidence/configuration-gated grading. Their regression suites remain part of `npm run check`. The demo UI does not expose exhaustive forms for every API operation.

No live effects are available: no donation collection, payment-provider credentials, payouts, social OAuth/posting, ad buying, or verified external metrics. The UI honestly disables live controls. Fair initial exposure scheduling is a local API preview; comprehensive opportunity verification and advanced configuration UI are deferred. An illustrative score cannot pay a bonus or buy advertising. The 77.5 sample is not presented as observed campaign performance or causal impact.

The earlier approved-post-count leaderboard is an eligibility-count feature, not the performance grade. Other creators' private evidence/history is excluded from public projections. The public giving projection includes only campaign presentation fields.

## Architecture and checks

`server/demo-showcase.js` composes existing domain operations for the explicit fictional scenario. `src/pages/Campaigns.tsx` provides discovery/details, funding/performance/statement tabs and the public giving screen. Existing pages remain in their established shell.

`tests/showcase.test.js` verifies append-only idempotence and original-record preservation, restricted pool amounts, consent → eligibility → tracked gift, cookie renewal, replay-safe confirmation, current-week statement, role scope, grade arithmetic and immediate public-media suspension. `tests/browser/marketplace.spec.ts` clicks the visible desktop/mobile core journey, confirms $10/$90/+1, checks scopes and downloads, checks overflow and records screenshots. Existing browser/unit/financial/analytics suites remain required.

All test state uses temporary or `test-results` SQLite directories. The user's `data/` is never a test fixture.
