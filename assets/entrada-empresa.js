const pricing={
  Essencial:{monthly:79,initial:237,future:158},
  Ativo:{monthly:99,initial:297,future:198},
  Estruturado:{monthly:139,initial:417,future:278},
  Integrado:{monthly:179,initial:537,future:358},
  Expandido:{monthly:229,initial:687,future:458}
};

const money=value=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(value);
const params=new URLSearchParams(location.search);
const requestedBand=params.get('faixa')||'';
const requestedType=params.get('tipo')==='futuro'?'futuro':params.get('tipo')==='inicial'?'inicial':'';
const validCondition=Boolean(pricing[requestedBand]&&requestedType);
const condition=validCondition?{
  band:requestedBand,
  type:requestedType,
  monthly:pricing[requestedBand].monthly,
  adhesion:requestedType==='inicial'?pricing[requestedBand].initial:pricing[requestedBand].future
}:null;

let config={};
const tokens={acceptance:'',onboarding:''};
const widgetIds={acceptance:null,onboarding:null};
let turnstileReady=Promise.resolve();

try{const response=await fetch('/api/public-config',{cache:'no-store'});if(response.ok)config=await response.json()}catch{}
if(config.turnstileRequired&&config.turnstileSiteKey){
  turnstileReady=new Promise(resolve=>{
    if(window.turnstile){resolve();return}
    const script=document.createElement('script');
    script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async=true;script.defer=true;script.onload=resolve;script.onerror=resolve;document.head.appendChild(script);
  });
}

