# Validação V3.1.18 — Uai Perto

## Objetivo

Consolidar a identidade Uai Perto na fonte estática pública e melhorar a nitidez visual das copys sem alterar regras de negócio.

## Escopo técnico

- HTMLs públicos: nome, títulos, metadados, favicon, `theme-color` e carregamento antecipado do CSS de marca;
- `assets/site.js`: deixa de depender da troca da marca antiga em runtime e mantém funções de navegação, tema, demo e metadados;
- `assets/capacity-calculator.js`: selo visual legado substituído pelo símbolo oficial;
- `assets/uai-perto.css`: reforço de contraste, peso, espaçamento, entrelinha, largura de leitura e legibilidade em desktop/mobile;
- `package.json` e `package-lock.json`: versão `3.1.18`.

## Regras preservadas

Não há mudanças em número de parceiros, adesão, mensalidades, cálculos, formulários, APIs, banco, migrations, autenticação, Turnstile, integrações, rotas ou infraestrutura.

## Auditoria de marca pública

A auditoria automatizada dos oito HTMLs públicos foi executada após a transformação e não encontrou ocorrências de `Projeto RLI`, `Rede RLI`, `REDE RLI`, `nome provisório`, `Achei Aqui`, selo `RLI` ou ponte `REDE RLI`.

O nome, título, descrição, `theme-color`, favicon e CSS oficial agora estão gravados diretamente no HTML-base, sem depender de substituição de texto após o JavaScript carregar.

## Sintaxe

- `node --check assets/site.js`: aprovado;
- `node --check assets/capacity-calculator.js`: aprovado;
- `npm ci`: aprovado, sem vulnerabilidades reportadas pelo npm no executor.

## Comparação da suíte de testes

A suíte histórica do repositório não estava verde antes desta atualização.

- baseline `main` V3.1.17: **13 testes falhando**;
- V3.1.18 após as alterações: **13 testes falhando**;
- nenhuma nova falha funcional foi introduzida.

Houve um único delta intencional de branding: o teste histórico que exige literalmente que `Projeto RLI` seja apresentado como nome provisório passou a falhar, pois essa premissa deixou de ser válida com a identidade oficial Uai Perto. Em contrapartida, o teste histórico que cobra a remoção da denominação anterior das superfícies públicas deixou de falhar.

Os demais testes que já falhavam na baseline permanecem ligados a contratos históricos de versões anteriores, incluindo estruturas e copys antigas da home/calculadora. Nenhum arquivo em `tests/` foi alterado para produzir um resultado artificialmente verde.

## Escopo do diff

A checagem automatizada bloqueou mudanças em `api/`, `lib/`, `migrations/`, `tests/` e `vercel.json`. O diff líquido desta versão permanece restrito à camada pública, CSS de marca, scripts diretamente relacionados à apresentação, versionamento e documentação.

## Preview

- PR: `#2` — V3.1.18 consolida Uai Perto e melhora nitidez das copys;
- head validado: `d4c1ca0d121d32040e66d515f6562e40209cf154`;
- Vercel preview: **READY**;
- build do preview: concluído sem erros;
- HTML cru do preview já entrega `Uai Perto` no `<title>`, description, `theme-color`, favicon e CSS da V3.1.18.

## Produção

- PR `#2` mergeado na `main`;
- commit de merge: `5cb79c022e2c4979424143e0b3996608b0f8ba76`;
- Vercel: **READY**, `target: production`;
- build de produção: concluído sem erros;
- domínio principal `/`: HTTP **200** com Uai Perto gravado no HTML-base;
- `/contato`: HTTP **200**, título e metadados Uai Perto;
- `/calculadora`: HTTP **200**, título/metadados Uai Perto e símbolo oficial no estado vazio do simulador;
- `/api/public-config`: HTTP **200**, `contactFormEnabled: true` e `turnstileRequired: true`.

A V3.1.18 está publicada em produção. A identidade pública não depende mais da substituição da marca antiga em runtime, e a camada tipográfica global de nitidez/legibilidade está ativa.
