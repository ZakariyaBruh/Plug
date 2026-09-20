/*
 * THE PROFILE, KEPT SOMEWHERE BOTH YOUR PHONES CAN REACH.
 *
 * What the game knows about you — what you have eaten, what you saved, what
 * you rated, and above all what you do not eat — has always lived in one
 * browser. That is fine until you pick up a different device, at which point
 * the app has never met you and the dietary rules you set once are simply
 * gone. For a halal or coeliac profile that is not an inconvenience, it is the
 * whole product failing quietly.
 *
 * WHERE IT IS KEPT. There is no database here (see ACCOUNT_PRODUCT_ID), so the
 * store is a Whop membership's metadata: 50 keys, 500 characters each. A
 * heavily-used profile is about 9KB of JSON, which gzips and base64s to about
 * 3KB — seven slots. Writing a constant twenty-four of them, blanking the ones
 * not in use, means the shape on the server never depends on what was there
 * before, so a smaller profile can never leave a tail of a larger one behind
 * to be reassembled into nonsense.
 *
 * WHO CAN READ IT. Only the signed-in owner, resolved from a cookie or Whop's
 * signed header, exactly as everything else here resolves identity. The
 * profile is keyed by membership, the membership is looked up by user id, and
 * nothing takes a user id from a request body.
 *
 * WHAT IT IS NOT. Not a backup and not an archive: it is the same profile,
 * somewhere both devices can see. Newest write wins, which is a rule people
 * understand, and the app says so where it offers it.
 */

import { ACCOUNT_PLAN_ID, ACCOUNT_PRODUCT_ID } from '#/lib/products'

/** Constant number of slots written every time. See the note above. */
const SLOTS = 24
const SLOT_MAX = 500

/** Holds ~12KB of base64, which is four times the worst profile measured. */
export const PROFILE_MAX = SLOTS * SLOT_MAX

const COUNT_KEY = 'pn'
const AT_KEY = 'pat'

type Membership = { id: string; status: string; metadata?: Record<string, unknown> | null }

/** Billing states in which an account exists at all. A free plan has no others. */
const LIVE = ['active', 'trialing', 'completed', 'past_due', 'canceling']

async function api(path: string, init?: RequestInit) {
  const key = process.env.WHOP_API_KEY
  if (!key) throw new Error('profile: no WHOP_API_KEY')
  const response = await fetch(
    `${process.env.WHOP_API_ORIGIN ?? 'https://api.whop.com'}/api/v1${path}`,
    {
      ...init,
      headers: {
        Authorization: `Bearer ${key}`,
        Accept: 'application/json',
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...(init?.headers ?? {}),
      },
    },
  )
  if (!response.ok) throw new Error(`profile: ${init?.method ?? 'GET'} ${path} → ${response.status}`)
  return (await response.json()) as unknown
}

/** The caller's account membership, if they have made one. */
export async function accountOf(userId: string): Promise<Membership | null> {
  const query = new URLSearchParams({
    user_id: userId,
    product_id: ACCOUNT_PRODUCT_ID,
    plan_id: ACCOUNT_PLAN_ID,
  })
  const payload = (await api(`/memberships?${query}`)) as { data?: Membership[] }
  const rows = Array.isArray(payload.data) ? payload.data : []
  return rows.find((m) => LIVE.includes(m.status)) ?? null
}

/*
 * gzip, then base64, using the platform's own streams so this runs unchanged
 * in a worker and in a test. The profile is mostly repeated dish names and
 * JSON punctuation, which is why it compresses by two thirds.
 */
async function squeeze(text: string): Promise<string> {
  const stream = new Blob([text]).stream().pipeThrough(new CompressionStream('gzip'))
  const bytes = new Uint8Array(await new Response(stream).arrayBuffer())
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

async function unsqueeze(packed: string): Promise<string> {
  const binary = atob(packed)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))
  return await new Response(stream).text()
}

export type StoredProfile = { at: number; json: string }

/**
 * Read the stored profile back, or null when there is none. A profile that
 * cannot be reassembled — a half-written one, a corrupted chunk — reads as
 * null rather than throwing: the caller's own copy is then left alone, which
 * is the safe direction when the alternative is replacing it with rubbish.
 */
export async function readProfile(userId: string): Promise<StoredProfile | null> {
  const account = await accountOf(userId)
  if (!account) return null

  const meta = account.metadata ?? {}
  const count = Number(meta[COUNT_KEY] ?? 0)
  const at = Number(meta[AT_KEY] ?? 0)
  if (!count || !at) return null

  let packed = ''
  for (let i = 0; i < count; i += 1) {
    const slot = meta[`p${i}`]
    if (typeof slot !== 'string' || !slot) return null
    packed += slot
  }

  try {
    const json = await unsqueeze(packed)
    // Proves it is a whole document rather than a prefix that happened to
    // inflate. A half profile is worse than none: it would overwrite a good
    // local one with a truncated copy of itself.
    JSON.parse(json)
    return { at, json }
  } catch {
    return null
  }
}

/** Write the profile. `at` is the client's own timestamp; newest wins. */
export async function writeProfile(
  userId: string,
  at: number,
  json: string,
): Promise<{ ok: true } | { ok: false; why: string }> {
  const account = await accountOf(userId)
  if (!account) return { ok: false, why: 'No account to keep it in.' }

  const packed = await squeeze(json)
  if (packed.length > PROFILE_MAX) {
    return { ok: false, why: 'That profile is too big to keep. Nothing was changed.' }
  }

  const metadata: Record<string, string | number> = { [COUNT_KEY]: 0, [AT_KEY]: at }
  let used = 0
  for (let i = 0; i < SLOTS; i += 1) {
    const chunk = packed.slice(i * SLOT_MAX, (i + 1) * SLOT_MAX)
    metadata[`p${i}`] = chunk
    if (chunk) used = i + 1
  }
  metadata[COUNT_KEY] = used

  await api(`/memberships/${account.id}`, { method: 'POST', body: JSON.stringify({ metadata }) })
  return { ok: true }
}

/*
 * Make an account.
 *
 * Whop will not let this business grant a membership directly — POST
 * /memberships/invite answers 403, "not available for your account", and it is
 * an account-level gate rather than a missing permission. A checkout
 * configuration on a plan that costs nothing is the way through: it is one tap
 * and no card, and it produces a real membership we can then write to.
 */
export async function startAccount(
  userId: string,
): Promise<{ ok: true; url: string; already: boolean } | { ok: false; why: string }> {
  const existing = await accountOf(userId)
  if (existing) return { ok: true, url: '', already: true }

  const made = (await api('/checkout_configurations', {
    method: 'POST',
    body: JSON.stringify({ plan_id: ACCOUNT_PLAN_ID, metadata: { for: userId } }),
  })) as { purchase_url?: string; data?: { purchase_url?: string } }

  const url = made.purchase_url ?? made.data?.purchase_url
  if (!url) return { ok: false, why: 'Whop did not hand back a link. No account was made.' }
  return { ok: true, url, already: false }
}
