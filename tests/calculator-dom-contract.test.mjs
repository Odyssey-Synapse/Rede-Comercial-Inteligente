import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

test('HTML da calculadora contém todos os elementos esperados pelo simulador vigente',()=>{
  const html=read('calculadora.html');
  const js=read('assets/capacity-calculator.js');
  for(const id of ['capacity-calculator','offers-products','offers-services','capacity-result']){
    assert.ok(html.includes(`id="${id}"`),`HTML sem #${id}`);
    assert.ok(js.includes(`#${id}`),`JS sem referência a #${id}`);
  }
  assert.match(html,/assets\/capacity-calculator\.js/);
  assert.doesNotMatch(html,/assets\/calculator-page\.js/);
});

test('simulador usa os papéis Catálogo, Serviço ou combinação dos dois',()=>{
  const html=read('calculadora.html');
  const js=read('assets/capacity-calculator.js');
  assert.doesNotMatch(html,/id="category"|id="cnpj"/);
  assert.match(js,/catalogo:\{name:'Catálogo'/);
  assert.match(js,/servico:\{name:'Serviço'/);
  assert.match(js,/ambos:\{name:'Serviço \+ Catálogo'/);
  assert.match(js,/products\?\.checked&&services\?\.checked/);
});
