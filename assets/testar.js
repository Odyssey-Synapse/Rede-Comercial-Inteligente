// Public distribution derived from MCIR Consumer commit 4e2e3363cf9dccf60149abdeba08316b452234a7.
// The DOM/product flow stays canonical; only the browser transport is replaced.
import{consumerAction,qs,setBusy,toast,renderTimeline,emptyState,esc,registerServiceWorker}from'/assets/testar-common.js';
registerServiceWorker();

let currentProjectId=localStorage.getItem('uai_consumer_project')||'';
let currentProject=null;
let intentId=localStorage.getItem('mcir_consumer_intent')||'';
let solutionPlanId=localStorage.getItem('mcir_consumer_solution_plan')||'';
let resolutionId=localStorage.getItem('mcir_consumer_resolution')||'';
let openQuestionOpportunityId='';
const actor=()=>'';
const setStored=(k,v)=>{if(v)localStorage.setItem(k,v);else localStorage.removeItem(k)};
const feedbackSentKey='uai_consumer_feedback_v017';
let onboardingReady=localStorage.getItem('uai_consumer_onboarded_v017')==='1';
function syncFeedbackVisibility(){const card=qs('pilotFeedbackCard');if(!card)return;const hasExperience=Boolean(currentProjectId||intentId||resolutionId);card.hidden=!hasExperience;if(localStorage.getItem(feedbackSentKey)==='1'){qs('pilotFeedbackForm').hidden=true;qs('pilotFeedbackThanks').hidden=false;}}

const AREAS={
  GENERAL:{label:'Necessidade',kind:'NEED',title:'Algo que preciso resolver',goal:'Preciso resolver uma necessidade em Uberaba.',itemsTitle:'Itens e detalhes',itemPlaceholder:'Ex.: um detalhe que não posso esquecer',fields:[]},
  PURCHASES:{label:'Compras',kind:'LIST',title:'Minha lista de compras',goal:'Quero montar uma lista e resolver essa compra quando estiver pronta.',itemsTitle:'Minha lista',itemPlaceholder:'Ex.: arroz 5 kg',fields:[
    {key:'frequency',label:'Essa compra costuma acontecer com que frequência?',placeholder:'Ex.: toda semana'},
    {key:'preferred_brands',label:'Marcas ou preferências que vale lembrar',placeholder:'Ex.: café marca X; arroz tipo 1'},
    {key:'substitutions',label:'O que pode ou não pode ser substituído?',placeholder:'Ex.: leite pode trocar de marca; café não',textarea:true}
  ]},
  HOME:{label:'Casa e obra',kind:'PROJECT',title:'Minha casa / obra',goal:'Quero organizar uma manutenção, obra ou reforma antes de decidir a próxima etapa.',itemsTitle:'Materiais e pendências',itemPlaceholder:'Ex.: 4 tomadas 20A',fields:[
    {key:'space',label:'Qual ambiente ou parte da obra?',placeholder:'Ex.: banheiro'},
    {key:'stage',label:'Em que etapa está?',placeholder:'Ex.: levantando material'},
    {key:'measurements',label:'Medidas que você já sabe',placeholder:'Ex.: piso 12 m²; parede 2,4 x 3 m',textarea:true},
    {key:'materials',label:'Materiais ou especificações importantes',placeholder:'Ex.: fio 6 mm; porcelanato claro',textarea:true},
    {key:'next_step',label:'Qual parte você pretende resolver primeiro?',placeholder:'Ex.: parte elétrica'}
  ]},
  VEHICLE:{label:'Veículo',kind:'PROJECT',title:'Meu veículo',goal:'Quero acompanhar meu veículo e guardar o que precisa ser visto antes de procurar oficina ou peça.',itemsTitle:'Pendências',itemPlaceholder:'Ex.: pneu traseiro está gasto',fields:[
    {key:'vehicle',label:'Qual veículo?',placeholder:'Ex.: Honda CG 160 2023'},
    {key:'odometer_km',label:'Quilometragem atual',placeholder:'Ex.: 38.400 km'},
    {key:'service_history',label:'O que já foi feito recentemente?',placeholder:'Ex.: óleo trocado aos 36.000 km',textarea:true},
    {key:'pending',label:'O que você percebeu ou quer acompanhar?',placeholder:'Ex.: freio começou a chiar',textarea:true},
    {key:'next_service',label:'Próxima revisão ou marco conhecido',placeholder:'Ex.: revisar aos 40.000 km'}
  ]},
  PET:{label:'Pet',kind:'PROJECT',title:'Meu pet',goal:'Quero guardar os cuidados do meu pet para não começar do zero quando ele precisar de alguma coisa.',itemsTitle:'Compras e cuidados',itemPlaceholder:'Ex.: comprar ração de 10 kg',fields:[
    {key:'pet',label:'Quem é o pet?',placeholder:'Ex.: Luna, cadela, 4 anos, 12 kg'},
    {key:'food',label:'Alimentação atual',placeholder:'Ex.: ração adulto porte médio'},
    {key:'vaccines',label:'Vacinas e cuidados conhecidos',placeholder:'Ex.: vacina anual em setembro',textarea:true},
    {key:'medications',label:'Medicamentos em uso, se houver',placeholder:'Registre somente o que já foi orientado por profissional',textarea:true},
    {key:'restrictions',label:'Alergias ou restrições importantes',placeholder:'Ex.: alergia a frango',textarea:true},
    {key:'next_need',label:'O que está próximo de precisar?',placeholder:'Ex.: vacina anual / banho / ração'}
  ]},
  EVENT:{label:'Evento',kind:'PROJECT',title:'Meu evento',goal:'Quero montar meu evento aos poucos e decidir cada contratação na hora certa.',itemsTitle:'O que ainda falta',itemPlaceholder:'Ex.: buffet para 60 pessoas',fields:[
    {key:'event_date',label:'Data prevista',placeholder:'Ex.: 12/10/2026'},
    {key:'guests',label:'Quantidade aproximada de pessoas',placeholder:'Ex.: 60 pessoas'},
    {key:'needs',label:'O que o evento vai precisar?',placeholder:'Ex.: salão, buffet, bolo, som e fotógrafo',textarea:true},
    {key:'next_step',label:'Qual parte pretende contratar primeiro?',placeholder:'Ex.: buffet'}
  ]}
};
const areaDef=p=>AREAS[p?.area]||AREAS.GENERAL;

