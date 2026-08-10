import test from "node:test";
import assert from "node:assert/strict";
import { normalizeCnpjWsRecord, fetchCnpjWs, clearCnpjWsCacheForTests } from "../lib/cnpjws.mjs";
import { fetchCnpjRecord, configuredCnpjProvider } from "../lib/cnpj-provider.mjs";

function fixture(cnpj="11222333000181"){
  return {
    razao_social:"EMPRESA TESTE LTDA",
    atualizado_em:"2026-08-09T12:00:00Z",
    estabelecimento:{
      cnpj,
      nome_fantasia:"EMPRESA TESTE",
      situacao_cadastral:"Ativa",
      atualizado_em:"2026-08-09T13:00:00Z",
      atividade_principal:{id:"7500100",descricao:"Atividades veterinárias"},
      atividades_secundarias:[
        {id:"4771704",descricao:"Comércio varejista de medicamentos veterinários"},
        {id:"7500100",descricao:"Duplicado"}
      ],
      estado:{sigla:"MG"},
      cidade:{nome:"Uberaba"}
    }
  };
}

test("normaliza CNPJ.ws e retém somente dados necessários",()=>{
  const x=normalizeCnpjWsRecord(fixture());
  assert.equal(x.cnpj,"11222333000181");
  assert.equal(x.status.code,"2");
  assert.equal(x.activities.length,2);
  assert.equal(x.principalActivity.code,"7500100");
  assert.equal(x.city,"Uberaba");
  assert.equal(x.state,"MG");
  assert.equal(x.provider,"CNPJWS_PUBLIC_V1");
  assert.equal(x.sourceUpdatedAt,"2026-08-09T13:00:00Z");
  assert.equal("socios" in x,false);
});

test("normaliza CNPJ alfanumérico",()=>{
  const x=normalizeCnpjWsRecord(fixture("UKPVME1E8HI996"));
  assert.equal(x.cnpj,"UKPVME1E8HI996");
  assert.equal(x.status.code,"2");
});

test("cliente usa endpoint público sem token e cacheia",async()=>{
  clearCnpjWsCacheForTests();
  let calls=0;
  const fakeFetch=async(url,opts={})=>{
    calls++;
    assert.equal(String(url),"https://publica.cnpj.ws/cnpj/11222333000181");
    assert.equal(opts.headers.accept,"application/json");
    assert.equal("authorization" in opts.headers,false);
    return {status:200,json:async()=>fixture()};
  };
  const env={CNPJWS_BASE_URL:"https://publica.cnpj.ws",CNPJ_CACHE_TTL_SECONDS:"900",CNPJWS_TIMEOUT_MS:"8000"};
  await fetchCnpjWs("11.222.333/0001-81",fakeFetch,env);
  await fetchCnpjWs("11222333000181",fakeFetch,env);
  assert.equal(calls,1);
});

test("HTTP 429 é preservado para tratamento de limite",async()=>{
  clearCnpjWsCacheForTests();
  const fakeFetch=async()=>({status:429,json:async()=>({titulo:"Limite"})});
  await assert.rejects(()=>fetchCnpjWs("11222333000181",fakeFetch,{CNPJWS_TIMEOUT_MS:"8000"}),/CNPJWS_FAILED:429/);
});

test("provedor padrão é CNPJ.ws",async()=>{
  clearCnpjWsCacheForTests();
  assert.equal(configuredCnpjProvider({}),"cnpjws");
  const fakeFetch=async()=>({status:200,json:async()=>fixture()});
  const x=await fetchCnpjRecord("11222333000181",fakeFetch,{CNPJ_PROVIDER:"cnpjws"});
  assert.equal(x.provider,"CNPJWS_PUBLIC_V1");
});
