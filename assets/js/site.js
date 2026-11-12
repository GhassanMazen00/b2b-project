/* Axiom — the page's own script: the copy in Arabic and English, the language popup the client
   asked for, the examples that advance by themselves (the client's brief), the example screens
   scaled into their frames, and the market switch on the prices. Nav, tabs, the form, the moment,
   the scene, hovers and the diagram are the kit's (system.js, motion.js, scenes.js, mount.js). */

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const REDUCED = matchMedia("(prefers-reduced-motion: reduce)").matches;

const T = {
  en: {
    "skip":"Skip to content",
    "nav.work":"Work","nav.system":"Systems","nav.prices":"Prices","nav.faq":"Questions",
    "cta.quote":"Get a quote","cta.work":"See the work",
    "hero.h1":"Web, app and system studio in Cairo",
    "hero.lead":"Websites, online stores, apps and the systems behind them, built for the way business is done here.","hero.art":"The Axiom mark, a folded peak, drawn in lines",
    "hero.alt":"A dental clinic's website built by Axiom, with its prices, doctors and booking button",

    "work.h2":"Websites, stores, apps and systems.","work.h2b":"Pick one to see it.",
    "tab.site":"Get a website","tab.store":"Sell online","tab.app":"Launch an app",
    "tab.system":"Run the business","tab.auto":"Automate the routine",
    "tp.site":"Five pages in Arabic and English, built for phones and set up so Google finds you. From {site}, live in 10 days.",
    "tp.store":"A catalogue with stock counts and checkout through Fawry, Paymob, InstaPay or cash on delivery. From {shop}, live in 3 weeks.",
    "tp.app":"An app your customers install from a link, with offline use and push notifications. From {app}, live in 3 to 4 weeks.",
    "tp.system":"Stock, invoices, customers and staff permissions in one place, with approval before anything posts. From {system}.",
    "tp.auto":"Reports that send themselves, stock alerts and WhatsApp replies after hours. From {auto}, running in 1 to 2 weeks.",
    "work.link":"See every price",
    "sc.site":"A dental clinic's website in Heliopolis",
    "sc.store":"A fabric shop's online store with six fabrics, prices per metre and four ways to pay",
    "sc.app":"A delivery app on a phone, listing today's drops and the cash collected",
    "sc.system":"An invoices dashboard with this month's totals, a chart and five invoices",
    "sc.auto":"Three automations: new orders, low stock and the morning report",
    "mq.1":"Clinics","mq.2":"Fabric traders","mq.3":"Restaurants","mq.4":"Pharmacies","mq.5":"Workshops","mq.6":"Schools",
    "mq.7":"Cairo","mq.8":"Alexandria","mq.9":"Riyadh","mq.10":"Jeddah","mq.11":"Dubai","mq.12":"Kuwait City","mq.13":"Doha",

    "pb.label":"Business systems","pb.h2":"Stock, invoices and staff in one system",
    "pb.p":"Each employee sees what their role allows, and nothing posts to the books until someone approves it. From $1,500, built in 4 to 6 weeks.",
    "pb.btn":"See system prices",

    "tools.h2":"Works with WhatsApp and your payments.","tools.h2b":"Fawry, Paymob and InstaPay included.",
    "tools.p":"Orders arrive on WhatsApp, receipts go out by email, and customers pay the way they already do. You see all of it in one place.",
    "tools.1":"Fawry, Paymob and InstaPay at checkout","tools.2":"Visa, Mastercard, Apple Pay and Google Pay","tools.3":"WhatsApp alerts on every order",

    "price.h2":"Prices in dollars.","price.h2b":"Written down before you call.",
    "market.label":"Market","market.eg":"Egypt","market.gulf":"Gulf",
    "plan.popular":"Most asked",
    "plan.site":"Website","plan.site.t":"One-off · ready in 10 days",
    "plan.site.1":"Five pages, Arabic and English","plan.site.2":"WhatsApp button and map","plan.site.3":"Set up for Google search",
    "plan.store":"Online store","plan.store.t":"One-off · ready in 3 weeks",
    "plan.store.1":"Products, stock and orders","plan.store.2":"Fawry, Paymob, InstaPay, cash","plan.store.3":"A WhatsApp alert per order",
    "plan.app":"Mobile app","plan.app.t":"One-off · ready in 3 to 4 weeks",
    "plan.app.1":"Installs from a link","plan.app.2":"Works offline","plan.app.3":"Push notifications",
    "plan.system":"Business system","plan.system.t":"One-off · ready in 4 to 6 weeks",
    "plan.system.1":"Stock, invoices, customers","plan.system.2":"A role for each employee","plan.system.3":"Approval before posting",
    "plan.auto":"Automation","plan.auto.t":"One-off · running in 1 to 2 weeks","plan.auto.p":"Daily reports, stock alerts and WhatsApp replies, set up once. From",
    "plan.care":"Monthly care","plan.care.t":"Per month · stop any time","plan.care.p":"Hosting, backups, updates and a person on WhatsApp, Sunday to Thursday.",

    "faq.h2":"Questions","faq.p":"The six we hear every week.","faq.link":"Ask us yours",
    "q1":"Why is the price lower than other studios?",
    "a1":"Because the work takes less time. Modern tools remove the repetitive parts, so a job that takes two months elsewhere takes us two weeks, and we charge for the two weeks.",
    "q2":"Is the price final?","a2":"Yes. The quote is written and lists what is included. Anything extra is priced and agreed before it starts.",
    "q3":"Who owns the website and the domain?","a3":"You do. The domain is registered in your name and the code is handed over at the end.",
    "q4":"Do I have to pay the $50 a month?","a4":"No. You can host it anywhere. The monthly care is for owners who would rather not handle hosting, backups and updates.",
    "q5":"What does daily support mean?","a5":"A person answers on WhatsApp, Sunday to Thursday, within 24 hours and usually the same day.",
    "q6":"Do you work outside Egypt?","a6":"Yes, in Saudi Arabia, the UAE, Kuwait and Qatar. Meetings are online and Gulf prices show when you switch the market above.",

    "quote.h2":"A written quote in 24 hours",
    "quote.p":"Tell us what the business does. You get a price and a delivery date back, and nothing is billed until you agree.",
    "st.1":"You send this form","st.1p":"Five minutes, no call needed.",
    "st.2":"We send the quote","st.2p":"Price, date and what is included.",
    "st.3":"You watch it being built","st.3p":"A link to the work in progress.",
    "st.4":"You get the keys","st.4p":"Domain, code and training.",
    "f.name":"Your name","f.name.err":"Write your name.","f.company":"Company",
    "f.email":"Email","f.email.err":"Write an email address with an @.","f.wa":"WhatsApp number",
    "f.need":"What you need","f.note":"What slows the business down","f.reply":"We reply on WhatsApp or by email, Sunday to Thursday, within 24 hours.",
    "f.sent":"Your quote request is in. We reply within 24 hours.","f.notsure":"Not sure yet",

    "close.h2":"Tell us what the business needs","close.p":"A written price and a delivery date, within 24 hours.",
    "foot.lede":"Websites, apps and business systems for companies in Egypt and the Gulf.",
    "foot.build":"Build","foot.studio":"Studio","foot.talk":"Talk to us","foot.tools":"Tools we connect",
    "foot.tm":"Product names and logos are trademarks of their owners.",
    "gate.label":"Choose a language",
    "hero.sr":": websites, booking pages, apps and business systems for Egypt and the Gulf",
    "hero.lead":"Websites, bookings, apps and systems for Egypt and the Gulf.",
    "cta.work":"See what we build",
    "tab.store":"Take bookings","price.h2":"Prices in US dollars (USD).",
    "tp.store":"Customers pick a service, a day and a time, and get a WhatsApp reminder. Pay on arrival or by transfer. From {shop}.",
    "sc.book":"A clinic's booking page: a service, a day and a time chosen, and the confirm button",
    "tools.h2":"Your whole business in one system.","tools.h2b":"Open it in the morning and everything is there.",
    "tools.p":"No more notebooks, spreadsheets and five apps that never agree. Clients, bookings, bills and money live in one place, and every number adds up.",
    "tools.1":"Every client with their history and what they owe","tools.2":"Bookings, bills and payments received, on one screen","tools.3":"Income and expenses in a report every morning",
    "foot.tools":"One system",
    "hub.alt":"Your system in the middle, joined to your clients, bookings, bills, income, expenses, stock, staff and reports.","hub.center":"Your system","hub.1":"Clients","hub.2":"Bookings","hub.3":"Bills","hub.4":"Income","hub.5":"Expenses","hub.6":"Stock","hub.7":"Staff","hub.8":"Reports",
    "plan.site.1":"Up to five pages, Arabic and English","plan.site.2":"Built for phones first","plan.site.3":"WhatsApp, Instagram, Facebook and TikTok linked",
    "plan.site.4":"Google Maps location and opening hours","plan.site.5":"Contact form to your email","plan.site.6":"Set up for Google search","plan.site.7":"Domain and security certificate set up",
    "plan.book":"Booking website","plan.book.t":"One-off · ready in 3 weeks",
    "plan.book.1":"Everything in the website","plan.book.2":"Customers book a service, day and time","plan.book.3":"Your hours, staff and breaks respected",
    "plan.book.4":"WhatsApp and email confirmations and reminders","plan.book.5":"A screen to see and move bookings","plan.book.6":"Pay on arrival, by InstaPay or bank transfer",
    "plan.book.7":"Or an online store: orders on WhatsApp, cash on delivery","order.book":"Order a booking site",
    "plan.app.1":"Installs from a link, your logo on the home screen","plan.app.2":"Bookings, orders or loyalty points","plan.app.3":"Works offline",
    "plan.app.4":"Push notifications to your customers","plan.app.5":"A dashboard to manage it all","plan.app.6":"App Store and Google Play quoted separately",
    "plan.system.1":"Clients, bookings and bills","plan.system.2":"Income, expenses and stock","plan.system.3":"A role and permissions for each employee",
    "plan.system.4":"Approval before anything is posted","plan.system.5":"Daily reports, exported to Excel","plan.system.6":"WhatsApp and email alerts",
    "bk.step":"Book an appointment · step 2 of 3","bk.svc":"Service","bk.s1":"Check-up","bk.s1t":"30 min · EGP 350","bk.s2":"Scale and polish","bk.s2t":"40 min · EGP 450",
    "bk.s3":"Whitening","bk.s3t":"60 min · EGP 2,400","bk.doc":"Doctor","bk.day":"Day","bk.d1":"Sat","bk.d2":"Sun","bk.d3":"Mon","bk.d4":"Tue","bk.d5":"Wed","bk.d6":"Thu",
    "bk.time":"Time","bk.sum":"Your booking","bk.when":"Sunday 15 March, 11:30","bk.what":"Check-up with Dr Yasmine Adel","bk.price":"EGP 350, paid at the clinic",
    "bk.btn":"Confirm booking","bk.note":"A confirmation and a reminder come on WhatsApp.",
    "nav.care":"Care","care.h2":"Automation and monthly care.","care.h2b":"The work after launch.",
    "plan.care.per":" a month","care.alt":"The monthly care panel: last backup, uptime, the certificate date and the change hours used",
    "care.h":"nileclinic.com · this month","care.r1":"Last backup","care.v1":"Today, 03:00","care.r2":"Online","care.v2":"99.98%",
    "care.r3":"Security certificate","care.v3":"Renews 12 August","care.r4":"Changes used","care.v4":"1 h 20 of 2 h",
    "wa.alt":"The quote arriving on WhatsApp: a website, $300, live on 24 March","wa.online":"online","wa.day":"Today",
    "wa.q":"Hi, we need a site for the clinic in Arabic and English, with booking.","wa.a1":"Here is your quote for Nile Dental:",
    "wa.qt":"Website, five pages","wa.l1":"Arabic and English","wa.l2":"Booking button and map","wa.l3":"Live on 24 March",
    "wa.a2":"Reply OK and we start on Sunday.","wa.ok":"OK 👍",
    "plan.auto.h":"Automation for daily work","plan.care.h":"Monthly care for your site",
    "order.site":"Order a website","order.store":"Order a store","order.app":"Order an app","order.system":"Order a system","order.auto":"Order automation","order.care":"Add monthly care",
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
    "cl.bandh":"Open Saturday to Thursday, 10am until 9pm, on Nasr Road in Heliopolis.",
    "cl.bandb":"Book an appointment",
    "cl.f":"Nile Dental · Nasr Road, Heliopolis, Cairo",
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
    "sy.a1":"84,500","sy.a2":"31,200","sy.a3":"12,860","sy.a4":"57,400","sy.a5":"22,150",  },
  ar: {
    "skip":"انتقل إلى المحتوى",
    "nav.work":"أعمالنا","nav.system":"الأنظمة","nav.prices":"الأسعار","nav.faq":"أسئلة",
    "cta.quote":"اطلب عرض سعر","cta.work":"شوف الشغل",
    "hero.h1":"استوديو مواقع وتطبيقات وأنظمة في القاهرة",
    "hero.lead":"مواقع ومتاجر إلكترونية وتطبيقات والأنظمة اللي وراها، مبنية على طريقة الشغل هنا.","hero.art":"شعار أكسيوم، قمة مطوية مرسومة بالخطوط",
    "hero.alt":"موقع عيادة أسنان من تنفيذ أكسيوم، فيه الأسعار والأطباء وزر الحجز",

    "work.h2":"مواقع ومتاجر وتطبيقات وأنظمة.","work.h2b":"اختار واحدة وشوفها.",
    "tab.site":"اعمل موقعك","tab.store":"بيع أونلاين","tab.app":"نزّل تطبيقك",
    "tab.system":"أدِر شغلك","tab.auto":"خلّي الروتين أوتوماتيك",
    "tp.site":"خمس صفحات بالعربي والإنجليزي، مبنية للموبايل ومجهزة علشان جوجل يلاقيك. من {site}، وتشتغل خلال ١٠ أيام.",
    "tp.store":"كتالوج بأرصدة المخزون ودفع بفوري أو باي موب أو إنستاباي أو عند الاستلام. من {shop}، ويشتغل خلال ٣ أسابيع.",
    "tp.app":"تطبيق عملاءك بينزلوه من لينك، يشتغل من غير نت ويبعت إشعارات. من {app}، خلال ٣ إلى ٤ أسابيع.",
    "tp.system":"المخزون والفواتير والعملاء وصلاحيات الموظفين في مكان واحد، ومراجعة قبل أي ترحيل. من {system}.",
    "tp.auto":"تقارير بتتبعت لوحدها، وتنبيهات مخزون، وردود واتساب بعد المواعيد. من {auto}، وتشتغل خلال أسبوع لأسبوعين.",
    "work.link":"شوف كل الأسعار",
    "sc.site":"موقع عيادة أسنان في مصر الجديدة",
    "sc.store":"متجر أقمشة أونلاين فيه ست أقمشة بسعر المتر وأربع طرق دفع",
    "sc.app":"تطبيق توصيل على الموبايل فيه توصيلات اليوم والمبلغ المحصّل",
    "sc.system":"لوحة فواتير فيها إجماليات الشهر ورسم بياني وخمس فواتير",
    "sc.auto":"تلات أتمتات: الطلبات الجديدة والمخزون القليل وتقرير الصبح",
    "mq.1":"عيادات","mq.2":"تجار أقمشة","mq.3":"مطاعم","mq.4":"صيدليات","mq.5":"ورش","mq.6":"مدارس",
    "mq.7":"القاهرة","mq.8":"الإسكندرية","mq.9":"الرياض","mq.10":"جدة","mq.11":"دبي","mq.12":"الكويت","mq.13":"الدوحة",

    "pb.label":"أنظمة إدارة الأعمال","pb.h2":"المخزون والفواتير والموظفين في نظام واحد",
    "pb.p":"كل موظف بيشوف اللي صلاحيته تسمح بيه، ومفيش حاجة بتترحّل للدفاتر قبل ما حد يوافق. من ١٥٠٠ دولار، والتنفيذ من ٤ لـ ٦ أسابيع.",
    "pb.btn":"شوف أسعار الأنظمة",

    "tools.h2":"بيشتغل مع واتساب ومع طرق الدفع.","tools.h2b":"فوري وباي موب وإنستاباي ضمنها.",
    "tools.p":"الطلبات بتوصل على واتساب، والإيصالات بتروح بالإيميل، والعملاء بيدفعوا بالطريقة اللي متعودين عليها. وإنت شايف كل ده في مكان واحد.",
    "tools.1":"فوري وباي موب وإنستاباي في الدفع","tools.2":"فيزا وماستركارد وآبل باي وجوجل باي","tools.3":"تنبيه واتساب مع كل طلب",

    "price.h2":"الأسعار بالدولار.","price.h2b":"مكتوبة قبل ما تكلمنا.",
    "market.label":"السوق","market.eg":"مصر","market.gulf":"الخليج",
    "plan.popular":"الأكثر طلباً",
    "plan.site":"موقع","plan.site.t":"مرة واحدة · جاهز في ١٠ أيام",
    "plan.site.1":"خمس صفحات بالعربي والإنجليزي","plan.site.2":"زر واتساب وخريطة","plan.site.3":"مجهز لبحث جوجل",
    "plan.store":"متجر إلكتروني","plan.store.t":"مرة واحدة · جاهز في ٣ أسابيع",
    "plan.store.1":"منتجات ومخزون وطلبات","plan.store.2":"فوري وباي موب وإنستاباي وكاش","plan.store.3":"تنبيه واتساب مع كل طلب",
    "plan.app":"تطبيق موبايل","plan.app.t":"مرة واحدة · جاهز في ٣ إلى ٤ أسابيع",
    "plan.app.1":"بيتثبّت من لينك","plan.app.2":"بيشتغل من غير نت","plan.app.3":"إشعارات للعملاء",
    "plan.system":"نظام إدارة","plan.system.t":"مرة واحدة · جاهز في ٤ إلى ٦ أسابيع",
    "plan.system.1":"مخزون وفواتير وعملاء","plan.system.2":"صلاحية لكل موظف","plan.system.3":"موافقة قبل الترحيل",
    "plan.auto":"أتمتة","plan.auto.t":"مرة واحدة · تشتغل خلال أسبوع لأسبوعين","plan.auto.p":"تقارير يومية وتنبيهات مخزون وردود واتساب، بتتظبط مرة واحدة. من",
    "plan.care":"المتابعة الشهرية","plan.care.t":"شهرياً · توقفها أي وقت","plan.care.p":"استضافة ونسخ احتياطي وتحديثات وحد بيرد على واتساب من الأحد للخميس.",

    "faq.h2":"أسئلة","faq.p":"الست أسئلة اللي بتيجي كل أسبوع.","faq.link":"ابعت لنا سؤالك",
    "q1":"ليه السعر أقل من مكاتب تانية؟",
    "a1":"لأن الشغل بياخد وقت أقل. الأدوات الحديثة بتشيل الجزء المتكرر، فالمشروع اللي بياخد شهرين عند غيرنا بناخده في أسبوعين، وبنحاسبك على الأسبوعين.",
    "q2":"السعر نهائي؟","a2":"أيوه. العرض مكتوب وفيه كل اللي داخل. أي إضافة بتتسعّر ونتفق عليها قبل ما تبدأ.",
    "q3":"الموقع والدومين ملك مين؟","a3":"ملكك إنت. الدومين بيتسجل باسمك والكود بيتسلّم لك في الآخر.",
    "q4":"لازم أدفع الـ ٥٠ دولار في الشهر؟","a4":"لأ. تقدر تستضيفه في أي مكان. المتابعة الشهرية لأصحاب الشغل اللي مش عايزين يتعاملوا مع الاستضافة والنسخ الاحتياطي والتحديثات.",
    "q5":"يعني إيه دعم يومي؟","a5":"في حد بيرد عليك على واتساب، من الأحد للخميس، خلال ٢٤ ساعة وغالباً في نفس اليوم.",
    "q6":"بتشتغلوا برة مصر؟","a6":"أيوه، في السعودية والإمارات والكويت وقطر. الاجتماعات أونلاين وأسعار الخليج بتظهر لما تغيّر السوق فوق.",

    "quote.h2":"عرض سعر مكتوب خلال ٢٤ ساعة",
    "quote.p":"قول لنا شغلك بيعمل إيه. هيوصلك سعر وتاريخ تسليم، ومحدش بيدفع حاجة قبل ما يوافق.",
    "st.1":"تبعت النموذج ده","st.1p":"خمس دقايق، من غير مكالمة.",
    "st.2":"نبعت لك العرض","st.2p":"السعر والتاريخ وكل اللي داخل.",
    "st.3":"تتابع التنفيذ","st.3p":"لينك تشوف عليه الشغل وهو بيتعمل.",
    "st.4":"تستلم المفاتيح","st.4p":"الدومين والكود والتدريب.",
    "f.name":"اسمك","f.name.err":"اكتب اسمك.","f.company":"الشركة",
    "f.email":"الإيميل","f.email.err":"اكتب إيميل فيه @.","f.wa":"رقم الواتساب",
    "f.need":"محتاج إيه","f.note":"إيه اللي معطّل شغلك","f.reply":"بنرد على واتساب أو بالإيميل، من الأحد للخميس، خلال ٢٤ ساعة.",
    "f.sent":"طلب عرض السعر وصل. هنرد خلال ٢٤ ساعة.","f.notsure":"لسه مش متأكد",

    "close.h2":"قول لنا شغلك محتاج إيه","close.p":"سعر مكتوب وتاريخ تسليم، خلال ٢٤ ساعة.",
    "foot.lede":"مواقع وتطبيقات وأنظمة إدارة لشركات مصر والخليج.",
    "foot.build":"اللي بنبنيه","foot.studio":"الاستوديو","foot.talk":"كلّمنا","foot.tools":"الأدوات اللي بنربطها",
    "foot.tm":"أسماء المنتجات وشعاراتها علامات تجارية لأصحابها.",
    "gate.label":"اختار اللغة",
    "hero.sr":": مواقع وصفحات حجز وتطبيقات وأنظمة للشركات في مصر والخليج",
    "hero.lead":"مواقع وحجوزات وتطبيقات وأنظمة لمصر والخليج.",
    "cta.work":"شوف بنعمل إيه",
    "tab.store":"استقبل حجوزات","price.h2":"الأسعار بالدولار الأمريكي (USD).",
    "tp.store":"العميل يختار الخدمة واليوم والميعاد، ويوصله تذكير على واتساب. الدفع عند الحضور أو بالتحويل. من {shop}.",
    "sc.book":"صفحة حجز عيادة: خدمة ويوم وميعاد متختارين وزر التأكيد",
    "tools.h2":"شغلك كله في نظام واحد.","tools.h2b":"تفتحه الصبح تلاقي كل حاجة قدامك.",
    "tools.p":"كفاية كشاكيل وشيتات وخمس برامج مش متفقين. العملاء والحجوزات والفواتير والفلوس في مكان واحد، وكل رقم مظبوط.",
    "tools.1":"كل عميل بتاريخه واللي عليه","tools.2":"الحجوزات والفواتير والمدفوعات في شاشة واحدة","tools.3":"الدخل والمصروفات في تقرير كل صباح",
    "foot.tools":"نظام واحد",
    "hub.alt":"نظامك في النص، ومربوط بيه العملاء والحجوزات والفواتير والدخل والمصروفات والمخزون والموظفين والتقارير.","hub.center":"نظامك","hub.1":"العملاء","hub.2":"الحجوزات","hub.3":"الفواتير","hub.4":"الدخل","hub.5":"المصروفات","hub.6":"المخزون","hub.7":"الموظفين","hub.8":"التقارير",
    "plan.site.1":"حتى خمس صفحات، عربي وإنجليزي","plan.site.2":"مبني للموبايل الأول","plan.site.3":"واتساب وإنستجرام وفيسبوك وتيك توك مربوطين",
    "plan.site.4":"موقعك على خرائط جوجل ومواعيد العمل","plan.site.5":"نموذج تواصل يوصل على إيميلك","plan.site.6":"مجهز لبحث جوجل","plan.site.7":"تجهيز الدومين وشهادة الأمان",
    "plan.book":"موقع حجوزات","plan.book.t":"مرة واحدة · جاهز في ٣ أسابيع",
    "plan.book.1":"كل اللي في الموقع","plan.book.2":"العميل يحجز خدمة ويوم وميعاد","plan.book.3":"مواعيدك وموظفينك والبريكات محسوبة",
    "plan.book.4":"تأكيد وتذكير على واتساب والإيميل","plan.book.5":"شاشة تشوف فيها الحجوزات وتغيّرها","plan.book.6":"الدفع عند الحضور أو إنستاباي أو تحويل بنكي",
    "plan.book.7":"أو متجر أونلاين: الطلبات على واتساب والدفع عند الاستلام","order.book":"اطلب موقع حجوزات",
    "plan.app.1":"بيتثبّت من لينك، ولوجوك على الشاشة","plan.app.2":"حجوزات أو طلبات أو نقاط ولاء","plan.app.3":"بيشتغل من غير نت",
    "plan.app.4":"إشعارات لعملائك","plan.app.5":"لوحة تحكم تدير منها كل حاجة","plan.app.6":"آب ستور وجوجل بلاي بعرض سعر منفصل",
    "plan.system.1":"العملاء والحجوزات والفواتير","plan.system.2":"الدخل والمصروفات والمخزون","plan.system.3":"صلاحيات لكل موظف",
    "plan.system.4":"موافقة قبل أي ترحيل","plan.system.5":"تقارير يومية تتصدّر لإكسل","plan.system.6":"تنبيهات واتساب وإيميل",
    "bk.step":"احجز ميعاد · الخطوة ٢ من ٣","bk.svc":"الخدمة","bk.s1":"كشف","bk.s1t":"٣٠ دقيقة · ٣٥٠ جنيه","bk.s2":"تنظيف وتلميع","bk.s2t":"٤٠ دقيقة · ٤٥٠ جنيه",
    "bk.s3":"تبييض","bk.s3t":"٦٠ دقيقة · ٢٤٠٠ جنيه","bk.doc":"الطبيب","bk.day":"اليوم","bk.d1":"سبت","bk.d2":"أحد","bk.d3":"اتنين","bk.d4":"تلات","bk.d5":"أربع","bk.d6":"خميس",
    "bk.time":"الميعاد","bk.sum":"حجزك","bk.when":"الأحد ١٥ مارس، ١١:٣٠","bk.what":"كشف مع د. ياسمين عادل","bk.price":"٣٥٠ جنيه، الدفع في العيادة",
    "bk.btn":"أكّد الحجز","bk.note":"التأكيد والتذكير بيوصلوا على واتساب.",
    "nav.care":"المتابعة","care.h2":"الأتمتة والمتابعة الشهرية.","care.h2b":"الشغل اللي بعد الإطلاق.",
    "plan.care.per":" في الشهر","care.alt":"لوحة المتابعة الشهرية: آخر نسخة احتياطية ونسبة التشغيل وتاريخ الشهادة وساعات التعديل",
    "care.h":"nileclinic.com · الشهر ده","care.r1":"آخر نسخة احتياطية","care.v1":"النهارده، ٣:٠٠ ص","care.r2":"شغال","care.v2":"٩٩٫٩٨٪",
    "care.r3":"شهادة الأمان","care.v3":"بتتجدد ١٢ أغسطس","care.r4":"التعديلات المستخدمة","care.v4":"ساعة و٢٠ من ساعتين",
    "wa.alt":"عرض السعر واصل على واتساب: موقع بـ ٣٠٠ دولار، يشتغل ٢٤ مارس","wa.online":"متصل","wa.day":"النهارده",
    "wa.q":"أهلاً، محتاجين موقع للعيادة بالعربي والإنجليزي، وفيه حجز.","wa.a1":"ده عرض السعر لنايل دنتال:",
    "wa.qt":"موقع، خمس صفحات","wa.l1":"عربي وإنجليزي","wa.l2":"زر حجز وخريطة","wa.l3":"يشتغل ٢٤ مارس",
    "wa.a2":"رد بـ تمام ونبدأ يوم الأحد.","wa.ok":"تمام 👍",
    "plan.auto.h":"أتمتة للشغل اليومي","plan.care.h":"متابعة شهرية لموقعك",
    "order.site":"اطلب موقع","order.store":"اطلب متجر","order.app":"اطلب تطبيق","order.system":"اطلب نظام","order.auto":"اطلب أتمتة","order.care":"ضيف المتابعة الشهرية",
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
    "cl.bandh":"مفتوح من السبت للخميس، من ١٠ صباحاً لـ ٩ مساءً، في شارع النصر بمصر الجديدة.",
    "cl.bandb":"احجز ميعاد",
    "cl.f":"نايل دنتال · شارع النصر، مصر الجديدة، القاهرة",
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
    "sy.a1":"٨٤٬٥٠٠","sy.a2":"٣١٬٢٠٠","sy.a3":"١٢٬٨٦٠","sy.a4":"٥٧٬٤٠٠","sy.a5":"٢٢٬١٥٠",  },
};

