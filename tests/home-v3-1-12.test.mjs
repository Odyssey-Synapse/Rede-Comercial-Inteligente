import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

test('empresa tem caminhos diretos para simulação e apresentação comercial',()=>{
  const html=read('empresas.html');
  assert.match(html,/Abrir calculadora →/);
  assert.match(html,/Apresentar empresa →/);
  assert.match(html,/href="\/calculadora\.html"/);
  assert.match(html,/href="\/participar\.html\?perfil=empresa"/);
});

test('API de status Founder permanece autoritativa e usa capacidade 54',()=>{
  const api=read('api/founder-status.js');
  assert.match(api,/founderCapacityStatus/);
  assert.match(api,/capacity:54/);
  assert.match(api,/authority:db\?"DATABASE":"LEGACY_ENV"/);
  assert.doesNotMatch(api,/capacity:25/);
});

test('calculadora conecta os três modelos à condição Fundador vigente',()=>{
  const js=read('assets/capacity-calculator.js');
  assert.match(js,/catalogo:\{name:'Catálogo',monthly:49,founderAdhesion:149/);
  assert.match(js,/servico:\{name:'Serviço',monthly:79,founderAdhesion:199/);
  assert.match(js,/ambos:\{name:'Serviço \+ Catálogo',monthly:99,founderAdhesion:249/);
  assert.match(js,/SE FOR CONFIRMADO ENTRE OS 54 INICIAIS/);
  assert.match(js,/mensalidade recorrente: R\$ 0/);
});

test('limite Founder canônico continua sendo aplicado server-side',()=>{
  const registry=read('lib/founder-registry.mjs');
  assert.match(registry,/maxExpected:\s*54/);
  assert.match(registry,/registry\.length > 54/);
  assert.match(registry,/FOUNDER_REGISTRY_LIMIT_EXCEEDED/);
});
