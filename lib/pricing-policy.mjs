export const PRICING_POLICY = Object.freeze({
  policyId: "AA-PRICING-001",
  version: "1.0.0",
  status: "ACTIVE",
  currency: "BRL",
  vbcCents: 14000,
  quoteValidityDays: 7,
  curve: Object.freeze({
    id: "CP60-v1",
    version: "1.0.0",
    anchors: Object.freeze([
      Object.freeze({ iveUnits: 0, premiumBps: 0 }),
      Object.freeze({ iveUnits: 5000, premiumBps: 800 }),
      Object.freeze({ iveUnits: 7000, premiumBps: 2570 }),
      Object.freeze({ iveUnits: 9000, premiumBps: 4800 }),
      Object.freeze({ iveUnits: 10000, premiumBps: 6000 })
    ])
  }),
  evidenceFallback: "BASE_ONLY",
  founderMonthlyCents: 0,
  resourcePriceBook: Object.freeze({}),
  rounding: "HALF_UP_CENTS",
  categoryScopeMode: "OFFICIAL_CNAE_ACTIVITY_V1"
});

