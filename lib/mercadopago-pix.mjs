import crypto from "node:crypto";
import { normalizeMercadoPagoStatus } from "./founder-zero-policy.mjs";

const API = "https://api.mercadopago.com";

function accessToken() {
  const value = String(process.env.MERCADOPAGO_ACCESS_TOKEN || "");
  if (!value) throw new Error("MERCADOPAGO_ACCESS_TOKEN_MISSING");
  return value;
}

function isTestMode() {
  return String(process.env.MERCADOPAGO_TEST_MODE || "").trim() === "1";
}

async function mpFetch(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      authorization: `Bearer ${accessToken()}`,
      "content-type": "application/json",
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error("Mercado Pago request failed", {
      path,
      status: response.status,
      error: data?.error || null,
      message: data?.message || null,
      cause: Array.isArray(data?.cause) ? data.cause : null
    });
    const error = new Error(data?.message || data?.error || `MERCADOPAGO_HTTP_${response.status}`);
    error.code = "MERCADOPAGO_REQUEST_FAILED";
    error.details = data;
    throw error;
  }
  return data;
}

function firstPayment(order = {}) {
  return order?.transactions?.payments?.[0] || {};
}

function cleanText(value) {
  const text = String(value || "").trim();
  return text || null;
}

function pixFields(order = {}) {
  const payment = firstPayment(order);
  const method = payment?.payment_method || order?.payment_method || {};
  const qrCode = cleanText(method?.qr_code);
  const rawBase64 = cleanText(method?.qr_code_base64);
  const qrCodeBase64 = rawBase64 && rawBase64.length >= 32 ? rawBase64.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "") : null;
  const ticketUrl = cleanText(method?.ticket_url);
  return { payment, method, qrCode, qrCodeBase64, ticketUrl };
}

export async function createMercadoPagoPixOrder({ paymentId, amountCents, payerEmail }) {
  const testMode = isTestMode();
  const amount = testMode ? "50.00" : (Number(amountCents) / 100).toFixed(2);
  const payer = testMode
    ? { email: "test_user_br@testuser.com", first_name: "APRO" }
    : { email: String(payerEmail || "").trim() };

  const body = {
    type: "online",
    total_amount: amount,
    external_reference: paymentId,
    processing_mode: "automatic",
    transactions: {
      payments: [
        {
          amount,
          payment_method: {
            id: "pix",
            type: "bank_transfer"
          }
        }
      ]
    },
    payer
  };

  const order = await mpFetch("/v1/orders", {
    method: "POST",
    headers: { "X-Idempotency-Key": paymentId },
    body: JSON.stringify(body)
  });

  const { payment, qrCode, qrCodeBase64, ticketUrl } = pixFields(order);
  const status = order?.status || payment?.status || "created";
  const statusDetail = order?.status_detail || payment?.status_detail || null;

  console.info("Mercado Pago Pix order created", {
    orderId: String(order?.id || ""),
    status,
    statusDetail,
    amount,
    hasQrCode: Boolean(qrCode),
    qrCodeBase64Length: qrCodeBase64?.length || 0,
    hasTicketUrl: Boolean(ticketUrl),
    testMode
  });

  return {
    providerPaymentId: String(order?.id || ""),
    status,
    statusDetail,
    normalizedStatus: normalizeMercadoPagoStatus(status, statusDetail),
    qrCode,
    qrCodeBase64,
    ticketUrl,
    raw: order
  };
}

export async function getMercadoPagoOrder(id) {
  const order = await mpFetch(`/v1/orders/${encodeURIComponent(id)}`, { method: "GET" });
  const { payment } = pixFields(order);
  const amount = Number(order?.total_amount ?? payment?.amount ?? 0);
  const status = order?.status || payment?.status || "";
  const statusDetail = order?.status_detail || payment?.status_detail || null;
  const normalizedStatus = normalizeMercadoPagoStatus(status, statusDetail);

  console.info("Mercado Pago order fetched", {
    orderId: String(order?.id || id),
    status,
    statusDetail,
    normalizedStatus
  });

  return {
    providerPaymentId: String(order?.id || id),
    externalReference: String(order?.external_reference || ""),
    amountCents: Math.round(amount * 100),
    status,
    statusDetail,
    normalizedStatus,
    raw: order
  };
}

function parseSignature(value) {
  const parts = Object.fromEntries(
    String(value || "")
      .split(",")
      .map(part => {
        const [key, ...rest] = part.trim().split("=");
        return [key, rest.join("=")];
      })
      .filter(([key, val]) => key && val)
  );
  return { ts: parts.ts || "", v1: parts.v1 || "" };
}

export function verifyMercadoPagoWebhookSignature({
  xSignature,
  xRequestId,
  dataId,
  secret = process.env.MERCADOPAGO_WEBHOOK_SECRET,
  nowMs = Date.now(),
  toleranceMs = Number(process.env.MERCADOPAGO_WEBHOOK_TOLERANCE_MS || 600000)
}) {
  if (!secret) return { valid: false, reason: "WEBHOOK_SECRET_MISSING" };
  const { ts, v1 } = parseSignature(xSignature);
  if (!ts || !v1) return { valid: false, reason: "WEBHOOK_SIGNATURE_MISSING" };

  const id = String(dataId || "").toLowerCase();
  const requestId = String(xRequestId || "");
  let manifest = "";
  if (id) manifest += `id:${id};`;
  if (requestId) manifest += `request-id:${requestId};`;
  manifest += `ts:${ts};`;

  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");
  const a = Buffer.from(v1, "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { valid: false, reason: "WEBHOOK_SIGNATURE_INVALID" };
  }

  const numericTs = Number(ts);
  if (Number.isFinite(numericTs) && toleranceMs > 0) {
    const timestampMs = numericTs < 10000000000 ? numericTs * 1000 : numericTs;
    if (Math.abs(nowMs - timestampMs) > toleranceMs) {
      return { valid: false, reason: "WEBHOOK_TIMESTAMP_OUT_OF_RANGE" };
    }
  }
  return { valid: true };
}
