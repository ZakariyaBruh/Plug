import { createFileRoute } from '@tanstack/react-router'

import { whopUserId } from '#/lib/whop-token'

/*
 * /experiences/<experienceId> — where a member lands when a creator has
 * installed this app into their whop, and they tap it.
 *
 * THIS PATH WAS ADVERTISED BEFORE IT EXISTED. The app record has always
 * declared experience_path as /experiences/[experienceId]; there was no such
 * route, so anyone who installed the app got the 404 page. That is worse than
 * not being installable: the listing works, the install works, and the thing
 * only breaks in front of somebody else's members.
 *
 * WHAT IT DOES, AND WHY IT IS A REDIRECT RATHER THAN A PAGE. Somebody who taps
 * an app inside their community wants the app, not a page about it. The game
 * at /decide/ is the app, so this hands straight over. There is nothing useful
 * to put in between — an experience view that greets you before letting you in
 * is a door in front of a door.
 *
 * WHY THE TOKEN IS VERIFIED IF NOTHING IS GATED ON IT. The game is free, so
 * refusing anybody here would only invent a way for a real member to be locked
 * out of something that costs nothing. What the check buys is the knowledge
 * that identity works in here at all — it is the one place this app can learn
 * whether Whop's header arrives and verifies, and Premium inside the iframe
 * will need exactly that. It is logged and does not decide anything.
 */
export const Route = createFileRoute('/experiences/$experienceId')({
  server: {
    handlers: {
      GET: async ({ request, params }) => {
        const url = new URL(request.url)

        /*
         * Deliberately not awaited into the redirect's critical path any more
         * than it already is: a slow or unreachable JWKS must not keep a member
         * staring at a blank frame. It resolves to null on every failure, which
         * is exactly the same as a member we could not name — and we let those
         * in too.
         */
        const userId = await whopUserId(request).catch(() => null)
        console.log(
          `experience ${params.experienceId}: ${userId ? `member ${userId}` : 'unidentified visitor'}`,
        )

        // The trailing slash matters — /decide/ is a static directory whose own
        // asset links (styles.css, js/app.js) resolve relative to it. See
        // routes/decide.ts, which exists for the same reason.
        return new Response(null, {
          status: 302,
          headers: { Location: `${url.origin}/decide/`, 'Cache-Control': 'no-store' },
        })
      },
    },
  },
})
