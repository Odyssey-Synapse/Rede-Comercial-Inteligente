# Preview local — Site V2

No terminal, dentro da pasta do projeto:

```bash
npm test
npm run preview
```

Abra:

```text
http://localhost:3000
http://localhost:3000/calculadora.html
```

No preview local, a Vercel Function `/api/quote` não está disponível. A página cai automaticamente para o mesmo engine matemático no navegador e marca o resultado como `PRÉVIA LOCAL`.

Para proposta assinada em Vercel, configure `QUOTE_SIGNING_SECRET`.
