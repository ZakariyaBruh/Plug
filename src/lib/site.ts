import tvLineup from './tv-lineup.json'

export const SITE_NAME = 'morsels45'
export const SITE_URL = 'https://morsels45-app.whop.site'
export const SITE_CARD = `${SITE_URL}/site-card.png`
export const SITE_CARD_ALT = 'morsels45 — an assistant for working out what to eat'

/*
 * The Android build — a signed release APK served from this site rather than
 * from a store listing, which is the only way to hand somebody an Android app
 * without one. It means a sideload, and Android will say so in its own words
 * before it installs anything, so the offer says so first: being warned by the
 * phone about a download a site did not warn you about is how a perfectly
 * ordinary install starts looking like a mistake.
 */
/*
 * How many dishes are in the catalogue.
 *
 * Written out rather than counted from ALL_DISHES on purpose: that module
 * parses the whole of decide/js/data.js, and importing it here to get one
 * integer would drag the entire catalogue into every page that mentions the
 * number. So it is a literal — and the build checks it. vite.config.ts reads
 * data.js at build time anyway (see recipeBook) and fails the build if this
 * does not match what it finds, which is what stops it going stale the way
 * "112" did: that number outlived three separate batches of new dishes,
 * on the front page, the FAQ, the premium list and both social cards.
 */
export const DISH_COUNT = 450

/*
 * The Whop page for this business, which is where account, payment and refund
 * questions actually get answered.
 *
 * This was AFFILIATES_URL, and everything that pointed at the affiliate
 * programme has been taken out — the prompt in the game, the three cards in
 * the rotation and the footer link. What is left is the one honest use it
 * always had underneath: the privacy page telling somebody where to go about
 * their own money.
 */
export const WHOP_PAGE_URL = 'https://whop.com/morsels45'


export const ANDROID_APK = '/morsels45.apk'
export const ANDROID_VERSION = '1.0.0'
export const ANDROID_SIZE = '6.0 MB'

/*
 * MICROSOFT CLARITY — SESSION REPLAY, AND THE SWITCH THAT KEEPS THE PRIVACY
 * PAGE HONEST ABOUT IT.
 *
 * Five days of ad traffic sent 513 people into the app and 34 on to the
 * Premium page. Numbers say where they stopped; they do not say why, and the
 * cheapest way to see why is to watch a few sessions. Clarity is free and
 * does that.
 *
 * It is also a third party recording what people do, which is a bigger deal
 * than a counter and is exactly the sort of thing /honesty promises not to
 * do quietly. So ONE constant drives three things: whether the script loads,
 * whether Clarity appears in the list of everyone this app talks to, and
 * whether the privacy page says session replay is on. Leave it empty and all
 * three are off and the page is silent about it; paste an id and all three
 * turn on together.
 *
 * That coupling is the whole design. The failure it exists to prevent is the
 * ordinary one: somebody pastes a tracking id, ships, and updates the
 * privacy page next week.
 *
 * TO TURN IT ON: make a project at clarity.microsoft.com, take the id out of
 * the install snippet, and put it here. Nothing else to wire.
 */
export const CLARITY_ID = 'ymncebz070'

/*
 * GOOGLE ANALYTICS 4, ON THE SAME TERMS AS EVERYTHING ELSE HERE.
 *
 * One constant decides whether the gtag script exists on any page, whether
 * the funnel events are mirrored to it, whether Google Analytics is listed
 * among the third parties on the privacy page, and what that page's "is
 * there advertising or cross-site tracking" card says. Empty, and all four
 * are off and the page is silent about it; paste a measurement id and all
 * four turn on together.
 *
 * THE COUPLING IS THE POINT, and it matters more here than it did for
 * replay. The privacy page currently answers "no Google Analytics here" in
 * the largest type on the page. Shipping a tag without that sentence
 * changing in the same commit would not be an oversight, it would be the
 * page lying — and a standards page that lies is worth less than no
 * standards page at all.
 *
 * WHAT IT IS NOT SET UP TO DO. No Google Signals, no advertising features,
 * no user-id, no demographics: this is here to count pages and the five
 * funnel events that already exist, nothing more. Those are switches in the
 * GA console rather than in this file, so the privacy copy says what this
 * app sends and leaves the rest to Google's own policy — turn any of them on
 * over there and the wording here stops being true.
 *
 * TO TURN IT ON: make a GA4 property at analytics.google.com, take the
 * measurement id from Admin -> Data streams (it looks like G-XXXXXXXXXX),
 * and put it here. Nothing else to wire.
 */
export const GA4_ID = 'G-M5PMRS475E'

