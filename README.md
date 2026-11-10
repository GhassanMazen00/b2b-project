# Axiom

Marketing site for a studio that builds websites, stores, apps and business
systems for companies in Egypt and the Gulf.

Static HTML, one stylesheet, one script. No build step, no framework, no
dependencies. Around 40 KB of code plus Google Fonts.

## The point of it

A studio with no client work cannot prove anything with a portfolio. So the
site proves it by **running the product**: the dark frame in the hero, and the
larger one halfway down, are a working order system — not a screenshot and not
a video.

Add an order and the row animates in, stock is drawn down, the customer's
balance moves and the totals recompute. Mark one paid and the unpaid figure
drops. Switch to Stock and anything under 60 m is flagged to reorder. Every
number on screen is derived from state in `assets/js/site.js`; none of it is
written into the markup.

That is the strongest thing an agency in this position can show, and it is
honest — it demonstrates the kind of system we build without pretending it
belongs to a client who does not exist.

## Make it yours

| What | Where |
|---|---|
| Prices, both markets | `PRICES` at the bottom of `assets/js/site.js` |
| Demo data (customers, stock) | `SEED` at the top of the same file |
| Form endpoint | the `submit` handler at the end of `site.js` — currently it says it is not connected rather than faking a success |
| Name | find and replace `Axiom` |
| Colours and type | the `:root` block in `assets/css/site.css` |

## Publishing

**Settings → Pages → Deploy from a branch → this branch → `/ (root)`.**

## Verified

Driven in Chromium at 1440 and 390: the system adds orders, recomputes unpaid
and daily totals, draws down stock, switches views, the market toggle changes
all five prices, no horizontal overflow on mobile, no console errors.

## Still to do

- **A real form endpoint.** The form validates and then tells the truth: it is
  not wired up. Point it at Formspree, a Supabase function or your own
  handler before launch.
- **WhatsApp number and social links.** Currently the footer links are
  anchors.
- **Arabic version.** The system demo already renders Arabic customer and
  product names, which is deliberate. A full Arabic page needs an RTL pass
  over `site.css` — most of it already uses logical properties, so this is
  bounded work, and Arabic is the right default for Egyptian customers.
- **Real work to show.** The live system carries the page today. Replace it
  with two or three actual client builds as soon as you have them; that beats
  any demo.
