import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const here=path.dirname(fileURLToPath(import.meta.url)), root=path.resolve(here,"..");
const read=f=>fs.readFileSync(path.join(root,f),"utf8");

test("a calculadora legada não pertence à superfície pública Consumer",()=>{
  const config=JSON.parse(read("vercel.json"));
  const redirect=config.redirects.find(item=>item.source==="/calculadora");
  assert.deepEqual(redirect,{source:"/calculadora",destination:"/",permanent:false});
  const ignored=read(".vercelignore");
  assert.match(ignored,/^\*\.html$/m);
  assert.match(ignored,/^!index\.html$/m);
});

test("categoria não é mais escolhida manualmente",()=>{
  const html=read("calculadora.html");
  const js=read("assets/calculator-page.js");
  assert.doesNotMatch(html,/id="category"/);
  assert.doesNotMatch(html,/Categoria principal/);
  assert.match(js,/selectedCategory=company\.categories\?\.\[0\]/);
  assert.match(js,/categoryId:selectedCategory\.id/);
});