/*
 * ADSTERRA, BACK — AS ITS OWN DECISION, WITH THE REASONS IT WENT KEPT.
 *
 * It was here once: eight banner placements, sandboxed, and none of them ever
 * showed anything. Every one rendered at the right size with no fill for as
 * long as it ran, on a brand-new site the network had not reviewed, and it
 * was removed rather than debugged. The ad exchange reasoning behind that
 * has not changed (it serves whatever wins its auction, and that roster
 * cannot be vetted). What has changed is the decision to accept it anyway,
 * made again deliberately, and the units: nine new ones, which show as
 * Inactive in the publisher dashboard until each is resubmitted and
 * approved. Nothing will fill before that, and that is the first thing to
 * check if a slot is empty.
 *
 * NOTHING IS ON UNTIL A UNIT IS FILLED IN. The table below ships empty
 * because the ids on the dashboard are not the keys the scripts use; paste
 * each unit's own snippet (the key, and the script URL it loads) and that
 * unit turns on. ADS_ON is true when any is, and it is the one switch the
 * components, the game's ads.js and the privacy page all read, so none of
 * them can say something the product is not doing.
 *
 * WHAT STAYS OUT, on purpose: the Social Bar (the owner asked for it, tried it,
 * and had it removed again: it is a script that runs in the page itself, outside
 * any sandbox, built to look like a notification), the native unit (it sizes
 * itself, which a sandbox cannot measure) and the 160x600 skyscraper (it does
 * not fit a phone). Five fixed sizes are used, and which
 * ones depend on the width and on where the cluster sits: see adCluster below.
 * The Smartlink is not an ad slot at all; it is an opt-in, see SMARTLINK_URL.
 *
 * HOW MUCH THERE IS, as numbers rather than adjectives. The owner asked for ads
 * on every screen, from the first visit, and for Save-Data to be ignored; this
 * is that, with the lines that were kept:
 *   - in the app (public/decide), two layers that add up. The dock: one fixed strip along the
 *     bottom of the screen (js/ads.js), over the page rather than pushing it, so it is there
 *     during the decide questions, in every game and in Ask; it has a fixed height the page
 *     reserves once, so it never makes anything jump and never lies across a button (a fixed ad
 *     on top of controls gets accidental taps, which is invalid traffic and what an ad network
 *     closes accounts for). Two banners side by side on a wide screen, one on a phone, swapped
 *     for a fresh one about once a minute. And the slots: a cluster under every section, in the
 *     Dishes list, at the end of Profile and on the front page. Every ad is a page of this site
 *     (routes/ad-frame.ts) that reports whether anything arrived; if not, the box shows the
 *     app's own Premium card
 *   - on the site (/, /faq, /how-it-works, /info, /eat, each /eat/<dish>) a cluster of
 *     two or three banners at the end of the page, lazy-loaded when it is about to
 *     scroll into view; never on /premium, /checkout or /account
 *   - none for a Premium member, ever
 *   - from the first visit (ADS_AFTER_DECISIONS is 0), and Save-Data is no longer
 *     a reason to skip them
 *   - NO OTHER OFF SWITCH, and nothing may become one: not Save-Data, not the cookie
 *     choice, not a setting. Cookie law is about what is stored and who is tracked,
 *     not about whether an advert may be shown (YouTube and Spotify keep showing
 *     ads to people who decline cookies, and Premium is how you remove them). So
 *     where the law says to ask first (see lib/consent.ts) and the visitor has not
 *     said yes, the same ads load without cookies instead of not at all
 *
 * WHAT IS NOT MITIGATED. The creatives are not reviewed here, cannot be, and
 * will sometimes be for things nobody here would choose to advertise —
 * which matters more than usual for an app with halal and kosher rules built
 * into it. What the sandbox does limit is what a creative can do, not what
 * it can say: no allow-same-origin (it cannot read this page's cookies,
 * storage or DOM) and no allow-top-navigation (it cannot redirect the tab).
 * Consent is handled by the banner (components/ConsentBar.tsx here, js/consent.js in
 * the app). Ads are never listed as "essential": see the note over ASK_FIRST in
 * lib/consent.ts.
 */
export type AdSize = 'leaderboard' | 'wide' | 'mobile' | 'rectangle' | 'tower'

/** `src` is the script URL from the unit's snippet; `key` is its atOptions key. */
export interface AdUnit {
  src: string
  key: string
  width: number
  height: number
}

/*
 * Pasted from the snippets as handed over. The network serves these from
 * bauval.org/22/<key>, with no invoke.js. The 160x600 skyscraper, the native
 * unit and the Social Bar script were handed over too and are not used: the
 * skyscraper does not fit a phone, the native unit sizes itself (which a
 * sandbox cannot measure), and the Social Bar runs on the page itself, outside
 * the sandbox, built to look like a notification.
 */
export const AD_UNITS: Record<AdSize, AdUnit> = {
  leaderboard: { src: 'https://bauval.org/22/13578a9ee1178c2080f04a9a7acb94e7', key: '13578a9ee1178c2080f04a9a7acb94e7', width: 728, height: 90 },
  wide: { src: 'https://bauval.org/22/e6a338e45d2440354df283cc5cc84a16', key: 'e6a338e45d2440354df283cc5cc84a16', width: 468, height: 60 },
  mobile: { src: 'https://bauval.org/22/84c0716c8abaa82649e86753f0334cd8', key: '84c0716c8abaa82649e86753f0334cd8', width: 320, height: 50 },
  rectangle: { src: 'https://bauval.org/22/47b839943930ad4fcc3a16984ffe9ddd', key: '47b839943930ad4fcc3a16984ffe9ddd', width: 300, height: 250 },
  tower: { src: 'https://bauval.org/22/ff664151b19a82696f071b16d9088566', key: 'ff664151b19a82696f071b16d9088566', width: 160, height: 300 },
}

/*
 * THE SMART LINK. Not an ad slot: it is what a visitor who has used up the free
 * Standard questions can choose to open, in a new tab, for two more (see
 * lib/allowance.ts). It is only ever opened by a tap on a button that says what
 * it is, never automatically and never as a redirect.
 */
export const SMARTLINK_URL = 'https://araplhn.org/4/fd1fabea155b5555cea9a2d25b525f86'

/**
 * The units a placement shows together, in order, for a slot this wide: two or
 * three that fit and are live. `inline` is a break in a list; `end` is after
 * something has been read.
 */
