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
import './ads-on.mjs'
import { createServer } from 'node:http'
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'
import { adFramePage } from '../src/routes/ad-frame.ts'
import { adsCheckPage } from '../src/routes/ads-check.ts'

const here = dirname(fileURLToPath(import.meta.url))
const ROOT = join(here, '..', 'public')
const PORT = 8793
const KEY = 'whatShouldIEat.v1'

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon', '.txt': 'text/plain; charset=utf-8',
}

let adsOff = false // serve config.js exactly as shipped: the master switch off
let rude = false // the in-page creative also tries every popunder trick
let inplace = false // the snippet run in the page itself: draws where its script sits, as the network's does
let polite = false // a creative that draws and nothing else, for the one page that runs it unsandboxed
let blocked = false // the script cannot be fetched at all (a blocker, a filter)
let silent = false // the network answers every request with an empty script, as it does for a unit it will not fill
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

// What the network's script does when it is in the page: note the options it was given, draw a box where it sits.
const INPLACE_AD = `(function () { var o = window.atOptions || {}; (window.__direct = window.__direct || []).push(o.key + ':' + o.width + 'x' + o.height); var p = document.currentScript && document.currentScript.parentNode; if (p) p.insertAdjacentHTML('beforeend', '<div class="fake" style="width:' + o.width + 'px;height:' + o.height + 'px;background:#ccc"></div>'); })();`

// The same creative, tried as the worst kind: it opens windows on load, from a link it makes and clicks itself, on the first
// real tap, and from a frame it draws for itself. None may open.
const RUDE_AD = `(function () { var o = window.atOptions || {}; var p = document.currentScript.parentNode; var U = 'http://127.0.0.1:${PORT}/popunder';
  try { window.open(U + '1') } catch (e) {}
  var a = document.createElement('a'); a.href = 'http://example.com/pop'; a.target = '_blank'; document.body.appendChild(a); a.click();
  document.addEventListener('click', function () { try { window.open(U + '2') } catch (e) {} });
  var f = document.createElement('iframe'); p.appendChild(f);
  document.addEventListener('click', function () { try { f.contentWindow.open(U + '3') } catch (e) {} });
  p.insertAdjacentHTML('beforeend', '<div class="fake" style="width:' + o.width + 'px;height:' + o.height + 'px;background:#ccc"></div>'); })();`

const server = createServer((req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0])
  if (url.startsWith('/fake-ad/') && blocked) { res.writeHead(404); return res.end('no') }
  if (url === '/ads-check') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    return res.end(adsCheckPage().replaceAll('https://bauval.org/22/', `http://127.0.0.1:${PORT}/fake-ad/`))
  }
  if (url.startsWith('/fake-ad/')) {
    adRequests.push(url)
    res.writeHead(200, { 'Content-Type': 'text/javascript' })
    return res.end(silent ? '' : inplace ? (rude ? RUDE_AD : INPLACE_AD) : polite ? "document.body.insertAdjacentHTML('beforeend', '<div style=\"width:320px;height:50px;background:#ccc\"></div>');" : FAKE_AD)
  }
  if (url === '/ad-frame') {
    // The real route's page, pointed at the fake network (and nothing when no unit is configured).
    const u = new URL(req.url, 'http://x').searchParams.get('u')
    const html = configured ? adFramePage(u) : null
    if (!html) { res.writeHead(404); return res.end('not found') }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Referrer-Policy': 'origin' })
    return res.end(html.replaceAll('https://bauval.org/22/', `http://127.0.0.1:${PORT}/fake-ad/`))
  }
  const path = normalize(url).replace(/^(\.\.[/\\])+/, '')
  let file = join(ROOT, path)
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html')
  if (!file.startsWith(ROOT) || !existsSync(file)) { res.writeHead(404); return res.end('not found') }
  let body = readFileSync(file)
  if (path.endsWith('/decide/js/config.js')) {
    // The shipped file carries the real keys and the real network. Either take them out (as if
    // nothing had been pasted) or keep the keys and point the network at the fake one here.
    if (adsOff) { res.writeHead(200, { 'Content-Type': TYPES['.js'] }); return res.end(body) }
    body = Buffer.from(configured
      ? String(body).replaceAll('https://bauval.org/22/', `http://127.0.0.1:${PORT}/fake-ad/`).replace('adsOn: false', 'adsOn: true')
      : String(body).replace(/src: '[^']*', key: '[^']*'/g, "src: '', key: ''"))
  }
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream' })
  res.end(body)
})
await new Promise((ok) => server.listen(PORT, '127.0.0.1', ok))
const APP = `http://127.0.0.1:${PORT}/decide/`
// Every scenario below that is about the frame is run framed (`?adsframe`); the in-page way has its own scenarios at the end.
const FRAMED = APP + '?adsframe'

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

