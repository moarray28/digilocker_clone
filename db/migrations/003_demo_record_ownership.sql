CREATE TABLE IF NOT EXISTS issuer_test_record_owners (
  issuer_record_id text PRIMARY KEY REFERENCES issuer_test_records(id) ON DELETE CASCADE,
  owner_user_id text NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS issuer_test_record_owners_user_idx
  ON issuer_test_record_owners (owner_user_id, issuer_record_id);
