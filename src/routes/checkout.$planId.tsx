import { createFileRoute, Link } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { loadWhop } from '@whop/elements'
import { Checkout, CheckoutElement, WhopElements } from '@whop/elements-react'
import { WhopClient } from '@whop/sdk'
import { useEffect, useState } from 'react'

import { PageShell } from '#/components/PageShell'
import { PREMIUM_ANNUAL_PLAN_ID, SELLABLE_PLAN_IDS } from '#/lib/products'
import { OFFER, PRICE_ANNUAL_VALUE, PRICE_VALUE, TAX_NOTE, pageHead, track } from '#/lib/site'
import { loadViewer } from '#/lib/viewer'

function whopClient() {
  return new WhopClient({
    token: process.env.WHOP_API_KEY ?? '',
    baseUrl: `${process.env.WHOP_API_ORIGIN ?? 'https://api.whop.com'}/api/v1`,
  })
}

// Asks Whop what is actually being bought — never trust the plan id in the
// URL for anything beyond mounting the right embed. Only Premium is sold here.
const loadPlan = createServerFn({ method: 'GET' })
  .inputValidator((input: { planId: string }) => input)
  .handler(async ({ data }) => {
    if (!SELLABLE_PLAN_IDS.includes(data.planId)) return null
    const plan = await whopClient()
      .plans.retrieve({ id: data.planId })
      .catch(() => null)
    if (!plan) return null
    const product = plan.product as { title?: string } | null
    return {
      title: product?.title ?? 'morsels45 Premium',
      formattedPrice: plan.formatted_price ?? null,
      planType: plan.plan_type,
      // Read from the plan rather than from a constant in this repo. This is
      // the page where somebody hands over a card, so what it promises has to
      // be what Whop is actually about to do — if the trial is ever taken off
      // the plan, this line stops claiming one on its own.
      trialDays: plan.trial_period_days ?? null,
    }
  })

export const Route = createFileRoute('/checkout/$planId')({
  loader: async ({ params }) => {
    const [viewer, plan] = await Promise.all([loadViewer(), loadPlan({ data: { planId: params.planId } })])
    return { viewer, plan }
  },
  head: ({ loaderData }) =>
    pageHead({
      title: loaderData?.plan ? `Checkout — ${loaderData.plan.title}` : 'Checkout — morsels45 Premium',
      description: `Start morsels45 Premium — ${OFFER}. The shared browser, extra modes, cook mode.`,
      ogTitle: 'Checkout — morsels45 Premium',
      noindex: true,
    }),
  component: CheckoutPage,
})

/*
 * WHY THIS IS @whop/elements AND NOT @whop/checkout ANY MORE.
 *
 * Payments failed with nothing on Whop's side to show for it — no failed
 * charge, no membership — while this page looked fine. The old embed hands
 * an off-site step (3D Secure, a bank page) back to `returnUrl` with a
 * `state_id` and expects that page to mount the embed again with it to
 * finish the purchase. Our return page never did: it said "You're in" and
 * the purchase was abandoned halfway. Since the seven-day trial came back,
 * the first checkout saves a card for later rather than charging it, which
 * is exactly what UK and EU banks challenge with 3D Secure — so it bit
 * nearly every buyer. The legacy embed docs now redirect to these Elements.
 *
 * The Checkout element drives the off-site step itself and always lands the
 * buyer on `returnUrl` with `status` (`succeeded`, `failed`, `canceled`) —
 * see order-complete.tsx, which branches on it. Nothing here grants access:
 * that stays a live check against Whop (lib/session.ts), so a hand-typed
 * `status=succeeded` unlocks nothing.
 */
const HOSTED_CHECKOUT = (planId: string) => `https://whop.com/checkout/${planId}`

