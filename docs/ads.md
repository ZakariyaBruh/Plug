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

In the **app** there is one fixed strip along the bottom, the *ad dock* (`js/ads.js`):
it sits **over** the page, never pushing it, and is there during the decide
questions, in every game and in Ask. Its height is reserved once (`--anchor-h`), so
nothing jumps when it loads and it never lies across a control: a fixed ad on top of
buttons gets accidental taps, which is invalid traffic. Two banners side by side on
a wide screen (728x90 + 468x60, or one 728x90 from 900px, one 468x60 from 520px), one
320x50 on a phone, swapped for a fresh one about every minute while the page is
visible. Z-order: cookie bar < top bar < games < dock < welcome / toasts < tour.
On a phone it sits above the tab bar, and at the very bottom when the tab bar is
hidden (a game is open). The **site** pages keep a cluster of two or three at the end
of the page.

| | |
|---|---|
| Game | the dock, everywhere in the app, games and questions included |
| Site | the end of /, /faq, /how-it-works, /info, /eat and each /eat/<dish> |
| Never | /premium, /checkout, /account; the welcome and tour screens sit on top of it |
| Who | everybody except Premium members, **from the first visit** |
| How | the dock loads as soon as Premium status is known (a member never sees a flash); the site's end-of-page clusters load within 400px of view. Save-Data is ignored (the owner's call) |
| Consent | changes how an ad loads, **never whether**. Without consent where the law asks first (EU, EEA, UK, Switzerland, or a country that cannot be told), the same ad loads in a `credentialless` frame with no referrer; **Accept all** loads it normally; **Essential only** reloads it cookie-free. There is no free way to turn ads off: Save-Data, the cookie choice and stored settings do nothing, and `shell-test` and `adsdrive` fail if one appears |

## The sponsor page: more Standard questions

When the free Standard questions are used up, a button offers two more for opening a
sponsor page (`SMARTLINK_URL`), up to three times a day (so nine at most). It opens
in a new tab **only when tapped**, never automatically, and is never offered to
Premium. The tab is opened with `noopener` but **with** the referrer (the browser
sends only this site's address, not the path), because that is how the network can
tell which site a visit came from. How well it targets food ads depends on the site
category set in the Adsterra dashboard plus the visitor's geo and device; there is,
on purpose, no hidden page or link to fake a category (see the note in `site.ts`).

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

- **Consent is a banner now** (`js/consent.js` in the app, `ConsentBar.tsx` on the
  site, one answer under `m45-consent`, region from `/api/region`). It decides how the ads
  load and whether Google Analytics and Clarity run; it never decides whether there are
  ads. That is deliberate and it is the usual arrangement: cookie law is about what is
  stored on a device and who is tracked, not about whether an advert may be shown, and
  YouTube and Spotify show ads to people who decline cookies too (Premium is how you
  remove them). Ads are **not** filed under "essential" and a test fails if they ever
  are. **This is not legal advice**, and the cookie-free mode is a mitigation, not a
  guarantee: `credentialless` is Chromium-only, and the network still sees an IP address
  and a browser whatever we ask of the frame. Ask Adsterra whether it offers a
  non-personalised / consent-aware mode for these units, and get a lawyer's view before
  relying on any of this in the EU or UK. Whop itself adds page-view analytics to every
  page it serves, outside this app and outside the banner (the banner says so). The
  sponsor page is the network's own page and sets whatever it sets.
- **Creatives are not reviewed.** For an app with halal and kosher rules built in,
  that matters more than usual. Adsterra lets you block categories in the dashboard.

The privacy page reads the same switch (`ADS_ON`), so its answer, section and
third-party row appear with the ads, and it describes the sponsor-page option.

## Checks

`bun run adsdrive` (a fake network with a hostile creative, in a real browser, and
the whole bonus flow), `ads-test` (cluster logic), `bonus-test` (the token).
