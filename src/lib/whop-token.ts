/*
 * whop-token.ts — who is looking at this app from inside a whop.
 *
 * WHY THE COOKIE IS NOT ENOUGH IN HERE. Everywhere else on this site the
 * visitor is identified by the `wa` cookie that lib/session.ts writes after
 * OAuth. An experience view is a different situation: the app is in an iframe
 * on whop.com, so this origin's cookies are third-party cookies, and browsers
 * increasingly refuse to send them. A member who really does own Premium would
 * be told they do not — which is the worst failure this app has, because it
 * looks exactly like being cheated.
 *
 * So Whop hands identity over another way: a short-lived JWT in the
 * `x-whop-user-token` header, injected by its proxy on every same-origin
 * request to an app running in the iframe.
 *
 * THE HEADER IS NOT EVIDENCE ON ITS OWN. This origin is reachable directly —
 * anyone can curl it and set any header they like — so a token that is merely
 * present proves nothing. It is only worth something once the signature is
 * checked against Whop's published keys, which is what this file does. Trusting
 * the header unverified would be a hole big enough to hand out Premium through.
 *
 * The SDK does not ship a verifier (the docs say so, and @whop/sdk has no such
 * export), so this is written against the JWKS directly. Whop signs with ES256
 * on P-256, which crypto.subtle verifies natively — no library needed.
 */

const JWKS_URL = 'https://api.whop.com/.well-known/jwks.json'

/*
 * Keys are cached for an hour, and a cache miss on an unknown `kid` refetches
 * once. That combination is what makes a key rotation a non-event: a token
 * signed with a key published after this isolate started still verifies,
 * because not recognising the kid is itself the signal to go and look again.
 */
const KEY_TTL_MS = 60 * 60 * 1000
let keyCache: { at: number; keys: Map<string, CryptoKey> } | null = null

type Jwk = { kty: string; crv: string; kid: string; alg: string; x: string; y: string }

async function loadKeys(force = false): Promise<Map<string, CryptoKey>> {
  if (!force && keyCache && Date.now() - keyCache.at < KEY_TTL_MS) return keyCache.keys

  const response = await fetch(JWKS_URL, { headers: { Accept: 'application/json' } })
  if (!response.ok) throw new Error(`jwks ${response.status}`)
  const { keys } = (await response.json()) as { keys: Jwk[] }

  const imported = new Map<string, CryptoKey>()
  for (const jwk of keys) {
    if (jwk.kty !== 'EC' || jwk.crv !== 'P-256') continue
    const key = await crypto.subtle.importKey(
      'jwk',
      { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y, ext: true },
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['verify'],
    )
    imported.set(jwk.kid, key)
  }
  keyCache = { at: Date.now(), keys: imported }
  return imported
}

// Returns an ArrayBuffer rather than a Uint8Array: crypto.subtle wants a
// buffer whose backing store is definitely not shared, and a plain typed array
// only promises ArrayBufferLike.
function b64url(part: string): ArrayBuffer {
  const padded = part.replace(/-/g, '+').replace(/_/g, '/')
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4))
  const buffer = new ArrayBuffer(binary.length)
  const out = new Uint8Array(buffer)
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i)
  return buffer
}

function decodeJson(part: string): Record<string, unknown> | null {
  try {
    return JSON.parse(new TextDecoder().decode(new Uint8Array(b64url(part)))) as Record<
      string,
      unknown
    >
  } catch {
    return null
  }
}

/**
 * The Whop user id the token vouches for, or null.
 *
 * Null for every reason: no header, a malformed token, an unknown key, a bad
 * signature, an expired one. The caller cannot tell those apart on purpose —
 * the only useful question here is whether this is a member Whop vouches for.
 */
export async function whopUserId(request: Request): Promise<string | null> {
  const token = request.headers.get('x-whop-user-token')
  if (!token) return null

  const parts = token.split('.')
  if (parts.length !== 3) return null
  const [rawHeader, rawPayload, rawSignature] = parts

  const header = decodeJson(rawHeader)
  // Pinned to ES256. Accepting whatever the token names is how `alg: none`
  // and algorithm-confusion attacks get in — the algorithm is ours to decide,
  // not the token's.
  if (!header || header.alg !== 'ES256' || typeof header.kid !== 'string') return null

  try {
    let keys = await loadKeys()
    let key = keys.get(header.kid)
    if (!key) {
      keys = await loadKeys(true)
      key = keys.get(header.kid)
    }
    if (!key) return null

    const encoded = new TextEncoder().encode(`${rawHeader}.${rawPayload}`)
    const signed = new ArrayBuffer(encoded.length)
    new Uint8Array(signed).set(encoded)
    const ok = await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      key,
      b64url(rawSignature),
      signed,
    )
    if (!ok) return null

    const payload = decodeJson(rawPayload)
    if (!payload) return null

    // Expiry is checked here rather than trusted to be short: "short-lived" is
    // a property of how Whop issues them, not a guarantee about one that has
    // been sitting in somebody's copy buffer.
    const now = Math.floor(Date.now() / 1000)
    if (typeof payload.exp === 'number' && payload.exp < now) return null
    if (typeof payload.nbf === 'number' && payload.nbf > now + 60) return null

    const sub = payload.sub
    return typeof sub === 'string' && sub ? sub : null
  } catch (err) {
    // A JWKS that cannot be fetched is an outage, not a forgery. Either way the
    // answer is the same — nobody is identified — but it is worth telling apart
    // in the logs, because one of them is ours to fix.
    console.error('whop-token: could not verify', err)
    return null
  }
}