export function adCluster(placement: 'inline' | 'end', width: number): AdUnit[] {
  const wide = width >= 600
  const order: AdSize[] =
    placement === 'end'
      ? wide ? ['rectangle', 'tower', 'wide'] : ['rectangle', 'mobile', 'tower']
      : width >= 760 ? ['leaderboard', 'wide', 'mobile'] : wide ? ['wide', 'mobile', 'rectangle'] : ['mobile', 'rectangle', 'tower']
  const count = placement === 'inline' || !wide ? 2 : 3
  return order
    .map((size) => AD_UNITS[size])
    .filter((unit) => adLive(unit) && unit.width <= Math.max(width, 320))
    .slice(0, count)
}

/** Decisions somebody has finished before the first ad is shown to them. 0: from the first visit. */
export const ADS_AFTER_DECISIONS = 0

/** A unit is live only when both halves of its snippet are here. */
export const adLive = (unit: AdUnit): boolean => unit.src.length > 0 && unit.key.length > 0

/** Everything downstream reads this rather than testing a string itself. */
export const ADS_ON = Object.values(AD_UNITS).some(adLive)

/** Everything downstream reads this rather than testing the string itself. */
export const GA4_ON = GA4_ID.length > 0

/** Everything downstream reads this rather than testing the string itself. */
export const REPLAY_ON = CLARITY_ID.length > 0

/*
 * IndexNow — telling the search engines that take a push that a page changed.
 *
 * Google does not participate; it is left to find things through the sitemap
 * and its own crawl, which is why the sitemap's lastmod exists. Bing, Yandex,
 * Seznam and Naver share one endpoint, so a single POST reaches all of them.
 *
 * This key is NOT a secret and is meant to be public: ownership is proved by
 * serving it at a URL on this host, so anyone can read it by design. That is
 * the whole mechanism. The file at public/<key>.txt has to keep matching this
 * constant, and a test asserts that it does.
 */
export const INDEXNOW_KEY = '4789aa678bed52e5688945e5babdb139'
export const INDEXNOW_KEY_URL = `${SITE_URL}/${INDEXNOW_KEY}.txt`

// Every page's share card, in one place. A link to this site is passed around
// far more often than it is typed, so the card is the advertisement: what a
// scraper reads here is what a reader sees before deciding whether to click.
//
// og:url and canonical are per-page — without them every subpage claims to be
// the homepage, and a search engine handed two URLs for one page picks its own
// favourite. `noindex` is for the pages that exist for one person mid-purchase.
type PageHead = {
  /** Omitted for a page that has no single canonical URL — a checkout for one plan. */
  path?: string
  title: string
  description?: string
  ogTitle?: string
  ogDescription?: string
  noindex?: boolean
  /** A page's own picture for shared links — a dish's photo — instead of the site card. */
  image?: { url: string; width: number; height: number; alt: string }
}

export function pageHead(page: PageHead) {
  const url = page.path === undefined ? null : page.path === '/' ? SITE_URL : `${SITE_URL}${page.path}`
  const ogTitle = page.ogTitle ?? page.title
  const ogDescription = page.ogDescription ?? page.description

  const meta: Array<Record<string, string>> = [
    { title: page.title },
    { property: 'og:type', content: 'website' },
    { property: 'og:site_name', content: SITE_NAME },
    { property: 'og:title', content: ogTitle },
    { property: 'og:image', content: page.image?.url ?? SITE_CARD },
    { property: 'og:image:width', content: String(page.image?.width ?? 1200) },
    { property: 'og:image:height', content: String(page.image?.height ?? 630) },
    { property: 'og:image:alt', content: page.image?.alt ?? SITE_CARD_ALT },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: ogTitle },
    { name: 'twitter:image', content: page.image?.url ?? SITE_CARD },
  ]
  if (url) meta.push({ property: 'og:url', content: url })
  if (page.description) meta.push({ name: 'description', content: page.description })
  if (ogDescription) {
    meta.push({ property: 'og:description', content: ogDescription })
    meta.push({ name: 'twitter:description', content: ogDescription })
  }
  if (page.noindex) meta.push({ name: 'robots', content: 'noindex, follow' })

  return url ? { meta, links: [{ rel: 'canonical', href: url }] } : { meta }
}

/*
 * The offer, in one place.
 *
 * The trial is not a claim this file gets to make on its own — it is
 * trial_period_days on the Whop plan, and Whop is what actually gives the
 * days away. These constants exist so the page and the checkout cannot
 * drift apart: a site still promising a trial that the plan no longer grants
 * is worse than never having offered one. Change it on the plan, then here.
 *
 * PRICE_VALUE is the number the analytics events carry; PRICE is the same
 * amount written the way a person reads it.
 */
/*
 * Seven days, not three.
 *
 * This app gets opened at dinner time, two or three evenings a week. Three days
 * is one or two sittings — not enough to hit the thing Premium is actually for,
 * which is the app knowing you well enough to stop suggesting what you do not
 * want. A trial shorter than the habit it is trying to start proves nothing.
 */
export const TRIAL_DAYS = 7
export const PRICE_VALUE = 3.45
export const PRICE = '$3.45'
export const PRICE_MONTHLY = `${PRICE}/month`

/*
 * THE YEARLY PRICE.
 *
 * $19.99 against $41.40 of monthly payments (PRICE_VALUE x 12) is the real
 * discount this plan carries — computed below, not written as "half price" or
 * any other fixed claim, because the two prices it is computed from have
 * already drifted once (see products.ts) and will again.
 *
 * PRICE_ANNUAL_PER_MONTH is the yearly price divided by twelve and rounded,
 * for the line that makes it comparable to the monthly one at a glance.
 */
