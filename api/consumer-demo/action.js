import {
  clientIp,
  cookie,
  cleanText,
  header,
  parsedBodySize,
  prepareResponse,
  rateLimited,
  replySessionExpired,
  replyUnavailable,
  sameOrigin
} from '../../lib/assistant-origin.mjs';
import {
  callConsumerDemoOrigin,
  safeConsumerDemoResponse,
  sanitizeConsumerDemoPayload,
  validConsumerDemoAction
} from '../../lib/consumer-demo-origin.mjs';

export default async function handler(req, res) {
  prepareResponse(res);
  if (req.method !== 'POST') return res.status(405).json({ message: 'Use uma ação válida do Uai Perto.' });
  if (!sameOrigin(req)) return res.status(403).json({ message: 'Não foi possível continuar esta experiência.' });
  const declaredSize = Number(header(req, 'content-length') || 0);
  if (declaredSize > 32_000 || parsedBodySize(req) > 32_000) return res.status(413).json({ message: 'Essas informações ficaram grandes demais. Tente resumir um pouco.' });
  if (rateLimited(`consumer-demo-action:${clientIp(req)}`, { limit: 80 })) return res.status(429).json({ message: 'Muitas ações em pouco tempo. Aguarde um instante e tente novamente.' });

  const action = cleanText(req.body?.action, 80);
  if (!validConsumerDemoAction(action)) return res.status(400).json({ message: 'Esta ação não faz parte da demonstração.' });
  const token = cleanText(cookie(req, '__Host-uai_consumer_demo'), 4096);
  if (!token || token.split('.').length !== 3) return replySessionExpired(res);
  const payload = sanitizeConsumerDemoPayload(req.body?.payload ?? {});

  const upstream = await callConsumerDemoOrigin('/v1/public/consumer-demo/action', { token, body: { action, payload } });
  if ([401, 403].includes(upstream.status)) return replySessionExpired(res);
  if (!upstream.ok) return replyUnavailable(res);
  const safe = safeConsumerDemoResponse(upstream.data);
  if (!safe) return replyUnavailable(res);
  return res.status(200).json(safe);
}
