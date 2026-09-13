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
