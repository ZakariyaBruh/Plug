import { today } from '#/lib/allowance'
import { RADIO_CATEGORIES } from '#/lib/radio'
import { TV_CATEGORIES } from '#/lib/tv'

/*
 * TODAY'S ONE FREE CHANNEL.
 *
 * TV and radio are Premium, with a single exception that changes daily: one
 * group, picked at random from every TV group and every radio group together,
 * is free to anybody signed in. Everything else needs Premium.
 *
 * "Random" is a hash of the UTC date rather than a roll of the dice, so it is
 * the same pick for everybody all day, the same on every server that answers,
 * and it needs nothing stored. It turns over at the same moment the daily
 * allowances do (see allowance.ts, today()).
 */
export type FreePick = { medium: 'tv' | 'radio'; id: string; name: string; emoji: string }

function pool(): FreePick[] {
  return [
    ...TV_CATEGORIES.map((c) => ({ medium: 'tv' as const, id: c.id, name: c.name, emoji: c.emoji })),
    ...RADIO_CATEGORIES.map((c) => ({ medium: 'radio' as const, id: c.id, name: c.name, emoji: c.emoji })),
  ]
}

// FNV-1a: small, dependency-free, and spreads consecutive dates well enough
// that tomorrow's pick is not predictable from today's.
function hash(text: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

export function freePick(day = today()): FreePick {
  const all = pool()
  return all[hash(day) % all.length]
}

export function isFree(medium: 'tv' | 'radio', category: string, day = today()): boolean {
  const pick = freePick(day)
  return pick.medium === medium && pick.id === category
}
