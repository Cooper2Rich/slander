# Slander second PRD revision log

Date: October 21, 2026 | Version history: 1.0 to 2.0 to 2.1 to 2.2

Updated document: `outputs/Slander-Rebuild-PRD.md`.

## October 24, 2026 - daily winner and weekly scoring addendum (pending organization)

Captured Cooper's latest instructions at the beginning of the second PRD for later organization. That addendum supersedes conflicting grading weights, CTR requirements, and tie behavior in the older body and this historical log.

- Include a daily ad campaign winner; payout remains TBD. Cooper clarified that daily winners use the same scoring weights and tie-breakers as weekly winners, applied to daily results. Exact daily measurement boundaries remain unspecified.
- Daily and weekly scores use 40% impressions, 30% total link clicks, and 30% funds raised. CTR is excluded from scoring and tie-breaking.
- Daily and weekly leaderboards automatically refresh every 10 minutes and display a countdown in minutes and seconds to the next scheduled update; after each update, the timer counts down to the following update.
- Compare unrounded scores within the applicable daily or weekly period. On a tie, compare total link clicks, then funds raised, then impressions; declare a tie if all three are equal. Display rounding does not create a tie.
- Preserved protected commission, beneficiary allocation, and seed guarantees. No payout amount or normalization method was invented.
- Detailed requirement reorganization is deferred. The existing version 2.2 audit remains historical and does not validate the addendum.

## Version 2.2 - proposed grading policy made official

Cooper explicitly approved the proposed grading system on October 21, 2026. This entry supersedes earlier proposal-only and old-weight descriptions in this historical change log.

- REQ-215 now defines the sole official grade: CTR 15%, views 10%, donation-linked votes 35%, donation amount 40%.
- Promoted the proposed fixed-target normalization, CTR smoothing, capped square-root volume components, minimum-evidence gates, comparable cohorts, and immutable/corrected score snapshots into required behavior.
- Removed the separate candidate P01 section and the old active 40/30/15/15/cohort-maximum calculation. Historical scores, if any, retain their original version rather than being relabeled.
- Grading configuration is frozen before a measurement window. All four metrics are mandatory; absent data/configuration or inadequate evidence produces a pending/provisional grade rather than a fabricated score.
- Preserved the 10% creator commission, 90% beneficiary allocation before fees, crowdfunding, separate seed guarantees, and automatic eligibility without routine organizational sign-off.
- Kept any additional performance bonus conditional on an independently funded pool and published allocation/eligibility rules. Approving the grade itself creates no new payment liability or ad-spending permission.
- Updated campaign terms, queue/scaling references, acceptance criteria, and audit evidence to use the official policy.
- Scope remains documentation. New application behavior/tests still require implementation; no third-party service is selected or connected.

## Version 2.1 - automatic eligibility and grading discussion

This entry supersedes the earlier version 2.0 approval/participation workflow. The remaining log records prior changes as history; the current PRD is authoritative.

- Removed routine organizational approve/request-changes/decline tasks and owner acceptance of individual creators.
- Creators accept campaign terms; deterministic participation checks grant eligibility without an owner click.
- Owners configure campaign/channel rules once. Snapshot + policy version + captured facts produce an auditable pass, needs-fix, or held result. Mandatory checks cover technical fields, media, rights declaration, destination, disclosures, and known restrictions without judging creative taste.
- Kept narrow exception handling for creator appeals, substantiated complaints, and unresolved evidence conflicts. Rights declarations and mechanical checks are explicitly not proofs of copyright, truth, or full visual/semantic platform-policy compliance.
- Added REQ-218: deterministic creator round-robin initial exposure planning, one creator opportunity per turn, bounded funded trial capacity, idempotent reservations, and no guaranteed social-platform impressions.
- Updated legacy UI/API/status mappings, content revisions, public library labels, snapshots, and walkthrough acceptance criteria to remove hidden manual-approval gates. Historical records remain retained; old approval is not a bypass of current policy.
- Kept finance-batch approval separate: removing creative sign-off does not authorize uncontrolled transfers or remove an ad platform's own review.
- Preserved all four grading metrics and the fixed 10% commission/crowdfunding/guarantee rules.
- Recorded candidate P01 weights (CTR 15%, views 10%, votes 35%, donation amount 40%) as a proposal only. The candidate includes minimum evidence, comparable cohorts, fixed targets, diminishing volume returns, and abuse/refund checks. Neither score allocates money now; a separate bonus pool needs explicit funding and acceptance.
- Documentation audit: 32 requirements, zero errors, zero warnings; stable BASE aliases and dependency graph checked. Application implementation/tests remain pending, and no provider was connected.

