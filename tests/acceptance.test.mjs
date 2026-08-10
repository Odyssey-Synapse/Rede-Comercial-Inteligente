import test from "node:test";
import assert from "node:assert/strict";
import { acceptanceSnapshot, ACCEPTANCE_VERSION } from "../lib/acceptance-policy.mjs";

test("aceite exige identidade declarada minima",()=>{
  const quote={quote_id:"AA-Q-TEST123",cnpj:"11222333000181",company_name:"Empresa",mp_cents:14000,valid_until:new Date(Date.now()+100000).toISOString()};
  assert.throws(()=>acceptanceSnapshot({quote,acceptedByName:"",acceptedByEmail:"a@b.com",acceptedTerms:true}),/ACCEPTED_BY_NAME_REQUIRED/);
  assert.throws(()=>acceptanceSnapshot({quote,acceptedByName:"Gabriel",acceptedByEmail:"invalido"}),/ACCEPTED_BY_EMAIL_INVALID/);
});
test("snapshot preserva versão e dados centrais da proposta",()=>{
  const quote={quote_id:"AA-Q-TEST123",cnpj:"11222333000181",company_name:"Empresa",mp_cents:14000,valid_until:new Date(Date.now()+100000).toISOString()};
  const s=acceptanceSnapshot({quote,acceptedByName:"Gabriel",acceptedByEmail:"g@example.com",acceptedTerms:true});
  assert.equal(s.acceptanceVersion,ACCEPTANCE_VERSION);
  assert.equal(s.quoteId,"AA-Q-TEST123");
  assert.equal(s.mpCents,14000);
});
