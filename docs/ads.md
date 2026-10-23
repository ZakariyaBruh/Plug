# Ads (Adsterra) and the sponsor page

On, with the five fixed-size banners from the snippets handed over. A Premium
member sees none.

## What is live

| Size | Used | Served from |
|---|---|---|
| 728x90 | wide screens, in a list | `https://bauval.org/22/13578a9e…` |
| 468x60 | wide screens | `…/22/e6a338e4…` |
| 320x50 | phones | `…/22/84c0716c…` |
| 300x250 | the end of a page | `…/22/47b83994…` |
| 160x300 | the end of a page, wide | `…/22/ff664151…` |

The same table is in `src/lib/site.ts` (`AD_UNITS`) and `public/decide/js/config.js`;
`shell-test` fails if they disagree. Handed over and **deliberately not used**: the
160x600 skyscraper (does not fit a phone), the native unit (sizes itself, which a
sandbox cannot measure) and the **Social Bar** (a script that has to run on the page itself, built to
look like a notification). The Social Bar was tried once, on the owner's say, and removed again on
the owner's say; it is not to be added back without being asked.

**Check approval first if a slot is empty.** The dashboard showed every unit
Inactive, and this network showed nothing for the whole of its previous run here.

## What a visitor sees

In the **app** there are two layers, and they add up (the owner asked for both):

1. **The dock** (`js/ads.js`): one fixed strip along the bottom, **over** the page, never pushing
   it, present during the decide questions, in every game and in Ask. Its height is reserved
   once (`--anchor-h`), so nothing jumps when it loads and it never lies across a control: a fixed
   ad on top of buttons gets accidental taps, which is invalid traffic. Two banners side by side
   on a wide screen, one 320x50 on a phone, swapped for a fresh one about every minute while the
   page is visible. Z-order: cookie bar < top bar < games < dock < welcome / toasts < tour. On a
   phone it sits above the tab bar, and at the very bottom when the tab bar is hidden (a game is
   open). The side menu and the More sheet stop above it.
2. **The slots**, in the page: under every section but the questions and Profile (`#view-ad`,
   `adForView()`, a fresh cluster at most every 20 seconds), after the 8th dish in the Dishes
   list, at the end of Profile, twice on the front page. Two banners (three at the end of a page
   on a wide screen).

The **site** pages keep a cluster of two or three at the end of the page.

### Every ad is a page of this site: `/ad-frame?u=<size>`
Not srcdoc. `src/routes/ad-frame.ts` serves a tiny page (the unit is looked up by name in
`AD_UNITS`, never taken from the URL) that loads the network's script with the site's address as
the referrer (`origin`, never a path), and tells the embedding page `filled`, `empty` or `error`.
**Why:** a srcdoc frame has no address, and in cookie-free mode it also asked for no referrer, so
the network was asked as a stranger and answered with an empty script. When a frame reports
`empty` or `error` the box shows the app's own Premium card at the same size (`.house-ad`); an
advertiser's ad always wins the box when there is one. `Ads.status()` in the console shows what
each size said.

### If the boxes are still the house card
That means the network's script came back empty. From the build server **every** key (even a made-up
one) returns an empty script from `bauval.org/22/<key>`, so this cannot be settled from the code.
Check in Adsterra: the **site** is approved (not only the units being Active) and its domain is
the one serving the app (`morsels45-app.whop.site`; a free subdomain is often not approved, a
domain of your own is); Statistics shows requests (if zero, something is blocking the script:
try without an ad blocker or Brave shields) and impressions (requests with no impressions is no fill).

| | |
|---|---|
| Never | /premium, /checkout, /account; the welcome and tour screens sit on top of it |
| Who | everybody except Premium members, **from the first visit** |
| How | the dock loads as soon as Premium status is known (a member never sees a flash); the site's end-of-page clusters load within 400px of view. Save-Data is ignored (the owner's call) |
| Consent | changes how an ad loads, **never whether**. Without consent where the law asks first (EU, EEA, UK, Switzerland, or a country that cannot be told), the same ad loads in a `credentialless` frame (it is still told this site's address, and only that, because a network cannot serve a site it cannot identify); **Accept all** loads it normally; **Essential only** reloads it cookie-free. There is no free way to turn ads off: Save-Data, the cookie choice and stored settings do nothing, and `shell-test` and `adsdrive` fail if one appears |

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

## Blank white boxes that say "filled"

Seen on a real iPad with `?adsdebug`: every frame reported `filled` (the network's script drew an element) and the dock showed an empty white box. Frames made inside a tap (the /ads-check buttons) drew real ads; frames made with the page did not. So the first tap, key press or click now asks every frame again, once, from a fresh address (`public/decide/js/ads.js` `onGesture`, and the same in `src/components/AdSlot.tsx`). The `?adsdebug` panel shows `tapped=`, `[asked again after tap]` and, per frame, what the network drew and whether the frame itself had been activated. "Filled" means something was drawn, not that it is visible: a frame cannot see inside the network's own nested frame.
