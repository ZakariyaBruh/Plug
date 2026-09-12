export const SITE_NAME = 'morsels45'
export const SITE_URL = 'https://morsels45-app.whop.site'
export const SITE_CARD = `${SITE_URL}/site-card.png`
export const SITE_CARD_ALT = 'morsels45 — stop scrolling, start eating'

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
export const DISH_COUNT = 133

/*
 * The affiliate programme.
 *
 * One constant because it now appears in several places, and a money link
 * copy-pasted around a codebase is a money link that goes stale in three of
 * them. The game has its own copy of this in decide/js/app.js, which is a
 * separate static app and cannot import from here.
 */
export const AFFILIATES_URL = 'https://whop.com/morsels45/affiliates'

/*
 * The Whop pixel.
 *
 * WHY IT HAS TO EXIST. The Meta campaign optimises for conversions, and every
 * number Whop reports about an ad is attributed by this pixel rather than by
 * the ad network. Without it, Meta has nothing to optimise toward and the
 * campaign reports zero conversions however well it actually does — money
 * spent with no way to tell whether it worked.
 *
 * ON EVERY PAGE IN THE FUNNEL, which the docs are explicit about: landing
 * pages, not just the homepage. Ads point at /decide/, so the game needs it
 * as much as the marketing site does — and the game is a separate static app
 * with its own <head>, so its copy is written out in public/decide/index.html
 * rather than imported from here.
 *
 * WHAT IT SENDS. Page views, and whatever whop.track() is called with. It is a
 * third-party script that sets an identifier so a visit can be joined to a
 * purchase later. Worth knowing rather than glossing over, given who plays
 * this.
 */
export const WHOP_ACCOUNT_ID = 'biz_6yKUB6bZeE3ANl'

const PIXEL_LOADER =
  '!function(w,d,s,u,n,a,b){if(w[n])return;a=w[n]={q:[],t:+new Date,s:[],o:u,' +
  'track:function(){a.q.push([+new Date].concat([].slice.call(arguments)))},' +
  'setScope:function(){a.s=[].slice.call(arguments).filter(function(x){return typeof x==="string"});' +
  'a.q.push([+new Date,"setScope"].concat(a.s))},' +
  'scope:function(){var c=[].slice.call(arguments);return{track:function(){' +
  'a.q.push([+new Date].concat([].slice.call(arguments)).concat([{__scope:c}]))}}}};' +
  'b=d.createElement(s);b.async=1;b.src=u+"/s.js";' +
  'd.getElementsByTagName(s)[0].parentNode.insertBefore(b,d.getElementsByTagName(s)[0])}' +
  '(window,document,"script","https://t.whop.tw","whop");'

export const WHOP_PIXEL =
  `${PIXEL_LOADER}\nwhop.setScope("${WHOP_ACCOUNT_ID}");\nwhop.track("page");`

export const ANDROID_APK = '/morsels45.apk'
export const ANDROID_VERSION = '1.0.0'
export const ANDROID_SIZE = '6.0 MB'

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
    { property: 'og:image', content: SITE_CARD },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:image:alt', content: SITE_CARD_ALT },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: ogTitle },
    { name: 'twitter:image', content: SITE_CARD },
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
 * three days away. These constants exist so the page and the checkout cannot
 * drift apart: a site still promising a trial that the plan no longer grants
 * is worse than never having offered one. Change it on the plan, then here.
 *
 * PRICE_VALUE is the number the analytics events carry; PRICE is the same
 * amount written the way a person reads it.
 */
export const TRIAL_DAYS = 3
export const PRICE_VALUE = 3.45
export const PRICE = '$3.45'
export const PRICE_MONTHLY = `${PRICE}/month`

/** "3 days free, then $3.45/month" — the whole offer, for body copy. */
export const OFFER = `${TRIAL_DAYS} days free, then ${PRICE_MONTHLY}`
/** For a title or a button, where the price alone is the wrong emphasis. */
export const OFFER_SHORT = `${TRIAL_DAYS} days free`
/*
 * Tax, said once and honestly.
 *
 * The plan is set to tax-inclusive with tax collection and adaptive pricing
 * both on, so what somebody actually pays depends on where they are: the total
 * is $3.45 in some places and a little over in others. Which rule produces
 * which total is Whop's to decide and not knowable from here, so this promises
 * only what is certainly true — the number on the checkout page is the number
 * that gets charged.
 */
export const TAX_NOTE = `Tax may be added depending on where you are, so the total can come to a little over ${PRICE}. Checkout shows exactly what you will pay before you pay it.`

/** Said wherever somebody is about to hand over a card. */
export const TRIAL_TERMS = `Free for ${TRIAL_DAYS} days, then ${PRICE_MONTHLY}. Cancel any time before it ends and you are not charged.`

