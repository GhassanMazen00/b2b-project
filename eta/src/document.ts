/**
 * Builds an ETA document from the rows our schema already holds.
 *
 * Amounts are carried as numbers rounded to 5 decimal places, matching the
 * precision the database stores and the schema expects. Rounding happens once,
 * here, so the value that is hashed is the value that is submitted.
 */
import type { JsonObject } from "./canonical.js";

export interface Issuer {
  taxRegistrationNo: string;
  name: string;
  branchCode: string;
  country: string;
  governate: string;
  regionCity: string;
  street: string;
  buildingNumber: string;
  postalCode?: string | undefined;
  activityCode?: string | undefined;
}

export interface Receiver {
  /** business = B, person = P, foreigner = F */
  type: "B" | "P" | "F";
  /** Tax registration number for a business; national id for a person. */
  id?: string | undefined;
  name: string;
  country: string;
  governate?: string | undefined;
  regionCity?: string | undefined;
  street?: string | undefined;
  buildingNumber?: string | undefined;
}

export interface LineTax {
  taxType: string;      // e.g. "T1"
  subType: string;      // e.g. "V009"
  rate: number;
  amount: number;
}

export interface InvoiceLine {
  description: string;
  itemType: "GS1" | "EGS";
  itemCode: string;
  unitType: string;     // ETA unit code, e.g. "EA", "MTR"
  quantity: number;
  unitValue: { currencySold: string; amountEGP: number; amountSold?: number | undefined; currencyExchangeRate?: number | undefined };
  salesTotal: number;
  total: number;
  valueDifference: number;
  totalTaxableFees: number;
  netTotal: number;
  itemsDiscount: number;
  discount: { rate: number; amount: number };
  taxableItems: LineTax[];
  internalCode?: string | undefined;
}

export interface DocumentInput {
  issuer: Issuer;
  receiver: Receiver;
  documentType: "I" | "C" | "D";      // Invoice, Credit note, Debit note
  documentTypeVersion: string;
  dateTimeIssued: Date;
  taxpayerActivityCode: string;
  internalId: string;
  purchaseOrderReference?: string | undefined;
  /** Required on credit and debit notes: the cleared UUID being corrected. */
  references?: string[] | undefined;
  lines: InvoiceLine[];
  totalDiscountAmount: number;
  totalSalesAmount: number;
  netAmount: number;
  totalAmount: number;
  extraDiscountAmount: number;
  totalItemsDiscountAmount: number;
  taxTotals: { taxType: string; amount: number }[];
}

/** ETA timestamps are UTC, second precision, Zulu-suffixed. */
export function formatDateTime(d: Date): string {
  return d.toISOString().replace(/\.\d{3}Z$/, "Z");
}

export function round5(n: number): number {
  return Math.round((n + Number.EPSILON) * 1e5) / 1e5;
}

/**
 * Field order below is deliberate and load-bearing: the canonical serialiser
 * walks properties in insertion order, so changing this order changes the
 * hash and therefore the signature.
 */
