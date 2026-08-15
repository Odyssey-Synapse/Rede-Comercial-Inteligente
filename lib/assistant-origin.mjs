const unavailableMessage = 'O Uai Perto está temporariamente indisponível. Tente novamente em alguns instantes.';
const sessionExpiredMessage = 'Sua conversa expirou. Tente enviar a mensagem novamente.';
const buckets = new Map();

export function header(req, name) {
  const value = req.headers?.[name] ?? req.headers?.[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : String(value || '');
}

export function clientIp(req) {
  return header(req, 'x-forwarded-for').split(',')[0].trim() || req.socket?.remoteAddress || 'unknown';
}

export function cookie(req, name) {
  const prefix = `${name}=`;
  const entry = header(req, 'cookie').split(';').map(value => value.trim()).find(value => value.startsWith(prefix));
  if (!entry) return '';
  try { return decodeURIComponent(entry.slice(prefix.length)); }
  catch { return ''; }
}

export function rateLimited(key, { limit, windowMs = 10 * 60 * 1000, now = Date.now() }) {
  const current = buckets.get(key) || { start: now, count: 0 };
  if (now - current.start >= windowMs) {
    current.start = now;
    current.count = 0;
  }
  current.count += 1;
  buckets.set(key, current);
  return current.count > limit;
}

export function sameOrigin(req) {
  const origin = header(req, 'origin');
  const fetchSite = header(req, 'sec-fetch-site');
  if (fetchSite && !['same-origin', 'none'].includes(fetchSite)) return false;
  if (!origin) return true;
  const host = header(req, 'x-forwarded-host') || header(req, 'host');
  const protocol = header(req, 'x-forwarded-proto') || 'https';
  try {
    return new URL(origin).origin === new URL(`${protocol}://${host}`).origin;
  } catch {
    return false;
  }
}

export function cleanText(value, max) {
  return String(value || '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .trim()
    .slice(0, max);
}

export function parsedBodySize(req) {
  return Buffer.byteLength(JSON.stringify(req.body || {}), 'utf8');
}

function privateConfiguration(env = process.env) {
  const rawOrigin = env.MCIR_PUBLIC_ASSISTANT_ORIGIN;
  const accessClientId = env.CF_ACCESS_CLIENT_ID;
  const accessClientSecret = env.CF_ACCESS_CLIENT_SECRET;
  const gatewaySecret = env.MCIR_ASSISTANT_GATEWAY_SECRET;
  if (!rawOrigin || !accessClientId || !accessClientSecret || !gatewaySecret) return null;

  try {
    const origin = new URL(rawOrigin);
    const localDevelopment = env.NODE_ENV !== 'production' &&
      origin.protocol === 'http:' &&
      ['localhost', '127.0.0.1', '::1'].includes(origin.hostname);
    if ((origin.protocol !== 'https:' && !localDevelopment) || origin.username || origin.password) return null;
    origin.pathname = '/';
    origin.search = '';
    origin.hash = '';
    return { origin, accessClientId, accessClientSecret, gatewaySecret };
  } catch {
    return null;
  }
}

export async function callAssistantOrigin(path, { token = null, body = null, env = process.env, fetchImpl = globalThis.fetch } = {}) {
  const config = privateConfiguration(env);
  if (!config) return { ok: false, status: 503, data: null, origin: null };
  const allowedPaths = new Set([
    '/v1/public/assistant-session',
    '/v1/consumer/assistant/message',
    '/v1/public/consumer-demo/session',
    '/v1/public/consumer-demo/action'
  ]);
  if (!allowedPaths.has(path)) return { ok: false, status: 503, data: null, origin: null };

  const requestedTimeout = Number.parseInt(env.MCIR_REQUEST_TIMEOUT_MS || '18000', 10);
  const timeout = Number.isFinite(requestedTimeout) ? Math.min(Math.max(requestedTimeout, 3000), 25000) : 18000;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': 'UaiPerto-Vercel-Proxy/2.0',
      'CF-Access-Client-Id': config.accessClientId,
      'CF-Access-Client-Secret': config.accessClientSecret,
      'x-mcir-gateway-secret': config.gatewaySecret
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetchImpl(new URL(path, config.origin), {
      method: 'POST',
      headers,
      body: JSON.stringify(body || {}),
      signal: controller.signal
    });
    const data = await response.json().catch(() => null);
    return { ok: response.ok, status: response.status, data, origin: config.origin };
  } catch {
    return { ok: false, status: 503, data: null, origin: config.origin };
  } finally {
    clearTimeout(timer);
  }
}

export function publicAssistantMessage(data, origin) {
  const cleaned = cleanText(data?.message, 4000);
  const internalTerms = /\b(?:MCIR|Survival Kernel|Semantic Runtime|KCL|Ollama|proofs?|candidates?|scores?|traces?|stack trace|authorization|x-mcir|cf-access)\b/i;
  if (!cleaned || internalTerms.test(cleaned)) return '';
  if (origin?.host && cleaned.toLowerCase().includes(origin.host.toLowerCase())) return '';
  return cleaned;
}

export function replyUnavailable(res) {
  return res.status(503).json({ message: unavailableMessage });
}

export function replySessionExpired(res) {
  return res.status(401).json({ message: sessionExpiredMessage });
}

export function prepareResponse(res) {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
}
