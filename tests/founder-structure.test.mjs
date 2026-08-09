import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const here=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(here,"..");
const read=f=>fs.readFileSync(path.join(root,f),"utf8");

test("migração 002 registra founder e aceite",()=>{
  const s=read("migrations/002_founder_acceptance.sql");
  for(const x of ["founder_applied","accepted_by_name","accepted_by_email","accepted_at","acceptance_version"]) assert.ok(s.includes(x),x);
});
test("api de aceite não chama assinatura jurídica",()=>{
  const s=read("api/quote-accept.js");
  assert.match(s,/ACEITE_COMERCIAL_REGISTRADO/);
  assert.doesNotMatch(s,/assinatura qualificada|assinatura avançada/i);
});
test("founder não é exposto como lista na API pública",()=>{
  const s=read("api/founder-status.js");
  assert.match(s,/count/);
  assert.doesNotMatch(s,/FOUNDER_CNPJ_REGISTRY/);
});
