const profileButtons=[...document.querySelectorAll("[data-profile-target]")];
const panels={consumidor:document.querySelector("#consumer-panel"),empresa:document.querySelector("#company-panel")};
const forms={consumidor:document.querySelector("#consumer-form"),empresa:document.querySelector("#company-form")};
const feedbacks={consumidor:document.querySelector("#consumer-feedback"),empresa:document.querySelector("#company-feedback")};
const submitButtons={consumidor:document.querySelector("#consumer-submit"),empresa:document.querySelector("#company-submit")};
const tokens={consumidor:"",empresa:""};
const widgetIds={consumidor:null,empresa:null};
let config={};

try{const response=await fetch("/api/public-config",{cache:"no-store"});if(response.ok)config=await response.json()}catch{}

let turnstileLoadFailed=false;
let turnstileReady=null;
function loadTurnstile(){
  if(window.turnstile){turnstileLoadFailed=false;return Promise.resolve(true)}
  if(turnstileReady)return turnstileReady;
  turnstileReady=new Promise(resolve=>{
    const script=document.createElement("script");
    script.src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async=true;script.defer=true;
    script.onload=()=>{turnstileLoadFailed=false;turnstileReady=null;resolve(true)};
    script.onerror=()=>{turnstileLoadFailed=true;turnstileReady=null;script.remove();resolve(false)};
    document.head.appendChild(script);
  });
  return turnstileReady;
}

function setFeedback(profile,text,type=""){const el=feedbacks[profile];if(!el)return;el.textContent=text;el.className=`participation-feedback ${type}`.trim()}
function setSuccess(profile,html){const el=feedbacks[profile];if(!el)return;el.innerHTML=html;el.className="participation-feedback success"}
function collectionBlockedMessage(){return config.privacyPolicyApproved===false?"O envio está temporariamente fechado enquanto a política de privacidade não está liberada para coleta.":"O envio pelo site está temporariamente indisponível."}
function applyCollectionGate(profile){
  const blocked=config.contactFormEnabled===false;
  if(submitButtons[profile])submitButtons[profile].disabled=blocked;
  if(blocked)setFeedback(profile,collectionBlockedMessage(),"error");
  return !blocked;
}
function waitForTurnstileToken(profile,timeoutMs=8000){
  if(tokens[profile])return Promise.resolve(true);
  return new Promise(resolve=>{
    const started=Date.now();
    const timer=setInterval(()=>{
      if(tokens[profile]){clearInterval(timer);resolve(true);return}
      if(Date.now()-started>=timeoutMs){clearInterval(timer);resolve(false)}
    },120);
  });
}
async function ensureTurnstile(profile){
  if(!config.turnstileRequired)return true;
  if(!config.turnstileSiteKey){setFeedback(profile,"A verificação de segurança está temporariamente indisponível.","error");return false}
  if(widgetIds[profile]!==null&&window.turnstile)return true;
  const loaded=await loadTurnstile();
  const target=document.querySelector(`#${profile}-turnstile`);
  if(!loaded||turnstileLoadFailed||!target||!window.turnstile){setFeedback(profile,"Não foi possível carregar a verificação de segurança. Verifique sua conexão e tente enviar novamente; os campos continuam preenchidos.","error");return false}
  try{
    widgetIds[profile]=window.turnstile.render(target,{
      sitekey:config.turnstileSiteKey,
      theme:"auto",
      appearance:"always",
      retry:"auto",
      "refresh-expired":"auto",
      callback:token=>{
        tokens[profile]=token;
        if(feedbacks[profile]?.textContent?.toLowerCase().includes("verificação de segurança"))setFeedback(profile,"");
      },
      "expired-callback":()=>{tokens[profile]=""},
      "error-callback":code=>{tokens[profile]="";setFeedback(profile,`Não foi possível concluir a verificação de segurança${code?` (${code})`:""}. Tente novamente; os campos continuam preenchidos.`,"error")}
    });
    return true;
  }catch{
    widgetIds[profile]=null;
    setFeedback(profile,"Não foi possível iniciar a verificação de segurança. Tente novamente; os campos continuam preenchidos.","error");
    return false;
  }
}
function activateProfile(profile,updateUrl=true){
  if(!panels[profile])return;
  profileButtons.forEach(button=>{const active=button.dataset.profileTarget===profile;button.classList.toggle("active",active);button.setAttribute("aria-pressed",String(active))});
  Object.entries(panels).forEach(([key,panel])=>{panel.hidden=key!==profile});
  if(updateUrl){const url=new URL(location.href);url.searchParams.set("perfil",profile);history.replaceState({},"",url)}
  if(applyCollectionGate(profile))ensureTurnstile(profile);
  panels[profile].scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"});
}
profileButtons.forEach(button=>button.addEventListener("click",()=>activateProfile(button.dataset.profileTarget)));
const requestedProfile=new URLSearchParams(location.search).get("perfil");if(requestedProfile&&panels[requestedProfile])activateProfile(requestedProfile,false);

