/*
 * taste.js — what the app has learned about one person, as a number per dish.
 *
 * Everything here is a pure function of the saved profile, so it can be
 * exercised without a browser and without a game in progress. The output feeds
 * three places: the engine's starting prior, the instant picks that skip the
 * questions entirely, and the week plan.
 *
 * The whole model is deliberately weak. A strict answer swings a dish by about
 * fifteen times; this is capped at four. That ratio is the design: the profile
 * decides between dishes your answers left tied, and never overrules an answer.
 * Nothing is ever multiplied to zero, because a zero would make a dish
 * unreachable for good and one bad night should not do that.
 */
(function (root, factory) {
  var mod = factory();
  if (typeof module === 'object' && module.exports) module.exports = mod;
  else root.FoodTaste = mod;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  // What matters is the spread between these two, not either number: it is the
  // ratio the answers have to compete with. One preference answer moves a dish
  // by about sixteen times, so holding the whole profile inside five keeps it
  // firmly the junior partner. Set wider than this and the simulation in
  // tools/check.js catches it — at a spread of twenty the profile was picking
  // the dish on its own and honest answers dropped from 100% to 96%.
  var MIN = 0.45;
  var MAX = 2.2;

  var DAY = 86400000;

  // Explicit ratings outrank everything else here: someone who tapped "not for
  // me" has told us more than any amount of inferred behaviour.
  var RATING = { loved: 1.9, fine: 1.02, no: 0.5 };

  // How long a dish stays suppressed after you have actually eaten it. Landing
  // on last night's dinner is the fastest way to look like the app is not
  // paying attention.
  var RECENCY = [
    { within: 1,  factor: 0.5 },
    { within: 3,  factor: 0.7 },
    { within: 7,  factor: 0.88 },
    { within: 14, factor: 0.96 }
  ];

  // A snooze is enforced as a rejection in the game itself; this is what keeps
  // it out of the rankings the instant picks and the week plan are built from.
  var SNOOZE_FACTOR = 0.2;
  var FAVOURITE = 1.3;

  // A taste axis needs this many answers before it is allowed full say. Two
  // games are an accident; eight answers on one axis is a preference.
  var CONFIDENT_VOTES = 8;
  var AXIS_PULL = 0.35;       // how hard a fully-confident profile pulls

  function clamp(value, low, high) { return Math.max(low, Math.min(high, value)); }

  function daysSince(then, now) {
    return (now - then) / DAY;
  }

  /* ---------------------------------------------------------------- signals */

  // Where this person sits on every tag they have expressed a view on, as a
  // signed pull in [-1, 1] already scaled by how much evidence there is.
  function pulls(state) {
    var taste = state.taste || {};
    var out = {};
    Object.keys(taste).forEach(function (tag) {
      var votes = taste[tag] || {};
      var yes = votes.yes || 0;
      var no = votes.no || 0;
      var total = yes + no;
      if (!total) return;
      var lean = (yes / total - 0.5) * 2;                   // -1 .. 1
      var confidence = Math.min(1, total / CONFIDENT_VOTES);
      out[tag] = lean * confidence;
    });
    return out;
  }

  // How well a dish matches the profile's tag pulls, averaged rather than
  // multiplied: twenty-five tags multiplied together would swamp everything
  // else in the model within a couple of games.
  function alignment(item, pull) {
    var sum = 0, count = 0;
    Object.keys(pull).forEach(function (tag) {
      if (!(tag in item.tags)) return;
      var centred = (item.tags[tag] - 0.5) * 2;             // -1 .. 1
      sum += pull[tag] * centred;
      count++;
    });
    return count ? sum / count : 0;
  }

  function recencyFactor(state, item, now) {
    var history = state.history || [];
    for (var i = 0; i < history.length; i++) {
      if (history[i].name !== item.name) continue;
      var days = daysSince(history[i].at, now);
      for (var r = 0; r < RECENCY.length; r++) {
        if (days < RECENCY[r].within) return RECENCY[r].factor;
      }
      return 1;                                             // older than the last band
    }
    return 1;
  }

  // Landing on a dish repeatedly is weaker evidence than saying you liked it,
  // and it saturates: the fifth time tells us much less than the second.
  function habitFactor(state, item) {
    var count = (state.picks || {})[item.name] || 0;
    if (!count) return 1;
    return 1 + 0.18 * Math.log2(1 + count);
  }

  function timeFactor(item, now) {
    var hour = new Date(now).getHours();
    var breakfast = item.tags.breakfast || 0;
    var caffeine = item.tags.caffeine || 0;

    if (hour >= 5 && hour < 11) {
      return 1 + 0.35 * breakfast + 0.18 * caffeine;
    }
    if (hour >= 21 || hour < 5) {
      // Cereal at midnight is somebody's answer, just not usually the answer.
      return 1 - 0.25 * breakfast - 0.2 * caffeine;
    }
    return 1;
  }

  function snoozeFactor(state, item, now) {
    var until = (state.snoozed || {})[item.name];
    return until && until > now ? SNOOZE_FACTOR : 1;
  }

  /* -------------------------------------------------------------- affinity */

  // The engine wants a plain function it can call per dish while building its
  // prior. The tag pulls are worked out once here rather than per dish.
  //
  // `options.ignoreTime` drops the time-of-day term. It belongs in a pick for
  // right now and nowhere else: a week plan built at eight in the morning came
  // back as five breakfasts.
  function biasFor(state, now, options) {
    now = now || Date.now();
    options = options || {};
    var pull = pulls(state);
    var favourites = state.favourites || [];
    var ratings = state.ratings || {};

    return function (item) {
      var score = 1;

      var rating = ratings[item.name];
      if (rating && RATING[rating]) score *= RATING[rating];

      if (favourites.some(function (f) { return f.name === item.name; })) score *= FAVOURITE;

      score *= habitFactor(state, item);
      score *= recencyFactor(state, item, now);
      if (!options.ignoreTime) score *= timeFactor(item, now);
      score *= snoozeFactor(state, item, now);
      score *= 1 + AXIS_PULL * alignment(item, pull);

      if (!isFinite(score) || score <= 0) return 1;
      return clamp(score, MIN, MAX);
    };
  }

  // One number for one dish: above 1 means the profile wants to see more of it.
  function affinity(state, item, now, options) {
    return biasFor(state, now, options)(item);
  }

  // Has the profile actually got anything to say yet? Below this there is
  // nothing to personalise with and the app should not pretend otherwise.
  function isWarm(state) {
    if (!state) return false;
    if (Object.keys(state.ratings || {}).length) return true;
    if ((state.favourites || []).length) return true;
    // Somebody who sat down and told us what they like has given us more than
    // three games of shrugging would. Answers given on purpose count; answers
    // given about one evening's appetite do not, which is why this is a flag
    // set by the likes-and-dislikes screen rather than a count of taste votes.
    if (state.tuned) return true;
    return (state.decisions || 0) >= 3;
  }

  /* -------------------------------------------------------------- ranking */

  function ranked(state, items, now, options) {
    now = now || Date.now();
    var bias = biasFor(state, now, options);
    return items
      .map(function (item) { return { item: item, score: bias(item) }; })
      .sort(function (a, b) { return b.score - a.score; });
  }

  // Why a dish scored well, in the person's own history. Only the reasons that
  // pushed it up — a dish you are being shown is not the place to be told what
  // is wrong with it.
  function explain(state, item, now) {
    now = now || Date.now();
    var out = [];

    var rating = (state.ratings || {})[item.name];
    if (rating === 'loved') out.push('You loved this last time');

    if ((state.favourites || []).some(function (f) { return f.name === item.name; })) {
      out.push('It is on your saved list');
    }

    var count = (state.picks || {})[item.name] || 0;
    if (count >= 2) out.push('You have landed here ' + count + ' times');

    var hour = new Date(now).getHours();
    if (hour >= 5 && hour < 11 && item.tags.breakfast) out.push('Breakfast-ish, and it is morning');

    var pull = pulls(state);
    var matched = Object.keys(pull)
      .filter(function (tag) {
        return tag in item.tags && pull[tag] * ((item.tags[tag] - 0.5) * 2) > 0.28;
      })
      .sort(function (a, b) { return Math.abs(pull[b]) - Math.abs(pull[a]); })
      .slice(0, 3);
    if (matched.length) out.push('Matches your usual: ' + matched.join(', '));

    return out;
  }

  /* ------------------------------------------------------------ week plan */

  // Seven dishes the profile likes that are not seven versions of the same
  // dinner. Greedy: take the best remaining, then penalise everything that
  // shares its character before taking the next.
  function week(state, items, options) {
    options = options || {};
    var days = options.days || 7;
    var now = options.now || Date.now();
    var exclude = options.exclude || [];
    var random = options.random || Math.random;

    var pool = items.filter(function (item) {
      return !exclude.some(function (tag) { return (item.tags[tag] || 0) === 1; });
    });
    if (!pool.length) return [];

    // A week is not a moment, so what time it happens to be does not come into
    // it.
    var bias = biasFor(state, now, { ignoreTime: true });
    var scores = pool.map(function (item) {
      // A little noise so two weeks running are not the same seven dinners.
      return bias(item) * (0.85 + 0.3 * random());
    });

    var chosen = [];
    for (var d = 0; d < days && chosen.length < pool.length; d++) {
      var best = -1, bestScore = -Infinity;
      for (var i = 0; i < pool.length; i++) {
        if (scores[i] === null) continue;
        if (scores[i] > bestScore) { bestScore = scores[i]; best = i; }
      }
      if (best < 0) break;

      var pick = pool[best];
      chosen.push(pick);
      scores[best] = null;

      // Anything that reads like the dish just chosen drops down the list.
      for (var j = 0; j < pool.length; j++) {
        if (scores[j] === null) continue;
        scores[j] *= 1 - 0.55 * similarity(pick, pool[j]);
      }
    }
    return chosen;
  }

  // How alike two dishes are, 0 to 1: shared strong tags over the union of them.
  //
  // Over the smaller of the two — which is what this used to do — a sparse dish
  // scores 1 against any richer dish that happens to contain it, so a popsicle
  // came out "identical" to a bowl of cereal.
  function similarity(a, b) {
    var strong = function (item) {
      return Object.keys(item.tags).filter(function (t) { return item.tags[t] === 1; });
    };
    var ta = strong(a), tb = strong(b);
    if (!ta.length || !tb.length) return 0;

    var shared = ta.filter(function (t) { return tb.indexOf(t) !== -1; }).length;
    var union = ta.length + tb.length - shared;
    return union ? shared / union : 0;
  }

  /* --------------------------------------------------------------- note */

  // There is deliberately no second pass that re-orders the finished ranking.
  //
  // It was built and measured: among games the answers left genuinely close, a
  // re-rank moved the winner in 3% of them and did not change how often the
  // result was a dish this person likes. Turned up hard enough to move more, it
  // started costing accuracy on honest answers. The prior is the right and only
  // place for the profile — when the answers are decisive they should decide,
  // and when they are vague the prior already gets its say.

  /* ------------------------------------------------------------ matchmaking */

  // How good a duel two dishes would make, 0 to 1.
  //
  // "Coffee or steak?" is not a choice anybody has to think about, and it
  // teaches the profile nothing it did not already know. Neither does "pizza or
  // pizza with different toppings". A good pairing sits in between: close enough
  // that both are plausible right now, far enough apart that picking one says
  // something.
  // Taken from the actual distribution over all 2,460 same-kind pairs, not
  // guessed: the median pair scores 0.20, the 95th 0.56 and the 99th 0.71. So
  // the good half of the catalogue sits between these two.
  var DUEL_LOW = 0.22;
  var DUEL_HIGH = 0.85;

  function duelFit(a, b) {
    if (!a || !b || a === b || a.name === b.name) return 0;

    // A drink against a main course is not a decision, it is two decisions.
    if ((a.tags.drink === 1) !== (b.tags.drink === 1)) return 0;

    var sim = similarity(a, b);
    if (sim < DUEL_LOW || sim > DUEL_HIGH) return 0.15;   // playable, not ideal

    // Peaks in the middle of the band and falls away towards either edge.
    var mid = (DUEL_LOW + DUEL_HIGH) / 2;
    var half = (DUEL_HIGH - DUEL_LOW) / 2;
    return 1 - Math.abs(sim - mid) / half * 0.55;
  }

  // How much a duel between these two would teach: the tags where one plainly
  // has it and the other plainly does not.
  // Takes either question objects or plain tag names. What a duel teaches is
  // about the food, not about which questions the game happens to ask — the
  // profile records a leaning per tag, and there are tags with no question
  // behind them at all. Reading only the asked questions made a round between
  // two things that differ in half a dozen ways look like it taught nothing.
  function decisiveTags(a, b, tags) {
    return tags.filter(function (t) {
      var tag = typeof t === 'string' ? t : t.tag;
      return Math.abs((a.tags[tag] || 0) - (b.tags[tag] || 0)) === 1;
    }).map(function (t) {
      return typeof t === 'string' ? { tag: t } : t;
    });
  }

  /* -------------------------------------------------------------- insights */

  // What the history actually says, in the app's own words. Every line has to
  // be earned by real data, so a thin profile returns a short list rather than
  // inventing a personality.
  // `labels` maps a tag to the words the questions use for it, so a preference
  // reads as "Sweet" or "Actual food" rather than as the tag name. Without it
  // the tag is printed, which is fine for a test and wrong for a person.
  function insights(state, items, now, labels) {
    now = now || Date.now();
    labels = labels || {};
    var out = [];
    var picks = state.picks || {};
    var history = state.history || [];
    var ratings = state.ratings || {};

    var names = Object.keys(picks);
    if (names.length) {
      var top = names.sort(function (a, b) { return picks[b] - picks[a]; })[0];
      if (picks[top] >= 2) {
        out.push({ label: 'Your usual', value: top, note: picks[top] + ' times' });
      }
    }

    var pull = pulls(state);
    var strongest = Object.keys(pull)
      .filter(function (t) { return Math.abs(pull[t]) > 0.3; })
      .sort(function (a, b) { return Math.abs(pull[b]) - Math.abs(pull[a]); })[0];
    if (strongest) {
      var pair = labels[strongest];
      var side = pull[strongest] > 0
        ? (pair ? pair.yes : strongest)
        : (pair ? pair.no : 'not ' + strongest);
      out.push({
        label: 'Strongest preference',
        value: side,
        note: 'from ' + ((state.taste[strongest].yes || 0) + (state.taste[strongest].no || 0)) + ' answers'
      });
    }

    var loved = Object.keys(ratings).filter(function (n) { return ratings[n] === 'loved'; });
    if (loved.length) {
      out.push({ label: 'Rated a hit', value: loved.length + (loved.length === 1 ? ' dish' : ' dishes'),
        note: loved.slice(0, 3).join(', ') });
    }

    var week7 = history.filter(function (h) { return daysSince(h.at, now) < 7; });
    if (week7.length) {
      var distinct = {};
      week7.forEach(function (h) { distinct[h.name] = true; });
      out.push({ label: 'This week', value: week7.length + (week7.length === 1 ? ' decision' : ' decisions'),
        note: Object.keys(distinct).length + ' different dishes' });
    }

    if (items && names.length) {
      out.push({ label: 'Catalogue explored', value: Math.round(100 * names.length / items.length) + '%',
        note: names.length + ' of ' + items.length + ' tried' });
    }

    var byHour = {};
    history.forEach(function (h) {
      var hour = new Date(h.at).getHours();
      var band = hour < 11 ? 'mornings' : hour < 16 ? 'afternoons' : hour < 21 ? 'evenings' : 'late nights';
      byHour[band] = (byHour[band] || 0) + 1;
    });
    var bands = Object.keys(byHour);
    if (bands.length && history.length >= 4) {
      var busiest = bands.sort(function (a, b) { return byHour[b] - byHour[a]; })[0];
      out.push({ label: 'You decide most in', value: busiest, note: byHour[busiest] + ' of ' + history.length });
    }

    return out;
  }

  return {
    MIN: MIN,
    MAX: MAX,
    RATING: RATING,
    affinity: affinity,
    biasFor: biasFor,
    isWarm: isWarm,
    ranked: ranked,
    explain: explain,
    week: week,
    similarity: similarity,
    duelFit: duelFit,
    decisiveTags: decisiveTags,
    DUEL_LOW: DUEL_LOW,
    DUEL_HIGH: DUEL_HIGH,
    insights: insights,
    pulls: pulls,
    alignment: alignment
  };
});
