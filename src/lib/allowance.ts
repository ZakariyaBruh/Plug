import { db } from '#/lib/db'
import { checkProductAccess, checkProductAccessFor } from '#/lib/session'
import { whopUserId } from '#/lib/whop-token'
import { PREMIUM_PRODUCT_ID } from '#/lib/products'

/*
 * THE DAILY ALLOWANCE FOR THE METERED AI FEATURES.
 *
 * Three free questions a day to the assistant, counted on the server. It used
 * to be counted in the browser, which meant clearing site data — or opening a
 * private window — refilled it, and the number on screen was a suggestion.
 *
 * WHO "ONE PERSON" IS. There is no sign-in to count against, so it is the IP
 * address the request came from, and never the address itself: what is
 * stored is an HMAC of it under a key that changes every day. The same
 * address produces a different row tomorrow, so two days' rows cannot be
 * joined up into a history, and a row cannot be turned back into an address
 * without the server's secret. Yesterday's rows are deleted on the next
 * write, so nothing here outlives the day it counts.
 *
 * This is what the privacy page's "Server logs" section describes, and the two
 * change together.
 *
 * SHARED ADDRESSES. A household or an office behind one router shares one
 * allowance. That is the accepted cost of not asking anybody to sign in; the
 * alternative — a browser id — is the thing that could be reset by clearing
 * site data, which is what this is replacing.
 *
 * NO DATABASE, NO LIMIT. If Turso is unreachable or unconfigured the answer is
 * "unknown" and the question goes through — the per-minute burst limit in the
 * chat route still applies. Refusing everybody because the ledger is down
 * would punish people for an outage that is ours.
 */

export const CHAT_PER_DAY = 3

/** UTC calendar day, which is when the allowance refills. */
export function today(now = new Date()): string {
  return now.toISOString().slice(0, 10)
}

const enc = new TextEncoder()

async function hmac(key: string, message: string): Promise<string> {
  const k = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', k, enc.encode(message))
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('')
}

/*
 * The day's key is derived from a server secret and the date, and the address
 * is hashed under that. The webhook secret rather than the database token, so
 * that somebody holding only the database credential cannot recompute the
 * hash for a guessed address.
 */
export async function visitorKey(ip: string, day: string): Promise<string | null> {
  const secret = process.env.WHOP_WEBHOOK_SECRET || process.env.TURSO_AUTH_TOKEN
  if (!secret) return null
  const dayKey = await hmac(secret, 'allowance:' + day)
  return 'ip:' + (await hmac(dayKey, ip)).slice(0, 32)
}

/** How many of today's allowance this visitor has spent, or null if unknown. */
export async function usedToday(key: string, feature: string, day: string): Promise<number | null> {
  const client = db()
  if (!client) return null
  try {
    const rs = await client.execute({
      sql: 'select used from feature_usage where user_id = ? and feature = ? and day = ?',
      args: [key, feature, day],
    })
    return rs.rows.length ? Number(rs.rows[0].used) || 0 : 0
  } catch (err) {
    console.error('allowance: read failed', err)
    return null
  }
}

/*
 * Spend one, and sweep anything from an earlier day while the connection is
 * open. Only called after an answer actually came back — a question the model
 * never answered is not one the visitor got.
 */
export async function spend(key: string, feature: string, day: string): Promise<number | null> {
  const client = db()
  if (!client) return null
  try {
    const [rs] = await client.batch(
      [
        {
          sql: `insert into feature_usage (user_id, feature, day, used) values (?, ?, ?, 1)
                on conflict (user_id, feature, day) do update set used = used + 1
                returning used`,
          args: [key, feature, day],
        },
        { sql: "delete from feature_usage where user_id like 'ip:%' and day < ?", args: [day] },
      ],
      'write',
    )
    return rs.rows.length ? Number(rs.rows[0].used) || 0 : null
  } catch (err) {
    console.error('allowance: write failed', err)
    return null
  }
}

/*
 * Premium members are not metered. Same two routes to an answer as
 * /api/premium-status — the `wa` cookie, then Whop's signed iframe token —
 * and only ever asked once somebody has run out, so the ordinary free
 * question costs no call to Whop at all.
 */
export async function isPremium(request: Request): Promise<boolean> {
  try {
    const session = await checkProductAccess(PREMIUM_PRODUCT_ID)
    if (session.signedIn) return session.hasAccess
    const userId = await whopUserId(request)
    if (!userId) return false
    return (await checkProductAccessFor(userId, PREMIUM_PRODUCT_ID)).hasAccess
  } catch (err) {
    console.error('allowance: premium check failed', err)
    return false
  }
}
