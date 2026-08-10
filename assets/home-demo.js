import { hydrateFounderStatus } from "./founder-status.js";

const root=document.querySelector("#network-demo");

if(root){
  const $=selector=>root.querySelector(selector);
  const $$=selector=>[...root.querySelectorAll(selector)];
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

  const scenarios=[
    {
      label:"elétrica residencial",
      request:"Preciso de um eletricista hoje depois das 18h no Centro para instalar um chuveiro.",
      tags:["Instalação de chuveiro","Hoje após 18h","Centro","Residencial"],
      assistant:"Entendi. Você precisa instalar um chuveiro hoje depois das 18h, no Centro. Vou considerar serviço, região e horário antes de apresentar alternativas.",
      solutions:[
        ["Elétrica Central","instalação residencial · Centro","horário compatível"],
        ["Pronto Elétrica","atendimento residencial","região compatível"]
      ],
      company:"Elétrica Central",
      opportunity:"Instalação de chuveiro",
      meta:"Hoje após 18h · Centro",
      question:"Consigo atender hoje após 18h. Você já tem o chuveiro ou também precisa do equipamento?",
      answer:"Já tenho o chuveiro. Preciso somente da instalação.",
      response:"Perfeito. Vou montar um orçamento somente para a instalação.",
      quote:"Instalação de chuveiro",
      price:"R$ 180,00",
      time:"hoje após 18h",
      done:"Combinado. O atendimento demonstrativo ficou confirmado para hoje após 18h."
    },
    {
      label:"climatização comercial",
      request:"Preciso de limpeza de ar-condicionado amanhã cedo em um escritório no bairro Jardim.",
      tags:["Limpeza de ar-condicionado","Amanhã cedo","Jardim","Comercial"],
      assistant:"Entendi. Você quer limpeza de ar-condicionado amanhã cedo em um escritório no Jardim. Vou considerar o tipo de serviço, a região e o período solicitado.",
      solutions:[
        ["Clima Jardim","higienização de split · Jardim","região compatível"],
        ["Ar Leve Serviços","manutenção comercial","serviço compatível"]
      ],
      company:"Clima Jardim",
      opportunity:"Limpeza de ar-condicionado",
      meta:"Amanhã cedo · Jardim",
      question:"Consigo atender amanhã cedo. Quantos aparelhos precisam de limpeza no escritório?",
      answer:"São dois aparelhos split no mesmo local.",
      response:"Perfeito. Vou considerar os dois equipamentos no mesmo endereço.",
      quote:"Limpeza de 2 aparelhos split",
      price:"R$ 240,00",
      time:"amanhã cedo",
      done:"Combinado. O atendimento demonstrativo ficou confirmado para amanhã cedo."
    },
    {
      label:"chaveiro emergencial",
      request:"Preciso de um chaveiro agora à noite no bairro Nova Esperança para trocar a fechadura da porta de entrada.",
      tags:["Troca de fechadura","Hoje à noite","Nova Esperança","Emergencial"],
      assistant:"Entendi. Você precisa trocar a fechadura hoje à noite, no bairro Nova Esperança. Vou considerar urgência, região e tipo de serviço.",
      solutions:[
        ["Chaveiro Nova Esperança","emergências residenciais","urgência compatível"],
        ["Plantão das Chaves","atendimento noturno","horário compatível"]
      ],
      company:"Chaveiro Nova Esperança",
      opportunity:"Troca de fechadura",
      meta:"Hoje à noite · Nova Esperança",
      question:"Consigo atender ainda hoje. A fechadura já foi comprada ou você precisa que eu leve uma opção padrão?",
      answer:"Preciso que você leve uma opção padrão, por favor.",
      response:"Perfeito. Vou incluir uma fechadura padrão junto com a instalação.",
      quote:"Troca de fechadura com peça",
      price:"R$ 220,00",
      time:"hoje à noite",
      done:"Combinado. O atendimento demonstrativo ficou confirmado para hoje à noite."
    }
  ];

  const captions=[
    ["ETAPA 1","A necessidade começa em linguagem natural.","O consumidor explica o que precisa sem escolher uma categoria antes."],
    ["ETAPA 2","A assistente interpreta o contexto.","Serviço, urgência, região e horário são organizados antes da busca."],
    ["ETAPA 3","A Rede confirma o que entendeu.","A resposta reduz ambiguidades antes de apresentar alternativas."],
    ["ETAPA 4","Soluções compatíveis aparecem.","Os exemplos consideram pertinência; não são uma lista aleatória de empresas."],
    ["ETAPA 5","A oportunidade atravessa a Rede.","A mesma necessidade chega ao painel de uma empresa demonstrativa compatível."],
    ["ETAPA 6","Empresa e consumidor conversam.","Uma pergunta objetiva esclarece o escopo antes do preço."],
    ["ETAPA 7","O cliente completa a informação.","A resposta reduz incerteza para a empresa montar a proposta."],
    ["ETAPA 8","O orçamento volta ao consumidor.","Serviço, horário e valor demonstrativo ficam claros antes da decisão."],
    ["ETAPA 9","O consumidor aceita.","O aceite aparece dos dois lados e encerra a negociação demonstrativa."],
    ["ETAPA 10","O resultado volta para a Rede.","O ciclo termina com um resultado observável e o próximo cenário começa automaticamente."]
  ];

  const els={
    consumer:$("#demo-consumer"),company:$("#demo-company"),request:$("#demo-request"),ai:$("#demo-ai"),aiStatus:$("#demo-ai-status"),
    parsed:$("#demo-parsed"),tags:$("#demo-tags"),assistant:$("#demo-assistant"),assistantText:$("#demo-assistant-text"),solutions:$("#demo-solutions"),
    companyQuestion:$("#demo-company-question"),companyQuestionName:$("#demo-company-question-name"),answer:$("#demo-consumer-answer"),consumerQuote:$("#demo-consumer-quote"),
    quoteName:$("#demo-quote-name"),accept:$("#demo-consumer-accept"),done:$("#demo-consumer-done"),packet:$("#demo-packet"),bridge:$("#demo-bridge-core"),
    companyName:$("#demo-company-name"),open:$("#demo-open"),today:$("#demo-today"),opportunity:$("#demo-opportunity"),opportunityTitle:$("#demo-opportunity-title"),
    opportunityMeta:$("#demo-opportunity-meta"),companyChat:$("#demo-company-chat"),n1:$("#demo-n1"),n2:$("#demo-n2"),n3:$("#demo-n3"),quote:$("#demo-quote"),
    quoteService:$("#demo-quote-service"),quotePrice:$("#demo-quote-price"),quoteTime:$("#demo-quote-time"),quoteTotal:$("#demo-quote-total"),quoteState:$("#demo-quote-state"),
    scenarioLabel:$("#demo-scenario-label"),stepLabel:$("#demo-step-label"),progress:$("#demo-progress-bar"),captionK:$("#demo-caption-kicker"),captionT:$("#demo-caption-title"),
    captionX:$("#demo-caption-text"),play:$("#demo-play"),speed:$("#demo-speed")
  };

  let scenarioIndex=0,step=0,playing=true,runId=0;
  const base=1120;
  const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;

  function rate(){return Number(els.speed?.value||1)}
  async function wait(ms,id){
    let left=ms*rate();
    while(left>0){
      if(id!==runId)return false;
      if(!playing){await sleep(70);continue}
      const slice=Math.min(70,left);await sleep(slice);left-=slice;
    }
    return id===runId;
  }
  function show(el,on=true){el?.classList.toggle("show",on)}
  function side(which){
    const consumer=which==="consumer";
    els.consumer?.classList.toggle("active",consumer);els.consumer?.classList.toggle("inactive",!consumer);
    els.company?.classList.toggle("active",!consumer);els.company?.classList.toggle("inactive",consumer);
  }
  function setCaption(i){
    const c=captions[i]||captions[0];
    els.captionK.textContent=c[0];els.captionT.textContent=c[1];els.captionX.textContent=c[2];
    els.stepLabel.textContent=`Etapa ${i+1} de ${captions.length}`;
    els.progress.style.width=`${((i+1)/captions.length)*100}%`;
    els.scenarioLabel.textContent=`Exemplo ${scenarioIndex+1} de ${scenarios.length} · ${scenarios[scenarioIndex].label}`;
  }
  function resetVisual(){
    $$(".demo-message,.demo-neg").forEach(el=>el.classList.remove("show"));
    [els.ai,els.parsed,els.assistant,els.solutions,els.opportunity,els.companyChat,els.quote,els.quoteState].forEach(el=>show(el,false));
    ["#demo-ai-1","#demo-ai-2","#demo-ai-3"].forEach(sel=>$(sel)?.classList.remove("on"));
    els.request.classList.add("show");els.tags.innerHTML="";els.solutions.innerHTML="";els.assistantText.textContent="";
    els.open.textContent="0";els.today.textContent="0";els.packet.classList.remove("travel");els.bridge.classList.remove("active");
    side("consumer");step=0;setCaption(0);
  }
  function applyScenario(){
    const s=scenarios[scenarioIndex];
    els.request.querySelector("p").textContent=s.request;
    els.companyName.textContent=s.company;els.opportunityTitle.textContent=s.opportunity;els.opportunityMeta.textContent=s.meta;
    els.companyQuestionName.textContent=`${s.company} · via Achei Aqui`;els.companyQuestion.querySelector("p").textContent=s.question;
    els.answer.querySelector("p").textContent=s.answer;els.quoteName.textContent=`${s.company} · orçamento demonstrativo`;
    els.consumerQuote.querySelector("p").innerHTML=`${s.quote} — <strong>${s.price}</strong>. Valor apenas demonstrativo.`;
    els.done.querySelector("p").textContent=s.done;els.n1.textContent=s.question;els.n2.textContent=s.answer;els.n3.textContent=s.response;
    els.quoteService.textContent=s.quote;els.quotePrice.textContent=s.price;els.quoteTime.textContent=s.time;els.quoteTotal.textContent=s.price;
    setCaption(step);
  }
  async function typeText(text,id,instant=false){
    els.assistantText.textContent="";
    if(reduced||instant){els.assistantText.textContent=text;return}
    for(let i=0;i<text.length;i++){
      if(id!==runId)return;
      els.assistantText.textContent+=text[i];
      if(i%4===0)await wait(10,id);
    }
  }
  async function setStep(i,id,instant=false){
    if(id!==runId)return;
    step=i;setCaption(i);const s=scenarios[scenarioIndex],d=instant?0:base;
    if(i===0){side("consumer");els.request.classList.add("show");return}
    if(i===1){
      show(els.ai);$("#demo-ai-1")?.classList.add("on");els.aiStatus.textContent="entendendo sua mensagem…";
      await wait(d*.30,id);$("#demo-ai-2")?.classList.add("on");els.aiStatus.textContent="identificando contexto…";
      await wait(d*.30,id);$("#demo-ai-3")?.classList.add("on");els.aiStatus.textContent="organizando necessidade…";
      show(els.parsed);els.tags.innerHTML="";
      for(const tag of s.tags){const span=document.createElement("span");span.textContent=tag;els.tags.appendChild(span);if(!instant)await wait(72,id)}
      return;
    }
    if(i===2){show(els.ai,false);show(els.assistant);await typeText(s.assistant,id,instant);return}
    if(i===3){
      els.solutions.innerHTML=s.solutions.map(([name,detail,reason])=>`<div class="demo-solution"><div><small>EMPRESA DEMONSTRATIVA</small><strong>${name}</strong><span>${detail}</span></div><em>${reason}</em></div>`).join("");
      show(els.solutions);return;
    }
    if(i===4){
      side("company");els.bridge.classList.add("active");els.packet.classList.remove("travel");void els.packet.offsetWidth;els.packet.classList.add("travel");
      await wait(d*.48,id);show(els.opportunity);els.open.textContent="1";els.today.textContent="1";els.bridge.classList.remove("active");return;
    }
    if(i===5){side("company");show(els.companyChat);els.n1.classList.add("show");await wait(d*.34,id);side("consumer");els.companyQuestion.classList.add("show");return}
    if(i===6){side("consumer");els.answer.classList.add("show");await wait(d*.32,id);side("company");els.n2.classList.add("show");await wait(d*.24,id);els.n3.classList.add("show");return}
    if(i===7){side("company");show(els.quote);await wait(d*.30,id);side("consumer");els.consumerQuote.classList.add("show");return}
    if(i===8){side("consumer");els.accept.classList.add("show");await wait(d*.30,id);side("company");show(els.quoteState);els.open.textContent="0";await wait(d*.26,id);side("consumer");els.done.classList.add("show");return}
    if(i===9){side("company");els.bridge.classList.add("active");await wait(d*.44,id);els.bridge.classList.remove("active");return}
  }
  async function autoplay(){
    const id=++runId;
    while(id===runId){
      resetVisual();applyScenario();
      for(let i=0;i<captions.length;i++){
        if(id!==runId)return;
        await setStep(i,id);
        if(i<captions.length-1 && !(await wait(base*.68,id)))return;
      }
      if(!(await wait(1100,id)))return;
      scenarioIndex=(scenarioIndex+1)%scenarios.length;
    }
  }
  async function rebuild(target){
    const id=++runId;resetVisual();applyScenario();
    for(let i=0;i<=target;i++)await setStep(i,id,true);
    step=target;setCaption(target);
  }

  els.play?.addEventListener("click",()=>{playing=!playing;els.play.textContent=playing?"Pausar":"Continuar"});
  $("#demo-next")?.addEventListener("click",async()=>{playing=false;els.play.textContent="Continuar";await rebuild(Math.min(captions.length-1,step+1))});
  $("#demo-prev")?.addEventListener("click",async()=>{playing=false;els.play.textContent="Continuar";await rebuild(Math.max(0,step-1))});
  $("#demo-restart")?.addEventListener("click",()=>{scenarioIndex=0;playing=true;els.play.textContent="Pausar";autoplay()});

  resetVisual();applyScenario();
  if(reduced){playing=false;els.play.textContent="Continuar"}else autoplay();
}


hydrateFounderStatus();
