import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const exists=file=>fs.existsSync(path.join(root,file));

test('/testar é a distribuição pública canônica do teste Consumer',()=>{
  const html=read('testar.html');
  assert.match(html,/Demonstração pública/);
  assert.match(html,/O que você precisa resolver\?/);
  assert.match(html,/Conte a situação do seu jeito/);
  assert.match(html,/Cidade fictícia do teste/);
  assert.match(html,/Vereda Clara, MG/);
  assert.match(html,/id="need"/);
  assert.match(html,/id="consent"/);
  assert.match(html,/api\/consumer-demo|testar-common\.js/);
  assert.doesNotMatch(html,/canonical MCIR Consumer at [a-f0-9]{40}/i);
});

test('motor determinístico de cenários e fallback de sucesso não voltam ao consumidor',()=>{
  const current=read('testar.html')+read('assets/testar-common.js');
  assert.equal(exists('assets/testar-flow.mjs'),false);
  assert.doesNotMatch(current,/Fallback instantâneo|forceReady|variants\.buy|variants\.have|beginScenario|chooseAnswer|scenarioView/);
  assert.match(current,/temporariamente indisponível/i);
  assert.match(current,/não inventa|não foi tratada como concluída/i);
});

test('browser usa apenas ações enumeradas same-origin do Consumer Demo',()=>{
  const html=read('testar.html');
  const common=read('assets/testar-common.js');
  assert.match(html,/consumerAction\('(?:CLOSED_LOOP_STATUS|ONBOARDING_STATUS|ACCEPT_ONBOARDING|PREVIEW_UNDERSTANDING|CREATE_PROJECT|UPDATE_PROJECT|START_CLOSED_LOOP|READ_CLOSED_LOOP|READ_CLOSED_LOOP_OPTIONS|SELECT_CLOSED_LOOP_OPTION|EXECUTE_CLOSED_LOOP_SYNTHETIC)'/);
  assert.match(common,/fetch\('\/api\/consumer-demo\/session'/);
  assert.match(common,/fetch\('\/api\/consumer-demo\/action'/);
  assert.doesNotMatch(html+common,/Bearer\s|mcir_pilot_token|getPilotToken|setPilotToken|x-api-key|x-mcir-gateway-secret|CF-Access-Client/i);
  assert.doesNotMatch(common,/fetch\(['"]https?:\/\//i);
});

test('necessidade não é persistida permanentemente pelo navegador',()=>{
  const html=read('testar.html');
  assert.doesNotMatch(html,/localStorage\.setItem|uai_consumer_chat|previousChatKey/i);
  assert.match(html,/sessionStorage\.removeItem\(PREFILL_KEY\)/);
  assert.match(html,/function resetClient\(\)/);
});

test('conclusão só aparece quando o fluxo observado devolve COMPLETE',()=>{
  const html=read('testar.html');
  assert.match(html,/if\(state==='COMPLETE'\)/);
  assert.match(html,/Necessidade concluída no ambiente de teste/);
  assert.doesNotMatch(html,/demoMcirCompletion|origem=demo-mcir/);
});

test('Consumer público não liga superfícies operacionais de empresa ou backoffice',()=>{
  const publicFiles=['testar.html','assets/testar-common.js'].map(read).join('\n');
  assert.doesNotMatch(publicFiles,/href=["'][^"']*\/(?:company|backoffice|resolve-ai)(?:\/|["'])/i);
  assert.doesNotMatch(publicFiles,/fetch\([^\n]*(?:\/v1\/companies|\/v1\/backoffice|\/v1\/logistics)/i);
});

test('CTAs atuais levam à demo e a Home avisa a fronteira antes do clique',()=>{
  const home=read('index.html');
  const network=read('rede.html');
  const personal=read('meu-uai-perto.html');
  const site=read('assets/site.js');
  const personalScript=read('assets/meu-uai-perto.js');
  assert.match(home,/href="\/testar">(?:Ver demonstração|Testar o Uai Perto) →/);
  assert.match(home,/Demonstração com cidade e empresas fictícias/);
  assert.match(home,/Rede real de Uberaba em formação/);
  assert.match(network,/href="\/testar">/);
  assert.match(personal,/href="\/testar">/);
  assert.match(site,/href="\/testar">Quero testar como consumidor/);
  assert.match(personalScript,/location\.href='\/testar'/);
  assert.match(site,/href="\/participar\.html\?perfil=consumidor">Sou consumidor/);
});
