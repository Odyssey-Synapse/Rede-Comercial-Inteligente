# V3.1.17 — Branding Uai Perto

## Base preservada

- Branch de trabalho: `branding/uai-perto-v3.1.17`
- Base funcional/comercial congelada: `3416530903379f9d19b70f5a9a86709cdea5af3c`
- Versão anterior: `3.1.16`
- Versão desta atualização: `3.1.17`
- PR de implementação: `#1`
- Commit de merge do código: `04f3179324a5f37ab3f5e6815d884edd637cc28e`

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
- Referências públicas legadas (`Projeto RLI`, `RLI`, `Achei Aqui` e `nome provisório`) são normalizadas na camada visível ao usuário. Identificadores técnicos, nomes internos, rotas, APIs e persistência não foram renomeados.

## Arquivos alterados ou criados

- `assets/site.js` — identidade pública integrada ao ponto de entrada já existente, preservando a lógica funcional anterior;
- `assets/uai-perto.css` — tokens, paleta, tipografia, CTAs, foco, header/footer, cards e ajustes responsivos;
- `assets/uai-perto-logo-horizontal.png` — logotipo oficial para uso institucional;
- `assets/uai-perto-symbol.png` — símbolo oficial para favicon e usos reduzidos;
- `package.json` — versão `3.1.17`;
- `package-lock.json` — versão alinhada a `3.1.17`, sem alteração de dependências ou hashes do lockfile;
- `RELEASE_NOTES_V3_1_17.md` — notas da atualização;
- `VALIDACAO_V3_1_17.md` — este registro.

## O que não foi alterado

O diff de implementação não contém mudanças em:

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

- O diff de implementação foi restrito aos arquivos de branding, versão e documentação listados acima.
- O diff final de `package-lock.json` altera somente os dois campos de versão `3.1.16` para `3.1.17`; dependência, URL e `integrity` de `postgres` permanecem iguais à baseline.
- A sintaxe das adições de branding em `assets/site.js` foi verificada com `node --check` no ambiente de manutenção.
- Preview automático Vercel da branch: **success / READY**.
- Build Vercel da branch: **concluído sem erros** após restauração exata do `integrity` original do lockfile.
- Deploy de produção do commit de merge `04f3179324a5f37ab3f5e6815d884edd637cc28e`: **READY**, `target: production`.
- Domínio principal `rede-comercial-inteligente.vercel.app`: resposta HTTP **200** após o merge.
- Assets `site.js`, `uai-perto.css`, logotipo horizontal e símbolo U/P: resposta HTTP **200** em produção.
- `/contato.html` e `/calculadora.html`: resposta HTTP **200** em produção.
- `/api/public-config`: resposta HTTP **200**, com `contactFormEnabled: true` e `turnstileRequired: true`.
- A suíte existente `npm test` foi identificada em `package.json` e os arquivos em `tests/` permanecem intactos. O ambiente de ferramentas desta manutenção não conseguiu materializar um checkout completo do repositório para executar localmente a suíte integral; portanto, não é registrado falsamente um resultado de testes que não foi obtido.

## Observação sobre templates estáticos

Para preservar a estrutura validada com o menor risco possível, os arquivos HTML-base não foram reescritos em massa. Algumas referências provisórias permanecem no **código-fonte estático** dos templates e são normalizadas por `assets/site.js` no carregamento da experiência pública, incluindo título, descrição, marca visível e favicon.

Isso preserva a arquitetura e reduz a superfície de regressão, mas significa que um consumidor que leia apenas o HTML cru sem executar JavaScript pode encontrar a nomenclatura provisória. Uma eventual limpeza SEO/source-level pode ser feita em etapa separada, alterando individualmente os templates HTML, sem necessidade de mexer em regras de negócio.

## Produção

O PR `#1` foi mergeado na `main`. A V3.1.17 está publicada em produção com a camada pública de branding Uai Perto e o baseline funcional/comercial preservado.
