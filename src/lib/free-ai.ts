import { activeProviders, type Model, type Provider } from '#/lib/llm-providers'

/*
 * THE CALLING SYSTEM FOR EVERY MODEL THAT IS NOT THE PAID ONE.
 *
 * Advanced is Gemini, paid for out of this app's own key and kept for Premium.
 * Standard (the three free questions a day) and Dot's answers about the app run here
 * instead, on whichever free provider will take the call, and nothing here ever falls
 * through to Gemini.
 *
 * WHY IT WAS REDESIGNED. The first version raced five "endpoints" as if they were five
 * independent chances. They were two services, and the three-quarters of the traffic that
 * went to the larger one shared one limit, so racing its models against each other made
 * the limit trip: the same machine, ten questions in a row, got "Rate limit exceeded" and
 * "Too many concurrent requests for this client" on most calls, and Pollinations answered
 * 4 in 10 with 503s and timeouts. Everything a visitor shares is the server's address, so
 * a crowd is one client to those services. The fix is not more racing, it is a router that
 * knows what a limit is.
 *
 * HOW IT WORKS NOW.
 *   Providers, not endpoints. A provider is a service with a limit; it has models. The table
 *   is lib/llm-providers.ts and it is data. Keyed free tiers (Groq, Cerebras, Cloudflare,
 *   Mistral, OpenRouter, GitHub Models) switch on when their secret exists and go first; the
 *   keyless ones (LLM7, Pollinations) are the floor under them.
 *   One limit, kept. A 429 puts the whole provider on a cooldown for as long as it said
 *   (Retry-After), not just the model that heard it. "Too many concurrent" also lowers how
 *   many calls that provider is given at once, for a minute. A provider is never handed more
 *   than its own concurrency at the same time, across every visitor on this worker.
 *   Ordered by what has happened, not by a list. Each model carries an average of how long
 *   it has taken and how often it has failed; the order is that, plus the table's priority.
 *   Hedged across providers. The best is called; if it has not answered in about one and a
 *   half times its usual time (never less than two seconds), the best of a DIFFERENT provider
 *   joins. A failure starts the next at once. First usable answer wins, the rest are cancelled.
 *   Told apart. Rate limit: wait it out if it is short, move on if not. Bad key, retired
 *   model (401, 403, 404, 410, 400): out of rotation for half an hour. Overload and timeouts:
 *   two in a row and it rests, longer each time. Not an answer (empty, an error body, a
 *   deprecation notice): counted against the model.
 *   Remembered. A first question asked the same way in the last six hours is answered from
 *   memory; and if every provider fails, an answer up to two days old is better than none.
 *   Honest. The result says who answered and what it tried, and /api/ai-health shows the
 *   state of every provider (never a key).
 *
 * If all of that fails, the caller can still answer from the app's own menu (free-local.ts).
 *
 * WHAT IS SENT: the conversation and the app's own instruction, never a name, an address or
 * the taste profile the Advanced assistant is given; the privacy page says so. The memory is
 * the worker's own and is lost when it restarts. Nothing a model says is trusted: the answer
 * is cleaned of the trailing advert some free endpoints append, of markdown and of reasoning.
 */
export type FreeTurn = { role: 'user' | 'model'; text: string }
export type FreeResult = { text: string; via: string; ms: number; tried: Tried[] }
export type Tried = { via: string; ok: boolean; ms: number; why?: string }

type Env = Record<string, string | undefined>
type Lane = { key: string; provider: Provider; url: string; headers: Record<string, string>; model: Model; order: number }

const ATTEMPT_MS = 12000 // one call, however slow
const KEYED_ATTEMPT_MS = 8000 // a keyed free tier that has not answered in 8s is not going to
const TOTAL_MS = 24000 // the whole thing
const HEDGE_MIN_MS = 2000
const HEDGE_MAX_MS = 5000
const HEDGE_UNKNOWN_MS = 3500
const MAX_WAIT_MS = 5000 // the longest worth waiting for a rate limit to lift inside one question
const SOFT_DOWN_AFTER = 2 // failures in a row before a model rests
const SOFT_DOWN_MS = 30_000 // ...doubling for each one after that, to a limit
const HARD_DOWN_MS = 30 * 60_000 // a bad key or a retired model
const CACHE_FRESH_MS = 6 * 3600_000
const CACHE_STALE_MS = 48 * 3600_000
const CACHE_MAX = 600

