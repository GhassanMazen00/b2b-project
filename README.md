# برق · BARQ

Marketing site for a web, systems and automation studio serving Egypt, the
Gulf and the wider Middle East.

The site is the portfolio. A studio with no client work has to prove capability
on the page itself, so the hero is a thirty-thousand-point WebGL field that
resolves out of noise into the mark as you scroll.

## Make it yours

The first twenty lines of `assets/js/app.js`:

```js
const CONFIG = {
  whatsapp:  "201000000000",   // country code + number, digits only, no +
  email:     "hello@barq.studio",
  instagram: "https://instagram.com/…",
  linkedin:  "https://linkedin.com/company/…",
  facebook:  "https://facebook.com/…",
};
```

Prices sit directly below, per market. The Gulf column is roughly five times
the Egypt column for identical work — that is the going rate there, not a
markup.

To rename the studio, find and replace `برق` and `BARQ`.

## Publishing

**Settings → Pages → Source: _Deploy from a branch_ → Branch: this one →
Folder: `/ (root)` → Save.** No build step.

Locally:

```bash
python3 -m http.server 8000
```

## How the hero works

`assets/js/scene.js` holds every point in two places at once — somewhere in a
drifting cloud, and somewhere inside the mark. A single uniform, `uOrder`,
moves between them, and scroll position drives it.

A few decisions worth knowing before changing anything:

- **The mark is a polygon, not a glyph.** It started as the Arabic wordmark
  sampled from rendered text, which broke: the canvas asked for a font weight
  the page had not loaded, fell back to a typeface with no Arabic in it, and
  sampled nothing — so the particles stayed random noise. A polygon renders
  identically everywhere, needs no webfont, and reads the same in both
  languages.
- **Points shrink as they gather.** Thirty thousand additive sprites
  converging on a small area blow out to flat white and lose the texture that
  makes the effect worth having.
- **One ScrollTrigger, shaped as a curve.** Two of them fought: the second
  drove `uOrder` back down while the first was still raising it, so the mark
  never formed. The curve is gather → hold → disperse.
- **It stops when off-screen.** An IntersectionObserver halts the render loop
  entirely rather than burning a phone battery on something nobody is looking
  at.

Degradation is deliberate: fewer points under 760px, a still gradient when
WebGL is unavailable, and no motion at all under `prefers-reduced-motion`.
The page is readable with JavaScript switched off entirely.

## The one real weakness

The page transfers about **930 KB**, and **671 KB of that is Three.js** — of
which this site uses perhaps five percent: a scene, a camera, a buffer
geometry, a shader material and a points object.

For a studio selling to businesses on Egyptian mobile data, that is the wrong
trade. The fix is to drop Three.js and write the ~200 lines of raw WebGL this
effect actually needs, which would cut the page to roughly **90 KB** with no
visible difference. Worth doing before this goes in front of customers.
