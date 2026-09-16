import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const KEY_BYTES = 32;
const NONCE_BYTES = 12;
const TAG_BYTES = 16;

export function parseTokenEncryptionKey(raw: string): Buffer {
  const key = Buffer.from(raw, "base64");
  if (key.length !== KEY_BYTES) {
    throw new Error(
      "TOKEN_ENCRYPTION_KEY must decode to 32 bytes. Generate with: openssl rand -base64 32",
    );
  }

  return key;
}

export function encrypt(plaintext: string, key: Buffer): string {
  const nonce = randomBytes(NONCE_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, nonce, {
    authTagLength: TAG_BYTES,
  });
  const ciphertext = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return Buffer.concat([nonce, tag, ciphertext]).toString("base64");
}

export function decrypt(payload: string, key: Buffer): string {
  const packed = Buffer.from(payload, "base64");
  if (packed.length < NONCE_BYTES + TAG_BYTES) {
    throw new Error("Encrypted token is truncated.");
  }

  const nonce = packed.subarray(0, NONCE_BYTES);
  const tag = packed.subarray(NONCE_BYTES, NONCE_BYTES + TAG_BYTES);
  const ciphertext = packed.subarray(NONCE_BYTES + TAG_BYTES);
  const decipher = createDecipheriv(ALGORITHM, key, nonce, {
    authTagLength: TAG_BYTES,
  });
  decipher.setAuthTag(tag);

  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString(
    "utf8",
  );
}
