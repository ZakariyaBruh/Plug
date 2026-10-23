/*
 * The marketing site's ad logic, without a browser: which two or three banners
 * a placement gets at which width, what goes into the frame, that the sandbox
 * is what it says, and that the units left out stayed out. The browser half
 * (and the fake hostile creative) is scripts/ads-drive.mjs; the files-agree
 * half is scripts/shell-test.mjs.
 */
import { readFileSync } from 'node:fs'
import { AD_SANDBOX } from '../src/components/AdSlot.tsx'
import { adFramePage } from '../src/routes/ad-frame.ts'
import { ADS_ON, AD_UNITS, SMARTLINK_URL, adCluster, adLive } from '../src/lib/site.ts'

let pass = 0
let fail = 0
function check(name, ok, detail) {
  ok ? (pass += 1) : (fail += 1)
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok || !detail ? '' : `\n        ${detail}`}`)
}
const widths = (cluster) => cluster.map((u) => u.width).join('+')

check('all five fixed-size units are live as committed, so ads are on', Object.values(AD_UNITS).every(adLive) && ADS_ON === true)
check('every unit is served from the network’s own /22/<key> path', Object.values(AD_UNITS).every((u) => u.src === `https://bauval.org/22/${u.key}`))

// How many at a time: the brief was two or three, never one and never a wall.
for (const w of [320, 390, 599, 600, 760, 1000, 1280]) {
  for (const placement of ['inline', 'end']) {
    const n = adCluster(placement, w).length
    check(`${placement} at ${w}px shows 2 or 3 (${widths(adCluster(placement, w))})`, n === 2 || n === 3)
  }
}
check('in the middle of a list: two, even on a wide screen', adCluster('inline', 1280).length === 2)
check('inline, wide: the 728x90 then the 468x60', widths(adCluster('inline', 1280)) === '728+468')
check('inline, a phone: the 320x50 then the 300x250', widths(adCluster('inline', 390)) === '320+300')
check('at the end of a page, wide: the 300x250, the 160x300 and the 468x60', widths(adCluster('end', 1280)) === '300+160+468')
check('at the end of a page, a phone: two, never three', widths(adCluster('end', 390)) === '300+320')

// Nothing may be wider than the slot (or than the narrowest phone).
for (const w of [320, 390, 500, 700]) {
  for (const placement of ['inline', 'end']) {
    check(`nothing in ${placement} at ${w}px is wider than the slot`, adCluster(placement, w).every((u) => u.width <= Math.max(w, 320)))
  }
}

// A unit missing either half of its snippet is not live, and the cluster shrinks around it.
const saved = { ...AD_UNITS.leaderboard }
AD_UNITS.leaderboard.key = ''
check('a unit with no key is skipped and the next fits in', widths(adCluster('inline', 1280)) === '468+320')
Object.assign(AD_UNITS.leaderboard, saved)

const html = adFramePage('mobile')
check('the frame page asks for this site’s address as the referrer, and no more', /<meta name="referrer" content="origin">/.test(html))
check('it reports back whether anything arrived', /m45ad/.test(html) && /"empty"/.test(html) && /"filled"/.test(html) && /"error"/.test(html))
check('a size that is not a unit gets no page (the script cannot be chosen from the URL)', adFramePage('evil') === null && adFramePage('../x') === null)
check('the frame loads the unit’s own script', html.includes('src="https://bauval.org/22/5854b8b6f2fdd21988e40b9eb9be56c6"'))
check('and sets atOptions from the unit', /atOptions=\{"key":"5854b8b6f2fdd21988e40b9eb9be56c6","format":"iframe","height":50,"width":320/.test(html))
check('the sandbox grants scripts and real-click popups only', AD_SANDBOX === 'allow-scripts allow-popups allow-popups-to-escape-sandbox', AD_SANDBOX)
check('and neither same-origin nor top navigation', !/same-origin|top-navigation/.test(AD_SANDBOX))

// Handed over but deliberately not used: the skyscraper, the native unit and the Social Bar.
const files = ['src/lib/site.ts', 'src/components/AdSlot.tsx', 'public/decide/js/config.js', 'public/decide/js/ads.js']
  .map((f) => readFileSync(new URL('../' + f, import.meta.url), 'utf8'))
  .join('\n')
for (const [name, key] of [['the 160x600 skyscraper', 'c34df66c2852fa155381e97d401a1a4a'], ['the native unit', 'd3500e59199e09eee4a23799c098b4e5'], ['the Social Bar', '081a53853ee78e59ce72a9333b3d4700']]) {
  check(`${name} is not used`, !files.includes(key))
}
check('the smart link is an opt-in constant, not a unit', SMARTLINK_URL === 'https://araplhn.org/4/c3b5fbe91c3b67d3648196f1c2b7711d' && !Object.values(AD_UNITS).some((u) => u.src === SMARTLINK_URL))

console.log(`\n${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
