/*
 * The ad dock, in a real browser, against a fake ad network.
 *
 *   bun run adsdrive
 *
 * No real unit is needed, and none is contacted: the driver serves public/ itself,
 * rewrites config.js on the way out to point the units at a script it also serves,
 * and checks what the app does with them. The fake creative is deliberately rude. It
 * tries to read the page's storage, reach into its DOM and redirect the tab, and reports
 * what the browser let it do, so the sandbox is tested by an attacker and not by
 * reading its attribute.
 *
 * What it asserts is the list of promises made on the privacy page:
 *   - nothing is drawn, and nothing is requested, until a unit is configured
 *   - from the first visit: an ad strip along the bottom, whatever Save-Data or a stored "ads off" say
 *   - it is over the page and never pushes it: nothing above it moves when it loads, and it never
 *     sits on a control (the answer buttons, the Ask button, a game's Pause)
 *   - it is there during the decide questions, in every game, and in Ask
 *   - one banner on a phone and two on a wide screen, and a fresh one about once a minute
 *   - nothing at all for Premium, not even a flash
 *   - the cookie choice changes HOW it loads (cookie-free, no referrer), never WHETHER
 *   - the welcome screen is not covered by it
 *   - the creative can read nothing of ours and cannot move the tab
 *
 * Playwright is not a dependency of this project; it is on the machine and
 * imported by path, as in play-drive.
 */
import { createServer } from 'node:http'
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const ROOT = join(here, '..', 'public')
const PORT = 8793
const KEY = 'whatShouldIEat.v1'

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8',
}

let configured = true // flipped per scenario: are the units live, or stripped out as if none were pasted?
const adRequests = []
const reports = []

// A creative that behaves as badly as the sandbox allows it to, and says what happened.
const FAKE_AD = `
(function () {
  var o = window.atOptions || {};
  var r = { key: o.key, w: o.width, h: o.height };
  try { r.storage = typeof localStorage.getItem('${KEY}'); } catch (e) { r.storage = 'blocked'; }
  try { r.parentDom = typeof window.parent.document.title; } catch (e) { r.parentDom = 'blocked'; }
  try { window.top.location.href = 'https://example.com/hijacked'; r.top = 'allowed'; } catch (e) { r.top = 'blocked'; }
  try { document.cookie = 'ad=1'; r.cookie = document.cookie ? 'readable' : 'empty'; } catch (e) { r.cookie = 'blocked'; }
  document.body.insertAdjacentHTML('beforeend', '<div style="width:' + r.w + 'px;height:' + r.h + 'px;background:#ccc"></div>');
  window.parent.postMessage({ fakeAd: r }, '*');
})();`

const server = createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0])
  if (url.startsWith('/fake-ad/')) {
    adRequests.push(url)
    res.writeHead(200, { 'Content-Type': 'text/javascript' })
    return res.end(FAKE_AD)
  }
  const path = normalize(url).replace(/^(\.\.[/\\])+/, '')
  let file = join(ROOT, path)
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html')
  if (!file.startsWith(ROOT) || !existsSync(file)) { res.writeHead(404); return res.end('not found') }
  let body = readFileSync(file)
  if (path.endsWith('/decide/js/config.js')) {
    // The shipped file carries the real keys and the real network. Either take them out (as if
    // nothing had been pasted) or keep the keys and point the network at the fake one here.
    body = Buffer.from(configured
      ? String(body).replaceAll('https://bauval.org/22/', `http://127.0.0.1:${PORT}/fake-ad/`)
      : String(body).replace(/src: '[^']*', key: '[^']*'/g, "src: '', key: ''"))
  }
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' })
  res.end(body)
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
if (!pw) { console.error('Playwright is not available on this machine; nothing driven.'); server.close(); process.exit(0) }
const { chromium } = pw.default || pw
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })

