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

## The front door, shorter, and Play with Dot

- **The landing is about 3.5 screens, not 5.6 (desktop) or 7.6 (phone).** Order:
  the pitch, the two buttons and the plates knob, then (for a returning visitor) the
  welcome-back card and *Lately*, then six doors, today's five, the games as a compact
  rail (a snapping row on a phone, five across on a desktop), and one closed
  *More ways in* disclosure holding the other six doors, moods, menus and the week.
  Nothing was removed and every id the JS wires is unchanged. On a phone the buttons
  come before the picked dish (CSS `order`), so they are on the first screen.
- **Play with Dot.** The ten games share `canvasGame` in `app.js`; the upgrade is in
  the shell, so it reaches all of them: a scoreboard bar (score left, hearts right,
  bumps on change), a stage that fills the screen it has (was 340px), a countdown ring
  and a GO, a red flash when you are hit, glowing particles and pop-in score numbers.
  The picker is coloured tiles with each game's best and stars, plus *Pick one for me*.
  On a phone the panel is full-screen. `scripts/dots-drive.mjs` starts all ten on a
  phone and a desktop and fails on any page error or sideways scroll.
- **A real bug found by that driver:** closing Play just as a game ended let the queued
  results screen land on top of the picker next time it opened. A run token fixes it.
- **Speed.** Measured at 4x CPU slowdown, the profile showed i18n walking every text
  node (and every later render) even in English, and Dot forcing a layout while the
  page loaded. English with nothing ever translated now skips the walk, and the forced
  layout waits for `load`. i18n startup 95ms to 10ms; time to DOMContentLoaded
  roughly 2.0s to 1.6s. `content-visibility` on the landing was tried and was not
  faster, so it is not there. The rest is parse and layout of a 177KB page and ~1.7MB
  of script; splitting `app.js` is the next real gain and is a larger job.
- **Retention was left to what the product already refuses to do.** `persuasion.md`
  rules out streak-loss warnings and `honesty-test` enforces it, so there is no
  "your streak ends tonight". The game stars and bests on the picker are the
  addition that fits.

## More questions, and the games rebuilt

- **The engine asks more, on purpose, and it measurably helps.** `scripts/accuracy-sweep.mjs`
  plays the whole catalogue with an answerer who gets one reply in twelve wrong. Before: the
  intended dish came first 43-48% of the time and was in the six on screen 63%, at ~10.8
  questions. Now: 52-66% and 74-82%, at ~13 (a perfect answerer still lands 100% first, in 11).
  Raising the minimum or the confidence alone moved nothing, because the game stopped asking
  when only one dish was *consistent*, which a wrong answer makes the wrong dish. What changed:
  (1) from the seventh question, questions and the stop are chosen on a *tolerant* belief, in
  which contradicting a reply costs a dish a factor of 0.12 instead of a million, so the game
  keeps asking what separates the leader from the dishes one wrong reply away; (2) five more
  questions (beef, pork, egg, dairy, potato or root), asked only after six answers, from tags
  dishes already carried; (3) minimum 8, 95% confidence, at most 24. The *ranking* is untouched:
  a dish that contradicts nothing still beats one that does, so every diet promise holds.
  Somebody who shrugs at everything is still let go at six. `accuracy-test` now gates the noisy
  player too; `mood-test` is why the tolerant belief waits until question seven (it reordered the
  opening and stopped asking what people came in with).
- **Dot no longer acts out the questions.** A big Dot above each question that melted, salted
  and dashed off was tried and taken out (it was disliked); the question screen is back to the
  small Dot on the progress track and the words. `shell-test` fails if the stage comes back.
- **Play with Dot, rebuilt as `js/play.js` + `js/sprites.js`, loaded on first use.** Ten games
  with rulebooks (survivor with perks, a springy climb, a real-physics merge jar, a bubble
  shooter with falling clusters, match-3 with specials, invaders with shields and a pot, an
  endless lane crosser, a burger stacker, a wind-and-catapult spitter, a memory game with
  backwards rounds), one hand of art (paper, one ink outline, flat colour, a hard shadow; no
  emoji, gradients or glow, and `shell-test` fails on all three), a start card, countdown, real
  pause, hit-stop and shake. The old file's CSS and code are gone.


## The ad dock, the free assistant and the Advanced extras

- **The ad dock** (`js/ads.js`) replaced every inline ad slot in the app: one fixed strip
  along the bottom, over the page, with its height reserved in `--anchor-h` so nothing
  moves and nothing it overlaps is a control. It is present in the questions, every game
  and Ask. Z-order is fixed in the stylesheet and checked by `shell-test`: cookie bar <
  top bar < games < dock < welcome/toasts < tour. `body.is-games` (set by `play.js`) and
  `body.is-playing` put it at the very bottom on a phone when the tab bar is hidden.
  `adsdrive` checks the geometry (reachable buttons, reserved height, Premium never sees it).
- **The free assistant** (Standard) never touches Gemini: `lib/free-ai.ts` races LLM7 and
  Pollinations (fast model first, the next joining after 3.5s or at once on failure), skips
  a service that keeps failing, rejects error bodies, and remembers a first question for ten
  minutes. If every service fails, `lib/free-local.ts` answers from the menu or the app's own
  fact list, says so, and does not count it against the day. `free-ai-test` covers all of it.
- **Advanced** (Premium, Gemini) gained skills (swap, scale, budget, leftovers, pair), recipe
  cards that can be saved to the cookbook, follow-up suggestions and a Listen button. If
  Gemini is busy a Premium member is answered by Standard, with a note.

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
