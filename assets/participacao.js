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
let turnstileReady=Promise.resolve(true);
if(config.turnstileRequired&&config.turnstileSiteKey){
  turnstileReady=new Promise(resolve=>{
    if(window.turnstile){resolve(true);return}
    const script=document.createElement("script");
    script.src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async=true;script.defer=true;
    script.onload=()=>resolve(true);
    script.onerror=()=>{turnstileLoadFailed=true;resolve(false)};
    document.head.appendChild(script);
  });
}

function setFeedback(profile,text,type=""){const el=feedbacks[profile];if(!el)return;el.textContent=text;el.className=`participation-feedback ${type}`.trim()}
function setSuccess(profile,html){const el=feedbacks[profile];if(!el)return;el.innerHTML=html;el.className="participation-feedback success"}
async function ensureTurnstile(profile){
  if(!config.turnstileRequired)return true;
  if(!config.turnstileSiteKey){setFeedback(profile,"A verificação de segurança está temporariamente indisponível.","error");return false}
  if(widgetIds[profile]!==null)return true;
  const loaded=await turnstileReady;
  const target=document.querySelector(`#${profile}-turnstile`);
  if(!loaded||turnstileLoadFailed||!target||!window.turnstile){setFeedback(profile,"Não foi possível carregar a verificação de segurança. Atualize a página e tente novamente.","error");return false}
  try{
    widgetIds[profile]=window.turnstile.render(target,{
      sitekey:config.turnstileSiteKey,
      theme:"auto",
      language:"pt-BR",
      size:"flexible",
      appearance:"interaction-only",
      execution:"render",
      retry:"auto",
      "refresh-expired":"auto",
      "refresh-timeout":"auto",
      callback:token=>{
        tokens[profile]=token;
        if(feedbacks[profile]?.textContent?.toLowerCase().includes("verificação de segurança"))setFeedback(profile,"");
      },
      "expired-callback":()=>{tokens[profile]=""},
      "timeout-callback":()=>{tokens[profile]="";setFeedback(profile,"A verificação de segurança expirou e será refeita automaticamente.","error")},
      "error-callback":()=>{tokens[profile]="";setFeedback(profile,"Não foi possível concluir a verificação de segurança. Aguarde alguns segundos e tente novamente.","error")}
    });
    return true;
  }catch{
    setFeedback(profile,"Não foi possível iniciar a verificação de segurança. Atualize a página e tente novamente.","error");
    return false;
  }
}
function activateProfile(profile,updateUrl=true){
  if(!panels[profile])return;
  profileButtons.forEach(button=>{const active=button.dataset.profileTarget===profile;button.classList.toggle("active",active);button.setAttribute("aria-pressed",String(active))});
  Object.entries(panels).forEach(([key,panel])=>{panel.hidden=key!==profile});
  if(updateUrl){const url=new URL(location.href);url.searchParams.set("perfil",profile);history.replaceState({},"",url)}
  ensureTurnstile(profile);
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
document.querySelectorAll("[data-checkbox-group]").forEach(setupLimitedCheckboxGroup);

function groupValues(form,name){return [...form.querySelectorAll(`input[name="${name}"]:checked`)].map(input=>input.value)}
function radioValue(form,name){return form.querySelector(`input[name="${name}"]:checked`)?.value||""}
function cleanText(value){return String(value||"").trim()}
function validateGroups(form){let ok=true;form.querySelectorAll('[data-checkbox-group][data-required="true"]').forEach(group=>{const hasChecked=!!group.querySelector('input[type="checkbox"]:checked');group.classList.toggle("invalid",!hasChecked);if(!hasChecked)ok=false});return ok}

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
  const contact=notify==="Sim"?`${cleanText(form.elements.consumerContactType.value)}: ${cleanText(form.elements.consumerContact.value)}`:"Não solicitou aviso";
  const referralName=cleanText(form.elements.consumerReferralName.value);
  const referralCategory=cleanText(form.elements.consumerReferralCategory.value);
  return [
    "MAPA INICIAL DE DEMANDA — CONSUMIDOR","",
    `Pedido real: ${cleanText(form.elements.consumerNeed.value)}`,
    `Bairro/região aproximada: ${cleanText(form.elements.consumerNeighborhood.value)}`,
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
  return [
    "MAPA INICIAL DE CAPACIDADE — EMPRESA","",
    `Empresa: ${cleanText(form.elements.companyName.value)}`,
    `Responsável: ${cleanText(form.elements.companyContact.value)}`,
    `WhatsApp: ${cleanText(form.elements.companyWhatsapp.value)||"Não informou"}`,
    `Área principal: ${cleanText(form.elements.companyCategory.value)}`,
    `O que realmente consegue resolver: ${cleanText(form.elements.companyCapability.value)}`,
    `Formas de atendimento: ${groupValues(form,"companyChannels").join("; ")}`,
    `Área de atendimento: ${cleanText(form.elements.companyCoverage.value)}`,
    `Bairros/regiões informados: ${cleanText(form.elements.companyCoverageDetail.value)||"Não informou"}`,
    `Velocidade normal de resposta: ${radioValue(form,"companyResponse")}`,
    `Conseguiria atender oportunidade compatível amanhã: ${radioValue(form,"companyTomorrow")}`,
    `Entrega/logística: ${cleanText(form.elements.companyDelivery.value)}`,
    `Principais limitações: ${groupValues(form,"companyConstraints").join("; ")}`,
    `Momento de participação: ${radioValue(form,"companyStage")}`,
    `Observação: ${cleanText(form.elements.companyNote.value)||"Não informou"}`
  ].join("\n");
}
function validConsumerContact(form){
  if(radioValue(form,"consumerNotify")!=="Sim")return true;
  const type=cleanText(form.elements.consumerContactType.value),value=cleanText(form.elements.consumerContact.value);
  if(!type||!value)return false;
  if(type==="E-mail")return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  if(type==="WhatsApp")return value.replace(/\D/g,"").length>=10;
  return false;
}
function resetFormState(profile,form){
  form.reset();form.querySelectorAll("[data-checkbox-group]").forEach(group=>{group.classList.remove("invalid");updateGroupCounter(group)});
  if(profile==="consumidor")syncConsumerContact();
  tokens[profile]="";if(window.turnstile&&widgetIds[profile]!==null)window.turnstile.reset(widgetIds[profile]);
}
function isTurnstileError(error){return error?.message==="ANTIABUSE_REJECTED"||String(error?.message||"").startsWith("TURNSTILE_")}

async function submitParticipation(profile,event){
  event.preventDefault();
  const form=forms[profile];if(!form)return;setFeedback(profile,"");
  const groupsOk=validateGroups(form);const contactOk=profile!=="consumidor"||validConsumerContact(form);
  if(!form.checkValidity()||!groupsOk||!contactOk){form.reportValidity();setFeedback(profile,contactOk?"Revise os campos indicados antes de enviar.":"Informe um e-mail ou WhatsApp válido para receber o aviso.","error");return}
  if(config.contactFormEnabled===false){setFeedback(profile,"O envio pelo site está temporariamente indisponível.","error");return}
  if(config.turnstileRequired&&!tokens[profile]){
    const ready=await ensureTurnstile(profile);
    if(ready)setFeedback(profile,"Aguarde a verificação de segurança concluir e tente enviar novamente.","error");
    return;
  }

  const submit=submitButtons[profile],originalText=submit.textContent;submit.disabled=true;submit.textContent="Enviando…";
  const isCompany=profile==="empresa";
  let email="";
  if(isCompany)email=cleanText(form.elements.companyEmail.value);
  else if(radioValue(form,"consumerNotify")==="Sim"&&cleanText(form.elements.consumerContactType.value)==="E-mail")email=cleanText(form.elements.consumerContact.value);
  const body={
    name:isCompany?`${cleanText(form.elements.companyContact.value)} — ${cleanText(form.elements.companyName.value)}`:"Consumidor — mapa inicial de demanda",
    email,
    subject:isCompany?"Mapa de capacidade — empresa interessada":"Mapa de demanda — consumidor",
    message:isCompany?companyMessage(form):consumerMessage(form),
    website:form.elements.website?.value||"",consent:true,turnstileToken:tokens[profile]
  };
  try{
    const response=await fetch("/api/contact",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
    const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||"SEND_FAILED");
    resetFormState(profile,form);
    if(isCompany)setSuccess(profile,'Informações enviadas. Sua empresa entrou em qualificação. Não há cobrança nesta etapa. <a href="/entrada-empresa.html">Entenda o que acontece agora →</a>');
    else setSuccess(profile,"Resposta enviada. Sua necessidade agora ajuda a mostrar onde o Uai Perto precisa começar em Uberaba.");
  }catch(error){
    if(isTurnstileError(error))resetFormState(profile,form);
    const friendly=isTurnstileError(error)?"A verificação de segurança precisa ser refeita. Revise os dados e envie novamente.":error.message==="CONTACT_NOT_CONFIGURED"?"O canal ainda está sendo configurado.":error.message==="RATE_LIMITED"?"Muitas tentativas em pouco tempo. Tente novamente mais tarde.":"Não foi possível enviar agora. Tente novamente em alguns minutos.";setFeedback(profile,friendly,"error");
  }finally{submit.disabled=false;submit.textContent=originalText}
}
forms.consumidor?.addEventListener("submit",event=>submitParticipation("consumidor",event));
forms.empresa?.addEventListener("submit",event=>submitParticipation("empresa",event));
