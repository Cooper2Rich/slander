export type AdFundAllocation = {
  policy: "ad-fund-10-5-85-v1";
  creatorCents: number;
  appUseFeeCents: number;
  beneficiaryCents: number;
};

// Record the allocation with each new contribution. Existing records are never
// recalculated when a rate or a demo policy changes.
export function allocateAdFund(amountCents: number): AdFundAllocation {
  if (!Number.isSafeInteger(amountCents) || amountCents < 1)
    throw new Error("Ad-fund amount must be positive safe integer cents.");
  const gross = BigInt(amountCents);
  const creatorCents = Number((gross * 1000n + 5000n) / 10000n);
  const appUseFeeCents = Number((gross * 500n + 5000n) / 10000n);
  return {
    policy: "ad-fund-10-5-85-v1",
    creatorCents,
    appUseFeeCents,
    beneficiaryCents: amountCents - creatorCents - appUseFeeCents,
  };
}

export function recordedAdFundAllocation(
  amountCents: number,
  allocation?: AdFundAllocation,
): AdFundAllocation | null {
  if (!Number.isSafeInteger(amountCents) || amountCents <= 0 || !allocation)
    return null;
  const fields = [
    allocation.creatorCents,
    allocation.appUseFeeCents,
    allocation.beneficiaryCents,
  ];
  return allocation.policy === "ad-fund-10-5-85-v1" &&
    fields.every((n) => Number.isSafeInteger(n) && n >= 0) &&
    fields.reduce((sum, n) => sum + n, 0) === amountCents
    ? allocation
    : null;
}
