> **Nota V3.1:** este documento preserva a especificação histórica da Calculadora Contratual 001. O escopo de categorias fixas foi substituído na V3.1 por categoria contratual derivada das atividades CNAE oficiais do CNPJ. Consulte `PREPRODUCAO_V3_1.md`.

# CALCULADORA CONTRATUAL MCIR 001
## Fechamento matemático e operacional v1.0.0

**Status:** FECHADA PARA IMPLEMENTAÇÃO / POLÍTICA DE PREÇO v1 ATIVA NESTE ARTEFATO

## 1. Objetivo

Produzir uma **Mensalidade Proposta (MP)** reproduzível antes da assinatura, sem confundir referência econômica com contrato.

Fluxo:

```text
Evidência válida → PME → MP congelada → aceitação/contrato → PMC
```

Invariantes:

```text
PME ≠ MP ≠ PMC
UNKNOWN ≠ 0
DF_AA ≠ DF_R
pagamento ≠ relevância orgânica
proxy sem autoridade econômica ≠ prêmio de preço
```

## 2. Política AA-PRICING-001 v1.0.0

- Moeda: BRL.
- VBC: **R$ 140,00/mês**.
- Curva: **CP60-v1**.
- Validade da proposta: **7 dias corridos**.
- Arredondamento: half-up para centavos.
- Escopo v1: preço econômico por categoria, não por região.
- Recursos Inteligentes v1: nenhum recurso adicional aprovado no price book; portanto `RI = R$0` enquanto o catálogo estiver vazio.
- Founder: `MP = R$0` somente após verificação autoritativa da condição Founder. O cliente público não pode autoatribuir Founder.

## 3. Curva CP60-v1

A curva é contínua, monotônica e linear por trechos entre os pontos:

| IVE | Premium sobre VBC |
|---:|---:|
| 0 | 0,00% |
| 50 | 8,00% |
| 70 | 25,70% |
| 90 | 48,00% |
| 100 | 60,00% |

Para `x` entre duas âncoras `(x1,y1)` e `(x2,y2)`:

```text
P(x) = y1 + (x-x1) × (y2-y1)/(x2-x1)
```

A implementação usa inteiros (centavos, basis points e IVE ×100) para reduzir erro de ponto flutuante.

## 4. Fórmula evidenciada

Quando existe snapshot econômico utilizável:

```text
PME = VBC × [1 + P(IVE)] + RI
```

E para parceiro não-Founder:

```text
MP = PME
```

Para Founder verificado:

```text
MP = R$0
```

O PME continua registrado para auditoria; o benefício Founder altera MP, não falsifica o PME.

## 5. Evidência ausente não vira IVE=0

Se não existir IVE com autoridade econômica:

```text
IVE = UNKNOWN
```

A política v1 aplica explicitamente:

```text
MP = VBC + RI
```

com `economicBasis = BASE_ONLY_EVIDENCE_PENDING`.

Isto é uma **política comercial conservadora**, não uma inferência de que IVE seja zero.

Consequência no estado atual do projeto, enquanto o registro de evidências produtivas estiver vazio:

```text
Mensalidade proposta padrão não-Founder = R$140,00/mês
```

para categorias suportadas pela v1.

## 6. Evidência utilizável

Um snapshot só pode elevar preço quando:

- categoria coincide com o escopo da proposta;
- `status = APPROVED`;
- `economicAuthority = true`;
- IVE está definido e em `[0,100]`;
- janela temporal é válida;
- não é conjunto de cenários sem valor econômico único.

Evidência stale, candidata, sem autoridade ou incompatível **não aumenta a mensalidade**. A política retorna ao valor-base.

## 7. Escopo de categoria

Categorias suportadas inicialmente pelo engine:

- Supermercado;
- Lanchonete;
- Veterinária;
- Barbearia;
- Material de construção;
- Oficina.

Uma categoria fora do escopo retorna:

```text
MANUAL_REVIEW / CATEGORY_NOT_SUPPORTED_V1
```

Não existe preço default silencioso para categoria não classificada.

## 8. Região

A versão 1 é `CATEGORY_LEVEL_V1`.

A cidade/região pode integrar elegibilidade, disponibilidade e cadastro, mas **não altera o preço econômico** enquanto não houver um modelo regional aprovado e versionado.

## 9. Recursos Inteligentes

A fórmula suporta:

```text
RI = soma dos recursos contratados no Resource Price Book
```

Porém o `Resource Price Book v1` está deliberadamente vazio. Um recurso desconhecido bloqueia o cálculo em vez de receber preço inventado.

Pagamento por recurso também não altera ranking orgânico.

## 10. Proposta congelada

A proposta deve conter:

- `quoteId`;
- CNPJ e razão/nome informado;
- categoria;
- versão da política;
- versão da curva;
- estado da evidência;
- IVE quando conhecido;
- VBC;
- premium;
- RI;
- PME;
- MP;
- data de cálculo;
- validade;
- token de integridade.

Alteração futura do MCIR não reescreve proposta emitida.

## 11. Assinatura de integridade

A API `POST /api/quote` assina o payload com HMAC-SHA256 usando:

```text
QUOTE_SIGNING_SECRET
```

O secret deve ter pelo menos 24 caracteres e existir somente no ambiente servidor.

A assinatura permite verificar posteriormente que os campos econômicos da proposta não foram alterados no navegador.

## 12. Founder

A API pública não aceita `founder=true` informado pelo usuário.

O status precisa vir de fonte autoritativa pelo CNPJ. No artefato v2 a consulta está preparada, porém o Founder Registry real ainda precisa ser conectado.

## 13. Contratação

Quando a proposta for aceita:

```text
MP congelada → contrato → PMC
```

A partir da assinatura, mudanças futuras em PME não alteram PMC automaticamente.

## 14. Pendência operacional externa ao cálculo

Para produção completa ainda será necessário conectar:

- Founder Registry real;
- Evidence Engine/SEV real;
- armazenamento do aceite/contrato;
- identidade/autenticação se o fluxo contratual exigir;
- jurídico/termos contratuais.

Essas pendências não alteram a matemática fechada da Calculadora Contratual v1.
