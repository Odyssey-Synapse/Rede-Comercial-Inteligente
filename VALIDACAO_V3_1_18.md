# Validação V3.1.18 — Uai Perto

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
