import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

test('home preserva a proposta atual de reduzir o trabalho de procurar',()=>{
  const html=read('index.html');
  for(const term of [
    'Precisa de alguma coisa em Uberaba?',
    'Fala o que você precisa. O Uai Perto te ajuda a encontrar.',
    'Hoje, encontrar uma coisa simples pode dar trabalho',
    'É esse trabalho que o Uai Perto quer diminuir.',
    'Você não precisa saber tudo para começar'
  ]) assert.ok(html.includes(term),term);
});

test('operação real e demonstração continuam separadas',()=>{
  const home=read('index.html');
  const demo=read('testar.html');
  assert.match(home,/href="\/testar">/);
  assert.match(demo,/Demonstração pública/);
  assert.match(demo,/Cidade fictícia do teste/);
  assert.match(demo,/Nenhum negócio real é apresentado como parceiro/);
});

test('Founder permanece condição comercial confirmada, não reserva automática',()=>{
  const empresas=read('empresas.html');
  const transparencia=read('transparencia.html');
  assert.match(empresas,/A condição Fundador muda o preço\. Não muda o papel da empresa/);
  assert.match(empresas,/mensalidade recorrente permanece em R\$ 0 enquanto a condição estiver válida/i);
  assert.match(empresas,/não reservam automaticamente uma posição entre os 54 iniciais/i);
  assert.match(transparencia,/Fundador é uma condição comercial — não um tipo diferente de empresa/);
});

test('copy empresarial explica papéis, capacidade e relevância',()=>{
  const html=read('empresas.html');
  assert.match(html,/Eu vendo produtos/);
  assert.match(html,/Eu presto serviços/);
  assert.match(html,/A Rede precisa caber na rotina da empresa/);
  assert.match(html,/Pagar não compra relevância/);
});

test('Home oferece exemplos humanos via shell sem exigir categorias',()=>{
  const html=read('index.html');
  const js=read('assets/site.js');
  assert.match(html,/Meu chuveiro parou de funcionar/);
  for(const term of ['Meu chuveiro queimou agora à noite','Vou receber visita amanhã','Meu carro não liga de manhã']) assert.ok(js.includes(term),term);
  assert.doesNotMatch(html,/id="demonstracao"/);
});
