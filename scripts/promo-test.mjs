/*
 * The promo roster, and the one property that makes it safe to add to.
 *
 * WHAT CAN GO WRONG HERE IS NOT A CRASH. A promo is a public claim about
 * money — "30% off, twenty places, seven gone" — and every way it fails is a
 * way it says something untrue to a stranger. So these are the checks that a
 * new entry cannot pass by accident:
 *
 *  - It names a real Whop promo code id. The count comes from that record and
 *    nowhere else, so an entry without one would be a banner with an
 *    uncountable claim on it.
 *  - It points at a plan this app actually sells.
 *  - Its code survives a round trip through a URL. `foodie_30%` ends in a
 *    percent sign, which is the escape character in a URL: unencoded it eats
 *    the next two characters and arrives as something else. That is not
 *    hypothetical, it is the code currently running.
 *  - Nothing in the roster writes a count, a total or a "left" anywhere. The
 *    moment a number about stock is hard-coded on this side, it is a number
 *    that keeps being true after the offer is over.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')
const src = readFileSync(join(root, 'src/lib/promos.ts'), 'utf8')
const api = readFileSync(join(root, 'src/routes/api/promo.ts'), 'utf8')
const products = readFileSync(join(root, 'src/lib/products.ts'), 'utf8')

let pass = 0
let fail = 0
function check(name, ok, detail) {
  ok ? (pass += 1) : (fail += 1)
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok || !detail ? '' : `\n        ${detail}`}`)
}

// Pulled out of the source rather than imported: this file is TypeScript with
// a path alias, and the roster is plain data.
const entries = [...src.matchAll(/\{\s*id:\s*'([^']+)',\s*promoId:\s*'([^']+)',\s*code:\s*'([^']+)'/g)].map(
  (m) => ({ id: m[1], promoId: m[2], code: m[3] }),
)
check('the roster parses', entries.length > 0, `${entries.length} entries`)

for (const entry of entries) {
  check(`"${entry.id}" names a Whop promo code`, /^promo_[A-Za-z0-9]+$/.test(entry.promoId), entry.promoId)
  check(
    `"${entry.id}" has a code that survives a URL`,
    decodeURIComponent(encodeURIComponent(entry.code)) === entry.code,
    entry.code,
  )
  check(`"${entry.id}" has no spaces in its code`, !/\s/.test(entry.code), entry.code)
}

const planIds = [...src.matchAll(/planId:\s*([A-Z_]+)/g)].map((m) => m[1])
for (const name of new Set(planIds)) {
  check(`the plan constant ${name} exists`, new RegExp(`export const ${name}\\b`).test(products))
}

/*
 * The count must not be writable from this side. If any of these appear in
 * the roster, somebody has started keeping a second copy of a number that
 * only Whop is allowed to own.
 */
const roster = src.slice(src.indexOf('export const PROMOS'), src.indexOf('export function scheduled'))
const forbidden = ['taken:', 'total:', 'left:', 'uses:', 'stock:', 'slots:']
const found = forbidden.filter((word) => roster.includes(word))
// Scanned over the PROMOS array only — PromoState below it is the shape of
// the endpoint's answer, and naming the fields there is the point of it.
check(
  'the roster keeps no count of its own',
  found.length === 0,
  found.length ? `found ${found.join(', ')} in lib/promos.ts — the count belongs to Whop` : '',
)

// And the endpoint must read it, refuse without a key, and go quiet when spent.
check('the endpoint reads the live record', /promo_codes\/\$\{promo\.promoId\}/.test(api))
check('no key means no claim', /if \(!key\) return json\(DEAD/.test(api))
check('out of stock means gone', /taken >= total\) return json\(DEAD/.test(api))
check('an inactive code means gone', /status !== 'active'\) return json\(DEAD/.test(api))
check('the code is encoded into the checkout link', /encodeURIComponent\(promo\.code\)/.test(api))

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
