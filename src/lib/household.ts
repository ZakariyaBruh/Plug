/*
 * HOUSEHOLD — two people, one subscription.
 *
 * The pain this tier is sold against is an argument between two people, so a
 * plan that only ever covers one of them is selling half the answer. A
 * Household subscription is Premium with a second seat the buyer hands to
 * whoever they actually eat with.
 *
 * HOW A SEAT IS A REAL THING RATHER THAN A FLAG WE KEEP.
 *
 * This app stores nothing. There is no database, no KV, no D1 — the worker is
 * hosted by Whop and its only durable state is what Whop itself holds. So a
 * seat is not a row somewhere saying "B may use A's subscription": it is an
 * actual Whop membership, on a free hidden plan attached to the same product
 * as Premium. The partner therefore passes the ordinary access check that
 * every other part of this app already makes, on every device they sign into,
 * with nothing here to keep in sync and nothing to get out of step.
 *
 * WHICH MAKES THAT FREE PLAN THE MOST DANGEROUS OBJECT IN THIS CODEBASE. A
 * membership on it is Premium, for nothing, forever. It is hidden, it is not
 * purchasable, and the only code that can grant one is grantSeat() below —
 * which refuses unless the caller is signed in, is themselves paying for a
 * Household plan right now, and has not already used up their seats. Nothing
 * on the client decides any part of that.
 *
 * AND WHAT HAPPENS WHEN THE PAYER LEAVES. Whop does not cascade: cancelling
 * the paid membership leaves the free one standing. Two things take it down.
 * The seat plan expires 35 days after it is granted, and sweepSeats() renews
 * it only while the owner is still paying — so an abandoned seat dies on its
 * own within five weeks without anything having to notice. And the webhook at
 * /api/whop-events cancels it within seconds of the owner's membership going
 * invalid, which is what normally happens. The expiry is the backstop for the
 * webhook, not the other way round.
 */

/*
 * Every plan id lives in lib/products.ts and is imported from there. It is
 * one direction on purpose: products.ts must not import this file back, or
 * the module that owns the ids ends up half-initialised behind the one that
 * needs them.
 */
import {
  HOUSEHOLD_PLAN_IDS,
  PREMIUM_PRODUCT_ID,
  SEAT_PLAN_ID,
} from '#/lib/products'
import { SITE_URL } from '#/lib/site'

export { HOUSEHOLD_PLAN_IDS, SEAT_PLAN_ID }

/** How many people a Household covers in total, the buyer included. */
export const HOUSEHOLD_SEATS = 2

/** So the seats a Household can hand out is one fewer than it covers. */
export const SEATS_TO_GIVE = HOUSEHOLD_SEATS - 1

/**
 * The metadata key that ties a seat back to whoever is paying for it. Whop
 * has no notion of one membership belonging to another, so this is the join —
 * and it is set by us, on the server, immediately after the invite.
 */
const OWNER_KEY = 'household_owner'

/** Billing states in which somebody is a paying customer right now. */
const LIVE = ['active', 'trialing', 'past_due', 'canceling'] as const

type Membership = {
  id: string
  status: string
  plan?: { id?: string } | null
  user?: { id?: string; username?: string; name?: string; email?: string } | null
  metadata?: Record<string, unknown> | null
  renewal_period_end?: string | null
  expires_at?: string | null
}

function origin() {
  return process.env.WHOP_API_ORIGIN ?? 'https://api.whop.com'
}

/*
 * Every call here is made with the app's own API key, never with a visitor's
 * OAuth token: granting and cancelling memberships is an operation on the
 * business, and a visitor's token neither can nor should be able to do it.
 * Which is exactly why the authorisation checks in this file have to be
 * complete — there is nothing behind them.
 */
async function api(path: string, init?: RequestInit) {
  const key = process.env.WHOP_API_KEY
  if (!key) throw new Error('household: no WHOP_API_KEY')
  const response = await fetch(`${origin()}/api/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${key}`,
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers ?? {}),
    },
  })
  if (!response.ok) {
    throw new Error(`household: ${init?.method ?? 'GET'} ${path} → ${response.status}`)
  }
  return (await response.json()) as unknown
}

function rows(payload: unknown): Membership[] {
  const data = (payload as { data?: unknown })?.data
  return Array.isArray(data) ? (data as Membership[]) : []
}

function live(m: Membership) {
  return (LIVE as readonly string[]).includes(m.status)
}

async function membershipsFor(userId: string, planIds: readonly string[]) {
  const query = new URLSearchParams({ user_id: userId, product_id: PREMIUM_PRODUCT_ID })
  for (const id of planIds) query.append('plan_ids[]', id)
  return rows(await api(`/memberships?${query}`)).filter(live)
}

/**
 * The caller's own Household subscription, if they have a live one. This is
 * the gate on everything else in this file: no membership, no seats.
 */
export async function householdOf(userId: string): Promise<Membership | null> {
  const mine = await membershipsFor(userId, HOUSEHOLD_PLAN_IDS)
  return mine[0] ?? null
}

