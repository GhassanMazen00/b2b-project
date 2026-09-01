/** Rewrites the golden expectations from the current serialiser. */
import { writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { buildDocument } from "./document.js";
import { hashDocument } from "./hash.js";
import { GOLDEN_INVOICE } from "./golden.js";

const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, "..", "..", "test", "golden");
mkdirSync(dir, { recursive: true });

const doc = buildDocument(GOLDEN_INVOICE);
const { canonical, hex } = hashDocument(doc);

writeFileSync(join(dir, "expected.canonical.txt"), canonical + "\n", "utf8");
writeFileSync(join(dir, "expected.hash.txt"), hex + "\n", "utf8");
writeFileSync(join(dir, "input.json"), JSON.stringify(doc, null, 2) + "\n", "utf8");

console.log(`wrote golden files to ${dir}`);
console.log(`hash: ${hex}`);
