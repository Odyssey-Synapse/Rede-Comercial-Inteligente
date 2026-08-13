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
function setFeedback(id,text,type=''){
  const el=document.querySelector(id);if(!el)return;
  el.textContent=text;el.className=`entry-feedback ${type}`.trim();
}
function feedbackId(kind){return kind==='acceptance'?'#acceptance-feedback':'#onboarding-feedback'}
function setTurnstileFeedback(kind,text,type='error'){setFeedback(feedbackId(kind),text,type)}
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
  if(!config.turnstileSiteKey){setTurnstileFeedback(kind,'A verificação de segurança está temporariamente indisponível.');return false}
  if(widgetIds[kind]!==null)return true;
  const loaded=await turnstileReady;
  if(!loaded||turnstileLoadFailed||!window.turnstile){setTurnstileFeedback(kind,'Não foi possível carregar a verificação de segurança. Atualize a página e tente novamente.');return false}
  const target=document.querySelector(`#${kind}-turnstile`);if(!target)return false;
  try{
    widgetIds[kind]=window.turnstile.render(target,{
      sitekey:config.turnstileSiteKey,
      theme:'auto',
      appearance:'always',
      retry:'auto',
      'refresh-expired':'auto',
      callback:token=>{
        tokens[kind]=token;
        const el=document.querySelector(feedbackId(kind));
        if(el?.textContent?.toLowerCase().includes('verificação de segurança'))setTurnstileFeedback(kind,'','');
      },
      'expired-callback':()=>{tokens[kind]=''},
      'error-callback':code=>{tokens[kind]='';setTurnstileFeedback(kind,`Não foi possível concluir a verificação de segurança${code?` (${code})`:''}. Atualize a página e tente novamente.`)}
    });
    return true;
  }catch{
    setTurnstileFeedback(kind,'Não foi possível iniciar a verificação de segurança. Atualize a página e tente novamente.');
    return false;
  }
}
function resetTurnstile(kind){
  tokens[kind]='';
  if(window.turnstile&&widgetIds[kind]!==null)window.turnstile.reset(widgetIds[kind]);
}
async function sendContact({kind,name,email,subject,message,website=''}){
  if(config.contactFormEnabled===false)throw new Error('CONTACT_DISABLED');
  if(config.turnstileRequired&&!tokens[kind]){
    const ready=await ensureTurnstile(kind);
    if(!ready)throw new Error('TURNSTILE_LOAD_FAILED');
    setTurnstileFeedback(kind,'Concluindo a verificação de segurança…','');
    const verified=await waitForTurnstileToken(kind);
    if(!verified)throw new Error('TURNSTILE_NOT_READY');
    setTurnstileFeedback(kind,'','');
  }
  const response=await fetch('/api/contact',{
    method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({name,email,subject,message,website,consent:true,turnstileToken:tokens[kind]})
  });
  const data=await response.json().catch(()=>({}));
  if(!response.ok)throw new Error(data.error||'SEND_FAILED');
  return data;
}
function isTurnstileError(error){return error?.message==='ANTIABUSE_REJECTED'||String(error?.message||'').startsWith('TURNSTILE_')}
function friendlyError(error){
  if(error.message==='TURNSTILE_LOAD_FAILED')return 'Não foi possível carregar a verificação de segurança. Atualize a página e tente novamente.';
  if(error.message==='TURNSTILE_NOT_READY'||error.message==='TURNSTILE_REQUIRED')return 'A verificação de segurança não concluiu. Atualize a página e tente novamente.';
  if(isTurnstileError(error))return 'A verificação de segurança precisa ser refeita. Atualize a página e tente novamente.';
  if(error.message==='CONTACT_DISABLED'||error.message==='CONTACT_NOT_CONFIGURED')return 'O canal de envio está temporariamente indisponível.';
  if(error.message==='RATE_LIMITED')return 'Muitas tentativas em pouco tempo. Tente novamente mais tarde.';
  return 'Não foi possível enviar agora. Tente novamente em alguns minutos.';
}

