// This business's one real Whop product. No license keys anywhere in this
// flow — access is granted straight to the buyer's Whop account.
export const PREMIUM_PRODUCT_ID = 'prod_cq5YnoQQr6BGa'

/*
 * THE PLAN PEOPLE BUY, AND WHY IT IS NOT THE FIRST ONE.
 *
 * Premium went from $3.45 to $4.99 a month. Whop will not reprice a plan that
 * has sold memberships — it answers HTTP 400, "You cannot change the renewal
 * price of a plan that has sold memberships" — so the price lives on a second
 * plan rather than on the original.
 *
 * plan_0vp7Ai1r4WDWx is the old $3.45 one. It is set to hidden, so it is not
 * purchasable and not listed, but it still exists and still bills the people
 * who were already on it at the price they agreed to. Do not delete it: the
 * memberships hang off it, and Whop marks it undeletable for that reason.
 *
 * Access is checked against PREMIUM_PRODUCT_ID above, not against a plan, so
 * everybody on either plan gets Premium and this swap took nothing away from
 * anybody.
 */
export const PREMIUM_PLAN_ID = 'plan_Ejw0IKpnJoeF1'

/*
 * THE YEARLY PLAN, and why it is a second plan rather than a setting.
 *
 * A Whop plan carries one billing period, so monthly and yearly are two plans
 * on the same product. Access is checked against PREMIUM_PRODUCT_ID above, so
 * both of them unlock exactly the same thing and nothing in the app has to
 * know which one somebody is on.
 *
 * $29.99 a year against $4.99 a month is 49.9% off — "half price" is a fair
 * thing to call it, and it is the only discount either plan claims.
 *
 * Same seven-day trial as the monthly plan, deliberately: a yearly plan with
 * no trial reads as the riskier of the two, which is backwards when it is the
 * one being recommended.
 */
export const PREMIUM_ANNUAL_PLAN_ID = 'plan_u7VsoLgZwbeaV'

/*
 * What /checkout/$planId will mount an embed for. Anything else gets the
 * "this checkout is Premium only" page — the plan id comes out of a URL, and
 * a URL is not a thing to trust with what somebody is about to be charged.
 */
/*
 * HOUSEHOLD — the same Premium, covering two people.
 *
 * On the same product as the solo plans, deliberately: the buyer then passes
 * the one access check the whole app already makes, and nothing has to learn
 * a second way of being a subscriber. What the household plans add is the
 * right to hand out a seat, which lib/household.ts grants and polices.
 */
export const HOUSEHOLD_MONTHLY_PLAN_ID = 'plan_ywZM7yXwyrP9g'
export const HOUSEHOLD_ANNUAL_PLAN_ID = 'plan_5oEbN6PrjJiPO'
export const HOUSEHOLD_PLAN_IDS: readonly string[] = [
  HOUSEHOLD_MONTHLY_PLAN_ID,
  HOUSEHOLD_ANNUAL_PLAN_ID,
]

/*
 * The free, hidden plan a granted seat is a membership on.
 *
 * NEVER MAKE THIS VISIBLE AND NEVER LINK TO IT. It is attached to the Premium
 * product and costs nothing, so a membership on it is Premium for free,
 * forever. The only code that may create one is grantSeat() in
 * lib/household.ts, behind the checks written there.
 */
export const SEAT_PLAN_ID = 'plan_D9QrAnhrMRSV0'

/*
 * What /checkout/$planId will mount an embed for. Anything else gets the
 * "this checkout is Premium only" page — the plan id comes out of a URL, and
 * a URL is not a thing to trust with what somebody is about to be charged.
 * The seat plan is deliberately absent: it is not for sale at any price.
 */
export const SELLABLE_PLAN_IDS: readonly string[] = [
  PREMIUM_PLAN_ID,
  PREMIUM_ANNUAL_PLAN_ID,
  ...HOUSEHOLD_PLAN_IDS,
]

/*
 * A FREE ACCOUNT, WHICH IS WHERE A PROFILE LIVES.
 *
 * Everything the game knows about somebody has always been in one browser's
 * localStorage, so a new phone meant starting again — and "it remembers what
 * you like" is not a promise you can keep in a place that only one device can
 * reach.
 *
 * This app has no database. No KV, no D1, no R2: the worker is hosted by Whop
 * and the only durable store in reach is Whop's own. So an account is a
 * membership on a free plan, and the profile is that membership's metadata.
 *
 * ON ITS OWN PRODUCT, DELIBERATELY. Premium access is a check against
 * PREMIUM_PRODUCT_ID, and a free plan attached to that product would hand out
 * Premium to everybody who signed in. This product grants nothing at all: it
 * exists to be a place to keep 3KB of somebody's own dinners.
 */
export const ACCOUNT_PRODUCT_ID = 'prod_hoNUXPfZ8aQJ3'
export const ACCOUNT_PLAN_ID = 'plan_pJ4jecSQ1yMfm'
