# Product Requirements Document: Slander creator-funded nonprofit campaigns

- **Status:** Blocked
- **Source:** User-provided interview summary dated 24 September 2026
- **Last updated:** 2026-09-24

## Objective

Provide a mobile-friendly web app in which nonprofits run creator-driven fundraising campaigns, creators submit Instagram creatives, approved creatives can be published through the nonprofit's connected account, and completed donations determine attribution, creator compensation, and campaign rankings.

This is a product-level contract. It is **not yet an implementation contract**: the decisions in Open questions can change payment flows, publication behavior, and winner calculations.

## Current state and evidence

- The repository has no application source, test suite, or prior PRD. Its only existing product artifact is `outputs/affiliate-ad-comparison/nonprofit-creator-ad-market-comparison.xlsx` with previews and a build script.
- The interview summary supplied in this conversation is the sole source for the rules below. “Confirmed” means confirmed in that summary; it does not establish technical, legal, or payment-provider feasibility.
- No Instagram capability, payment-provider behavior, or legal requirement has been independently validated for this PRD.

## Scope

- **Permitted repository changes:** Product documentation under `docs/` at this stage. Later implementation scope must be defined after the open decisions are resolved.
- **Preserved behavior:** There is no existing application behavior to preserve.
- **External side effects:** None authorized by this PRD. It does not authorize connecting accounts, publishing posts or ads, taking donations, or making payouts.

## Non-goals

- Building the application or selecting a technology stack in this document.
- Choosing paid advertising or organic posting before platform validation.
- Fixing fee allocation, minimum guarantee formula, ranking normalization, tier thresholds, or refund treatment without a product decision.
- Treating the compliance review list as a legal conclusion.

## Requirements

### REQ-001 - Mobile web access

- **Statement:** The product shall provide its campaign, creative submission, and results workflows through a mobile-friendly web interface.
- **Rationale:** The confirmed launch platform is the web, including mobile use.
- **Depends on:** None

#### Acceptance criteria

- [ ] Given a supported mobile browser, when a visitor opens a campaign, then its essential content and primary actions are usable without horizontal page scrolling.
- [ ] Given a desktop browser, when a visitor opens the same campaign, then the same essential actions remain available.

#### Verification

- **Command:** Unassigned until an application repository and browser test runner exist.
- **Pass condition:** Automated viewport checks exercise the campaign, submission, and results workflows on mobile and desktop sizes.
- **Evidence:** Browser test report with viewport sizes and screenshots.

### REQ-002 - Eligible campaign funders

- **Statement:** The product shall allow nonprofits and businesses to fund campaigns.
- **Rationale:** Nonprofits are the initial audience, while business funding is also confirmed.
- **Depends on:** None

#### Acceptance criteria

- [ ] Given an authorized nonprofit administrator, when they create a campaign, then nonprofit funding can be recorded.
- [ ] Given an authorized business funder, when they fund an eligible campaign, then the business contribution can be recorded with its source type.

#### Verification

- **Command:** Unassigned until campaign funding behavior exists.
- **Pass condition:** Focused automated checks demonstrate both funder types without reclassifying a business as a nonprofit.
- **Evidence:** Funding workflow test report.

### REQ-003 - Administrator-defined campaign calendar

- **Statement:** The product shall let a nonprofit administrator set the campaign's exact calendar before activation.
- **Rationale:** The intended campaign lasts approximately 2.5 months, with exact dates set by the administrator.
- **Depends on:** None

#### Acceptance criteria

- [ ] Given a draft campaign, when its administrator sets start and end dates, then those dates are stored and shown before activation.
- [ ] Given an active campaign, when its timing is displayed, then it uses the configured dates rather than a hard-coded 2.5-month duration.

#### Verification

- **Command:** Unassigned until campaign configuration behavior exists.
- **Pass condition:** Focused automated checks prove configured dates drive the displayed campaign calendar.
- **Evidence:** Campaign calendar test report.

