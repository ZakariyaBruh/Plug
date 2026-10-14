import { createFileRoute, Link } from '@tanstack/react-router'

import { PageShell } from '#/components/PageShell'
import { SELLABLE_PLAN_IDS } from '#/lib/products'
import { pageHead } from '#/lib/site'
import { loadViewer } from '#/lib/viewer'

/*
 * WHERE THE CHECKOUT ELEMENT SENDS THE BUYER — AND WHAT IT CANNOT PROVE.
 *
 * Whop lands every buyer here after an off-site step (3D Secure, a bank
 * page) whatever happened there, with `status` set to `succeeded`,
 * `failed` or `canceled`. This page used to read only `status=error`, so
 * a declined or abandoned payment arrived here and was told "You're in".
 *
 * The URL is a display hint and nothing more: anyone can type
 * `status=succeeded`. Whether to say "You're in" comes from the same live
 * access check the rest of the site uses (loadViewer -> Whop), which also
 * covers the case where the element redirects without a status at all.
 */
type Search = { status?: string; plan?: string }

export const Route = createFileRoute('/order-complete')({
  validateSearch: (search: Record<string, unknown>): Search => ({
    status: typeof search.status === 'string' ? search.status : undefined,
    plan: typeof search.plan === 'string' ? search.plan : undefined,
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

const button =
  'inline-block rounded-full bg-[var(--amber)] px-6 py-3 font-semibold text-black hover:opacity-90 hover:scale-105 active:scale-95'

function OrderComplete() {
  const { status, plan } = Route.useSearch()
  const viewer = Route.useLoaderData()
  const retryPlan = plan && SELLABLE_PLAN_IDS.includes(plan) ? plan : null

  // `error` is what this page's own old links used; keep honouring it.
  const failed = status === 'failed' || status === 'canceled' || status === 'error'

  return (
    <PageShell user={viewer.user}>
      <main className="flex items-center justify-center px-6 py-20 fade-in-up">
        <div className="max-w-md text-center">
          {failed ? (
            <>
              <h1 className="text-3xl font-bold">Payment didn&rsquo;t go through</h1>
              <p className="mt-3 text-[var(--text-dim)]">
                {status === 'canceled'
                  ? 'The payment was cancelled before it finished. Nothing was charged.'
                  : 'Your bank or card provider declined it. Nothing was charged.'}{' '}
                You can try again, or use a different card.
              </p>
              {retryPlan ? (
                <Link to="/checkout/$planId" params={{ planId: retryPlan }} className={`mt-8 ${button}`}>
                  Try again
                </Link>
              ) : (
                <Link to="/premium" className={`mt-8 ${button}`}>
                  Try again
                </Link>
              )}
            </>
          ) : viewer.hasPremium ? (
            <>
              <h1 className="text-3xl font-bold">You&rsquo;re in 🎉</h1>
              <p className="mt-3 text-[var(--text-dim)]">
                It&rsquo;s already unlocked — no code to enter, nothing to activate. Sign back in with
                the same account any time and Premium is right there.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <a href="/decide/" className={button}>
                  Play now
                </a>
                <Link to="/account" className="text-sm text-[var(--text-dim)] underline underline-offset-4">
                  Go to your account
                </Link>
              </div>
            </>
          ) : !viewer.signedIn ? (
            <>
              <h1 className="text-3xl font-bold">One step left</h1>
              <p className="mt-3 text-[var(--text-dim)]">
                Sign in with the Whop account you just checked out with, and Premium switches on
                there and on every device you sign into.
              </p>
              <a href="/api/oauth/login?redirect_to=%2Forder-complete" target="_top" className={`mt-8 ${button}`}>
                Sign in to activate
              </a>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold">Confirming your payment</h1>
              <p className="mt-3 text-[var(--text-dim)]">
                Whop hasn&rsquo;t told us it went through yet — usually that takes a few seconds. If it
                still says this in a minute, the payment didn&rsquo;t complete and nothing was charged.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <a href="/order-complete" className={button}>
                  Check again
                </a>
                <Link to="/premium" className="text-sm text-[var(--text-dim)] underline underline-offset-4">
                  Back to Premium
                </Link>
              </div>
              <p className="mt-6 text-xs text-[var(--text-dim)]">
                Paid with a different Whop account? Sign out and sign in with that one.
              </p>
            </>
          )}
        </div>
      </main>
    </PageShell>
  )
}
