# Axiom

Marketing site for a studio that builds websites, online stores, mobile apps
and business systems for companies in Egypt and the Gulf.

Static HTML, one stylesheet, one script. No build step, no framework, no
dependencies. Around 60 KB plus Google Fonts.

## How it works

**A language gate opens the site.** First visit asks العربية or English before
anything else; the choice is remembered, and returning visitors go straight in.
Every string lives in the `T` dictionary in `assets/js/site.js` — pick a key,
write both languages, done. Switching flips `lang` and `dir`, and the whole
layout mirrors because the CSS uses logical properties throughout.

**Dark by default**, warm amber accent, no light mode. One visual world.

**Each service shows an example rather than describing one.** The tabs under
"What we build" swap between five animated mockups — a website that scrolls
itself, a store whose products stagger in while the cart counts up, a phone
cycling through three app screens, a dashboard with bars that draw and figures
that count, and an automation flow with pulses running the wires.

These are built in HTML and CSS, not screenshots or stock photography. They
cost nothing to load, never go out of date, and can be swapped for real client
screenshots the moment you have them.

## Make it yours

| What | Where |
|---|---|
| All copy, both languages | the `T` dictionary at the top of `assets/js/site.js` |
| Prices, both markets | `PRICES` in the same file |
| Form endpoint | the `submit` handler at the bottom — it currently says it is not connected rather than faking success |
| Colours and type | the `:root` block in `assets/css/site.css` |
| Name | find and replace `Axiom` |

## Publishing

**Settings → Pages → Deploy from a branch → this branch → `/ (root)`.**

## Verified

Chromium at 1440 and 390: the gate sets Arabic and flips the page to RTL, the
toggle switches back, all five example tabs swap and restart their animations,
both price markets update, no horizontal overflow on mobile, no console errors.

## Still to do

- **A real form endpoint.** Formspree, a Supabase function, or your own handler.
- **WhatsApp number and social links** — the footer links are anchors today.
- **Replace the mockups with real client work** as soon as you have two or
  three builds. Real screenshots beat any mockup, however good.
