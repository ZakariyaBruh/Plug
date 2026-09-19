/*
 * The Household seat rules.  bun run scripts/household-test.mjs
 *
 * A seat is a membership on a free plan attached to the Premium product, so
 * granting one is giving Premium away. Every test here is about who is
 * refused: somebody who is not paying for a Household, somebody who already
 * used their seat, somebody cancelling a seat that is not theirs. The happy
 * path is tested too, mostly to prove the refusals are not simply refusing
 * everything.
 *
 * Whop is stubbed. What is under test is this repo's authorisation, not
 * Whop's API — the point is that nothing but a live Household subscription
 * can produce a seat, and that is decided here.
 */
process.env.WHOP_API_KEY = 'test-key'

const { seatLink, checkoutFor, revokeSeat, seatsOf, sweepSeats } = await import(
  '../src/lib/household.ts'
)
const { SEAT_PLAN_ID, HOUSEHOLD_MONTHLY_PLAN_ID, PREMIUM_PLAN_ID } = await import(
  '../src/lib/products.ts'
)

let pass = 0
let fail = 0
function check(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  ok ? (pass += 1) : (fail += 1)
  console.log(
    `${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `\n        got ${JSON.stringify(got)}\n        want ${JSON.stringify(want)}`}`,
  )
}

/*
 * A Whop stand-in holding a list of memberships. `calls` records every write,
 * so a test can assert that nothing was granted rather than only that the
 * answer said no — a refusal that still handed out a membership would pass
 * the first check and fail the second.
 */
function whop(memberships, configs = []) {
  const calls = []
  globalThis.fetch = async (url, init = {}) => {
    const u = new URL(String(url))
    const method = init.method ?? 'GET'
    const path = u.pathname.replace('/api/v1', '')
    const ok = (body) => new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } })

    if (method === 'GET' && path === '/memberships') {
      const userId = u.searchParams.get('user_id')
      const planIds = [...u.searchParams.getAll('plan_ids[]'), u.searchParams.get('plan_id')].filter(Boolean)
      return ok({
        data: memberships.filter(
          (m) => (!userId || m.user?.id === userId) && (!planIds.length || planIds.includes(m.plan.id)),
        ),
      })
    }
    if (method === 'GET' && path === '/checkout_configurations') {
      return ok({ data: configs })
    }
    if (method === 'GET' && /^\/checkout_configurations\/[^/]+$/.test(path)) {
      const found = configs.find((c) => c.id === path.split('/')[2])
      if (!found) return new Response('gone', { status: 404 })
      return ok(found)
    }
    if (method === 'POST' && path === '/checkout_configurations') {
      const body = JSON.parse(init.body)
      const made = {
        id: 'ch_made1234',
        plan: { id: body.plan_id },
        metadata: body.metadata,
        purchase_url: 'https://whop.com/checkout/ch_made1234/',
      }
      configs.push(made)
      calls.push(['config', body.plan_id, body.metadata])
      return ok(made)
    }
    if (method === 'DELETE' && /^\/checkout_configurations\//.test(path)) {
      const id = path.split('/')[2]
      const at = configs.findIndex((c) => c.id === id)
      if (at >= 0) configs.splice(at, 1)
      calls.push(['drop-config', id])
      return ok({ id, deleted: true })
    }
    if (method === 'POST' && /^\/memberships\/[^/]+$/.test(path)) {
      const id = path.split('/')[2]
      const found = memberships.find((m) => m.id === id)
      if (found) found.metadata = { ...found.metadata, ...JSON.parse(init.body).metadata }
      calls.push(['metadata', id, JSON.parse(init.body).metadata])
      return ok({ id })
    }
    if (method === 'POST' && path.endsWith('/cancel')) {
      const id = path.split('/')[2]
      const found = memberships.find((m) => m.id === id)
      if (found) found.status = 'canceled'
      calls.push(['cancel', id])
      return ok({ id })
    }
    if (method === 'POST' && path.endsWith('/extend')) {
      calls.push(['extend', path.split('/')[2]])
      return ok({ id: path.split('/')[2] })
    }
    return new Response('nope', { status: 404 })
  }
  return calls
}

const owner = (id = 'user_owner') => ({
  id: 'mem_paid',
  status: 'active',
  plan: { id: HOUSEHOLD_MONTHLY_PLAN_ID },
  user: { id },
  metadata: {},
})
const seat = (ownerId, id = 'mem_seat') => ({
  id,
  status: 'active',
  plan: { id: SEAT_PLAN_ID },
  user: { id: 'user_partner', email: 'p@example.com' },
  metadata: { household_owner: ownerId },
})

// --- who may not have one -------------------------------------------------
{
  const calls = whop([])
  const got = await seatLink('user_nobody')
  check('somebody with no subscription gets no invitation', got, {
    ok: false,
    why: 'Seats come with a Household subscription.',
  })
  check('...and nothing was made', calls, [])
}

{
  // A plain Premium subscriber is not a Household subscriber.
  const calls = whop([
    { id: 'mem_solo', status: 'active', plan: { id: PREMIUM_PLAN_ID }, user: { id: 'user_solo' }, metadata: {} },
  ])
  const got = await seatLink('user_solo')
  check('a plain Premium subscriber gets no invitation', got.ok, false)
  check('...and nothing was made', calls, [])
}

{
  const calls = whop([owner(), seat('user_owner')])
  const got = await seatLink('user_owner')
  check('a taken seat cannot be invited to again', got, {
    ok: false,
    why: 'Your seat is already with somebody. Take it back first to give it to someone else.',
  })
  check('...and nothing was made', calls, [])
}

