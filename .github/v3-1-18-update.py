from pathlib import Path
import re

HTML_FILES = [
    Path('index.html'), Path('rede.html'), Path('empresas.html'),
    Path('tecnologia.html'), Path('transparencia.html'),
    Path('calculadora.html'), Path('contato.html'), Path('privacidade.html')
]

EXACT = [
    ('Projeto RLI é um nome provisório. Marca, nome fantasia e razão social da operadora ainda serão definidos.', 'Uai Perto é a identidade pública da Rede Comercial Inteligente em Uberaba.'),
    ('NOME PROVISÓRIO · Rede Comercial Inteligente em construção', 'UBERABA · Rede Comercial Inteligente'),
    ('REDE LOCAL INTELIGENTE · NOME PROVISÓRIO', 'Uberaba mais perto de você.'),
    ('Projeto RLI — nome provisório · Rede Comercial Inteligente', 'Uai Perto · Rede Comercial Inteligente em Uberaba'),
    ('Projeto RLI (nome provisório)', 'Uai Perto'),
    ('Projeto RLI · nome provisório', 'Uai Perto'),
    ('Projeto RLI — nome provisório', 'Uai Perto'),
    ('Projeto RLI', 'Uai Perto'),
    ('projeto RLI', 'Uai Perto'),
    ('Rede RLI', 'Uai Perto'),
    ('REDE RLI', 'UAI PERTO'),
    ('Achei Aqui', 'Uai Perto'),
]

for path in HTML_FILES:
    text = path.read_text(encoding='utf-8')
    for old, new in EXACT:
        text = text.replace(old, new)
    text = re.sub(r'\s*[—–·-]\s*nome provisório\.?', '', text, flags=re.I)
    text = text.replace('content="#0b1f3a"', 'content="#335749"')
    text = text.replace('<div class="orb">RLI</div>', '<div class="orb brand-orb" role="img" aria-label="Uai Perto"></div>')
    text = text.replace('<div class="demo-bridge-core" id="demo-bridge-core"><span>REDE<br>RLI</span></div>', '<div class="demo-bridge-core" id="demo-bridge-core"><span>UAI<br>PERTO</span></div>')
    if '/assets/uai-perto.css' not in text:
        text = text.replace('<link rel="stylesheet" href="/assets/styles.css">', '<link rel="stylesheet" href="/assets/styles.css"><link rel="stylesheet" href="/assets/uai-perto.css?v=3.1.18">')
    else:
        text = re.sub(r'/assets/uai-perto\.css\?v=[^"\']+', '/assets/uai-perto.css?v=3.1.18', text)
    if 'rel="icon"' not in text:
        text = text.replace('</head>', '<link rel="icon" type="image/png" href="/assets/uai-perto-symbol.png"></head>')
    path.write_text(text, encoding='utf-8')

site = Path('assets/site.js')
text = site.read_text(encoding='utf-8')
text = text.replace('v=3.1.17', 'v=3.1.18').replace('dataset.uaiPertoBrand="3.1.17"', 'dataset.uaiPertoBrand="3.1.18"')
text = text.replace("document.querySelector('link[data-uai-perto-brand]')", "document.querySelector('link[href^=\"/assets/uai-perto.css\"]')")
text = re.sub(r'\nfunction replacePublicBrandText\(value\)\{.*?\n\}\n\nfunction applyPublicBrandText\(\)\{.*?\n\}\n', '\n', text, flags=re.S)
text = text.replace('  const currentTitle=replacePublicBrandText(document.title);', '  const currentTitle=document.title;')
text = text.replace('  description.content=replacePublicBrandText(description.content||"Uai Perto é uma Rede Comercial Inteligente em Uberaba: começa pela necessidade da pessoa e trabalha para aproximá-la de soluções locais relevantes.");', '  description.content=description.content||"Uai Perto é uma Rede Comercial Inteligente em Uberaba: começa pela necessidade da pessoa e trabalha para aproximá-la de soluções locais relevantes.";')
text = text.replace('\napplyPublicBrandText();', '')
site.write_text(text, encoding='utf-8')

calc = Path('assets/capacity-calculator.js')
text = calc.read_text(encoding='utf-8')
text = text.replace('<div class="orb">RLI</div>', '<div class="orb brand-orb" role="img" aria-label="Uai Perto"></div>')
calc.write_text(text, encoding='utf-8')

