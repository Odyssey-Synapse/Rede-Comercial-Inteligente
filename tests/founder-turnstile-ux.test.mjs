import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const script=fs.readFileSync(new URL('../assets/fundador.js',import.meta.url),'utf8');

test('Founder não agenda formulário antes da verificação inicial de segurança',()=>{
  const start=script.indexOf('async function loadInvite()');
  const end=script.indexOf('cnpjInput?.addEventListener',start);
  assert.ok(start>=0&&end>start,'loadInvite não encontrado');
  const body=script.slice(start,end);
  const ensure=body.indexOf('await ensureTurnstile()');
  const show=body.indexOf('show("company")');
  assert.ok(ensure>=0,'ensureTurnstile ausente');
  assert.ok(show>=0,'show company ausente');
  assert.ok(ensure<show,'a verificação deve concluir antes de exibir a etapa da empresa');
});

test('falha inicial do Turnstile possui mensagem específica e preserva retomada',()=>{
  assert.match(script,/TURNSTILE_LOAD_FAILED:"Não foi possível carregar a verificação de segurança\. Verifique sua conexão e tente novamente\."/);
  assert.match(script,/Seus campos continuam preenchidos/);
});
