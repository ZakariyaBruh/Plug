import { readFileSync, writeFileSync } from 'node:fs'
const pw = await import('/opt/node22/lib/node_modules/playwright/index.js')
const { chromium } = pw.default || pw
const icon = readFileSync(new URL('../public/decide/icon.svg', import.meta.url), 'utf8')
const logo = `<svg viewBox="0 0 512 512" width="64" height="64"><g fill="none" stroke="#e0a340" stroke-width="40" stroke-linecap="round" stroke-linejoin="round"><path d="M256 140L126 256L256 256M256 140L256 372"/><path d="M386 140L256 140L256 256C426 256 426 372 256 372"/></g></svg>`
const COPY = {
  th: {
    a: { h1: 'ตัดสินให้จบ', h2: 'ใน 1 นาที', dot: '.', body: 'วงจร “กินอะไรดี?” / “อะไรก็ได้” จบแล้ว ตอบคำถามเลือกข้อใดข้อหนึ่งไม่กี่ข้อ แล้วรับเมนูเดียวที่ทั้งคู่กินจริง ๆ', btn: 'ตัดสินใจให้ฉัน', foot: 'ฟรี ไม่ต้องสมัคร ใช้ได้แม้ออฟไลน์' },
    b: { q: 'อะไรฟังดูดีกว่า?', hot: 'ของร้อน ๆ', cold: 'ของเย็น ๆ', body: 'แค่นี้เอง ตอบไม่กี่ข้อ ได้เมนูเดียว', btn: 'ตัดสินใจให้ฉัน', foot: 'ฟรี ไม่ต้องสมัคร ใช้ได้แม้ออฟไลน์' },
    lang: 'th',
  },
  vi: {
    a: { h1: 'Chốt món', h2: 'trong một phút', dot: '.', body: 'Vòng lặp “ăn gì đây?” / “gì cũng được” — kết thúc. Trả lời vài câu chọn một trong hai, nhận ngay một món cả hai đều thật sự muốn ăn.', btn: 'Chọn giúp tôi', foot: 'Miễn phí · Không cần đăng ký · Dùng không cần mạng' },
    b: { q: 'Bạn thích món nào hơn?', hot: 'Món nóng', cold: 'Món lạnh', body: 'Chỉ vậy thôi. Trả lời vài câu, nhận một món.', btn: 'Chọn giúp tôi', foot: 'Miễn phí · Không cần đăng ký · Dùng không cần mạng' },
    lang: 'vi',
  },
}
const css = `
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1080px;height:1350px}
body{background:radial-gradient(900px 620px at 18% 8%,#2c2214 0%,#17140f 45%,#101012 100%);color:#f3efe8;font-family:Inter,Loma,"Noto Color Emoji",sans-serif;padding:84px 84px 80px;display:flex;flex-direction:column}
.brand{display:flex;align-items:center;gap:20px;font-weight:700;font-size:44px;letter-spacing:-.01em;color:#cfc9bf}
.brand span{color:#cfc9bf}
.main{flex:1;display:flex;flex-direction:column;justify-content:center}
h1{font-weight:800;line-height:1.12;letter-spacing:-.02em;font-size:128px}
h1 em{font-style:normal;color:#e0a340;display:block}
p.body{font-size:44px;line-height:1.5;color:#cfc9bf;margin-top:48px;max-width:900px}
.emoji{font-size:92px;margin-top:56px;letter-spacing:.06em;font-family:"Noto Color Emoji"}
.btn{display:inline-block;align-self:flex-start;background:#f3efe8;color:#101012;font-weight:800;font-size:52px;padding:34px 56px;margin-top:64px}
.foot{font-size:34px;color:#9d988f;margin-top:34px}
.card{border:2px solid #2b2b2f;background:#141416;padding:56px}
.card h2{font-weight:800;font-size:76px;line-height:1.15;letter-spacing:-.01em}
.opts{display:flex;gap:28px;margin-top:44px}
.opt{flex:1;border:2px solid #2b2b2f;background:#1a1a1d;padding:44px 20px;text-align:center}
.opt.hot{border-color:#e0a340}
.opt .e{font-size:96px;font-family:"Noto Color Emoji"}
.opt .t{font-weight:800;font-size:52px;margin-top:20px}
.opt.hot .t{color:#e0a340}
html[lang=vi] h1{font-size:104px}
html[lang=vi] p.body{font-size:38px;margin-top:36px}
html[lang=vi] .emoji{margin-top:40px}
html[lang=vi] .btn{margin-top:48px}
html[lang=vi] .foot{font-size:30px}
p.line{font-size:50px;line-height:1.45;color:#cfc9bf;margin-top:56px;max-width:880px}
`
const html = (l, v) => v === 'a'
  ? `<html lang="${l.lang}"><style>${css}</style><body><div class="brand">${logo}<span>morsels45</span></div><div class="main"><h1>${l.a.h1}<em>${l.a.h2}${l.a.dot}</em></h1><p class="body">${l.a.body}</p><div class="emoji">🍕🍜🍣🌮🍔🍲</div><div class="btn">${l.a.btn} →</div><div class="foot">${l.a.foot}</div></div></body></html>`
  : `<html lang="${l.lang}"><style>${css}</style><body><div class="brand">${logo}<span>morsels45</span></div><div class="main"><div class="card"><h2>${l.b.q}</h2><div class="opts"><div class="opt hot"><div class="e">🍜</div><div class="t">${l.b.hot}</div></div><div class="opt"><div class="e">🥗</div><div class="t">${l.b.cold}</div></div></div></div><p class="line">${l.b.body}</p><div class="btn">${l.b.btn} →</div><div class="foot">${l.b.foot}</div></div></body></html>`
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const page = await browser.newPage({ viewport: { width: 1080, height: 1350 } })
for (const [id, l] of Object.entries(COPY)) for (const v of ['a', 'b']) {
  await page.setContent(html(l, v)); await page.waitForTimeout(300)
  await page.screenshot({ path: `public/promo/${id}-${v === 'a' ? 'settle' : 'how'}.png` })
}
await browser.close()
