INSERT INTO app_issuers (id, display_name, trusted_key_id, active)
VALUES ('demo-school-board', 'Example School Board (Simulated)', 'demo-school-key-v1', true)
ON CONFLICT (id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  trusted_key_id = EXCLUDED.trusted_key_id,
  active = EXCLUDED.active,
  updated_at = now();

INSERT INTO issuer_test_records (
  id, issuer_id, certificate_reference, student_name, seat_number,
  exam_year, education_level, certificate_status, signature_scenario
)
VALUES
  ('demo-record-active-01', 'demo-school-board', 'demo-cert-active-2025-01', 'Aarav Sample', 'DEMO-25001', 2025, 'secondary', 'active', 'valid'),
  ('demo-record-active-02', 'demo-school-board', 'demo-cert-active-2024-02', 'Isha Example', 'DEMO-24002', 2024, 'higher_secondary', 'active', 'valid'),
  ('demo-record-active-03', 'demo-school-board', 'demo-cert-active-2026-06', 'Nila Demo', 'DEMO-26006', 2026, 'secondary', 'active', 'valid'),
  ('demo-record-revoked-01', 'demo-school-board', 'demo-cert-revoked-2023-01', 'Kabir Test', 'DEMO-23003', 2023, 'secondary', 'revoked', 'valid'),
  ('demo-record-superseded-01', 'demo-school-board', 'demo-cert-old-2022-01', 'Mira Fiction', 'DEMO-22004', 2022, 'higher_secondary', 'superseded', 'valid'),
  ('demo-record-invalid-signature-01', 'demo-school-board', 'demo-cert-invalid-signature-2025-05', 'Rehan Placeholder', 'DEMO-25005', 2025, 'secondary', 'active', 'invalid')
ON CONFLICT (id) DO UPDATE SET
  issuer_id = EXCLUDED.issuer_id,
  certificate_reference = EXCLUDED.certificate_reference,
  student_name = EXCLUDED.student_name,
  seat_number = EXCLUDED.seat_number,
  exam_year = EXCLUDED.exam_year,
  education_level = EXCLUDED.education_level,
  certificate_status = EXCLUDED.certificate_status,
  signature_scenario = EXCLUDED.signature_scenario;