### REQ-004 - Open creative submission

- **Statement:** The product shall permit any creator to submit a creative for a campaign.
- **Rationale:** Submission is open rather than invitation-only.
- **Depends on:** REQ-003

#### Acceptance criteria

- [ ] Given an eligible campaign, when a creator outside an invitation list submits a creative, then the submission enters review.
- [ ] Given a submitted creative, when its status is displayed, then submission is distinct from approval and publication.

#### Verification

- **Command:** Unassigned until creative submission behavior exists.
- **Pass condition:** Focused automated checks prove non-invited submission reaches review without being published.
- **Evidence:** Submission workflow test report.

### REQ-005 - Automated prepublication policy check

- **Statement:** The product shall run an automated policy check on every submitted creative before publication eligibility is granted.
- **Rationale:** The summary requires automated screening before publication.
- **Depends on:** REQ-004

#### Acceptance criteria

- [ ] Given a new submission, when the policy check has not passed, then the creative cannot publish.
- [ ] Given a failed policy check, when the creator views the submission, then its blocked state is visible.

#### Verification

- **Command:** Unassigned until policy rules and publication controls exist.
- **Pass condition:** Automated checks prove publication is blocked before a pass and after a failure.
- **Evidence:** Policy gate test report and versioned policy rules.

### REQ-006 - Format proposal and support gate

- **Statement:** The product shall accept proposals for any ad format while marking whether each format is supported for the selected Instagram publication method.
- **Rationale:** Creators may propose any format, but actual platform support must be verified per format.
- **Depends on:** REQ-004

#### Acceptance criteria

- [ ] Given a proposed format, when a creator submits it, then the proposal is retained even if publication support is unverified.
- [ ] Given an unsupported format, when publication is attempted, then the product prevents that publication attempt and explains the support status.

#### Verification

- **Command:** Unassigned until a publication method and supported-format matrix are validated.
- **Pass condition:** Automated checks distinguish proposal acceptance from publication support for at least one supported and one unsupported format.
- **Evidence:** Format compatibility record and publication gate test report.

### REQ-007 - Official Instagram account connection

- **Statement:** The product shall require a nonprofit administrator to connect the nonprofit's official Instagram account before campaign creatives can publish there.
- **Rationale:** Publication is through the nonprofit's official account.
- **Depends on:** None

#### Acceptance criteria

- [ ] Given a campaign without a connected official account, when publication is requested, then it is blocked.
- [ ] Given an authorized administrator, when account connection succeeds, then the campaign identifies the connected account for review before publication.

#### Verification

- **Command:** Unassigned until the Instagram integration and authorization flow exist.
- **Pass condition:** Automated integration checks prove publication requires a connected administrator-authorized account.
- **Evidence:** Integration test report and account permission inventory.

### REQ-008 - Automatic publication of eligible creatives

- **Statement:** The product shall support automatic publication of a creative after approval, subject to its format being supported and the official account being connected.
- **Rationale:** Automatic publication of approved creatives is confirmed intent.
- **Depends on:** REQ-005, REQ-006, REQ-007

#### Acceptance criteria

- [ ] Given an approved creative with a supported format and connected account, when its publication trigger occurs, then the publication action is attempted and its result is recorded.
- [ ] Given a creative that lacks any required gate, when its publication trigger occurs, then no publication action is attempted.

#### Verification

- **Command:** Unassigned until paid-versus-organic placement and publication trigger rules are decided.
- **Pass condition:** Automated integration checks prove eligible publication and each blocking gate.
- **Evidence:** Publication event log and integration test report.

### REQ-009 - Single-ad donation attribution

- **Statement:** The product shall attribute each completed donation to exactly one creative ad.
- **Rationale:** Attribution connects fundraising outcomes to creator compensation and voting.
- **Depends on:** REQ-004

#### Acceptance criteria

- [ ] Given a completed attributed donation, when its record is inspected, then exactly one creative ad identifier is present.
- [ ] Given an incomplete donation attempt, when campaign totals are calculated, then that attempt is excluded from completed donation counts.

