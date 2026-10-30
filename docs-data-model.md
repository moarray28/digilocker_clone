# Application persistence model

The application uses the same Supabase PostgreSQL database configured for Better Auth. Better Auth owns its user, account, and session tables. Application migrations are kept under `db/migrations/` and recorded in `app_schema_migrations`; do not edit generated Better Auth tables by hand.

## Tables

- `app_issuers`: simulated issuer registry and trusted key identifier (never the private key).
- `issuer_test_records`: synthetic issuer-owned lookup rows, including explicit active, revoked, superseded, and invalid-signature scenarios.
- `issuer_test_record_owners`: one-to-one assignment from a synthetic issuer fixture to the Better Auth user allowed to retrieve it. The assignment is taken from the authenticated session, never from browser input.
- `certificate_requests`: owner, issuer, lifecycle state, idempotency key, and safe error code. Raw lookup form inputs are deliberately not persisted.
- `wallet_documents`: owner, request/issuer references, private storage object key, SHA-256 digest, separate signature/current-status results, and optional reissue link. PDF bytes stay in private Supabase Storage.
- `audit_events`: minimal action, outcome, target, and safe metadata. Do not place credentials, lookup values, or certificate contents in metadata.

The schema includes owner and issuer foreign keys, one owner per demo fixture, unique owner/idempotency keys, one wallet result per request, unique issuer certificate references per owner, digest shape checks, lifecycle/status allowlists, and indexes for wallet/request history. A composite foreign key keeps a document's owner and issuer aligned with its request. The synthetic seed data is fictional and must never be mixed with real student records. See `docs-issuer.md` for the issuer adapter and scenario list.

## Apply and seed

After Better Auth tables are migrated, create the three demo citizen accounts described in `docs-auth.md`, apply the app schema, then seed the issuer fixtures and account assignments:

```bash
npm run db:auth:migrate
npm run db:app:migrate
npm run db:seed:issuer
```

These commands use the server-only `DATABASE_URL` from `.env.local`. The app migration runner applies sorted SQL files once and wraps each file in a transaction. The synthetic issuer seed is safe to rerun.

