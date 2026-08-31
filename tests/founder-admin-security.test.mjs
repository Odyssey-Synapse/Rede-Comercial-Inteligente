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

test('falhas operacionais do admin geram mensagem humana',()=>{
  const js=read('assets/admin-founders.js');
  assert.match(js,/Não foi possível gerar o convite agora/);
  assert.match(js,/Não foi possível atualizar a operação/);
  assert.match(js,/A sessão administrativa não é mais válida/);
});
