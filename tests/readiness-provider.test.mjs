import test from "node:test";
import assert from "node:assert/strict";
import { productionReadiness } from "../lib/readiness.mjs";

function base(){
  return {
    CNPJ_PROVIDER:"cnpjws",
    COMPANY_LOOKUP_SIGNING_SECRET:"a".repeat(32),
    QUOTE_SIGNING_SECRET:"b".repeat(32),
    DATABASE_URL:"postgres://example",
    TURNSTILE_REQUIRED:"true",
    PUBLIC_TURNSTILE_SITE_KEY:"site",
    TURNSTILE_SECRET_KEY:"secret",
    RESEND_API_KEY:"re_test",
    RESEND_FROM_EMAIL:"onboarding@resend.dev",
    CONTACT_DESTINATION_EMAIL:"owner@example.test",
    CONTROLLER_LEGAL_NAME:"Controlador",
    CONTROLLER_DOCUMENT:"Documento",
    PRIVACY_POLICY_STATUS:"APPROVED"
  };
}

test("CNPJ.ws não exige SERPRO no readiness",()=>{
  const r=productionReadiness(base());
  assert.equal(r.provider,"cnpjws");
  assert.equal(r.checks.some(x=>x.id==="SERPRO_CONSUMER_KEY"),false);
  assert.equal(r.ready,true);
});

test("SERPRO exige credenciais quando selecionado",()=>{
  const r=productionReadiness({...base(),CNPJ_PROVIDER:"serpro"});
  assert.equal(r.ready,false);
  assert.ok(r.blockers.some(x=>x.id==="SERPRO_CONSUMER_KEY"));
});