async function open({ width = 1280, height = 800, decisions = 0, premium = false, askFirst = false, consent = null, saveData = false, keepWelcome = false, premiumDelay = 0, inPage = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height }, reducedMotion: 'reduce', hasTouch: width < 700, isMobile: width < 700 })
  const page = await ctx.newPage()
  page.on('console', (m) => { if (m.text().startsWith('COVERED')) console.log(m.text()) })
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
  await page.goto(inPage ? APP : FRAMED, { waitUntil: 'load' })
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
const reachable = (page, sel) => page.evaluate((sel) => { const el = document.querySelector(sel); if (!el) return null; el.scrollIntoView({ block: 'center' }); const r = el.getBoundingClientRect(); const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); const okk = !!hit && (el === hit || el.contains(hit)); if (!okk) console.log('COVERED ' + sel + ' BY ' + (hit && hit.outerHTML.slice(0, 120))); return okk }, sel)

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
  ok('the back button is clear of it, and the whole stage (pause included, drawn on it) is above it', (await reachable(page, '.pg-back')) && await page.evaluate(() => { const c = document.querySelector('.pg-canvas').getBoundingClientRect(); return c.bottom <= document.getElementById('ad-dock').getBoundingClientRect().top + 1 }))
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
  await page.goto(FRAMED, { waitUntil: 'load' }); await page.clock.runFor(1500)
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
  ok('and every one is loaded cookie-free (credentialless) and still says which site it is on (referrer: the site’s address only)', f1.length >= 1 && f1.every((f) => f.mode === 'cookieless' && f.cl && f.ref === 'origin'), JSON.stringify(f1))
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

