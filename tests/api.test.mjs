import test from "node:test";
import assert from "node:assert/strict";
import quoteHandler from "../api/quote.js";
import cnpjHandler from "../api/cnpj.js";
import { signCompanyLookup, verifyCompanyLookup } from "../lib/lookup-signing.mjs";
import { normalizeSerproRecord } from "../lib/serpro-cnpj.mjs";
import { productionReadiness } from "../lib/readiness.mjs";

function mockRes(){return{statusCode:200,body:null,status(code){this.statusCode=code;return this},json(body){this.body=body;return this}}}
const LOOKUP_SECRET="lookup-secret-123456789012345678901234567890";
const QUOTE_SECRET="quote-secret-1234567890123456789012345678901";
function lookupToken(categoryId="CNAE:7500100"){
 const now=new Date();return signCompanyLookup({kind:"AA_COMPANY_LOOKUP_V1",cnpj:"11222333000181",legalName:"EMPRESA TESTE LTDA",tradeName:"Empresa Teste",city:"Uberaba",state:"MG",status:{code:"2",description:"Ativa"},categories:[{id:categoryId,cnaeCode:categoryId.slice(5),label:"Atividades veterinárias"}],issuedAt:now.toISOString(),expiresAt:new Date(now.getTime()+900000).toISOString()},LOOKUP_SECRET)
}

test("CNPJ API rejects invalid value before external lookup",async()=>{const req={method:"POST",body:{cnpj:"00.000.000/0000-00"},headers:{}};const res=mockRes();await cnpjHandler(req,res);assert.equal(res.statusCode,400);assert.equal(res.body.error,"INVALID_CNPJ")});
test("company lookup tokens are signed and expire",()=>{const token=lookupToken();assert.equal(verifyCompanyLookup(token,LOOKUP_SECRET).valid,true);assert.equal(verifyCompanyLookup(token,LOOKUP_SECRET,new Date(Date.now()+3600000)).valid,false)});
test("quote API rejects category not linked to signed CNPJ",async()=>{const old=process.env.COMPANY_LOOKUP_SIGNING_SECRET;process.env.COMPANY_LOOKUP_SIGNING_SECRET=LOOKUP_SECRET;const req={method:"POST",body:{lookupToken:lookupToken(),categoryId:"CNAE:4520001"}};const res=mockRes();await quoteHandler(req,res);old===undefined?delete process.env.COMPANY_LOOKUP_SIGNING_SECRET:process.env.COMPANY_LOOKUP_SIGNING_SECRET=old;assert.equal(res.statusCode,422);assert.equal(res.body.error,"CATEGORY_NOT_LINKED_TO_CNPJ")});
test("quote API refuses authoritative proposal when database is absent",async()=>{const oldLookup=process.env.COMPANY_LOOKUP_SIGNING_SECRET,oldQuote=process.env.QUOTE_SIGNING_SECRET,oldDb=process.env.DATABASE_URL;process.env.COMPANY_LOOKUP_SIGNING_SECRET=LOOKUP_SECRET;process.env.QUOTE_SIGNING_SECRET=QUOTE_SECRET;delete process.env.DATABASE_URL;const req={method:"POST",body:{lookupToken:lookupToken(),categoryId:"CNAE:7500100",resourceIds:[]}};const res=mockRes();await quoteHandler(req,res);oldLookup===undefined?delete process.env.COMPANY_LOOKUP_SIGNING_SECRET:process.env.COMPANY_LOOKUP_SIGNING_SECRET=oldLookup;oldQuote===undefined?delete process.env.QUOTE_SIGNING_SECRET:process.env.QUOTE_SIGNING_SECRET=oldQuote;oldDb===undefined?delete process.env.DATABASE_URL:process.env.DATABASE_URL=oldDb;assert.equal(res.statusCode,503);assert.equal(res.body.error,"QUOTE_STORE_NOT_CONFIGURED");assert.equal(res.body.preview.category.cnaeCode,"7500100")});
test("SERPRO response normalizer retains official activities",()=>{const x=normalizeSerproRecord({ni:"11222333000181",nome_empresarial:"EMPRESA",situacao_cadastral:{codigo:"2"},cnae_principal:{codigo:"7500100",descricao:"Atividades veterinárias"},cnaes_secundarios:[{codigo:"4771704",descricao:"Comércio varejista de medicamentos veterinários"}],endereco:{municipio:"UBERABA",uf:"MG"}});assert.equal(x.status.description,"Ativa");assert.equal(x.activities.length,2);assert.equal(x.city,"UBERABA")});
test("readiness fails closed when production configuration is missing",()=>{const r=productionReadiness({});assert.equal(r.ready,false);assert.ok(r.blockers.length>=10)});

