from pathlib import Path
import json
import re

ROOT=Path('.')


def read(path):
    return (ROOT/path).read_text(encoding='utf-8')

def write(path, content):
    (ROOT/path).write_text(content, encoding='utf-8')

def must_replace(text, old, new, label):
    if old not in text:
        raise SystemExit(f'Padrão não encontrado: {label}')
    return text.replace(old,new)

# 1) Versionamento visual estático nas páginas públicas.
public_html=['index.html','rede.html','empresas.html','tecnologia.html','transparencia.html','calculadora.html','contato.html','privacidade.html']
for name in public_html:
    text=read(name)
    text=text.replace('/assets/uai-perto.css?v=3.1.18','/assets/uai-perto.css?v=3.1.20')
    text=text.replace('/assets/uai-perto.css?v=3.1.19','/assets/uai-perto.css?v=3.1.20')
    write(name,text)

# 2) Navegação global: participação geral primeiro separa público; calculadora deixa menu/rodapé geral.
site=read('assets/site.js')
site=site.replace('link.href="/assets/uai-perto.css?v=3.1.18";','link.href="/assets/uai-perto.css?v=3.1.20";')
site=site.replace('link.dataset.uaiPertoBrand="3.1.18";','link.dataset.uaiPertoBrand="3.1.20";')
site=must_replace(site,
    'const pages=[["/rede.html","A Rede"],["/empresas.html","Para empresas"],["/tecnologia.html","Tecnologia"],["/transparencia.html","Transparência"],["/calculadora.html","Participação"],["/contato.html","Contato"]];',
    'const pages=[["/rede.html","A Rede"],["/empresas.html","Para empresas"],["/tecnologia.html","Tecnologia"],["/transparencia.html","Transparência"],["/contato.html","Contato"]];',
    'menu global sem calculadora')
site=must_replace(site,'href="/calculadora.html">Ver participação</a>','href="/participar.html">Quero participar</a>','CTA global')
site=must_replace(site,'<a href="/calculadora.html">Participação comercial</a>','', 'rodapé sem calculadora')
site=site.replace('<img src="/assets/uai-perto-logo-horizontal.png" width="240" height="63"', '<img src="/assets/uai-perto-logo-horizontal.png" srcset="/assets/uai-perto-logo-horizontal.png 1x, /assets/uai-perto-logo-horizontal-hd.png 4x" width="240" height="62"')
write('assets/site.js',site)

# 3) Home: CTA geral abre seleção de público; simulador não é atalho da jornada geral/consumidor.
index=read('index.html')
index=must_replace(index,'href="#parceiros-iniciais">Quero participar da Rede</a>','href="/participar.html">Quero participar da Rede</a>','CTA hero da home')
write('index.html',index)

# Qualquer link direto ao simulador fora de empresas/calculadora vira entrada pela jornada empresarial.
non_company=['index.html','rede.html','tecnologia.html','transparencia.html','contato.html','privacidade.html']
pattern=re.compile(r'<a([^>]*?)href="/calculadora\.html"([^>]*)>(.*?)</a>',re.S)
for name in non_company:
    text=read(name)
    def repl(m):
        return f'<a{m.group(1)}href="/empresas.html"{m.group(2)}>Conhecer participação empresarial →</a>'
    text=pattern.sub(repl,text)
    write(name,text)