export const PRICE_ANNUAL_VALUE = 19.99
export const PRICE_ANNUAL = '$19.99'
export const PRICE_YEARLY = `${PRICE_ANNUAL}/year`
export const PRICE_ANNUAL_PER_MONTH = `$${(PRICE_ANNUAL_VALUE / 12).toFixed(2)}`
export const ANNUAL_SAVING = Math.round((1 - PRICE_ANNUAL_VALUE / (PRICE_VALUE * 12)) * 100)

/*
 * THE ANCHOR, AND WHY IT IS ALLOWED TO BE ONE.
 *
 * People judge a price against whatever number they saw first, so a pricing
 * page that shows the yearly price alone is being read against nothing. The
 * number put beside it here is twelve payments at the monthly price, on this
 * product, which is the actual other way to buy the same thing and is sitting
 * one tap away on the same switch.
 *
 * That is the whole test for an anchor: it has to be a real alternative the
 * reader could take. An invented "was $99" would be the identical technique
 * and a lie, and the difference is not subtle to anybody who checks.
 *
 * Computed, not written down, for the same reason ANNUAL_SAVING is: two
 * prices and a claim about the gap between them is three numbers that can
 * disagree, and the one that gets caught is the claim.
 */
export const PRICE_ANNUAL_IF_MONTHLY = `$${(PRICE_VALUE * 12).toFixed(2)}`
export const ANNUAL_SAVED = `$${(PRICE_VALUE * 12 - PRICE_ANNUAL_VALUE).toFixed(2)}`

/*
 * HOUSEHOLD IS GONE.
 *
 * There was a two-person plan here: one subscription, two accounts, the
 * second handed over as an invitation link. It had four explanatory steps,
 * four pre-emptive answers, six price constants and a seat-granting service
 * behind it, and in its whole life it had nought members. Withdrawing an
 * offer nobody has taken costs nobody anything, and that window closes the
 * day somebody buys.
 *
 * What is NOT gone is the part people actually wanted from it: two of you
 * can still settle dinner together. Together does it on one phone, and the
 * shared browser orders it with a cursor each. Those are features of the one
 * Premium plan, and they always were — the second subscription seat was a
 * billing arrangement wrapped round them.
 *
 * See lib/products.ts for the three Whop plan ids left to archive by hand.
 */

/*
 * THE GIFT, SAID OUT LOUD BEFORE THE ASK.
 *
 * Reciprocity is give-then-ask, and this product gives a great deal: the
 * whole decide game, every dish, a recipe behind each one, and every dietary
 * rule — permanently, with no account. All of that was already true and none
 * of it was ever stated next to the price, which is reciprocity with the
 * receipt thrown away. Nobody feels given-to by something they were never
 * told they were given.
 *
 * No numbers in it that are not checked elsewhere on the page.
 */
export const THE_GIFT =
  'Deciding is free. Every dish, every recipe, and everything you do not eat — free, ' +
  'permanently, with no account and no card. Premium is the part that keeps up with you.'

/*
 * HOW TO LEAVE, NEXT TO THE ASK RATHER THAN IN THE SMALL PRINT.
 *
 * Partly because an easy exit is the single most load-bearing trust signal on
 * a page that wants a card, and a reader who cannot find one assumes the worst
 * correctly. Partly because the FTC's amended Negative Option Rule requires
 * cancelling to be as easy as subscribing, and a product that meets that bar
 * may as well get credit for meeting it.
 *
 * Every clause here is checkable: Account → "Manage or cancel your
 * subscription" is one link, and the same link is on the Premium strip inside
 * the game.
 */
export const HOW_TO_LEAVE =
  'Cancel from your account page — one link, no email to write and nobody to talk to. ' +
  'Cancel during the trial and you are not charged at all.'

/** "7 days free, then $4.99/month" — the whole offer, for body copy. */
export const OFFER = `${TRIAL_DAYS} days free, then ${PRICE_MONTHLY}`
/** The same offer, yearly. */
export const OFFER_ANNUAL = `${TRIAL_DAYS} days free, then ${PRICE_YEARLY}`
/** For a title or a button, where the price alone is the wrong emphasis. */
export const OFFER_SHORT = `${TRIAL_DAYS} days free`
/*
 * Tax, said once and honestly.
 *
 * The plan is set to tax-inclusive with tax collection and adaptive pricing
 * both on, so what somebody actually pays depends on where they are: the total
 * is $4.99 in some places and a little over in others. Which rule produces
 * which total is Whop's to decide and not knowable from here, so this promises
 * only what is certainly true — the number on the checkout page is the number
 * that gets charged.
 */
export const TAX_NOTE =
  'Tax may be added depending on where you are, so the total can come to a little over the price shown. Checkout shows exactly what you will pay before you pay it.'

/** Said wherever somebody is about to hand over a card. */
export const TRIAL_TERMS = `Free for ${TRIAL_DAYS} days, then ${PRICE_MONTHLY}. Cancel any time before it ends and you are not charged.`
/** The same terms for the yearly plan, which has the same trial. */
export const TRIAL_TERMS_ANNUAL = `Free for ${TRIAL_DAYS} days, then ${PRICE_YEARLY}. Cancel any time before it ends and you are not charged.`

