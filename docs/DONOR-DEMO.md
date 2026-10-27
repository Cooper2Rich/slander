# Adoption Is donor demo

The `working` branch adds a public donor journey without changing existing creator, campaign-owner or admin permissions. Start with **Support projects** in public navigation, **Explore Adoption Is** above Discover ads, or **Support Adoption Is** in the workspace sidebar. The existing `#/projects` workspace continues to work.

## Walkthrough

1. Open `#/support` and choose the featured **Adoption Is** campaign.
2. Choose **ACU ad competition**. Its project organization is **Adoption Is An Option**. Watch the existing **The Girl in the Middle** by **Yakira** with its original audio.
3. Use the small **Video**, **CTR**, **Impressions**, and **Ad spend** tabs. Arrow keys, Home and End move through tabs. Open **What these metrics mean** for definitions and provenance.
4. Select **Preview support**. Create or choose a browser-only viewer profile, enter an amount, and confirm a simulated contribution. A repeated click cannot create a duplicate request. The confirmation says that no money was charged.
5. Close the dialog and inspect the locally saved support total, or open saved giving. Reload and back/forward retain saved contributions. Escape and the close control dismiss the dialog; focus returns to its opening control.
6. Use **Campaign leaderboard** to inspect the existing daily/weekly simulation. The separate creator journey remains Creator → Yakira → Open creator studio → Projects → ACU competition, or My ads → The Girl in the Middle → public ad profile → leaderboard.

## What the numbers mean

| Display                          | Meaning and source                                                                                                                                               |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sample impressions: 40,000       | The existing bundled Adoption Is weekly scenario, from `adoptionSampleMetrics`; displays can include repeat accounts.                                            |
| Reach: N/A                       | Unique accounts are not supplied or connected. Reach is not inferred from impressions or summed across ads.                                                      |
| Sample destination clicks: 1,600 | Clicks on the destination link in the same scenario. Clicks do not establish completed gifts, learning or adoption outcomes.                                     |
| Sample CTR: 4.00%                | Destination clicks ÷ impressions × 100. Missing or zero impression denominators display N/A.                                                                     |
| Simulated ad support saved here  | Browser-only viewer contributions, kept separately from the bundled performance and sample financial records. The total includes this browser's viewer profiles. |
| Actual ad spend: N/A             | The demo has no ad-buying integration or verified spend feed. Saved support is not spend.                                                                        |

Sample performance stays unchanged when simulated support is recorded. The existing leaderboard maintains its independently labeled daily and weekly simulation. No live platform data, payment or outcome verification is implied. Project descriptions come from active public project records; archived/unavailable projects do not open support controls. The public projection exposes only identifiers, campaign, name, organization, description and category, not internal project policies.

Donors fund project awareness work; viewers receive adoption education. Geographic distribution would use advertising platforms' available location controls after separate account setup and approval. This demo has no live BRM targeting and performs no sensitive audience inference.

## Production gates

**Live donation unavailable**, **Real payment unavailable**, and **Live ad spending unavailable** are disabled controls. This implementation cannot charge cards, transfer money, connect accounts or buy ads. New funding terms, targets, tax treatment and real fund use need approval. The existing simulated 10% creator / 5% application / 85% nonprofit allocation is labeled illustrative and does not establish production terms.

The main publication workflow `.github/workflows/public-demo.yml` remains unchanged and guards `refs/heads/main`. The isolated `.github/workflows/working-preview.yml` guards `refs/heads/working`, builds `/slander/working/` and updates only the generated `working/` directory before deploying the complete preserved archive. It uses the same protected Pages environment and serialized deployment group. Its deployment needs an explicit `working` environment branch allow-list entry; it never weakens that policy or creates another environment. See [working preview publication](WORKING-PREVIEW.md). No video was created or changed.

## Verification

Run `npm run check`, `npm run test:public`, and `npm run test:e2e`. The donor suite is `tests/public-browser/donor-journey.spec.ts` and covers desktop/mobile navigation, tab keyboard behavior, metric provenance/missing values, gated controls, invalid amounts, repeat confirmation, persistence, dialog dismissal/focus, browser history, unavailable records and the existing Yakira path. It also rejects external write requests and browser errors during the donor journey. Screenshots are written under `test-results/donor-*`.

On Windows checkouts with mixed LF/CRLF, `npm run format:check -- --end-of-line auto` validates repository formatting while preserving the checkout's line endings.
