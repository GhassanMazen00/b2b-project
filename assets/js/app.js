/**
 * BARQ — preloader, smooth scroll, reveals, pricing, language.
 *
 * The field in scene.js is the spectacle; this file keeps it honest. Nothing
 * here is required for the page to be readable: if the module fails or WebGL
 * is missing, the markup still stands on its own.
 */
import { createField } from "./scene.js";

/* ===========================================================================
   EDIT THESE AND THE SITE IS YOURS.
   =========================================================================== */
const CONFIG = {
  whatsapp:  "201000000000",          // country code + number, digits only
  email:     "hello@barq.studio",
  instagram: "https://instagram.com/",
  linkedin:  "https://linkedin.com/company/",
  facebook:  "https://facebook.com/",
};

const PRICES = {
  eg:   { site: 300,  shop: 700,  system: 1500, auto: 400,  care: 50 },
  gulf: { site: 1500, shop: 3500, system: 7500, auto: 2000, care: 200 },
};

const SAR_PER_USD = 3.75;   // pegged, so this figure never goes stale

const COPY = {
  ar: {
    lang: "EN",
    eg: "يُحسب بالجنيه بسعر اليوم",
    gulf: (n) => "≈ " + Math.round(n * SAR_PER_USD).toLocaleString("en-US") + " ريال",
    wa: "السلام عليكم، حابب أستفسر عن خدماتكم.",
  },
  en: {
    lang: "ع",
    eg: "Billed in EGP at the day's rate",
    gulf: (n) => "≈ " + Math.round(n * SAR_PER_USD).toLocaleString("en-US") + " SAR",
    wa: "Hello, I'd like to ask about your services.",
  },
};

const $  = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;

let lang   = localStorage.getItem("barq.lang")   || "ar";
let market = localStorage.getItem("barq.market") || "eg";
let field  = null;

/* ---------------------------------------------------------------- language */
function applyLang() {
  const h = document.documentElement;
  h.lang = lang;
  h.dir  = lang === "ar" ? "rtl" : "ltr";
  $("#langBtn").textContent = COPY[lang].lang;
  applyContacts();
  applyPrices();
  try { localStorage.setItem("barq.lang", lang); } catch {}
  if (window.ScrollTrigger) ScrollTrigger.refresh();
}

/* ------------------------------------------------------------------ prices */
function applyPrices() {
  const p = PRICES[market];
  for (const n of $$("[data-price]")) {
    n.textContent = "$" + p[n.dataset.price].toLocaleString("en-US");
  }
  for (const n of $$("[data-local]")) {
    n.textContent = market === "eg" ? COPY[lang].eg : COPY[lang].gulf(p[n.dataset.local]);
  }
  $("#mEG").setAttribute("aria-pressed", String(market === "eg"));
  $("#mGulf").setAttribute("aria-pressed", String(market === "gulf"));
  try { localStorage.setItem("barq.market", market); } catch {}
}

/* ---------------------------------------------------------------- contacts */
function applyContacts() {
  const wa = `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(COPY[lang].wa)}`;
  for (const id of ["waMain", "waFloat"]) {
    const n = $("#" + id);
    if (n) n.href = wa;
  }
  const m = $("#mailMain");
  if (m) m.href = "mailto:" + CONFIG.email;
  for (const a of $$("[data-social]")) {
    a.href = a.dataset.social === "whatsapp" ? wa : (CONFIG[a.dataset.social] || "#");
    if (a.href !== "#") { a.target = "_blank"; a.rel = "noopener"; }
  }
}

/* -------------------------------------------------------------- preloader */
function preload() {
  return new Promise((done) => {
    const bar = $("#pre .bar"), pct = $("#preN");
    let n = 0;
    const tick = setInterval(() => {
      // Ease towards 100 rather than marching, so it feels like loading.
      n += Math.max(1, (100 - n) * 0.12);
      if (n >= 99.5) { n = 100; clearInterval(tick); setTimeout(finish, 320); }
      bar.style.width = n + "%";
      pct.textContent = Math.round(n);
    }, REDUCED ? 8 : 34);

    function finish() {
      $("#pre").classList.add("gone");
      document.body.classList.remove("lock");
      setTimeout(() => { const p = $("#pre"); if (p) p.remove(); }, 1000);
      done();
    }
  });
}

