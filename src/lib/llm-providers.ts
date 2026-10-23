/*
 * WHO CAN BE ASKED, AS DATA. The router (lib/free-ai.ts) knows nothing about any of
 * these by name; it reads this table. Adding a provider is adding a row here.
 *
 * TWO KINDS, AND THE DIFFERENCE IS THE WHOLE RELIABILITY STORY.
 *
 * KEYLESS (LLM7, Pollinations). Free and open to anyone, so free for everyone at once:
 * they rate-limit by the caller's IP address, and every visitor to this app reaches them
 * from the same few Cloudflare addresses. Measured from one machine with ten questions in
 * a row on each model: LLM7 answered 4 of 10 on its best model and 0 of 10 on another
 * ("Rate limit exceeded", "Too many concurrent requests for this client"), Pollinations
 * 4 of 10 (503s and timeouts). They are good as a floor and a poor main road, which is why
 * the router treats a provider's limit as the provider's, not as one model's.
 *
 * KEYED (Groq, Cerebras, OpenRouter, Mistral, GitHub Models, Cloudflare Workers AI). Every
 * one has a free tier with no card, a key of your own (so a limit of your own, not a
 * crowd's), and answers in a fraction of a second. They are OFF until the key exists as a
 * secret, and they are tried first once it does:
 *
 *   whop apps secrets set GROQ_API_KEY=...        (console.groq.com/keys)
 *   whop apps secrets set CEREBRAS_API_KEY=...    (cloud.cerebras.ai)
 *   whop apps secrets set OPENROUTER_API_KEY=...  (openrouter.ai/keys; the ":free" models)
 *   whop apps secrets set MISTRAL_API_KEY=...     (console.mistral.ai)
 *   whop apps secrets set GITHUB_MODELS_TOKEN=... (a GitHub token with models:read)
 *   whop apps secrets set CF_ACCOUNT_ID=... CF_AI_TOKEN=...   (Workers AI, 10,000 free neurons a day)
 *
 * A model id can be replaced without a deploy: GROQ_MODELS="a,b" and so on, for the day a
 * provider retires one. (One that answers 404, 410 or 401 is taken out of rotation for half
 * an hour on its own, so a retired id costs one failed call, not a broken assistant.)
 *
 * NEVER IN HERE: Gemini. It is the paid key and it is for Premium.
 */
export type Model = { id: string; extra?: Record<string, unknown> }

export type Provider = {
  id: string
  /** Lower is tried earlier when everything is healthy. */
  priority: number
  keyed: boolean
  /** The request URL; a function when part of it is a secret-provided id. */
  url: (env: Env) => string | null
  headers: (env: Env) => Record<string, string> | null
  models: Model[]
  /** Calls in flight at once, across every visitor. The keyless ones allow very few. */
  maxConcurrent: number
  /** The env var that overrides the model list (comma-separated). */
  modelsEnv?: string
}

type Env = Record<string, string | undefined>

const LLM7_URL = 'https://api.llm7.io/v1/chat/completions'
const LOW = { reasoning_effort: 'low' } // the open "gpt-oss" models think first; this keeps it short

