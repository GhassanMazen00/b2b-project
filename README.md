# Axiom

Marketing site for a studio that builds websites, online stores, mobile apps,
business systems and automation for companies in Egypt and the Gulf.

Static HTML, one stylesheet, one script. No build step, no framework, no
dependencies. Around 70 KB plus Google Fonts.

## How it works

**A language gate opens the site.** First visit asks العربية or English before
anything else; the choice is remembered, and returning visitors go straight in.
Every string lives in the `T` dictionary in `assets/js/site.js` — pick a key,
write both languages, done. Switching flips `lang` and `dir`, and the whole
layout mirrors because the CSS uses logical properties throughout.

**Dark, and almost monochrome.** Near-black, near-white, one faint blue for
small labels. The colour on the page comes from the work, not from the chrome
— the way a portfolio should read.

**The examples are real screens, not wireframes.** Each service tab holds a
page designed at its own full size — 1280px for the desktop ones, 390px for
the phone — and scaled into the frame with a transform. Real Arabic and
English copy, real prices, real layout, each with its own palette:

| Tab | Screen |
|---|---|
| Websites | a dental clinic site, scrolling itself through five sections |
| Online stores | a fabric shop, six products staggering in, Fawry/Paymob/InstaPay at the foot |
| Mobile apps | a delivery app on a phone, seven live drops and a cash total |
| Business systems | an invoices dashboard, counters running up and a bar chart drawing |
| Automation | three trigger → action → result flows with pulses on the wires |

They are HTML and CSS, so they weigh nothing, never go stale, and switch to
Arabic with the rest of the site. Swap any one for a real client screenshot
the moment you have it.

On a phone a 1280px page is held at a minimum scale and the frame crops it,
rather than shrinking the type to mush.

## Make it yours

| What | Where |
|---|---|
| All copy, both languages | the `T` dictionary at the top of `assets/js/site.js` |
| Prices, both markets | `PRICES` in the same file |
| The clinic example's markup | the `CLINIC` template in `assets/js/site.js` |
| The other four examples | the `.screen` blocks in `index.html` |
| Example styling | the bottom third of `assets/css/site.css` |
| Form endpoint | the `submit` handler — it currently says it is not connected rather than faking success |
| Colours and type | the `:root` block in `assets/css/site.css` |
| Name | find and replace `Axiom` |

## Publishing

**Settings → Pages → Deploy from a branch → this branch → `/ (root)`.**

## Verified

Chromium at 1440 and 390, in both languages: the gate sets the language and
flips the page, all five example tabs swap and restart their animations, the
example screens mirror to RTL and scale into their frames, both price markets
update, no horizontal overflow, no console errors.

## Still to do

- **A real form endpoint.** Formspree, a Supabase function, or your own handler.
- **WhatsApp number and social links** — the footer links are anchors today.
- **Replace the examples with real client work** as you ship it.
