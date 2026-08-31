const form=document.querySelector("#contact-form");
if(form){
 const $=s=>document.querySelector(s);
 const feedback=$("#contact-feedback"),submit=$("#contact-submit"),message=$("#contact-message"),count=$("#message-count"),subjectEl=$("#contact-subject");
 let config={},turnstileToken="",turnstileWidgetId=null,turnstileLoadPromise=null,turnstileLoadFailed=false;
 const setFeedback=(text,type="")=>{feedback.textContent=text;feedback.className=`contact-feedback ${type}`};
 const mark=(el,bad)=>el?.closest(".field")?.classList.toggle("invalid",!!bad);
 const requestedSubject=new URLSearchParams(location.search).get("assunto");
 if(requestedSubject){const match=[...subjectEl.options].find(o=>o.value.toLowerCase()===requestedSubject.toLowerCase());if(match)subjectEl.value=match.value;}
 message?.addEventListener("input",()=>count.textContent=`${message.value.length}/4000`);
 try{const r=await fetch("/api/public-config",{cache:"no-store"});if(r.ok)config=await r.json()}catch{}

 const isPrivacyRequest=()=>subjectEl?.value==="Privacidade";
 const channelEnabled=()=>isPrivacyRequest()?config.privacyFormEnabled!==false:config.contactFormEnabled!==false;
 function syncChannelState(){
   const enabled=channelEnabled();
   if(submit)submit.disabled=!enabled;
   if(!enabled){
     setFeedback(isPrivacyRequest()?"O canal de privacidade está temporariamente indisponível.":config.privacyPolicyApproved===false?"O contato comercial pelo site está temporariamente fechado enquanto a política de privacidade não está liberada para coleta.":"O envio pelo site está temporariamente indisponível.","error");
   }else if(feedback.textContent.toLowerCase().includes("temporariamente"))setFeedback("");
 }
 subjectEl?.addEventListener("change",syncChannelState);
 syncChannelState();

 async function loadTurnstile(){
   if(window.turnstile)return true;
   if(turnstileLoadPromise)return turnstileLoadPromise;
   turnstileLoadPromise=new Promise(resolve=>{
     const script=document.createElement("script");
     script.src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
     script.async=true;script.defer=true;
     script.onload=()=>{turnstileLoadFailed=false;turnstileLoadPromise=null;resolve(true)};
     script.onerror=()=>{turnstileLoadFailed=true;turnstileLoadPromise=null;script.remove();resolve(false)};
     document.head.appendChild(script);
   });
   return turnstileLoadPromise;
 }
 async function ensureTurnstile(){
   if(!config.turnstileRequired)return true;
   if(!config.turnstileSiteKey){setFeedback("A verificação de segurança está temporariamente indisponível.","error");return false}
   if(turnstileWidgetId!==null&&window.turnstile)return true;
   const loaded=await loadTurnstile();
   if(!loaded||turnstileLoadFailed||!window.turnstile){setFeedback("Não foi possível carregar a verificação de segurança. Verifique sua conexão e tente novamente; os campos continuam preenchidos.","error");return false}
   try{
     turnstileWidgetId=window.turnstile.render("#contact-turnstile",{
       sitekey:config.turnstileSiteKey,
       theme:"auto",
       appearance:"always",
       retry:"auto",
       "refresh-expired":"auto",
       callback:t=>{turnstileToken=t;if(feedback.textContent.toLowerCase().includes("verificação de segurança"))setFeedback("")},
       "expired-callback":()=>{turnstileToken=""},
       "error-callback":()=>{turnstileToken="";setFeedback("A verificação de segurança precisa ser refeita. Seus campos continuam preenchidos.","error")}
     });
     return true;
   }catch{
     turnstileWidgetId=null;
     setFeedback("Não foi possível iniciar a verificação de segurança. Tente novamente; os campos continuam preenchidos.","error");
     return false;
   }
 }
 function resetTurnstile(){turnstileToken="";if(window.turnstile&&turnstileWidgetId!==null)window.turnstile.reset(turnstileWidgetId)}
 if(config.turnstileRequired&&channelEnabled())ensureTurnstile();

 form.addEventListener("submit",async e=>{
   e.preventDefault();setFeedback("");
   const name=$("#contact-name"),email=$("#contact-email"),subject=subjectEl,consent=$("#contact-consent");
   const validEmail=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
   mark(name,name.value.trim().length<2);mark(email,!validEmail);mark(subject,!subject.value);mark(message,message.value.trim().length<10);
   if(name.value.trim().length<2||!validEmail||!subject.value||message.value.trim().length<10||!consent.checked){setFeedback(consent.checked?"Revise os campos destacados.":"Confirme o consentimento para enviar a mensagem.","error");return}
   if(!channelEnabled()){syncChannelState();return}
   if(config.turnstileRequired&&!turnstileToken){const ready=await ensureTurnstile();if(!ready)return;setFeedback("Conclua a verificação de segurança para enviar.","error");return}
   submit.disabled=true;submit.textContent="Enviando…";
   try{
     const body={name:name.value.trim(),email:email.value.trim(),subject:subject.value,message:message.value.trim(),website:form.elements.website?.value||"",consent:true,turnstileToken};
     const r=await fetch("/api/contact",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
     const data=await r.json().catch(()=>({}));
     if(!r.ok)throw new Error(data.error||"SEND_FAILED");
     form.reset();count.textContent="0/4000";resetTurnstile();
     setFeedback(isPrivacyRequest()?"Solicitação de privacidade enviada. A equipe poderá responder pelo e-mail informado.":"Mensagem enviada. A equipe do projeto poderá responder pelo e-mail informado.","success");
   }catch(err){
     if(err.message==="ANTIABUSE_REJECTED"||String(err.message||"").startsWith("TURNSTILE_"))resetTurnstile();
     const friendly=err.message==="PRIVACY_POLICY_NOT_APPROVED"?"O contato comercial pelo site está temporariamente fechado enquanto a política de privacidade não está liberada para coleta.":err.message==="CONTACT_NOT_CONFIGURED"?"O canal ainda está sendo configurado.":err.message==="RATE_LIMITED"?"Muitas tentativas. Tente novamente mais tarde.":err.message==="ANTIABUSE_REJECTED"||String(err.message||"").startsWith("TURNSTILE_")?"A verificação de segurança precisa ser refeita. Seus campos continuam preenchidos.":"Não foi possível enviar agora. Tente novamente em alguns minutos.";
     setFeedback(friendly,"error");
   }finally{submit.disabled=false;submit.textContent="Enviar mensagem";syncChannelState()}
 });
}
