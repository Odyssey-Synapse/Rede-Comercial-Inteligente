import { isValidCnpj, formatCnpj, normalizeCnpj } from "../lib/cnpj.mjs";
import { fetchFounderStatus, founderStatusCopy } from "./founder-status.js";

const lookupForm=document.querySelector("#company-lookup-form");
const result=document.querySelector("#quote-result");
const cnpj=document.querySelector("#cnpj");
const lookupMessage=document.querySelector("#lookup-message");
const confirmation=document.querySelector("#company-confirmation");
const lookupButton=document.querySelector("#lookup-button");
const quoteButton=document.querySelector("#quote-button");
let lookupToken=null, companyData=null, selectedCategory=null, turnstileWidgetId=null, publicConfig=null;
const founderStatusPromise=fetchFounderStatus();

cnpj.addEventListener("input",()=>{cnpj.value=formatCnpj(cnpj.value); fieldInvalid("cnpj",false)});
function fieldInvalid(id,invalid){document.querySelector(`#${id}`)?.closest(".field")?.classList.toggle("invalid",invalid)}
function setLookupMessage(text,type=""){lookupMessage.className=`lookup-message ${type}`;lookupMessage.textContent=text}
function fmtDate(iso){return new Intl.DateTimeFormat("pt-BR",{dateStyle:"medium"}).format(new Date(iso))}
function money(cents){return new Intl.NumberFormat("pt-BR",{style:"currency",currency:"BRL"}).format(cents/100)}
function escapeHtml(s=""){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}

