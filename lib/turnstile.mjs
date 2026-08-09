export async function verifyTurnstileToken(token, remoteIp, fetchImpl = fetch) {
  const required = String(process.env.TURNSTILE_REQUIRED || "false").toLowerCase() === "true";
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!required) return { ok: true, bypassed: true };
  if (!secret) return { ok: false, reason: "TURNSTILE_NOT_CONFIGURED" };
  if (!token) return { ok: false, reason: "TURNSTILE_TOKEN_REQUIRED" };

  const response = await fetchImpl("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ secret, response: token, remoteip: remoteIp || undefined })
  });
  const data = await response.json().catch(() => ({}));
  return data.success ? { ok: true, data } : { ok: false, reason: "TURNSTILE_REJECTED", details: data["error-codes"] || [] };
}
