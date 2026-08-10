import { hydrateFounderStatus } from "./founder-status.js";

const root=document.querySelector("#network-demo");

if(root){
  const $=selector=>root.querySelector(selector);
  const $$=selector=>[...root.querySelectorAll(selector)];
  const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));

  const scenarios=[
    {
      label:"urgência em casa",
      request:"Meu chuveiro queimou agora à noite. Preciso de alguém que venha hoje, porque tenho criança em casa. Já tenho um chuveiro novo para instalar e estou no Centro.",
      tags:["Chuveiro queimado","Hoje à noite","Centro","Criança em casa","Equipamento já comprado"],
      assistant:"Entendi. O problema precisa ser resolvido hoje à noite, no Centro, e você já tem o chuveiro novo. Vou procurar capacidade compatível com instalação residencial, região e horário.",
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
      done:"Combinado. Neste cenário demonstrativo, a necessidade saiu de uma situação urgente e chegou a uma solução compatível com o contexto informado."
    },
    {
      label:"resolução composta",
      request:"Vou receber visita amanhã cedo e não tenho nada em casa. Preciso de café, leite, pão de queijo e alguma coisa pronta para servir. Quero gastar no máximo R$ 90 e preciso que entregue.",
      tags:["Até R$ 90","Amanhã cedo","Entrega","Mercado + padaria","Compra combinada"],
      assistant:"Entendi. Você quer receber a visita com tudo pronto amanhã cedo, gastar no máximo R$ 90 e não quer sair para buscar. A Rede pode comparar uma solução única ou uma combinação de parceiros se isso atender melhor ao conjunto.",
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
      done:"Neste cenário conceitual, uma única intenção coordenou capacidades complementares sem obrigar a pessoa a fazer três buscas separadas."
    },
    {
      label:"restrição de deslocamento",
      request:"Meu carro não liga de manhã. Preciso resolver antes do trabalho, mas não consigo levar o carro até a oficina. Estou no bairro Fabrício.",
      tags:["Carro não liga","Manhã","Fabrício","Não pode levar à oficina","Atendimento no local"],
      assistant:"Entendi. Você precisa resolver pela manhã, no Fabrício, e o carro não pode ser levado por você até uma oficina. Vou priorizar alternativas que consigam atender no local ou organizar o deslocamento necessário.",
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
      done:"Combinado. A restrição de deslocamento mudou a busca: a Rede procurou quem podia ir até o problema, não apenas oficinas próximas."
    }
  ];

  const captions=[
    ["ETAPA 1","A pessoa conta o que está acontecendo.","A Rede parte da situação real, e não de uma categoria escolhida antes."],
    ["ETAPA 2","A assistente separa o que realmente importa.","Urgência, orçamento, região, horário e restrições são organizados como parte da intenção."],
    ["ETAPA 3","A Rede confirma o entendimento antes de agir.","Isso reduz o risco de procurar a solução certa para o problema errado."],
    ["ETAPA 4","A Rede compara caminhos de resolução.","Dependendo do caso, a solução pode envolver uma empresa ou capacidades complementares."],
    ["ETAPA 5","Só a capacidade pertinente é acionada.","A oportunidade atravessa a Rede com contexto suficiente para o outro lado decidir se consegue atender."],
    ["ETAPA 6","Falta uma informação? A Rede pergunta sem recomeçar.","Uma pergunta objetiva fecha a lacuna que realmente afeta a solução."],
    ["ETAPA 7","A pessoa responde uma vez.","O contexto adicional volta para quem precisa dele sem obrigar o consumidor a reconstruir toda a necessidade."],
    ["ETAPA 8","A solução volta com partes, janela e valor claros.","O consumidor consegue entender o que está sendo proposto antes de decidir."],
    ["ETAPA 9","O aceite transforma intenção em execução.","Aceitar não muda relevância; apenas confirma a solução escolhida naquele cenário."],
    ["ETAPA 10","O resultado volta para a inteligência da Rede.","O ciclo termina com um evento observável que poderá alimentar capacidade, expansão e aprendizado."]
  ];

  const els={
    consumer:$("#demo-consumer"),company:$("#demo-company"),request:$("#demo-request"),ai:$("#demo-ai"),aiStatus:$("#demo-ai-status"),
    parsed:$("#demo-parsed"),tags:$("#demo-tags"),assistant:$("#demo-assistant"),assistantText:$("#demo-assistant-text"),solutions:$("#demo-solutions"),
    companyQuestion:$("#demo-company-question"),companyQuestionName:$("#demo-company-question-name"),answer:$("#demo-consumer-answer"),consumerQuote:$("#demo-consumer-quote"),
    quoteName:$("#demo-quote-name"),accept:$("#demo-consumer-accept"),done:$("#demo-consumer-done"),packet:$("#demo-packet"),bridge:$("#demo-bridge-core"),
    companyName:$("#demo-company-name"),companyRole:$("#demo-company-role"),companyAvatar:$("#demo-company-avatar"),contextMetricLabel:$("#demo-context-metric-label"),contextMetricValue:$("#demo-context-metric-value"),
    open:$("#demo-open"),newCount:$("#demo-new"),opportunity:$("#demo-opportunity"),opportunityTitle:$("#demo-opportunity-title"),opportunityMeta:$("#demo-opportunity-meta"),matchTags:$("#demo-match-tags"),
    companyChat:$("#demo-company-chat"),n1:$("#demo-n1"),n2:$("#demo-n2"),n3:$("#demo-n3"),quote:$("#demo-quote"),quoteService:$("#demo-quote-service"),quotePrice:$("#demo-quote-price"),quoteTime:$("#demo-quote-time"),quoteTotal:$("#demo-quote-total"),quoteState:$("#demo-quote-state"),
    scenarioLabel:$("#demo-scenario-label"),stepLabel:$("#demo-step-label"),progress:$("#demo-progress-bar"),captionK:$("#demo-caption-kicker"),captionT:$("#demo-caption-title"),captionX:$("#demo-caption-text"),play:$("#demo-play"),speed:$("#demo-speed")
  };

  let scenarioIndex=0,step=0,playing=true,runId=0;
  const base=1120;
  const reduced=matchMedia("(prefers-reduced-motion: reduce)").matches;

  function rate(){return Number(els.speed?.value||1)}
  async function wait(ms,id){let left=ms*rate();while(left>0){if(id!==runId)return false;if(!playing){await sleep(70);continue}const slice=Math.min(70,left);await sleep(slice);left-=slice}return id===runId}
  function show(el,on=true){el?.classList.toggle("show",on)}
  function side(which){const consumer=which==="consumer";els.consumer?.classList.toggle("active",consumer);els.consumer?.classList.toggle("inactive",!consumer);els.company?.classList.toggle("active",!consumer);els.company?.classList.toggle("inactive",consumer)}
  function setCaption(i){const c=captions[i]||captions[0];els.captionK.textContent=c[0];els.captionT.textContent=c[1];els.captionX.textContent=c[2];els.stepLabel.textContent=`Etapa ${i+1} de ${captions.length}`;els.progress.style.width=`${((i+1)/captions.length)*100}%`;els.scenarioLabel.textContent=`Exemplo ${scenarioIndex+1} de ${scenarios.length} · ${scenarios[scenarioIndex].label}`}
  function resetVisual(){ $$(".demo-message,.demo-neg").forEach(el=>el.classList.remove("show"));[els.ai,els.parsed,els.assistant,els.solutions,els.opportunity,els.companyChat,els.quote,els.quoteState].forEach(el=>show(el,false));["#demo-ai-1","#demo-ai-2","#demo-ai-3"].forEach(sel=>$(sel)?.classList.remove("on"));els.request.classList.add("show");els.tags.innerHTML="";els.solutions.innerHTML="";els.assistantText.textContent="";els.open.textContent="0";els.newCount.textContent="0";els.packet.classList.remove("travel");els.bridge.classList.remove("active");side("consumer");step=0;setCaption(0)}
  function applyScenario(){const s=scenarios[scenarioIndex];els.request.querySelector("p").textContent=s.request;els.companyName.textContent=s.company;els.companyRole.textContent=s.companyRole;els.companyAvatar.textContent=s.avatar;els.contextMetricLabel.textContent=s.metricLabel;els.contextMetricValue.textContent=s.metricValue;els.opportunityTitle.textContent=s.opportunity;els.opportunityMeta.textContent=s.meta;els.matchTags.innerHTML=s.match.map(t=>`<span>${t}</span>`).join("");els.companyQuestionName.textContent=`${s.company} · via Rede`;els.companyQuestion.querySelector("p").textContent=s.question;els.answer.querySelector("p").textContent=s.answer;els.quoteName.textContent=`${s.company} · solução demonstrativa`;els.consumerQuote.querySelector("p").innerHTML=`${s.quote} — <strong>${s.price}</strong>. Valor apenas demonstrativo.`;els.done.querySelector("p").textContent=s.done;els.n1.textContent=s.question;els.n2.textContent=s.answer;els.n3.textContent=s.response;els.quoteService.textContent=s.quote;els.quotePrice.textContent=s.price;els.quoteTime.textContent=s.time;els.quoteTotal.textContent=s.price;setCaption(step)}
  async function typeText(text,id,instant=false){els.assistantText.textContent="";if(reduced||instant){els.assistantText.textContent=text;return}for(let i=0;i<text.length;i++){if(id!==runId)return;els.assistantText.textContent+=text[i];if(i%4===0)await wait(10,id)}}
  async function setStep(i,id,instant=false){if(id!==runId)return;step=i;setCaption(i);const s=scenarios[scenarioIndex],d=instant?0:base;if(i===0){side("consumer");els.request.classList.add("show");return}if(i===1){show(els.ai);$("#demo-ai-1")?.classList.add("on");els.aiStatus.textContent="entendendo a situação…";await wait(d*.30,id);$("#demo-ai-2")?.classList.add("on");els.aiStatus.textContent="separando restrições…";await wait(d*.30,id);$("#demo-ai-3")?.classList.add("on");els.aiStatus.textContent="organizando a intenção…";show(els.parsed);els.tags.innerHTML="";for(const tag of s.tags){const span=document.createElement("span");span.textContent=tag;els.tags.appendChild(span);if(!instant)await wait(72,id)}return}if(i===2){show(els.ai,false);show(els.assistant);await typeText(s.assistant,id,instant);return}if(i===3){els.solutions.innerHTML=s.solutions.map(([name,detail,reason])=>`<div class="demo-solution"><div><small>CAMINHO DEMONSTRATIVO</small><strong>${name}</strong><span>${detail}</span></div><em>${reason}</em></div>`).join("");show(els.solutions);return}if(i===4){side("company");els.bridge.classList.add("active");els.packet.classList.remove("travel");void els.packet.offsetWidth;els.packet.classList.add("travel");await wait(d*.48,id);show(els.opportunity);els.open.textContent="1";els.newCount.textContent="1";els.bridge.classList.remove("active");return}if(i===5){side("company");show(els.companyChat);els.n1.classList.add("show");await wait(d*.34,id);side("consumer");els.companyQuestion.classList.add("show");return}if(i===6){side("consumer");els.answer.classList.add("show");await wait(d*.32,id);side("company");els.n2.classList.add("show");await wait(d*.24,id);els.n3.classList.add("show");return}if(i===7){side("company");show(els.quote);await wait(d*.30,id);side("consumer");els.consumerQuote.classList.add("show");return}if(i===8){side("consumer");els.accept.classList.add("show");await wait(d*.30,id);side("company");show(els.quoteState);els.open.textContent="0";await wait(d*.26,id);side("consumer");els.done.classList.add("show");return}if(i===9){side("company");els.bridge.classList.add("active");await wait(d*.44,id);els.bridge.classList.remove("active");return}}
  async function autoplay(){const id=++runId;while(id===runId){resetVisual();applyScenario();for(let i=0;i<captions.length;i++){if(id!==runId)return;await setStep(i,id);if(i<captions.length-1 && !(await wait(base*.68,id)))return}if(!(await wait(1100,id)))return;scenarioIndex=(scenarioIndex+1)%scenarios.length}}
  async function rebuild(target){const id=++runId;resetVisual();applyScenario();for(let i=0;i<=target;i++)await setStep(i,id,true);step=target;setCaption(target)}
  els.play?.addEventListener("click",()=>{playing=!playing;els.play.textContent=playing?"Pausar":"Continuar"});
  $("#demo-next")?.addEventListener("click",async()=>{playing=false;els.play.textContent="Continuar";await rebuild(Math.min(captions.length-1,step+1))});
  $("#demo-prev")?.addEventListener("click",async()=>{playing=false;els.play.textContent="Continuar";await rebuild(Math.max(0,step-1))});
  $("#demo-restart")?.addEventListener("click",()=>{scenarioIndex=0;playing=true;els.play.textContent="Pausar";autoplay()});
  resetVisual();applyScenario();if(reduced){playing=false;els.play.textContent="Continuar"}else autoplay();
}

hydrateFounderStatus();
