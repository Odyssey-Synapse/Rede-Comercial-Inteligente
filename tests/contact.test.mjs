import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=f=>fs.readFileSync(path.join(root,f),"utf8");

test("formulario de contato existe e usa endpoint server-side",()=>{
 const h=read("contato.html"),j=read("assets/contact-page.js");
 assert.match(h,/id="contact-form"/);assert.match(j,/\/api\/contact/);
});
test("segredos do Resend ficam apenas no servidor",()=>{
 const api=read("api/contact.js"),front=read("assets/contact-page.js")+read("contato.html");
 assert.match(api,/process\.env\.RESEND_API_KEY/);assert.equal(front.includes("RESEND_API_KEY"),false);
});
test("contato possui validacao honeypot rate-limit e turnstile",()=>{
 const api=read("api/contact.js");
 for(const token of ["website","rateLimited","verifyTurnstileToken","CONSENT_REQUIRED"]) assert.ok(api.includes(token),token);
});
test("coleta publica falha fechada sem politica de privacidade aprovada",()=>{
 const api=read("api/contact.js"),config=read("api/public-config.js");
 assert.match(api,/PRIVACY_POLICY_STATUS\s*!==\s*"APPROVED"/);
 assert.match(api,/PRIVACY_POLICY_NOT_APPROVED/);
 assert.match(config,/contactFormEnabled:\s*privacyPolicyApproved\s*&&\s*contactProviderConfigured/);
});
test("mapa de demanda do consumidor pode ser anônimo como a interface promete",()=>{
 const api=read("api/contact.js"),participacao=read("assets/participacao.js");
 assert.match(participacao,/subject:isCompany\?"Mapa de capacidade — empresa interessada":"Mapa de demanda — consumidor"/);
 assert.match(api,/"Mapa de demanda — consumidor"/);
 assert.match(api,/isConsumerSurvey\s*&&\s*email\s*&&\s*!emailRe\.test\(email\)/);
});
test("formulario de contato trata falha de carregamento do Turnstile sem apagar campos",()=>{
 const front=read("assets/contact-page.js");
 assert.match(front,/script\.onerror/);
 assert.match(front,/os campos continuam preenchidos/i);
 assert.match(front,/"error-callback"/);
});
test("readiness exige configuracao Resend",async()=>{
 const {productionReadiness}=await import("../lib/readiness.mjs");
 const r=productionReadiness({});
 for(const id of ["RESEND_API_KEY","RESEND_FROM_EMAIL","CONTACT_DESTINATION_EMAIL"]) assert.ok(r.blockers.some(x=>x.id===id),id);
});

test("canal de privacidade pode reutilizar formulario Resend",async()=>{
 const {productionReadiness}=await import("../lib/readiness.mjs");
 const env={RESEND_API_KEY:"re_x",RESEND_FROM_EMAIL:"Uai Perto <contato@example.test>",CONTACT_DESTINATION_EMAIL:"owner@example.test"};
 const r=productionReadiness(env);
 assert.equal(r.blockers.some(x=>x.id==="PRIVACY_CHANNEL"),false);
});

test("pagina de privacidade direciona pedidos ao formulario institucional",()=>{
 const privacy=fs.readFileSync(new URL("../privacidade.html",import.meta.url),"utf8");
 const contact=fs.readFileSync(new URL("../assets/contact-page.js",import.meta.url),"utf8");
 assert.match(privacy,/contato\.html\?assunto=Privacidade/);
 assert.match(contact,/URLSearchParams/);
});