css = Path('assets/uai-perto.css')
text = css.read_text(encoding='utf-8').replace('#596a63', '#4f625a').replace('#e0d7ca', '#e8e1d6')
clarity = '''

/* V3.1.18 — nitidez e hierarquia das copys */
html{-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-rendering:optimizeLegibility;font-kerning:normal}
body{font-weight:500;line-height:1.66;letter-spacing:-.006em}
p,li,label,input,select,textarea{line-height:1.66}
.display,.h1,.h2,.h3,h1,h2,h3{font-weight:850;letter-spacing:-.032em;line-height:1.08;text-wrap:balance}
.display{line-height:1.02}
.lead{font-weight:600;line-height:1.58;letter-spacing:-.012em;color:var(--ink)}
.section-head>p,.page-hero .lead,.hero-copy .lead,.founder-copy>p,.split-feature>div>p{max-width:68ch}
.section-head>p,.card p,.scenario p,.story-panel p,.decision-card p,.language-card p,.fact-card p,.contact-card p,.legal-note p{font-size:1rem;line-height:1.65;color:var(--muted)}
.card h3,.scenario h3,.story-panel h3,.decision-card h3,.language-card h3,.fact-card h3{font-weight:820;line-height:1.2;letter-spacing:-.018em}
.fine{font-size:.88rem;line-height:1.6;color:var(--muted);font-weight:550}
.eyebrow{font-weight:850;letter-spacing:.075em;line-height:1.35}
.button,.nav-links a,.footer-col strong{font-weight:800}
.trust-item strong,.human-list strong,.benefit-list strong,.founder-benefits span{font-weight:800}
.trust-item span,.human-list span,.benefit-list p,.hero-note span{font-weight:550;line-height:1.48}
.demo-caption strong,.demo-message p,.demo-opportunity p,.demo-neg,.demo-quote{font-weight:570}
input,select,textarea{font-size:1rem;font-weight:550;color:var(--ink);background:var(--surface)}
input::placeholder,textarea::placeholder{opacity:.78;color:var(--muted)}
.brand-orb{background:#F2E8D9 url("/assets/uai-perto-symbol.png") center/72% auto no-repeat!important;color:transparent!important;font-size:0!important}
html[data-theme="dark"] .lead{color:#F2E8D9}
html[data-theme="dark"] .section-head>p,html[data-theme="dark"] .card p,html[data-theme="dark"] .fine{color:#e8e1d6}
@media(max-width:720px){
  body{line-height:1.62}
  .display,.h1{letter-spacing:-.026em}
  .h2{letter-spacing:-.024em}
  .lead{line-height:1.55}
  .section-head>p,.card p{font-size:.98rem}
  .fine{font-size:.86rem}
}
'''
if 'V3.1.18 — nitidez e hierarquia das copys' not in text:
    text += clarity
css.write_text(text, encoding='utf-8')

for filename in ('package.json', 'package-lock.json'):
    path = Path(filename)
    text = path.read_text(encoding='utf-8').replace('"version": "3.1.17"', '"version": "3.1.18"')
    path.write_text(text, encoding='utf-8')

Path('RELEASE_NOTES_V3_1_18.md').write_text('''# V3.1.18 — Uai Perto

Atualização de consolidação da identidade pública e legibilidade visual.

## Mudanças

- marca Uai Perto gravada diretamente nos HTMLs públicos, títulos e descrições;
- `theme-color` institucional alterado para Hunter Green `#335749`;
- favicon U/P e CSS oficial referenciados diretamente no `<head>`;
- remoção da dependência de substituição de nome público após o carregamento do JavaScript;
- selo legado `RLI` do simulador substituído pelo símbolo oficial;
- melhoria global de nitidez das copys: contraste, peso, entrelinha, largura de leitura, títulos, textos auxiliares, formulários e mobile;
- versão atualizada para `3.1.18`.

## Proteções

Nenhuma regra comercial, valor, cálculo, API, banco, integração, rota ou condição dos 54 parceiros iniciais foi alterada.
''', encoding='utf-8')

Path('VALIDACAO_V3_1_18.md').write_text('''# Validação V3.1.18 — Uai Perto

## Objetivo

Consolidar a identidade Uai Perto na fonte estática pública e melhorar a nitidez visual das copys sem alterar regras de negócio.

## Escopo técnico

- HTMLs públicos: nome, títulos, metadados, favicon, theme-color e carregamento antecipado do CSS de marca;
- `assets/site.js`: deixa de depender da troca da marca antiga em runtime e mantém funções de navegação, tema, demo e metadados;
- `assets/capacity-calculator.js`: selo visual legado substituído pelo símbolo oficial;
- `assets/uai-perto.css`: reforço de contraste, peso, espaçamento e legibilidade em desktop/mobile;
- `package.json` e `package-lock.json`: versão 3.1.18.

## Regras preservadas

Não há mudanças intencionais em número de parceiros, adesão, mensalidades, cálculos, formulários, APIs, banco, migrations, autenticação, Turnstile, integrações, rotas ou infraestrutura.

## Testes

A publicação desta branch só é commitada pelo bootstrap se `node --check assets/site.js`, `node --check assets/capacity-calculator.js` e `npm test` concluírem com sucesso. O preview Vercel será validado após a abertura do PR.
''', encoding='utf-8')