const HUB_ICONS = ["users","calendar-check","receipt","trending-up","wallet","package","user-cog","bar-chart-3"];
const NEEDS = ["plan.site","plan.book","plan.app","plan.system","plan.auto","plan.care","f.notsure"];

/* =========================== prices, by market =========================== */
const PRICES = {
  eg:   { site: 300,  shop: 700,  app: 900,  system: 1500, auto: 400,  care: 50  },
  gulf: { site: 1500, shop: 3500, app: 4500, system: 7500, auto: 2000, care: 200 },
};
let market = "eg";
try { market = localStorage.getItem("axiom.market") === "gulf" ? "gulf" : "eg"; } catch {}
const money = (n) => "$" + n.toLocaleString("en-US");

/* =========================== language =========================== */
let lang = null;
try { lang = localStorage.getItem("axiom.lang"); } catch {}

function fill(key, el) {
  let v = T[lang][key];
  if (v === undefined) return;
  // a panel line carries its price as {id}, so the market switch and the language share one sentence
  if (v.includes("{")) { el.innerHTML = v.replace(/\{(\w+)\}/g, (_, k) => `<b data-price="${k}">${money(PRICES[market][k])}</b>`); return; }
  el.textContent = v;
}

function applyLang(next, keep = true) {
  lang = next;
  const d = document.documentElement;
  d.lang = lang;
  d.dir = lang === "ar" ? "rtl" : "ltr";
  for (const el of $$("[data-i18n]")) fill(el.dataset.i18n, el);
  for (const el of $$("[data-i18n-label]")) { const v = T[lang][el.dataset.i18nLabel]; if (v) el.setAttribute("aria-label", v); }
  const sel = $("#f-need");
  sel.innerHTML = "";
  for (const k of NEEDS) sel.append(new Option(T[lang][k], k));
  $("#quote form").dataset.sent = T[lang]["f.sent"];
  for (const sc of $$(".screen")) { sc.dir = lang === "ar" ? "rtl" : "ltr"; sc.classList.toggle("ar", lang === "ar"); }
  // the hero's light: its calm side follows the words, so Arabic gets the mirror image
  const fxEl = $(".hero__fx");
  if (fxEl) {
    const calmX = lang === "ar" ? 0.73 : 0.27;
    try { fxEl.dataset.fxParams = JSON.stringify({ ...JSON.parse(fxEl.dataset.fxParams || "{}"), calmX }); } catch {}
    if (fxEl.__fx) fxEl.__fx.set({ calmX });
  }
  // the hub's labels follow the language: diagram.js reads its spec once, so it is drawn again here
  const hubEl = $("[data-i18n-dg]");
  if (hubEl && window.TPDiagram) {
    const t = T[lang];
    window.TPDiagram.mount(hubEl, {
      layout: "hub", size: "band", alt: t["hub.alt"],
      center: { label: t["hub.center"], icon: "ui:layout-dashboard" },
      spokes: HUB_ICONS.map((icon, i) => ({ label: t["hub." + (i + 1)], icon: "ui:" + icon })),
    }, { iconBase: "assets/icons/" });
  }
  paintPrices();
  requestAnimationFrame(fitScreens);
  if (keep) { try { localStorage.setItem("axiom.lang", lang); } catch {} }
}

