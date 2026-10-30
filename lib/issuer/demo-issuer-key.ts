import { generateKeyPairSync } from "node:crypto";

/**
 * Ephemeral signing keys for the synthetic demo issuer.
 * This keeps local setup free of key files and key environment variables.
 * It is deliberately not a real issuer identity or a production trust key.
 */
export const DEMO_ISSUER_ID = "demo-school-board";
export const DEMO_ISSUER_KEY_ID = "demo-school-key-v1";

const demoKeyPair = generateKeyPairSync("ed25519");

export const DEMO_ISSUER_PRIVATE_KEY = demoKeyPair.privateKey;
export const DEMO_ISSUER_PUBLIC_KEY = demoKeyPair.publicKey;