/*
 * WHAT THIS IS, IN ONE SENTENCE, AND WHY IT IS WRITTEN DOWN.
 *
 * The site used to promise to know what you wanted — "you don't know what you
 * want; that's alright, I might" — which is a claim to read minds, and one
 * nothing can keep. It also meant every feature could be justified as another
 * way of guessing, so the thing sprawled: news, chat, six games, a shared
 * browser, none of them answerable to anything.
 *
 * So the promise is a job rather than a gift. An assistant does not know what
 * you want; it asks, it remembers what you told it, and it gets the thing
 * done. Three jobs, in that order, and the test for anything new is which of
 * the three it serves. Anything that serves none of them is not the product,
 * however good it is.
 */
/*
 * WHAT IT IS, SINCE IT STOPPED BEING ONLY A GAME.
 *
 * It was "an assistant for working out what to eat", and every page sold it
 * as that: $3.45 a month for a questionnaire, which nobody pays. What it is
 * now is a food hub — deciding, planning the week, shopping, cooking, the
 * news and food TV — and the deciding is the front door, not the house.
 */
export const WHAT_IT_IS =
  'Your food hub: decide what to eat, plan the week, shop for it, cook it hands-free, and keep up with food news, TV and radio — all built around what you do and do not eat.'

/*
 * THE INSIGHT, WHICH IS THE ONE THING THIS SITE KNOWS THAT THE READER DOES NOT.
 *
 * The Heaths' four families of defining moment are elevation, insight, pride
 * and connection, and of the four, insight is the one a landing page can
 * actually deliver: a sentence that rearranges something the reader already
 * believed. This site had elevation (the reveal) and nothing else.
 *
 * The rearrangement is real and it is the product's whole thesis. People who
 * cannot decide what to eat conclude they are indecisive. They are not. They
 * are being asked an open question with several hundred answers and no
 * shortlist, at the exact hour of the day when they have least left to think
 * with — and open questions are the hardest kind for anybody. Change the
 * question to a closed one and the same person answers instantly and
 * correctly, every time.
 *
 * It is allowed to be here because it is true, it is checkable against the
 * reader's own memory of last Tuesday, and believing it makes them better off
 * whether or not they ever pay for anything.
 */
export const THE_INSIGHT = {
  eyebrow: 'Why this works',
  heading: 'You are not indecisive. It is a badly asked question.',
  body:
    '“What do you want to eat?” is an open question with hundreds of right answers, asked at the ' +
    'hour of the day when you have the least left to think with. Nobody is good at those. Ask the ' +
    'same person a closed one — hot or cold, now or later — and they answer in half a second and ' +
    'they are never wrong, because there are no wrong ones.',
  kicker:
    'So this does not ask you the hard question. It asks you eight easy ones and does the hard ' +
    'part itself.',
}

/** The three jobs, which every page is arranged around. */
export const THE_JOBS: { name: string; blurb: string }[] = [
  {
    /*
     * This used to be "It decides with you", which described a conversation the
     * app was not actually having: it asked, it answered, and the only thing
     * you could say back was no. Steering is the thing that makes the name
     * true, so the name says it.
     */
    name: 'You never have to know what you want',
    blurb:
      'A few either-ors, no wrong answers, one dish at the end of it — and if it is close but not right, you point. Lighter. Spicier. Sooner. It answers again in that direction instead of starting over. Knowing which way to lean is easy; knowing what you want is the hard thing nobody can do on an empty stomach.',
  },
  {
    name: 'It remembers what you don’t eat',
    blurb:
      'Halal, kosher, vegetarian, vegan, an allergy, or the one ingredient you cannot stand. Told once, applied to every decision, every mode and every list — free on every profile, and free for good. It lives in the browser you play in; a new device starts fresh.',
  },
  {
    name: 'It gets you fed',
    blurb:
      'An answer is not dinner. There is a recipe behind every dish, a shopping list you can take to the shop, a cook mode that walks you through it, and somewhere near you that serves it if you would rather not cook.',
  },
]

/*
 * The home page's title. Whop's hosting puts the app's own listing name over
 * the home page's <title>, so this is also the app's name on Whop (set with
 * `whop apps update --name`), and Whop caps that at thirty characters. Brand
 * first, then the question people actually type into a search box.
 */
export const SITE_TITLE = 'morsels45: What Should I Eat?'

/*
 * The description search results show: under 160 characters, or Google cuts
 * it mid-sentence. SITE_DESCRIPTION below is the long version, for structured
 * data, which has no such limit. Also the app's description on Whop, for the
 * same reason as the title.
 */
export const SITE_META_DESCRIPTION =
  'Can’t decide what to eat? Answer a few quick questions and get one dish with its recipe. Then plan your week, shop for it and cook it. Free to start.'
export const SITE_DESCRIPTION =
  `${WHAT_IT_IS} Deciding and your food rules are free; the meal planner is free with an account, which also brings one TV group and one radio group to cook and eat to every day; Premium adds every TV and radio group, the shopping list, nutrition, budget, your own recipes, recipes from websites, a food scanner that says how healthy something is, and more.`

declare global {
  interface Window {
    whop?: { track: (event: string, data?: Record<string, unknown>) => void }
  }
}

export function track(event: string, data?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  window.whop?.track(event, data)
  /*
   * And to GA4, when it is on, so the funnel is readable in a dashboard we
   * control rather than only in Whop's aggregates. Same event names and the
   * same payloads — there is no second, richer copy going anywhere, which is
   * what lets the privacy page describe one list and mean it.
   */
  if (GA4_ON) {
    const w = window as unknown as { gtag?: (...args: unknown[]) => void }
    try {
      w.gtag?.('event', event, data ?? {})
    } catch {
      /* analytics may never break the thing it is measuring */
    }
  }
}