// A cancelled Household is not a Household. This is the one that matters most
// after somebody stops paying and the webhook has not landed yet.
{
  const calls = whop([{ ...owner(), status: 'canceled' }])
  const got = await seatLink('user_owner')
  check('a cancelled subscription invites nobody', got.ok, false)
  check('...and nothing was made', calls, [])
}

// --- who may --------------------------------------------------------------
{
  const calls = whop([owner()])
  const got = await seatLink('user_owner')
  check('a Household subscriber may make an invitation', got, {
    ok: true,
    url: 'https://morsels45-app.whop.site/seat/ch_made1234',
  })
  check('...on the free plan, stamped with its owner', calls, [
    ['config', SEAT_PLAN_ID, { household_owner: 'user_owner' }],
  ])
}

// The link points at this app, not at Whop: /seat/<id> is where the capacity
// is checked, and a link straight to Whop could not be refused.
{
  whop([owner()])
  const got = await seatLink('user_owner')
  check('the invitation points at this app', got.ok && got.url.includes('/seat/'), true)
}

// A trialing subscription is a live one — the seat is part of what the trial
// is for, and a partner who cannot be invited until day eight is a trial of
// the wrong product.
{
  whop([{ ...owner(), status: 'trialing' }])
  check('a trialing subscription may give its seat', (await seatLink('user_owner')).ok, true)
}

// --- taking it back -------------------------------------------------------
{
  const calls = whop([owner('user_a'), seat('user_a', 'mem_a_seat')])
  check('an owner may take their own seat back', await revokeSeat('user_a', 'mem_a_seat'), { ok: true })
  check('...which cancels that membership', calls, [['cancel', 'mem_a_seat']])
}

{
  const calls = whop([owner('user_a'), seat('user_a', 'mem_a_seat'), owner('user_b')])
  const got = await revokeSeat('user_b', 'mem_a_seat')
  check('one owner cannot cancel another owner’s seat', got, {
    ok: false,
    why: 'That seat is not yours to take back.',
  })
  check('...and nothing was cancelled', calls, [])
}

// --- claiming one ---------------------------------------------------------
const config = (ownerId, id = 'ch_made1234') => ({
  id,
  plan: { id: SEAT_PLAN_ID },
  metadata: { household_owner: ownerId },
  purchase_url: `https://whop.com/checkout/${id}/`,
})

{
  whop([owner('user_a')], [config('user_a')])
  check('an unclaimed invitation goes to Whop', await checkoutFor('ch_made1234'), {
    ok: true,
    url: 'https://whop.com/checkout/ch_made1234/',
  })
}

{
  whop([owner('user_a'), seat('user_a', 'mem_taken')], [config('user_a')])
  check('an invitation whose seat is taken is refused', await checkoutFor('ch_made1234'), {
    ok: false,
    why: 'That seat has already been taken by somebody else.',
  })
}

{
  whop([{ ...owner('user_a'), status: 'canceled' }], [config('user_a')])
  check('an invitation from somebody who stopped paying is refused', await checkoutFor('ch_made1234'), {
    ok: false,
    why: 'The subscription this seat came from is no longer active.',
  })
}

{
  whop([owner('user_a')], [])
  check('a deleted invitation is refused', (await checkoutFor('ch_made1234')).ok, false)
}

{
  whop([owner('user_a')], [config('user_a')])
  check('a malformed id never reaches the API', await checkoutFor('../plans/plan_x'), {
    ok: false,
    why: 'That link is not one of ours.',
  })
}

// A configuration on some other plan is not an invitation to a seat, however
// it was come by.
{
  whop([owner('user_a')], [{ ...config('user_a'), plan: { id: HOUSEHOLD_MONTHLY_PLAN_ID } }])
  check('a configuration on another plan is refused', await checkoutFor('ch_made1234'), {
    ok: false,
    why: 'That link is not an invitation to a seat.',
  })
}

// --- counting -------------------------------------------------------------
{
  whop([owner('user_a'), seat('user_a', 'mem_1'), seat('user_b', 'mem_2')])
  const mine = await seatsOf('user_a')
  check('seats are counted by who pays for them', mine.map((m) => m.id), ['mem_1'])
}

// --- the sweep ------------------------------------------------------------
{
  const calls = whop([owner('user_a'), seat('user_a', 'mem_1')], [config('user_a')])
  await sweepSeats('user_a')
  check('a seat with a paying owner is renewed, and its invitation spent', calls, [
    ['extend', 'mem_1'],
    ['drop-config', 'ch_made1234'],
  ])
}

// The one that matters if an invitation gets forwarded: the oldest seat is
// the one somebody has been using, so it lives and the rest do not.
{
  const calls = whop([
    owner('user_a'),
    seat('user_a', 'mem_1'),
    seat('user_a', 'mem_2'),
    seat('user_a', 'mem_3'),
  ])
  await sweepSeats('user_a')
  // No drop-config here: there is no outstanding invitation to spend, which
  // is exactly the state a forwarded link leaves behind.
  check('seats over the cap are cancelled, newest first', calls, [
    ['cancel', 'mem_2'],
    ['cancel', 'mem_3'],
    ['extend', 'mem_1'],
  ])
}

{
  const calls = whop([{ ...owner('user_a'), status: 'expired' }, seat('user_a', 'mem_1')], [config('user_a')])
  await sweepSeats('user_a')
  check('a seat whose owner stopped paying is cancelled, invitation and all', calls, [
    ['cancel', 'mem_1'],
    ['drop-config', 'ch_made1234'],
  ])
}

console.log(`\n${pass} passed, ${fail} failed`)
if (fail) process.exit(1)
