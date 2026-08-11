# V3.1.17 — Branding Uai Perto

## Base preservada

- Branch de trabalho: `branding/uai-perto-v3.1.17`
- Base congelada: `3416530903379f9d19b70f5a9a86709cdea5af3c`
- Versão anterior: `3.1.16`
- Versão desta atualização: `3.1.17`

## Escopo

Aplicar a identidade pública **Uai Perto** à Rede Comercial Inteligente de Uberaba sem reabrir ou alterar o modelo comercial e funcional já validado.

### Identidade aplicada

- Nome: **Uai Perto**
- Assinatura: **Uberaba mais perto de você.**
- Hunter Green: `#335749`
- Sunflower: `#D39237`
- Rust: `#B55A30`
- Pristine: `#F2E8D9`
- Símbolo e logotipo derivados do manual oficial fornecido para o projeto, mantendo a geometria do material aprovado.

## Arquitetura de segurança da alteração

O antigo `assets/site.js` funcional foi preservado como `assets/site-core.js` usando exatamente o mesmo blob Git (`8b1c4f8e42dd1a3db8b0cf6b99241a4d7d213950`).

O novo `assets/site.js` funciona somente como ponto de entrada e carrega, nesta ordem:

1. `assets/site-core.js` — núcleo funcional anterior;
2. `assets/uai-perto-brand.js` — identidade pública e metadados.

Dessa forma, demos, menu, tema e comportamentos existentes continuam no núcleo já validado.

## Arquivos alterados ou criados

- `assets/site.js` — entrada mínima para núcleo + branding;
- `assets/site-core.js` — cópia byte a byte do `site.js` funcional anterior;
- `assets/uai-perto-brand.js` — aplicação pública de nome, assinatura, favicon e metadados;
- `assets/uai-perto.css` — paleta e acabamento visual Uai Perto;
- `assets/uai-perto-logo-horizontal.png` — logotipo oficial otimizado para web;
- `assets/uai-perto-symbol.png` — símbolo oficial otimizado para web;
- `package.json` — versão `3.1.17`.

## O que não foi alterado

A comparação da branch com `main` não contém mudanças em:

- calculadora e lógica de enquadramento;
- valores, adesão, mensalidades ou regras dos 54 parceiros iniciais;
- formulários de contato;
- APIs e endpoints;
- banco de dados e migrations;
- autenticação, Turnstile ou integrações;
- regras de relevância orgânica;
- rotas e URLs públicas existentes;
- infraestrutura ou configuração de produção.

## Verificações executadas

- Sintaxe de `assets/site.js`: **OK** (`node --check`).
- Sintaxe de `assets/uai-perto-brand.js`: **OK** (`node --check`).
- Git diff contra `main`: **somente arquivos de branding, preservação do núcleo e versão**.
- Preview automático Vercel do commit `8739a406d06e4abc65a5d1473c5d0b68d87611d9`: **READY**.
- Build Vercel: **concluído sem erros**.
- Home do preview: **HTTP 200**.

## Produção

A branch de branding é uma preview. A `main`/produção permanece no checkpoint congelado até revisão e merge explícito desta atualização.
