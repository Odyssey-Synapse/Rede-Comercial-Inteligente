# PostgreSQL — Propostas oficiais

## Objetivo

A calculadora pública pode exibir uma simulação sem banco. Uma proposta oficial, porém, deve ser persistida para que o valor, a validade e a versão usada possam ser recuperados depois.

## Tabelas

### quotes
Registra:
- ID público da proposta;
- CNPJ;
- razão/nome empresarial usado;
- atividade/CNAE selecionada a partir do CNPJ;
- versões da política comercial e modelo econômico;
- PME e mensalidade proposta em centavos;
- emissão e validade;
- assinatura;
- status.

### quote_events
Mantém uma trilha mínima:
- visualização;
- aceite;
- eventos futuros.

## Status

`issued` → emitida  
`viewed` → visualizada  
`accepted` → aceita  
`expired` → vencida  
`cancelled` → cancelada

## Migração

Configure `POSTGRES_URL` e execute:

```bash
npm run db:migrate
```

## Produção

A API falha fechada quando o banco não está configurado. Isso evita marcar uma proposta como oficial sem conseguir preservá-la.