function updateGroupCounter(group){const max=Number(group.dataset.max||0);const counter=group.querySelector("[data-choice-counter]");const count=group.querySelectorAll('input[type="checkbox"]:checked').length;if(counter&&max)counter.textContent=`${count}/${max} selecionados`}
function setupLimitedCheckboxGroup(group){
  const max=Number(group.dataset.max||0);const inputs=[...group.querySelectorAll('input[type="checkbox"]')];
  inputs.forEach(input=>input.addEventListener("change",()=>{
    const checked=inputs.filter(item=>item.checked);if(max&&checked.length>max){input.checked=false;updateGroupCounter(group);return}
    if(input.value==="Nenhuma limitação relevante"&&input.checked)inputs.filter(item=>item!==input).forEach(item=>{item.checked=false});
    if(input.value!=="Nenhuma limitação relevante"&&input.checked){const none=inputs.find(item=>item.value==="Nenhuma limitação relevante");if(none)none.checked=false}
    group.classList.remove("invalid");updateGroupCounter(group);
  }));
  updateGroupCounter(group);
}
function toggleContainer(container,active){
  if(!container)return;
  container.hidden=!active;
  container.querySelectorAll('input,select,textarea').forEach(field=>{
    field.disabled=!active;
    if(field.dataset.roleRequired==="true")field.required=active;
  });
}
function fieldValue(form,name){return cleanText(form.elements[name]?.value||"")}

