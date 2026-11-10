/* Axiom — the live system, pricing, reveals.
   The system on the page is a real one: state in memory, every button changes
   it, and the totals are computed from the rows rather than written in. It is
   the demo instead of a screenshot, so it has to behave like software. */

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const egp = (n) => "EGP " + n.toLocaleString("en-US");

/* ------------------------------------------------------------------ data */
const SEED = {
  orders: [
    { id: 1042, who: "محلات النيل للأقمشة", en: "Nile Fabrics",      items: 3, total: 12400, status: "paid" },
    { id: 1041, who: "شركة الدلتا",          en: "Delta Trading",     items: 5, total: 18400, status: "due"  },
    { id: 1040, who: "مصنع الحرير الحديث",   en: "Modern Silk",       items: 2,  total: 6200, status: "paid" },
    { id: 1039, who: "بازار خان الخليلي",    en: "Khan Bazaar",       items: 4,  total: 4800, status: "part" },
    { id: 1038, who: "أقمشة المعادي",        en: "Maadi Textiles",    items: 1,  total: 2100, status: "paid" },
    { id: 1037, who: "تجارة الجملة",         en: "Ataba Wholesale",   items: 6,  total: 2220, status: "paid" },
  ],
  stock: [
    { sku: "F-100", name: "شيفون مطبوع",  en: "Printed chiffon", qty: 420, unit: "m", low: false },
    { sku: "F-200", name: "دنيم ستريتش",  en: "Stretch denim",   qty:  38, unit: "m", low: true  },
    { sku: "F-300", name: "قطن مصري",     en: "Egyptian cotton", qty: 610, unit: "m", low: false },
    { sku: "F-400", name: "كتان طبيعي",   en: "Natural linen",   qty: 155, unit: "m", low: false },
    { sku: "F-500", name: "حرير صناعي",   en: "Viscose silk",    qty:  22, unit: "m", low: true  },
  ],
  customers: [
    { who: "محلات النيل للأقمشة", en: "Nile Fabrics",    balance: 12400, terms: "30 days" },
    { who: "شركة الدلتا",         en: "Delta Trading",   balance: 18400, terms: "30 days" },
    { who: "مصنع الحرير الحديث",  en: "Modern Silk",     balance:     0, terms: "Cash"    },
    { who: "بازار خان الخليلي",   en: "Khan Bazaar",     balance:  2400, terms: "14 days" },
  ],
};

const NEW_ORDERS = [
  { who: "ورشة السيدة زينب",  en: "Sayeda Workshop", items: 2, total: 3650 },
  { who: "أقمشة شبرا",        en: "Shubra Fabrics",  items: 4, total: 9100 },
  { who: "محل الأزهر للستائر", en: "Azhar Curtains",  items: 1, total: 1480 },
  { who: "مفروشات المنيل",    en: "Manial Furnishing", items: 5, total: 7320 },
];

const TAG = { paid: ["Paid", "tag--paid"], due: ["Unpaid", "tag--due"], part: ["Part paid", "tag--part"] };

