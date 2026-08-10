export const ACCEPTANCE_VERSION = "AA-COMMERCIAL-ACCEPTANCE-001";

export function acceptanceSnapshot({
  quote,
  acceptedByName,
  acceptedByEmail,
  acceptedTerms = false,
  ip = null,
  userAgent = null
}) {
  if (!quote) throw new Error("QUOTE_REQUIRED");

  const name = String(acceptedByName || "").trim();
  const email = String(acceptedByEmail || "").trim().toLowerCase();

  if (name.length < 2) throw new Error("ACCEPTED_BY_NAME_REQUIRED");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("ACCEPTED_BY_EMAIL_INVALID");
  if (acceptedTerms !== true) throw new Error("ACCEPTANCE_TERMS_REQUIRED");

  return {
    acceptanceVersion: ACCEPTANCE_VERSION,
    quoteId: quote.quote_id ?? quote.quoteId,
    cnpj: quote.cnpj,
    companyName: quote.company_name ?? quote.companyName,
    mpCents: quote.mp_cents ?? quote.mpCents,
    validUntil: quote.valid_until ?? quote.validUntil,
    acceptedByName: name,
    acceptedByEmail: email,
    acceptedTerms: true,
    acceptedAt: new Date().toISOString(),
    ip,
    userAgent
  };
}
