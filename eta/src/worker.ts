/**
 * The submission worker.
 *
 * Drains eta_submission using the SQL functions the schema already provides:
 * claim under a lease, submit, then record success or schedule a retry. All
 * the queue semantics -- SKIP LOCKED leasing, exponential backoff, the attempt
 * budget, stale-lease recovery -- live in the database, so this loop stays
 * small and several workers can run at once without coordination.
 */
import type { Pool, PoolClient } from "pg";
import { EtaClient, EtaError } from "./client.js";
import { hashDocument } from "./hash.js";
import { attachSignature, type Signer } from "./sign.js";
import { buildDocument, validateTotals, type DocumentInput } from "./document.js";
import { loadDocumentInput } from "./load.js";

export interface WorkerOptions {
  pool: Pool;
  client: EtaClient;
  signer: Signer;
  workerId: string;
  batchSize?: number;
  /** How long a lease may be held before another worker may reclaim it. */
  staleLeaseMinutes?: number;
}

export interface DrainResult {
  claimed: number;
  succeeded: number;
  failed: number;
  reclaimed: number;
}

interface ClaimedRow {
  id: string;
  document_id: string;
  attempts: number;
}

/**
 * Runs one pass: reclaim abandoned leases, claim a batch, process it.
 * Returns counts so a caller can decide whether to loop again immediately.
 */
export async function drainOnce(opts: WorkerOptions): Promise<DrainResult> {
  const { pool, workerId, batchSize = 10, staleLeaseMinutes = 10 } = opts;
  const result: DrainResult = { claimed: 0, succeeded: 0, failed: 0, reclaimed: 0 };

  const reclaimed = await pool.query<{ n: number }>(
    "select app.reclaim_stale_eta_leases(make_interval(mins => $1)) as n",
    [staleLeaseMinutes],
  );
  result.reclaimed = Number(reclaimed.rows[0]?.n ?? 0);

  const claimed = await pool.query<ClaimedRow>(
    "select id, document_id, attempts from app.claim_eta_submissions($1, $2)",
    [workerId, batchSize],
  );
  result.claimed = claimed.rows.length;

  for (const row of claimed.rows) {
    try {
      await processOne(opts, row);
      result.succeeded += 1;
    } catch (err) {
      result.failed += 1;
      await recordFailure(pool, row.id, err);
    }
  }

  return result;
}

async function processOne(opts: WorkerOptions, row: ClaimedRow): Promise<void> {
  const { pool, client, signer } = opts;

  const input: DocumentInput = await loadDocumentInput(pool, row.document_id);

  // Catch arithmetic problems before spending a round trip on a rejection.
  const problems = validateTotals(input);
  if (problems.length > 0) {
    throw new EtaError(
      `document failed local validation: ${problems.join("; ")}`,
      0,
      { problems },
      true, // the numbers will not fix themselves on retry
    );
  }

  const document = buildDocument(input);
  const { canonical, hash } = hashDocument(document);
  const signature = await signer.sign(hash);
  const signed = attachSignature(document, signature);

  // Keep exactly what was signed. Regenerating it later could produce
  // different bytes, which would make the signature unverifiable.
  await pool.query(
    `update eta_submission
        set canonical_json = $2, payload_hash = $3, signed_payload = $4
      where id = $1`,
    [row.id, canonical, hash.toString("hex").toUpperCase(), JSON.stringify(signed)],
  );

  const submission = await client.submitDocuments([signed]);

  const rejected = submission.rejectedDocuments.find(
    (d) => d.internalId === input.internalId,
  );
  if (rejected) {
    throw new EtaError(
      rejected.error.message || "document rejected by the authority",
      422,
      rejected.error,
      true, // the authority read it and said no; resubmitting the same bytes will not help
    );
  }

  const accepted =
    submission.acceptedDocuments.find((d) => d.internalId === input.internalId) ??
    submission.acceptedDocuments[0];

  if (!accepted) {
    throw new EtaError(
      "the authority accepted the submission but returned no document",
      502,
      submission,
      false,
    );
  }

  await pool.query("select app.complete_eta_submission($1, $2, $3, $4::jsonb)", [
    row.id,
    accepted.uuid,
    accepted.longId,
    JSON.stringify({ submissionUuid: submission.submissionUuid }),
  ]);
}

async function recordFailure(pool: Pool, submissionId: string, err: unknown): Promise<void> {
  const permanent = err instanceof EtaError ? err.permanent : false;
  const payload = {
    message: err instanceof Error ? err.message : String(err),
    code: err instanceof EtaError ? String(err.status) : "UNKNOWN",
    details: err instanceof EtaError ? err.body : undefined,
  };

  await pool.query("select app.fail_eta_submission($1, $2::jsonb, $3)", [
    submissionId,
    JSON.stringify(payload),
    permanent,
  ]);
}

/**
 * Long-running loop. Sleeps between empty passes rather than spinning, and
 * keeps going after an unexpected error so one bad document cannot stop the
 * queue.
 */
export async function runWorker(
  opts: WorkerOptions & { idleMs?: number; signal?: AbortSignal },
): Promise<void> {
  const idleMs = opts.idleMs ?? 5000;

  while (!opts.signal?.aborted) {
    let processed = 0;
    try {
      const result = await drainOnce(opts);
      processed = result.claimed;
      if (result.claimed > 0) {
        console.log(
          `[${opts.workerId}] claimed ${result.claimed}, ` +
            `succeeded ${result.succeeded}, failed ${result.failed}` +
            (result.reclaimed ? `, reclaimed ${result.reclaimed}` : ""),
        );
      }
    } catch (err) {
      console.error(`[${opts.workerId}] pass failed:`, err);
    }

    if (processed === 0) {
      await new Promise((r) => setTimeout(r, idleMs));
    }
  }
}