async function loadPublicConfig(){
 try{const r=await fetch("/api/public-config");if(!r.ok)throw new Error();publicConfig=await r.json();if(publicConfig.turnstileRequired) await setupTurnstile()}catch{publicConfig={turnstileRequired:false,turnstileSiteKey:null}}
}
async function setupTurnstile(){
 const slot=document.querySelector("#turnstile-slot");
 if(!publicConfig?.turnstileSiteKey){slot.hidden=false;slot.innerHTML='<p class="fine">Proteção antiabuso ainda não configurada.</p>';return}
 slot.hidden=false;
 if(!window.turnstile){
  await new Promise((resolve,reject)=>{const s=document.createElement("script");s.src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";s.async=true;s.defer=true;s.onload=resolve;s.onerror=reject;document.head.appendChild(s)})
 }
 turnstileWidgetId=window.turnstile.render(slot,{sitekey:publicConfig.turnstileSiteKey,theme:document.documentElement.dataset.theme==="dark"?"dark":"light",action:"cnpj_lookup"});
}
function turnstileToken(){return turnstileWidgetId!==null&&window.turnstile?window.turnstile.getResponse(turnstileWidgetId):null}
function resetTurnstile(){if(turnstileWidgetId!==null&&window.turnstile)window.turnstile.reset(turnstileWidgetId)}

function renderCompany(company){
 companyData=company;
 selectedCategory=company.categories?.[0]||null;
 confirmation.hidden=false;
 document.querySelector("#found-company-name").textContent=company.tradeName||company.legalName||"Empresa consultada";
 document.querySelector("#found-company-meta").textContent=company.tradeName&&company.legalName?company.legalName:"Dados cadastrais consultados";
 document.querySelector("#found-cnpj").textContent=formatCnpj(company.cnpj);
 document.querySelector("#found-location").textContent=[company.city,company.state].filter(Boolean).join(" — ")||"Não informado";

 const primaryLabel=document.querySelector("#primary-activity-label");
 const primaryCnae=document.querySelector("#primary-activity-cnae");
 primaryLabel.textContent=selectedCategory?.label||"Atividade não identificada";
 primaryCnae.textContent=selectedCategory?.cnaeCode?`CNAE ${selectedCategory.cnaeCode}`:"";

 const secondary=(company.categories||[]).slice(1);
 const wrap=document.querySelector("#secondary-activities-wrap");
 const list=document.querySelector("#activity-list");
 wrap.hidden=secondary.length===0;
 list.innerHTML=secondary.map(item=>`<div class="activity-item"><span>atividade secundária</span><strong>${escapeHtml(item.label)}</strong><small>CNAE ${escapeHtml(item.cnaeCode)}</small></div>`).join("");
}

lookupForm.addEventListener("submit",async e=>{
 e.preventDefault();lookupToken=null;companyData=null;selectedCategory=null;confirmation.hidden=true;
 const valid=isValidCnpj(cnpj.value);fieldInvalid("cnpj",!valid);if(!valid)return;
 if(publicConfig?.turnstileRequired&&!turnstileToken()){setLookupMessage("Conclua a verificação de segurança antes de consultar.","error");return}
 lookupButton.disabled=true;lookupButton.textContent="Consultando…";setLookupMessage("Consultando situação cadastral e atividades econômicas…","loading");
 try{
  const r=await fetch("/api/cnpj",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({cnpj:normalizeCnpj(cnpj.value),turnstileToken:turnstileToken()})});
  const data=await r.json().catch(()=>({}));
  resetTurnstile();
  if(!r.ok){
   const messages={INVALID_CNPJ:"CNPJ inválido.",CNPJ_NOT_FOUND:"CNPJ não encontrado na consulta.",CNPJ_NOT_ACTIVE:"A empresa foi encontrada, mas a situação cadastral não permite proposta automática.",NO_ELIGIBLE_CNAE_ACTIVITY:"A empresa foi encontrada, mas nenhuma atividade econômica elegível foi retornada.",CNPJ_PROVIDER_UNAVAILABLE:"A consulta cadastral está temporariamente indisponível.",
   CNPJ_PROVIDER_TIMEOUT:"A consulta cadastral demorou mais que o limite de segurança. Tente novamente.",
   CNPJ_PROVIDER_PARTIAL:"A consulta cadastral retornou dados incompletos. Nenhuma proposta foi emitida.",
   SERPRO_AUTH_FAILED:"A autenticação do serviço oficial de CNPJ falhou no servidor.",
   SERPRO_ACCESS_DENIED:"O contrato do provedor SERPRO não autorizou esta consulta.",SERPRO_CREDENTIALS_NOT_CONFIGURED:"A integração SERPRO ainda não foi configurada no servidor.",SERPRO_ENDPOINT_TEMPLATE_NOT_CONFIGURED:"O endpoint contratado do SERPRO ainda não foi configurado.",CNPJ_PROVIDER_RATE_LIMITED:"O limite temporário da consulta cadastral foi atingido. Aguarde um minuto e tente novamente.",CNPJ_LOOKUP_INTERNAL_ERROR:"A consulta falhou internamente. O erro foi registrado para diagnóstico.",CNPJ_PROVIDER_NOT_CONFIGURED:"O provedor de consulta CNPJ não está configurado.",TURNSTILE_VERIFY_UNAVAILABLE:"A verificação de segurança não conseguiu falar com a Cloudflare. Tente novamente.",TURNSTILE_VERIFY_TIMEOUT:"A verificação de segurança demorou demais. Tente novamente.",TURNSTILE_ACTION_MISMATCH:"A verificação de segurança não corresponde a esta ação. Recarregue a página.",TURNSTILE_HOSTNAME_MISMATCH:"A verificação de segurança não corresponde a este endereço do site. Recarregue a página.",TURNSTILE_REJECTED:"A verificação de segurança expirou ou já foi usada. Tente novamente.",LOOKUP_SIGNING_NOT_CONFIGURED:"A assinatura da consulta empresarial ainda não foi configurada."};
   throw new Error(messages[data.error]||"Não foi possível validar esta empresa agora.")
  }
  lookupToken=data.lookupToken;renderCompany(data.company);setLookupMessage("Empresa validada. A atividade principal foi identificada automaticamente.","success")
 }catch(err){setLookupMessage(err.message||"Falha na consulta.","error")}
 finally{lookupButton.disabled=false;lookupButton.textContent="Consultar empresa"}
});

document.querySelector("#change-cnpj").addEventListener("click",()=>{lookupToken=null;companyData=null;selectedCategory=null;confirmation.hidden=true;result.innerHTML='<div class="result-empty"><div><div class="orb">CNPJ</div><h3>A proposta começa pela empresa real.</h3><p>Consulte o CNPJ para validar a situação cadastral e identificar as atividades elegíveis.</p></div></div>';cnpj.focus()});

quoteButton.addEventListener("click",async()=>{
 if(!lookupToken||!selectedCategory?.id)return;
 quoteButton.disabled=true;quoteButton.textContent="Gerando proposta…";
 try{
  const r=await fetch("/api/quote",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({lookupToken,categoryId:selectedCategory.id,resourceIds:[]})});
  const data=await r.json().catch(()=>({}));
  if(r.ok&&data.quote)return renderQuote(data.quote,{signed:true,persisted:!!data.persisted});
  if(data.preview)return renderQuote(data.preview,{signed:false,persisted:false,error:data.error});
  const messages={COMPANY_LOOKUP_EXPIRED:"A validação cadastral expirou. Consulte o CNPJ novamente.",CATEGORY_NOT_LINKED_TO_CNPJ:"A atividade selecionada não pertence ao CNPJ validado.",QUOTE_SIGNING_NOT_CONFIGURED:"A assinatura oficial da proposta ainda não foi configurada.",QUOTE_STORE_NOT_CONFIGURED:"O banco de propostas ainda não foi configurado.",QUOTE_STORE_FAILED:"A proposta não pôde ser persistida. Nenhuma proposta oficial foi emitida."};
  throw new Error(messages[data.error]||"Não foi possível gerar a proposta.")
 }catch(err){result.innerHTML=`<div class="result-empty"><div><div class="orb">!</div><h3>Proposta não emitida.</h3><p>${escapeHtml(err.message||"Tente novamente.")}</p></div></div>`}
 finally{quoteButton.disabled=false;quoteButton.textContent="Calcular mensalidade"}
});


