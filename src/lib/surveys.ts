import { md5, safeEqual } from '#/lib/md5'

/*
 * surveys.ts — the survey network, behind an interface.
 *
 * CPX Research is what is wired up, chosen over BitLabs on the payout terms:
 * $25 minimum against $100, and an open application rather than a sales call.
 * Nothing above this file names CPX, so swapping to Lootably or BitLabs later
 * means writing one more adapter, not touching the ledger or the routes.
 *
 * WHAT THE NETWORK ACTUALLY PAYS INTO. Not the Whop balance — no survey
 * network can do that. Publisher payouts go to PayPal, a bank, or crypto, and
 * moving that into Whop afterwards is a manual deposit.
 */

export type PostbackEvent =
  | { kind: 'complete'; userId: string; txnId: string; netRevenueUsd: number; raw: Record<string, string> }
  | { kind: 'screenout'; userId: string; txnId: string; raw: Record<string, string> }
  | { kind: 'reversal'; userId: string; txnId: string; points: number; raw: Record<string, string> }
  | { kind: 'ignored'; reason: string }

export type SurveyProvider = {
  id: string
  /** The wall the browser opens. Signed, so the network trusts the user id. */
  wallUrl(userId: string): string | null
  /** Verified parse of an inbound postback. Returns null when the signature fails. */
  parsePostback(url: URL): PostbackEvent | null
  /** Exactly what the network expects as an acknowledgement body. */
  ack(): Response
}

/*
 * CPX signs with MD5(trans_id + "-" + secret). Note what that covers: the
 * transaction id and nothing else. The user id in the postback is NOT signed,
 * so a replayed postback with a swapped user_id would credit the wrong
 * account. The IP allowlist in the route is what closes that, which is why it
 * is treated as required rather than optional.
 */
const cpx: SurveyProvider = {
  id: 'cpx',

  wallUrl(userId) {
    const appId = process.env.CPX_APP_ID
    const secret = process.env.CPX_SECURE_HASH
    if (!appId || !secret) return null
    const params = new URLSearchParams({
      app_id: appId,
      ext_user_id: userId,
      secure_hash: md5(`${userId}-${secret}`),
    })
    return `https://offers.cpx-research.com/index.php?${params.toString()}`
  },

  parsePostback(url) {
    const secret = process.env.CPX_SECURE_HASH
    if (!secret) return null

    const q = Object.fromEntries(url.searchParams.entries())
    const txnId = q.trans_id
    const userId = q.user_id
    const hash = q.hash
    if (!txnId || !userId || !hash) return null

    if (!safeEqual(md5(`${txnId}-${secret}`), hash.toLowerCase())) return null

    // status 1 = credited, 2 = cancelled/clawed back.
    if (q.status === '2') {
      return {
        kind: 'reversal',
        userId,
        txnId,
        points: Math.abs(Number(q.amount_local ?? 0)) || 0,
        raw: q,
      }
    }
    if (q.status !== '1') return { kind: 'ignored', reason: `status ${q.status ?? 'missing'}` }

    /*
     * amount_usd is OUR revenue from the network, not the user's reward — the
     * user's 30% is computed here from it, so the split lives in this repo and
     * not in a dashboard field somebody can quietly change.
     */
    const netRevenueUsd = Number(q.amount_usd ?? 0)
    if (!Number.isFinite(netRevenueUsd) || netRevenueUsd <= 0) {
      return { kind: 'screenout', userId, txnId, raw: q }
    }
    return { kind: 'complete', userId, txnId, netRevenueUsd, raw: q }
  },

  // CPX retries until it sees this. Anything else and the postback comes back forever.
  ack() {
    return new Response('1', { headers: { 'Content-Type': 'text/plain' } })
  },
}

const PROVIDERS: Record<string, SurveyProvider> = { cpx }

export function provider(id = process.env.SURVEY_PROVIDER ?? 'cpx'): SurveyProvider | null {
  return PROVIDERS[id] ?? null
}

/*
 * Whether a postback really came from the network.
 *
 * CPX publishes the addresses its postbacks originate from; anything else
 * claiming to be one is not. Unset means the check cannot run — that is a
 * misconfiguration worth shouting about rather than quietly allowing, because
 * without it a leaked (trans_id, hash) pair can be replayed at any user id.
 */
export function fromProvider(request: Request): boolean {
  const allowed = (process.env.SURVEY_POSTBACK_IPS ?? '')
    .split(',')
    .map((ip) => ip.trim())
    .filter(Boolean)
  if (!allowed.length) {
    console.error('surveys: SURVEY_POSTBACK_IPS is not set — refusing postback')
    return false
  }
  const from = request.headers.get('cf-connecting-ip') ?? ''
  return allowed.includes(from)
}