{
  // Both layers, together: the dock along the bottom AND the slots in the page.
  const page = await open({ width: 390, height: 800, decisions: 5 })
  await page.waitForTimeout(800)
  await go(page, 'dishes')
  await page.evaluate(() => document.getElementById('dish-ad').scrollIntoView({ block: 'center' })); await page.waitForTimeout(1200)
  const inList = await page.evaluate(() => document.querySelectorAll('#dish-ad iframe').length)
  ok('in the middle of the Dishes list there is a cluster of its own', inList === 2, `${inList}`)
  ok('and the dock is still along the bottom at the same time', (await frames(page)).length === 1)
  await go(page, 'chat'); await page.evaluate(() => document.getElementById('view-ad').scrollIntoView({ block: 'center' })); await page.waitForTimeout(1200)
  ok('under a section (Ask) there is a slot as well', await page.evaluate(() => !document.getElementById('view-ad').hidden && document.querySelectorAll('#view-ad iframe').length === 2))
  ok('so a phone shows the dock and a cluster, three or more in all', await page.evaluate(() => document.querySelectorAll('iframe[data-ad]').length >= 3))
  ok('and the slot is not shown under the questions', await page.evaluate(() => { window.M45.setView('decide'); return document.getElementById('view-ad').hidden }))
  await page.context().close()
}
{
  // What the frame is: a real page on this site, sent this site’s address and no more, that says whether anything arrived.
  const page = await open({ width: 390, height: 800, decisions: 5 })
  await page.waitForTimeout(1500)
  const src = await page.evaluate(() => document.querySelector('#ad-dock iframe').getAttribute('src'))
  ok('the ad frame is a page of this site, not a srcdoc', /^\/ad-frame\?u=mobile&r=0&t=[a-z0-9]+$/.test(src) && await page.evaluate(() => !document.querySelector('#ad-dock iframe').hasAttribute('srcdoc')), src)
  ok('and it told the page something was drawn', await page.evaluate(() => Ads.status().mobile === 'filled'), await page.evaluate(() => JSON.stringify(Ads.status())))
  await page.context().close()
}
{
  // The network has nothing to show (a unit it will not fill, an ad blocker): it is asked again twice, and only then is the box not left empty.
  silent = true
  const page = await open({ width: 1280, height: 800, decisions: 5 })
  await page.waitForTimeout(7000)
  const early = await page.evaluate(() => ({ houses: document.querySelectorAll('#ad-dock .house-ad').length, tries: [...document.querySelectorAll('#ad-dock iframe')].map((f) => f._try) }))
  ok('an empty answer is not the end: the frames ask again before any card stands in', early.houses === 0 && early.tries.every((t) => t >= 1), JSON.stringify(early))
  await page.waitForTimeout(24000)
  const houses = await page.evaluate(() => [...document.querySelectorAll('#ad-dock .house-ad')].map((a) => ({ w: a.style.width, h: a.style.height, href: a.getAttribute('href') })))
  ok('after the retries an empty network becomes the app’s own card, in the same box', houses.length === 2 && houses[0].w === '728px' && houses[0].h === '90px' && houses[1].w === '468px', JSON.stringify(houses))
  ok('which points at Premium and is not dressed as an ad', houses.every((h) => h.href === '/premium') && await page.evaluate(() => /Premium/.test(document.querySelector('.house-ad').textContent)))
  ok('and the page knows it was empty', await page.evaluate(() => Ads.status().leaderboard === 'empty'))
  // ...and a slow auction is not lost: when the network answers late, the ad takes the box back.
  silent = false
  await page.evaluate(() => { document.querySelectorAll('#ad-dock iframe').forEach((f) => { f.src = '/ad-frame?u=' + f.getAttribute('data-ad') + '&r=9&t=late' }) })
  await page.waitForTimeout(2500)
  ok('a late answer takes the box back from the card', await page.evaluate(() => document.querySelectorAll('#ad-dock .house-ad').length === 0 && [...document.querySelectorAll('#ad-dock iframe')].every((f) => !f.hidden && f.getAttribute('data-state') === 'filled')))
  await page.context().close()
  silent = false
}
{
  // The first ask of a visit is answered with nothing; the second, a few seconds later, fills: it must end up with an ad and no card.
  silent = true
  const page = await open({ width: 390, height: 800, decisions: 5 })
  await page.waitForTimeout(3000)
  silent = false
  await page.waitForTimeout(9000)
  const r = await page.evaluate(() => ({ houses: document.querySelectorAll('.house-ad').length, states: [...document.querySelectorAll('#ad-dock iframe')].map((f) => f.getAttribute('data-state')) }))
  ok('an empty first answer followed by a full one ends with an ad and no house card', r.houses === 0 && r.states.every((x) => x === 'filled'), JSON.stringify(r))
  await page.context().close()
}
{
  // Dot, the companion, lives above the ad strip and can be dragged only as low as the strip.
  for (const [w, h] of [[390, 800], [1280, 800]]) {
    const page = await open({ width: w, height: h, decisions: 5 })
    await page.waitForTimeout(900)
    await go(page, 'dishes'); await page.waitForTimeout(1500)
    const rect = async () => page.evaluate(() => { const b = document.querySelector('.buddy'); const d = document.getElementById('ad-dock'); const r = b.getBoundingClientRect(); return { shown: !b.hidden, bottom: r.bottom, dockTop: d.getBoundingClientRect().top, tab: (document.getElementById('tabbar').getBoundingClientRect().height) } })
    let r = await rect()
    ok(`${w}px: Dot is there and rests above the ad strip, not under it`, r.shown && r.bottom <= r.dockTop + 1, JSON.stringify(r))
    // Dragged as far down as it will go.
    const face = page.locator('.buddy-face')
    const fb = await face.boundingBox()
    await page.mouse.move(fb.x + 25, fb.y + 25); await page.mouse.down(); await page.mouse.move(fb.x + 25, h - 2, { steps: 8 }); await page.mouse.up(); await page.waitForTimeout(1200)
    r = await rect()
    ok(`${w}px: and cannot be dragged down under it`, r.bottom <= r.dockTop + 1, JSON.stringify(r))
    await page.context().close()
  }
}
{
  // /ads-check: the page that says why an ad does not show, on the device that is not showing it.
  const run = async (compare) => {
    const page = await open({ width: 390, height: 800, decisions: 5 })
    await page.goto(`http://127.0.0.1:${PORT}/ads-check`, { waitUntil: 'load' })
    await page.waitForTimeout(8800)
    const first = await page.evaluate(() => ({ v: document.getElementById('verdict').textContent, rows: ['r1', 'r2', 'r3', 'r4', 'r5'].map((i) => document.getElementById(i).textContent) }))
    let second = null
    if (compare) {
      await page.click('#cmp'); await page.waitForTimeout(8800)
      second = await page.evaluate(() => ({ v: document.getElementById('verdict').textContent, rows: ['r1', 'r2', 'r3', 'r4', 'r5'].map((i) => document.getElementById(i).textContent) }))
    }
    await page.context().close()
    return { first, second }
  }
  configured = true; polite = true
  let r = await run(true)
  ok('ads-check: the safe tests draw, and it says ads work', /^Loads/.test(r.first.rows[0]) && r.first.rows[2] === 'Drew an ad' && /Ads work on this device/.test(r.first.v), JSON.stringify(r.first))
  ok('and the unsandboxed ones are NOT run until the button is pressed', r.first.rows[1] === 'not run' && r.first.rows[3] === 'not run' && r.first.rows[4] === 'not run', JSON.stringify(r.first))
  ok('after the button all of them draw', r.second.rows.slice(1).every((x) => x === 'Drew an ad'), JSON.stringify(r.second))
  silent = true; polite = false
  r = await run(true)
  ok('ads-check, a network that answers with nothing: the safe tests say so and point at the button', /^Loads/.test(r.first.rows[0]) && r.first.rows[2] === 'Nothing came back' && /button above tells those apart/.test(r.first.v), JSON.stringify(r.first))
  ok('and after the button, nothing anywhere: it says the network is choosing to show nothing', r.second.rows.slice(1).every((x) => x === 'Nothing came back') && /Not even without the sandbox/.test(r.second.v), JSON.stringify(r.second))
  silent = false; blocked = true
  r = await run(false)
  ok('ads-check, a script that cannot be fetched: it says it is being stopped on the way', r.first.rows[0] === 'Blocked or unreachable' && /stopped on the way/.test(r.first.v), JSON.stringify(r.first))
  blocked = false
}

