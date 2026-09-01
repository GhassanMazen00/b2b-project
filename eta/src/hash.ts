/**
 * Document hashing. SHA-256 over the UTF-8 bytes of the canonical string.
 *
 * Unlike canonical.ts, there is nothing uncertain here: the algorithm and the
 * encoding are both stated plainly in the published approach.
 */
import { createHash } from "node:crypto";
import { canonicalize, type Json } from "./canonical.js";

export function hashCanonical(canonical: string): Buffer {
  return createHash("sha256").update(Buffer.from(canonical, "utf8")).digest();
}

/** Convenience: canonicalise and hash in one step. */
export function hashDocument(document: { [k: string]: Json | undefined }): {
  canonical: string;
  hash: Buffer;
  hex: string;
} {
  const canonical = canonicalize(document);
  const hash = hashCanonical(canonical);
  return { canonical, hash, hex: hash.toString("hex").toUpperCase() };
}
