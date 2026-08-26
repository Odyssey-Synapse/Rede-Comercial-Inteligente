import test from 'node:test';
import assert from 'node:assert/strict';
import sessionHandler from '../api/assistant/session.js';
import messageHandler from '../api/assistant/message.js';

function response() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(value) { this.body = value; return this; }
  };
}

function request(body = {}, headers = {}) {
  return {
    method: 'POST',
    body,
    headers: {
      host: 'uaiperto.test',
      'x-forwarded-for': `198.51.100.${Math.floor(Math.random() * 200) + 1}`,
      ...headers
    }
  };
}

const privateEnv = {
  MCIR_PUBLIC_ASSISTANT_ORIGIN: 'https://assistant-origin.example.test',
  CF_ACCESS_CLIENT_ID: 'access-client-id',
  CF_ACCESS_CLIENT_SECRET: 'access-client-secret',
  MCIR_ASSISTANT_GATEWAY_SECRET: 'gateway-secret',
  NODE_ENV: 'production'
};

async function withEnvironment(values, fn) {
  const previous = {};
  for (const [key, value] of Object.entries(values)) {
    previous[key] = process.env[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try { return await fn(); }
  finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test('session é criada server-side com Access e gateway sem devolver esses segredos', async () => {
  await withEnvironment(privateEnv, async () => {
    const originalFetch = global.fetch;
    let call;
    global.fetch = async (url, options) => {
      call = { url: String(url), options };
      return {
        ok: true,
        status: 201,
        json: async () => ({ token: 'header.payload.signature', expires_in_seconds: 900, surface: 'UAI_PERTO_ASSISTANT', actor_id: 'hidden' })
      };
    };
    try {
      const res = response();
      await sessionHandler(request({}), res);
      assert.equal(res.statusCode, 201);
      assert.deepEqual(res.body, { ok: true, expiresInSeconds: 900 });
      assert.match(res.headers['Set-Cookie'], /^__Host-uai_assistant_session=header\.payload\.signature;/);
      assert.match(res.headers['Set-Cookie'], /HttpOnly; Secure; SameSite=Strict/);
      assert.equal(call.url, 'https://assistant-origin.example.test/v1/public/assistant-session');
      assert.equal(call.options.headers['CF-Access-Client-Id'], privateEnv.CF_ACCESS_CLIENT_ID);
      assert.equal(call.options.headers['CF-Access-Client-Secret'], privateEnv.CF_ACCESS_CLIENT_SECRET);
      assert.equal(call.options.headers['x-mcir-gateway-secret'], privateEnv.MCIR_ASSISTANT_GATEWAY_SECRET);
      const publicJson = JSON.stringify(res.body);
      assert.doesNotMatch(publicJson, /access-client|gateway-secret|assistant-origin/i);
    } finally { global.fetch = originalFetch; }
  });
});

test('message envia token de consumidor e devolve somente texto público', async () => {
  await withEnvironment(privateEnv, async () => {
    const originalFetch = global.fetch;
    let call;
    global.fetch = async (url, options) => {
      call = { url: String(url), options };
      return { ok: true, status: 200, json: async () => ({ message: 'Posso ajudar. Em qual bairro você está?', scores: [0.99], trace: 'hidden' }) };
    };
    try {
      const res = response();
      await messageHandler(request({ message: 'Meu chuveiro queimou.' }, { cookie: '__Host-uai_assistant_session=header.payload.signature' }), res);
      assert.equal(res.statusCode, 200);
      assert.deepEqual(res.body, { message: 'Posso ajudar. Em qual bairro você está?' });
      assert.equal(call.url, 'https://assistant-origin.example.test/v1/consumer/assistant/message');
      assert.equal(call.options.headers.Authorization, 'Bearer header.payload.signature');
      assert.deepEqual(JSON.parse(call.options.body), { text: 'Meu chuveiro queimou.', locale: 'pt-BR' });
      assert.equal('conversation' in JSON.parse(call.options.body), false);
    } finally { global.fetch = originalFetch; }
  });
});

test('indisponibilidade nunca devolve erro, trace, origin ou credenciais', async () => {
  await withEnvironment(privateEnv, async () => {
    const originalFetch = global.fetch;
    global.fetch = async () => ({ ok: false, status: 500, json: async () => ({ error: 'KERNEL_FAILURE', trace: 'secret trace' }) });
    try {
      for (const [handler, body] of [
        [sessionHandler, {}],
        [messageHandler, { message: 'Preciso de ajuda agora.' }]
      ]) {
        const res = response();
        await handler(request(body, handler === messageHandler ? { cookie: '__Host-uai_assistant_session=header.payload.signature' } : {}), res);
        assert.equal(res.statusCode, 503);
        assert.deepEqual(Object.keys(res.body), ['message']);
        assert.match(res.body.message, /temporariamente indisponível/i);
        assert.doesNotMatch(JSON.stringify(res.body), /kernel|trace|secret|origin/i);
      }
    } finally { global.fetch = originalFetch; }
  });
});

test('fala técnica ou endereço do origin são bloqueados na saída', async () => {
  await withEnvironment(privateEnv, async () => {
    const originalFetch = global.fetch;
    try {
      for (const reply of ['MCIR respondeu com score 0.98.', 'Falha em assistant-origin.example.test.']) {
        global.fetch = async () => ({ ok: true, status: 200, json: async () => ({ message: reply }) });
        const res = response();
        await messageHandler(request({ message: 'Preciso resolver isto.' }, { cookie: '__Host-uai_assistant_session=header.payload.signature' }), res);
        assert.equal(res.statusCode, 503);
        assert.equal(JSON.stringify(res.body).includes(reply), false);
      }
    } finally { global.fetch = originalFetch; }
  });
});

test('sem configuração privada a resposta continua humana e sem detalhes', async () => {
  await withEnvironment({
    MCIR_PUBLIC_ASSISTANT_ORIGIN: undefined,
    CF_ACCESS_CLIENT_ID: undefined,
    CF_ACCESS_CLIENT_SECRET: undefined,
    MCIR_ASSISTANT_GATEWAY_SECRET: undefined
  }, async () => {
    const res = response();
    await sessionHandler(request({}), res);
    assert.equal(res.statusCode, 503);
    assert.deepEqual(Object.keys(res.body), ['message']);
  });
});

test('requisição de outra origem é rejeitada antes de chegar ao origin privado', async () => {
  await withEnvironment(privateEnv, async () => {
    const originalFetch = global.fetch;
    let called = false;
    global.fetch = async () => { called = true; throw new Error('should not run'); };
    try {
      for (const handler of [sessionHandler, messageHandler]) {
        const res = response();
        await handler(request({ message: 'Teste' }, { origin: 'https://evil.example', cookie: '__Host-uai_assistant_session=header.payload.signature' }), res);
        assert.equal(res.statusCode, 403);
      }
      assert.equal(called, false);
    } finally { global.fetch = originalFetch; }
  });
});
