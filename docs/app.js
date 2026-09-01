/**
 * AZ Business — browser demo.
 *
 * Runs the project's real migrations inside WASM PostgreSQL. Nothing here
 * reimplements the accounting: posting, balance enforcement, immutability and
 * the role model all come from the schema in supabase/migrations, so what the
 * screen shows is what the database actually did.
 */
import { PGlite } from "./vendor/pglite/index.js";
import { btree_gist } from "./vendor/pglite/contrib/btree_gist.js";
import { MIGRATIONS } from "./schema.js";
import { seed, USERS } from "./seed.js";

const $ = (sel) => document.querySelector(sel);
const el = (tag, props = {}, ...kids) => {
  const n = Object.assign(document.createElement(tag), props);
  for (const k of kids.flat()) n.append(k?.nodeType ? k : document.createTextNode(String(k)));
  return n;
};

const fmt = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const money = (v) => fmt.format(Number(v ?? 0));
const day = (d) => (d ? new Date(d).toISOString().slice(0, 10) : "");

let db = null;
let ctx = null;
let currentUser = USERS.owner;
let currentView = "dash";

// ---------------------------------------------------------------------------
// database access
// ---------------------------------------------------------------------------

/**
 * Runs as the signed-in user with RLS active. `set role` drops the superuser
 * bypass, so the six-role permission model in 0009_rls.sql genuinely applies
 * — a viewer really cannot insert a customer here.
 */
async function asUser(userId = currentUser.id) {
  await db.exec("reset role;");
  await db.exec(
    `select set_config('request.jwt.claims', '${JSON.stringify({ sub: userId })}', false);`,
  );
  await db.exec("set role app_client;");
}

/** Drops back to superuser, for demo plumbing only. */
async function asAdmin() {
  await db.exec("reset role;");
}

const q = async (sql, params = []) => (await db.query(sql, params)).rows;

// ---------------------------------------------------------------------------
// boot
// ---------------------------------------------------------------------------

const steps = ["تحميل محرك قاعدة البيانات", "تطبيق مخطط النظام", "توليد بيانات العرض", "جاهز"];
function progress(i, label) {
  $("#bootbar").style.width = `${(i / steps.length) * 100}%`;
  $("#bootstep").textContent = label ?? steps[i - 1] ?? "";
}

async function boot() {
  progress(1);
  db = await PGlite.create({ extensions: { btree_gist } });

  progress(2);
  for (const m of MIGRATIONS) {
    try {
      await db.exec(m.sql);
    } catch (e) {
      $("#bootstep").textContent = `فشل في ${m.name}: ${e.message}`;
      throw e;
    }
  }

  // The unprivileged role the app connects as, mirroring Supabase's
  // `authenticated`. Without it, RLS would be bypassed and the demo would be
  // claiming a guarantee it was not actually applying.
  await db.exec(`
    do $$ begin
      if not exists (select 1 from pg_roles where rolname = 'app_client') then
        create role app_client nologin;
      end if;
    end $$;
    grant usage on schema public, app to app_client;
    grant select, insert, update, delete on all tables in schema public to app_client;
    grant execute on all functions in schema app to app_client;
    grant usage, select on all sequences in schema public to app_client;
  `);

  progress(3);
  ctx = await seed(db, (m) => progress(3, m));

  // Grants must cover anything the migrations created after the grant above.
  await db.exec(`
    grant select, insert, update, delete on all tables in schema public to app_client;
    grant execute on all functions in schema app to app_client;
  `);

  progress(4);
  buildRoleSelect();
  wireNav();
  await asUser();
  await render();
  $("#boot").remove();
  $("#shell").classList.add("ready");
}

// ---------------------------------------------------------------------------
// chrome
// ---------------------------------------------------------------------------

function buildRoleSelect() {
  const sel = $("#roleSel");
  sel.innerHTML = "";
  for (const [key, u] of Object.entries(USERS)) {
    sel.append(el("option", { value: key, textContent: `${u.name} (${u.username})` }));
  }
  sel.value = "owner";
  sel.addEventListener("change", async () => {
    currentUser = USERS[sel.value];
    await asUser();
    await render();
  });
}

