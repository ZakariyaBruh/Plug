import { createFileRoute, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { useState } from 'react'

import { PageShell } from '#/components/PageShell'
import { loadViewer } from '#/lib/viewer'
import { checkProductAccess } from '#/lib/session'
import { PREMIUM_PLAN_ID, PREMIUM_PRODUCT_ID } from '#/lib/products'
import { referralStats } from '#/lib/referrals'
import { SITE_URL, pageHead } from '#/lib/site'

/*
 * Its own server function rather than folded into loadViewer: loadViewer
 * runs on every page on the site, and a referral lookup is only ever useful
 * on this one. See lib/referrals.ts for what it actually means.
 */
const loadReferral = createServerFn({ method: 'GET' }).handler(async () => {
  const { signedIn, user } = await checkProductAccess(PREMIUM_PRODUCT_ID)
  if (!signedIn || !user) return null
  const stats = await referralStats(user.sub)
  return { link: `${SITE_URL}/decide/?ref=${user.sub}`, ...stats }
})

export const Route = createFileRoute('/account')({
  loader: async () => {
    const [viewer, referral] = await Promise.all([loadViewer(), loadReferral()])
    return { viewer, referral }
  },
  head: () =>
    pageHead({
      path: '/account',
      title: 'Your account — morsels45',
      noindex: true,
    }),
  component: AccountPage,
})

function InviteCard({ referral }: { referral: { link: string; invited: number; qualified: number; bonusUntil: string | null } }) {
  const [copied, setCopied] = useState(false)

  return (
    <div className="rounded-2xl border border-[var(--border)] p-6">
      <p className="text-sm text-[var(--text-dim)]">Invite a friend, earn a day of Premium</p>
      <p className="mt-2 text-sm text-[var(--text-dim)]">
        Send this link. Once they sign in and play for ten minutes, you get a day of Premium — no
        limit on how many friends.
      </p>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard?.writeText(referral.link).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 1600)
          })
        }}
        className="mt-4 block w-full break-words rounded-lg border border-dashed border-[var(--amber)] px-4 py-2 text-left font-mono text-xs hover:bg-[var(--amber-soft)]"
      >
        {referral.link}
      </button>
      {copied ? <p className="mt-1 text-xs text-[var(--amber)]">Copied</p> : null}
      <p className="mt-4 text-sm text-[var(--text-dim)]">
        {referral.invited === 0
          ? 'Nobody has used your link yet.'
          : `${referral.qualified} of ${referral.invited} invited friend${referral.invited === 1 ? '' : 's'} have played long enough to earn you a day.`}
      </p>
      {referral.bonusUntil ? (
        <p className="mt-2 text-sm font-semibold text-[var(--amber)]">
          Free Premium active until {new Date(referral.bonusUntil).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}.
        </p>
      ) : null}
    </div>
  )
}

function AccountPage() {
  const { viewer, referral } = Route.useLoaderData()

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
                ) : viewer.hasPremium ? (
                  <>
                    <p className="mt-1 text-lg font-semibold text-[var(--amber)]">
                      Active — free, from referrals
                    </p>
                    <p className="mt-2 text-sm text-[var(--text-dim)]">
                      Not a subscription, so there is nothing to manage or cancel. It runs out on its
                      own unless more friends qualify.
                    </p>
                    <a
                      href="/decide/"
                      className="mt-4 inline-block text-sm font-semibold text-[var(--amber)] underline"
                    >
                      Play now
                    </a>
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

              {referral ? <InviteCard referral={referral} /> : null}

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
