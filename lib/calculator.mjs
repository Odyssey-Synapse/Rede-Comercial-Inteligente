import { PRICING_POLICY } from "./pricing-policy.mjs";
import { isOfficialCnaeCategoryId } from "./activity-policy.mjs";

function roundHalfUpDiv(numerator, denominator) {
  if (!Number.isInteger(numerator) || !Number.isInteger(denominator) || denominator <= 0) {
    throw new TypeError("roundHalfUpDiv requires positive integer denominator and integer numerator");
  }
  return Math.floor((numerator + Math.floor(denominator / 2)) / denominator);
}

export function moneyBRL(cents) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

export function iveToUnits(ive) {
  if (typeof ive !== "number" || !Number.isFinite(ive) || ive < 0 || ive > 100) {
    throw new RangeError("IVE must be a finite number between 0 and 100");
  }
  return Math.round(ive * 100);
}

export function premiumBpsFromIve(ive, policy = PRICING_POLICY) {
  const x = iveToUnits(ive);
  const anchors = policy.curve.anchors;
  if (x <= anchors[0].iveUnits) return anchors[0].premiumBps;
  if (x >= anchors.at(-1).iveUnits) return anchors.at(-1).premiumBps;

  for (let i = 0; i < anchors.length - 1; i++) {
    const a = anchors[i];
    const b = anchors[i + 1];
    if (x >= a.iveUnits && x <= b.iveUnits) {
      const dx = x - a.iveUnits;
      const span = b.iveUnits - a.iveUnits;
      const dy = b.premiumBps - a.premiumBps;
      return a.premiumBps + roundHalfUpDiv(dx * dy, span);
    }
  }
  throw new Error("No curve segment found");
}

function validateEconomicSnapshot(snapshot, categoryId, now) {
  if (!snapshot) return { usable: false, state: "ABSENT" };
  if (snapshot.categoryId !== categoryId) return { usable: false, state: "SCOPE_MISMATCH" };
  if (snapshot.status !== "APPROVED" || snapshot.economicAuthority !== true) {
    return { usable: false, state: "NO_ECONOMIC_AUTHORITY" };
  }
  if (typeof snapshot.ive !== "number") return { usable: false, state: "IVE_UNKNOWN" };
  try { iveToUnits(snapshot.ive); } catch { return { usable: false, state: "IVE_INVALID" }; }
  const t = now.getTime();
  if (snapshot.validFrom && t < new Date(snapshot.validFrom).getTime()) return { usable: false, state: "NOT_YET_VALID" };
  if (snapshot.validUntil && t > new Date(snapshot.validUntil).getTime()) return { usable: false, state: "STALE" };
  if (snapshot.kind === "SCENARIO_SET") return { usable: false, state: "NON_UNIQUE_ECONOMIC_STATE" };
  return { usable: true, state: "APPROVED", snapshot };
}

function sumResourceCents(resourceIds, policy) {
  let total = 0;
  for (const id of resourceIds) {
    if (!Object.prototype.hasOwnProperty.call(policy.resourcePriceBook, id)) {
      return { ok: false, reason: `UNKNOWN_RESOURCE:${id}` };
    }
    total += policy.resourcePriceBook[id];
  }
  return { ok: true, total };
}

export function calculateContractualQuote({
  categoryId,
  economicSnapshot = null,
  founderVerified = false,
  resourceIds = [],
  now = new Date(),
  policy = PRICING_POLICY
}) {
  if (policy.status !== "ACTIVE") {
    return { status: "BLOCKED", reason: "PRICING_POLICY_NOT_ACTIVE" };
  }
  if (!isOfficialCnaeCategoryId(categoryId)) {
    return { status: "MANUAL_REVIEW", reason: "CATEGORY_NOT_OFFICIAL_CNAE" };
  }
  if (!Array.isArray(resourceIds)) {
    return { status: "BLOCKED", reason: "INVALID_RESOURCES" };
  }

  const resources = sumResourceCents(resourceIds, policy);
  if (!resources.ok) return { status: "BLOCKED", reason: resources.reason };

  const evidence = validateEconomicSnapshot(economicSnapshot, categoryId, now);
  let premiumBps = null;
  let premiumCents = 0;
  let ive = null;
  let economicBasis;

  if (evidence.usable) {
    ive = evidence.snapshot.ive;
    premiumBps = premiumBpsFromIve(ive, policy);
    premiumCents = roundHalfUpDiv(policy.vbcCents * premiumBps, 10000);
    economicBasis = "EVIDENCED_IVE";
  } else if (policy.evidenceFallback === "BASE_ONLY") {
    // Important: this is policy fallback, NOT IVE = 0.
    economicBasis = "BASE_ONLY_EVIDENCE_PENDING";
  } else {
    return { status: "MANUAL_REVIEW", reason: `EVIDENCE_${evidence.state}` };
  }

  const pmeCents = policy.vbcCents + premiumCents + resources.total;
  const proposedMonthlyCents = founderVerified ? policy.founderMonthlyCents : pmeCents;
  const validUntil = new Date(now.getTime() + policy.quoteValidityDays * 86400000);

  return Object.freeze({
    status: "QUOTABLE",
    currency: policy.currency,
    categoryId,
    pricingPolicyId: policy.policyId,
    pricingPolicyVersion: policy.version,
    curveId: policy.curve.id,
    curveVersion: policy.curve.version,
    evidenceState: evidence.state,
    economicBasis,
    ive,
    vbcCents: policy.vbcCents,
    premiumBps,
    premiumCents,
    resourceCents: resources.total,
    pmeCents,
    founderVerified,
    proposedMonthlyCents,
    computedAt: now.toISOString(),
    validUntil: validUntil.toISOString(),
    contractRule: "PMC_IS_CREATED_ONLY_AFTER_ACCEPTANCE_OF_FROZEN_PROPOSAL"
  });
}
