/* Axiom — language gate, bilingual copy, example tabs, motion. */

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* =========================== copy =========================== */
const T = {
  en: {
    "skip":"Skip to content",
    "nav.work":"Our work","nav.pricing":"Pricing","nav.process":"Process","nav.faq":"Questions",
    "cta.quote":"Get a quote","cta.work":"See our work","cta.from":"From",
    "hero.eyebrow":"Egypt · Gulf · Middle East",
    "hero.h1":"We build the systems your business runs on.",
    "hero.lede":"Websites, online stores, mobile apps and the internal software that keeps stock, invoices and customers in one place. The price is published before you call.",
    "fact.from":"Websites from","fact.delivery":"Delivery","fact.delivery.v":"14 days",
    "fact.reply":"Reply within","fact.reply.v":"24 hours","fact.own":"You own","fact.own.v":"Everything",

    "work.eyebrow":"What we build","work.h2":"Four things, and what each one looks like",
    "work.lede":"Not a list of services. Pick one and see the kind of thing you get, with the price and the delivery time attached.",
    "tab.site":"Websites","tab.store":"Online stores","tab.app":"Mobile apps",
    "tab.system":"Business systems","tab.auto":"Automation",

    "p.site.h":"A website that works on a phone first",
    "p.site.p":"Five pages in Arabic and English, fast on mobile data, structured so Google can actually find you. Built for a fabric wholesaler, a clinic or a workshop.",
    "p.site.1":"Up to five pages, both languages","p.site.2":"WhatsApp button, map and contact form",
    "p.site.3":"Search-engine setup and a speed pass","p.site.4":"You own the domain and the code",

    "p.store.h":"A store that takes money properly",
    "p.store.p":"Catalogue, cart and checkout through Fawry, Paymob or InstaPay, with a dashboard your staff can actually run. A WhatsApp alert lands on every order.",
    "p.store.1":"Products, categories and stock counts","p.store.2":"Fawry, Paymob, InstaPay and cash on delivery",
    "p.store.3":"Order dashboard and delivery notes","p.store.4":"Training for whoever packs the orders",

    "p.app.h":"An app that installs from the browser",
    "p.app.p":"It sits on the home screen, works without a connection and sends notifications — with no app store account, no review queue and no yearly fee.",
    "p.app.1":"Installs straight from a link","p.app.2":"Works offline and syncs when it reconnects",
    "p.app.3":"Push notifications to your customers","p.app.4":"Fully native quoted separately when you need it",

    "p.system.h":"The system the business actually runs on",
    "p.system.p":"Stock, invoices, customers and staff permissions in one place, with approval before anything posts to the books. Built to fit how you already work.",
    "p.system.1":"Stock, invoices, customers and suppliers","p.system.2":"A different permission level per employee",
    "p.system.3":"Review and approval before posting","p.system.4":"Reports and account statements",

    "p.auto.h":"The work that repeats every morning, gone",
    "p.auto.p":"Reports that send themselves, data moved between two tools without retyping, stock alerts before you run out, and a WhatsApp reply when you are closed.",
    "p.auto.1":"Daily and weekly reports, sent on a schedule","p.auto.2":"Data moved between your tools automatically",
    "p.auto.3":"Stock and overdue-payment alerts","p.auto.4":"Automatic WhatsApp replies out of hours",

    "price.eyebrow":"Pricing","price.h2":"Our prices are public",
    "price.lede":"Most studios say \"it depends\". Pick your market and read the number. Gulf projects cost more because the market pays more, not because the work differs.",
    "market.eg":"Egypt","market.gulf":"Gulf","plan.popular":"Most asked",
    "plan.site.w":"A credible presence that Google can find.","plan.site.t":"one-off · 10 days",
    "plan.store.w":"Sell online and take money properly.","plan.store.t":"one-off · 3 weeks",
    "plan.app.w":"On the home screen, working offline.","plan.app.t":"one-off · 3–4 weeks",
    "plan.system.w":"When spreadsheets stop coping.","plan.system.t":"one-off · 4–6 weeks",

    "care.h":"Monthly care",
    "care.p":"A site is not bought once and forgotten. This keeps yours online, secure and current, with a named person to go back to.",
    "care.t":"per month · cancel any time",
    "care.1":"Hosting, domain and SSL certificate","care.2":"Daily backups and uptime monitoring",
    "care.3":"Security updates as they are released","care.4":"Up to two hours of changes a month",
    "care.5":"WhatsApp support, Sunday to Thursday, reply within 24 hours",
    "care.6":"Leave whenever you like — we hand over the files",

    "proc.eyebrow":"How it works","proc.h2":"Four steps, and you can stop after any of them",
    "proc.1.h":"Send the brief","proc.1.p":"Tell us what the business does and what slows it down. Fifteen minutes is enough, and no call is needed if you would rather write.",
    "proc.2.h":"Read the quote","proc.2.p":"A written price and a delivery date within 24 hours, listing exactly what is in and what is out. Nothing is billed yet.",
    "proc.3.h":"Watch the build","proc.3.p":"A link to the work as it happens, so you comment while changes are cheap rather than after delivery.",
    "proc.4.h":"Take the keys","proc.4.p":"Training for your staff, the domain in your name, the code handed over. The monthly plan only if you want it.",

    "faq.eyebrow":"Questions","faq.h2":"The ones we get every week","faq.lede":"Anything else, ask before you commit to anything at all.",
    "q1":"Why is the price lower than other studios?",
    "a1":"Because the work takes less time, not because it is worth less. Modern tooling removes the repetitive parts, so a job that takes two months elsewhere takes us two weeks. We pass that on instead of keeping it.",
    "q2":"Is the price final?",
    "a2":"Yes. The quote is written and lists what is included. Anything extra is priced and agreed before it starts, never added at the end.",
    "q3":"Who owns the site and the domain?",
    "a3":"You do. The domain is registered in your name and the code is handed over. If you leave, we package everything up for you first.",
    "q4":"Is the monthly plan compulsory?",
    "a4":"No. Take the site and host it anywhere. Most owners would simply rather not deal with hosting, backups and updates, which is what the plan covers.",
    "q5":"What does daily support actually mean?",
    "a5":"A named person replies on WhatsApp, Sunday to Thursday, within 24 hours and usually much sooner. Small changes are included up to two hours a month. Larger work is quoted first.",
    "q6":"Do you work outside Egypt?",
    "a6":"Yes, across Saudi Arabia, the UAE, Kuwait and Qatar. Meetings are online and contracts are in US dollars. Gulf pricing is shown above when you switch market.",

    "ct.eyebrow":"Start here","ct.h2":"Tell us what the business needs",
    "ct.p":"Send this and you get a written price and a delivery date back. There is no call until you want one, and nothing is billed until you agree the quote.",
    "ct.hours":"We reply Sunday to Thursday, within 24 hours.",
    "ct.name":"Your name","ct.company":"Company","ct.email":"Email","ct.wa":"WhatsApp",
    "ct.need":"What you need","ct.note":"What slows the business down today",
    "ct.notsure":"Not sure yet",
    "foot.lede":"Websites, apps and business systems for companies in Egypt and the Gulf.",
    "foot.build":"Build","foot.company":"Company","foot.talk":"Talk","foot.made":"Built in Cairo",
    "form.err":"Add an email we can reply to.",
    "form.todo":"Not connected yet — add your form endpoint in assets/js/site.js before launch.",
  },

  ar: {
    "skip":"تخطَّ إلى المحتوى",
    "nav.work":"أعمالنا","nav.pricing":"الأسعار","nav.process":"طريقة الشغل","nav.faq":"أسئلة شائعة",
    "cta.quote":"اطلب عرض سعر","cta.work":"شوف أعمالنا","cta.from":"من",
    "hero.eyebrow":"مصر · الخليج · الشرق الأوسط",
    "hero.h1":"بنبني الأنظمة اللي شغلك بيقوم عليها.",
    "hero.lede":"مواقع ومتاجر إلكترونية وتطبيقات، والبرامج الداخلية اللي بتجمع المخزون والفواتير والعملاء في مكان واحد. السعر معلن قبل ما تكلمنا.",
    "fact.from":"المواقع تبدأ من","fact.delivery":"التسليم","fact.delivery.v":"١٤ يوم",
    "fact.reply":"الرد خلال","fact.reply.v":"٢٤ ساعة","fact.own":"الملكية","fact.own.v":"كلها ليك",

    "work.eyebrow":"اللي بنبنيه","work.h2":"أربع حاجات، وكل واحدة شكلها إيه",
    "work.lede":"مش مجرد قايمة خدمات. اختار واحدة وشوف بنفسك هتستلم إيه، وبكام وفي خلال كام يوم.",
    "tab.site":"المواقع","tab.store":"المتاجر الإلكترونية","tab.app":"تطبيقات الموبايل",
    "tab.system":"أنظمة إدارة الأعمال","tab.auto":"الأتمتة",

    "p.site.h":"موقع مبني للموبايل الأول",
    "p.site.p":"خمس صفحات بالعربي والإنجليزي، سريع على بيانات الموبايل، ومترتب علشان جوجل يلاقيك فعلاً. زي اللي بنعمله لتاجر أقمشة أو عيادة أو ورشة.",
    "p.site.1":"حتى خمس صفحات، باللغتين","p.site.2":"زر واتساب وخريطة ونموذج تواصل",
    "p.site.3":"تهيئة لمحركات البحث ومراجعة سرعة","p.site.4":"الدومين والكود ملكك",

    "p.store.h":"متجر بيستلم فلوسك صح",
    "p.store.p":"كتالوج وسلة ودفع عن طريق فوري أو باي موب أو إنستاباي، مع لوحة تحكم موظفينك يقدروا يشتغلوا عليها فعلاً. وإشعار واتساب بيوصلك مع كل طلب.",
    "p.store.1":"منتجات وأقسام وأرصدة مخزون","p.store.2":"فوري وباي موب وإنستاباي والدفع عند الاستلام",
    "p.store.3":"لوحة طلبات وأذون تسليم","p.store.4":"تدريب لأي حد بيجهّز الطلبات",

    "p.app.h":"تطبيق بيتثبّت من المتصفح",
    "p.app.p":"بيقعد على شاشة الموبايل، وبيشتغل من غير إنترنت، وبيبعت إشعارات — من غير حساب في المتجر ولا مراجعة ولا رسوم سنوية.",
    "p.app.1":"بيتثبّت من لينك على طول","p.app.2":"بيشتغل أوفلاين وبيزامن لما النت يرجع",
    "p.app.3":"إشعارات لعملائك","p.app.4":"التطبيق الأصلي بعرض سعر منفصل لما تحتاجه",

    "p.system.h":"النظام اللي الشغل بيمشي عليه فعلاً",
    "p.system.p":"مخزون وفواتير وعملاء وصلاحيات للموظفين في مكان واحد، ومراجعة قبل ما أي حاجة تترحّل للدفاتر. مبني على مقاس طريقة شغلك.",
    "p.system.1":"مخزون وفواتير وعملاء وموردين","p.system.2":"صلاحية مختلفة لكل موظف",
    "p.system.3":"مراجعة واعتماد قبل الترحيل","p.system.4":"تقارير وكشوف حساب",

    "p.auto.h":"الشغل اللي بيتكرر كل صباح، يروح",
    "p.auto.p":"تقارير بتتبعت لوحدها، وبيانات بتتنقل بين برنامجين من غير إعادة إدخال، وتنبيهات مخزون قبل ما يخلص، ورد واتساب وأنت قافل.",
    "p.auto.1":"تقارير يومية وأسبوعية بمواعيد ثابتة","p.auto.2":"نقل بيانات بين أدواتك تلقائياً",
    "p.auto.3":"تنبيهات المخزون والمتأخرات","p.auto.4":"ردود واتساب تلقائية خارج المواعيد",

    "price.eyebrow":"الأسعار","price.h2":"أسعارنا معلنة",
    "price.lede":"معظم المكاتب بتقول «حسب المشروع». اختار السوق بتاعك واقرا الرقم. مشاريع الخليج أغلى لأن السوق بيدفع أكتر، مش لأن الشغل مختلف.",
    "market.eg":"مصر","market.gulf":"الخليج","plan.popular":"الأكثر طلباً",
    "plan.site.w":"وجود محترم على الإنترنت جوجل يلاقيه.","plan.site.t":"مرة واحدة · ١٠ أيام",
    "plan.store.w":"بيع أونلاين واستلم فلوسك صح.","plan.store.t":"مرة واحدة · ٣ أسابيع",
    "plan.app.w":"على شاشة الموبايل، وشغال أوفلاين.","plan.app.t":"مرة واحدة · ٣–٤ أسابيع",
    "plan.system.w":"لما الإكسل والورق ما بقاش كفاية.","plan.system.t":"مرة واحدة · ٤–٦ أسابيع",

    "care.h":"باقة المتابعة الشهرية",
    "care.p":"الموقع مش حاجة بتشتريها مرة وتنساها. الباقة بتخليه شغال وآمن ومحدَّث، ومعاك حد بالاسم ترجع له.",
    "care.t":"شهرياً · توقفها أي وقت",
    "care.1":"استضافة ودومين وشهادة أمان","care.2":"نسخ احتياطي يومي ومتابعة الأعطال",
    "care.3":"تحديثات أمان أول بأول","care.4":"تعديلات حتى ساعتين شهرياً",
    "care.5":"دعم واتساب، الأحد–الخميس، رد خلال ٢٤ ساعة",
    "care.6":"تمشي في أي وقت — وبنسلمك ملفاتك",

    "proc.eyebrow":"طريقة الشغل","proc.h2":"أربع خطوات، وتقدر توقف بعد أي واحدة",
    "proc.1.h":"ابعت لنا التفاصيل","proc.1.p":"قول لنا شغلك بيعمل إيه وإيه اللي معطّلك. ربع ساعة تكفي، ومش لازم مكالمة لو تحب تكتب.",
    "proc.2.h":"اقرا العرض","proc.2.p":"سعر مكتوب وتاريخ تسليم خلال ٢٤ ساعة، وفيه بالظبط إيه اللي داخل وإيه اللي بره. ومحدش دفع حاجة لسه.",
    "proc.3.h":"تابع التنفيذ","proc.3.p":"لينك تشوف عليه الشغل وهو بيتعمل، علشان تقول رأيك والتعديل لسه رخيص، مش بعد التسليم.",
    "proc.4.h":"استلم المفاتيح","proc.4.p":"تدريب لموظفينك، والدومين باسمك، والكود بيتسلّم لك. وباقة المتابعة لو حبيت بس.",

    "faq.eyebrow":"أسئلة شائعة","faq.h2":"الأسئلة اللي بتيجي كل أسبوع","faq.lede":"أي حاجة تانية، اسأل قبل ما تلتزم بأي حاجة.",
    "q1":"ليه السعر أقل من مكاتب تانية؟",
    "a1":"لأن الشغل بياخد وقت أقل، مش لأن قيمته أقل. الأدوات الحديثة بتشيل الجزء المتكرر، فالمشروع اللي بياخد شهرين عند غيرنا بناخده في أسبوعين. والفرق ده بنوفره عليك بدل ما ناخده.",
    "q2":"السعر ده نهائي؟",
    "a2":"أيوه. العرض مكتوب وفيه كل اللي داخل. أي إضافة بتتسعّر ويتفق عليها قبل ما تبدأ، ومش بتتحط في آخر فاتورة.",
    "q3":"الموقع والدومين ملك مين؟",
    "a3":"ملكك إنت. الدومين بيتسجل باسمك والكود بيتسلّم لك. ولو قررت تمشي، بنجهز لك كل حاجة الأول.",
    "q4":"باقة المتابعة إلزامية؟",
    "a4":"لأ. خد الموقع واستضيفه عند أي حد. بس معظم أصحاب الأعمال مش بيحبوا يتعاملوا مع الاستضافة والنسخ الاحتياطي والتحديثات، وده اللي الباقة بتعمله.",
    "q5":"يعني إيه «دعم يومي»؟",
    "a5":"في حد بالاسم بيرد عليك على واتساب، الأحد لحد الخميس، خلال ٢٤ ساعة وغالباً أسرع بكتير. التعديلات الصغيرة داخلة لحد ساعتين شهرياً، واللي أكبر بيتسعّر الأول.",
    "q6":"بتشتغلوا بره مصر؟",
    "a6":"أيوه، في السعودية والإمارات والكويت وقطر. الاجتماعات أونلاين والتعاقد بالدولار. وأسعار الخليج بتظهر فوق لما تغيّر السوق.",

    "ct.eyebrow":"ابدأ من هنا","ct.h2":"قول لنا شغلك محتاج إيه",
    "ct.p":"ابعت ده وهيوصلك سعر مكتوب وتاريخ تسليم. مفيش مكالمة غير لما تطلبها، ومحدش بيدفع حاجة قبل ما يوافق على العرض.",
    "ct.hours":"بنرد من الأحد للخميس، خلال ٢٤ ساعة.",
    "ct.name":"اسمك","ct.company":"الشركة","ct.email":"الإيميل","ct.wa":"واتساب",
    "ct.need":"محتاج إيه","ct.note":"إيه اللي معطّل شغلك دلوقتي",
    "ct.notsure":"لسه مش متأكد",
    "foot.lede":"مواقع وتطبيقات وأنظمة إدارة لشركات مصر والخليج.",
    "foot.build":"اللي بنبنيه","foot.company":"الشركة","foot.talk":"تواصل","foot.made":"صُنع في القاهرة",
    "form.err":"اكتب إيميل نقدر نرد عليه.",
    "form.todo":"لسه مش متوصّل — ضيف عنوان النموذج في assets/js/site.js قبل الإطلاق.",
  },
};

