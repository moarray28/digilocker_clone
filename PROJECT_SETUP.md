# Certificate Wallet

A responsive interview-assignment MVP inspired by a document wallet. This is an independent demonstration and is not an official DigiLocker product.

## Local setup

Prerequisite: Node.js 20.9 or newer and npm.

```bash
npm install
npm run dev
```

Open http://localhost:3000. For production, use `npm run build` and `npm start`.

## Current milestone

The project has a responsive wallet UI, Better Auth email/password sign-in backed by Supabase PostgreSQL, synthetic issuer fixtures, and a connected certificate retrieval path. The signed-in wallet calls the simulated issuer, verifies PDF integrity and the trusted Ed25519 manifest signature separately, checks current status, and only stores active certificates in the private Supabase Storage bucket. PDF reads are owner-scoped and recheck current status and the stored-file digest. All certificate data is fictional. Configure `.env.local` and install dependencies before running the app. See `docs-auth.md`, `docs-data-model.md`, and `docs-issuer.md`.

## Local readiness and database setup

1. Copy `.env.example` to `.env.local` (or use the existing root `.env`) and fill in the Supabase PostgreSQL connection string, Better Auth secret, Supabase URL, Supabase Secret key, and issuer test key ID. In the dashboard, get the key at **Project Settings → API Keys → Secret keys**. Paste the value beginning with `sb_secret_` into `SUPABASE_SECRET_KEY`; do not use the publishable key. The app also supports the legacy `service_role` JWT in `SUPABASE_SERVICE_ROLE_KEY`. Keep local env files and `.secrets/` private. The default Better Auth URL, bucket name, key paths, and issuer failure mode can be omitted.
2. In **Database Settings → SSL Configuration**, download the project's root certificate into `.secrets/prod-ca-2021.crt`. Add `sslmode=verify-full&sslrootcert=./.secrets/prod-ca-2021.crt` to `DATABASE_URL`. The connection string carries the TLS mode and CA path together, so no separate certificate environment variable is needed; the app verifies the server certificate and hostname.
3. Run `npm run issuer:keys:generate` to create a local Ed25519 issuer key pair, then run `npm run setup:check`. The preflight reports missing setting names only; it never prints secret values. Use `npm run supabase:check` to make read-only connectivity checks for the private Storage bucket and PostgreSQL TLS connection.
4. Run `npm run supabase:bucket:create` to create `certificate-files` as a private bucket with PDF-only uploads and a 10 MB limit. If that bucket already exists as public, the script leaves it unchanged and asks you to fix it in Supabase Storage settings. Do not expose the server key to the browser.
5. Run `npm run db:auth:migrate`, `npm run db:app:migrate`, and `npm run db:seed:issuer`. Optionally seed a local demo account as documented in `docs-auth.md`.
6. Run `npm run dev`, create/sign in to a demo account, open `/wallet`, and request the default synthetic fixture.

The app does not provision a Supabase project or bucket automatically. The database schema and synthetic issuer seed are applied to the configured project. Before the retrieval flow can store PDFs, download/configure the database CA certificate, create the private `certificate-files` Storage bucket (or set `SUPABASE_STORAGE_BUCKET` to its private bucket name), add the Supabase Secret key, and confirm with `npm run setup:check` and `npm run supabase:check`.

If `/signup` returns a database TLS error, confirm the root certificate is saved at the path named by `sslrootcert` in `DATABASE_URL`, then restart the dev server. Keep `sslmode=verify-full` enabled.

If Better Auth reports missing `user`, `session`, `account`, or `verification` tables, run the three database commands above against the same Supabase project referenced by `DATABASE_URL`, then restart the app. More details are in `docs-auth.md`.

## Next milestones

Follow the root README for the fixed security boundaries and staged implementation plan. Keep issuer signing keys and privileged storage credentials server-side.


