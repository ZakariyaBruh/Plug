import { askGemini } from '#/lib/gemini'

/*
 * ONE WAY FOR A HUB FEATURE TO ASK THE MODEL FOR JSON.
 *
 * Every hub feature that uses AI wants the same thing: a system instruction,
 * the person's input (sometimes a photo), and a JSON object back that the
 * route then checks field by field. askGemini already does the hard part
 * (two overlapped attempts on two models); this wraps the request shape and
 * the reading of the answer, so each route is its prompt and its validation
 * and nothing else.
 *
 * Nothing the model says is trusted by this file. It hands back parsed JSON
 * or a reason it could not; the routes decide what of it is real.
 */
export type AiPart = { text: string } | { inlineData: { mimeType: string; data: string } }

export type AiOutcome<T> = { ok: true; value: T } | { ok: false; error: 'unavailable' | 'busy' | 'no_answer' }

export async function askJson<T>(
  label: string,
  system: string,
  parts: AiPart[],
  { maxTokens = 900, temperature = 0.7 }: { maxTokens?: number; temperature?: number } = {},
): Promise<AiOutcome<T>> {
  const key = process.env.GEMINI_API_KEY
  if (!key) {
    console.error(`${label}: GEMINI_API_KEY is not set`)
    return { ok: false, error: 'unavailable' }
  }
  const { res, lastStatus } = await askGemini(
    key,
    JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts }],
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature,
        responseMimeType: 'application/json',
        thinkingConfig: { thinkingLevel: 'low' },
      },
    }),
    label,
  )
  if (!res) return { ok: false, error: lastStatus === 429 ? 'busy' : 'unavailable' }
  try {
    const payload = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] }
    const text = (payload?.candidates?.[0]?.content?.parts ?? [])
      .map((p) => p?.text ?? '')
      .join('')
      .trim()
    return { ok: true, value: JSON.parse(text) as T }
  } catch (err) {
    console.error(`${label}: answer was not JSON`, err)
    return { ok: false, error: 'no_answer' }
  }
}

export function aiRefusal(error: 'unavailable' | 'busy' | 'no_answer') {
  return error === 'busy' ? 429 : 502
}
