/*
 * THE FREE MODELS: LLM7 AND POLLINATIONS. NEITHER NEEDS A KEY, AND NOTHING HERE
 * EVER FALLS THROUGH TO THE PAID ONE.
 *
 * Advanced is Gemini, paid for out of this app's own key and kept for Premium.
 * Standard — the three free questions a day — and Dot's answers about the app run
 * here instead, so they cost this app nothing.
 *
 * WHAT WAS WRONG, MEASURED. It raced two services, Pollinations first and a
 * coding model on LLM7 as the backup, which only started after eight silent
 * seconds. Probed directly, Pollinations took 6 to 16 seconds for one sentence
 * and LLM7 took under a second to three, and the "backup" was Codestral, a model
 * for writing code. So the slow service was the main road, the fast one was the
 * emergency exit, and when both hiccuped together the visitor was told to ask
 * again.
 *
 * WHAT IT IS NOW:
 *   1. LLM7's gpt-oss:20b first. It is the same model Pollinations serves, about
 *      two to three seconds, and it is free (LLM7 marks its non-"pro" models as not
 *      usage-based; the pro ones are paid and are not used).
 *   2. If it has not answered in a few seconds, or fails at once, the next joins the
 *      race rather than replacing it: a small fast model (mistral-Nemo), then
 *      Pollinations, then minimax and Codestral as last resorts. The first usable
 *      answer wins and the rest are cancelled.
 *   3. A service that has failed twice in a row is skipped for half a minute (and
 *      longer if it keeps failing), so a dead one stops costing everybody a wait.
 *      If every one is marked down they are all tried anyway.
 *   4. An answer has to look like one: not empty, not an error body, not a notice
 *      about a deprecated endpoint, and with any chain-of-thought stripped out.
 *   5. A first question asked word for word the same as one answered in the last ten
 *      minutes is answered from memory.
 *   If all of that fails, the caller can still answer from the app's own menu (see
 *   free-local.ts). Nothing is ever handed to Gemini.
 *
 * WHAT THIS IS AND IS NOT: free public services with no promise attached; they
 * can be slow, rate-limited, or gone, and this is a way of not minding. What is
 * sent is the conversation and the app's own instruction, never a name, an
 * address, or the taste profile the advanced assistant is given; the privacy page
 * says so. The memory is the worker's own and is lost when it restarts.
 *
 * Nothing a model says is trusted here: the answer is cleaned of the trailing
 * advert some free endpoints append, of markdown, and of reasoning, and capped.
 */
export type FreeTurn = { role: 'user' | 'model'; text: string }

type Endpoint = { name: string; url: string; model: string; headers: Record<string, string>; extra?: Record<string, unknown> }

const LLM7 = 'https://api.llm7.io/v1/chat/completions'
const KEYLESS = { Authorization: 'Bearer unused' }

// In the order they are tried. `reasoning_effort` goes to Pollinations only: LLM7 answers it with a 400.
export const ENDPOINTS: Endpoint[] = [
  { name: 'llm7:gpt-oss', url: LLM7, model: 'gpt-oss:20b', headers: KEYLESS },
  { name: 'llm7:nemo', url: LLM7, model: 'mistral-Nemo-Instruct-2407', headers: KEYLESS },
  { name: 'pollinations', url: 'https://text.pollinations.ai/openai', model: 'openai-fast', headers: {}, extra: { reasoning_effort: 'low' } },
  { name: 'llm7:minimax', url: LLM7, model: 'minimax-m2.7', headers: KEYLESS },
  { name: 'llm7:codestral', url: LLM7, model: 'codestral-latest', headers: KEYLESS },
]

const ATTEMPT_MS = 14000 // one service, however slow
const STAGGER_MS = 3500 // before the next one joins the race
const TOTAL_MS = 24000 // the whole thing
const DOWN_AFTER = 2 // failures in a row before a service is skipped
const DOWN_MS = 30_000 // ...for this long, doubling for each failure after that, to a limit
const CACHE_MS = 10 * 60_000
const CACHE_MAX = 300

/** Adverts, wrappers and reasoning the free endpoints sometimes add, and markdown the prompt asked not to get. */
export function cleanFreeAnswer(text: string): string {
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/\n+\s*(\*\*)?(powered by|support pollinations|sponsor|ad:)[\s\S]*$/i, '')
    .replace(/<[^>]{1,40}>/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .trim()
}

