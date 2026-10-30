import nextEnv from "@next/env";

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
if (configured("ISSUER_SIMULATED_FAILURE_MODE") && !["none", "unavailable", "status_unavailable"].includes(configured("ISSUER_SIMULATED_FAILURE_MODE"))) {
  problems.push("ISSUER_SIMULATED_FAILURE_MODE must be none, unavailable, or status_unavailable.");
}

if (problems.length) {
  console.error("Local setup needs attention:");
  for (const problem of problems) console.error(`- ${problem}`);
  console.error("Secret values were not displayed. Update your ignored local env file, then run npm run setup:check again.");
  process.exitCode = 1;
} else {
  console.log("Local environment variables are configured. The synthetic issuer uses an in-memory demo key pair; no key files are needed.");
  console.log("Next: run the auth/app migrations, seed the issuer fixtures, and confirm the Supabase Storage bucket is private.");
}
