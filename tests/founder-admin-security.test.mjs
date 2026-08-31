import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=file=>fs.readFileSync(new URL(`../${file}`,import.meta.url),'utf8');

test('admin Founder não persiste bearer administrativo em Web Storage',()=>{
  const js=read('assets/admin-founders.js');
  assert.match(js,/let adminToken=""/);
  assert.doesNotMatch(js,/(?:localStorage|sessionStorage)\.(?:getItem|setItem)\(["'`]uai-founder-admin-token/);
  assert.match(js,/authorization:`Bearer \$\{adminToken\}`/);
});

test('admin Founder é noindex e feedback de autenticação é acessível',()=>{
  const html=read('admin-founders.html');
  assert.match(html,/meta name="robots" content="noindex,nofollow"/);
  assert.match(html,/id="admin-token" type="password" autocomplete="off"/);
  assert.match(html,/id="admin-feedback" role="status" aria-live="polite"/);
});

test('pipeline administrativo possui semântica de tabela explícita',()=>{
  const html=read('admin-founders.html');
  assert.match(html,/<caption[^>]*>Candidaturas e estados da operação Founder<\/caption>/);
  for(const label of ['Empresa','Modelo','Status','Pagamento','Fundador','Contato'])assert.match(html,new RegExp(`<th scope="col" align="left">${label}<\\/th>`));
});

test('falhas operacionais e clipboard do admin geram mensagem humana',()=>{
  const js=read('assets/admin-founders.js');
  assert.match(js,/Não foi possível gerar o convite agora/);
  assert.match(js,/Não foi possível atualizar a operação/);
  assert.match(js,/A sessão administrativa não é mais válida/);
  assert.match(js,/Link de Fundador copiado/);
  assert.match(js,/O link ficou selecionado para você copiar no dispositivo/);
});

test('Admin e API Founder são explicitamente no-store',()=>{
  const config=JSON.parse(read('vercel.json'));
  const admin=config.headers.find(item=>item.source==='/admin-founders')?.headers||[];
  const api=config.headers.find(item=>item.source==='/api/founder-status')?.headers||[];
  assert.equal(admin.find(h=>h.key==='Cache-Control')?.value,'private, no-store, max-age=0');
  assert.equal(admin.find(h=>h.key==='X-Robots-Tag')?.value,'noindex, nofollow');
  assert.equal(api.find(h=>h.key==='Cache-Control')?.value,'private, no-store, max-age=0');
});
