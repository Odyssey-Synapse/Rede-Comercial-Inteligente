import { hydrateFounderStatus } from "./founder-status.js";

const root=document.querySelector("#network-demo");

if(root){
  const $=selector=>root.querySelector(selector);
  const $$=selector=>[...root.querySelectorAll(selector)];
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;

  const scenarios=[
    {
      label:"urgência em casa",
      request:"Meu chuveiro queimou agora à noite. Preciso de alguém que venha hoje, porque tenho criança em casa. Já tenho um chuveiro novo para instalar e estou no Centro.",
      impactRequest:"Meu chuveiro queimou. Preciso de alguém hoje à noite. Estou no Centro.",
      impactUnderstand:"Hoje à noite · Centro · instalação · equipamento já comprado",
      impactCompany:"Elétrica Central recebe uma oportunidade compatível.",
      impactSolution:"Consigo atender hoje à noite.",
      impactDetail:"Instalação + verificação no local · R$ 180 demonstrativos",
      impactClosing:"Você não procurou eletricistas. Você explicou o problema.",
      tags:["Chuveiro queimado","Hoje à noite","Centro","Criança em casa","Equipamento já comprado"],
      assistant:"Entendi. O problema precisa ser resolvido hoje à noite, no Centro, e você já tem o chuveiro novo. Vou procurar quem consiga fazer esse atendimento nessa região e horário.",
      solutions:[
        ["Elétrica Central","instalação residencial · Centro · atendimento noturno","contexto compatível"],
        ["Pronto Elétrica","instalação de chuveiro · atendimento hoje","serviço compatível"]
      ],
      company:"Elétrica Central",
      companyRole:"empresa demonstrativa · atendimento residencial",
      avatar:"E",
      metricLabel:"CAPACIDADE",
      metricValue:"2 VAGAS",
      match:["✓ instalação","✓ Centro","✓ hoje à noite"],
      opportunity:"Instalação de chuveiro com urgência",
      meta:"Hoje à noite · Centro · equipamento já comprado",
      question:"Consigo atender hoje à noite. A fiação e o disjuntor já funcionavam normalmente antes de o chuveiro queimar?",
      answer:"Sim. O chuveiro antigo queimou, mas o restante estava funcionando normalmente.",
      response:"Perfeito. Vou considerar a troca do equipamento e verificar a instalação no local antes de concluir.",
      quote:"Instalação + verificação no local",
      price:"R$ 180,00",
      time:"hoje à noite",
      done:"Combinado. O pedido saiu de uma situação urgente e chegou a uma opção capaz de atender o contexto informado."
    },
    {
      label:"resolução composta",
      request:"Vou receber visita amanhã cedo e não tenho nada em casa. Preciso de café, leite, pão de queijo e alguma coisa pronta para servir. Quero gastar no máximo R$ 90 e preciso que entregue.",
      impactRequest:"Vou receber visita amanhã cedo. Preciso de mercado + padaria, até R$ 90, com entrega.",
      impactUnderstand:"Até R$ 90 · amanhã cedo · entrega · compra combinada",
      impactCompany:"Mercado + padaria entram no mesmo pedido.",
      impactSolution:"Combinamos os itens e a entrega.",
      impactDetail:"Mercado + padaria + entrega · R$ 84,50 demonstrativos",
      impactClosing:"Uma necessidade. Sem obrigar você a fazer três buscas separadas.",
      tags:["Até R$ 90","Amanhã cedo","Entrega","Mercado + padaria","Compra combinada"],
      assistant:"Entendi. Você quer receber a visita com tudo pronto amanhã cedo, gastar no máximo R$ 90 e não quer sair para buscar. A Rede pode comparar uma solução única ou combinar parceiros se isso resolver melhor o conjunto.",
      solutions:[
        ["Solução em um estabelecimento","itens básicos + pronta entrega","menos coordenação"],
        ["Solução combinada","Mercado Bairro + Padaria da Praça + entrega","mais itens dentro do limite"]
      ],
      company:"Coordenação demonstrativa da Rede",
      companyRole:"resolução composta · 2 parceiros + logística",
      avatar:"R",
      metricLabel:"PARCEIROS",
      metricValue:"2 + 1",
      match:["✓ até R$ 90","✓ amanhã cedo","✓ entrega"],
      opportunity:"Compra combinada para receber visita",
      meta:"Até R$ 90 · amanhã cedo · entrega",
      question:"Encontramos uma combinação de mercado + padaria com entrega. Podemos substituir a marca do leite, se necessário, para manter o total dentro de R$ 90?",
      answer:"Pode, desde que seja leite integral e o total continue até R$ 90.",
      response:"Perfeito. Vou preservar leite integral, o limite total e a janela de entrega.",
      quote:"Mercado + padaria + entrega",
      price:"R$ 84,50",
      time:"amanhã cedo",
      done:"Neste exemplo, um único pedido reuniu partes diferentes sem obrigar a pessoa a refazer a busca em cada lugar."
    },
    {
      label:"restrição de deslocamento",
      request:"Meu carro não liga de manhã. Preciso resolver antes do trabalho, mas não consigo levar o carro até a oficina. Estou no bairro Fabrício.",
      impactRequest:"Meu carro não liga. Preciso resolver pela manhã e não consigo levar até a oficina.",
      impactUnderstand:"Manhã · Fabrício · carro imobilizado · atendimento no local",
      impactCompany:"Auto Socorro Fabrício recebe o pedido certo.",
      impactSolution:"Consigo ir até você pela manhã.",
      impactDetail:"Diagnóstico inicial no local · R$ 160 demonstrativos",
      impactClosing:"A procura mudou porque o problema não podia ir até a oficina.",
      tags:["Carro não liga","Manhã","Fabrício","Não pode levar à oficina","Atendimento no local"],
      assistant:"Entendi. Você precisa resolver pela manhã, no Fabrício, e o carro não pode ser levado por você até uma oficina. Vou priorizar quem consiga atender no local ou organizar o deslocamento necessário.",
      solutions:[
        ["Auto Socorro Fabrício","diagnóstico e atendimento no local","restrição compatível"],
        ["Oficina Rota Segura","oficina + remoção disponível","alternativa com logística"]
      ],
      company:"Auto Socorro Fabrício",
      companyRole:"empresa demonstrativa · atendimento móvel",
      avatar:"E",
      metricLabel:"DESLOCAMENTO",
      metricValue:"ATIVO",
      match:["✓ atendimento local","✓ Fabrício","✓ manhã"],
      opportunity:"Carro não liga — atendimento no local",
      meta:"Manhã · Fabrício · veículo imobilizado",
      question:"Consigo ir até você pela manhã. Quando tenta ligar, o painel acende e o motor não gira, ou não acende nada?",
      answer:"O painel acende, mas o motor não gira.",
      response:"Entendi. Vou levar equipamento para diagnóstico inicial de bateria e partida no local.",
      quote:"Diagnóstico inicial no local",
      price:"R$ 160,00",
      time:"pela manhã",
      done:"Combinado. A restrição de deslocamento mudou a procura: entraram primeiro opções capazes de ir até o problema."
    }
  ];

  const captions=[
    ["ETAPA 1","A pessoa conta o que está acontecendo.","A Rede parte da situação real, não de uma categoria escolhida antes."],
    ["ETAPA 2","O pedido vira contexto útil.","Urgência, orçamento, região, horário e restrições são separados sem obrigar a pessoa a preencher um formulário técnico."],
    ["ETAPA 3","A Rede confirma o que entendeu.","Antes de procurar, vale garantir que o problema certo está sendo resolvido."],
    ["ETAPA 4","A Rede compara caminhos.","Às vezes uma empresa resolve. Em outros casos, mais de uma parte pode ser necessária."],
    ["ETAPA 5","A oportunidade chega a quem faz sentido.","O outro lado recebe contexto suficiente para decidir se consegue atender."],
    ["ETAPA 6","Se falta uma informação, a Rede pergunta.","Uma pergunta objetiva fecha somente a lacuna que realmente muda a solução."],
    ["ETAPA 7","A pessoa responde sem começar de novo.","A nova informação continua dentro do mesmo pedido."],
    ["ETAPA 8","A solução volta com prazo e valor.","A pessoa entende o que está sendo proposto antes de decidir."],
    ["ETAPA 9","A pessoa aceita a solução.","O aceite confirma o caminho escolhido naquele exemplo."],
    ["ETAPA 10","O resultado vira aprendizado.","O que aconteceu ajuda a Rede a entender onde há capacidade e onde ainda faltam soluções."]
  ];

  const impact={
    panel:$("#demo-impact"),xray:$("#demo-xray"),modeImpact:document.querySelector("#demo-mode-impact"),modeXray:document.querySelector("#demo-mode-xray"),showXray:$("#demo-show-xray"),backImpact:$("#demo-back-impact"),
    scenario:$("#impact-scenario-label"),phase:$("#impact-phase-label"),request:$("#impact-request"),understand:$("#impact-understand-title"),tags:$("#impact-tags"),company:$("#impact-company"),opportunity:$("#impact-opportunity"),solution:$("#impact-solution"),solutionDetail:$("#impact-solution-detail"),closing:$("#impact-closing"),ending:$("#impact-ending"),
    cards:[$("#impact-request-card"),$("#impact-understand-card"),$("#impact-company-card"),$("#impact-solution-card")],
    progress:[$("#impact-progress-1"),$("#impact-progress-2"),$("#impact-progress-3"),$("#impact-progress-4")]
  };

  const els={
    stage:$(".demo-stage"),consumer:$("#demo-consumer"),company:$("#demo-company"),request:$("#demo-request"),ai:$("#demo-ai"),aiStatus:$("#demo-ai-status"),parsed:$("#demo-parsed"),tags:$("#demo-tags"),assistant:$("#demo-assistant"),assistantText:$("#demo-assistant-text"),solutions:$("#demo-solutions"),companyQuestion:$("#demo-company-question"),companyQuestionName:$("#demo-company-question-name"),answer:$("#demo-consumer-answer"),consumerQuote:$("#demo-consumer-quote"),quoteName:$("#demo-quote-name"),accept:$("#demo-consumer-accept"),done:$("#demo-consumer-done"),packet:$("#demo-packet"),bridge:$("#demo-bridge-core"),companyName:$("#demo-company-name"),companyRole:$("#demo-company-role"),companyAvatar:$("#demo-company-avatar"),contextMetricLabel:$("#demo-context-metric-label"),contextMetricValue:$("#demo-context-metric-value"),open:$("#demo-open"),newCount:$("#demo-new"),opportunity:$("#demo-opportunity"),opportunityTitle:$("#demo-opportunity-title"),opportunityMeta:$("#demo-opportunity-meta"),matchTags:$("#demo-match-tags"),companyChat:$("#demo-company-chat"),n1:$("#demo-n1"),n2:$("#demo-n2"),n3:$("#demo-n3"),quote:$("#demo-quote"),quoteService:$("#demo-quote-service"),quotePrice:$("#demo-quote-price"),quoteTime:$("#demo-quote-time"),quoteTotal:$("#demo-quote-total"),quoteState:$("#demo-quote-state"),scenarioLabel:$("#demo-scenario-label"),stepLabel:$("#demo-step-label"),progress:$("#demo-progress-bar"),captionK:$("#demo-caption-kicker"),captionT:$("#demo-caption-title"),captionX:$("#demo-caption-text"),play:$("#demo-play"),speed:$("#demo-speed")
  };

  let scenarioIndex=0,impactRun=0,xrayRun=0,step=0,xrayPlaying=true;
  const base=1120;

  const pause=async(ms,id,type)=>{let left=ms;while(left>0){if((type==="impact"?impactRun:xrayRun)!==id)return false;if(type==="xray"&&!xrayPlaying){await sleep(70);continue}const slice=Math.min(70,left);await sleep(slice);left-=slice}return true};
  const show=(el,on=true)=>el?.classList.toggle("show",on);

  function setMode(mode){
    const isImpact=mode==="impact";
    impact.panel.hidden=!isImpact;impact.xray.hidden=isImpact;
    impact.modeImpact?.classList.toggle("active",isImpact);impact.modeXray?.classList.toggle("active",!isImpact);
    impact.modeImpact?.classList.toggle("button-primary",isImpact);impact.modeImpact?.classList.toggle("button-ghost",!isImpact);
    impact.modeXray?.classList.toggle("button-primary",!isImpact);impact.modeXray?.classList.toggle("button-ghost",isImpact);
    impactRun++;xrayRun++;
    if(isImpact)startImpact();else startXray();
  }

  function renderImpactScenario(){
    const s=scenarios[scenarioIndex];
    impact.scenario.textContent=`Exemplo ${scenarioIndex+1} de ${scenarios.length} · ${s.label}`;
    impact.request.textContent=s.impactRequest;
    impact.understand.textContent=s.impactUnderstand;
    impact.tags.innerHTML=s.tags.slice(0,4).map(tag=>`<span>${tag}</span>`).join("");
    impact.company.textContent=s.impactCompany;
    impact.opportunity.textContent=s.opportunity;
    impact.solution.textContent=s.impactSolution;
    impact.solutionDetail.textContent=s.impactDetail;
    impact.closing.textContent=s.impactClosing;
  }

  function setImpactPhase(phase){
    const labels=["1 · você conta o problema","2 · o Uai Perto entende","3 · a oportunidade chega","4 · a solução volta"];
    impact.phase.textContent=labels[phase];
    impact.cards.forEach((card,index)=>{card?.classList.toggle("active",index===phase);card?.classList.toggle("done",index<phase)});
    impact.progress.forEach((bar,index)=>{bar?.classList.toggle("active",index===phase);bar?.classList.toggle("done",index<phase)});
    impact.ending.hidden=phase!==3;
  }

  async function startImpact(){
    const id=++impactRun;
    xrayRun++;
    if(reduced){renderImpactScenario();setImpactPhase(3);return}
    while(id===impactRun&&impact.panel&&!impact.panel.hidden){
      renderImpactScenario();
      setImpactPhase(0);if(!(await pause(3300,id,"impact")))return;
      setImpactPhase(1);if(!(await pause(3300,id,"impact")))return;
      setImpactPhase(2);if(!(await pause(3300,id,"impact")))return;
      setImpactPhase(3);if(!(await pause(4300,id,"impact")))return;
      scenarioIndex=(scenarioIndex+1)%scenarios.length;
    }
  }

  function rate(){return Number(els.speed?.value||1)}
  async function waitXray(ms,id){return pause(ms*rate(),id,"xray")}
  function readingMs(text){const words=String(text||"").trim().split(/\s+/).filter(Boolean).length;return Math.max(1600,Math.min(5200,words*175))}
  function stepHold(i,s){if(i===0)return readingMs(s.request);if(i===1)return 2200;if(i===2)return readingMs(s.assistant);if(i===3)return readingMs(s.solutions.flat().join(" "));if(i===4)return 1900;if(i===5)return readingMs(s.question);if(i===6)return Math.max(2200,Math.min(4700,readingMs(`${s.answer} ${s.response}`)));if(i===7)return 2400;if(i===8)return Math.max(2200,readingMs(s.done));return 1800}
  function focus(which){if(els.stage)els.stage.dataset.focus=which}
  function side(which){const consumer=which==="consumer";els.consumer?.classList.toggle("active",consumer);els.consumer?.classList.toggle("inactive",!consumer);els.company?.classList.toggle("active",!consumer);els.company?.classList.toggle("inactive",consumer)}
  function setCaption(i){const c=captions[i]||captions[0];els.captionK.textContent=c[0];els.captionT.textContent=c[1];els.captionX.textContent=c[2];els.stepLabel.textContent=`Etapa ${i+1} de ${captions.length}`;els.progress.style.width=`${((i+1)/captions.length)*100}%`;els.scenarioLabel.textContent=`Exemplo ${scenarioIndex+1} de ${scenarios.length} · ${scenarios[scenarioIndex].label}`}
  function resetVisual(){ $$(".demo-message,.demo-neg").forEach(el=>el.classList.remove("show"));[els.ai,els.parsed,els.assistant,els.solutions,els.opportunity,els.companyChat,els.quote,els.quoteState].forEach(el=>show(el,false));["#demo-ai-1","#demo-ai-2","#demo-ai-3"].forEach(sel=>$(sel)?.classList.remove("on"));els.request.classList.add("show");els.tags.innerHTML="";els.solutions.innerHTML="";els.assistantText.textContent="";els.open.textContent="0";els.newCount.textContent="0";els.packet.classList.remove("travel");els.bridge.classList.remove("active");side("consumer");focus("consumer");step=0;setCaption(0)}
  function applyScenario(){const s=scenarios[scenarioIndex];els.request.querySelector("p").textContent=s.request;els.companyName.textContent=s.company;els.companyRole.textContent=s.companyRole;els.companyAvatar.textContent=s.avatar;els.contextMetricLabel.textContent=s.metricLabel;els.contextMetricValue.textContent=s.metricValue;els.opportunityTitle.textContent=s.opportunity;els.opportunityMeta.textContent=s.meta;els.matchTags.innerHTML=s.match.map(t=>`<span>${t}</span>`).join("");els.companyQuestionName.textContent=`${s.company} · via Rede`;els.companyQuestion.querySelector("p").textContent=s.question;els.answer.querySelector("p").textContent=s.answer;els.quoteName.textContent=`${s.company} · solução demonstrativa`;els.consumerQuote.querySelector("p").innerHTML=`${s.quote} — <strong>${s.price}</strong>. Valor apenas demonstrativo.`;els.done.querySelector("p").textContent=s.done;els.n1.textContent=s.question;els.n2.textContent=s.answer;els.n3.textContent=s.response;els.quoteService.textContent=s.quote;els.quotePrice.textContent=s.price;els.quoteTime.textContent=s.time;els.quoteTotal.textContent=s.price;setCaption(step)}
  async function typeText(text,id,instant=false){if(id!==xrayRun)return;els.assistantText.textContent=text;if(!instant&&!reduced){els.assistant?.classList.add("reading-focus");await waitXray(180,id);els.assistant?.classList.remove("reading-focus")}}
  async function setStep(i,id,instant=false){
    if(id!==xrayRun)return;step=i;setCaption(i);const s=scenarios[scenarioIndex],d=instant?0:base;
    if(i===0){focus("consumer");side("consumer");els.request.classList.add("show");return}
    if(i===1){focus("consumer");show(els.ai);$("#demo-ai-1")?.classList.add("on");els.aiStatus.textContent="entendendo a situação…";await waitXray(d*.30,id);$("#demo-ai-2")?.classList.add("on");els.aiStatus.textContent="separando o que importa…";await waitXray(d*.30,id);$("#demo-ai-3")?.classList.add("on");els.aiStatus.textContent="organizando o pedido…";show(els.parsed);els.tags.innerHTML="";for(const tag of s.tags){const span=document.createElement("span");span.textContent=tag;els.tags.appendChild(span);if(!instant)await waitXray(72,id)}return}
    if(i===2){focus("consumer");show(els.ai,false);show(els.assistant);await typeText(s.assistant,id,instant);return}
    if(i===3){focus("consumer");els.solutions.innerHTML=s.solutions.map(([name,detail,reason])=>`<div class="demo-solution"><div><small>CAMINHO DEMONSTRATIVO</small><strong>${name}</strong><span>${detail}</span></div><em>${reason}</em></div>`).join("");show(els.solutions);return}
    if(i===4){focus("bridge");side("company");els.bridge.classList.add("active");els.packet.classList.remove("travel");void els.packet.offsetWidth;els.packet.classList.add("travel");await waitXray(d*.48,id);show(els.opportunity);focus("company");els.open.textContent="1";els.newCount.textContent="1";els.bridge.classList.remove("active");return}
    if(i===5){focus("company");side("company");show(els.companyChat);els.n1.classList.add("show");await waitXray(d*.34,id);focus("consumer");side("consumer");els.companyQuestion.classList.add("show");return}
    if(i===6){focus("consumer");side("consumer");els.answer.classList.add("show");await waitXray(d*.32,id);focus("company");side("company");els.n2.classList.add("show");await waitXray(d*.24,id);els.n3.classList.add("show");return}
    if(i===7){focus("company");side("company");show(els.quote);await waitXray(d*.30,id);focus("consumer");side("consumer");els.consumerQuote.classList.add("show");return}
    if(i===8){focus("consumer");side("consumer");els.accept.classList.add("show");await waitXray(d*.30,id);focus("company");side("company");show(els.quoteState);els.open.textContent="0";await waitXray(d*.26,id);focus("consumer");side("consumer");els.done.classList.add("show");return}
    if(i===9){focus("bridge");side("company");els.bridge.classList.add("active");await waitXray(d*.44,id);els.bridge.classList.remove("active")}
  }
  async function startXray(){
    impactRun++;xrayPlaying=!reduced;els.play.textContent=xrayPlaying?"Pausar":"Continuar";
    const id=++xrayRun;
    if(reduced){resetVisual();applyScenario();return}
    while(id===xrayRun&&impact.xray&&!impact.xray.hidden){resetVisual();applyScenario();for(let i=0;i<captions.length;i++){if(id!==xrayRun)return;await setStep(i,id);if(i<captions.length-1&&!(await waitXray(stepHold(i,scenarios[scenarioIndex]),id)))return}if(!(await waitXray(1100,id)))return;scenarioIndex=(scenarioIndex+1)%scenarios.length}
  }
  async function rebuild(target){const id=++xrayRun;resetVisual();applyScenario();for(let i=0;i<=target;i++)await setStep(i,id,true);step=target;setCaption(target)}

  impact.modeImpact?.addEventListener("click",()=>setMode("impact"));
  impact.modeXray?.addEventListener("click",()=>setMode("xray"));
  impact.showXray?.addEventListener("click",()=>setMode("xray"));
  impact.backImpact?.addEventListener("click",()=>setMode("impact"));
  els.play?.addEventListener("click",()=>{xrayPlaying=!xrayPlaying;els.play.textContent=xrayPlaying?"Pausar":"Continuar"});
  $("#demo-next")?.addEventListener("click",async()=>{xrayPlaying=false;els.play.textContent="Continuar";await rebuild(Math.min(captions.length-1,step+1))});
  $("#demo-prev")?.addEventListener("click",async()=>{xrayPlaying=false;els.play.textContent="Continuar";await rebuild(Math.max(0,step-1))});
  $("#demo-restart")?.addEventListener("click",()=>{scenarioIndex=0;xrayPlaying=true;els.play.textContent="Pausar";startXray()});

  setMode("impact");
}

hydrateFounderStatus();