# 4) Página de decisão de participação, sem formulário e sem calculadora.
participar='''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="description" content="Escolha como você quer conhecer e participar do Uai Perto em Uberaba: como consumidor ou como empresa."><meta name="theme-color" content="#335749"><title>Quero participar — Uai Perto</title><script>(function(){try{document.documentElement.dataset.theme=localStorage.getItem("aa-theme")||(matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light")}catch(e){document.documentElement.dataset.theme="light"}})()</script><link rel="stylesheet" href="/assets/styles.css"><link rel="stylesheet" href="/assets/uai-perto.css?v=3.1.20"><link rel="icon" type="image/png" href="/assets/uai-perto-symbol.png"></head><body><div id="site-header"></div>
<section class="page-hero participation-hero"><div class="container narrow"><div class="breadcrumb"><a href="/">Início</a><span>›</span>Participar</div><span class="eyebrow">Uma entrada, dois caminhos</span><h1 class="h1">Como você quer conhecer o Uai Perto?</h1><p class="lead">Escolha o caminho que combina com você. O consumidor conhece a experiência da Rede. A empresa conhece como sua capacidade pode participar.</p></div></section>
<section class="section"><div class="container participation-choice-grid" aria-label="Escolha como participar do Uai Perto">
<a class="participation-choice" href="/#demonstracao"><span class="participation-choice-type">Sou consumidor</span><h2>Quero entender como o Uai Perto poderá me ajudar.</h2><p>Veja a Rede interpretando uma necessidade, organizando contexto e aproximando caminhos de solução em Uberaba.</p><strong>Conhecer a experiência →</strong></a>
<a class="participation-choice participation-choice-company" href="/empresas.html"><span class="participation-choice-type">Tenho uma empresa</span><h2>Quero entender como minha empresa pode entrar na Rede.</h2><p>Conheça capacidade, participação comercial e, dentro da jornada empresarial, o simulador de enquadramento.</p><strong>Conhecer a participação empresarial →</strong></a>
</div></section>
<section class="section-sm"><div class="container"><p class="fine participation-note">Esta escolha apenas organiza sua navegação. Nenhum cadastro ou formulário é aberto nesta etapa.</p></div></section>
<div id="site-footer"></div><script type="module" src="/assets/site.js"></script></body></html>'''
write('participar.html',participar)

# 5) Coreografia: um foco visual por vez e tempo proporcional ao conteúdo.
demo=read('assets/home-demo.js')
demo=demo.replace('const base=1120;','const base=950;')
demo=must_replace(demo,
    '  const els={\n    consumer:$("#demo-consumer")',
    '  const els={\n    stage:$(".demo-stage"),\n    consumer:$("#demo-consumer")',
    'referência do palco da demo')
demo=must_replace(demo,
    '  function show(el,on=true){el?.classList.toggle("show",on)}\n  function side(which){const consumer=which==="consumer";els.consumer?.classList.toggle("active",consumer);els.consumer?.classList.toggle("inactive",!consumer);els.company?.classList.toggle("active",!consumer);els.company?.classList.toggle("inactive",consumer)}',
    '  function show(el,on=true){el?.classList.toggle("show",on)}\n  function readingMs(text){const words=String(text||"").trim().split(/\\s+/).filter(Boolean).length;return Math.max(1600,Math.min(5200,words*175))}\n  function stepHold(i,s){if(i===0)return readingMs(s.request);if(i===1)return 2200;if(i===2)return readingMs(s.assistant);if(i===3)return readingMs(s.solutions.flat().join(" "));if(i===4)return 1900;if(i===5)return readingMs(s.question);if(i===6)return Math.max(2200,Math.min(4700,readingMs(`${s.answer} ${s.response}`)));if(i===7)return 2400;if(i===8)return Math.max(2200,readingMs(s.done));return 1800}\n  function focus(which){if(els.stage)els.stage.dataset.focus=which}\n  function side(which){const consumer=which==="consumer";els.consumer?.classList.toggle("active",consumer);els.consumer?.classList.toggle("inactive",!consumer);els.company?.classList.toggle("active",!consumer);els.company?.classList.toggle("inactive",consumer)}',
    'funções de leitura e foco')
demo=demo.replace('side("consumer");step=0;setCaption(0)}','side("consumer");focus("consumer");step=0;setCaption(0)}')
demo=re.sub(r'  async function typeText\(text,id,instant=false\)\{.*?\}\n  async function setStep',
    '  async function typeText(text,id,instant=false){if(id!==runId)return;els.assistantText.textContent=text;if(!instant&&!reduced){els.assistant?.classList.add("reading-focus");await wait(180,id);els.assistant?.classList.remove("reading-focus")}}\n  async function setStep', demo, flags=re.S)