const envNow = (): Env => (typeof process !== 'undefined' && process.env ? (process.env as Env) : {})

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

/* ---------------------------------------------------------------- state */
type LaneState = { fails: number; downUntil: number; ewma: number | null; lastMs: number | null; lastWhy: string; ok: number; bad: number }
type ProvState = { inflight: number; coolUntil: number; cap: number | null; capUntil: number }
const lanes = new Map<string, LaneState>()
const provs = new Map<string, ProvState>()

const laneState = (key: string): LaneState => {
  let s = lanes.get(key)
  if (!s) lanes.set(key, (s = { fails: 0, downUntil: 0, ewma: null, lastMs: null, lastWhy: '', ok: 0, bad: 0 }))
  return s
}
const provState = (id: string): ProvState => {
  let s = provs.get(id)
  if (!s) provs.set(id, (s = { inflight: 0, coolUntil: 0, cap: null, capUntil: 0 }))
  return s
}
const capOf = (p: Provider, now: number): number => {
  const s = provState(p.id)
  return s.cap !== null && s.capUntil > now ? Math.min(s.cap, p.maxConcurrent) : p.maxConcurrent
}

type Failure = { kind: 'rate' | 'auth' | 'gone' | 'soft' | 'bad'; why: string; retryMs?: number; concurrent?: boolean }

function noteOk(lane: Lane, ms: number) {
  const s = laneState(lane.key)
  s.fails = 0
  s.downUntil = 0
  s.lastMs = ms
  s.ewma = s.ewma === null ? ms : Math.round(s.ewma * 0.7 + ms * 0.3)
  s.lastWhy = ''
  s.ok += 1
}

function noteFail(lane: Lane, f: Failure, now: number) {
  const s = laneState(lane.key)
  const p = provState(lane.provider.id)
  s.lastWhy = f.why
  if (f.kind === 'rate') {
    // The provider's limit, not this model's: everything of theirs rests, for as long as they said.
    p.coolUntil = Math.max(p.coolUntil, now + Math.min(Math.max(f.retryMs ?? 5000, 1000), 60_000))
    if (f.concurrent) { p.cap = Math.max(1, Math.min(p.cap ?? lane.provider.maxConcurrent, lane.provider.maxConcurrent) - 1); p.capUntil = now + 120_000 }
    return
  }
  s.bad += 1
  // A key that is refused or has no credit is the provider's problem, not one model's: all of it rests.
  // (A keyless service that says 401 or 402 is usually saying "busy", so it rests for minutes, not half an hour.)
  if (f.kind === 'auth') { p.coolUntil = Math.max(p.coolUntil, now + (lane.provider.keyed ? HARD_DOWN_MS : 3 * 60_000)); return }
  if (f.kind === 'gone') { s.downUntil = now + HARD_DOWN_MS; return }
  s.fails += 1
  if (s.fails >= SOFT_DOWN_AFTER) s.downUntil = now + Math.min(SOFT_DOWN_MS * 2 ** (s.fails - SOFT_DOWN_AFTER), 8 * SOFT_DOWN_MS)
}

/** For a health check and for tests: what is resting right now, and why. */
export function freeHealth(now = Date.now(), env: Env = envNow()) {
  return activeProviders(env).flatMap(({ provider, models }) => {
    const p = provState(provider.id)
    return models.map((m) => {
      const key = `${provider.id}/${m.id}`
      const s = laneState(key)
      return {
        name: key, provider: provider.id, keyed: provider.keyed,
        down: s.downUntil > now, cooling: p.coolUntil > now, coolMs: Math.max(0, p.coolUntil - now), inflight: p.inflight, cap: capOf(provider, now),
        fails: s.fails, ok: s.ok, bad: s.bad, ewmaMs: s.ewma, lastMs: s.lastMs, why: s.lastWhy,
      }
    })
  })
}

