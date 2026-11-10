# سند · Sanad

Marketing site for a web, systems and automation studio serving Egypt, the
Gulf and the wider Middle East.

Static HTML, CSS and one small JS file. No build step, no dependencies, no
framework. It loads fast on a weak mobile connection, which is the condition
most of the audience will actually view it under.

## Make it yours

Everything you need to change is in the first twenty lines of
`assets/app.js`:

```js
const CONFIG = {
  whatsapp: "201000000000",   // country code + number, digits only, no +
  email:    "hello@sanad.tech",
  instagram:"https://instagram.com/…",
  linkedin: "https://linkedin.com/company/…",
  facebook: "https://facebook.com/…",
};
```

Prices sit right below it, per market. The Gulf column is roughly five times
the Egypt column for identical work — that is the going rate there, not a
markup.

To change the brand name, find and replace `سند` and `Sanad`.

## Publishing it

GitHub Pages serves this directly:

**Settings → Pages → Source: _Deploy from a branch_ → Branch: this branch →
Folder: `/ (root)` → Save.**

For a custom domain, add a `CNAME` file containing the bare domain and point
the DNS at GitHub Pages.

Running it locally:

```bash
python3 -m http.server 8000
```

## How it is put together

- **Bilingual without duplication.** Both languages are in the markup; CSS
  hides the inactive one and the toggle flips `lang` and `dir` on `<html>`.
  Arabic is the default, so the page is correct before JavaScript runs, and
  both languages are visible to search engines.
- **Prices are data, not markup.** `PRICES` in `app.js` drives every figure on
  the page. Change a number once.
- **Egyptian pounds are deliberately not converted.** The rate moves, and a
  stale number on a pricing page costs trust. Saudi riyals are shown because
  the peg is fixed.
