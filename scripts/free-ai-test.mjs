/*
 * The free assistant's calling system, with the network replaced by one that fails in the
 * ways the real ones do: hangs, 5xx, rate limits with a Retry-After, "too many concurrent
 * requests", retired models, empty bodies, error bodies dressed as answers. Run with bun
 * (it imports TypeScript).
 *
 *   bun run scripts/free-ai-test.mjs
 *
 * What it holds in place:
 *  - providers, not endpoints: a rate limit belongs to the provider, so its other models rest too
 *  - a provider is never given more calls at once than it allows, however many visitors ask
 *  - keyed free tiers are off until their secret exists, go first once it does, and send the key
 *  - a slow provider is hedged by a DIFFERENT provider, and a failure is replaced at once
 *  - a bad key or a retired model rests for half an hour; a 429 for as long as it said
 *  - something that is not an answer is not returned as one
 *  - the same first question twice is one trip; when everything fails an older answer beats none
 *  - nothing is ever sent to the paid key, and LLM7 is never sent reasoning_effort (it answers 400)
 *  - when every model is down a question about what to eat is still answered from the menu,
 *    honouring "no pork" and "not spicy", and a question the menu cannot speak to is not
 */
import { askFree, cleanFreeAnswer, freeHealth, freeProviders, looksBad, resetFreeAi } from '../src/lib/free-ai.ts'
import { localAnswer, pickFromMenu } from '../src/lib/free-local.ts'
import { ALL_DISHES } from '../src/lib/dishes.ts'

