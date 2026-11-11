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
| Hero (centred, dealt) | The Axiom mark large on the page axis, the headline, two buttons, and a clinic's website scrolling itself in a lit frame |
| Work (tabs tour) | Five real example screens: a clinic site, a fabric store, a delivery app, an invoices system, three automations. They move on by themselves every 7 s and pause on hover, focus or off screen (the brief) |
| Systems (big scene) | `powers-of-ten-pullback`: the invoices system fills the screen and the scroll pulls the camera back until it is a device on the lit ground |
| Tools (the one inverse band) | A hub diagram with the real WhatsApp, Gmail, Maps, Instagram, Facebook, Visa, Mastercard and Apple Pay marks; Fawry, Paymob and InstaPay named in type |
| Prices (two screens) | The Egypt / Gulf switch, four plans, then automation (a lanes diagram) and monthly care (the owner's status panel) |
| Questions | Six answers, open |
| Quote | The form, beside a phone showing the quote arriving on WhatsApp |
| Footer | The close (one large button) and the dark footer |

**Language.** A popup asks Arabic or English on the first visit and never again.
Every string is in the `T` dictionary in `assets/js/site.js`; the example screens
switch language and direction with the page.

**Dark by default**, near-black with sand-coloured type and one cobalt action
colour. The colour on the page comes from the work: the sage lit ground, the
example screens and the real logos.

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
- `gate.mjs`: OPEN after its three rounds, with five waivers in `.taste-skill/waivers.json`
  (the language popup, the marquee, the scene's markup, the centred hero's frame, the band's
  contrast). The open findings are listed in the build report.

## Still to do

- A real form endpoint and the WhatsApp number.
- Real client work in place of the example screens as it ships.
