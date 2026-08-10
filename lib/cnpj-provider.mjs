import { fetchCnpjWs } from "./cnpjws.mjs";
import { fetchOfficialCnpj } from "./serpro-cnpj.mjs";

export function configuredCnpjProvider(env = process.env) {
  return String(env.CNPJ_PROVIDER || "cnpjws").trim().toLowerCase();
}

export async function fetchCnpjRecord(cnpj, fetchImpl = fetch, env = process.env) {
  const provider = configuredCnpjProvider(env);
  if (provider === "cnpjws") return fetchCnpjWs(cnpj, fetchImpl, env);
  if (provider === "serpro") return fetchOfficialCnpj(cnpj, fetchImpl);
  throw new Error("CNPJ_PROVIDER_UNSUPPORTED");
}
