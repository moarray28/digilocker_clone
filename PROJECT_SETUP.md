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

1. Copy `.env.example` to `.env.local` (or use the existing root `.env`) and fill in the Supabase PostgreSQL connection string, Better Auth secret, and Supabase URL. In the dashboard, get the Storage key at **Project Settings → API Keys → Secret keys**. Paste the value beginning with `sb_secret_` into `SUPABASE_SECRET_KEY`; do not use the publishable key. The app also supports the legacy `service_role` JWT in `SUPABASE_SERVICE_ROLE_KEY`. Keep local env files private. The synthetic issuer needs no signing-key files or issuer-key environment variables.
2. Set `DATABASE_URL` to the Supabase PostgreSQL connection string. For Vercel, use the shared transaction pooler URL. The current interview demo uses plain TCP for database connections.
3. Run `npm run setup:check`. The preflight reports missing setting names only; it never prints secret values. Use `npm run supabase:check` to make read-only connectivity checks for the private Storage bucket and PostgreSQL.
4. Run `npm run supabase:bucket:create` to create `certificate-files` as a private bucket with PDF-only uploads and a 10 MB limit. If that bucket already exists as public, the script leaves it unchanged and asks you to fix it in Supabase Storage settings. Do not expose the server key to the browser.
5. Run `npm run db:auth:migrate` and `npm run db:app:migrate`.
6. Run `npm run dev`, create the three demo accounts listed in `docs-auth.md` with distinct private passwords, then run `npm run db:seed:issuer` to seed and assign each synthetic fixture.
7. Sign in with an assigned account, open `/wallet`, and request only the fixture assigned to that account.

The app does not provision a Supabase project or bucket automatically. The database schema and synthetic issuer seed are applied to the configured project. Before the retrieval flow can store PDFs, create the private `certificate-files` Storage bucket (or set `SUPABASE_STORAGE_BUCKET` to its private bucket name), add the Supabase Secret key, and confirm with `npm run setup:check` and `npm run supabase:check`.

If `/signup` returns a database connection error, check that `DATABASE_URL` uses the correct Supabase host and pooler mode, then restart the dev server.

If Better Auth reports missing `user`, `session`, `account`, or `verification` tables, run the three database commands above against the same Supabase project referenced by `DATABASE_URL`, then restart the app. More details are in `docs-auth.md`.

## Next milestones

Follow the root README for the fixed security boundaries and staged implementation plan. Keep issuer signing keys and privileged storage credentials server-side.


