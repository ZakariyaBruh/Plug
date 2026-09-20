/*
 * The profile store.  bun run scripts/profile-test.mjs
 *
 * A profile is somebody's dietary rules and everything they have eaten, kept
 * in a Whop membership's metadata because this app has no database of its own
 * (see src/lib/profile.ts). The tests that matter are the ones about not
 * losing it and not handing it to the wrong person: a half-read profile must
 * read as nothing rather than as a short profile, a smaller write must not
 * leave the tail of a bigger one behind, and a profile too large to store
 * must fail loudly rather than be silently truncated.
 *
 * Whop is stubbed. What is under test is the chunking and the refusals.
 */
process.env.WHOP_API_KEY = 'test-key'

const { readProfile, writeProfile, startAccount, accountOf, PROFILE_MAX } = await import(
  '../src/lib/profile.ts'
)
const { ACCOUNT_PLAN_ID } = await import('../src/lib/products.ts')

let pass = 0
let fail = 0
function check(name, got, want) {
  const ok = JSON.stringify(got) === JSON.stringify(want)
  ok ? (pass += 1) : (fail += 1)
  console.log(
    `${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `\n        got ${JSON.stringify(got)}\n        want ${JSON.stringify(want)}`}`,
  )
}

/** A Whop with one account membership whose metadata we can inspect. */
function whop(memberships) {
  const calls = []
  globalThis.fetch = async (url, init = {}) => {
    const u = new URL(String(url))
    const method = init.method ?? 'GET'
    const path = u.pathname.replace('/api/v1', '')
    const ok = (body) =>
      new Response(JSON.stringify(body), { headers: { 'Content-Type': 'application/json' } })

    if (method === 'GET' && path === '/memberships') {
      const userId = u.searchParams.get('user_id')
      return ok({ data: memberships.filter((m) => m.user.id === userId) })
    }
    if (method === 'POST' && /^\/memberships\/[^/]+$/.test(path)) {
      const found = memberships.find((m) => m.id === path.split('/')[2])
      // Whop MERGES metadata rather than replacing it, which is the whole
      // reason writeProfile blanks every slot it is not using.
      if (found) found.metadata = { ...found.metadata, ...JSON.parse(init.body).metadata }
      calls.push(['write', path.split('/')[2]])
      return ok({ id: path.split('/')[2] })
    }
    if (method === 'POST' && path === '/checkout_configurations') {
      calls.push(['config', JSON.parse(init.body).plan_id])
      return ok({ id: 'ch_acct1234', purchase_url: 'https://whop.com/checkout/ch_acct1234/' })
    }
    return new Response('nope', { status: 404 })
  }
  return calls
}

const account = (userId = 'user_a') => ({
  id: 'mem_acct',
  status: 'active',
  user: { id: userId },
  metadata: {},
})

const profileOf = (dishes) => ({
  decisions: dishes,
  diets: ['halal', 'vegetarian'],
  rules: ['spicy'],
  history: Array.from({ length: dishes }, (_, i) => ({ name: `Dish ${i}`, icon: '🍜', at: 1700000000000 + i })),
})

// --- the round trip --------------------------------------------------------
{
  const rows = [account()]
  whop(rows)
  const big = JSON.stringify(profileOf(60))
  check('a profile can be written', await writeProfile('user_a', 111, big), { ok: true })
  check('...and read back exactly', (await readProfile('user_a'))?.json, big)
  check('...with its timestamp', (await readProfile('user_a'))?.at, 111)
}

// The one that bites if slots are not blanked: Whop merges metadata, so a
// shorter profile written over a longer one would otherwise be reassembled
// with the tail of the old one still attached.
{
  const rows = [account()]
  whop(rows)
  await writeProfile('user_a', 111, JSON.stringify(profileOf(60)))
  const small = JSON.stringify(profileOf(1))
  await writeProfile('user_a', 222, small)
  check('a smaller profile leaves no tail of the bigger one', (await readProfile('user_a'))?.json, small)
}

// --- refusals --------------------------------------------------------------
{
  const calls = whop([])
  check('no account means nothing to read', await readProfile('user_nobody'), null)
  check('no account means nothing to write', await writeProfile('user_nobody', 1, '{}'), {
    ok: false,
    why: 'No account to keep it in.',
  })
  check('...and nothing was written', calls, [])
}

{
  const rows = [account()]
  whop(rows)
  // Incompressible, so it cannot sneak under the cap: random base64.
  let huge = ''
  while (huge.length < PROFILE_MAX * 40) huge += Math.random().toString(36).slice(2)
  const answer = await writeProfile('user_a', 111, JSON.stringify({ junk: huge }))
  check('a profile too big to keep is refused', answer.ok, false)
  check('...and nothing was stored', rows[0].metadata.pn ?? 0, 0)
}

// A profile is read by its owner or not at all.
{
  whop([account('user_a')])
  await writeProfile('user_a', 111, JSON.stringify(profileOf(5)))
  check('somebody else’s profile is not readable', await readProfile('user_b'), null)
}

// --- damage ----------------------------------------------------------------
// A half-read profile must read as NOTHING. Reading it as a short profile
// would hand the client something to overwrite a good local copy with.
{
  const rows = [account()]
  whop(rows)
  await writeProfile('user_a', 111, JSON.stringify(profileOf(60)))
  rows[0].metadata.p1 = 'corrupted'
  check('a damaged profile reads as nothing at all', await readProfile('user_a'), null)
}

{
  const rows = [account()]
  whop(rows)
  await writeProfile('user_a', 111, JSON.stringify(profileOf(60)))
  // The LAST slot actually in use. A sixty-dish profile compresses to two
  // chunks, so deleting a fixed index like p2 tests nothing at all.
  const used = Number(rows[0].metadata.pn)
  check('a sixty-dish profile uses a couple of slots', used > 0 && used < 24, true)
  delete rows[0].metadata[`p${used - 1}`]
  check('a missing chunk reads as nothing at all', await readProfile('user_a'), null)
}

// --- making one ------------------------------------------------------------
{
  const calls = whop([])
  const made = await startAccount('user_new')
  check('somebody with no account is sent to make one', made, {
    ok: true,
    url: 'https://whop.com/checkout/ch_acct1234/',
    already: false,
  })
  check('...on the free account plan, not on Premium', calls, [['config', ACCOUNT_PLAN_ID]])
}

{
  const calls = whop([account('user_a')])
  check('somebody who already has one is not sent again', await startAccount('user_a'), {
    ok: true,
    url: '',
    already: true,
  })
  check('...and no second account was made', calls, [])
}

{
  whop([{ ...account('user_a'), status: 'canceled' }])
  check('a cancelled account is not an account', await accountOf('user_a'), null)
}

console.log(`\n${pass} passed, ${fail} failed`)
if (fail) process.exit(1)
