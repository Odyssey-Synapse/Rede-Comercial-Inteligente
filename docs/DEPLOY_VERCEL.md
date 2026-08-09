# Deploy Vercel — V3.1 Pré-Produção

## 1. Primeiro deploy: Preview, não Production

Suba o projeto como Preview para validar domínio, layout e Functions antes de liberar tráfego comercial.

## 2. Variáveis obrigatórias

Use `.env.example` como checklist. Secrets devem ser configurados em Vercel > Project > Settings > Environment Variables.

Nunca coloque no JavaScript público:
- Consumer Secret do SERPRO;
- COMPANY_LOOKUP_SIGNING_SECRET;
- QUOTE_SIGNING_SECRET;
- DATABASE_URL;
- TURNSTILE_SECRET_KEY.

## 3. SERPRO

Contrate/configure a API Consulta CNPJ e copie da área do cliente:
- Consumer Key;
- Consumer Secret;
- endpoint exato da API contratada.

Configure o endpoint como template contendo `{cnpj}`.

Exemplo estrutural, não copiar como endpoint de produção:
`https://gateway.../consulta-cnpj.../v2/empresa/{cnpj}`

O endpoint real deve ser o fornecido no contrato SERPRO.

## 4. PostgreSQL

Crie um banco PostgreSQL acessível pelas Vercel Functions e configure `DATABASE_URL`.

Na primeira proposta oficial, a aplicação cria a tabela `achei_aqui_quotes` se ela não existir.

## 5. Turnstile

Crie um widget Cloudflare Turnstile para o domínio final e para o domínio de Preview que será testado. Configure site key e secret. Em Production, mantenha `TURNSTILE_REQUIRED=true`.

## 6. Canais e jurídico

Configure:
- PUBLIC_CONTACT_EMAIL e/ou PUBLIC_CONTACT_WHATSAPP;
- PUBLIC_PRIVACY_EMAIL;
- CONTROLLER_LEGAL_NAME;
- CONTROLLER_DOCUMENT.

Apenas depois da aprovação jurídica efetiva da política publicada, defina:
`PRIVACY_POLICY_STATUS=APPROVED`.

## 7. Founder

Quando houver CNPJs Founder formalmente definidos, coloque somente no ambiente server-side:
`FOUNDER_CNPJ_LIST=CNPJ1,CNPJ2,...`

O navegador não pode autodeclarar Founder.

## 8. Readiness

Antes de promover Preview para Production, rode:

```bash
npm run readiness
```

Resultado exigido:
`READY: SIM`

Se houver qualquer `✗`, o projeto ainda não deve ser tratado como contratação pública pronta.

## 9. Testes funcionais mínimos em Preview

- CNPJ numérico válido.
- CNPJ alfanumérico válido.
- CNPJ inválido.
- CNPJ não encontrado.
- situação Ativa.
- situação Suspensa/Inapta/Baixada/Nula.
- CNPJ com uma atividade elegível.
- CNPJ com múltiplas atividades retornadas pelo endpoint contratado.
- tentativa de alterar `categoryId` manualmente no DevTools.
- proposta sem banco configurado deve falhar fechado.
- proposta com banco configurado deve persistir.
- token de consulta expirado deve obrigar nova consulta.
- Founder só por registro server-side.
- mobile 360/390/430 px.
- desktop 1366/1440/1920 px.

## 10. Liberação

Somente depois desses testes e do readiness verde, promova o deployment para Production.

## Formulário de contato com Resend

A V3.1 possui `/api/contact`, que envia o formulário pelo Resend sem expor a API key ou o e-mail privado de destino no navegador.

Configure na Vercel:

- `RESEND_API_KEY`: chave com permissão de envio.
- `RESEND_FROM_EMAIL`: remetente em domínio verificado, por exemplo `Achei Aqui <contato@seudominio.com.br>`.
- `CONTACT_DESTINATION_EMAIL`: e-mail privado que recebe os contatos.
- `PUBLIC_CONTACT_EMAIL`: opcional; só use se quiser publicar um e-mail no site.

O endpoint inclui validação de campos, honeypot, limite básico por IP e reaproveita o Turnstile quando `TURNSTILE_REQUIRED=true`.

Importante: para enviar para destinatários diferentes do e-mail da própria conta de teste, o Resend exige domínio próprio verificado. O domínio precisa ser controlado por você e ter SPF/DKIM configurados no DNS.
