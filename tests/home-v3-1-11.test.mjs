import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

test('versão do pacote preserva a evolução institucional e incorpora o Assistente',()=>{
  const pkg=JSON.parse(read('package.json'));
  assert.equal(pkg.version,'3.2.0');
  assert.match(pkg.scripts['test:consumer'],/assistant-api\.test\.mjs/);
});

test('home integra demo multi-cenário claramente hipotética',()=>{
  const html=read('index.html');
  assert.match(html,/id="demonstracao"/);
  assert.match(html,/DEMONSTRAÇÃO — cenário hipotético/);
  assert.match(html,/assets\/home-demo\.js/);
  assert.match(html,/não representa clientes, parceiros ativos, vendas realizadas ou garantia de funcionalidade comercial disponível/i);
});

test('demo possui três cenários e loops contínuos',()=>{
  const js=read('assets/home-demo.js');
  for(const term of ['urgência em casa','resolução composta','restrição de deslocamento']) assert.ok(js.includes(term),term);
  assert.match(js,/scenarioIndex=\(scenarioIndex\+1\)%scenarios\.length/);
  assert.match(js,/while\(id===impactRun/);
  assert.match(js,/while\(id===xrayRun/);
  assert.match(js,/const base=1120/);
});

test('demo preserva controles e velocidade padrão confortável',()=>{
  const html=read('index.html');
  for(const id of ['id="demo-prev"','id="demo-play"','id="demo-next"','id="demo-restart"','id="demo-speed"']) assert.ok(html.includes(id),id);
  assert.match(html,/value="1" selected>Normal/);
  assert.match(html,/value="1\.28">Lenta/);
  assert.match(html,/value="\.78">Rápida/);
});

test('condição Fundador aparece na página comercial com o contrato vigente',()=>{
  const html=read('empresas.html');
  for(const term of ['54 iniciais','CATÁLOGO · FUNDADOR','SERVIÇO · FUNDADOR','SERVIÇO + CATÁLOGO · FUNDADOR','R$ 149','R$ 199','R$ 249']) assert.ok(html.includes(term),term);
  assert.match(html,/mensalidade recorrente permanece em R\$ 0 enquanto a condição estiver válida/i);
  assert.match(html,/não reservam automaticamente uma posição entre os 54 iniciais/i);
});

test('transparência separa papel, preço e confirmação',()=>{
  const html=read('transparencia.html');
  assert.match(html,/Preço, participação e relevância precisam continuar separados/);
  assert.match(html,/Fundador é uma condição comercial — não um tipo diferente de empresa/);
  assert.match(html,/Formulário e simulação não reservam posição entre os 54/);
  assert.match(html,/antes de qualquer cobrança/);
});

test('topbar inclui link global para Contato',()=>{
  const js=read('assets/site.js');
  assert.match(js,/\['\/contato\.html','Contato'\]|\["\/contato\.html","Contato"\]/);
});