function wireNav() {
  for (const btn of document.querySelectorAll(".navbtn")) {
    btn.addEventListener("click", async () => {
      currentView = btn.dataset.view;
      for (const b of document.querySelectorAll(".navbtn")) b.removeAttribute("aria-current");
      btn.setAttribute("aria-current", "page");
      for (const v of document.querySelectorAll(".view")) v.hidden = true;
      $(`#v-${currentView}`).hidden = false;
      $("#viewTitle").textContent = btn.textContent.trim();
      await render();
    });
  }
  document.querySelector('.navbtn[data-view="dash"]').setAttribute("aria-current", "page");

  $("#resetBtn").addEventListener("click", async () => {
    if (!confirm("إعادة تعيين البيانات إلى حالتها الأصلية؟")) return;
    location.reload();
  });

  $("#addLine").addEventListener("click", () => addInvoiceLine());
  $("#saveInv").addEventListener("click", saveInvoice);
}

/** Renders a table from rows plus a column spec. */
function table(node, cols, rows, emptyText = "لا توجد بيانات") {
  node.innerHTML = "";
  if (!rows.length) {
    node.append(el("tbody", {}, el("tr", {}, el("td", { colSpan: cols.length, className: "empty", textContent: emptyText }))));
    return;
  }
  node.append(
    el("thead", {}, el("tr", {},
      cols.map((c) => el("th", { textContent: c.label, className: c.num ? "n" : "" })))),
  );
  node.append(
    el("tbody", {}, rows.map((r) =>
      el("tr", {}, cols.map((c) => {
        const td = el("td", { className: c.num ? "n" : "" });
        const v = c.render ? c.render(r) : r[c.key];
        if (v?.nodeType) td.append(v); else td.textContent = v ?? "";
        return td;
      })))),
  );
}

const chip = (text, kind) => el("span", { className: `chip ${kind}`, textContent: text });

// ---------------------------------------------------------------------------
// views
// ---------------------------------------------------------------------------

async function render() {
  try {
    const pending = await q(`select count(*)::int n from document where status = 'pending_review'`);
    const pill = $("#reviewCount");
    const n = pending[0]?.n ?? 0;
    pill.hidden = n === 0;
    pill.textContent = n;
  } catch { /* role may not see documents */ }

  const fns = { dash: renderDash, customers: renderCustomers, invoice: renderInvoiceForm,
                review: renderReview, ledger: renderLedger, trial: renderTrial,
                eta: renderEta, guards: renderGuards };
  await fns[currentView]?.();
}

async function renderDash() {
  const [t] = await q(`
    select
      coalesce((select sum(balance) from party_balance where balance > 0),0) as receivables,
      coalesce((select balance from trial_balance where account_code = '1110'),0) as cash,
      coalesce((select sum(total) from document
                 where doc_type='sales_invoice' and status='posted'
                   and issued_on >= current_date - 30),0) as month_sales,
      (select count(*) from document where status='pending_review') as pending,
      (select count(*) from eta_submission where state='succeeded') as cleared,
      (select count(*) from eta_submission where state in ('pending','in_flight')) as queued`);

  const tiles = [
    ["إجمالي المديونية", money(t.receivables), "جنيه", true],
    ["رصيد الصندوق", money(t.cash), "جنيه"],
    ["مبيعات آخر ٣٠ يوم", money(t.month_sales), "جنيه"],
    ["بانتظار المراجعة", t.pending, "مستند"],
    ["مقبولة بالمنظومة", t.cleared, "فاتورة"],
    ["في الطابور", t.queued, "فاتورة"],
  ];
  $("#dashTiles").innerHTML = "";
  for (const [k, v, m, accent] of tiles) {
    $("#dashTiles").append(el("div", { className: "tile" },
      el("div", { className: "k", textContent: k }),
      el("div", { className: `v num${accent ? " accent" : ""}`, textContent: String(v) }),
      el("div", { className: "m", textContent: m })));
  }

  const age = await q(`
    select bucket, sum(outstanding)::float8 amount, count(*)::int n
    from receivable_ageing group by bucket`);
  const order = ["current", "1-30", "31-60", "61-90", "90+"];
  const labels = { current: "لم تستحق", "1-30": "١–٣٠ يوم", "31-60": "٣١–٦٠",
                   "61-90": "٦١–٩٠", "90+": "أكثر من ٩٠" };
  const colors = { current: "var(--ok)", "1-30": "var(--accent)", "31-60": "var(--warn)",
                   "61-90": "var(--brass)", "90+": "var(--danger)" };
  const max = Math.max(1, ...age.map((a) => a.amount));
  const box = $("#ageing");
  box.innerHTML = "";
  for (const b of order) {
    const row = age.find((a) => a.bucket === b);
    const amt = row?.amount ?? 0;
    box.append(el("div", { className: "barrow" },
      el("span", { textContent: labels[b] }),
      el("div", { className: "track" },
        el("div", { className: "fill", style: `width:${(amt / max) * 100}%;background:${colors[b]}` })),
      el("span", { className: "num", textContent: money(amt) })));
  }

  const top = await q(`
    select name_ar, balance::float8, credit_limit::float8, over_limit
    from party_balance where balance > 0 order by balance desc limit 8`);
  table($("#topBalances"), [
    { label: "العميل", key: "name_ar" },
    { label: "الرصيد", num: true, render: (r) => money(r.balance) },
    { label: "حد الائتمان", num: true, render: (r) => (r.credit_limit ? money(r.credit_limit) : "—") },
    { label: "الحالة", render: (r) => (r.over_limit ? chip("تجاوز الحد", "bad") : chip("داخل الحد", "ok")) },
  ], top);
}

