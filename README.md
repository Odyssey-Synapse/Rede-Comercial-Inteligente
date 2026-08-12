# Projeto RLI — Site Institucional V3

Versão institucional com copy reescrita para linguagem pública, humana e comercial, preservando as regras do produto e a Calculadora Contratual existente.

## Visualizar no PC

```bash
npm run preview
```

Abra `http://localhost:3000`.

## Testar cálculo

```bash
npm test
```

## Responsividade

O layout foi projetado para desktop, notebook e smartphones, com referências de teste em 360, 390, 430, 1366, 1440 e 1920 px. Não há largura fixa obrigatória para conteúdo principal; grids colapsam e o menu se adapta no mobile.

## Antes da publicação comercial

- configurar canal oficial de contato;
- publicar política jurídica definitiva de privacidade;
- configurar o segredo de assinatura de propostas no ambiente de produção;
- revisar os dados públicos da política de preço antes do lançamento.

## Contato institucional via Resend

A página `/contato.html` agora contém formulário real preparado para produção. O envio passa por `/api/contact` e usa `RESEND_API_KEY` apenas no servidor. `CONTACT_DESTINATION_EMAIL` pode ser seu e-mail pessoal sem aparecer publicamente.

Variáveis necessárias: `RESEND_API_KEY`, `RESEND_FROM_EMAIL` e `CONTACT_DESTINATION_EMAIL`. Para produção fora do modo de teste do Resend, `RESEND_FROM_EMAIL` deve usar domínio que você controla e verificou no Resend.

## Privacidade na pré-produção

A página de privacidade agora contém um aviso operacional mais completo e permite que solicitações de direitos usem o mesmo formulário Resend com o assunto `Privacidade`. Assim, um segundo e-mail público não é obrigatório na fase inicial. Permanecem como bloqueadores de produção a identificação jurídica do controlador e a aprovação final da política.

## Segredos de assinatura

Gere localmente, uma única vez:

```bash
npm run generate:secrets
```

Copie os dois valores diretamente para as variáveis de ambiente da Vercel. Não grave esses valores em arquivos versionados.

## Banco de propostas

A migração inicial está em `migrations/001_quotes.sql`. Execute-a no PostgreSQL antes de liberar propostas oficiais. O banco guarda a proposta emitida, o CNPJ, o CNAE usado, o valor, a assinatura de integridade, o estado e as datas de validade.


## SERPRO Consulta CNPJ — V3.1.5

A consulta empresarial agora está preparada para produção com:
- OAuth2 server-side;
- CNPJ numérico e alfanumérico;
- status cadastral oficial;
- CNAE principal/secundários retornados;
- categorias contratuais derivadas somente do CNPJ;
- comprovante empresarial HMAC;
- timeout;
- tratamento de HTTP 206;
- `X-Request-Tag`;
- falha fechada.

Leia `docs/SERPRO_CNPJ.md`.


## V3.1.6 — Founder + aceite

- Founder reconhecido exclusivamente por CNPJ em registro server-side.
- Limite de 25 Founders validado.
- Navegador não pode declarar Founder.
- Aceite comercial registra identidade declarada, data, versão e trilha mínima.
- Aceite não é apresentado como assinatura jurídica definitiva.

Migração adicional:

```bash
npm run db:migrate
```

Leia `docs/FOUNDER_ACEITE.md`.

## V3.1.7 — CNPJ.ws + persistência unificada

- CNPJ.ws público como provedor inicial.
- SERPRO preservado como opção futura.
- CNPJ numérico e alfanumérico.
- Cache server-side.
- Interface sem alegação de consulta oficial em tempo real.
- Emissão e aceite usam a mesma tabela `quotes`.
- IDs novos de proposta usam prefixo `AA-Q-`.
- Provedor, data de atualização e lookup ficam rastreáveis na proposta.

Aplicar no Neon: `migrations/003_cnpj_provider_provenance.sql`.