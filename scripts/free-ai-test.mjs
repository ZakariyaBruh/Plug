/*
 * The free assistant's reliability, with the network replaced by one that fails
 * in the ways the real ones do: hangs, 5xx, empty bodies, error bodies dressed as
 * answers, a deprecation notice. Run with bun (it imports TypeScript).
 *
 *   bun run scripts/free-ai-test.mjs
 *
 * What it holds in place:
 *  - the fast service is asked first, and a slow or dead one does not hold the others up
 *  - something that is not an answer is not returned as one
 *  - a service that keeps failing is skipped, and forgiven after a while
 *  - the same first question twice is one trip, not two
 *  - nothing is ever sent to the paid key, and LLM7 is never sent reasoning_effort (it answers 400)
 *  - when every model is down a question about what to eat is still answered, from the menu,
 *    honouring "no pork" and "not spicy", and a question the menu cannot speak to is not
 */
import { ENDPOINTS, askFree, cleanFreeAnswer, freeHealth, looksBad, resetFreeAi } from '../src/lib/free-ai.ts'
import { localAnswer, pickFromMenu } from '../src/lib/free-local.ts'
import { ALL_DISHES } from '../src/lib/dishes.ts'

let pass = 0
let fail = 0
function check(name, ok, detail) {
  ok ? (pass += 1) : (fail += 1)
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok || !detail ? '' : `\n        ${detail}`}`)
}

const calls = []
let behaviour = {}
globalThis.fetch = (url, init) => {
  const body = JSON.parse(init.body)
  calls.push({ url: String(url), model: body.model, body })
  const how = behaviour[body.model] ?? 'ok'
  const reply = (content, status = 200) => Promise.resolve(new Response(JSON.stringify({ choices: [{ message: { content } }] }), { status }))
  if (how === 'hang') return new Promise((_, rej) => init.signal.addEventListener('abort', () => rej(new Error('aborted'))))
  if (how === 'down') return Promise.resolve(new Response('no', { status: 503 }))
  if (how === 'empty') return reply('')
  if (how === 'errorbody') return reply('{"error":"model overloaded"}')
  if (how === 'notice') return reply('IMPORTANT NOTICE: this endpoint is deprecated.')
  if (how === 'think') return reply('<think>working it out</think>Try the dal. It is cheap and warming.')
  return reply(`Answer from ${body.model}. It is a good pick, with a reason.`)
}
const reset = (b = {}) => { behaviour = b; calls.length = 0; resetFreeAi() }
const ask = (q = 'what should i eat') => askFree('system', [{ role: 'user', text: q }])
const timed = async (fn) => { const t = Date.now(); const r = await fn(); return [r, Date.now() - t] }

// the order, and what is sent where
check('the fast LLM7 model is first and the slow service is not', ENDPOINTS[0].name === 'llm7:gpt-oss' && ENDPOINTS.findIndex((e) => e.name === 'pollinations') > 1)
reset()
let [r, ms] = await timed(() => ask())
check('a healthy network answers from the first service, quickly', r?.via === 'llm7:gpt-oss' && ms < 500 && calls.length === 1, `${r?.via} ${ms}ms ${calls.length} calls`)
check('nothing is sent to the paid key', calls.every((c) => !/google|gemini|generativelanguage/i.test(c.url)))
reset({ 'gpt-oss:20b': 'ok', 'mistral-Nemo-Instruct-2407': 'ok', 'openai-fast': 'ok' })
await Promise.all([ask('a'), ask('b')])
const pol = calls.filter((c) => c.url.includes('pollinations'))
check('reasoning_effort goes to Pollinations only, never LLM7 (which answers 400)', calls.filter((c) => c.url.includes('llm7')).every((c) => !('reasoning_effort' in c.body)) && pol.every((c) => c.body.reasoning_effort === 'low'))

// slowness and failure
reset({ 'gpt-oss:20b': 'hang' })
;[r, ms] = await timed(() => ask())
check('a service that hangs does not hold the others up: the next joins the race', r?.via === 'llm7:nemo' && ms > 3000 && ms < 5500, `${r?.via} ${ms}ms`)
reset({ 'gpt-oss:20b': 'down' })
;[r, ms] = await timed(() => ask())
check('one that fails at once is replaced at once, not after the wait', r?.via === 'llm7:nemo' && ms < 600, `${r?.via} ${ms}ms`)
for (const how of ['empty', 'errorbody', 'notice']) {
  reset({ 'gpt-oss:20b': how })
  ;[r, ms] = await timed(() => ask())
  check(`"${how}" is not an answer, and is not returned as one`, r?.via === 'llm7:nemo' && ms < 600, `${r?.via} ${r?.text}`)
}
reset({ 'gpt-oss:20b': 'think' })
r = await ask()
check('reasoning is stripped from an answer', r?.text === 'Try the dal. It is cheap and warming.', r?.text)
check('looksBad catches an error body, a notice and nothing', looksBad('{"x":1}') && looksBad('IMPORTANT NOTICE: moved') && looksBad('hm') && !looksBad('Try the dal. It is cheap.'))
check('cleanFreeAnswer drops markdown and a trailing advert', cleanFreeAnswer('**Dal.** Cheap.\n\n**Powered by Pollinations**') === 'Dal. Cheap.')

// the breaker
reset({ 'gpt-oss:20b': 'down' })
await ask('one'); await ask('two')
check('two failures in a row mark a service down', freeHealth().find((h) => h.name === 'llm7:gpt-oss').down)
calls.length = 0
await ask('three')
check('and the next question does not wait on it', !calls.some((c) => c.model === 'gpt-oss:20b'), calls.map((c) => c.model).join(','))
check('it comes back: forgiven once the time is up', !freeHealth(Date.now() + 10 * 60_000).find((h) => h.name === 'llm7:gpt-oss').down)
reset({ 'gpt-oss:20b': 'down', 'mistral-Nemo-Instruct-2407': 'down', 'openai-fast': 'down', 'minimax-m2.7': 'down', 'codestral-latest': 'down' })
;[r, ms] = await timed(() => ask('all down'))
check('every service down: null, quickly, not a long wait', r === null && ms < 1500, `${r} ${ms}ms`)
await ask('again'); await ask('and again')
calls.length = 0
await ask('still')
check('with every one marked down they are all still tried', calls.length === ENDPOINTS.length, `${calls.length}`)

// memory
reset()
await ask('Something cheap and spicy')
await ask('  something CHEAP and spicy ')
check('the same first question twice is one trip', calls.length === 1, `${calls.length}`)
calls.length = 0
await askFree('system', [{ role: 'user', text: 'cheap' }, { role: 'model', text: 'dal' }, { role: 'user', text: 'why' }])
await askFree('system', [{ role: 'user', text: 'cheap' }, { role: 'model', text: 'dal' }, { role: 'user', text: 'why' }])
check('but a conversation is never answered from somebody else’s', calls.length === 2, `${calls.length}`)

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
