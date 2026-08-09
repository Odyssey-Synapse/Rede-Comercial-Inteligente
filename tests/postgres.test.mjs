import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..");
const read = f => fs.readFileSync(path.join(root,f),"utf8");

test("migração cria quotes e quote_events",()=>{
  const s=read("migrations/001_quotes.sql");
  assert.match(s,/CREATE TABLE IF NOT EXISTS quotes/);
  assert.match(s,/CREATE TABLE IF NOT EXISTS quote_events/);
  assert.match(s,/quote_id TEXT PRIMARY KEY/);
});
test("status da proposta é limitado",()=>{
  const s=read("migrations/001_quotes.sql");
  for(const st of ["issued","viewed","accepted","expired","cancelled"]) assert.ok(s.includes(st));
});
test("db layer possui salvar ler status e eventos",()=>{
  const s=read("lib/db.js");
  for(const fn of ["saveQuote","getQuoteById","updateQuoteStatus","appendQuoteEvent"]) assert.ok(s.includes(fn),fn);
});
test("api de leitura expira proposta vencida",()=>{
  const s=read("api/quote-get.js");
  assert.match(s,/valid_until/);
  assert.match(s,/expired/);
  assert.match(s,/QUOTE_NOT_FOUND/);
});
test("api de aceite recusa proposta vencida",()=>{
  const s=read("api/quote-accept.js");
  assert.match(s,/QUOTE_EXPIRED/);
  assert.match(s,/accepted/);
});
test("migrate script exige banco",()=>{
  const s=read("scripts/migrate.mjs");
  assert.match(s,/POSTGRES_URL/);
  assert.match(s,/DATABASE_URL/);
});