function installOnboardingTutorial(){
  const section=document.querySelector('#onboarding');
  const copy=section?.querySelector('.entry-copy');
  const form=document.querySelector('#onboarding-form');
  if(!section||!copy||!form||copy.querySelector('.onboarding-tutorial'))return;

  const style=document.createElement('style');
  style.textContent=`
    #onboarding .entry-copy{position:sticky;top:96px}
    .onboarding-tutorial{margin-top:24px;padding:20px;border:1px solid var(--line);border-radius:20px;background:linear-gradient(145deg,var(--surface),color-mix(in srgb,var(--green-soft) 50%,var(--surface)));box-shadow:0 12px 30px rgba(51,87,73,.06)}
    .onboarding-tutorial h3{margin:10px 0 6px;font-size:1.2rem}.onboarding-tutorial>p{margin:0 0 16px;color:var(--muted);font-size:.92rem}
    .tutorial-example{display:grid;gap:9px;margin:0}.tutorial-example div{padding:10px 11px;border:1px solid var(--line);border-radius:12px;background:var(--surface)}
    .tutorial-example dt{font-size:.7rem;font-weight:850;text-transform:uppercase;letter-spacing:.04em;color:#B55A30}.tutorial-example dd{margin:3px 0 0;color:var(--ink);font-size:.87rem;line-height:1.42}
    .tutorial-note{margin-top:14px!important;padding:12px;border-left:3px solid #D39237;border-radius:0 10px 10px 0;background:var(--surface-2);font-weight:700;color:var(--ink)!important}
    #acceptance-turnstile,#onboarding-turnstile{min-height:68px;display:flex;align-items:center;justify-content:flex-start;overflow:visible}
    @media(max-width:980px){#onboarding .entry-copy{position:static}.tutorial-example{grid-template-columns:repeat(2,minmax(0,1fr))}}
    @media(max-width:700px){.tutorial-example{grid-template-columns:1fr}#acceptance-turnstile,#onboarding-turnstile{justify-content:center}}
  `;
  document.head.appendChild(style);

  const tutorial=document.createElement('aside');
  tutorial.className='onboarding-tutorial';
  tutorial.setAttribute('aria-label','Exemplo de preenchimento do onboarding');
  tutorial.innerHTML=`
    <span class="status-chip">EXEMPLO FICTÍCIO</span>
    <h3>Como preencher: Clima Triângulo</h3>
    <p>Use este caso apenas como modelo de raciocínio. No formulário, descreva a realidade da sua empresa.</p>
    <dl class="tutorial-example">
      <div><dt>Pedido muito bom</dt><dd>Instalação ou manutenção de ar-condicionado split em residência ou pequeno comércio.</dd></div>
      <div><dt>Evitar</dt><dd>Refrigeração industrial, elétrica geral e equipamento que dependa de peça especial sem consulta.</dd></div>
      <div><dt>Área</dt><dd>Toda Uberaba; fora do perímetro urbano somente sob consulta.</dd></div>
      <div><dt>Horário</dt><dd>Seg–sex 8h–18h e sábado 8h–12h. Urgências dependem da agenda.</dd></div>
      <div><dt>Capacidade</dt><dd>3–5 atendimentos simultâneos em um dia normal.</dd></div>
      <div><dt>Resposta</dt><dd>Quando interessa, responde em até 1 hora.</dd></div>
      <div><dt>Atendimento</dt><dd>No endereço do cliente. Entrega não é a atividade principal.</dd></div>
      <div><dt>Preço</dt><dd>Orçamento após entender o pedido. Pix e cartão; parcelamento sob consulta.</dd></div>
      <div><dt>Limites</dt><dd>Grande altura exige avaliação; algumas peças dependem de fornecedor.</dd></div>
    </dl>
    <p class="tutorial-note">Ensine ao Uai Perto quando chamar sua empresa — e também quando não chamar.</p>`;
  copy.appendChild(tutorial);

  const placeholders={
    company:'Ex.: Clima Triângulo',
    name:'Ex.: Carlos Almeida',
    email:'Ex.: atendimento@empresa.com.br',
    whatsapp:'Ex.: (34) 9....-....',
    ideal:'Ex.: instalação ou manutenção de ar-condicionado split em residência ou pequeno comércio.',
    avoid:'Ex.: refrigeração industrial, elétrica geral ou equipamento que dependa de peça especial sem consulta.',
    coverageDetail:'Ex.: toda Uberaba; fora do perímetro urbano somente sob consulta.',
    hours:'Ex.: seg–sex 8h–18h; sábado 8h–12h; urgências dependem da agenda.',
    payment:'Ex.: Pix e cartão; parcelamento sob consulta.',
    constraints:'Ex.: grande altura exige avaliação; algumas peças dependem de fornecedor.'
  };
  Object.entries(placeholders).forEach(([name,value])=>{const field=form.elements[name];if(field)field.placeholder=value});
}
installOnboardingTutorial();

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
  if(!condition||acceptanceCompleted)return;
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
    acceptanceCompleted=true;
    try{localStorage.setItem('uai-company-entry-draft',JSON.stringify({company,name,email,whatsapp}))}catch{}
    setFeedback('#acceptance-feedback','Aceite enviado. Agora o Uai Perto confere a condição e envia a cobrança identificada pelo contato informado.','success');
    acceptanceForm.querySelectorAll('input,select,textarea').forEach(el=>{el.disabled=true});
    submit.textContent='Aceite enviado';
    const payment=document.querySelector('#payment-card');
    payment?.classList.add('ready');
    if(payment)payment.innerHTML=`<span class="status-chip">ACEITE ENVIADO</span><h3>Agora aguarde a cobrança identificada.</h3><p>Se a condição for confirmada, o Uai Perto enviará a cobrança de adesão pelo contato informado.</p><div class="condition-summary"><small>Valor que deve aparecer na cobrança confirmada</small><strong>${money(condition.adhesion)}</strong><span>Faixa ${condition.band} · ${isInitial?'entrada inicial':'entrada futura'}</span></div><div class="safety-note"><strong>Não pague valor diferente sem confirmar.</strong><span>O pagamento ainda é conciliado manualmente nesta fase.</span></div>`;
    setProgress(4);
    payment?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});
  }catch(error){setFeedback('#acceptance-feedback',friendlyError(error),'error');if(isTurnstileError(error))resetTurnstile('acceptance')}
  finally{if(!acceptanceCompleted){submit.disabled=false;submit.textContent=original}}
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
  event.preventDefault();
  if(onboardingCompleted)return;
  setFeedback('#onboarding-feedback','');
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
    onboardingCompleted=true;
    setFeedback('#onboarding-feedback','Configuração enviada. O Uai Perto agora tem uma base operacional melhor para evitar oportunidades incompatíveis.','success');
    onboardingForm.querySelectorAll('input,select,textarea').forEach(el=>{el.disabled=true});
    submit.textContent='Onboarding enviado';
    document.querySelectorAll('[data-progress-stage]').forEach(item=>{item.classList.remove('active');item.classList.add('complete')});
  }catch(error){setFeedback('#onboarding-feedback',friendlyError(error),'error');if(isTurnstileError(error))resetTurnstile('onboarding')}
  finally{if(!onboardingCompleted){submit.disabled=false;submit.textContent=original}}
});