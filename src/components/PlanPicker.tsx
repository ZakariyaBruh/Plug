import { Link } from '@tanstack/react-router'
import { useState } from 'react'

/*
 * Ids only, and from products.ts rather than from lib/household.ts — that
 * file talks to Whop with the app's API key and has no business anywhere near
 * a browser bundle.
 */
import {
  HOUSEHOLD_ANNUAL_PLAN_ID,
  HOUSEHOLD_MONTHLY_PLAN_ID,
  PREMIUM_ANNUAL_PLAN_ID,
  PREMIUM_PLAN_ID,
} from '#/lib/products'
import {
  ANNUAL_SAVING,
  HOUSEHOLD_SEATS,
  PRICE_ANNUAL,
  PRICE_ANNUAL_PER_MONTH,
  PRICE_ANNUAL_VALUE,
  PRICE_HOUSEHOLD_ANNUAL,
  PRICE_HOUSEHOLD_ANNUAL_VALUE,
  PRICE_HOUSEHOLD_MONTHLY,
  PRICE_HOUSEHOLD_PER_MONTH,
  PRICE_HOUSEHOLD_VALUE,
  PRICE_MONTHLY,
  PRICE_VALUE,
  TRIAL_DAYS,
  track,
} from '#/lib/site'

/*
 * ONE BUTTON, TWO SWITCHES.
 *
 * There are four things to buy — solo or household, yearly or monthly — and
 * four buttons on a page about not having to decide things would be a joke at
 * our own expense. So the switches carry the choice and the button stays
 * singular, reading out whichever of the four is selected.
 *
 * THE DEFAULTS ARE JUST ME, YEARLY. Most people buying this are buying it for
 * themselves, so "just me" is where it opens; yearly is preselected because it
 * is the cheaper of the two per month and the one worth having. Neither is
 * hidden and both alternatives print their own price, so nobody is being
 * walked past the option they came for.
 *
 * All four plans carry the same seven-day trial, which is why the button says
 * the same thing whatever is selected and only the line above it changes.
 */

const PLANS = {
  'solo-yearly': {
    id: PREMIUM_ANNUAL_PLAN_ID,
    value: PRICE_ANNUAL_VALUE,
    then: `then ${PRICE_ANNUAL} a year — ${PRICE_ANNUAL_PER_MONTH} a month, billed once`,
  },
  'solo-monthly': {
    id: PREMIUM_PLAN_ID,
    value: PRICE_VALUE,
    then: `then ${PRICE_MONTHLY}, cancel any time`,
  },
  'household-yearly': {
    id: HOUSEHOLD_ANNUAL_PLAN_ID,
    value: PRICE_HOUSEHOLD_ANNUAL_VALUE,
    then: `then ${PRICE_HOUSEHOLD_ANNUAL} a year for ${HOUSEHOLD_SEATS} — ${PRICE_HOUSEHOLD_PER_MONTH} a month, billed once`,
  },
  'household-monthly': {
    id: HOUSEHOLD_MONTHLY_PLAN_ID,
    value: PRICE_HOUSEHOLD_VALUE,
    then: `then ${PRICE_HOUSEHOLD_MONTHLY} for ${HOUSEHOLD_SEATS}, cancel any time`,
  },
} as const

function Switch({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: [string, string, string?][]
  value: string
  onChange: (next: string) => void
}) {
  return (
    <div
      className="inline-flex rounded-full border border-[var(--border)] bg-[var(--bg)] p-1"
      role="group"
      aria-label={label}
    >
      {options.map(([key, text, badge]) => (
        <button
          key={key}
          type="button"
          aria-pressed={value === key}
          onClick={() => onChange(key)}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${
            value === key
              ? 'bg-[var(--amber)] text-black'
              : 'text-[var(--text-dim)] hover:text-[var(--text)]'
          }`}
        >
          {text}
          {badge ? (
            <span className={value === key ? 'ml-2 opacity-70' : 'ml-2 text-[var(--amber)]'}>
              {badge}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  )
}

/*
 * `heading` is the "7 days free" line above the price. On by default, because
 * in a pricing card the picker is the only thing that says it — and off where
 * the page's own headline already does, which on the Premium hero had the
 * trial announced twice, a hand's width apart, in two different sizes.
 */
export function PlanPicker({
  size = 'lg',
  heading = true,
}: {
  size?: 'lg' | 'sm'
  heading?: boolean
}) {
  const [who, setWho] = useState<'solo' | 'household'>('solo')
  const [when, setWhen] = useState<'yearly' | 'monthly'>('yearly')

  const plan = PLANS[`${who}-${when}` as keyof typeof PLANS]
  const big = size === 'lg'

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <Switch
          label="Who it covers"
          value={who}
          onChange={(next) => setWho(next as 'solo' | 'household')}
          options={[
            ['solo', 'Just me'],
            ['household', `${HOUSEHOLD_SEATS} of us`],
          ]}
        />
        <Switch
          label="How to pay"
          value={when}
          onChange={(next) => setWhen(next as 'yearly' | 'monthly')}
          options={[
            // The saving is computed from the prices in site.ts, so this badge
            // cannot drift away from the numbers beside it.
            ['yearly', 'Yearly', `−${ANNUAL_SAVING}%`],
            ['monthly', 'Monthly'],
          ]}
        />
      </div>

      <p className={`mt-4 ${heading ? `font-bold ${big ? 'text-3xl' : 'text-2xl'}` : ''}`}>
        {heading ? `${TRIAL_DAYS} days free` : null}
        <span
          className={`block font-normal text-[var(--text-dim)] ${heading ? 'text-sm' : 'text-base'}`}
        >
          {plan.then}
        </span>
      </p>

      {who === 'household' ? (
        <p className="mt-2 max-w-sm text-sm text-[var(--text-dim)]">
          One subscription, {HOUSEHOLD_SEATS} accounts. You hand the second seat to whoever you
          eat with and they get their own tastes, their own rules and their own saved dishes.
        </p>
      ) : null}

      <Link
        to="/checkout/$planId"
        params={{ planId: plan.id }}
        onClick={() => track('add_to_cart', { value: plan.value, currency: 'USD', plan: `${who}-${when}` })}
        className={`mt-6 inline-block rounded-full bg-[var(--amber)] font-semibold text-black hover:opacity-90 ${
          big ? 'px-8 py-3' : 'px-6 py-3 text-sm'
        }`}
      >
        Start {TRIAL_DAYS} days free
      </Link>
    </div>
  )
}
