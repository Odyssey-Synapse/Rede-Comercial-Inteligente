const pricing={
  catalogo:{label:'Catálogo',monthly:49,initial:149,future:98},
  servico:{label:'Serviço',monthly:79,initial:199,future:158},
  ambos:{label:'Serviço + Catálogo',monthly:99,initial:249,future:198}
};

const money=value=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(value);
const params=new URLSearchParams(location.search);
const requestedModel=params.get('modelo')||'';
const requestedType=params.get('tipo')==='futuro'?'futuro':params.get('tipo')==='inicial'?'inicial':'';
const validCondition=Boolean(pricing[requestedModel]&&requestedType);
const condition=validCondition?{
  model:requestedModel,
  label:pricing[requestedModel].label,
  type:requestedType,
  monthly:pricing[requestedModel].monthly,
  adhesion:requestedType==='inicial'?pricing[requestedModel].initial:pricing[requestedModel].future
}:null;

let config={};
let acceptanceCompleted=false;
let token='';
let widgetId=null;
let turnstileLoadFailed=false;
let turnstileReady=Promise.resolve(true);

try{const response=await fetch('/api/public-config',{cache:'no-store'});if(response.ok)config=await response.json()}catch{}
if(config.turnstileRequired&&config.turnstileSiteKey){
  turnstileReady=new Promise(resolve=>{
    if(window.turnstile){resolve(true);return}
    const script=document.createElement('script');
    script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async=true;script.defer=true;
    script.onload=()=>resolve(true);
    script.onerror=()=>{turnstileLoadFailed=true;resolve(false)};
    document.head.appendChild(script);
  });
}

function clean(value){return String(value||'').trim()}
function setFeedback(text,type=''){
  const el=document.querySelector('#acceptance-feedback');if(!el)return;
  el.textContent=text;el.className=`entry-feedback ${type}`.trim();
}
function setProgress(stage,{completeBefore=true}={}){
  document.querySelectorAll('[data-progress-stage]').forEach(item=>{
    const n=Number(item.dataset.progressStage);
    item.classList.toggle('active',n===stage);
    item.classList.toggle('complete',completeBefore&&n<stage);
  });
}
function waitForTurnstileToken(timeoutMs=8000){
  if(token)return Promise.resolve(true);
  return new Promise(resolve=>{
    const started=Date.now();
    const timer=setInterval(()=>{
      if(token){clearInterval(timer);resolve(true);return}
      if(Date.now()-started>=timeoutMs){clearInterval(timer);resolve(false)}
    },120);
  });
}
async function ensureTurnstile(){
  if(!config.turnstileRequired)return true;
  if(!config.turnstileSiteKey){setFeedback('A verificação de segurança está temporariamente indisponível.','error');return false}
  if(widgetId!==null)return true;
  const loaded=await turnstileReady;
  const target=document.querySelector('#acceptance-turnstile');
  if(!loaded||turnstileLoadFailed||!target||!window.turnstile){setFeedback('Não foi possível carregar a verificação de segurança. Atualize a página e tente novamente.','error');return false}
  try{
    widgetId=window.turnstile.render(target,{
      sitekey:config.turnstileSiteKey,
      theme:'auto',appearance:'always',retry:'auto','refresh-expired':'auto',
      callback:value=>{token=value;if(document.querySelector('#acceptance-feedback')?.textContent?.toLowerCase().includes('verificação de segurança'))setFeedback('')},
      'expired-callback':()=>{token=''},
      'error-callback':code=>{token='';setFeedback(`Não foi possível concluir a verificação de segurança${code?` (${code})`:''}. Atualize a página e tente novamente.`,'error')}
    });
    return true;
  }catch{setFeedback('Não foi possível iniciar a verificação de segurança. Atualize a página e tente novamente.','error');return false}
}
async function sendContact({name,email,message,website=''}){
  if(config.contactFormEnabled===false)throw new Error('CONTACT_DISABLED');
  if(config.turnstileRequired&&!token){
    const ready=await ensureTurnstile();if(!ready)throw new Error('TURNSTILE_LOAD_FAILED');
    setFeedback('Concluindo a verificação de segurança…');
    const verified=await waitForTurnstileToken();if(!verified)throw new Error('TURNSTILE_NOT_READY');
    setFeedback('');
  }
  const response=await fetch('/api/contact',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name,email,subject:'Aceite de condição — empresa',message,website,consent:true,turnstileToken:token})});
  const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||'SEND_FAILED');
  return data;
}
function friendlyError(error){
  if(String(error?.message||'').startsWith('TURNSTILE_')||error?.message==='ANTIABUSE_REJECTED')return 'A verificação de segurança precisa ser refeita. Atualize a página e tente novamente.';
  if(error?.message==='CONTACT_DISABLED'||error?.message==='CONTACT_NOT_CONFIGURED')return 'O canal de envio está temporariamente indisponível.';
  if(error?.message==='RATE_LIMITED')return 'Muitas tentativas em pouco tempo. Tente novamente mais tarde.';
  return 'Não foi possível enviar agora. Tente novamente em alguns minutos.';
}

