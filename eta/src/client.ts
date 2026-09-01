/**
 * ETA REST client: OAuth2 token handling and document submission.
 *
 * Endpoint paths and the exact response envelope could not be read from
 * sdk.invoicing.eta.gov.eg (blocked from the build environment), so they are
 * configuration rather than constants. Point BASE_URLS at the documented hosts
 * once confirmed; nothing else changes.
 */

export interface EtaConfig {
  clientId: string;
  clientSecret: string;
  /** OAuth2 token issuer, e.g. the identity host for the chosen environment. */
  identityBaseUrl: string;
  /** API host for submissions and lookups. */
  apiBaseUrl: string;
  environment: "preprod" | "production";
  /** Seconds of headroom before expiry at which a token is refreshed. */
  refreshSkewSeconds?: number;
  fetchImpl?: typeof fetch;
}

export interface SubmitResult {
  submissionUuid: string;
  acceptedDocuments: { internalId: string; uuid: string; longId: string }[];
  rejectedDocuments: {
    internalId: string;
    error: { code?: string; message: string; details?: unknown };
  }[];
}

export class EtaError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly body: unknown,
    /** Retrying an identical request will not change the outcome. */
    readonly permanent: boolean,
  ) {
    super(message);
    this.name = "EtaError";
  }
}

interface CachedToken {
  value: string;
  expiresAt: number;
}

export class EtaClient {
  private token: CachedToken | null = null;
  private inFlight: Promise<string> | null = null;
  private readonly fetchImpl: typeof fetch;
  private readonly skew: number;

  constructor(private readonly config: EtaConfig) {
    this.fetchImpl = config.fetchImpl ?? fetch;
    this.skew = config.refreshSkewSeconds ?? 60;
  }

  /**
   * Returns a valid bearer token, fetching one if needed. Concurrent callers
   * share a single in-flight request rather than each opening their own.
   */
  async getToken(): Promise<string> {
    if (this.token && Date.now() < this.token.expiresAt - this.skew * 1000) {
      return this.token.value;
    }
    if (this.inFlight) return this.inFlight;

    this.inFlight = this.fetchToken().finally(() => {
      this.inFlight = null;
    });
    return this.inFlight;
  }

  private async fetchToken(): Promise<string> {
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
    });

    const res = await this.fetchImpl(`${this.config.identityBaseUrl}/connect/token`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    });

    const payload = (await res.json().catch(() => ({}))) as {
      access_token?: string;
      expires_in?: number;
      error?: string;
    };

    if (!res.ok || !payload.access_token) {
      // Bad credentials will never succeed on retry; anything else might.
      throw new EtaError(
        `token request failed: ${payload.error ?? res.statusText}`,
        res.status,
        payload,
        res.status === 400 || res.status === 401,
      );
    }

    this.token = {
      value: payload.access_token,
      expiresAt: Date.now() + (payload.expires_in ?? 3600) * 1000,
    };
    return this.token.value;
  }

  /** Submits one or more signed documents for clearance. */
  async submitDocuments(signedDocuments: unknown[]): Promise<SubmitResult> {
    const token = await this.getToken();

    const res = await this.fetchImpl(`${this.config.apiBaseUrl}/api/v1/documentsubmissions`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ documents: signedDocuments }),
    });

    const payload = (await res.json().catch(() => ({}))) as Record<string, unknown>;

    if (!res.ok) {
      throw new EtaError(
        `submission failed with ${res.status}`,
        res.status,
        payload,
        // 4xx other than 401/408/429 means the payload itself is wrong.
        res.status >= 400 &&
          res.status < 500 &&
          ![401, 408, 429].includes(res.status),
      );
    }

    return {
      submissionUuid: String(payload["submissionUUID"] ?? payload["submissionUuid"] ?? ""),
      acceptedDocuments: (payload["acceptedDocuments"] as SubmitResult["acceptedDocuments"]) ?? [],
      rejectedDocuments: (payload["rejectedDocuments"] as SubmitResult["rejectedDocuments"]) ?? [],
    };
  }

  /** Looks up a previously submitted document by its ETA uuid. */
  async getDocument(uuid: string): Promise<Record<string, unknown>> {
    const token = await this.getToken();
    const res = await this.fetchImpl(`${this.config.apiBaseUrl}/api/v1/documents/${uuid}/raw`, {
      headers: { authorization: `Bearer ${token}` },
    });
    const payload = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      throw new EtaError(`lookup failed with ${res.status}`, res.status, payload, res.status === 404);
    }
    return payload;
  }
}
