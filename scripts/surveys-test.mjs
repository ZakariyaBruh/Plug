/*
 * The postback verifier.  bun run scripts/surveys-test.mjs
 *
 * This is the only door points can come through, so the interesting tests are
 * the ones that try to walk through it without a key.
 */
import { md5 } from '../src/lib/md5.ts'
import { provider, fromProvider } from '../src/lib/surveys.ts'

process.env.CPX_APP_ID = 'app_test'
process.env.CPX_SECURE_HASH = 's3cret'
process.env.SURVEY_POSTBACK_IPS = '1.2.3.4, 5.6.7.8'

const cpx = provider('cpx')
let pass = 0
let fail = 0
function check(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  ok ? (pass += 1) : (fail += 1)
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `\n        got  ${JSON.stringify(got)}\n        want ${JSON.stringify(want)}`}`)
}

function postback(params) {
  return new URL('https://example.com/api/surveys/postback?' + new URLSearchParams(params))
}
const sign = (txn) => md5(`${txn}-s3cret`)

// --- a genuine completion ------------------------------------------------
const good = cpx.parsePostback(postback({
  status: '1', trans_id: 'txn_9', user_id: 'user_42', amount_usd: '1.50', hash: sign('txn_9'),
}))
check('valid completion parses', { kind: good?.kind, userId: good?.userId, usd: good?.netRevenueUsd }, { kind: 'complete', userId: 'user_42', usd: 1.5 })

// --- forgery attempts ----------------------------------------------------
check('wrong hash is rejected', cpx.parsePostback(postback({
  status: '1', trans_id: 'txn_9', user_id: 'user_42', amount_usd: '1.50', hash: 'deadbeef',
})), null)

check('no hash at all is rejected', cpx.parsePostback(postback({
  status: '1', trans_id: 'txn_9', user_id: 'user_42', amount_usd: '1.50',
})), null)

// A hash lifted from one transaction cannot be reused on another.
check("another transaction's hash is rejected", cpx.parsePostback(postback({
  status: '1', trans_id: 'txn_OTHER', user_id: 'user_42', amount_usd: '99.00', hash: sign('txn_9'),
})), null)

// The amount is signed only through trans_id, so this is the case the IP
// allowlist has to catch rather than the signature — but the signature still
// pins the amount to the transaction it was issued for.
const inflated = cpx.parsePostback(postback({
  status: '1', trans_id: 'txn_9', user_id: 'user_42', amount_usd: '9999', hash: sign('txn_9'),
}))
check('a replayed transaction id keeps its own id (the ledger dedupes it)', inflated?.txnId, 'txn_9')

// --- reversals and screenouts -------------------------------------------
const rev = cpx.parsePostback(postback({
  status: '2', trans_id: 'txn_9', user_id: 'user_42', amount_local: '30', hash: sign('txn_9'),
}))
check('status 2 is a reversal', { kind: rev?.kind, points: rev?.points }, { kind: 'reversal', points: 30 })

const zero = cpx.parsePostback(postback({
  status: '1', trans_id: 'txn_s', user_id: 'user_42', amount_usd: '0', hash: sign('txn_s'),
}))
check('a completion worth nothing is a screenout', zero?.kind, 'screenout')

check('an unknown status is ignored, not credited', cpx.parsePostback(postback({
  status: '7', trans_id: 'txn_x', user_id: 'user_42', hash: sign('txn_x'),
}))?.kind, 'ignored')

// --- the wall ------------------------------------------------------------
const wall = cpx.wallUrl('user_42')
check('wall url is signed for the user', wall.includes('secure_hash=' + md5('user_42-s3cret')), true)
check('wall url carries the user id', wall.includes('ext_user_id=user_42'), true)

// --- the IP allowlist ----------------------------------------------------
const req = (ip) => new Request('https://example.com/', { headers: ip ? { 'cf-connecting-ip': ip } : {} })
check('an allowlisted address passes', fromProvider(req('1.2.3.4')), true)
check('a whitespace-padded entry still matches', fromProvider(req('5.6.7.8')), true)
check('any other address is refused', fromProvider(req('9.9.9.9')), false)
check('no address at all is refused', fromProvider(req(null)), false)

process.env.SURVEY_POSTBACK_IPS = ''
check('an unset allowlist refuses everything rather than allowing it', fromProvider(req('1.2.3.4')), false)

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
