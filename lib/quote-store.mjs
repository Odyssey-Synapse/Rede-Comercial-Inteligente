import crypto from "node:crypto";
import { saveQuote, appendQuoteEvent } from "./db.js";

export async function persistQuote(quote, integrityToken) {
  if (!process.env.DATABASE_URL) throw new Error("QUOTE_STORE_NOT_CONFIGURED");

  const sourcePayloadHash = crypto
    .createHash("sha256")
    .update(JSON.stringify(quote))
    .digest("hex");

  await saveQuote({
    quoteId: quote.quoteId,
    cnpj: quote.company.cnpj,
    companyName: quote.company.name,
    activityCode: quote.category.cnaeCode,
    activityLabel: quote.category.label,
    pricingPolicyVersion: quote.pricingPolicyVersion,
    economicModelVersion: `${quote.curveId}:${quote.curveVersion}`,
    pmeCents: quote.pmeCents,
    mpCents: quote.proposedMonthlyCents,
    createdAt: quote.computedAt,
    validUntil: quote.validUntil,
    signature: integrityToken,
    status: "issued",
    sourcePayloadHash,
    founderApplied: Boolean(quote.founderVerified),
    founderRegistryVersion: quote.founderVerified
      ? (process.env.FOUNDER_REGISTRY_VERSION || "FOUNDER-001")
      : null,
    cnpjProvider: quote.cnpjProvider || null,
    cnpjSourceUpdatedAt: quote.cnpjSourceUpdatedAt || null,
    cnpjLookupId: quote.cnpjLookupId || null
  });

  await appendQuoteEvent({
    quoteId: quote.quoteId,
    eventType: "issued",
    metadata: {
      pricingPolicyVersion: quote.pricingPolicyVersion,
      cnpjProvider: quote.cnpjProvider || null,
      cnpjSourceUpdatedAt: quote.cnpjSourceUpdatedAt || null,
      founderApplied: Boolean(quote.founderVerified)
    }
  });

  return { stored: true };
}
