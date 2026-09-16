import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { test } from "node:test";

import { decrypt, encrypt, parseTokenEncryptionKey } from "./token.ts";

function key() {
  return parseTokenEncryptionKey(randomBytes(32).toString("base64"));
}

test("plaintext round-trips and is not stored as itself", () => {
  const k = key();
  const plaintext = "host-token-example";
  const stored = encrypt(plaintext, k);

  assert.notEqual(stored, plaintext);
  assert.equal(decrypt(stored, k), plaintext);
});

test("the same plaintext encrypts to different ciphertext", () => {
  const k = key();
  const plaintext = "host-token-example";

  assert.notEqual(encrypt(plaintext, k), encrypt(plaintext, k));
});

test("tampering with ciphertext fails decrypt", () => {
  const k = key();
  const packed = Buffer.from(encrypt("host-token-example", k), "base64");
  packed[packed.length - 1] ^= 1;

  assert.throws(() => decrypt(packed.toString("base64"), k));
});

test("wrong key fails decrypt", () => {
  const stored = encrypt("host-token-example", key());

  assert.throws(() => decrypt(stored, key()));
});

test("rejects a key that is not 32 bytes", () => {
  assert.throws(() => parseTokenEncryptionKey("too-short"));
});