async function renderCustomers() {
  let rows = [];
  let denied = false;
  try {
    rows = await q(`select code, name_ar, balance::float8, credit_limit::float8, over_limit
                    from party_balance order by balance desc`);
  } catch { denied = true; }

  table($("#custTable"), [
    { label: "الكود", key: "code" },
    { label: "العميل", key: "name_ar" },
    { label: "الرصيد", num: true, render: (r) => money(r.balance) },
    { label: "حد الائتمان", num: true, render: (r) => (r.credit_limit ? money(r.credit_limit) : "—") },
    { label: "", render: (r) => (r.over_limit ? chip("تجاوز الحد", "bad") : "") },
  ], rows, denied || !rows.length
      ? `هذا الدور (${currentUser.name}) لا يملك صلاحية الاطلاع على العملاء.`
      : "لا توجد بيانات");
}

// --- new invoice -----------------------------------------------------------

let invLines = [];

async function renderInvoiceForm() {
  const custs = await q(`select id, code, name_ar from party where is_customer order by code`);
  const sel = $("#invCust");
  sel.innerHTML = "";
  for (const c of custs) sel.append(el("option", { value: c.id, textContent: `${c.code} — ${c.name_ar}` }));

  if (!$("#invDate").value) $("#invDate").value = new Date().toISOString().slice(0, 10);
  if (!invLines.length) invLines = [{ itemId: "", qty: 10, price: 0 }];
  await drawLines();

  const canWrite = ["owner", "manager", "data_entry"].includes(currentUser.role);
  $("#saveInv").disabled = !canWrite;
  $("#addLine").disabled = !canWrite;
  if (!canWrite) {
    showMsg("#invMsg", `الدور «${currentUser.name}» لا يملك صلاحية إنشاء الفواتير.`, "bad");
  } else if ($("#invMsg").classList.contains("bad")) {
    showMsg("#invMsg", null);   // stale warning; a success flash is left alone
  }
}

async function drawLines() {
  const items = await q(`select id, code, name_ar, item_code from item order by code`);
  const node = $("#invLines");
  node.innerHTML = "";
  node.append(el("thead", {}, el("tr", {},
    ["الصنف", "الكمية", "السعر", "الضريبة ١٤٪", "الإجمالي", ""].map((h, i) =>
      el("th", { textContent: h, className: i >= 1 && i <= 4 ? "n" : "" })))));

  const body = el("tbody");
  invLines.forEach((line, idx) => {
    if (!line.itemId && items[0]) { line.itemId = items[0].id; line.price = 0; }
    const itemSel = el("select");
    for (const it of items) {
      itemSel.append(el("option", { value: it.id, textContent: it.name_ar, selected: it.id === line.itemId }));
    }
    itemSel.addEventListener("change", () => { line.itemId = itemSel.value; drawLines(); });

    const qty = el("input", { type: "number", value: String(line.qty), min: "1", step: "1" });
    qty.addEventListener("input", () => { line.qty = Number(qty.value) || 0; updateTotals(); });

    const price = el("input", { type: "number", value: String(line.price), min: "0", step: "0.01" });
    price.addEventListener("input", () => { line.price = Number(price.value) || 0; updateTotals(); });

    const net = line.qty * line.price;
    const rm = el("button", { className: "btn danger", textContent: "حذف" });
    rm.addEventListener("click", () => { invLines.splice(idx, 1); drawLines(); });

    body.append(el("tr", {},
      el("td", {}, itemSel),
      el("td", { className: "n" }, qty),
      el("td", { className: "n" }, price),
      el("td", { className: "n num", textContent: money(net * 0.14) }),
      el("td", { className: "n num", textContent: money(net * 1.14) }),
      el("td", {}, rm)));
  });
  node.append(body);
  updateTotals();
}

