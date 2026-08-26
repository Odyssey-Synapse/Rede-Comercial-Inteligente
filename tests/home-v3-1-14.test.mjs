import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

test('home preserva a visão de Rede no contrato canônico',()=>{
  const html=read('index.html');
  for(const term of [
    'A vida não vem separada em categorias',
    'Quando uma empresa sozinha não basta',
    'UMA NECESSIDADE · VÁRIAS CAPACIDADES',
    'Algumas regras precisam continuar verdadeiras quando a Rede crescer',
    'problemas reais da cidade'
  ]) assert.ok(html.includes(term),term);
});

test('home separa demonstração e operação disponível',()=>{
  const html=read('index.html');
  assert.match(html,/Pré-lançamento/);
  assert.match(html,/demonstrações abaixo são ilustrativas/i);
  assert.match(html,/Demonstração conceitual/);
  assert.match(html,/não representa clientes, parceiros ativos, vendas realizadas ou garantia de funcionalidade comercial disponível/i);
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

test('demo contém cenário composto com múltiplos parceiros e logística',()=>{
  const js=read('assets/home-demo.js');
  assert.match(js,/label:"resolução composta"/);
  assert.match(js,/2 parceiros \+ logística/);
  assert.match(js,/Mercado Bairro \+ Padaria da Praça \+ entrega/);
  assert.match(js,/um único pedido reuniu partes diferentes/i);
});

test('hero compacto usa exemplos no mesmo nível narrativo dos demos',()=>{
  const html=read('index.html');
  const js=read('assets/site.js');
  for(const chip of ['data-example="casa"','data-example="visita"','data-example="carro"']) assert.ok(html.includes(chip),chip);
  for(const term of ['Meu chuveiro queimou agora à noite','Vou receber visita amanhã','Meu carro não liga de manhã']) assert.ok(js.includes(term),term);
});
