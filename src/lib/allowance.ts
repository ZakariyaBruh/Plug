import { db, today } from '#/lib/db'
import { checkProductAccess, checkProductAccessFor, identifyVisitor } from '#/lib/session'
import { whopUserId } from '#/lib/whop-token'
import { hasPremium } from '#/lib/gate'
import { spendOne, usageToday } from '#/lib/hub-store'
import { PREMIUM_PRODUCT_ID } from '#/lib/products'

/*
 * THE DAILY ALLOWANCE FOR THE METERED AI FEATURES.
 *
 * Three free questions a day to the assistant, counted on the server. It used
 * to be counted in the browser, which meant clearing site data — or opening a
 * private window — refilled it, and the number on screen was a suggestion.
 *
 * WHO "ONE PERSON" IS. A free Whop account, when the visitor is signed in to
 * one: the three questions belong to the account, are counted in the database
 * against its id, and follow it from phone to laptop — so neither clearing site
 * data nor changing network refills them. (That is the "free account" the
 * allowance is for. Nobody is made to sign in to ask, so a visitor who is not
 * signed in is still counted, below.)
 *
 * WITHOUT AN ACCOUNT there is nothing to count against, so it is the IP
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

/*
 * MORE STANDARD QUESTIONS, FOR OPENING A SPONSOR PAGE.
 *
 * Standard is free and the free allowance is three. Somebody who has used them
 * can open one sponsor page, on purpose, in a new tab, and get two more; three
 * times a day at most, so the most a day can reach is nine. It is offered
 * where they ran out, labelled as what it is, and never to Premium.
 *
 * WHAT THIS CAN AND CANNOT PROVE. Nothing here can tell that the sponsor page
 * was actually opened: there is no postback from the network and a page in
 * another tab cannot be read. What is enforced is what can be: the claim has to
 * follow a start by at least BONUS_MIN_SECONDS (a token signed by the server,
 * so the clock is ours and not the browser's), and the cap is counted in the
 * same ledger as the questions, so clearing site data buys nothing. The worst a
 * determined person gets from forging it is six more free-model answers a day,
 * which cost nothing. That is the honest trade, and it is why the reward is
 * Standard questions and not anything metered.
 */
export const BONUS_PER_CLAIM = 2
export const BONUS_CLAIMS_PER_DAY = 3
export const BONUS_MIN_SECONDS = 8
export const BONUS_MAX_SECONDS = 20 * 60

export { today }

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

/*
 * Where one visitor stands today: who is being counted, and how many of the
 * three they have used. `left` is null when the ledger could not be read, which
 * the page treats as "not counting" and never as zero.
 */
export type Standing = {
  who: 'account' | 'visitor'
  userId: string | null
  key: string | null
  day: string
  used: number | null
  /** Questions available today: the free three plus whatever sponsor pages earned. */
  limit: number
  /** Sponsor pages claimed today. */
  claims: number
  left: number | null
}

export async function standing(request: Request): Promise<Standing> {
  const day = today()
  const userId = await identifyVisitor(request).catch(() => null)
  let who: Standing['who'] = 'visitor'
  let key: string | null = null
  let used: number | null
  let claims: number | null
  if (userId) {
    who = 'account'
    used = await usageToday(userId, 'chat')
    claims = used === null ? null : await usageToday(userId, 'chat_bonus')
  } else {
    key = await visitorKey(request.headers.get('cf-connecting-ip') ?? 'unknown', day)
    used = key ? await usedToday(key, 'chat', day) : null
    claims = key && used !== null ? await usedToday(key, 'chat_bonus', day) : null
  }
  const claimed = Math.min(claims ?? 0, BONUS_CLAIMS_PER_DAY)
  const limit = CHAT_PER_DAY + claimed * BONUS_PER_CLAIM
  return { who, userId, key, day, used, limit, claims: claimed, left: used === null ? null : Math.max(0, limit - used) }
}

/** Counted only once an answer exists to give. */
export async function spendOnStanding(s: Standing): Promise<number | null> {
  if (s.who === 'account' && s.userId) return spendOne(s.userId, 'chat')
  if (s.key) return spend(s.key, 'chat', s.day)
  return null
}

/** Premium, for whoever is asking: the account if there is one, otherwise the cookie or token routes. */
export async function premiumFor(request: Request, s: Standing): Promise<boolean> {
  if (s.userId) return hasPremium(s.userId)
  return isPremium(request)
}

/** One more claim on today's ledger, or null if it could not be written. */
export async function spendBonus(s: Standing): Promise<number | null> {
  if (s.who === 'account' && s.userId) return spendOne(s.userId, 'chat_bonus')
  if (s.key) return spend(s.key, 'chat_bonus', s.day)
  return null
}

/*
 * The signed start of a claim. It carries the time and the ledger row it is for,
 * so it cannot be carried to somebody else, and it proves how long ago the page
 * was asked for, which is the one thing about a claim this server can know.
 */
export async function bonusToken(s: Standing, at: number): Promise<string | null> {
  const secret = process.env.WHOP_WEBHOOK_SECRET || process.env.TURSO_AUTH_TOKEN
  const who = s.userId ?? s.key
  if (!secret || !who) return null
  const sig = (await hmac(secret, `bonus:${who}:${s.day}:${at}`)).slice(0, 32)
  return `${at}.${sig}`
}

/** True when the token is ours, for this visitor and day, and is old enough but not stale. */
export async function bonusTokenOk(s: Standing, token: unknown, now: number): Promise<boolean> {
  if (typeof token !== 'string' || !/^\d{10,14}\.[0-9a-f]{32}$/.test(token)) return false
  const at = Number(token.split('.')[0])
  const age = (now - at) / 1000
  if (age < BONUS_MIN_SECONDS || age > BONUS_MAX_SECONDS) return false
  return (await bonusToken(s, at)) === token
}
