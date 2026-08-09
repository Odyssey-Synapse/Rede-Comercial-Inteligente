BEGIN;

CREATE TABLE IF NOT EXISTS quotes (
  quote_id TEXT PRIMARY KEY,
  cnpj TEXT NOT NULL,
  company_name TEXT NOT NULL,
  activity_code TEXT NOT NULL,
  activity_label TEXT NOT NULL,
  pricing_policy_version TEXT NOT NULL,
  economic_model_version TEXT NOT NULL,
  pme_cents INTEGER NOT NULL CHECK (pme_cents >= 0),
  mp_cents INTEGER NOT NULL CHECK (mp_cents >= 0),
  created_at TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  signature TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'issued'
    CHECK (status IN ('issued','viewed','accepted','expired','cancelled')),
  source_payload_hash TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS quotes_cnpj_idx ON quotes(cnpj);
CREATE INDEX IF NOT EXISTS quotes_status_idx ON quotes(status);
CREATE INDEX IF NOT EXISTS quotes_valid_until_idx ON quotes(valid_until);
CREATE INDEX IF NOT EXISTS quotes_created_at_idx ON quotes(created_at DESC);

CREATE TABLE IF NOT EXISTS quote_events (
  id BIGSERIAL PRIMARY KEY,
  quote_id TEXT NOT NULL REFERENCES quotes(quote_id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS quote_events_quote_id_idx ON quote_events(quote_id);
CREATE INDEX IF NOT EXISTS quote_events_created_at_idx ON quote_events(created_at DESC);

COMMIT;