/*
 * WHAT A FREE PROFILE CAN RULE OUT, written once.
 *
 * This is here for the same reason AFFILIATES_URL is: it appeared on five
 * pages, and a claim copy-pasted around a codebase is a claim that goes stale
 * on four of them. It did. Every one of those pages sold this as Premium and
 * said, in as many words, that it "does not run on Standard" — while the game
 * had been applying it free to everybody since the day the rules were made
 * free. A site telling somebody to pay for what they already have is worse
 * than a site with a typo on it, and it stayed up for weeks because the fix
 * touched one file and the claim lived in five.
 *
 * So the claim lives here now, and the pages read it.
 *
 * NO NUMBERS IN IT, deliberately. It said "the six standing rules" for as long
 * as there were six; there are fourteen now, and thirteen named diets over the
 * top of them, and the next time that changes this sentence should not need to.
 */
export const DIET_FREE =
  'Everything you do not eat is free, and always will be. Vegetarian, vegan and pescatarian; ' +
  'halal, kosher, Hindu, Jain, Sattvic, Buddhist, Sikh, Adventist, Word of Wisdom and Ital; ' +
  'or any single thing you would rather not be handed — pork, dairy, onion, shellfish, heat. ' +
  'Pick it once and nothing here offers it to you again.'

/** The short form, for a line in a list. */
export const DIET_FREE_SHORT =
  'Everything you do not eat — diets, faiths, or one ingredient at a time. Free, and applied ' +
  'to every decision, every mode and every list.'

/*
 * Why it is not a paid feature, in the app's own words. Said on the page that
 * is asking for money, because that is the only page where it is worth
 * anything.
 */
export const DIET_FREE_WHY =
  'An app that keeps offering a vegetarian a steak until they pay is not a trial, it is broken — ' +
  'and one that offers a Muslim pork until the card clears has not built a funnel, it has built ' +
  'an insult. Premium is what you can layer on top: banning a whole style of food, striking a ' +
  'named dish off for good, a guest’s rules for one sitting, and the heat dial.'

export const STANDARD = [
  'The decide game — about a dozen questions, and never more than twenty-four',
  'Quick decide — the same game over the 100 dishes everyone knows, and it gets there in about eight questions instead of eleven',
  'Endless — two dishes and a clock. Every pick buys time back, and buys back less each time. 200 picks a day',
  `All ${DISH_COUNT} dishes in the catalogue`,
  DIET_FREE_SHORT,
  'Ask anything — three free questions a day on your free account, unlimited on Premium',
  'Food news — the latest six headlines a day, with the publishers’ own summaries. Opening the pieces themselves is Premium',
  'Write me a menu — one every couple of days',
  'Browse, search, and filter the menu',
  'XP, levels, streaks, and badges',
  'Endless races your own best run — it tells you, mid-run, whether you are ahead of it',
  'Tonight’s pick — one dish, no questions',
  'How many plates, and share a verdict',
  'Installs to your home screen, and opens straight into the game',
  'Playable entirely from the keyboard',
  'An Android app, if you would rather have one than a tab',
]

/*
 * WHAT SIGNING IN ADDS, for nothing. Its own list rather than more lines on
 * STANDARD, because "free" and "free once you have an account" are different
 * asks: one is nothing, the other is a sign-in, and the pages should say which
 * is which instead of letting somebody find out when the radio asks them to
 * log in.
 */
/*
 * Named from the lineup the TV actually has (lib/tv-lineup.json, rebuilt by
 * scripts/tv-lineup.mjs), so this line cannot go on promising a channel that
 * stopped playing and was dropped from it.
 */
type LineupGroup = { id: string; name: string; channels: { name: string }[] }
const TV_GROUPS = (tvLineup as { categories: LineupGroup[] }).categories
const TV_NAMES = (TV_GROUPS.find((g) => g.id === 'food')?.channels ?? []).map((c) => c.name)
const TV_EXAMPLES = TV_NAMES.slice(0, 3).join(', ')
const TV_TOTAL = TV_GROUPS.reduce((n, g) => n + g.channels.length, 0)
const TV_OTHER_GROUPS = TV_GROUPS.filter((g) => g.id !== 'food' && g.channels.length).map((g) => g.name.toLowerCase())

export const ACCOUNT = [
  'Meal-prep calendar — breakfast, lunch, dinner and a snack for every day of the week, synced to your account, with a calendar AI that fills the gaps, plans your prep session and checks the balance',
  `TV to cook and eat to — ${TV_TOTAL} free live channels in groups: food (${TV_EXAMPLES} and more), then ${TV_OTHER_GROUPS.slice(0, -1).join(', ')} and ${TV_OTHER_GROUPS.at(-1)}. What is on now and next, and each channel checked from your own browser before it is listed`,
  'Radio to cook and eat to — food and dining stations, plus jazz, chill and lounge, lo-fi, classical, soul, oldies, acoustic, bossa nova and feel-good hits, about ten in each. It keeps playing while you look up the recipe',
  'Kitchen timers and converter — several named timers at once that ring wherever you are in the app, plus cups to grams, ounces, °F and gas marks',
  'In season — what is at its best this month, and the dishes that use it',
  'The daily three — a mood check-in, one good thing, and a food question everybody gets the same day, with streaks that follow you between devices',
]

