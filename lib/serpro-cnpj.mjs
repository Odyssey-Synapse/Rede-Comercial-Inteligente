import crypto from "node:crypto";
import { normalizeCnpj } from "./cnpj.mjs";

let tokenCache = null;

const STATUS = Object.freeze({
  "1": "Nula",
  "2": "Ativa",
  "3": "Suspensa",
  "4": "Inapta",
  "5": "Ativa Não Regular",
  "8": "Baixada"
});

function digits7(value = "") {
  const code = String(value).replace(/\D/g, "");
  return code.length === 7 ? code : "";
}

function cleanActivity(raw, fallbackDescription = "") {
  if (!raw) return null;
  if (typeof raw === "string" || typeof raw === "number") {
    const code = digits7(raw);
    if (!code) return null;
    return { code, description: String(fallbackDescription || `CNAE ${code}`).trim() };
  }
  if (typeof raw !== "object") return null;
  const code = digits7(raw.codigo ?? raw.code ?? raw.cnae ?? raw.cnaeFiscal ?? "");
  const description = String(
    raw.descricao ?? raw.description ?? raw.texto ?? raw.nome ?? fallbackDescription ?? ""
  ).trim();
  if (!code) return null;
  return { code, description: description || `CNAE ${code}` };
}

function get(data, path) {
  return path.split(".").reduce((obj, part) => obj?.[part], data);
}