{
  // The tour lights what it is talking about, and the ad strip taking the menu's room must not push that out of view.
  const page = await open({ width: 1100, height: 700, decisions: 5 })
  await page.waitForTimeout(900)
  await go(page, 'profile')
  await page.evaluate(() => document.getElementById('buddy-tour').click()); await page.waitForTimeout(600)
  for (let i = 0; i < 10; i++) { await page.locator('.tour-btn.is-main').click(); await page.waitForTimeout(750) }
  await page.waitForTimeout(500)
  const t = await page.evaluate(() => {
    const spot = document.querySelector('.tour-spot').getBoundingClientRect(), link = document.querySelector('.rail-link[data-view="radio"]').getBoundingClientRect(), dock = document.getElementById('ad-dock').getBoundingClientRect()
    return { spot: [spot.left, spot.top, spot.width, spot.height], link: [link.left, link.top, link.width, link.height], dockTop: dock.top, say: document.querySelector('.tour-say').textContent }
  })
  ok('the tour step about TV and radio lights the TV and radio link, in view and above the ad strip', /Free TV/.test(t.say) && t.spot[1] <= t.link[1] + 2 && t.spot[1] + t.spot[3] >= t.link[1] + t.link[3] - 2 && t.link[1] + t.link[3] <= t.dockTop + 1, JSON.stringify(t))
  const top = await page.evaluate(() => ({ bar: document.querySelector('.tour-top').getBoundingClientRect().height, topbar: document.getElementById('topbar').getBoundingClientRect().height, bg: getComputedStyle(document.querySelector('.tour-top')).backgroundColor }))
  ok('and the tour’s own top bar covers the app’s, so the two do not print over each other', Math.abs(top.bar - top.topbar) < 2 && !/rgba\(0, 0, 0, 0\)/.test(top.bg), JSON.stringify(top))
  await page.context().close()
}

