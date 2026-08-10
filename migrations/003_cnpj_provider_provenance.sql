BEGIN;

ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS cnpj_provider TEXT,
  ADD COLUMN IF NOT EXISTS cnpj_source_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cnpj_lookup_id TEXT;

CREATE INDEX IF NOT EXISTS quotes_cnpj_provider_idx ON quotes(cnpj_provider);
CREATE INDEX IF NOT EXISTS quotes_cnpj_lookup_id_idx ON quotes(cnpj_lookup_id);

COMMIT;
