/**
 * Worker entrypoint. Reads configuration from the environment, picks a signer,
 * and runs until interrupted.
 *
 * Refuses to start in production with the development signer, because a
 * document sealed with it is not legally valid and the authority will say so
 * only after it has been submitted.
 */
import pg from "pg";
import { EtaClient } from "./client.js";
import { DevSigner, type Signer } from "./sign.js";
import { runWorker } from "./worker.js";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

async function main(): Promise<void> {
  const environment = (process.env["ETA_ENVIRONMENT"] ?? "preprod") as
    | "preprod"
    | "production";

  let signer: Signer;
  switch (process.env["ETA_SIGNER"] ?? "dev") {
    case "dev":
      if (environment === "production") {
        throw new Error(
          "refusing to start: ETA_SIGNER=dev cannot issue legally valid seals. " +
            "Configure an HSM or an ETA-approved cloud signing service.",
        );
      }
      signer = new DevSigner();
      break;
    default:
      throw new Error(
        `unknown ETA_SIGNER "${process.env["ETA_SIGNER"]}". ` +
          "Only 'dev' exists so far; hsm and cloud need a certificate first.",
      );
  }

  const pool = new pg.Pool({
    connectionString: required("DATABASE_URL"),
    max: Number(process.env["PG_POOL_SIZE"] ?? 5),
  });

  const client = new EtaClient({
    clientId: required("ETA_CLIENT_ID"),
    clientSecret: required("ETA_CLIENT_SECRET"),
    identityBaseUrl: required("ETA_IDENTITY_URL"),
    apiBaseUrl: required("ETA_API_URL"),
    environment,
  });

  const controller = new AbortController();
  const stop = (sig: string) => {
    console.log(`\n${sig} received, finishing the current pass…`);
    controller.abort();
  };
  process.on("SIGINT", () => stop("SIGINT"));
  process.on("SIGTERM", () => stop("SIGTERM"));

  const workerId = process.env["WORKER_ID"] ?? `worker-${process.pid}`;
  console.log(`[${workerId}] draining eta_submission against ${environment}`);
  if (!signer.isProduction) {
    console.warn(`[${workerId}] WARNING: signer "${signer.kind}" produces placeholder seals`);
  }

  await runWorker({
    pool, client, signer, workerId,
    idleMs: Number(process.env["WORKER_IDLE_MS"] ?? 5000),
    signal: controller.signal,
  });

  await pool.end();
  console.log(`[${workerId}] stopped`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