function installCompanyRoleQuestion(){
  const form=forms.empresa;
  if(!form||form.querySelector('[data-company-role-section]'))return;
  const intro=form.querySelector('.survey-intro');
  const introTitle=intro?.querySelector('h2');
  const introText=intro?.querySelector('p');
  if(introTitle)introTitle.textContent='Mostre o que sua empresa consegue fornecer ou executar.';
  if(introText)introText.textContent='Primeiro diga se você coloca produtos, serviços ou os dois na Rede. Depois mostramos somente as perguntas que fazem sentido para esse papel.';

  const firstSection=form.querySelector('.survey-section');
  const roleSection=document.createElement('div');
  roleSection.className='survey-section';
  roleSection.dataset.companyRoleSection='true';
  roleSection.innerHTML=`
    <div class="survey-section-head"><span class="survey-number">0</span><div><h3>O que sua empresa coloca na Rede?</h3><p>Marque uma opção ou as duas. Isso define o papel operacional, não quantas categorias você pode informar.</p></div></div>
    <fieldset class="survey-question" data-checkbox-group data-required="true" data-company-role-group><legend>Como sua empresa pode participar?</legend><div class="choice-grid">
      <label class="choice-option"><input type="checkbox" name="companyRole" value="Produtos"><span>Vendo produtos</span></label>
      <label class="choice-option"><input type="checkbox" name="companyRole" value="Serviços"><span>Presto serviços</span></label>
    </div><span class="group-error">Marque Produtos, Serviços ou os dois.</span></fieldset>
    <p class="survey-help"><strong>Faz os dois?</strong> Marque os dois. Uma única empresa pode fornecer produtos e também executar serviços.</p>`;
  firstSection?.before(roleSection);

  const productSection=document.createElement('div');
  productSection.className='survey-section';
  productSection.dataset.companyProductSection='true';
  productSection.hidden=true;
  productSection.innerHTML=`
    <div class="survey-section-head"><span class="survey-number">P</span><div><h3>Como seus produtos entram numa solução?</h3><p>Queremos saber como consultar, separar e retirar um produto sem transformar sua equipe em operadora de um segundo sistema.</p></div></div>
    <div class="survey-grid">
      <div class="survey-field"><label for="company-catalog-source">Como seu catálogo/preço existe hoje?</label><select id="company-catalog-source" name="companyCatalogSource" data-role-required="true"><option value="">Selecione</option><option>Sistema ou ERP</option><option>Planilha ou arquivo</option><option>Cadastro simples/manual</option><option>Não temos catálogo estruturado</option><option>Ainda preciso avaliar</option></select></div>
      <div class="survey-field"><label for="company-system-name">Qual sistema ou ERP? <span class="survey-help">(opcional)</span></label><input id="company-system-name" name="companySystemName" maxlength="160" placeholder="Ex.: nome do sistema que a loja já usa"></div>
      <div class="survey-field"><label for="company-pickup">Retirada na loja está disponível?</label><select id="company-pickup" name="companyPickup" data-role-required="true"><option value="">Selecione</option><option>Sim, normalmente</option><option>Sim, com horário combinado</option><option>Depende do produto</option><option>Não</option></select></div>
      <div class="survey-field"><label for="company-own-delivery">A loja já faz entrega própria?</label><select id="company-own-delivery" name="companyOwnDelivery" data-role-required="true"><option value="">Selecione</option><option>Sim</option><option>Às vezes / depende da região</option><option>Não</option></select></div>
      <div class="survey-field"><label for="company-resolva-collection">Aceitaria coleta autorizada pelo Resolva Aí quando o produto fizer parte de uma solução da Rede?</label><select id="company-resolva-collection" name="companyResolvaCollection" data-role-required="true"><option value="">Selecione</option><option>Sim</option><option>Sim, mas preciso combinar o processo</option><option>Preciso entender melhor antes</option><option>Não neste momento</option></select></div>
      <div class="survey-field"><label for="company-prep-time">Depois de confirmado, quanto tempo costuma levar para separar um pedido?</label><select id="company-prep-time" name="companyPrepTime" data-role-required="true"><option value="">Selecione</option><option>Até 15 minutos</option><option>15–30 minutos</option><option>30–60 minutos</option><option>Algumas horas</option><option>Depende bastante do produto</option></select></div>
    </div>`;
  roleSection.after(productSection);

  const serviceSection=document.createElement('div');
  serviceSection.className='survey-section';
  serviceSection.dataset.companyServiceSection='true';
  serviceSection.hidden=true;
  serviceSection.innerHTML=`
    <div class="survey-section-head"><span class="survey-number">S</span><div><h3>Como sua capacidade de serviço funciona?</h3><p>Mais habilidades não significam mais mensalidades. Precisamos entender capacidade, limites e disponibilidade para não chamar você na hora errada.</p></div></div>
    <div class="survey-grid">
      <div class="survey-field"><label for="company-service-structure">Quem normalmente executa o serviço?</label><select id="company-service-structure" name="companyServiceStructure" data-role-required="true"><option value="">Selecione</option><option>Eu trabalho sozinho(a)</option><option>Uma equipe</option><option>Mais de uma equipe</option><option>Rede de profissionais/parceiros</option><option>Depende do serviço</option></select></div>
      <div class="survey-field"><label for="company-service-capacity">Quantos atendimentos consegue tocar ao mesmo tempo num dia normal?</label><select id="company-service-capacity" name="companyServiceCapacity" data-role-required="true"><option value="">Selecione</option><option>1 por vez</option><option>2 ao mesmo tempo</option><option>3–5 ao mesmo tempo</option><option>6 ou mais</option><option>Depende muito do tipo de serviço</option></select></div>
      <div class="survey-field full"><label for="company-service-ideal">Que tipo de pedido seria muito bom receber?</label><textarea id="company-service-ideal" name="companyServiceIdeal" minlength="8" maxlength="600" data-role-required="true" placeholder="Ex.: instalação e pequenos reparos elétricos residenciais em Uberaba."></textarea></div>
      <div class="survey-field full"><label for="company-service-avoid">Que pedido parece combinar, mas vocês normalmente não conseguem atender?</label><textarea id="company-service-avoid" name="companyServiceAvoid" minlength="5" maxlength="600" data-role-required="true" placeholder="Ex.: fazemos elétrica residencial, mas não executamos padrão de entrada."></textarea></div>
    </div>`;
  productSection.after(serviceSection);

  const roleGroup=roleSection.querySelector('[data-company-role-group]');
  if(roleGroup)setupLimitedCheckboxGroup(roleGroup);
  const requested=new URLSearchParams(location.search).get('modelo');
  const productInput=roleSection.querySelector('input[value="Produtos"]');
  const serviceInput=roleSection.querySelector('input[value="Serviços"]');
  if(requested==='catalogo'&&productInput)productInput.checked=true;
  if(requested==='servico'&&serviceInput)serviceInput.checked=true;
  if(requested==='ambos'){
    if(productInput)productInput.checked=true;
    if(serviceInput)serviceInput.checked=true;
  }

  const capability=document.querySelector('#company-capability');
  const capabilityLabel=capability?.closest('.survey-field')?.querySelector('label');
  const responseQuestion=form.querySelector('input[name="companyResponse"]')?.closest('fieldset');
  const tomorrowQuestion=form.querySelector('input[name="companyTomorrow"]')?.closest('fieldset');

  const syncRole=()=>{
    const roles=[...roleSection.querySelectorAll('input[name="companyRole"]:checked')].map(input=>input.value);
    const hasProducts=roles.includes('Produtos');
    const hasServices=roles.includes('Serviços');
    toggleContainer(productSection,hasProducts);
    toggleContainer(serviceSection,hasServices);
    toggleContainer(responseQuestion,hasServices);
    toggleContainer(tomorrowQuestion,hasServices);

    if(capability){
      if(hasProducts&&!hasServices){
        if(capabilityLabel)capabilityLabel.textContent='Em uma frase, o que sua empresa consegue fornecer?';
        capability.placeholder='Ex.: vendemos materiais elétricos para instalações e pequenos reparos residenciais.';
      }else if(hasProducts&&hasServices){
        if(capabilityLabel)capabilityLabel.textContent='Em uma frase, o que sua empresa consegue fornecer e executar?';
        capability.placeholder='Ex.: vendemos ar-condicionado e também fazemos instalação e manutenção.';
      }else{
        if(capabilityLabel)capabilityLabel.textContent='Em uma frase, o que sua empresa consegue resolver?';
        capability.placeholder='Ex.: instalamos e fazemos manutenção de ar-condicionado residencial e comercial.';
      }
    }
  };
  roleSection.querySelectorAll('input[name="companyRole"]').forEach(input=>input.addEventListener('change',syncRole));
  form.addEventListener('reset',()=>setTimeout(syncRole,0));
  syncRole();
}
installCompanyRoleQuestion();
document.querySelectorAll("[data-checkbox-group]").forEach(group=>{if(!group.dataset.checkboxReady){setupLimitedCheckboxGroup(group);group.dataset.checkboxReady='true'}});