function clean(value){return String(value||'').trim()}
function setFeedback(id,text,type=''){
  const el=document.querySelector(id);if(!el)return;
  el.textContent=text;el.className=`entry-feedback ${type}`.trim();
}
function setProgress(stage,{completeBefore=true}={}){
  document.querySelectorAll('[data-progress-stage]').forEach(item=>{
    const n=Number(item.dataset.progressStage);
    item.classList.toggle('active',n===stage);
    item.classList.toggle('complete',completeBefore&&n<stage);
  });
}
async function ensureTurnstile(kind){
  if(!config.turnstileRequired||!config.turnstileSiteKey||widgetIds[kind]!==null)return;
  await turnstileReady;
  if(!window.turnstile)return;
  const target=document.querySelector(`#${kind}-turnstile`);if(!target)return;
  widgetIds[kind]=window.turnstile.render(target,{
    sitekey:config.turnstileSiteKey,
    callback:token=>{tokens[kind]=token},
    'expired-callback':()=>{tokens[kind]=''},
    'error-callback':()=>{tokens[kind]=''}
  });
}
function resetTurnstile(kind){
  tokens[kind]='';
  if(window.turnstile&&widgetIds[kind]!==null)window.turnstile.reset(widgetIds[kind]);
}
async function sendContact({kind,name,email,subject,message,website=''}){
  if(config.contactFormEnabled===false)throw new Error('CONTACT_DISABLED');
  if(config.turnstileRequired&&!tokens[kind])throw new Error('TURNSTILE_REQUIRED');
  const response=await fetch('/api/contact',{
    method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({name,email,subject,message,website,consent:true,turnstileToken:tokens[kind]})
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.error||'SEND_FAILED');
  return data;
}
function friendlyError(error){
  if(error.message==='TURNSTILE_REQUIRED'||error.message==='ANTIABUSE_REJECTED')return 'Conclua a verificação de segurança antes de enviar.';
  if(error.message==='CONTACT_DISABLED'||error.message==='CONTACT_NOT_CONFIGURED')return 'O canal de envio está temporariamente indisponível.';
  if(error.message==='RATE_LIMITED')return 'Muitas tentativas em pouco tempo. Tente novamente mais tarde.';
  return 'Não foi possível enviar agora. Tente novamente em alguns minutos.';
}

function renderCondition(){
  if(!condition){setProgress(1,{completeBefore:false});return}
  const card=document.querySelector('#condition-card');
  const locked=document.querySelector('#acceptance-locked');
  const fields=document.querySelector('#acceptance-fields');
  const selected=document.querySelector('#selected-condition');
  const isInitial=condition.type==='inicial';
  const recurring=isInitial?'Mensalidade recorrente de R$ 0 na condição inicial confirmada':`${money(condition.monthly)}/mês a partir do 3º mês, se decidir continuar`;
  card?.classList.add('ready');
  if(card)card.innerHTML=`
    <span class="status-chip">REFERÊNCIA CARREGADA</span>
    <h3>Faixa ${condition.band}</h3>
    <div class="condition-summary"><small>Adesão de referência</small><strong>${money(condition.adhesion)}</strong><span>${isInitial?'Condição para entrada entre os 54 iniciais':'Condição para entrada depois dos 54'}</span></div>
    <div class="condition-meta"><div><small>Mensalidade de referência</small><strong>${money(condition.monthly)}/mês</strong></div><div><small>Depois da entrada</small><strong>${isInitial?'Recorrência R$ 0':'2 meses incluídos'}</strong></div></div>
    <p class="condition-note">${recurring}. A referência ainda precisa ser confirmada pelo Uai Perto antes de qualquer cobrança.</p>`;
  if(locked)locked.hidden=true;
  if(fields)fields.hidden=false;
  if(selected)selected.innerHTML=`<small>Condição que você está pedindo para confirmar</small><strong>${condition.band} · adesão ${money(condition.adhesion)}</strong><span>${recurring}</span>`;
  setProgress(3);
  ensureTurnstile('acceptance');
}
renderCondition();

const acceptanceForm=document.querySelector('#acceptance-form');
acceptanceForm?.addEventListener('submit',async event=>{
  event.preventDefault();
  if(!condition)return;
  setFeedback('#acceptance-feedback','');
  if(!acceptanceForm.checkValidity()){acceptanceForm.reportValidity();setFeedback('#acceptance-feedback','Revise os campos antes de continuar.','error');return}
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
    `Faixa solicitada: ${condition.band}`,
    `Mensalidade de referência: ${money(condition.monthly)}/mês`,
    `Tipo de entrada: ${isInitial?'Entre os 54 iniciais':'Depois dos 54'}`,
    `Adesão de referência: ${money(condition.adhesion)}`,
    `Recorrência: ${isInitial?'R$ 0 na condição inicial confirmada':'dois primeiros meses incluídos; mensalidade a partir do terceiro mês se continuar'}`,'',
    'Declarações marcadas pelo responsável:',
    '- Já apresentou a empresa e confirma os dados operacionais enviados.',
    '- Entende que a simulação não reserva vaga e não gera cobrança automática.',
    '- Quer receber a condição definitiva e, se confirmada, a cobrança identificada.',
    '- Concorda com o uso dos dados para conduzir a entrada.'
  ].join('\n');
  try{
    await sendContact({kind:'acceptance',name:`${name} — ${company}`,email,subject:'Aceite de condição — empresa',message,website:acceptanceForm.elements.website?.value||''});
    try{localStorage.setItem('uai-company-entry-draft',JSON.stringify({company,name,email,whatsapp}))}catch{}
    setFeedback('#acceptance-feedback','Aceite enviado. Agora o Uai Perto confere a condição e envia a cobrança identificada pelo contato informado.','success');
    const payment=document.querySelector('#payment-card');
    payment?.classList.add('ready');
    if(payment)payment.innerHTML=`<span class="status-chip">ACEITE ENVIADO</span><h3>Agora aguarde a cobrança identificada.</h3><p>Se a condição for confirmada, o Uai Perto enviará a cobrança de adesão pelo contato informado.</p><div class="condition-summary"><small>Valor que deve aparecer na cobrança confirmada</small><strong>${money(condition.adhesion)}</strong><span>Faixa ${condition.band} · ${isInitial?'entrada inicial':'entrada futura'}</span></div><div class="safety-note"><strong>Não pague valor diferente sem confirmar.</strong><span>O pagamento ainda é conciliado manualmente nesta fase.</span></div>`;
    setProgress(4);
    payment?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});
  }catch(error){setFeedback('#acceptance-feedback',friendlyError(error),'error');resetTurnstile('acceptance')}
  finally{submit.disabled=false;submit.textContent=original}
});

