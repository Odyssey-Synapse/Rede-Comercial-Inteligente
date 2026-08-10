import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(here,"..");
const read=f=>fs.readFileSync(path.join(root,f),"utf8");

test("proposta oficial oferece aceite comercial antes de imprimir",()=>{
  const js=read("assets/calculator-page.js");
  assert.match(js,/Aceitar proposta e continuar/);
  assert.match(js,/quote-acceptance-form/);
  assert.match(js,/\/api\/quote-accept/);
  assert.match(js,/acceptedTerms:true/);
});

test("aceite deixa claro que não é assinatura qualificada ou avançada",()=>{
  const js=read("assets/calculator-page.js");
  assert.match(js,/não é apresentado como assinatura eletrônica qualificada ou avançada/i);
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