function groupValues(form,name){return [...form.querySelectorAll(`input[name="${name}"]:checked`)].map(input=>input.value)}
function radioValue(form,name){return form.querySelector(`input[name="${name}"]:checked`)?.value||""}
function cleanText(value){return String(value||"").trim()}
function validateGroups(form){let ok=true;form.querySelectorAll('[data-checkbox-group][data-required="true"]').forEach(group=>{if(group.hidden||group.closest('[hidden]'))return;const enabled=[...group.querySelectorAll('input[type="checkbox"]')].filter(input=>!input.disabled);const hasChecked=enabled.some(input=>input.checked);group.classList.toggle("invalid",!hasChecked);if(!hasChecked)ok=false});return ok}

const consumerForm=forms.consumidor;
const consumerContactFields=document.querySelector("#consumer-contact-fields");
const consumerContactType=document.querySelector("#consumer-contact-type");
const consumerContact=document.querySelector("#consumer-contact");
function syncConsumerContact(){
  if(!consumerForm||!consumerContactFields)return;
  const wants=radioValue(consumerForm,"consumerNotify")==="Sim";
  consumerContactFields.hidden=!wants;
  [consumerContactType,consumerContact].forEach(el=>{if(!el)return;el.disabled=!wants;el.required=wants;if(!wants)el.value=""});
  if(wants)updateConsumerContactInput();
}
function updateConsumerContactInput(){
  if(!consumerContact||!consumerContactType)return;
  const type=consumerContactType.value;
  consumerContact.placeholder=type==="WhatsApp"?"(34) 9....-....":type==="E-mail"?"voce@exemplo.com":"Digite seu e-mail ou WhatsApp";
  consumerContact.inputMode=type==="WhatsApp"?"tel":"email";
}
consumerForm?.querySelectorAll('input[name="consumerNotify"]').forEach(input=>input.addEventListener("change",syncConsumerContact));
consumerContactType?.addEventListener("change",updateConsumerContactInput);
syncConsumerContact();

