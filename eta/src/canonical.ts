/**
 * ETA canonical serialisation.
 *
 * ┌───────────────────────────────────────────────────────────────────────┐
 * │  UNVERIFIED AGAINST THE AUTHORITY'S SPECIFICATION.                    │
 * │                                                                       │
 * │  sdk.invoicing.eta.gov.eg was unreachable from the environment this   │
 * │  was written in, so the rules below are a best reading of the         │
 * │  published approach rather than a transcription of it.                │
 * │                                                                       │
 * │  Everything downstream of this file -- hashing, signing, submission,  │
 * │  the queue -- is independent of these rules and is verified. This is  │
 * │  the single module to check against the official specification, or    │
 * │  better, against the ETA integration toolkit's own output, before     │
 * │  anything is submitted for real.                                      │
 * │                                                                       │
 * │  test/golden/ holds a conformance harness currently seeded with our   │
 * │  own output. Replace those files with toolkit output and the tests    │
 * │  become a real check instead of a regression guard.                   │
 * └───────────────────────────────────────────────────────────────────────┘
 *
 * The approach exists so that whitespace and key ordering introduced in
 * transit cannot change a signature: only field names and values are fed to
 * the hash, never the JSON punctuation around them.
 *
 * Rules as implemented:
 *   1. Property names are emitted uppercased (invariant culture) and quoted.
 *   2. String values are emitted quoted, with JSON escaping.
 *   3. Non-string scalars are emitted as their JSON text, quoted.
 *   4. Objects are emitted as the concatenation of their serialised members.
 *   5. For an array property, the property name is emitted once, then for
 *      every element the property name is emitted AGAIN followed by that
 *      element's serialisation. This repetition is the rule most often got
 *      wrong, and the reason a mismatched hash is so hard to diagnose.
 *   6. The `signatures` property is excluded -- it carries the result.
 *   7. `null` and `undefined` members are omitted entirely.
 */

/** Property names never included in the material to be signed. */
const EXCLUDED = new Set(["SIGNATURES"]);

export type Json =
  | string
  | number
  | boolean
  | null
  | Json[]
  | { [k: string]: Json | undefined };

export type JsonObject = { [k: string]: Json | undefined };

/** JSON string escaping, applied to names and string values alike. */
function quote(raw: string): string {
  return JSON.stringify(raw);
}

function serializeScalarOrObject(value: Exclude<Json, undefined>): string {
  if (value === null) return "";

  if (Array.isArray(value)) {
    throw new Error("nested arrays are not part of the ETA document schema");
  }

  if (typeof value === "object") return serializeObject(value);
  if (typeof value === "string") return quote(value);

  // Numbers and booleans are serialised as their textual form, quoted.
  return quote(String(value));
}

function serializeMember(name: string, value: Json | undefined): string {
  if (value === undefined || value === null) return "";

  const upper = name.toUpperCase();
  if (EXCLUDED.has(upper)) return "";

  const key = quote(upper);

  if (Array.isArray(value)) {
    // Rule 5: name once, then name + element for each entry.
    let out = key;
    for (const element of value) {
      out += key + serializeScalarOrObject(element);
    }
    return out;
  }

  return key + serializeScalarOrObject(value);
}

function serializeObject(obj: JsonObject): string {
  let out = "";
  // Insertion order is preserved deliberately: the document builder emits
  // fields in the order the schema documents them.
  for (const [name, value] of Object.entries(obj)) {
    out += serializeMember(name, value);
  }
  return out;
}

/** Produces the canonical string for a document, ready to be hashed. */
export function canonicalize(document: JsonObject): string {
  return serializeObject(document);
}