export function buildDocument(input: DocumentInput): JsonObject {
  return {
    issuer: {
      address: {
        branchId: input.issuer.branchCode,
        country: input.issuer.country,
        governate: input.issuer.governate,
        regionCity: input.issuer.regionCity,
        street: input.issuer.street,
        buildingNumber: input.issuer.buildingNumber,
        postalCode: input.issuer.postalCode,
      },
      type: "B",
      id: input.issuer.taxRegistrationNo,
      name: input.issuer.name,
    },
    receiver: {
      address: {
        country: input.receiver.country,
        governate: input.receiver.governate,
        regionCity: input.receiver.regionCity,
        street: input.receiver.street,
        buildingNumber: input.receiver.buildingNumber,
      },
      type: input.receiver.type,
      id: input.receiver.id,
      name: input.receiver.name,
    },
    documentType: input.documentType,
    documentTypeVersion: input.documentTypeVersion,
    dateTimeIssued: formatDateTime(input.dateTimeIssued),
    taxpayerActivityCode: input.taxpayerActivityCode,
    internalID: input.internalId,
    purchaseOrderReference: input.purchaseOrderReference,
    references: input.references,
    invoiceLines: input.lines.map((l) => ({
      description: l.description,
      itemType: l.itemType,
      itemCode: l.itemCode,
      unitType: l.unitType,
      quantity: round5(l.quantity),
      internalCode: l.internalCode,
      salesTotal: round5(l.salesTotal),
      total: round5(l.total),
      valueDifference: round5(l.valueDifference),
      totalTaxableFees: round5(l.totalTaxableFees),
      netTotal: round5(l.netTotal),
      itemsDiscount: round5(l.itemsDiscount),
      unitValue: {
        currencySold: l.unitValue.currencySold,
        amountEGP: round5(l.unitValue.amountEGP),
        amountSold:
          l.unitValue.currencySold === "EGP" ? undefined : round5(l.unitValue.amountSold ?? 0),
        currencyExchangeRate:
          l.unitValue.currencySold === "EGP"
            ? undefined
            : round5(l.unitValue.currencyExchangeRate ?? 0),
      },
      discount: { rate: round5(l.discount.rate), amount: round5(l.discount.amount) },
      taxableItems: l.taxableItems.map((t) => ({
        taxType: t.taxType,
        amount: round5(t.amount),
        subType: t.subType,
        rate: round5(t.rate),
      })),
    })),
    totalDiscountAmount: round5(input.totalDiscountAmount),
    totalSalesAmount: round5(input.totalSalesAmount),
    netAmount: round5(input.netAmount),
    taxTotals: input.taxTotals.map((t) => ({
      taxType: t.taxType,
      amount: round5(t.amount),
    })),
    totalAmount: round5(input.totalAmount),
    extraDiscountAmount: round5(input.extraDiscountAmount),
    totalItemsDiscountAmount: round5(input.totalItemsDiscountAmount),
  };
}

/**
 * Arithmetic consistency checks run before submission. The authority rejects a
 * document whose totals do not agree with its lines, and a rejection costs a
 * round trip -- cheaper to catch here.
 */
export function validateTotals(doc: DocumentInput): string[] {
  const problems: string[] = [];
  const tolerance = 0.00001;

  const lineSales = round5(doc.lines.reduce((s, l) => s + l.salesTotal, 0));
  if (Math.abs(lineSales - round5(doc.totalSalesAmount)) > tolerance) {
    problems.push(
      `totalSalesAmount ${doc.totalSalesAmount} does not match the sum of line salesTotal ${lineSales}`,
    );
  }

  const lineNet = round5(doc.lines.reduce((s, l) => s + l.netTotal, 0));
  const expectedNet = round5(lineNet - doc.extraDiscountAmount);
  if (Math.abs(expectedNet - round5(doc.netAmount)) > tolerance) {
    problems.push(
      `netAmount ${doc.netAmount} does not match line net ${lineNet} less extra discount ${doc.extraDiscountAmount}`,
    );
  }

  const taxSum = round5(doc.taxTotals.reduce((s, t) => s + t.amount, 0));
  const expectedTotal = round5(doc.netAmount + taxSum);
  if (Math.abs(expectedTotal - round5(doc.totalAmount)) > tolerance) {
    problems.push(
      `totalAmount ${doc.totalAmount} does not equal netAmount ${doc.netAmount} plus tax ${taxSum}`,
    );
  }

  for (const [i, line] of doc.lines.entries()) {
    const lineTax = round5(line.taxableItems.reduce((s, t) => s + t.amount, 0));
    const expected = round5(line.netTotal + lineTax + line.totalTaxableFees + line.valueDifference);
    if (Math.abs(expected - round5(line.total)) > tolerance) {
      problems.push(`line ${i + 1}: total ${line.total} does not equal net + tax + fees ${expected}`);
    }
  }

  if (doc.documentType !== "I" && (!doc.references || doc.references.length === 0)) {
    problems.push("a credit or debit note must reference the document it corrects");
  }

  if (doc.receiver.type === "B" && !doc.receiver.id) {
    problems.push("a business receiver must carry a tax registration number");
  }

  return problems;
}
