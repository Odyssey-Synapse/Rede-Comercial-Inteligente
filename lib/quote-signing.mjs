import crypto from "node:crypto";

function b64url(input) {
  return Buffer.from(input).toString("base64url");
}

export function signQuotePayload(payload, secret) {
  if (!secret || secret.length < 24) throw new Error("QUOTE_SIGNING_SECRET must have at least 24 characters");
  const body = b64url(JSON.stringify(payload));
  const signature = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${signature}`;
}

export function verifyQuoteToken(token, secret) {
  const [body, signature] = String(token).split(".");
  if (!body || !signature) return { valid: false };
  const expected = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return { valid: false };
  try {
    return { valid: true, payload: JSON.parse(Buffer.from(body, "base64url").toString("utf8")) };
  } catch {
    return { valid: false };
  }
}
