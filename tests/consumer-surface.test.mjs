import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const exists=file=>fs.existsSync(path.join(root,file));

test('a homepage institucional foi preservada e separa demonstração do Assistente',()=>{
  const html=read('index.html');
  assert.match(html,/Pare de procurar empresa por empresa/);
  assert.match(html,/href="\/testar">Quero testar como consumidor →/);
  assert.match(html,/href="\/assistente"/);
  assert.match(html,/Abrir o Uai Perto Assistente/);
  assert.doesNotMatch(html,/id="assistant-form"/);
});

test('o Uai Perto Assistente possui página pública própria',()=>{
  const html=read('assistente.html');
  assert.match(html,/O que você precisa resolver\?/);
  assert.match(html,/id="assistant-form"/);
  assert.match(html,/assets\/assistant\.css/);
  assert.match(html,/assets\/assistant\.js/);
});

test('a interface do Assistente não revela nomes ou estados internos',()=>{
  const publicSurface=read('assistente.html')+read('assets/assistant.js')+read('assets/assistant.css');
  for(const forbidden of [
    'MCIR','Survival Kernel','KCL','Ollama','Semantic Runtime','proofs','candidates',
    'matching engine','Backoffice','Resolva Aí','debug semântico'
  ])assert.equal(publicSurface.toLowerCase().includes(forbidden.toLowerCase()),false,forbidden);
});

test('o navegador chama apenas os proxies do Assistente na própria origem',()=>{
  const script=read('assets/assistant.js');
  assert.match(script,/fetch\('\/api\/assistant\/session'/);
  assert.match(script,/fetch\('\/api\/assistant\/message'/);
  assert.doesNotMatch(script,/process\.env|authorization|x-api-key|https?:\/\//i);
  assert.doesNotMatch(script,/localStorage|sessionStorage|conversation/i);
});

test('todas as páginas institucionais e comerciais continuam no artefato público',()=>{
  for(const file of [
    'index.html','empresas.html','entrada-empresa.html','rede.html','tecnologia.html',
    'participar.html','calculadora.html','transparencia.html','contato.html',
    'privacidade.html','assistente.html','testar.html'
  ])assert.equal(exists(file),true,file);
});

test('APIs existentes e Functions do Assistente continuam presentes',()=>{
  for(const file of [
    'api/cnpj.js','api/contact.js','api/founder-status.js','api/quote.js',
    'api/quote-get.js','api/quote-accept.js','api/assistant/session.js',
    'api/assistant/message.js','api/consumer-demo/session.js','api/consumer-demo/action.js'
  ])assert.equal(exists(file),true,file);

  const config=JSON.parse(read('vercel.json'));
  assert.equal(config.functions['api/assistant/**/*.js'].maxDuration,30);
  assert.equal(config.functions['api/consumer-demo/**/*.js'].maxDuration,30);
});

test('o site não publica interfaces operacionais nem cria proxy genérico para o MCIR',()=>{
  for(const route of [
    'company','backoffice','resolve-ai','mcir','survival-kernel',
    'semantic-runtime','debug-semantico'
  ]){
    assert.equal(exists(`${route}.html`),false,route);
    assert.equal(exists(route),false,route);
  }

  const config=JSON.parse(read('vercel.json'));
  assert.equal(config.redirects,undefined);
  assert.equal(config.routes,undefined);
  assert.equal(config.rewrites.some(item=>/mcir|assistant/i.test(item.source+item.destination)),false);
});

test('.vercelignore não exclui conteúdo público, APIs ou dependências server-side',()=>{
  const ignored=read('.vercelignore');
  for(const destructive of ['*.html','api/*','assets/*','lib/*']){
    assert.equal(ignored.includes(destructive),false,destructive);
  }
  for(const allowed of ['docs/','migrations/','scripts/','tests/']){
    assert.ok(ignored.includes(allowed),allowed);
  }
});

test('nenhuma credencial server-side aparece nos artefatos do Assistente enviados ao navegador',()=>{
  const publicSurface=read('assistente.html')+read('assets/assistant.js')+read('assets/assistant.css');
  for(const name of [
    'MCIR_PUBLIC_ASSISTANT_ORIGIN','CF_ACCESS_CLIENT_ID','CF_ACCESS_CLIENT_SECRET',
    'MCIR_ASSISTANT_GATEWAY_SECRET'
  ])assert.equal(publicSurface.includes(name),false,name);
});

test('os headers globais preservam contratos do site institucional',()=>{
  const config=JSON.parse(read('vercel.json'));
  const headers=config.headers.flatMap(item=>item.headers);
  assert.equal(headers.find(item=>item.key==='X-Content-Type-Options')?.value,'nosniff');
  assert.equal(headers.find(item=>item.key==='Referrer-Policy')?.value,'strict-origin-when-cross-origin');
  assert.equal(headers.find(item=>item.key==='Permissions-Policy')?.value,'camera=(), microphone=(), geolocation=()');
});
