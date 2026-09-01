import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { canonicalize } from "../src/canonical.js";
import { hashDocument } from "../src/hash.js";

describe("canonical serialisation", () => {
  test("uppercases property names", () => {
    assert.equal(canonicalize({ documentType: "I" }), '"DOCUMENTTYPE""I"');
  });

  test("omits null and undefined members", () => {
    assert.equal(
      canonicalize({ a: "1", b: null, c: undefined, d: "2" }),
      '"A""1""D""2"',
    );
  });

  test("quotes numbers and booleans as text", () => {
    assert.equal(canonicalize({ total: 100.5, flag: true }), '"TOTAL""100.5""FLAG""true"');
  });

  test("flattens nested objects without punctuation", () => {
    assert.equal(
      canonicalize({ issuer: { id: "123", name: "شركة" } }),
      '"ISSUER""ID""123""NAME""شركة"',
    );
  });

  test("repeats the property name for each array element", () => {
    // The rule most often got wrong: name once, then name again per element.
    assert.equal(
      canonicalize({ taxTotals: [{ amount: 1 }, { amount: 2 }] }),
      '"TAXTOTALS""TAXTOTALS""AMOUNT""1""TAXTOTALS""AMOUNT""2"',
    );
  });

  test("emits an empty array as its name alone", () => {
    assert.equal(canonicalize({ references: [] }), '"REFERENCES"');
  });

  test("excludes the signatures property", () => {
    assert.equal(
      canonicalize({ a: "1", signatures: [{ value: "x" }] }),
      '"A""1"',
    );
  });

  test("escapes quotes and backslashes in values", () => {
    assert.equal(canonicalize({ name: 'a"b\\c' }), '"NAME""a\\"b\\\\c"');
  });

  test("is insensitive to whitespace and key case in the input", () => {
    const a = canonicalize({ documentType: "I", totalAmount: 100 });
    const b = canonicalize({ DOCUMENTTYPE: "I", TOTALAMOUNT: 100 });
    assert.equal(a, b);
  });

  test("is sensitive to property order, as the approach requires", () => {
    const a = canonicalize({ x: "1", y: "2" });
    const b = canonicalize({ y: "2", x: "1" });
    assert.notEqual(a, b);
  });
});

describe("hashing", () => {
  test("produces a 64-character uppercase hex digest", () => {
    const { hex } = hashDocument({ documentType: "I" });
    assert.match(hex, /^[0-9A-F]{64}$/);
  });

  test("is stable across calls", () => {
    const doc = { documentType: "I", totalAmount: 1150.5 };
    assert.equal(hashDocument(doc).hex, hashDocument(doc).hex);
  });

  test("changes when any value changes", () => {
    const a = hashDocument({ totalAmount: 100 }).hex;
    const b = hashDocument({ totalAmount: 100.01 }).hex;
    assert.notEqual(a, b);
  });

  test("ignores the signatures block", () => {
    const bare = hashDocument({ a: "1" }).hex;
    const signed = hashDocument({ a: "1", signatures: [{ value: "sig" }] }).hex;
    assert.equal(bare, signed, "signing must not change the hash it signs");
  });

  test("matches the UTF-8 SHA-256 of the canonical string", () => {
    // Guards against an encoding regression on Arabic text.
    const doc = { name: "محلات النيل للأقمشة" };
    const { canonical, hex } = hashDocument(doc);
    const expected = createHash("sha256")
      .update(Buffer.from(canonical, "utf8"))
      .digest("hex")
      .toUpperCase();
    assert.equal(hex, expected);
  });
});