export const PROVIDERS: Provider[] = [
  {
    id: 'groq', priority: 10, keyed: true, maxConcurrent: 6, modelsEnv: 'GROQ_MODELS',
    url: (e) => (e.GROQ_API_KEY ? 'https://api.groq.com/openai/v1/chat/completions' : null),
    headers: (e) => (e.GROQ_API_KEY ? { Authorization: `Bearer ${e.GROQ_API_KEY}` } : null),
    models: [{ id: 'openai/gpt-oss-20b', extra: LOW }, { id: 'llama-3.1-8b-instant' }],
  },
  {
    id: 'cerebras', priority: 11, keyed: true, maxConcurrent: 6, modelsEnv: 'CEREBRAS_MODELS',
    url: (e) => (e.CEREBRAS_API_KEY ? 'https://api.cerebras.ai/v1/chat/completions' : null),
    headers: (e) => (e.CEREBRAS_API_KEY ? { Authorization: `Bearer ${e.CEREBRAS_API_KEY}` } : null),
    models: [{ id: 'gpt-oss-120b', extra: LOW }, { id: 'llama3.1-8b' }],
  },
  {
    id: 'cloudflare', priority: 12, keyed: true, maxConcurrent: 6, modelsEnv: 'CF_MODELS',
    url: (e) => (e.CF_ACCOUNT_ID && e.CF_AI_TOKEN ? `https://api.cloudflare.com/client/v4/accounts/${e.CF_ACCOUNT_ID}/ai/v1/chat/completions` : null),
    headers: (e) => (e.CF_AI_TOKEN ? { Authorization: `Bearer ${e.CF_AI_TOKEN}` } : null),
    models: [{ id: '@cf/meta/llama-3.1-8b-instruct' }, { id: '@cf/openai/gpt-oss-20b', extra: LOW }],
  },
  {
    id: 'mistral', priority: 13, keyed: true, maxConcurrent: 2, modelsEnv: 'MISTRAL_MODELS',
    url: (e) => (e.MISTRAL_API_KEY ? 'https://api.mistral.ai/v1/chat/completions' : null),
    headers: (e) => (e.MISTRAL_API_KEY ? { Authorization: `Bearer ${e.MISTRAL_API_KEY}` } : null),
    models: [{ id: 'mistral-small-latest' }],
  },
  {
    id: 'openrouter', priority: 14, keyed: true, maxConcurrent: 3, modelsEnv: 'OPENROUTER_MODELS',
    url: (e) => (e.OPENROUTER_API_KEY ? 'https://openrouter.ai/api/v1/chat/completions' : null),
    headers: (e) => (e.OPENROUTER_API_KEY ? { Authorization: `Bearer ${e.OPENROUTER_API_KEY}`, 'X-Title': 'morsels45' } : null),
    models: [{ id: 'openai/gpt-oss-20b:free', extra: LOW }, { id: 'meta-llama/llama-3.3-70b-instruct:free' }],
  },
  {
    id: 'github', priority: 15, keyed: true, maxConcurrent: 2, modelsEnv: 'GITHUB_MODELS',
    url: (e) => (e.GITHUB_MODELS_TOKEN ? 'https://models.github.ai/inference/chat/completions' : null),
    headers: (e) => (e.GITHUB_MODELS_TOKEN ? { Authorization: `Bearer ${e.GITHUB_MODELS_TOKEN}` } : null),
    models: [{ id: 'openai/gpt-4.1-mini' }],
  },
  {
    // The anonymous tier of LLM7. One provider, five models: they share one limit (the caller's address),
    // so they are not five independent chances and the router must not race them as if they were.
    id: 'llm7', priority: 30, keyed: false, maxConcurrent: 2, modelsEnv: 'LLM7_MODELS',
    url: () => LLM7_URL,
    headers: () => ({ Authorization: 'Bearer unused' }),
    models: [{ id: 'gpt-oss:20b' }, { id: 'nemotron-3-nano:30b' }, { id: 'mistral-Nemo-Instruct-2407' }, { id: 'minimax-m2.7' }, { id: 'codestral-latest' }],
  },
  {
    id: 'pollinations', priority: 40, keyed: false, maxConcurrent: 2,
    url: () => 'https://text.pollinations.ai/openai',
    headers: () => ({}),
    models: [{ id: 'openai-fast', extra: LOW }],
  },
]

/** The providers whose key is set (and the keyless ones), with their model lists after any override. */
export function activeProviders(env: Env): { provider: Provider; url: string; headers: Record<string, string>; models: Model[] }[] {
  const out: { provider: Provider; url: string; headers: Record<string, string>; models: Model[] }[] = []
  for (const provider of PROVIDERS) {
    const url = provider.url(env)
    const headers = provider.headers(env)
    if (!url || !headers) continue
    const override = provider.modelsEnv ? (env[provider.modelsEnv] ?? '').split(',').map((s) => s.trim()).filter(Boolean) : []
    const models = override.length
      ? override.map((id) => provider.models.find((m) => m.id === id) ?? { id, extra: /gpt-oss/.test(id) ? LOW : undefined })
      : provider.models
    out.push({ provider, url, headers, models })
  }
  return out
}
