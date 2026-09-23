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
 * THE ANCHOR, AND WHY IT IS ALLOWED TO BE ONE.
 *
 * People judge a price against whatever number they saw first, so a pricing
 * page that shows $29.99 alone is being read against nothing. The number put
 * beside it here is $59.88 — twelve payments at the monthly price, on this
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
 * THE PREVIEW, SAID ON THE SITE AS WELL AS IN THE APP.
 *
 * The app announces it on its own first screen, which covers everybody who
 * opens it. This is for the reader deciding whether to open it at all, and for
 * the one who arrived at the price first: "try it" is a weaker sentence than
 * "it is already on".
 *
 * Kept to what is checkable. Five is PREVIEW_DECISIONS in progress.js; "no
 * card, no account" is true because the whole thing is a field in localStorage;
 * and the counted ending is paintPreviewOver. If any of those changes, this
 * sentence is wrong and /honesty is wrong with it.
 */
export const THE_PREVIEW =
  'Your first five decisions run with Premium switched on — no card, no account, nothing to ' +
  'cancel. When the fifth one lands, it counts up what you actually used and tells you what stops.'

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
export const WHAT_IT_IS =
  'An assistant for working out what to eat. It asks, you point, and it gets you fed.'

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

export const SITE_TITLE = 'morsels45 — what should I eat?'
export const SITE_DESCRIPTION =
  `${WHAT_IT_IS} Free to play and free to tell it your rules — halal, kosher, vegetarian, an allergy. Premium remembers what you like and gets you from the answer to the table.`

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
    /*
     * The one line on this page that names who "you" is.
     *
     * Shared identity is the strongest thing in the persuasion literature and
     * the easiest to fake badly — a brand inventing a tribe to belong to. The
     * honest version needs no invention: the argument this product exists to
     * settle is one that happens between two people, and it is a very
     * specific two people who both recognise it instantly. Saying so is not a
     * appeal to belonging, it is a description of the customer.
     */
    name: 'Two of you, one answer',
    blurb:
      `The argument this whole thing exists to settle happens between two people, and both of them are sitting there. Together takes five either-ors from each of you on one phone and lands on the one dish you can both live with, in about twenty seconds. The shared browser then orders it from two, with a cursor each.`,
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
