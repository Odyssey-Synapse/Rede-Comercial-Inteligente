# Founder + Aceite Comercial — V3.1.6

## Founder

A condição Founder nunca é enviada pelo navegador.

Fonte:
`FOUNDER_CNPJ_REGISTRY`

Formato:
CNPJs separados por vírgula, espaço ou ponto-e-vírgula.

Regras:
- máximo 25 CNPJs;
- comparação server-side;
- somente CNPJ validado pelo fluxo cadastral configurado pode ser reconhecido;
- o navegador não pode ativar Founder;
- a proposta registra se a condição Founder foi aplicada;
- a duração da condição Founder não é inferida nem tratada como vitalícia.

## Aceite comercial

O aceite:
- exige proposta existente;
- exige proposta dentro da validade;
- exige nome e e-mail de quem aceita;
- registra data/hora;
- registra versão do aceite;
- registra IP e user-agent apenas como trilha operacional;
- altera status para `accepted`;
- grava evento em `quote_events`.

## Limite jurídico

Este aceite é **registro comercial de concordância com a proposta**.
Ele não é apresentado como assinatura eletrônica qualificada, avançada ou substituto automático de contrato jurídico.

A formalização contratual definitiva deve ser uma etapa separada.