{
  // /ads-check, the five sandbox settings: against a network that does not mind, all five draw and it says the current ones are enough.
  configured = true; polite = true
  const page = await open({ width: 390, height: 800, decisions: 5 })
  await page.goto(`http://127.0.0.1:${PORT}/ads-check`, { waitUntil: 'load' })
  await page.click('#var'); await page.waitForTimeout(9800)
  const r = await page.evaluate(() => ({ rows: [0, 1, 2, 3, 4].map((i) => document.getElementById('v' + i).textContent), box: document.getElementById('varbox').textContent }))
  ok('ads-check: the five sandbox settings are tried and reported, and the reading says the current ones already draw', r.rows.every((x) => x === 'Drew an ad') && /already draw here/.test(r.box), JSON.stringify(r))
  await page.context().close()
  polite = false
}

{
  // THE NETWORK'S OWN SNIPPET, IN THE PAGE: with the cookie choice made (or none asked for), no frame at all.
  inplace = true
  const page = await open({ width: 1280, height: 800, decisions: 5, inPage: true })
  await page.waitForTimeout(2500)
  const d = await page.evaluate(() => ({
    frames: document.querySelectorAll('iframe[data-ad]').length,
    boxes: [...document.querySelectorAll('#ad-dock .ad-direct')].map((b) => ({ n: b.getAttribute('data-ad'), w: b.style.width, state: b.getAttribute('data-state'), drew: b.querySelector('.fake') ? b.querySelector('.fake').style.width : null, script: !!b.querySelector('script[src]') })),
    seen: window.__direct,
  }))
  ok('in the page: the dock is boxes with the network’s script inside, not frames', d.frames === 0 && d.boxes.length === 2 && d.boxes.every((b) => b.script), JSON.stringify(d))
  ok('each box drew at its own size: the options were set for each script in turn', d.boxes.length === 2 && d.boxes.every((b) => b.drew === b.w) && d.seen.length === 2 && d.seen[0].endsWith('728x90'), JSON.stringify(d))
  ok('and they are reported as filled', await page.evaluate(() => Ads.status().leaderboard === 'filled' && Ads.status().wide === 'filled'))
  await go(page, 'dishes'); await page.waitForTimeout(2500)
  ok('the slots in the page are the same: boxes, one after the other, none framed', await page.evaluate(() => document.querySelectorAll('#dish-ad iframe').length === 0 && document.querySelectorAll('#dish-ad .ad-direct').length >= 2 && [...document.querySelectorAll('#dish-ad .ad-direct')].every((b) => b.querySelector('.fake'))))
  await page.context().close()
}
{
  // Where asking is required and the answer is not yes: the network is not asked at all, and the box says why.
  const before = adRequests.length
  const page = await open({ width: 1280, height: 800, decisions: 5, askFirst: true, consent: 'essential', inPage: true })
  await page.waitForTimeout(2500)
  const r = await page.evaluate(() => ({ frames: document.querySelectorAll('iframe').length, boxes: document.querySelectorAll('.ad-direct').length, cards: [...document.querySelectorAll('#ad-dock .house-ad')].map((c) => ({ w: c.style.width, why: /cookies/i.test(c.textContent) })) }))
  ok('asked first and not yes: cards that say ads need cookies, in the size of the ads, and no network call', r.frames === 0 && r.boxes === 0 && r.cards.length === 2 && r.cards[0].w === '728px' && r.cards.every((c) => c.why) && adRequests.length === before, JSON.stringify({ r, calls: adRequests.length - before }))
  // ...and accepting there turns them into ads without a reload.
  await page.evaluate(() => Consent.show()); await page.waitForTimeout(200)
  await page.locator('.consent [data-c="all"]').click(); await page.waitForTimeout(3000)
  ok('and accepting makes them ads, in the page', await page.evaluate(() => document.querySelectorAll('#ad-dock .house-ad').length === 0 && document.querySelectorAll('#ad-dock .ad-direct .fake').length === 2))
  await page.context().close()
}
{
  // Where the law does not make us ask, "Essential only" does not take the ads away: that is what left empty boxes.
  const page = await open({ width: 1280, height: 800, decisions: 5, askFirst: false, consent: 'essential', inPage: true })
  await page.waitForTimeout(2500)
  const r = await page.evaluate(() => ({ cards: document.querySelectorAll('.house-ad').length, drawn: document.querySelectorAll('#ad-dock .ad-direct .fake').length }))
  ok('not asked, and Essential only: the ads still draw, in the page', r.cards === 0 && r.drawn === 2, JSON.stringify(r))
  await page.evaluate(() => Consent.show()); await page.waitForTimeout(200)
  await page.evaluate(() => { window.__same = document.querySelector('#ad-dock .ad-direct') })
  await page.locator('.consent [data-c="essential"]').click(); await page.waitForTimeout(1200)
  ok('and choosing Essential only again does not redraw them', await page.evaluate(() => document.querySelector('#ad-dock .ad-direct') === window.__same))
  await page.context().close()
  inplace = false
}
{
  // In the page and the network answers with nothing: asked again, then the app's own card; a late ad takes the box back.
  silent = true
  const page = await open({ width: 390, height: 800, decisions: 5, inPage: true })
  await page.waitForTimeout(32000)
  const r = await page.evaluate(() => ({ houses: document.querySelectorAll('#ad-dock .house-ad').length, tries: [...document.querySelectorAll('#ad-dock .ad-direct')].map((b) => b._try) }))
  ok('in the page, an empty network is asked again and then becomes the app’s own card', r.houses === 1 && r.tries.every((t) => t === 2), JSON.stringify(r))
  silent = false; inplace = true
  await page.evaluate(() => { const b = document.querySelector('#ad-dock .ad-direct'); b.insertAdjacentHTML('beforeend', '<div class="late"></div>') })
  await page.waitForTimeout(500)
  ok('and an ad that turns up late takes the box back', await page.evaluate(() => document.querySelectorAll('#ad-dock .house-ad').length === 0 && !document.querySelector('#ad-dock .ad-direct').hidden))
  await page.context().close()
  inplace = false
}

