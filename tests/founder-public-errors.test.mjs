import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const api=fs.readFileSync(new URL('../api/founder-status.js',import.meta.url),'utf8');

test('Founder API maps internal configuration failures to stable public codes',()=>{
  assert.match(api,/function publicErrorCode\(m\)/);
  assert.match(api,/MERCADOPAGO_ACCESS_TOKEN_MISSING[\s\S]*PAYMENT_SERVICE_UNAVAILABLE/);
  assert.match(api,/DATABASE_URL_MISSING[\s\S]*SERVICE_UNAVAILABLE/);
  assert.match(api,/FOUNDER_ADMIN_NOT_CONFIGURED[\s\S]*ADMIN_SERVICE_UNAVAILABLE/);
  assert.match(api,/WEBHOOK_SECRET_MISSING[\s\S]*WEBHOOK_UNAVAILABLE/);
});

test('Founder API catch does not return arbitrary internal details',()=>{
  const tail=api.slice(api.indexOf('export default async function handler'));
  assert.doesNotMatch(tail,/details\s*:/);
  assert.match(tail,/error:publicErrorCode\(/);
});
