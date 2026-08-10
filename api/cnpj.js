import crypto from "node:crypto";
import { isValidCnpj, normalizeCnpj } from "../lib/cnpj.mjs";
import { fetchCnpjRecord } from "../lib/cnpj-provider.mjs";
import { categoriesFromActivities } from "../lib/activity-policy.mjs";
import { signCompanyLookup } from "../lib/lookup-signing.mjs";
import { verifyTurnstileToken } from "../lib/turnstile.mjs";

function remoteIp(req) {
  return String(req.headers?.["x-forwarded-for"] || req.headers?.["x-real-ip"] || "")
    .split(",")[0].trim();
}

function publicCompany(company, cnpj, categories = undefined) {
  return {
    cnpj: normalizeCnpj(cnpj),
    legalName: company.legalName,
    tradeName: company.tradeName,
    city: company.city,
    state: company.state,
    status: company.status,
    ...(categories ? { categories } : {}),
    activityCoverage: company.activityCoverage,
    dataSource: company.provider,
    sourceUpdatedAt: company.sourceUpdatedAt || null
  };
}

export default async function handler(req, res) {
  const requestId = `CNPJ-${crypto.randomUUID()}`;
  res.setHeader?.("Cache-Control", "no-store");
  res.setHeader?.("X-AcheiAqui-Request-Id", requestId);

  try {
    if (req.method !== "POST") return res.status(405).json({ error: "METHOD_NOT_ALLOWED", requestId });

    const { cnpj, turnstileToken } = req.body ?? {};
    if (!isValidCnpj(cnpj)) return res.status(400).json({ error: "INVALID_CNPJ", requestId });

    const human = await verifyTurnstileToken(
      turnstileToken,
      remoteIp(req),
      {
        expectedAction: "cnpj_lookup",
        expectedHostname: process.env.TURNSTILE_EXPECTED_HOSTNAME || undefined
      }
    );

    if (!human.ok) {
      console.warn("CNPJ lookup blocked by Turnstile", { requestId, reason: human.reason, details: human.details || [] });
      const unavailable = ["TURNSTILE_VERIFY_UNAVAILABLE","TURNSTILE_VERIFY_TIMEOUT"].includes(human.reason);
      return res.status(unavailable ? 503 : 403).json({
        error: human.reason,
        details: human.details || [],
        requestId
      });
    }

    const requested = normalizeCnpj(cnpj);
    const company = await fetchCnpjRecord(requested);

    if (company.cnpj && company.cnpj !== requested) {
      return res.status(502).json({ error: "CNPJ_PROVIDER_MISMATCH", requestId });
    }

    if (company.partial) {
      return res.status(503).json({
        error: "CNPJ_PROVIDER_PARTIAL",
        company: publicCompany(company, requested),
        requestId
      });
    }

    if (company.status.code !== "2") {
      return res.status(422).json({
        error: "CNPJ_NOT_ACTIVE",
        company: publicCompany(company, requested),
        requestId
      });
    }

    const categories = categoriesFromActivities(company.activities);
    if (!categories.length) {
      return res.status(422).json({
        error: "NO_ELIGIBLE_CNAE_ACTIVITY",
        company: publicCompany(company, requested),
        requestId
      });
    }

    const secret = process.env.COMPANY_LOOKUP_SIGNING_SECRET;
    if (!secret || secret.length < 32) {
      return res.status(503).json({ error: "LOOKUP_SIGNING_NOT_CONFIGURED", requestId });
    }

    const issuedAt = new Date();
    const ttlMinutes = Math.min(30, Math.max(5, Number(process.env.COMPANY_LOOKUP_TTL_MINUTES || 15)));
    const expiresAt = new Date(issuedAt.getTime() + ttlMinutes * 60 * 1000);

    const lookupPayload = {
      kind: "AA_COMPANY_LOOKUP_V3",
      lookupId: `LK-${crypto.randomUUID()}`,
      source: company.provider,
      sourceUpdatedAt: company.sourceUpdatedAt || null,
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

    console.info("CNPJ lookup success", {
      requestId,
      provider: company.provider,
      cnpj: requested,
      categories: categories.length
    });

    return res.status(200).json({
      company: publicCompany(company, requested, categories),
      lookupToken: signCompanyLookup(lookupPayload, secret),
      expiresAt: lookupPayload.expiresAt,
      requestId
    });
  } catch (error) {
    const message = String(error?.message || "");
    console.error("CNPJ lookup failed", { requestId, message, stack: error?.stack });

    if (message === "CNPJ_PROVIDER_UNSUPPORTED") return res.status(503).json({ error: "CNPJ_PROVIDER_NOT_CONFIGURED", requestId });
    if (message === "CNPJWS_TIMEOUT" || message === "SERPRO_TIMEOUT") return res.status(504).json({ error: "CNPJ_PROVIDER_TIMEOUT", requestId });
    if (message === "CNPJWS_INVALID_RESPONSE") return res.status(502).json({ error: "CNPJ_PROVIDER_PARTIAL", requestId });
    if (message.startsWith("CNPJWS_FAILED:400")) return res.status(400).json({ error: "INVALID_CNPJ", requestId });
    if (message.startsWith("CNPJWS_FAILED:404")) return res.status(404).json({ error: "CNPJ_NOT_FOUND", requestId });
    if (message.startsWith("CNPJWS_FAILED:429")) return res.status(429).json({ error: "CNPJ_PROVIDER_RATE_LIMITED", requestId });
    if (/CNPJWS_FAILED:(500|502|503|504)/.test(message)) return res.status(502).json({ error: "CNPJ_PROVIDER_UNAVAILABLE", requestId });

    if (message === "SERPRO_CREDENTIALS_NOT_CONFIGURED" ||
        message === "SERPRO_ENDPOINT_TEMPLATE_NOT_CONFIGURED" ||
        message === "SERPRO_TRIAL_TOKEN_NOT_CONFIGURED") return res.status(503).json({ error: message, requestId });
    if (message.startsWith("SERPRO_TOKEN_FAILED:")) return res.status(503).json({ error: "SERPRO_AUTH_FAILED", requestId });
    if (message.startsWith("SERPRO_CNPJ_FAILED:400")) return res.status(400).json({ error: "INVALID_CNPJ", requestId });
    if (message.startsWith("SERPRO_CNPJ_FAILED:401")) return res.status(503).json({ error: "SERPRO_AUTH_FAILED", requestId });
    if (message.startsWith("SERPRO_CNPJ_FAILED:403")) return res.status(503).json({ error: "SERPRO_ACCESS_DENIED", requestId });
    if (message.startsWith("SERPRO_CNPJ_FAILED:404")) return res.status(404).json({ error: "CNPJ_NOT_FOUND", requestId });
    if (/SERPRO_CNPJ_FAILED:(500|502|504)/.test(message)) return res.status(502).json({ error: "CNPJ_PROVIDER_UNAVAILABLE", requestId });

    return res.status(500).json({ error: "CNPJ_LOOKUP_INTERNAL_ERROR", requestId });
  }
}
