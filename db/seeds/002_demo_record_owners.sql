INSERT INTO issuer_test_record_owners (issuer_record_id, owner_user_id)
SELECT assignments.issuer_record_id, users.id
FROM (VALUES
  ('demo-record-active-01', 'citizen.alpha@example.test'),
  ('demo-record-revoked-01', 'citizen.alpha@example.test'),
  ('demo-record-active-02', 'citizen.beta@example.test'),
  ('demo-record-superseded-01', 'citizen.beta@example.test'),
  ('demo-record-active-03', 'citizen.gamma@example.test'),
  ('demo-record-invalid-signature-01', 'citizen.gamma@example.test')
) AS assignments(issuer_record_id, owner_email)
JOIN issuer_test_records records ON records.id = assignments.issuer_record_id
JOIN "user" users ON lower(users.email) = assignments.owner_email
ON CONFLICT (issuer_record_id) DO UPDATE
SET owner_user_id = EXCLUDED.owner_user_id;
