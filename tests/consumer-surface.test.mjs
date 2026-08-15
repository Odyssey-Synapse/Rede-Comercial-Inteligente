import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

test('a página pública é somente o Uai Perto Assistente',()=>{
  const html=read('index.html');
  assert.match(html,/O que você precisa resolver\?/);
  assert.match(html,/id="assistant-form"/);
  assert.match(html,/assets\/assistant\.js/);
  assert.doesNotMatch(html,/<nav\b/i);
  assert.doesNotMatch(html,/<a\b/i);
});

test('a interface Consumer não revela nomes ou estados internos',()=>{
  const publicSurface=read('index.html')+read('assets/assistant.js')+read('assets/assistant.css');
  for(const forbidden of [
    'MCIR','Survival Kernel','KCL','Ollama','Semantic Runtime','proofs','candidates',
    'matching engine','Backoffice','Resolva Aí','debug semântico'
  ])assert.equal(publicSurface.toLowerCase().includes(forbidden.toLowerCase()),false,forbidden);
});

test('o navegador chama apenas os proxies de sessão e mensagem na própria origem',()=>{
  const script=read('assets/assistant.js');
  assert.match(script,/fetch\('\/api\/assistant\/session'/);
  assert.match(script,/fetch\('\/api\/assistant\/message'/);
  assert.doesNotMatch(script,/process\.env|authorization|x-api-key|https?:\/\//i);
  assert.doesNotMatch(script,/localStorage|sessionStorage|conversation/i);
});

test('páginas antigas e superfícies internas retornam ao Consumer',()=>{
  const config=JSON.parse(read('vercel.json'));
  const protectedRoutes=['/empresas','/entrada-empresa','/rede','/tecnologia','/participar','/calculadora','/company/:path*','/backoffice/:path*','/mcir/:path*','/survival-kernel/:path*','/debug-semantico/:path*'];
  for(const source of protectedRoutes){
    const redirect=config.redirects.find(item=>item.source===source);
    assert.ok(redirect,source);
    assert.equal(redirect.destination,'/');
  }
});

test('o pacote publicado exclui páginas, APIs e ativos legados',()=>{
  const ignored=read('.vercelignore');
  for(const rule of ['*.html','!index.html','api/*','!api/assistant/','!api/assistant/session.js','!api/assistant/message.js','assets/*','!assets/assistant.js','!assets/assistant.css','lib/*','!lib/assistant-origin.mjs'])assert.ok(ignored.includes(rule),rule);
});

test('nenhuma credencial server-side aparece nos artefatos enviados ao navegador',()=>{
  const publicSurface=read('index.html')+read('assets/assistant.js')+read('assets/assistant.css');
  for(const name of ['MCIR_PUBLIC_ASSISTANT_ORIGIN','CF_ACCESS_CLIENT_ID','CF_ACCESS_CLIENT_SECRET','MCIR_ASSISTANT_GATEWAY_SECRET']){
    assert.equal(publicSurface.includes(name),false,name);
  }
});

test('a política de resposta impede navegação incorporada e chamadas externas',()=>{
  const config=JSON.parse(read('vercel.json'));
  const headers=config.headers.flatMap(item=>item.headers);
  const csp=headers.find(item=>item.key==='Content-Security-Policy')?.value||'';
  assert.match(csp,/connect-src 'self'/);
  assert.match(csp,/frame-ancestors 'none'/);
  assert.match(csp,/object-src 'none'/);
});