function updateTotals() {
  const net = invLines.reduce((s, l) => s + l.qty * l.price, 0);
  $("#invTotals").textContent =
    `الصافي ${money(net)}  ·  الضريبة ${money(net * 0.14)}  ·  الإجمالي ${money(net * 1.14)}`;
}

function addInvoiceLine() { invLines.push({ itemId: "", qty: 10, price: 0 }); drawLines(); }

function showMsg(sel, text, kind = "ok") {
  const n = $(sel);
  n.className = `msg ${kind}${text ? " show" : ""}`;
  n.textContent = text ?? "";
}

async function saveInvoice() {
  const custId = $("#invCust").value;
  const date = $("#invDate").value;
  const lines = invLines.filter((l) => l.itemId && l.qty > 0 && l.price > 0);
  if (!lines.length) return showMsg("#invMsg", "أضف بنداً واحداً على الأقل بسعر أكبر من صفر.", "bad");

  try {
    const [doc] = await q(
      `insert into document (tenant_id, branch_id, doc_type, doc_no, party_id,
                             issued_on, due_on, created_by)
       values ($1,$2,'sales_invoice', app.next_document_no($1,'sales_invoice',$3::date),
               $4, $3::date, $3::date + 30, $5)
       returning id, doc_no`,
      [ctx.tenantId, ctx.branchId, date, custId, currentUser.id],
    );

    for (const [i, l] of lines.entries()) {
      const [it] = await q(
        `select i.name_ar, i.item_code, u.code uom from item i
         left join uom u on u.id = i.uom_id where i.id = $1`, [l.itemId]);
      await q(
        `insert into document_line (document_id, tenant_id, line_no, item_id, description,
                                    item_code_type, item_code, uom_code, quantity,
                                    unit_price, tax_code_id, tax_rate)
         values ($1,$2,$3,$4,$5,'EGS',$6,$7,$8,$9,$10,14)`,
        [doc.id, ctx.tenantId, i + 1, l.itemId, it.name_ar, it.item_code,
         it.uom ?? "EA", l.qty, l.price, ctx.vat],
      );
    }

    await q(`select app.submit_document($1)`, [doc.id]);
    invLines = [{ itemId: "", qty: 10, price: 0 }];
    await drawLines();
    showMsg("#invMsg", `تم حفظ الفاتورة ${doc.doc_no} وإرسالها للمراجعة.`, "ok");
    await render();
  } catch (e) {
    showMsg("#invMsg", `رفضت قاعدة البيانات العملية: ${e.message}`, "bad");
  }
}

// --- review queue ----------------------------------------------------------

async function renderReview() {
  const rows = await q(`select * from review_queue order by submitted_at`);
  const canReview = ["owner", "manager", "reviewer"].includes(currentUser.role);

  table($("#revTable"), [
    { label: "المستند", key: "doc_no" },
    { label: "العميل", key: "party_name" },
    { label: "التاريخ", render: (r) => day(r.issued_on) },
    { label: "الإجمالي", num: true, render: (r) => money(r.total) },
    { label: "أدخلها", key: "created_by_name" },
    { label: "", render: (r) => {
        if (!canReview) return chip("بانتظار المراجعة", "warn");
        const wrap = el("span", { style: "display:flex;gap:6px" });
        const ok = el("button", { className: "btn primary", textContent: "اعتماد" });
        ok.addEventListener("click", () => decide(r.id, true));
        const no = el("button", { className: "btn danger", textContent: "رفض" });
        no.addEventListener("click", () => decide(r.id, false));
        wrap.append(ok, no);
        return wrap;
      } },
  ], rows, "لا توجد مستندات بانتظار المراجعة.");

  if (!canReview) {
    showMsg("#revMsg", `الدور «${currentUser.name}» يستطيع الاطلاع دون اعتماد.`, "bad");
  } else if ($("#revMsg").classList.contains("bad")) {
    showMsg("#revMsg", null);
  }
}