/** What is configured, for the health route: ids only. */
export function freeProviders(env: Env = envNow()) {
  return activeProviders(env).map(({ provider, models }) => ({ id: provider.id, keyed: provider.keyed, models: models.map((m) => m.id) }))
}

/* ----------------------------------------------------------------- memory */
const cache = new Map<string, { text: string; via: string; at: number }>()

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
  const q = turns[0].text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim()
  return [hash(system), q, maxTokens, temperature ?? ''].join('|')
}

/** For tests. */
export function resetFreeAi() {
  lanes.clear()
  provs.clear()
  cache.clear()
}

/* --------------------------------------------------------------- one call */
async function call(lane: Lane, system: string, turns: FreeTurn[], maxTokens: number, temperature: number | undefined, signal: AbortSignal): Promise<{ text: string } | Failure> {
  const timer = new AbortController()
  const stop = setTimeout(() => timer.abort(), lane.provider.keyed ? KEYED_ATTEMPT_MS : ATTEMPT_MS)
  const onAbort = () => timer.abort()
  signal.addEventListener('abort', onAbort, { once: true })
  try {
    const res = await fetch(lane.url, {
      method: 'POST',
      signal: timer.signal,
      headers: { 'Content-Type': 'application/json', ...lane.headers },
      body: JSON.stringify({
        model: lane.model.id,
        messages: [
          { role: 'system', content: system },
          ...turns.map((t) => ({ role: t.role === 'model' ? 'assistant' : 'user', content: t.text })),
        ],
        max_tokens: maxTokens,
        temperature: temperature ?? 0.8,
        ...lane.model.extra,
      }),
    })
    if (!res.ok) {
      const body = await res.text().catch(() => '')
      if (res.status === 429) {
        const header = Number(res.headers.get('retry-after'))
        const said = body.match(/retry after (\d+) second/i)
        const retryMs = (Number.isFinite(header) && header > 0 ? header : said ? Number(said[1]) : 5) * 1000
        return { kind: 'rate', why: '429', retryMs, concurrent: /concurrent/i.test(body) }
      }
      if ([401, 402, 403].includes(res.status)) return { kind: 'auth', why: String(res.status) }
      if ([400, 404, 410].includes(res.status)) return { kind: 'gone', why: String(res.status) }
      return { kind: 'soft', why: String(res.status) }
    }
    const data = (await res.json().catch(() => null)) as { choices?: { message?: { content?: unknown } }[] } | null
    const raw = data?.choices?.[0]?.message?.content
    const text = typeof raw === 'string' ? cleanFreeAnswer(raw) : ''
    if (!text || looksBad(text)) return { kind: 'bad', why: 'unusable' }
    return { text }
  } catch (err) {
    return { kind: 'soft', why: signal.aborted ? 'cancelled' : (err as Error)?.name === 'AbortError' ? 'timeout' : 'network' }
  } finally {
    clearTimeout(stop)
    signal.removeEventListener('abort', onAbort)
  }
}

/* --------------------------------------------------------------- the plan */
function lanesFor(env: Env): Lane[] {
  const out: Lane[] = []
  for (const { provider, url, headers, models } of activeProviders(env)) {
    models.forEach((model, i) => out.push({ key: `${provider.id}/${model.id}`, provider, url, headers, model, order: i }))
  }
  return out
}

/** Lower is better: the table's priority, then what has happened to this model lately. */
function score(lane: Lane): number {
  const s = laneState(lane.key)
  return lane.provider.priority + lane.order * 2 + (s.ewma === null ? 1.5 : s.ewma / 1000) + s.fails * 4
}

/** Providers not yet used in this question come first, then the rest, each by score: a second call to a provider that has just failed or is slow is a worse hedge than a first to another. */
function ranked(all: Lane[], used: Set<string>): Lane[] {
  const sorted = [...all].sort((a, b) => score(a) - score(b))
  return sorted.filter((l) => !used.has(l.provider.id)).concat(sorted.filter((l) => used.has(l.provider.id)))
}

/**
 * The answer, or null if no provider gave a usable one in time. `tried` says what it asked and what came back.
 */
