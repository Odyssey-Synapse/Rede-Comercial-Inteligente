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

test('home mantém demonstração fora da landing e aponta para /testar',()=>{
  const html=read('index.html');
  assert.doesNotMatch(html,/id="demonstracao"|assets\/home-demo\.js/);
  assert.match(html,/href="\/testar">Ver demonstração →/);
  assert.match(html,/href="\/testar">Testar o Uai Perto →/);
  assert.match(html,/cidade e empresas fictícias/i);
  assert.match(read('testar.html'),/Ambiente de demonstração/);
  assert.match(read('testar.html'),/Nenhum negócio real é apresentado como parceiro/);
});

test('home não reintroduz controles de uma demo incorporada obsoleta',()=>{
  const html=read('index.html');
  for(const id of ['demo-prev','demo-play','demo-next','demo-restart','demo-speed']) assert.doesNotMatch(html,new RegExp(`id=["']${id}["']`));
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
