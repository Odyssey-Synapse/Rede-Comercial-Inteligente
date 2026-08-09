# V3.1 — Pré-Produção: bloqueios e critérios de liberação

## Código resolvido

- CNPJ alfanumérico.
- Consulta cadastral por backend.
- Credenciais fora do navegador.
- Situação cadastral ativa como gate automático.
- CNAE principal/secundários quando retornados pelo endpoint contratado.
- Categoria contratual derivada do CNPJ.
- Remoção da lista fixa de seis categorias.
- Token assinado de consulta empresarial para impedir alteração de categoria pelo cliente.
- Founder verificado server-side.
- Proposta assinada server-side.
- Persistência PostgreSQL obrigatória para proposta oficial.
- Turnstile pronto para proteger a consulta paga.
- Contato/controlador carregados da configuração oficial.
- Readiness que falha fechado.

## Dependências externas ainda necessárias para liberar produção

1. Contratar/configurar API Consulta CNPJ do SERPRO.
2. Informar o endpoint exato do contrato em `SERPRO_CNPJ_ENDPOINT_TEMPLATE`.
3. Configurar banco PostgreSQL e `DATABASE_URL`.
4. Criar secrets fortes para consulta empresarial e proposta.
5. Criar widget Cloudflare Turnstile e configurar site key/secret.
6. Inserir CNPJs Founder quando os 25 participantes estiverem formalmente definidos.
7. Definir e-mail/WhatsApp oficial.
8. Definir controlador jurídico e documento.
9. Definir canal de privacidade.
10. Obter aprovação jurídica da política e mudar `PRIVACY_POLICY_STATUS=APPROVED`.

## Decisão de categoria

A categoria contratual é uma atividade econômica oficial do próprio estabelecimento:

`CNPJ → CNAEs oficiais → categoria contratual CNAE:<código>`

A taxonomia usada pelo consumidor para buscar necessidades permanece separada. O consumidor não precisa conhecer CNAE.

## Ausência de evidência econômica

Uma atividade oficial sem evidência econômica aprovada não recebe um prêmio inventado. A política atual aplica `BASE_ONLY_EVIDENCE_PENDING`, preservando o valor-base vigente até que exista autoridade econômica válida.
