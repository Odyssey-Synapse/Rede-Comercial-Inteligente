# Validação do Site — Modelo Comercial Atual

**Data:** 2026-08-11  
**Escopo:** páginas públicas do Projeto RLI e fluxo de participação empresarial.

## Estado validado

- Home alinhada ao Projeto RLI / Rede Comercial Inteligente.
- Demonstração interativa restaurada com 3 cenários, 10 etapas, loop e controles.
- Rede inicial atualizada para **54 parceiros iniciais**.
- Regra dos 54: adesão conforme enquadramento confirmado e mensalidade recorrente de **R$ 0**.
- Parceiros posteriores: adesão inclui os dois primeiros meses; decisão ao fim do mês 2; mensalidade inicia no mês 3 somente se houver continuidade.
- Antigo valor-base público de R$ 140 removido das páginas atuais.
- Antigo programa público de 25 Parceiros Fundadores / R$ 400 removido da experiência pública atual.
- Simulador de capacidade criado com faixas de referência em validação: Essencial, Ativo, Estruturado, Integrado, Expandido e Empresarial.
- Pontuação interna do simulador não é exibida ao visitante.
- Quantidade de produtos, faturamento, clientes e pagamento não são apresentados como compra de relevância.
- Página Transparência alinhada ao novo modelo.
- Página Para Empresas alinhada aos 54 iniciais e às entradas posteriores.
- Página A Rede alinhada ao simulador de participação.
- Página Contato alinhada aos novos assuntos de participação.
- Navegação global usa “Participação” / “Ver participação” em vez da antiga promessa de proposta automática.
- Logística pública separada conceitualmente: uma loja = logística normal; múltiplas lojas = possível orquestração, sempre condicionada à implementação/validação.

## Regras de segurança comercial preservadas

- Pagamento não compra relevância orgânica.
- Simulação não é contrato nem reserva de posição.
- A empresa conhece condição e enquadramento antes do aceite.
- Informação ausente não é convertida em certeza.
- Logística/orquestração não é apresentada como operação comercial plenamente disponível antes das validações correspondentes.

## Deploy

O commit final do ajuste do simulador foi publicado pela integração Vercel com status **success**.

## Pendência externa que não pode ser validada apenas pelo repositório

O formulário de contato depende das variáveis de produção `RESEND_API_KEY`, `RESEND_FROM_EMAIL` e `CONTACT_DESTINATION_EMAIL`. O código detecta essas variáveis por `/api/public-config` e bloqueia/avisa quando o canal não está configurado. A existência efetiva dessas credenciais no ambiente da Vercel deve ser confirmada no próprio ambiente de produção.

## Observação de governança

As faixas e valores exibidos no simulador permanecem apresentados como **referências de modelo em validação**, não como tabela contratual automaticamente vigente. A promoção para regra comercial definitiva deve ocorrer de forma expressa e versionada.
