const profileButtons=[...document.querySelectorAll("[data-profile-target]")];
const panels={
  consumidor:document.querySelector("#consumer-panel"),
  empresa:document.querySelector("#company-panel")
};
const forms={
  consumidor:document.querySelector("#consumer-form"),
  empresa:document.querySelector("#company-form")
};
const feedbacks={
  consumidor:document.querySelector("#consumer-feedback"),
  empresa:document.querySelector("#company-feedback")
};
const submitButtons={
  consumidor:document.querySelector("#consumer-submit"),
  empresa:document.querySelector("#company-submit")
};
const tokens={consumidor:"",empresa:""};
const widgetIds={consumidor:null,empresa:null};
let config={};

try{
  const response=await fetch("/api/public-config",{cache:"no-store"});
  if(response.ok)config=await response.json();
}catch{}

let turnstileReady=Promise.resolve();
if(config.turnstileRequired&&config.turnstileSiteKey){
  turnstileReady=new Promise(resolve=>{
    if(window.turnstile){resolve();return}
    const script=document.createElement("script");
    script.src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async=true;
    script.defer=true;
    script.onload=resolve;
    script.onerror=resolve;
    document.head.appendChild(script);
  });
}

function setFeedback(profile,text,type=""){
  const el=feedbacks[profile];
  if(!el)return;
  el.textContent=text;
  el.className=`participation-feedback ${type}`.trim();
}

function setSuccess(profile,html){
  const el=feedbacks[profile];
  if(!el)return;
  el.innerHTML=html;
  el.className="participation-feedback success";
}

async function ensureTurnstile(profile){
  if(!config.turnstileRequired||!config.turnstileSiteKey||widgetIds[profile]!==null)return;
  await turnstileReady;
  const target=document.querySelector(`#${profile}-turnstile`);
  if(!target||!window.turnstile)return;
  widgetIds[profile]=window.turnstile.render(target,{
    sitekey:config.turnstileSiteKey,
    callback:token=>{tokens[profile]=token},
    "expired-callback":()=>{tokens[profile]=""},
    "error-callback":()=>{tokens[profile]=""}
  });
}

function activateProfile(profile,updateUrl=true){
  if(!panels[profile])return;
  profileButtons.forEach(button=>{
    const active=button.dataset.profileTarget===profile;
    button.classList.toggle("active",active);
    button.setAttribute("aria-pressed",String(active));
  });
  Object.entries(panels).forEach(([key,panel])=>{panel.hidden=key!==profile});
  if(updateUrl){
    const url=new URL(location.href);
    url.searchParams.set("perfil",profile);
    history.replaceState({},"",url);
  }
  ensureTurnstile(profile);
  panels[profile].scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"});
}

profileButtons.forEach(button=>button.addEventListener("click",()=>activateProfile(button.dataset.profileTarget)));
const requestedProfile=new URLSearchParams(location.search).get("perfil");
if(requestedProfile&&panels[requestedProfile])activateProfile(requestedProfile,false);

function setupLimitedCheckboxGroup(group){
  const max=Number(group.dataset.max||0);
  const counter=group.querySelector("[data-choice-counter]");
  const inputs=[...group.querySelectorAll('input[type="checkbox"]')];
  const update=()=>{
    const count=inputs.filter(input=>input.checked).length;
    if(counter&&max)counter.textContent=`${count}/${max} selecionados`;
    group.classList.remove("invalid");
  };
  inputs.forEach(input=>input.addEventListener("change",()=>{
    const checked=inputs.filter(item=>item.checked);
    if(max&&checked.length>max){input.checked=false;return}
    if(input.value==="Nenhuma limitação relevante"&&input.checked){inputs.filter(item=>item!==input).forEach(item=>{item.checked=false})}
    if(input.value!=="Nenhuma limitação relevante"&&input.checked){const none=inputs.find(item=>item.value==="Nenhuma limitação relevante");if(none)none.checked=false}
    update();
  }));
  update();
}
document.querySelectorAll("[data-checkbox-group]").forEach(setupLimitedCheckboxGroup);

function groupValues(form,name){return [...form.querySelectorAll(`input[name="${name}"]:checked`)].map(input=>input.value)}
function radioValue(form,name){return form.querySelector(`input[name="${name}"]:checked`)?.value||""}
function cleanText(value){return String(value||"").trim()}
function validateGroups(form){
  let ok=true;
  form.querySelectorAll('[data-checkbox-group][data-required="true"]').forEach(group=>{
    const hasChecked=!!group.querySelector('input[type="checkbox"]:checked');
    group.classList.toggle("invalid",!hasChecked);
    if(!hasChecked)ok=false;
  });
  return ok;
}

