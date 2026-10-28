# DigiLocker-Inspired Certificate Wallet MVP

> **Project status:** Interview-assignment MVP. This is an independent demonstration project inspired by the user experience and high-level document-wallet workflow of DigiLocker. It is **not** an official DigiLocker product, integration, or replacement, and must not claim government recognition or legal equivalence.

## 1. Project goal

Build a responsive web application that lets an authenticated citizen retrieve a **previously issued school certificate** from a simulated school issuer, keep a digital copy in a personal document wallet, and display the document on a phone or laptop.

The first version focuses on one complete scenario:

1. A citizen signs in.
2. The citizen selects the simulated school issuer and enters the minimum lookup details required to find an existing record.
3. The backend asks the simulated issuer adapter to locate the record.
4. The issuer simulation returns a certificate artifact and issuer evidence.
5. The backend verifies the issuer signature and records the verification outcome.
6. The document is stored securely and linked to the requesting citizen's wallet.
7. The citizen opens the wallet and displays the certificate.

The issuer's records and signing capability are simulated with **synthetic test data**. Do not use real student records or real personal documents.

## 2. Product and security decisions

These decisions are fixed for the MVP. Do not silently change them; if implementation constraints require a change, document the trade-off in `log.txt` and ask the user before changing a security boundary.

### 2.1 Retrieval, not application

This product retrieves an **already-issued certificate**. It does not apply for a new certificate, alter marks, create authoritative school records, or replace the issuer's original record.

The displayed PDF is a convenient digital copy. Do not promise that displaying a screen is legally accepted in every context. Legal acceptance depends on the document type, applicable rules, and verifier requirements.

### 2.2 Authentication and authorization

- **Next.js owns application authentication and authorization logic.**
- Supabase provides **PostgreSQL database and private file storage**. Do not use Supabase Auth for application sign-in in this MVP; Next.js handles the authentication integration and server-side authorization logic.
- Use a well-maintained authentication library/provider compatible with Next.js, selected and documented before implementation. Do not invent an authentication system or store plaintext passwords.
- Enforce access checks on the server for every document read, download, request, and mutation. Hiding UI controls is not authorization.
- Never trust a user ID, document ID, issuer ID, or role supplied by the browser without validating it against the authenticated server-side session and application records.
- A person knowing a student's name, seat number, exam year, and education level is **not sufficient proof of identity**. For this simulated MVP, use seeded synthetic identities and an explicit test-only identity verification approach. Clearly label it as a demo; do not imply the lookup fields alone are secure identity verification.
- Do not expose signing private keys, encryption keys, authentication secrets, storage service credentials, or other secrets in client-side code, logs, source control, or error messages.

### 2.3 What “validation” means

Keep these three outcomes separate in code, persistence, and UI. Do not collapse them into one vague `isValid` flag.

1. **Integrity validation:** Calculate a cryptographic digest (SHA-256) of the accepted PDF bytes and store it with the document metadata. When retrieving the stored file, recalculate the digest and compare it with the recorded digest. This detects unexpected changes to stored bytes; by itself it does not prove who issued the document.
2. **Issuer signature validation:** The simulated issuer signs the certificate or a well-defined certificate manifest with its private signing key. The backend verifies the signature using the issuer's preconfigured trusted test public key/certificate and the documented verification policy. Never trust a public key just because it arrived alongside a document. Never put the private key in the browser or Supabase Storage. The UI must not display “verified” unless signature verification has succeeded.
3. **Current-status validation:** Before granting access to display the certificate, ask the issuer adapter whether the certificate remains current and has not been revoked or superseded. In this MVP, the issuer adapter is local/simulated, so the status check is performed against the simulated issuer's authoritative test records.

**Required offline behavior:** If the issuer cannot be contacted or its status check fails, block certificate display and download until the issuer responds successfully. Show a clear message such as “Unable to confirm certificate status. Try again later.” Do not present a cached “valid” status as current. The issuer simulation can be available locally during the demo; implement a deliberate failure mode so this behavior can be tested.

The issuer's signature establishes authenticity and integrity under the configured trust policy; the current-status check is a separate, time-dependent assertion. A successful check is not a guarantee that every external institution will accept the certificate.

### 2.4 Keys, encryption, and storage

