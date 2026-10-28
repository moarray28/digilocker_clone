CREATE TABLE IF NOT EXISTS app_issuers (
  id text PRIMARY KEY,
  display_name text NOT NULL,
  trusted_key_id text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS issuer_test_records (
  id text PRIMARY KEY,
  issuer_id text NOT NULL REFERENCES app_issuers(id) ON DELETE RESTRICT,
  certificate_reference text NOT NULL,
  student_name text NOT NULL,
  seat_number text NOT NULL,
  exam_year integer NOT NULL CHECK (exam_year BETWEEN 2000 AND 2100),
  education_level text NOT NULL CHECK (education_level IN ('secondary', 'higher_secondary')),
  certificate_status text NOT NULL CHECK (certificate_status IN ('active', 'revoked', 'superseded')),
  signature_scenario text NOT NULL DEFAULT 'valid' CHECK (signature_scenario IN ('valid', 'invalid')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (issuer_id, certificate_reference),
  UNIQUE (issuer_id, seat_number, exam_year, education_level)
);

CREATE TABLE IF NOT EXISTS certificate_requests (
  id text PRIMARY KEY,
  owner_user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  issuer_id text NOT NULL REFERENCES app_issuers(id) ON DELETE RESTRICT,
  state text NOT NULL CHECK (state IN (
    'created', 'authenticating_request', 'querying_issuer', 'certificate_received',
    'verifying_signature', 'checking_current_status', 'storing_document', 'completed',
    'no_match', 'issuer_unavailable', 'integrity_failed', 'signature_invalid', 'status_check_failed',
    'certificate_revoked', 'certificate_superseded', 'storage_failed', 'internal_error'
  )),
  idempotency_key text NOT NULL,
  safe_error_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE (owner_user_id, idempotency_key),
  UNIQUE (id, owner_user_id, issuer_id)
);

CREATE TABLE IF NOT EXISTS wallet_documents (
  id text PRIMARY KEY,
  request_id text NOT NULL UNIQUE,
  owner_user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  issuer_id text NOT NULL REFERENCES app_issuers(id) ON DELETE RESTRICT,
  issuer_certificate_reference text NOT NULL,
  storage_object_key text NOT NULL UNIQUE,
  sha256_hex text NOT NULL CHECK (sha256_hex ~ '^[0-9a-f]{64}$'),
  integrity_verified boolean NOT NULL DEFAULT false,
  signature_verified boolean NOT NULL DEFAULT false,
  signature_key_id text NOT NULL,
  current_status text NOT NULL CHECK (current_status IN ('active', 'revoked', 'superseded', 'unavailable')),
  status_checked_at timestamptz,
  reissued_from_document_id text REFERENCES wallet_documents(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (current_status = 'unavailable' OR status_checked_at IS NOT NULL),
  UNIQUE (owner_user_id, issuer_id, issuer_certificate_reference),
  FOREIGN KEY (request_id, owner_user_id, issuer_id)
    REFERENCES certificate_requests(id, owner_user_id, issuer_id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS audit_events (
  id text PRIMARY KEY,
  actor_user_id text REFERENCES "user"(id) ON DELETE SET NULL,
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text,
  outcome text NOT NULL CHECK (outcome IN ('success', 'denied', 'failure')),
  safe_metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS certificate_requests_owner_created_idx
  ON certificate_requests (owner_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS wallet_documents_owner_created_idx
  ON wallet_documents (owner_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_events_actor_created_idx
  ON audit_events (actor_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS issuer_test_records_lookup_idx
  ON issuer_test_records (issuer_id, seat_number, exam_year, education_level);







