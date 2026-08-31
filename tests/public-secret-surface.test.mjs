import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const files=[
  ...fs.readdirSync(root).filter(f=>f.endsWith('.html')),
  ...fs.readdirSync(path.join(root,'assets')).filter(f=>/\.(?:js|mjs|css)$/.test(f)).map(f=>`assets/${f}`)
];
const publicText=files.map(file=>`\n/* ${file} */\n${fs.readFileSync(path.join(root,file),'utf8')}`).join('\n');

const forbiddenNames=[
  'DATABASE_URL',
  'MERCADOPAGO_ACCESS_TOKEN',
  'MERCADOPAGO_WEBHOOK_SECRET',
  'FOUNDER_ADMIN_TOKEN',
  'RESEND_API_KEY',
  'CF_ACCESS_CLIENT_SECRET',
  'MCIR_ASSISTANT_GATEWAY_SECRET',
  'TURNSTILE_SECRET_KEY',
  'CNPJ_LOOKUP_SIGNING_SECRET',
  'QUOTE_SIGNING_SECRET'
];

test('artefatos do navegador não carregam nomes de segredos server-side',()=>{
  for(const name of forbiddenNames)assert.equal(publicText.includes(name),false,name);
});

test('artefatos do navegador não carregam formatos comuns de credencial privada',()=>{
  const patterns=[
    /\bsk-(?:live|test|proj)-[A-Za-z0-9_-]{12,}/,
    /\bre_[A-Za-z0-9]{16,}/,
    /\bAPP_USR-[A-Za-z0-9_-]{20,}/,
    /\bpostgres(?:ql)?:\/\/[^\s"']+@/i
  ];
  for(const pattern of patterns)assert.doesNotMatch(publicText,pattern,String(pattern));
});
