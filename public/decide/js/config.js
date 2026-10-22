/*
 * config.js — what is set, and the one thing that is waiting to be.
 *
 * Premium is real morsels45 checkout and a real Whop sign-in, both already
 * wired up on this site (see js/premium.js and /premium). There is no plan
 * id or price to paste in.
 *
 * ADS. Empty on purpose. The unit ids on the Adsterra dashboard are not what
 * the scripts use: for each of the three sizes below, open the unit's "Get
 * code" and paste two things from it — the URL in `<script src="…invoke.js">`
 * as `src`, and `'key'` from the `atOptions` line as `key`. A unit with either
 * half empty is off; with all three empty, nothing is loaded and nothing is
 * drawn, and the privacy page does not mention ads.
 *
 * This copy has to say the same as AD_UNITS in src/lib/site.ts, which is what
 * the privacy page reads. scripts/shell-test.mjs fails if the two disagree
 * about which units are live. The rules (who sees one, and where) are in
 * js/ads.js and the long note over ADS_ON in site.ts.
 */
window.FoodConfig = {
  adsAfterDecisions: 2,
  ads: {
    // 728x90, where there is width
    leaderboard: { src: '', key: '', width: 728, height: 90 },
    // 320x50, where there is not
    banner: { src: '', key: '', width: 320, height: 50 },
    // 300x250, after something has been read
    rectangle: { src: '', key: '', width: 300, height: 250 }
  }
};
