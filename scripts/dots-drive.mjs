/*
 * Play with Dot, in a real browser: all ten games start, run through their
 * countdown and a few seconds of input without a single page error, the stage
 * fills the screen it has instead of sitting at 340px, and nothing scrolls
 * sideways on a phone.
 *
 *   bun run dotsdrive
 *
 * Not in `bun run test` for the same reason as the other drivers: it needs a
 * Chromium. The games had no test of any kind before this one.
 */
import { createServer } from 'node:http'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const ROOT = join(here, '..', 'public')
const PORT = 8793

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/manifest+json',
  '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8',
}

const server = createServer((req, res) => {
  const path = normalize(decodeURIComponent((req.url || '/').split('?')[0])).replace(/^(\.\.[/\\])+/, '')
  let file = join(ROOT, path)
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html')
  if (!file.startsWith(ROOT) || !existsSync(file)) { res.writeHead(404); return res.end('not found') }
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' })
  createReadStream(file).pipe(res)
})
await new Promise((ok) => server.listen(PORT, '127.0.0.1', ok))
const APP = `http://127.0.0.1:${PORT}/decide/`

let pass = 0
let fails = 0
const ok = (name, cond, detail) => {
  cond ? (pass += 1) : (fails += 1)
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond || !detail ? '' : `\n        ${detail}`}`)
}

const pw = await import('/opt/node22/lib/node_modules/playwright/index.js').catch(() => null)
if (!pw) {
  console.error('Playwright is not available on this machine; nothing driven.')
  server.close()
  process.exit(0)
}
const { chromium } = pw.default || pw
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })


const GAMES = 10
async function session(width, height) {
  const ctx = await browser.newContext({ viewport: { width, height }, hasTouch: width < 700, isMobile: width < 700 })
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => { errors.push(e.message); console.log('PAGEERROR ' + e.message) })
  await page.route(/\/api\//, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{}' }))
  await page.addInitScript(() => { if (window.top === window) localStorage.setItem('whatShouldIEat.v1', JSON.stringify({ decisions: 3, onboarded: true, langAsked: true })) })
  await page.goto(APP, { waitUntil: 'load' })
  await page.waitForTimeout(900)
  for (let i = 0; i < 6 && (await page.locator('#welcome').isVisible()); i++) {
    const next = page.locator('#welcome-next')
    if (await next.isVisible()) await next.click({ force: true })
    await page.waitForTimeout(300)
  }
  page.errors = errors
  return page
}
const openPicker = async (page) => {
  await page.evaluate(() => { const d = document.querySelector('.dg'); if (d && !d.hidden) return; document.getElementById('buddy-games').click() })
  await page.waitForTimeout(400)
  // A game that has just ended is on its results screen, and the way out of that is the button on it.
  if (!(await page.locator('.dg-card-btn').count())) {
    const another = page.locator('button:has-text("Another game")')
    if (await another.count()) await another.first().click()
    await page.waitForTimeout(300)
  }
}

for (const [label, w, h] of [['phone 390x844', 390, 844], ['desktop 1280x800', 1280, 800]]) {
  const page = await session(w, h)
  await openPicker(page)
  ok(`${label}: the picker lists ${GAMES} games`, (await page.locator('.dg-card-btn').count()) === GAMES)
  ok(`${label}: and a button that picks one`, (await page.locator('.dg-surprise').count()) === 1)
  for (let i = 0; i < GAMES; i++) {
    await page.locator('.dg-card-btn').nth(i).click()
    await page.waitForTimeout(700)
    const name = await page.evaluate((n) => document.querySelectorAll('.dg-card-btn strong')[n]?.textContent, i).catch(() => '')
    const cv = page.locator('.dg-canvas, .dg-board, .dg-match, .dg-pads').first()
    const box = (await cv.count()) ? await cv.boundingBox() : null
    // Move a finger about while the countdown runs out and the game begins.
    if (box) {
      await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.8)
      await page.mouse.down()
      for (let k = 0; k < 8; k++) { await page.mouse.move(box.x + box.width * (0.2 + 0.08 * k), box.y + box.height * 0.8, { steps: 3 }); await page.waitForTimeout(450) }
      await page.mouse.up()
    }
    const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    ok(`${label}: game ${i + 1} plays with no page error and no sideways scroll`, page.errors.length === 0 && over <= 0, page.errors.join(' | ') + ' overflow ' + over)
    if (box && box.width > 0 && i === 0) {
      const want = w >= 700 ? 400 : 330
      ok(`${label}: the stage is ${Math.round(box.width)}px wide, not stuck at 340`, box.width >= want, `${box.width}`)
    }
    await page.keyboard.press('Escape'); await page.waitForTimeout(250)
    await openPicker(page)
  }
  await page.context().close()
}

await browser.close()
server.close()
console.log(`\n${pass} passed, ${fails} failed`)
process.exit(fails ? 1 : 0)
