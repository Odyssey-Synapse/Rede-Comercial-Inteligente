import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const publicFiles=[
  "index.html","rede.html","empresas.html","tecnologia.html","transparencia.html",
  "calculadora.html","contato.html","privacidade.html","assets/site.js","assets/home-demo.js",
  "assets/calculator-page.js","assets/contact-page.js","api/contact.js"
];

test("V3.1.15 remove a denominação anterior das superfícies públicas",()=>{
  for(const file of publicFiles){
    const text=readFileSync(file,"utf8");
    assert.doesNotMatch(text,/Achei Aqui|achei aqui|ACHEI AQUI/);
  }
});

test("V3.1.15 deixa explícito que Projeto RLI é nome provisório",()=>{
  const home=readFileSync("index.html","utf8");
  const site=readFileSync("assets/site.js","utf8");
  assert.match(home,/Projeto RLI/);
  assert.match(home,/nome provisório/i);
  assert.match(home,/razão social/i);
  assert.match(site,/NOME PROVISÓRIO/);
});

test("V3.1.15 separa produto e pessoa jurídica",()=>{
  const home=readFileSync("index.html","utf8");
  const empresas=readFileSync("empresas.html","utf8");
  assert.match(home,/Operadora da Rede/);
  assert.match(empresas,/Operadora da Rede/);
});
