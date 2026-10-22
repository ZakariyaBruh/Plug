# Ads (Adsterra) and the sponsor page

On, with the five fixed-size banners from the snippets handed over. A Premium
member sees none.

## What is live

| Size | Used | Served from |
|---|---|---|
| 728x90 | wide screens, in a list | `https://bauval.org/22/79c3a17f…` |
| 468x60 | wide screens | `…/22/08a0aa14…` |
| 320x50 | phones | `…/22/5854b8b6…` |
| 300x250 | the end of a page | `…/22/df667c7b…` |
| 160x300 | the end of a page, wide | `…/22/31d2d666…` |

The same table is in `src/lib/site.ts` (`AD_UNITS`) and `public/decide/js/config.js`;
`shell-test` fails if they disagree. Handed over and **deliberately not used**: the
160x600 skyscraper (does not fit a phone), the native unit (sizes itself, which a
sandbox cannot measure) and the **Social Bar** (built to look like a notification,
and it would have to run on the page itself, outside the sandbox).

**Check approval first if a slot is empty.** The dashboard showed every unit
Inactive, and this network showed nothing for the whole of its previous run here.

## What a visitor sees

Two or three banners **together**, under one label, not scattered: two in the middle
of a list and on a phone, three at the end of a page on a wide screen.

| | |
|---|---|
| Game | in the Dishes list (after the 8th dish) and at the end of Profile |
| Site | the end of /faq, /how-it-works, /info and /eat |
| Never | the decide flow, any game, the answer, the reward, /premium, /checkout, /account |
| Who | not Premium members, and not anybody with fewer than two finished decisions |
| How | loaded only within 400px of view; not at all with Save-Data on |

## The sponsor page: more Standard questions

When the free Standard questions are used up, a button offers two more for opening a
sponsor page (`SMARTLINK_URL`), up to three times a day (so nine at most). It opens
in a new tab **only when tapped**, never automatically, and is never offered to
Premium.

It is an honour system with limits, and says so. The server cannot tell the page was
opened. What it enforces (`lib/allowance.ts`, `routes/api/chat-bonus.ts`): a signed
start, at least 8 seconds before the claim, a 20-minute expiry, a token that belongs
to one visitor and one day, and the cap, counted in the same ledger as the questions
so clearing site data buys nothing. The reward is a free-model answer, which costs
nothing, so the worst case is cheap. `bonus-test` covers the token.

## What is and is not safe

Every ad renders in a sandboxed frame: scripts and real-click popups, no
same-origin, no top navigation, so a creative cannot read our storage or DOM or
redirect the tab. `adsdrive` checks that with a creative that tries all of it.

Not handled, and worth deciding:

- **Consent.** Third-party ad cookies in the EEA and UK need it; this site has no
  consent banner. The sponsor page is the network's own page and sets whatever it sets.
- **Creatives are not reviewed.** For an app with halal and kosher rules built in,
  that matters more than usual. Adsterra lets you block categories in the dashboard.

The privacy page reads the same switch (`ADS_ON`), so its answer, section and
third-party row appear with the ads, and it describes the sponsor-page option.

## Checks

`bun run adsdrive` (a fake network with a hostile creative, in a real browser, and
the whole bonus flow), `ads-test` (cluster logic), `bonus-test` (the token).
