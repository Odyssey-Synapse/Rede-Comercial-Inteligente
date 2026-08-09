function esc(s=""){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]))}
async function config(){try{const r=await fetch("/api/public-config");if(!r.ok)throw new Error();return await r.json()}catch{return {}}}
const c=await config();
const channels=document.querySelector("#contact-channels");
if(channels){
 const items=[];
 if(c.contactEmail)items.push(`<div class="card"><small>E-mail institucional</small><strong>${esc(c.contactEmail)}</strong></div>`);
 if(c.contactWhatsapp)items.push(`<div class="card"><small>WhatsApp oficial</small><strong>${esc(c.contactWhatsapp)}</strong></div>`);
 if(c.privacyEmail)items.push(`<div class="card"><small>Privacidade</small><strong>${esc(c.privacyEmail)}</strong></div>`);
 channels.innerHTML=items.join("");
 document.querySelector("#contact-title").textContent=items.length?"Escolha o canal adequado.":(c.contactFormEnabled?"Contato pelo site.":"O contato público ainda precisa ser configurado.");
 document.querySelector("#contact-blocker").hidden=!!(c.contactEmail||c.contactWhatsapp||c.contactFormEnabled);
}
const privacy=document.querySelector("#privacy-status");
if(privacy){
 document.querySelector("#privacy-status-title").textContent=c.privacyPolicyApproved?"Política jurídica marcada como aprovada no ambiente.":"Política jurídica ainda não liberada para coleta comercial.";
 document.querySelector("#privacy-status-text").textContent=c.privacyPolicyApproved?"A configuração de produção informa que a política passou pela aprovação necessária. O conteúdo publicado ainda deve permanecer consistente com a operação real.":"A publicação comercial com coleta real permanece bloqueada até que a política seja juridicamente aprovada e a configuração de produção seja atualizada.";
 const controller=document.querySelector("#privacy-controller");
 const parts=[];
 if(c.controllerLegalName)parts.push(`<div class="card"><small>Controlador</small><strong>${esc(c.controllerLegalName)}</strong>${c.controllerDocument?`<p>${esc(c.controllerDocument)}</p>`:""}</div>`);
 if(c.privacyEmail)parts.push(`<div class="card"><small>Canal para privacidade</small><strong>${esc(c.privacyEmail)}</strong></div>`);
 else if(c.contactFormEnabled)parts.push(`<div class="card"><small>Canal para privacidade</small><strong>Formulário institucional</strong><p><a href="/contato.html?assunto=Privacidade">Enviar solicitação</a></p></div>`);
 controller.innerHTML=parts.length?parts.join(""):'<p class="fine">Dados do controlador e canal oficial ainda não configurados.</p>';
}
