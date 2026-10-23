import { randomUUID } from "node:crypto";
import { targetAccounts } from "./finance-money.js";

export function appendJournal(
  records,
  contribution,
  event,
  before,
  after,
  recordedAt,
) {
  const old = targetAccounts(contribution, before),
    target = targetAccounts(contribution, after);
  const lines = Object.keys(target)
    .map((account) => ({ account, delta: target[account] - old[account] }))
    .filter((l) => l.delta);
  if (!lines.length) return before.lastTransactionId;
  if (lines.reduce((sum, l) => sum + BigInt(l.delta), 0n) !== 0n)
    throw new Error("Unbalanced financial transaction");
  const terms = after.eligibility?.binding
    ? records.get("offer_versions", after.eligibility.binding.termsId)
    : null;
  const tx = records.append("journal_transactions", {
    id: randomUUID(),
    campaignId: contribution.campaignId,
    mode: contribution.mode,
    currency: "USD",
    effectiveAt: event.effectiveAt,
    recordedAt,
    sourceRecordId: event.id,
    sourceEventId: event.sourceEventId,
    contributionId: contribution.id,
    originalTransactionId: contribution.originalTransactionId,
    priorTransactionId: before.lastTransactionId,
    correctingTransactionId: [
      "refund",
      "dispute_loss",
      "attribution_resolution",
    ].includes(event.type)
      ? before.lastTransactionId
      : null,
    type: event.type,
    terms,
    attribution: after.eligibility,
    creatorCommissionBps: 1000,
    beneficiaryOrganizationId: terms?.beneficiaryOrganizationId || null,
    creatorId: after.creatorId,
    feeCents: 0,
    feeAssumption: "Simulated processing fees are zero; fixture assumption.",
  });
  for (const [i, line] of lines.entries())
    records.append("journal_entries", {
      id: `${tx.id}:${i}`,
      campaignId: tx.campaignId,
      mode: tx.mode,
      currency: "USD",
      effectiveAt: tx.effectiveAt,
      transactionId: tx.id,
      sourceRecordId: event.id,
      contributionId: contribution.id,
      account: line.account,
      purpose: line.account.startsWith("seed:")
        ? "seed"
        : line.account.startsWith("media:")
          ? "media"
          : contribution.purpose,
      debitCents: Math.max(0, line.delta),
      creditCents: Math.max(0, -line.delta),
    });
  return tx.id;
}
