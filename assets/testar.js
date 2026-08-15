import {SCENARIOS,advanceState,beginScenario,chooseAnswer,scenarioView} from './testar-flow.mjs';

const start=document.querySelector('#demo-start');
const stage=document.querySelector('#demo-stage');
const content=document.querySelector('#stage-content');
const title=document.querySelector('#stage-title');
const step=document.querySelector('#stage-step');
const completion=document.querySelector('#demo-complete');
const completeRequest=document.querySelector('#complete-request');
const completeSummary=document.querySelector('#complete-summary');
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
let state=null;
let transitionTimer=null;

const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'
}[char]));

function clearTransition(){
  if(transitionTimer)clearTimeout(transitionTimer);
  transitionTimer=null;
}

function scheduleTransition(delay){
  clearTransition();
  transitionTimer=setTimeout(()=>{
    state=advanceState(state);
    render();
  },reducedMotion?30:delay);
}

function conversation(scenario,variant){
  return `<div class="conversation">
    <article class="message user"><small>Você</small><p>${esc(scenario.userText)}</p></article>
    <article class="message assistant"><small>Uai Perto</small><p>${esc(scenario.question)}</p></article>
    ${variant?`<article class="message user"><small>Você</small><p>${esc(variant.answer)}</p></article><article class="message assistant"><small>Uai Perto</small><p>${esc(variant.response)}</p></article>`:''}
  </div>`;
}

function renderQuestion(scenario){
  content.innerHTML=`${conversation(scenario,null)}<div class="choice-panel"><span>Escolha uma resposta para continuar</span>${scenario.options.map(option=>`<button class="choice-button" type="button" data-answer="${esc(option.id)}">${esc(option.label)}</button>`).join('')}</div>`;
  content.querySelectorAll('[data-answer]').forEach(button=>button.addEventListener('click',()=>{
    state=chooseAnswer(state,button.dataset.answer);
    render();
  }));
}

function renderProgress(scenario,variant){
  content.innerHTML=`${conversation(scenario,variant)}<section class="context-card" aria-label="Progresso da resolução"><small>ORGANIZANDO O PEDIDO</small><ul class="check-list">${variant.progress.map(item=>`<li>${esc(item)}</li>`).join('')}</ul><div class="search-state"><span class="search-pulse" aria-hidden="true"></span><span>Procurando uma combinação possível na Rede...</span></div></section>`;
  scheduleTransition(1500);
}

function renderSolution(scenario,variant){
  content.innerHTML=`${conversation(scenario,variant)}<section class="solution-preview"><small>CAMINHO ENCONTRADO</small><h2>Encontrei um caminho demonstrativo.</h2><p>${esc(variant.summary)}.</p><div class="availability-row"><div><small>Disponibilidade</small><strong>Demonstrativa</strong></div><div><small>Valores</small><strong>Demonstrativos</strong></div></div><button class="primary-action" id="view-solution" type="button">Ver solução</button></section>`;
  document.querySelector('#view-solution')?.addEventListener('click',()=>{state=advanceState(state);render()});
}

function renderDetails(scenario,variant){
  content.innerHTML=`${conversation(scenario,variant)}<section class="solution-preview"><small>SUA SOLUÇÃO DEMONSTRATIVA</small><h2>${esc(variant.summary)}</h2><div class="path-list">${variant.path.map(([number,name,description])=>`<article class="path-card"><span>${esc(number)}</span><div><strong>${esc(name)}</strong><p>${esc(description)}</p></div></article>`).join('')}</div><p class="price-note"><b>Referência:</b> ${esc(variant.estimate)}. Disponibilidade e valores são apenas demonstrativos.</p><div class="detail-actions"><button class="primary-action" id="choose-solution" type="button">Escolher esta solução</button><button class="secondary-action" id="choose-another" type="button">Voltar às situações</button></div></section>`;
  document.querySelector('#choose-solution')?.addEventListener('click',()=>{state=advanceState(state);render()});
  document.querySelector('#choose-another')?.addEventListener('click',restartDemo);
}

function renderOrganizing(){
  content.innerHTML=`<section class="organizing-card"><span class="search-pulse" aria-hidden="true"></span><h2>Organizando sua solução...</h2><p>Reunindo o caminho escolhido em uma experiência simples para você acompanhar.</p></section>`;
  scheduleTransition(1100);
}

function renderComplete(scenario,variant){
  stage.hidden=true;
  completion.hidden=false;
  completeRequest.textContent=`“${scenario.prompt}”`;
  completeSummary.textContent=variant.summary;
  completion.focus({preventScroll:true});
  completion.scrollIntoView({behavior:reducedMotion?'auto':'smooth',block:'start'});
}

function render(){
  clearTransition();
  const view=scenarioView(state);
  if(!view)return restartDemo();
  const {scenario,variant}=view;
  start.hidden=true;
  completion.hidden=true;
  stage.hidden=false;
  title.textContent=scenario.prompt;
  const steps={question:'1 de 5',progress:'2 de 5',solution:'3 de 5',details:'4 de 5',organizing:'5 de 5'};
  step.textContent=steps[state.phase]||'5 de 5';
  if(state.phase==='question')renderQuestion(scenario);
  if(state.phase==='progress')renderProgress(scenario,variant);
  if(state.phase==='solution')renderSolution(scenario,variant);
  if(state.phase==='details')renderDetails(scenario,variant);
  if(state.phase==='organizing')renderOrganizing();
  if(state.phase==='complete')renderComplete(scenario,variant);
}

function startScenario(scenarioId){
  state=beginScenario(scenarioId);
  render();
  stage.focus({preventScroll:true});
  stage.scrollIntoView({behavior:reducedMotion?'auto':'smooth',block:'start'});
}

function restartDemo(){
  clearTransition();
  state=null;
  content.replaceChildren();
  stage.hidden=true;
  completion.hidden=true;
  start.hidden=false;
  document.querySelector('[data-scenario]')?.focus({preventScroll:true});
  start.scrollIntoView({behavior:reducedMotion?'auto':'smooth',block:'start'});
}

document.querySelectorAll('[data-scenario]').forEach(button=>button.addEventListener('click',()=>startScenario(button.dataset.scenario)));
document.querySelector('#restart-top')?.addEventListener('click',restartDemo);
document.querySelector('#restart-demo')?.addEventListener('click',restartDemo);

// Mantém os três roteiros disponíveis para tecnologias assistivas e testes de contrato.
document.documentElement.dataset.demoScenarios=String(Object.keys(SCENARIOS).length);
