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

    "work.eyebrow":"What we build","work.h2":"Five things, and what each one actually looks like",
    "work.lede":"Not a list of services. Pick one and look at the screen you would get, with the price and the delivery time attached.",
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

    "sc.note":"Example screens. Real client work replaces them as it ships.",

    "cl.brand":"Nile Dental",
    "cl.n1":"Services","cl.n2":"Doctors","cl.n3":"Prices","cl.n4":"Contact","cl.cta":"Book now",
    "cl.h1":"Dental care in Heliopolis, booked in thirty seconds.",
    "cl.sub":"Six dentists, one published price list, and an appointment you pick yourself. No phone calls, no waiting for someone to ring you back.",
    "cl.b1":"Book an appointment","cl.b2":"See the price list",
    "cl.sh":"The three people ask for most",
    "cl.s1h":"Scale and polish","cl.s1p":"Forty minutes, no anaesthetic, finished in one visit.","cl.s1pr":"EGP 450",
    "cl.s2h":"Whitening","cl.s2p":"Three shades lighter on average, two sittings a week apart.","cl.s2pr":"EGP 2,400",
    "cl.s3h":"Implants","cl.s3p":"Swiss titanium, three-year guarantee, paid over six months.","cl.s3pr":"from EGP 9,000",
    "cl.dh":"Who you will actually see",
    "cl.d1n":"Dr Yasmine Adel","cl.d1s":"Cosmetic · 11 years",
    "cl.d2n":"Dr Omar Shafik","cl.d2s":"Implants · 14 years",
    "cl.d3n":"Dr Hana Mostafa","cl.d3s":"Children · 8 years",
    "cl.q":"I booked at eleven at night and I was in the chair the next morning. Nobody asked me to call back.",
    "cl.qn":"Mariam S. · Sheraton",
    "cl.bandh":"Open Saturday to Thursday, 10am until 9pm. 12 Nasr Road, Heliopolis.",
    "cl.bandb":"Book an appointment",
    "cl.f":"Nile Dental · 12 Nasr Road, Heliopolis, Cairo · 0100 123 4567",

    "sh.brand":"Nile Fabrics","sh.n1":"Cotton","sh.n2":"Linen","sh.n3":"Silk","sh.n4":"Wholesale",
    "sh.bag":"Cart · EGP 1,480","sh.h1":"Cotton by the metre",
    "sh.count":"42 fabrics · delivered in Cairo within 48 hours","sh.per":"/ metre",
    "sh.p1":"Egyptian cotton, 240gsm","sh.m1":"Natural · 150cm wide",
    "sh.p2":"Denim, indigo wash","sh.m2":"In stock · 310 m",
    "sh.p3":"Poplin, off-white","sh.m3":"Shirting · 145cm",
    "sh.p4":"Wool blend, burgundy","sh.m4":"Winter · 160cm",
    "sh.p5":"Linen, sage","sh.m5":"Pre-washed · 140cm",
    "sh.p6":"Raw silk, gold","sh.m6":"Limited · 48 m left",
    "sh.pay":"Pay with","sh.cod":"Cash on delivery",

    "ap.hi":"Saturday, 14 March","ap.h2":"Today's deliveries",
    "ap.sumlbl":"Collected today","ap.lbl":"ON THE ROAD · 4",
    "ap.n1":"Mahmoud Hassan","ap.s1":"Nasr City · delivered 11:20",
    "ap.n2":"Sara Abdelrahman","ap.s2":"Maadi · out for delivery",
    "ap.n3":"Karim Fouad","ap.s3":"Zamalek · picked up 10:05",
    "ap.n4":"Nour Eldin","ap.s4":"6th October · failed, retry",
    "ap.t1":"Today","ap.t2":"Routes","ap.t3":"Cash","ap.t4":"More",

    "sy.m1":"Dashboard","sy.m2":"Invoices","sy.m3":"Stock","sy.m4":"Customers",
    "sy.m5":"Suppliers","sy.m6":"Reports","sy.m7":"Staff",
    "sy.h2":"Invoices","sy.add":"+ New invoice",
    "sy.k1":"Invoiced this month (EGP)","sy.k2":"Collected (EGP)","sy.k3":"Overdue (EGP)","sy.k4":"Open invoices",
    "sy.chart":"Collected, last 8 weeks","sy.chartsub":"EGP thousands",
    "sy.recent":"Recent invoices","sy.all":"View all 37",
    "sy.th1":"Number","sy.th2":"Customer","sy.th3":"Date","sy.th4":"Amount","sy.th5":"Status",
    "sy.c1":"El Shorouk Garments","sy.c2":"Zahran Textiles","sy.c3":"Maison Laila",
    "sy.c4":"Gouna Interiors","sy.c5":"Arkan Uniforms",
    "sy.ok":"Paid","sy.part":"Part paid","sy.due":"14 days overdue",

    "au.h2":"Three automations, running since January",
    "au.sb":"Nobody opens a spreadsheet for any of this any more.",
    "au.trig":"TRIGGER","au.act":"ACTION","au.out":"RESULT",
    "au.r1a":"New order on the store","au.r1b":"Create the invoice, reserve the stock","au.r1c":"WhatsApp to packing",
    "au.r2a":"Stock under 60 metres","au.r2b":"Draft the purchase order","au.r2c":"Sent to the owner to approve",
    "au.r3a":"Every day at 08:00","au.r3b":"Yesterday's sales and the overdue list","au.r3c":"Email and WhatsApp",
    "au.s1":"Runs a day","au.s2":"Hours saved a month","au.s3":"Failures since January",
    "sh.r1":"EGP 185 / metre","sh.r2":"EGP 240 / metre","sh.r3":"EGP 120 / metre",
    "sh.r4":"EGP 410 / metre","sh.r5":"EGP 265 / metre","sh.r6":"EGP 620 / metre",
    "ap.sumv":"EGP 12,480","ap.lbl2":"DELIVERED EARLIER · 9",
    "ap.v1":"1,240","ap.v2":"860","ap.v3":"2,310","ap.v4":"540",
    "ap.n5":"Rana Tarek","ap.s5":"Dokki · delivered 09:40","ap.v5":"980",
    "ap.n6":"Ahmed Samir","ap.s6":"Heliopolis · delivered 09:05","ap.v6":"1,760",
    "ap.n7":"Laila Mansour","ap.s7":"Garden City · delivered 08:30","ap.v7":"420",
    "sy.d1":"12 Mar","sy.d2":"11 Mar","sy.d3":"09 Mar","sy.d4":"08 Mar","sy.d5":"06 Mar",
    "sy.a1":"84,500","sy.a2":"31,200","sy.a3":"12,860","sy.a4":"57,400","sy.a5":"22,150",
    "ch.d10":"10 days","ch.w3":"3 weeks","ch.off":"Offline","ch.push":"Push",
    "ch.w34":"3–4 weeks","ch.roles":"Roles","ch.audit":"Audit trail","ch.w46":"4–6 weeks",
    "ch.sched":"Scheduled","ch.wa":"WhatsApp","ch.w12":"1–2 weeks",
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

    "work.eyebrow":"اللي بنبنيه","work.h2":"خمس حاجات، وكل واحدة شكلها إيه بالظبط",
    "work.lede":"مش مجرد قايمة خدمات. اختار واحدة وبص على الشاشة اللي هتستلمها، وبكام وفي خلال كام يوم.",
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

    "sc.note":"شاشات توضيحية. بنستبدلها بأعمال عملاء حقيقية أول ما تنزل.",

    "cl.brand":"نايل دنتال",
    "cl.n1":"الخدمات","cl.n2":"الأطباء","cl.n3":"الأسعار","cl.n4":"تواصل","cl.cta":"احجز الآن",
    "cl.h1":"علاج أسنان في مصر الجديدة، بتحجزه في ٣٠ ثانية.",
    "cl.sub":"ستة أطباء، وقائمة أسعار معلنة، وميعاد تختاره إنت بنفسك. بدون مكالمات وبدون ما تستنى حد يرد عليك.",
    "cl.b1":"احجز ميعاد","cl.b2":"شوف قائمة الأسعار",
    "cl.sh":"أكتر تلات حاجات الناس بتطلبها",
    "cl.s1h":"تنظيف وتلميع","cl.s1p":"أربعين دقيقة، بدون بنج، وتخلص في زيارة واحدة.","cl.s1pr":"٤٥٠ جنيه",
    "cl.s2h":"تبييض","cl.s2p":"أفتح بتلات درجات في المتوسط، على جلستين بفارق أسبوع.","cl.s2pr":"٢٤٠٠ جنيه",
    "cl.s3h":"زراعة","cl.s3p":"تيتانيوم سويسري، وضمان تلات سنين، وتقسيط على ستة أشهر.","cl.s3pr":"من ٩٠٠٠ جنيه",
    "cl.dh":"الدكتور اللي هتقعد معاه فعلاً",
    "cl.d1n":"د. ياسمين عادل","cl.d1s":"تجميل · ١١ سنة",
    "cl.d2n":"د. عمر شفيق","cl.d2s":"زراعة · ١٤ سنة",
    "cl.d3n":"د. هنا مصطفى","cl.d3s":"أطفال · ٨ سنين",
    "cl.q":"حجزت الساعة ١١ بالليل وكنت على الكرسي الصبح. محدش قال لي كلمنا تاني.",
    "cl.qn":"مريم س. · شيراتون",
    "cl.bandh":"مفتوح من السبت للخميس، من ١٠ صباحاً لـ ٩ مساءً. ١٢ شارع النصر، مصر الجديدة.",
    "cl.bandb":"احجز ميعاد",
    "cl.f":"نايل دنتال · ١٢ شارع النصر، مصر الجديدة، القاهرة · ٠١٠٠ ١٢٣ ٤٥٦٧",

    "sh.brand":"أقمشة النيل","sh.n1":"قطن","sh.n2":"كتان","sh.n3":"حرير","sh.n4":"جملة",
    "sh.bag":"السلة · ١٤٨٠ جنيه","sh.h1":"قطن بالمتر",
    "sh.count":"٤٢ قماش · التوصيل في القاهرة خلال ٤٨ ساعة","sh.per":"/ المتر",
    "sh.p1":"قطن مصري، ٢٤٠ جرام","sh.m1":"طبيعي · عرض ١٥٠ سم",
    "sh.p2":"جينز، صباغة نيلي","sh.m2":"متوفر · ٣١٠ متر",
    "sh.p3":"بوبلين، أوف وايت","sh.m3":"قمصان · ١٤٥ سم",
    "sh.p4":"خليط صوف، نبيتي","sh.m4":"شتوي · ١٦٠ سم",
    "sh.p5":"كتان، أخضر فاتح","sh.m5":"مغسول مسبقاً · ١٤٠ سم",
    "sh.p6":"حرير خام، ذهبي","sh.m6":"كمية محدودة · باقي ٤٨ متر",
    "sh.pay":"الدفع بـ","sh.cod":"الدفع عند الاستلام",

    "ap.hi":"السبت، ١٤ مارس","ap.h2":"توصيلات اليوم",
    "ap.sumlbl":"المحصّل اليوم","ap.lbl":"في الطريق · ٤",
    "ap.n1":"محمود حسن","ap.s1":"مدينة نصر · تم التسليم ١١:٢٠",
    "ap.n2":"سارة عبدالرحمن","ap.s2":"المعادي · خرج للتسليم",
    "ap.n3":"كريم فؤاد","ap.s3":"الزمالك · تم الاستلام ١٠:٠٥",
    "ap.n4":"نور الدين","ap.s4":"٦ أكتوبر · فشل، إعادة محاولة",
    "ap.t1":"اليوم","ap.t2":"الخطوط","ap.t3":"التحصيل","ap.t4":"المزيد",

    "sy.m1":"الرئيسية","sy.m2":"الفواتير","sy.m3":"المخزون","sy.m4":"العملاء",
    "sy.m5":"الموردين","sy.m6":"التقارير","sy.m7":"الموظفين",
    "sy.h2":"الفواتير","sy.add":"+ فاتورة جديدة",
    "sy.k1":"مفوتر هذا الشهر (جنيه)","sy.k2":"المحصّل (جنيه)","sy.k3":"متأخرات (جنيه)","sy.k4":"فواتير مفتوحة",
    "sy.chart":"التحصيل، آخر ٨ أسابيع","sy.chartsub":"بالألف جنيه",
    "sy.recent":"أحدث الفواتير","sy.all":"شوف الـ ٣٧ كلها",
    "sy.th1":"الرقم","sy.th2":"العميل","sy.th3":"التاريخ","sy.th4":"المبلغ","sy.th5":"الحالة",
    "sy.c1":"الشروق للملابس","sy.c2":"زهران للمنسوجات","sy.c3":"ميزون ليلى",
    "sy.c4":"الجونة للديكور","sy.c5":"أركان يونيفورم",
    "sy.ok":"مدفوعة","sy.part":"مدفوعة جزئياً","sy.due":"متأخرة ١٤ يوم",

    "au.h2":"تلات أتمتات، شغالة من يناير",
    "au.sb":"محدش بيفتح شيت إكسل لأي حاجة من دي تاني.",
    "au.trig":"الحدث","au.act":"الإجراء","au.out":"النتيجة",
    "au.r1a":"طلب جديد على المتجر","au.r1b":"إنشاء الفاتورة وحجز المخزون","au.r1c":"واتساب لقسم التجهيز",
    "au.r2a":"المخزون أقل من ٦٠ متر","au.r2b":"تجهيز أمر شراء مبدئي","au.r2c":"بيروح للمالك للموافقة",
    "au.r3a":"كل يوم الساعة ٨ صباحاً","au.r3b":"مبيعات امبارح وقايمة المتأخرات","au.r3c":"إيميل وواتساب",
    "au.s1":"تشغيل في اليوم","au.s2":"ساعات موفّرة شهرياً","au.s3":"أعطال من يناير",
    "sh.r1":"١٨٥ جنيه / المتر","sh.r2":"٢٤٠ جنيه / المتر","sh.r3":"١٢٠ جنيه / المتر",
    "sh.r4":"٤١٠ جنيه / المتر","sh.r5":"٢٦٥ جنيه / المتر","sh.r6":"٦٢٠ جنيه / المتر",
    "ap.sumv":"١٢٬٤٨٠ جنيه","ap.lbl2":"اتسلمت قبل كده · ٩",
    "ap.v1":"١٬٢٤٠","ap.v2":"٨٦٠","ap.v3":"٢٬٣١٠","ap.v4":"٥٤٠",
    "ap.n5":"رنا طارق","ap.s5":"الدقي · تم التسليم ٩:٤٠","ap.v5":"٩٨٠",
    "ap.n6":"أحمد سمير","ap.s6":"مصر الجديدة · تم التسليم ٩:٠٥","ap.v6":"١٬٧٦٠",
    "ap.n7":"ليلى منصور","ap.s7":"جاردن سيتي · تم التسليم ٨:٣٠","ap.v7":"٤٢٠",
    "sy.d1":"١٢ مارس","sy.d2":"١١ مارس","sy.d3":"٩ مارس","sy.d4":"٨ مارس","sy.d5":"٦ مارس",
    "sy.a1":"٨٤٬٥٠٠","sy.a2":"٣١٬٢٠٠","sy.a3":"١٢٬٨٦٠","sy.a4":"٥٧٬٤٠٠","sy.a5":"٢٢٬١٥٠",
    "ch.d10":"١٠ أيام","ch.w3":"٣ أسابيع","ch.off":"أوفلاين","ch.push":"إشعارات",
    "ch.w34":"٣–٤ أسابيع","ch.roles":"صلاحيات","ch.audit":"سجل تدقيق","ch.w46":"٤–٦ أسابيع",
    "ch.sched":"مواعيد ثابتة","ch.wa":"واتساب","ch.w12":"أسبوع لأسبوعين",
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

  // The example screens are pages in their own right, so they take the
  // language and the direction too.
  for (const sc of $$(".screen")) {
    sc.dir = lang === "ar" ? "rtl" : "ltr";
    sc.classList.toggle("ar", lang === "ar");
  }

  $("#langBtn").textContent = lang === "ar" ? "English" : "العربية";
  requestAnimationFrame(fitScreens);
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
      for (const n of $$(".bars i, .scroller, .s-shop .p, .s-auto .w", live)) {
        n.style.animation = "none";
        void n.offsetWidth;
        n.style.animation = "";
      }
      fitScreens();
      countUp(live);
    });
  }
}