const NEEDS = ["tab.site","tab.store","tab.app","tab.system","tab.auto","ct.notsure"];

/* =========================== language =========================== */
let lang = localStorage.getItem("axiom.lang");

function applyLang(next) {
  lang = next;
  const d = document.documentElement;
  d.lang = lang;
  d.dir = lang === "ar" ? "rtl" : "ltr";
  const dict = T[lang];

  for (const el of $$("[data-i18n]")) {
    const v = dict[el.dataset.i18n];
    if (v !== undefined) el.textContent = v;
  }

  // The "what you need" options are built from the same keys as the tabs.
  const sel = $("#f-need");
  sel.innerHTML = "";
  for (const k of NEEDS) sel.append(new Option(dict[k], k));

  $("#langBtn").textContent = lang === "ar" ? "English" : "العربية";
  try { localStorage.setItem("axiom.lang", lang); } catch {}
}

function openGate() {
  const gate = $("#gate");
  for (const b of $$(".gate__btn", gate)) {
    b.addEventListener("click", () => {
      applyLang(b.dataset.lang);
      gate.classList.add("gone");
      document.body.classList.remove("locked");
      setTimeout(() => gate.remove(), 700);
      start();
    });
  }
}

/* =========================== pricing =========================== */
const PRICES = {
  eg:   { site: 300,  shop: 700,  app: 900,  system: 1500, auto: 400,  care: 50  },
  gulf: { site: 1500, shop: 3500, app: 4500, system: 7500, auto: 2000, care: 200 },
};
let market = localStorage.getItem("axiom.market") || "eg";