#### Verification

- **Command:** Unassigned until payment and attribution behavior exists.
- **Pass condition:** Automated checks enforce one ad per completed donation and exclude incomplete attempts.
- **Evidence:** Payment attribution test report and event schema.

### REQ-010 - Donation-linked votes

- **Statement:** The product shall count each completed attributed donation as one vote for its associated ad.
- **Rationale:** Vote count depends on donation completion, not donation size.
- **Depends on:** REQ-009

#### Acceptance criteria

- [ ] Given two completed donations attributed to one ad, when votes are counted, then the ad receives two votes regardless of their amounts.
- [ ] Given an incomplete donation attempt, when votes are counted, then it contributes zero votes.

#### Verification

- **Command:** Unassigned until donation events and vote counting exist.
- **Pass condition:** Automated checks show one vote per completed donation and zero for incomplete attempts.
- **Evidence:** Vote-count test report.

### REQ-011 - Separate donation amount tracking

- **Statement:** The product shall track the amount of each completed attributed donation separately from its vote count.
- **Rationale:** Donation amount is a distinct ranking input.
- **Depends on:** REQ-009

#### Acceptance criteria

- [ ] Given two completed donations of different amounts, when their records are inspected, then each has one vote and its own monetary amount.
- [ ] Given an ad's attributed donations, when donation amount is aggregated, then the result sums monetary amounts rather than vote counts.

#### Verification

- **Command:** Unassigned until donation records and aggregation exist.
- **Pass condition:** Automated checks show distinct amount and vote totals for unequal donations.
- **Evidence:** Donation aggregation test report.

### REQ-012 - Launch creator commission

- **Statement:** The product shall calculate the creator's launch commission as 10% of each donation attributed to that creator's ad.
- **Rationale:** The launch rate is confirmed.
- **Depends on:** REQ-009

#### Acceptance criteria

- [ ] Given a completed attributed donation under the launch rate, when commission is calculated, then its pre-adjustment creator share equals 10% of that donation's amount.
- [ ] Given a donation attributed to a different creator's ad, when this creator's commission is calculated, then that donation contributes nothing to this creator's commission.

#### Verification

- **Command:** Unassigned until commission calculation exists.
- **Pass condition:** Automated monetary tests verify the 10% rate and creator-specific attribution.
- **Evidence:** Commission calculation test report.

### REQ-013 - Prospective commission changes

- **Statement:** The product shall apply a changed creator commission rate only to donations completed after the change takes effect.
- **Rationale:** Rate changes affect future donations only.
- **Depends on:** REQ-012

#### Acceptance criteria

- [ ] Given a completed donation before a rate change, when commission is recalculated later, then its original applicable rate is retained.
- [ ] Given a completed donation after the effective time, when commission is calculated, then the new rate is applied.

#### Verification

- **Command:** Unassigned until versioned commission rates exist.
- **Pass condition:** Automated time-bound tests prove historical donations retain their original rate.
- **Evidence:** Rate history and commission test report.

### REQ-014 - Launch nonprofit share

- **Statement:** The product shall record the nonprofit's launch share as 90% of each attributed donation before processor fees or adjustments.
- **Rationale:** The confirmed launch split is 10% creator and 90% nonprofit before unresolved fee treatment.
- **Depends on:** REQ-009

#### Acceptance criteria

- [ ] Given a completed attributed donation under the launch split, when the pre-adjustment allocation is recorded, then the nonprofit share equals 90% of its amount.
- [ ] Given the same donation, when pre-adjustment creator and nonprofit shares are added, then they equal the donation amount.

#### Verification

- **Command:** Unassigned until payment allocation behavior exists.
- **Pass condition:** Automated monetary tests verify the pre-adjustment 90% share and conservation of the gross donation.
- **Evidence:** Allocation test report and transaction ledger sample.

### REQ-015 - Seed funding purpose

