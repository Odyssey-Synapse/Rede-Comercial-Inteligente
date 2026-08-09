import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,"..");
const read=f=>fs.readFileSync(path.join(root,f),"utf8");

test("gerador usa segredo criptograficamente aleatorio de 32 bytes",()=>{
 const s=read("scripts/generate-secrets.mjs");
 assert.match(s,/randomBytes\(32\)/);
 assert.match(s,/COMPANY_LOOKUP_SIGNING_SECRET/);
 assert.match(s,/QUOTE_SIGNING_SECRET/);
});

test("migracao de propostas preserva integridade e estados",()=>{
 const s=read("migrations/001_quotes.sql");
 for(const x of ["quote_id TEXT PRIMARY KEY","cnpj TEXT NOT NULL","activity_code TEXT NOT NULL","signature TEXT NOT NULL","accepted","valid_until TIMESTAMPTZ NOT NULL"]) assert.ok(s.includes(x),x);
});
