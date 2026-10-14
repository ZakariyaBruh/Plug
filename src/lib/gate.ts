import { PREMIUM_PRODUCT_ID } from '#/lib/products'
import { checkProductAccessFor, identifyVisitor } from '#/lib/session'

/*
 * WHO MAY USE A HUB FEATURE, asked the same way by every route.
 *
 * Two tiers above anonymous: an account (free — "is this a real Whop
 * account", see identifyVisitor) and Premium (that account owns the
 * product, asked of Whop live, never read from anything the browser sent).
 * The answer is never cached in the browser; it is cached here for a minute
 * per account, because the planner autosaves and one Whop call per keystroke
 * would be absurd, and a minute is the longest a lapsed subscription could
 * keep a Premium feature working.
 */
export type Tier = 'account' | 'premium'

const PREMIUM_TTL_MS = 60 * 1000
const premiumMemo = new Map<string, { at: number; ok: boolean }>()

export async function hasPremium(userId: string): Promise<boolean> {
  const hit = premiumMemo.get(userId)
  if (hit && Date.now() - hit.at < PREMIUM_TTL_MS) return hit.ok
  let ok = false
  try {
    ok = (await checkProductAccessFor(userId, PREMIUM_PRODUCT_ID)).hasAccess
  } catch (err) {
    console.error('gate: premium check failed', err)
    return false
  }
  premiumMemo.set(userId, { at: Date.now(), ok })
  return ok
}

export function json(body: unknown, status = 200, cache = 'no-store') {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': cache },
  })
}

/** The account id, or the response that refuses the request. */
export async function gate(request: Request, need: Tier): Promise<{ userId: string } | { refuse: Response }> {
  const userId = await identifyVisitor(request)
  if (!userId) return { refuse: json({ error: 'not_signed_in' }, 401) }
  if (need === 'premium' && !(await hasPremium(userId))) {
    return { refuse: json({ error: 'premium_required' }, 402) }
  }
  return { userId }
}

export async function readJson<T>(request: Request, maxBytes = 64 * 1024): Promise<T | null> {
  try {
    const text = await request.text()
    if (text.length > maxBytes) return null
    return JSON.parse(text) as T
  } catch {
    return null
  }
}

export function str(value: unknown, max: number): string {
  return typeof value === 'string' ? value.trim().slice(0, max) : ''
}
