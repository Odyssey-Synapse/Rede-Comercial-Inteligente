const STORAGE_KEY='uai-consumer-contexts-v01';

const experiences={
  compras:{
    icon:'🛒',name:'Minha Lista de Compras',type:'Lista inteligente',engines:['Lista','Rotina'],
    description:'Vá anotando o que falta durante a semana. Quando quiser comprar, transforme a lista em um pedido único.',
    fields:[
      {name:'title',label:'Nome da lista',placeholder:'Ex.: Compra da semana',required:true},
      {name:'items',label:'O que já entrou na lista?',type:'textarea',placeholder:'Ex.: arroz 5 kg\nleite integral 6 unidades\ncarne para bife 1,5 kg',required:true,full:true},
      {name:'preferences',label:'Preferências e substituições',type:'textarea',placeholder:'Ex.: leite pode ser qualquer marca; arroz prefiro tipo 1; não substituir café.',full:true},
      {name:'budget',label:'Orçamento aproximado',placeholder:'Ex.: até R$ 350'},
      {name:'when',label:'Quando pretende comprar?',type:'select',options:['Ainda estou montando','Hoje','Amanhã','Nesta semana','Sem prazo definido']}
    ],
    summary:c=>`Comprar os itens da lista “${c.title}”${c.budget?` dentro de ${c.budget}`:''}.`,
    context:c=>`Itens: ${c.items}. Preferências: ${c.preferences||'nenhuma informada'}. Prazo: ${c.when||'não definido'}.`
  },
  casa:{
    icon:'🏠',name:'Minha Casa / Projeto',type:'Projeto de casa',engines:['Projeto','Lista'],
    description:'Organize uma reforma ou manutenção por etapas, com medidas, pendências e materiais antes de contratar alguém.',
    fields:[
      {name:'title',label:'Nome do projeto',placeholder:'Ex.: Reforma do banheiro',required:true},
      {name:'goal',label:'O que você quer concluir?',type:'textarea',placeholder:'Ex.: trocar chuveiro, instalar 4 tomadas, trocar torneira e pintar.',required:true,full:true},
      {name:'currentStage',label:'Etapa atual',type:'select',options:['Só organizando','Levantando medidas','Cotando materiais','Pronto para executar uma etapa','Em andamento']},
      {name:'details',label:'Medidas, materiais e observações',type:'textarea',placeholder:'Ex.: piso 12 m²; ainda preciso medir a parede do box.',full:true},
      {name:'budget',label:'Orçamento aproximado',placeholder:'Ex.: até R$ 2.500'},
      {name:'next',label:'Qual parte quer resolver primeiro?',placeholder:'Ex.: parte elétrica'}
    ],
    summary:c=>`Executar a próxima etapa do projeto “${c.title}”: ${c.next||c.goal}.`,
    context:c=>`Objetivo completo: ${c.goal}. Etapa: ${c.currentStage||'não informada'}. Detalhes: ${c.details||'nenhum'}. Orçamento: ${c.budget||'não definido'}.`
  },
  veiculo:{
    icon:'🚗',name:'Meu Veículo',type:'Garagem inteligente',engines:['Perfil','Rotina'],
    description:'Guarde quilometragem, revisões e pendências. Quando algo vencer ou apresentar problema, o contexto já está pronto.',
    fields:[
      {name:'title',label:'Como quer identificar o veículo?',placeholder:'Ex.: Minha CG 160',required:true},
      {name:'model',label:'Marca / modelo / ano',placeholder:'Ex.: Honda CG 160 2023',required:true},
      {name:'km',label:'Quilometragem atual',placeholder:'Ex.: 38.400 km'},
      {name:'history',label:'Últimos serviços',type:'textarea',placeholder:'Ex.: óleo aos 36.000 km; relação aos 32.000 km.',full:true},
      {name:'pending',label:'Pendências ou sinais percebidos',type:'textarea',placeholder:'Ex.: pneu traseiro gasto; freio começou a chiar.',required:true,full:true},
      {name:'when',label:'Quando quer cuidar disso?',type:'select',options:['Só quero acompanhar','Hoje','Nos próximos dias','Na próxima revisão','Antes de viajar']}
    ],
    summary:c=>`Avaliar e resolver as pendências do ${c.model}: ${c.pending}.`,
    context:c=>`Veículo: ${c.model}. Quilometragem: ${c.km||'não informada'}. Histórico: ${c.history||'não informado'}. Prazo: ${c.when||'não definido'}.`
  },
  pet:{
    icon:'🐶',name:'Meu Pet',type:'Perfil do pet',engines:['Perfil','Rotina','Lista'],
    description:'Centralize alimentação, vacinas, cuidados e histórico do pet para não começar do zero toda vez que precisar de algo.',
    fields:[
      {name:'title',label:'Nome do pet',placeholder:'Ex.: Luna',required:true},
      {name:'profile',label:'Espécie, idade e peso',placeholder:'Ex.: cadela, 4 anos, 12 kg',required:true},
      {name:'food',label:'Alimentação atual',placeholder:'Ex.: ração X adulto porte médio'},
      {name:'routine',label:'Rotinas e cuidados',type:'textarea',placeholder:'Ex.: vacina anual em setembro; banho a cada 20 dias.',full:true},
      {name:'restrictions',label:'Alergias, medicamentos ou observações',type:'textarea',placeholder:'Ex.: alergia a frango; usa medicação prescrita.',full:true},
      {name:'need',label:'O que está próximo de precisar?',placeholder:'Ex.: vacina anual / comprar ração / banho e tosa'}
    ],
    summary:c=>`Resolver para ${c.title}: ${c.need||'uma necessidade baseada no perfil e rotina do pet'}.`,
    context:c=>`Perfil: ${c.profile}. Alimentação: ${c.food||'não informada'}. Rotina: ${c.routine||'não informada'}. Restrições: ${c.restrictions||'nenhuma informada'}.`
  },
  evento:{
    icon:'🎉',name:'Meu Evento',type:'Projeto de evento',engines:['Projeto','Lista'],
    description:'Monte o evento por partes e só procure fornecedores quando cada etapa estiver madura para contratação.',
    fields:[
      {name:'title',label:'Nome do evento',placeholder:'Ex.: Aniversário de 30 anos',required:true},
      {name:'date',label:'Data prevista',type:'date'},
      {name:'guests',label:'Quantidade aproximada de pessoas',placeholder:'Ex.: 60 pessoas'},
      {name:'budget',label:'Orçamento total ou desta etapa',placeholder:'Ex.: até R$ 5.000'},
      {name:'needs',label:'O que o evento vai precisar?',type:'textarea',placeholder:'Ex.: salão, buffet, bolo, decoração, fotógrafo e som.',required:true,full:true},
      {name:'next',label:'Qual parte quer contratar primeiro?',placeholder:'Ex.: buffet'}
    ],
    summary:c=>`Encontrar solução para a próxima parte do evento “${c.title}”: ${c.next||c.needs}.`,
    context:c=>`Data: ${c.date||'não definida'}. Pessoas: ${c.guests||'não informado'}. Necessidades: ${c.needs}. Orçamento: ${c.budget||'não definido'}.`
  }
};

