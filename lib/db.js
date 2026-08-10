let sqlClientPromise = null;

async function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL_MISSING");
  if (!sqlClientPromise) {
    sqlClientPromise = import("postgres")
      .then(({ default: postgres }) => postgres(url, { max: 1, prepare: false }));
  }
  return sqlClientPromise;
}

export async function ensureDb() {
  await getSql();
  return true;
}

export async function saveQuote(quote) {
  const sql = await getSql();
  const {
    quoteId, cnpj, companyName, activityCode, activityLabel,
    pricingPolicyVersion, economicModelVersion, pmeCents, mpCents,
    createdAt, validUntil, signature, status = "issued",
    sourcePayloadHash = null, founderApplied = false,
    founderRegistryVersion = null, cnpjProvider = null,
    cnpjSourceUpdatedAt = null, cnpjLookupId = null
  } = quote;

  const rows = await sql`
    INSERT INTO quotes (
      quote_id, cnpj, company_name, activity_code, activity_label,
      pricing_policy_version, economic_model_version,
      pme_cents, mp_cents, created_at, valid_until,
      signature, status, source_payload_hash,
      founder_applied, founder_registry_version,
      cnpj_provider, cnpj_source_updated_at, cnpj_lookup_id
    )
    VALUES (
      ${quoteId}, ${cnpj}, ${companyName}, ${activityCode}, ${activityLabel},
      ${pricingPolicyVersion}, ${economicModelVersion},
      ${pmeCents}, ${mpCents}, ${createdAt}, ${validUntil},
      ${signature}, ${status}, ${sourcePayloadHash},
      ${Boolean(founderApplied)}, ${founderRegistryVersion},
      ${cnpjProvider}, ${cnpjSourceUpdatedAt}, ${cnpjLookupId}
    )
    ON CONFLICT (quote_id) DO UPDATE SET
      signature = EXCLUDED.signature,
      status = EXCLUDED.status,
      updated_at = NOW()
    RETURNING *;
  `;
  return rows[0] || null;
}

export async function getQuoteById(quoteId) {
  const sql = await getSql();
  const rows = await sql`SELECT * FROM quotes WHERE quote_id = ${quoteId} LIMIT 1;`;
  return rows[0] || null;
}

export async function updateQuoteStatus(quoteId, status) {
  const allowed = new Set(["issued", "viewed", "accepted", "expired", "cancelled"]);
  if (!allowed.has(status)) throw new Error("INVALID_QUOTE_STATUS");
  const sql = await getSql();
  const rows = await sql`
    UPDATE quotes SET status = ${status}, updated_at = NOW()
    WHERE quote_id = ${quoteId} RETURNING *;
  `;
  return rows[0] || null;
}

export async function appendQuoteEvent({ quoteId, eventType, metadata = {} }) {
  const sql = await getSql();
  const rows = await sql`
    INSERT INTO quote_events (quote_id, event_type, metadata)
    VALUES (${quoteId}, ${eventType}, ${sql.json(metadata)})
    RETURNING *;
  `;
  return rows[0] || null;
}

export async function recordQuoteAcceptance({
  quoteId, acceptanceVersion, acceptedByName, acceptedByEmail,
  acceptedAt, acceptedIp = null, acceptedUserAgent = null
}) {
  const sql = await getSql();
  const rows = await sql`
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
  return rows[0] || null;
}

export async function markFounderOnQuote({ quoteId, founderApplied, founderRegistryVersion = null }) {
  const sql = await getSql();
  const rows = await sql`
    UPDATE quotes
    SET founder_applied = ${Boolean(founderApplied)},
        founder_registry_version = ${founderRegistryVersion},
        updated_at = NOW()
    WHERE quote_id = ${quoteId}
    RETURNING *;
  `;
  return rows[0] || null;
}

export function resetDbClientForTests() {
  sqlClientPromise = null;
}
