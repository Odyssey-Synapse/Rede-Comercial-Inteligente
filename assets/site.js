const BRAND_NAME="Uai Perto";
const BRAND_TAGLINE="Uberaba mais perto de você.";

function ensureVercelAnalytics(){
  if(window.__uaiVercelAnalyticsLoaded)return;
  window.__uaiVercelAnalyticsLoaded=true;
  window.va=window.va||function(){(window.vaq=window.vaq||[]).push(arguments)};
  const script=document.createElement("script");
  script.defer=true;
  script.src="/_vercel/insights/script.js";
  script.dataset.uaiAnalytics="vercel";
  document.head.append(script);
}
ensureVercelAnalytics();

function ensureBrandStyles(){
  if(document.querySelector('link[href^="/assets/uai-perto.css"]'))return;
  const link=document.createElement("link");
  link.rel="stylesheet";
  link.href="/assets/uai-perto.css?v=3.1.20";
  link.dataset.uaiPertoBrand="3.1.20";
  document.head.append(link);
}
ensureBrandStyles();
document.documentElement.dataset.brand="uai-perto";

const pages=[["/rede.html","A Rede"],["/empresas.html","Para empresas"],["/tecnologia.html","Tecnologia"],["/transparencia.html","Transparência"],["/contato.html","Contato"]];
const currentPath=location.pathname.endsWith("/")&&location.pathname!=="/"?location.pathname.slice(0,-1):location.pathname;
const header=document.querySelector("#site-header");
const footer=document.querySelector("#site-footer");

if(header)header.innerHTML=`<header class="site-header"><div class="container nav"><a class="brand uai-brand-lockup" href="/" aria-label="Uai Perto — ${BRAND_TAGLINE}"><img src="/assets/uai-perto-logo-horizontal.svg" width="240" height="66" alt="Uai Perto — ${BRAND_TAGLINE}"></a><nav class="nav-links" id="nav-links" aria-label="Navegação principal">${pages.map(([href,label])=>`<a href="${href}" class="${currentPath===href?'active':''}">${label}</a>`).join("")}</nav><div class="nav-actions"><button class="icon-button" id="theme-toggle" aria-label="Alternar modo claro e escuro"><span id="theme-icon">◐</span><span class="theme-label">Tema</span></button><a class="button button-primary button-small" href="/participar.html">Quero participar</a><button class="icon-button menu-toggle" id="menu-toggle" aria-label="Abrir menu" aria-expanded="false" aria-controls="nav-links">☰</button></div></div></header>`;

if(footer)footer.innerHTML=`<footer class="site-footer"><div class="container"><div class="footer-top"><div><a class="brand uai-brand-lockup uai-brand-lockup-footer" href="/" aria-label="Uai Perto — ${BRAND_TAGLINE}"><img src="/assets/uai-perto-logo-horizontal.svg" width="240" height="66" alt="Uai Perto — ${BRAND_TAGLINE}"></a><p class="footer-brand-text">Você conta o que precisa resolver. O Uai Perto trabalha para aproximar sua necessidade de soluções locais em Uberaba.</p></div><div class="footer-col"><strong>Conheça</strong><a href="/rede.html">A Rede</a><a href="/tecnologia.html">Tecnologia</a><a href="/transparencia.html">Transparência</a><a href="/privacidade.html">Privacidade</a></div><div class="footer-col"><strong>Participar</strong><a href="/empresas.html">Para empresas</a><a href="/participar.html?perfil=consumidor">Sou consumidor</a><a href="/contato.html">Contato</a></div></div><div class="footer-bottom"><span>© <span id="year"></span> Uai Perto.</span><span>Começando por Uberaba.</span></div></div></footer>`;

document.querySelector("#year")?.replaceChildren(String(new Date().getFullYear()));

function getTheme(){return document.documentElement.dataset.theme||localStorage.getItem("aa-theme")||"light"}
function setTheme(theme){document.documentElement.dataset.theme=theme;localStorage.setItem("aa-theme",theme);document.querySelector("#theme-icon")?.replaceChildren(theme==="dark"?"☀":"☾")}
setTheme(getTheme());
document.querySelector("#theme-toggle")?.addEventListener("click",()=>setTheme(getTheme()==="dark"?"light":"dark"));

