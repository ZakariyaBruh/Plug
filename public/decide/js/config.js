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
 * ads. The 160x600 skyscraper, the native unit and the Social Bar were handed
 * over too and are deliberately not here: see the note over ADS_ON in
 * src/lib/site.ts.
 *
 * This copy has to say the same as AD_UNITS in src/lib/site.ts, which is what
 * the privacy page reads. scripts/shell-test.mjs fails if the two disagree
 * about which units are live. The rules (who sees one, and where) are in
 * js/ads.js and the long note over ADS_ON in site.ts.
 */
window.FoodConfig = {
  adsAfterDecisions: 2,
  // Opened only by a tap on the button that offers it, for two more free
  // Standard questions. Never an ad slot, never automatic.
  smartlink: 'https://araplhn.org/4/c3b5fbe91c3b67d3648196f1c2b7711d',
  ads: {
    leaderboard: { src: 'https://bauval.org/22/79c3a17f491d7757c1a53e16f2e54e4b', key: '79c3a17f491d7757c1a53e16f2e54e4b', width: 728, height: 90 },
    wide: { src: 'https://bauval.org/22/08a0aa1467566733b34557c293a41586', key: '08a0aa1467566733b34557c293a41586', width: 468, height: 60 },
    mobile: { src: 'https://bauval.org/22/5854b8b6f2fdd21988e40b9eb9be56c6', key: '5854b8b6f2fdd21988e40b9eb9be56c6', width: 320, height: 50 },
    rectangle: { src: 'https://bauval.org/22/df667c7b76c1f15de99aa40aed5384d6', key: 'df667c7b76c1f15de99aa40aed5384d6', width: 300, height: 250 },
    tower: { src: 'https://bauval.org/22/31d2d6666f860531539ff1e9d29c51f6', key: '31d2d6666f860531539ff1e9d29c51f6', width: 160, height: 300 }
  }
};