{
  // Signing in to Premium and out again: the ads go, and come back, in the page and without a reload.
  inplace = true
  const page = await open({ width: 1280, height: 800, decisions: 5, inPage: true })
  await page.waitForTimeout(2500)
  const status = (premium) => page.route(/\/api\/premium-status/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ signedIn: premium, hasPremium: premium, username: premium ? 'tester' : '', userId: premium ? 'u1' : null }) }))
  const dock = () => page.evaluate(() => ({ el: !!document.getElementById('ad-dock'), boxes: [...document.querySelectorAll('#ad-dock .ad-direct')].map((b) => !!b.querySelector('.fake')), has: document.body.classList.contains('has-dock') }))
  ok('before: the dock is up with ads in it', (await dock()).boxes.length === 2)
  await status(true); await page.evaluate(() => window.dispatchEvent(new Event('focus'))); await page.waitForTimeout(1500)
  const gone = await dock()
  ok('signed in to Premium: no dock, and the room is given back', !gone.el && !gone.has, JSON.stringify(gone))
  await go(page, 'dishes'); await page.waitForTimeout(2000)
  ok('and no ads in the page either', await page.evaluate(() => document.querySelectorAll('.ad-direct, iframe[data-ad]').length === 0))
  await status(false); await page.evaluate(() => window.dispatchEvent(new Event('focus'))); await page.waitForTimeout(4500)
  const back = await dock()
  ok('signed out: the dock is back with ads in it', back.el && back.has && back.boxes.length === 2 && back.boxes.every(Boolean), JSON.stringify(back))
  await go(page, 'profile'); await go(page, 'dishes'); await page.waitForTimeout(3000)
  ok('and the slots in the page draw again', await page.evaluate(() => document.querySelectorAll('#dish-ad .ad-direct .fake').length >= 2), await page.evaluate(() => document.getElementById('dish-ad') && document.getElementById('dish-ad').innerHTML.slice(0, 300)))
  await page.context().close()
  inplace = false
}