const menu=document.querySelector("#menu-toggle");
const nav=document.querySelector("#nav-links");
menu?.addEventListener("click",()=>{const open=nav?.classList.toggle("open")||false;menu.setAttribute("aria-expanded",String(open));menu.textContent=open?"×":"☰"});
nav?.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>{nav.classList.remove("open");menu?.setAttribute("aria-expanded","false");if(menu)menu.textContent="☰"}));

if("IntersectionObserver" in window){
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add("visible");observer.unobserve(entry.target)}}),{threshold:.1});
  document.querySelectorAll(".reveal").forEach(el=>observer.observe(el));
}else document.querySelectorAll(".reveal").forEach(el=>el.classList.add("visible"));

const examples={
  casa:{need:"Meu chuveiro queimou agora à noite. Preciso de alguém que venha hoje, porque tenho criança em casa.",tags:["hoje à noite","urgente","não pode esperar"],solution:"Procurar quem consiga instalar o chuveiro na região e no horário em que você precisa.",note:"Você não precisa começar procurando uma categoria perfeita. Começa contando o problema."},
  visita:{need:"Vou receber visita amanhã e preciso de mercado, padaria, algo pronto e entrega dentro do meu orçamento.",tags:["amanhã","orçamento","entrega","mais de uma compra"],solution:"Comparar se uma empresa resolve tudo ou se uma combinação faz mais sentido para o pedido.",note:"Uma única necessidade pode envolver mais de um parceiro sem obrigar você a refazer toda a busca."},
  carro:{need:"Meu carro não liga de manhã. Preciso resolver antes do trabalho, mas não consigo levar até a oficina.",tags:["carro não liga","manhã","atendimento no local"],solution:"Priorizar quem consegue ir até o carro ou organizar uma alternativa que respeite a restrição de deslocamento.",note:"O que você não consegue fazer também faz parte do problema e muda a solução."}
};

const exampleContent=document.querySelector("#example-content");
function renderExample(key){
  const data=examples[key];
  if(!data||!exampleContent)return;
  exampleContent.innerHTML=`<div class="need-card"><small>O QUE VOCÊ DIRIA</small><strong>“${data.need}”</strong><div class="context-tags">${data.tags.map(tag=>`<span>${tag}</span>`).join("")}</div></div><div class="route-line"></div><div class="solution-card"><div><small>O QUE A PROCURA PRECISA RESOLVER</small><strong>${data.solution}</strong></div><em>problema primeiro</em></div><p class="example-note">${data.note}</p>`;
  document.querySelectorAll(".example-chip").forEach(button=>button.classList.toggle("active",button.dataset.example===key));
}
document.querySelectorAll(".example-chip").forEach(button=>button.addEventListener("click",()=>renderExample(button.dataset.example)));
if(exampleContent)renderExample("casa");

const stepData={
  understand:{k:"01 · ENTENDER",title:"A pessoa fala como falaria com outra pessoa.",text:"A tecnologia identifica o que parece importar naquela frase — problema, urgência, região, prazo e outras condições — sem exigir linguagem técnica.",left:"“Preciso resolver isso hoje”",right:"O que realmente importa"},
  resolve:{k:"02 · ENCONTRAR",title:"A procura tenta respeitar o que foi pedido.",text:"Em vez de devolver uma lista genérica, a Rede trabalha para aproximar alternativas que façam sentido para aquela situação.",left:"Problema + condições",right:"Alternativas compatíveis"},
  learn:{k:"03 · APRENDER",title:"O resultado mostra onde a Rede está forte e onde ainda falha.",text:"Uma necessidade atendida revela capacidade. Uma necessidade recorrente sem solução mostra onde a cobertura precisa melhorar.",left:"O que aconteceu",right:"O que precisa melhorar"},
  improve:{k:"04 · MELHORAR",title:"A próxima ação depende do problema real.",text:"Às vezes falta empresa. Às vezes falta informação. Às vezes a melhor decisão é não fingir que existe uma resposta suficiente ainda.",left:"Situação observada",right:"Próxima ação coerente"}
};