function consumerMessage(form){
  const notify=radioValue(form,"consumerNotify");
  const contact=notify==="Sim"?`${fieldValue(form,'consumerContactType')}: ${fieldValue(form,'consumerContact')}`:"Não solicitou aviso";
  const referralName=fieldValue(form,'consumerReferralName');
  const referralCategory=fieldValue(form,'consumerReferralCategory');
  return [
    "MAPA INICIAL DE DEMANDA — CONSUMIDOR","",
    `Pedido real: ${fieldValue(form,'consumerNeed')}`,
    `Bairro/região aproximada: ${fieldValue(form,'consumerNeighborhood')}`,
    `Quando precisaria resolver: ${radioValue(form,"consumerWhen")}`,
    `Áreas que mais fariam diferença: ${groupValues(form,"consumerCategory").join("; ")}`,
    `Indicação local: ${referralName||"Não informou"}`,
    `O que a indicação faz: ${referralCategory||"Não informou"}`,
    `O que faria usar/confiar: ${groupValues(form,"consumerTrust").join("; ")}`,
    `Usaria se resolvesse o caso descrito: ${radioValue(form,"consumerUse")}`,
    `Deseja aviso de lançamento: ${notify}`,
    `Contato para aviso: ${contact}`
  ].join("\n");
}
function companyMessage(form){
  const roles=groupValues(form,'companyRole');
  const hasProducts=roles.includes('Produtos');
  const hasServices=roles.includes('Serviços');
  const lines=[
    "MAPA INICIAL DE CAPACIDADE — EMPRESA","",
    `Empresa: ${fieldValue(form,'companyName')}`,
    `Responsável: ${fieldValue(form,'companyContact')}`,
    `WhatsApp: ${fieldValue(form,'companyWhatsapp')||"Não informou"}`,
    `Papel na Rede: ${roles.join(" + ")}`,
    `Área principal: ${fieldValue(form,'companyCategory')}`,
    `O que consegue fornecer ou resolver: ${fieldValue(form,'companyCapability')}`,
    `Formas de atendimento: ${groupValues(form,"companyChannels").join("; ")}`,
    `Área de atendimento: ${fieldValue(form,'companyCoverage')}`,
    `Bairros/regiões informados: ${fieldValue(form,'companyCoverageDetail')||"Não informou"}`
  ];
  if(hasProducts)lines.push(
    '',"CAPACIDADE DE PRODUTO",
    `Fonte de catálogo/preço: ${fieldValue(form,'companyCatalogSource')}`,
    `Sistema/ERP: ${fieldValue(form,'companySystemName')||"Não informou"}`,
    `Retirada: ${fieldValue(form,'companyPickup')}`,
    `Entrega própria: ${fieldValue(form,'companyOwnDelivery')}`,
    `Coleta pelo Resolva Aí: ${fieldValue(form,'companyResolvaCollection')}`,
    `Tempo de separação: ${fieldValue(form,'companyPrepTime')}`
  );
  if(hasServices)lines.push(
    '',"CAPACIDADE DE SERVIÇO",
    `Estrutura de execução: ${fieldValue(form,'companyServiceStructure')}`,
    `Capacidade simultânea: ${fieldValue(form,'companyServiceCapacity')}`,
    `Pedido ideal: ${fieldValue(form,'companyServiceIdeal')}`,
    `Pedido que deve evitar: ${fieldValue(form,'companyServiceAvoid')}`,
    `Velocidade normal de resposta: ${radioValue(form,"companyResponse")}`,
    `Conseguiria atender oportunidade compatível amanhã: ${radioValue(form,"companyTomorrow")}`
  );
  lines.push(
    '',"OPERAÇÃO GERAL",
    `Entrega/logística atual: ${fieldValue(form,'companyDelivery')}`,
    `Principais limitações: ${groupValues(form,"companyConstraints").join("; ")}`,
    `Momento de participação: ${radioValue(form,"companyStage")}`,
    `Observação: ${fieldValue(form,'companyNote')||"Não informou"}`
  );
  return lines.join("\n");
}
function validConsumerContact(form){
  if(radioValue(form,"consumerNotify")!=="Sim")return true;
  const type=fieldValue(form,'consumerContactType'),value=fieldValue(form,'consumerContact');
  if(!type||!value)return false;
  if(type==="E-mail")return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  if(type==="WhatsApp")return value.replace(/\D/g,"").length>=10;
  return false;
}
function resetTurnstileProfile(profile){
  tokens[profile]="";
  if(window.turnstile&&widgetIds[profile]!==null)window.turnstile.reset(widgetIds[profile]);
}
function resetFormState(profile,form){
  form.reset();form.querySelectorAll("[data-checkbox-group]").forEach(group=>{group.classList.remove("invalid");updateGroupCounter(group)});
  if(profile==="consumidor")syncConsumerContact();
  resetTurnstileProfile(profile);
}
function isTurnstileError(error){return error?.message==="ANTIABUSE_REJECTED"||String(error?.message||"").startsWith("TURNSTILE_")}

