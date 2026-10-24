// The Facebook Page cover (1640x624), in three languages. node scripts/make-page-cover.mjs
const pw = await import('/opt/node22/lib/node_modules/playwright/index.js')
const { chromium } = pw.default || pw
const logo = `<svg viewBox="0 0 512 512" width="96" height="96"><g fill="none" stroke="#e0a340" stroke-width="40" stroke-linecap="round" stroke-linejoin="round"><path d="M256 140L126 256L256 256M256 140L256 372"/><path d="M386 140L256 140L256 256C426 256 426 372 256 372"/></g></svg>`
const html = `<html><style>
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1640px;height:624px}
body{background:radial-gradient(1000px 520px at 12% 0%,#2c2214 0%,#17140f 48%,#101012 100%);color:#f3efe8;font-family:Inter,Loma,"Noto Color Emoji",sans-serif;padding:70px 90px;display:grid;grid-template-columns:1fr auto;align-items:center}
.brand{display:flex;align-items:center;gap:22px;font-weight:800;font-size:54px;color:#cfc9bf;margin-bottom:36px}
h1{font-weight:800;font-size:92px;line-height:1.08;letter-spacing:-.02em}
h1 em{font-style:normal;color:#e0a340}
.langs{margin-top:34px;font-size:38px;color:#9d988f;line-height:1.5}
.langs b{color:#cfc9bf;font-weight:600}
.emoji{font-size:110px;line-height:1.35;font-family:"Noto Color Emoji";text-align:center;letter-spacing:.1em}
</style><body><div><div class="brand">${logo}<span>morsels45</span></div>
<h1>What to eat?<br><em>Decided in a minute.</em></h1>
<div class="langs"><b>ตัดสินให้จบ ใน 1 นาที</b> &nbsp;·&nbsp; <b>Chốt món trong một phút</b></div></div>
<div class="emoji">🍜🍕<br>🍣🌮<br>🍔🍲</div></body></html>`
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const p = await b.newPage({ viewport: { width: 1640, height: 624 } })
await p.setContent(html); await p.waitForTimeout(400)
await p.screenshot({ path: 'public/promo/page-cover.png' })
await b.close()