const stepContent=document.querySelector("#step-content");
function renderStep(key){
  const data=stepData[key];
  if(!data||!stepContent)return;
  stepContent.innerHTML=`<span class="step-kicker">${data.k}</span><h3 class="h2">${data.title}</h3><p class="lead">${data.text}</p><div class="step-visual"><div class="mini-panel"><small>Entrada</small><strong>${data.left}</strong></div><span>→</span><div class="mini-panel"><small>Resultado</small><strong>${data.right}</strong></div></div>`;
  document.querySelectorAll(".step-button").forEach(button=>button.classList.toggle("active",button.dataset.step===key));
}
document.querySelectorAll(".step-button").forEach(button=>button.addEventListener("click",()=>renderStep(button.dataset.step)));
if(stepContent)renderStep("understand");

const canvas=document.querySelector("#network-canvas");
if(canvas&&!location.search.includes("static=1")&&!matchMedia("(prefers-reduced-motion: reduce)").matches){
  const ctx=canvas.getContext("2d");
  let width=0,height=0,dpr=1,pointer={x:-999,y:-999};
  const count=innerWidth<720?18:32;
  const nodes=Array.from({length:count},()=>({x:Math.random(),y:Math.random(),vx:(Math.random()-.5)*.00007,vy:(Math.random()-.5)*.00007,r:1.2+Math.random()*1.7}));
  const resize=()=>{dpr=Math.min(devicePixelRatio||1,2);width=canvas.clientWidth;height=canvas.clientHeight;canvas.width=width*dpr;canvas.height=height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0)};
  resize();
  addEventListener("resize",resize,{passive:true});
  canvas.addEventListener("pointermove",event=>{const rect=canvas.getBoundingClientRect();pointer={x:event.clientX-rect.left,y:event.clientY-rect.top}});
  canvas.addEventListener("pointerleave",()=>pointer={x:-999,y:-999});
  function draw(){
    ctx.clearRect(0,0,width,height);
    const accent=getComputedStyle(document.documentElement).getPropertyValue("--accent").trim();
    for(const node of nodes){node.x+=node.vx;node.y+=node.vy;if(node.x<0||node.x>1)node.vx*=-1;if(node.y<0||node.y>1)node.vy*=-1}
    for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){const a=nodes[i],b=nodes[j],ax=a.x*width,ay=a.y*height,bx=b.x*width,by=b.y*height,dist=Math.hypot(ax-bx,ay-by);if(dist<150){ctx.globalAlpha=(1-dist/150)*.12;ctx.strokeStyle=accent;ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.stroke()}}
    for(const node of nodes){const x=node.x*width,y=node.y*height,pd=Math.hypot(x-pointer.x,y-pointer.y);ctx.globalAlpha=pd<120?.6:.26;ctx.fillStyle=accent;ctx.beginPath();ctx.arc(x,y,pd<120?node.r*1.6:node.r,0,Math.PI*2);ctx.fill()}
    ctx.globalAlpha=1;requestAnimationFrame(draw);
  }
  draw();
}

function applyBrandMetadata(){
  if(!document.title.includes(BRAND_NAME))document.title=`${BRAND_NAME} · ${document.title}`;
  let description=document.querySelector('meta[name="description"]');
  if(!description){description=document.createElement("meta");description.name="description";document.head.append(description)}
  description.content=description.content||"Uai Perto aproxima necessidades reais de soluções locais em Uberaba.";
  let theme=document.querySelector('meta[name="theme-color"]');
  if(!theme){theme=document.createElement("meta");theme.name="theme-color";document.head.append(theme)}
  theme.content="#335749";
  let icon=document.querySelector('link[rel~="icon"]');
  if(!icon){icon=document.createElement("link");icon.rel="icon";document.head.append(icon)}
  icon.type="image/png";
  icon.href="/assets/uai-perto-symbol.png";
}

