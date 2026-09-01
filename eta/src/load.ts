/**
 * Reads a posted document out of our schema and shapes it for the authority.
 *
 * Every amount comes from the database rather than being recomputed here, so
 * what is signed matches what the ledger posted. The only arithmetic is
 * per-line aggregation the schema does not store.
 */
import type { Pool } from "pg";
import type { DocumentInput, InvoiceLine } from "./document.js";
import { EtaError } from "./client.js";

/**
 * A problem with the document's own data. Retrying cannot fix it -- someone
 * has to correct the record -- so it is raised as permanent and the queue
 * stops rather than burning the attempt budget over the next hour.
 */
function dataProblem(message: string, details?: unknown): EtaError {
  return new EtaError(message, 0, details, true);
}

const DOC_TYPE_MAP: Record<string, "I" | "C" | "D"> = {
  sales_invoice: "I",
  sales_credit_note: "C",
  sales_debit_note: "D",
};

interface DocRow {
  id: string;
  doc_type: string;
  doc_no: string;
  issued_on: Date;
  posted_at: Date;
  currency: string;
  fx_rate: string;
  subtotal: string;
  discount_total: string;
  tax_total: string;
  total: string;
  corrects_eta_uuid: string | null;
  issuer_trn: string;
  issuer_name: string;
  branch_code: string;
  branch_country: string;
  branch_governorate: string | null;
  branch_city: string | null;
  branch_street: string | null;
  branch_building: string | null;
  branch_postal: string | null;
  branch_activity: string | null;
  receiver_type: string;
  receiver_trn: string | null;
  receiver_national_id: string | null;
  receiver_name: string;
  receiver_country: string;
  receiver_governorate: string | null;
  receiver_city: string | null;
  receiver_street: string | null;
  receiver_building: string | null;
}

interface LineRow {
  line_no: number;
  description: string;
  item_code_type: string | null;
  item_code: string | null;
  uom_code: string | null;
  quantity: string;
  unit_price: string;
  discount: string;
  tax_rate: string;
  tax_amount: string;
  line_total: string;
  eta_tax_type: string | null;
  eta_subtype: string | null;
}

const n = (v: string | null | undefined): number => Number(v ?? 0);

