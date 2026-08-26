import {
  callAssistantOrigin,
  cleanText,
  clientIp,
  cookie,
  header,
  parsedBodySize,
  prepareResponse,
  publicAssistantMessage,
  rateLimited,
  replySessionExpired,
  replyUnavailable,
  sameOrigin
} from '../../lib/assistant-origin.mjs';

export default async function handler(req, res) {
  prepareResponse(res);
  if (req.method !== 'POST') return res.status(405).json({ message: 'Envie uma mensagem para conversar com o Uai Perto.' });
  if (!sameOrigin(req)) return res.status(403).json({ message: 'Não foi possível enviar esta mensagem.' });
  const declaredSize = Number(header(req, 'content-length') || 0);
  if (declaredSize > 24_000 || parsedBodySize(req) > 24_000) return res.status(413).json({ message: 'Essa mensagem ficou grande demais. Tente resumir um pouco.' });
  if (rateLimited(`message:${clientIp(req)}`, { limit: 30 })) return res.status(429).json({ message: 'Muitas mensagens em pouco tempo. Aguarde um instante e tente novamente.' });

  const message = cleanText(req.body?.message, 1200);
  const token = cleanText(cookie(req, '__Host-uai_assistant_session'), 4096);
  if (message.length < 2) return res.status(400).json({ message: 'Conte um pouco mais sobre o que você precisa resolver.' });
  if (!token || token.split('.').length !== 3) return replySessionExpired(res);

  const upstream = await callAssistantOrigin('/v1/consumer/assistant/message', {
    token,
    body: { text: message, locale: 'pt-BR' }
  });
  if ([401, 403].includes(upstream.status)) return replySessionExpired(res);
  if (!upstream.ok) return replyUnavailable(res);
  const answer = publicAssistantMessage(upstream.data, upstream.origin);
  if (!answer) return replyUnavailable(res);
  return res.status(200).json({ message: answer });
}
