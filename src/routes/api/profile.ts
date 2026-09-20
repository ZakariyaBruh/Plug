import { createFileRoute } from '@tanstack/react-router'

import { currentUser } from '#/lib/session'
import { whopUserId } from '#/lib/whop-token'
import { PROFILE_MAX, accountOf, readProfile, startAccount, writeProfile } from '#/lib/profile'

/*
 * The profile, so a second device is not a stranger.
 *
 * WHO IS ASKING is resolved here and nowhere else, the same two ways the rest
 * of the app resolves it: the OAuth cookie first, then Whop's signed header
 * for the iframe, where a third-party cookie may never arrive. Nothing in a
 * request body is allowed to say whose profile this is — that is the whole of
 * the access control, because a profile is somebody's dietary rules and
 * everything they have eaten.
 *
 * GET  — what is stored, with the timestamp it was stored at.
 * PUT  — store this, with the client's own timestamp. Newest wins.
 * POST — make the free account, if there is not one yet.
 */

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  })

async function caller(request: Request): Promise<string | null> {
  const user = await currentUser()
  if (user?.sub) return user.sub
  return await whopUserId(request)
}

export const Route = createFileRoute('/api/profile')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const me = await caller(request)
        if (!me) return json({ signedIn: false, account: false, profile: null })

        const account = await accountOf(me)
        if (!account) return json({ signedIn: true, account: false, profile: null })

        try {
          const stored = await readProfile(me)
          return json({ signedIn: true, account: true, profile: stored })
        } catch {
          // A read that fails must not read as "there is nothing stored":
          // the client would take that as licence to push over it.
          return json({ signedIn: true, account: true, error: true, profile: null }, 502)
        }
      },

      PUT: async ({ request }) => {
        const me = await caller(request)
        if (!me) return json({ ok: false, why: 'Sign in first.' }, 401)

        const body = (await request.json().catch(() => null)) as
          | { at?: unknown; profile?: unknown }
          | null
        const at = typeof body?.at === 'number' && body.at > 0 ? body.at : 0
        const profile = body?.profile

        if (!at) return json({ ok: false, why: 'No timestamp on that.' }, 400)
        if (!profile || typeof profile !== 'object') {
          return json({ ok: false, why: 'That is not a profile.' }, 400)
        }

        const text = JSON.stringify(profile)
        // Checked before it is compressed as well as after, so a hostile body
        // cannot spend the worker's CPU on a gigabyte of gzip first.
        if (text.length > PROFILE_MAX * 8) {
          return json({ ok: false, why: 'That profile is too big to keep.' }, 413)
        }

        try {
          const result = await writeProfile(me, at, text)
          return json(result, result.ok ? 200 : 409)
        } catch {
          return json({ ok: false, why: 'Could not save it. Your device still has it.' }, 502)
        }
      },

      POST: async ({ request }) => {
        const me = await caller(request)
        if (!me) return json({ ok: false, why: 'Sign in first.' }, 401)
        try {
          const result = await startAccount(me)
          return json(result, result.ok ? 200 : 502)
        } catch {
          return json({ ok: false, why: 'Could not make an account just now.' }, 502)
        }
      },
    },
  },
})