/* The client asked for the language to be asked once, as a popup over the live page. The page
   behind it already runs in the browser's language; nothing is kept until the visitor chooses. */
function openGate() {
  const gate = $("#gate");
  // while it is open the page behind it takes no focus and no clicks
  const behind = [$("header.nav"), $("main"), $("footer")];
  for (const el of behind) el.inert = true;
  const choose = (l) => {
    applyLang(l);
    for (const el of behind) el.inert = false;
    gate.classList.remove("is-open");
    document.body.classList.remove("is-locked");
    setTimeout(() => gate.remove(), 500);
  };
  for (const b of $$(".gate__btn", gate)) b.addEventListener("click", () => choose(b.dataset.lang));
  addEventListener("keydown", (e) => { if (e.key === "Escape" && gate.isConnected) choose(lang); });
  document.body.classList.add("is-locked");
  setTimeout(() => { gate.classList.add("is-open"); $(".gate__btn", gate).focus({ preventScroll: true }); }, 500);
}

function paintPrices() {
  for (const n of $$("[data-price]")) n.textContent = money(PRICES[market][n.dataset.price]);
  $("#mEG").setAttribute("aria-selected", String(market === "eg"));
  $("#mGulf").setAttribute("aria-selected", String(market === "gulf"));
}

/* =========================== the example screens =========================== */
const CLINIC = `
<div class="x-hdr">
  <span class="x-brand" data-i18n="cl.brand">Nile Dental</span>
  <span class="x-lnk" data-i18n="cl.n1">Services</span>
  <span class="x-lnk" data-i18n="cl.n2">Doctors</span>
  <span class="x-lnk" data-i18n="cl.n3">Prices</span>
  <span class="x-lnk" data-i18n="cl.n4">Contact</span>
  <span class="x-cta" data-i18n="cl.cta">Book now</span>
</div>
<div class="x-hero">
  <div>
    <p data-h="1" data-i18n="cl.h1">Dental care in Heliopolis, booked in thirty seconds.</p>
    <p class="x-sub" data-i18n="cl.sub">Six dentists, one published price list, and an appointment you pick yourself.</p>
    <div class="x-btns">
      <span class="x-b1" data-i18n="cl.b1">Book an appointment</span>
      <span class="x-b2" data-i18n="cl.b2">See the price list</span>
    </div>
  </div>
  <div class="x-pic"></div>
</div>
<div class="x-sec">
  <p data-h="2" data-i18n="cl.sh">The three people ask for most</p>
  <div class="x-strip">
    <div class="x-card"><p data-h="3" data-i18n="cl.s1h">Scale and polish</p><p data-i18n="cl.s1p"></p><p class="x-price" data-i18n="cl.s1pr">EGP 450</p></div>
    <div class="x-card"><p data-h="3" data-i18n="cl.s2h">Whitening</p><p data-i18n="cl.s2p"></p><p class="x-price" data-i18n="cl.s2pr">EGP 2,400</p></div>
    <div class="x-card"><p data-h="3" data-i18n="cl.s3h">Implants</p><p data-i18n="cl.s3p"></p><p class="x-price" data-i18n="cl.s3pr">from EGP 9,000</p></div>
  </div>
</div>
<div class="x-sec">
  <p data-h="2" data-i18n="cl.dh">Who you will actually see</p>
  <div class="x-strip">
    <div class="x-doc"><span class="x-av"></span><div><p data-h="3" data-i18n="cl.d1n">Dr Yasmine Adel</p><p data-i18n="cl.d1s"></p></div></div>
    <div class="x-doc"><span class="x-av"></span><div><p data-h="3" data-i18n="cl.d2n">Dr Omar Shafik</p><p data-i18n="cl.d2s"></p></div></div>
    <div class="x-doc"><span class="x-av"></span><div><p data-h="3" data-i18n="cl.d3n">Dr Hana Mostafa</p><p data-i18n="cl.d3s"></p></div></div>
  </div>
</div>
<div class="x-quote">
  <p data-i18n="cl.q"></p>
  <span data-i18n="cl.qn">Mariam S.</span>
</div>
<div class="x-band">
  <p data-h="2" data-i18n="cl.bandh">Open Saturday to Thursday, 10am until 9pm.</p>
  <span class="x-b1" data-i18n="cl.bandb">Book an appointment</span>
</div>
<div class="x-ft" data-i18n="cl.f">Nile Dental, 12 Nasr Road, Heliopolis, Cairo</div>
`;


