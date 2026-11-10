# Axiom

Marketing site for a studio that builds websites, stores, apps and business
systems for companies in Egypt and the Gulf.

Static HTML and CSS. No build step. Roughly 830 KB of assets, all local.

## Built with taste-skill

This page was built and checked with three installed skills:

| Skill | Source |
|---|---|
| taste-skill | `Leonxlnx/taste-skill` |
| impeccable | `pbakaus/impeccable` |
| animation / design set | `emilkowalski/skills` |

They are **not committed** — together they are 43 MB. Reinstall with:

```bash
./scripts/install-skills.sh
```

The page follows taste-skill's rules for a **service** page: one section per
screen, equal content edges, a dealt palette and type pairing, a hero entrance,
one dealt moment, and the hover layer. The deal was:

```
palette  card-pastels   off-white ground, one pink mark
type     geist
hero     statement      type-led, no photograph
nav      nav-mega     footer  footer-columns    close  close-type
rhythm   space        buttons block             mark   stack
moment   word-highlight
```

## Make it yours

- **Contact**: the form posts to `hello@axiom.example`, a stand-in. Replace it
  with a real form endpoint (`data-endpoint`) before launch.
- **Prices** are in the `rows` list in `index.html`.
- **Name**: find and replace `Axiom`.

## Publishing

**Settings → Pages → Deploy from a branch → this branch → `/ (root)`.**

## Known open findings

The finish gate ended at `GATE: OPEN 9` after its three rounds. None of the
nine are cosmetic defects you would notice; all trace to one root cause:

**The page has no photographs.** taste-skill wants a service page led by
photographs of the work, the team and the rooms, and it refuses to let a stock
library frame lead this trade. The build environment could not reach Wikimedia
Commons or the icon CDN, so there are no photographs and no real tool icons —
the page is type, prices and UI fragments instead. That drives the remaining
`no-visual`, `neighbour` and several `screen-height` findings, because sections
that should carry a picture carry text.

The fix is not code. It is **a half-day photo shoot**: the desk, the screens,
the person who answers the WhatsApp, a client's shop. Drop those in and most of
the nine resolve themselves.

Two findings are independent of that and worth a pass:

- `ui-centre` on the two stat panels — the fragment is not centred in its panel.
- `section-gaps` between the hero and the first section at 390.

## Language

English, left to right. The kit has essentially no RTL support (zero
`[dir="rtl"]` rules), so an Arabic-first build would break its grid and fail
its own checker. An Arabic version needs a logical-property pass over
`assets/system.css` and `assets/layout/layout.css` first — worth doing, since
Arabic is the right default for Egyptian customers.