let contexts=load();
let editingId=null;
const grid=document.querySelector('#context-grid');
const empty=document.querySelector('#consumer-empty');
const experienceGrid=document.querySelector('#experience-grid');
const modal=document.querySelector('#consumer-modal');
const form=document.querySelector('#context-form');
const modalTitle=document.querySelector('#modal-title');
const modalKicker=document.querySelector('#modal-kicker');
const intentDrawer=document.querySelector('#intent-drawer');
const intentContent=document.querySelector('#intent-content');

function load(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]')}catch{return []}}
function save(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(contexts))}catch{}renderContexts()}
function esc(v=''){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function toast(text){const old=document.querySelector('.consumer-toast');old?.remove();const el=document.createElement('div');el.className='consumer-toast';el.textContent=text;document.body.appendChild(el);setTimeout(()=>el.remove(),2600)}
function uid(){return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`}

function renderExperiences(){
  experienceGrid.innerHTML=Object.entries(experiences).map(([key,x])=>`<article class="experience-choice" data-create="${key}"><div class="experience-icon">${x.icon}</div><span class="context-type">${esc(x.type)}</span><h3>${esc(x.name)}</h3><p>${esc(x.description)}</p><div class="engine-tags">${x.engines.map(e=>`<span>${e}</span>`).join('')}</div><button class="button button-ghost button-full" type="button">Criar →</button></article>`).join('');
  experienceGrid.querySelectorAll('[data-create]').forEach(el=>el.addEventListener('click',()=>openForm(el.dataset.create)));
}

function renderContexts(){
  empty.hidden=contexts.length>0;
  grid.innerHTML=contexts.map(c=>{const x=experiences[c.experience];return `<article class="context-card"><div class="context-top"><div class="context-icon">${x.icon}</div><button class="context-delete" type="button" data-delete="${c.id}" aria-label="Excluir">×</button></div><span class="context-type">${esc(x.type)}</span><h3>${esc(c.title||x.name)}</h3><p>${esc(preview(c,x))}</p><div class="engine-tags">${x.engines.map(e=>`<span>${e}</span>`).join('')}</div><div class="context-meta"><small>Atualizado ${new Date(c.updatedAt).toLocaleDateString('pt-BR')}</small></div><div class="context-actions"><button class="button button-ghost" type="button" data-edit="${c.id}">Continuar</button><button class="button button-primary" type="button" data-resolve="${c.id}">Resolver agora</button></div></article>`}).join('');
  grid.querySelectorAll('[data-delete]').forEach(b=>b.addEventListener('click',()=>removeContext(b.dataset.delete)));
  grid.querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click',()=>editContext(b.dataset.edit)));
  grid.querySelectorAll('[data-resolve]').forEach(b=>b.addEventListener('click',()=>resolveContext(b.dataset.resolve)));
}
function preview(c,x){
  if(c.experience==='compras')return (c.items||'Lista em construção').split('\n').filter(Boolean).slice(0,3).join(' · ');
  if(c.experience==='casa')return c.next?`Próxima etapa: ${c.next}`:(c.goal||x.description);
  if(c.experience==='veiculo')return c.pending||`${c.model||'Veículo'} sendo acompanhado`;
  if(c.experience==='pet')return c.need||`${c.profile||'Perfil'} · rotina sendo acompanhada`;
  return c.next?`Próxima contratação: ${c.next}`:(c.needs||x.description);
}

function openForm(type,data=null){
  const x=experiences[type];if(!x)return;
  editingId=data?.id||null;
  modalKicker.textContent=data?'CONTINUAR CONTEXTO':'NOVO CONTEXTO';
  modalTitle.textContent=data?`Atualizar ${x.name}`:`Criar ${x.name}`;
  form.innerHTML=x.fields.map(f=>fieldHtml(f,data?.[f.name]||'')).join('')+`<div class="form-actions"><button class="button button-ghost" type="button" data-close-modal>Cancelar</button><button class="button button-primary" type="submit">${data?'Salvar atualização':'Criar e guardar'}</button></div>`;
  form.dataset.type=type;
  form.querySelectorAll('[data-close-modal]').forEach(b=>b.addEventListener('click',closeModal));
  modal.hidden=false;
  setTimeout(()=>form.querySelector('input,textarea,select')?.focus(),30);
}
function fieldHtml(f,value){
  const cls=`form-field${f.full?' full':''}`;const req=f.required?' required':'';const label=`<label for="ctx-${f.name}">${esc(f.label)}</label>`;
  if(f.type==='textarea')return `<div class="${cls}">${label}<textarea id="ctx-${f.name}" name="${f.name}"${req} placeholder="${esc(f.placeholder||'')}">${esc(value)}</textarea></div>`;
  if(f.type==='select')return `<div class="${cls}">${label}<select id="ctx-${f.name}" name="${f.name}"${req}><option value="">Selecione</option>${f.options.map(o=>`<option${o===value?' selected':''}>${esc(o)}</option>`).join('')}</select></div>`;
  return `<div class="${cls}">${label}<input id="ctx-${f.name}" name="${f.name}" type="${f.type||'text'}" value="${esc(value)}"${req} placeholder="${esc(f.placeholder||'')}"></div>`;
}
function closeModal(){modal.hidden=true;editingId=null;form.innerHTML=''}
function editContext(id){const c=contexts.find(x=>x.id===id);if(c)openForm(c.experience,c)}
function removeContext(id){if(!confirm('Excluir este contexto salvo?'))return;contexts=contexts.filter(c=>c.id!==id);save();toast('Contexto removido.')}

form.addEventListener('submit',e=>{
  e.preventDefault();if(!form.checkValidity()){form.reportValidity();return}
  const type=form.dataset.type;const values=Object.fromEntries(new FormData(form).entries());const now=new Date().toISOString();
  if(editingId){const i=contexts.findIndex(c=>c.id===editingId);contexts[i]={...contexts[i],...values,updatedAt:now}}
  else contexts.unshift({id:uid(),experience:type,...values,createdAt:now,updatedAt:now});
  save();closeModal();toast(editingId?'Contexto atualizado.':'Guardado. Você pode continuar depois.');
});

function buildIntent(c){const x=experiences[c.experience];return {title:x.summary(c),context:x.context(c),source:`Consumer/${x.type}`,engines:x.engines,contextId:c.id}}
function resolveContext(id){const c=contexts.find(x=>x.id===id);if(!c)return;showIntent(buildIntent(c),c)}
function showIntent(intent,c=null){
  intentContent.innerHTML=`<div class="intent-summary"><small>PEDIDO PREPARADO</small><strong>${esc(intent.title)}</strong></div><div class="intent-block"><h3>Contexto que acompanha o pedido</h3><p>${esc(intent.context)}</p></div><div class="intent-flow"><span>Contexto salvo</span><i>→</i><span>Autorização do usuário</span><i>→</i><span>Intent</span><i>→</i><span>MCIR</span></div><div class="intent-warning">Nesta versão demonstrativa, “Autorizar procura” prepara e registra a Intent localmente. Ainda não dispara empresas reais nem promete disponibilidade.</div><div class="intent-actions"><button class="button button-ghost" type="button" data-close-intent>Continuar organizando</button><button class="button button-primary" type="button" id="authorize-intent">Autorizar procura →</button></div>`;
  intentDrawer.hidden=false;
  intentContent.querySelector('[data-close-intent]')?.addEventListener('click',closeIntent);
  document.querySelector('#authorize-intent')?.addEventListener('click',()=>{
    try{localStorage.setItem('uai-consumer-last-intent',JSON.stringify({...intent,authorizedAt:new Date().toISOString()}))}catch{}
    if(c){c.lastAuthorizedAt=new Date().toISOString();c.updatedAt=c.lastAuthorizedAt;save()}
    closeIntent();toast('Pedido autorizado e preparado para o MCIR.');
  });
}
function closeIntent(){intentDrawer.hidden=true;intentContent.innerHTML=''}

document.querySelectorAll('[data-close-modal]').forEach(b=>b.addEventListener('click',closeModal));
document.querySelectorAll('[data-close-intent]').forEach(b=>b.addEventListener('click',closeIntent));
document.querySelector('#create-context')?.addEventListener('click',()=>{document.querySelector('#experiencias')?.scrollIntoView({behavior:'smooth'});toast('Escolha abaixo o que você quer organizar.')});

document.querySelector('#quick-intent-form')?.addEventListener('submit',e=>{
  e.preventDefault();const text=document.querySelector('#quick-intent').value.trim();if(text.length<5)return;
  showIntent({title:text,context:'Pedido criado diretamente pelo consumidor, sem contexto salvo anterior.',source:'Consumer/Resolver agora',engines:['Intent direta']});
});

renderExperiences();renderContexts();
