import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const here=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(here,"..");
const read=f=>fs.readFileSync(path.join(root,f),"utf8");

test("Founder tem caminho direto para proposta e contato sem CTA agressivo",()=>{
 const html=read("index.html");
 assert.match(html,/Calcular proposta →/);
 assert.match(html,/Falar com a Rede/);
 assert.match(html,/Entrar em contato/);
 assert.match(html,/condição de Parceiro Fundador é comercial e não representa participação societária/i);
});

test("status de vagas usa API real e possui fallback sem inventar disponibilidade",()=>{
 const module=read("assets/founder-status.js");
 const home=read("index.html");
 assert.match(module,/\/api\/founder-status/);
 assert.match(module,/A disponibilidade é confirmada no fluxo comercial/);
 assert.match(module,/remaining/);
 assert.match(home,/data-founder-status/);
});

test("calculadora conecta proposta convencional ao Programa de Fundadores",()=>{
 const js=read("assets/calculator-page.js");
 assert.match(js,/Este valor representa a condição comercial convencional/);
 assert.match(js,/mensalidade Founder de <strong>R\$ 0<\/strong>/);
 assert.match(js,/A entrada no Programa é confirmada separadamente/);
 assert.match(js,/q\.founderVerified/);
 assert.match(js,/quote-founder-status/);
});

test("Founder reconhecido continua exibindo R$ 0 sem alterar regra contratual",()=>{
 const js=read("assets/calculator-page.js");
 const calc=read("lib/calculator.mjs");
 assert.match(js,/Este CNPJ está reconhecido como Parceiro Fundador/);
 assert.match(calc,/founderVerified \? policy\.founderMonthlyCents : pmeCents/);
});
