import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const publicFiles=[
  'index.html','rede.html','empresas.html','tecnologia.html','transparencia.html',
  'calculadora.html','contato.html','privacidade.html','assets/site.js','assets/home-demo.js',
  'assets/capacity-calculator.js','assets/contact-page.js','api/contact.js'
];

test('superfícies públicas não reintroduzem denominações históricas',()=>{
  for(const file of publicFiles){
    const text=readFileSync(file,'utf8');
    assert.doesNotMatch(text,/Achei Aqui|Projeto RLI/i,file);
  }
});

test('Uai Perto é a identidade pública consistente',()=>{
  const home=readFileSync('index.html','utf8');
  const site=readFileSync('assets/site.js','utf8');
  assert.match(home,/Uai Perto/);
  assert.match(home,/Uberaba mais perto de você/);
  assert.match(site,/BRAND_NAME="Uai Perto"/);
  assert.match(site,/BRAND_TAGLINE="Uberaba mais perto de você\."/);
});

test('aquisição comercial permanece distinta da experiência do Assistente',()=>{
  const home=readFileSync('index.html','utf8');
  const empresas=readFileSync('empresas.html','utf8');
  const assistant=readFileSync('assistente.html','utf8');
  assert.match(home,/href="\/empresas\.html"/);
  assert.match(home,/href="\/assistente"/);
  assert.match(empresas,/TENHO UMA EMPRESA|Sua empresa vende alguma coisa/);
  assert.match(assistant,/id="assistant-form"/);
  assert.doesNotMatch(empresas,/id="assistant-form"/);
});
