/**
 * End-to-end: post a document in the real schema, then drive the worker
 * against a stubbed authority and check both the happy path and the failure
 * paths land the queue in the right state.
 *
 * Requires the test database built by scripts/test.sh.
 */
import { test, describe, before, after } from "node:test";
import assert from "node:assert/strict";
import pg from "pg";
import { drainOnce } from "../src/worker.js";
import { DevSigner } from "../src/sign.js";
import { EtaClient, type SubmitResult } from "../src/client.js";

const { Pool } = pg;
const DB = process.env["AZB_TEST_DB"] ?? "azb_test";

let pool: InstanceType<typeof Pool>;
let tenantId: string;
let branchId: string;
let partyId: string;
const OWNER = "11111111-1111-1111-1111-111111111111";

/** An EtaClient whose HTTP layer is replaced by a scripted responder. */
function stubClient(handler: (body: unknown) => { status: number; json: unknown }): EtaClient {
  const fetchImpl = (async (url: string | URL | Request, init?: RequestInit) => {
    const target = String(url);
    if (target.includes("/connect/token")) {
      return new Response(JSON.stringify({ access_token: "test-token", expires_in: 3600 }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    const parsed = init?.body ? JSON.parse(String(init.body)) : {};
    const { status, json } = handler(parsed);
    return new Response(JSON.stringify(json), {
      status,
      headers: { "content-type": "application/json" },
    });
  }) as unknown as typeof fetch;

  return new EtaClient({
    clientId: "test",
    clientSecret: "test",
    identityBaseUrl: "https://id.invalid",
    apiBaseUrl: "https://api.invalid",
    environment: "preprod",
    fetchImpl,
  });
}

async function actAs(user: string) {
  await pool.query("select set_config('request.jwt.claims', $1, false)", [
    JSON.stringify({ sub: user }),
  ]);
}

/** Creates and posts a fresh sales invoice, returning its id. */
async function postInvoice(opts: { itemCode?: string | null } = {}): Promise<string> {
  const client = await pool.connect();
  try {
    await client.query("select set_config('request.jwt.claims', $1, false)", [
      JSON.stringify({ sub: OWNER }),
    ]);
    const { rows } = await client.query<{ id: string }>(
      `insert into document (tenant_id, branch_id, doc_type, doc_no, party_id,
                             issued_on, created_by)
       values ($1, $2, 'sales_invoice',
               app.next_document_no($1, 'sales_invoice'), $3, current_date, $4)
       returning id`,
      [tenantId, branchId, partyId, OWNER],
    );
    const id = rows[0]!.id;

    await client.query(
      `insert into document_line (document_id, tenant_id, line_no, description,
                                  item_code_type, item_code, uom_code,
                                  quantity, unit_price, tax_code_id, tax_rate)
       values ($1, $2, 1, 'شيفون مطبوع',
               case when $3::text is null then null else 'EGS' end, $3, 'MTR',
               10, 100,
               (select id from tax_code where tenant_id = $2 and code = 'VAT14'), 14)`,
      [id, tenantId, opts.itemCode === undefined ? "EG-123456789-F100" : opts.itemCode],
    );

    await client.query("select app.submit_document($1)", [id]);
    await client.query("select app.post_document($1)", [id]);
    return id;
  } finally {
    client.release();
  }
}

describe("submission worker", () => {
  before(async () => {
    pool = new Pool({
      database: DB,
      max: 4,
      // Peer auth over the unix socket by default; PG* env vars override.
      user: process.env["PGUSER"] ?? process.env["USER"] ?? "root",
      host: process.env["PGHOST"] ?? "/var/run/postgresql",
    });
    await actAs(OWNER);

    const t = await pool.query<{ id: string }>(
      "select id from tenant where name = 'AZ Textiles'",
    );
    tenantId = t.rows[0]!.id;

    // The issuer needs a tax registration number and a branch address.
    await pool.query(
      `update tenant set tax_registration_no = '123456789' where id = $1`,
      [tenantId],
    );
    const b = await pool.query<{ id: string }>(
      `update branch set governorate = 'القاهرة', city = 'القاهرة',
              street = 'شارع الجمهورية', building_no = '15',
              activity_code = '4641'
        where tenant_id = $1 returning id`,
      [tenantId],
    );
    branchId = b.rows[0]!.id;

    const p = await pool.query<{ id: string }>(
      "select id from party where tenant_id = $1 and code = 'C001'",
      [tenantId],
    );
    partyId = p.rows[0]!.id;

    // Clear anything earlier suites left in the queue.
    await pool.query("delete from eta_submission_attempt");
    await pool.query("delete from eta_submission");
  });

  after(async () => {
    await pool.end();
  });

  test("clears a valid invoice and records the uuid", async () => {
    const docId = await postInvoice();

    const client = stubClient((body) => {
      const doc = (body as { documents: { internalID: string }[] }).documents[0]!;
      return {
        status: 200,
        json: {
          submissionUUID: "SUB-1",
          acceptedDocuments: [
            { internalId: doc.internalID, uuid: "UUID-1", longId: "LONG-1" },
          ],
          rejectedDocuments: [],
        },
      };
    });

    const result = await drainOnce({
      pool, client, signer: new DevSigner(), workerId: "test-worker",
    });

    assert.equal(result.claimed, 1);
    assert.equal(result.succeeded, 1);
    assert.equal(result.failed, 0);

    const { rows } = await pool.query(
      "select eta_status, eta_uuid, eta_long_id from document where id = $1",
      [docId],
    );
    assert.equal(rows[0].eta_status, "valid");
    assert.equal(rows[0].eta_uuid, "UUID-1");
    assert.equal(rows[0].eta_long_id, "LONG-1");

    const sub = await pool.query(
      "select state, canonical_json, payload_hash, signed_payload from eta_submission where document_id = $1",
      [docId],
    );
    assert.equal(sub.rows[0].state, "succeeded");
    assert.match(sub.rows[0].payload_hash, /^[0-9A-F]{64}$/);
    assert.ok(sub.rows[0].canonical_json.includes('"DOCUMENTTYPE""I"'));
    assert.ok(
      JSON.parse(sub.rows[0].signed_payload).signatures.length === 1,
      "the exact signed bytes are retained",
    );
  });

  test("a rejection is permanent and is not retried", async () => {
    const docId = await postInvoice();

    const client = stubClient((body) => {
      const doc = (body as { documents: { internalID: string }[] }).documents[0]!;
      return {
        status: 200,
        json: {
          submissionUUID: "SUB-2",
          acceptedDocuments: [],
          rejectedDocuments: [
            {
              internalId: doc.internalID,
              error: { code: "4013", message: "Invalid item code" },
            },
          ],
        },
      };
    });

    const result = await drainOnce({
      pool, client, signer: new DevSigner(), workerId: "test-worker",
    });
    assert.equal(result.failed, 1);

    const { rows } = await pool.query(
      "select eta_status, eta_error ->> 'message' as msg from document where id = $1",
      [docId],
    );
    assert.equal(rows[0].eta_status, "rejected");
    assert.equal(rows[0].msg, "Invalid item code");

    const sub = await pool.query(
      "select state from eta_submission where document_id = $1", [docId]);
    assert.equal(sub.rows[0].state, "failed", "a rejection must not be retried");
  });

  test("a network failure is transient and backs off", async () => {
    const docId = await postInvoice();

    const client = stubClient(() => ({
      status: 503,
      json: { message: "service unavailable" },
    }));

    const result = await drainOnce({
      pool, client, signer: new DevSigner(), workerId: "test-worker",
    });
    assert.equal(result.failed, 1);

    const sub = await pool.query(
      "select state, attempts, next_attempt_at > now() as scheduled from eta_submission where document_id = $1",
      [docId],
    );
    assert.equal(sub.rows[0].state, "pending", "a 503 must be retried");
    assert.equal(sub.rows[0].attempts, 1);
    assert.equal(sub.rows[0].scheduled, true);

    const doc = await pool.query("select eta_status from document where id = $1", [docId]);
    assert.equal(doc.rows[0].eta_status, "queued", "still queued, not failed");
  });

  test("an uncoded item is caught before a round trip is spent", async () => {
    const docId = await postInvoice({ itemCode: null });

    let called = false;
    const client = stubClient(() => {
      called = true;
      return { status: 200, json: { acceptedDocuments: [], rejectedDocuments: [] } };
    });

    await drainOnce({ pool, client, signer: new DevSigner(), workerId: "test-worker" });

    assert.equal(called, false, "local validation must run before submitting");
    const sub = await pool.query(
      "select state, last_error ->> 'message' as msg from eta_submission where document_id = $1",
      [docId],
    );
    assert.equal(sub.rows[0].state, "failed");
    assert.match(sub.rows[0].msg, /item code/i);
  });

  test("the token is fetched once and reused across submissions", async () => {
    await postInvoice();
    await postInvoice();

    let tokenCalls = 0;
    const fetchImpl = (async (url: string | URL | Request, init?: RequestInit) => {
      if (String(url).includes("/connect/token")) {
        tokenCalls += 1;
        return new Response(JSON.stringify({ access_token: "t", expires_in: 3600 }), {
          status: 200, headers: { "content-type": "application/json" },
        });
      }
      const doc = JSON.parse(String(init!.body)).documents[0];
      return new Response(
        JSON.stringify({
          submissionUUID: "S",
          acceptedDocuments: [{ internalId: doc.internalID, uuid: "U", longId: "L" }],
          rejectedDocuments: [],
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      );
    }) as unknown as typeof fetch;

    const client = new EtaClient({
      clientId: "c", clientSecret: "s",
      identityBaseUrl: "https://id.invalid", apiBaseUrl: "https://api.invalid",
      environment: "preprod", fetchImpl,
    });

    const result = await drainOnce({
      pool, client, signer: new DevSigner(), workerId: "test-worker", batchSize: 10,
    });

    assert.ok(result.succeeded >= 2, `expected at least 2 successes, got ${result.succeeded}`);
    assert.equal(tokenCalls, 1, "the token must be cached across a batch");
  });
});
