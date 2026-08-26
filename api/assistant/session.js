import {
  callAssistantOrigin,
  clientIp,
  header,
  parsedBodySize,
  prepareResponse,
  rateLimited,
  replyUnavailable,
  sameOrigin
} from '../../lib/assistant-origin.mjs';

export default async function handler(req, res) {
  prepareResponse(res);
  if (req.method !== 'POST') return res.status(405).json({ message: 'Inicie uma conversa com o Uai Perto.' });
  if (!sameOrigin(req)) return res.status(403).json({ message: 'Não foi possível iniciar esta conversa.' });
  if (Number(header(req, 'content-length') || 0) > 2_000 || parsedBodySize(req) > 2_000) return replyUnavailable(res);
  if (rateLimited(`session:${clientIp(req)}`, { limit: 12 })) return res.status(429).json({ message: 'Aguarde um instante antes de iniciar outra conversa.' });

  const upstream = await callAssistantOrigin('/v1/public/assistant-session');
  const token = typeof upstream.data?.token === 'string' ? upstream.data.token : '';
  const expiresInSeconds = Number(upstream.data?.expires_in_seconds);
  if (!upstream.ok || upstream.data?.surface !== 'UAI_PERTO_ASSISTANT' || !token || token.length > 4096 || !Number.isFinite(expiresInSeconds)) {
    return replyUnavailable(res);
  }
  res.setHeader('Set-Cookie', `__Host-uai_assistant_session=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${Math.max(0, Math.trunc(expiresInSeconds))}`);
  return res.status(201).json({ ok: true, expiresInSeconds });
}
