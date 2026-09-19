import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import { WhopCheckoutEmbed } from '@whop/checkout/react'
import { WhopClient } from '@whop/sdk'
import { useEffect } from 'react'

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

function CheckoutPage() {
  const { planId } = Route.useParams()
  const { viewer, plan } = Route.useLoaderData()
  const navigate = useNavigate()

  // The value on the event is what this checkout would actually charge. It
  // was PRICE_VALUE for every plan, which would have reported a year's
  // subscription as $4.99 the moment there was more than one thing to buy.
  const value = planId === PREMIUM_ANNUAL_PLAN_ID ? PRICE_ANNUAL_VALUE : PRICE_VALUE

  useEffect(() => {
    if (plan) track('view_content', { page: 'checkout', value, currency: 'USD' })
  }, [plan, value])

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
            <WhopCheckoutEmbed
              planId={planId}
              theme="dark"
              themeOptions={{ accentColor: '#f2a93b', backgroundColor: '#151517' }}
              returnUrl={typeof window !== 'undefined' ? `${window.location.origin}/order-complete` : undefined}
              onComplete={() => {
                navigate({ to: '/order-complete', search: { status: 'success' } })
              }}
              fallback={<div className="p-10 text-center text-[var(--text-dim)]">Loading checkout…</div>}
            />
          </div>
        </div>
      </main>
    </PageShell>
  )
}
