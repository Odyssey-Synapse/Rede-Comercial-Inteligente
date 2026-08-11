# V3.1.17 — Branding Uai Perto

## Base preservada

- Branch de trabalho: `branding/uai-perto-v3.1.17`
- Base funcional/comercial congelada: `3416530903379f9d19b70f5a9a86709cdea5af3c`
- Versão anterior: `3.1.16`
- Versão desta atualização: `3.1.17`

## Escopo

Aplicar a identidade pública **Uai Perto** à Rede Comercial Inteligente de Uberaba sem reabrir ou alterar o modelo comercial e funcional já validado.

### Identidade aplicada

- Nome público: **Uai Perto**
- Assinatura: **Uberaba mais perto de você.**
- Hunter Green: `#335749`
- Sunflower: `#D39237`
- Rust: `#B55A30`
- Pristine: `#F2E8D9`
- Logotipo e símbolo: assets obtidos da identidade oficial fornecida para esta atualização, sem redesenho da geometria.

## Estratégia de mínima alteração

A implementação não reconstrói a landing page.

- `assets/site.js` continua sendo o ponto de entrada funcional existente. Menu, tema, demonstrações, exemplos, navegação e animação da rede foram preservados; foram adicionadas apenas as responsabilidades públicas de marca, logo, favicon e metadados.
- `assets/uai-perto.css` funciona como camada de tokens/acabamento sobre o CSS existente, evitando refatoração ampla de `assets/styles.css`.
- O header, hero e footer utilizam o logotipo oficial.
- O favicon utiliza apenas o símbolo U/P oficial.
- Referências públicas legadas (`Projeto RLI`, `RLI`, `Achei Aqui` e `nome provisório`) são tratadas apenas na camada visível ao usuário. Identificadores técnicos, nomes internos, rotas, APIs e persistência não foram renomeados.

## Arquivos alterados ou criados

- `assets/site.js` — identidade pública integrada ao ponto de entrada já existente, preservando a lógica funcional anterior;
- `assets/uai-perto.css` — tokens, paleta, tipografia, CTAs, foco, header/footer, cards e ajustes responsivos;
- `assets/uai-perto-logo-horizontal.png` — logotipo oficial para uso institucional;
- `assets/uai-perto-symbol.png` — símbolo oficial para favicon e usos reduzidos;
- `package.json` — versão `3.1.17`;
- `package-lock.json` — versão alinhada a `3.1.17`;
- `RELEASE_NOTES_V3_1_17.md` — notas da atualização;
- `VALIDACAO_V3_1_17.md` — este registro.

## O que não foi alterado

A comparação da branch com `main` não contém mudanças em:

- número, regras, valores, adesão ou mensalidades dos 54 parceiros iniciais;
- calculadora e lógica de enquadramento;
- formulários de contato e seus scripts específicos;
- APIs e endpoints;
- banco de dados e migrations;
- autenticação, Turnstile ou integrações;
- regras de relevância orgânica;
- rotas e URLs públicas existentes;
- `vercel.json` e configuração de produção;
- arquivos de testes.

## Responsividade e acessibilidade

- O layout estrutural responsivo existente foi preservado.
- A camada Uai Perto possui ajustes específicos para logotipo/hero em `980px` e `720px`.
- Foi adicionado estado `:focus-visible` claramente perceptível.
- O CTA primário usa Sunflower com texto neutro escuro para manter contraste adequado; o CTA secundário usa Hunter Green com Pristine.
- Sombras foram reduzidas e permanecem discretas.
- Não foram introduzidas bibliotecas, fontes binárias ou dependências novas.

## Verificações executadas

- Git diff contra `main`: restrito aos arquivos de branding, versão e documentação listados acima.
- Preview automático da Vercel para a branch: **READY**.
- Status de integração Vercel no commit da branch: **success**.
- Build Vercel: **concluído sem erros**; a consulta de logs filtrada por erros não apresentou falha de build.
- A suíte existente `npm test` foi identificada em `package.json` e os arquivos em `tests/` permanecem intactos. O ambiente de ferramentas desta manutenção não conseguiu materializar um checkout completo do repositório para executar localmente essa suíte; portanto, não é registrado falsamente um resultado de testes que não foi obtido.

## Produção

Enquanto o PR não for mergeado, a `main` e a produção permanecem no checkpoint funcional/comercial congelado. O merge só deve promover a camada pública de branding descrita neste documento.