function buildClinics() { for (const n of $$("[data-clinic]")) n.innerHTML = CLINIC; }

/* Each example is a page laid out at its own design width, then scaled to its frame, so its type,
   spacing and colour are the ones the live page would have. Below a phone width a 1280px page is
   held at half size and the frame crops it, rather than shrinking the type to nothing. */
function fitScreens() {
  for (const sc of $$(".screen")) {
    const view = sc.parentElement;
    const w = Number(sc.dataset.w) || 1280;
    const avail = view.clientWidth;
    if (!avail) continue;
    const k = avail / w;
    sc.style.width = w + "px";
    sc.style.transform = "scale(" + k + ")";
    if (sc.dataset.fit === "phone" || view.closest(".work__slot, .pb__screen")) continue;   // the frame sets the height
    view.style.height = Math.round((sc.dataset.pan ? Number(sc.dataset.vh) : sc.offsetHeight) * k) + "px";
  }
}

/* the app example: the phone stands whole in its frame, scaled down to the frame's height when it is short */
function fitPhone() {
  const slot = $(".work__slot--phone"), phone = slot && $(".phone", slot);
  if (!slot || slot.hidden || !slot.clientHeight) return;
  phone.style.transform = "";
  const k = Math.min(1, (slot.clientHeight - 32) / phone.offsetHeight, (slot.clientWidth - 32) / phone.offsetWidth);
  phone.style.transform = "scale(" + k.toFixed(3) + ")";
}