function ensureHeroBrand(){
  const hero=document.querySelector(".hero-copy");
  if(!hero||hero.querySelector(".uai-hero-brand"))return;
  const lockup=document.createElement("div");
  lockup.className="uai-hero-brand";
  lockup.innerHTML=`<img src="/assets/uai-perto-logo-horizontal.svg" width="240" height="66" alt="Uai Perto — ${BRAND_TAGLINE}">`;
  hero.prepend(lockup);
}

function ensureHomeMeuUaiPerto(){
  const isHome=location.pathname==="/"||location.pathname==="/index.html";
  if(!isHome||document.querySelector("#meu-uai-perto"))return;
  const hero=document.querySelector(".hero");
  if(!hero)return;

  if(!document.querySelector('link[href^="/assets/consumer-home.css"]')){
    const link=document.createElement("link");
    link.rel="stylesheet";
    link.href="/assets/consumer-home.css?v=0.1.2";
    document.head.append(link);
  }

  const section=document.createElement("section");
  section.className="section home-uai-life";
  section.id="meu-uai-perto";
  section.innerHTML=`<div class="container">
    <div class="section-head">
      <div><span class="eyebrow">UM LUGAR PARA O QUE VOCÊ AINDA VAI PRECISAR</span><h2 class="h2">Você lembra de uma coisa agora. Outra amanhã. Quando chegar a hora de resolver, o Uai Perto já sabe o resto.</h2></div>
      <p>Vai guardando aos poucos. Quando quiser comprar, contratar ou resolver, você só diz: <strong>“resolve isso pra mim”.</strong></p>
    </div>
    <div class="home-uai-life-grid">
      <a class="home-uai-life-card" href="/meu-uai-perto.html?criar=compras"><span class="home-uai-life-icon">🛒</span><small>COMPRA DA SEMANA</small><h3>“Lembrei de mais uma coisa.”</h3><p>Adicione agora. Resolva a lista quando quiser.</p><strong>Guardar na minha lista →</strong></a>
      <a class="home-uai-life-card" href="/meu-uai-perto.html?criar=casa"><span class="home-uai-life-icon">🏠</span><small>CASA E OBRA</small><h3>“Ainda falta fazer isso aqui.”</h3><p>Medidas, materiais e etapas ficam no mesmo lugar.</p><strong>Guardar na minha casa →</strong></a>
      <a class="home-uai-life-card" href="/meu-uai-perto.html?criar=veiculo"><span class="home-uai-life-icon">🚗</span><small>SEU VEÍCULO</small><h3>“Depois eu preciso olhar esse barulho.”</h3><p>Você registra hoje para não começar do zero depois.</p><strong>Guardar no meu veículo →</strong></a>
      <a class="home-uai-life-card" href="/meu-uai-perto.html?criar=pet"><span class="home-uai-life-icon">🐶</span><small>SEU PET</small><h3>“A vacina dele está chegando.”</h3><p>Cuidados e necessidades acompanham o pet com você.</p><strong>Guardar no meu pet →</strong></a>
      <a class="home-uai-life-card" href="/meu-uai-perto.html?criar=evento"><span class="home-uai-life-icon">🎉</span><small>SEU EVENTO</small><h3>“Ainda falta buffet, bolo e som.”</h3><p>Monte aos poucos. Procure quando estiver pronto.</p><strong>Guardar no meu evento →</strong></a>
    </div>
    <div class="home-uai-life-actions"><a class="button button-primary" href="/meu-uai-perto.html">Quero guardar o que preciso →</a><a class="button button-ghost" href="/testar">Quero testar como consumidor</a></div>
    <p class="home-uai-life-note">Guardar não inicia nenhuma procura. Você decide quando o Uai Perto deve agir.</p>
  </div>`;
  hero.insertAdjacentElement("afterend",section);

}

applyBrandMetadata();
ensureHeroBrand();
ensureHomeMeuUaiPerto();
const bridge=document.querySelector("#demo-bridge-core span");
if(bridge)bridge.innerHTML="UAI<br>PERTO";