- Store certificate files in a **private** Supabase Storage bucket. Never make the bucket public.
- Use server-side, short-lived access or authenticated download routes. If signed URLs are used, keep their lifetime short and issue them only after authorization and current-status checks. Do not put long-lived public links in the wallet.
- Supabase Storage's platform encryption is not a substitute for application-level access control. Document the chosen storage protections and threat model.
- For this MVP, use TLS for network traffic and private-bucket access controls. Add application-level envelope encryption only if it can be implemented with a clear key-management design and tests; do not add homemade cryptography. If envelope encryption is implemented, encrypt each file with a data-encryption key (DEK), protect the DEK with a separately managed key-encryption key (KEK), and keep key material out of the database, browser, repository, and logs.
- Do not claim protection against a fully compromised authorized application server. Keep the threat model explicit.
- Do not re-sign the issuer's certificate with a platform key. The platform may record its own verification receipt/metadata separately, but must clearly state what that receipt attests to.

### 2.5 Supabase boundary

Supabase provides **both PostgreSQL and private file/object storage** in this MVP. Use Supabase PostgreSQL for issuer registry/configuration, synthetic issuer records, certificate requests, document metadata, verification evidence, and audit events. Use Supabase Storage for the actual PDF objects. This is the only application database required for the MVP; do not introduce SQLite or another database unless the user explicitly approves the change.

Next.js remains responsible for the authentication integration, server-side session validation, authorization decisions, and business logic. Supabase Auth is not part of the planned sign-in flow. Use a maintained Next.js-compatible authentication library/provider and store only the minimum identity reference needed to associate records with the authenticated user. Never store plaintext passwords or invent a custom session scheme.

Store only the minimum metadata needed to locate and validate a file. Never place sensitive lookup values, certificate contents, credentials, access tokens, private keys, or raw session data in object paths or logs. Enforce ownership in server-side code and, where appropriate, PostgreSQL constraints/RLS policies. Do not expose the Supabase service-role key to the browser; it bypasses RLS. If server-side code uses that key, it must explicitly enforce ownership and authorization before every query and storage operation.

### 2.6 Simulated issuer

Create a clear server-side issuer adapter boundary, such as `IssuerAdapter`, so a real issuer API could replace the simulation later without rewriting the citizen workflow. The simulation should:

- Own a small, seeded set of synthetic school records.
- Resolve a request using the defined test lookup rules.
- Return a certificate PDF or create a deterministic test PDF.
- Sign the certificate or manifest using a dedicated test-only private key.
- Report status (`active`, `revoked`, or `superseded`) from its simulated authoritative records.
- Support test scenarios for no match, revoked certificate, superseded certificate, unavailable issuer, and signature failure.
- Never describe its synthetic data, test key, or result as government-issued or production-trusted.

Keep issuer lookup logic and issuer signing private key separate from citizen-facing UI code. Store test private keys in local environment configuration or a safe development secret mechanism; never commit the private key.

## 3. MVP scope

### Included

- Responsive citizen-facing wallet UI.
- Next.js application with server-side authentication and authorization.
- Simulated school issuer with synthetic data.
- Retrieval of an existing certificate using test lookup attributes.
- Issuer signature verification, PDF digest verification, and current-status check.
- Private Supabase Storage bucket for certificate files.
- Secure, authorized document viewing/display and download.
- Explicit request and verification states.
- Useful, non-sensitive operational logs and audit events.
- Tests for authorization, integrity, signatures, status checks, and failure cases.
- A `log.txt` coding-agent activity log following Section 10.

### Not included in the first version

- Real DigiLocker or API Setu integration.
- Real school, government, or identity-provider integration.
- Real citizen/student data.
- Employer/third-party sharing, consent-based sharing, QR verification by external parties, or public verification pages.
- Certificate issuance, editing, marks changes, or correction workflows.
- A claim that a displayed screen is legally accepted everywhere.
- Production-grade high availability, legal compliance certification, or a claim of 100% security.

Keep the first version narrow. Add later features only after the retrieval and validation path is demonstrably correct.

## 4. Suggested technology choices

Choose stable, mutually compatible versions at implementation time and record them in `package.json` and the README. Do not blindly install deprecated packages or copy unverified version numbers.