/* --------------------------------------------------------------- the app */
function mountApp(root) {
  // Each frame owns its own copy, so the hero and the stage do not share state.
  const state = {
    view: "orders",
    nextId: 1043,
    pool: [...NEW_ORDERS],
    orders: SEED.orders.map((o) => ({ ...o })),
    stock: SEED.stock.map((s) => ({ ...s })),
    customers: SEED.customers.map((c) => ({ ...c })),
    justAdded: null,
  };

  const body  = $("[data-body]", root);
  const title = $("[data-title]", root);
  const sub   = $("[data-sub]", root);

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const who = (r) => `<span class="who"><span class="ar">${esc(r.who)}</span></span>`;

  function renderOrders() {
    return `<table class="t"><thead><tr>
        <th>Order</th><th>Customer</th><th>Items</th><th style="text-align:right">Total</th><th>Status</th>
      </tr></thead><tbody>${state.orders.map((o) => `
        <tr data-id="${o.id}" class="${state.justAdded === o.id ? "row-in" : ""}">
          <td class="mono">#${o.id}</td>
          <td>${who(o)}</td>
          <td class="mono">${o.items}</td>
          <td class="n">${egp(o.total)}</td>
          <td><span class="tag ${TAG[o.status][1]}">${TAG[o.status][0]}</span></td>
        </tr>`).join("")}</tbody></table>`;
  }

  function renderStock() {
    return `<table class="t"><thead><tr>
        <th>SKU</th><th>Item</th><th style="text-align:right">In stock</th><th>Status</th>
      </tr></thead><tbody>${state.stock.map((s) => `
        <tr>
          <td class="mono">${esc(s.sku)}</td>
          <td>${who({ who: s.name })}</td>
          <td class="n">${s.qty} ${s.unit}</td>
          <td><span class="tag ${s.qty < 60 ? "tag--due" : "tag--paid"}">${s.qty < 60 ? "Reorder" : "Healthy"}</span></td>
        </tr>`).join("")}</tbody></table>`;
  }

  function renderCustomers() {
    return `<table class="t"><thead><tr>
        <th>Customer</th><th>Terms</th><th style="text-align:right">Balance</th><th>Status</th>
      </tr></thead><tbody>${state.customers.map((c) => `
        <tr>
          <td>${who(c)}</td>
          <td class="mono">${esc(c.terms)}</td>
          <td class="n">${egp(c.balance)}</td>
          <td><span class="tag ${c.balance ? "tag--part" : "tag--paid"}">${c.balance ? "Open" : "Settled"}</span></td>
        </tr>`).join("")}</tbody></table>`;
  }

  function paint() {
    const views = { orders: renderOrders, stock: renderStock, customers: renderCustomers };
    const subs  = { orders: "today", stock: "5 lines · 2 to reorder", customers: "4 accounts" };
    title.textContent = state.view[0].toUpperCase() + state.view.slice(1);
    sub.textContent = state.view === "stock"
      ? `${state.stock.length} lines · ${state.stock.filter((s) => s.qty < 60).length} to reorder`
      : subs[state.view];
    body.innerHTML = views[state.view]();
    state.justAdded = null;

    // Totals are derived, never stored — the point of showing it working.
    const due   = state.orders.filter((o) => o.status !== "paid").reduce((n, o) => n + o.total, 0);
    const total = state.orders.reduce((n, o) => n + o.total, 0);
    setStat("orders", state.orders.length);
    setStat("due", egp(due));
    setStat("total", egp(total));
    $("[data-count='orders']", root).textContent = state.orders.length;
    $("[data-count='stock']", root).textContent  = state.stock.length;

    for (const b of $$("[data-view]", root)) {
      b.setAttribute("aria-selected", String(b.dataset.view === state.view));
    }
  }

  let flashTimer;
  function setStat(key, value) {
    const el = $(`[data-stat="${key}"]`, root);
    if (!el || el.textContent === String(value)) return;
    el.textContent = value;
    el.classList.add("hit");
    clearTimeout(flashTimer);
    flashTimer = setTimeout(() => el.classList.remove("hit"), 700);
  }

  for (const b of $$("[data-view]", root)) {
    b.addEventListener("click", () => { state.view = b.dataset.view; paint(); });
  }

  $("[data-act='new']", root).addEventListener("click", () => {
    const t = state.pool.shift();
    if (!t) return;
    state.pool.push(t);                       // cycle, so it never runs dry
    const order = { id: state.nextId++, ...t, status: "due" };
    state.orders.unshift(order);
    state.justAdded = order.id;

    // An order takes stock out, the way the real one does.
    const line = state.stock[Math.floor(Math.random() * state.stock.length)];
    line.qty = Math.max(0, line.qty - t.items * 12);

    const c = state.customers.find((x) => x.who === t.who);
    if (c) c.balance += t.total;
    else state.customers.unshift({ who: t.who, en: t.en, balance: t.total, terms: "30 days" });

    state.view = "orders";
    paint();
  });

  $("[data-act='pay']", root).addEventListener("click", () => {
    const open = state.orders.find((o) => o.status !== "paid");
    if (!open) return;
    open.status = "paid";
    const c = state.customers.find((x) => x.who === open.who);
    if (c) c.balance = Math.max(0, c.balance - open.total);
    state.view = "orders";
    paint();
    const row = $(`tr[data-id="${open.id}"]`, root);
    if (row) row.classList.add("flash");
  });

  paint();
}

/* ------------------------------------------------------------- pricing */
const PRICES = {
  eg:   { site: 300,  shop: 700,  app: 900,  system: 1500, care: 50  },
  gulf: { site: 1500, shop: 3500, app: 4500, system: 7500, care: 200 },
};
let market = "eg";

function paintPrices() {
  const p = PRICES[market];
  for (const n of $$("[data-price]")) n.textContent = "$" + p[n.dataset.price].toLocaleString("en-US");
  $("#mEG").setAttribute("aria-pressed", String(market === "eg"));
  $("#mGulf").setAttribute("aria-pressed", String(market === "gulf"));
}

/* ------------------------------------------------------------- the rest */
function boot() {
  for (const f of $$("[data-app]")) mountApp(f);
  paintPrices();
  $("#mEG").addEventListener("click",   () => { market = "eg";   paintPrices(); });
  $("#mGulf").addEventListener("click", () => { market = "gulf"; paintPrices(); });

  const io = new IntersectionObserver((es) => {
    for (const e of es) if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }, { threshold: 0.08, rootMargin: "0px 0px -6% 0px" });
  for (const n of $$(".rv")) io.observe(n);

  addEventListener("scroll", () => {
    $("#nav").classList.toggle("stuck", scrollY > 8);
  }, { passive: true });

  // No endpoint yet, so the form says what will happen rather than pretending.
  $("#quote").addEventListener("submit", (e) => {
    e.preventDefault();
    const s = $("[data-form-status]");
    const email = $("#f-email").value.trim();
    if (!email || !email.includes("@")) { s.textContent = "Add an email we can reply to."; return; }
    s.textContent = "Not connected yet — add your form endpoint in assets/js/site.js before launch.";
  });
}

document.readyState === "loading"
  ? addEventListener("DOMContentLoaded", boot)
  : boot();
