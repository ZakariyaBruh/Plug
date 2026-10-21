# The shell: why it felt off, and what holds it now

"Looks fine, feels off" is a real finding, and it has causes. These were measured
in a browser, not guessed, and each one has a test or a rule below so it does not
come back.

## What was wrong

**The app's own rules had been broken by the app.** `styles.css` says, in three
places, "one radius family, no drift", "nothing here loops", and "no kicker above
a page heading". Layer on layer (the Linear pass, the overhaul, three motion
passes) the finish wandered from all three.

| Measured | Before | After |
|---|---|---|
| Distinct `border-radius` values | 20 | 4 steps, plus pills, circles and 2–4px bars |
| Height of the page title across the 12 sections | 140px on nine, 166px on three | 140px on all |
| Things looping at the edge of vision on every screen | Premium pill (scale + glow, forever), Dot | Premium pill pulses twice, then rests |
| Rail on a 650px-tall window | last links below the fold, unreachable | scrolls inside itself, all thirteen reachable |
| Rail on a 390px phone | 4–5 wrapped rows, 193px (422px at large text), stuck to every screen | tab bar under the thumb; the list is the sheet behind More |
| Back button | left the app | goes to the previous section |
| Reload | dropped you on the front door | stays on the section |
| Page width on a 390px phone after starting a game | grew to 395–413px and stayed there | stays 390px |
| The front door | ten game tiles, and every other feature a small chip | twelve feature cards, same glyphs as the sidebar |

The last row is the answer to "only the Decide features get focus". They did: the
landing gave the ten games a tile each and the planner, the recipe book, the
scanner, Nearby, Ask, the news and TV and radio a footnote each.

## How it is built

- **One list, worn two ways.** `index.html` has one `.rail` (five groups, thirteen
  links) and a `.tabbar` (Decide, Dishes, Nearby, Plan, More). Above 60rem the list
  is a fixed column that scrolls inside itself, with the streak pinned under it.
  Below, it is the sheet behind More: closed, it is `visibility: hidden`, so it is
  out of the tab order and the accessibility tree. The tab bar steps out of the way
  during a real-time game (`body.is-playing`).
- **Glyphs are masks.** Each is drawn once as a CSS custom property
  (`--i-dishes` …) at the end of `styles.css` and drawn with `.ico`, so it takes the
  colour of its context and follows all six palettes. The sidebar, the tab bar, the
  landing cards and every page title read from the same list.
- **History.** `setView`, `showLanding` and `hideLanding` call `routeChanged()`,
  which commits one `pushState` a tick later from the state as it ends up. A game in
  progress is one entry, `#/decide`; going back to it shows the screen you left.
  `popstate` replays without animating and without writing another entry. A hash
  that is not one of ours is ignored. `?go=` still works and is tidied to a hash.
  Reloading on `#/decide` lands on the front door, because a game cannot be rebuilt
  from an address and the front door already offers to resume an interrupted one.
  Dot's tour moves through nine sections; it keeps the address in step and writes no
  history, so Back afterwards does not replay it.
- **Titles and focus.** Each section sets `document.title`. A keyboard activation
  puts focus on the new page's heading (a pointer is left alone); so does arriving
  on a deep link. There is a skip-to-content control.
- **Dot.** The bubble goes away on any tap elsewhere, and Dot rests above the tab
  bar.

## Adding a section

Seven places, and `scripts/shell-test.mjs` fails until all of them agree:

1. a `.rail-link` in the right group in `index.html` (with `data-view`)
2. a `<section class="view" id="view-…">` with a `.head` whose first visible child is
   the `h1.head-title` (an eyebrow above it must be `.mechanic.kicker`, which is hidden)
3. the name in `ROUTES` in `js/app.js`
4. a glyph: `--i-…` and `.i-…`, and `#view-… { --ico: var(--i-…) }`
5. translations for any new `nav.*` key in all four languages in `js/i18n.js`
6. optionally a `.explore-card` on the landing, wired by id or `data-landing-view`
7. optionally a place in the tab bar (it must also be in the rail)

## Checks

- `bun run test` includes `scripts/shell-test.mjs`: the files agree (sections,
  routes, translations, glyphs, headers, landing cards), every radius is on the
  scale, and the two attention-drawing animations do not loop forever. Each was
  checked by breaking it on purpose.
- `bun run navdrive` drives a real Chromium: the sidebar at short heights and large
  text, back/forward/reload, the sheet, the keyboard, and the page never growing
  sideways. It passes on this code and fails on the code it replaced.

## Decisions to know about

- **The Premium pill used to pulse forever.** It now pulses twice, a moment after the
  page settles, and rests. That is a product call as much as a design one; to restore
  the old behaviour change the iteration count on `.topbar-premium` (and the test will
  say so). See the entry in `persuasion.md`.
- **Dot still breathes and blinks** (a 1.8% scale every 4.6s, a blink every ~6s). It
  is small, it is the character, and it was left alone.
- **The new nav strings in ms, th, hi and ar were written without a native reader.**
  They are short, but they should be looked at by one.
- `scripts/hooks-test.mjs` ("the homepage skip lands on tonight's pick") fails on the
  code before this work as well. It is not related to the shell.
