import assert from "node:assert/strict";
import test from "node:test";
import { sign, verify } from "node:crypto";
import { DEMO_ISSUER_PRIVATE_KEY, DEMO_ISSUER_PUBLIC_KEY } from "../lib/issuer/demo-issuer-key";

test("the in-memory synthetic issuer key pair signs and verifies without local key files", () => {
  assert.equal(DEMO_ISSUER_PRIVATE_KEY.asymmetricKeyType, "ed25519");
  assert.equal(DEMO_ISSUER_PUBLIC_KEY.asymmetricKeyType, "ed25519");
  const payload = Buffer.from("synthetic demo issuer key check");
  const signature = sign(null, payload, DEMO_ISSUER_PRIVATE_KEY);
  assert.equal(verify(null, payload, DEMO_ISSUER_PUBLIC_KEY, signature), true);
});
