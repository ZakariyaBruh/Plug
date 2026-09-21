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
 * HOUSEHOLD IS RETIRED.
 *
 * There were two household plans and a hidden free "seat" plan that the
 * buyer could grant to one other person. All three still exist on Whop and
 * all three have never had a member — the offer was removed before anybody
 * took it, which is the only painless moment to remove an offer.
 *
 * The ids are not kept here. A constant nothing reads is a constant somebody
 * re-wires by accident, and the seat plan in particular is free and attached
 * to the Premium product, so a membership on it is Premium for nothing. If
 * household ever comes back it should be built again rather than
 * un-commented, because the seat machinery it needs was removed with it.
 *
 * On Whop: plan_ywZM7yXwyrP9g, plan_5oEbN6PrjJiPO and plan_D9QrAnhrMRSV0.
 * Written down once, here, so they can be found and archived by hand.
 */

export const SELLABLE_PLAN_IDS: readonly string[] = [
  PREMIUM_PLAN_ID,
  PREMIUM_ANNUAL_PLAN_ID,
]
