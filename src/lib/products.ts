// This business's one real Whop product. No license keys anywhere in this
// flow — access is granted straight to the buyer's Whop account.
export const PREMIUM_PRODUCT_ID = 'prod_cq5YnoQQr6BGa'

/*
 * THE PLAN PEOPLE BUY.
 *
 * plan_Ejw0IKpnJoeF1, the $4.99 plan this constant used to point at, was
 * repriced on Whop's own dashboard without this file being updated to match —
 * the plan no longer exists at all (Whop's API 404s on it), which meant every
 * checkout on the live site was silently landing on the "this checkout is
 * Premium only" dead end, for however long nobody noticed. Checked against
 * Whop directly on 2026-10-03 and fixed to the id actually live: $3.45/month,
 * two real members already on it.
 *
 * Access is checked against PREMIUM_PRODUCT_ID above, not against a plan, so
 * a price change here never needs to touch anything that gates a feature.
 */
export const PREMIUM_PLAN_ID = 'plan_0vp7Ai1r4WDWx'

/*
 * THE YEARLY PLAN, and why it is a second plan rather than a setting.
 *
 * A Whop plan carries one billing period, so monthly and yearly are two plans
 * on the same product. Access is checked against PREMIUM_PRODUCT_ID above, so
 * both of them unlock exactly the same thing and nothing in the app has to
 * know which one somebody is on.
 *
 * Same story as the monthly plan above: the old $29.99 id (plan_u7VsoLgZwbeaV)
 * is gone, replaced on Whop's side by this one at $19.99/year — $3.45 x 12 is
 * $41.40, so this is still the better-than-monthly deal the copy claims, just
 * not the same arithmetic as before. ANNUAL_SAVING in site.ts is computed from
 * the two live prices rather than written down, so that claim cannot drift
 * out from under a repricing again.
 *
 * Same seven-day trial as the monthly plan, deliberately: a yearly plan with
 * no trial reads as the riskier of the two, which is backwards when it is the
 * one being recommended. Both plans had lost their trial along with the old
 * ids — restored via the Whop API on the same date, alongside this fix.
 */
export const PREMIUM_ANNUAL_PLAN_ID = 'plan_b0KXA17sOB77r'

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
