/*
 * ONE WAY TO ASK GEMINI, SHARED BY EVERY AI ROUTE.
 *
 * The chat had a careful version of this and the menu, the suggestion and the
 * daily shelf each had a single fetch with no second chance — so the three of
 * them failed outright on exactly the draws the chat survived.
 *
 * WHY TWO ATTEMPTS, OVERLAPPED. The wait is never generation: first token and
 * last arrive about a hundred milliseconds apart. What varies is whether a
 * request starts at all. The free tier is oversubscribed, and a request that
 * loses the draw hangs and then answers 503 "high demand" — or just hangs. So
 * a second attempt starts as soon as the first has failed or has been quiet
 * for STAGGER_MS, and the first real answer wins. Two and not more: retries
 * cost quota, and three attempts each for a burst of questions got every one
 * refused with 429 where two answered every time.
 *
 * WHY THE SECOND ATTEMPT IS A DIFFERENT MODEL. Overload is per model. The old
 * second attempt asked the same one again, so on a bad afternoon both went
 * into the same queue and both timed out — ten in a row on 23 September,
 * every one "no attempt answered", while a different flash-lite model was
 * answering the same key in a few seconds. Benchmarked from here on 24
 * September: 3.5 Flash-Lite 6/6 at ~0.9s, 3.1 Flash-Lite 5/6 at 2.5–5s,
 * 3.5 Flash 6/6 but 10–13s (too slow to be the backup), 3.8 Flash 1/6.
 */
export const GEMINI_MODELS = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite'] as const

const STAGGER_MS = 2500
const ATTEMPT_MS = 10000
const TIMEOUT_MS = 12000

const endpoint = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`

export type GeminiResult = {
  /** The winning response, body unread — or null if nothing answered. */
  res: Response | null
  /** The last refusal's status (e.g. 429, 503), or 0 for a timeout. */
  lastStatus: number
}

export async function askGemini(key: string, body: string, label: string): Promise<GeminiResult> {
  const running: AbortController[] = []
  let winner: AbortController | null = null
  let lastStatus = 0

  // Never the winner's own controller: aborting that cancels the body the
  // caller is about to read, which looks exactly like an empty answer.
  const stopOthers = (keep?: AbortController | null) => {
    for (const c of running) if (c !== keep) c.abort()
  }

  const attempt = async (model: string): Promise<Response> => {
    const control = new AbortController()
    running.push(control)
    const timer = setTimeout(() => control.abort(), ATTEMPT_MS)
    try {
      const res = await fetch(endpoint(model), {
        method: 'POST',
        signal: control.signal,
        headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' },
        body,
      })
      // A refusal is not an answer: thrown, so the other attempt can still win.
      if (!res.ok) {
        lastStatus = res.status
        throw new Error(`${model} ${res.status}`)
      }
      if (!winner) {
        winner = control
        stopOthers(control)
      }
      return res
    } finally {
      clearTimeout(timer)
    }
  }

  const first = attempt(GEMINI_MODELS[0])
  // The backup starts at whichever comes first: the stagger, or the first
  // attempt failing. Waiting out the stagger after a fast 503 was dead time.
  const backup = new Promise<void>((resolve) => {
    const t = setTimeout(resolve, STAGGER_MS)
    first.catch(() => {
      clearTimeout(t)
      resolve()
    })
  }).then(() => {
    if (winner) throw new Error('already answered')
    return attempt(GEMINI_MODELS[1])
  })

  const capped = new Promise<null>((r) => setTimeout(() => r(null), TIMEOUT_MS))
  const res = await Promise.race([Promise.any([first, backup]).catch(() => null), capped])
  stopOthers(winner)
  if (!res) {
    console.error(`${label}: no attempt answered`, lastStatus ? 'last status ' + lastStatus : 'timed out')
  }
  return { res, lastStatus }
}
