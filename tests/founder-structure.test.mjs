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
test("Founder real falha fechado sem privacidade aprovada mas sandbox continua testável",()=>{
  const api=read("api/founder-status.js"),config=read("api/public-config.js");
  assert.match(api,/founderEnrollmentAllowed=.*mercadoPagoTestMode\(\).*PRIVACY_POLICY_STATUS===?"APPROVED"/);
  assert.match(api,/function assertFounderEnrollmentAllowed/);
  assert.ok((api.match(/assertFounderEnrollmentAllowed\(\)/g)||[]).length>=5);
  assert.match(config,/founderEnrollmentEnabled:\s*privacyPolicyApproved\s*\|\|\s*mercadoPagoTestMode/);
});
test("Founder explica uso de dados e provedor de Pix antes de concluir entrada",()=>{
  const html=read("fundador.html"),privacy=read("privacidade.html");
  assert.match(html,/Veja como os dados deste fluxo são tratados/);
  assert.match(html,/Pix é processado pelo Mercado Pago/);
  assert.match(html,/não pede senha bancária/);
  assert.match(privacy,/Empresa Fundadora/);
  assert.match(privacy,/Mercado Pago/);
  assert.match(privacy,/CNPJ, razão social, nome fantasia/);
});