function consumerMessage(form){
  const expectations=groupValues(form,"consumerExpectation").join("; ");
  const categories=groupValues(form,"consumerCategory").join("; ");
  const trust=groupValues(form,"consumerTrust").join("; ");
  return [
    "PESQUISA DE PRÉ-LANÇAMENTO — CONSUMIDOR",
    "",
    `Como se sente com a novidade: ${radioValue(form,"consumerFeeling")}`,
    `Intenção de uso hoje: ${radioValue(form,"consumerUse")}`,
    `O que espera conseguir fazer: ${expectations}`,
    `Pedido que faria hoje: ${cleanText(form.elements.consumerNeed.value)}`,
    `Categorias que mais gostaria de encontrar: ${categories}`,
    `O que geraria confiança: ${trust}`,
    `Dificuldade atual em Uberaba: ${cleanText(form.elements.consumerDifficulty.value)||"Não informou"}`,
    `Deseja aviso de lançamento: ${radioValue(form,"consumerNotify")}`
  ].join("\n");
}

function companyMessage(form){
  const channels=groupValues(form,"companyChannels").join("; ");
  const constraints=groupValues(form,"companyConstraints").join("; ");
  return [
    "INTERESSE EMPRESARIAL — REDE UAI PERTO",
    "",
    `Empresa: ${cleanText(form.elements.companyName.value)}`,
    `Responsável: ${cleanText(form.elements.companyContact.value)}`,
    `WhatsApp: ${cleanText(form.elements.companyWhatsapp.value)||"Não informou"}`,
    `Área principal: ${cleanText(form.elements.companyCategory.value)}`,
    `O que a empresa realmente consegue resolver: ${cleanText(form.elements.companyCapability.value)}`,
    `Formas de atendimento: ${channels}`,
    `Velocidade normal de resposta: ${radioValue(form,"companyResponse")}`,
    `Capacidade atual para novas oportunidades: ${radioValue(form,"companyCapacity")}`,
    `Entrega/logística: ${cleanText(form.elements.companyDelivery.value)}`,
    `Principais limitações: ${constraints}`,
    `Momento de participação: ${radioValue(form,"companyStage")}`,
    `Observação: ${cleanText(form.elements.companyNote.value)||"Não informou"}`
  ].join("\n");
}

async function submitParticipation(profile,event){
  event.preventDefault();
  const form=forms[profile];
  if(!form)return;
  setFeedback(profile,"");
  const groupsOk=validateGroups(form);
  if(!form.checkValidity()||!groupsOk){
    form.reportValidity();
    setFeedback(profile,"Revise os campos indicados antes de enviar.","error");
    return;
  }
  if(config.contactFormEnabled===false){setFeedback(profile,"O envio pelo site está temporariamente indisponível.","error");return}
  if(config.turnstileRequired&&!tokens[profile]){setFeedback(profile,"Conclua a verificação de segurança.","error");return}

  const submit=submitButtons[profile];
  const originalText=submit.textContent;
  submit.disabled=true;
  submit.textContent="Enviando…";

  const isCompany=profile==="empresa";
  const name=isCompany?`${cleanText(form.elements.companyContact.value)} — ${cleanText(form.elements.companyName.value)}`:cleanText(form.elements.consumerName.value);
  const email=isCompany?cleanText(form.elements.companyEmail.value):cleanText(form.elements.consumerEmail.value);
  const body={
    name,
    email,
    subject:isCompany?"Interesse empresarial — participação na Rede":"Pesquisa do consumidor — pré-lançamento",
    message:isCompany?companyMessage(form):consumerMessage(form),
    website:form.elements.website?.value||"",
    consent:true,
    turnstileToken:tokens[profile]
  };

  try{
    const response=await fetch("/api/contact",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
    const data=await response.json().catch(()=>({}));
    if(!response.ok)throw new Error(data.error||"SEND_FAILED");
    form.reset();
    form.querySelectorAll("[data-checkbox-group]").forEach(group=>group.classList.remove("invalid"));
    tokens[profile]="";
    if(window.turnstile&&widgetIds[profile]!==null)window.turnstile.reset(widgetIds[profile]);
    if(isCompany){
      setSuccess(profile,'Resposta enviada. Obrigado por apresentar sua capacidade à Rede. <a href="/calculadora.html">Se quiser, simule agora o enquadramento empresarial.</a>');
    }else{
      setSuccess(profile,"Resposta enviada. Obrigado por ajudar a mostrar o que Uberaba espera encontrar no Uai Perto.");
    }
  }catch(error){
    const friendly=error.message==="CONTACT_NOT_CONFIGURED"?"O canal ainda está sendo configurado.":error.message==="RATE_LIMITED"?"Muitas tentativas em pouco tempo. Tente novamente mais tarde.":"Não foi possível enviar agora. Tente novamente em alguns minutos.";
    setFeedback(profile,friendly,"error");
  }finally{
    submit.disabled=false;
    submit.textContent=originalText;
  }
}

forms.consumidor?.addEventListener("submit",event=>submitParticipation("consumidor",event));
forms.empresa?.addEventListener("submit",event=>submitParticipation("empresa",event));
