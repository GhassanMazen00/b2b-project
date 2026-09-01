/**
 * A representative document used as the conformance fixture.
 *
 * Deliberately exercises the parts of the serialisation most likely to differ
 * from the authority's implementation: Arabic text, an array of lines, an
 * array of taxes nested inside each line, an empty optional array, a decimal
 * amount, and a receiver with optional address fields.
 */
import type { DocumentInput } from "./document.js";

export const GOLDEN_INVOICE: DocumentInput = {
  issuer: {
    taxRegistrationNo: "123456789",
    name: "أ ز للمنسوجات",
    branchCode: "MAIN",
    country: "EG",
    governate: "القاهرة",
    regionCity: "القاهرة",
    street: "شارع الجمهورية",
    buildingNumber: "15",
    postalCode: "11511",
    activityCode: "4641",
  },
  receiver: {
    type: "B",
    id: "987654321",
    name: "محلات النيل للأقمشة",
    country: "EG",
    governate: "الجيزة",
    regionCity: "الدقي",
    street: "شارع التحرير",
    buildingNumber: "42",
  },
  documentType: "I",
  documentTypeVersion: "1.0",
  dateTimeIssued: new Date("2026-09-01T10:30:00.000Z"),
  taxpayerActivityCode: "4641",
  internalId: "INV-2026-000001",
  references: undefined,
  lines: [
    {
      description: "شيفون مطبوع 140 سم",
      itemType: "EGS",
      itemCode: "EG-123456789-F100",
      unitType: "MTR",
      quantity: 100,
      unitValue: { currencySold: "EGP", amountEGP: 95 },
      salesTotal: 9500,
      total: 10830,
      valueDifference: 0,
      totalTaxableFees: 0,
      netTotal: 9500,
      itemsDiscount: 0,
      discount: { rate: 0, amount: 0 },
      taxableItems: [{ taxType: "T1", subType: "V009", rate: 14, amount: 1330 }],
    },
    {
      description: "دنيم ستريتش 150 سم",
      itemType: "EGS",
      itemCode: "EG-123456789-F200",
      unitType: "MTR",
      quantity: 50,
      unitValue: { currencySold: "EGP", amountEGP: 265 },
      salesTotal: 13250,
      total: 15105,
      valueDifference: 0,
      totalTaxableFees: 0,
      netTotal: 13250,
      itemsDiscount: 0,
      discount: { rate: 0, amount: 0 },
      taxableItems: [{ taxType: "T1", subType: "V009", rate: 14, amount: 1855 }],
    },
  ],
  totalDiscountAmount: 0,
  totalSalesAmount: 22750,
  netAmount: 22750,
  totalAmount: 25935,
  extraDiscountAmount: 0,
  totalItemsDiscountAmount: 0,
  taxTotals: [{ taxType: "T1", amount: 3185 }],
};
