import test from "node:test";
import assert from "node:assert/strict";
import { normalizeSerproRecord, fetchOfficialCnpj, clearSerproTokenCacheForTests } from "../lib/serpro-cnpj.mjs";

test("normaliza resposta V2 com CNAE principal e secundários",()=>{
  const x=normalizeSerproRecord({
    ni:"11222333000181",
    nome_empresarial:"EMPRESA TESTE LTDA",
    nome_fantasia:"TESTE",
    situacao_cadastral:{codigo:"2"},
    cnae_principal:{codigo:"7500100",descricao:"Atividades veterinárias"},
    cnaes_secundarios:[
      {codigo:"4771704",descricao:"Comércio varejista de medicamentos veterinários"},
      {codigo:"7500100",descricao:"Duplicado"}
    ],
    endereco:{municipio:"UBERABA",uf:"MG"}
  });
  assert.equal(x.status.code,"2");
  assert.equal(x.status.description,"Ativa");
  assert.equal(x.activities.length,2);
  assert.equal(x.principalActivity.code,"7500100");
  assert.equal(x.city,"UBERABA");
});

test("normaliza shape de cadastro compartilhado",()=>{
  const x=normalizeSerproRecord({
    cnpj:"11222333000181",
    nomeEmpresarial:"EMPRESA",
    estabelecimento:{
      cnpj:"11222333000181",
      nomeFantasia:"LOJA",
      situacaoCadastral:"02",
      cnaeFiscal:"6204000",
      cnaeFiscalDescricao:"Consultoria em tecnologia da informação",
      cnaeSecundarias:["6201501"],
      uf:"MG",
      municipio:"UBERABA"
    }
  });
  assert.equal(x.status.code,"2");
  assert.equal(x.status.description,"Ativa");
  assert.equal(x.activities[0].code,"6204000");
  assert.equal(x.activities[1].code,"6201501");
});

test("cliente SERPRO usa OAuth, request tag e endpoint com CNPJ alfanumérico",async()=>{
  clearSerproTokenCacheForTests();
  const old={...process.env};
  process.env.SERPRO_MODE="production";
  process.env.SERPRO_CONSUMER_KEY="key";
  process.env.SERPRO_CONSUMER_SECRET="secret";
  process.env.SERPRO_CNPJ_ENDPOINT_TEMPLATE="https://example.test/v2/empresa/{cnpj}";
  process.env.SERPRO_REQUEST_TAG_PREFIX="AA";
  const calls=[];
  const fakeFetch=async(url,opts={})=>{
    calls.push({url:String(url),opts});
    if(String(url).includes("/token")) return {ok:true,status:200,json:async()=>({access_token:"TOKEN",expires_in:3295})};
    return {ok:true,status:200,json:async()=>({
      ni:"L9J5BYRT000101",
      nome_empresarial:"EMPRESA ALFA",
      situacao_cadastral:{codigo:"2"},
      cnae_principal:{codigo:"6204000",descricao:"Consultoria em tecnologia da informação"},
      endereco:{municipio:"UBERABA",uf:"MG"}
    })};
  };
  const x=await fetchOfficialCnpj("L9.J5B.YRT/0001-01",fakeFetch);
  assert.equal(x.cnpj,"L9J5BYRT000101");
  const call=calls.find(c=>c.url.includes("/v2/empresa/"));
  assert.ok(call.url.endsWith("/L9J5BYRT000101"));
  assert.equal(call.opts.headers.authorization,"Bearer TOKEN");
  assert.ok(call.opts.headers["x-request-tag"].startsWith("AA-"));
  process.env=old;
});

test("HTTP 206 é marcado como parcial",async()=>{
  clearSerproTokenCacheForTests();
  const old={...process.env};
  process.env.SERPRO_MODE="trial";
  process.env.SERPRO_TRIAL_BEARER_TOKEN="TOKEN";
  process.env.SERPRO_CNPJ_ENDPOINT_TEMPLATE="https://example.test/v2/empresa/{cnpj}";
  const fakeFetch=async()=>({ok:true,status:206,json:async()=>({
    ni:"11222333000181",
    nome_empresarial:"EMPRESA",
    situacao_cadastral:{codigo:"2"},
    cnae_principal:{codigo:"6204000",descricao:"Consultoria"}
  })});
  const x=await fetchOfficialCnpj("11.222.333/0001-81",fakeFetch);
  assert.equal(x.partial,true);
  process.env=old;
});
