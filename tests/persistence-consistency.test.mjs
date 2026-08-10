import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const here=path.dirname(fileURLToPath(import.meta.url)), root=path.resolve(here,"..");
const read=f=>fs.readFileSync(path.join(root,f),"utf8");

test("emissão usa a mesma tabela quotes do aceite",()=>{
  const store=read("lib/quote-store.mjs");
  const db=read("lib/db.js");
  assert.match(store,/saveQuote/);
  assert.doesNotMatch(store,/achei_aqui_quotes/);
  assert.match(db,/INSERT INTO quotes/);
  assert.match(db,/SELECT \* FROM quotes/);
});

test("proposta nova usa ID compatível com leitura",()=>{
  const q=read("api/quote.js");
  const get=read("api/quote-get.js");
  assert.match(q,/AA-Q-/);
  assert.match(get,/AA-Q-/);
});

test("migração 003 preserva proveniência",()=>{
  const s=read("migrations/003_cnpj_provider_provenance.sql");
  for(const x of ["cnpj_provider","cnpj_source_updated_at","cnpj_lookup_id"]) assert.ok(s.includes(x),x);
});
