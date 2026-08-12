import { verifyTurnstileToken } from "../lib/turnstile.mjs";

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const buckets = new Map();
const CONSUMER_SURVEY_SUBJECT = "Pesquisa do consumidor — pré-lançamento";

function clean(value, max = 500) {
  return String(value || "").replace(/\u0000/g, "").trim().slice(0, max);
}
function esc(value = "") {
  return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
}
function clientIp(req) {
  const xff = req.headers["x-forwarded-for"];
  return Array.isArray(xff) ? xff[0] : String(xff || req.socket?.remoteAddress || "unknown").split(",")[0].trim();
}
function rateLimited(ip, now = Date.now()) {
  const windowMs = 15 * 60 * 1000;
  const limit = 5;
  const current = buckets.get(ip) || { start: now, count: 0 };
  if (now - current.start >= windowMs) { current.start = now; current.count = 0; }
  current.count += 1;
  buckets.set(ip, current);
  return current.count > limit;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  res.setHeader("Cache-Control", "no-store");

  const body = req.body || {};
  if (clean(body.website, 200)) return res.status(200).json({ ok: true });

  const ip = clientIp(req);
  if (rateLimited(ip)) return res.status(429).json({ error: "RATE_LIMITED", message: "Muitas tentativas. Tente novamente mais tarde." });

  const name = clean(body.name, 120);
  const email = clean(body.email, 254).toLowerCase();
  const subject = clean(body.subject, 120);
  const message = clean(body.message, 4000);
  const consent = body.consent === true || body.consent === "true";
  const isConsumerSurvey = subject === CONSUMER_SURVEY_SUBJECT;

  if (name.length < 2) return res.status(400).json({ error: "INVALID_NAME" });
  if ((!isConsumerSurvey && !emailRe.test(email)) || (isConsumerSurvey && email && !emailRe.test(email))) return res.status(400).json({ error: "INVALID_EMAIL" });
  if (subject.length < 3) return res.status(400).json({ error: "INVALID_SUBJECT" });
  if (message.length < 10) return res.status(400).json({ error: "INVALID_MESSAGE" });
  if (!consent) return res.status(400).json({ error: "CONSENT_REQUIRED" });

  const turnstile = await verifyTurnstileToken(clean(body.turnstileToken, 4096), ip);
  if (!turnstile.ok) return res.status(403).json({ error: turnstile.reason || "ANTIABUSE_REJECTED" });

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  const to = process.env.CONTACT_DESTINATION_EMAIL;
  if (!apiKey || !from || !to) return res.status(503).json({ error: "CONTACT_NOT_CONFIGURED" });

  const emailLine = email ? `\nE-mail: ${email}` : "";
  const emailHtml = email ? `<br><strong>E-mail:</strong> ${esc(email)}` : "";
  const payload = {
    from,
    to: [to],
    subject: `[Uai Perto] ${subject}`,
    text: `Nova mensagem pelo site do Uai Perto\n\nNome: ${name}${emailLine}\nAssunto: ${subject}\n\nMensagem:\n${message}\n`,
    html: `<div style="font-family:Arial,sans-serif;line-height:1.5;color:#111827"><h2>Nova mensagem pelo site do Uai Perto</h2><p><strong>Nome:</strong> ${esc(name)}${emailHtml}<br><strong>Assunto:</strong> ${esc(subject)}</p><hr><p style="white-space:pre-wrap">${esc(message)}</p><hr><p style="font-size:12px;color:#6b7280">Enviado pelo site do Uai Perto.</p></div>`
  };
  if (emailRe.test(email)) payload.reply_to = email;

  let rr;
  try {
    rr = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  } catch {
    return res.status(502).json({ error: "EMAIL_PROVIDER_UNAVAILABLE" });
  }

  const data = await rr.json().catch(() => ({}));
  if (!rr.ok) {
    console.error("Resend contact error", rr.status, data);
    return res.status(502).json({ error: "EMAIL_SEND_FAILED" });
  }

  return res.status(200).json({ ok: true, id: data.id || null });
}
