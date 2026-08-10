import { normalizeCnpj } from "./cnpj.mjs";

const CACHE_SYMBOL = Symbol.for("projeto-rli.cnpjws.cache");
const cache = globalThis[CACHE_SYMBOL] || new Map();
globalThis[CACHE_SYMBOL] = cache;

function normalizeText(value = "") {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

const STATUS_BY_DESCRIPTION = Object.freeze({
  "nula": "1",
  "ativa": "2",
  "suspensa": "3",
  "inapta": "4",
  "ativa nao regular": "5",
  "baixada": "8"
});

function cleanActivity(raw) {
  if (!raw || typeof raw !== "object") return null;
  const code = String(raw.id ?? raw.codigo ?? raw.code ?? "").replace(/\D/g, "");
  const description = String(raw.descricao ?? raw.description ?? "").trim();
  if (code.length !== 7 || description.length < 2) return null;
  return { code, description };
}

function dedupeActivities(items = []) {
  const byCode = new Map();
  for (const item of items) {
    if (item?.code) byCode.set(item.code, item);
  }
  return [...byCode.values()];
}

export function normalizeCnpjWsRecord(data = {}) {
  const establishment = data.estabelecimento || {};
  const principal = cleanActivity(establishment.atividade_principal);
  const secondary = Array.isArray(establishment.atividades_secundarias)
    ? establishment.atividades_secundarias.map(cleanActivity).filter(Boolean)
    : [];
  const activities = dedupeActivities([principal, ...secondary].filter(Boolean));

  const statusDescription = String(establishment.situacao_cadastral || "").trim();
  const statusCode = STATUS_BY_DESCRIPTION[normalizeText(statusDescription)] || "UNKNOWN";
  const cnpj = normalizeCnpj(establishment.cnpj || "");
  const legalName = String(data.razao_social || "").trim();
  const tradeName = String(establishment.nome_fantasia || "").trim();
  const sourceUpdatedAt = establishment.atualizado_em || data.atualizado_em || null;

  return {
    cnpj,
    legalName,
    tradeName,
    status: { code: statusCode, description: statusDescription || "Não informada" },
    city: String(establishment.cidade?.nome || "").trim(),
    state: String(establishment.estado?.sigla || "").trim().toUpperCase(),
    principalActivity: principal,
    secondaryActivities: activities.filter((a) => a.code !== principal?.code),
    activities,
    activityCoverage: activities.length > (principal ? 1 : 0)
      ? "PRINCIPAL_AND_SECONDARY"
      : principal ? "PRINCIPAL_ONLY" : "NO_ACTIVITY",
    provider: "CNPJWS_PUBLIC_V1",
    sourceUpdatedAt,
    partial: !cnpj || !legalName || statusCode === "UNKNOWN"
  };
}

async function parseJson(response) {
  return response.json().catch(() => ({}));
}

function cacheTtlMs(env) {
  const raw = Number(env.CNPJ_CACHE_TTL_SECONDS || 900);
  const seconds = Math.min(86400, Math.max(60, Number.isFinite(raw) ? raw : 900));
  return seconds * 1000;
}

export async function fetchCnpjWs(cnpj, fetchImpl = fetch, env = process.env) {
  const normalized = normalizeCnpj(cnpj);
  if (normalized.length !== 14) throw new Error("INVALID_CNPJ");

  const base = String(env.CNPJWS_BASE_URL || "https://publica.cnpj.ws").replace(/\/+$/, "");
  const key = `${base}|${normalized}`;
  const cached = cache.get(key);
  if (cached && Date.now() < cached.expiresAt) return structuredClone(cached.value);
  if (cached) cache.delete(key);

  const controller = new AbortController();
  const timeoutRaw = Number(env.CNPJWS_TIMEOUT_MS || 8000);
  const timeoutMs = Math.min(20000, Math.max(2000, Number.isFinite(timeoutRaw) ? timeoutRaw : 8000));
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(`${base}/cnpj/${encodeURIComponent(normalized)}`, {
      method: "GET",
      headers: { accept: "application/json" },
      signal: controller.signal
    });
    const data = await parseJson(response);

    if (response.status !== 200) {
      const error = new Error(`CNPJWS_FAILED:${response.status}`);
      error.status = response.status;
      error.remote = data;
      throw error;
    }

    const company = normalizeCnpjWsRecord(data);
    if (!company.cnpj) throw new Error("CNPJWS_INVALID_RESPONSE");
    cache.set(key, { value: company, expiresAt: Date.now() + cacheTtlMs(env) });
    return structuredClone(company);
  } catch (error) {
    if (error?.name === "AbortError") throw new Error("CNPJWS_TIMEOUT");
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export function clearCnpjWsCacheForTests() {
  cache.clear();
}