/* =========================== the examples move on by themselves =========================== */
/* The client asked for it. The kit's tabs stay the kit's (system.js shows a tab's line and screen); the
   timer is the active tab's bar, so pausing the bar on hover, focus or off screen pauses the turn. */
function autoTour() {
  const list = $(".work__tabs");
  const tabs = $$('[role="tab"]', list);
  const box = $("#work .work");
  const why = new Set(["off"]);
  const hold = (k, on) => { on ? why.add(k) : why.delete(k); list.classList.toggle("is-paused", why.size > 0); };
  hold("off", true);
  const restart = (t) => { const bar = $(".tab__bar", t); bar.style.animation = "none"; void bar.offsetWidth; bar.style.animation = ""; };
  for (const t of tabs) {
    t.addEventListener("click", () => {
      restart(t);
      requestAnimationFrame(() => { fitScreens(); fitPhone(); });
      // the shown screen starts its own story again
      const shown = document.getElementById(t.getAttribute("aria-controls").split(" ")[1]);
      for (const n of $$(".x-bars i, .scroller, .s-shop .x-p, .s-auto .x-w", shown)) { n.style.animation = "none"; void n.offsetWidth; n.style.animation = ""; }
      countUp(shown);
    });
    $(".tab__bar", t).addEventListener("animationend", () => {
      const i = tabs.indexOf(t);
      tabs[(i + 1) % tabs.length].click();
    });
  }
  box.addEventListener("pointerenter", () => hold("hover", true));
  box.addEventListener("pointerleave", () => hold("hover", false));
  box.addEventListener("focusin", () => hold("focus", true));
  box.addEventListener("focusout", () => hold("focus", false));
  new IntersectionObserver(([e]) => hold("off", !e.isIntersecting), { threshold: 0.35 }).observe(box);
}

