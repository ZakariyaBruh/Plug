import { createFileRoute } from '@tanstack/react-router'

/*
 * / — the front door, which is the game.
 *
 * WHY THERE IS NOTHING TO RENDER HERE ANY MORE.
 *
 * This used to be a marketing homepage, and it was a copy of two things at
 * once. Its hero was the game's own landing screen word for word — the same
 * "You're hungry. / You don't know what you want. / That's alright — I might.",
 * the same either-ors paragraph, the same "Decide for me" button, the same
 * "No account. No email. Free to play.", the same install prompt, the same
 * counts. Its other two sections were summaries of /how-it-works and
 * /premium, down to sharing a heading with the latter.
 *
 * So somebody arriving at the site met a page that looked like the app,
 * offered the same things as the app, and was not the app: none of the rail,
 * none of the modes, none of the sections. All of that was one click further
 * on, and you only found out by clicking. Two front doors, one of which did
 * not open.
 *
 * Now there is one. Everything this page said is either in the game already
 * or on the page it was summarising, both of which are linked from the
 * landing so nothing is left unreachable.
 *
 * 302 AND NOT 301, deliberately. A permanent redirect is cached by browsers
 * for a long time and is genuinely hard to take back — and this is the one
 * change in this project that has been reverted once already. Temporary costs
 * nothing in practice and can be undone by deleting this file.
 */
export const Route = createFileRoute('/')({
  server: {
    handlers: {
      GET: ({ request }) => {
        const url = new URL(request.url)
        return new Response(null, {
          status: 302,
          headers: { Location: `${url.origin}/decide/`, 'Cache-Control': 'no-store' },
        })
      },
    },
  },
})
