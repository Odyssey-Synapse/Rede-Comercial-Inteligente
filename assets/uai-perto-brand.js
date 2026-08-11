const BRAND_NAME="Uai Perto";
const BRAND_TAGLINE="Uberaba mais perto de você.";
const BRAND_DESCRIPTION="Uai Perto é uma Rede Comercial Inteligente em Uberaba: começa pela necessidade da pessoa e trabalha para aproximá-la de soluções locais relevantes.";

function ensureBrandStyles(){
  if(document.querySelector('link[data-uai-perto-brand]'))return;
  const link=document.createElement("link");
  link.rel="stylesheet";
  link.href="/assets/uai-perto.css?v=3.1.17";
  link.dataset.uaiPertoBrand="3.1.17";
  document.head.append(link);
}

function replaceBrandText(value){
  if(!value)return value;
  return value
    .replace(/Projeto RLI é um nome provisório\. Marca, nome fantasia e razão social da operadora ainda serão definidos\./gi,"Uai Perto é a identidade pública da Rede Comercial Inteligente em Uberaba.")
    .replace(/NOME PROVISÓRIO\s*·\s*Rede Comercial Inteligente em construção/gi,"UBERABA · Rede Comercial Inteligente")
    .replace(/REDE LOCAL INTELIGENTE\s*·\s*NOME PROVISÓRIO/gi,BRAND_TAGLINE)
    .replace(/Projeto RLI\s*[—–·-]\s*nome provisório/gi,BRAND_NAME)
    .replace(/Projeto RLI/gi,BRAND_NAME)
    .replace(/projeto RLI/gi,BRAND_NAME)
    .replace(/Rede RLI/gi,BRAND_NAME)
    .replace(/REDE RLI/g,"UAI PERTO")
    .replace(/Achei Aqui/gi,BRAND_NAME)
    .replace(/\bRLI\b/g,BRAND_NAME)
    .replace(/\s*·\s*nome provisório\.?/gi,"")
    .replace(/\s*—\s*nome provisório\b/gi,"");
}

function brandTextNodes(){
  if(!document.body)return;
  const skip=new Set(["SCRIPT","STYLE","NOSCRIPT","CODE","PRE"]);
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT,{acceptNode(node){
    const parent=node.parentElement;
    if(!parent||skip.has(parent.tagName))return NodeFilter.FILTER_REJECT;
    return /RLI|Projeto RLI|Achei Aqui|nome provisório/i.test(node.nodeValue||"")?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;
  }});
  const nodes=[];
  while(walker.nextNode())nodes.push(walker.currentNode);
  nodes.forEach(node=>{node.nodeValue=replaceBrandText(node.nodeValue)});

  document.querySelectorAll("[aria-label],[title],[alt],[placeholder]").forEach(el=>{
    ["aria-label","title","alt","placeholder"].forEach(attr=>{
      const current=el.getAttribute(attr);
      if(current&&/RLI|Projeto RLI|Achei Aqui|nome provisório/i.test(current))el.setAttribute(attr,replaceBrandText(current));
    });
  });
}

function ensureMetadata(){
  document.title=replaceBrandText(document.title);
  if(document.title===BRAND_NAME||!document.title.includes(BRAND_NAME))document.title=`${BRAND_NAME} · Rede Comercial Inteligente de Uberaba`;
  let description=document.querySelector('meta[name="description"]');
  if(!description){description=document.createElement("meta");description.name="description";document.head.append(description)}
  description.content=BRAND_DESCRIPTION;
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
  const img=document.createElement("img");
  img.src="/assets/uai-perto-logo-horizontal.png";
  img.alt=`${BRAND_NAME} — ${BRAND_TAGLINE}`;
  img.width=240;
  img.height=62;
  lockup.append(img);
  hero.prepend(lockup);
}

function applyUaiPertoBrand(){
  ensureBrandStyles();
  document.documentElement.dataset.brand="uai-perto";
  brandTextNodes();
  ensureMetadata();
  ensureHeroBrand();
  const bridge=document.querySelector("#demo-bridge-core span");
  if(bridge)bridge.innerHTML="UAI<br>PERTO";
  document.querySelectorAll(".brand-name").forEach(el=>el.textContent=BRAND_NAME);
  document.querySelectorAll(".brand small").forEach(el=>el.textContent=BRAND_TAGLINE);
}

applyUaiPertoBrand();
requestAnimationFrame(applyUaiPertoBrand);
window.addEventListener("pageshow",applyUaiPertoBrand,{passive:true});
