function normalize(value=""){
  return String(value).toUpperCase().replace(/[^0-9A-Z]/g,"");
}

function parseList(raw=""){
  return [...new Set(
    String(raw)
      .split(/[\s,;]+/)
      .map(normalize)
      .filter(Boolean)
  )];
}

export function founderRegistryFromEnv() {
  return parseList(process.env.FOUNDER_CNPJ_REGISTRY || "");
}

export function isFounderCnpj(cnpj, registry = founderRegistryFromEnv()) {
  const normalized = normalize(cnpj);
  return Boolean(normalized) && registry.includes(normalized);
}

export function founderRegistryStatus() {
  const registry = founderRegistryFromEnv();
  return {
    configured: registry.length > 0,
    count: registry.length,
    maxExpected: 25
  };
}

export function assertFounderRegistryLimit(registry = founderRegistryFromEnv()) {
  if (registry.length > 25) throw new Error("FOUNDER_REGISTRY_LIMIT_EXCEEDED");
  return true;
}