function enumeratedAction(path,options={}){
  const method=options.method||'GET',body=options.body||{};let match;
  if(method==='GET'&&path==='/v1/onboarding/me')return['ONBOARDING_STATUS',{}];
  if(method==='POST'&&path==='/v1/onboarding/consumer')return['ACCEPT_ONBOARDING',{}];
  if(method==='POST'&&path==='/v1/consumer/understand')return['PREVIEW_UNDERSTANDING',{text:body.text,location:body.location??null}];
  if(method==='POST'&&path==='/v1/consumer/chat-guide')return['MESSAGE',{text:body.turn_text||body.text}];
  if(method==='GET'&&path==='/v1/consumer/projects')return['LIST_PROJECTS',{}];
  if(method==='POST'&&path==='/v1/consumer/projects')return['CREATE_PROJECT',body];
  if((match=path.match(/^\/v1\/consumer\/projects\/([^/]+)$/))){if(method==='GET')return['READ_PROJECT',{project_id:match[1]}];if(method==='PATCH')return['UPDATE_PROJECT',{project_id:match[1],patch:body}];}
  if((match=path.match(/^\/v1\/consumer\/projects\/([^/]+)\/items$/))&&method==='POST')return['ADD_PROJECT_ITEM',{project_id:match[1],text:body.text}];
  if((match=path.match(/^\/v1\/consumer\/projects\/([^/]+)\/items\/([^/]+)$/))&&method==='DELETE')return['REMOVE_PROJECT_ITEM',{project_id:match[1],item_id:match[2]}];
  if((match=path.match(/^\/v1\/consumer\/projects\/([^/]+)\/routines$/))&&method==='POST')return['ADD_ROUTINE',{project_id:match[1],routine:body}];
  if((match=path.match(/^\/v1\/consumer\/projects\/([^/]+)\/routines\/([^/]+)$/))&&method==='DELETE')return['REMOVE_ROUTINE',{project_id:match[1],routine_id:match[2]}];
  if((match=path.match(/^\/v1\/consumer\/projects\/([^/]+)\/repeat$/))&&method==='POST')return['REPEAT_PROJECT',{project_id:match[1]}];
  if((match=path.match(/^\/v1\/consumer\/projects\/([^/]+)\/execute$/))&&method==='POST')return['START_RESOLUTION',{project_id:match[1]}];
  if((match=path.match(/^\/v1\/consumer\/projects\/([^/]+)\/resolve$/))&&method==='POST')return['MARK_PROJECT_RESOLVED',{project_id:match[1]}];
  if((match=path.match(/^\/v1\/intents\/([^/]+)\/clarify$/))&&method==='POST')return['ANSWER_QUESTION',{intent_id:match[1],answer:body.answer}];
  if((match=path.match(/^\/v1\/intents\/([^/]+)\/match$/))&&method==='POST')return['MATCH_INTENT',{intent_id:match[1]}];
  if((match=path.match(/^\/v1\/intents\/([^/]+)\/status-feed$/))&&method==='GET')return['READ_STATUS',{intent_id:match[1]}];
  if((match=path.match(/^\/v1\/opportunities\/([^/]+)\/answer$/))&&method==='POST')return['ANSWER_QUESTION',{opportunity_id:match[1],answer:body.answer}];
  if((match=path.match(/^\/v1\/solution-plans\/([^/]+)\/options$/))&&method==='GET')return['READ_SOLUTIONS',{solution_plan_id:match[1]}];
  if((match=path.match(/^\/v1\/solution-plans\/([^/]+)\/select$/))&&method==='POST')return['SELECT_SOLUTION',{solution_plan_id:match[1],proposal_ids:body.proposal_ids}];
  if((match=path.match(/^\/v1\/resolutions\/([^/]+)$/))&&method==='GET')return['READ_RESOLUTION',{resolution_id:match[1]}];
  if((match=path.match(/^\/v1\/resolutions\/([^/]+)\/confirm$/))&&method==='POST')return['CONFIRM_RESULT',{resolution_id:match[1]}];
  if((match=path.match(/^\/v1\/resolutions\/([^/]+)\/fail$/))&&method==='POST')return['REPORT_NOT_RESOLVED',{resolution_id:match[1],reason:body.reason}];
  if(method==='GET'&&path==='/v1/notifications/me')return['READ_NOTIFICATIONS',{}];
  if(method==='POST'&&path==='/v1/pilot-feedback/consumer')return['SEND_FEEDBACK',body];
  throw new Error('Esta ação não faz parte da demonstração pública.');
}
async function consumerApi(path,options={}){
  const [action,payload]=enumeratedAction(path,options);
  return consumerAction(action,payload,options.retries===0?0:1);
}
async function syncOnboarding(){
  try{const s=await consumerApi('/v1/onboarding/me');onboardingReady=s.status==='ONBOARDED';if(onboardingReady)localStorage.setItem('uai_consumer_onboarded_v017','1');}
  catch{}
}
let onboardingPromptPromise=null;
function closeOnboardingPrompt(result){
  const sheet=qs('onboardingSheet'),backdrop=qs('onboardingBackdrop');
  if(sheet)sheet.hidden=true;if(backdrop)backdrop.hidden=true;document.body.classList.remove('onboarding-open');
  const resolver=onboardingPromptPromise?.resolve;onboardingPromptPromise=null;if(resolver)resolver(result);
}
function requestOnboardingConsent(){
  if(onboardingReady)return Promise.resolve(true);
  if(onboardingPromptPromise)return onboardingPromptPromise.promise;
  const sheet=qs('onboardingSheet'),backdrop=qs('onboardingBackdrop'),accept=qs('onboardingAccept'),cancel=qs('onboardingCancel');
  if(!sheet||!accept)return Promise.resolve(false);
  let resolve;const promise=new Promise(r=>{resolve=r});onboardingPromptPromise={promise,resolve};
  sheet.hidden=false;if(backdrop)backdrop.hidden=false;document.body.classList.add('onboarding-open');
  accept.onclick=async()=>{
    try{setBusy(accept,true,'Registrando…');await consumerApi('/v1/onboarding/consumer',{method:'POST',body:{pilot_terms_version:'consumer-pilot-v0.17',privacy_notice_version:'consumer-pilot-privacy-v0.17',locale:'pt-BR'}});onboardingReady=true;localStorage.setItem('uai_consumer_onboarded_v017','1');if(qs('chatPilotConsent'))qs('chatPilotConsent').checked=true;closeOnboardingPrompt(true);}
    catch(e){toast(e.message,{kind:'error'});}finally{setBusy(accept,false)}
  };
  if(cancel)cancel.onclick=()=>closeOnboardingPrompt(false);if(backdrop)backdrop.onclick=()=>closeOnboardingPrompt(false);
  requestAnimationFrame(()=>accept.focus());return promise;
}
async function ensureOnboarded(){
  if(onboardingReady)return true;
  return requestOnboardingConsent();
}
qs('geo').onclick=()=>{if(!navigator.geolocation)return toast('Localização não disponível neste navegador.',{kind:'error'});setBusy(qs('geo'),true,'Localizando…');navigator.geolocation.getCurrentPosition(p=>{qs('lat').value=p.coords.latitude;qs('lon').value=p.coords.longitude;setBusy(qs('geo'),false);toast('Localização atualizada.',{kind:'success'});},()=>{setBusy(qs('geo'),false);toast('Não consegui acessar sua localização. Você pode continuar informando apenas o bairro ou região.',{kind:'error'});},{enableHighAccuracy:false,timeout:7000,maximumAge:300000});};

function money(p){if(p.price_type==='TO_CONFIRM'||p.amount_minor==null)return'Valor a confirmar';return new Intl.NumberFormat('pt-BR',{style:'currency',currency:p.currency||'BRL'}).format(Number(p.amount_minor)/100)}
function resetFlow(){intentId='';solutionPlanId='';resolutionId='';openQuestionOpportunityId='';setStored('mcir_consumer_intent','');setStored('mcir_consumer_solution_plan','');setStored('mcir_consumer_resolution','');}
function projectStatusLabel(status){return({DRAFT:'Rascunho',ORGANIZING:'Em construção',READY:'Pronto para procurar',RESOLVING:'Procurando / resolvendo',RESOLVED:'Resolvido',ARCHIVED:'Arquivado'})[status]||status;}
function projectLocation(){const lat=Number(qs('lat').value),lon=Number(qs('lon').value),region=qs('region').value.trim();if(Number.isFinite(lat)&&Number.isFinite(lon)&&qs('lat').value&&qs('lon').value)return{lat,lon,region_label:region||null};if(region)return{region_label:region};return null;}
function budgetFromInput(){const raw=qs('budgetMax').value.trim().replace(',','.');if(!raw)return null;const n=Number(raw);if(!Number.isFinite(n)||n<0)throw new Error('Revise o orçamento informado.');return{currency:'BRL',max_minor:Math.round(n*100)};}
function budgetToInput(b){if(!b||b.max_minor==null)return'';return String(Number(b.max_minor)/100).replace('.',',');}

function renderUnderstanding(payload){
  const u=payload?.understanding??payload;if(!u||!u.objective){qs('understandingCard').hidden=true;return;}
  const badge=document.querySelector('.understanding-badge');if(badge)badge.innerHTML='<i></i> ainda não virou procura';
  const note=document.querySelector('.understanding-note');if(note)note.innerHTML='Você pode corrigir ou completar tudo no seu espaço abaixo. Esta leitura só organiza contexto; nenhuma empresa recebe isso até você escolher <strong>Resolver agora</strong>.';
  const facts=Array.isArray(u.explicit_facts)?u.explicit_facts:[];
  const inferred=Array.isArray(u.inferences)?u.inferences:[];
  const missing=[...(Array.isArray(u.critical_questions)?u.critical_questions:[]),...(Array.isArray(u.useful_questions)?u.useful_questions:[])];
  qs('understandingObjective').textContent=u.objective;
  const fill=(wrapId,listId,items)=>{const wrap=qs(wrapId);wrap.hidden=!items.length;qs(listId).innerHTML=items.map(x=>`<li>${esc(x)}</li>`).join('');};
  fill('understandingFactsWrap','understandingFacts',facts);
  fill('understandingInferencesWrap','understandingInferences',inferred);
  fill('understandingMissingWrap','understandingMissing',missing);
  qs('understandingCard').hidden=false;
}
async function previewUnderstanding(text,location){
  const body={text,locale:'pt-BR'};if(location)body.location=location;
  return consumerApi('/v1/consumer/understand',{method:'POST',actorType:'consumer',actorId:actor(),body});
}
async function guideConversation(text){
  const turnText=chatState?.answers?.length?chatState.answers.at(-1)?.answer:chatState?.original;
  return consumerApi('/v1/consumer/chat-guide',{method:'POST',actorType:'consumer',actorId:actor(),body:{text,turn_text:turnText||text,semantic_frame:chatState?.semanticFrame??{},locale:'pt-BR',asked_questions:chatState?.asked??[]}});
}

const templates={
  week:{area:'PURCHASES',title:'Compra da semana',kind:'LIST',text:'Quero organizar minha compra da semana.'},
  vehicle:{area:'VEHICLE',title:'Meu veículo',kind:'PROJECT',text:'Quero acompanhar meu veículo e guardar o que preciso revisar.'},
  pet:{area:'PET',title:'Meu pet',kind:'PROJECT',text:'Quero organizar os cuidados e próximas necessidades do meu pet.'}
};
function seedComposer(t){qs('projectTitleSeed').value=t.title;qs('projectKind').value=t.kind;qs('projectArea').value=t.area||'GENERAL';qs('text').value=t.text;qs('text').focus();qs('text').scrollIntoView({behavior:'smooth',block:'center'});}
for(const b of document.querySelectorAll('[data-template]'))b.onclick=()=>seedComposer(templates[b.dataset.template]);
for(const b of document.querySelectorAll('[data-area-template]'))b.onclick=()=>{const d=AREAS[b.dataset.areaTemplate];seedComposer({area:b.dataset.areaTemplate,title:d.title,kind:d.kind,text:d.goal});};
qs('continueSomething').onclick=()=>qs('projectsSection').scrollIntoView({behavior:'smooth',block:'start'});

async function refreshProjects(){
  try{const r=await consumerApi('/v1/consumer/projects',{actorType:'consumer',actorId:actor()});renderProjects(r.items||[]);syncFeedbackVisibility();if(currentProjectId){const found=(r.items||[]).find(x=>x.project_id===currentProjectId);if(found){currentProject=found;renderProject(found);}}}
  catch{qs('projectsList').innerHTML=emptyState('Seus espaços estão indisponíveis agora','A área de resolução continua disponível; tente atualizar novamente.');}
}
function renderProjects(items){
  if(!items.length){qs('projectsList').innerHTML=emptyState('Nada guardado ainda','Quando você criar uma lista, casa, veículo, pet, evento ou outra necessidade, ela ficará aqui para continuar depois.');return;}
  qs('projectsList').innerHTML=items.slice(0,12).map(p=>{const d=areaDef(p);return`<article class="memory-card ${p.project_id===currentProjectId?'is-current':''}"><div class="memory-card-main"><span class="memory-type">${esc(d.label)}</span><h3>${esc(p.title)}</h3><p>${esc(p.goal)}</p><div class="memory-meta"><span>${esc(projectStatusLabel(p.status))}</span>${p.items?.length?`<span>${p.items.length} ${p.items.length===1?'item':'itens'}</span>`:''}${p.routines?.length?`<span>${p.routines.length} ${p.routines.length===1?'rotina':'rotinas'}</span>`:''}${p.source_project_id?'<span>repetido</span>':''}</div></div><div class="memory-actions"><button class="btn btn-secondary" data-open-project="${esc(p.project_id)}" type="button">${p.status==='RESOLVED'?'Ver':'Continuar'}</button><button class="quiet-action" data-repeat-project="${esc(p.project_id)}" type="button">Repetir</button></div></article>`}).join('');
  for(const b of document.querySelectorAll('[data-open-project]'))b.onclick=()=>loadProject(b.dataset.openProject);
  for(const b of document.querySelectorAll('[data-repeat-project]'))b.onclick=()=>repeatProject(b.dataset.repeatProject,b);
}
async function loadProject(id){try{const p=await consumerApi(`/v1/consumer/projects/${id}`,{actorType:'consumer',actorId:actor()});currentProjectId=id;currentProject=p;setStored('uai_consumer_project',id);if(p.active_intent_id){intentId=p.active_intent_id;setStored('mcir_consumer_intent',intentId);}renderProject(p);await refresh();qs('projectWorkspace').scrollIntoView({behavior:'smooth',block:'start'});}catch(e){toast(e.message,{kind:'error'});}}