- **Web application:** Next.js App Router, TypeScript, React.
- **Styling:** Tailwind CSS or a consistent CSS-module design system. Avoid mixing multiple styling systems without a reason.
- **Authentication:** A maintained Next.js-compatible auth library/provider. Evaluate session security, server-side verification, account recovery, and local-development support before choosing.
- **Application database:** Supabase PostgreSQL for application records and metadata; Supabase Storage for PDF objects. Do not add another database for this MVP.
- **File storage:** Supabase Storage private bucket.
- **PDF creation and viewing:** A maintained PDF-generation library for synthetic test certificates and a browser PDF viewer or native PDF display where supported.
- **Cryptography:** Well-maintained platform/library cryptographic APIs for SHA-256 and digital signatures. Do not invent algorithms or implement cryptographic primitives yourself.
- **Testing:** Unit tests for pure validation logic, integration tests for the issuer/storage boundary, and end-to-end tests for citizen workflows and access control.
- **Lint/type checks:** ESLint and TypeScript checks; format consistently.

Keep the issuer simulation behind a typed interface. Avoid microservices, queues, or extra infrastructure unless a demonstrated requirement justifies them.

## 5. UI and interaction requirements

The interface should be **inspired by DigiLocker’s clean document-wallet experience**, not copy its logo, official branding, or claim affiliation. Use a white background with restrained purplish secondary colors.

### Visual direction

- White page and card backgrounds.
- Deep purple for primary actions and active navigation.
- Soft lavender for subtle highlights, selected states, and badges.
- Neutral grey for borders, supporting text, and disabled states.
- Clear typography, generous spacing, modest corner radii, and light shadows only where useful.
- Mobile-first responsive layout, suitable for showing a certificate on a phone screen.
- Accessible contrast, visible keyboard focus, semantic HTML, and readable error messages.
- Do not rely on color alone to communicate document or verification state.

### Main screens

1. **Sign in:** Minimal form, validation, loading, and safe error states.
2. **Wallet/dashboard:** Header, simple navigation, document count, and a clear “Get a document” action. Show empty state for a new user.
3. **Get a document:** Select the simulated school issuer and enter the required synthetic lookup attributes. Explain that the demo uses test data.
4. **Request progress/result:** Show the current state and actionable failure message without exposing whether sensitive records exist to an unauthorized requester.
5. **Document details:** Certificate title, issuer name, issue/record metadata where available, verification outcomes, and last successful status-check time.
6. **Document display:** Responsive certificate preview suitable for a phone/laptop screen, plus an authorized download action.
7. **Settings/sign out:** Minimal account controls and secure sign-out.

### Verification UI

Display separate, plain-language states:

- **Integrity:** “File integrity confirmed” / “File integrity check failed.”
- **Issuer signature:** “Issuer signature verified” / “Signature could not be verified.”
- **Current status:** “Issuer confirms current status” / “Revoked” / “Superseded” / “Status unavailable.”
- Do not allow a document to be displayed if the current-status check is unavailable or fails.
- Do not label a certificate “verified” if any required verification step failed.
- Show when the status was checked. Never imply that a past status check is a live check.

## 6. Request lifecycle and state model

Use explicit, persisted request states rather than relying on UI-only booleans. A reasonable starting state model is:

`created → authenticating_request → querying_issuer → certificate_received → verifying_signature → checking_current_status → storing_document → completed`

Terminal or recoverable failure states should include at least:

- `no_match`
- `issuer_unavailable`
- `signature_invalid`
- `status_check_failed`
- `certificate_revoked`
- `certificate_superseded`
- `storage_failed`
- `internal_error`

Adapt names if needed, but document the transitions and preserve the distinction between a failed validation and a technical failure. Do not reveal sensitive record existence to a user who has not passed the demo's identity/authorization checks.

### Required invariants

- Only the authenticated owner can access their wallet's documents.
- Every file is linked to a known request and a registered simulated issuer.
- A certificate cannot reach `completed` unless the issuer signature verifies, the file digest is recorded successfully, storage succeeds, and the current-status check succeeds.
- A failed status check blocks viewing and download, even if the file is already stored.
- A stored file must pass digest verification before it is returned.
- A retry must not create duplicate wallet documents for the same idempotent request.
- Never overwrite a prior certificate silently. A reissued/superseding certificate must be represented as a new version or a separately linked record.
- Browser-provided identifiers are not proof of ownership.
- Failure messages must not leak secrets, stack traces, private keys, or sensitive certificate data.