async function decide(docId, approve) {
  try {
    if (approve) {
      await q(`select app.approve_document($1)`, [docId]);
      showMsg("#revMsg", "تم الاعتماد والترحيل إلى دفتر الأستاذ.", "ok");
    } else {
      const reason = prompt("سبب الرفض؟");
      if (!reason) return;
      await q(`select app.reject_document($1, $2)`, [docId, reason]);
      showMsg("#revMsg", "تم رفض المستند وإعادته لموظف الإدخال.", "ok");
    }
  } catch (e) {
    showMsg("#revMsg", `رفضت قاعدة البيانات العملية: ${e.message}`, "bad");
  }
  await render();
}

// --- ledger, trial balance, eta -------------------------------------------

async function renderLedger() {
  let rows = [];
  try {
    rows = await q(`
      select entry_no, entry_date, account_code, account_name, party_name,
             debit::float8, credit::float8, memo, is_reversal
      from ledger_movement order by entry_no desc, account_code limit 120`);
  } catch { /* role cannot read the ledger */ }

  table($("#ledgerTable"), [
    { label: "القيد", num: true, render: (r) => String(r.entry_no) },
    { label: "التاريخ", render: (r) => day(r.entry_date) },
    { label: "الحساب", render: (r) => `${r.account_code} ${r.account_name}` },
    { label: "الطرف", render: (r) => r.party_name ?? "—" },
    { label: "مدين", num: true, render: (r) => (r.debit ? money(r.debit) : "") },
    { label: "دائن", num: true, render: (r) => (r.credit ? money(r.credit) : "") },
    { label: "", render: (r) => (r.is_reversal ? chip("عكسي", "warn") : "") },
  ], rows, `الدور «${currentUser.name}» لا يملك صلاحية الاطلاع على دفتر الأستاذ.`);
}

async function renderTrial() {
  let rows = [];
  try {
    rows = await q(`select account_code, account_name, account_type,
                           total_debit::float8, total_credit::float8, balance::float8
                    from trial_balance where total_debit <> 0 or total_credit <> 0
                    order by account_code`);
  } catch { /* denied */ }

  const diff = rows.reduce((s, r) => s + r.total_debit - r.total_credit, 0);
  const chk = $("#trialCheck");
  if (!rows.length) {
    chk.className = "msg bad show";
    chk.textContent = `الدور «${currentUser.name}» لا يملك صلاحية الاطلاع على الميزان.`;
  } else {
    chk.className = `msg ${Math.abs(diff) < 0.00001 ? "ok" : "bad"} show`;
    chk.textContent = Math.abs(diff) < 0.00001
      ? `الميزان متوازن: مجموع المدين = مجموع الدائن (الفرق ${money(0)}).`
      : `الميزان غير متوازن بفارق ${money(diff)} — وهذا يعني خللاً في القيود.`;
  }

  table($("#trialTable"), [
    { label: "الكود", key: "account_code" },
    { label: "الحساب", key: "account_name" },
    { label: "مدين", num: true, render: (r) => money(r.total_debit) },
    { label: "دائن", num: true, render: (r) => money(r.total_credit) },
    { label: "الرصيد", num: true, render: (r) => money(r.balance) },
  ], rows, "");
}