function renderAreaMemory(p){
  const d=areaDef(p);qs('workspaceArea').textContent=d.label;qs('itemsTitle').textContent=d.itemsTitle;qs('newItem').placeholder=d.itemPlaceholder;
  if(!d.fields.length){qs('areaMemoryFields').innerHTML='<div class="area-memory-empty"><strong>Sem formulário extra.</strong><span>O que você escreveu acima já é suficiente para continuar organizando.</span></div>';return;}
  qs('areaMemoryFields').innerHTML=`<div class="area-memory-head"><span class="kicker">O que vale lembrar sobre isso</span><p>Preencha só o que ajuda você a não começar do zero depois.</p></div><div class="area-memory-grid">${d.fields.map(f=>`<div class="field ${f.textarea?'memory-wide':''}"><label for="memory-${esc(f.key)}">${esc(f.label)}</label>${f.textarea?`<textarea id="memory-${esc(f.key)}" class="textarea memory-input" data-memory-key="${esc(f.key)}" placeholder="${esc(f.placeholder)}"></textarea>`:`<input id="memory-${esc(f.key)}" class="input memory-input" data-memory-key="${esc(f.key)}" placeholder="${esc(f.placeholder)}">`}</div>`).join('')}</div>`;
  for(const el of document.querySelectorAll('[data-memory-key]')){const v=p.memory?.[el.dataset.memoryKey];el.value=Array.isArray(v)?v.join(', '):(v??'');}
}
function readMemory(){const out={};for(const el of document.querySelectorAll('[data-memory-key]')){const v=el.value.trim();if(v)out[el.dataset.memoryKey]=v;}return out;}
function renderRoutines(p){qs('routineCount').textContent=String(p.routines?.length||0);qs('projectRoutines').innerHTML=p.routines?.length?p.routines.map(r=>`<div class="project-item routine-item"><span><strong>${esc(r.label)}</strong>${r.cadence?`<small>${esc(r.cadence)}</small>`:''}${r.next_due?`<small>Próxima: ${esc(r.next_due)}</small>`:''}</span><button type="button" data-remove-routine="${esc(r.routine_id)}" aria-label="Remover rotina">×</button></div>`).join(''):emptyState('Nenhuma rotina guardada','Use quando algo volta a acontecer: revisão, vacina, reposição ou manutenção.');for(const b of document.querySelectorAll('[data-remove-routine]'))b.onclick=()=>removeRoutine(b.dataset.removeRoutine,b);}
function renderProject(p){
  const d=areaDef(p);qs('projectWorkspace').hidden=false;qs('workspaceTitle').textContent=p.title;qs('projectStatus').textContent=projectStatusLabel(p.status);qs('projectStatus').dataset.status=p.status;qs('projectTitle').value=p.title;qs('projectGoal').value=p.goal;qs('desiredWindow').value=p.desired_window||'';qs('budgetMax').value=budgetToInput(p.budget);qs('projectNotes').value=p.notes||'';qs('projectArea').value=p.area||'GENERAL';renderAreaMemory(p);
  qs('itemCount').textContent=`${p.items?.length||0} ${(p.items?.length||0)===1?'item':'itens'}`;qs('projectItems').innerHTML=p.items?.length?p.items.map(x=>`<div class="project-item"><span>${esc(x.text)}</span><button type="button" data-remove-item="${esc(x.item_id)}" aria-label="Remover ${esc(x.text)}">×</button></div>`).join(''):emptyState('Nada aqui ainda',d.label==='Veículo'?'Adicione sinais, peças ou pendências.':d.label==='Pet'?'Adicione compras e cuidados que não quer esquecer.':'Adicione itens ou pendências quando fizer sentido.');for(const b of document.querySelectorAll('[data-remove-item]'))b.onclick=()=>removeItem(b.dataset.removeItem,b);renderRoutines(p);
  const locked=['RESOLVING','RESOLVED'].includes(p.status);for(const id of ['projectTitle','projectGoal','desiredWindow','budgetMax','projectNotes','newItem','addItem','saveProject','routineLabel','routineCadence','routineNextDue','addRoutine'])qs(id).disabled=locked;for(const el of document.querySelectorAll('[data-memory-key]'))el.disabled=locked;qs('executeProject').disabled=locked;qs('executeProject').querySelector('span').textContent=p.status==='RESOLVING'?'A procura já começou':p.status==='RESOLVED'?'Já foi resolvido':'Resolver agora';
}
async function repeatProject(id,button=null){try{if(button)setBusy(button,true,'Criando cópia…');const p=await consumerApi(`/v1/consumer/projects/${id}/repeat`,{method:'POST',actorType:'consumer',actorId:actor()});resetFlow();currentProjectId=p.project_id;currentProject=p;setStored('uai_consumer_project',p.project_id);renderProject(p);await refreshProjects();qs('projectWorkspace').scrollIntoView({behavior:'smooth',block:'start'});toast('Criei uma cópia. Ela continua só sua até você mandar resolver.',{kind:'success'});}catch(e){toast(e.message,{kind:'error'});}finally{if(button)setBusy(button,false)}}
async function saveProjectData({toastSuccess=true}={}){if(!currentProjectId)throw new Error('Escolha ou crie um espaço primeiro.');const body={title:qs('projectTitle').value.trim(),goal:qs('projectGoal').value.trim(),desired_window:qs('desiredWindow').value.trim()||null,budget:budgetFromInput(),notes:qs('projectNotes').value.trim(),memory:readMemory()};const p=await consumerApi(`/v1/consumer/projects/${currentProjectId}`,{method:'PATCH',actorType:'consumer',actorId:actor(),body});currentProject=p;renderProject(p);await refreshProjects();if(toastSuccess)toast('Atualizado.',{kind:'success'});return p;}
qs('saveProject').onclick=async()=>{const b=qs('saveProject');try{setBusy(b,true,'Salvando…');await saveProjectData();}catch(e){toast(e.message,{kind:'error'});}finally{setBusy(b,false)}};
qs('addItem').onclick=async()=>{const b=qs('addItem');try{if(!currentProjectId)throw new Error('Crie um espaço primeiro.');const text=qs('newItem').value.trim();if(!text)throw new Error('Escreva o item ou pendência.');setBusy(b,true,'Adicionando…');const r=await consumerApi(`/v1/consumer/projects/${currentProjectId}/items`,{method:'POST',actorType:'consumer',actorId:actor(),body:{text}});currentProject=r.project;qs('newItem').value='';renderProject(currentProject);await refreshProjects();}catch(e){toast(e.message,{kind:'error'});}finally{setBusy(b,false)}};
qs('newItem').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();qs('addItem').click();}});
async function removeItem(id,b){try{setBusy(b,true,'…');const p=await consumerApi(`/v1/consumer/projects/${currentProjectId}/items/${id}`,{method:'DELETE',actorType:'consumer',actorId:actor()});currentProject=p;renderProject(p);await refreshProjects();}catch(e){toast(e.message,{kind:'error'});}finally{setBusy(b,false)}}
qs('addRoutine').onclick=async()=>{const b=qs('addRoutine');try{if(!currentProjectId)throw new Error('Crie um espaço primeiro.');const label=qs('routineLabel').value.trim();if(!label)throw new Error('Diga o que volta a acontecer.');setBusy(b,true,'Guardando…');const r=await consumerApi(`/v1/consumer/projects/${currentProjectId}/routines`,{method:'POST',actorType:'consumer',actorId:actor(),body:{label,cadence:qs('routineCadence').value.trim()||null,next_due:qs('routineNextDue').value.trim()||null}});currentProject=r.project;qs('routineLabel').value='';qs('routineCadence').value='';qs('routineNextDue').value='';renderProject(currentProject);await refreshProjects();toast('Rotina guardada.',{kind:'success'});}catch(e){toast(e.message,{kind:'error'});}finally{setBusy(b,false)}};
async function removeRoutine(id,b){try{setBusy(b,true,'…');const p=await consumerApi(`/v1/consumer/projects/${currentProjectId}/routines/${id}`,{method:'DELETE',actorType:'consumer',actorId:actor()});currentProject=p;renderProject(p);await refreshProjects();}catch(e){toast(e.message,{kind:'error'});}finally{setBusy(b,false)}}