function CheckoutPage() {
  const { planId } = Route.useParams()
  const { viewer, plan } = Route.useLoaderData()

  // The value on the event is what this checkout would actually charge. It
  // was PRICE_VALUE for every plan, which would have reported a year's
  // subscription as $4.99 the moment there was more than one thing to buy.
  const value = planId === PREMIUM_ANNUAL_PLAN_ID ? PRICE_ANNUAL_VALUE : PRICE_VALUE

  useEffect(() => {
    if (plan) track('view_content', { page: 'checkout', value, currency: 'USD' })
  }, [plan, value])

  // loadWhop() injects a <script>, and returnUrl needs window.location, so
  // neither can exist during server rendering. Not loaded at all when there
  // is no plan to sell: nothing would consume the load, so a failed one
  // surfaced as an uncaught error on the "Premium only" page.
  const [client, setClient] = useState<{ load: ReturnType<typeof loadWhop>; returnUrl: string } | null>(null)
  const [failed, setFailed] = useState(false)
  const hasPlan = plan !== null
  useEffect(() => {
    if (!hasPlan) return
    setClient({
      load: loadWhop(),
      returnUrl: `${window.location.origin}/order-complete?plan=${encodeURIComponent(planId)}`,
    })
  }, [planId, hasPlan])

  if (!plan) {
    return (
      <PageShell user={viewer.user}>
        <main className="flex flex-1 items-center justify-center px-6 py-20 text-center fade-in-up">
          <div>
            <h1 className="text-2xl font-bold">This checkout is Premium only</h1>
            <p className="mt-2 text-[var(--text-dim)]">
              Standard is free and does not go through checkout — everything you do not eat is
              free with it. The shared browser and the extra modes are on Premium.
            </p>
            <Link
              to="/premium"
              className="mt-6 inline-block rounded-full bg-[var(--amber)] px-8 py-3 font-semibold text-black hover:opacity-90"
            >
              See Premium
            </Link>
          </div>
        </main>
      </PageShell>
    )
  }

  return (
    <PageShell user={viewer.user}>
      <main className="py-12 fade-in-up">
        <div className="mx-auto max-w-xl px-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-[var(--amber)]">Checkout</p>
          <h1 className="mt-2 text-3xl font-bold">{plan.title}</h1>
          {plan.trialDays ? (
            <p className="mt-1 text-lg font-semibold">
              Free for {plan.trialDays} {plan.trialDays === 1 ? 'day' : 'days'}
              {plan.formattedPrice ? (
                <span className="font-normal text-[var(--text-dim)]">, then {plan.formattedPrice}</span>
              ) : null}
            </p>
          ) : plan.formattedPrice ? (
            <p className="mt-1 text-[var(--text-dim)]">{plan.formattedPrice}</p>
          ) : null}
          <p className="mt-4 text-sm text-[var(--text-dim)]">
            {plan.trialDays
              ? `Nothing is charged today. Cancel any time in the ${plan.trialDays} days and you pay nothing. `
              : ''}
            Nothing to redeem afterward — sign back in on this device, or any other, and it is
            already unlocked.
          </p>
          <p className="mt-2 text-sm text-[var(--text-dim)]">{TAX_NOTE}</p>

          <div className="mt-8 overflow-hidden rounded-2xl border border-[var(--border)]">
            {failed ? (
              <div className="p-10 text-center">
                <p className="font-semibold">The checkout would not load here.</p>
                <p className="mt-2 text-sm text-[var(--text-dim)]">
                  Nothing was charged. The same plan, at the same price, checks out on Whop directly.
                </p>
                <a
                  href={HOSTED_CHECKOUT(planId)}
                  target="_top"
                  className="mt-6 inline-block rounded-full bg-[var(--amber)] px-6 py-3 font-semibold text-black hover:opacity-90"
                >
                  Check out on Whop
                </a>
              </div>
            ) : client ? (
              <WhopElements
                elements={client.load}
                appearance={{ theme: { appearance: 'dark', accentColor: 'amber' } }}
                onLoadError={(error) => {
                  console.error('checkout: Whop Elements failed to load', error)
                  setFailed(true)
                }}
              >
                <Checkout plan={planId} returnUrl={client.returnUrl}>
                  <CheckoutElement
                    fallback={<div className="p-10 text-center text-[var(--text-dim)]">Loading checkout…</div>}
                    onError={(error) => {
                      console.error('checkout: element error', error.code, error.message)
                      setFailed(true)
                    }}
                  />
                </Checkout>
              </WhopElements>
            ) : (
              <div className="p-10 text-center text-[var(--text-dim)]">Loading checkout…</div>
            )}
          </div>
          {/* Always there, not only on an error the element reports: a buyer
              whose payment is going wrong in some way nobody anticipated still
              has a route to paying that is Whop's own page end to end. */}
          {failed ? null : (
            <p className="mt-4 text-center text-xs text-[var(--text-dim)]">
              Trouble paying?{' '}
              <a href={HOSTED_CHECKOUT(planId)} target="_top" className="underline underline-offset-4">
                Check out on Whop instead
              </a>
            </p>
          )}
        </div>
      </main>
    </PageShell>
  )
}
