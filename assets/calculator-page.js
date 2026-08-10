import { isValidCnpj, formatCnpj, normalizeCnpj } from "../lib/cnpj.mjs";

const lookupForm=document.querySelector("#company-lookup-form");
const result=document.querySelector("#quote-result");
const cnpj=document.querySelector("#cnpj");
const lookupMessage=document.querySelector("#lookup-message");
const confirmation=document.querySelector("#company-confirmation");
const lookupButton=document.querySelector("#lookup-button");
const quoteButton=document.querySelector("#quote-button");
let lookupToken=null, companyData=null, selectedCategory=null, turnstileWidgetId=null, publicConfig=null;

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
 turnstileWidgetId=window.turnstile.render(slot,{sitekey:publicConfig.turnstileSiteKey,theme:document.documentElement.dataset.theme==="dark"?"dark":"light"});
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
   SERPRO_ACCESS_DENIED:"O contrato do provedor SERPRO não autorizou esta consulta.",SERPRO_CREDENTIALS_NOT_CONFIGURED:"A integração SERPRO ainda não foi configurada no servidor.",SERPRO_ENDPOINT_TEMPLATE_NOT_CONFIGURED:"O endpoint contratado do SERPRO ainda não foi configurado.",CNPJ_PROVIDER_RATE_LIMITED:"O limite temporário da consulta cadastral foi atingido. Aguarde um minuto e tente novamente.",CNPJ_PROVIDER_NOT_CONFIGURED:"O provedor de consulta CNPJ não está configurado.",LOOKUP_SIGNING_NOT_CONFIGURED:"A assinatura da consulta empresarial ainda não foi configurada."};
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
 ${error?`<div class="quote-warning"><strong>Esta prévia não é uma proposta oficial.</strong><span>Motivo técnico: ${escapeHtml(error)}</span></div>`:""}
 <div class="quote-meta"><div><small>Regra aplicada</small><strong>Política comercial vigente</strong></div><div><small>Calculado em</small><strong>${fmtDate(q.computedAt)}</strong></div><div><small>Válida até</small><strong>${fmtDate(q.validUntil)}</strong></div><div><small>Identificação</small><strong>${escapeHtml(q.quoteId.slice(0,8))}…</strong></div></div>
 <p class="fine">A atividade utilizada na proposta veio da consulta cadastral do CNPJ. Durante a validade, uma proposta oficial permanece vinculada às condições apresentadas.</p>
 ${signed&&persisted?'<div class="quote-actions"><button class="button button-primary" id="print-quote">Imprimir / salvar PDF</button><a class="button button-ghost" href="/transparencia.html">Entender as regras</a></div>':''}`;
 document.querySelector("#print-quote")?.addEventListener("click",()=>window.print())
}

await loadPublicConfig();
