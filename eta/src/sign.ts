/**
 * Document signing (the e-seal).
 *
 * The authority requires a CAdES-BES signature over the document hash, bound
 * to the company's tax registration. For automated issuance from a server that
 * means an HSM or an ETA-approved cloud signing service -- not a USB token in
 * somebody's laptop. That has procurement cost and lead time, so the concrete
 * signer is deliberately pluggable and nothing else in this package depends on
 * which one is in use.
 *
 * Three implementations are anticipated:
 *   - DevSigner        local only, produces a structurally-shaped placeholder
 *   - HsmSigner        PKCS#11 against an on-premise module
 *   - CloudSigner      an approved remote signing service over HTTPS
 *
 * Only DevSigner exists today; the other two need credentials and a
 * certificate before they can be written against anything real.
 */
import { createHash } from "node:crypto";

export interface SignatureResult {
  /** Base64 CAdES-BES signature over the document hash. */
  value: string;
  /** Always "I" (issuer) for documents we issue ourselves. */
  signatureType: "I";
}

export interface Signer {
  readonly kind: string;
  /** True when this signer can produce a legally valid seal. */
  readonly isProduction: boolean;
  sign(documentHash: Buffer): Promise<SignatureResult>;
}

/**
 * Development signer. Deterministic, structurally correct, and legally
 * worthless. Refuses to run when NODE_ENV is production so it cannot be
 * deployed by accident.
 */
export class DevSigner implements Signer {
  readonly kind = "dev";
  readonly isProduction = false;

  constructor() {
    if (process.env["NODE_ENV"] === "production") {
      throw new Error(
        "DevSigner cannot be used in production. Configure an HSM or an " +
          "ETA-approved cloud signing service.",
      );
    }
  }

  async sign(documentHash: Buffer): Promise<SignatureResult> {
    const stub = createHash("sha256")
      .update(Buffer.concat([Buffer.from("DEV-SEAL:", "utf8"), documentHash]))
      .digest("base64");
    return { value: stub, signatureType: "I" };
  }
}

/** Attaches the signature to the document in the shape the API expects. */
export function attachSignature<T extends object>(
  document: T,
  signature: SignatureResult,
): T & { signatures: SignatureResult[] } {
  return { ...document, signatures: [signature] };
}
