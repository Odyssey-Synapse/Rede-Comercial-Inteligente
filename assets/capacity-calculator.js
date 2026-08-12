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
    <div class="quote-meta"><div><small>Adesão</small><strong>Sob avaliação</strong></div><div><small>Se entrar entre os 54 iniciais</small><strong>Mensalidade recorrente de R$ 0</strong></div><div><small>Se entrar depois</small><strong>Condição definida antes do aceite</strong></div></div>
    <div class="quote-actions"><a class="button button-primary" href="/contato.html?assunto=Quero%20participar%20como%20empresa">Solicitar avaliação</a><a class="button button-light" href="/participar.html?perfil=empresa">Apresentar minha empresa</a><button class="button button-ghost" id="reset-capacity" type="button">Refazer simulação</button></div>
    <p class="fine">Este resultado é uma referência e não representa contrato, cobrança automática ou reserva de posição entre os 54 iniciais.</p>`;
  document.querySelector('#reset-capacity')?.addEventListener('click',reset);
}

function reset(){
  form?.reset();
  result.innerHTML='<div class="result-empty"><div><div class="orb brand-orb" role="img" aria-label="Uai Perto"></div><h3>Seu resultado aparece aqui.</h3><p>Preencha as quatro respostas para ver a faixa estimada, a adesão de referência e as condições de entrada.</p></div></div>';
  form?.scrollIntoView({behavior:'smooth',block:'center'});
}

form?.addEventListener('submit',event=>{
  event.preventDefault();
  const cores=selectedValue('#operational-cores');
  const simultaneous=selectedValue('#simultaneous-operations');
  const units=selectedValue('#active-units');
  const integration=selectedValue('#integration-level');
  if([cores,simultaneous,units,integration].some(v=>v==='')){
    result.innerHTML='<div class="result-empty"><div><div class="orb">!</div><h3>Faltam respostas.</h3><p>Selecione os quatro pontos da operação para ver a referência.</p></div></div>';
    return;
  }
  if(units==='enterprise')return enterpriseResult('Cinco ou mais unidades operacionais ativas');
  if(integration==='enterprise')return enterpriseResult('Integração customizada');

  const score=Number(cores)+Number(simultaneous)+Number(units)+Number(integration);
  const band=bands.find(item=>score>=item.min&&score<=item.max);
  if(!band)return enterpriseResult('A combinação informada ultrapassa as faixas padronizadas');

  const adhesion=band.monthly*3;
  result.innerHTML=`
    <div class="quote-status"><span class="eyebrow">SUA REFERÊNCIA</span><span class="quote-badge preview">SIMULAÇÃO</span></div>
    <div class="quote-company"><small>Faixa estimada</small><strong>${band.name}</strong><span>calculada a partir da operação informada</span></div>
    <div class="price-display"><small>Mensalidade de referência para entradas futuras</small><strong>${money(band.monthly)}</strong><span>/ mês</span></div>
    <div class="price-lines"><div class="price-line"><span>Adesão de referência</span><strong>${money(adhesion)}</strong></div></div>
    <div class="basis-note"><strong>O que foi considerado:</strong> ${escapeHtml(selectedText('#operational-cores'))}; ${escapeHtml(selectedText('#simultaneous-operations'))}; ${escapeHtml(selectedText('#active-units'))}; ${escapeHtml(selectedText('#integration-level'))}.</div>
    <div class="founder-quote-context recognized">
      <span class="eyebrow">SE FOR CONFIRMADO ENTRE OS 54 INICIAIS</span>
      <strong>Adesão estimada: ${money(adhesion)} · mensalidade recorrente: R$ 0.</strong>
      <p>A simulação não reserva posição. Essa condição precisa ser confirmada pelo Uai Perto antes do aceite.</p>
    </div>
    <div class="founder-quote-context">
      <span class="eyebrow">SE ENTRAR DEPOIS DOS 54</span>
      <strong>Adesão estimada: ${money(adhesion)}.</strong>
      <p>A adesão inclui os dois primeiros meses. Se a empresa decidir continuar, a mensalidade de ${money(band.monthly)} passa a valer a partir do terceiro mês.</p>
    </div>
    <div class="quote-actions"><a class="button button-primary" href="/participar.html?perfil=empresa">Apresentar minha empresa</a><a class="button button-light" href="/contato.html?assunto=Quero%20participar%20como%20empresa">Falar com o Uai Perto</a><button class="button button-ghost" id="reset-capacity" type="button">Refazer simulação</button></div>
    <p class="fine">Modelo em validação. Este resultado não é proposta oficial, contrato, cobrança automática nem garantia de entrada na rede inicial.</p>`;
  document.querySelector('#reset-capacity')?.addEventListener('click',reset);
});
