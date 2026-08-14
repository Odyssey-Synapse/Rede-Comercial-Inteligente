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
let onboardingCompleted=false;
const tokens={acceptance:'',onboarding:''};
const widgetIds={acceptance:null,onboarding:null};
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
function setFeedback(kind,text,type=''){
  const el=document.querySelector(kind==='acceptance'?'#acceptance-feedback':'#onboarding-feedback');if(!el)return;
  el.textContent=text;el.className=`entry-feedback ${type}`.trim();
}
function setProgress(stage,{completeBefore=true}={}){
  document.querySelectorAll('[data-progress-stage]').forEach(item=>{
    const n=Number(item.dataset.progressStage);
    item.classList.toggle('active',n===stage);
    item.classList.toggle('complete',completeBefore&&n<stage);
  });
}
function waitForTurnstileToken(kind,timeoutMs=8000){
  if(tokens[kind])return Promise.resolve(true);
  return new Promise(resolve=>{
    const started=Date.now();
    const timer=setInterval(()=>{
      if(tokens[kind]){clearInterval(timer);resolve(true);return}
      if(Date.now()-started>=timeoutMs){clearInterval(timer);resolve(false)}
    },120);
  });
}
async function ensureTurnstile(kind){
  if(!config.turnstileRequired)return true;
  if(!config.turnstileSiteKey){setFeedback(kind,'A verificação de segurança está temporariamente indisponível.','error');return false}
  if(widgetIds[kind]!==null)return true;
  const loaded=await turnstileReady;
  const target=document.querySelector(`#${kind}-turnstile`);
  if(!loaded||turnstileLoadFailed||!target||!window.turnstile){setFeedback(kind,'Não foi possível carregar a verificação de segurança. Atualize a página e tente novamente.','error');return false}
  try{
    widgetIds[kind]=window.turnstile.render(target,{
      sitekey:config.turnstileSiteKey,
      theme:'auto',appearance:'always',retry:'auto','refresh-expired':'auto',
      callback:value=>{tokens[kind]=value;if(document.querySelector(kind==='acceptance'?'#acceptance-feedback':'#onboarding-feedback')?.textContent?.toLowerCase().includes('verificação de segurança'))setFeedback(kind,'')},
      'expired-callback':()=>{tokens[kind]=''},
      'error-callback':code=>{tokens[kind]='';setFeedback(kind,`Não foi possível concluir a verificação de segurança${code?` (${code})`:''}. Atualize a página e tente novamente.`,'error')}
    });
    return true;
  }catch{setFeedback(kind,'Não foi possível iniciar a verificação de segurança. Atualize a página e tente novamente.','error');return false}
}
function resetTurnstile(kind){
  tokens[kind]='';
  if(window.turnstile&&widgetIds[kind]!==null)window.turnstile.reset(widgetIds[kind]);
}
async function sendContact({kind,name,email,subject,message,website=''}){
  if(config.contactFormEnabled===false)throw new Error('CONTACT_DISABLED');
  if(config.turnstileRequired&&!tokens[kind]){
    const ready=await ensureTurnstile(kind);if(!ready)throw new Error('TURNSTILE_LOAD_FAILED');
    setFeedback(kind,'Concluindo a verificação de segurança…');
    const verified=await waitForTurnstileToken(kind);if(!verified)throw new Error('TURNSTILE_NOT_READY');
    setFeedback(kind,'');
  }
  const response=await fetch('/api/contact',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name,email,subject,message,website,consent:true,turnstileToken:tokens[kind]})});
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
  ensureTurnstile('acceptance');
}
renderCondition();

const acceptanceForm=document.querySelector('#acceptance-form');
acceptanceForm?.addEventListener('submit',async event=>{
  event.preventDefault();
  if(!condition||acceptanceCompleted)return;
  setFeedback('acceptance','');
  if(!acceptanceForm.checkValidity()){acceptanceForm.reportValidity();setFeedback('acceptance','Revise os campos antes de continuar.','error');return}
  const submit=document.querySelector('#acceptance-submit');
  const original=submit.textContent;submit.disabled=true;submit.textContent='Enviando…';
  const company=clean(acceptanceForm.elements.company.value);
  const name=clean(acceptanceForm.elements.name.value);
  const email=clean(acceptanceForm.elements.email.value);
  const whatsapp=clean(acceptanceForm.elements.whatsapp.value);
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
    await sendContact({kind:'acceptance',name:`${name} — ${company}`,email,subject:'Aceite de condição — empresa',message,website:acceptanceForm.elements.website?.value||''});
    acceptanceCompleted=true;
    try{localStorage.setItem('uai-company-entry-draft',JSON.stringify({company,name,email,whatsapp,model:condition.model}))}catch{}
    setFeedback('acceptance','Aceite enviado. O Uai Perto ainda confirma o enquadramento antes de enviar qualquer cobrança.','success');
    setProgress(4);
    const payment=document.querySelector('#payment-card');
    if(payment)payment.innerHTML='<span class="status-chip">ACEITE RECEBIDO</span><h3>Agora vem a conferência final.</h3><p>Se a condição for confirmada, a cobrança identificada da adesão será enviada pelo contato informado. Nenhum pagamento é feito automaticamente por esta página.</p>';
  }catch(error){if(String(error?.message||'').startsWith('TURNSTILE_')||error?.message==='ANTIABUSE_REJECTED')resetTurnstile('acceptance');setFeedback('acceptance',friendlyError(error),'error')}
  finally{submit.disabled=false;submit.textContent=original}
});

