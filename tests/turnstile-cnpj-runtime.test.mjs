import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { verifyTurnstileToken } from "../lib/turnstile.mjs";

const here=path.dirname(fileURLToPath(import.meta.url)),root=path.resolve(here,"..");
const read=f=>fs.readFileSync(path.join(root,f),"utf8");

test("Turnstile converte falha de rede em erro controlado",async()=>{
  const old={...process.env};
  process.env.TURNSTILE_REQUIRED="true";
  process.env.TURNSTILE_SECRET_KEY="secret";
  const fakeFetch=async()=>{throw new Error("network")};
  const r=await verifyTurnstileToken("token","127.0.0.1",{},fakeFetch);
  assert.equal(r.ok,false);
  assert.equal(r.reason,"TURNSTILE_VERIFY_UNAVAILABLE");
  process.env=old;
});

test("Turnstile valida action e hostname",async()=>{
  const old={...process.env};
  process.env.TURNSTILE_REQUIRED="true";
  process.env.TURNSTILE_SECRET_KEY="secret";
  const fakeFetch=async()=>({ok:true,status:200,json:async()=>({success:true,action:"cnpj_lookup",hostname:"rede-comercial-inteligente.vercel.app"})});
  const r=await verifyTurnstileToken("token","127.0.0.1",{expectedAction:"cnpj_lookup",expectedHostname:"rede-comercial-inteligente.vercel.app"},fakeFetch);
  assert.equal(r.ok,true);
  process.env=old;
});

test("API CNPJ possui requestId e catch externo",()=>{
  const s=read("api/cnpj.js");
  assert.match(s,/X-RLI-Request-Id/);
  assert.match(s,/CNPJ_LOOKUP_INTERNAL_ERROR/);
  assert.match(s,/expectedAction: "cnpj_lookup"/);
});
