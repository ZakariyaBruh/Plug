/*
 * The sponsor-page bonus, as far as a server can prove it: a signed start, a
 * minimum wait, a maximum age, a token that belongs to one visitor and one day,
 * and a cap. What it cannot prove is that the page was opened (see the note over
 * BONUS_PER_CLAIM in lib/allowance.ts), so that is not asserted here.
 */
import {
  BONUS_CLAIMS_PER_DAY,
  BONUS_MAX_SECONDS,
  BONUS_MIN_SECONDS,
  BONUS_PER_CLAIM,
  CHAT_PER_DAY,
  bonusToken,
  bonusTokenOk,
} from '../src/lib/allowance.ts'

process.env.WHOP_WEBHOOK_SECRET = 'test-secret-not-a-real-one'

let pass = 0
let fail = 0
function check(name, ok, detail) {
  ok ? (pass += 1) : (fail += 1)
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok || !detail ? '' : `\n        ${detail}`}`)
}

const me = { who: 'visitor', userId: null, key: 'ip:aaaa', day: '2026-10-22', used: 3, limit: 3, claims: 0, left: 0 }
const you = { ...me, key: 'ip:bbbb' }
const tomorrow = { ...me, day: '2026-10-23' }
const t0 = 1_800_000_000_000
const ago = (s) => t0 - s * 1000

const token = await bonusToken(me, ago(30))
check('a visitor with a ledger gets a token', typeof token === 'string' && /^\d+\.[0-9a-f]{32}$/.test(token))
check('30 seconds on, it is good', await bonusTokenOk(me, token, t0))

const fresh = await bonusToken(me, ago(2))
check('two seconds on is too soon: the wait is the point', !(await bonusTokenOk(me, fresh, t0)))
check(`exactly ${BONUS_MIN_SECONDS}s is enough`, await bonusTokenOk(me, await bonusToken(me, ago(BONUS_MIN_SECONDS)), t0))
const stale = await bonusToken(me, ago(BONUS_MAX_SECONDS + 5))
check('and a token cannot be kept for later', !(await bonusTokenOk(me, stale, t0)))

check('it cannot be handed to somebody else', !(await bonusTokenOk(you, token, t0)))
check('or carried into another day', !(await bonusTokenOk(tomorrow, token, t0)))
check('an altered timestamp is refused', !(await bonusTokenOk(me, token.replace(/^\d+/, String(ago(500))), t0)))
check('an altered signature is refused', !(await bonusTokenOk(me, token.slice(0, -1) + (token.endsWith('0') ? '1' : '0'), t0)))
for (const bad of [undefined, null, '', 'x', 12345, {}, '1800000000000.zz']) {
  check(`rubbish (${JSON.stringify(bad)}) is refused`, !(await bonusTokenOk(me, bad, t0)))
}

// The server's secret is the whole point: with none, there is nothing to sign with.
const secret = process.env.WHOP_WEBHOOK_SECRET
delete process.env.WHOP_WEBHOOK_SECRET
delete process.env.TURSO_AUTH_TOKEN
check('with no secret it issues nothing rather than something forgeable', (await bonusToken(me, ago(30))) === null)
process.env.WHOP_WEBHOOK_SECRET = secret

// What the numbers add up to.
check('the most a day can reach is nine, all of them free-model answers', CHAT_PER_DAY + BONUS_CLAIMS_PER_DAY * BONUS_PER_CLAIM === 9)

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
