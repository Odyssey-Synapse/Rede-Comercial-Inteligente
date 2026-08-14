const form=document.querySelector('#capacity-calculator');
const result=document.querySelector('#capacity-result');
const products=document.querySelector('#offers-products');
const services=document.querySelector('#offers-services');

const money=value=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(value);

const models={
  catalogo:{name:'Catálogo',monthly:49,founderAdhesion:149,futureAdhesion:98,description:'Para empresas que disponibilizam produtos à Rede.'},
  servico:{name:'Serviço',monthly:79,founderAdhesion:199,futureAdhesion:158,description:'Para profissionais e empresas que executam serviços.'},
  ambos:{name:'Serviço + Catálogo',monthly:99,founderAdhesion:249,futureAdhesion:198,description:'Para empresas que fornecem produtos e também executam serviços.'}
};

function getModel(){
  if(products?.checked&&services?.checked)return models.ambos;
  if(products?.checked)return models.catalogo;
  if(services?.checked)return models.servico;
  return null;
}

function getModelKey(){
  if(products?.checked&&services?.checked)return 'ambos';
  if(products?.checked)return 'catalogo';
  if(services?.checked)return 'servico';
  return '';
}

function reset(){
  form?.reset();
  result.innerHTML='<div class="result-empty"><div><div class="orb brand-orb" role="img" aria-label="Uai Perto"></div><h3>Seu resultado aparece aqui.</h3><p>Marque Produtos, Serviços ou os dois.</p></div></div>';
  form?.scrollIntoView({behavior:'smooth',block:'center'});
}

function render(){
  const model=getModel();
  const modelKey=getModelKey();
  if(!model){
    result.innerHTML='<div class="result-empty"><div><div class="orb">!</div><h3>Marque pelo menos uma opção.</h3><p>Sua empresa pode oferecer produtos, serviços ou os dois.</p></div></div>';
    return;
  }

  const isCatalog=modelKey==='catalogo';
  const monthlyLabel=isCatalog?`${money(model.monthly)}/mês`:`a partir de ${money(model.monthly)}/mês`;
  const futureAdhesionLabel=isCatalog?money(model.futureAdhesion):`a partir de ${money(model.futureAdhesion)}`;
  const founderAdhesionLabel=money(model.founderAdhesion);
  const formUrl=`/participar.html?perfil=empresa&modelo=${encodeURIComponent(modelKey)}`;

  result.innerHTML=`
    <div class="quote-status"><span class="eyebrow">SUA REFERÊNCIA</span><span class="quote-badge preview">SIMULAÇÃO</span></div>
    <div class="quote-company"><small>Participação</small><strong>${model.name}</strong><span>${model.description}</span></div>
    <div class="price-display"><small>Referência recorrente para entradas futuras</small><strong>${monthlyLabel}</strong></div>
    <div class="founder-quote-context recognized">
      <span class="eyebrow">SE FOR CONFIRMADO ENTRE OS 54 INICIAIS</span>
      <strong>Adesão: ${founderAdhesionLabel} · mensalidade recorrente: R$ 0.</strong>
      <p>Fundador é uma condição comercial. Sua empresa continua participando como ${model.name}, mas sem mensalidade recorrente enquanto conservar a condição confirmada.</p>
    </div>
    <div class="founder-quote-context">
      <span class="eyebrow">SE ENTRAR DEPOIS DOS 54</span>
      <strong>Adesão: ${futureAdhesionLabel}.</strong>
      <p>A adesão inclui os dois primeiros meses. Se decidir continuar, ${monthlyLabel} passa a valer a partir do terceiro mês.</p>
    </div>
    <div class="basis-note"><strong>O que pode exigir avaliação:</strong> várias unidades, integração específica, alto volume operacional ou estrutura fora do padrão básico. Quantidade de produtos, categorias ou habilidades, sozinha, não aumenta a cobrança.</div>
    <div class="quote-actions"><a class="button button-primary button-full" href="${formUrl}">Apresentar minha empresa →</a><button class="button button-ghost button-full" id="reset-capacity" type="button">Refazer</button></div>
    <p class="fine">Modelo comercial em validação. Esta referência não é proposta oficial, contrato, cobrança automática nem reserva de posição entre os 54 iniciais.</p>`;
  document.querySelector('#reset-capacity')?.addEventListener('click',reset);
}

form?.addEventListener('submit',event=>{event.preventDefault();render()});

const requested=new URLSearchParams(location.search).get('modelo');
if(requested==='catalogo'&&products){products.checked=true;render()}
if(requested==='servico'&&services){services.checked=true;render()}
if(requested==='ambos'){
  if(products)products.checked=true;
  if(services)services.checked=true;
  render();
}
