import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const founder=fs.readFileSync(new URL('../assets/fundador.js',import.meta.url),'utf8');
const admin=fs.readFileSync(new URL('../assets/admin-founders.js',import.meta.url),'utf8');

test('Founder resume bearer lives only for the browser session',()=>{
  assert.match(founder,/sessionStorage\.setItem\(storageKey\(\),JSON\.stringify\(value\)\)/);
  assert.match(founder,/sessionStorage\.getItem\(storageKey\(\)\)/);
  assert.doesNotMatch(founder,/localStorage\.(?:setItem|getItem)\(storageKey\(\)/);
});

test('admin recovery hands the rotated Founder token through sessionStorage only',()=>{
  assert.match(admin,/sessionStorage\.setItem\(`uai-founder:\$\{d\.inviteToken\}`/);
  assert.doesNotMatch(admin,/localStorage\.setItem\(`uai-founder:/);
});
