import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(here,"..");
const read=f=>fs.readFileSync(path.join(root,f),"utf8");

test("calculadora deixa claro que simulação não é proposta oficial nem aceite",()=>{
  const js=read("assets/capacity-calculator.js"),html=read("calculadora.html");
  assert.match(js,/não é proposta oficial, contrato, cobrança automática nem reserva/i);
  assert.doesNotMatch(js+html,/Aceitar proposta e continuar|quote-acceptance-form/);
});

test("aceite oficial permanece somente na API e política de aceite",()=>{
  const api=read("api/quote-accept.js"),policy=read("lib/acceptance-policy.mjs");
  assert.match(api,/ACEITE_COMERCIAL_REGISTRADO/);
  assert.match(policy,/acceptedTerms !== true/);
  assert.doesNotMatch(api+policy,/assinatura eletrônica qualificada|assinatura eletrônica avançada/i);
});

test("API de aceite impede duplicidade, vencimento e cancelamento",()=>{
  const api=read("api/quote-accept.js");
  assert.match(api,/QUOTE_ALREADY_ACCEPTED/);
  assert.match(api,/QUOTE_EXPIRED/);
  assert.match(api,/QUOTE_CANCELLED/);
  assert.match(api,/ACCEPTANCE_TERMS_REQUIRED/);
});

test("snapshot exige manifestação explícita de aceite",()=>{
  const policy=read("lib/acceptance-policy.mjs");
  assert.match(policy,/acceptedTerms !== true/);
  assert.match(policy,/ACCEPTANCE_TERMS_REQUIRED/);
});
