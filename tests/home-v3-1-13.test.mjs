import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const here=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(here,"..");
const read=f=>fs.readFileSync(path.join(root,f),"utf8");

test("home usa exemplos humanos sem depender de uma máquina de cenário incorporada",()=>{
  const js=read("assets/site.js");
  for(const term of [
    "Meu chuveiro queimou agora à noite",
    "Vou receber visita amanhã",
    "Meu carro não liga de manhã"
  ]) assert.ok(js.includes(term),term);
  assert.doesNotMatch(read("index.html"),/assets\/home-demo\.js/);
});

test("exemplos preservam urgência, orçamento e restrição de deslocamento",()=>{
  const js=read("assets/site.js");
  for(const term of ["hoje à noite","orçamento","entrega","não consigo levar até a oficina","atendimento no local"]) assert.ok(js.includes(term),term);
});

test("home não expõe métricas artificiais de uma demo removida",()=>{
  const html=read("index.html");
  assert.doesNotMatch(html,/id="demo-new"|id="demo-context-metric-label"|id="demo-today"/);
  assert.doesNotMatch(html,/<small>NOVAS<\/small>/);
});
