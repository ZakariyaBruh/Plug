/*
 * The x-whop-user-token verifier.  bun run scripts/whop-token-test.mjs
 *
 * This header decides who Whop says you are, and this origin is reachable
 * directly — so the tests that matter are the ones that try to walk in with a
 * token nobody trustworthy signed. The happy path is tested by standing up a
 * JWKS of our own and checking a genuinely signed token is let through; every
 * other case checks something is turned away.
 */
import { whopUserId } from '../src/lib/whop-token.ts'

let pass = 0
let fail = 0
function check(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  ok ? (pass += 1) : (fail += 1)
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `\n        got ${JSON.stringify(got)} want ${JSON.stringify(want)}`}`)
}

const b64 = (bytes) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
const b64json = (obj) => b64(new TextEncoder().encode(JSON.stringify(obj)))

async function makeKey() {
  return crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'])
}

async function jwks(pair, kid) {
  const jwk = await crypto.subtle.exportKey('jwk', pair.publicKey)
  return { keys: [{ kty: 'EC', use: 'sig', crv: 'P-256', kid, alg: 'ES256', x: jwk.x, y: jwk.y }] }
}

async function sign(pair, kid, payload) {
  const head = b64json({ alg: 'ES256', typ: 'JWT', kid })
  const body = b64json(payload)
  const sig = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    pair.privateKey,
    new TextEncoder().encode(`${head}.${body}`),
  )
  return `${head}.${body}.${b64(sig)}`
}

// Whop's real JWKS is swapped for one we hold the private key to, so the happy
// path exercises the actual signature check rather than a stub of it.
function serveJwks(doc) {
  globalThis.fetch = async () => new Response(JSON.stringify(doc), { headers: { 'Content-Type': 'application/json' } })
}

const req = (token) => new Request('https://example.com/experiences/exp_1', { headers: token ? { 'x-whop-user-token': token } : {} })

const soon = Math.floor(Date.now() / 1000) + 300
const past = Math.floor(Date.now() / 1000) - 300

// --- the happy path ------------------------------------------------------
const good = await makeKey()
serveJwks(await jwks(good, 'kid-good'))
check('a properly signed token yields its user id', await whopUserId(req(await sign(good, 'kid-good', { sub: 'user_42', exp: soon }))), 'user_42')

// --- nothing to verify ---------------------------------------------------
check('no header at all', await whopUserId(req(null)), null)
check('not a JWT', await whopUserId(req('nonsense')), null)
check('two segments instead of three', await whopUserId(req('a.b')), null)

// --- forgery -------------------------------------------------------------
/*
 * The one that matters: a perfectly formed token, correctly signed, by
 * somebody who is not Whop. This is what an attacker can actually produce.
 */
const attacker = await makeKey()
const forged = await sign(attacker, 'kid-good', { sub: 'user_victim', exp: soon })
check('a token signed with the wrong key is refused', await whopUserId(req(forged)), null)

// A real token with the payload swapped — signature no longer covers it.
const real = await sign(good, 'kid-good', { sub: 'user_42', exp: soon })
const [h, , s] = real.split('.')
const tampered = `${h}.${b64json({ sub: 'user_somebody_else', exp: soon })}.${s}`
check('a tampered payload is refused', await whopUserId(req(tampered)), null)

// alg:none — the classic. The algorithm is ours to pin, never the token's.
const algNone = `${b64json({ alg: 'none', typ: 'JWT', kid: 'kid-good' })}.${b64json({ sub: 'user_42', exp: soon })}.`
check('alg:none is refused', await whopUserId(req(algNone)), null)
check('an unexpected algorithm is refused', await whopUserId(req(`${b64json({ alg: 'HS256', kid: 'kid-good' })}.${b64json({ sub: 'user_42' })}.AAAA`)), null)

// --- expiry and claims ---------------------------------------------------
check('an expired token is refused', await whopUserId(req(await sign(good, 'kid-good', { sub: 'user_42', exp: past }))), null)
check('a token with no subject is refused', await whopUserId(req(await sign(good, 'kid-good', { exp: soon }))), null)

// --- key rotation --------------------------------------------------------
/*
 * A key published after this isolate warmed its cache must still work: not
 * recognising a kid is the signal to refetch, not to reject.
 */
const rotated = await makeKey()
serveJwks(await jwks(rotated, 'kid-rotated'))
check('a token from a newly rotated key still verifies', await whopUserId(req(await sign(rotated, 'kid-rotated', { sub: 'user_99', exp: soon }))), 'user_99')

// --- the JWKS being unreachable is an outage, not an admission -----------
globalThis.fetch = async () => new Response('nope', { status: 500 })
check('an unreachable JWKS identifies nobody', await whopUserId(req(await sign(good, 'kid-unknown-2', { sub: 'user_42', exp: soon }))), null)

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
