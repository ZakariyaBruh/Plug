import { createFileRoute, Link } from '@tanstack/react-router'
import { useEffect, useState } from 'react'

import { PageShell } from '#/components/PageShell'
import { loadViewer } from '#/lib/viewer'
import { PREMIUM_PLAN_ID } from '#/lib/products'
import { pageHead } from '#/lib/site'

export const Route = createFileRoute('/account')({
  loader: async () => ({ viewer: await loadViewer() }),
  head: () =>
    pageHead({
      path: '/account',
      title: 'Your account — morsels45',
      noindex: true,
    }),
  component: AccountPage,
})

/*
 * Read after load rather than through the router's search params: the flag
 * comes from the sign-in callback (lib/oauth.ts) and is wiped from the
 * address at once, so a reload does not say it again.
 */
function useSignInFailed() {
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('signin') !== 'failed') return
    setFailed(true)
    params.delete('signin')
    const rest = params.toString()
    window.history.replaceState(null, '', window.location.pathname + (rest ? `?${rest}` : ''))
  }, [])
  return failed
}

function AccountPage() {
  const { viewer } = Route.useLoaderData()
  const signInFailed = useSignInFailed()

  return (
    <PageShell user={viewer.user}>
      <main className="py-16 fade-in-up">
        <div className="mx-auto max-w-xl px-6">
          <h1 className="text-3xl font-bold">Account</h1>

          {signInFailed && !viewer.signedIn ? (
            <div role="alert" className="mt-6 rounded-2xl border-2 border-[var(--amber)] p-5">
              <p className="font-semibold">Sign-in did not finish</p>
              <p className="mt-2 text-[var(--text-dim)]">
                Nothing is wrong with your account. Please try once more with the button below. If
                it stops again, open morsels45-app.whop.site in your phone's own web browser (Safari
                or Chrome) and sign in there.
              </p>
            </div>
          ) : null}

          {!viewer.signedIn ? (
            <div className="mt-8 rounded-2xl border border-[var(--border)] p-8">
              <p className="text-center text-[var(--text-dim)]">
                Free, and nothing to pay for — here's what an account actually gets you.
              </p>

              <dl className="mt-6 space-y-5">
                <div>
                  <dt className="font-semibold">Your plan, recipes and daily check-ins</dt>
                  <dd className="mt-1 text-sm text-[var(--text-dim)]">
                    The meal planner and your daily check-ins are kept with your account, so they
                    are the same on your phone and your computer.
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold">Works on any device you sign into</dt>
                  <dd className="mt-1 text-sm text-[var(--text-dim)]">
                    Sign in anywhere and it is already there. Premium, if you have it, comes with
                    you.
                  </dd>
                </div>
              </dl>

              <div className="mt-8 text-center">
                <a
                  href="/api/oauth/login?redirect_to=%2Faccount"
                  className="inline-block rounded-full bg-[var(--amber)] px-6 py-3 font-semibold text-black hover:opacity-90 hover:scale-105 active:scale-95"
                >
                  Sign in with Whop
                </a>
                <p className="mt-3 text-xs text-[var(--text-dim)]">
                  Free. No card, and nothing about this is a subscription.
                </p>
              </div>
            </div>
          ) : (
            <div className="mt-8 space-y-6">
              <div className="rounded-2xl border border-[var(--border)] p-6">
                <p className="text-sm text-[var(--text-dim)]">Signed in as</p>
                <p className="mt-1 text-lg font-semibold">
                  {viewer.user?.preferred_username ?? viewer.user?.name ?? 'your account'}
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--border)] p-6">
                <p className="text-sm text-[var(--text-dim)]">Premium</p>
                {viewer.isMember ? (
                  <>
                    <p className="mt-1 text-lg font-semibold text-[var(--amber)]">Active</p>
                    <p className="mt-2 text-sm text-[var(--text-dim)]">
                      Already unlocked on this account — nothing was ever redeemed.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-4">
                      <a
                        href="/decide/"
                        className="text-sm font-semibold text-[var(--amber)] underline"
                      >
                        Play now
                      </a>
                      <a
                        href="https://whop.com/@me/settings/memberships/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-[var(--amber)] underline"
                      >
                        Manage or cancel your subscription
                      </a>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="mt-1 text-lg font-semibold">Not active</p>
                    <Link
                      to="/checkout/$planId"
                      params={{ planId: PREMIUM_PLAN_ID }}
                      className="mt-4 inline-block rounded-full bg-[var(--amber)] px-6 py-3 text-sm font-semibold text-black hover:opacity-90 hover:scale-105 active:scale-95"
                    >
                      Upgrade to Premium
                    </Link>
                  </>
                )}
              </div>

              <a
                href="/api/oauth/logout"
                className="inline-block text-sm text-[var(--text-dim)] underline hover:text-[var(--text)]"
              >
                Sign out
              </a>
            </div>
          )}
        </div>
      </main>
    </PageShell>
  )
}