export async function askFree(
  system: string,
  turns: FreeTurn[],
  maxTokens = 600,
  temperature?: number,
  opts: { env?: Env; totalMs?: number } = {},
): Promise<FreeResult | null> {
  const env = opts.env ?? envNow()
  const total = opts.totalMs ?? TOTAL_MS
  const t0 = Date.now()
  const key = cacheKey(system, turns, maxTokens, temperature)
  const hit = key ? cache.get(key) : undefined
  if (hit && t0 - hit.at < CACHE_FRESH_MS) return { text: hit.text, via: 'memory:' + hit.via, ms: 0, tried: [] }

  const all = lanesFor(env)
  const tried: Tried[] = []
  const stale = () => (hit && t0 - hit.at < CACHE_STALE_MS ? { text: hit.text, via: 'stale:' + hit.via, ms: Date.now() - t0, tried } : null)
  if (!all.length) return stale()

  const abort = new AbortController()
  const started = new Set<string>()
  const usedProviders = new Set<string>()

  return new Promise<FreeResult | null>((resolve) => {
    let settled = false
    let running = 0
    let timer: ReturnType<typeof setTimeout> | undefined
    const cap = setTimeout(() => finish(null), total)

    function finish(value: FreeResult | null) {
      if (settled) return
      settled = true
      clearTimeout(cap)
      clearTimeout(timer)
      abort.abort()
      if (!value) console.error('free-ai: no provider answered', JSON.stringify(tried))
      resolve(value ?? stale())
    }

    // The next lane that may be started now, and when the soonest blocked one could be.
    function pick(now: number): { lane?: Lane; wakeAt?: number } {
      let wakeAt: number | undefined
      const everyDown = all.every((l) => laneState(l.key).downUntil > now)
      for (const lane of ranked(all, usedProviders)) {
        if (started.has(lane.key)) continue
        const ls = laneState(lane.key)
        // A model that is resting is skipped, unless every one is resting (then they are all tried).
        if (ls.downUntil > now && !everyDown) continue
        const ps = provState(lane.provider.id)
        if (ps.coolUntil > now) {
          // Worth waiting for only if it lifts soon and there is time left to use it.
          if (ps.coolUntil - now <= MAX_WAIT_MS && ps.coolUntil < t0 + total - 2000) wakeAt = Math.min(wakeAt ?? Infinity, ps.coolUntil)
          continue
        }
        if (ps.inflight >= capOf(lane.provider, now)) { wakeAt = Math.min(wakeAt ?? Infinity, now + 400); continue }
        return { lane }
      }
      return { wakeAt }
    }

    function pump() {
      if (settled) return
      clearTimeout(timer)
      const now = Date.now()
      const { lane, wakeAt } = pick(now)
      if (lane) {
        launch(lane)
        const s = laneState(lane.key)
        const hedge = s.ewma === null ? (lane.provider.keyed ? 2000 : HEDGE_UNKNOWN_MS) : Math.min(HEDGE_MAX_MS, Math.max(HEDGE_MIN_MS, Math.round(s.ewma * 1.5)))
        timer = setTimeout(pump, hedge)
        return
      }
      if (wakeAt !== undefined) { timer = setTimeout(pump, Math.max(50, wakeAt - now)); return }
      if (running === 0) finish(null)
    }

    function launch(lane: Lane) {
      started.add(lane.key)
      usedProviders.add(lane.provider.id)
      running += 1
      const ps = provState(lane.provider.id)
      ps.inflight += 1
      const start = Date.now()
      call(lane, system, turns, maxTokens, temperature, abort.signal).then((r) => {
        ps.inflight = Math.max(0, ps.inflight - 1)
        running -= 1
        const ms = Date.now() - start
        if ('text' in r) {
          noteOk(lane, ms)
          tried.push({ via: lane.key, ok: true, ms })
          if (!settled) {
            if (key) {
              if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value as string)
              cache.set(key, { text: r.text, via: lane.key, at: Date.now() })
            }
            finish({ text: r.text, via: lane.key, ms: Date.now() - t0, tried })
          }
          return
        }
        // Being cancelled because somebody else won is nobody's fault.
        if (settled || r.why === 'cancelled') return
        noteFail(lane, r, Date.now())
        tried.push({ via: lane.key, ok: false, ms, why: r.why })
        pump()
      })
    }

    pump()
  })
}
