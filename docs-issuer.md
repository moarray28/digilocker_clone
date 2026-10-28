# Simulated issuer adapter

`lib/issuer/simulated-issuer.ts` is the server-side `IssuerAdapter` implementation. It reads only the synthetic `issuer_test_records` table, validates the lookup shape, returns `null` on no match, creates a clearly watermarked PDF, signs a stable manifest with a local Ed25519 test key, and performs a fresh PostgreSQL status query for each current-status check.

The manifest includes the PDF SHA-256 digest and the synthetic certificate fields. `lib/crypto/issuer-manifest.ts` independently checks file integrity and verifies the signature against the preconfigured public-key file and expected issuer/key ID. The public key is not trusted from the returned artifact. Status is separate from the signature and must be checked at display time by the later wallet workflow.

## Local keys and scenarios

Copy `.env.example` to `.env.local`, install project dependencies, and keep the configured paths under the ignored `.secrets/` folder. Generate an Ed25519 test key pair with `npm run issuer:keys:generate`. Never commit, upload, or log `.secrets/issuer-test-private.pem`; it is only for the local synthetic demo. The committed issuer registry fixture uses key ID `demo-school-key-v1`.

| Scenario | Fixture |
| --- | --- |
| Active, valid signature | Aarav Sample · DEMO-25001 · secondary · 2025 |
| Active, valid signature | Isha Example · DEMO-24002 · higher secondary · 2024 |
| Revoked | Kabir Test · DEMO-23003 · secondary · 2023 |
| Superseded | Mira Fiction · DEMO-22004 · higher secondary · 2022 |
| Invalid signature | Rehan Placeholder · DEMO-25005 · secondary · 2025 |
| No match | Any other synthetic lookup combination |

Set `ISSUER_SIMULATED_FAILURE_MODE=unavailable` to make retrieval and status checks fail closed, or `status_unavailable` to leave lookup working while blocking the fresh status check. Use `none` for the normal flow. Reset the value to `none` after a failure scenario.

A successful synthetic lookup only matches a seeded fixture; it does not verify a real person's identity. These records and key are synthetic interview fixtures. The adapter is not connected to a school, government, or identity provider. The authenticated request route calls this adapter, validates the returned PDF digest and signed manifest independently, checks current status, and stores only active, correctly signed PDFs in the private Supabase bucket. The wallet read route scopes document metadata to the authenticated owner, performs a fresh issuer status check, downloads the private object server-side, and compares its SHA-256 digest before returning it. The route sends `Cache-Control: private, no-store` and supports inline display and attachment download. These paths require configured PostgreSQL, the private bucket, local issuer keys, and seeded fixtures before they can run end to end.