/* The clinic page appears twice (hero and the Websites tab), so it is
   written once here. Every string is a dictionary key, so the example
   screen is in Arabic when the site is. */
const CLINIC = `
<div class="hdr">
  <span class="brand" data-i18n="cl.brand">Nile Dental</span>
  <span class="lnk" data-i18n="cl.n1">Services</span>
  <span class="lnk" data-i18n="cl.n2">Doctors</span>
  <span class="lnk" data-i18n="cl.n3">Prices</span>
  <span class="lnk" data-i18n="cl.n4">Contact</span>
  <span class="cta" data-i18n="cl.cta">Book now</span>
</div>
<div class="hero">
  <div>
    <h1 data-i18n="cl.h1">Dental care in Heliopolis, booked in thirty seconds.</h1>
    <p class="sub" data-i18n="cl.sub">Six dentists, one published price list, and an appointment you pick yourself.</p>
    <div class="btns">
      <span class="b1" data-i18n="cl.b1">Book an appointment</span>
      <span class="b2" data-i18n="cl.b2">See the price list</span>
    </div>
  </div>
  <div class="pic"></div>
</div>
<div class="sec">
  <h2 data-i18n="cl.sh">The three people ask for most</h2>
  <div class="strip">
    <div class="card"><h3 data-i18n="cl.s1h">Scale and polish</h3><p data-i18n="cl.s1p"></p><p class="price" data-i18n="cl.s1pr">EGP 450</p></div>
    <div class="card"><h3 data-i18n="cl.s2h">Whitening</h3><p data-i18n="cl.s2p"></p><p class="price" data-i18n="cl.s2pr">EGP 2,400</p></div>
    <div class="card"><h3 data-i18n="cl.s3h">Implants</h3><p data-i18n="cl.s3p"></p><p class="price" data-i18n="cl.s3pr">from EGP 9,000</p></div>
  </div>
</div>
<div class="sec">
  <h2 data-i18n="cl.dh">Who you will actually see</h2>
  <div class="strip">
    <div class="doc"><span class="av"></span><div><h3 data-i18n="cl.d1n">Dr Yasmine Adel</h3><p data-i18n="cl.d1s"></p></div></div>
    <div class="doc"><span class="av"></span><div><h3 data-i18n="cl.d2n">Dr Omar Shafik</h3><p data-i18n="cl.d2s"></p></div></div>
    <div class="doc"><span class="av"></span><div><h3 data-i18n="cl.d3n">Dr Hana Mostafa</h3><p data-i18n="cl.d3s"></p></div></div>
  </div>
</div>
<div class="quote">
  <p data-i18n="cl.q"></p>
  <span data-i18n="cl.qn">Mariam S.</span>
</div>
<div class="band">
  <h2 data-i18n="cl.bandh">Open Saturday to Thursday, 10am until 9pm.</h2>
  <span class="b1" data-i18n="cl.bandb">Book an appointment</span>
</div>
<div class="ft" data-i18n="cl.f">Nile Dental, 12 Nasr Road, Heliopolis, Cairo</div>
`;

