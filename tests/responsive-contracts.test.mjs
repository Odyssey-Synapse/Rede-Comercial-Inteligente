import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

test('navegação móvel reduz ações e preserva alvos de toque',()=>{
  const base=read('assets/styles.css');
  const brand=read('assets/uai-perto.css');
  assert.match(base,/@media\(max-width:720px\)[\s\S]*?\.theme-label,\.nav \.button-small\{display:none\}/);
  assert.match(base,/@media\(max-width:1050px\)[\s\S]*?\.menu-toggle\{display:inline-flex\}/);
  assert.match(brand,/@media \(pointer:coarse\),\(max-width:760px\)[\s\S]*?\.icon-button[^}]*height:48px;min-width:48px/);
});

test('Founder colapsa seleção e Pix para uma coluna no celular',()=>{
  const css=read('assets/fundador.css');
  assert.match(css,/@media\(max-width:700px\)\{[^}]*\.founder-models,\.founder-categories\{grid-template-columns:1fr\}/);
  assert.match(css,/@media\(max-width:700px\)[\s\S]*?\.pix-copy-row\{grid-template-columns:1fr\}/);
  assert.match(css,/\.pix-qr-wrap img\{width:min\(100%,320px\);height:auto/);
});

test('Participação vira coluna única e mantém controles grandes no celular',()=>{
  const css=read('assets/participacao.css');
  assert.match(css,/@media\(max-width:760px\)[\s\S]*?\.profile-choice,\.survey-grid,\.choice-grid,\.choice-grid\.cols-3\{grid-template-columns:1fr\}/);
  assert.match(css,/\.survey-field input,\.survey-field select,\.survey-field textarea\{[^}]*min-height:48px/);
  assert.match(css,/@media\(max-width:760px\)[\s\S]*?\.choice-option span\{[^}]*min-height:50px/);
});

test('Demonstração pública colapsa grids e ações em telas pequenas',()=>{
  const html=read('testar.html');
  assert.match(html,/@media\(max-width:820px\)\{[^}]*\.intro,\.main-grid\{grid-template-columns:1fr\}/);
  assert.match(html,/@media\(max-width:520px\)[\s\S]*?\.primary,\.secondary\{width:100%\}/);
  assert.match(html,/html\{[^}]*overflow-x:hidden/);
});
