# Authentication and PostgreSQL setup

The project uses **Better Auth** for local email/password authentication and **Supabase PostgreSQL** for user, credential, and session persistence. The Next.js server checks Better Auth sessions before rendering protected wallet pages. Passwords are hashed by Better Auth using scrypt; the application does not store plaintext passwords or implement its own session format. OAuth was removed.

## Local setup

1. Create/configure the Supabase PostgreSQL database and copy its connection string into `DATABASE_URL` in `.env.local` (or `.env`). Use the connection string from the same Supabase project that the app should use. For Vercel, use the shared transaction pooler URL. This interview-demo build currently uses plain TCP for database connections.
2. Add a high-entropy secret of at least 32 characters as `BETTER_AUTH_SECRET` and set `BETTER_AUTH_URL=http://localhost:3000`.
3. Install packages with `npm install`.
4. Generate Better Auth's PostgreSQL tables with `npm run db:auth:migrate`, then apply application tables with `npm run db:app:migrate`. See `docs-data-model.md`.
5. Run `npm run dev` and create these three synthetic citizen accounts through `/signup`, each with a distinct password you keep private: `citizen.alpha@example.test`, `citizen.beta@example.test`, and `citizen.gamma@example.test`.
6. Run `npm run db:seed:issuer`. This seeds synthetic issuer records and binds each record to exactly one of those user IDs. The seeder fails and rolls back if all six ownership assignments cannot be created. Repeat it after creating the accounts if needed.
7. Sign in as the assigned demo user and open `/wallet`. A regular account that is not assigned a synthetic fixture can use the wallet but cannot retrieve the seeded fixture records.

An optional unrelated local account can still be created with `DEMO_ACCOUNT_NAME`, `DEMO_ACCOUNT_EMAIL`, and `DEMO_ACCOUNT_PASSWORD` via `npm run db:seed:demo-user`; that account receives no issuer fixtures unless an explicit owner assignment is added.

Open sign-up is intended for local demonstration only. Before public deployment, disable self-service registration or add an explicit controlled enrollment process and abuse protections. A successful sign-in alone does not prove entitlement to a school record. For this demo, entitlement is the explicit fixture-to-user assignment in PostgreSQL. It only separates synthetic demo accounts; it is not identity proof for real people.

## Troubleshooting: Better Auth schema mismatch

If the app reports missing `user`, `session`, `account`, or `verification` tables, it has reached a PostgreSQL database whose Better Auth schema has not been created (or `DATABASE_URL` points to the wrong project/database). From the project root, with the correct `DATABASE_URL` in `.env.local` or `.env`, run:

```bash
npm run db:auth:migrate
npm run db:app:migrate
npm run db:seed:issuer
```

The first command creates Better Auth's required PostgreSQL tables. The following commands add wallet tables and fictional issuer records. Restart the dev server after successful migrations. Do not create those Better Auth tables by hand. If the first migration cannot connect, correct `DATABASE_URL`, then rerun it.

Official references: [Better Auth installation and schema migration](https://better-auth.com/docs/installation), [PostgreSQL adapter](https://github.com/better-auth/better-auth/blob/main/docs/content/docs/adapters/postgresql.mdx), [email/password API and hashing](https://better-auth.com/docs/authentication/email-password), and [Next.js integration](https://github.com/better-auth/better-auth/blob/main/docs/content/docs/integrations/next.mdx).

