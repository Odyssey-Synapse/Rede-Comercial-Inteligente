import crypto from "node:crypto";

const b64url = (value) => Buffer.from(value).toString("base64url");

export function signCompanyLookup(payload, secret) {
  if (!secret || String(secret).length < 32) throw new Error("LOOKUP_SECRET_TOO_SHORT");
  const body = b64url(JSON.stringify(payload));
  const signature = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${signature}`;
}

export function verifyCompanyLookup(token, secret, now = new Date()) {
  try {
    if (!secret || String(secret).length < 32 || typeof token !== "string") return { valid: false };
    const [body, signature, extra] = token.split(".");
    if (!body || !signature || extra) return { valid: false };
    const expected = crypto.createHmac("sha256", secret).update(body).digest();
    const actual = Buffer.from(signature, "base64url");
    if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) return { valid: false };
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    if (!payload.expiresAt || now.getTime() > new Date(payload.expiresAt).getTime()) return { valid: false, reason: "EXPIRED" };
    return { valid: true, payload };
  } catch {
    return { valid: false };
  }
}