function founderQuoteContext(q){
 if(q.founderVerified){
  return `<div class="founder-quote-context recognized">
   <span class="eyebrow">CONDIÇÃO FOUNDER</span>
   <strong>Este CNPJ está reconhecido como Parceiro Fundador.</strong>
   <p>A condição comercial Founder aplicada à proposta mantém mensalidade de <strong>R$ 0</strong> enquanto a condição de Fundador permanecer válida.</p>
   <a href="/#fundadores">Rever o Programa de Fundadores →</a>
  </div>`;
 }
 return `<div class="founder-quote-context">
  <span class="eyebrow">PROGRAMA PARCEIROS FUNDADORES</span>
  <strong>Este valor representa a condição comercial convencional.</strong>
  <p>O Programa de Fundadores possui até 25 vagas e prevê mensalidade Founder de <strong>R$ 0</strong> enquanto a condição permanecer válida. A entrada no Programa é confirmada separadamente e não é presumida pela calculadora.</p>
  <div class="founder-quote-status" id="quote-founder-status"><b>Verificando disponibilidade do Programa…</b><span>O status não altera esta proposta convencional.</span></div>
  <div class="founder-quote-links"><a href="/#fundadores">Entender o Programa →</a><a href="/contato.html">Falar com a Rede →</a></div>
 </div>`;
}

async function hydrateQuoteFounderStatus(){
 const target=document.querySelector("#quote-founder-status");
 if(!target)return;
 const status=await founderStatusPromise;
 const copy=founderStatusCopy(status);
 target.dataset.tone=copy.tone;
 target.innerHTML=`<b>${escapeHtml(copy.label)}</b><span>${escapeHtml(copy.detail)}</span>`;
}