- **Statement:** The product shall record nonprofit seed funding separately from attributed donations.
- **Rationale:** Seed investment guarantees a minimum payout and pays for app use; it has a different purpose from donor money.
- **Depends on:** None

#### Acceptance criteria

- [ ] Given nonprofit seed funding, when campaign funding is inspected, then it is identified as seed funding rather than a donor-attributed donation.
- [ ] Given seed funding, when donation-linked votes are counted, then the seed funding creates no vote.

#### Verification

- **Command:** Unassigned until seed funding and donation ledgers exist.
- **Pass condition:** Automated checks prove seed funding is separate from attributed donations and votes.
- **Evidence:** Funding ledger test report.

### REQ-016 - Campaign ranking inputs

- **Statement:** The product shall use CTR at 40%, views at 30%, donation-linked votes at 15%, and attributed donation amount at 15% as the campaign ranking weights.
- **Rationale:** These weights are the accepted starting recommendation.
- **Depends on:** REQ-010, REQ-011

#### Acceptance criteria

- [ ] Given a ranking configuration, when its weights are inspected, then the four named metrics have weights 40, 30, 15, and 15 percent respectively.
- [ ] Given a ranking run, when its result is inspected, then the version of metric definitions and normalization rules used is identifiable.

#### Verification

- **Command:** Unassigned until metric definitions, normalization, and ranking behavior exist.
- **Pass condition:** Automated checks prove exact configured weights and reproducible versioned ranking inputs.
- **Evidence:** Ranking configuration and ranking test report.

### REQ-017 - Minimum view eligibility

- **Statement:** The product shall exclude ads below the campaign's configured minimum view threshold from ranking eligibility.
- **Rationale:** The ranking recommendation includes a minimum view threshold.
- **Depends on:** REQ-016

#### Acceptance criteria

- [ ] Given an ad with views below the configured threshold, when rankings are calculated, then that ad is ineligible.
- [ ] Given an ad with views equal to the configured threshold, when rankings are calculated, then that ad passes the view eligibility check.

#### Verification

- **Command:** Unassigned until the threshold value and view metric are defined.
- **Pass condition:** Automated boundary tests prove below-threshold exclusion and at-threshold eligibility.
- **Evidence:** Threshold configuration and ranking boundary test report.

### REQ-018 - Creator portfolio tiers

- **Statement:** The product shall determine a creator's portfolio tier from the number of that creator's top-20 ads and their time in the top 20.
- **Rationale:** These are the confirmed tier inputs.
- **Depends on:** REQ-016

#### Acceptance criteria

- [ ] Given a tier calculation, when its inputs are inspected, then the creator's top-20 ad count and time in the top 20 are present.
- [ ] Given two creators with different qualifying histories, when tiers are calculated, then the result follows the published tier rule version.

#### Verification

- **Command:** Unassigned until tier rates, thresholds, and measurement windows are defined.
- **Pass condition:** Automated boundary tests prove tier assignment against the published rule version.
- **Evidence:** Tier policy and tier calculation test report.

### REQ-019 - Tier rule disclosure before activation

- **Statement:** The product shall publish the applicable creator tier thresholds before a campaign is activated.
- **Rationale:** Creators need the thresholds before participation begins.
- **Depends on:** REQ-003, REQ-018

#### Acceptance criteria

- [ ] Given a draft campaign without published tier thresholds, when activation is requested, then activation is blocked.
- [ ] Given an active campaign, when a creator views its tier rules, then the rule version that applied at activation is available.

#### Verification

- **Command:** Unassigned until campaign activation and tier publishing exist.
- **Pass condition:** Automated checks prove activation blocks unpublished thresholds and preserves the published version.
- **Evidence:** Activation gate test report and tier policy version.

### REQ-020 - Weekly payout schedule

- **Statement:** The product shall schedule weekly payouts on the administrator-defined campaign calendar.
- **Rationale:** Weekly payouts are part of the confirmed campaign pattern.
- **Depends on:** REQ-003