async function open({ width = 1280, height = 800, decisions = 0, premium = false, askFirst = false, consent = null, saveData = false, keepWelcome = false, premiumDelay = 0 } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce', hasTouch: width < 700, isMobile: width < 700 })
  const page = await ctx.newPage()
  page.on('pageerror', (e) => { console.log('PAGEERROR ' + e.message); fails += 1 })
  // Playwright tries the most recently added route first, so the specific one goes last.
  await page.route(/\/api\//, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{}' }))
  await page.route(/\/api\/region/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ askFirst }) }))
  await page.route(/\/api\/premium-status/, async (r) => { if (premiumDelay) await new Promise((x) => setTimeout(x, premiumDelay)); return r.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ signedIn: premium, hasPremium: premium, username: premium ? 'tester' : '', userId: premium ? 'u1' : null }),
  }) })
  await page.addInitScript(([k, n, c, sd]) => {
    if (window.top !== window) return // the ad's own frame: no storage there, by design
    if (c && !localStorage.getItem('m45-consent')) localStorage.setItem('m45-consent', c)
    if (sd) Object.defineProperty(navigator, 'connection', { value: { saveData: true }, configurable: true })
    if (n && !localStorage.getItem(k)) localStorage.setItem(k, JSON.stringify({ decisions: n, onboarded: true, langAsked: true }))
    window.__ad = []
    window.addEventListener('message', (e) => { if (e.data && e.data.fakeAd) window.__ad.push(e.data.fakeAd) })
  }, [KEY, decisions, consent, saveData])
  await page.goto(APP, { waitUntil: 'load' })
  await page.waitForTimeout(800)
  for (let i = 0; !keepWelcome && i < 6 && (await page.locator('#welcome').isVisible()); i++) {
    const next = page.locator('#welcome-next')
    if (await next.isVisible()) await next.click({ force: true })
    await page.waitForTimeout(300)
  }
  await page.waitForTimeout(500)
  return page
}
const go = (page, v) => page.evaluate((v) => window.M45.setView(v), v).then(() => page.waitForTimeout(500))
const frames = (page) => page.evaluate(() => [...document.querySelectorAll('#ad-dock iframe')].map((f) => ({ w: f.width, h: f.height, sandbox: f.getAttribute('sandbox'), mode: f.getAttribute('data-mode'), cl: f.hasAttribute('credentialless'), ref: f.getAttribute('referrerpolicy') })))
const dockBox = (page) => page.evaluate(() => { const d = document.getElementById('ad-dock'); if (!d) return null; const r = d.getBoundingClientRect(); return { top: r.top, bottom: r.bottom, h: r.height, vh: window.innerHeight, anchor: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--anchor-h')), fixed: getComputedStyle(d).position === 'fixed' } })
// Is the point at the centre of this element reachable, or is something (the dock) on top of it?
const reachable = (page, sel) => page.evaluate((sel) => { const el = document.querySelector(sel); if (!el) return null; el.scrollIntoView({ block: 'center' }); const r = el.getBoundingClientRect(); const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !!hit && (el === hit || el.contains(hit)) }, sel)

/* ------------------------------------------------ nothing configured */
configured = false
{
  adRequests.length = 0
  const page = await open({ decisions: 5 })
  await go(page, 'dishes'); await go(page, 'chat')
  ok('with no unit configured nothing is drawn', (await frames(page)).length === 0 && (await dockBox(page)) === null)
  ok('and nothing is requested from any network', adRequests.length === 0, adRequests.join(', '))
  ok('and nothing is reserved at the bottom of the page', await page.evaluate(() => !document.body.classList.contains('has-dock')))
  await page.context().close()
}

/* ------------------------------------------------ configured */
configured = true
{
  // From the first visit, on a phone: one banner, along the bottom, above the tab bar. Save-Data and a stored "off" do nothing.
  adRequests.length = 0
  const page = await open({ width: 390, height: 800, decisions: 0, saveData: true })
  await page.evaluate(() => { try { localStorage.setItem('ads', 'off'); localStorage.setItem('m45-ads', '0') } catch (e) {} })
  await page.waitForTimeout(800)
  const f = await frames(page), d = await dockBox(page)
  ok('from the first visit, with Save-Data on, there is an ad', f.length === 1 && f[0].w === '320' && f[0].h === '50', JSON.stringify(f))
  ok('it is fixed along the bottom, above the tab bar', d && d.fixed && d.bottom <= d.vh && d.bottom > d.vh - 120, JSON.stringify(d))
  ok('and the page has reserved exactly its height', d && Math.abs(d.anchor - d.h) < 1.5, JSON.stringify(d))
  ok('the cookie notice is there to change how it loads', await page.locator('.consent:not([hidden])').count() === 1)
  await page.context().close()
}
{
  // A wide screen: two banners. And it overlays: nothing above it moves when it arrives.
  const page = await open({ width: 1280, height: 800, decisions: 5 })
  await page.waitForTimeout(900)
  const f = await frames(page)
  ok('a wide screen gets two banners side by side (728x90 and 468x60)', f.length === 2 && f[0].w === '728' && f[1].w === '468', JSON.stringify(f))
  await page.evaluate(() => { document.getElementById('ad-dock').remove(); document.documentElement.style.setProperty('--anchor-h', '0px'); document.body.classList.remove('has-dock') })
  const before = await page.evaluate(() => Math.round(document.querySelector('.landing-ask, #landing-start').getBoundingClientRect().top))
  await page.evaluate(() => Ads.premiumKnown(false)); await page.waitForTimeout(900)
  const after = await page.evaluate(() => Math.round(document.querySelector('.landing-ask, #landing-start').getBoundingClientRect().top))
  ok('nothing above the strip moves when it arrives', before === after, `${before} vs ${after}`)
  await page.context().close()
}
{
  // Everywhere the app is, and never on top of something to tap.
  const page = await open({ width: 390, height: 800, decisions: 5 })
  await page.waitForTimeout(800)
  ok('the front page has it', (await frames(page)).length === 1)
  await page.click('#landing-start'); await page.waitForTimeout(600)
  const q = await dockBox(page)
  ok('while the questions are asked it is there, along the bottom', q && q.fixed && q.bottom <= q.vh && q.bottom > q.vh - 120, JSON.stringify(q))
  await page.click('.consent [data-c="essential"]'); await page.waitForTimeout(300)
  ok('and it does not sit on the answer buttons', (await reachable(page, '#choice-yes')) && (await reachable(page, '#choice-no')))
  await page.evaluate(() => window.M45.setView('chat')); await page.waitForTimeout(500)
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await page.waitForTimeout(300)
  const c = await dockBox(page)
  ok('in Ask it is there, above the tab bar', c && c.bottom < c.vh && c.bottom > c.vh - 120, JSON.stringify(c))
  ok('and it does not sit on the Ask button or the box', (await reachable(page, '#chat-send')) && (await reachable(page, '#chat-input')))
  await page.evaluate(() => window.M45.setView('dishes')); await page.waitForTimeout(400)
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight)); await page.waitForTimeout(300)
  ok('the last row of Dishes can be scrolled clear of it', await page.evaluate(() => { const rows = document.querySelectorAll('.dish'); const r = rows[rows.length - 1].getBoundingClientRect(); const d = document.getElementById('ad-dock').getBoundingClientRect(); return r.bottom <= d.top + 1 }))
  await page.context().close()
}
{
  // In a game: over the game, at the very bottom, and not on the game's own buttons.
  const page = await open({ width: 390, height: 800, decisions: 5 })
  await page.waitForTimeout(800)
  await page.evaluate(() => window.M45.Play.open('arena')); await page.waitForSelector('.pg-canvas'); await page.waitForTimeout(500)
  const g = await dockBox(page)
  ok('in a game the strip is still there, at the very bottom', g && g.fixed && Math.abs(g.bottom - g.vh) < 2, JSON.stringify(g))
  ok('and sits over the game panel (the games are under it)', await page.evaluate(() => { const d = document.getElementById('ad-dock'); const r = d.getBoundingClientRect(); const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return d === hit || d.contains(hit) }))
  ok('the game’s Pause and Quit buttons are clear of it', (await reachable(page, '.pg-pause')) && (await reachable(page, '.pg-quit')))
  ok('and so is the close button', await reachable(page, '.pg-x'))
  const box = await page.locator('.pg-canvas').boundingBox()
  ok('the stage fits above it', box.y + box.height <= g.top + 1, `${box.y + box.height} vs ${g.top}`)
  await page.context().close()
  const wide = await open({ width: 1280, height: 800, decisions: 5 })
  await wide.waitForTimeout(800)
  await wide.evaluate(() => window.M45.Play.open('merge')); await wide.waitForSelector('.pg-canvas'); await wide.waitForTimeout(500)
  const wd = await dockBox(wide)
  ok('on a desktop the game panel stops above the strip', await wide.evaluate(() => { const p = document.querySelector('.pg-panel').getBoundingClientRect(); const d = document.getElementById('ad-dock').getBoundingClientRect(); return p.bottom <= d.top + 1 }), JSON.stringify(wd))
  await wide.context().close()
}
{
  // The first screen a new visitor sees is the welcome, and the strip is not on top of its button.
  const page = await open({ width: 390, height: 800, decisions: 0, keepWelcome: true })
  await page.waitForTimeout(900)
  ok('the welcome screen’s Next button is reachable', await page.evaluate(() => { const el = document.getElementById('welcome-next'); const r = el.getBoundingClientRect(); const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return el === hit || el.contains(hit) }))
  await page.context().close()
}
{
  // Swapped for a fresh one about once a minute.
  const ctx = await browser.newContext({ viewport: { width: 390, height: 800 }, reducedMotion: 'reduce', hasTouch: true, isMobile: true })
  const page = await ctx.newPage()
  await page.clock.install()
  await page.route(/\/api\/premium-status/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ signedIn: false, hasPremium: false, username: '', userId: null }) }))
  await page.route(/\/api\/region/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"askFirst":false}' }))
  await page.route(/\/api\//, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{}' }), { times: 0 }).catch(() => {})
  await page.addInitScript(() => { if (window.top === window) { localStorage.setItem('m45-consent', 'all'); localStorage.setItem('whatShouldIEat.v1', JSON.stringify({ decisions: 3, onboarded: true, langAsked: true })) } })
  await page.goto(APP, { waitUntil: 'load' }); await page.clock.runFor(1500)
  await page.evaluate(() => { window.__first = document.querySelector('#ad-dock iframe') })
  await page.clock.runFor(61000)
  ok('about a minute later the ad is swapped for a fresh one', await page.evaluate(() => { const now = document.querySelector('#ad-dock iframe'); return !!window.__first && !!now && now !== window.__first && !window.__first.isConnected }))
  await ctx.close()
}
{
  // Premium: nothing, and not even a flash while it is being found out.
  const page = await open({ width: 390, height: 800, decisions: 5, premium: true, premiumDelay: 700 })
  await page.waitForTimeout(300)
  const early = await page.evaluate(() => !!document.getElementById('ad-dock'))
  await page.waitForTimeout(1500)
  ok('a Premium member sees no strip, and none while it is being checked', !early && (await dockBox(page)) === null && await page.evaluate(() => !document.body.classList.contains('has-dock')))
  for (const v of ['chat', 'dishes', 'profile']) { await go(page, v) }
  ok('on any screen', (await frames(page)).length === 0)
  await page.evaluate(() => window.M45.Play.open('stack')); await page.waitForTimeout(500)
  ok('or in a game', (await frames(page)).length === 0 && (await dockBox(page)) === null)
  await page.context().close()
}
{
  // The sandbox, tested by an attacker.
  adRequests.length = 0
  const page = await open({ width: 1280, height: 800, decisions: 5 })
  await page.waitForTimeout(1500)
  const rep = await page.evaluate(() => window.__ad[0])
  const f = await frames(page)
  ok('the creative ran', !!rep, 'no report came back from the fake ad')
  ok('and could not read this page’s storage', rep && rep.storage === 'blocked', JSON.stringify(rep))
  ok('or reach into its DOM', rep && rep.parentDom === 'blocked', JSON.stringify(rep))
  ok('or redirect the tab', rep && rep.top === 'blocked' && page.url().startsWith(APP), `${JSON.stringify(rep)} ${page.url()}`)
  ok('the sandbox has neither forbidden flag', f[0] && !/allow-same-origin|allow-top-navigation/.test(f[0].sandbox), f[0] && f[0].sandbox)
  ok('and the label offers Premium as the way out', await page.evaluate(() => /Remove ads with Premium/.test(document.querySelector('#ad-dock .ad-label').textContent)))
  await page.context().close()
}
{
  // Where the law says to ask first. The ads are still there; they just load without cookies.
  adRequests.length = 0
  const page = await open({ decisions: 0, askFirst: true })
  await page.waitForTimeout(900)
  let f1 = await frames(page)
  ok('opt-in region, nothing chosen: the ads are still shown', f1.length >= 1, JSON.stringify(f1))
  ok('and every one is loaded cookie-free: credentialless, no referrer', f1.length >= 1 && f1.every((f) => f.mode === 'cookieless' && f.cl && f.ref === 'no-referrer'), JSON.stringify(f1))
  ok('the two buttons are equally easy to reach', await page.locator('.consent [data-c="all"]').isVisible() && await page.locator('.consent [data-c="essential"]').isVisible())
  ok('and the cookie notice is not underneath the strip', await page.evaluate(() => { const c = document.querySelector('.consent').getBoundingClientRect(); const d = document.getElementById('ad-dock').getBoundingClientRect(); return c.bottom <= d.top + 1 }))
  await page.locator('.consent [data-c="all"]').click(); await page.waitForTimeout(1200)
  f1 = await frames(page)
  ok('Accept all: the ads load the normal way', f1.length >= 1 && f1.every((f) => !f.mode && !f.cl), JSON.stringify(f1))
  ok('and the notice goes away', await page.locator('.consent:not([hidden])').count() === 0)
  await page.evaluate(() => Consent.show()); await page.waitForTimeout(200)
  await page.locator('.consent [data-c="essential"]').click(); await page.waitForTimeout(1200)
  f1 = await frames(page)
  ok('taking it back does NOT take the ads away: they reload cookie-free', f1.length >= 1 && f1.every((f) => f.mode === 'cookieless' && f.cl), JSON.stringify(f1))
  ok('and the choice is kept for next time', await page.evaluate(() => localStorage.getItem('m45-consent') === 'essential'))
  await page.context().close()
}
{
  // Said no on an earlier visit: still ads, still cookie-free, and no nagging.
  const page = await open({ decisions: 0, askFirst: true, consent: 'essential' })
  await page.waitForTimeout(900)
  const fr = await frames(page)
  ok('an earlier "Essential only" still gets ads', fr.length >= 1 && fr.every((f) => f.mode === 'cookieless'), JSON.stringify(fr))
  ok('and the notice does not nag', await page.locator('.consent:not([hidden])').count() === 0)
  await page.context().close()
}

console.log(`\n${pass} passed, ${fails} failed`)
await browser.close()
server.close()
process.exit(fails ? 1 : 0)
