# Validação V3.1.19 — Simulador mais claro

## Objetivo

Melhorar a compreensão das quatro perguntas da calculadora sem alterar seu comportamento matemático ou comercial.

## Integridade do simulador

Foram preservados os mesmos IDs usados por `assets/capacity-calculator.js`:

- `operational-cores`;
- `simultaneous-operations`;
- `active-units`;
- `integration-level`.

Também foram preservados os mesmos `value` de todas as opções. Nenhuma alteração foi feita em `assets/capacity-calculator.js`.

## Alterações de interface

Cada pergunta agora contém:

- pergunta em linguagem mais natural;
- dica curta visível;
- bloco expansível “O que significa?”;
- significado do termo;
- exemplo prático;
- regra prática para orientar a escolha.

O campo de integração detalha separadamente `Manual / sem integração`, `Integração padrão`, `Integração avançada` e `Integração customizada`.

## Preview

O deploy de preview correspondente ao commit `10618154c36dc33714914be9650101cd58bda867` ficou `READY` na Vercel. A rota `/calculadora.html` respondeu HTTP 200 e entregou os quatro campos com os mesmos IDs/valores, os novos blocos `<details>` e o stylesheet `calculadora-help.css?v=3.1.19`.

## Escopo preservado

Não houve mudança em regras de adesão, mensalidades, cálculo, APIs, banco de dados, autenticação, Turnstile, formulário de contato, rotas ou `vercel.json`.