function renderCondition(){
  if(!condition){setProgress(1,{completeBefore:false});return}
  const card=document.querySelector('#condition-card');
  const locked=document.querySelector('#acceptance-locked');
  const fields=document.querySelector('#acceptance-fields');
  const selected=document.querySelector('#selected-condition');
  const isInitial=condition.type==='inicial';
  const monthlyLabel=condition.model==='catalogo'?`${money(condition.monthly)}/mês`:`a partir de ${money(condition.monthly)}/mês`;
  const recurring=isInitial?'mensalidade recorrente de R$ 0 enquanto a condição Fundador permanecer válida':`${monthlyLabel} a partir do 3º mês, se a empresa decidir continuar`;
  const typeLabel=isInitial?'Condição Fundador entre os 54 iniciais':'Entrada depois dos 54';

  card?.classList.add('ready');
  if(card)card.innerHTML=`
    <span class="status-chip">REFERÊNCIA CARREGADA</span>
    <h3>${condition.label}</h3>
    <div class="condition-summary"><small>Adesão de referência</small><strong>${money(condition.adhesion)}</strong><span>${typeLabel}</span></div>
    <div class="condition-meta"><div><small>Referência recorrente</small><strong>${monthlyLabel}</strong></div><div><small>Depois da entrada</small><strong>${isInitial?'R$ 0/mês':'2 meses incluídos'}</strong></div></div>
    <p class="condition-note">${recurring}. A operação ainda precisa ser confirmada pelo Uai Perto; integrações ou estruturas especiais podem exigir outra avaliação antes da cobrança.</p>`;
  if(locked)locked.hidden=true;
  if(fields)fields.hidden=false;
  if(selected)selected.innerHTML=`<small>Condição que você está pedindo para confirmar</small><strong>${condition.label} · adesão ${money(condition.adhesion)}</strong><span>${typeLabel} · ${recurring}</span>`;
  setProgress(3);
  ensureTurnstile();
}
renderCondition();

const form=document.querySelector('#acceptance-form');
form?.addEventListener('submit',async event=>{
  event.preventDefault();
  if(!condition||acceptanceCompleted)return;
  setFeedback('');
  if(!form.checkValidity()){form.reportValidity();setFeedback('Revise os campos antes de continuar.','error');return}
  const submit=document.querySelector('#acceptance-submit');
  const original=submit.textContent;submit.disabled=true;submit.textContent='Enviando…';
  const company=clean(form.elements.company.value);
  const name=clean(form.elements.name.value);
  const email=clean(form.elements.email.value);
  const whatsapp=clean(form.elements.whatsapp.value);
  const isInitial=condition.type==='inicial';
  const message=[
    'ACEITE DE CONDIÇÃO — ENTRADA DE EMPRESA','',
    `Empresa: ${company}`,
    `Responsável: ${name}`,
    `E-mail: ${email}`,
    `WhatsApp: ${whatsapp}`,
    `Modelo operacional: ${condition.label}`,
    `Tipo de entrada: ${isInitial?'Fundador — entre os 54 iniciais':'Entrada futura'}`,
    `Adesão de referência: ${money(condition.adhesion)}`,
    `Referência mensal: ${money(condition.monthly)}/mês`,
    `Recorrência: ${isInitial?'R$ 0 enquanto a condição Fundador permanecer válida':'dois primeiros meses incluídos; mensalidade a partir do terceiro mês se continuar'}`,'',
    'Declarações marcadas pelo responsável:',
    '- Já apresentou a empresa e confirma os dados enviados.',
    '- Entende que a referência precisa ser confirmada e não gera cobrança automática.',
    '- Quer receber a condição definitiva e, se confirmada, a cobrança identificada.',
    '- Concorda com o uso dos dados para conduzir a entrada.'
  ].join('\n');
  try{
    await sendContact({name:`${name} — ${company}`,email,message,website:form.elements.website?.value||''});
    acceptanceCompleted=true;
    setFeedback('Aceite enviado. O Uai Perto ainda confirma o enquadramento antes de enviar qualquer cobrança.','success');
    setProgress(4);
    const payment=document.querySelector('#payment-card');
    if(payment)payment.innerHTML='<span class="status-chip">ACEITE RECEBIDO</span><h3>Agora vem a conferência final.</h3><p>Se a condição for confirmada, a cobrança identificada da adesão será enviada pelo contato informado. Nenhum pagamento é feito automaticamente por esta página.</p>';
  }catch(error){setFeedback(friendlyError(error),'error')}
  finally{submit.disabled=false;submit.textContent=original}
});
