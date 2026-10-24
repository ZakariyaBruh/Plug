# Meta ads

One campaign, **morsels45 – Thailand (Thai) + Vietnam (Vietnamese) – Traffic** (account `1412264650897643`, USD):

- Objective: Traffic, optimised for link clicks, to `https://morsels45-app.whop.site/decide/`.
- **$5 a day for the whole campaign** (campaign budget), bid strategy *bid cap* at **$0.05** on both ad sets. Vietnam shares the same $5; it adds nothing to the spend.
- Ad set **Thailand – Thai ads**: country TH, Thai creatives. Ad set **Vietnam – Vietnamese ads**: country VN, Vietnamese creatives.
- No English version: Meta can target by language, but English speakers in Thailand are a small, dearer audience, and a third ad set would split $5 a day three ways and keep every set short of the data it needs. Thai is the cheapest reach.
- Both ad sets and the campaign were staged as drafts. Ads need a Facebook Page, and the account had none.

Creatives (1080x1350, regenerate with `node scripts/make-promo-images.mjs`): `public/promo/{th,vi}-{settle,how}.png`, served at `https://morsels45-app.whop.site/promo/...`.

Copy: Thai "ตัดสินให้จบ ใน 1 นาที." / "อะไรฟังดูดีกว่า?"; Vietnamese "Chốt món trong một phút." / "Bạn thích món nào hơn?"; button ตัดสินใจให้ฉัน / Chọn giúp tôi.

## Languages in the app

`js/lang-vi.js` (2,797 lines and 93 patterns, same set as Thai) plus the `vi` block in `js/i18n.js`, `LOCALES` in `app.js` (`vi-VN` for speech), `lib/lang.ts` (the assistant answers in Vietnamese) and the asset list in `routes/decide/$.ts`. It is in the first-run language popup and Profile > Language like the others. Dishes, recipes and news stay English, as for every other language.
