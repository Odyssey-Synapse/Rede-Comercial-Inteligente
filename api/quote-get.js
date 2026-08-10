import { getQuoteById, appendQuoteEvent, updateQuoteStatus } from "../lib/db.js";

export default async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      res.setHeader("Allow", "GET");
      return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
    }
    const quoteId = String(req.query?.quoteId || "").trim();
    if (!/^AA-Q-[A-Z0-9-]{6,40}$/i.test(quoteId)) {
      return res.status(400).json({ error: "INVALID_QUOTE_ID" });
    }
    const quote = await getQuoteById(quoteId);
    if (!quote) return res.status(404).json({ error: "QUOTE_NOT_FOUND" });

    const now = Date.now();
    const validUntil = new Date(quote.valid_until).getTime();
    let status = quote.status;
    if (validUntil < now && !["accepted","cancelled","expired"].includes(status)) {
      const updated = await updateQuoteStatus(quoteId, "expired");
      status = updated?.status || "expired";
      quote.status = status;
    }
    await appendQuoteEvent({
      quoteId,
      eventType: "viewed",
      metadata: { userAgent: req.headers["user-agent"] || null }
    });

    return res.status(200).json({
      quoteId: quote.quote_id,
      cnpj: quote.cnpj,
      companyName: quote.company_name,
      activityCode: quote.activity_code,
      activityLabel: quote.activity_label,
      pricingPolicyVersion: quote.pricing_policy_version,
      economicModelVersion: quote.economic_model_version,
      pmeCents: quote.pme_cents,
      mpCents: quote.mp_cents,
      createdAt: quote.created_at,
      validUntil: quote.valid_until,
      status: quote.status,
      signature: quote.signature,
      cnpjProvider: quote.cnpj_provider || null,
      cnpjSourceUpdatedAt: quote.cnpj_source_updated_at || null,
      cnpjLookupId: quote.cnpj_lookup_id || null
    });
  } catch (err) {
    console.error(err);
    const code = err?.message === "DATABASE_URL_MISSING" ? 503 : 500;
    return res.status(code).json({ error: "QUOTE_READ_FAILED" });
  }
}