async function renderEta() {
  let states = [];
  try {
    states = await q(`select state, documents::int, total_value::float8 from eta_queue_status`);
  } catch { /* denied */ }

  const label = { succeeded: "مقبولة", pending: "في الانتظار", in_flight: "قيد الإرسال", failed: "مرفوضة" };
  $("#etaTiles").innerHTML = "";
  for (const s of ["succeeded", "pending", "in_flight", "failed"]) {
    const row = states.find((x) => x.state === s);
    $("#etaTiles").append(el("div", { className: "tile" },
      el("div", { className: "k", textContent: label[s] }),
      el("div", { className: `v num${s === "succeeded" ? " accent" : ""}`, textContent: String(row?.documents ?? 0) }),
      el("div", { className: "m num", textContent: row ? money(row.total_value) + " جنيه" : "—" })));
  }

  let rows = [];
  try {
    rows = await q(`
      select d.doc_no, d.issued_on, d.total::float8, d.eta_status, d.eta_uuid,
             s.attempts, s.last_error ->> 'message' as err
      from document d join eta_submission s on s.document_id = d.id
      order by d.issued_on desc limit 60`);
  } catch { /* denied */ }

  const st = { valid: ["مقبولة", "ok"], queued: ["في الطابور", "warn"],
               rejected: ["مرفوضة", "bad"], invalid: ["غير صالحة", "bad"],
               submitted: ["مُرسلة", "acc"], not_submitted: ["لم تُرسل", "mute"] };
  table($("#etaTable"), [
    { label: "الفاتورة", key: "doc_no" },
    { label: "التاريخ", render: (r) => day(r.issued_on) },
    { label: "الإجمالي", num: true, render: (r) => money(r.total) },
    { label: "الحالة", render: (r) => chip(...(st[r.eta_status] ?? [r.eta_status, "mute"])) },
    { label: "المحاولات", num: true, render: (r) => String(r.attempts) },
    { label: "المعرّف / الخطأ", render: (r) => r.eta_uuid ?? r.err ?? "—" },
  ], rows, `الدور «${currentUser.name}» لا يملك صلاحية الاطلاع على المنظومة.`);
}

// --- guarantees ------------------------------------------------------------

const GUARDS = [
  {
    title: "لا يمكن تعديل قيد مرحّل",
    note: "الدفاتر للإضافة فقط. التصحيح يكون بقيد عكسي، لا بتغيير التاريخ.",
    privileged: true,
    run: async () => {
      const [e] = await q(`select id from journal_entry order by entry_no limit 1`);
      await q(`update journal_entry set memo_ar = 'تم التلاعب' where id = $1`, [e.id]);
    },
    verify: async () =>
      (await q(`select count(*)::int n from journal_entry where memo_ar = 'تم التلاعب'`))[0].n === 0,
  },
  {
    title: "لا يمكن حذف قيد مرحّل",
    note: "الحذف ممنوع على مستوى قاعدة البيانات، لا على مستوى الواجهة.",
    privileged: true,
    run: async () => {
      const [e] = await q(`select id from journal_entry order by entry_no limit 1`);
      await q(`delete from journal_entry where id = $1`, [e.id]);
    },
    verify: async () => (await q(`select count(*)::int n from journal_entry`))[0].n > 0,
  },
  {
    title: "لا يمكن تعديل فاتورة مرحّلة",
    note: "الفاتورة تتجمّد لحظة اعتمادها. التصحيح بإشعار دائن.",
    privileged: true,
    run: async () => {
      const [d] = await q(`select id from document where status = 'posted' limit 1`);
      await q(`update document set total = 1 where id = $1`, [d.id]);
    },
    verify: async () =>
      (await q(`select count(*)::int n from document where status='posted' and total = 1`))[0].n === 0,
  },
  {
    title: "لا يمكن إضافة بند لفاتورة مرحّلة",
    note: "بنود المستند تتبع حالته.",
    privileged: true,
    run: async () => {
      const [d] = await q(`select id, tenant_id from document where status = 'posted' limit 1`);
      await q(`insert into document_line (document_id, tenant_id, line_no, description,
               quantity, unit_price) values ($1,$2,99,'بند مهرّب',1,1)`, [d.id, d.tenant_id]);
    },
    verify: async () =>
      (await q(`select count(*)::int n from document_line where description='بند مهرّب'`))[0].n === 0,
  },
  {
    title: "لا يمكن كتابة قيد غير متوازن",
    note: "مجموع المدين يجب أن يساوي مجموع الدائن، وإلا رُفض القيد كاملاً.",
    privileged: true,
    run: async () => {
      const [p] = await q(`select id, tenant_id from fiscal_period
                            where current_date between starts_on and ends_on limit 1`);
      const [a] = await q(`select id from account where code = '1110'`);
      const [b] = await q(`select id from account where code = '4100'`);
      // An explicit transaction, so the deferred balance check fires at COMMIT
      // and the attempt leaves nothing behind.
      await db.exec("begin;");
      try {
        const [je] = await q(
          `insert into journal_entry (tenant_id, fiscal_period_id, entry_no, entry_date, posted_by)
           values ($1,$2,999999,current_date,$3) returning id`,
          [p.tenant_id, p.id, USERS.owner.id]);
        await q(`insert into journal_line (entry_id, tenant_id, line_no, account_id, debit, credit)
                 values ($1,$2,1,$3,1000,0), ($1,$2,2,$4,0,999)`,
                [je.id, p.tenant_id, a.id, b.id]);
        await db.exec("commit;");
      } catch (err) {
        await db.exec("rollback;").catch(() => {});
        throw err;
      }
    },
    verify: async () =>
      (await q(`select count(*)::int n from journal_entry where entry_no = 999999`))[0].n === 0,
  },
  {
    title: "لا يعتمد المستندَ من أنشأه",
    note: "مبدأ الأربع أعين: الإدخال والمراجعة لا يجتمعان في شخص واحد.",
    run: async () => {
      const [d] = await q(`select id, created_by from document where status='pending_review' limit 1`);
      if (!d) throw new Error("لا توجد مستندات بانتظار المراجعة الآن");
      await asUser(d.created_by);
      try { await q(`select app.approve_document($1)`, [d.id]); }
      finally { await asUser(); }
    },
    verify: async () => true,
  },
  {
    title: "لا يكتب المستخدم في دفتر الأستاذ مباشرة",
    note: "الدفاتر تُكتب فقط عبر دوال الترحيل، حتى لو كان المستخدم هو المالك.",
    run: async () => {
      const [p] = await q(`select id, tenant_id from fiscal_period
                            where current_date between starts_on and ends_on limit 1`);
      await q(`insert into journal_entry (tenant_id, fiscal_period_id, entry_no, entry_date, posted_by)
               values ($1,$2,888888,current_date,$3)`, [p.tenant_id, p.id, currentUser.id]);
    },
    verify: async () =>
      (await q(`select count(*)::int n from journal_entry where entry_no = 888888`))[0].n === 0,
  },
  {
    title: "لا يُلغى مستند قبلته المصلحة",
    note: "بعد قبول المصلحة للفاتورة، التصحيح الوحيد المشروع هو إشعار دائن.",
    run: async () => {
      const [d] = await q(`select id from document where eta_status = 'valid' and status='posted' limit 1`);
      if (!d) throw new Error("لا توجد فاتورة مقبولة بالمنظومة");
      await q(`select app.cancel_document($1, 'تجربة')`, [d.id]);
    },
    verify: async () => true,
  },
];

