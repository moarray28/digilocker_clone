import nextEnv from "@next/env";

nextEnv.loadEnvConfig(process.cwd());
const { auth, database } = await import("../auth.ts");

const name = process.env.DEMO_ACCOUNT_NAME;
const email = process.env.DEMO_ACCOUNT_EMAIL?.trim().toLowerCase();
const password = process.env.DEMO_ACCOUNT_PASSWORD;

if (!name || !email || !password) {
  throw new Error("Set DEMO_ACCOUNT_NAME, DEMO_ACCOUNT_EMAIL, and DEMO_ACCOUNT_PASSWORD in .env.local or .env first.");
}
if (password.length < 12) {
  throw new Error("The demo account password must be at least 12 characters.");
}

const existing = await database.query('SELECT id FROM "user" WHERE lower(email) = $1 LIMIT 1', [email]);
if (existing.rowCount) {
  console.log(`Demo account already exists: ${email}`);
} else {
  await auth.api.signUpEmail({ body: { name, email, password } });
  console.log(`Created synthetic demo account: ${email}`);
}
await database.end();
