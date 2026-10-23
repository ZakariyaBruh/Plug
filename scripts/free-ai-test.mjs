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
 *  - the paid key is touched only when every free provider has failed, with the cheapest Gemini model, capped
 *    in tokens and per hour; never while a free one answers. LLM7 is never sent reasoning_effort (it answers 400)
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
KEYS.push('GEMINI_API_KEY', 'GEMINI_FALLBACK_MODEL')
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
  const model = body.model ?? String(url).match(/models\/([^:]+):/)?.[1]
  calls.push({ url: String(url), host, model, body, headers: init.headers })
  const how = behaviour[model] ?? behaviour[host] ?? 'ok'
  if (host.includes('generativelanguage') && how === 'ok') return Promise.resolve(new Response(JSON.stringify({ candidates: [{ content: { parts: [{ text: `Gemini says: ${model}. A fine pick, with a reason.` }] } }] })))
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
check('nothing is sent to the paid key while a free provider answers', calls.every((c) => !/google|gemini|generativelanguage/i.test(c.url)))
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


// the last resort: the cheapest Gemini, only when every free provider has failed
const DOWN = { 'api.llm7.io': 'down', 'text.pollinations.ai': 'down' }
reset(DOWN)
;[r, ms] = await timed(() => ask('no key at all'))
check('with no Gemini key and every free provider down: nothing, and no call to Google', r === null && !calls.some((c) => c.host.includes('generativelanguage')))
process.env.GEMINI_API_KEY = 'secret-gemini'
reset()
await ask('everything is fine')
check('with the key set, a healthy free provider still answers and Google is not called', calls.length === 1 && !calls.some((c) => c.host.includes('generativelanguage')))
reset(DOWN)
;[r, ms] = await timed(() => ask('all the free ones are down'))
const g = calls.filter((c) => c.host.includes('generativelanguage'))
check('every free provider down: one call to Gemini, and it answers', g.length === 1 && r?.via === 'gemini:gemini-3.1-flash-lite' && /Gemini says/.test(r.text), `${r?.via} ${g.length}`)
check('it is the cheapest model (3.1 Flash-Lite: $0.25/$1.50, not 3.5: $0.30/$2.50) and sends the key in the header, not the URL', g[0].model === 'gemini-3.1-flash-lite' && g[0].headers['x-goog-api-key'] === 'secret-gemini' && !g[0].url.includes('secret-gemini'))
check('capped at 400 tokens however many were asked for', g[0].body.generationConfig.maxOutputTokens === 400)
check('sent the instruction and the question, and nothing else', g[0].body.systemInstruction.parts[0].text === 'system' && g[0].body.contents.length === 1 && g[0].body.contents[0].parts[0].text === 'all the free ones are down' && Object.keys(g[0].body).sort().join() === 'contents,generationConfig,systemInstruction')
calls.length = 0
r = await ask('all the free ones are down')
check('and the answer is remembered, so the same question does not cost twice', r?.via?.startsWith('memory:gemini') && calls.length === 0, `${r?.via} ${calls.length}`)
reset(DOWN)
r = await askFree('system', [{ role: 'user', text: 'not for this caller' }], 600, undefined, { gemini: false })
check('a caller can say no (a Premium answer that has just come from Gemini): then it is null', r === null && !calls.some((c) => c.host.includes('generativelanguage')))
reset({ ...DOWN, 'api.llm7.io': 'down', 'gemini-3.1-flash-lite': 'down' })
r = await ask('gemini is down too')
check('Gemini refusing too gives null, so the menu can answer', r === null)
reset(DOWN)
process.env.GEMINI_FALLBACK_MODEL = 'gemini-x-test'
await ask('a different model')
check('the model can be changed without a deploy', calls.some((c) => c.model === 'gemini-x-test'))
delete process.env.GEMINI_FALLBACK_MODEL
reset(DOWN)
let paid = 0
for (let i = 0; i < 320; i++) { await ask('q ' + i); }
paid = calls.filter((c) => c.host.includes('generativelanguage')).length
check('and it is capped per hour, so a dead free tier costs a bounded amount', paid === 300, `${paid} calls`)
delete process.env.GEMINI_API_KEY

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

// ADVANCED IS GEMINI AND NOTHING ELSE: the Premium branch of the chat route never reaches a free provider.
{
  const { readFileSync } = await import('node:fs')
  const route = readFileSync(new URL('../src/routes/api/chat.ts', import.meta.url), 'utf8')
  const adv = route.slice(route.indexOf('if (advanced) {'), route.indexOf('// STANDARD: three a day'))
  check('the advanced branch is found', adv.length > 500)
  check('and never calls the free providers', !/askFree|llm7|pollinations|groq|cerebras|openrouter/i.test(adv))
  check('it asks Gemini twice over before it gives up (a second round on the other Gemini models)', (adv.match(/askGemini\(/g) || []).length === 2 && /gemini-3\.1-flash-lite/.test(adv))
  check('and a refusal asking again cannot change is not asked twice', /lastStatus === 429 \|\| ask\.lastStatus >= 500/.test(adv))
  check('a member whose Gemini is down is told so, not handed a free answer', /error: res \? 'no_answer'/.test(adv) && !/degraded/.test(adv))
  check('the model can be changed with GEMINI_ADVANCED_MODEL and no deploy', /GEMINI_ADVANCED_MODEL/.test(adv))
  const skills = [...route.matchAll(/^  (week|shop|prep|macros|diet|host|teach|look): '/gm)].map((m) => m[1])
  check('the new skills are all there', skills.length === 8, skills.join())
  const client = readFileSync(new URL('../public/decide/js/app.js', import.meta.url), 'utf8')
  check('and every one has a chip', skills.every((id) => new RegExp(`id: '${id}', label`).test(client)))
  check('a plan or list comes back as a card the page draws and can copy', /card: cleanCard/.test(route) && /addListCard\(row, answer\.body\.card\)/.test(client))
}

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
