import crypto from "node:crypto";

export async function verifyTurnstileToken(token, remoteIp, options = {}, fetchImpl = fetch) {
  const required = String(process.env.TURNSTILE_REQUIRED || "false").toLowerCase() === "true";
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!required) return { ok: true, bypassed: true };
  if (!secret) return { ok: false, reason: "TURNSTILE_NOT_CONFIGURED" };
  if (!token) return { ok: false, reason: "TURNSTILE_TOKEN_REQUIRED" };
  if (typeof token !== "string" || token.length > 2048) {
    return { ok: false, reason: "TURNSTILE_TOKEN_INVALID" };
  }

  const controller = new AbortController();
  const timeoutMs = Math.min(15000, Math.max(2000, Number(process.env.TURNSTILE_TIMEOUT_MS || 8000)));
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        secret,
        response: token,
        remoteip: remoteIp || undefined,
        idempotency_key: crypto.randomUUID()
      }),
      signal: controller.signal
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error("Turnstile Siteverify HTTP error", { status: response.status });
      return { ok: false, reason: "TURNSTILE_VERIFY_UNAVAILABLE", details: [`HTTP_${response.status}`] };
    }

    if (!data.success) {
      return {
        ok: false,
        reason: "TURNSTILE_REJECTED",
        details: data["error-codes"] || []
      };
    }

    if (options.expectedAction && data.action !== options.expectedAction) {
      return {
        ok: false,
        reason: "TURNSTILE_ACTION_MISMATCH",
        details: [`expected:${options.expectedAction}`, `received:${data.action || ""}`]
      };
    }

    const expectedHostname = options.expectedHostname || process.env.TURNSTILE_EXPECTED_HOSTNAME || null;
    if (expectedHostname && data.hostname !== expectedHostname) {
      return {
        ok: false,
        reason: "TURNSTILE_HOSTNAME_MISMATCH",
        details: [`expected:${expectedHostname}`, `received:${data.hostname || ""}`]
      };
    }

    return { ok: true, data };
  } catch (error) {
    if (error?.name === "AbortError") {
      console.error("Turnstile Siteverify timeout");
      return { ok: false, reason: "TURNSTILE_VERIFY_TIMEOUT" };
    }
    console.error("Turnstile Siteverify internal error", error);
    return { ok: false, reason: "TURNSTILE_VERIFY_UNAVAILABLE" };
  } finally {
    clearTimeout(timer);
  }
}