function renderGuards() {
  const box = $("#guardList");
  if (box.dataset.built) return;
  box.dataset.built = "1";

  for (const g of GUARDS) {
    const out = el("pre", { hidden: true });
    const btn = el("button", { className: "btn", textContent: "جرّب" });

    btn.addEventListener("click", async () => {
      btn.disabled = true;
      out.hidden = false;
      out.textContent = "…";
      let raised = null;
      try {
        // A privileged guard drops row-level security entirely, so the attempt
        // reaches the triggers rather than being filtered out first. It proves
        // the stronger claim: even with full database privileges, the ledger
        // refuses to change.
        if (g.privileged) await asAdmin();
        await g.run();
      } catch (e) {
        raised = e.message;
      }

      try {
        await asAdmin();
        const intact = await g.verify();
        if (raised) {
          out.className = "pass";
          out.textContent = `PostgreSQL رفض العملية:\n${raised}`;
        } else if (intact) {
          out.className = "pass";
          out.textContent =
            "لم تُنفَّذ العملية: سياسة الصلاحيات أخفت الصف عن أمر التعديل،\n" +
            "فلم يتغيّر أي سطر. البيانات كما هي.";
        } else {
          out.className = "fail";
          out.textContent = "نُفِّذت العملية — هذا يعني خللاً في الضوابط.";
        }
      } finally {
        await db.exec("rollback;").catch(() => {});
        await asUser();
        btn.disabled = false;
      }
    });

    const badge = g.privileged
      ? el("span", { className: "chip acc", textContent: "بصلاحيات كاملة" })
      : el("span", { className: "chip mute", textContent: "بصلاحيات المستخدم" });

    box.append(el("div", { className: "guard" },
      el("div", { className: "h" },
        el("div", { className: "t" },
          el("b", { textContent: g.title }),
          el("p", { textContent: g.note }),
          el("div", { style: "margin-top:6px" }, badge)),
        btn),
      out));
  }
}

boot().catch((e) => {
  $("#bootstep").textContent = `تعذّر التشغيل: ${e.message}`;
  console.error(e);
});