test("SERPRO client contract shape can consume alphanumeric CNPJ through OAuth", async()=>{
  const { fetchOfficialCnpj } = await import("../lib/serpro-cnpj.mjs");
  const old={key:process.env.SERPRO_CONSUMER_KEY,secret:process.env.SERPRO_CONSUMER_SECRET,template:process.env.SERPRO_CNPJ_ENDPOINT_TEMPLATE,mode:process.env.SERPRO_MODE};
  process.env.SERPRO_CONSUMER_KEY="key";process.env.SERPRO_CONSUMER_SECRET="secret";process.env.SERPRO_MODE="production";process.env.SERPRO_CNPJ_ENDPOINT_TEMPLATE="https://example.test/v2/empresa/{cnpj}";
  const calls=[];
  const fakeFetch=async(url,opts={})=>{calls.push([url,opts]);if(String(url).includes("/token"))return{ok:true,status:200,json:async()=>({access_token:"TOKEN",expires_in:3600})};return{ok:true,status:200,json:async()=>({ni:"L9J5BYRT000101",nome_empresarial:"EMPRESA ALFA",situacao_cadastral:{codigo:"2"},cnae_principal:{codigo:"6204000",descricao:"Consultoria em tecnologia da informação"},endereco:{municipio:"UBERABA",uf:"MG"}})}};
  const company=await fetchOfficialCnpj("L9.J5B.YRT/0001-01",fakeFetch);
  assert.equal(company.cnpj,"L9J5BYRT000101");assert.equal(company.status.code,"2");assert.ok(calls.some(([u])=>String(u).endsWith("/v2/empresa/L9J5BYRT000101")));
  old.key===undefined?delete process.env.SERPRO_CONSUMER_KEY:process.env.SERPRO_CONSUMER_KEY=old.key;old.secret===undefined?delete process.env.SERPRO_CONSUMER_SECRET:process.env.SERPRO_CONSUMER_SECRET=old.secret;old.template===undefined?delete process.env.SERPRO_CNPJ_ENDPOINT_TEMPLATE:process.env.SERPRO_CNPJ_ENDPOINT_TEMPLATE=old.template;old.mode===undefined?delete process.env.SERPRO_MODE:process.env.SERPRO_MODE=old.mode;
});

test("readiness can pass only with all external production dependencies configured",()=>{
 const env={CNPJ_PROVIDER:"cnpjws",COMPANY_LOOKUP_SIGNING_SECRET:"a".repeat(32),QUOTE_SIGNING_SECRET:"b".repeat(32),DATABASE_URL:"postgres://x",TURNSTILE_REQUIRED:"true",PUBLIC_TURNSTILE_SITE_KEY:"site",TURNSTILE_SECRET_KEY:"secret",RESEND_API_KEY:"re_test",RESEND_FROM_EMAIL:"Achei Aqui <contato@example.test>",CONTACT_DESTINATION_EMAIL:"owner@example.test",PUBLIC_CONTACT_EMAIL:"",PUBLIC_PRIVACY_EMAIL:"privacidade@example.test",CONTROLLER_LEGAL_NAME:"Controlador",CONTROLLER_DOCUMENT:"Documento",PRIVACY_POLICY_STATUS:"APPROVED"};
 assert.equal(productionReadiness(env).ready,true)
});
