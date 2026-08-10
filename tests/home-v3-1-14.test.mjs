import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const here=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(here,"..");
const read=f=>fs.readFileSync(path.join(root,f),"utf8");

test("V3.1.14 eleva a home da venda curta para visão de Rede",()=>{
  const html=read("index.html");
  for(const term of [
    "Explique o que está acontecendo. A Rede trabalha para chegar à solução.",
    "A vida não vem separada por categorias",
    "Uma intenção pode movimentar uma Rede inteira",
    "Como esta Rede pretende crescer",
    "Uma porta de entrada útil para a cidade"
  ]) assert.ok(html.includes(term),term);
});

test("home separa horizonte de produto de funcionalidade disponível hoje",()=>{
  const html=read("index.html");
  assert.match(html,/direção de produto, não promessa de funcionalidade disponível hoje/i);
  assert.match(html,/não são apresentadas como operação disponível hoje/i);
  assert.match(html,/não representam funcionalidades comerciais já disponíveis em produção/i);
});

test("Founder ganha narrativa de construção sem virar participação societária ou promessa financeira",()=>{
  const html=read("index.html");
  assert.match(html,/Os Fundadores participam da fase que ajuda a colocá-la de pé/);
  assert.match(html,/Fundador não é apenas quem chegou primeiro\. É quem fez parte do começo/);
  assert.match(html,/não representa participação societária/i);
  assert.match(html,/não constitui promessa de resultado financeiro/i);
  assert.match(html,/mensalidade Founder de R\$ 0 enquanto a condição permanecer válida/i);
});

test("copy empresarial explica participação como capacidade e crescimento conjunto",()=>{
  const html=read("empresas.html");
  assert.match(html,/Não é só vender mais/);
  assert.match(html,/capacidade real de resolução/i);
  assert.match(html,/Crescer não deveria significar ser punida por dar certo/);
  assert.match(html,/pagamento não compra relevância orgânica/i);
});

test("demo contém cenário composto com múltiplos parceiros e logística",()=>{
  const js=read("assets/home-demo.js");
  assert.match(js,/label:"resolução composta"/);
  assert.match(js,/2 parceiros \+ logística/);
  assert.match(js,/Mercado Bairro \+ Padaria da Praça \+ entrega/);
  assert.match(js,/uma única intenção/i);
});

test("hero compacto usa exemplos no mesmo nível narrativo dos demos",()=>{
  const html=read("index.html"),js=read("assets/site.js");
  for(const chip of ['data-example="casa"','data-example="visita"','data-example="carro"']) assert.ok(html.includes(chip),chip);
  for(const term of ["Meu chuveiro queimou agora à noite","Vou receber visita amanhã","Meu carro não liga de manhã"]) assert.ok(js.includes(term),term);
});