const onboardingGate=document.querySelector('#onboarding-gate');
const onboardingForm=document.querySelector('#onboarding-form');
function prefillOnboarding(){
  try{
    const saved=JSON.parse(localStorage.getItem('uai-company-entry-draft')||'{}');
    if(saved.company&&!onboardingForm.elements.company.value)onboardingForm.elements.company.value=saved.company;
    if(saved.name&&!onboardingForm.elements.name.value)onboardingForm.elements.name.value=saved.name;
    if(saved.email&&!onboardingForm.elements.email.value)onboardingForm.elements.email.value=saved.email;
    if(saved.whatsapp&&!onboardingForm.elements.whatsapp.value)onboardingForm.elements.whatsapp.value=saved.whatsapp;
  }catch{}
}
function openOnboarding({scroll=true}={}){
  if(!onboardingForm)return;
  onboardingGate.hidden=true;onboardingForm.hidden=false;prefillOnboarding();ensureTurnstile('onboarding');setProgress(5);
  if(scroll)onboardingForm.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'start'});
}
document.querySelector('#open-onboarding')?.addEventListener('click',()=>openOnboarding());
if(params.get('etapa')==='onboarding')openOnboarding({scroll:false});

function checkedValues(form,name){return [...form.querySelectorAll(`input[name="${name}"]:checked`)].map(el=>el.value)}
onboardingForm?.addEventListener('submit',async event=>{
  event.preventDefault();setFeedback('#onboarding-feedback','');
  const channels=checkedValues(onboardingForm,'channels');
  if(!onboardingForm.checkValidity()||channels.length===0){onboardingForm.reportValidity();setFeedback('#onboarding-feedback',channels.length?'Revise os campos antes de enviar.':'Escolha pelo menos uma forma de atendimento.','error');return}
  const submit=document.querySelector('#onboarding-submit');const original=submit.textContent;submit.disabled=true;submit.textContent='Enviando…';
  const f=onboardingForm.elements;
  const company=clean(f.company.value),name=clean(f.name.value),email=clean(f.email.value),whatsapp=clean(f.whatsapp.value);
  const message=[
    'ONBOARDING OPERACIONAL — EMPRESA','',
    `Empresa: ${company}`,
    `Responsável pelas oportunidades: ${name}`,
    `E-mail: ${email}`,
    `WhatsApp operacional: ${whatsapp}`,
    `Pedido ideal: ${clean(f.ideal.value)}`,
    `Pedidos que parecem encaixar mas devem ser evitados: ${clean(f.avoid.value)}`,
    `Área de atendimento: ${clean(f.coverage.value)}`,
    `Bairros/regiões/limites: ${clean(f.coverageDetail.value)}`,
    `Janelas normais de atendimento: ${clean(f.hours.value)}`,
    `Capacidade simultânea: ${clean(f.capacity.value)}`,
    `Tempo de resposta quando há interesse: ${clean(f.response.value)}`,
    `Formas de atendimento: ${channels.join('; ')}`,
    `Entrega/logística: ${clean(f.logistics.value)}`,
    `Formação de preço: ${clean(f.priceMode.value)}`,
    `Formas de pagamento aceitas: ${clean(f.payment.value)}`,
    `Limites adicionais: ${clean(f.constraints.value)||'Não informou'}`,'',
    'A empresa confirmou que as informações representam sua capacidade atual e autorizou o uso operacional para qualificação de oportunidades.'
  ].join('\n');
  try{
    await sendContact({kind:'onboarding',name:`${name} — ${company}`,email,subject:'Onboarding operacional — empresa',message,website:f.website?.value||''});
    setFeedback('#onboarding-feedback','Configuração enviada. O Uai Perto agora tem uma base operacional melhor para evitar oportunidades incompatíveis.','success');
    onboardingForm.querySelectorAll('input,select,textarea,button').forEach(el=>{if(el.type!=='button')el.disabled=true});
    document.querySelectorAll('[data-progress-stage]').forEach(item=>{item.classList.remove('active');item.classList.add('complete')});
  }catch(error){setFeedback('#onboarding-feedback',friendlyError(error),'error');resetTurnstile('onboarding')}
  finally{submit.disabled=false;submit.textContent=original}
});
