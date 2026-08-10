# Consulta CNPJ — Provedor desacoplado (V3.1.7)

## Provedor atual

`CNPJ_PROVIDER=cnpjws`

A aplicação consulta `GET https://publica.cnpj.ws/cnpj/{cnpj}`.

A API pública do CNPJ.ws não exige token, possui limite de 3 consultas por minuto por IP e consulta a base própria do provedor. Ela suporta CNPJ numérico e alfanumérico. A interface, por isso, usa **consulta cadastral** e não afirma consulta oficial em tempo real da Receita Federal.

## Dados usados

O Achei Aqui retém somente:
- CNPJ;
- razão social;
- nome fantasia;
- situação cadastral;
- cidade/UF;
- CNAE principal e secundários;
- identificador do provedor;
- data de atualização retornada, quando disponível.

Dados de sócios e outros campos retornados pelo provedor não entram no token empresarial nem na proposta.

## Cache

`CNPJ_CACHE_TTL_SECONDS=900`

O cache em memória reduz consultas repetidas no mesmo processo serverless. Ele não substitui rate limiting distribuído.

## SERPRO futuro

Para migrar depois:

`CNPJ_PROVIDER=serpro`

Nesse modo tornam-se necessários `SERPRO_CONSUMER_KEY`, `SERPRO_CONSUMER_SECRET` e `SERPRO_CNPJ_ENDPOINT_TEMPLATE`. A calculadora e a política comercial não mudam.
