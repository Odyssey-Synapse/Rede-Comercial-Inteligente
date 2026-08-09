import crypto from "node:crypto";
import { isValidCnpj, normalizeCnpj } from "../lib/cnpj.mjs";
import { fetchOfficialCnpj } from "../lib/serpro-cnpj.mjs";
import { categoriesFromActivities } from "../lib/activity-policy.mjs";
import { signCompanyLookup } from "../lib/lookup-signing.mjs";
import { verifyTurnstileToken } from "../lib/turnstile.mjs";

function remoteIp(req) {
  return String(req.headers?.["x-forwarded-for"] || req.headers?.["x-real-ip"] || "")
    .split(",")[0].trim();
}

function publicCompany(company, cnpj) {
  return {
    cnpj: normalizeCnpj(cnpj),
    legalName: company.legalName,
    tradeName: company.tradeName,
    city: company.city,
    state: company.state,
    status: company.status
  };
}

export default async function handler(req, res) {
  res.setHeader?.("Cache-Control","no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });

  const { cnpj, turnstileToken } = req.body ?? {};
  if (!isValidCnpj(cnpj)) return res.status(400).json({ error: "INVALID_CNPJ" });

  const human = await verifyTurnstileToken(turnstileToken, remoteIp(req), { expectedAction: "cnpj_lookup" });
  if (!human.ok) return res.status(403).json({ error: human.reason, details: human.details || [] });

  const requested = normalizeCnpj(cnpj);

  try {
    const company = await fetchOfficialCnpj(requested);

    if (company.cnpj && company.cnpj !== requested) {
      return res.status(502).json({ error: "CNPJ_PROVIDER_MISMATCH" });
    }

    if (company.partial) {
      return res.status(503).json({
        error: "CNPJ_PROVIDER_PARTIAL",
        company: publicCompany(company, requested)
      });
    }

    // Official SERPRO status table: code 2 = Ativa.
    if (company.status.code !== "2") {
      return res.status(422).json({
        error: "CNPJ_NOT_ACTIVE",
        company: publicCompany(company, requested)
      });
    }

    const categories = categoriesFromActivities(company.activities);
    if (!categories.length) {
      return res.status(422).json({
        error: "NO_ELIGIBLE_CNAE_ACTIVITY",
        company: publicCompany(company, requested)
      });
    }

    const secret = process.env.COMPANY_LOOKUP_SIGNING_SECRET;
    if (!secret || secret.length < 32) {
      return res.status(503).json({ error: "LOOKUP_SIGNING_NOT_CONFIGURED" });
    }

    const issuedAt = new Date();
    const ttlMinutes = Math.min(30, Math.max(5, Number(process.env.COMPANY_LOOKUP_TTL_MINUTES || 15)));
    const expiresAt = new Date(issuedAt.getTime() + ttlMinutes * 60 * 1000);

    const lookupPayload = {
      kind: "AA_COMPANY_LOOKUP_V2",
      lookupId: `LK-${crypto.randomUUID()}`,
      source: "SERPRO_CNPJ_V2",
      cnpj: requested,
      legalName: company.legalName,
      tradeName: company.tradeName,
      city: company.city,
      state: company.state,
      status: company.status,
      categories,
      activityCoverage: company.activityCoverage,
      issuedAt: issuedAt.toISOString(),
      expiresAt: expiresAt.toISOString()
    };

    return res.status(200).json({
      company: {
        cnpj: lookupPayload.cnpj,
        legalName: lookupPayload.legalName,
        tradeName: lookupPayload.tradeName,
        city: lookupPayload.city,
        state: lookupPayload.state,
        status: lookupPayload.status,
        categories: lookupPayload.categories,
        activityCoverage: lookupPayload.activityCoverage
      },
      lookupToken: signCompanyLookup(lookupPayload, secret),
      expiresAt: lookupPayload.expiresAt
    });
  } catch (error) {
    const message = String(error?.message || "");

    if (message === "SERPRO_CREDENTIALS_NOT_CONFIGURED" ||
        message === "SERPRO_ENDPOINT_TEMPLATE_NOT_CONFIGURED" ||
        message === "SERPRO_TRIAL_TOKEN_NOT_CONFIGURED") {
      return res.status(503).json({ error: message });
    }

    if (message === "SERPRO_TIMEOUT") {
      return res.status(504).json({ error: "CNPJ_PROVIDER_TIMEOUT" });
    }

    if (message.startsWith("SERPRO_TOKEN_FAILED:")) {
      return res.status(503).json({ error: "SERPRO_AUTH_FAILED" });
    }

    if (message.startsWith("SERPRO_CNPJ_FAILED:400")) {
      return res.status(400).json({ error: "INVALID_CNPJ" });
    }
    if (message.startsWith("SERPRO_CNPJ_FAILED:401")) {
      return res.status(503).json({ error: "SERPRO_AUTH_FAILED" });
    }
    if (message.startsWith("SERPRO_CNPJ_FAILED:403")) {
      return res.status(503).json({ error: "SERPRO_ACCESS_DENIED" });
    }
    if (message.startsWith("SERPRO_CNPJ_FAILED:404")) {
      return res.status(404).json({ error: "CNPJ_NOT_FOUND" });
    }
    if (/SERPRO_CNPJ_FAILED:(500|502|504)/.test(message)) {
      return res.status(502).json({ error: "CNPJ_PROVIDER_UNAVAILABLE" });
    }

    console.error("CNPJ lookup failed", error);
    return res.status(502).json({ error: "CNPJ_PROVIDER_UNAVAILABLE" });
  }
}
