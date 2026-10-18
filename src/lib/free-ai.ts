/*
 * THE STANDARD ASSISTANT: A FREE MODEL THAT NEEDS NO KEY.
 *
 * The chat has two tiers. Advanced is Gemini, paid for out of this app's own
 * key and kept for Premium. Standard — what the three free questions a day
 * get, and what a Premium member can switch to for a quick answer — runs on a
 * free public endpoint that asks for no account and no API key, so a free
 * question costs this app nothing.
 *
 *   1. Pollinations (text.pollinations.ai/openai), an OpenAI-shaped endpoint
 *      that serves GPT-OSS 20B to anonymous callers.
 *   2. LLM7 (api.llm7.io), the same shape, with a free "unused" bearer.
 *
 * They are tried in that order, the second starting if the first fails or is
 * still silent after a few seconds. Pollinations is the better answer and takes
 * about six seconds, because the model reasons first; LLM7 is quicker and
 * plainer, so it is the backup rather than the race. WHAT THIS IS AND IS NOT: free public services with no promise
 * attached. They can be slow, rate-limited, or gone next month, and when both
 * fail the caller falls back to the paid key rather than leaving a free
 * visitor with nothing (see routes/api/chat.ts). What is sent to them is the
 * conversation and the app's own instruction — never a name, an address, or
 * the taste profile the advanced assistant is given; the privacy page says so.
 *
 * Nothing the model says is trusted here: the answer is cleaned of the
 * trailing advert some free endpoints append and of markdown, and capped.
 */
export type FreeTurn = { role: 'user' | 'model'; text: string }

type Endpoint = { name: string; url: string; model: string; headers: Record<string, string>; extra?: Record<string, unknown> }

const ENDPOINTS: Endpoint[] = [
  {
    name: 'pollinations',
    url: 'https://text.pollinations.ai/openai',
    model: 'openai-fast',
    headers: {},
    extra: { reasoning_effort: 'low' },
  },
  {
    name: 'llm7',
    url: 'https://api.llm7.io/v1/chat/completions',
    model: 'codestral-latest',
    headers: { Authorization: 'Bearer unused' },
  },
]

const ATTEMPT_MS = 12000
const STAGGER_MS = 7500
const TIMEOUT_MS = 17000

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

/** The answer, or null if no free endpoint gave one in time. */
export async function askFree(system: string, turns: FreeTurn[], maxTokens = 600): Promise<{ text: string; via: string } | null> {
  const all = new AbortController()
  const run = (ep: Endpoint) => attempt(ep, system, turns, maxTokens, all.signal).then((text) => ({ text, via: ep.name }))

  const first = run(ENDPOINTS[0])
  const backup = new Promise<void>((resolve) => {
    const t = setTimeout(resolve, STAGGER_MS)
    first.catch(() => {
      clearTimeout(t)
      resolve()
    })
  }).then(() => run(ENDPOINTS[1]))

  const capped = new Promise<null>((r) => setTimeout(() => r(null), TIMEOUT_MS))
  try {
    return await Promise.race([Promise.any([first, backup]).catch(() => null), capped])
  } finally {
    all.abort()
  }
}