## Protected decisions

- **Creator commission stays 10% of eligible completed attributed gross donations before fees.** It is not an extra platform commission. The nonprofit retains the other 90% before fees. The new document prohibits administrator, tier, import, or provider overrides.
- **Crowdfunding stays.** Multiple supporters can contribute to nonprofit campaigns, with attributed gifts driving creator compensation and one vote per eligible gift.
- **Seed funding stays separate.** Nonprofits/businesses can support minimum creator guarantees and the app-use payment. Neither seed nor media funding is reclassified as a donor gift or vote.
- **The current application remains the foundation.** Keep React/Express, SQLite, media, IDs, role scope, submission/review revisions, Instagram pairing, and manual handoff.
- **Third-party selection stays open.** No affiliate network, ad API, payment processor, identity vendor, or analytics service was selected, installed, connected, or required for the local concept.

## What changed and why

| Previous version | Revised contract | Location |
| --- | --- | --- |
| Nonprofit content-review demo with finance broadly deferred | External marketplace across nonprofit and business campaign owners, creator participation, own campaign offers, and independent beneficiaries/sponsors | Objective; REQ-201 through REQ-204 |
| Instagram-centric creative and one pairing | Preserve Instagram pairing, add distribution identity for Instagram/Facebook/TikTok/YouTube without claiming APIs are connected | REQ-202, REQ-204 |
| No executable model for crowdfunding attribution/commission | Define a local simulated gift-to-creative-to-10%-allocation-to-settlement flow | REQ-205 through REQ-211, REQ-217 |
| Historical permission to change commission rates | Retire variable-rate rule; every offer/version stays at 1000 basis points | Business rules and funds; REQ-202, REQ-207 |
| Unsettled seed guarantee and app-use concepts | Configurable minimum floor/top-up, finite reserved liability, explicit app-use obligation/trigger, no invented default amounts | REQ-206, REQ-210 |
| Ad funding, donations, and seed purposes insufficiently separated | Separate purpose accounts, payer labels, reservations, spent/available balances, and overruns | REQ-206, REQ-209 |
| Review decision history without exact previous content | Immutable approved snapshots, media digest, revision-bound distributions, honest migration of missing old versions | REQ-204 |
| General financial integrity recommendations | Concrete journal conservation, duplicate and transaction-level replay protection, out-of-order events, partial/full refunds, recoveries | REQ-207, REQ-208 |
| Real payout schedule only as future intention | Weekly reconciled previews and immutable CSV/JSON manifests; export cannot mean paid | REQ-211 |
| Raw metric/ranking weights without a full algorithm | Defined CTR/CPC/CPM and payer economics; optional normalized cohort scoring with unchanged inherited weights | REQ-212, REQ-215 |
| Clean repository/alternate framework recommendations | Incremental extension in the current repository, repeatable migrations, restore checks, bounded queries and local reconciliation | REQ-213; Incremental build order |
| Selectable demo identity/public upload gaps | Preserve demo controls with clear limits; add local private-media ownership and finance access requirements | REQ-214 |
| Provider decisions entangled with product design | Local capabilities and labeled simulation now; six explicit live-launch gates later | REQ-216; Open questions |

The marketplace role follows the second company list from the conversation: Awin, impact.com, CJ, PartnerStack, and ClickBank. The useful common features are offer discovery, per-advertiser terms, participation approval, tracking, reporting, and payouts. Their variable commission rates and proprietary catalogs are not imported. Slander remains a platform for its own participating campaign owners.

## Redundancies and conflicts removed

