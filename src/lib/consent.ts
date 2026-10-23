/*
 * WHERE ASKING FIRST IS THE LAW, and what is done when it cannot be told.
 *
 * Third-party advertising cookies and analytics need a visitor's opt-in in the
 * EU, the EEA, the UK and Switzerland (ePrivacy and the GDPR, and the UK's PECR).
 * Where that applies and the visitor has not said yes, the ad network is not contacted
 * (it cannot draw an ad without its own cookies) and the box says so. Everywhere else the
 * ads run straight away, whatever is pressed on the banner; "Essential only" there turns
 * analytics off. The country comes from Cloudflare's own header on
 * the request. A visitor whose country cannot be told is treated as being in one
 * of those places: wrongly asking costs a tap, wrongly not asking is the
 * problem.
 *
 * Ads are NOT "essential", and are not listed as such anywhere. Essential means
 * the app could not do what was asked without it (remembering your settings
 * and your progress). An ad network's cookies are not that, and filing them
 * under it to skip the question would be the thing the banner exists to avoid.
 * scripts/shell-test.mjs fails if "essential" and an ad network are ever put
 * together in the banner text.
 */
const ASK_FIRST = new Set([
  // EU
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
  // the rest of the EEA, the UK and Switzerland
  'IS', 'LI', 'NO', 'GB', 'CH',
])

/** True when opt-in is needed before ads or analytics run, or when the country is unknown. */
export function askFirst(country: string | null | undefined): boolean {
  const c = (country ?? '').trim().toUpperCase()
  if (!/^[A-Z]{2}$/.test(c) || c === 'XX' || c === 'T1') return true
  return ASK_FIRST.has(c)
}
