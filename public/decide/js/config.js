/*
 * config.js — what is set.
 *
 * Premium is real morsels45 checkout and a real Whop sign-in, both already
 * wired up on this site (see js/premium.js and /premium). There is no plan
 * id or price to paste in.
 *
 * ADS. Five fixed-size banners from the snippets handed over, served from
 * bauval.org/22/<key>. A unit with either half empty is off, and with all of
 * them empty nothing is loaded or drawn and the privacy page does not mention
 * ads. The 160x600 skyscraper and the native unit were handed
 * over too and are deliberately not here (the Social Bar is, below, with its own rules): see the note over ADS_ON in
 * src/lib/site.ts.
 *
 * This copy has to say the same as AD_UNITS in src/lib/site.ts, which is what
 * the privacy page reads. scripts/shell-test.mjs fails if the two disagree
 * about which units are live. The rules (who sees one, and where) are in
 * js/ads.js and the long note over ADS_ON in site.ts.
 */
window.FoodConfig = {
  // Ads from the first visit. (It was 2: a stranger's first thing was an answer.)
  adsAfterDecisions: 0,
  // Opened only by a tap on the button that offers it, for two more free
  // Standard questions. Never an ad slot, never automatic.
  smartlink: 'https://araplhn.org/4/fd1fabea155b5555cea9a2d25b525f86',
  // The Social Bar: a script that runs in the page, with the conditions in js/ads.js. Empty is off.
  social: 'https://bauval.org/14/90be8892dec9da526ced9fd07a01edf1',
  ads: {
    leaderboard: { src: 'https://bauval.org/22/13578a9ee1178c2080f04a9a7acb94e7', key: '13578a9ee1178c2080f04a9a7acb94e7', width: 728, height: 90 },
    wide: { src: 'https://bauval.org/22/e6a338e45d2440354df283cc5cc84a16', key: 'e6a338e45d2440354df283cc5cc84a16', width: 468, height: 60 },
    mobile: { src: 'https://bauval.org/22/84c0716c8abaa82649e86753f0334cd8', key: '84c0716c8abaa82649e86753f0334cd8', width: 320, height: 50 },
    rectangle: { src: 'https://bauval.org/22/47b839943930ad4fcc3a16984ffe9ddd', key: '47b839943930ad4fcc3a16984ffe9ddd', width: 300, height: 250 },
    tower: { src: 'https://bauval.org/22/ff664151b19a82696f071b16d9088566', key: 'ff664151b19a82696f071b16d9088566', width: 160, height: 300 }
  }
};
