BEGIN;

ALTER TABLE quotes
  ADD COLUMN IF NOT EXISTS founder_applied BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS founder_registry_version TEXT,
  ADD COLUMN IF NOT EXISTS acceptance_version TEXT,
  ADD COLUMN IF NOT EXISTS accepted_by_name TEXT,
  ADD COLUMN IF NOT EXISTS accepted_by_email TEXT,
  ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS accepted_ip TEXT,
  ADD COLUMN IF NOT EXISTS accepted_user_agent TEXT;

CREATE INDEX IF NOT EXISTS quotes_founder_applied_idx ON quotes(founder_applied);
CREATE INDEX IF NOT EXISTS quotes_accepted_at_idx ON quotes(accepted_at DESC);

COMMIT;
