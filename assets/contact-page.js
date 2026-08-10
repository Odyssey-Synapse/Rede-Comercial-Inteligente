const form=document.querySelector("#contact-form");
if(form){
 const $=s=>document.querySelector(s);
 const feedback=$("#contact-feedback"),submit=$("#contact-submit"),message=$("#contact-message"),count=$("#message-count");
 let config={},turnstileToken="";
 const setFeedback=(text,type="")=>{feedback.textContent=text;feedback.className=`contact-feedback ${type}`};
 const mark=(el,bad)=>el?.closest(".field")?.classList.toggle("invalid",!!bad);
 const requestedSubject=new URLSearchParams(location.search).get("assunto");
 if(requestedSubject){const subjectEl=$("#contact-subject");const match=[...subjectEl.options].find(o=>o.value.toLowerCase()===requestedSubject.toLowerCase());if(match)subjectEl.value=match.value;}
 message?.addEventListener("input",()=>count.textContent=`${message.value.length}/4000`);
 try{const r=await fetch("/api/public-config",{cache:"no-store"});if(r.ok)config=await r.json()}catch{}
 if(config.turnstileRequired&&config.turnstileSiteKey){
   const script=document.createElement("script");script.src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";script.async=true;script.defer=true;document.head.appendChild(script);
   script.onload=()=>window.turnstile?.render("#contact-turnstile",{sitekey:config.turnstileSiteKey,callback:t=>{turnstileToken=t},"expired-callback":()=>{turnstileToken=""}})
 }
 form.addEventListener("submit",async e=>{
   e.preventDefault();setFeedback("");
   const name=$("#contact-name"),email=$("#contact-email"),subject=$("#contact-subject"),consent=$("#contact-consent");
   const validEmail=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
   mark(name,name.value.trim().length<2);mark(email,!validEmail);mark(subject,!subject.value);mark(message,message.value.trim().length<10);
   if(name.value.trim().length<2||!validEmail||!subject.value||message.value.trim().length<10||!consent.checked){setFeedback(consent.checked?"Revise os campos destacados.":"Confirme o consentimento para enviar a mensagem.","error");return}
   if(config.turnstileRequired&&!turnstileToken){setFeedback("Conclua a verificação de segurança.","error");return}
   submit.disabled=true;submit.textContent="Enviando…";
   try{
     const body={name:name.value,email:email.value,subject:subject.value,message:message.value,website:form.elements.website?.value||"",consent:true,turnstileToken};
     const r=await fetch("/api/contact",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)});
     const data=await r.json().catch(()=>({}));
     if(!r.ok)throw new Error(data.error||"SEND_FAILED");
     form.reset();count.textContent="0/4000";turnstileToken="";if(window.turnstile)window.turnstile.reset();
     setFeedback("Mensagem enviada. A equipe do projeto poderá responder pelo e-mail informado.","success");
   }catch(err){
     const friendly=err.message==="CONTACT_NOT_CONFIGURED"?"O canal ainda está sendo configurado.":err.message==="RATE_LIMITED"?"Muitas tentativas. Tente novamente mais tarde.":"Não foi possível enviar agora. Tente novamente em alguns minutos.";
     setFeedback(friendly,"error");
   }finally{submit.disabled=false;submit.textContent="Enviar mensagem"}
 });
}
