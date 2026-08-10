import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const here=path.dirname(fileURLToPath(import.meta.url)), root=path.resolve(here,"..");
const read=f=>fs.readFileSync(path.join(root,f),"utf8");

test("API CNPJ falha fechada em parcial status e mismatch",()=>{
  const s=read("api/cnpj.js");
  for(const term of ["CNPJ_PROVIDER_PARTIAL","CNPJ_NOT_ACTIVE","CNPJ_PROVIDER_MISMATCH","NO_ELIGIBLE_CNAE_ACTIVITY"]) assert.ok(s.includes(term),term);
});
test("API CNPJ usa lookup V3 com origem do provedor",()=>{
  const s=read("api/cnpj.js");
  assert.match(s,/AA_COMPANY_LOOKUP_V3/);
  assert.match(s,/COMPANY_LOOKUP_TTL_MINUTES/);
  assert.match(s,/source: company\.provider/);
});
test("SERPRO permanece como provedor futuro",()=>{
  const s=read("lib/serpro-cnpj.mjs");
  assert.match(s,/AbortController/);
  assert.match(s,/x-request-tag/);
  assert.match(s,/SERPRO_TIMEOUT_MS/);
});