function buildClinics() {
  for (const n of $$("[data-clinic]")) n.innerHTML = CLINIC;
}

/* Each example is a real page laid out at its own design width, then
   scaled into the frame. That is why it reads as a screenshot: the type,
   spacing and colour are the ones the live page would have. */
function fitScreens() {
  for (const sc of $$(".screen")) {
    const view = sc.parentElement;
    const w = Number(sc.dataset.w) || 1280;
    const avail = view.clientWidth;
    if (!avail) continue;
    // Below about a phone width, shrinking a 1280px page to fit makes the
    // type unreadable, so hold a floor and let the frame crop instead.
    const k = avail < 560 && w > 600 ? Math.max(avail / w, 0.5) : avail / w;
    sc.style.width = w + "px";
    sc.style.transform = "scale(" + k + ")";
    if (sc.dataset.fit === "phone") continue;          // fixed-height frame
    const h = sc.dataset.pan
      ? Math.min(Number(sc.dataset.vh) * k, 470)
      : sc.offsetHeight * k;
    view.style.height = Math.round(h) + "px";
  }
}

/* =========================== counters =========================== */
function countUp(scope = document) {
  for (const el of $$("[data-tick]", scope)) {
    const to = Number(el.dataset.tick);
    const loc = lang === "ar" ? "ar-EG" : "en-US";
    if (REDUCED) { el.textContent = to.toLocaleString(loc); continue; }
    const t0 = performance.now(), dur = 1200;
    (function step(now) {
      const k = Math.min(1, (now - t0) / dur);
      el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))).toLocaleString(loc);
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }
}

/* =========================== boot =========================== */
function start() {
  paintPrices();
  initTabs();
  fitScreens();
  addEventListener("resize", fitScreens, { passive: true });

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

buildClinics();

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
