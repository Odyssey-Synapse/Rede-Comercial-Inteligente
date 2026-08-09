let sqlClientPromise = null;

async function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("QUOTE_STORE_NOT_CONFIGURED");
  if (!sqlClientPromise) {
    sqlClientPromise = import("postgres").then(({ default: postgres }) => postgres(url, { max: 1, prepare: false }));
  }
  return sqlClientPromise;
}

export async function persistQuote(quote, integrityToken) {
  const sql = await getSql();
  await sql`
    create table if not exists achei_aqui_quotes (
      quote_id text primary key,
      cnpj text not null,
      company_name text not null,
      cnae_code text not null,
      category_label text not null,
      proposed_monthly_cents integer not null,
      payload jsonb not null,
      integrity_token text not null,
      status text not null default 'PROPOSED',
      created_at timestamptz not null,
      valid_until timestamptz not null
    )
  `;
  await sql`
    insert into achei_aqui_quotes (
      quote_id, cnpj, company_name, cnae_code, category_label,
      proposed_monthly_cents, payload, integrity_token, status, created_at, valid_until
    ) values (
      ${quote.quoteId}, ${quote.company.cnpj}, ${quote.company.name}, ${quote.category.cnaeCode}, ${quote.category.label},
      ${quote.proposedMonthlyCents}, ${sql.json(quote)}, ${integrityToken}, 'PROPOSED', ${quote.computedAt}, ${quote.validUntil}
    )
  `;
  return { stored: true };
}
