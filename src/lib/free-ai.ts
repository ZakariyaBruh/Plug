/*
 * THE STANDARD ASSISTANT: POLLINATIONS, WHICH NEEDS NO KEY.
 *
 * The chat has two tiers. Advanced is Gemini, paid for out of this app's own
 * key and kept for Premium. Standard — what the three free questions a day
 * get, and what a Premium member can switch to for a quick answer — runs on
 * text.pollinations.ai, a free public OpenAI-shaped endpoint that serves
 * GPT-OSS to anonymous callers with no account and no API key, so a free
 * question costs this app nothing.
 *
 * It is the only model Standard uses. A free question that Pollinations does
 * not answer is not counted and is not quietly handed to the paid key: the
 * visitor is told it is busy and asks again. To keep that rare, a second
 * attempt starts if the first fails or is still silent after STAGGER_MS, and the
 * first answer wins. It takes about six seconds a question, because the model
 * reasons before it speaks.
 *
 * WHAT THIS IS AND IS NOT: a free public service with no promise attached. It
 * can be slow, rate-limited, or gone. What is sent to it is the conversation
 * and the app's own instruction — never a name, an address, or the taste
 * profile the advanced assistant is given; the privacy page says so.
 *
 * Nothing the model says is trusted here: the answer is cleaned of the
 * trailing advert the endpoint sometimes appends and of markdown, and capped.
 */
export type FreeTurn = { role: 'user' | 'model'; text: string }

const ENDPOINT = 'https://text.pollinations.ai/openai'
const MODEL = 'openai-fast'

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

async function attempt(system: string, turns: FreeTurn[], maxTokens: number, signal: AbortSignal): Promise<string> {
  const timer = new AbortController()
  const stop = setTimeout(() => timer.abort(), ATTEMPT_MS)
  signal.addEventListener('abort', () => timer.abort(), { once: true })
  try {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      signal: timer.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        reasoning_effort: 'low',
        messages: [
          { role: 'system', content: system },
          ...turns.map((t) => ({ role: t.role === 'model' ? 'assistant' : 'user', content: t.text })),
        ],
        max_tokens: maxTokens,
        temperature: 0.8,
      }),
    })
    if (!res.ok) throw new Error(`pollinations ${res.status}`)
    const data = (await res.json()) as { choices?: { message?: { content?: unknown } }[] }
    const raw = data?.choices?.[0]?.message?.content
    const text = typeof raw === 'string' ? cleanFreeAnswer(raw) : ''
    if (!text) throw new Error('pollinations empty')
    return text
  } finally {
    clearTimeout(stop)
  }
}

/** The answer, or null if Pollinations gave none in time. */
export async function askFree(system: string, turns: FreeTurn[], maxTokens = 600): Promise<{ text: string; via: string } | null> {
  const all = new AbortController()
  const run = () => attempt(system, turns, maxTokens, all.signal).then((text) => ({ text, via: 'pollinations' }))

  const first = run()
  const second = new Promise<void>((resolve) => {
    const t = setTimeout(resolve, STAGGER_MS)
    first.catch(() => {
      clearTimeout(t)
      resolve()
    })
  }).then(run)

  const capped = new Promise<null>((r) => setTimeout(() => r(null), TIMEOUT_MS))
  try {
    return await Promise.race([Promise.any([first, second]).catch(() => null), capped])
  } finally {
    all.abort()
  }
}