const onboardingGate=document.querySelector('#onboarding-gate');
const onboardingForm=document.querySelector('#onboarding-form');
const onboardingModel=document.querySelector('#onboard-model');
const productBlock=document.querySelector('#onboarding-product-block');
const serviceBlock=document.querySelector('#onboarding-service-block');

function setModelBlock(block,active){
  if(!block)return;
  block.hidden=!active;
  block.querySelectorAll('input,select,textarea').forEach(field=>{
    field.disabled=!active;
    if(field.dataset.modelRequired==='true')field.required=active;
  });
}
function syncOnboardingModel(){
  const model=onboardingModel?.value||'';
  setModelBlock(productBlock,model==='catalogo'||model==='ambos');
  setModelBlock(serviceBlock,model==='servico'||model==='ambos');
}
function prefillOnboarding(){
  let draft={};
  try{draft=JSON.parse(localStorage.getItem('uai-company-entry-draft')||'{}')}catch{}
  if(onboardingForm){
    if(draft.company&&!onboardingForm.elements.company.value)onboardingForm.elements.company.value=draft.company;
    if(draft.name&&!onboardingForm.elements.name.value)onboardingForm.elements.name.value=draft.name;
    if(draft.email&&!onboardingForm.elements.email.value)onboardingForm.elements.email.value=draft.email;
    if(draft.whatsapp&&!onboardingForm.elements.whatsapp.value)onboardingForm.elements.whatsapp.value=draft.whatsapp;
  }
  const model=condition?.model||(pricing[requestedModel]?requestedModel:'')||draft.model||'';
  if(onboardingModel&&model)onboardingModel.value=model;
  syncOnboardingModel();
}
onboardingModel?.addEventListener('change',syncOnboardingModel);
prefillOnboarding();

document.querySelector('#open-onboarding')?.addEventListener('click',()=>{
  if(!onboardingForm)return;
  onboardingForm.hidden=false;
  onboardingGate?.classList.add('ready');
  prefillOnboarding();
  setProgress(5);
  ensureTurnstile('onboarding');
  onboardingForm.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
});

onboardingForm?.addEventListener('submit',async event=>{
  event.preventDefault();
  if(onboardingCompleted)return;
  setFeedback('onboarding','');
  syncOnboardingModel();
  if(!onboardingForm.checkValidity()){onboardingForm.reportValidity();setFeedback('onboarding','Revise os campos da implantação antes de enviar.','error');return}
  const model=onboardingModel.value;
  if(!pricing[model]){setFeedback('onboarding','Selecione Catálogo, Serviço ou Serviço + Catálogo.','error');return}

  const submit=document.querySelector('#onboarding-submit');
  const original=submit.textContent;submit.disabled=true;submit.textContent='Enviando…';
  const company=clean(onboardingForm.elements.company.value);
  const name=clean(onboardingForm.elements.name.value);
  const email=clean(onboardingForm.elements.email.value);
  const whatsapp=clean(onboardingForm.elements.whatsapp.value);
  const lines=[
    'IMPLANTAÇÃO OPERACIONAL — EMPRESA','',
    `Empresa: ${company}`,
    `Responsável: ${name}`,
    `E-mail: ${email}`,
    `WhatsApp operacional: ${whatsapp}`,
    `Papel na Rede: ${pricing[model].label}`
  ];
  if(model==='catalogo'||model==='ambos')lines.push(
    '', 'CATÁLOGO',
    `Fonte de catálogo/preço/estoque: ${clean(onboardingForm.elements.catalogSource.value)}`,
    `Sistema/ERP: ${clean(onboardingForm.elements.system.value)||'Não informou'}`,
    `Retirada: ${clean(onboardingForm.elements.pickup.value)}`,
    `Entrega própria: ${clean(onboardingForm.elements.ownDelivery.value)}`,
    `Coleta pelo Resolva Aí: ${clean(onboardingForm.elements.resolvaCollection.value)}`,
    `Tempo de separação: ${clean(onboardingForm.elements.prepTime.value)}`,
    `Ponto de retirada/coleta: ${clean(onboardingForm.elements.pickupPoint.value)}`
  );
  if(model==='servico'||model==='ambos')lines.push(
    '', 'SERVIÇO',
    `Pedido ideal: ${clean(onboardingForm.elements.ideal.value)}`,
    `Pedido a evitar: ${clean(onboardingForm.elements.avoid.value)}`,
    `Área de atendimento: ${clean(onboardingForm.elements.coverage.value)}`,
    `Capacidade simultânea: ${clean(onboardingForm.elements.capacity.value)}`,
    `Horários/disponibilidade: ${clean(onboardingForm.elements.hours.value)}`,
    `Limites importantes: ${clean(onboardingForm.elements.limits.value)}`
  );
  lines.push('',`Troca de informações no início: ${clean(onboardingForm.elements.integration.value)}`,'','Declarações: pagamento confirmado pelo Uai Perto; dados representam a operação atual.');

  try{
    await sendContact({kind:'onboarding',name:`${name} — ${company}`,email,subject:'Implantação operacional — empresa',message:lines.join('\n'),website:onboardingForm.elements.website?.value||''});
    onboardingCompleted=true;
    setFeedback('onboarding','Implantação enviada. Agora o Uai Perto pode configurar o início da operação com base no papel informado.','success');
    submit.textContent='Implantação enviada';
  }catch(error){if(String(error?.message||'').startsWith('TURNSTILE_')||error?.message==='ANTIABUSE_REJECTED')resetTurnstile('onboarding');setFeedback('onboarding',friendlyError(error),'error');submit.disabled=false;submit.textContent=original;return}
  submit.disabled=true;
});