/** The live seats this owner has handed out. */
export async function seatsOf(ownerId: string): Promise<Membership[]> {
  const query = new URLSearchParams({ plan_id: SEAT_PLAN_ID, product_id: PREMIUM_PRODUCT_ID })
  const all = rows(await api(`/memberships?${query}&first=100`)).filter(live)
  return all.filter((m) => String(m.metadata?.[OWNER_KEY] ?? '') === ownerId)
}

export type SeatView = {
  id: string
  who: string
  endsAt: string | null
}

export function seatView(m: Membership): SeatView {
  return {
    id: m.id,
    // A seat is granted by email before the person has ever signed in, so
    // there may be no username yet. Showing the email back to the person who
    // typed it is the only thing that identifies which invitation this is.
    who: m.user?.username ?? m.user?.name ?? m.user?.email ?? 'Invited',
    endsAt: m.expires_at ?? m.renewal_period_end ?? null,
  }
}

/*
 * HAND A SEAT OVER — AS A LINK, BECAUSE WHOP WILL NOT LET US PUSH ONE.
 *
 * The obvious way to do this is POST /memberships/invite, which grants a
 * membership on a free plan to a named person. This account cannot: Whop
 * answers 403, "This endpoint is not available for your account", and it is
 * an account-level gate rather than a missing permission, so there is nothing
 * to turn on.
 *
 * What does work is a checkout configuration: a one-off checkout on a chosen
 * plan carrying metadata that Whop copies onto whatever membership comes out
 * of it. The seat plan costs nothing, so "checking out" is a click, and the
 * membership it produces arrives already stamped with who is paying for it.
 * The owner gets a link and sends it to their partner however they like,
 * which is a better invitation than an email from a company they have never
 * heard of.
 *
 * A LINK IS A BEARER TOKEN, and this one buys Premium. Four things hold it in:
 *   - the capacity check below runs when the link is MADE, and again when it
 *     is claimed (routes/seat.$id.ts), so a shared link stops working the
 *     moment the seat it was for is taken;
 *   - membership.activated deletes the configuration the instant a seat comes
 *     out of it, so the window is seconds rather than forever;
 *   - sweepSeats() cancels anything over the cap next time the owner looks at
 *     their account, newest first, so the seat they actually meant to give
 *     survives and the rest do not; and
 *   - the plan expires after 35 days regardless, so anything that slips
 *     through every other net still dies on its own.
 */

/** Checkout configurations this owner has outstanding. */
async function configsOf(ownerId: string) {
  const all = (await api('/checkout_configurations?first=100')) as {
    data?: { id?: string; metadata?: Record<string, unknown> | null; plan?: { id?: string } | null }[]
  }
  return (all.data ?? []).filter(
    (c) => c.plan?.id === SEAT_PLAN_ID && String(c.metadata?.[OWNER_KEY] ?? '') === ownerId,
  )
}

/** Throw away an owner's outstanding invitations. */
export async function dropConfigs(ownerId: string): Promise<void> {
  for (const config of await configsOf(ownerId)) {
    if (!config.id) continue
    await api(`/checkout_configurations/${config.id}`, { method: 'DELETE' }).catch(() => {})
  }
}

/** Whether this owner may hand out another seat right now. */
export async function canGive(ownerId: string): Promise<boolean> {
  if (!(await householdOf(ownerId))) return false
  return (await seatsOf(ownerId)).length < SEATS_TO_GIVE
}

/*
 * `by` is the user id of whoever is asking, established from a cookie or from
 * Whop's signed header — never from anything the client said about itself.
 */
export async function seatLink(
  by: string,
): Promise<{ ok: true; url: string } | { ok: false; why: string }> {
  if (!(await householdOf(by))) {
    return { ok: false, why: 'Seats come with a Household subscription.' }
  }

  const taken = await seatsOf(by)
  if (taken.length >= SEATS_TO_GIVE) {
    return {
      ok: false,
      why:
        SEATS_TO_GIVE === 1
          ? 'Your seat is already with somebody. Take it back first to give it to someone else.'
          : `All ${SEATS_TO_GIVE} of your seats are in use.`,
    }
  }

  // One live invitation at a time. An owner who asks for a second link has
  // decided the first one is not being used, and two working links to one
  // seat is two people who can claim it.
  await dropConfigs(by)

  const made = (await api('/checkout_configurations', {
    method: 'POST',
    body: JSON.stringify({ plan_id: SEAT_PLAN_ID, metadata: { [OWNER_KEY]: by } }),
  })) as { id?: string; data?: { id?: string } }

  const id = made.id ?? made.data?.id
  if (!id) return { ok: false, why: 'Whop did not hand back a link. Nothing was given away.' }

  /*
   * Our own address, not Whop's checkout URL. The difference is the capacity
   * check in routes/seat.$id.tsx: a link that goes straight to Whop cannot be
   * refused once the seat it was written for has been taken, and this one
   * can. The configuration id is the secret either way.
   */
  return { ok: true, url: `${SITE_URL}/seat/${id}` }
}

