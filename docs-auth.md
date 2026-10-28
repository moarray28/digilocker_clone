# Authentication and PostgreSQL setup

The project uses **Better Auth** for local email/password authentication and **Supabase PostgreSQL** for user, credential, and session persistence. The Next.js server checks Better Auth sessions before rendering protected wallet pages. Passwords are hashed by Better Auth using scrypt; the application does not store plaintext passwords or implement its own session format. OAuth was removed.

## Local setup

1. Create/configure the Supabase PostgreSQL database and copy its connection string into `DATABASE_URL` in `.env.local` (or `.env`). Use the connection string from the same Supabase project that the app should use. For Vercel, use the shared transaction pooler URL. This interview-demo build currently uses plain TCP for database connections.
2. Add a high-entropy secret of at least 32 characters as `BETTER_AUTH_SECRET` and set `BETTER_AUTH_URL=http://localhost:3000`.
3. Install packages with `npm install`.
4. Generate Better Auth's PostgreSQL tables with `npm run db:auth:migrate`. Apply application tables and synthetic issuer fixtures with `npm run db:app:migrate` and `npm run db:seed:issuer`. See `docs-data-model.md`.
5. Optionally set `DEMO_ACCOUNT_NAME`, `DEMO_ACCOUNT_EMAIL`, and a unique `DEMO_ACCOUNT_PASSWORD` (at least 12 characters) in `.env.local`, then run `npm run db:seed:demo-user`. This creates one synthetic demo login through Better Auth, so the password is hashed with its normal password implementation. Never commit the local environment file or use the demo password elsewhere.
6. Run `npm run dev`, open `/signup` to create a local account or `/signin` to use an existing account, then open `/wallet`.

Open sign-up is intended for local demonstration only. Before public deployment, disable self-service registration or add an explicit controlled enrollment process and abuse protections. A successful sign-in only authenticates the account; it does not prove a person's entitlement to a school record. Issuer lookup must use the separate synthetic identity checks specified in the root README.

## Troubleshooting: Better Auth schema mismatch

If the app reports missing `user`, `session`, `account`, or `verification` tables, it has reached a PostgreSQL database whose Better Auth schema has not been created (or `DATABASE_URL` points to the wrong project/database). From the project root, with the correct `DATABASE_URL` in `.env.local` or `.env`, run:

```bash
npm run db:auth:migrate
npm run db:app:migrate
npm run db:seed:issuer
```

The first command creates Better Auth's required PostgreSQL tables. The following commands add wallet tables and fictional issuer records. Restart the dev server after successful migrations. Do not create those Better Auth tables by hand. If the first migration cannot connect, correct `DATABASE_URL`, then rerun it.

Official references: [Better Auth installation and schema migration](https://better-auth.com/docs/installation), [PostgreSQL adapter](https://github.com/better-auth/better-auth/blob/main/docs/content/docs/adapters/postgresql.mdx), [email/password API and hashing](https://better-auth.com/docs/authentication/email-password), and [Next.js integration](https://github.com/better-auth/better-auth/blob/main/docs/content/docs/integrations/next.mdx).

