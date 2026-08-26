import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const exists=file=>fs.existsSync(path.join(root,file));

test('/testar is the canonical MCIR Consumer public distribution',()=>{
  const html=read('testar.html');
  assert.match(html,/canonical MCIR Consumer at 4e2e3363cf9dccf60149abdeba08316b452234a7/);
  assert.match(html,/Seu assistente local/);
  assert.match(html,/O que você precisa resolver\?/);
  assert.match(html,/Algo em casa/);
  assert.match(html,/Meu carro/);
  assert.match(html,/Uma compra/);
  assert.match(html,/Conte a situação do seu jeito/);
  assert.match(html,/Meu Uai Perto/);
  assert.match(html,/id="projectsSection"/);
  assert.match(html,/id="solutionsCard"/);
  assert.match(html,/id="executionCard"/);
  assert.match(html,/assets\/testar\.css/);
  assert.match(html,/assets\/testar\.js/);
});

test('deterministic scenario engine and fake fallback were removed',()=>{
  const script=read('assets/testar.js');
  assert.equal(exists('assets/testar-flow.mjs'),false);
  assert.doesNotMatch(script,/\bSCENARIOS\b|variants\.buy|variants\.have|beginScenario|chooseAnswer|scenarioView/);
  assert.doesNotMatch(script,/Fallback instantâneo|forceReady|enough\s*\?/);
  assert.doesNotMatch(script,/R\$\s*\d+[\d.,]*/);
  assert.match(script,/temporariamente indisponível para a demonstração/);
});

test('browser uses only same-origin enumerated Consumer Demo actions',()=>{
  const app=read('assets/testar.js');
  const common=read('assets/testar-common.js');
  assert.match(app,/function enumeratedAction/);
  assert.match(app,/\['MESSAGE'/);
  assert.match(app,/\['START_RESOLUTION'/);
  assert.match(common,/fetch\('\/api\/consumer-demo\/session'/);
  assert.match(common,/fetch\('\/api\/consumer-demo\/action'/);
  assert.doesNotMatch(app+common,/Bearer\s|mcir_pilot_token|getPilotToken|setPilotToken|x-api-key|x-mcir-gateway-secret|CF-Access-Client/i);
  assert.doesNotMatch(app+common,/https?:\/\//i);
});

test('conversation is not persisted by the browser and reset clears MCIR session context',()=>{
  const script=read('assets/testar.js');
  assert.match(script,/let chatState=freshChat\(\)/);
  assert.match(script,/const saveChat=\(\)=>\{\}/);
  assert.match(script,/consumerAction\('RESET_CONVERSATION'/);
  assert.doesNotMatch(script,/uai_consumer_chat|previousChatKey|chatKey=/i);
});

test('completion appears only after real Resolution confirmation',()=>{
  const script=read('assets/testar.js');
  const html=read('testar.html');
  assert.doesNotMatch(html,/demoMcirCompletion|origem=demo-mcir/);
  assert.match(script,/CONFIRM_RESULT/);
  assert.match(script,/qs\('confirm'\)\.onclick=[\s\S]*showDemoCompletion\(\)/);
  assert.match(script,/As empresas eram fictícias/);
  assert.match(script,/href="\/participar\.html\?perfil=consumidor&amp;origem=demo-mcir"/);
  assert.match(script,/Resolver outra coisa/);
});

test('canonical Consumer never links operational Company, Backoffice or Resolva Aí surfaces',()=>{
  const publicFiles=['testar.html','assets/testar.js','assets/testar.css','assets/testar-common.js'].map(read).join('\n');
  assert.doesNotMatch(publicFiles,/href=["'][^"']*\/(?:company|backoffice|resolve-ai)(?:\/|["'])/i);
  assert.doesNotMatch(publicFiles,/fetch\([^\n]*(?:\/v1\/companies|\/v1\/backoffice|\/v1\/logistics)/i);
});

test('experimentation CTAs still point to /testar and capture remains separate',()=>{
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
});