async function createFromComposer({button,resolveAfter=false}={}){
  const b=button||qs('create');
  try{
    if(!(await ensureOnboarded()))return;
    const goal=qs('text').value.trim();
    if(goal.length<3)throw new Error('Conte um pouco do que você quer organizar ou resolver.');
    resetFlow();
    setBusy(b,true,resolveAfter?'Entendendo antes de procurar…':'Entendendo e organizando…');
    qs('understandingCard').hidden=true;
    const location=projectLocation();
    const understandingPromise=previewUnderstanding(goal,location).catch(error=>({__understanding_error:error}));
    const body={goal,title:qs('projectTitleSeed').value.trim()||goal.slice(0,72),kind:qs('projectKind').value||'NEED',area:qs('projectArea').value||'GENERAL'};
    if(location)body.location=location;
    const p=await consumerApi('/v1/consumer/projects',{method:'POST',actorType:'consumer',actorId:actor(),body});
    currentProjectId=p.project_id;currentProject=p;setStored('uai_consumer_project',p.project_id);renderProject(p);await refreshProjects();
    const understood=await understandingPromise;
    if(understood?.understanding)renderUnderstanding(understood);else if(understood?.__understanding_error){qs('msg').innerHTML='<div class="status-banner warning"><span class="status-dot"></span><div><strong>Anotei isso.</strong><div class="small muted">A leitura automática não respondeu agora, mas nada foi perdido.</div></div></div>';}else qs('understandingCard').hidden=true;
    if(resolveAfter){
      await startCurrentProjectResolution({skipSave:true});
      const badge=document.querySelector('.understanding-badge');if(badge)badge.innerHTML='<i></i> procura autorizada';
      const note=document.querySelector('.understanding-note');if(note)note.innerHTML='Você escolheu <strong>Resolver agora</strong>. O contexto acima já pode ser usado pelo MCIR para procurar um caminho executável.';
      qs('msg').innerHTML='<div class="status-banner success"><span class="status-dot"></span><div><strong>Você mandou resolver.</strong><div class="small muted">Agora a procura pode trabalhar com o contexto que você acabou de dar.</div></div></div>';
    }else{
      qs('msg').innerHTML='<div class="status-banner success"><span class="status-dot"></span><div><strong>Anotado no Meu Uai Perto.</strong><div class="small muted">Nada foi enviado para empresas. Você pode continuar depois ou mandar resolver quando quiser.</div></div></div>';
      toast('Anotado. A procura ainda não começou.',{kind:'success'});
      qs('projectsSection').scrollIntoView({behavior:'smooth',block:'start'});
    }
    syncFeedbackVisibility();
  }catch(e){if(!e.silent){qs('msg').innerHTML=`<div class="status-banner error"><span class="status-dot"></span><div><strong>Não consegui continuar agora.</strong><div class="small muted">${esc(e.message)}</div></div></div>`;toast(e.message,{kind:'error'});}}finally{setBusy(b,false)}
}
qs('create').onclick=()=>createFromComposer({button:qs('create'),resolveAfter:false});
qs('createResolve').onclick=()=>createFromComposer({button:qs('createResolve'),resolveAfter:true});

async function processResult(r){intentId=r.intent_id;setStored('mcir_consumer_intent',intentId);if(r.status==='READY'){qs('clarifyCard').hidden=true;qs('msg').innerHTML='<div class="status-banner success"><span class="status-dot"></span><div><strong>Entendi o suficiente para começar.</strong><div class="small muted">Agora a procura trabalha por você.</div></div></div>';const m=await consumerApi(`/v1/intents/${intentId}/match`,{method:'POST',actorType:'consumer',actorId:actor()});solutionPlanId=m.solution_plan_id||'';setStored('mcir_consumer_solution_plan',solutionPlanId);}else if(r.status==='REFINING'){qs('clarifyCard').hidden=false;const candidate=r.interpretation?.candidate||{};const unknowns=candidate.critical_unknowns||candidate.unknowns||[];qs('unknowns').textContent=unknowns.length?unknowns.join(' · '):'Preciso de uma informação que muda quem pode resolver.';qs('clarifyCard').scrollIntoView({behavior:'smooth',block:'center'});}await refresh();}
async function startCurrentProjectResolution({button=null,skipSave=false}={}){
  if(!(await ensureOnboarded())){const e=new Error('Ação cancelada.');e.silent=true;throw e;}
  if(!currentProjectId)throw new Error('Crie ou abra algo primeiro.');
  if(!skipSave)await saveProjectData({toastSuccess:false});
  resetFlow();
  const reusableSeed=(chatState.projectId===currentProjectId&&chatState.interpretationSeed)?chatState.interpretationSeed:null;
  const r=await consumerApi(`/v1/consumer/projects/${currentProjectId}/execute`,{method:'POST',actorType:'consumer',actorId:actor(),retries:0,body:reusableSeed?{interpretation_seed:reusableSeed}:{}});
  intentId=r.intent_id;solutionPlanId=r.solution_plan_id||'';setStored('mcir_consumer_intent',intentId);setStored('mcir_consumer_solution_plan',solutionPlanId);
  currentProject=await consumerApi(`/v1/consumer/projects/${currentProjectId}`,{actorType:'consumer',actorId:actor()});renderProject(currentProject);await refreshProjects();
  if(r.status==='REFINING'){
    const candidate=r.interpretation?.candidate||{};const unknowns=candidate.critical_unknowns||candidate.unknowns||[];
    qs('unknowns').textContent=unknowns.length?unknowns.join(' · '):'Preciso de uma informação que muda a solução.';qs('clarifyCard').hidden=false;qs('clarifyCard').scrollIntoView({behavior:'smooth',block:'center'});
  }else{qs('searchCard').hidden=false;qs('searchCard').scrollIntoView({behavior:'smooth',block:'center'});}
  toast('Agora sim: você autorizou a procura.',{kind:'success'});await refresh();
  return r;
}
qs('executeProject').onclick=async()=>{const b=qs('executeProject');try{setBusy(b,true,'Preparando a procura…');await startCurrentProjectResolution({button:b});}catch(e){if(!e.silent)toast(e.message,{kind:'error'});}finally{setBusy(b,false)}};

qs('clarify').onclick=async()=>{const b=qs('clarify');try{if(!qs('answer').value.trim())throw new Error('Responda o detalhe necessário.');setBusy(b,true,'Continuando…');const r=await consumerApi(`/v1/intents/${intentId}/clarify`,{method:'POST',actorType:'consumer',actorId:actor(),body:{answer:qs('answer').value.trim()}});qs('answer').value='';await processResult(r);}catch(e){toast(e.message,{kind:'error'});}finally{setBusy(b,false)}};
qs('sendCompanyAnswer').onclick=async()=>{const b=qs('sendCompanyAnswer');try{if(!openQuestionOpportunityId)throw new Error('Esta pergunta já não está ativa.');if(!qs('companyAnswer').value.trim())throw new Error('Escreva sua resposta.');setBusy(b,true,'Enviando…');await consumerApi(`/v1/opportunities/${openQuestionOpportunityId}/answer`,{method:'POST',actorType:'consumer',actorId:actor(),body:{answer:qs('companyAnswer').value.trim()}});qs('companyAnswer').value='';toast('Resposta enviada. A mesma oportunidade continua.',{kind:'success'});await refresh();}catch(e){toast(e.message,{kind:'error'});}finally{setBusy(b,false)}};
qs('selectSolution').onclick=async()=>{const b=qs('selectSolution');try{const checked=[...document.querySelectorAll('#solutions input[type="radio"]:checked')];const components=[...document.querySelectorAll('#solutions [data-component]')];if(!solutionPlanId||!components.length)throw new Error('A solução não está mais disponível.');if(checked.length!==components.length)throw new Error('Escolha uma opção para cada parte da solução.');setBusy(b,true,'Confirmando solução…');const r=await consumerApi(`/v1/solution-plans/${solutionPlanId}/select`,{method:'POST',actorType:'consumer',actorId:actor(),body:{proposal_ids:checked.map(x=>x.value)}});resolutionId=r.resolution_id;setStored('mcir_consumer_resolution',resolutionId);toast('Solução escolhida. Agora é execução.',{kind:'success'});await refresh();}catch(e){toast(e.message,{kind:'error'});}finally{setBusy(b,false)}};
function showDemoCompletion(){let box=qs('demoMcirCompletion');if(!box){box=document.createElement('section');box.id='demoMcirCompletion';box.className='demo-mcir-completion';box.innerHTML='<span>Experiência concluída</span><h2>Essa foi uma experiência demonstrativa do Uai Perto.</h2><p>As empresas eram fictícias. O mecanismo de entendimento e resolução utilizado foi o MCIR.</p><div><a class="btn btn-primary" href="/participar.html?perfil=consumidor&amp;origem=demo-mcir">Quero participar do pré-lançamento</a><button class="btn btn-secondary" id="resolveAnother" type="button">Resolver outra coisa</button></div>';document.querySelector('.consumer-canvas')?.appendChild(box);qs('resolveAnother').onclick=async()=>{box.remove();await chatReset();openHome();};}box.scrollIntoView({behavior:'smooth',block:'center'});}
qs('confirm').onclick=async()=>{try{await consumerApi(`/v1/resolutions/${resolutionId}/confirm`,{method:'POST',actorType:'consumer',actorId:actor()});if(currentProjectId)try{currentProject=await consumerApi(`/v1/consumer/projects/${currentProjectId}/resolve`,{method:'POST',actorType:'consumer',actorId:actor()});renderProject(currentProject);await refreshProjects();}catch{}toast('Resolvido. Isso também vira aprendizado para a Rede.',{kind:'success'});await refresh();showDemoCompletion();}catch(e){toast(e.message,{kind:'error'});}};
qs('fail').onclick=async()=>{const reason=prompt('O que ainda não foi resolvido?')||'necessidade ainda não resolvida';try{await consumerApi(`/v1/resolutions/${resolutionId}/fail`,{method:'POST',actorType:'consumer',actorId:actor(),body:{reason}});toast('Entendi. A Rede registrou que ainda não resolveu.');await refresh();}catch(e){toast(e.message,{kind:'error'});}};
qs('repeatCurrent').onclick=()=>currentProjectId&&repeatProject(currentProjectId,qs('repeatCurrent'));

