import { createFileRoute, Link } from '@tanstack/react-router'

import { PageShell } from '#/components/PageShell'
import { loadViewer } from '#/lib/viewer'
import { PREMIUM_PLAN_ID } from '#/lib/products'
import { pageHead } from '#/lib/site'

export const Route = createFileRoute('/account')({
  loader: () => loadViewer(),
  head: () =>
    pageHead({
      path: '/account',
      title: 'Your account — morsels45',
      noindex: true,
    }),
  component: AccountPage,
})

function AccountPage() {
  const viewer = Route.useLoaderData()

  return (
    <PageShell user={viewer.user}>
      <main className="py-16 fade-in-up">
        <div className="mx-auto max-w-xl px-6">
          <h1 className="text-3xl font-bold">Account</h1>

          {!viewer.signedIn ? (
            <div className="mt-8 rounded-2xl border border-[var(--border)] p-8 text-center">
              <p className="text-[var(--text-dim)]">Sign in to see what's unlocked on this account.</p>
              <a
                href="/api/oauth/login?redirect_to=%2Faccount"
                className="mt-6 inline-block rounded-full bg-[var(--amber)] px-6 py-3 font-semibold text-black hover:opacity-90 hover:scale-105 active:scale-95"
              >
                Sign in with Whop
              </a>
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
                {viewer.hasPremium ? (
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
