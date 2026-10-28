import nextEnv from "@next/env";
import { createPrivateKey, createPublicKey, sign, verify } from "node:crypto";
import { access, readFile } from "node:fs/promises";
import { resolve } from "node:path";

nextEnv.loadEnvConfig(process.cwd());

const problems = [];
const configured = (name) => process.env[name]?.trim() ?? "";

function required(name, validate = () => true) {
  const value = configured(name);
  if (!value) {
    problems.push(`${name} is missing from the local env file (.env.local or .env).`);
    return null;
  }
  if (!validate(value)) {
    problems.push(`${name} has an invalid format or value.`);
    return null;
  }
  return value;
}

required("BETTER_AUTH_SECRET", (value) => value.length >= 32);
function validUrl(value) {
  try { return new URL(value).protocol === "http:" || new URL(value).protocol === "https:"; }
  catch { return false; }
}
if (configured("BETTER_AUTH_URL") && !validUrl(configured("BETTER_AUTH_URL"))) {
  problems.push("BETTER_AUTH_URL has an invalid format or value.");
}
const databaseUrl = required("DATABASE_URL", (value) => {
  try {
    const url = new URL(value);
    return url.protocol === "postgres:" || url.protocol === "postgresql:";
  } catch { return false; }
});
if (databaseUrl) {
  const url = new URL(databaseUrl);
  const local = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  if (!local && url.port === "6543" && url.searchParams.get("sslmode") !== "verify-full") {
    problems.push("Hosted transaction-pooler DATABASE_URL must use sslmode=verify-full.");
  }
  if (!local && url.searchParams.get("sslmode") !== "verify-full") {
    problems.push("DATABASE_URL must use sslmode=verify-full for hosted PostgreSQL.");
  }
  if (!local) {
    const certPath = url.searchParams.get("sslrootcert");
    const environmentCa = configured("DATABASE_SSL_CA");
    if (environmentCa && (!environmentCa.includes("-----BEGIN CERTIFICATE-----") || !environmentCa.includes("-----END CERTIFICATE-----"))) {
      problems.push("DATABASE_SSL_CA must contain the full PEM-encoded Supabase root certificate.");
    }
    if (!certPath && !environmentCa) {
      problems.push("Set DATABASE_SSL_CA to the Supabase root certificate or configure a local sslrootcert path in DATABASE_URL.");
    } else if (!environmentCa && certPath) {
      try { await access(resolve(process.cwd(), certPath)); }
      catch { problems.push("DATABASE_URL sslrootcert does not point to a readable local certificate file."); }
    }
  }
}
required("SUPABASE_URL", (value) => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || ["localhost", "127.0.0.1"].includes(url.hostname);
  } catch { return false; }
});
const secretKey = configured("SUPABASE_SECRET_KEY");
const legacyServiceRoleKey = configured("SUPABASE_SERVICE_ROLE_KEY");
if (!secretKey && !legacyServiceRoleKey) {
  problems.push("Set SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY in the local env file (.env.local or .env).");
} else if (secretKey && !secretKey.startsWith("sb_secret_")) {
  problems.push("SUPABASE_SECRET_KEY must be a Supabase secret key from Settings > API Keys.");
}
if (configured("SUPABASE_STORAGE_BUCKET") && !/^[a-z0-9][a-z0-9._-]{2,62}$/.test(configured("SUPABASE_STORAGE_BUCKET"))) {
  problems.push("SUPABASE_STORAGE_BUCKET has an invalid format or value.");
}
required("ISSUER_TEST_KEY_ID", (value) => /^[A-Za-z0-9._-]{3,80}$/.test(value));

const privatePath = configured("ISSUER_TEST_PRIVATE_KEY_PATH") || "./.secrets/issuer-test-private.pem";
const publicPath = configured("ISSUER_TRUSTED_PUBLIC_KEY_PATH") || "./.secrets/issuer-test-public.pem";

{
  try {
    const privatePem = configured("ISSUER_TEST_PRIVATE_KEY");
    const publicPem = configured("ISSUER_TRUSTED_PUBLIC_KEY");
    const privateKey = createPrivateKey(privatePem || await readFile(resolve(process.cwd(), privatePath)));
    const publicKey = createPublicKey(publicPem || await readFile(resolve(process.cwd(), publicPath)));
    const challenge = Buffer.from("certificate-wallet-local-key-pair-check");
    if (privateKey.asymmetricKeyType !== "ed25519" || publicKey.asymmetricKeyType !== "ed25519") {
      problems.push("Issuer signing and trusted public keys must both be Ed25519.");
    } else if (!verify(null, challenge, publicKey, sign(null, challenge, privateKey))) {
      problems.push("Issuer private and trusted public keys do not match.");
    }
  } catch {
    problems.push("Issuer key files are missing, unreadable, or invalid. Generate them with npm run issuer:keys:generate.");
  }
}

if (configured("ISSUER_SIMULATED_FAILURE_MODE") && !["none", "unavailable", "status_unavailable"].includes(configured("ISSUER_SIMULATED_FAILURE_MODE"))) {
  problems.push("ISSUER_SIMULATED_FAILURE_MODE must be none, unavailable, or status_unavailable.");
}

if (problems.length) {
  console.error("Local setup needs attention:");
  for (const problem of problems) console.error(`- ${problem}`);
  console.error("Secret values were not displayed. Update your ignored local env file, then run npm run setup:check again.");
  process.exitCode = 1;
} else {
  console.log("Local environment variables and issuer key pair are configured.");
  console.log("Next: run the auth/app migrations, seed the issuer fixtures, and confirm the Supabase Storage bucket is private.");
}