function renderOptions(o){const composed=o.mode==='COMPOSED';qs('solutionsTitle').textContent=composed?'Encontrei as partes necessárias para montar a solução':'Encontrei uma solução para você avaliar';qs('solutionsLead').textContent=composed?'Escolha uma opção para cada parte. O Uai Perto só começa a execução quando o conjunto estiver completo.':'Veja escopo, horário e valor antes de decidir.';qs('solutions').innerHTML=o.components.map((c,ci)=>`<section class="solution-component" data-component="${esc(c.component_id)}"><div class="solution-component-head"><span class="badge ${composed?'pulse':''}">${composed?`Parte ${ci+1}`:'Opções'}</span><h3>${esc(c.goal||'Resolver esta parte')}</h3></div><div class="proposal-grid">${c.proposals.length?c.proposals.map(p=>`<label class="proposal-choice"><input type="radio" name="component-${esc(c.component_id)}" value="${esc(p.proposal_id)}" ${c.proposals.length===1?'checked':''}><span class="proposal-card"><strong>${esc(p.company_name)}</strong><span>${esc(p.scope)}</span><span class="proposal-line">${esc(p.availability_window)}</span><b>${esc(money(p))}</b>${(p.conditions||[]).length?`<small>Condições: ${esc(p.conditions.join(' · '))}</small>`:''}</span></label>`).join(''):emptyState('Nenhuma proposta disponível','A procura ainda não fechou esta parte.')}</div></section>`).join('');}
function openQuestion(items){const state=new Map();for(const e of items){if(e.event_type==='OPPORTUNITY_QUESTION_ASKED')state.set(e.opportunity_id,e);if(e.event_type==='OPPORTUNITY_QUESTION_ANSWERED')state.delete(e.opportunity_id);}return[...state.values()].at(-1)||null;}
function humanJourney(items){const types=[];const add=type=>{if(!types.includes(type))types.push(type)};for(const e of items){if(e.event_type==='INTENT_CREATED')add('INTENT_CREATED');if(e.event_type==='CLARIFICATION_REQUIRED')add('CLARIFICATION_REQUIRED');if(e.event_type==='SOLUTION_PLAN_CREATED'||e.event_type==='OPPORTUNITY_SENT')add('SOLUTION_PLAN_CREATED');if(e.event_type==='SOLUTION_PLAN_READY_FOR_SELECTION')add('SOLUTION_PLAN_READY_FOR_SELECTION');if(e.event_type==='SOLUTION_SELECTED'||e.event_type==='RESOLUTION_CREATED')add('RESOLUTION_CREATED');if(e.event_type==='RESOLUTION_EXECUTION_STARTED')add('RESOLUTION_EXECUTION_STARTED');if(e.event_type==='RESOLUTION_READY_FOR_CONSUMER')add('RESOLUTION_READY_FOR_CONSUMER');if(e.event_type==='INTENT_RESOLVED')add('INTENT_RESOLVED');if(e.event_type==='INTENT_UNRESOLVED')add('INTENT_UNRESOLVED');}return renderTimeline(types.map(type=>items.find(e=>e.event_type===type)||{event_type:type,occurred_at:null}));}
async function refresh(){
  qs('clarifyCard').hidden=true;qs('companyQuestionCard').hidden=true;qs('solutionsCard').hidden=true;qs('executionCard').hidden=true;qs('searchCard').hidden=true;
  if(!intentId){qs('feed').innerHTML=emptyState('Nenhuma necessidade em execução','O que está salvo continua em organização e não aciona empresa.');await refreshNotifications();return;}
  try{const f=await consumerApi(`/v1/intents/${intentId}/status-feed`,{actorType:'consumer',actorId:actor()});const items=f.items||[];qs('feed').innerHTML=humanJourney(items);const latestPlan=[...items].reverse().find(x=>x.solution_plan_id)?.solution_plan_id;if(latestPlan){solutionPlanId=latestPlan;setStored('mcir_consumer_solution_plan',solutionPlanId)}const latestRes=[...items].reverse().find(x=>x.resolution_id)?.resolution_id;if(latestRes){resolutionId=latestRes;setStored('mcir_consumer_resolution',resolutionId)}const terminal=[...items].reverse().find(x=>['INTENT_RESOLVED','INTENT_UNRESOLVED'].includes(x.event_type));const question=openQuestion(items);if(question&&!terminal){openQuestionOpportunityId=question.opportunity_id;qs('companyQuestion').textContent=question.question||'A empresa precisa de um detalhe para montar a solução.';qs('companyQuestionCard').hidden=false;}const ready=items.some(x=>x.event_type==='SOLUTION_PLAN_READY_FOR_SELECTION');const selected=items.some(x=>x.event_type==='SOLUTION_SELECTED'||x.event_type==='RESOLUTION_CREATED');if(solutionPlanId&&ready&&!selected&&!terminal){const o=await consumerApi(`/v1/solution-plans/${solutionPlanId}/options`,{actorType:'consumer',actorId:actor()});renderOptions(o);qs('solutionsCard').hidden=false;}else if(!selected&&!terminal&&!question){qs('searchCard').hidden=false;}
    if(resolutionId){const r=await consumerApi(`/v1/resolutions/${resolutionId}`,{actorType:'consumer',actorId:actor()});qs('executionCard').hidden=false;qs('executionBadge').textContent=r.status==='VERIFYING'?'CONFIRME O RESULTADO':r.status==='COMPLETED'?'RESOLVIDO':r.status==='FAILED'?'NÃO RESOLVIDO':'EM ANDAMENTO';qs('executionBadge').className=`badge ${r.status==='COMPLETED'?'success':r.status==='FAILED'?'error':'pulse'}`;qs('executionTitle').textContent=r.status==='COMPLETED'?'Você confirmou: resolveu':r.status==='FAILED'?'A necessidade ainda não terminou':r.status==='VERIFYING'?'As partes terminaram. Resolveu?':'A solução está em execução';qs('executionDetails').innerHTML=`<div class="selected-solution-list">${(r.selected_proposals||[]).map(p=>`<div class="selected-solution"><strong>${esc(p.scope)}</strong><span>${esc(p.availability_window)}</span><b>${esc(money(p))}</b></div>`).join('')}</div>`;qs('confirmBox').hidden=r.status!=='VERIFYING';qs('repeatBox').hidden=r.status!=='COMPLETED';qs('searchCard').hidden=true;qs('solutionsCard').hidden=true;}
    if(terminal?.event_type==='INTENT_RESOLVED'&&currentProjectId&&currentProject?.status==='RESOLVING'&&currentProject.active_intent_id===intentId){try{currentProject=await consumerApi(`/v1/consumer/projects/${currentProjectId}/resolve`,{method:'POST',actorType:'consumer',actorId:actor()});renderProject(currentProject);await refreshProjects();}catch{}}
    if(terminal?.event_type==='INTENT_UNRESOLVED'&&!resolutionId){qs('searchCard').hidden=false;qs('searchTitle').textContent='Ainda não encontrei um caminho completo para resolver.';qs('searchText').textContent='A falta ficou registrada para a Rede saber qual capacidade precisa buscar ou corrigir.';}await refreshNotifications();
  }catch(e){qs('feed').innerHTML=`<div class="status-banner error"><span class="status-dot"></span><div><strong>Não consegui atualizar agora.</strong><div class="small muted">${esc(e.message)}</div></div></div>`;}
}
async function refreshNotifications(){try{const n=await consumerApi('/v1/notifications/me',{actorType:'consumer',actorId:actor()});qs('notifications').innerHTML=n.items.length?n.items.slice(-8).reverse().map(x=>`<div class="notification"><div class="notification-title">${esc(x.title)}</div><div class="notification-body">${esc(x.body)}</div></div>`).join(''):emptyState('Sem novas atualizações','O que realmente exigir sua atenção aparecerá aqui.');}catch{qs('notifications').innerHTML=emptyState('Sem notificações','Não há atualizações disponíveis agora.')}}
qs('openNotifications').onclick=()=>{qs('notificationPanel').open=true;qs('notificationPanel').scrollIntoView({behavior:'smooth',block:'center'})};

for(const b of document.querySelectorAll('[data-phone-nav]'))b.onclick=()=>{
  for(const x of document.querySelectorAll('[data-phone-nav]'))x.classList.toggle('is-active',x===b);
  if(b.dataset.phoneNav==='home')document.querySelector('.assistant-opening')?.scrollIntoView({behavior:'smooth',block:'start'});
  if(b.dataset.phoneNav==='memory')qs('projectsSection')?.scrollIntoView({behavior:'smooth',block:'start'});
  if(b.dataset.phoneNav==='updates'){qs('notificationPanel').open=true;qs('notificationPanel').scrollIntoView({behavior:'smooth',block:'center'});}
};
document.querySelector('[data-phone-nav="home"]')?.classList.add('is-active');

for(const input of document.querySelectorAll('input[name="publication"]'))input.addEventListener('change',()=>{const mode=document.querySelector('input[name="publication"]:checked')?.value||'PRIVATE';qs('pilotFirstNameWrap').hidden=mode!=='FIRST_NAME';if(mode!=='FIRST_NAME')qs('pilotFirstName').value='';});
qs('sendPilotFeedback').onclick=async()=>{const b=qs('sendPilotFeedback');try{const wouldUse=document.querySelector('input[name="wouldUse"]:checked')?.value;if(!wouldUse)throw new Error('Escolha Sim, Talvez ou Não.');const publication=document.querySelector('input[name="publication"]:checked')?.value||'PRIVATE';const firstName=qs('pilotFirstName').value.trim();if(publication==='FIRST_NAME'&&!firstName)throw new Error('Informe seu primeiro nome ou escolha outra opção de publicação.');setBusy(b,true,'Enviando…');await consumerApi('/v1/pilot-feedback/consumer',{method:'POST',actorType:'consumer',actorId:actor(),body:{would_use:wouldUse,comment:qs('pilotComment').value.trim(),publication,first_name:firstName||null,project_id:currentProjectId||null,intent_id:intentId||null,resolution_id:resolutionId||null}});localStorage.setItem(feedbackSentKey,'1');qs('pilotFeedbackForm').hidden=true;qs('pilotFeedbackThanks').hidden=false;toast('Comentário recebido. Obrigado por testar.',{kind:'success'});}catch(e){toast(e.message,{kind:'error'});}finally{setBusy(b,false)}};

await syncOnboarding();
await refreshProjects();
if(currentProjectId)try{await loadProject(currentProjectId);}catch{}
await refresh();
syncFeedbackVisibility();
setInterval(()=>{if(document.visibilityState==='visible')refresh()},6000);

