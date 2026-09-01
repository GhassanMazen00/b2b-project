// Demo data. Everything below goes through the real workflow functions --
// app.submit_document, app.approve_document -- so every balance on screen was
// produced by the same posting engine the production schema uses.

export const USERS = {
  owner:    { id: "11111111-1111-1111-1111-111111111111", username: "manager", name: "المدير",        role: "owner" },
  reviewer: { id: "33333333-3333-3333-3333-333333333333", username: "worker2", name: "المراجِع",      role: "reviewer" },
  entry:    { id: "22222222-2222-2222-2222-222222222222", username: "worker1", name: "موظف الإدخال",  role: "data_entry" },
  super:    { id: "66666666-6666-6666-6666-666666666666", username: "worker0", name: "المشرف",        role: "supervisor" },
  viewer:   { id: "44444444-4444-4444-4444-444444444444", username: "worker3", name: "مطّلِع",         role: "viewer" },
  invoiced: { id: "55555555-5555-5555-5555-555555555555", username: "worker4", name: "عرض الفواتير",  role: "invoice_viewer" },
};

const CUSTOMERS = [
  ["C001", "محلات النيل للأقمشة",    "123456789", 800000],
  ["C002", "شركة الدلتا للمنسوجات",  "234567891", 700000],
  ["C003", "مصنع الحرير الحديث",     "345678912", 900000],
  ["C004", "بازار خان الخليلي",       "456789123", 500000],
  ["C005", "أقمشة المعادي",          "567891234", 450000],
  ["C006", "تجارة الجملة - العتبة",   "678912345", 600000],
];

const ITEMS = [
  ["F100", "شيفون مطبوع 140 سم",  "EG-123456789-F100", "MTR",  95],
  ["F200", "دنيم ستريتش 150 سم",  "EG-123456789-F200", "MTR", 265],
  ["F300", "قطن مصري 160 سم",     "EG-123456789-F300", "MTR", 180],
  ["F400", "كتان طبيعي 140 سم",   "EG-123456789-F400", "MTR", 320],
  ["F500", "حرير صناعي 120 سم",   "EG-123456789-F500", "MTR", 145],
];

/** Deterministic generator, so the demo looks identical at every showing. */
function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

const q = (sql, params) => ({ sql, params });