## 7. Architecture and request flow

Keep the architecture modular but simple:

- **Browser/UI:** Displays screens and submits user actions. It is not trusted to enforce authorization or verification.
- **Next.js server layer:** Authenticates the session, validates inputs, checks ownership, orchestrates the request, performs signature and digest checks, checks issuer status, and authorizes storage access.
- **Application persistence:** Stores users/session references as required by the selected auth provider, request state, document metadata, verification evidence, issuer configuration, and audit events.
- **Issuer adapter:** Simulates the authoritative school system and owns its test records, signing behavior, and status responses.
- **Supabase Storage:** Stores private PDF objects. It does not decide whether the citizen is authorized or whether the issuer currently considers a certificate valid.

### Happy path

1. Citizen signs in.
2. Citizen submits a certificate retrieval request.
3. Next.js validates the session, request input, and test identity-verification step.
4. Server creates an idempotent request record.
5. Issuer adapter searches synthetic records.
6. Issuer adapter returns the certificate bytes, signature/manifest evidence, issuer identifier, and stable certificate reference.
7. Server checks that the issuer is configured as trusted and verifies the signature.
8. Server computes SHA-256 and records the accepted digest.
9. Server asks the issuer adapter for the certificate's current status.
10. If the status is active, server uploads the PDF to the private Supabase bucket and persists metadata.
11. Server marks the request completed.
12. Citizen opens the wallet. The server reauthorizes access, rechecks issuer status, fetches the private object, verifies its digest, and returns it for display/download.

### Failure and recovery

Think through partial failures explicitly. For example, storage may succeed while the metadata update fails, or an HTTP retry may repeat a request. Use idempotency keys, safe retries, cleanup/reconciliation, and persisted state transitions as appropriate. Do not mark a request complete until all required steps succeed. Avoid holding database transactions open while calling external systems. The simulated issuer should expose failure controls for tests.

## 8. Data model to design before coding

Define the exact schema and ownership rules in the implementation plan. At minimum, consider these entities:

- **User/account reference:** Identifier from the selected auth system; do not store passwords yourself.
- **Issuer:** Stable issuer ID, display name, trusted public key/certificate reference, key identifier/version, and active/inactive state.
- **Certificate request:** Request ID, owner ID, issuer ID, state, idempotency key, safe error code, timestamps.
- **Wallet document metadata:** Document ID, owner ID, issuer ID, issuer's stable certificate reference, storage object key, SHA-256 digest, signature-verification result, status result, version/reissue relationship, timestamps.
- **Audit event:** Actor reference, action, target identifier, outcome, timestamp, and minimal safe metadata.

Do not store the PDF itself in the application database. Keep it in private object storage. Do not use a storage object key as an authorization mechanism. Avoid logging raw lookup fields or certificate contents.

The initial PostgreSQL implementation is documented in `docs-data-model.md`. It defines ownership foreign keys, unique idempotency keys, one document per request, issuer/reference uniqueness, request/document owner consistency, version links, safe audit fields, and status/digest checks. Future schema changes should preserve these constraints and pair them with server-side authorization.

## 9. Next.js setup

Use the current stable Next.js setup flow and App Router. Commands may change over time, so verify them against the official Next.js documentation before execution.

A typical starting sequence:

```bash
npx create-next-app@latest certificate-wallet
cd certificate-wallet
npm run dev
```

Choose TypeScript, App Router, ESLint, and the styling option selected for the project. Use the `src/` directory if desired and keep the decision consistent. Do not create a second nested app accidentally.

Create a maintainable structure similar to:

```text
certificate-wallet/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   ├── (wallet)/
│   │   ├── api/
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/
│   │   ├── wallet/
│   │   └── verification/
│   ├── lib/
│   │   ├── auth/
│   │   ├── authorization/
│   │   ├── issuer/
│   │   ├── crypto/
│   │   ├── storage/
│   │   ├── persistence/
│   │   ├── validation/
│   │   └── logging/
│   └── types/
├── tests/
├── scripts/
├── docs/
├── .env.example
├── .gitignore
├── log.txt
├── package.json
└── README.md
```

This is a suggested structure, not a requirement to create empty folders. Keep cryptography, authorization, issuer simulation, storage access, and persistence in server-only modules. Use server-only guards where appropriate to prevent accidental client imports.

