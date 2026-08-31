import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const exists=file=>fs.existsSync(path.join(root,file));

test('homepage atual apresenta proposta local e leva para a demonstracao publica',()=>{
  const html=read('index.html');
  assert.match(html,/Precisa de alguma coisa em Uberaba\?/);
  assert.match(html,/href="\/testar">Ver como funciona →/);
  assert.match(html,/Começando por Uberaba/);
  assert.doesNotMatch(html,/id="assistant-form"/);
});

test('placeholder da home nao impede o modulo Meu Uai Perto',()=>{
  const script=read('assets/site.js');
  assert.match(script,/existing\?\.matches\("section\.home-uai-life"\)/);
  assert.match(script,/existing\?\.hidden\)existing\.remove\(\)/);
  assert.match(script,/section\.id="meu-uai-perto"/);
});

test('Meu Uai Perto preserva falha de armazenamento e leva contexto para o teste sem URL',()=>{
  const script=read('assets/meu-uai-perto.js');
  assert.match(script,/uai-testar-prefill-v1/);
  assert.match(script,/sessionStorage\.setItem/);
  assert.doesNotMatch(script,/href="\/testar\?[^"']*(need|context|intent)/i);
  assert.match(script,/function persist\(next\)/);
  assert.match(script,/Não foi possível guardar neste navegador/);
});

test('demonstracao consome contexto do Meu Uai Perto e continua exigindo consentimento',()=>{
  const html=read('testar.html');
  assert.match(html,/uai-testar-prefill-v1/);
  assert.match(html,/sessionStorage\.getItem/);
  assert.match(html,/sessionStorage\.removeItem/);
  assert.match(html,/id="consent" type="checkbox"/);
  assert.match(html,/Cidade fictícia do teste/);
});

test('o Uai Perto Assistente possui pagina publica propria e explicita demonstracao',()=>{
  const html=read('assistente.html');
  assert.match(html,/O que você precisa resolver\?/);
  assert.match(html,/id="assistant-form"/);
  assert.match(html,/assets\/assistant\.css/);
  assert.match(html,/assets\/assistant\.js/);
  assert.match(html,/demonstração/i);
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

test('todas as paginas institucionais e comerciais continuam no artefato publico',()=>{
  for(const file of [
    'index.html','empresas.html','entrada-empresa.html','rede.html','tecnologia.html',
    'participar.html','calculadora.html','transparencia.html','contato.html',
    'privacidade.html','assistente.html','testar.html','meu-uai-perto.html','fundador.html'
  ])assert.equal(exists(file),true,file);
});

test('entrada-empresa antiga ficou informativa e nao executa aceite ou implantacao paralelos',()=>{
  const html=read('entrada-empresa.html');
  assert.match(html,/versão anterior do processo/);
  assert.match(html,/não registra mais aceite, pagamento ou implantação/i);
  assert.doesNotMatch(html,/assets\/entrada-empresa\.js/);
  assert.doesNotMatch(html,/id="open-onboarding"/);
});

test('APIs existentes e Functions do consumidor continuam presentes',()=>{
  for(const file of [
    'api/cnpj.js','api/contact.js','api/founder-status.js','api/quote.js',
    'api/quote-get.js','api/quote-accept.js','api/assistant/session.js',
    'api/assistant/message.js','api/consumer-demo/session.js','api/consumer-demo/action.js'
  ])assert.equal(exists(file),true,file);

  const config=JSON.parse(read('vercel.json'));
  assert.equal(config.functions['api/assistant/**/*.js'].maxDuration,30);
  assert.equal(config.functions['api/consumer-demo/**/*.js'].maxDuration,30);
});

test('o site não publica interfaces operacionais nem cria proxy generico para o MCIR',()=>{
  for(const route of ['company','backoffice','resolve-ai','mcir','survival-kernel','semantic-runtime','debug-semantico']){
    assert.equal(exists(`${route}.html`),false,route);
    assert.equal(exists(route),false,route);
  }
  const config=JSON.parse(read('vercel.json'));
  assert.equal(config.routes,undefined);
  assert.equal(config.rewrites.some(item=>/mcir|assistant/i.test(item.source+item.destination)),false);
});

test('.vercelignore não exclui conteúdo público, APIs ou dependências server-side',()=>{
  const ignored=read('.vercelignore');
  for(const destructive of ['*.html','api/*','assets/*','lib/*'])assert.equal(ignored.includes(destructive),false,destructive);
  for(const allowed of ['docs/','migrations/','scripts/','tests/'])assert.ok(ignored.includes(allowed),allowed);
});

test('nenhuma credencial server-side aparece nos artefatos do Assistente enviados ao navegador',()=>{
  const publicSurface=read('assistente.html')+read('assets/assistant.js')+read('assets/assistant.css');
  for(const name of ['MCIR_PUBLIC_ASSISTANT_ORIGIN','CF_ACCESS_CLIENT_ID','CF_ACCESS_CLIENT_SECRET','MCIR_ASSISTANT_GATEWAY_SECRET'])assert.equal(publicSurface.includes(name),false,name);
});

test('os headers globais preservam contratos do site institucional',()=>{
  const config=JSON.parse(read('vercel.json'));
  const headers=config.headers.flatMap(item=>item.headers);
  assert.equal(headers.find(item=>item.key==='X-Content-Type-Options')?.value,'nosniff');
  assert.equal(headers.find(item=>item.key==='Referrer-Policy')?.value,'strict-origin-when-cross-origin');
  assert.equal(headers.find(item=>item.key==='Permissions-Policy')?.value,'camera=(), microphone=(), geolocation=()');
});