/* Consumer v0.21 — onboarding invisível: valor primeiro, contexto só quando necessário. */
const chatThread=qs('chatThread');
const chatInput=qs('chatInput');
const chatTray=qs('chatActionTray');
const firstResolution=qs('firstResolution');
const needContextStrip=qs('needContextStrip');
const needContextObjective=qs('needContextObjective');
const needContextMeta=qs('needContextMeta');
const chatModeLabel=qs('chatModeLabel');
const freshChat=()=>({original:'',answers:[],asked:[],messages:[],understanding:null,semanticFrame:null,interpretationSeed:null,pendingQuestion:null,projectId:null,stage:'OPEN',solutionRendered:false,canonicalClarifying:false,location:null,locationSkipped:false,pendingResolve:false,urgency:'unknown'});
let chatState=freshChat();
const saveChat=()=>{};
const normalizeQuestion=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
const chatSource=()=>[chatState.original,...chatState.answers.map(x=>`Contexto adicional: ${x.answer}`)].filter(Boolean).join('\n');
const questionLooksLikeLocation=q=>/(bairro|regiao|onde voce esta|localiza|endereco)/.test(normalizeQuestion(q));
function setChatLocation(location){chatState.location=location;chatState.locationSkipped=false;saveChat();if(location?.region_label&&qs('region'))qs('region').value=location.region_label;if(Number.isFinite(location?.lat)&&qs('lat'))qs('lat').value=location.lat;if(Number.isFinite(location?.lon)&&qs('lon'))qs('lon').value=location.lon;syncConversationChrome();}

function conversationMode(){
  const map={OPEN:'Conte do seu jeito',UNDERSTANDING:'Entendendo',READY:'Pronto para resolver',AWAITING_LOCATION:'Só falta onde',MCIR_REFINING:'Ajustando o caminho',RESOLVING:'Montando o caminho',IN_EXECUTION:'Em execução',SAVED:'Guardado',UNRESOLVED:'Rede aprendendo'};
  return map[chatState.stage]||'Seu assistente local';
}
function renderNeedContext(){
  if(!needContextStrip)return;
  const hasNeed=Boolean(chatState.original||chatState.understanding?.objective);
  needContextStrip.hidden=!hasNeed;
  if(!hasNeed)return;
  const objective=String(chatState.understanding?.objective||chatState.original||'').trim();
  needContextObjective.textContent=objective.length>112?objective.slice(0,109)+'…':objective;
  const meta=[];
  if(chatState.location?.region_label)meta.push(chatState.location.region_label);
  else if(Number.isFinite(chatState.location?.lat)&&Number.isFinite(chatState.location?.lon))meta.push('localização aproximada');
  if(chatState.urgency==='critical')meta.push('urgente');
  else if(chatState.urgency==='high')meta.push('prazo próximo');
  needContextMeta.innerHTML=meta.map(x=>`<span>${esc(x)}</span>`).join('');
}
function syncConversationChrome(){
  const started=Boolean(chatState.original||chatState.messages?.length);
  if(firstResolution)firstResolution.hidden=started;
  if(chatModeLabel)chatModeLabel.textContent=conversationMode();
  renderNeedContext();
  document.querySelector('.conversation-home')?.classList.toggle('has-conversation',started);
}
function removeReadyMoment(){document.getElementById('chatReadyMoment')?.remove();}
function renderReadyMoment(){
  if(!chatThread)return;removeReadyMoment();
  const box=document.createElement('aside');box.id='chatReadyMoment';box.className='chat-ready-moment';
  box.innerHTML='<span>Já entendi o suficiente</span><strong>Agora eu posso procurar um caminho.</strong><p>Vou verificar capacidades que façam sentido para o que você contou e para as condições já confirmadas. Nada vira contratação sem você escolher.</p>';
  chatThread.appendChild(box);scrollChat();
}
function removeResolutionProgress(){document.getElementById('chatResolutionProgress')?.remove();}
function renderResolutionProgress(phase='searching'){
  if(!chatThread)return;removeResolutionProgress();
  const doneUnderstand=true;const doneSearch=['assembling','complete'].includes(phase);const doneAssemble=phase==='complete';
  const box=document.createElement('aside');box.id='chatResolutionProgress';box.className='chat-resolution-progress';
  box.innerHTML=`<span>Resolvendo com a Rede</span><ol><li class="done"><b>✓</b><div><strong>Entendi o que precisa acontecer</strong></div></li><li class="${doneSearch?'done':'active'}"><b>${doneSearch?'✓':'·'}</b><div><strong>Procurando capacidades próximas</strong></div></li><li class="${doneAssemble?'done':doneSearch?'active':''}"><b>${doneAssemble?'✓':'·'}</b><div><strong>Montando um caminho executável</strong></div></li></ol>`;
  chatThread.appendChild(box);scrollChat();
}

function scrollChat(){requestAnimationFrame(()=>chatThread?.lastElementChild?.scrollIntoView({behavior:'smooth',block:'nearest'}));}
function messageHtml(text){return esc(String(text||'')).replace(/\n/g,'<br>')}
function chatBubble(role,text,{persist=true,kind='text'}={}){
  if(!chatThread)return null;
  removeReadyMoment();
  const previous=[...chatThread.querySelectorAll('.chat-row')].at(-1);
  const continued=role==='assistant'&&previous?.classList.contains('assistant');
  const row=document.createElement('article');row.className=`chat-row ${role}${kind==='quick_action'?' quick-choice':''}${continued?' continued':''}`;
  row.innerHTML=role==='assistant'?`<div class="chat-avatar" aria-hidden="true">U</div><div class="chat-bubble assistant-bubble"><p>${messageHtml(text)}</p></div>`:`<div class="chat-bubble user-bubble"><p>${messageHtml(text)}</p></div>`;
  chatThread.appendChild(row);
  if(persist){chatState.messages.push({role,text,kind});if(chatState.messages.length>60)chatState.messages=chatState.messages.slice(-60);saveChat();}
  syncConversationChrome();scrollChat();return row;
}
let chatTypingTimer=null;
function chatTyping(show=true,label='Entendendo…'){
  if(chatTypingTimer){clearInterval(chatTypingTimer);chatTypingTimer=null;}document.getElementById('chatTyping')?.remove();if(!show)return;
  const row=document.createElement('article');row.id='chatTyping';row.className='chat-row assistant';row.innerHTML=`<div class="chat-avatar" aria-hidden="true">U</div><div class="chat-bubble assistant-bubble typing"><span>${esc(label)}</span><i></i><i></i><i></i></div>`;chatThread.appendChild(row);scrollChat();
  const labels=['Entendendo o que importa…','Vendo o que realmente falta…','Organizando o próximo passo…'];let i=0;chatTypingTimer=setInterval(()=>{const el=document.querySelector('#chatTyping .typing span');if(el)el.textContent=labels[(++i)%labels.length];},1200);
}
function setChatTray(buttons=[]){
  if(!chatTray)return;chatTray.innerHTML='';chatTray.hidden=!buttons.length;
  for(const spec of buttons){
    const b=document.createElement('button');b.type='button';b.className=`chat-action ${spec.primary?'primary':''}`;b.textContent=spec.label;
    b.onclick=async()=>{
      if(b.dataset.busy==='1')return;
      b.dataset.busy='1';for(const x of chatTray.querySelectorAll('button'))x.disabled=true;
      try{
        if(spec.record!==false)chatBubble('user',spec.userText||spec.label,{kind:'quick_action'});
        setChatTray([]);await spec.onClick?.();
      }catch(e){toast(e.message||'Não consegui continuar agora.',{kind:'error'});}
    };
    chatTray.appendChild(b);
  }
}
function restoreChat(){
  if(!chatThread)return;
  if(chatState.messages.length){chatThread.innerHTML='';for(const m of chatState.messages)chatBubble(m.role,m.text,{persist:false,kind:m.kind});}
  syncConversationChrome();
}
function restoreChatActions(){
  if(!chatThread)return;
  if(chatState.stage==='OPEN'&&!chatState.original){syncConversationChrome();return;}
  if(chatState.stage==='READY'){renderReadyMoment();return setChatTray([{label:'Resolver agora',primary:true,onClick:()=>commitChat(true)},{label:'Só anotar',onClick:()=>commitChat(false)}]);}
  if(chatState.stage==='SAVED')return setChatTray([{label:'Resolver agora',primary:true,onClick:()=>commitChat(true)},{label:'Nova conversa',record:false,onClick:chatReset}]);
  if(chatState.stage==='AWAITING_LOCATION')return setChatTray([{label:'Usar minha localização',primary:true,onClick:useChatGeolocation},{label:'Continuar sem informar',onClick:()=>{chatState.locationSkipped=true;chatState.stage='READY';chatState.pendingResolve=false;saveChat();chatBubble('assistant','Tudo bem. Vou continuar sem usar sua localização agora.');commitChat(true,{skipLocationPrompt:true});}}]);
  if(chatState.stage==='UNRESOLVED')return setChatTray([{label:'Guardar no Meu Uai Perto',onClick:()=>commitChat(false)},{label:'Nova conversa',record:false,onClick:chatReset}]);
  if(chatState.stage==='IN_EXECUTION')return setChatTray([{label:'Ver no Meu Uai Perto',primary:true,record:false,onClick:()=>openMemory()},{label:'Nova conversa',record:false,onClick:chatReset}]);
  if(chatState.stage==='UNDERSTANDING')return setChatTray([{label:'Continuar',primary:true,onClick:()=>analyzeChat()}]);
  setChatTray([]);
}
function removeOpeningActions(){document.getElementById('chatOpeningActions')?.remove();document.getElementById('chatCapabilitiesDynamic')?.closest('.chat-quick-row')?.remove();}
function chooseOpeningQuick(label,action){
  chatBubble('user',label,{kind:'quick_action'});removeOpeningActions();action();
}
function addDynamicOpeningActions(){
  const row=document.createElement('div');row.className='chat-quick-row';row.innerHTML='<button id="chatCapabilitiesDynamic" class="chat-quick" type="button">O que você consegue fazer?</button><button id="chatShowMeDynamic" class="chat-quick quiet" type="button">Me mostra com algo meu</button>';chatThread.appendChild(row);
  row.querySelector('#chatCapabilitiesDynamic').onclick=()=>chooseOpeningQuick('O que você consegue fazer?',showCapabilities);
  row.querySelector('#chatShowMeDynamic').onclick=()=>chooseOpeningQuick('Me mostra com algo meu',showMeWithMine);
}
async function chatReset(){
  await consumerAction('RESET_CONVERSATION',{}).catch(()=>{});chatState=freshChat();chatThread.innerHTML='';removeReadyMoment();removeResolutionProgress();
  setChatTray([]);chatInput.value='';chatInput.placeholder='Conte a situação do seu jeito…';syncConversationChrome();chatInput.focus();
}
function showCapabilities(){
  removeOpeningActions();
  chatBubble('assistant','Eu posso entender uma situação, organizar o que falta, guardar para depois e, quando você mandar, procurar quem consegue resolver perto de você.');
  chatBubble('assistant','Mas é mais fácil mostrar do que explicar: qual é uma coisa real que está pendente na sua vida agora?');
  chatInput.placeholder='Ex.: meu carro está fazendo um barulho…';chatInput.focus();
}
function showMeWithMine(){
  removeOpeningActions();
  chatBubble('assistant','Perfeito. Eu não vou te dar um exemplo pronto. Vamos usar uma coisa sua.');
  chatBubble('assistant','O que está te incomodando, faltando, atrasado ou precisando ser resolvido nos próximos dias?');
  chatInput.placeholder='Conta uma situação real…';chatInput.focus();
}

