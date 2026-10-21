/*
 * THE FREE MODELS: POLLINATIONS, WITH LLM7 BEHIND IT. NEITHER NEEDS A KEY.
 *
 * Advanced is Gemini, paid for out of this app's own key and kept for Premium.
 * Standard — the three free questions a day, and what a Premium member can
 * switch to for a quick answer — and Dot's answers about the app run here
 * instead, so they cost this app nothing.
 *
 *   1. Pollinations (text.pollinations.ai/openai): GPT-OSS to anonymous callers.
 *      The better answer, about six seconds, because the model reasons first.
 *   2. LLM7 (api.llm7.io): the same shape with a free "unused" bearer. Quicker
 *      and plainer, so it is the backup and not the race: it starts only when
 *      Pollinations has failed, or has been silent for STAGGER_MS.
 *
 * Nothing here ever falls through to the paid key. A question neither answers
 * is not counted and is not handed to Gemini: the visitor is told it is busy
 * and asks again.
 *
 * WHAT THIS IS AND IS NOT: free public services with no promise attached; they
 * can be slow, rate-limited, or gone. What is sent is the conversation and the
 * app's own instruction — never a name, an address, or the taste profile the
 * advanced assistant is given; the privacy page says so.
 *
 * Nothing a model says is trusted here: the answer is cleaned of the trailing
 * advert some free endpoints append, and of markdown, and capped.
 */
export type FreeTurn = { role: 'user' | 'model'; text: string }

type Endpoint = { name: string; url: string; model: string; headers: Record<string, string>; extra?: Record<string, unknown> }

const ENDPOINTS: Endpoint[] = [
  { name: 'pollinations', url: 'https://text.pollinations.ai/openai', model: 'openai-fast', headers: {}, extra: { reasoning_effort: 'low' } },
  { name: 'llm7', url: 'https://api.llm7.io/v1/chat/completions', model: 'codestral-latest', headers: { Authorization: 'Bearer unused' } },
]

const ATTEMPT_MS = 14000
const STAGGER_MS = 8000
const TIMEOUT_MS = 20000

/** Adverts and wrappers the free endpoints sometimes add, and markdown the prompt asked not to get. */
export function cleanFreeAnswer(text: string): string {
  return text
    .replace(/\n+\s*(\*\*)?(powered by|support pollinations|sponsor|ad:)[\s\S]*$/i, '')
    .replace(/<[^>]{1,40}>/g, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .trim()
}

async function attempt(ep: Endpoint, system: string, turns: FreeTurn[], maxTokens: number, signal: AbortSignal): Promise<string> {
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
        temperature: 0.8,
        ...ep.extra,
      }),
    })
    if (!res.ok) throw new Error(`${ep.name} ${res.status}`)
    const data = (await res.json()) as { choices?: { message?: { content?: unknown } }[] }
    const raw = data?.choices?.[0]?.message?.content
    const text = typeof raw === 'string' ? cleanFreeAnswer(raw) : ''
    if (!text) throw new Error(`${ep.name} empty`)
    return text
  } finally {
    clearTimeout(stop)
  }
}

/** The answer, or null if neither free service gave one in time. */
export async function askFree(
  system: string,
  turns: FreeTurn[],
  maxTokens = 600,
  temperature?: number,
): Promise<{ text: string; via: string } | null> {
  const all = new AbortController()
  const eps = temperature === undefined ? ENDPOINTS : ENDPOINTS.map((e) => ({ ...e, extra: { ...e.extra, temperature } }))
  const run = (ep: Endpoint) => attempt(ep, system, turns, maxTokens, all.signal).then((text) => ({ text, via: ep.name }))

  const first = run(eps[0])
  const backup = new Promise<void>((resolve) => {
    const t = setTimeout(resolve, STAGGER_MS)
    first.catch(() => {
      clearTimeout(t)
      resolve()
    })
  }).then(() => run(eps[1]))

  const capped = new Promise<null>((r) => setTimeout(() => r(null), TIMEOUT_MS))
  try {
    return await Promise.race([Promise.any([first, backup]).catch(() => null), capped])
  } finally {
    all.abort()
  }
}
