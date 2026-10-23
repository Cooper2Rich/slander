import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex, utf8ToBytes } from "@noble/hashes/utils.js";

// The public bundle reuses the Node domain rules with a browser SHA-256 adapter.
export const randomUUID = () => crypto.randomUUID();
export function createHash(algorithm: string) {
  if (algorithm !== "sha256") throw new Error("Unsupported preview hash.");
  const hash = sha256.create();
  return {
    update(value: string | Uint8Array) {
      hash.update(typeof value === "string" ? utf8ToBytes(value) : value);
      return this;
    },
    digest(encoding?: string) {
      const bytes = hash.digest();
      return encoding === "hex" ? bytesToHex(bytes) : bytes;
    },
  };
}
