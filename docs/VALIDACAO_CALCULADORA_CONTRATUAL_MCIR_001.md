# VALIDAÇÃO — CALCULADORA CONTRATUAL MCIR 001

**Data da execução:** 2026-08-09  
**Comando:** `node --test tests/*.test.mjs`

## Resultado

```text
16 testes
16 aprovados
0 falhas
```

## Matriz validada

| Teste | Resultado |
|---|---|
| Âncoras CP60-v1 | PASS |
| Monotonicidade de IVE 0–100 em passos de 0,01 | PASS |
| Evidência ausente → BASE_ONLY sem converter UNKNOWN em 0 | PASS |
| Evidência stale/candidata não aumenta preço | PASS |
| Founder verificado → MP R$0 preservando PME | PASS |
| Categoria fora da v1 → revisão manual | PASS |
| Recurso não aprovado → bloqueio | PASS |
| Validade exata de 7 dias | PASS |
| Reprodutibilidade do cálculo | PASS |
| Região não altera preço na v1 category-level | PASS |
| HMAC de integridade da proposta | PASS |
| Validação algorítmica de CNPJ | PASS |
| API rejeita CNPJ inválido | PASS |
| API ignora tentativa pública de autoatribuir Founder | PASS |
| API assina proposta com HMAC no servidor | PASS |
| API sem signing secret não emite proposta autoritativa | PASS |

## Âncoras financeiras confirmadas

Com `VBC = R$140,00`:

| IVE | Premium | PME |
|---:|---:|---:|
| 0 | 0,00% | R$140,00 |
| 50 | 8,00% | R$151,20 |
| 70 | 25,70% | R$175,98 |
| 90 | 48,00% | R$207,20 |
| 100 | 60,00% | R$224,00 |

## Interpretação

A validação prova consistência matemática e guardrails implementados no engine. Ela **não transforma valores sintéticos dos LABs em evidência econômica real**. O registro produtivo de IVE permanece vazio até existir autoridade econômica válida.
