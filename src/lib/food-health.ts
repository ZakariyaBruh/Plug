/*
 * The product fields the verdict reads — the same names Open Food Facts
 * uses, so /api/scan can hand its product straight in.
 */
export type OffProduct = {
  nutriments?: Record<string, number | string>
  nutrient_levels?: Record<string, string>
  categories_tags?: string[]
  serving_size?: string
  serving_quantity?: number | string
  nutriscore_grade?: string
  nova_group?: number
}

/*
 * HOW HEALTHY IS IT, IN WORDS ANYBODY CAN USE.
 *
 * People scanning a packet want one answer — is this good for me? — and
 * then the reason in plain words. So:
 *
 *   A verdict: "A healthy choice", "Fine now and then" or "Best as a
 *   treat", with a score out of 100. It starts from the product's
 *   Nutri-Score (the A-to-E grade printed on packets across Europe, worked
 *   out from sugar, salt, fat, fibre, protein and fruit and veg), and is
 *   docked for ultra-processing. With no Nutri-Score it is worked out from
 *   the traffic lights below.
 *
 *   Traffic lights for fat, saturated fat, sugar and salt — the UK
 *   front-of-pack scheme, so the colours match what is on British packets —
 *   using Open Food Facts' own levels where it has them and the Food
 *   Standards Agency's thresholds per 100 g (or 100 ml for drinks) where it
 *   does not. Each with a sentence a person can picture: sugar in
 *   teaspoons, salt as a share of the most you should have in a day.
 */
type Level = 'low' | 'moderate' | 'high'
const FSA: Record<string, { food: [number, number]; drink: [number, number] }> = {
  fat: { food: [3, 17.5], drink: [1.5, 8.75] },
  'saturated-fat': { food: [1.5, 5], drink: [0.75, 2.5] },
  sugars: { food: [5, 22.5], drink: [2.5, 11.25] },
  salt: { food: [0.3, 1.5], drink: [0.3, 0.75] },
}
const GRADE_SCORE: Record<string, number> = { a: 90, b: 72, c: 55, d: 35, e: 15 }
const LABEL: Record<string, string> = { fat: 'Fat', 'saturated-fat': 'Saturated fat', sugars: 'Sugar', salt: 'Salt' }
const TEASPOON_SUGAR_G = 4
const DAILY_SALT_G = 6

function levelOf(key: string, amount: number | null, given: string | undefined, drink: boolean): Level | null {
  if (given === 'low' || given === 'moderate' || given === 'high') return given
  if (amount === null) return null
  const [low, high] = FSA[key][drink ? 'drink' : 'food']
  return amount <= low ? 'low' : amount > high ? 'high' : 'moderate'
}

function round1(n: number) {
  return Math.round(n * 10) / 10
}

export function health(p: OffProduct) {
  const n = p.nutriments ?? {}
  const drink = (p.categories_tags ?? []).includes('en:beverages')
  const unit = drink ? 'ml' : 'g'
  const per = drink ? '100 ml' : '100 g'
  const amount = (key: string) => {
    const v = Number(n[`${key}_100g`])
    return Number.isFinite(v) && n[`${key}_100g`] !== '' && n[`${key}_100g`] !== undefined ? v : null
  }
  const serving = Number(p.serving_quantity)
  const hasServing = Number.isFinite(serving) && serving > 0 && serving < 2000

  const lights = (['sugars', 'fat', 'saturated-fat', 'salt'] as const).flatMap((key) => {
    const a = amount(key)
    const level = levelOf(key, a, p.nutrient_levels?.[key], drink)
    if (!level || a === null) return []
    let plain = `${round1(a)} g in ${per}`
    if (key === 'sugars') {
      const spoons = Math.round(a / TEASPOON_SUGAR_G)
      plain += spoons >= 1 ? ` — about ${spoons} teaspoon${spoons === 1 ? '' : 's'} of sugar` : ' — less than a teaspoon of sugar'
      if (hasServing) {
        const each = Math.round((a * serving) / 100 / TEASPOON_SUGAR_G)
        if (each >= 1) plain += `. One ${Math.round(serving)} ${unit} serving has about ${each}`
      }
    }
    if (key === 'salt') {
      const share = Math.round((a / DAILY_SALT_G) * 100)
      plain += share >= 1 ? ` — ${share}% of the most you should have in a whole day` : ' — hardly any'
    }
    return [{ key, label: LABEL[key], level, plain }]
  })

  const fibre = amount('fiber')
  const protein = amount('proteins')
  const kcal = amount('energy-kcal')
  const goods: string[] = []
  if (fibre !== null && fibre >= 6) goods.push('high in fibre')
  else if (fibre !== null && fibre >= 3) goods.push('a source of fibre')
  if (protein !== null && protein >= 12) goods.push('high in protein')

  const grade = /^[a-e]$/.test(p.nutriscore_grade ?? '') ? p.nutriscore_grade! : null
  let score: number | null = grade ? GRADE_SCORE[grade] : null
  if (score === null && lights.length >= 3) {
    score = 75
    for (const l of lights) score -= l.level === 'high' ? 15 : l.level === 'moderate' ? 5 : 0
    score += goods.length * 5
  }
  const nova = typeof p.nova_group === 'number' ? p.nova_group : null
  if (score !== null) {
    if (nova === 4) score -= 8
    if (nova === 1) score += 5
    score = Math.max(3, Math.min(98, Math.round(score)))
  }

  const verdict = score === null ? 'unknown' : score >= 68 ? 'good' : score >= 42 ? 'ok' : 'treat'
  const title = { good: 'A healthy choice', ok: 'Fine now and then', treat: 'Best as an occasional treat', unknown: 'Not enough information to judge' }[verdict]

  const words = (level: Level) => lights.filter((l) => l.level === level).map((l) => l.label.toLowerCase())
  const list = (items: string[]) => (items.length > 1 ? items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1] : items[0] ?? '')
  const highs = words('high')
  const mediums = words('moderate')
  const lows = words('low')
  // Short sentences, one idea each: "High in sugar and fat. Ultra-processed."
  const sentences: string[] = []
  if (highs.length) sentences.push(`High in ${list(highs)}.`)
  if (!highs.length && mediums.length) sentences.push(`Medium amounts of ${list(mediums)}.`)
  if (!highs.length && lows.length >= 3 && !mediums.length) sentences.push(`Low in ${list(lows)}.`)
  if (goods.length) sentences.push(list(goods).replace(/^./, (c) => c.toUpperCase()) + '.')
  if (nova === 4) sentences.push('Ultra-processed.')
  let summary = sentences.join(' ')
  if (verdict === 'unknown') {
    summary = lights.length
      ? 'There is not enough on record for an overall score, but here is what is known. Check the label for the rest.'
      : 'Open Food Facts does not have the nutrition details for this product yet. Check the label on the packet.'
  }

  const processing =
    nova === 4
      ? 'Ultra-processed: made in a factory, usually with ingredients you would not find in a kitchen — like flavourings, sweeteners or emulsifiers. Fine sometimes; better not every day.'
      : nova === 3
        ? 'Processed: ordinary foods with salt, sugar or oil added, like tinned vegetables, cheese or fresh bread.'
        : nova === 2
          ? 'A cooking ingredient, like oil, butter, sugar or salt.'
          : nova === 1
            ? 'Unprocessed or barely processed — close to how it comes from nature.'
            : null

  return {
    score,
    verdict,
    title,
    summary,
    lights,
    goods,
    kcal: kcal !== null ? Math.round(kcal) : null,
    per,
    processing,
    grade: grade ? grade.toUpperCase() : null,
  }
}