demo=demo.replace('if(i===0){side("consumer");','if(i===0){focus("consumer");side("consumer");')
demo=demo.replace('if(i===1){show(els.ai);','if(i===1){focus("consumer");show(els.ai);')
demo=demo.replace('if(i===2){show(els.ai,false);','if(i===2){focus("consumer");show(els.ai,false);')
demo=demo.replace('if(i===3){els.solutions.innerHTML','if(i===3){focus("consumer");els.solutions.innerHTML')
demo=demo.replace('if(i===4){side("company");els.bridge.classList.add("active");','if(i===4){focus("bridge");side("company");els.bridge.classList.add("active");')
demo=demo.replace('show(els.opportunity);els.open.textContent="1";','show(els.opportunity);focus("company");els.open.textContent="1";')
demo=demo.replace('if(i===5){side("company");show(els.companyChat);','if(i===5){focus("company");side("company");show(els.companyChat);')
demo=demo.replace('await wait(d*.34,id);side("consumer");els.companyQuestion','await wait(d*.34,id);focus("consumer");side("consumer");els.companyQuestion')
demo=demo.replace('if(i===6){side("consumer");els.answer','if(i===6){focus("consumer");side("consumer");els.answer')
demo=demo.replace('await wait(d*.32,id);side("company");els.n2','await wait(d*.32,id);focus("company");side("company");els.n2')
demo=demo.replace('if(i===7){side("company");show(els.quote);','if(i===7){focus("company");side("company");show(els.quote);')
demo=demo.replace('await wait(d*.30,id);side("consumer");els.consumerQuote','await wait(d*.30,id);focus("consumer");side("consumer");els.consumerQuote')
demo=demo.replace('if(i===8){side("consumer");els.accept','if(i===8){focus("consumer");side("consumer");els.accept')
demo=demo.replace('await wait(d*.30,id);side("company");show(els.quoteState);','await wait(d*.30,id);focus("company");side("company");show(els.quoteState);')
demo=demo.replace('await wait(d*.26,id);side("consumer");els.done','await wait(d*.26,id);focus("consumer");side("consumer");els.done')
demo=demo.replace('if(i===9){side("company");els.bridge.classList.add("active");','if(i===9){focus("bridge");side("company");els.bridge.classList.add("active");')
demo=must_replace(demo,'if(i<captions.length-1 && !(await wait(base*.68,id)))return','if(i<captions.length-1 && !(await wait(stepHold(i,scenarios[scenarioIndex]),id)))return','tempo de leitura por etapa')
write('assets/home-demo.js',demo)

# 6) CSS escopado: HD/retina, toque móvel, participação e foco da demonstração.
css=read('assets/uai-perto.css')
marker='/* V3.1.20 — participação, toque móvel, logo retina e foco da demonstração */'
if marker in css:
    css=css.split(marker)[0].rstrip()+"\n"
css += r'''

/* V3.1.20 — participação, toque móvel, logo retina e foco da demonstração */
.uai-brand-lockup img,.uai-hero-brand img{image-rendering:auto;object-fit:contain}
.participation-choice-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}
.participation-choice{min-height:300px;display:flex;flex-direction:column;justify-content:flex-end;padding:clamp(26px,4vw,40px);border:1px solid var(--line);border-radius:28px;background:var(--surface);box-shadow:var(--shadow);transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease}
.participation-choice:hover{transform:translateY(-3px);border-color:color-mix(in srgb,var(--brand-sunflower) 48%,var(--line));box-shadow:0 20px 48px rgba(51,87,73,.14)}
.participation-choice-type{display:inline-flex;align-self:flex-start;margin-bottom:auto;padding:7px 10px;border-radius:999px;background:var(--green-soft);color:var(--ink);font-size:.76rem;font-weight:850}
.participation-choice h2{font-size:clamp(1.55rem,2.6vw,2.35rem);line-height:1.08;letter-spacing:-.035em;margin:28px 0 12px}
.participation-choice p{color:var(--muted);margin:0 0 22px;max-width:48ch}
.participation-choice strong{color:var(--ink);font-weight:850}
.participation-choice-company{background:color-mix(in srgb,var(--surface) 88%,var(--brand-sunflower) 12%)}
.participation-note{text-align:center;margin:0}

.demo-stage[data-focus="consumer"] .demo-side.consumer,.demo-stage[data-focus="company"] .demo-side.company{opacity:1;transform:scale(1);filter:none;box-shadow:0 16px 42px rgba(51,87,73,.13)}
.demo-stage[data-focus="consumer"] .demo-side.company,.demo-stage[data-focus="company"] .demo-side.consumer{opacity:.38;transform:scale(.975);filter:saturate(.72)}
.demo-stage[data-focus="bridge"] .demo-side{opacity:.46;transform:scale(.982);filter:saturate(.78)}
.demo-stage[data-focus="bridge"] .demo-bridge-core{transform:scale(1.07);box-shadow:0 14px 34px rgba(51,87,73,.22)}
.demo-bridge-core{transition:transform .28s ease,box-shadow .28s ease}
.demo-side{transition:opacity .28s ease,transform .28s ease,box-shadow .28s ease,filter .28s ease}
.demo-assistant.reading-focus,.demo-message.reading-focus{outline:2px solid color-mix(in srgb,var(--brand-sunflower) 55%,transparent);outline-offset:3px}

@media (pointer:coarse),(max-width:760px){
  .button,.icon-button,.example-chip,.step-button,.demo-speed,.nav-links a{touch-action:manipulation;-webkit-tap-highlight-color:rgba(211,146,55,.18)}
  .button{min-height:48px;padding-block:12px}
  .icon-button,.demo-controls .icon-button{height:48px;min-width:48px}
  .demo-speed{height:48px;min-height:48px;padding-inline:14px}
  .example-chip{min-height:44px;padding:10px 14px}
  .step-button{min-height:48px}
  .nav-links a{min-height:44px;display:flex;align-items:center}
  .button:active,.icon-button:active,.example-chip:active,.step-button:active,.participation-choice:active{transform:scale(.98)}
  .demo-controls{gap:10px}
}
@media(max-width:760px){
  .participation-choice-grid{grid-template-columns:1fr}
  .participation-choice{min-height:260px}
  .demo-stage .demo-side.inactive{display:none}
  .demo-stage[data-focus="bridge"] .demo-side.active{opacity:.55;transform:none;filter:saturate(.82)}
  .demo-toolbar{gap:12px}
}
@media(max-width:430px){
  .participation-choice{min-height:240px;padding:24px}
  .demo-controls{display:grid;grid-template-columns:repeat(4,48px) minmax(96px,1fr);overflow:visible}
  .demo-controls .button{min-width:0;padding-inline:10px}
  .demo-speed{max-width:none;width:100%}
}
@media(prefers-reduced-motion:reduce){
  .participation-choice,.demo-side,.demo-bridge-core{transition:none!important}
  .participation-choice:hover,.participation-choice:active,.button:active,.icon-button:active,.example-chip:active,.step-button:active{transform:none!important}
}
'''
write('assets/uai-perto.css',css)

