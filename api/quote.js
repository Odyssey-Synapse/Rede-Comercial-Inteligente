import crypto from "node:crypto";
import { calculateContractualQuote } from "../lib/calculator.mjs";
import { getEconomicSnapshot } from "../lib/evidence-registry.mjs";
import { verifyCompanyLookup } from "../lib/lookup-signing.mjs";
import { signQuotePayload } from "../lib/quote-signing.mjs";
import { isFounderCnpj } from "../lib/founder-registry.mjs";
import { persistQuote } from "../lib/quote-store.mjs";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });

  const { lookupToken, categoryId, resourceIds = [] } = req.body ?? {};
  const lookupSecret = process.env.COMPANY_LOOKUP_SIGNING_SECRET;
  const verified = verifyCompanyLookup(lookupToken, lookupSecret);
  if (!verified.valid) return res.status(401).json({ error: verified.reason === "EXPIRED" ? "COMPANY_LOOKUP_EXPIRED" : "INVALID_COMPANY_LOOKUP" });

  const companyLookup = verified.payload;
  if (!["AA_COMPANY_LOOKUP_V1","AA_COMPANY_LOOKUP_V2"].includes(companyLookup.kind) || companyLookup.status?.code !== "2") {
    return res.status(422).json({ error: "COMPANY_NOT_ELIGIBLE" });
  }
  const category = companyLookup.categories?.find((item) => item.id === categoryId);
  if (!category) return res.status(422).json({ error: "CATEGORY_NOT_LINKED_TO_CNPJ" });

  const founderVerified = isFounderCnpj(companyLookup.cnpj);
  const economicSnapshot = getEconomicSnapshot(categoryId);
  const now = new Date();
  const calculation = calculateContractualQuote({ categoryId, economicSnapshot, founderVerified, resourceIds, now });
  if (calculation.status !== "QUOTABLE") return res.status(422).json(calculation);

  const quote = {
    quoteId: crypto.randomUUID(),
    company: {
      cnpj: companyLookup.cnpj,
      name: companyLookup.legalName,
      tradeName: companyLookup.tradeName || null,
      city: companyLookup.city || null,
      state: companyLookup.state || null
    },
    category: { id: category.id, cnaeCode: category.cnaeCode, label: category.label },
    ...calculation
  };

  const secret = process.env.QUOTE_SIGNING_SECRET;
  if (!secret || secret.length < 32) {
    return res.status(503).json({ error: "QUOTE_SIGNING_NOT_CONFIGURED", preview: quote });
  }

  const integrityToken = signQuotePayload(quote, secret);
  try {
    await persistQuote(quote, integrityToken);
  } catch (error) {
    console.error("Quote persistence failed", error);
    return res.status(503).json({ error: String(error?.message || "").includes("NOT_CONFIGURED") ? "QUOTE_STORE_NOT_CONFIGURED" : "QUOTE_STORE_FAILED", preview: quote });
  }

  return res.status(200).json({ quote, integrityToken, persisted: true });
}