export const SITE_TITLE = 'morsels45 — stop scrolling, start eating'
export const SITE_DESCRIPTION =
  `A 20-second food-decision game. Free to play. Premium adds Always avoid, cook mode, Knockout, Blitz, Shortlist, Together, Swipe, the shared browser, and saved dishes \u2014 ${OFFER}.`

declare global {
  interface Window {
    whop?: { track: (event: string, data?: Record<string, unknown>) => void }
  }
}

export function track(event: string, data?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  window.whop?.track(event, data)
}

export const STANDARD = [
  'The 20-question Decide game',
  'Endless — two dishes and a clock. Every pick buys time back, and buys back less each time. 200 picks a day',
  `All ${DISH_COUNT} dishes in the catalogue`,
  'Browse, search, and filter the menu',
  'XP, levels, streaks, and badges',
  'Endless races your own best run — it tells you, mid-run, whether you are ahead of it',
  'Tonight’s pick — one dish, no questions',
  'How many plates, and share a verdict',
  'Installs to your home screen, and plays with no signal',
  'Playable entirely from the keyboard',
  'Nearby — everywhere you could eat, sorted by what kind of place it is',
  'An Android app, if you would rather have one than a tab',
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
    name: 'Ways to play',
    blurb: 'Six more games than the questionnaire, for when the questionnaire is not the mood — and the daily count taken off the free one.',
    items: [
      ['Knockout', 'An 8-dish bracket. Round of 8, semifinal, final.'],
      ['Blitz', 'Thirty seconds on the clock, and rounds that change the rules — a third card, a blind pick, a round that counts double, one that asks which you would NOT eat.'],
      ['This or that', 'A running champion defends its streak against whatever challenges it next.'],
      ['Shortlist', 'Eight dishes from what you like. Tap out the ones you are not in the mood for and spin what is left.'],
      ['Together', 'Up to six of you round one phone. Five either-ors each, then one dish the whole table can live with — and what you all turned out to agree on.'],
      ['Swipe', 'A deck, one dish at a time. Right for yes, left for no. Every no re-sorts what is left away from it, and three yeses end it with a choice between the three.'],
      ['Endless, with no count on it', 'Endless itself is free and always will be — but a free profile gets 200 picks a day and then it stops until tomorrow. Premium takes the daily count off entirely: the only thing that ends a run is the clock.'],
      ['A second wind', 'Once a run, the clock reaching zero does not end it. No prompt, no countdown, no button to press — it simply keeps going with a few seconds back and the streak reset. The one thing that kills a run, survived, once.'],
    ],
  },
  {
    name: 'The shared browser',
    blurb: 'A real browser running somewhere else, that two people drive at once with a cursor each. This is the part that costs money to run, and the part a subscription actually pays for.',
    items: [
      ['Order it together', 'A real browser you both drive, opened on the dish you landed on. Send the link and you get a cursor each.'],
      ['Order from here', 'Pick a place in Nearby and order from its own site, in the same shared browser — no phone call, no queue.'],
      ['Cook along', 'Two kitchens, one video, in step. "Wait, go back" means the same frame for both of you.'],
      ['Shop the list together', 'One basket, filled by both of you, from the shopping list the recipe made.'],
    ],
  },
  {
    name: 'Control what comes up',
    blurb: 'The difference between a game that guesses and one that knows the rules.',
    items: [
      ['Always avoid', 'Ban meat, seafood, cheese, spice, fried food, caffeine — applied to every decision, never asked again. Not on Standard.'],
      ['Meal slot', 'Lock breakfast, lunch, dinner or late. Every mode respects it.'],
      ['Heat dial', 'Keep spice off, or ask for a kick — applied to every decision.'],
      ['Mix it up', 'Stick to what you like, keep the usual mix, or reach for the long tail.'],
      ['Guest at the table', 'Extra avoids for this sitting only. Always avoid stays as it is.'],
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
      ['Write me a menu', 'A starter, a main and a pudding that belong on the same table — not three heavy things, and not three cold ones. Each course scored against the others so the evening goes somewhere, and every one has its recipe behind it.'],
    ],
  },
  {
    name: 'It gets to know you',
    blurb: 'Everything above works better the longer you use it.',
    items: [
      ['Picks tuned to you', 'Rate a dish and it changes what comes up next.'],
      ['Something new', 'Two questions, then a few dishes you have not had — chosen from the ones you actually liked, each with a reason for why it follows. Only ever real dishes off this menu, so every suggestion has its recipe behind it.'],
      ['Save unlimited dishes', 'Standard saves none. Premium keeps everything you like.'],
      ['Five extra looks', 'Ember, matcha, ink, paper, neon.'],
    ],
  },
]