# 7) Versão do pacote, sem tocar em dependências.
pkg=json.loads(read('package.json'))
pkg['version']='3.1.20'
write('package.json',json.dumps(pkg,ensure_ascii=False,indent=2)+"\n")
lock=read('package-lock.json')
lock=re.sub(r'("version"\s*:\s*")3\.1\.19(")',r'\g<1>3.1.20\2',lock,count=2)
lock=re.sub(r'("version"\s*:\s*")3\.1\.18(")',r'\g<1>3.1.20\2',lock,count=2)
write('package-lock.json',lock)

# 8) Notas de release com escopo explícito.
release='''# V3.1.20 — participação, toque móvel, logo retina e foco da demonstração\n\n## Escopo\n\n- Corrige a entrada geral de participação, separando consumidor e empresa antes de continuar a navegação.\n- Remove a calculadora do menu, rodapé e atalhos da jornada geral; o simulador permanece disponível na página de empresas.\n- Adiciona página `participar.html` sem formulários.\n- Mantém a paleta aprovada sem alteração.\n- Adiciona asset de logo em alta densidade para telas Retina/HiDPI sem redesenhar a marca.\n- Amplia alvos de toque em dispositivos móveis e adiciona retorno visual ao pressionar.\n- Reorganiza a demonstração automática para um foco visual principal por vez e tempo de permanência proporcional ao conteúdo.\n- Mantém controles de pausa, anterior, próximo, velocidade e `prefers-reduced-motion`.\n\n## Fora do escopo\n\nNão foram alterados formulários, regras comerciais, cálculos, valores, APIs, banco de dados, migrações, autenticação, Turnstile, integrações, rotas de backend ou infraestrutura.\n'''
write('RELEASE_NOTES_V3_1_20.md',release)

# 9) Auditorias locais de escopo funcional.
for name in non_company+['participar.html']:
    text=read(name)
    if '/calculadora.html' in text:
        raise SystemExit(f'Calculadora ainda exposta fora da jornada empresarial: {name}')
if '<form' in read('participar.html').lower():
    raise SystemExit('Participar.html não pode introduzir formulário nesta versão')
if '/participar.html' not in read('assets/site.js') or '/participar.html' not in read('index.html'):
    raise SystemExit('CTA geral de participação não foi conectado corretamente')
if 'href="/calculadora.html"' not in read('empresas.html'):
    raise SystemExit('A página empresarial precisa continuar oferecendo o simulador')

print('V3.1.20 transformada dentro do escopo definido.')