/** Take a seat back. Only the person paying for it may. */
export async function revokeSeat(
  by: string,
  membershipId: string,
): Promise<{ ok: true } | { ok: false; why: string }> {
  const mine = await seatsOf(by)
  // Checked against the owner's own list rather than by reading the
  // membership and trusting its metadata, so a membership id guessed or
  // scraped from somewhere else cannot be cancelled through this endpoint.
  if (!mine.some((m) => m.id === membershipId)) {
    return { ok: false, why: 'That seat is not yours to take back.' }
  }
  await api(`/memberships/${membershipId}/cancel`, { method: 'POST' })
  return { ok: true }
}

/**
 * Cancel every seat an owner has handed out. Called when their own membership
 * goes invalid — the seat is theirs to give only while they are paying.
 */
export async function revokeAllSeats(ownerId: string): Promise<number> {
  const seats = await seatsOf(ownerId)
  let gone = 0
  for (const seat of seats) {
    try {
      await api(`/memberships/${seat.id}/cancel`, { method: 'POST' })
      gone += 1
    } catch {
      // One stubborn seat should not stop the others being taken down. The
      // 35-day expiry on the plan catches whatever is left.
    }
  }
  return gone
}

/*
 * PUT THE OWNER'S SEATS BACK IN ORDER.
 *
 * Runs whenever the owner opens their own account page, which is the cheapest
 * moment in the app to do it and the one where the answer is about to be
 * shown to them anyway. Three jobs:
 *
 *   - a seat whose owner has stopped paying is cancelled, because Whop does
 *     not cascade and the free membership would otherwise outlive the paid
 *     one that justified it;
 *   - anything over the cap is cancelled, oldest kept and newest dropped, so
 *     an invite link that got shared further than it should have collapses
 *     back to the one seat that was actually bought — and the seat somebody
 *     has been using is the one that survives;
 *   - everything left standing has its expiry pushed back out. The plan
 *     expires 35 days after it is granted on purpose: it means an abandoned
 *     seat dies by itself even if every webhook is missed and this never
 *     runs. Renewing it is the price of having that backstop.
 */
export async function sweepSeats(ownerId: string): Promise<void> {
  const household = await householdOf(ownerId)
  const seats = await seatsOf(ownerId)

  if (!household) {
    for (const seat of seats) {
      await api(`/memberships/${seat.id}/cancel`, { method: 'POST' }).catch(() => {})
    }
    await dropConfigs(ownerId)
    return
  }

  const keep = seats.slice(0, SEATS_TO_GIVE)
  const extra = seats.slice(SEATS_TO_GIVE)

  for (const seat of extra) {
    await api(`/memberships/${seat.id}/cancel`, { method: 'POST' }).catch(() => {})
  }
  for (const seat of keep) {
    await api(`/memberships/${seat.id}/extend`, {
      method: 'POST',
      body: JSON.stringify({ days: 35 }),
    }).catch(() => {})
  }

  // A seat is taken, so the invitation that produced it is spent. The webhook
  // normally gets here first; this is for the deliveries that never land.
  if (keep.length >= SEATS_TO_GIVE) await dropConfigs(ownerId)
}

/*
 * Is this invitation still good, and where does it go?
 *
 * Called when somebody opens /seat/<id>, which is the last moment before a
 * membership exists and therefore the right place to ask. The configuration
 * carries the id of whoever is paying; the capacity is checked against them,
 * live, so a link that has already been used — or that belongs to somebody
 * who has since stopped paying — is refused here rather than honoured and
 * cleaned up afterwards.
 */
export async function checkoutFor(
  configId: string,
): Promise<{ ok: true; url: string } | { ok: false; why: string }> {
  // Ids come out of a URL, so this one is checked for shape before it is put
  // in a path.
  if (!/^ch_[A-Za-z0-9]{6,64}$/.test(configId)) {
    return { ok: false, why: 'That link is not one of ours.' }
  }

  let config: {
    id?: string
    purchase_url?: string
    metadata?: Record<string, unknown> | null
    plan?: { id?: string } | null
  }
  try {
    config = (await api(`/checkout_configurations/${configId}`)) as typeof config
  } catch {
    return { ok: false, why: 'This invitation has already been used, or it was taken back.' }
  }

  if (config.plan?.id !== SEAT_PLAN_ID) {
    return { ok: false, why: 'That link is not an invitation to a seat.' }
  }

  const ownerId = String(config.metadata?.[OWNER_KEY] ?? '')
  if (!ownerId) return { ok: false, why: 'That link is not an invitation to a seat.' }

  if (!(await householdOf(ownerId))) {
    return { ok: false, why: 'The subscription this seat came from is no longer active.' }
  }
  if ((await seatsOf(ownerId)).length >= SEATS_TO_GIVE) {
    return { ok: false, why: 'That seat has already been taken by somebody else.' }
  }

  const url = config.purchase_url
  if (!url) return { ok: false, why: 'Whop did not say where this invitation goes.' }
  return { ok: true, url }
}
