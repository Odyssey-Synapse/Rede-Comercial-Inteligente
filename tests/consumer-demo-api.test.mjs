import test from 'node:test';
import assert from 'node:assert/strict';
import sessionHandler from '../api/consumer-demo/session.js';
import actionHandler from '../api/consumer-demo/action.js';

function response(){return{statusCode:200,headers:{},body:null,setHeader(name,value){this.headers[name]=value},status(code){this.statusCode=code;return this},json(value){this.body=value;return this}}}
function request(body={},headers={}){return{method:'POST',body,headers:{host:'uaiperto.test','x-forwarded-for':`198.51.100.${Math.floor(Math.random()*200)+1}`,...headers}}}
const privateEnv={MCIR_PUBLIC_ASSISTANT_ORIGIN:'https://consumer-origin.example.test',CF_ACCESS_CLIENT_ID:'access-client-id',CF_ACCESS_CLIENT_SECRET:'access-client-secret',MCIR_ASSISTANT_GATEWAY_SECRET:'gateway-secret',NODE_ENV:'production'};
async function withEnvironment(values,fn){const previous={};for(const[key,value]of Object.entries(values)){previous[key]=process.env[key];if(value===undefined)delete process.env[key];else process.env[key]=value}try{return await fn()}finally{for(const[key,value]of Object.entries(previous)){if(value===undefined)delete process.env[key];else process.env[key]=value}}}

test('session token stays only in an HttpOnly strict cookie',async()=>withEnvironment(privateEnv,async()=>{
  const original=global.fetch;let call;
  global.fetch=async(url,options)=>{call={url:String(url),options};return{ok:true,status:201,json:async()=>({token:'header.payload.signature',expires_in_seconds:900,surface:'UAI_PERTO_CONSUMER_DEMO',actor_id:'hidden'})}};
  try{const res=response();await sessionHandler(request({actor:{type:'company'}}),res);assert.equal(res.statusCode,201);assert.deepEqual(res.body,{ok:true,expiresInSeconds:900});assert.match(res.headers['Set-Cookie'],/^__Host-uai_consumer_demo=header\.payload\.signature;/);assert.match(res.headers['Set-Cookie'],/HttpOnly; Secure; SameSite=Strict/);assert.equal(call.url,'https://consumer-origin.example.test/v1/public/consumer-demo/session');assert.doesNotMatch(JSON.stringify(res.body),/token|origin|secret|actor/i);}finally{global.fetch=original}
}));

test('enumerated action crosses Vercel transport without exposing credentials',async()=>withEnvironment(privateEnv,async()=>{
  const original=global.fetch;let call;
  global.fetch=async(url,options)=>{call={url:String(url),options};return{ok:true,status:200,json:async()=>({message:'Entendi. Posso continuar.',trace:'must-not-pass'})}};
  try{const res=response();await actionHandler(request({action:'MESSAGE',payload:{text:'Meu chuveiro queimou.'}},{cookie:'__Host-uai_consumer_demo=header.payload.signature'}),res);assert.equal(res.statusCode,200);assert.deepEqual(res.body,{message:'Entendi. Posso continuar.'});assert.equal(call.url,'https://consumer-origin.example.test/v1/public/consumer-demo/action');assert.equal(call.options.headers.Authorization,'Bearer header.payload.signature');assert.deepEqual(JSON.parse(call.options.body),{action:'MESSAGE',payload:{text:'Meu chuveiro queimou.'}});assert.doesNotMatch(JSON.stringify(res.body),/token|trace|secret|origin/i);}finally{global.fetch=original}
}));

test('unknown action is rejected before the private origin',async()=>withEnvironment(privateEnv,async()=>{
  const original=global.fetch;let called=false;global.fetch=async()=>{called=true;throw new Error('must not run')};
  try{const res=response();await actionHandler(request({action:'COMPANY_INBOX',payload:{}},{cookie:'__Host-uai_consumer_demo=header.payload.signature'}),res);assert.equal(res.statusCode,400);assert.equal(called,false);}finally{global.fetch=original}
}));

test('origin outage returns the human demo-unavailable boundary',async()=>withEnvironment(privateEnv,async()=>{
  const original=global.fetch;global.fetch=async()=>({ok:false,status:503,json:async()=>({error:{code:'INTERNAL_ERROR'},trace:'hidden'})});
  try{const res=response();await actionHandler(request({action:'MESSAGE',payload:{text:'Preciso de ajuda.'}},{cookie:'__Host-uai_consumer_demo=header.payload.signature'}),res);assert.equal(res.statusCode,503);assert.match(res.body.message,/temporariamente indisponível/i);assert.doesNotMatch(JSON.stringify(res.body),/trace|internal|kernel|origin/i);}finally{global.fetch=original}
}));
