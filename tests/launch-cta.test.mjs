import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const js=fs.readFileSync(new URL('../assets/site.js',import.meta.url),'utf8');

test('CTA global adapta-se quando coleta comercial está fechada',()=>{
  assert.match(js,/id="launch-primary-cta" href="\/participar\.html">Quero participar/);
  assert.match(js,/fetch\("\/api\/public-config",\{cache:"no-store"\}\)/);
  assert.match(js,/if\(config\.contactFormEnabled\)return/);
  assert.match(js,/primary\.href="\/testar";primary\.textContent="Testar agora"/);
  assert.match(js,/consumer\.href="\/testar";consumer\.textContent="Testar como consumidor"/);
});