/** Whether an answer is not one: an error body, a deprecation notice, or nothing much. */
export function looksBad(text: string): boolean {
  if (text.length < 8) return true
  if (/^[{[]/.test(text)) return true
  if (text.length < 300 && /important notice|deprecated|no longer (supported|available)|rate.?limit|too many requests|api key|quota|unauthori[sz]ed|model .{0,30}not found/i.test(text)) return true
  return false
}

/* ---------------------------------------------------------------- health */
type Health = { fails: number; downUntil: number; lastMs: number | null }
const health = new Map<string, Health>()

function note(name: string, ok: boolean, ms: number, now = Date.now()) {
  const h = health.get(name) ?? { fails: 0, downUntil: 0, lastMs: null }
  if (ok) {
    h.fails = 0
    h.downUntil = 0
    h.lastMs = ms
  } else {
    h.fails += 1
    if (h.fails >= DOWN_AFTER) h.downUntil = now + Math.min(DOWN_MS * 2 ** (h.fails - DOWN_AFTER), 8 * DOWN_MS)
  }
  health.set(name, h)
}

function usable(name: string, now = Date.now()): boolean {
  const h = health.get(name)
  return !h || h.downUntil <= now
}

/** For a health check and for tests: which services are skipped right now. */
export function freeHealth(now = Date.now()) {
  return ENDPOINTS.map((e) => ({ name: e.name, down: !usable(e.name, now), fails: health.get(e.name)?.fails ?? 0, lastMs: health.get(e.name)?.lastMs ?? null }))
}

/* ----------------------------------------------------------------- memory */
const cache = new Map<string, { text: string; via: string; until: number }>()

function hash(text: string): string {
  let h = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return (h >>> 0).toString(36)
}

function cacheKey(system: string, turns: FreeTurn[], maxTokens: number, temperature?: number): string | null {
  // Only a first question: anything later depends on a conversation that is not the next person's.
  if (turns.length !== 1) return null
  return [hash(system), turns[0].text.toLowerCase().replace(/\s+/g, ' ').trim(), maxTokens, temperature ?? ''].join('|')
}

/** For tests. */
export function resetFreeAi() {
  health.clear()
  cache.clear()
}

/* --------------------------------------------------------------- one try */
async function attempt(ep: Endpoint, system: string, turns: FreeTurn[], maxTokens: number, temperature: number | undefined, signal: AbortSignal): Promise<string> {
  const timer = new AbortController()
  const stop = setTimeout(() => timer.abort(), ATTEMPT_MS)
  signal.addEventListener('abort', () => timer.abort(), { once: true })
  try {
    const res = await fetch(ep.url, {
      method: 'POST',
      signal: timer.signal,
      headers: { 'Content-Type': 'application/json', ...ep.headers },
      body: JSON.stringify({
        model: ep.model,
        messages: [
          { role: 'system', content: system },
          ...turns.map((t) => ({ role: t.role === 'model' ? 'assistant' : 'user', content: t.text })),
        ],
        max_tokens: maxTokens,
        temperature: temperature ?? 0.8,
        ...ep.extra,
      }),
    })
    if (!res.ok) throw new Error(`${ep.name} ${res.status}`)
    const data = (await res.json()) as { choices?: { message?: { content?: unknown } }[] }
    const raw = data?.choices?.[0]?.message?.content
    const text = typeof raw === 'string' ? cleanFreeAnswer(raw) : ''
    if (!text || looksBad(text)) throw new Error(`${ep.name} unusable`)
    return text
  } finally {
    clearTimeout(stop)
  }
}

/** The answer, or null if no free service gave a usable one in time. */
export async function askFree(
  system: string,
  turns: FreeTurn[],
  maxTokens = 600,
  temperature?: number,
): Promise<{ text: string; via: string } | null> {
  const key = cacheKey(system, turns, maxTokens, temperature)
  const now0 = Date.now()
  if (key) {
    const hit = cache.get(key)
    if (hit && hit.until > now0) return { text: hit.text, via: 'memory:' + hit.via }
  }

  // Skip the ones that have just failed, unless that would leave none.
  const live = ENDPOINTS.filter((e) => usable(e.name, now0))
  const eps = live.length ? live : ENDPOINTS
  const all = new AbortController()

  return new Promise((resolve) => {
    let settled = false
    let started = 0
    let pending = 0
    let nextTimer: ReturnType<typeof setTimeout> | undefined
    const cap = setTimeout(() => finish(null), TOTAL_MS)

    function finish(value: { text: string; via: string } | null) {
      if (settled) return
      settled = true
      clearTimeout(cap)
      clearTimeout(nextTimer)
      all.abort()
      resolve(value)
    }

    // Starts the next service. Called when the last one starts being slow, and at once
    // when one fails: a refusal in a quarter of a second is no reason to wait three seconds.
    function startNext() {
      if (settled) return
      clearTimeout(nextTimer)
      if (started >= eps.length) {
        if (pending === 0) finish(null)
        return
      }
      const ep = eps[started++]
      pending++
      const t0 = Date.now()
      attempt(ep, system, turns, maxTokens, temperature, all.signal).then(
        (text) => {
          note(ep.name, true, Date.now() - t0)
          if (key) {
            if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value as string)
            cache.set(key, { text, via: ep.name, until: Date.now() + CACHE_MS })
          }
          finish({ text, via: ep.name })
        },
        () => {
          // An abort because somebody else won is not this service's fault.
          if (!settled) note(ep.name, false, Date.now() - t0)
          pending--
          startNext()
        },
      )
      if (started < eps.length) nextTimer = setTimeout(startNext, STAGGER_MS)
    }

    startNext()
  })
}