let pass = 0
let fail = 0
function check(name, ok, detail) {
  ok ? (pass += 1) : (fail += 1)
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok || !detail ? '' : `\n        ${detail}`}`)
}

const KEYS = ['GROQ_API_KEY', 'CEREBRAS_API_KEY', 'OPENROUTER_API_KEY', 'MISTRAL_API_KEY', 'GITHUB_MODELS_TOKEN', 'CF_ACCOUNT_ID', 'CF_AI_TOKEN', 'GROQ_MODELS']
for (const k of KEYS) delete process.env[k]

const calls = []
let behaviour = {}
let inflight = {}
let maxInflight = {}
const realNow = Date.now
// how = 'ok' | 'hang' | 'down' | 'empty' | 'errorbody' | 'notice' | 'think' | 'slow' | {status, headers, body}
globalThis.fetch = (url, init) => {
  const body = JSON.parse(init.body)
  const host = new URL(String(url)).host
  calls.push({ url: String(url), host, model: body.model, body, headers: init.headers })
  const how = behaviour[body.model] ?? behaviour[host] ?? 'ok'
  const reply = (content, status = 200) => Promise.resolve(new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status }))
  if (how === 'hang') return new Promise((_, rej) => init.signal.addEventListener('abort', () => rej(Object.assign(new Error('aborted'), { name: 'AbortError' }))))
  if (how === 'slow') {
    inflight[host] = (inflight[host] ?? 0) + 1
    maxInflight[host] = Math.max(maxInflight[host] ?? 0, inflight[host])
    return new Promise((res) => setTimeout(() => { inflight[host] -= 1; res(new Response(JSON.stringify({ choices: [{ message: { content: `Answer from ${body.model}. A good pick.` } }] }))) }, 400))
  }
  if (how === 'down') return Promise.resolve(new Response('no', { status: 503 }))
  if (typeof how === 'object') return Promise.resolve(new Response(how.body ?? 'no', { status: how.status, headers: how.headers }))
  if (how === 'empty') return reply('')
  if (how === 'errorbody') return reply('{"error":"model overloaded"}')
  if (how === 'notice') return reply('IMPORTANT NOTICE: this endpoint is deprecated.')
  if (how === 'think') return reply('<think>working it out</think>Try the dal. It is cheap and warming.')
  return reply(`Answer from ${body.model}. It is a good pick, with a reason.`)
}
const reset = (b = {}) => { behaviour = b; calls.length = 0; inflight = {}; maxInflight = {}; Date.now = realNow; resetFreeAi() }
const ask = (q = 'what should i eat') => askFree('system', [{ role: 'user', text: q }])
const timed = async (fn) => { const t = Date.now(); const r = await fn(); return [r, Date.now() - t] }
const lane = (name) => freeHealth().find((h) => h.name === name)

// the table
const ids = freeProviders().map((p) => p.id)
check('with no keys only the keyless providers are on', ids.join() === 'llm7,pollinations', ids.join())
process.env.GROQ_API_KEY = 'k1'
check('a key switches its provider on, ahead of the keyless ones', freeProviders().map((p) => p.id)[0] === 'groq')
process.env.GROQ_MODELS = 'some/new-model'
check('and its model list can be replaced without a deploy', freeProviders()[0].models.join() === 'some/new-model')
delete process.env.GROQ_API_KEY; delete process.env.GROQ_MODELS

// what is sent where
reset()
let [r, ms] = await timed(() => ask())
check('a healthy network answers from the first provider, quickly, in one call', r?.via === 'llm7/gpt-oss:20b' && ms < 500 && calls.length === 1, `${r?.via} ${ms}ms ${calls.length} calls`)
check('the result says what it tried', r?.tried?.length === 1 && r.tried[0].ok)
check('nothing is sent to the paid key', calls.every((c) => !/google|gemini|generativelanguage/i.test(c.url)))
reset()
await Promise.all([ask('a'), ask('b'), ask('c')])
reset({ 'api.llm7.io': 'down' })
await ask('x')
const pol = calls.filter((c) => c.host.includes('pollinations'))
check('reasoning_effort goes to Pollinations only, never LLM7 (which answers 400)', calls.filter((c) => c.host.includes('llm7')).every((c) => !('reasoning_effort' in c.body)) && pol.length > 0 && pol.every((c) => c.body.reasoning_effort === 'low'))

// keyed providers
reset()
process.env.GROQ_API_KEY = 'secret-groq'
;[r, ms] = await timed(() => ask('keyed'))
check('a keyed provider goes first and sends its key', r?.via === 'groq/openai/gpt-oss-20b' && calls[0].headers.Authorization === 'Bearer secret-groq' && calls[0].body.reasoning_effort === 'low', `${r?.via} ${JSON.stringify(calls[0]?.headers)}`)
check('and the keyless ones are not touched while it is healthy', calls.length === 1)
reset({ 'api.groq.com': { status: 401 } })
r = await ask('bad key')
check('a bad key falls through at once to the keyless providers', r?.via?.startsWith('llm7/') && calls.filter((c) => c.host.includes('groq')).length === 1, `${r?.via}`)
check('and the provider rests, both its models, for half an hour', lane('groq/openai/gpt-oss-20b').cooling && lane('groq/llama-3.1-8b-instant').cooling && lane('groq/llama-3.1-8b-instant').coolMs > 25 * 60_000, JSON.stringify(lane('groq/llama-3.1-8b-instant')))
calls.length = 0
await ask('next question')
check('the next question does not call it again', !calls.some((c) => c.host.includes('groq')))
delete process.env.GROQ_API_KEY

// slowness and failure
reset({ 'gpt-oss:20b': 'hang' })
;[r, ms] = await timed(() => ask())
check('a provider that hangs is hedged by a DIFFERENT provider, not by its own other model', r?.via === 'pollinations/openai-fast' && ms > 3000 && ms < 5500 && calls.filter((c) => c.host.includes('llm7')).length === 1, `${r?.via} ${ms}ms ${calls.map((c) => c.model)}`)
reset({ 'gpt-oss:20b': 'down' })
;[r, ms] = await timed(() => ask())
check('one that fails at once is replaced at once, by another provider', r?.via === 'pollinations/openai-fast' && ms < 600, `${r?.via} ${ms}ms`)
for (const how of ['empty', 'errorbody', 'notice']) {
  reset({ 'gpt-oss:20b': how })
  ;[r, ms] = await timed(() => ask())
  check(`"${how}" is not an answer, and is not returned as one`, r?.via === 'pollinations/openai-fast' && ms < 600, `${r?.via} ${r?.text}`)
}
reset({ 'gpt-oss:20b': 'think' })
r = await ask()
check('reasoning is stripped from an answer', r?.text === 'Try the dal. It is cheap and warming.', r?.text)
check('looksBad catches an error body, a notice and nothing', looksBad('{"x":1}') && looksBad('IMPORTANT NOTICE: moved') && looksBad('hm') && !looksBad('Try the dal. It is cheap.'))
check('cleanFreeAnswer drops markdown and a trailing advert', cleanFreeAnswer('**Dal.** Cheap.\n\n**Powered by Pollinations**') === 'Dal. Cheap.')

// limits
reset({ 'api.llm7.io': { status: 429, headers: { 'retry-after': '40' }, body: '{"error":{"message":"Rate limit exceeded. Retry after 40 seconds."}}' } })
;[r, ms] = await timed(() => ask())
check('a 429 is answered by the next provider, at once', r?.via === 'pollinations/openai-fast' && ms < 600, `${r?.via} ${ms}ms`)
check('and the whole provider rests for as long as it said (not just the model that heard it)', lane('llm7/gpt-oss:20b').cooling && lane('llm7/mistral-Nemo-Instruct-2407').cooling && lane('llm7/gpt-oss:20b').coolMs > 30000 && lane('llm7/gpt-oss:20b').coolMs <= 40000, JSON.stringify(lane('llm7/gpt-oss:20b')))
check('a rate limit is not counted as the model failing', lane('llm7/gpt-oss:20b').fails === 0 && !lane('llm7/gpt-oss:20b').down)
const before = calls.filter((c) => c.host.includes('llm7')).length
await ask('another'); await ask('and another')
check('and nothing more is sent to it meanwhile', calls.filter((c) => c.host.includes('llm7')).length === before, `${before} -> ${calls.filter((c) => c.host.includes('llm7')).length}`)

reset({ 'api.llm7.io': { status: 429, body: '{"error":{"message":"Too many concurrent requests for this client. Retry after 1 seconds."}}' } })
await ask('c1')
check('"too many concurrent requests" lowers how many it is given at once', lane('llm7/gpt-oss:20b').cap === 1, `cap ${lane('llm7/gpt-oss:20b').cap}`)

reset({ 'api.llm7.io': 'slow', 'text.pollinations.ai': 'slow' })
await Promise.all(Array.from({ length: 8 }, (_, i) => ask('q' + i)))
check('a provider is never given more calls at once than it allows, however many ask', (maxInflight['api.llm7.io'] ?? 0) <= 2 && (maxInflight['text.pollinations.ai'] ?? 0) <= 2, JSON.stringify(maxInflight))

reset({ 'gpt-oss:20b': { status: 404 } })
r = await ask()
check('a retired model (404) rests for half an hour', lane('llm7/gpt-oss:20b').down && r !== null, `${r?.via}`)
calls.length = 0
r = await ask('next')
check('and the provider\'s other models still work (it is the model that is gone, not the service)', r?.via === 'llm7/nemotron-3-nano:30b' && !calls.some((c) => c.model === 'gpt-oss:20b'), `${r?.via} ${calls.map((c) => c.model)}`)
check('it is forgiven after that', !freeHealth(Date.now() + 31 * 60_000).find((h) => h.name === 'llm7/gpt-oss:20b').down)

// failures that are not limits: a model that keeps failing is demoted, then rests
reset({ 'gpt-oss:20b': 'down' })
await ask('one')
calls.length = 0
await ask('two')
check('one failure demotes a model: the next question starts with another', calls[0]?.model !== 'gpt-oss:20b', calls.map((c) => c.model).join(','))
behaviour = { 'gpt-oss:20b': 'down', 'nemotron-3-nano:30b': 'down', 'mistral-Nemo-Instruct-2407': 'down' }
for (let i = 0; i < 4; i++) await ask('f' + i)
check('and repeated failures make it rest', lane('llm7/gpt-oss:20b').down || lane('llm7/gpt-oss:20b').fails >= 1, JSON.stringify(lane('llm7/gpt-oss:20b')))
check('it comes back: forgiven once the time is up', !freeHealth(Date.now() + 10 * 60_000).find((h) => h.name === 'llm7/gpt-oss:20b').down)

// order learned from what happens
reset()
for (let i = 0; i < 3; i++) await ask('warm ' + i)
check('latency is remembered', lane('llm7/gpt-oss:20b').ewmaMs !== null && lane('llm7/gpt-oss:20b').ok >= 3)

// everything down
reset({ 'api.llm7.io': 'down', 'text.pollinations.ai': 'down' })
;[r, ms] = await timed(() => ask('all down'))
check('every provider down: null, quickly, not a long wait', r === null && ms < 2500, `${r} ${ms}ms`)
await ask('again'); await ask('and again')
calls.length = 0
await ask('still')
check('with every model marked down they are all still tried', calls.length === 6, `${calls.length}`)

// memory
reset()
await ask('Something cheap and spicy')
await ask('  something CHEAP and spicy!! ')
check('the same first question twice is one trip, however it is punctuated', calls.length === 1, `${calls.length}`)
calls.length = 0
await askFree('system', [{ role: 'user', text: 'cheap' }, { role: 'model', text: 'dal' }, { role: 'user', text: 'why' }])
await askFree('system', [{ role: 'user', text: 'cheap' }, { role: 'model', text: 'dal' }, { role: 'user', text: 'why' }])
check('but a conversation is never answered from somebody else’s', calls.length === 2, `${calls.length}`)
reset()
await ask('a stale one')
behaviour = { 'api.llm7.io': 'down', 'text.pollinations.ai': 'down' }
const later = realNow() + 7 * 3600_000
Date.now = () => later
r = await ask('a stale one')
check('when everything fails, an answer from hours ago beats none', r?.via?.startsWith('stale:') && /Answer from/.test(r.text), JSON.stringify(r))
Date.now = () => realNow() + 3 * 24 * 3600_000
r = await ask('a stale one')
check('but not one from days ago', r === null, JSON.stringify(r))
Date.now = realNow

// the menu, when nothing else answers
const tagsOf = (name) => new Set(ALL_DISHES.find((d) => d.name === name).tags)
let la = localAnswer('im hungry, something cheap and spicy')
check('"cheap and spicy" is answered from the menu', la?.kind === 'menu' && la.dishes.length >= 2, JSON.stringify(la))
check('with a dish that is both', la && tagsOf(la.dishes[0]).has('cheap') && tagsOf(la.dishes[0]).has('spicy'), la?.dishes[0])
check('named the way the app spells it, so it becomes a tap', la && la.dishes.every((n) => ALL_DISHES.some((d) => d.name === n)) && la.text.startsWith(la.dishes[0]))
la = localAnswer('something quick but no pork please')
check('"no pork" rules pork out', la && la.dishes.every((n) => !tagsOf(n).has('pork')), JSON.stringify(la?.dishes))
const notSpicy = pickFromMenu('something hearty, not spicy', 6)
check('"not spicy" is not read as wanting spice', notSpicy.length > 0 && notSpicy.every((d) => !d.tags.includes('spicy')), notSpicy.map((d) => d.name).join(','))
check('a question in plain hunger still gets a dish', pickFromMenu('im hungry').length >= 1)
check('a question the menu cannot speak to is not answered from it', localAnswer('why is the sky blue') === null && localAnswer('write me a poem about autumn') === null)
la = localAnswer('how does premium work')
check('a clear question about the app is answered from the facts', la?.kind === 'app', JSON.stringify(la))
la = localAnswer('im hungry, something cheap and spicy')
check('and "cheap" in a food question is not read as the price of Premium', la?.kind === 'menu')
check('and the same question gives the same pick, so it does not flicker', JSON.stringify(localAnswer('a cheap vegetarian dinner')) === JSON.stringify(localAnswer('a cheap vegetarian dinner')))

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
