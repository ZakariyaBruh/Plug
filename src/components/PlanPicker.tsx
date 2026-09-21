import { Link } from '@tanstack/react-router'
import { useState } from 'react'

/*
 * Ids only, and from products.ts rather than from anywhere that talks to
 * Whop with the app's API key — none of that belongs in a browser bundle.
 */
import { PREMIUM_ANNUAL_PLAN_ID, PREMIUM_PLAN_ID } from '#/lib/products'
import {
  ANNUAL_SAVED,
  ANNUAL_SAVING,
  HOW_TO_LEAVE,
  PRICE_ANNUAL,
  PRICE_ANNUAL_IF_MONTHLY,
  PRICE_ANNUAL_PER_MONTH,
  PRICE_ANNUAL_VALUE,
  PRICE_MONTHLY,
  PRICE_VALUE,
  TRIAL_DAYS,
  track,
} from '#/lib/site'

/*
 * ONE BUTTON, ONE SWITCH.
 *
 * There were two switches and four things to buy, because a household plan
 * covering two people sat alongside the single one. Household is gone — see
 * the note in products.ts — so there are two plans, the same Premium billed
 * two ways, and one switch is the whole of the choice.
 *
 * THE DEFAULT IS YEARLY, and that is the loudest thing on this page. Most
 * people take whatever option requires no action; of every lever a pricing
 * page can pull, the default effect is the one with the strongest
 * replication behind it, and it is worth more than any amount of copy.
 *
 * It is also the one easiest to abuse, so: monthly sits on the same switch,
 * at the same size, one tap away, printing its own price in the same words.
 * A default you can see and change is a suggestion. A default hidden behind
 * a disclosure is a trick, and the difference is the whole of the ethics
 * here. See /honesty.
 *
 * Both plans carry the same seven-day trial, which is why the button says
 * the same thing either way and only the line above it changes.
 */

/*
 * WHAT EACH SAYS ABOUT ITSELF.
 *
 * Three fields rather than one sentence, because the yearly plan has an
 * anchor to print and the monthly one does not, and a single string cannot
 * be struck through in the middle.
 *
 * `anchor` is twelve payments at this product's own monthly price — the real
 * other way to buy the same thing, one tap away on the switch beside it.
 * That is the only kind of reference price allowed here; see /honesty.
 */
const PLANS = {
  yearly: {
    id: PREMIUM_ANNUAL_PLAN_ID,
    value: PRICE_ANNUAL_VALUE,
    price: `${PRICE_ANNUAL} a year`,
    anchor: `${PRICE_ANNUAL_IF_MONTHLY} if you paid monthly`,
    note: `${PRICE_ANNUAL_PER_MONTH} a month, billed once. You keep ${ANNUAL_SAVED}.`,
  },
  monthly: {
    id: PREMIUM_PLAN_ID,
    value: PRICE_VALUE,
    price: `${PRICE_MONTHLY}`,
    anchor: null,
    note: 'Cancel any time.',
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
  const [when, setWhen] = useState<'yearly' | 'monthly'>('yearly')

  const plan = PLANS[when]
  const big = size === 'lg'

  return (
    <div>
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

      <p className={`mt-4 ${heading ? `font-bold ${big ? 'text-3xl' : 'text-2xl'}` : ''}`}>
        {heading ? `${TRIAL_DAYS} days free` : null}
        <span
          className={`block font-normal text-[var(--text-dim)] ${heading ? 'text-sm' : 'text-base'}`}
        >
          {/* The price you pay, then the price you did not. The anchor is
              struck through and stays dim: it is a comparison, not an offer,
              and a struck-through number in the same weight as the live one
              is how a pricing page starts lying by typography. */}
          <b className="font-semibold text-[var(--text)]">then {plan.price}</b>
          {plan.anchor ? (
            <>
              {' · '}
              <s className="opacity-70">{plan.anchor}</s>
            </>
          ) : null}
        </span>
        <span className="block text-sm font-normal text-[var(--text-dim)]">{plan.note}</span>
      </p>

      <Link
        to="/checkout/$planId"
        params={{ planId: plan.id }}
        onClick={() => track('add_to_cart', { value: plan.value, currency: 'USD', plan: when })}
        className={`mt-6 inline-block rounded-full bg-[var(--amber)] font-semibold text-black hover:opacity-90 ${
          big ? 'px-8 py-3' : 'px-6 py-3 text-sm'
        }`}
      >
        Start {TRIAL_DAYS} days free
      </Link>

      {/* THE EXIT, BESIDE THE ASK.
          An easy way out is the most load-bearing trust signal on a page that
          wants a card — and a reader who cannot find one is right to assume
          the worst. Every clause is checkable: Account has one link, and so
          does the Premium strip inside the game. */}
      <p className="mt-3 max-w-sm text-xs text-[var(--text-dim)]">{HOW_TO_LEAVE}</p>
    </div>
  )
}
