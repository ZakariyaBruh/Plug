import { Link } from '@tanstack/react-router'
import { useState } from 'react'

import { PREMIUM_ANNUAL_PLAN_ID, PREMIUM_PLAN_ID } from '#/lib/products'
import {
  ANNUAL_SAVING,
  PRICE_ANNUAL,
  PRICE_ANNUAL_PER_MONTH,
  PRICE_ANNUAL_VALUE,
  PRICE_MONTHLY,
  PRICE_VALUE,
  TRIAL_DAYS,
  track,
} from '#/lib/site'

/*
 * TWO WAYS TO PAY, PICKED BEFORE THE BUTTON RATHER THAN AFTER IT.
 *
 * There is one price on the page and one button under it. Adding a second
 * price could have meant a second button, which on a page about not having to
 * decide things is a poor look — so the choice is a two-item switch and the
 * button stays singular, reading out whichever one is selected.
 *
 * YEARLY IS PRESELECTED. It is the cheaper of the two per month and the one
 * worth having: a year up front against a monthly plan that the average
 * subscriber leaves inside half a year. Monthly is one tap away and says its
 * own price, so nobody is being walked past it.
 *
 * Both plans carry the same seven-day trial, which is why the button says the
 * same thing either way and the terms under it are the only part that changes.
 */
/*
 * `heading` is the "7 days free" line above the price. It is on by default,
 * because in a pricing card the picker is the only thing that says it — and
 * off where the page's own headline already does, which on the Premium hero
 * had the trial announced twice, a hand's width apart, in two different sizes.
 */
export function PlanPicker({
  size = 'lg',
  heading = true,
}: {
  size?: 'lg' | 'sm'
  heading?: boolean
}) {
  const [yearly, setYearly] = useState(true)

  const planId = yearly ? PREMIUM_ANNUAL_PLAN_ID : PREMIUM_PLAN_ID
  const value = yearly ? PRICE_ANNUAL_VALUE : PRICE_VALUE
  const big = size === 'lg'

  return (
    <div>
      <div
        className="inline-flex rounded-full border border-[var(--border)] bg-[var(--bg)] p-1"
        role="group"
        aria-label="How to pay"
      >
        {(
          [
            [true, 'Yearly'],
            [false, 'Monthly'],
          ] as const
        ).map(([isYear, label]) => (
          <button
            key={label}
            type="button"
            aria-pressed={yearly === isYear}
            onClick={() => setYearly(isYear)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${
              yearly === isYear
                ? 'bg-[var(--amber)] text-black'
                : 'text-[var(--text-dim)] hover:text-[var(--text)]'
            }`}
          >
            {label}
            {isYear ? (
              // The saving is computed from the two prices in site.ts, so this
              // badge cannot drift away from the numbers beside it.
              <span className={yearly ? 'ml-2 opacity-70' : 'ml-2 text-[var(--amber)]'}>
                −{ANNUAL_SAVING}%
              </span>
            ) : null}
          </button>
        ))}
      </div>

      <p className={`mt-4 ${heading ? `font-bold ${big ? 'text-3xl' : 'text-2xl'}` : ''}`}>
        {heading ? `${TRIAL_DAYS} days free` : null}
        <span
          className={`block font-normal text-[var(--text-dim)] ${heading ? 'text-sm' : 'text-base'}`}
        >
          {yearly ? (
            <>
              then {PRICE_ANNUAL} a year — {PRICE_ANNUAL_PER_MONTH} a month, billed once
            </>
          ) : (
            <>then {PRICE_MONTHLY}, cancel any time</>
          )}
        </span>
      </p>

      <Link
        to="/checkout/$planId"
        params={{ planId }}
        onClick={() =>
          track('add_to_cart', { value, currency: 'USD', plan: yearly ? 'yearly' : 'monthly' })
        }
        className={`mt-6 inline-block rounded-full bg-[var(--amber)] font-semibold text-black hover:opacity-90 ${
          big ? 'px-8 py-3' : 'px-6 py-3 text-sm'
        }`}
      >
        Start {TRIAL_DAYS} days free
      </Link>
    </div>
  )
}
