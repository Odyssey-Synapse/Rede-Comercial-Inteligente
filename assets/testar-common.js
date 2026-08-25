function ensureConsumerReadability(){
  if(document.querySelector('link[href^="/assets/testar-readability.css"]'))return;
  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href='/assets/testar-readability.css?v=0.1.1';
  document.head.append(link);
}
ensureConsumerReadability();

const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const unavailable='O Uai Perto está temporariamente indisponível para a demonstração.';
async function startSession(){const response=await fetch('/api/consumer-demo/session',{method:'POST',headers:{'content-type':'application/json'},credentials:'same-origin',body:'{}'});if(!response.ok)throw Object.assign(new Error(unavailable),{status:response.status});}
export async function consumerAction(action,payload={},retries=1){let last;for(let attempt=0;attempt<=retries;attempt++){try{const response=await fetch('/api/consumer-demo/action',{method:'POST',headers:{'content-type':'application/json'},credentials:'same-origin',body:JSON.stringify({action,payload})});if(response.status===401&&attempt<retries){await startSession();continue;}const data=await response.json().catch(()=>({}));if(response.ok)return data;const code=data?.error?.code||`HTTP_${response.status}`;const error=Object.assign(new Error(response.status>=500?unavailable:humanError(code)),{status:response.status,code});if([502,503,504].includes(response.status)&&attempt<retries){await sleep(220*(attempt+1));last=error;continue;}throw error;}catch(error){if(error.status)throw error;last=Object.assign(new Error(unavailable),{status:503});if(attempt<retries){await sleep(220*(attempt+1));continue;}throw last;}}throw last;}
export function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));}
export function qs(id){return document.getElementById(id)}
export function formatDate(v){if(!v)return'';try{return new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}).format(new Date(v))}catch{return String(v)}}
export function formatNumber(v){return new Intl.NumberFormat('pt-BR').format(Number(v)||0)}
export function humanError(code){return ({ONBOARDING_REQUIRED:'Confirme sua participação no teste para continuar.',FORBIDDEN:'Este acesso não tem permissão para esta ação.',UNAUTHORIZED:'Acesso não autorizado.',NOT_FOUND:'Não encontramos este registro.',VALIDATION_ERROR:'Revise os dados informados.',INVALID_JSON:'Não conseguimos interpretar os dados enviados.',RATE_LIMITED:'Muitas ações em sequência. Tente novamente em instantes.',INTERNAL_ERROR:'Não conseguimos concluir esta etapa agora.'})[code]||String(code).replaceAll('_',' ').toLowerCase()}
export function toast(message,{kind='info',timeout=4200}={}){let r=document.querySelector('.toast-region');if(!r){r=document.createElement('div');r.className='toast-region';r.setAttribute('aria-live','polite');r.setAttribute('aria-atomic','false');document.body.append(r)}const t=document.createElement('div');t.className='toast';t.textContent=message;if(kind==='error')t.style.background='#B94343';if(kind==='success')t.style.background='#23845E';r.append(t);setTimeout(()=>t.remove(),timeout)}
export function setBusy(button,busy,label='Aguarde…'){if(!button)return;if(busy){button.dataset.label=button.textContent;button.disabled=true;button.textContent=label}else{button.disabled=false;button.textContent=button.dataset.label||button.textContent}}
export function emptyState(title,body){return `<div class="empty-state"><div class="empty-icon" aria-hidden="true">${icon('circle')}</div><h3>${esc(title)}</h3><p>${esc(body)}</p></div>`}
export function icon(name,size=20){const paths={
  circle:'<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  checkCircle:'<circle cx="12" cy="12" r="9"/><path d="m8 12 2.5 2.5L16 9"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  pin:'<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2"/>',
  shield:'<path d="M12 3 20 6v5c0 5-3.4 8.2-8 10-4.6-1.8-8-5-8-10V6l8-3Z"/><path d="m9 12 2 2 4-4"/>',
  bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7"/><path d="M10 19h4"/>',
  building:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h2M14 7h2M8 11h2M14 11h2M9 21v-5h6v5"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  activity:'<path d="M3 12h4l2-6 4 12 2-6h6"/>',
  layers:'<path d="m12 2 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/>',
  refresh:'<path d="M20 11a8 8 0 1 0 2 5"/><path d="M20 4v7h-7"/>',
  settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.1a1.7 1.7 0 0 0-.4-1.1 1.7 1.7 0 0 0-1-.6 1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.1A1.7 1.7 0 0 0 4.2 9a1.7 1.7 0 0 0 .4-1.1 1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.1a1.7 1.7 0 0 0 .4 1.1 1.7 1.7 0 0 0 1 .4 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.3.35.5.7.6 1.1.08.3.1.6.1.9H21v4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>',
  map:'<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z"/><path d="M9 3v15M15 6v15"/>',
  x:'<path d="m6 6 12 12M18 6 6 18"/>',
  play:'<path d="m8 5 11 7-11 7V5Z"/>',
  flag:'<path d="M5 21V4m0 1h11l-2 4 2 4H5"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>'
};return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.circle}</svg>`}

const eventCopy={
 INTENT_CREATED:['Pedido recebido','Você contou o que precisa resolver.'],
 INTENT_CLARIFICATION_SUBMITTED:['Detalhe recebido','A informação entrou no mesmo pedido; você não precisou começar de novo.'],
 CLARIFICATION_REQUIRED:['Preciso confirmar um detalhe','Só uma informação que muda a solução interrompe a procura.'],
 INTENT_INTERPRETATION_CREATED:['Contexto organizado','O Uai Perto separou o que importa para esta necessidade.'],
 INTENT_READY_FOR_MATCHING:['Pronto para procurar','Já existe contexto suficiente para começar.'],
 SOLUTION_PLAN_CREATED:['Procurando um caminho','A Rede está procurando capacidade compatível com as condições do pedido.'],
 OPPORTUNITY_SENT:['Procurando quem consegue atender','A procura está acontecendo do outro lado sem você ligar empresa por empresa.'],
 OPPORTUNITY_QUESTION_ASKED:['Uma empresa precisa de um detalhe','A pergunta volta para você sem reiniciar a necessidade.'],
 OPPORTUNITY_QUESTION_ANSWERED:['Resposta enviada','A mesma oportunidade continua com o novo contexto.'],
 PROPOSAL_SUBMITTED:['Uma solução chegou','Uma empresa enviou escopo, janela e condições para você avaliar.'],
 SOLUTION_PLAN_READY_FOR_SELECTION:['Solução pronta para avaliar','Já existe pelo menos uma opção para cada parte necessária.'],
 SOLUTION_SELECTED:['Você escolheu a solução','Agora a capacidade escolhida pode ser reservada para execução.'],
 RESOLUTION_CREATED:['Solução confirmada','A busca virou execução.'],
 RESOLUTION_EXECUTION_STARTED:['Em execução','Uma parte da solução começou a ser executada.'],
 PROVIDER_WORK_COMPLETED:['Parte concluída','A empresa informou conclusão da parte dela; isso ainda não substitui sua confirmação.'],
 RESOLUTION_READY_FOR_CONSUMER:['Agora você confirma','Todas as partes informaram conclusão. Diga se resolveu de verdade.'],
 RESOLUTION_COMPLETED:['Resultado confirmado','Você confirmou que a necessidade foi resolvida.'],
 INTENT_RESOLVED:['Resolvido','A necessidade terminou com confirmação do consumidor.'],
 RESOLUTION_FAILED:['Ainda não resolveu','O resultado não encerrou a necessidade.'],
 INTENT_UNRESOLVED:['Ainda sem solução completa','A falta ficou registrada para a Rede aprender onde precisa melhorar.'],
 CAPACITY_GAP_OBSERVED:['Faltou capacidade acessível','A Rede registrou onde não conseguiu formar uma solução.']
}
export function eventLabel(type){return eventCopy[type]?.[0]||String(type||'').replaceAll('_',' ').toLowerCase().replace(/^./,c=>c.toUpperCase())}
export function eventDescription(type){return eventCopy[type]?.[1]||''}
export function renderTimeline(items=[]){if(!items.length)return emptyState('Nenhuma necessidade ativa','Quando você enviar uma necessidade, o andamento aparecerá aqui.');return `<div class="timeline">${items.map((x,i)=>{const success=['INTENT_RESOLVED','RESOLUTION_COMPLETED'].includes(x.event_type);return `<div class="timeline-item ${success?'success':'done'}"><div class="timeline-rail"><span class="timeline-node"></span></div><div class="timeline-copy"><div class="timeline-title">${esc(eventLabel(x.event_type))}</div>${eventDescription(x.event_type)?`<div class="muted small">${esc(eventDescription(x.event_type))}</div>`:''}<div class="timeline-meta">${esc(formatDate(x.occurred_at))}</div></div></div>`}).join('')}</div>`}
export function registerServiceWorker(){}