/*
 * The daily AI allowance, and the promises the privacy page makes about it.
 *
 * What goes wrong here is quiet: a number on screen that disagrees with the
 * server, a hash that is the same every day (and so a history), a sweep that
 * deletes rows that are not this app's, or a privacy page still promising
 * the address is never written down. Each of those is checked.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => readFileSync(join(root, p), 'utf8')
const lib = read('src/lib/allowance.ts')
const route = read('src/routes/api/chat.ts')
const app = read('public/decide/js/app.js')
const privacy = read('src/routes/privacy.tsx')

let failed = 0
const check = (ok, name) => {
  console.log((ok ? 'PASS ' : 'FAIL ') + name)
  if (!ok) failed++
}

const perDay = Number(/CHAT_PER_DAY = (\d+)/.exec(lib)?.[1])
const client = Number(/var CHAT_FREE = (\d+);/.exec(app)?.[1])
check(perDay === 3, 'the allowance is three a day')
check(client === perDay, 'the game says the same number the server counts')

// The hash, run for real: stable within a day, different across days.
process.env.WHOP_WEBHOOK_SECRET = 'test-secret'
const { visitorKey, today } = await import('../src/lib/allowance.ts')
const a1 = await visitorKey('203.0.113.7', '2026-09-23')
const a2 = await visitorKey('203.0.113.7', '2026-09-23')
const b = await visitorKey('203.0.113.7', '2026-09-24')
const c = await visitorKey('203.0.113.8', '2026-09-23')
check(a1 === a2, 'one address is one row within a day')
check(a1 !== b, 'the same address is a different row the next day')
check(a1 !== c, 'two addresses are two rows')
check(a1.startsWith('ip:') && !a1.includes('203.0.113'), 'the stored key carries no part of the address')
check(/^\d{4}-\d{2}-\d{2}$/.test(today()), 'the day is a plain UTC date')
delete process.env.WHOP_WEBHOOK_SECRET
delete process.env.TURSO_AUTH_TOKEN
check((await visitorKey('203.0.113.7', '2026-09-23')) === null, 'no secret, no key — never an unsalted hash')

check(/like 'ip:%' and day < \?/.test(lib), 'the sweep only ever deletes rows this app wrote')
check(route.indexOf('await spend(') > route.indexOf('if (!reply)'), 'a question is only counted once it was answered')
check(/error: 'limit'/.test(route) && /why === 'limit'/.test(app), 'the refusal the server sends is one the game handles')

check(!/never written to a database/.test(privacy), 'privacy no longer claims nothing is written down')
check(/\['Turso'/.test(privacy), 'Turso is named among the third parties')
check(/keyed hash/.test(privacy) && /changes every day/.test(privacy), 'privacy says what is stored and that it changes daily')

if (failed) {
  console.error(failed + ' failed')
  process.exit(1)
}
