import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const here=path.dirname(fileURLToPath(import.meta.url)), root=path.resolve(here,"..");
const read=f=>fs.readFileSync(path.join(root,f),"utf8");

test("HTML da calculadora contém todos os elementos esperados pelo JS",()=>{
  const html=read("calculadora.html");
  const js=read("assets/calculator-page.js");
  for(const id of [
    "company-lookup-form","cnpj","lookup-message","company-confirmation",
    "lookup-button","quote-button","change-cnpj","quote-result",
    "found-company-name","found-company-meta","found-cnpj","found-location",
    "primary-activity-label","primary-activity-cnae","activity-list"
  ]){
    assert.ok(html.includes(`id="${id}"`),`HTML sem #${id}`);
    assert.ok(js.includes(`#${id}`)||["quote-result","cnpj","lookup-message","company-confirmation","lookup-button","quote-button"].includes(id),`JS sem referência a #${id}`);
  }
});

test("categoria não é mais escolhida manualmente",()=>{
  const html=read("calculadora.html");
  const js=read("assets/calculator-page.js");
  assert.doesNotMatch(html,/id="category"/);
  assert.doesNotMatch(html,/Categoria principal/);
  assert.match(js,/selectedCategory=company\.categories\?\.\[0\]/);
  assert.match(js,/categoryId:selectedCategory\.id/);
});