{
  // Accepted, then "Essential only" where we must ask first: the boxes must become cards, never be left blank.
  inplace = true
  const page = await open({ width: 1280, height: 800, decisions: 5, askFirst: true, consent: 'all', inPage: true })
  await page.waitForTimeout(2500)
  await page.evaluate(() => Consent.show()); await page.waitForTimeout(200)
  await page.locator('.consent [data-c="essential"]').click(); await page.waitForTimeout(2500)
  const r = await page.evaluate(() => ({
    boxes: [...document.querySelectorAll('#ad-dock .ad-direct')].map((b) => ({ fake: !!b.querySelector('.fake'), kids: b.children.length, h: b.getBoundingClientRect().height })),
    cards: [...document.querySelectorAll('#ad-dock .house-ad')].map((c) => ({ text: c.textContent.slice(0, 60), h: c.getBoundingClientRect().height })),
    dockH: document.getElementById('ad-dock') ? document.getElementById('ad-dock').getBoundingClientRect().height : 0,
  }))
  ok('accepted, then Essential only where asked first: no blank boxes left, only cards', r.boxes.length === 0 && r.cards.length === 2 && r.cards.every((c) => c.h > 0 && /cookies/.test(c.text)), JSON.stringify(r))
  await page.context().close()
  inplace = false
}

{
  // No popunders: the worst creative opens nothing, and the site's own buttons still can.
  inplace = true; rude = true
  const page = await open({ width: 1280, height: 800, decisions: 5, inPage: true })
  const popped = []
  page.context().on('page', (p) => popped.push(p.url()))
  await page.waitForTimeout(3000)
  ok('a creative that opens windows on load opens none', popped.length === 0, JSON.stringify(popped))
  await page.mouse.click(640, 300); await page.waitForTimeout(800)
  await page.mouse.click(300, 500); await page.waitForTimeout(800)
  ok('nor on the first taps, from the page or from a frame of its own', popped.length === 0, JSON.stringify(popped))
  ok('and it still drew', await page.evaluate(() => document.querySelectorAll('#ad-dock .ad-direct .fake').length === 2))
  await page.evaluate(() => window.m45Open('http://127.0.0.1:8793/ours', '_blank'))
  await page.waitForTimeout(800)
  ok('while the site’s own button can still open a window', popped.length === 1 && /\/ours$/.test(popped[0]), JSON.stringify(popped))
  await page.context().close()
  inplace = false; rude = false
}

{
  // ALL ADS OFF, as shipped: nothing is drawn, requested or offered, on a phone and on a desktop.
  adsOff = true
  const before = adRequests.length
  for (const [w, h] of [[390, 800], [1280, 800]]) {
    const page = await open({ width: w, height: h, decisions: 5, inPage: true })
    await page.waitForTimeout(3500)
    const r = await page.evaluate(() => ({
      dock: !!document.getElementById('ad-dock'), has: document.body.classList.contains('has-dock'),
      slots: document.querySelectorAll('[data-ad], .ad-direct, .house-ad, iframe').length,
      on: Ads.enabled(), anchor: getComputedStyle(document.documentElement).getPropertyValue('--anchor-h').trim(),
      bonus: (document.getElementById('chat-bonus-wrap') || { hidden: true }).hidden,
      banner: (document.querySelector('.consent') || { textContent: '' }).textContent,
    }))
    ok(`${w}px, switch off: no strip, no frames, no in-page ads, no house card`, !r.dock && !r.has && r.slots === 0 && r.on === false, JSON.stringify(r))
    ok(`${w}px, switch off: no room is reserved at the bottom`, r.anchor === '' || r.anchor === '0px', r.anchor)
    ok(`${w}px, switch off: the sponsor-page offer is not there`, r.bonus === true)
    ok(`${w}px, switch off: the cookie notice does not talk about ads`, !/Adsterra|ad network/i.test(r.banner) && /no ads/i.test(r.banner), r.banner.slice(0, 160))
    await go(page, 'dishes'); await go(page, 'chat'); await go(page, 'profile'); await page.waitForTimeout(1500)
    ok(`${w}px, switch off: still nothing after moving through the app`, await page.evaluate(() => document.querySelectorAll('[data-ad], .ad-direct, .house-ad, iframe, #ad-dock').length === 0))
    await page.context().close()
  }
  ok('and the network was never asked', adRequests.length === before, String(adRequests.length - before))
  adsOff = false
}

console.log(`\n${pass} passed, ${fails} failed`)
await browser.close()
server.close()
process.exit(fails ? 1 : 0)
