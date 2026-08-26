# Founder Zero Flow

## Goal

Turn a founder sales call into an auditable operational flow:

`invite -> verified company -> founder offer -> acceptance -> identified Pix -> payment confirmation -> atomic founder slot -> onboarding`

No database editing, environment-registry editing or payment proof screenshot is part of the happy path.

## Public surfaces

- `/fundador?invite=<token>` — invited company flow.
- `/admin-founders` — operational console. Requires `FOUNDER_ADMIN_TOKEN`.

## Canonical states

Application: `OFFERED -> ACCEPTED -> PENDING_PAYMENT -> CONFIRMED -> ONBOARDED`

Payment: `PENDING -> PAID | FAILED | EXPIRED | CANCELLED | REFUNDED`

A founder position is occupied only after an approved payment is fetched from Mercado Pago and the amount matches the local payment record.

## Atomic 54-slot rule

`founder_slots` contains exactly 54 numbered rows. Confirmation runs inside a database transaction and locks one free row using `FOR UPDATE SKIP LOCKED`. This prevents concurrent payments from occupying the same position and prevents a 55th confirmation through the canonical path.

## Pix

The provider adapter uses Mercado Pago `POST /v1/payments` with `payment_method_id=pix`, `external_reference=local payment_id` and `X-Idempotency-Key=local payment_id`. The page renders the returned QR Code and Pix Copia e Cola.

Webhook processing validates `x-signature` with HMAC-SHA256, fetches the payment again from Mercado Pago, rejects amount mismatch, persists status and allocates a founder slot only on approved payment.

## Required environment

`DATABASE_URL`, `COMPANY_LOOKUP_SIGNING_SECRET`, existing CNPJ/Turnstile configuration, `FOUNDER_ADMIN_TOKEN`, `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET`, optional `PUBLIC_BASE_URL`.

Configure the Mercado Pago payment webhook as `https://<production-domain>/api/payment-webhook`.

## Production gate

Before outbound calls prove: invite, mobile open, CNPJ lookup, unique company persistence, correct offer, persistent acceptance, Pix generation, approved payment, signed webhook, amount match, atomic slot allocation, admin visibility, onboarding persistence and reload/resume. Until then `CALL_READINESS=false`.