function renderQuote(q,{signed=false,persisted=false,error=null}={}){
 if(q.status!=="QUOTABLE"){result.innerHTML='<div class="result-empty"><div><div class="orb">!</div><h3>Precisamos revisar esta situação.</h3><p>Não foi possível gerar uma mensalidade automática.</p></div></div>';return}
 const hasAdjustment=q.economicBasis==="EVIDENCED_IVE";
 const basis=hasAdjustment?"Existe um ajuste econômico aprovado e válido para esta atividade.":"Ainda não existe ajuste econômico aprovado para esta atividade. A proposta aplica somente o valor-base atual.";
 const badge=signed&&persisted?"PROPOSTA OFICIAL":"PRÉVIA — NÃO EMITIDA";
 result.innerHTML=`<div class="quote-status"><span class="eyebrow">MENSALIDADE PROPOSTA</span><span class="quote-badge ${signed&&persisted?'':'preview'}">${badge}</span></div>
 <div class="quote-company"><small>Empresa</small><strong>${escapeHtml(q.company.tradeName||q.company.name)}</strong><span>${escapeHtml(formatCnpj(q.company.cnpj))} · ${escapeHtml(q.category.label)} · CNAE ${escapeHtml(q.category.cnaeCode)}</span></div>
 <div class="price-display"><small>Valor mensal</small><strong>${money(q.proposedMonthlyCents)}</strong><span>/ mês</span></div>
 <div class="price-lines"><div class="price-line"><span>Valor-base da Rede</span><strong>${money(q.vbcCents)}</strong></div><div class="price-line"><span>Ajuste econômico da atividade</span><strong>${money(q.premiumCents)}</strong></div><div class="price-line"><span>Recursos adicionais</span><strong>${money(q.resourceCents)}</strong></div><div class="price-line"><span>Mensalidade proposta</span><strong>${money(q.proposedMonthlyCents)}</strong></div></div>
 <div class="basis-note"><strong>Como este valor foi formado:</strong> ${basis}</div>
 ${founderQuoteContext(q)}
 ${error?`<div class="quote-warning"><strong>Esta prévia não é uma proposta oficial.</strong><span>Motivo técnico: ${escapeHtml(error)}</span></div>`:""}
 <div class="quote-meta"><div><small>Regra aplicada</small><strong>Política comercial vigente</strong></div><div><small>Calculado em</small><strong>${fmtDate(q.computedAt)}</strong></div><div><small>Válida até</small><strong>${fmtDate(q.validUntil)}</strong></div><div><small>Identificação</small><strong>${escapeHtml(q.quoteId.slice(0,8))}…</strong></div></div>
 <p class="fine">A atividade utilizada na proposta veio da consulta cadastral do CNPJ. Durante a validade, uma proposta oficial permanece vinculada às condições apresentadas.</p>
 ${signed&&persisted?`<div class="quote-actions quote-actions-primary">
   <button class="button button-primary" id="accept-quote" type="button">Aceitar proposta e continuar</button>
   <button class="button button-ghost" id="print-quote" type="button">Imprimir / salvar PDF</button>
   <a class="button button-ghost" href="/transparencia.html">Entender as regras</a>
  </div>
  <div id="quote-acceptance-panel" class="quote-acceptance-panel" hidden>
   <div class="acceptance-heading">
    <span class="eyebrow">ACEITE COMERCIAL</span>
    <h3>Confirme quem está aceitando esta proposta.</h3>
    <p class="fine">Este registro confirma o aceite comercial desta proposta e das condições nela apresentadas. Não é apresentado como assinatura eletrônica qualificada ou avançada.</p>
   </div>
   <form id="quote-acceptance-form" novalidate>
    <div class="field">
     <label for="accepted-by-name">Nome completo</label>
     <input id="accepted-by-name" name="acceptedByName" autocomplete="name" maxlength="120" required>
     <span class="input-error">Informe seu nome.</span>
    </div>
    <div class="field">
     <label for="accepted-by-email">E-mail</label>
     <input id="accepted-by-email" name="acceptedByEmail" type="email" autocomplete="email" maxlength="160" required>
     <span class="input-error">Informe um e-mail válido.</span>
    </div>
    <label class="acceptance-check">
     <input id="accepted-terms" type="checkbox">
     <span>Li a proposta acima e confirmo o aceite comercial das condições apresentadas.</span>
    </label>
    <p id="acceptance-message" class="lookup-message" aria-live="polite"></p>
    <div class="acceptance-buttons">
     <button class="button button-primary button-full" id="confirm-acceptance" type="submit">Confirmar aceite</button>
     <button class="button button-ghost button-full" id="cancel-acceptance" type="button">Voltar</button>
    </div>
   </form>
  </div>`:''}`;
 document.querySelector("#print-quote")?.addEventListener("click",()=>window.print());
 if(!q.founderVerified) hydrateQuoteFounderStatus();
 if(signed&&persisted) setupQuoteAcceptance(q);
}

function validEmail(value){
 return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value||"").trim())
}