### Environment configuration

Create `.env.local` for local secrets and commit only `.env.example` with placeholder names and descriptions. Never put real credentials in `.env.example`.

Example variables (adapt names to the selected libraries):

```dotenv
# Better Auth email/password — server only
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000

# Supabase PostgreSQL connection string — server only; use TLS
DATABASE_URL=
# Add sslmode=verify-full&sslrootcert=./.secrets/prod-ca-2021.crt to DATABASE_URL

# Optional synthetic demo account seed — keep password only in a local env file
DEMO_ACCOUNT_NAME=Demo Citizen
DEMO_ACCOUNT_EMAIL=demo@example.test
DEMO_ACCOUNT_PASSWORD=

# Supabase Storage — server-only Secret key; never prefix this with NEXT_PUBLIC_
SUPABASE_URL=
# Preferred key from Project Settings > API Keys > Secret keys
SUPABASE_SECRET_KEY=
SUPABASE_STORAGE_BUCKET=certificate-files

# Simulated issuer — local/test only; private key path is ignored by git
ISSUER_TEST_KEY_ID=demo-school-key-v1
ISSUER_TEST_PRIVATE_KEY_PATH=./.secrets/issuer-test-private.pem
ISSUER_TRUSTED_PUBLIC_KEY_PATH=./.secrets/issuer-test-public.pem
ISSUER_SIMULATED_FAILURE_MODE=none
```

These are illustrative names, not guaranteed package-specific variables. Confirm the exact variables required by the chosen auth/storage libraries. If a key is loaded from a file, ensure the file is excluded from version control. Never use the Supabase service-role key in any variable prefixed with `NEXT_PUBLIC_`.

Add `.env.local`, local databases, private keys, generated PDFs containing test identity data, and other secrets to `.gitignore`. Use only synthetic data in committed fixtures.

Run `npm run setup:check` after configuring the local environment. It validates required setting presence and safe formats, requires certificate-verified TLS for hosted PostgreSQL, and confirms the local issuer key pair matches without printing secret values. For local development, download the Supabase database root certificate from **Database Settings → SSL Configuration**, save it under the ignored `.secrets/` directory, and add its path as `sslrootcert=./.secrets/prod-ca-2021.crt` in `DATABASE_URL` alongside `sslmode=verify-full`. For Vercel, set `DATABASE_SSL_CA` to the full PEM text of that same public root CA in Project Settings → Environment Variables; keep it server-only. This avoids relying on a local certificate file in the deployment. Run `npm run supabase:bucket:create` to create the PDF-only private bucket, then run `npm run supabase:check` for read-only PostgreSQL and bucket connectivity checks; these commands never print keys, database rows, or response bodies.