export async function loadDocumentInput(pool: Pool, documentId: string): Promise<DocumentInput> {
  const docRes = await pool.query<DocRow>(
    `select
       d.id, d.doc_type::text, d.doc_no, d.issued_on, d.posted_at,
       d.currency, d.fx_rate, d.subtotal, d.discount_total, d.tax_total, d.total,
       corrected.eta_uuid            as corrects_eta_uuid,
       t.tax_registration_no         as issuer_trn,
       t.legal_name_ar               as issuer_name,
       b.code                        as branch_code,
       b.country                     as branch_country,
       b.governorate                 as branch_governorate,
       b.city                        as branch_city,
       b.street                      as branch_street,
       b.building_no                 as branch_building,
       b.postal_code                 as branch_postal,
       b.activity_code               as branch_activity,
       p.party_type::text            as receiver_type,
       p.tax_registration_no         as receiver_trn,
       p.national_id                 as receiver_national_id,
       p.name_ar                     as receiver_name,
       p.country                     as receiver_country,
       p.governorate                 as receiver_governorate,
       p.city                        as receiver_city,
       p.street                      as receiver_street,
       p.building_no                 as receiver_building
     from document d
     join tenant t          on t.id = d.tenant_id
     join branch b          on b.id = d.branch_id
     join party  p          on p.id = d.party_id
     left join document corrected on corrected.id = d.corrects_doc_id
     where d.id = $1`,
    [documentId],
  );

  const doc = docRes.rows[0];
  if (!doc) throw dataProblem(`document ${documentId} not found`);

  if (!doc.issuer_trn) {
    throw dataProblem(
      "the company has no tax registration number; it cannot issue e-invoices yet",
    );
  }

  const documentType = DOC_TYPE_MAP[doc.doc_type];
  if (!documentType) {
    throw dataProblem(`document type ${doc.doc_type} is not submitted to the authority`);
  }

  const linesRes = await pool.query<LineRow>(
    `select
       dl.line_no, dl.description, dl.item_code_type, dl.item_code, dl.uom_code,
       dl.quantity, dl.unit_price, dl.discount, dl.tax_rate, dl.tax_amount,
       dl.line_total,
       tc.eta_tax_type, tc.eta_subtype
     from document_line dl
     left join tax_code tc on tc.id = dl.tax_code_id
     where dl.document_id = $1
     order by dl.line_no`,
    [documentId],
  );

  const lines: InvoiceLine[] = linesRes.rows.map((r) => {
    const gross = n(r.quantity) * n(r.unit_price);
    const net = gross - n(r.discount);
    const taxes =
      n(r.tax_amount) === 0 && !r.eta_tax_type
        ? []
        : [
            {
              taxType: r.eta_tax_type ?? "T1",
              subType: r.eta_subtype ?? "V009",
              rate: n(r.tax_rate),
              amount: n(r.tax_amount),
            },
          ];

    return {
      description: r.description,
      itemType: (r.item_code_type as "GS1" | "EGS") ?? "EGS",
      itemCode: r.item_code ?? "",
      unitType: r.uom_code ?? "EA",
      quantity: n(r.quantity),
      unitValue: {
        currencySold: doc.currency,
        amountEGP: n(r.unit_price),
        amountSold: doc.currency === "EGP" ? undefined : n(r.unit_price),
        currencyExchangeRate: doc.currency === "EGP" ? undefined : n(doc.fx_rate),
      },
      salesTotal: gross,
      total: n(r.line_total),
      valueDifference: 0,
      totalTaxableFees: 0,
      netTotal: net,
      itemsDiscount: 0,
      discount: { rate: 0, amount: n(r.discount) },
      taxableItems: taxes,
      internalCode: undefined,
    };
  });

  const missingCodes = lines.filter((l) => !l.itemCode).length;
  if (missingCodes > 0) {
    throw dataProblem(
      `${missingCodes} line(s) have no GS1 or EGS item code. ` +
        "The authority rejects documents whose items are not coded.",
      { missingCodes },
    );
  }

  if (documentType !== "I" && !doc.corrects_eta_uuid) {
    throw dataProblem(
      "a credit or debit note must reference a cleared invoice, but the " +
        "document it corrects has no ETA uuid yet",
    );
  }

  // Tax totals are grouped by type, as the authority expects.
  const byType = new Map<string, number>();
  for (const line of lines) {
    for (const t of line.taxableItems) {
      byType.set(t.taxType, (byType.get(t.taxType) ?? 0) + t.amount);
    }
  }

  return {
    issuer: {
      taxRegistrationNo: doc.issuer_trn,
      name: doc.issuer_name,
      branchCode: doc.branch_code,
      country: doc.branch_country,
      governate: doc.branch_governorate ?? "",
      regionCity: doc.branch_city ?? "",
      street: doc.branch_street ?? "",
      buildingNumber: doc.branch_building ?? "",
      postalCode: doc.branch_postal ?? undefined,
      activityCode: doc.branch_activity ?? undefined,
    },
    receiver: {
      type: doc.receiver_type === "business" ? "B" : doc.receiver_type === "person" ? "P" : "F",
      id: doc.receiver_trn ?? doc.receiver_national_id ?? undefined,
      name: doc.receiver_name,
      country: doc.receiver_country,
      governate: doc.receiver_governorate ?? undefined,
      regionCity: doc.receiver_city ?? undefined,
      street: doc.receiver_street ?? undefined,
      buildingNumber: doc.receiver_building ?? undefined,
    },
    documentType,
    documentTypeVersion: "1.0",
    dateTimeIssued: doc.posted_at ?? doc.issued_on,
    taxpayerActivityCode: doc.branch_activity ?? "",
    internalId: doc.doc_no,
    purchaseOrderReference: undefined,
    references: doc.corrects_eta_uuid ? [doc.corrects_eta_uuid] : undefined,
    lines,
    totalDiscountAmount: n(doc.discount_total),
    totalSalesAmount: n(doc.subtotal),
    netAmount: n(doc.subtotal) - n(doc.discount_total),
    totalAmount: n(doc.total),
    extraDiscountAmount: 0,
    totalItemsDiscountAmount: 0,
    taxTotals: [...byType.entries()].map(([taxType, amount]) => ({ taxType, amount })),
  };
}
