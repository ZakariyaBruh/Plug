/*
 * Exercises the ledger against a real SQLite database.  bun run scripts/credits-test.mjs
 *
 * The rules worth testing here are the ones that only show up under conditions
 * that are awkward to reach by hand: a postback delivered twice, two requests
 * spending the last point at the same moment, a clawback landing after the
 * points are gone. All three are normal in production.
 */
import { unlinkSync, readFileSync, existsSync } from 'node:fs'
import { createClient } from '@libsql/client'
import { credit, reverse, charge, getAccount, pointsFor, useClient, FREE_PER_DAY, COST } from '../src/lib/credits.ts'

const FILE = '/tmp/credits-test.db'
for (const f of [FILE, `${FILE}-wal`, `${FILE}-shm`]) if (existsSync(f)) unlinkSync(f)

const client = createClient({ url: `file:${FILE}` })
const schema = readFileSync(new URL('./credits-schema.sql', import.meta.url), 'utf8')
// Same reason as scripts/credits-migrate.mjs: comments out first, then split.
for (const stmt of schema.replace(/--[^\n]*/g, '').split(';').map((s) => s.trim()).filter(Boolean)) {
  await client.execute(stmt)
}
useClient(client)

let pass = 0
let fail = 0
function check(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  if (ok) pass += 1
  else fail += 1
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `\n        got  ${JSON.stringify(got)}\n        want ${JSON.stringify(want)}`}`)
}

const U = 'user_test'

// --- the 30% split -------------------------------------------------------
check('pointsFor($1.00) = 30', pointsFor(1.0), 30)
check('pointsFor($0.50) = 15', pointsFor(0.5), 15)
check('pointsFor($3.00) = 90', pointsFor(3.0), 90)
check('pointsFor(0) = 0', pointsFor(0), 0)
check('pointsFor(negative) = 0', pointsFor(-5), 0)

// --- a survey completion -------------------------------------------------
const first = await credit({
  userId: U, points: pointsFor(1.0), reason: 'survey_complete',
  provider: 'cpx', providerTxnId: 'txn_1', netRevenueUsd: 1.0,
})
check('first postback credits', first, { credited: true, duplicate: false })
check('balance after earning 30', (await getAccount(U)).balance, 30)

// --- the same postback again, which WILL happen --------------------------
const replay = await credit({
  userId: U, points: pointsFor(1.0), reason: 'survey_complete',
  provider: 'cpx', providerTxnId: 'txn_1', netRevenueUsd: 1.0,
})
check('replayed postback is a duplicate', replay, { credited: false, duplicate: true })
check('balance unchanged after replay', (await getAccount(U)).balance, 30)

// --- the free allowance, then points -------------------------------------
const free = FREE_PER_DAY.chat
for (let i = 0; i < free; i += 1) {
  const r = await charge(U, 'chat')
  if (r.how !== 'free') { console.log(`FAIL  message ${i + 1} should be free, was ${r.how}`); fail += 1 }
}
pass += 1
console.log(`PASS  first ${free} chat messages come out of the free allowance`)
check('allowance did not touch the balance', (await getAccount(U)).balance, 30)

const paid = await charge(U, 'chat')
check('message past the allowance pays a point', { how: paid.how, balance: paid.balance }, { how: 'credits', balance: 29 })

// --- news has its own allowance ------------------------------------------
const newsFirst = await charge(U, 'news')
check('news allowance is separate from chat', newsFirst.how, 'free')

// --- spending down to nothing --------------------------------------------
const acct = await getAccount(U)
for (let i = 0; i < acct.balance; i += 1) await charge(U, 'chat')
check('balance spent to zero', (await getAccount(U)).balance, 0)

const broke = await charge(U, 'chat')
check('refused when there is nothing left', { ok: broke.ok, how: broke.how }, { ok: false, how: 'insufficient' })
check('a refused charge takes nothing', (await getAccount(U)).balance, 0)

// --- the clawback --------------------------------------------------------
const rev = await reverse({ userId: U, points: 30, provider: 'cpx', providerTxnId: 'txn_1' })
check('reversal applies', rev, { reversed: true, duplicate: false })
check('balance goes negative rather than clamping', (await getAccount(U)).balance, -30)

const revAgain = await reverse({ userId: U, points: 30, provider: 'cpx', providerTxnId: 'txn_1' })
check('replayed reversal is a duplicate', revAgain, { reversed: false, duplicate: true })
check('balance unchanged after replayed reversal', (await getAccount(U)).balance, -30)

const whileInDebt = await charge(U, 'chat')
check('cannot spend while in debt', whileInDebt.ok, false)

// --- a reversal must not collide with the completion it undoes -----------
const ledger = await client.execute({
  sql: 'SELECT COUNT(*) AS n FROM credit_ledger WHERE user_id = ? AND provider_txn_id IS NOT NULL',
  args: [U],
})
check('completion and its reversal are two rows', Number(ledger.rows[0].n), 2)

// --- two requests racing for the last spend ------------------------------
/*
 * The case this is really about: somebody double-taps, and both requests read
 * a balance that can only cover one of them. If the check and the deduction
 * were separate steps, both would see enough and both would go through.
 *
 * premium_action has no free allowance, so both go straight at the balance.
 */
const R = 'user_race'
await credit({ userId: R, points: COST.premium_action, reason: 'manual', provider: 'cpx', providerTxnId: 'race_1' })
const both = await Promise.all([charge(R, 'premium_action'), charge(R, 'premium_action')])
check('exactly one of two racing spends succeeds', both.filter((r) => r.ok).length, 1)
check('the loser took nothing', (await getAccount(R)).balance, 0)

// --- and the same race on the free allowance -----------------------------
const A = 'user_allowance'
const burst = await Promise.all(
  Array.from({ length: FREE_PER_DAY.chat + 3 }, () => charge(A, 'chat')),
)
check('the free allowance is not overspent by a burst', burst.filter((r) => r.how === 'free').length, FREE_PER_DAY.chat)
check('the rest of the burst is refused, not given away', burst.filter((r) => !r.ok).length, 3)

// --- no database configured must not break the feature -------------------
useClient(null)
const unmetered = await charge('user_nodb', 'chat')
check('unconfigured ledger leaves features working', { ok: unmetered.ok, how: unmetered.how }, { ok: true, how: 'unmetered' })

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