function setupQuoteAcceptance(q){
 const open=document.querySelector("#accept-quote");
 const panel=document.querySelector("#quote-acceptance-panel");
 const form=document.querySelector("#quote-acceptance-form");
 const cancel=document.querySelector("#cancel-acceptance");
 const message=document.querySelector("#acceptance-message");

 if(!open||!panel||!form)return;

 open.addEventListener("click",()=>{
  panel.hidden=false;
  open.disabled=true;
  document.querySelector("#accepted-by-name")?.focus();
  panel.scrollIntoView({behavior:"smooth",block:"nearest"});
 });

 cancel?.addEventListener("click",()=>{
  panel.hidden=true;
  open.disabled=false;
  message.textContent="";
  message.className="lookup-message";
 });

 form.addEventListener("submit",async e=>{
  e.preventDefault();

  const name=document.querySelector("#accepted-by-name");
  const email=document.querySelector("#accepted-by-email");
  const terms=document.querySelector("#accepted-terms");
  const confirm=document.querySelector("#confirm-acceptance");

  const nameOk=String(name?.value||"").trim().length>=2;
  const emailOk=validEmail(email?.value);
  const termsOk=terms?.checked===true;

  name?.closest(".field")?.classList.toggle("invalid",!nameOk);
  email?.closest(".field")?.classList.toggle("invalid",!emailOk);
  terms?.closest(".acceptance-check")?.classList.toggle("invalid",!termsOk);

  if(!nameOk||!emailOk||!termsOk){
   message.className="lookup-message error";
   message.textContent=!termsOk
    ?"Confirme que leu e aceita as condições da proposta."
    :"Confira nome e e-mail antes de continuar.";
   return;
  }

  confirm.disabled=true;
  confirm.textContent="Registrando aceite…";
  message.className="lookup-message loading";
  message.textContent="Registrando o aceite comercial…";

  try{
   const r=await fetch("/api/quote-accept",{
    method:"POST",
    headers:{"content-type":"application/json"},
    body:JSON.stringify({
     quoteId:q.quoteId,
     acceptedByName:String(name.value).trim(),
     acceptedByEmail:String(email.value).trim(),
     acceptedTerms:true
    })
   });

   const data=await r.json().catch(()=>({}));

   if(!r.ok){
    const messages={
     INVALID_QUOTE_ID:"A identificação desta proposta é inválida.",
     QUOTE_NOT_FOUND:"Esta proposta não foi encontrada.",
     QUOTE_EXPIRED:"Esta proposta venceu. Gere uma nova proposta.",
     QUOTE_CANCELLED:"Esta proposta foi cancelada.",
     QUOTE_ALREADY_ACCEPTED:"Esta proposta já possui um aceite registrado.",
     ACCEPTED_BY_NAME_REQUIRED:"Informe o nome de quem está aceitando.",
     ACCEPTED_BY_EMAIL_INVALID:"Informe um e-mail válido.",
     ACCEPTANCE_TERMS_REQUIRED:"Confirme o aceite das condições antes de continuar.",
     DATABASE_URL_MISSING:"O registro de aceite está temporariamente indisponível.",
     QUOTE_ACCEPT_FAILED:"Não foi possível registrar o aceite."
    };
    throw new Error(messages[data.error]||"Não foi possível registrar o aceite agora.");
   }

   renderAcceptanceSuccess(q,data,String(name.value).trim(),String(email.value).trim());
  }catch(err){
   message.className="lookup-message error";
   message.textContent=err.message||"Não foi possível registrar o aceite.";
   confirm.disabled=false;
   confirm.textContent="Confirmar aceite";
  }
 });
}

function renderAcceptanceSuccess(q,data,name,email){
 const panel=document.querySelector("#quote-acceptance-panel");
 const actions=document.querySelector(".quote-actions-primary");

 if(actions)actions.innerHTML=`
  <div class="acceptance-success-badge">ACEITE REGISTRADO</div>
  <button class="button button-ghost" id="print-quote" type="button">Imprimir / salvar PDF</button>
  <a class="button button-ghost" href="/transparencia.html">Entender as regras</a>`;

 if(panel)panel.innerHTML=`
  <div class="acceptance-success">
   <span class="eyebrow">ACEITE COMERCIAL REGISTRADO</span>
   <h3>Proposta aceita.</h3>
   <p>O aceite da proposta <strong>${escapeHtml(q.quoteId)}</strong> foi registrado.</p>
   <div class="acceptance-summary">
    <div><small>Responsável</small><strong>${escapeHtml(name)}</strong></div>
    <div><small>E-mail</small><strong>${escapeHtml(email)}</strong></div>
    <div><small>Registrado em</small><strong>${fmtDate(data.acceptedAt)}</strong></div>
   </div>
   <p class="fine">Guarde a identificação da proposta. O próximo passo operacional/comercial pode ser tratado pela equipe do Achei Aqui.</p>
  </div>`;

 document.querySelector("#print-quote")?.addEventListener("click",()=>window.print());
}

await loadPublicConfig();