async function analyzeChat(){
  chatTyping(true,'Entendendo o que importa…');setChatTray([]);
  try{
    const guide=await guideConversation(chatSource());
    chatTyping(false);
    chatState.semanticFrame=guide.semantic_frame??chatState.semanticFrame??null;chatState.interpretationSeed=guide.interpretation_seed??chatState.interpretationSeed??null;
    chatState.understanding={objective:guide.objective||'',explicit_facts:guide.known||[],inferences:[],explicit_constraints:[],critical_questions:guide.next_question?[guide.next_question]:[],useful_questions:(guide.missing||[]).filter(x=>x!==guide.next_question),ambiguities:[]};chatState.urgency=guide.urgency||'unknown';chatState.pendingQuestion=null;saveChat();syncConversationChrome();
    renderUnderstanding({understanding:chatState.understanding});
    if(guide.reply)chatBubble('assistant',guide.reply);
    if(!guide.ready&&guide.next_question){
      const next=guide.next_question;chatState.pendingQuestion=next;chatState.asked.push(next);saveChat();chatBubble('assistant',next);chatInput.placeholder='Responda só esse detalhe…';chatInput.focus();return;
    }
    if(!guide.ready)throw new Error('O Uai Perto está temporariamente indisponível para a demonstração.');
    chatState.stage='READY';saveChat();syncConversationChrome();chatInput.placeholder='Acrescentar outro detalhe…';
    chatBubble('assistant','Já entendi o suficiente para começar.');
    renderReadyMoment();
    setChatTray([{label:'Resolver agora',primary:true,onClick:()=>commitChat(true)},{label:'Só anotar',onClick:()=>commitChat(false)}]);
  }catch{chatTyping(false);chatBubble('assistant','O Uai Perto está temporariamente indisponível para a demonstração.');setChatTray([{label:'Tentar novamente',primary:true,record:false,onClick:()=>analyzeChat()}]);}
}

async function handleChatMessage(text){
  const clean=String(text||'').trim();if(clean.length<2)return;
  if(chatState.stage==='RESOLVING'||chatState.stage==='IN_EXECUTION'){chatBubble('user',clean);chatBubble('assistant','Essa procura já começou. Para não misturar contextos, acompanhe esta necessidade no Meu Uai Perto ou comece uma nova conversa.');return;}
  chatBubble('user',clean);chatInput.value='';
  if(chatState.stage==='AWAITING_LOCATION'){setChatLocation({region_label:clean});chatState.stage='READY';chatState.pendingResolve=false;saveChat();chatBubble('assistant',`Perfeito. Vou usar ${clean} como referência para procurar perto de você.`);await commitChat(true,{skipLocationPrompt:true});return;}
  if(chatState.canonicalClarifying){chatState.answers.push({question:chatState.pendingQuestion||'Detalhe necessário para a procura',answer:clean});chatState.pendingQuestion=null;saveChat();await clarifyCanonicalChat(clean);return;}
  if(!chatState.original)chatState.original=clean;
  else{const q=chatState.pendingQuestion||'Detalhe adicional';chatState.answers.push({question:q,answer:clean});if(questionLooksLikeLocation(q))setChatLocation({region_label:clean});}
  chatState.pendingQuestion=null;chatState.stage='UNDERSTANDING';saveChat();syncConversationChrome();await analyzeChat();
}

async function ensureChatProject(){
  if(!(await ensureOnboarded())){const e=new Error('Ação cancelada.');e.silent=true;throw e;}
  if(chatState.projectId){
    let p=await consumerApi(`/v1/consumer/projects/${chatState.projectId}`,{actorType:'consumer',actorId:actor()});
    if(!['RESOLVING','RESOLVED'].includes(p.status)){const patch={};if(p.goal!==chatSource()){patch.goal=chatSource();patch.title=(chatState.understanding?.objective||chatState.original||p.title).slice(0,120);}if(chatState.location&&JSON.stringify(p.location||null)!==JSON.stringify(chatState.location))patch.location=chatState.location;if(Object.keys(patch).length)p=await consumerApi(`/v1/consumer/projects/${chatState.projectId}`,{method:'PATCH',actorType:'consumer',actorId:actor(),body:patch});}
    currentProjectId=p.project_id;currentProject=p;setStored('uai_consumer_project',p.project_id);return p;
  }
  const goal=chatSource();const title=(chatState.understanding?.objective||chatState.original||'Algo que preciso resolver').slice(0,120);const body={goal,title,kind:'NEED',area:'GENERAL'};if(chatState.location)body.location=chatState.location;
  const p=await consumerApi('/v1/consumer/projects',{method:'POST',actorType:'consumer',actorId:actor(),body});
  currentProjectId=p.project_id;currentProject=p;chatState.projectId=p.project_id;setStored('uai_consumer_project',p.project_id);saveChat();renderProject(p);await refreshProjects();syncFeedbackVisibility();return p;
}

function askLocationForResolution(){
  chatState.stage='AWAITING_LOCATION';chatState.pendingResolve=true;saveChat();
  chatBubble('assistant','Já entendi o que precisamos procurar. Agora me diga em qual bairro ou região de Uberaba, para eu não trazer um caminho que não consegue atender você.');
  chatInput.placeholder='Ex.: Centro, Abadia, Estados Unidos…';chatInput.focus();
  setChatTray([{label:'Usar minha localização',primary:true,onClick:useChatGeolocation},{label:'Continuar sem informar',onClick:()=>{chatState.locationSkipped=true;chatState.stage='READY';chatState.pendingResolve=false;saveChat();chatBubble('assistant','Tudo bem. Vou continuar sem usar sua localização agora.');commitChat(true,{skipLocationPrompt:true});}}]);
}
function useChatGeolocation(){
  if(!navigator.geolocation){toast('Localização não disponível neste navegador.',{kind:'error'});return;}
  setChatTray([]);chatTyping(true);navigator.geolocation.getCurrentPosition(p=>{chatTyping(false);setChatLocation({lat:p.coords.latitude,lon:p.coords.longitude,region_label:null});chatState.stage='READY';chatState.pendingResolve=false;saveChat();chatBubble('assistant','Localização recebida. Vou usar só como referência para procurar perto de você.');commitChat(true,{skipLocationPrompt:true});},()=>{chatTyping(false);chatBubble('assistant','Não consegui acessar sua localização. Você pode escrever só o bairro ou continuar sem informar.');chatState.stage='AWAITING_LOCATION';saveChat();setChatTray([{label:'Continuar sem informar',onClick:()=>{chatState.locationSkipped=true;chatState.stage='READY';saveChat();commitChat(true,{skipLocationPrompt:true});}}]);chatInput.focus();},{enableHighAccuracy:false,timeout:7000,maximumAge:300000});
}
async function commitChat(resolveAfter){const {skipLocationPrompt=false}=arguments[1]||{};
  if(resolveAfter&&!skipLocationPrompt&&!chatState.location&&!chatState.locationSkipped){setChatTray([]);askLocationForResolution();return;}
  try{
    setChatTray([]);removeReadyMoment();chatTyping(false);await ensureChatProject();
    if(!resolveAfter){removeResolutionProgress();chatState.stage='SAVED';saveChat();chatBubble('assistant','Anotado no Meu Uai Perto. Nada foi enviado para empresas. Quando quiser, você pode voltar aqui e mandar resolver.');setChatTray([{label:'Resolver agora',primary:true,onClick:()=>commitChat(true)},{label:'Nova conversa',onClick:chatReset}]);return;}
    renderResolutionProgress('searching');chatState.stage='RESOLVING';saveChat();syncConversationChrome();
    const r=await startCurrentProjectResolution({skipSave:true});renderResolutionProgress('assembling');
    if(r.status==='REFINING'){
      removeResolutionProgress();const unknowns=r.interpretation?.candidate?.critical_unknowns||r.interpretation?.candidate?.unknowns||[];
      const q=unknowns[0]||'Qual detalhe falta para eu continuar?';chatState.pendingQuestion=q;chatState.asked.push(q);chatState.stage='MCIR_REFINING';chatState.canonicalClarifying=true;saveChat();chatBubble('assistant',q);return;
    }
    await chatSyncNetwork();
  }catch(e){
    removeResolutionProgress();
    if(!e.silent){
      const localInference=e.code==='DEPENDENCY_UNAVAILABLE';
      if(localInference){
        const detail=e.details?.ollama==='timeout'?'A IA local demorou mais que o limite para organizar essa procura.':e.details?.ollama_http_status?`A IA local respondeu com falha (${e.details.ollama_http_status}).`:'A IA local não respondeu como esperado.';
        chatState.stage='READY';saveChat();syncConversationChrome();
        chatBubble('assistant',`${detail} O que você contou ficou salvo; nada foi perdido nem enviado duas vezes.`);
        setChatTray([{label:'Tentar IA novamente',primary:true,onClick:()=>commitChat(resolveAfter,{skipLocationPrompt:true})},{label:'Só deixar anotado',onClick:()=>commitChat(false,{skipLocationPrompt:true})}]);
        console.warn('UAI_PERTO_LOCAL_INFERENCE_UNAVAILABLE',{code:e.code,details:e.details,message:e.message});
      }else{
        chatBubble('assistant',`Não consegui continuar a procura agora: ${e.message}`);
        setChatTray([{label:'Tentar novamente',primary:true,onClick:()=>commitChat(resolveAfter,{skipLocationPrompt:true})}]);
      }
    }
  }
  finally{chatTyping(false)}
}

