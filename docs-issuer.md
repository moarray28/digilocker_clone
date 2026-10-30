# Simulated issuer adapter

`lib/issuer/simulated-issuer.ts` is the server-side `IssuerAdapter` implementation. It looks up a record only when the authenticated user ID matches its row in `issuer_test_record_owners`, validates the lookup shape, returns the same no-match result for unassigned records, creates a clearly watermarked PDF, signs a stable manifest with a local Ed25519 test key, and performs a fresh PostgreSQL status query for each current-status check.

The manifest includes the PDF SHA-256 digest and the synthetic certificate fields. `lib/crypto/issuer-manifest.ts` independently checks file integrity and verifies the signature against the public half of an in-memory demo key pair and expected issuer/key ID. The public key is not trusted from the returned artifact. The key pair is generated when the server module loads; it is not persisted or suitable for real issuer trust. Status is separate from the signature and must be checked at display time by the wallet workflow.

## Demo scenarios

Copy `.env.example` to `.env.local` and install project dependencies. The simulator needs no issuer key files, key paths, or issuer key environment variables. The committed issuer registry fixture uses key ID `demo-school-key-v1`.

| Scenario | Fixture |
| --- | --- |
| Active, valid signature | Aarav Sample · DEMO-25001 · secondary · 2025 |
| Active, valid signature | Isha Example · DEMO-24002 · higher secondary · 2024 |
| Active, valid signature | Nila Demo · DEMO-26006 · secondary · 2026 |
| Revoked | Kabir Test · DEMO-23003 · secondary · 2023 |
| Superseded | Mira Fiction · DEMO-22004 · higher secondary · 2022 |
| Invalid signature | Rehan Placeholder · DEMO-25005 · secondary · 2025 |
| No match | Any other synthetic lookup combination |

Fixture ownership is exclusive: Alpha owns Aarav and the revoked scenario; Beta owns Isha and the superseded scenario; Gamma owns Nila and the invalid-signature scenario. The synthetic account emails are `citizen.alpha@example.test`, `citizen.beta@example.test`, and `citizen.gamma@example.test`. Create distinct passwords locally; never share or commit them.

## Add another synthetic issuer record

Only add fictional demo identities. The request form looks up a record by student name, seat number, exam year, and education level. Add the record to `db/seeds/001_synthetic_issuer.sql` and exactly one corresponding account assignment to `db/seeds/002_demo_record_owners.sql`, then rerun `npm run db:seed:issuer`. Do not assign one fixture to multiple users.

Example SQL for one new active, correctly signed scenario:

```sql
INSERT INTO issuer_test_records (
  id, issuer_id, certificate_reference, student_name, seat_number,
  exam_year, education_level, certificate_status, signature_scenario
)
VALUES (
  'demo-record-active-2026-06',
  'demo-school-board',
  'demo-cert-active-2026-06',
  'Nila Demo',
  'DEMO-26006',
  2026,
  'secondary',
  'active',
  'valid'
)
ON CONFLICT (id) DO UPDATE SET
  certificate_reference = EXCLUDED.certificate_reference,
  student_name = EXCLUDED.student_name,
  seat_number = EXCLUDED.seat_number,
  exam_year = EXCLUDED.exam_year,
  education_level = EXCLUDED.education_level,
  certificate_status = EXCLUDED.certificate_status,
  signature_scenario = EXCLUDED.signature_scenario;
```

Change the unique ID, certificate reference, seat number, year, and lookup fields for each additional record, then assign its owner by account email in the ownership seed. The database restricts status to `active`, `revoked`, or `superseded`; use `signature_scenario='invalid'` to test signature rejection. A request for a valid active record generates and signs a fresh synthetic PDF at retrieval time, so no PDF needs to be uploaded or stored in the seed. Only the assigned demo account can retrieve it.

Set `ISSUER_SIMULATED_FAILURE_MODE=unavailable` to make retrieval and status checks fail closed, or `status_unavailable` to leave lookup working while blocking the fresh status check. Use `none` for the normal flow. Reset the value to `none` after a failure scenario.

A successful synthetic lookup only matches a seeded fixture assigned to the signed-in demo account; it does not verify a real person's identity. These records and signatures are synthetic interview fixtures. The adapter is not connected to a school, government, or identity provider. The authenticated request route passes the session user ID to the adapter; it never accepts an owner ID from the browser. The route validates the returned PDF digest and signed manifest independently, checks current status, and stores only active, correctly signed PDFs in the private Supabase bucket. The wallet read route scopes document metadata to the authenticated owner, performs a fresh issuer status check, downloads the private object server-side, and compares its SHA-256 digest before returning it. The route sends `Cache-Control: private, no-store` and supports inline display and attachment download. These paths require configured PostgreSQL, the private bucket, and seeded fixtures before they can run end to end.