/* ------------------------------------------------------------ smooth scroll */
function initScroll() {
  if (REDUCED || !window.Lenis) return null;
  const lenis = new Lenis({ duration: 1.15, smoothWheel: true });
  function raf(t) { lenis.raf(t); requestAnimationFrame(raf); }
  requestAnimationFrame(raf);

  if (window.ScrollTrigger) lenis.on("scroll", ScrollTrigger.update);

  // Anchor links have to go through Lenis or the two fight each other.
  for (const a of $$('a[href^="#"]')) {
    a.addEventListener("click", (e) => {
      const t = a.getAttribute("href");
      if (t === "#" || !document.querySelector(t)) return;
      e.preventDefault();
      lenis.scrollTo(t, { offset: -10 });
    });
  }
  return lenis;
}

/* ----------------------------------------------------------------- reveals */
function initReveals() {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add("in");
      io.unobserve(e.target);
    }
  }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

  for (const n of $$(".rv, .lines")) io.observe(n);
}

/* ------------------------------------------------------------- counting up */
function initCounters() {
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const n = e.target, to = Number(n.dataset.count);
      io.unobserve(n);
      if (REDUCED) { n.textContent = to.toLocaleString("en-US"); continue; }
      const t0 = performance.now(), dur = 1500;
      (function step(now) {
        const k = Math.min(1, (now - t0) / dur);
        const eased = 1 - Math.pow(1 - k, 3);
        n.textContent = Math.round(to * eased).toLocaleString("en-US");
        if (k < 1) requestAnimationFrame(step);
      })(t0);
    }
  }, { threshold: 0.5 });
  for (const n of $$("[data-count]")) io.observe(n);
}

/* ------------------------------------------------------- card light follow */
function initCards() {
  if (matchMedia("(hover: none)").matches) return;
  for (const c of $$(".cap")) {
    c.addEventListener("pointermove", (e) => {
      const r = c.getBoundingClientRect();
      c.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
      c.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
    }, { passive: true });
  }
}

/* ---------------------------------------------------------------- the field */
let struck = false;

function initField() {
  const canvas = $("#field");
  field = createField(canvas, { word: lang === "ar" ? "برق" : "BARQ" });

  if (!field) {                       // no WebGL: a still gradient, no apology
    canvas.hidden = true;
    $("#nofield").hidden = false;
    return;
  }
  canvas.classList.add("on");

  // One trigger, shaped as a curve. Two of them fought each other: the second
  // drove `order` back down while the first was still pushing it up, so the
  // bolt never actually formed.
  //
  //   0 ──────► 0.42   cloud gathers into the bolt
  //   0.42 ───► 0.62   holds, so it is legible rather than a flash
  //   0.62 ───► 1      disperses again as the manifesto arrives
  if (window.ScrollTrigger && !REDUCED) {
    ScrollTrigger.create({
      trigger: ".hero",
      start: "top top",
      end: "+=180%",
      onUpdate: (self) => {
        const k = self.progress;
        let o;
        if (k < 0.42)      o = k / 0.42;
        else if (k < 0.62) o = 1;
        else               o = 1 - (k - 0.62) / 0.38;
        field.order = o;

        // Flash once, the first time the mark completes. Without a payoff the
        // assembly just stops, which reads as the animation stalling.
        if (o >= 0.985 && !struck) { struck = true; field.strike(); }
        if (o < 0.6) struck = false;
      },
    });
  } else {
    field.order = REDUCED ? 1 : 0.35;
  }
}

/* -------------------------------------------------------------------- boot */
$("#langBtn").addEventListener("click", () => {
  lang = lang === "ar" ? "en" : "ar";
  applyLang();
});
$("#mEG").addEventListener("click",   () => { market = "eg";   applyPrices(); });
$("#mGulf").addEventListener("click", () => { market = "gulf"; applyPrices(); });

addEventListener("scroll", () => {
  $("#nav").classList.toggle("solid", scrollY > 60);
}, { passive: true });

applyLang();
initCards();

(async function start() {
  // The wordmark is sampled from rendered text, so the font has to be loaded
  // before the field is built or the particles form a fallback typeface.
  try { await document.fonts.ready; } catch {}
  await preload();
  initScroll();
  initReveals();
  initCounters();
  initField();
})();
