/*
 * ALL ADS OFF, as shipped. Imported without scripts/ads-on.mjs, so the master switch (ADS_SWITCH in src/lib/site.ts) is as
 * in production: no ad of any kind, no frame page, no sponsor-page offer, nothing about ads on the privacy page.
 */
import { readFileSync } from 'node:fs'
import { adFramePage } from '../src/routes/ad-frame.ts'
import { ADS_ON, ADS_SWITCH, AD_UNITS, BONUS_ON, adCluster, adLive } from '../src/lib/site.ts'

let pass = 0
let fail = 0
const check = (name, ok, detail) => { ok ? pass++ : (fail++, console.log(`FAIL  ${name}${detail ? ' ' + detail : ''}`)) }
const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8')

check('the master switch is off', ADS_SWITCH === false && ADS_ON === false)
check('so no unit is live, however it is filled in', Object.values(AD_UNITS).every((u) => !adLive(u)))
check('and no cluster is ever chosen', adCluster('inline', 1280).length === 0 && adCluster('end', 390).length === 0)
check('the frame page serves nothing', ['leaderboard', 'wide', 'mobile', 'rectangle', 'tower'].every((n) => adFramePage(n) === null))
check('the sponsor-page offer is gone', BONUS_ON === false)

const cfg = read('../public/decide/js/config.js')
check('the app’s own switch agrees (config.js adsOn: false)', /adsOn:\s*false/.test(cfg))
const site = read('../src/lib/site.ts')
check('and site.ts has it literally off', /ADS_SWITCH: boolean =\s*\n\s*false \|\|/.test(site))
const ads = read('../public/decide/js/ads.js')
check('the app’s ad code does nothing when the switch is off', /FoodConfig\.adsOn\) && Object\.keys\(cfg\)/.test(ads))
const app = read('../public/decide/js/app.js')
check('and the "more questions" offer needs the switch', /FoodConfig\.adsOn && window\.FoodConfig\.smartlink/.test(app))
const bonus = read('../src/routes/api/chat-bonus.ts')
check('and so does its route', /if \(!BONUS_ON\) return json\(\{ error: 'not_found' \}, 404\)/.test(bonus))

console.log(`${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
