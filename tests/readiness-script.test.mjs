import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const here=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(here,"..");
const read=f=>fs.readFileSync(path.join(root,f),"utf8");

test("npm readiness usa o readiness canônico",()=>{
  const s=read("scripts/readiness.mjs");
  assert.match(s,/productionReadiness/);
  assert.match(s,/COMPANY_LOOKUP|report\.checks/);
  assert.doesNotMatch(s,/BUSINESS_LOOKUP_SIGNING_SECRET/);
});

test("migrate usa postgres e DATABASE_URL",()=>{
  const s=read("scripts/migrate.mjs");
  assert.match(s,/from "postgres"/);
  assert.match(s,/DATABASE_URL/);
  assert.doesNotMatch(s,/@vercel\/postgres/);
});