function paintPrices() {
  const p = PRICES[market];
  for (const n of $$("[data-price]")) n.textContent = "$" + p[n.dataset.price].toLocaleString("en-US");
  $("#mEG").setAttribute("aria-pressed", String(market === "eg"));
  $("#mGulf").setAttribute("aria-pressed", String(market === "gulf"));
  try { localStorage.setItem("axiom.market", market); } catch {}
}

/* =========================== example tabs =========================== */
function initTabs() {
  const panes = $$(".pane");
  for (const t of $$(".tab")) {
    t.addEventListener("click", () => {
      for (const o of $$(".tab")) o.setAttribute("aria-selected", String(o === t));
      for (const p of panes) p.classList.toggle("on", p.dataset.pane === t.dataset.tab);
      // Restart the animations inside the pane that just appeared.
      const live = panes.find((p) => p.dataset.pane === t.dataset.tab);
      for (const n of $$(".chart i, .mock--scroll, .mk-prod", live)) {
        n.style.animation = "none";
        void n.offsetWidth;
        n.style.animation = "";
      }
      if (t.dataset.tab === "store") fillStore();
      countUp(live);
    });
  }
}

/* The store grid builds itself so the tiles stagger in rather than
   appearing all at once. */
function fillStore() {
  const grid = $("[data-store-grid]");
  if (!grid) return;
  grid.innerHTML = "";
  for (let i = 0; i < 6; i++) {
    const d = document.createElement("div");
    d.className = "mk-prod";
    d.style.animationDelay = `${i * 95}ms`;
    d.innerHTML = `<div class="ph"></div><div class="mt">
      <span class="mk-line lt" style="width:${62 + ((i * 13) % 28)}%;height:5px;display:block;margin-bottom:5px"></span>
      <span class="mk-line hot" style="width:34px;height:5px;display:block"></span></div>`;
    grid.append(d);
  }
  const badge = $("[data-cart]");
  if (badge) {
    let n = 0;
    badge.textContent = "0";
    const id = setInterval(() => {
      n += 1; badge.textContent = n;
      if (n >= 3) clearInterval(id);
    }, 620);
  }
}

