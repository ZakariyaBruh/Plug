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
export const PRICE_VALUE = 4.99
export const PRICE = '$4.99'
export const PRICE_MONTHLY = `${PRICE}/month`

/*
 * THE YEARLY PRICE.
 *
 * $29.99 against $59.88 of monthly payments is 49.9% off, which is why the
 * copy is allowed to say "half price" — and PRICE_ANNUAL_PER_MONTH is that
 * number divided by twelve and rounded, for the line that makes it comparable
 * to the monthly one at a glance.
 *
 * ANNUAL_SAVING is computed rather than written down, because a discount
 * claim that drifts from the two prices next to it is the one number on a
 * pricing page nobody forgives.
 */
export const PRICE_ANNUAL_VALUE = 29.99
export const PRICE_ANNUAL = '$29.99'
export const PRICE_YEARLY = `${PRICE_ANNUAL}/year`
export const PRICE_ANNUAL_PER_MONTH = `$${(PRICE_ANNUAL_VALUE / 12).toFixed(2)}`
export const ANNUAL_SAVING = Math.round((1 - PRICE_ANNUAL_VALUE / (PRICE_VALUE * 12)) * 100)

/*
 * HOUSEHOLD: the same thing, for two people.
 *
 * The argument this app is sold against happens between two people, so a
 * subscription that only ever covers one of them answers half of it. Priced
 * at $3 a month over the solo plan rather than at double, because the second
 * seat costs almost nothing to run and a household that cancels together is
 * the churn worth avoiding.
 *
 * Same 50% shape on the yearly plan, so the one sentence — "half price, paid
 * yearly" — is true of both tiers and there is only one discount to explain.
 */
export const HOUSEHOLD_SEATS = 2
export const PRICE_HOUSEHOLD_VALUE = 7.99
export const PRICE_HOUSEHOLD = '$7.99'
export const PRICE_HOUSEHOLD_MONTHLY = `${PRICE_HOUSEHOLD}/month`
export const PRICE_HOUSEHOLD_ANNUAL_VALUE = 47.99
export const PRICE_HOUSEHOLD_ANNUAL = '$47.99'
export const PRICE_HOUSEHOLD_YEARLY = `${PRICE_HOUSEHOLD_ANNUAL}/year`
export const PRICE_HOUSEHOLD_PER_MONTH = `$${(PRICE_HOUSEHOLD_ANNUAL_VALUE / 12).toFixed(2)}`

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

export const SITE_TITLE = 'morsels45 — stop scrolling, start eating'
export const SITE_DESCRIPTION =
  `A 20-second food-decision game. Free to play, and free to tell it what you do not eat. Premium learns what you like, stops repeating itself, and opens a real browser two people can order in at once \u2014 ${OFFER}.`

declare global {
  interface Window {
    whop?: { track: (event: string, data?: Record<string, unknown>) => void }
  }
}

export function track(event: string, data?: Record<string, unknown>) {
  if (typeof window === 'undefined') return
  window.whop?.track(event, data)
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
  'The decide game — about eight questions, and never more than twenty',
  'Endless — two dishes and a clock. Every pick buys time back, and buys back less each time. 200 picks a day',
  `All ${DISH_COUNT} dishes in the catalogue`,
  DIET_FREE_SHORT,
  'Ask anything — three free questions, then it is Premium',
  'Food news — the latest six headlines a day, with the publishers’ own summaries. Opening the pieces themselves is Premium',
  'Write me a menu — one every couple of days',
  'Browse, search, and filter the menu',
  'XP, levels, streaks, and badges',
  'Endless races your own best run — it tells you, mid-run, whether you are ahead of it',
  'Tonight’s pick — one dish, no questions',
  'How many plates, and share a verdict',
  'Installs to your home screen, and opens straight into the game',
  'Playable entirely from the keyboard',
  'Nearby — everywhere you could eat, sorted by what kind of place it is',
  'An Android app, if you would rather have one than a tab',
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
    name: 'It stops repeating itself',
    blurb:
      'Strike a dish off and it never comes back. Accept one and it is off the table for a week. Everything it offers leans towards what you have actually liked — which is the part a free profile cannot do, because it does not remember you. That memory lives in the browser you play in; signing in elsewhere switches Premium on there, and starts its memory fresh.',
  },
  {
    name: 'It gets you fed, not just decided',
    blurb:
      'Cook mode takes it one step at a time with the timer built in. The shopping list goes to the shop with you. And if you would rather not cook, it finds somewhere near you that actually serves the thing.',
  },
  {
    name: 'Two of you, one answer',
    blurb:
      `Household covers both of you on one subscription, each with your own tastes and your own rules. Together settles it on one phone in about twenty seconds. The shared browser orders it from two, with a cursor each.`,
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
    name: 'It gets to know you',
    blurb: 'Everything above works better the longer you use it.',
    items: [
      ['Picks tuned to you', 'Rate a dish and it changes what comes up next.'],
      ['Something new', 'Two questions, then a few dishes you have not had — chosen from the ones you actually liked, each with a reason for why it follows. Only ever real dishes off this menu, so every suggestion has its recipe behind it.'],
      ['Save unlimited dishes', 'Standard saves none. Premium keeps everything you like.'],
      ['Five extra looks', 'Ember, matcha, ink, paper, neon.'],
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
      ['Write me a menu', 'A starter, a main and a pudding that belong on the same table — not three heavy things, and not three cold ones. Tell it the situation in your own words, or answer three quick questions, and it picks all three from the catalogue with a reason for each. Standard gets one every couple of days; Premium as many as you like.'],
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
      ['Endless, with no count on it', 'Endless itself is free and always will be — but a free profile gets 200 picks a day and then it stops until tomorrow. Premium takes the daily count off entirely: the only thing that ends a run is the clock.'],
      ['A second wind', 'Once a run, the clock reaching zero does not end it. No prompt, no countdown, no button to press — it simply keeps going with a few seconds back and the streak reset. The one thing that kills a run, survived, once.'],
    ],
  },
]
