import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const here=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(here,"..");
const read=f=>fs.readFileSync(path.join(root,f),"utf8");

test("cenário de urgência residencial mantém contexto até a solução",()=>{
  const js=read("assets/home-demo.js");
  for(const term of [
    "Meu chuveiro queimou agora à noite",
    "porque tenho criança em casa",
    "Hoje à noite",
    "equipamento já comprado",
    'quote:"Instalação + verificação no local"'
  ]) assert.ok(js.includes(term),term);
});

test("cenário composto preserva orçamento, parceiros e entrega",()=>{
  const js=read("assets/home-demo.js");
  for(const term of [
    "Vou receber visita amanhã cedo",
    "no máximo R$ 90",
    "Mercado Bairro + Padaria da Praça + entrega",
    "2 parceiros + logística",
    'quote:"Mercado + padaria + entrega"'
  ]) assert.ok(js.includes(term),term);
});

test("cenário de veículo respeita a restrição de deslocamento",()=>{
  const js=read("assets/home-demo.js");
  for(const term of [
    "Meu carro não liga de manhã",
    "não consigo levar o carro até a oficina",
    "atendimento no local",
    'quote:"Diagnóstico inicial no local"'
  ]) assert.ok(js.includes(term),term);
});

test("painel da demo mantém métrica contextual e não volta ao rótulo HOJE",()=>{
  const html=read("index.html");
  const js=read("assets/home-demo.js");
  assert.match(html,/id="demo-new">0<\/strong>/);
  assert.match(html,/<small>NOVAS<\/small>/);
  assert.match(html,/id="demo-context-metric-label"/);
  assert.match(js,/contextMetricLabel/);
  assert.doesNotMatch(html,/id="demo-today"/);
});

