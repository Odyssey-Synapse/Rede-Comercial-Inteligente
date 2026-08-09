# SERPRO — Consulta CNPJ

## O que esta integração faz

`POST /api/cnpj`:

1. valida o CNPJ localmente, inclusive formato alfanumérico;
2. valida Turnstile no servidor;
3. obtém/renova Bearer Token do SERPRO em produção;
4. consulta o endpoint contratado;
5. confere se o CNPJ retornado é o solicitado;
6. exige situação cadastral `2 — Ativa`;
7. extrai atividade principal e atividades secundárias retornadas pelo provedor;
8. transforma somente essas atividades em categorias contratuais `CNAE:<7 dígitos>`;
9. cria um comprovante empresarial HMAC com validade curta;
10. a API de proposta aceita apenas categorias presentes nesse comprovante.

## OAuth2

Token padrão:
`https://gateway.apiserpro.serpro.gov.br/token`

Credenciais:
- `SERPRO_CONSUMER_KEY`
- `SERPRO_CONSUMER_SECRET`

O token é reutilizado em memória até próximo do vencimento.

## Endpoint contratado

Configure `SERPRO_CNPJ_ENDPOINT_TEMPLATE` exatamente conforme o swagger/contrato disponibilizado pelo SERPRO, incluindo `{cnpj}`.

Exemplo apenas de estrutura:

`https://.../v2/empresa/{cnpj}`

Não assuma que o endpoint de produção é igual ao trial.

## Trial

A documentação pública do SERPRO disponibiliza ambiente de demonstração e CNPJs fictícios, inclusive alfanuméricos.

Para testes:
- `SERPRO_MODE=trial`
- `SERPRO_TRIAL_BEARER_TOKEN=<token do ambiente de demonstração>`
- opcionalmente `SERPRO_CNPJ_ENDPOINT_TEMPLATE=<endpoint trial>`

## Códigos de situação

Segundo a tabela oficial:
- 1 — Nula
- 2 — Ativa
- 3 — Suspensa
- 4 — Inapta
- 5 — Ativa Não Regular
- 8 — Baixada

A contratação automática aceita somente `2 — Ativa`.

## Fail closed

- HTTP 206 do provedor: não gera proposta.
- divergência de CNPJ retornado: não gera proposta.
- atividade ausente: não gera proposta.
- token/credenciais ausentes: não gera proposta.
- status diferente de Ativa: não gera proposta.
- timeout: não gera proposta.
