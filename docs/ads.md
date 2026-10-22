# Ads (Adsterra)

Built, tested, and **off**: nothing loads, nothing is drawn, and the privacy page
still says there is no advertising, until a unit is filled in.

## Turning a unit on

The ids in the Adsterra dashboard (31574466 and so on) are not what the scripts
use. For each of the three sizes, open the unit's **Get code** and copy two things:

- the URL in `<script src="https://…/invoke.js">`, as `src`
- `'key'` from the `atOptions = {…}` line, as `key`

Paste them in **both** places (`scripts/shell-test.mjs` fails if they disagree):

| Size | Dashboard unit | `src/lib/site.ts` (`AD_UNITS`) and `public/decide/js/config.js` |
|---|---|---|
| 728x90 | Banner 728x90 | `leaderboard` |
| 320x50 | Banner 320x50 | `banner` |
| 300x250 | Banner 300x250 | `rectangle` |

All nine units show as **Inactive** until each is resubmitted and approved, and an
unapproved unit fills nothing. That is also what happened last time, so check
approval first if a slot is empty. `bun run adsdrive` proves the wiring with a fake
network and needs no real unit.

## Where, and who sees one

| | |
|---|---|
| Game | in the Dishes list (after the 8th dish) and at the end of Profile |
| Site | the end of /faq, /how-it-works, /info and /eat |
| Never | the decide flow, any game, the answer, the reward, /premium, /checkout, /account |
| Who | not Premium members, and not anybody with fewer than two finished decisions |
| How | one slot per screen, loaded only when it is within 400px of view, not at all with Save-Data on |

Left out on purpose: Social Bar and Smartlink (built to look like something other
than an ad), the native unit (it sizes itself, which a sandbox cannot measure) and
the two skyscrapers (they do not fit a phone).

## What is and is not safe

Every ad renders in a sandboxed frame: scripts and real-click popups, and no
same-origin and no top navigation, so a creative cannot read our storage or DOM or
redirect the tab. `adsdrive` checks that with a creative that tries all of it.

Not handled, and worth deciding before a unit goes live:

- **Consent.** Ad networks set third-party cookies; in the EEA and UK that needs
  consent, and this site has no consent banner.
- **Creatives are not reviewed.** For an app with halal and kosher rules built in,
  that matters more than usual. Adsterra lets you block categories in the dashboard.

The privacy page reads the same switch (`ADS_ON`), so its answer, its section and
its third-party row appear and disappear together with the ads.