function first(data, paths, fallback = undefined) {
  for (const path of paths) {
    const value = get(data, path);
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return fallback;
}

function firstArray(data, paths) {
  for (const path of paths) {
    const value = get(data, path);
    if (Array.isArray(value)) return value;
  }
  return [];
}

function normalizeStatusCode(value = "") {
  const s = String(value).trim().replace(/^0+/, "");
  return s || String(value).trim();
}

function dedupeActivities(items = []) {
  const map = new Map();
  for (const item of items) {
    if (!item?.code) continue;
    const existing = map.get(item.code);
    if (!existing || existing.description.startsWith("CNAE ")) map.set(item.code, item);
  }
  return [...map.values()];
}

export function normalizeSerproRecord(data = {}) {
  // API Consulta CNPJ V2 shape
  const principalRaw = first(data, [
    "cnae_principal",
    "cnaePrincipal",
    "estabelecimento.cnae_principal",
    "estabelecimento.cnaePrincipal"
  ]);

  // Shared Registry / alternative integration shapes
  const principalCode = first(data, [
    "estabelecimento.cnaeFiscal",
    "cnaeFiscal",
    "estabelecimento.cnae_fiscal",
    "cnae_fiscal"
  ]);
  const principalDescription = first(data, [
    "estabelecimento.cnaeFiscalDescricao",
    "cnaeFiscalDescricao",
    "descricaoCnaeFiscal",
    "descricao_cnae_fiscal"
  ], "");

  const principal = cleanActivity(principalRaw) || cleanActivity(principalCode, principalDescription);

  const secondaryRaw = firstArray(data, [
    "cnaes_secundarios",
    "cnaes_secundarias",
    "cnae_secundarias",
    "cnaeSecundarias",
    "cnaesSecundarios",
    "estabelecimento.cnaesSecundarias",
    "estabelecimento.cnaeSecundarias",
    "estabelecimento.cnaes_secundarias"
  ]);

  const secondary = secondaryRaw.map((raw) => cleanActivity(raw)).filter(Boolean);
  const activities = dedupeActivities([principal, ...secondary].filter(Boolean));

  const statusRaw = first(data, [
    "situacao_cadastral.codigo",
    "situacaoCadastral.codigo",
    "estabelecimento.situacaoCadastral",
    "estabelecimento.situacao_cadastral",
    "situacaoCadastral",
    "situacao_cadastral"
  ], "");
  const statusCode = normalizeStatusCode(statusRaw);
  const statusDescription = String(first(data, [
    "situacao_cadastral.descricao",
    "situacaoCadastral.descricao",
    "estabelecimento.situacaoCadastralDescricao",
    "descricaoSituacaoCadastral"
  ], STATUS[statusCode] || "")).trim();

  const address = first(data, ["endereco", "estabelecimento.endereco"], {}) || {};

  return {
    cnpj: normalizeCnpj(first(data, ["ni","cnpj","estabelecimento.cnpj","id"], "")),
    legalName: String(first(data, [
      "nome_empresarial","nomeEmpresarial","razao_social","razaoSocial","matriz.nomeEmpresarial"
    ], "")).trim(),
    tradeName: String(first(data, [
      "nome_fantasia","nomeFantasia","estabelecimento.nomeFantasia"
    ], "")).trim(),
    status: { code: statusCode, description: statusDescription || "Não informada" },
    city: String(first(data, [
      "endereco.municipio","endereco.nomeMunicipio",
      "estabelecimento.municipio","estabelecimento.nomeMunicipio",
      "municipio","nomeMunicipio"
    ], "")).trim(),
    state: String(first(data, [
      "endereco.uf","estabelecimento.uf","uf"
    ], "")).trim().toUpperCase(),
    principalActivity: principal,
    secondaryActivities: activities.filter((a) => a.code !== principal?.code),
    activities,
    activityCoverage: activities.length > (principal ? 1 : 0)
      ? "PRINCIPAL_AND_SECONDARY"
      : principal ? "PRINCIPAL_ONLY" : "NO_ACTIVITY",
    provider: "SERPRO_CNPJ_V2"
  };
}

async function parseJson(response) {
  return response.json().catch(() => ({}));
}

async function getProductionToken(fetchImpl = fetch) {
  const key = process.env.SERPRO_CONSUMER_KEY;
  const secret = process.env.SERPRO_CONSUMER_SECRET;
  if (!key || !secret) throw new Error("SERPRO_CREDENTIALS_NOT_CONFIGURED");

  if (tokenCache && Date.now() < tokenCache.expiresAt - 60000) return tokenCache.token;

  const tokenUrl = process.env.SERPRO_TOKEN_URL || "https://gateway.apiserpro.serpro.gov.br/token";
  const auth = Buffer.from(`${key}:${secret}`).toString("base64");
  const response = await fetchImpl(tokenUrl, {
    method: "POST",
    headers: {
      authorization: `Basic ${auth}`,
      "content-type": "application/x-www-form-urlencoded",
      accept: "application/json"
    },
    body: "grant_type=client_credentials"
  });
  const data = await parseJson(response);
  if (!response.ok || !data.access_token) {
    const error = new Error(`SERPRO_TOKEN_FAILED:${response.status}`);
    error.status = response.status;
    error.remote = data;
    throw error;
  }
  const ttl = Math.max(60, Number(data.expires_in || 3295));
  tokenCache = { token: data.access_token, expiresAt: Date.now() + ttl * 1000 };
  return tokenCache.token;
}

function endpointFor(cnpj) {
  const mode = String(process.env.SERPRO_MODE || "production").toLowerCase();

  if (mode === "trial") {
    const template = process.env.SERPRO_CNPJ_ENDPOINT_TEMPLATE ||
      "https://gateway.apiserpro.serpro.gov.br/consulta-cnpj-df-trial/v2/empresa/{cnpj}";
    return template.replace("{cnpj}", encodeURIComponent(cnpj));
  }

  const template = process.env.SERPRO_CNPJ_ENDPOINT_TEMPLATE;
  if (!template || !template.includes("{cnpj}")) {
    throw new Error("SERPRO_ENDPOINT_TEMPLATE_NOT_CONFIGURED");
  }
  return template.replace("{cnpj}", encodeURIComponent(cnpj));
}

function requestTag() {
  const prefix = String(process.env.SERPRO_REQUEST_TAG_PREFIX || "ACHEIAQUI").replace(/[^A-Za-z0-9_-]/g,"").slice(0,16) || "ACHEIAQUI";
  return `${prefix}-${crypto.randomBytes(5).toString("hex")}`.slice(0,32);
}

export async function fetchOfficialCnpj(cnpj, fetchImpl = fetch) {
  const normalized = normalizeCnpj(cnpj);
  if (normalized.length !== 14) throw new Error("INVALID_CNPJ");

  const mode = String(process.env.SERPRO_MODE || "production").toLowerCase();
  const token = mode === "trial"
    ? process.env.SERPRO_TRIAL_BEARER_TOKEN
    : await getProductionToken(fetchImpl);

  if (!token) throw new Error("SERPRO_TRIAL_TOKEN_NOT_CONFIGURED");

  const controller = new AbortController();
  const timeoutMs = Math.max(2000, Number(process.env.SERPRO_TIMEOUT_MS || 8000));
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(endpointFor(normalized), {
      method: "GET",
      headers: {
        accept: "application/json",
        authorization: `Bearer ${token}`,
        "x-request-tag": requestTag()
      },
      signal: controller.signal
    });
    const data = await parseJson(response);

    if (![200,206].includes(response.status)) {
      const error = new Error(`SERPRO_CNPJ_FAILED:${response.status}`);
      error.status = response.status;
      error.remote = data;
      throw error;
    }

    const normalizedRecord = normalizeSerproRecord(data);
    if (!normalizedRecord.cnpj) normalizedRecord.cnpj = normalized;
    normalizedRecord.partial = response.status === 206;
    return normalizedRecord;
  } catch (error) {
    if (error?.name === "AbortError") throw new Error("SERPRO_TIMEOUT");
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export function clearSerproTokenCacheForTests() {
  tokenCache = null;
}
