import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,"..");
const read=f=>fs.readFileSync(path.join(root,f),"utf8");

test("versão do pacote é 3.1.11",()=>{
  const pkg=JSON.parse(read("package.json"));
  assert.equal(pkg.version,"3.1.11");
});

test("home integra demo multi-cenário claramente hipotética",()=>{
  const html=read("index.html");
  assert.match(html,/id="demonstracao"/);
  assert.match(html,/DEMONSTRAÇÃO — cenário hipotético/);
  assert.match(html,/assets\/home-demo\.js/);
  assert.match(html,/não representa cliente, parceiro ativo, venda realizada ou resultado comprovado/i);
});

test("demo possui três cenários e loop contínuo",()=>{
  const js=read("assets/home-demo.js");
  for(const term of ["elétrica residencial","climatização comercial","chaveiro emergencial"]) assert.ok(js.includes(term),term);
  assert.match(js,/scenarioIndex=\(scenarioIndex\+1\)%scenarios\.length/);
  assert.match(js,/while\(id===runId\)/);
  assert.match(js,/const base=1120/);
});

test("demo preserva controles e velocidade padrão mais confortável",()=>{
  const html=read("index.html");
  for(const id of ['id="demo-prev"','id="demo-play"','id="demo-next"','id="demo-restart"','id="demo-speed"']) assert.ok(html.includes(id),id);
  assert.match(html,/value="1" selected>Normal/);
  assert.match(html,/value="1\.28">Lenta/);
  assert.match(html,/value="\.78">Rápida/);
});

test("Programa Parceiros Fundadores aparece como bloco comercial completo",()=>{
  const html=read("index.html");
  for(const term of ["Programa Parceiros Fundadores","25 empresas","R$ 400","R$ 150","R$ 250","Depois das 25 vagas"]) assert.ok(html.includes(term),term);
  assert.match(html,/mensalidade Founder de R\$ 0 enquanto a condição permanecer válida/i);
  assert.match(html,/condição de Fundador não será automaticamente estendida/i);
});

test("destinação aprovada das duas etapas é apresentada sem expor R$ 500",()=>{
  const html=read("index.html");
  assert.match(html,/Estruturação inicial da Rede/);
  assert.match(html,/tecnologia, infraestrutura, operação, desenvolvimento e demais despesas necessárias à implantação/);
  assert.match(html,/marketing e lançamento em massa da Rede/);
  assert.doesNotMatch(html,/R\$\s*500/);
});

test("Programa deixa claro que Fundador não é participação societária",()=>{
  const html=read("index.html");
  assert.match(html,/não representa participação societária/i);
});