function countUp(scope) {
  const loc = lang === "ar" ? "ar-EG" : "en-US";
  for (const el of $$("[data-tick]", scope)) {
    const to = Number(el.dataset.tick);
    if (REDUCED) { el.textContent = to.toLocaleString(loc); continue; }
    const t0 = performance.now(), dur = 1100;
    (function step(now) {
      const k = Math.max(0, Math.min(1, (now - t0) / dur));
      el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))).toLocaleString(loc);
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }
}

/* =========================== boot =========================== */
buildClinics();
const chosen = lang === "ar" || lang === "en";
applyLang(chosen ? lang : ((navigator.language || "").toLowerCase().startsWith("ar") ? "ar" : "en"), chosen);
if (chosen) $("#gate").remove(); else openGate();

for (const b of [$("#mEG"), $("#mGulf")]) b.addEventListener("click", () => {
  market = b.dataset.market;
  try { localStorage.setItem("axiom.market", market); } catch {}
  paintPrices();
});
// a plan's own button picks its kind of work in the form
for (const b of $$("[data-need]")) b.addEventListener("click", () => { $("#f-need").value = b.dataset.need; });
autoTour();
countUp(document);
addEventListener("resize", () => { fitScreens(); fitPhone(); }, { passive: true });
document.fonts?.ready.then(fitScreens);
fitScreens();
fitPhone();
