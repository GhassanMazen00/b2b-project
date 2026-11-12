# Axiom

Marketing site for a studio that builds websites, online stores, mobile apps,
business systems and automation for companies in Egypt and the Gulf.

Static HTML, no build step. Built on the taste-skill kit (its system, hero,
scene, moment and diagram files under `assets/`), with the page's own copy,
example screens and script in `assets/css` and `assets/js`. About 800 KB.

## What the page is

Every part below was dealt by the kit (`references/sections.md`), not picked by
taste, except where the brief asked for something else.

| Section | What it shows |
|---|---|
| Header | A glass capsule floating over the page: four words, the logo in the middle and the main button. On phones and tablets, the kit's solid bar and menu sheet. The language is chosen once, in the popup on arrival |
| Hero | Centred: the logo drawn large (its brackets close in like a lens finding focus, then breathe, the cobalt block glowing), the name **axiom** with a blinking cursor, a one-line `>` prompt and two buttons, over `dot-terrain`, a field of light points rolling toward a horizon |
| Work (tabs tour) | Five real example screens: a clinic site, a clinic's booking page, a delivery app, an invoices system, three automations. They move on by themselves every 7 s and pause on hover, focus or off screen |
| Care | Automation (a lanes diagram) and monthly care (the owner's status panel), each with its order button |
| One system | A hub diagram: your system in the middle, joined to clients, bookings, bills, income, expenses, stock, staff and reports, beside the line "Your whole business in one system" |
| Prices | In US dollars (USD), with an Egypt / Gulf switch: website, booking website (the featured plan; it can also be an online store with WhatsApp orders and cash on delivery), mobile app and business system, each with its full list of what is included and its order button |
| Questions | Six answers, open |
| Quote | The form, beside a phone showing the quote arriving on WhatsApp |
| Footer | The close (one large button) and the dark footer |

A fine film grain moves over the whole page; it holds still for anyone who has asked their
system for reduced motion.

**Language.** A popup asks Arabic or English on the first visit and never again.
Every string is in the `T` dictionary in `assets/js/site.js`; the example screens
switch language and direction with the page.

**The logo** is a frame: four corner brackets around one cobalt block, a cursor in focus. It is in the hero, the footer, the language popup and the favicon; the header carries the word alone.

**Code theme.** All text is set in JetBrains Mono (Arabic letters fall through to Readex Pro). Each section headline opens with a `// 01` comment, the header links read as `/paths`, questions open with `>`, and included features are listed with `+`. The example screens keep their own type: they are clients' sites.

**Dark throughout.** Every ground is near-black, with sand-coloured type and one
cobalt action colour; the kit's lit grounds are re-toned to their evening grade.
The only light surfaces are inside the example screens, which are clients' sites.

## Make it yours

| What | Where |
|---|---|
| All copy, both languages | `T` in `assets/js/site.js` |
| Prices, both markets | `PRICES` in the same file |
| The example screens | the `.screen` blocks in `index.html` and `CLINIC` in `site.js`; their styles in `assets/css/screens.css` |
| Form endpoint | `data-endpoint` on the quote form; until then it opens an email to `hello@axiom.example` |
| Domain | the commented `canonical` line in the head |

## Checked

The kit's own checks, in headless Chromium:

- `copy-lint`: 0 FAIL, 0 WARN.
- `layout/check.mjs` at 1440x900, 1024x768, 820x1180, 768x1024 and 390x844: no findings.
- The page's motion: the hero's field of points, the logo, the examples, the marquee row, the diagrams
  and the grain. All of it runs on phones too; it holds still only under reduced motion.

## Still to do

- A real form endpoint and the WhatsApp number.
- Real client work in place of the example screens as it ships.
