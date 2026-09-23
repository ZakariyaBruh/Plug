/*
 * PROMOTIONS, AND THE ONE RULE THEY ALL FOLLOW.
 *
 * A promo here is an announcement attached to a real Whop promo code. The
 * announcement is ours; the *counting* is not, and that is the whole design.
 *
 * WHY THE COUNT COMES FROM WHOP AND NOWHERE ELSE. "Twenty slots, N taken" is
 * a scarcity claim, and scarcity claims are the easiest thing in commerce to
 * fake — a number in a file, a timer that resets, a counter that only ever
 * goes up on the screen. docs/persuasion.md refuses fake scarcity outright,
 * so the only version of this feature worth building is one where the number
 * cannot be faked even by us: the promo code's own `stock` and `uses` on
 * Whop, read live, with Whop enforcing the limit at checkout. When it says
 * twenty are gone, twenty people were charged less. There is no second copy
 * of that number to drift, and this app has no database to keep one in.
 *
 * TO RUN A NEW ONE: make the promo code on Whop (`whop promo-codes create`,
 * with --stock for a limited run), then add an entry below with its id. That
 * is the whole job — the endpoint, the banner, the counter and the going-away
 * all follow from the code's own record.
 */
import { PREMIUM_PLAN_ID } from '#/lib/products'

export type Promo = {
  /** Stable id. The game uses it to remember that this one was dismissed. */
  id: string
  /** The Whop promo code's id. Its stock and uses are the only counter. */
  promoId: string
  /** What somebody types at checkout. Shown so it can be copied. */
  code: string
  /** The offer in one line. */
  headline: string
  /** What it is, in a sentence, including the catch if there is one. */
  body: string
  /** The button. */
  cta: string
  /** Which plan the button opens. */
  planId: string
  /** Optional window. Absent means "from now" / "until the stock runs out". */
  from?: string
  until?: string
}

export const PROMOS: Promo[] = [
  {
    id: 'foodie-30',
    promoId: 'promo_oiInSUluVRLQ',
    code: 'foodie_30%',
    headline: '30% off your first month',
    body:
      'The first twenty people to use this code get 30% off their first payment. ' +
      'It still starts with the seven days free, and it still cancels in one link.',
    cta: 'Use the code',
    planId: PREMIUM_PLAN_ID,
  },
]

/**
 * The promo that should be on air right now, by date alone — whether it has
 * any stock left is a question only Whop can answer, and api/promo.ts asks it.
 */
export function scheduled(now: Date = new Date()): Promo | null {
  const t = now.getTime()
  for (const promo of PROMOS) {
    if (promo.from && t < Date.parse(promo.from)) continue
    if (promo.until && t > Date.parse(promo.until)) continue
    return promo
  }
  return null
}

/** What the game is told. `live` false means show nothing at all. */
export type PromoState =
  | { live: false }
  | {
      live: true
      id: string
      code: string
      headline: string
      body: string
      cta: string
      href: string
      taken: number
      total: number
      left: number
    }
