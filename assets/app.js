/* Sanad — language toggle, per-market pricing, contact links. */

/* ===========================================================================
   EDIT THESE FOUR LINES AND THE SITE IS YOURS.
   =========================================================================== */
const CONFIG = {
  whatsapp: "201000000000",            // country code + number, digits only, no +
  email:    "hello@sanad.tech",
  instagram:"https://instagram.com/",
  linkedin: "https://linkedin.com/company/",
  facebook: "https://facebook.com/",
};

/* Prices per market. Gulf is roughly 5x Egypt for identical work — that is the
   going rate there, not a markup. Edit freely. */
const PRICES = {
  eg:   { site: 300,  shop: 700,  system: 1500, auto: 400,  care: 50 },
  gulf: { site: 1500, shop: 3500, system: 7500, auto: 2000, care: 200 },
};

/* The Saudi riyal is pegged to the dollar, so this figure never goes stale.
   Egyptian pounds deliberately are NOT converted here: the rate moves, and a
   stale number on a pricing page costs trust. */
const SAR_PER_USD = 3.75;

const usd = (n) => "$" + n.toLocaleString("en-US");
const sar = (n) => "≈ " + Math.round(n * SAR_PER_USD).toLocaleString("en-US") + " SAR";

const T = {
  ar: {
    langBtn: "English",
    egNote: "يُحسب بالجنيه المصري بسعر اليوم",
    gulfNote: (n) => sar(n) + " تقريباً",
    waText: "السلام عليكم، حابب أستفسر عن خدماتكم.",
  },
  en: {
    langBtn: "العربية",
    egNote: "Billed in Egyptian pounds at the day's rate",
    gulfNote: (n) => sar(n) + " approx.",
    waText: "Hello, I'd like to ask about your services.",
  },
};

let lang = localStorage.getItem("sanad.lang") || "ar";
let market = localStorage.getItem("sanad.market") || "eg";

function applyLang() {
  const html = document.documentElement;
  html.lang = lang;
  html.dir = lang === "ar" ? "rtl" : "ltr";
  document.getElementById("langBtn").textContent = T[lang].langBtn;
  applyContacts();
  applyPrices();
  try { localStorage.setItem("sanad.lang", lang); } catch {}
}

function applyPrices() {
  const p = PRICES[market];

  for (const node of document.querySelectorAll("[data-price]")) {
    node.textContent = usd(p[node.dataset.price]);
  }

  for (const node of document.querySelectorAll("[data-local]")) {
    const amount = p[node.dataset.local];
    node.textContent = market === "eg"
      ? T[lang].egNote
      : T[lang].gulfNote(amount);
  }

  document.getElementById("mEG").setAttribute("aria-pressed", String(market === "eg"));
  document.getElementById("mGulf").setAttribute("aria-pressed", String(market === "gulf"));
  try { localStorage.setItem("sanad.market", market); } catch {}
}

function applyContacts() {
  const wa = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(T[lang].waText)}`;
  for (const id of ["waMain", "waFloat"]) {
    const n = document.getElementById(id);
    if (n) n.href = wa;
  }
  const mail = document.getElementById("mailMain");
  if (mail) mail.href = `mailto:${CONFIG.email}`;

  for (const a of document.querySelectorAll("[data-social]")) {
    const key = a.dataset.social;
    a.href = key === "whatsapp" ? wa : (CONFIG[key] || "#");
    if (a.href !== "#") a.target = "_blank";
    a.rel = "noopener";
  }
}

document.getElementById("langBtn").addEventListener("click", () => {
  lang = lang === "ar" ? "en" : "ar";
  applyLang();
});

document.getElementById("mEG").addEventListener("click", () => { market = "eg"; applyPrices(); });
document.getElementById("mGulf").addEventListener("click", () => { market = "gulf"; applyPrices(); });

applyLang();
