import test from "node:test";
import assert from "node:assert/strict";
import { isFounderCnpj, founderRegistryStatus, assertFounderRegistryLimit } from "../lib/founder-registry.mjs";

test("Founder é reconhecido apenas pela lista server-side",()=>{
  const registry=["11222333000181","L9J5BYRT000101"];
  assert.equal(isFounderCnpj("11.222.333/0001-81",registry),true);
  assert.equal(isFounderCnpj("00.000.000/0000-00",registry),false);
});
test("registro Founder respeita o limite vigente de 54",()=>{
  assert.equal(assertFounderRegistryLimit(Array.from({length:54},(_,i)=>String(i))),true);
  assert.throws(()=>assertFounderRegistryLimit(Array.from({length:55},(_,i)=>String(i))),/FOUNDER_REGISTRY_LIMIT_EXCEEDED/);
});
