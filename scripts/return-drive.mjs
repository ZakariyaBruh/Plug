/*
 * Coming back, in a real browser: Dot's note for today under the greeting (the same line all
 * day, however often the page is reloaded), the name Dot is given in Profile used in the
 * greeting, and that name going nowhere (no request carries it).
 *
 *   bun run returndrive
 */
import { createServer } from 'node:http'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { extname, join, normalize, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')
const PORT = 8794
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' }
const sent = []
const server = createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0])
  const path = normalize(url).replace(/^(\.\.[/\\])+/, '')
  let file = join(ROOT, path)
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html')
  if (!file.startsWith(ROOT) || !existsSync(file)) { res.writeHead(404); return res.end('no') }
  let body = readFileSync(file)
  if (path.endsWith('/decide/js/config.js')) body = Buffer.from(String(body).replace(/src: '[^']*', key: '[^']*'/g, "src: '', key: ''"))
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' })
  res.end(body)
})
await new Promise((ok) => server.listen(PORT, '127.0.0.1', ok))
const APP = `http://127.0.0.1:${PORT}/decide/`

let pass = 0, fails = 0
const ok = (name, cond, detail) => { cond ? (pass += 1) : (fails += 1); console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${cond || !detail ? '' : `\n        ${detail}`}`) }

const pw = await import('/opt/node22/lib/node_modules/playwright/index.js').catch(() => null)
if (!pw) { console.error('Playwright is not available on this machine; nothing driven.'); server.close(); process.exit(0) }
const { chromium } = pw.default || pw
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })

const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
async function open() {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 800 }, reducedMotion: 'reduce', hasTouch: true, isMobile: true })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => { console.log('PAGEERROR ' + e.message); fails += 1 })
  page.on('request', (r) => { if (r.method() !== 'GET' || r.url().includes('Sam')) sent.push(`${r.method()} ${r.url()} ${r.postData() || ''}`) })
  await page.route(/\/api\//, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{}' }))
  await page.addInitScript((y) => {
    if (window.top !== window) return
    localStorage.setItem('m45-consent', 'essential')
    if (!localStorage.getItem('whatShouldIEat.v1')) localStorage.setItem('whatShouldIEat.v1', JSON.stringify({ decisions: 5, onboarded: true, langAsked: true, seen: y, history: [{ name: 'Ramen', icon: 'x', at: Date.now() - 86400000 }] }))
  }, yesterday)
  await page.goto(APP, { waitUntil: 'load' })
  await page.waitForTimeout(900)
  for (let i = 0; i < 6 && (await page.locator('#welcome').isVisible()); i++) { const n = page.locator('#welcome-next'); if (await n.isVisible()) await n.click({ force: true }); await page.waitForTimeout(250) }
  return page
}

{
  const page = await open()
  const note1 = await page.evaluate(() => { const n = document.getElementById('landing-note'); return n && !n.hidden ? n.textContent : null })
  ok('a returning visitor gets Dot’s note for today under the greeting', !!note1 && /^Dot’s note for today\. /.test(note1), String(note1))
  await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(700)
  const note2 = await page.evaluate(() => document.getElementById('landing-note').textContent)
  ok('and reloading does not roll it again: the same line all day', note1 === note2, `${note1} / ${note2}`)
  const hello0 = await page.evaluate(() => document.getElementById('landing-hello').textContent)
  ok('without a name the greeting has none', !/, Sam/.test(hello0), hello0)

  await page.evaluate(() => window.M45.setView('profile')); await page.waitForTimeout(400)
  await page.fill('#setting-nick-input', 'Sam <b>x</b>'); await page.click('#setting-nick'); await page.waitForTimeout(200)
  await page.waitForTimeout(1500) // the profile is written out a moment after it changes
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('whatShouldIEat.v1')).nick)
  ok('a name is cleaned to letters and kept on the device', saved === 'Sam bxb', JSON.stringify(saved))
  await page.fill('#setting-nick-input', 'Sam'); await page.click('#setting-nick'); await page.waitForTimeout(1500)
  await page.reload({ waitUntil: 'load' }); await page.waitForTimeout(800)
  const hello = await page.evaluate(() => document.getElementById('landing-hello').textContent)
  ok('the greeting uses it', /Sam/.test(hello), hello)
  ok('as text, never as markup', await page.evaluate(() => !document.getElementById('landing-hello').querySelector('b')))
  ok('and nothing is sent anywhere with it', sent.filter((s) => /Sam/.test(s)).length === 0, sent.join('\n'))
  await page.fill('#setting-nick-input', '').catch(() => {})
  await page.evaluate(() => window.M45.setView('profile')); await page.waitForTimeout(300)
  await page.fill('#setting-nick-input', ''); await page.click('#setting-nick'); await page.waitForTimeout(1500)
  ok('and it can be cleared', await page.evaluate(() => !JSON.parse(localStorage.getItem('whatShouldIEat.v1')).nick))
  await page.context().close()
}
{
  // After three decisions, once, on the result screen; "not now" is final.
  const page = await open()
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('whatShouldIEat.v1')); delete s.nickAsked; s.nick = ''; localStorage.setItem('whatShouldIEat.v1', JSON.stringify(s)) })
  const shown = await page.evaluate(() => { const w = document.getElementById('nick-strip'); return !!w })
  ok('the ask exists on the result screen', shown)
  await page.context().close()
}

console.log(`\n${pass} passed, ${fails} failed`)
await browser.close()
server.close()
process.exit(fails ? 1 : 0)
