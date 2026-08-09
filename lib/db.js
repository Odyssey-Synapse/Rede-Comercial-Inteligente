import { sql } from "@vercel/postgres";

export async function ensureDb() {
  if (!process.env.POSTGRES_URL && !process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL_MISSING");
  }
}

export async function saveQuote(quote) {
  await ensureDb();
  const {
    quoteId, cnpj, companyName, activityCode, activityLabel,
    pricingPolicyVersion, economicModelVersion, pmeCents, mpCents,
    createdAt, validUntil, signature, status = "issued",
    sourcePayloadHash = null
  } = quote;

  const result = await sql`
    INSERT INTO quotes (
      quote_id, cnpj, company_name, activity_code, activity_label,
      pricing_policy_version, economic_model_version,
      pme_cents, mp_cents, created_at, valid_until,
      signature, status, source_payload_hash
    )
    VALUES (
      ${quoteId}, ${cnpj}, ${companyName}, ${activityCode}, ${activityLabel},
      ${pricingPolicyVersion}, ${economicModelVersion},
      ${pmeCents}, ${mpCents}, ${createdAt}, ${validUntil},
      ${signature}, ${status}, ${sourcePayloadHash}
    )
    ON CONFLICT (quote_id) DO UPDATE SET
      signature = EXCLUDED.signature,
      status = EXCLUDED.status
    RETURNING *;
  `;
  return result.rows[0];
}

export async function getQuoteById(quoteId) {
  await ensureDb();
  const result = await sql`
    SELECT * FROM quotes
    WHERE quote_id = ${quoteId}
    LIMIT 1;
  `;
  return result.rows[0] || null;
}

export async function updateQuoteStatus(quoteId, status) {
  await ensureDb();
  const allowed = new Set(["issued", "viewed", "accepted", "expired", "cancelled"]);
  if (!allowed.has(status)) throw new Error("INVALID_QUOTE_STATUS");
  const result = await sql`
    UPDATE quotes
    SET status = ${status}, updated_at = NOW()
    WHERE quote_id = ${quoteId}
    RETURNING *;
  `;
  return result.rows[0] || null;
}

export async function appendQuoteEvent({ quoteId, eventType, metadata = {} }) {
  await ensureDb();
  const result = await sql`
    INSERT INTO quote_events (quote_id, event_type, metadata)
    VALUES (${quoteId}, ${eventType}, ${JSON.stringify(metadata)})
    RETURNING *;
  `;
  return result.rows[0];
}

export async function recordQuoteAcceptance({
  quoteId, acceptanceVersion, acceptedByName, acceptedByEmail,
  acceptedAt, acceptedIp = null, acceptedUserAgent = null
}) {
  await ensureDb();
  const result = await sql`
    UPDATE quotes
    SET status = 'accepted',
        acceptance_version = ${acceptanceVersion},
        accepted_by_name = ${acceptedByName},
        accepted_by_email = ${acceptedByEmail},
        accepted_at = ${acceptedAt},
        accepted_ip = ${acceptedIp},
        accepted_user_agent = ${acceptedUserAgent},
        updated_at = NOW()
    WHERE quote_id = ${quoteId}
    RETURNING *;
  `;
  return result.rows[0] || null;
}

export async function markFounderOnQuote({
  quoteId, founderApplied, founderRegistryVersion = null
}) {
  await ensureDb();
  const result = await sql`
    UPDATE quotes
    SET founder_applied = ${Boolean(founderApplied)},
        founder_registry_version = ${founderRegistryVersion},
        updated_at = NOW()
    WHERE quote_id = ${quoteId}
    RETURNING *;
  `;
  return result.rows[0] || null;
}