async function clarifyCanonicalChat(answer){
  if(!intentId){chatState.canonicalClarifying=false;chatState.stage='READY';saveChat();await analyzeChat();return;}
  chatTyping(true);
  try{
    const r=await consumerApi(`/v1/intents/${intentId}/clarify`,{method:'POST',actorType:'consumer',actorId:actor(),body:{answer}});
    if(r.status==='REFINING'){
      const unknowns=r.interpretation?.candidate?.critical_unknowns||r.interpretation?.candidate?.unknowns||[];const q=unknowns[0]||'Preciso de mais um detalhe que muda a solução.';chatState.pendingQuestion=q;chatState.asked.push(q);chatState.stage='MCIR_REFINING';saveChat();chatBubble('assistant','Certo. '+q);return;
    }
    chatState.canonicalClarifying=false;chatState.stage='RESOLVING';saveChat();chatBubble('assistant','Agora sim. Tenho o que precisava para procurar um caminho na Rede.');
    const dispatch=await consumerApi(`/v1/intents/${intentId}/match`,{method:'POST',actorType:'consumer',actorId:actor()});solutionPlanId=dispatch.solution_plan_id||'';setStored('mcir_consumer_solution_plan',solutionPlanId);await chatSyncNetwork();
  }catch(e){chatBubble('assistant',`Não consegui usar esse detalhe agora: ${e.message}`);}
  finally{chatTyping(false)}
}

async function chatSyncNetwork(){
  if(!intentId){removeResolutionProgress();chatBubble('assistant','A procura não foi criada. Tente novamente.');return;}
  renderResolutionProgress('assembling');
  const feed=await consumerApi(`/v1/intents/${intentId}/status-feed`,{actorType:'consumer',actorId:actor()});const items=feed.items||[];
  const terminal=[...items].reverse().find(x=>['INTENT_UNRESOLVED','INTENT_RESOLVED'].includes(x.event_type));
  if(terminal?.event_type==='INTENT_UNRESOLVED'){
    removeResolutionProgress();chatState.stage='UNRESOLVED';saveChat();chatBubble('assistant','Procurei na Rede piloto, mas ainda não existe uma capacidade cadastrada que feche essa necessidade. Eu não vou inventar uma empresa. A falta ficou registrada para a Rede aprender o que precisa trazer.');setChatTray([{label:'Guardar no Meu Uai Perto',onClick:()=>commitChat(false)},{label:'Nova conversa',onClick:chatReset}]);return;
  }
  const plan=[...items].reverse().find(x=>x.solution_plan_id)?.solution_plan_id||solutionPlanId;if(plan){solutionPlanId=plan;setStored('mcir_consumer_solution_plan',plan);}
  if(!solutionPlanId){chatBubble('assistant','A procura começou, mas ainda não fechou um caminho. Vou manter isso em acompanhamento.');return;}
  try{
    const options=await consumerApi(`/v1/solution-plans/${solutionPlanId}/options`,{actorType:'consumer',actorId:actor()});
    const complete=(options.components||[]).length>0&&(options.components||[]).every(c=>(c.proposals||[]).length>0);
    if(!complete){chatBubble('assistant','A Rede encontrou capacidade, mas ainda não há uma proposta completa para todas as partes.');return;}
    renderResolutionProgress('complete');setTimeout(()=>{removeResolutionProgress();renderChatSolutions(options);},220);
  }catch{chatBubble('assistant','A procura está ativa. Quando houver um caminho completo, ele aparece aqui.');}
}

function renderChatSolutions(options){
  removeResolutionProgress();if(chatState.solutionRendered)return;chatState.solutionRendered=true;saveChat();
  const composed=options.mode==='COMPOSED';chatBubble('assistant',composed?`Encontrei um caminho piloto com ${options.components.length} partes que precisam funcionar juntas.`:'Encontrei uma capacidade compatível na Rede piloto.');
  const wrap=document.createElement('div');wrap.className='chat-solution-stack';const proposalIds=[];
  for(const [i,c] of (options.components||[]).entries()){
    const p=c.proposals?.[0];if(!p)continue;proposalIds.push(p.proposal_id);
    const card=document.createElement('article');card.className='chat-solution-card';card.innerHTML=`<small>${composed?`PARTE ${i+1}`:'REDE PILOTO'}</small><strong>${esc(c.goal||'Resolver esta parte')}</strong><span>${esc(p.company_name)}</span><p>${esc(p.scope)}</p><div><b>${esc(p.availability_window)}</b><em>${esc(money(p))}</em></div><i>Empresa demonstrativa · não cria contratação real</i>`;wrap.appendChild(card);
  }
  chatThread.appendChild(wrap);scrollChat();
  setChatTray([{label:'Quero este caminho',primary:true,onClick:()=>chooseChatSolution(proposalIds)},{label:'Guardar e decidir depois',onClick:()=>{chatBubble('assistant','Tudo bem. A necessidade continua no Meu Uai Perto para você retomar depois.');setChatTray([{label:'Nova conversa',onClick:chatReset}]);}}]);
}

async function chooseChatSolution(proposalIds){
  try{
    if(!solutionPlanId||!proposalIds.length)throw new Error('Esse caminho não está mais disponível.');setChatTray([]);chatTyping(true);
    const r=await consumerApi(`/v1/solution-plans/${solutionPlanId}/select`,{method:'POST',actorType:'consumer',actorId:actor(),body:{proposal_ids:proposalIds}});resolutionId=r.resolution_id;setStored('mcir_consumer_resolution',resolutionId);chatState.stage='IN_EXECUTION';saveChat();
    const resolution=await consumerApi(`/v1/resolutions/${resolutionId}`,{actorType:'consumer',actorId:actor()});
    chatBubble('assistant',resolution.status==='IN_EXECUTION'?'Caminho escolhido. No ambiente piloto, a execução já entrou em andamento. Em operação real, as atualizações das empresas e do Resolva Aí apareceriam nesta conversa.':'Caminho escolhido. A resolução foi criada e está pronta para acompanhamento.');
    setChatTray([{label:'Ver no Meu Uai Perto',primary:true,onClick:()=>openMemory()},{label:'Nova conversa',onClick:chatReset}]);await refresh();
  }catch(e){chatBubble('assistant',`Não consegui confirmar esse caminho: ${e.message}`);}
  finally{chatTyping(false)}
}

function openHome(){document.body.classList.remove('memory-open','updates-open');qs('conversationHome')?.scrollIntoView({behavior:'smooth',block:'start'});}
function openMemory(){document.body.classList.add('memory-open');document.body.classList.remove('updates-open');qs('projectsSection')?.scrollIntoView({behavior:'smooth',block:'start'});}
function openUpdates(){document.body.classList.add('updates-open');document.body.classList.remove('memory-open');qs('notificationPanel').open=true;qs('notificationPanel')?.scrollIntoView({behavior:'smooth',block:'center'});}
for(const b of document.querySelectorAll('[data-phone-nav]'))b.onclick=()=>{for(const x of document.querySelectorAll('[data-phone-nav]'))x.classList.toggle('is-active',x===b);if(b.dataset.phoneNav==='home')openHome();if(b.dataset.phoneNav==='memory')openMemory();if(b.dataset.phoneNav==='updates')openUpdates();};

qs('chatCapabilities')?.addEventListener('click',()=>chooseOpeningQuick('O que você consegue fazer?',showCapabilities));
qs('chatShowMe')?.addEventListener('click',()=>chooseOpeningQuick('Me mostra com algo meu',showMeWithMine));
for(const button of document.querySelectorAll('[data-first-prompt]'))button.addEventListener('click',async()=>{
  const text=button.dataset.firstPrompt||button.textContent.trim();await handleChatMessage(text);
});
qs('correctNeedContext')?.addEventListener('click',()=>{chatInput.placeholder='Ex.: na verdade, é para amanhã…';chatInput.focus();});
qs('chatComposer')?.addEventListener('submit',async e=>{e.preventDefault();const text=chatInput.value;chatInput.style.height='auto';await handleChatMessage(text)});
chatInput?.addEventListener('input',()=>{chatInput.style.height='auto';chatInput.style.height=`${Math.min(118,Math.max(42,chatInput.scrollHeight))}px`;});
chatInput?.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();qs('chatComposer')?.requestSubmit();}});
const firstPlaceholders=['Meu carro faz barulho quando freio…','Comprei uma torneira e preciso instalar…','Preciso de 30 salgados amanhã às 15h…','Quero organizar as compras da semana…'];
let firstPlaceholderIndex=0;setInterval(()=>{if(chatState.stage==='OPEN'&&!chatState.original&&chatInput&&!chatInput.value&&document.activeElement!==chatInput){chatInput.placeholder=firstPlaceholders[(++firstPlaceholderIndex)%firstPlaceholders.length];}},3800);
restoreChat();restoreChatActions();syncConversationChrome();