#### Acceptance criteria

- [ ] Given an activated campaign, when its calendar is inspected, then the weekly payout dates are identifiable.
- [ ] Given a completed payout event, when its record is inspected, then its scheduled date and result are retained.

#### Verification

- **Command:** Unassigned until payout calculation and disbursement rules exist.
- **Pass condition:** Automated calendar checks prove weekly payout scheduling and event recording under defined payment rules.
- **Evidence:** Campaign payout calendar and scheduler test report.

### REQ-021 - Monthly winners

- **Statement:** The product shall identify a monthly winner for each monthly period defined by the campaign calendar.
- **Rationale:** Monthly winners are part of the confirmed campaign pattern.
- **Depends on:** REQ-003, REQ-016

#### Acceptance criteria

- [ ] Given an active campaign, when its calendar is inspected, then each monthly winner period has a selection date.
- [ ] Given a closed monthly period, when the winner is selected, then its identity and applicable ranking result are recorded.

#### Verification

- **Command:** Unassigned until winner-selection and period rules exist.
- **Pass condition:** Automated checks prove one recorded monthly winner per eligible period under defined tie and empty-period rules.
- **Evidence:** Monthly winner test report and selection record.

### REQ-022 - Final winner

- **Statement:** The product shall identify one final winner at the end of the campaign.
- **Rationale:** A final winner is part of the confirmed campaign pattern.
- **Depends on:** REQ-003, REQ-016

#### Acceptance criteria

- [ ] Given a campaign that has reached its configured end, when final selection runs, then a final winner result is recorded.
- [ ] Given a campaign before its configured end, when final selection is requested, then no final winner is declared.

#### Verification

- **Command:** Unassigned until final winner-selection rules exist.
- **Pass condition:** Automated checks prove final selection occurs after campaign end under defined tie and empty-campaign rules.
- **Evidence:** Final winner test report and selection record.

### REQ-023 - Seed-backed minimum payout

- **Statement:** The product shall apply nonprofit seed funding to a minimum payout guarantee under the campaign's published guarantee rule.
- **Rationale:** Guaranteeing a minimum payout is a confirmed purpose of the seed investment.
- **Depends on:** REQ-015, REQ-020

#### Acceptance criteria

- [ ] Given a campaign with seed funding, when the guarantee rule is viewed before activation, then its minimum payout terms are visible.
- [ ] Given a payout below the published guarantee, when its final amount is calculated, then a seed-funded top-up is recorded according to that rule.

#### Verification

- **Command:** Unassigned until the guarantee formula and payout rules exist.
- **Pass condition:** Automated monetary checks prove the published minimum and any seed-funded top-up.
- **Evidence:** Guarantee policy and payout calculation test report.

### REQ-024 - App-use payment from seed

- **Statement:** The product shall record the app-use payment funded by the nonprofit seed investment.
- **Rationale:** Paying the app for its use is the second confirmed purpose of seed funding.
- **Depends on:** REQ-015

#### Acceptance criteria

- [ ] Given seed funding, when the campaign's seed ledger is inspected, then its app-use payment is recorded separately from donor-attributed donations.
- [ ] Given the app-use payment, when donation-linked votes are counted, then the payment creates no vote.

#### Verification

- **Command:** Unassigned until the app-use fee and seed ledger exist.
- **Pass condition:** Automated ledger checks prove app-use payment is recorded from seed without affecting donation votes.
- **Evidence:** Seed ledger test report.

## Constraints

- A submission must not reach publication before its automated policy check passes.
- A donation must never create more than one ad-linked vote.
- The launch split is expressed on gross attributed donations; fee and adjustment allocation remains undecided.
- Ranking results must preserve the versions of metric definitions, normalization rules, and weights used so a result can be reproduced.
- Any external Instagram publication or payment operation requires separate authorization, valid provider capabilities, and an implementation design.

## Dependencies and assumptions

