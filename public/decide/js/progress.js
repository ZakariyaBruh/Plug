/*
 * progress.js — everything that persists between games.
 *
 * XP, levels, streaks, badges and the running taste profile. Kept free of any
 * DOM so it can be exercised directly by tools/check.js.
 */
(function (root, factory) {
  var mod = factory();
  if (typeof module === 'object' && module.exports) module.exports = mod;
  else root.FoodProgress = mod;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var KEY = 'whatShouldIEat.v1';

  var LEVELS = [
    { name: 'Snacker',      icon: '\u{1F37F}', at: 0 },
    { name: 'Nibbler',      icon: '\u{1F968}', at: 150 },
    { name: 'Peckish',      icon: '\u{1F96A}', at: 400 },
    { name: 'Foodie',       icon: '\u{1F37D}\u{FE0F}', at: 800 },
    { name: 'Gourmand',     icon: '\u{1F377}', at: 1400 },
    { name: 'Connoisseur',  icon: '\u{1F3A9}', at: 2200 },
    { name: 'Epicurean',    icon: '\u{1F451}', at: 3200 },
    { name: 'Gastronaut',   icon: '\u{1F680}', at: 4500 }
  ];

  var XP = {
    answer: 5,          // per question answered
    either: 2,          // shrugging is worth less than an opinion
    decision: 30,       // committing to a dish
    firstGuess: 20,     // ...on the very first guess
    swift: 15,          // ...in six questions or fewer
    badge: 25
  };

  // Each badge reads the same stats object and says whether it's been earned.
  var BADGES = [
    { id: 'first-bite',  name: 'First Bite',    icon: '\u{1F423}', hint: 'Make your first decision',
      test: function (s) { return s.decisions >= 1; } },
    { id: 'decisive',    name: 'Decisive',      icon: '\u{26A1}', hint: 'Accept the very first guess',
      test: function (s) { return s.firstGuessAccepts >= 1; } },
    { id: 'swift',       name: 'Mind Reader',   icon: '\u{1F52E}', hint: 'Get guessed in 6 questions or fewer',
      test: function (s) { return s.fastestGame > 0 && s.fastestGame <= 6; } },
    { id: 'picky',       name: 'Hard to Please', icon: '\u{1F644}', hint: 'Reject three guesses in one game',
      test: function (s) { return s.mostRejections >= 3; } },
    { id: 'marathon',    name: 'The Long Haul', icon: '\u{1F3C1}', hint: 'Go the full twenty questions',
      test: function (s) { return s.longestGame >= 20; } },
    { id: 'sweet-tooth', name: 'Sweet Tooth',   icon: '\u{1F36D}', hint: 'Land on five sweet things',
      test: function (s) { return (s.taste.sweet || { yes: 0 }).yes >= 5; } },
    { id: 'savoury',     name: 'Salt of the Earth', icon: '\u{1F9C2}', hint: 'Land on five savoury things',
      test: function (s) { return (s.taste.sweet || { no: 0 }).no >= 5; } },
    { id: 'explorer',    name: 'Explorer',      icon: '\u{1F5FA}\u{FE0F}', hint: 'Try fifteen different dishes',
      test: function (s) { return Object.keys(s.picks).length >= 15; } },
    { id: 'regular',     name: 'The Regular',   icon: '\u{1F4CD}', hint: 'Land on the same dish three times',
      test: function (s) {
        return Object.keys(s.picks).some(function (k) { return s.picks[k] >= 3; });
      } },
    { id: 'shrugger',    name: 'Easy Going',    icon: '\u{1F937}', hint: 'Answer “either” ten times',
      test: function (s) { return s.eithers >= 10; } },
    { id: 'streak-3',    name: 'On a Roll',     icon: '\u{1F525}', hint: 'Come back three days running',
      test: function (s) { return s.streakBest >= 3; } },
    { id: 'streak-7',    name: 'Devoted',       icon: '\u{1F31F}', hint: 'Come back seven days running',
      test: function (s) { return s.streakBest >= 7; } },
    { id: 'night-owl',   name: 'Night Owl',     icon: '\u{1F989}', hint: 'Decide something after 11pm',
      test: function (s) { return s.nightOwl; } },
    { id: 'early-bird',  name: 'Early Bird',    icon: '\u{1F413}', hint: 'Decide something before 7am',
      test: function (s) { return s.earlyBird; } }
  ];

  // Standing dietary rules. Each one bans a tag outright, so those dishes never
  // come up and the matching question is never asked.
  /*
   * ONE TAG EACH, and that is what separates this list from DIETS below.
   *
   * A rule here is a single thing somebody does not want, named the way they
   * would name it. A diet is a set of them under one word. Both are free, both
   * end up in the same place, and the only reason they are two lists is that
   * "I am vegan" and "no mushrooms, thanks" are different sentences and ought
   * to be different controls.
   *
   * It started at six and is now thirteen, because the diets need the parts
   * they are built from to be reachable on their own. Somebody who keeps halal
   * but drinks is better served by turning Halal on and No alcohol off than by
   * being told the shortcut does not fit them.
   */
  var RULES = [
    { tag: 'meat',      label: 'No meat',          note: 'Nothing with meat in it' },
    { tag: 'seafood',   label: 'No seafood',       note: 'No fish, no shellfish' },
    { tag: 'pork',      label: 'No pork',          note: 'Bacon, ham and sausage included' },
    { tag: 'beef',      label: 'No beef',          note: 'Nothing with beef in it' },
    { tag: 'shellfish', label: 'No shellfish',     note: 'Prawns, crab, lobster, mussels' },
    { tag: 'dairy',     label: 'No dairy',         note: 'Milk, cream, butter and cheese' },
    { tag: 'egg',       label: 'No egg',           note: 'Including egg in the batter' },
    { tag: 'cheesy',    label: 'No cheese',        note: 'Skip anything cheese-led' },
    { tag: 'allium',    label: 'No onion or garlic', note: 'Leeks, shallots and chives too' },
    { tag: 'root',      label: 'Nothing from underground', note: 'Potato, carrot, ginger, turmeric' },
    { tag: 'alcohol',   label: 'No alcohol',       note: 'Including wine cooked into a sauce' },
    { tag: 'spicy',     label: 'Nothing spicy',    note: 'Keep the heat off' },
    { tag: 'fried',     label: 'Nothing fried',    note: 'No deep-fried anything' },
    { tag: 'caffeine',  label: 'No caffeine',      note: 'Coffee, tea, and the rest of it' }
  ];

  /*
   * THE THINGS SOMEBODY DOES NOT EAT, named the way they would name them.
   *
   * RULES above are single tags, and they work because "no cheese" is one
   * idea. Almost nothing anybody actually says about their diet is one idea:
   * "I keep halal" is two, "I am vegan" is four, and "I am Jain" is five. So a
   * diet is a name with a set of tags behind it, picked once, and the tags are
   * an implementation detail nobody has to see.
   *
   * FREE, all of them, and that is not a pricing oversight — see the comment
   * on the standing rules in app.js. An app that keeps serving a Muslim pork
   * until they pay is not running a clever funnel. It is being deleted.
   *
   * THEY STACK, which is what stops this list having to hold every combination
   * anybody lives by. Hindu and Vegetarian together is an ordinary thing to
   * be, and so is Halal and No alcohol off; the union of whatever is switched
   * on is the answer. That is why the faith entries below are the distinct
   * RULES of a tradition rather than a guess at one person's whole practice,
   * and why the ones that are commonly kept alongside vegetarianism say so
   * instead of assuming it.
   *
   * WHAT THIS LIST IS NOT. It is not a ruling, and it is not a census. Every
   * tradition here contains people who keep it differently, which is said out
   * loud in the caveats rather than smoothed over: the entries that name a
   * vegetarian form say "vegetarian" in the label so nothing here reads as the
   * app telling somebody what their religion requires of them.
   *
   * WHAT THE `caveat` IS FOR. Several of these cannot be honoured by a tag,
   * and pretending otherwise would be the worst thing in here. No catalogue
   * knows whether an animal was slaughtered to a rite, whether a kitchen keeps
   * meat and dairy pans apart, or whether the oil the chips went in had fish
   * in it this morning. What this can do is keep the obvious things off the
   * menu. The caveat says which part is which, and it is shown wherever the
   * diet is offered rather than buried in a policy page — an honest limit
   * stated up front is worth more to somebody who keeps a rule than a
   * confident claim they will catch us out on by Thursday.
   */
  var DIETS = [
    /* ---- by faith ---------------------------------------------------- */
    { id: 'halal', group: 'faith', label: 'Halal', note: 'No pork, no alcohol',
      tags: ['pork', 'alcohol'],
      caveat: 'Keeps pork and alcohol off your menu. It cannot tell you whether ' +
        'meat is zabiha or a kitchen is certified \u2014 only the kitchen can.' },

    { id: 'kosher', group: 'faith', label: 'Kosher',
      note: 'No pork or shellfish, never meat with dairy',
      tags: ['pork', 'shellfish', 'meatdairy'],
      caveat: 'Keeps pork, shellfish and meat-with-dairy off your menu. Kashrut ' +
        'is a kitchen and a hechsher, and no app can stand in for either.' },

    { id: 'hindu', group: 'faith', label: 'Hindu', note: 'Nothing with beef in it',
      tags: ['beef'],
      caveat: 'Beef is the rule most widely kept. Many Hindus are vegetarian as ' +
        'well \u2014 add Vegetarian, or use Sattvic below, if that is how you eat.' },

    { id: 'sattvic', group: 'faith', label: 'Sattvic',
      note: 'Vegetarian, and no onion, garlic, alcohol or caffeine',
      tags: ['meat', 'seafood', 'allium', 'alcohol', 'caffeine'] },

    { id: 'jain', group: 'faith', label: 'Jain',
      note: 'No meat, fish or egg, and nothing grown underground',
      tags: ['meat', 'seafood', 'egg', 'allium', 'root'],
      caveat: 'The strictest thing in this list, and this catalogue is short on ' +
        'Jain cooking \u2014 expect mostly sweet things and drinks. Honey, and ' +
        'food kept overnight, are past what a tag can see.' },

    { id: 'buddhist', group: 'faith', label: 'Buddhist, vegetarian',
      note: 'No meat or fish, no onion or garlic',
      tags: ['meat', 'seafood', 'allium'],
      caveat: 'Practice varies enormously and a great many Buddhists eat meat. ' +
        'This is the Mahayana vegetarian form, pungent roots and all.' },

    { id: 'sikh', group: 'faith', label: 'Sikh, vegetarian', note: 'No meat or fish',
      tags: ['meat', 'seafood'],
      caveat: 'Sikhi does not require vegetarianism, but langar always is and many ' +
        'Sikhs eat this way. The rule that does apply either way \u2014 no kutha ' +
        'meat \u2014 is about how an animal was killed, which nothing here can see.' },

    { id: 'adventist', group: 'faith', label: 'Seventh-day Adventist',
      note: 'No pork or shellfish, no alcohol or caffeine',
      tags: ['pork', 'shellfish', 'alcohol', 'caffeine'],
      caveat: 'Many Adventists keep a vegetarian diet as well \u2014 add Vegetarian ' +
        'on top if you do.' },

    { id: 'wordofwisdom', group: 'faith', label: 'Word of Wisdom',
      note: 'No alcohol, coffee or tea',
      tags: ['alcohol', 'caffeine'],
      caveat: 'The Latter-day Saint health code. Where exactly caffeine ends is ' +
        'something members decide for themselves; this takes coffee, tea and the ' +
        'caffeinated drinks off and leaves the rest to you.' },

    { id: 'ital', group: 'faith', label: 'Ital',
      note: 'No meat, fish, dairy, egg or alcohol',
      tags: ['meat', 'seafood', 'dairy', 'egg', 'alcohol'],
      caveat: 'Rastafari livity. Ital also turns on salt and on how processed a ' +
        'thing is, neither of which this catalogue records.' },

    /* ---- by diet ------------------------------------------------------ */
    { id: 'vegetarian', group: 'diet', label: 'Vegetarian', note: 'No meat, no fish',
      tags: ['meat', 'seafood'] },

    { id: 'vegan', group: 'diet', label: 'Vegan', note: 'No meat, fish, dairy or egg',
      tags: ['meat', 'seafood', 'dairy', 'egg'],
      caveat: 'Tagged by how a dish is normally made. Honey, gelatine and what the ' +
        'bread was brushed with are past what the catalogue knows.' },

    { id: 'pescatarian', group: 'diet', label: 'Pescatarian', note: 'Fish yes, meat no',
      tags: ['meat'] }
  ];

  // The two entries that were single tags pretending to be diets. They are
  // ordinary rules now — see RULES — so a profile that picked one before this
  // split keeps exactly what it asked for rather than silently losing it.
  var RETIRED_DIETS = { nobeef: 'beef', nopork: 'pork' };

  // The axes shown on the profile screen, drawn from how you tend to answer.
  var AXES = [
    { tag: 'sweet',   yes: 'Sweet',   no: 'Savoury' },
    { tag: 'hot',     yes: 'Hot',     no: 'Cold' },
    { tag: 'healthy', yes: 'Healthy', no: 'Treat' },
    { tag: 'quick',   yes: 'Quick',   no: 'Patient' },
    { tag: 'shareable', yes: 'Sharer', no: 'Solo' },
    { tag: 'homemade', yes: 'At home', no: 'Takeaway' }
  ];

  function blank() {
    return {
      xp: 0,
      decisions: 0,
      picks: {},              // dish name -> times landed on
      taste: {},              // tag -> { yes, no, mid }
      eithers: 0,
      firstGuessAccepts: 0,
      fastestGame: 0,
      longestGame: 0,
      mostRejections: 0,
      streak: 0,
      streakBest: 0,
      lastPlayed: null,       // YYYY-MM-DD
      nightOwl: false,
      earlyBird: false,
      badges: [],
      muted: false,
      history: [],            // [{ name, icon, at }], newest first
      recent: [],             // [{ name, icon }], newest first
      favourites: [],         // [{ name, icon }] the player saved, newest first
      rules: [],              // tags never to be served, e.g. ['meat']
      diets: [],              // DIETS ids picked on the way in, e.g. ['halal']
      onboarded: false,       // has the first-run walkthrough been seen through
      savedAt: 0,             // when this profile last changed, for syncing
      sync: false,            // has this device been told to keep it on an account

      // --- morsels45 Premium ---
      plus: false,            // is the paid tier switched on
      sub: null,              // what Whop last said about the subscription, and when
      ratings: {},            // dish name -> 'loved' | 'fine' | 'no'
      snoozed: {},            // dish name -> timestamp it becomes available again
      customRules: [],        // extra banned tags, chosen from the full tag list
      freezes: 2,             // streak freezes in hand
      freezeSpent: null,      // YYYY-MM-DD a freeze was spent on
      plan: null,             // { at, dishes: [{ name, icon }] }
      banned: {},             // dish name -> true, struck off for good
      theme: '',              // which palette, '' being the one it ships with

      /*
       * Today's five, kept so a second visit on the same day costs no request.
       * Shaped {day, dishes} rather than a bare list: without the date there is
       * no way to tell this morning's shelf from last Tuesday's.
       */
      daily: null,
      tuned: false,           // did they tell us what they like, on purpose
      loves: [],              // tags they said they like, as opposed to played
      pantry: [],             // what is in the cupboard, for "what can I make?"
      party: '',              // '' | 'solo' | 'table' — how many plates
      meal: '',               // '' | 'breakfast' | 'lunch' | 'dinner' | 'late'
      heat: '',               // '' | 'none' | 'hot'
      adventure: '',          // '' | 'stick' | 'wild'
      noRepeat: false,        // snooze an accepted dish for seven days

      // --- Endless ---
      endlessDay: null,       // YYYY-MM-DD the tally below belongs to
      endlessUsed: 0,         // picks taken today, against the free allowance
      endlessBest: 0,         // best score ever, kept for good
      // 0 means "set under a balance nobody recorded" — every profile written
      // before this field existed. See endlessRulesAre.
      endlessRules: 0,
      endlessRuns: 0,         // runs finished, ever
      /*
       * The best run's shape, not just its total — score banked at every tenth
       * pick. A single best score can only be beaten at the end; a curve can be
       * raced the whole way, which is what makes a run you are losing still
       * worth finishing.
       *
       * Sampled every ten picks rather than every pick: a three-hundred-pick
       * run is thirty numbers instead of three hundred, and the marker moves
       * between samples by interpolation anyway.
       */
      endlessCurve: [],       // [score@10, score@20, ...] from the best run
      endlessTheme: '',       // '' | a tag — which pool Endless draws from

      /*
       * Whether we have asked how they are getting on, and what they said.
       *
       * Stored so it is asked once and then never again. 'no' is as final as
       * 'yes': somebody who told us they are not enjoying it has answered the
       * question, and asking a second time is not a survey, it is nagging.
       * 'later' is a dismissal — it comes back, but not soon.
       */
      earn: '',               // '' | 'no' — whether the affiliate offer was declined
      earnAt: 0,              // decisions at the last showing
      earnShown: 0,           // times it has been shown, ever

      enjoy: '',              // '' | 'yes' | 'no' | 'later'
      enjoyAt: 0,             // when it was last put to them
      enjoyShown: 0,          // how many times it has been shown, ever

      share: '',              // '' | 'no' — whether being asked to pass it on was declined
      shareAt: 0,             // decisions at the last showing
      shareShown: 0,          // times it has been shown, ever

      /*
       * The rotating offers (see ADS in app.js). `plusAd` and `earn` are the
       * two final refusals — 'no' on either silences that whole kind of offer
       * for good, not just the card that was on screen. `adAt` is where the
       * rotation got to, saved so a new game opens on the next card rather
       * than the same one every time.
       */
      plusAd: '',             // '' | 'no' — whether the Premium pitch was ended
      adAt: 0,                // rotation cursor into ADS
      adShown: 0,             // offers shown, ever — for the record, not a cap

      // Decisions at the last prompt shown to a paying member. They only ever
      // see the affiliate one, and only once every PLUS_PROMPT_EVERY.
      plusPromptAt: 0,

      /*
       * What a Standard profile has used up of the AI features.
       *
       * chatAsks is a lifetime count of questions put to the assistant, not a
       * daily one: the free three are a trial of the thing, and a trial that
       * refills every morning is not a trial, it is the product.
       *
       * menuAt is a timestamp rather than a count, because the meal creator
       * is one go every couple of days and the only thing worth storing is
       * when the last one was.
       */
      chatAsks: 0,            // questions asked of the assistant, ever
      menuAt: 0,              // ms timestamp of the last menu built

      /*
       * The menu itself, so a reload does not eat it.
       *
       * The go is spent the moment the model answers, and a menu is agreed to
       * one course at a time — so without this, closing the tab halfway
       * through costs somebody both the menu and their next two days. Kept as
       * course id plus dish name rather than as dish objects: the catalogue
       * grows, and a stored object would be a stale copy of a dish that has
       * since changed.
       *
       * menuRun is the run in progress; menuDone is the finished meal, which
       * is worth keeping around because it is the answer to "what am I
       * cooking tonight" and that question gets asked again at six o'clock.
       */
      menuRun: null,
      menuDone: null
    };
  }

  // localStorage throws in some contexts (private windows, file:// on some
  // browsers). Progress is a nice-to-have, so fall back to memory rather than
  // taking the app down with it.
  function safeStorage() {
    try {
      var probe = '__wsie__';
      localStorage.setItem(probe, '1');
      localStorage.removeItem(probe);
      return localStorage;
    } catch (err) {
      var mem = {};
      return {
        getItem: function (k) { return k in mem ? mem[k] : null; },
        setItem: function (k, v) { mem[k] = String(v); },
        removeItem: function (k) { delete mem[k]; }
      };
    }
  }

  function dayKey(date) {
    var d = date || new Date();
    return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
  }

  function daysBetween(a, b) {
    return Math.round((Date.parse(b + 'T00:00:00') - Date.parse(a + 'T00:00:00')) / 86400000);
  }

  function Progress(storage, device) {
    this.storage = storage || safeStorage();
    // Optional so the tests and the pure parts can build one without a
    // browser. Absent, a licence simply is not bound to anything.
    this.device = device || null;
    this.reload();
  }

  // Re-reads whatever the storage holds now. Split out of the constructor so an
  // account can be opened after the app has already booted, without having to
  // rebuild everything that holds a reference to this object.
  Progress.prototype.reload = function () {
    var saved = null;
    try { saved = JSON.parse(this.storage.getItem(KEY)); } catch (err) { saved = null; }

    this.state = blank();
    if (saved && typeof saved === 'object') {
      // Merge field by field so a state saved by an older version still loads.
      Object.keys(this.state).forEach(function (k) {
        if (saved[k] !== undefined && saved[k] !== null) this.state[k] = saved[k];
      }, this);
    }

    /*
     * A diet that has since become an ordinary rule keeps working.
     *
     * dietTags() looks a diet up by id and skips one it does not recognise,
     * which is the right thing to do with a stored id from the future and
     * quite the wrong thing to do with one from the past: somebody who chose
     * "No pork" would have had it silently stop applying on the morning the
     * list was reorganised, with the row still showing nothing at all. A
     * dietary rule failing open and saying nothing is the one outcome this
     * whole area exists to prevent, so the id is translated instead.
     */
    var rules = this.state.rules || (this.state.rules = []);
    this.state.diets = (this.state.diets || []).filter(function (id) {
      var tag = RETIRED_DIETS[id];
      if (!tag) return true;
      if (rules.indexOf(tag) === -1) rules.push(tag);
      return false;
    });
  };

  /*
   * Every save stamps the state with the moment it happened.
   *
   * This is the whole of the conflict rule for syncing (see sync.js): two
   * devices, and the one that wrote last is the one that is kept. It is
   * stamped here rather than at the point of syncing so that it describes
   * when the PROFILE changed, not when it was last uploaded — a device that
   * has been edited and not yet uploaded still has the newer copy, and should
   * win when it finally gets a connection.
   *
   * `onSave` is how sync.js hears about it without progress.js having to know
   * that syncing exists.
   */
  Progress.prototype.save = function () {
    this.state.savedAt = Date.now();
    try { this.storage.setItem(KEY, JSON.stringify(this.state)); } catch (err) { /* not fatal */ }
    if (typeof this.onSave === 'function') {
      try { this.onSave(this.state); } catch (err) { /* a listener must never break a save */ }
    }
  };

  /*
   * Replace everything with a profile from somewhere else, and write it down.
   *
   * Used by sync.js when the copy on the server is newer than this one. It
   * goes through blank() and the same field-by-field merge reload() uses, so
   * a profile written by an older or newer build of the app still lands in a
   * shape this build understands, and anything it does not recognise is
   * dropped rather than carried into the running state.
   */
  Progress.prototype.adopt = function (incoming) {
    if (!incoming || typeof incoming !== 'object') return false;
    var fresh = blank();
    Object.keys(fresh).forEach(function (k) {
      if (incoming[k] !== undefined && incoming[k] !== null) fresh[k] = incoming[k];
    });
    this.state = fresh;
    // Kept from the incoming copy rather than restamped: this profile is as
    // old as it is, and restamping it would make a stale device look like the
    // freshest one on the next comparison.
    this.state.savedAt = Number(incoming.savedAt) || Date.now();
    try { this.storage.setItem(KEY, JSON.stringify(this.state)); } catch (err) { /* not fatal */ }
    this.reload();
    return true;
  };

  Progress.prototype.level = function () {
    var s = this.state, index = 0;
    for (var i = 0; i < LEVELS.length; i++) if (s.xp >= LEVELS[i].at) index = i;

    var here = LEVELS[index];
    var next = LEVELS[index + 1] || null;
    return {
      index: index,
      number: index + 1,
      name: here.name,
      icon: here.icon,
      xp: s.xp,
      into: s.xp - here.at,
      needed: next ? next.at - here.at : 0,
      next: next,
      pct: next ? Math.min(1, (s.xp - here.at) / (next.at - here.at)) : 1
    };
  };

  Progress.prototype.addXp = function (amount) {
    var before = this.level().number;
    this.state.xp += amount;
    var after = this.level();
    return { gained: amount, leveledUp: after.number > before, level: after };
  };

  Progress.prototype.recordAnswer = function (tag, value) {
    var s = this.state;
    if (value === 'either') {
      s.eithers++;
      return XP.either;
    }
    var bucket = s.taste[tag] || (s.taste[tag] = { yes: 0, no: 0 });
    // "Neither" is a decision, so it earns what an answer earns — but it is not
    // a lean towards either end, and counting it as one would tilt the axis it
    // was chosen precisely to sit out of. Kept separately, read by nothing that
    // measures the lean.
    if (value === 'neither') bucket.mid = (bucket.mid || 0) + 1;
    else bucket[value]++;
    return XP.answer;
  };

  // Called once the player accepts a dish. Returns the XP breakdown, whether
  // they levelled up, and any badges that just unlocked.
  Progress.prototype.recordDecision = function (item, info, now) {
    var s = this.state;
    var when = now || new Date();
    var today = dayKey(when);

    var awardsExtra = [];

    s.decisions++;
    s.picks[item.name] = (s.picks[item.name] || 0) + 1;
    s.recent = [{ name: item.name, icon: item.icon }]
      .concat(s.recent.filter(function (r) { return r.name !== item.name; }))
      .slice(0, 8);

    s.history = [{ name: item.name, icon: item.icon, at: when.getTime() }]
      .concat(s.history || []).slice(0, 60);

    // A shortcut straight off the saved list isn't a game, so it doesn't count
    // towards any of the stats that describe how a game went.
    if (!info.shortcut) {
      if (info.rejections === 0) s.firstGuessAccepts++;
      if (!s.fastestGame || info.questions < s.fastestGame) s.fastestGame = info.questions;
      s.longestGame = Math.max(s.longestGame, info.questions);
      s.mostRejections = Math.max(s.mostRejections, info.rejections);
    }

    var hour = when.getHours();
    if (hour >= 23 || hour < 3) s.nightOwl = true;
    if (hour >= 4 && hour < 7) s.earlyBird = true;

    // Streaks count consecutive days played, not consecutive games. Plus keeps
    // a couple of freezes in hand: miss a single day and one is spent to hold
    // the streak rather than resetting it to one.
    var gap = s.lastPlayed === null ? null : daysBetween(s.lastPlayed, today);
    if (gap === null) s.streak = 1;
    else if (gap === 0) { /* already played today, streak unchanged */ }
    else if (gap === 1) s.streak = s.streak + 1;
    else if (gap === 2 && s.plus && s.freezes > 0) {
      s.freezes--;
      s.freezeSpent = today;
      s.streak = s.streak + 1;
      awardsExtra.push({ label: 'Streak freeze used', xp: 0, freeze: true });
    } else s.streak = 1;
    s.streakBest = Math.max(s.streakBest, s.streak);
    s.lastPlayed = today;

    var awards = awardsExtra.slice();
    if (info.answerXp) awards.push({ label: 'Questions answered', xp: info.answerXp });
    awards.push({ label: 'Decision made', xp: XP.decision });
    if (!info.shortcut) {
      if (info.rejections === 0) awards.push({ label: 'Nailed it first guess', xp: XP.firstGuess });
      if (info.questions <= 6) awards.push({ label: 'Read like a book', xp: XP.swift });
    }

    var unlocked = this.checkBadges();
    unlocked.forEach(function (b) { awards.push({ label: b.name, xp: XP.badge, badge: b }); });

    var total = awards.reduce(function (sum, a) { return sum + a.xp; }, 0);
    var result = this.addXp(total);

    this.save();
    return { awards: awards, total: total, leveledUp: result.leveledUp, level: result.level, badges: unlocked };
  };

  Progress.prototype.checkBadges = function () {
    var s = this.state, earned = [];
    BADGES.forEach(function (badge) {
      if (s.badges.indexOf(badge.id) !== -1) return;
      if (badge.test(s)) { s.badges.push(badge.id); earned.push(badge); }
    });
    return earned;
  };

  Progress.prototype.hasBadge = function (id) { return this.state.badges.indexOf(id) !== -1; };

  // How many dishes a free profile may keep: none.
  //
  // It was three, which is the shape of a trial rather than of a tier — three
  // is enough to see the point of the feature and never enough to use it, so it
  // annoyed the people who were not going to pay and did not persuade them
  // either. Saving a dish is now something Premium does, whole, and the button
  // says so before it is pressed rather than after the third one.
  //
  // Everything else free keeps: the game, the whole catalogue, the browser, the
  // search, XP, levels, streaks and badges.
  var FREE_SAVES = 0;

  // Is Premium on, right now, on this device?
  //
  // Two things have to hold. The flag says the tier was switched on; the
  // binding says the licence that switched it on belongs to this device. A
  // licence bound elsewhere leaves the flag alone — it is still their
  // subscription, and re-entering the key here moves it — but it does not
  // unlock anything until it is.
  //
  // With no device to ask, nothing is enforced. Being unable to read
  // localStorage is not grounds for taking away something somebody paid for.
  Progress.prototype.isPlus = function () {
    if (!this.state.plus) return false;
    return !this.device || this.device.holds(this.state.sub);
  };

  // Premium was paid for, but activated on a different device. Worth saying out
  // loud on the profile screen, because the alternative is a subscriber
  // watching their features vanish with no explanation.
  Progress.prototype.boundElsewhere = function () {
    var sub = this.state.sub;
    if (!sub || !sub.key || !sub.premium) return false;
    return !!this.device && !this.device.holds(sub);
  };

  Progress.prototype.setPlus = function (on) {
    this.state.plus = !!on;
    this.save();
    return this.state.plus;
  };

  // The last verdict from Whop, kept so the app is not sending somebody back to
  // sign in on every page load. It is a receipt, not the entitlement: `plus` is
  // what gates the features, and this is the note explaining why it is on.
  Progress.prototype.rememberSubscription = function (verdict) {
    var was = this.state.sub || {};
    this.state.sub = verdict
      ? {
          premium: !!verdict.premium,
          until: verdict.until || 0,
          status: verdict.status || '',
          who: verdict.who || '',
          // Kept so the check can repeat itself without asking again. A failed
          // re-check must not lose it: being offline is not a reason to make
          // somebody hunt out their key a second time.
          key: verdict.key || was.key || '',
          // Which device this licence was activated on. Written from the
          // verdict when the server echoes one back, and otherwise from here,
          // so an older record picks up its binding on the next check instead
          // of staying unbound forever.
          device: verdict.device || was.device ||
            (this.device ? this.device.id() : ''),
          checkedAt: Date.now()
        }
      : null;
    this.save();
    return this.state.sub;
  };

  Progress.prototype.subscription = function () { return this.state.sub || null; };

  Progress.prototype.saveLimit = function () {
    return this.isPlus() ? Infinity : FREE_SAVES;
  };

  Progress.prototype.savesLeft = function () {
    return this.saveLimit() - (this.state.favourites || []).length;
  };

  /* -------------------------------------------------------------- endless */
  // Endless is free, and free has a daily allowance: so many picks a day, then
  // it stops until tomorrow. Paying takes the ceiling off.
  //
  // WHY THE TALLY IS KEPT HERE, on the phone, where anybody could clear it.
  // Because there is nowhere else to keep it. The worker has no KV and no
  // Durable Object binding, so a server-side counter would not survive a cold
  // isolate, let alone midnight. That was a real problem for the shared
  // browser, where every free minute costs money at Hyperbeam. It is not one
  // here: Endless makes no request at all — the catalogue, the pairing and the
  // scoring are all already on the phone — so a wiped tally costs an upsell
  // and nothing more. It is the honest trade, and it is the one worth taking.
  //
  // Yesterday's tally never counts against today: the day stamp is compared,
  // not accumulated, so a missed day resets rather than banks.
  Progress.prototype.today = function (now) {
    return dayKey(now ? new Date(now) : null);
  };

  Progress.prototype.endlessUsedToday = function (now) {
    var today = this.today(now);
    return this.state.endlessDay === today ? (this.state.endlessUsed || 0) : 0;
  };

  Progress.prototype.endlessLeft = function (allowance, now) {
    if (this.isPlus()) return Infinity;
    return Math.max(0, allowance - this.endlessUsedToday(now));
  };

  // One pick spent. Returns what is left afterwards, so a caller can stop on
  // zero without asking a second question.
  Progress.prototype.spendEndless = function (allowance, now) {
    if (this.isPlus()) return Infinity;
    var today = this.today(now);
    if (this.state.endlessDay !== today) {
      this.state.endlessDay = today;
      this.state.endlessUsed = 0;
    }
    this.state.endlessUsed = (this.state.endlessUsed || 0) + 1;
    return Math.max(0, allowance - this.state.endlessUsed);
  };

  // Bank a finished run. Answers whether it was a personal best, which is the
  // only part of it worth saying out loud.
  /*
   * WHICH BALANCE THE STORED BEST WAS SET UNDER.
   *
   * A score is only a target if the next run is playing the same game. When
   * the clock, the buy-back curve or the events change, every stored best
   * becomes a number nobody can reach — and the pace marker, which races the
   * saved curve the whole way down, would tell every run for the rest of time
   * that it was losing. That is not a challenge, it is a locked door with a
   * scoreboard on it.
   *
   * So the balance carries a number, and a best set under a different one is
   * retired rather than kept. Returns true only when there was actually a
   * score to lose, so nobody is told their record has gone when it was zero.
   */
  var ENDLESS_RULES = 2;

  Progress.prototype.endlessRulesAre = function (rules) {
    if (this.state.endlessRules === rules) return false;
    var had = (this.state.endlessBest || 0) > 0;
    this.state.endlessRules = rules;
    this.state.endlessBest = 0;
    this.state.endlessCurve = [];
    this.save();
    return had;
  };

  Progress.prototype.recordEndless = function (score, curve) {
    this.state.endlessRuns = (this.state.endlessRuns || 0) + 1;
    if (score > (this.state.endlessBest || 0)) {
      this.state.endlessBest = score;
      // The curve belongs to the score: kept together or the marker would race
      // one run's pace towards another run's total.
      if (curve && curve.length) this.state.endlessCurve = curve.slice(0, 60);
      return true;
    }
    return false;
  };

  /*
   * What the best run had banked by this pick, or null if it never got here.
   *
   * Interpolated between the ten-pick samples so the marker slides rather than
   * jumping every tenth tap. Past the end of the curve there is nothing honest
   * to say — the best run was already over, which is its own answer.
   */
  Progress.prototype.endlessPaceAt = function (picks) {
    var curve = this.state.endlessCurve || [];
    if (!curve.length || picks <= 0) return null;

    var slot = picks / 10;
    var i = Math.floor(slot);
    var frac = slot - i;

    // Landing exactly on the curve's last sample is a real number, not the end
    // of it: curve[n-1] is the score at pick n*10, so a forty-pick curve knows
    // what pick forty was worth. Bailing on i >= length lost that one — the
    // marker went blank at the exact pick where the race was closest.
    if (i > curve.length) return null;
    if (i === curve.length) return frac === 0 ? curve[i - 1] : null;

    var lo = i === 0 ? 0 : curve[i - 1];
    return Math.round(lo + (curve[i] - lo) * frac);
  };

  Progress.prototype.rate = function (name, verdict) {
    if (['loved', 'fine', 'no'].indexOf(verdict) === -1) {
      delete this.state.ratings[name];
    } else {
      this.state.ratings[name] = verdict;
    }
    this.save();
    return this.state.ratings[name] || null;
  };

  Progress.prototype.ratingOf = function (name) { return (this.state.ratings || {})[name] || null; };

  // "Not today." Off the menu for the rest of the day, not banned for good.
  Progress.prototype.snooze = function (name, now) {
    var when = now || Date.now();
    var midnight = new Date(when);
    midnight.setHours(24, 0, 0, 0);
    this.state.snoozed[name] = midnight.getTime();
    this.save();
    return this.state.snoozed[name];
  };

  Progress.prototype.snoozeFor = function (name, ms, now) {
    var when = now || Date.now();
    this.state.snoozed[name] = when + ms;
    this.save();
    return this.state.snoozed[name];
  };

  Progress.prototype.isSnoozed = function (name, now) {
    var until = (this.state.snoozed || {})[name];
    return !!until && until > (now || Date.now());
  };

  // Expired entries are cleared on load rather than accumulating forever.
  Progress.prototype.tidySnoozes = function (now) {
    var when = now || Date.now();
    var snoozed = this.state.snoozed || {};
    var live = {};
    Object.keys(snoozed).forEach(function (name) {
      if (snoozed[name] > when) live[name] = snoozed[name];
    });
    this.state.snoozed = live;
  };

  // Every tag the profile bans: the six named rules plus anything chosen from
  // the full list. Deduplicated, because the two lists overlap.
  // "Never again", as opposed to "not today". Reversible from the profile and
  // from the dish itself, because a list you cannot review is a trap — but it
  // never lapses on its own the way a snooze does.
  Progress.prototype.isBanned = function (name) { return !!(this.state.banned || {})[name]; };

  Progress.prototype.ban = function (name) {
    this.state.banned[name] = true;
    // A dish you never want again has no business on your saved list.
    this.state.favourites = (this.state.favourites || [])
      .filter(function (f) { return f.name !== name; });
    delete this.state.snoozed[name];
    this.save();
  };

  Progress.prototype.unban = function (name) {
    delete this.state.banned[name];
    this.save();
  };

  Progress.prototype.bannedNames = function () { return Object.keys(this.state.banned || {}); };

  // Take an entry off the history.
  //
  // It removes what the app remembers about eating that dish — the log line,
  // the "lately" chip, and one off the tally that makes something "your usual"
  // — so it stops steering what gets recommended. XP, badges and the decision
  // count stay: those were earned, and rewriting them would be lying about the
  // rest of the profile to fix one line.
  Progress.prototype.forget = function (name, at) {
    var history = this.state.history || [];
    var before = history.length;

    this.state.history = history.filter(function (entry) {
      return !(entry.name === name && (at === undefined || entry.at === at));
    });
    var removed = before - this.state.history.length;
    if (!removed) return 0;

    if (this.state.picks[name]) {
      this.state.picks[name] -= removed;
      if (this.state.picks[name] <= 0) delete this.state.picks[name];
    }

    // The chip only belongs there while some history backs it up.
    var stillEaten = this.state.history.some(function (e) { return e.name === name; });
    if (!stillEaten) {
      this.state.recent = (this.state.recent || []).filter(function (r) { return r.name !== name; });
    }

    this.save();
    return removed;
  };

  Progress.prototype.allRules = function () {
    var out = (this.state.rules || []).slice();
    (this.state.customRules || []).forEach(function (tag) {
      if (out.indexOf(tag) === -1) out.push(tag);
    });
    return out;
  };

  Progress.prototype.hasCustomRule = function (tag) {
    return (this.state.customRules || []).indexOf(tag) !== -1;
  };

  Progress.prototype.toggleCustomRule = function (tag) {
    var list = this.state.customRules || (this.state.customRules = []);
    var on = list.indexOf(tag) !== -1;
    this.state.customRules = on
      ? list.filter(function (t) { return t !== tag; })
      : list.concat([tag]);
    this.save();
    return !on;
  };

  // Put a custom rule in a known state rather than flipping it. The sign-up
  // writes rules it has just been told about, and toggling something already on
  // would turn it off.
  Progress.prototype.setCustomRule = function (tag, on) {
    var list = this.state.customRules || (this.state.customRules = []);
    var has = list.indexOf(tag) !== -1;
    if (on === has) return has;
    this.state.customRules = on
      ? list.concat([tag])
      : list.filter(function (t) { return t !== tag; });
    this.save();
    return !!on;
  };

  // Record a lean on an axis without an answered question behind it.
  //
  // The taste profile is normally built from how somebody actually plays, which
  // is the honest way round. The likes-and-dislikes screen asks directly, so
  // those answers go in here — weighted like a few games rather than like a
  // hundred, because a tap on a chip is a weaker signal than eight games of
  // consistently picking the spicy one, and the model already knows how to
  // weigh a thin axis.
  Progress.prototype.lean = function (tag, value, weight) {
    var bucket = this.state.taste[tag] || (this.state.taste[tag] = { yes: 0, no: 0 });
    var side = value === 'yes' ? 'yes' : 'no';
    bucket[side] = Math.max(0, bucket[side] + (weight === undefined ? 1 : weight));
    return bucket;
  };

  // How much a tap on a chip is worth, in games.
  var LOVE_WEIGHT = 3;

  Progress.prototype.loves = function (tag) {
    return (this.state.loves || []).indexOf(tag) !== -1;
  };

  Progress.prototype.lovedTags = function () { return (this.state.loves || []).slice(); };

  // "I like cheese", said out loud.
  //
  // Two things happen, and keeping them apart is the point. The lean goes into
  // the taste profile, where it nudges the picks. The tag also goes on a list
  // of things they *said*, because a lean is a number and cannot be shown back
  // to somebody as a choice they made — without this, the editor reopened
  // showing nothing, and a preference could be added but never taken away.
  Progress.prototype.setLove = function (tag, on) {
    var list = this.state.loves || (this.state.loves = []);
    var has = list.indexOf(tag) !== -1;
    if (!!on === has) return has;

    if (on) {
      list.push(tag);
      this.lean(tag, 'yes', LOVE_WEIGHT);
    } else {
      this.state.loves = list.filter(function (t) { return t !== tag; });
      // Take the nudge back out rather than leaving it behind: an opinion you
      // withdrew should stop steering the picks.
      this.lean(tag, 'yes', -LOVE_WEIGHT);
    }
    this.save();
    return !!on;
  };

  Progress.prototype.isFavourite = function (name) {
    return (this.state.favourites || []).some(function (f) { return f.name === name; });
  };

  // Returns 'saved', 'removed', or 'full' when the free tier is out of room.
  // Removing always works — nobody should be locked out of undoing something.
  Progress.prototype.toggleFavourite = function (item) {
    var list = this.state.favourites || (this.state.favourites = []);
    if (this.isFavourite(item.name)) {
      this.state.favourites = list.filter(function (f) { return f.name !== item.name; });
      this.save();
      return 'removed';
    }
    if (this.isBanned(item.name)) return 'banned';
    if (list.length >= this.saveLimit()) return 'full';
    this.state.favourites = [{ name: item.name, icon: item.icon }].concat(list).slice(0, 60);
    this.save();
    return 'saved';
  };

  // The diets in one group, in the order they are written. The UI asks for a
  // group rather than filtering the list itself, so adding one never means
  // remembering to update a screen.
  Progress.prototype.dietsIn = function (group) {
    return DIETS.filter(function (d) { return d.group === group; });
  };

  Progress.prototype.hasDiet = function (id) {
    return (this.state.diets || []).indexOf(id) !== -1;
  };

  // Set rather than flip, because the place that writes these is a list of
  // choices being read back off a screen, not a switch being pressed.
  Progress.prototype.setDiet = function (id, on) {
    if (!DIETS.some(function (d) { return d.id === id; })) return false;
    var list = this.state.diets || (this.state.diets = []);
    var has = list.indexOf(id) !== -1;
    if (on === has) return has;
    this.state.diets = on
      ? list.concat([id])
      : list.filter(function (d) { return d !== id; });
    this.save();
    return !!on;
  };

  Progress.prototype.toggleDiet = function (id) {
    return this.setDiet(id, !this.hasDiet(id));
  };

  // Every tag the chosen diets rule out, flattened and deduplicated. More than
  // one can be on at once and they overlap freely — halal and vegetarian
  // together is a perfectly ordinary thing to be, and the union is the answer.
  Progress.prototype.dietTags = function () {
    var out = [];
    (this.state.diets || []).forEach(function (id) {
      DIETS.forEach(function (diet) {
        if (diet.id !== id) return;
        diet.tags.forEach(function (tag) {
          if (out.indexOf(tag) === -1) out.push(tag);
        });
      });
    });
    return out;
  };

  // The diets in force, as objects, for anything that has to name them.
  Progress.prototype.dietsChosen = function () {
    var self = this;
    return DIETS.filter(function (d) { return self.hasDiet(d.id); });
  };

  Progress.prototype.hasRule = function (tag) { return (this.state.rules || []).indexOf(tag) !== -1; };

  Progress.prototype.toggleRule = function (tag) {
    var list = this.state.rules || (this.state.rules = []);
    var on = list.indexOf(tag) !== -1;
    this.state.rules = on
      ? list.filter(function (t) { return t !== tag; })
      : list.concat([tag]);
    this.save();
    return !on;
  };

  // Where this player sits on each axis, as a 0..1 lean towards the "yes" side.
  Progress.prototype.taste = function () {
    var s = this.state;
    return AXES.map(function (axis) {
      var votes = s.taste[axis.tag] || { yes: 0, no: 0 };
      var total = votes.yes + votes.no;
      return {
        tag: axis.tag,
        yes: axis.yes,
        no: axis.no,
        total: total,
        lean: total ? votes.yes / total : 0.5
      };
    });
  };

  // Wipe the progress, keep what was paid for.
  //
  // The button says "XP, badges, streak, saved dishes", and it used to take the
  // subscription with them — a paying customer who tidied up their stats came
  // back to a locked app and a licence key they had to go and find again. What
  // was bought is not progress: the tier, the receipt from Whop and the device
  // it is bound to survive, and so does the palette, which is a setting rather
  // than a score.
  Progress.prototype.reset = function () {
    // What survives a wipe. The subscription and the two settings, obviously —
    // and today's Endless tally, which is not progress at all.
    //
    // It is a meter, and the wipe button offers to clear "XP, badges, streaks,
    // saved dishes, ratings and history". Clearing the meter with them handed
    // anybody a fresh sixty picks for one tap of a button the app puts on its
    // own settings screen — a daily allowance with a labelled reset switch
    // beside it is not an allowance. Somebody determined enough will still
    // clear their site data; the difference is that the app is not the one
    // offering to do it for them.
    //
    // The best score and the run count go, though: those are exactly the kind
    // of history the button says it clears.
    var kept = {
      plus: this.state.plus,
      sub: this.state.sub,
      theme: this.state.theme,
      muted: this.state.muted,
      endlessDay: this.state.endlessDay,
      endlessUsed: this.state.endlessUsed
    };
    this.state = blank();
    Object.keys(kept).forEach(function (k) {
      if (kept[k] !== undefined) this.state[k] = kept[k];
    }, this);
    this.save();
  };

  return {
    Progress: Progress,
    LEVELS: LEVELS,
    BADGES: BADGES,
    AXES: AXES,
    RULES: RULES,
    DIETS: DIETS,
    ENDLESS_RULES: ENDLESS_RULES,
    FREE_SAVES: FREE_SAVES,
    LOVE_WEIGHT: LOVE_WEIGHT,
    XP: XP,
    blank: blank,
    dayKey: dayKey,
    KEY: KEY
  };
});
