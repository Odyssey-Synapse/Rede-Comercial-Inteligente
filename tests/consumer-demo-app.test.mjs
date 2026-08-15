import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {SCENARIOS,advanceState,beginScenario,chooseAnswer,scenarioView} from '../assets/testar-flow.mjs';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

test('/testar existe como aplicação Consumer determinística e independente',()=>{
  const html=read('testar.html');
  assert.match(html,/O que você precisa resolver\?/);
  assert.match(html,/class="demo-app"/);
  assert.match(html,/assets\/testar\.css/);
  assert.match(html,/assets\/testar\.js/);
  assert.match(html,/Demonstração/);
  assert.doesNotMatch(html,/<form\b/i);

  const script=read('assets/testar.js');
  assert.doesNotMatch(script,/\bfetch\s*\(|\/api\//i);
});

test('a demonstração não expõe interfaces ou termos operacionais',()=>{
  const surface=[
    read('testar.html'),read('assets/testar.css'),read('assets/testar.js'),
    read('assets/testar-flow.mjs')
  ].join('\n').toLowerCase();
  for(const forbidden of [
    'painel da empresa','inbox da empresa','company','backoffice','resolva aí',
    'mcir','survival kernel','semantic runtime','scores','traces','internals'
  ])assert.equal(surface.includes(forbidden),false,forbidden);
});

test('os três cenários provam caminhos diferentes de uma busca por categoria',()=>{
  assert.deepEqual(Object.keys(SCENARIOS),['chuveiro','carro','compras']);
  assert.match(SCENARIOS.chuveiro.userText,/chuveiro queimou/i);
  assert.match(SCENARIOS.chuveiro.variants.buy.summary,/chuveiro compatível \+ instalação/);
  assert.match(SCENARIOS.carro.userText,/não consigo levar até a oficina/i);
  assert.match(SCENARIOS.carro.variants.onsite.summary,/diagnóstico no local/);
  assert.match(SCENARIOS.compras.userText,/até R\$ 100/);
  assert.match(SCENARIOS.compras.variants.delivery.summary,/lista de compras \+ entrega/);
});

test('cada cenário pode chegar deterministicamente ao estado final',()=>{
  const answers={chuveiro:'buy',carro:'onsite',compras:'delivery'};
  for(const [scenarioId,answerId] of Object.entries(answers)){
    let state=beginScenario(scenarioId);
    assert.equal(state.phase,'question');
    state=chooseAnswer(state,answerId);
    assert.equal(state.phase,'progress');
    for(let safety=0;state.phase!=='complete'&&safety<10;safety++)state=advanceState(state);
    assert.equal(state.phase,'complete',scenarioId);
    assert.ok(scenarioView(state).variant.path.length>=1,scenarioId);
  }
});

test('o convite de participação fica oculto até a conclusão',()=>{
  const html=read('testar.html');
  const script=read('assets/testar.js');
  assert.match(html,/<section class="complete-screen" id="demo-complete"[^>]*hidden/);
  assert.match(html,/href="\/participar\.html\?perfil=consumidor&amp;origem=demo"/);
  assert.match(script,/completion\.hidden=true/);
  assert.match(script,/function renderComplete[\s\S]*completion\.hidden=false/);
  assert.doesNotMatch(html,/id="consumer-form"|id="company-form"/);
});

test('Testar outra situação reinicia todo o fluxo',()=>{
  const html=read('testar.html');
  const script=read('assets/testar.js');
  assert.match(html,/id="restart-demo"[^>]*>Testar outra situação</);
  assert.match(script,/#restart-demo'\)\?\.addEventListener\('click',restartDemo\)/);
  assert.match(script,/function restartDemo\(\)[\s\S]*state=null[\s\S]*completion\.hidden=true[\s\S]*start\.hidden=false/);
});

test('CTAs de experimentação apontam para /testar e captação continua separada',()=>{
  const home=read('index.html');
  const network=read('rede.html');
  const personal=read('meu-uai-perto.html');
  const site=read('assets/site.js');
  const personalScript=read('assets/meu-uai-perto.js');

  assert.match(home,/href="\/testar">Quero testar como consumidor →/);
  assert.match(home,/href="\/testar">Testar como consumidor →/);
  assert.match(network,/href="\/testar">Quero testar como consumidor →/);
  assert.match(personal,/href="\/testar">Quero testar como consumidor →/);
  assert.match(site,/href="\/testar">Quero testar como consumidor/);
  assert.match(personalScript,/href="\/testar">Quero testar com uma necessidade real →/);

  assert.match(home,/href="\/participar\.html\?perfil=consumidor">Quero ajudar no pré-lançamento/);
  assert.match(personal,/href="\/participar\.html\?perfil=consumidor#consumer-panel">Ativar formulário do consumidor/);
  assert.doesNotMatch(site,/querySelectorAll\('a\[href="\/participar\.html\?perfil=consumidor"\]'/);
});