async function submitParticipation(profile,event){
  event.preventDefault();
  const form=forms[profile];if(!form)return;setFeedback(profile,"");
  if(!applyCollectionGate(profile))return;
  const groupsOk=validateGroups(form);const contactOk=profile!=="consumidor"||validConsumerContact(form);
  if(!form.checkValidity()||!groupsOk||!contactOk){form.reportValidity();setFeedback(profile,contactOk?"Revise os campos indicados antes de enviar.":"Informe um e-mail ou WhatsApp válido para receber o aviso.","error");return}
  if(config.turnstileRequired&&!tokens[profile]){
    const ready=await ensureTurnstile(profile);
    if(!ready)return;
    setFeedback(profile,"Concluindo a verificação de segurança…");
    const verified=await waitForTurnstileToken(profile);
    if(!verified){setFeedback(profile,"A verificação de segurança ainda não concluiu. Tente enviar novamente; os campos continuam preenchidos.","error");return}
    setFeedback(profile,"");
  }

  const submit=submitButtons[profile],originalText=submit.textContent;submit.disabled=true;submit.textContent="Enviando…";
  const isCompany=profile==="empresa";
  let email="";
  if(isCompany)email=fieldValue(form,'companyEmail');
  else if(radioValue(form,"consumerNotify")==="Sim"&&fieldValue(form,'consumerContactType')==="E-mail")email=fieldValue(form,'consumerContact');
  const body={
    name:isCompany?`${fieldValue(form,'companyContact')} — ${fieldValue(form,'companyName')}`:"Consumidor — mapa inicial de demanda",
    email,
    subject:isCompany?"Mapa de capacidade — empresa interessada":"Mapa de demanda — consumidor",
    message:isCompany?companyMessage(form):consumerMessage(form),
    website:form.elements.website?.value||"",consent:true,turnstileToken:tokens[profile]
  };
  try{
    const response=await fetch("/api/contact",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
    const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||"SEND_FAILED");
    resetFormState(profile,form);
    if(isCompany)setSuccess(profile,'Informações enviadas. Sua empresa entrou em qualificação. Não há cobrança nesta etapa. O Uai Perto confirma o papel, a operação e a condição antes de qualquer aceite ou cobrança.');
    else setSuccess(profile,"Resposta enviada. Sua necessidade agora ajuda a mostrar onde o Uai Perto precisa começar em Uberaba.");
  }catch(error){
    if(isTurnstileError(error))resetTurnstileProfile(profile);
    const friendly=error.message==="PRIVACY_POLICY_NOT_APPROVED"?collectionBlockedMessage():isTurnstileError(error)?"A verificação de segurança precisa ser refeita. Tente enviar novamente; seus campos continuam preenchidos.":error.message==="CONTACT_NOT_CONFIGURED"?"O canal ainda está sendo configurado.":error.message==="RATE_LIMITED"?"Muitas tentativas em pouco tempo. Tente novamente mais tarde.":"Não foi possível enviar agora. Tente novamente em alguns minutos.";setFeedback(profile,friendly,"error");
  }finally{submit.disabled=false;submit.textContent=originalText;applyCollectionGate(profile)}
}
forms.consumidor?.addEventListener("submit",event=>submitParticipation("consumidor",event));
forms.empresa?.addEventListener("submit",event=>submitParticipation("empresa",event));