1. **Repeated clean-rebuild instructions:** version 1 sections 1 and 18 both told another environment to recreate the application. Replaced with one incremental plan and one completion contract. A fresh install is now a compatibility case rather than a reason to rebuild working code.
2. **Acceptance criteria repeated as prose/outcomes/A01-A30 table:** retained BASE-01 through BASE-14 as aliases and attached acceptance criteria directly to 31 formal requirement objects. Removed the duplicate standalone A01-A30 listing; preserved its behaviors in baseline requirements and extension scenarios.
3. **The 24-row inherited roadmap:** it repeated baseline requirements and deferred the same financial concepts multiple times. Replaced with current detailed requirements; the original first PRD remains available as historical evidence.
4. **Conflicting rate-change/tier rules:** removed prospective variable commission from the active contract. Tiers cannot change 10%, and tier-threshold publication no longer blocks all campaign activation.
5. **Repeated integration exclusion lists:** consolidated the old scattered exclusions/risks/future milestones into phased scope, capabilities, and live gates. No repeated vendor choice is needed for each local feature.
6. **Repeated security advice outside requirements:** media ownership, immutable review content, and finance permissions now have required behaviors and acceptance criteria rather than appearing only as optional future risk items.
7. **Overlapping unresolved-decision lists:** replaced old D01-D13 plus extra rebuild questions with local defaults/configuration gates and L01-L06 for actual live dependencies. Settled demo behavior is no longer presented as an open architecture choice.
8. **Temporary browser/socket incident in the spec:** removed it from the product contract. Source inspection is still distinguished from a passing runtime test.
9. **Optional refinements conflicting with required local changes:** exact approved snapshots and consistent date-gated editing are now explicit extension requirements, not simultaneously optional future suggestions.
10. **Duplicate source/operation instructions:** one current-state evidence section, one operational setup paragraph, and one research trace replace repeated alternate-stack/remote-branch/copyable-build material. Original source claims are not presented as freshly reverified remote facts.

## New design decisions added beyond the company comparison

These are engineering/product choices introduced in this revision, not claims that the old demo already implements them:

- **Terms and ownership:** independent business/nonprofit campaign owners, explicit nonprofit beneficiary, sponsor without automatic admin rights, immutable versions, creator acknowledgment, and separate owner/channel permission.
- **Exact creative identity:** immutable content/media snapshots, separate channel distributions, and explicit local/unknown/exported/live states.
- **Attribution:** opaque first-party links; seven-day same-campaign last-eligible-click local policy; frozen intent evidence; explicit direct creative selection; ambiguous transactions in suspense. No silent creator reassignment or fabricated clicks.
- **Money:** USD integer cents, checked integer arithmetic, specified cent rounding, separate clearing/settled funds, balanced journal, and recorded source evidence.
- **Event integrity:** dedupe both source events and cumulative effects on the same logical donation, payload-conflict holds, delayed prerequisite reconciliation, and transactional rollback.
- **Refunds and votes:** cumulative commission reversal, no over-refund, one gift/one vote while net eligible gross is positive, zero votes after full refund, and recovery holds after prior payment.
- **Media funding:** separate campaign/creator payer, atomic reservations, lifetime caps, optional UTC daily caps, cancellation release, and honest reporting of actual overruns.
- **Guarantees:** configurable seed-funded floor `max(0, guarantee - eligible base commission)`, full finite reserve before a guarantee promise, held eligibility, and separately triggered app-use obligations. No default fee or floor is invented.
- **Settlement:** weekly UTC intervals, held-versus-payable amounts, approved immutable manifests, retries that do not pay twice, and simulation-only paid examples.
- **Analytics:** distinct all-click/outbound/redirect metrics, N/A for unknown denominators, evidence labels, creator profit using commission income, and explicit funding payer.
- **Standings:** preserve 40/30/15/15 weights; normalize within comparable channel/window/definition cohorts; optional thresholds, shared ranks, reproducible snapshots, and no rate changes or unfunded winner awards.
- **Operations:** existing SQLite with minimum indexed additions, one transaction owner, capped pages/batches, no idle polling, migration rollback, and restore verification.
- **Scope/privacy:** private-media references and retrieval, finance-only Admin operations, legacy nonprofit compatibility, and scoped beneficiary/creator reports.

The existing transaction basis is retained: these are nonprofit crowdfunding campaigns, including business-owned/sponsored cause campaigns. General retail sales commissions and fulfillment were not invented as a side effect of comparing Slander with broader affiliate marketplaces.

## Documentation validation and implementation boundary

Run the PRD skill's structural audit against this second PRD and save `outputs/Slander-Rebuild-PRD.audit.json`. Semantic review checks the protected rate, fund conservation, state distinctions, legacy mapping, dependency ordering, provider boundaries, and acceptance traceability. The audit completed with 31 requirements, zero structural errors, and zero warnings. Its `semantic_review` records a cycle-free dependency graph, 14 preserved baseline aliases, protected funding/rate rules, and specification arithmetic checks. Application behavior was not verified by these document checks.

This edit changes product documentation, not application behavior. The new tests named in the PRD are planned implementation deliverables. Existing application tests were inspected but not rerun for this documentation-only change; the document is not marked Ralph-ready. Phase A/B requires no external provider choice. Live ad delivery, actual donation collection, real transfer confirmation, verified metrics, hosted identity/media, and recipient/unused-funds policies remain the explicit later gates.

The first PRD at `docs/PRD.md`, its audit, source code, dependencies, and user data are retained.