For Supabase Storage, copy the **Secret key** from **Project Settings → API Keys → Secret keys** into `SUPABASE_SECRET_KEY` in `.env.local`. It begins with `sb_secret_`; do not use the publishable key. The legacy `service_role` key is supported in `SUPABASE_SERVICE_ROLE_KEY`, but new projects should use the Secret key. This API key is only for server-side Storage requests; PostgreSQL migrations and Better Auth use `DATABASE_URL`. Never paste either secret key into chat or expose it to the browser. See [Supabase API key guidance](https://supabase.com/docs/guides/getting-started/api-keys).

If signup returns a database TLS error, confirm the root certificate is saved at the path specified by `sslrootcert` in `DATABASE_URL`, then restart `npm run dev`. The app requires the certificate to verify the hosted database connection; do not disable certificate verification.

### Vercel deployment

The app uses Node.js server routes and can be deployed as a Next.js project on Vercel. Import the GitHub repository with the default Next.js build settings, then configure these server-side variables in Vercel for Preview and Production: `DATABASE_URL` (Supabase connection string with `sslmode=verify-full`), `DATABASE_SSL_CA` (the complete Supabase root CA PEM text), `BETTER_AUTH_SECRET` (a fresh random secret of at least 32 characters), `BETTER_AUTH_URL` (the deployed origin, such as `https://your-project.vercel.app`), `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, and `ISSUER_TEST_KEY_ID`. For this synthetic demo, also configure `ISSUER_TEST_PRIVATE_KEY` and `ISSUER_TRUSTED_PUBLIC_KEY` with the PEM contents of the local issuer key pair; local key-file paths remain available for development. Never use `NEXT_PUBLIC_` for any of these values. Apply auth/app migrations and issuer seed to the production Supabase project before deploying. After setting or changing variables, redeploy so the deployment receives them. Vercel's Node.js functions support environment variables for runtime connection and certificate configuration ([Vercel environment variables](https://vercel.com/docs/environment-variables)); see [Next.js deployment options](https://nextjs.org/docs/app/getting-started/deploying).

## 10. Supabase PostgreSQL and Storage setup

Use the official Supabase dashboard/documentation to create a project, configure PostgreSQL, and configure Storage.

1. Create a Supabase project for the MVP.
2. Use the project PostgreSQL database for the application tables listed in Section 8. Add version-controlled SQL migrations (or another documented migration mechanism) so the schema can be recreated.
3. Open Storage and create a bucket named `certificate-files` (or the name configured in the environment).
4. Keep the bucket **private**. Do not enable public access.
5. Configure storage policies and server-side access according to the chosen approach. Verify that anonymous/browser clients cannot list or download certificate objects.
6. Keep the service-role credential exclusively on the Next.js server. It bypasses normal row-level security protections and must never be exposed to the browser.
7. Use unpredictable object identifiers, but do not mistake unguessable IDs for access control.
8. Implement server-side database and storage module that checks the current user's ownership and all required validation outcomes before reading an object.
9. Test unauthorized access, expired signed URLs (if used), missing objects, and storage failures.

The current implementation calls Supabase Storage's server-side object API directly from `lib/storage/private-bucket.ts`. It requires `SUPABASE_URL`, a private `certificate-files` bucket (or configured bucket name), and either `SUPABASE_SECRET_KEY` (preferred) or the legacy `SUPABASE_SERVICE_ROLE_KEY`. In the Supabase dashboard, open **Project Settings → API Keys → Secret keys**, create/copy a secret key, and put its complete value beginning with `sb_secret_` in `SUPABASE_SECRET_KEY` in the ignored `.env.local`. Do not use the publishable key. The app sends new secret keys on the `apikey` header only; the legacy JWT service-role key is supported separately. Both are powerful backend credentials that bypass RLS and must never reach browser code, source control, or chat. Document API routes require a Better Auth session, constrain metadata queries by the session user ID, check the issuer's current status before each PDF response, and compare the downloaded object's SHA-256 digest before returning it. If Storage upload succeeds but the PostgreSQL metadata transaction fails, the route attempts to remove the unreferenced object; if the database state is uncertain, it preserves the object for manual reconciliation.

Use Supabase PostgreSQL for application tables and Supabase Storage for certificate PDFs. Do not add Supabase Auth to the planned sign-in flow, and do not introduce a second database. Access PostgreSQL through a suitable server-side library or the Supabase server-side client. Choose one access approach, document it, and never expose privileged credentials to browser code.

## 11. Coding-agent instructions and `log.txt`

This repository may be worked on by Codex, Claude Code, or another coding agent. Agents must follow this README, inspect existing code before editing, and prefer small, testable changes.

### Mandatory agent workflow

Before making changes:

1. Read this README and any relevant files.
2. Inspect the current Git status and project structure.
3. Identify the requested change, the relevant files, likely risks, and a concise plan.
4. Record a log entry in `log.txt` before implementation, then update it after implementation and validation.
5. Make the smallest safe change that satisfies the request. Do not rewrite unrelated code or weaken a security control to make a test pass.
6. Run relevant tests, linting, type checks, and/or build commands. Record exactly which commands ran and whether they passed.
7. Review the diff for secrets, accidental data exposure, unrelated edits, and regressions.
8. Summarize what changed, what was tested, results, and known limitations to the user.

If the user asks for a design/security boundary change, explain the impact and ask for confirmation before changing the fixed decisions in Section 2.

### `log.txt` requirements

Create and maintain a repository-root file named `log.txt`. It is a concise **coding-agent activity log**, not a transcript of the entire conversation.

For each task, record:

- Timestamp with timezone (ISO 8601).
- Coding agent type (e.g., Codex, Claude Code, other/unknown).
- Model name only if the agent/user explicitly supplies it or it is reliably available; otherwise write `not provided`.
- A short, sanitized summary of the user's prompt or requested task.
- The agent's proposed approach or recommendation.
- What the agent actually changed or created.
- Tests/commands run and their results.
- Any unresolved issues or next steps.

Example entry:

```text
---
Timestamp: 2026-10-27T18:30:00+05:30
Agent type: Codex
Model: gpt-6-luna
User request (sanitized): Add a certificate status check before document display.
Agent recommendation: Keep current-status validation separate from signature and file-integrity validation.
Changes made: Added issuer status adapter check and UI status states.
Validation: npm run lint (passed); npm run typecheck (passed); status-check tests (passed).
Open issues: Real issuer connectivity is not implemented; only the local test adapter is available. The retrieval and private storage code paths are wired but remain unverified against a configured Supabase project. Storage policies, runtime browser checks, automated security tests, and production build review remain before the MVP definition of done.
---
```

### Log privacy and integrity

**Never log:**

- Passwords, authentication tokens, cookies, session identifiers, API keys, service-role keys, or connection strings.
- Private keys, encryption keys, signing secrets, or raw environment-file values.
- Student/citizen names, seat numbers, dates of birth, addresses, real identity numbers, certificate contents, or raw lookup inputs.
- Full unredacted prompts if they contain secrets, personal data, proprietary material, or other sensitive content.
- Raw request/response bodies, stack traces containing secrets, or complete environment dumps.

Store only a short sanitized prompt summary. If a request contains sensitive content, describe the task category rather than copying the text. Never add hidden chain-of-thought or private internal reasoning; record a concise recommendation/decision summary instead.

Do not claim a command passed unless it was actually run and its result observed. If no tests were run, explicitly record `not run` and why. If a task is interrupted, add an `incomplete` entry. Do not rewrite or delete previous entries to make results appear better; append corrections with timestamps. Do not include the log file in public demos if it contains proprietary or sensitive information. The log itself must never become a place to store secrets.

## 12. Testing and acceptance criteria

Do not consider the MVP complete because the happy path works once. Implement tests around security boundaries and failure modes.

### Authentication and authorization

- Unauthenticated users cannot access wallet pages, request APIs, document metadata, or file retrieval routes.
- User A cannot read, download, or modify User B's document by changing an ID in a URL or request body.
- Browser code cannot access the Supabase service-role credential or issuer signing private key.
- Signing out invalidates the session according to the chosen authentication provider's behavior.

### Issuer and cryptography

- A matching synthetic record can be retrieved.
- A missing or invalid match fails safely.
- A valid issuer signature passes verification.
- A modified PDF or manifest fails signature and/or digest verification as applicable.
- An untrusted issuer key is rejected.
- A revoked or superseded certificate is not displayed or downloaded.
- An unavailable issuer blocks access and produces a retryable, non-sensitive error.
- A stored PDF whose bytes differ from the recorded SHA-256 digest is not returned.

### Storage and recovery

- The bucket is private and unauthenticated direct access fails.
- A user can access only their own authorized document through the server.
- Storage upload failure does not create a completed request.
- If upload succeeds but metadata persistence fails, retry/reconciliation does not create duplicate wallet records.
- Repeated requests with the same idempotency key do not create duplicate results.
- Missing objects and expired signed URLs (if applicable) are handled safely.

### UI and operations

- UI works at mobile and desktop widths.
- Loading, empty, success, no-match, issuer-unavailable, invalid-signature, revoked, superseded, and storage-error states are distinguishable.
- Keyboard focus and form labels are accessible.
- `log.txt` contains sanitized activity records and no secrets or personal certificate data.
- Lint, type checks, tests, and production build pass, or any known failure is explicitly documented.

## 13. Suggested implementation milestones

Work in small stages. Do not start by implementing every feature at once.

**Milestone 1 — Repository and UI skeleton**
- Initialize Next.js, TypeScript, styling, linting, and project structure.
- Build responsive sign-in, wallet empty state, request form, and document details mock screens using synthetic content only.
- Establish the white/purple visual system.

**Milestone 2 — Authentication and authorization**
- Select and configure the auth provider.
- Add server-side session verification and protected routes.
- Add tests proving one user cannot access another user's resources.

**Milestone 3 — Application persistence and request state**
- Design Supabase PostgreSQL tables, ownership constraints, indexes, and access policies for issuer, request, document metadata, verification, and audit records.
- Define issuer, request, document metadata, and audit models.
- Implement state transitions, uniqueness/idempotency, and safe error codes.

**Milestone 4 — Simulated issuer**
- Seed synthetic school records.
- Implement the typed issuer adapter, test certificate creation/retrieval, issuer signing, current-status responses, and controllable failure scenarios.
- Keep test private keys out of source control.

**Milestone 5 — Verification**
- Implement signature verification against a preconfigured trusted test public key/certificate.
- Implement SHA-256 digest recording and rechecking.
- Implement current-status validation and the strict issuer-unavailable behavior.
- Add tests for tampering, untrusted keys, revoked/superseded records, and unavailable issuer.

**Milestone 6 — Private Supabase Storage**
- Create and validate the private bucket.
- Implement server-only upload/read modules and ownership checks.
- Test partial failures, duplicate retries, unauthorized access, and missing objects.

**Milestone 7 — End-to-end wallet**
- Implemented the authenticated wallet request form, synthetic issuer lookup, separate signature/digest checks, current-status check, PostgreSQL lifecycle, and private Supabase Storage upload.
- Implemented owner-scoped document list and PDF routes with fresh status and stored-file digest checks.
- Pending Supabase-backed end-to-end verification and browser checks at phone and desktop sizes.

**Milestone 8 — Hardening and handoff**
- Added independent unit tests for synthetic lookup validation, digest/signature separation, modified manifests, untrusted issuer IDs, untrusted key IDs, and wrong signing keys. Run these with `npm test`.
- `npm test`, `npm run lint`, and `npm run typecheck` have passed in the current workspace.
- Better Auth and wallet schema migrations ran successfully, and the five synthetic issuer scenarios were seeded. The Supabase Storage API check succeeds; `certificate-files` was created private with PDF-only uploads and a 10 MB limit.
- Signup/login work against Supabase. `npm run supabase:check` confirms verified PostgreSQL TLS and the private Storage bucket.
- `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build` pass. The production build uses Next.js's supported Webpack builder for reliable local and hosted builds.
- Remaining interview-demo checks: retrieve a synthetic fixture, try unavailable/revoked/superseded/signature-failure cases, and verify owner isolation in two accounts. The local Turbopack build hit a sandbox worker-start failure; the configured Webpack production build completed successfully.
- Review environment handling, repository history, logs, access policies, and error responses.
- Update this README with actual implementation details, exact setup commands, known limitations, and test results.
- Ensure `log.txt` is current and sanitized.

## 14. Definition of done

The MVP is ready for an interview demonstration only when a reviewer can:

1. Run the project using documented setup instructions.
2. Sign in using the documented demo setup.
3. Retrieve an existing certificate from the synthetic issuer.
4. See separate integrity, signature, and current-status outcomes.
5. Open the certificate on a phone/laptop-sized screen when every required check succeeds.
6. Observe access being blocked when the issuer is unavailable, the certificate is revoked/superseded, the signature fails, or stored bytes are altered.
7. Confirm one user cannot access another user's documents by manipulating IDs.
8. Inspect tests and `log.txt` without finding secrets or real personal data.

This is an interview MVP, not a production identity or document-verification service. Never claim 100% security or unseen-data correctness. State clearly which issuer, trust, storage, and identity components are simulated.

## 15. Official references

Use official documentation to verify current setup instructions and security behavior before implementation:

- DigiLocker: https://www.digilocker.gov.in/
- DigiLocker architecture: https://www.digilocker.gov.in/web/architecture
- DigiLocker security architecture: https://www.digilocker.gov.in/web/security-architecture
- DigiLocker issuer information: https://www.digilocker.gov.in/web/partners/issuers
- API Setu / DigiLocker APIs: https://apisetu.gov.in/digilocker
- Next.js documentation: https://nextjs.org/docs
- Next.js authentication guide: https://nextjs.org/docs/app/guides/authentication
- Supabase Storage access control: https://supabase.com/docs/guides/storage/security/access-control
- Supabase Storage documentation: https://supabase.com/docs/guides/storage
- Supabase secret keys guidance: https://supabase.com/docs/guides/api/api-keys

Check legal and regulatory requirements separately before any use beyond synthetic interview data. Do not infer official acceptance from this project's resemblance to DigiLocker.