/* =========================== counters =========================== */
function countUp(scope = document) {
  for (const el of $$("[data-tick]", scope)) {
    const to = Number(el.dataset.tick);
    if (REDUCED) { el.textContent = to.toLocaleString("en-US"); continue; }
    const t0 = performance.now(), dur = 1200;
    (function step(now) {
      const k = Math.min(1, (now - t0) / dur);
      el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))).toLocaleString("en-US");
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }
}

/* =========================== boot =========================== */
function start() {
  paintPrices();
  initTabs();
  fillStore();

  $("#mEG").addEventListener("click",   () => { market = "eg";   paintPrices(); });
  $("#mGulf").addEventListener("click", () => { market = "gulf"; paintPrices(); });
  $("#langBtn").addEventListener("click", () => applyLang(lang === "ar" ? "en" : "ar"));

  const io = new IntersectionObserver((es) => {
    for (const e of es) {
      if (!e.isIntersecting) continue;
      e.target.classList.add("in");
      countUp(e.target);
      io.unobserve(e.target);
    }
  }, { threshold: 0.08, rootMargin: "0px 0px -6% 0px" });
  for (const n of $$(".rv")) io.observe(n);

  addEventListener("scroll", () => {
    $("#nav").classList.toggle("stuck", scrollY > 8);
  }, { passive: true });

  $("#quote").addEventListener("submit", (e) => {
    e.preventDefault();
    const s = $("[data-form-status]");
    const email = $("#f-email").value.trim();
    s.textContent = (!email || !email.includes("@")) ? T[lang]["form.err"] : T[lang]["form.todo"];
  });
}

if (lang === "ar" || lang === "en") {
  // Returning visitor: skip the gate.
  applyLang(lang);
  $("#gate").remove();
  document.body.classList.remove("locked");
  start();
} else {
  applyLang("en");          // so the page behind the gate is not empty
  openGate();
}
