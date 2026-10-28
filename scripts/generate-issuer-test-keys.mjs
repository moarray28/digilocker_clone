import { generateKeyPairSync } from "node:crypto";
import nextEnv from "@next/env";
import { access, mkdir, unlink, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

nextEnv.loadEnvConfig(process.cwd());
const privatePath = resolve(process.cwd(), process.env.ISSUER_TEST_PRIVATE_KEY_PATH ?? ".secrets/issuer-test-private.pem");
const publicPath = resolve(process.cwd(), process.env.ISSUER_TRUSTED_PUBLIC_KEY_PATH ?? ".secrets/issuer-test-public.pem");

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

await mkdir(dirname(privatePath), { recursive: true, mode: 0o700 });
await mkdir(dirname(publicPath), { recursive: true, mode: 0o700 });
if (await exists(privatePath) || await exists(publicPath)) {
  throw new Error("A test issuer key file already exists. Move it aside before generating a replacement.");
}

const pair = generateKeyPairSync("ed25519", {
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
  publicKeyEncoding: { type: "spki", format: "pem" },
});
await writeFile(privatePath, pair.privateKey, { encoding: "utf8", mode: 0o600, flag: "wx" });
try {
  await writeFile(publicPath, pair.publicKey, { encoding: "utf8", mode: 0o644, flag: "wx" });
} catch (error) {
  await unlink(privatePath);
  throw error;
}
console.log("Created local Ed25519 test issuer keys. Keep the private key out of source control.");
console.log(`Private key: ${privatePath}`);
console.log(`Trusted public key: ${publicPath}`);
