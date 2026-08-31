import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const read=file=>fs.readFileSync(new URL(`../${file}`,import.meta.url),'utf8');

test('preview social usa asset estático e não função dinâmica',()=>{
  const vercel=JSON.parse(read('vercel.json'));
  const rewrite=vercel.rewrites.find(item=>item.source==='/og-uai-perto.jpg');
  assert.ok(rewrite,'rewrite social precisa existir');
  assert.equal(rewrite.destination,'/assets/uai-perto-symbol.png');
  assert.equal(fs.existsSync(new URL('../api/og-uai-perto.js',import.meta.url)),false);
  assert.equal(fs.existsSync(new URL('../assets/uai-perto-symbol.png',import.meta.url)),true);
});

test('home continua declarando imagem social absoluta',()=>{
  const html=read('index.html');
  assert.match(html,/property="og:image" content="https:\/\/rede-comercial-inteligente\.vercel\.app\/og-uai-perto\.jpg"/);
  assert.match(html,/name="twitter:image" content="https:\/\/rede-comercial-inteligente\.vercel\.app\/og-uai-perto\.jpg"/);
});