export async function seed(db, log = () => {}) {
  const rnd = seededRandom(20260901);
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
  const between = (a, b) => a + Math.floor(rnd() * (b - a + 1));

  const act = async (userId) =>
    db.exec(
      `select set_config('request.jwt.claims', '${JSON.stringify({ sub: userId })}', false);`,
    );

  log("تجهيز الشركة…");
  await act(USERS.owner.id);

  const year = new Date().getFullYear();
  const t = await db.query(
    `select app.provision_tenant($1, $2, $3, 'manager', 'المدير', $4) as id`,
    ["AZ Textiles", "أ ز للمنسوجات", USERS.owner.id, year],
  );
  const tenantId = t.rows[0].id;

  await db.query(
    `update tenant set tax_registration_no = '123456789', commercial_reg_no = '45821'
      where id = $1`,
    [tenantId],
  );

  const b = await db.query(
    `update branch set governorate = 'القاهرة', city = 'القاهرة',
            street = 'شارع الجمهورية', building_no = '15',
            postal_code = '11511', activity_code = '4641'
      where tenant_id = $1 returning id`,
    [tenantId],
  );
  const branchId = b.rows[0].id;

  log("إضافة المستخدمين…");
  for (const u of [USERS.reviewer, USERS.entry, USERS.super, USERS.viewer, USERS.invoiced]) {
    await db.query(
      `insert into app_user (id, tenant_id, branch_id, username, full_name, role,
                             is_approved, approved_by, approved_at)
       values ($1, $2, $3, $4, $5, $6::app.user_role, true, $7, now())`,
      [u.id, tenantId, branchId, u.username, u.name, u.role, USERS.owner.id],
    );
  }

  log("إضافة العملاء والأصناف…");
  const vat = (
    await db.query(`select id from tax_code where tenant_id = $1 and code = 'VAT14'`, [tenantId])
  ).rows[0].id;

  const customerIds = [];
  for (const [code, name, trn, limit] of CUSTOMERS) {
    const r = await db.query(
      `insert into party (tenant_id, code, name_ar, party_type, tax_registration_no,
                          country, governorate, city, credit_limit)
       values ($1,$2,$3,'business',$4,'EG','القاهرة','القاهرة',$5) returning id`,
      [tenantId, code, name, trn, limit],
    );
    customerIds.push(r.rows[0].id);
  }

  const itemIds = [];
  for (const [code, name, etaCode, uom, price] of ITEMS) {
    const uomId = (
      await db.query(`select id from uom where tenant_id = $1 and code = $2`, [tenantId, uom])
    ).rows[0].id;
    const r = await db.query(
      `insert into item (tenant_id, code, name_ar, uom_id, item_code_type, item_code,
                         default_tax_code_id)
       values ($1,$2,$3,$4,'EGS',$5,$6) returning id`,
      [tenantId, code, name, uomId, etaCode, vat],
    );
    itemIds.push({ id: r.rows[0].id, price, name, uom, code: etaCode });
  }

  // --- posted history -------------------------------------------------------
  log("ترحيل الفواتير…");
  const today = new Date();
  const postedInvoices = [];

  for (let d = 150; d >= 0; d -= 1) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    if (date.getDay() === 5) continue;              // الجمعة عطلة
    if (rnd() > 0.5) continue;

    const count = between(1, 2);
    for (let k = 0; k < count; k += 1) {
      const customer = pick(customerIds);
      const iso = date.toISOString().slice(0, 10);

      await act(USERS.entry.id);
      const doc = await db.query(
        `insert into document (tenant_id, branch_id, doc_type, doc_no, party_id,
                               issued_on, due_on, created_by)
         values ($1,$2,'sales_invoice', app.next_document_no($1,'sales_invoice',$3::date),
                 $4, $3::date, $3::date + 30, $5)
         returning id`,
        [tenantId, branchId, iso, customer, USERS.entry.id],
      );
      const docId = doc.rows[0].id;

      const lineCount = between(1, 3);
      for (let i = 1; i <= lineCount; i += 1) {
        const item = pick(itemIds);
        await db.query(
          `insert into document_line (document_id, tenant_id, line_no, item_id,
                                      description, item_code_type, item_code, uom_code,
                                      quantity, unit_price, tax_code_id, tax_rate)
           values ($1,$2,$3,$4,$5,'EGS',$6,$7,$8,$9,$10,14)`,
          [docId, tenantId, i, item.id, item.name, item.code, item.uom,
           between(20, 150), item.price, vat],
        );
      }

      await db.query(`select app.submit_document($1)`, [docId]);
      await act(USERS.reviewer.id);
      await db.query(`select app.approve_document($1)`, [docId]);
      postedInvoices.push({ id: docId, customer, date: iso });
    }
  }

  // --- receipts against roughly half of them --------------------------------
  log("تسجيل المقبوضات…");
  for (const inv of postedInvoices) {
    if (rnd() > 0.5) continue;
    const total = (
      await db.query(`select total from document where id = $1`, [inv.id])
    ).rows[0].total;
    const amount = Math.round(Number(total) * (rnd() > 0.4 ? 1 : 0.5) * 100) / 100;
    if (amount <= 0) continue;

    const payDate = new Date(inv.date);
    payDate.setDate(payDate.getDate() + between(3, 25));
    if (payDate > today) continue;
    const iso = payDate.toISOString().slice(0, 10);

    await act(USERS.entry.id);
    const r = await db.query(
      `insert into document (tenant_id, branch_id, doc_type, doc_no, party_id,
                             issued_on, created_by)
       values ($1,$2,'receipt', app.next_document_no($1,'receipt',$3::date), $4, $3::date, $5)
       returning id`,
      [tenantId, branchId, iso, inv.customer, USERS.entry.id],
    );
    await db.query(
      `insert into document_line (document_id, tenant_id, line_no, description,
                                  quantity, unit_price)
       values ($1,$2,1,'دفعة تحت الحساب',1,$3)`,
      [r.rows[0].id, tenantId, amount],
    );
    await db.query(`select app.submit_document($1)`, [r.rows[0].id]);
    await act(USERS.reviewer.id);
    await db.query(`select app.approve_document($1)`, [r.rows[0].id]);
    await db.query(
      `insert into settlement (tenant_id, receipt_id, invoice_id, amount) values ($1,$2,$3,$4)`,
      [tenantId, r.rows[0].id, inv.id, amount],
    );
  }

  // --- three drafts left waiting for the reviewer ---------------------------
  log("تجهيز قائمة المراجعة…");
  await act(USERS.entry.id);
  for (let i = 0; i < 3; i += 1) {
    const doc = await db.query(
      `insert into document (tenant_id, branch_id, doc_type, doc_no, party_id,
                             issued_on, due_on, created_by)
       values ($1,$2,'sales_invoice', app.next_document_no($1,'sales_invoice'),
               $3, current_date, current_date + 30, $4)
       returning id`,
      [tenantId, branchId, pick(customerIds), USERS.entry.id],
    );
    const item = pick(itemIds);
    await db.query(
      `insert into document_line (document_id, tenant_id, line_no, item_id, description,
                                  item_code_type, item_code, uom_code, quantity,
                                  unit_price, tax_code_id, tax_rate)
       values ($1,$2,1,$3,$4,'EGS',$5,$6,$7,$8,$9,14)`,
      [doc.rows[0].id, tenantId, item.id, item.name, item.code, item.uom,
       between(30, 120), item.price, vat],
    );
    await db.query(`select app.submit_document($1)`, [doc.rows[0].id]);
  }

  // --- a slice of the ETA queue already cleared -----------------------------
  log("محاكاة منظومة الفاتورة الإلكترونية…");
  await act(USERS.owner.id);
  const queued = await db.query(
    `select s.id, s.document_id from eta_submission s
      where s.tenant_id = $1 and s.state = 'pending' order by s.created_at limit 200`,
    [tenantId],
  );
  for (const [i, row] of queued.rows.entries()) {
    if (i % 7 === 3) continue;                                  // still pending
    if (i % 11 === 5) {
      await db.query(`select app.claim_eta_submissions('demo-worker', 1)`);
      await db.query(
        `select app.fail_eta_submission($1, $2::jsonb, false)`,
        [row.id, JSON.stringify({ message: "انقطاع الاتصال بالمنظومة", code: "ETIMEDOUT" })],
      );
      continue;
    }
    await db.query(`update eta_submission set state='in_flight', attempts=attempts+1 where id=$1`, [row.id]);
    await db.query(`select app.complete_eta_submission($1,$2,$3,$4::jsonb)`, [
      row.id,
      "UUID-" + row.document_id.slice(0, 8).toUpperCase(),
      "LONG-" + row.document_id.slice(0, 12).toUpperCase(),
      JSON.stringify({ status: "Valid" }),
    ]);
  }

  await act(USERS.owner.id);
  log("جاهز");
  return { tenantId, branchId, customerIds, itemIds, vat };
}
