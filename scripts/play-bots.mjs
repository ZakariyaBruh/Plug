/*
 * Play with Dot, played by a bot: the two games that are made of timing (Chop Chop and
 * Slice) are driven the way a decent player would drive them, to check that the rules
 * do what the start card says and that a good run is rewarded and a bad one is not.
 *
 *   bun run playbots
 *
 * Chop Chop: a bot that taps each food when it reaches the line should keep every heart, build
 * a combo, and be paid more than a bot that never taps. Slice: a bot that swipes through food
 * should score, a bot that does nothing should lose its hearts to what it let fall, and a bomb
 * that is cut should cost a heart.
 */
import { createServer } from 'node:http'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { extname, join, normalize, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')
const PORT = 8795
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' }
const server = createServer((req, res) => {
  const path = normalize(decodeURIComponent((req.url || '/').split('?')[0])).replace(/^(\.\.[/\\])+/, '')
  let file = join(ROOT, path)
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html')
  if (!file.startsWith(ROOT) || !existsSync(file)) { res.writeHead(404); return res.end('no') }
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' })
  createReadStream(file).pipe(res)
})
await new Promise((ok) => server.listen(PORT, '127.0.0.1', ok))
let pass = 0, fails = 0
const ok = (name, cond, detail) => { cond ? (pass += 1) : (fails += 1); console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond || !detail ? '' : `\n        ${detail}`}`) }

const pw = await import('/opt/node22/lib/node_modules/playwright/index.js').catch(() => null)
if (!pw) { console.error('Playwright is not available on this machine; nothing driven.'); server.close(); process.exit(0) }
const { chromium } = pw.default || pw
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })

async function start(id) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 800 }, isMobile: true, hasTouch: true })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => { console.log('PAGEERROR ' + e.message); fails += 1 })
  await page.route(/\/api\//, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{}' }))
  await page.addInitScript(() => { if (window.top !== window) return; localStorage.setItem('m45-consent', 'essential'); localStorage.setItem('whatShouldIEat.v1', JSON.stringify({ decisions: 5, onboarded: true, langAsked: true })) })
  await page.goto(`http://127.0.0.1:${PORT}/decide/`, { waitUntil: 'load' })
  await page.waitForTimeout(1000)
  for (let i = 0; i < 6 && (await page.locator('#welcome').isVisible()); i++) { const n = page.locator('#welcome-next'); if (await n.isVisible()) await n.click({ force: true }); await page.waitForTimeout(250) }
  await page.evaluate((id) => window.M45.Play.open(id), id); await page.waitForSelector('.pg-canvas')
  const box = await page.locator('.pg-canvas').boundingBox()
  await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
  await page.waitForFunction(() => M45Play._st.phase === 'play', null, { timeout: 8000 })
  return { ctx, page }
}
const snap = (page) => page.evaluate(() => ({ score: M45Play._st.score, lives: M45Play._st.lives, combo: M45Play._st.combo, mult: M45Play._st.mult, phase: M45Play._st.phase }))

/* ---------------------------------------------------------------- Chop Chop */
{
  const { ctx, page } = await start('chop')
  await page.evaluate(() => {
    const st = M45Play._st, cv = st.cv
    const fire = (type, x, y) => { const r = cv.getBoundingClientRect(); cv.dispatchEvent(new PointerEvent(type, { clientX: r.left + x / st.W * r.width, clientY: r.top + y / st.H * r.height, pointerId: 1, bubbles: true })) }
    setInterval(() => { const zy = st.H - 138; st.items.forEach((it) => { if (!it.gone && !it.bomb && Math.abs(it.y - zy) < 9 && !it.tapped) { it.tapped = true; fire('pointerdown', 12 + it.lane * 84 + 42, zy); fire('pointerup', 12 + it.lane * 84 + 42, zy) } }) }, 16)
  })
  await page.waitForTimeout(14000)
  const s = await snap(page)
  ok('Chop Chop: a bot that taps on the line keeps every heart', s.lives === 3 && s.phase === 'play', JSON.stringify(s))
  ok('and builds a combo and a multiplier', s.combo >= 15 && s.mult >= 2, JSON.stringify(s))
  ok('and is paid well for it', s.score > 500, JSON.stringify(s))
  await ctx.close()
}
{
  const { ctx, page } = await start('chop')
  await page.waitForTimeout(16000)
  const s = await snap(page)
  ok('Chop Chop: a player who does nothing loses their hearts to what gets past, and the game ends', s.lives === 0 && s.phase === 'over' && s.score === 0, JSON.stringify(s))
  await ctx.close()
}
{
  const { ctx, page } = await start('chop')
  // tapping in empty lanes is whiffing: no hearts lost for it, and the combo goes
  const r = await page.evaluate(() => {
    const st = M45Play._st; st.combo = 7; const cv = st.cv, rect = cv.getBoundingClientRect()
    cv.dispatchEvent(new PointerEvent('pointerdown', { clientX: rect.left + 40 / st.W * rect.width, clientY: rect.top + (st.H - 138) / st.H * rect.height, pointerId: 1, bubbles: true }))
    return { combo: st.combo, lives: st.lives }
  })
  ok('Chop Chop: a tap with nothing at the line is a whiff: the combo goes, no heart does', r.combo === 0 && r.lives === 3, JSON.stringify(r))
  await ctx.close()
}

/* -------------------------------------------------------------------- Slice */
{
  const { ctx, page } = await start('slice')
  const r = await page.evaluate(async () => {
    const st = M45Play._st, cv = st.cv, rect = () => cv.getBoundingClientRect()
    const fire = (type, x, y) => { const q = rect(); cv.dispatchEvent(new PointerEvent(type, { clientX: q.left + x / st.W * q.width, clientY: q.top + y / st.H * q.height, pointerId: 1, bubbles: true })) }
    // a stationary bomb in the middle, a swipe through it
    st.items.length = 0; st.waveT = 99
    st.items.push({ kind: 'bomb', spr: 'bomb', x: 180, y: 300, vx: 0, vy: -1, rot: 0, vr: 0, r: 24, gone: false, age: 1 })
    const before = st.lives
    fire('pointerdown', 120, 300); fire('pointermove', 240, 300); fire('pointerup', 240, 300)
    const afterBomb = st.lives
    // three foods in a row, one stroke
    st.inv = 0
    for (let i = 0; i < 3; i++) st.items.push({ kind: 'food', spr: 'tomato', x: 110 + i * 70, y: 360, vx: 0, vy: -1, rot: 0, vr: 0, r: 27, gone: false, age: 1 })
    const s0 = st.score
    fire('pointerdown', 70, 360); for (let x = 90; x <= 300; x += 20) fire('pointermove', x, 360); fire('pointerup', 300, 360)
    await new Promise((r2) => setTimeout(r2, 700))
    return { before, afterBomb, gained: st.score - s0 }
  })
  ok('Slice: cutting a bomb costs a heart', r.afterBomb === r.before - 1, JSON.stringify(r))
  ok('and three foods in one stroke are 3 x 10 plus a chain bonus', r.gained === 45, JSON.stringify(r))
  await ctx.close()
}
{
  const { ctx, page } = await start('slice')
  await page.waitForTimeout(15000)
  const s = await snap(page)
  ok('Slice: food left to fall costs hearts until it is over', s.lives < 3, JSON.stringify(s))
  await ctx.close()
}

await browser.close(); server.close()
console.log(`\n${pass} passed, ${fails} failed`)
process.exit(fails ? 1 : 0)
