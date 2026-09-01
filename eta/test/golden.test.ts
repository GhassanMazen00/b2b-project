/**
 * Conformance harness.
 *
 * The expected files in test/golden/ are currently OUR OWN OUTPUT, so today
 * this is a regression guard: it catches an accidental change to the
 * serialiser, and nothing more. It becomes a real conformance check the moment
 * `expected.canonical.txt` and `expected.hash.txt` are replaced with output
 * from the ETA integration toolkit for the same input.
 *
 * To regenerate after an intentional change:  npm run golden:update
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { buildDocument, validateTotals } from "../src/document.js";
import { hashDocument } from "../src/hash.js";
import { GOLDEN_INVOICE } from "../src/golden.js";

const here = dirname(fileURLToPath(import.meta.url));
const goldenDir = join(here, "..", "..", "test", "golden");

describe("golden conformance", () => {
  const doc = buildDocument(GOLDEN_INVOICE);
  const { canonical, hex } = hashDocument(doc);

  test("the fixture is arithmetically valid", () => {
    assert.deepEqual(validateTotals(GOLDEN_INVOICE), []);
  });

  test("canonical form matches the recorded expectation", () => {
    const path = join(goldenDir, "expected.canonical.txt");
    if (!existsSync(path)) {
      assert.fail(`missing ${path} — run npm run golden:update`);
    }
    const expected = readFileSync(path, "utf8").trimEnd();
    assert.equal(
      canonical,
      expected,
      "canonical serialisation changed. If deliberate, run npm run golden:update; " +
        "if this file came from the ETA toolkit, our serialiser is wrong.",
    );
  });

  test("hash matches the recorded expectation", () => {
    const path = join(goldenDir, "expected.hash.txt");
    const expected = readFileSync(path, "utf8").trim();
    assert.equal(hex, expected);
  });

  test("Arabic survives the round trip intact", () => {
    assert.ok(canonical.includes("محلات النيل للأقمشة"));
    assert.ok(canonical.includes("شيفون مطبوع 140 سم"));
  });

  test("each invoice line repeats the array property name", () => {
    const occurrences = canonical.split('"INVOICELINES"').length - 1;
    // Once for the property itself, then once per line.
    assert.equal(occurrences, 1 + GOLDEN_INVOICE.lines.length);
  });
});
