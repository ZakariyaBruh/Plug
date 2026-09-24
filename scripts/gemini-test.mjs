/*
 * lib/gemini.ts, against a fake Gemini. What matters is not that it calls
 * fetch but the three behaviours the live failures taught:
 *  - a fast refusal from the first model starts the backup at once, rather
 *    than after the stagger;
 *  - a first model that just hangs is overtaken by the backup;
 *  - the backup is a DIFFERENT model, since overload is per model;
 *  - when both fail, the caller gets null and the last status, not a throw.
 */
import { GEMINI_MODELS, askGemini } from '../src/lib/gemini.ts'

let failed = 0
const check = (ok, name) => {
  console.log((ok ? 'PASS ' : 'FAIL ') + name)
  if (!ok) failed++
}
const quiet = console.error
console.error = () => {}

const ok = () => new Response(JSON.stringify({ candidates: [] }), { status: 200 })
const hang = (init) =>
  new Promise((_, reject) => init.signal.addEventListener('abort', () => reject(new Error('aborted'))))
function fake(behaviour) {
  const calls = []
  globalThis.fetch = (url, init) => {
    const model = /models\/([^:]+):/.exec(url)[1]
    calls.push(model)
    return behaviour[model](init)
  }
  return calls
}

check(GEMINI_MODELS[0] !== GEMINI_MODELS[1], 'the backup is a different model')

let calls = fake({ [GEMINI_MODELS[0]]: () => Promise.resolve(new Response('', { status: 503 })), [GEMINI_MODELS[1]]: () => Promise.resolve(ok()) })
let t = Date.now()
let out = await askGemini('k', '{}', 'test')
check(out.res?.ok && Date.now() - t < 500, `a fast 503 hands over to the backup at once (${Date.now() - t}ms)`)
check(calls.join() === GEMINI_MODELS.join(), 'first model, then the other one')

calls = fake({ [GEMINI_MODELS[0]]: hang, [GEMINI_MODELS[1]]: () => Promise.resolve(ok()) })
t = Date.now()
out = await askGemini('k', '{}', 'test')
const took = Date.now() - t
check(out.res?.ok && took >= 2400 && took < 3500, `a hanging first model is overtaken after the stagger (${took}ms)`)

calls = fake({ [GEMINI_MODELS[0]]: () => Promise.resolve(ok()), [GEMINI_MODELS[1]]: () => Promise.resolve(ok()) })
out = await askGemini('k', '{}', 'test')
await new Promise((r) => setTimeout(r, 2700))
check(out.res?.ok && calls.length === 1, 'a quick answer means no second request is spent')

fake({ [GEMINI_MODELS[0]]: () => Promise.resolve(new Response('', { status: 503 })), [GEMINI_MODELS[1]]: () => Promise.resolve(new Response('', { status: 429 })) })
out = await askGemini('k', '{}', 'test')
check(out.res === null && out.lastStatus === 429, 'both refusing gives null and the last status')

console.error = quiet
if (failed) {
  console.error(failed + ' failed')
  process.exit(1)
}
