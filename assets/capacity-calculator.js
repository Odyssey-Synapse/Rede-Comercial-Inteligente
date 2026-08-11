const form=document.querySelector('#capacity-calculator');
const result=document.querySelector('#capacity-result');

const money=value=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(value);
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));

const bands=[
  {min:0,max:1,name:'Essencial',monthly:79},
  {min:2,max:3,name:'Ativo',monthly:99},
  {min:4,max:6,name:'Estruturado',monthly:139},
  {min:7,max:9,name:'Integrado',monthly:179},
  {min:10,max:12,name:'Expandido',monthly:229},
];

function selectedText(id){const el=document.querySelector(id);return el?.selectedOptions?.[0]?.textContent||''}
function selectedValue(id){return document.querySelector(id)?.value??''}

function enterpriseResult(reason){
  result.innerHTML=`
    <div class="quote-status"><span class="eyebrow">ENQUADRAMENTO ESTIMADO</span><span class="quote-badge preview">SIMULAÇÃO</span></div>
    <div class="price-display"><small>Faixa de referência</small><strong>Empresarial</strong></div>
    <div class="basis-note"><strong>Por que:</strong> ${escapeHtml(reason)} exige avaliação individual da estrutura operacional e da integração antes de formar uma referência comercial.</div>
    <div class="quote-meta"><div><small>Adesão</small><strong>Sob avaliação</strong></div><div><small>Rede inicial</small><strong>MRR R$ 0 se confirmado entre os 54</strong></div><div><small>Entrada posterior</small><strong>Condição definida antes do aceite</strong></div></div>
    <div class="quote-actions"><a class="button button-primary" href="/contato.html?assunto=Quero%20participar%20como%20empresa">Solicitar avaliação</a><button class="button button-ghost" id="reset-capacity" type="button">Refazer simulação</button></div>
    <p class="fine">Este resultado não é proposta, contrato nem reserva de posição na rede inicial.</p>`;
  document.querySelector('#reset-capacity')?.addEventListener('click',reset);
}

function reset(){form?.reset();result.innerHTML='<div class="result-empty"><div><div class="orb">RLI</div><h3>Veja sua referência antes de decidir.</h3><p>Preencha os quatro pontos da operação para visualizar o enquadramento estimado, a adesão de referência e como funcionam os dois regimes de entrada.</p></div></div>';form?.scrollIntoView({behavior:'smooth',block:'center'})}

form?.addEventListener('submit',event=>{
  event.preventDefault();
  const cores=selectedValue('#operational-cores');
  const simultaneous=selectedValue('#simultaneous-operations');
  const units=selectedValue('#active-units');
  const integration=selectedValue('#integration-level');
  if([cores,simultaneous,units,integration].some(v=>v==='')){
    result.innerHTML='<div class="result-empty"><div><div class="orb">!</div><h3>Faltam informações.</h3><p>Selecione os quatro pontos da estrutura operacional para calcular a referência.</p></div></div>';
    return;
  }
  if(units==='enterprise')return enterpriseResult('Cinco ou mais unidades operacionais ativas');
  if(integration==='enterprise')return enterpriseResult('Integração customizada');

  const score=Number(cores)+Number(simultaneous)+Number(units)+Number(integration);
  const band=bands.find(item=>score>=item.min&&score<=item.max);
  if(!band)return enterpriseResult('A combinação informada ultrapassa as faixas padronizadas');

  const adhesion=band.monthly*3;
  result.innerHTML=`
    <div class="quote-status"><span class="eyebrow">ENQUADRAMENTO ESTIMADO</span><span class="quote-badge preview">SIMULAÇÃO</span></div>
    <div class="quote-company"><small>Faixa de referência</small><strong>${band.name}</strong><span>estimada a partir da estrutura operacional informada</span></div>
    <div class="price-display"><small>Mensalidade de referência</small><strong>${money(band.monthly)}</strong><span>/ mês</span></div>
    <div class="price-lines">
      <div class="price-line"><span>Adesão de referência</span><strong>${money(adhesion)}</strong></div>
    </div>
    <div class="basis-note"><strong>O que foi considerado:</strong> ${escapeHtml(selectedText('#operational-cores'))}; ${escapeHtml(selectedText('#simultaneous-operations'))}; ${escapeHtml(selectedText('#active-units'))}; ${escapeHtml(selectedText('#integration-level'))}.</div>
    <div class="founder-quote-context recognized">
      <span class="eyebrow">SE FOR CONFIRMADO ENTRE OS 54 INICIAIS</span>
      <strong>Adesão estimada: ${money(adhesion)} · mensalidade recorrente: R$ 0.</strong>
      <p>A simulação não reserva posição entre os 54; essa condição precisa ser confirmada pela Rede antes do aceite.</p>
    </div>
    <div class="founder-quote-context">
      <span class="eyebrow">SE ENTRAR DEPOIS DOS 54</span>
      <strong>Adesão estimada: ${money(adhesion)}.</strong>
      <p>A adesão inclui entrada, preparação e os dois primeiros meses de participação. No fim do segundo mês, se a empresa decidir continuar, a referência mensal desta faixa passa a valer a partir do terceiro mês.</p>
    </div>
    <div class="quote-actions"><a class="button button-primary" href="/contato.html?assunto=Quero%20participar%20como%20empresa">Confirmar com a Rede</a><button class="button button-ghost" id="reset-capacity" type="button">Refazer simulação</button></div>
    <p class="fine">Modelo em validação. Este resultado não é proposta oficial, contrato, cobrança automática nem garantia de entrada na rede inicial.</p>`;
  document.querySelector('#reset-capacity')?.addEventListener('click',reset);
});