import { createFileRoute, Link } from '@tanstack/react-router'

import { PageShell } from '#/components/PageShell'
import { pageHead } from '#/lib/site'
import { loadViewer } from '#/lib/viewer'

type Search = { status?: 'success' | 'error' }

export const Route = createFileRoute('/order-complete')({
  validateSearch: (search: Record<string, unknown>): Search => ({
    status: search.status === 'error' ? 'error' : 'success',
  }),
  loader: () => loadViewer(),
  head: () =>
    pageHead({
      path: '/order-complete',
      title: 'Order complete — morsels45',
      noindex: true,
    }),
  component: OrderComplete,
})

function OrderComplete() {
  const { status } = Route.useSearch()
  const viewer = Route.useLoaderData()
  const failed = status === 'error'

  return (
    <PageShell user={viewer.user}>
      <main className="flex items-center justify-center px-6 py-20 fade-in-up">
        <div className="max-w-md text-center">
          {failed ? (
            <>
              <h1 className="text-3xl font-bold">Payment didn't go through</h1>
              <p className="mt-3 text-[var(--text-dim)]">
                No charge was made. You can try again whenever you're ready.
              </p>
              <Link
                to="/premium"
                className="mt-8 inline-block rounded-full bg-[var(--amber)] px-6 py-3 font-semibold text-black hover:opacity-90 hover:scale-105 active:scale-95"
              >
                Try again
              </Link>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold">You're in 🎉</h1>
              <p className="mt-3 text-[var(--text-dim)]">
                It's already unlocked — no code to enter, nothing to activate. Sign back in with the
                same account any time and Premium is right there.
              </p>
              {viewer.user ? (
                <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                  <a
                    href="/decide/"
                    className="inline-block rounded-full bg-[var(--amber)] px-6 py-3 font-semibold text-black hover:opacity-90 hover:scale-105 active:scale-95"
                  >
                    Play now
                  </a>
                  <Link to="/account" className="text-sm text-[var(--text-dim)] underline underline-offset-4">
                    Go to your account
                  </Link>
                </div>
              ) : (
                <a
                  href="/api/oauth/login?redirect_to=%2Fdecide%2F"
                  className="mt-8 inline-block rounded-full bg-[var(--amber)] px-6 py-3 font-semibold text-black hover:opacity-90 hover:scale-105 active:scale-95"
                >
                  Sign in to activate
                </a>
              )}
            </>
          )}
        </div>
      </main>
    </PageShell>
  )
}