/*
 * WHAT PREMIUM IS, IN THREE SENTENCES.
 *
 * PREMIUM_SECTIONS below is thirty-odd features in five groups, and it is the
 * right thing for somebody who has decided to pay and wants to know what they
 * are getting. It is the wrong thing for somebody deciding — thirty bullets
 * is a list nobody finishes, and offering thirty choices to somebody whose
 * whole complaint is that choosing is exhausting argues against the product.
 *
 * So the front of the pitch is three, and they are three OUTCOMES rather than
 * three features: what stops happening, what you end up eating, and who else
 * it covers. Each one is true of several of the features below, which is the
 * test for whether it belongs here at all.
 */
export const PREMIUM_HEADLINES: { name: string; blurb: string }[] = [
  {
    name: 'Your week, sorted',
    blurb:
      'Plan the week in the calendar — that part is free with an account — and Premium turns it into one shopping list merged and sorted by aisle, a nutrition count against your own targets, and a budget with cheaper swaps for the priciest nights.',
  },
  {
    name: 'A smarter kitchen',
    blurb:
      'Your family recipes on every device — copied from a photo of the card, even handwriting. Any recipe from a website without the life story. Scan food and see in plain words how healthy it is. Dinner from a photo of the fridge. Cook mode that reads the steps aloud.',
  },
  {
    /*
     * The one line on this page that names who "you" is — the argument this
     * product exists to settle happens between people, and so does most
     * cooking for anyone but yourself.
     */
    name: 'Cooking for more than you',
    blurb:
      'A dinner-party menu every guest can eat, with a timeline that works back from when you sit down. A real browser two of you drive at once — to order, shop or cook along. And it remembers what you like, so it stops offering the same thing twice.',
  },
]

/*
 * What Premium is, in sections.
 *
 * It was one flat list of twenty-odd lines, which is a list nobody finishes:
 * the modes, the shared browser and the small settings all ran together at the
 * same weight, so the expensive thing in the middle read like another bullet.
 * Grouping them says what kind of thing each one is before saying what it
 * does — and puts the browser, which is the only part that costs real money to
 * run, under its own heading where it cannot be skimmed past.
 */
