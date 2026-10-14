// This business's one real Whop product. No license keys anywhere in this
// flow — access is granted straight to the buyer's Whop account.
export const PREMIUM_PRODUCT_ID = 'prod_cq5YnoQQr6BGa'

/*
 * THE PLAN PEOPLE BUY.
 *
 * Premium is $3.45 a month with a seven-day trial. This used to point at a
 * $4.99 plan (plan_Ejw0IKpnJoeF1) created when the price went up; Whop now
 * answers 404 for it, and the $3.45 plan that was once hidden is visible and
 * is the live one. Whop will not reprice a plan that has sold memberships, so
 * a price change means a new plan and a new id here.
 *
 * Access is checked against PREMIUM_PRODUCT_ID above, not against a plan, so
 * everybody on any plan of the product gets Premium.
 */
export const PREMIUM_PLAN_ID = 'plan_0vp7Ai1r4WDWx'
