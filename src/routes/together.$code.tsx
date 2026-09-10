import { createFileRoute } from '@tanstack/react-router'
import { useEffect } from 'react'

import { PageShell } from '#/components/PageShell'
import { pageHead, track } from '#/lib/site'
import { loadViewer } from '#/lib/viewer'

/*
 * /together/<code> — where an invitation to decide together lands.
 *
 * The code is one person's five answers, and it is deliberately not read here.
 * This page's only job is to be a good thing to receive: a real page with a
 * card, in a message from a friend, that explains in one line what is being
 * asked and hands over to the game. The game does the decoding, and refuses
 * anything that is not five real answers.
 *
 * WHY A PAGE AT ALL, rather than linking straight into /decide/. The game is a
 * static file with one fixed set of share tags, so a link to it previews as
 * the app in general — which is the wrong message when what arrived is a
 * specific person asking you a specific question. This previews as the
 * invitation it is.
 *
 * The code is passed through untouched but never rendered: what is in the URL
 * was typed by whoever sent it, and it belongs in the next URL, not in the
 * page.
 */

// Two characters per answer, and nothing else can be in there. Checked before
// the code is put in a link, so a malformed one becomes a plain invitation to
// play rather than a broken handover.
const CODE = /^[0-9a-z]{2,40}$/

export const Route = createFileRoute('/together/$code')({
  loader: async () => ({ viewer: await loadViewer() }),
  head: () =>
    pageHead({
      title: 'Someone wants to eat with you — morsels45',
      description:
        'They have answered five either-ors about what they feel like. Answer five of your own and you both get one dish that suits you both.',
      ogTitle: 'What should we eat?',
      ogDescription:
        'They answered five either-ors. Answer yours and you both land on one dish. About twenty seconds, no sign-up.',
      // One person's answers, meant for one person. Not a search result.
      noindex: true,
    }),
  component: TogetherPage,
})

function TogetherPage() {
  const { code } = Route.useParams()
  const { viewer } = Route.useLoaderData()
  const valid = CODE.test(code)

  useEffect(() => {
    track('view_content', { page: 'together-invite' })
  }, [])

  return (
    <PageShell user={viewer.user}>
      <main className="px-6 py-16 fade-in-up sm:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-[var(--amber)]">
            Decide together
          </p>
          <div className="mt-6 text-7xl leading-none" aria-hidden="true">
            🍽️
          </div>

          {valid ? (
            <>
              <h1 className="mt-5 text-4xl font-bold sm:text-5xl">Someone wants to eat with you</h1>
              <p className="mx-auto mt-4 max-w-md text-lg text-[var(--text-dim)]">
                They have answered five either-ors about what they feel like. Answer five of your
                own and you both land on one dish that suits you both.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <a
                  href={`/decide/?with=${encodeURIComponent(code)}`}
                  onClick={() => track('add_to_cart', { page: 'together-invite' })}
                  className="inline-block rounded-full bg-[var(--amber)] px-8 py-3 font-semibold text-black hover:opacity-90"
                >
                  Answer mine
                </a>
              </div>
              <p className="mt-6 text-sm text-[var(--text-dim)]">
                About twenty seconds. Free, no sign-up, and neither of you sees the other’s answers
                — only the dish.
              </p>
            </>
          ) : (
            <>
              <h1 className="mt-5 text-4xl font-bold sm:text-5xl">That invitation has not survived</h1>
              <p className="mx-auto mt-4 max-w-md text-lg text-[var(--text-dim)]">
                Links get cut in half by the apps they travel through. Ask them to send it again —
                or have a go on your own, which takes about twenty seconds.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <a
                  href="/decide/"
                  className="inline-block rounded-full bg-[var(--amber)] px-8 py-3 font-semibold text-black hover:opacity-90"
                >
                  Play morsels45
                </a>
              </div>
            </>
          )}
        </div>
      </main>
    </PageShell>
  )
}