export const PREMIUM_SECTIONS: { name: string; blurb: string; items: [string, string][] }[] = [
  {
    name: 'Plan the week',
    blurb: 'The meal calendar is free with an account. Premium is everything that runs off it.',
    items: [
      ['Shopping list from your week', 'Every ingredient in every recipe on your calendar, scaled to your household, merged into one list and sorted by aisle. Tick it off in the shop and it syncs to your other devices; copy or share it in one tap.'],
      ['Nutrition for the week', 'Roughly what each planned day adds up to — energy, protein, carbs, fat and fibre — against targets you set. Estimated from the recipe each dish actually uses, and labelled as an estimate.'],
      ['Budget for the week', 'Roughly what the week costs to cook, in your currency and for your household, against a budget you set — with cheaper dishes that keep your food rules, swapped in with one tap.'],
      ['Dinner party planner', 'Each guest’s rules — vegetarian, vegan, no pork, no dairy, nothing spicy — and a menu every one of them can eat, with a clock-time timeline that works back from when you sit down, and the shopping list for it.'],
    ],
  },
  {
    name: 'Your kitchen',
    blurb: 'The tools for the cooking itself — in Recipes & kitchen, and Scan food.',
    items: [
      ['Your own recipes', 'Keep the family recipes safe, on every device: type them in, copy them from a photo of a cookbook page or a handwritten card, or paste them from an email and it tidies them up. Change the number of people and the amounts change too.'],
      ['Recipes from websites', 'Paste the address of a recipe on almost any site and get just the ingredients and the steps — no long story, no pop-ups, no adverts. It reads the site’s recipe card, the page itself, or the recipe plugins food blogs use, and the AI reads the page when nothing else can.'],
      ['Scan food — is it healthy?', 'Scan the barcode on anything in the shop or the cupboard: a score out of 100, a green, amber or red answer, sugar in teaspoons and salt as a share of your daily limit — and a warning if it has something you do not eat. Data from Open Food Facts.'],
      ['Dinner from a photo of your fridge', 'Photograph the fridge or the cupboard. It lists what it can see and which dishes you can make, what each one uses and what you would still need. The photo is not kept.'],
      ['Hands-free cook mode', 'The steps read aloud, and voice commands for “next”, “back”, “repeat” and “start timer” — for when your hands are covered in flour.'],
    ],
  },
  {
    name: 'Stay in the know',
    blurb: 'The news section is free to browse. Premium reads it for you.',
    items: [
      ['Daily food briefing', 'The five food stories worth knowing today, boiled down by AI to a sentence or two each with a link to the publisher’s own article — and one thing to cook today because of them.'],
    ],
  },
  {
    name: 'It gets to know you',
    blurb: 'Everything above works better the longer you use it.',
    items: [
      ['Picks tuned to you', 'Rate a dish and it changes what comes up next.'],
      ['Something new', 'Two questions, then a few dishes you have not had — chosen from the ones you actually liked, each with a reason for why it follows. Only ever real dishes off this menu, so every suggestion has its recipe behind it.'],
      ['Save unlimited dishes', 'Standard saves none. Premium keeps everything you like.'],
      ['The advanced assistant', 'Ask anything on Gemini: it knows your taste and your food rules, reads a photo, can look things up on the web, suggests what to ask next, helps you plan, cook or choose, and remembers the conversation. Standard questions are free and three a day.'],
      ['Play with Dot', 'Ten games with the companion in the corner — an arena survival, a climber, a merging pot, a bubble shooter, match-three, an invaders shooter, a lane crosser, a stacker, an aiming game and a memory pattern. Dot also changes shape with what it is looking at: hot goes red, cold goes blue, a drink melts. Hold Dot for a menu that answers questions about morsels45, and take its guided tour. Free for everyone.'],
      ['Five extra looks', 'Ember, matcha, ink, paper, neon.'],
    ],
  },
  {
    name: 'The shared browser',
    blurb: 'A real browser running in the cloud that two people use at once, each from their own phone with their own cursor. You open it from one of the buttons below, send the other person the link, and you both see and do the same thing. It is the part that costs money to run by the minute.',
    items: [
      ['Order it together — on the answer screen', 'Once you accept a dish, open a delivery site on it in a browser you both drive, and fill one basket.'],
      ['Order from here — in Nearby', 'Pick a restaurant near you and order from its own site, in the same shared browser — no phone call, no queue.'],
      ['Cook along — in cook mode', 'Two kitchens, one cooking video, in step. "Wait, go back" means the same frame for both of you.'],
      ['Shop it together — on any shopping list', 'A recipe’s list, or your whole week’s from the planner: one supermarket basket, filled by both of you.'],
    ],
  },
  {
    name: 'Control what comes up',
    blurb: 'The difference between a game that guesses and one that knows the rules.',
    items: [
      ['Ban a whole style of food', `Not what is in it — what it is. Anything the questions ask about: hot, sweet, soupy, handheld, whatever you like, struck off before it is asked. ${DIET_FREE} Premium is the layer over the top, and never-agains a named dish for good.`],
      ['Meal slot', 'Lock breakfast, lunch, dinner or late. Every mode respects it.'],
      ['Heat dial', 'Keep spice off, or ask for a kick — applied to every decision.'],
      ['Mix it up', 'Stick to what you like, keep the usual mix, or reach for the long tail.'],
      ['Guest at the table', 'Extra avoids for this sitting only. What you do not eat stays exactly as it is.'],
      ['Themed Endless runs', 'Pick what a run is made of before it starts — quick things, comfort food, vegetarian, spicy, sweet. Pairs that would almost never meet in the full catalogue, and a fiftieth run that does not play like the fifth.'],
      ['Don’t repeat this week', 'Accept a dish and it is off the table for seven days.'],
    ],
  },
  {
    name: 'Once you have decided',
    blurb: 'The part after the answer, which is usually where the evening actually goes wrong.',
    items: [
      ['Cook mode', 'One step at a time, with a timer built in.'],
      ['Cook from your kitchen', 'Name what you already have. Get recipes you can start now.'],
      ['Somewhere that serves it', 'Find the dish near you, matched on what a place actually sells rather than on being open and close by.'],
      ['A side with that', 'A drink or a light plate that actually sits next to the answer.'],
      ['A planned week', 'Seven dishes, no two alike.'],
      ['Write me a menu', 'Five courses that belong on the same table — something to pick at, a starter, a main, a pudding and something to finish. Not five heavy things, and not five from the same kitchen unless that is the point of it. Tell it the situation in your own words, or answer three quick questions, and it picks all five from the catalogue with a reason for each. Standard gets one every couple of days; Premium as many as you like.'],
    ],
  },
  {
    name: 'Ways to play',
    blurb: 'Six more games than the questionnaire, for when the questionnaire is not the mood — and the daily count taken off the free one.',
    items: [
      ['Knockout', 'An 8-dish bracket. Round of 8, semifinal, final.'],
      ['Blitz', 'Thirty seconds on the clock, and rounds that change the rules — a third card, a blind pick, a round that counts double, one that asks which you would NOT eat.'],
      ['This or that', 'A running champion defends its streak against whatever challenges it next.'],
      ['Shortlist', 'Eight dishes from what you like. Tap out the ones you are not in the mood for, swap them for ones you have not seen, and stop the reel yourself on what is left.'],
      ['Together', 'Up to six of you round one phone. Five either-ors each, then one dish the whole table can live with — and what you all turned out to agree on.'],
      ['Swipe', 'A deck, one dish at a time. Right for yes, left for no. Every no re-sorts what is left away from it, and three yeses end it with a choice between the three.'],
      ['Smash', 'A wall of dishes and a ball. Smash the ones you do not want, lock the ones you do, and whatever is left standing is dinner. Do not like the wall? Deal a fresh one.'],
      ['Drop Zone', 'Drop balls down a pegboard into dishes and nudge them as they fall. Where they land is a vote. Do not like the bins? Reshuffle them.'],
      ['Slice', 'Dishes are thrown across the screen. Swipe through the ones you want and let the rest go; bombs cost a heart, and the pace keeps changing. What you sliced most is dinner.'],
      ['Dish Derby', 'Eight dishes line up for a race. Back a favourite, cheer it on, slip a pat of butter under the one you do not fancy, boost whoever you like. Do not like the field? Reroll it. The podium is dinner. Every one of these games has a way to say none of these, and what you reject shapes the next round.'],
      ['Endless, with no count on it', 'Endless itself is free and always will be — but a free profile gets 200 picks a day and then it stops until tomorrow. Premium takes the daily count off entirely: the only thing that ends a run is the clock.'],
      ['A second wind', 'Once a run, the clock reaching zero does not end it. No prompt, no countdown, no button to press — it simply keeps going with a few seconds back and the streak reset. The one thing that kills a run, survived, once.'],
    ],
  },
]