- Instagram is the launch distribution platform. Paid versus organic placement remains open.
- The administrator controls an official nonprofit Instagram account and can authorize whatever connection the selected publication method requires; feasibility needs validation.
- The interview summary interprets custody as a separate nonprofit payment account with a recorded creator/nonprofit split. This must be confirmed before payment architecture is set.
- The user-provided summary describes ad-level clicks and impressions for paid Meta ads. This PRD does not assume equivalent organic metrics or API access.
- “Completed donation” is a business event requiring a precise payment-provider state definition before implementation.

## Open questions

These decisions block implementation readiness. Keep the listed requirements as product intent until each rule is resolved and corresponding acceptance criteria are sharpened.

| ID | Decision needed | Affected requirements | Evidence or owner needed |
| --- | --- | --- | --- |
| D-01 | Are Instagram placements paid ads or organic posts, and what event triggers automatic publication? | REQ-006–008, REQ-016 | Product decision plus current Meta capability and permission check |
| D-02 | Which formats are supported for the chosen publication method? | REQ-006, REQ-008 | Per-format platform capability matrix |
| D-03 | What is a completed donation, how is an ad linked to it, and what happens after refunds, chargebacks, or attribution disputes? | REQ-009–014 | Payment flow and product accounting decision |
| D-04 | Who pays processor fees and other adjustments, and how are they shown in donor and creator records? | REQ-012–014 | Payment-provider terms and finance decision |
| D-05 | Is payment custody in a separate nonprofit payment account, and who is responsible for creator disbursements? | REQ-012–015, REQ-020, REQ-023–024 | Nonprofit and payment-provider confirmation |
| D-06 | What seed amount, minimum payout guarantee formula, app-use fee, and shortfall handling apply? | REQ-015, REQ-023–024 | Product and finance decision |
| D-07 | What are the exact definitions, source, time windows, normalization, tie-breakers, and missing-data rules for CTR, views, votes, and donation amount? | REQ-016–017, REQ-021–022 | Analytics design and platform data validation |
| D-08 | What is the minimum view threshold, and is it global or per campaign? | REQ-017 | Product decision before activation |
| D-09 | What are tier thresholds, rates, measurement windows, and rules for simultaneous or repeated top-20 appearances? | REQ-018–019 | Product decision before activation |
| D-10 | How are weekly payout amounts, monthly winners, and the final winner calculated, and what happens when a period has no eligible ads? | REQ-020–023 | Product and finance decision |
| D-11 | What donor disclosures, creator paid-promotion disclosures, fundraiser compensation rules, receipts, and state-specific requirements apply? | REQ-005, REQ-008–015, REQ-020–024 | Qualified legal/compliance review before launch |
| D-12 | Which creative policy is checked automatically, who handles false positives or appeals, and is any human review required? | REQ-005, REQ-008 | Product policy and moderation design |
| D-13 | Are submissions allowed without an account, and what identity, consent, and rights evidence must a creator provide? | REQ-004–005 | Product and legal decision |

## Ralph completion contract

No Ralph run should start from this document. The repository has no application or test runner, and D-01 through D-13 leave required behavior unsettled.

To make this contract executable, first resolve the decisions above, establish the target application repository and test runner, and replace each unassigned verification command with an unattended command. Then run the focused checks for **REQ-001, REQ-002, REQ-003, REQ-004, REQ-005, REQ-006, REQ-007, REQ-008, REQ-009, REQ-010, REQ-011, REQ-012, REQ-013, REQ-014, REQ-015, REQ-016, REQ-017, REQ-018, REQ-019, REQ-020, REQ-021, REQ-022, REQ-023, and REQ-024**, followed by the full regression suite. Preserve the evidence named under each requirement.

Completion requires:

- [ ] All open decisions that change required behavior are resolved and reflected in acceptance criteria.
- [ ] Every focused verification command is runnable unattended from the repository root and passes.
- [ ] The full regression suite passes.
- [ ] External platform, payment, and compliance dependencies have been validated for the launch configuration.
