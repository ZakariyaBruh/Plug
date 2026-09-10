/*
 * engine.js — the guessing logic.
 *
 * Rather than walking a fixed decision tree, this keeps a probability over every
 * dish and picks whichever question splits that probability most evenly.
 *
 * A reply that states a requirement — soft, no cheese, nothing fried — is
 * counted against everything that contradicts it, and the ranking is that count
 * first and probability second. A reply that only lifts a restriction reweights
 * instead, so one wrong tap there never rules out the right answer.
 *
 * The counting is the part worth understanding, and `recompute` is where it is
 * explained: requirements used to zero what contradicted them, which is right
 * about requirements and wrong about people, because one mistyped answer took
 * the dish somebody wanted out of the running for good.
 */
(function (root, factory) {
  var mod = factory(typeof module === 'object' && module.exports ? require('./data.js') : root.FoodData);
  if (typeof module === 'object' && module.exports) module.exports = mod;
  else root.FoodEngine = mod;
})(typeof self !== 'undefined' ? self : this, function (Data) {
  'use strict';

  var MAX_QUESTIONS = 20;
  var DRINK = 'drink';
  var CONFIDENT = 0.85;      // enough belief in one dish to stop asking
  var MIN_GAIN = 0.02;       // below this, no remaining question tells us much
  var MIN_QUESTIONS = 5;     // always ask a few, even if we get lucky early
  var OPENERS = 3;           // big obvious splits come first, whatever the maths prefers

  // A tag of 1 becomes 0.94 rather than 1 so a single surprising answer can
  // never drive a dish to zero and lock it out of the running.
  function likelihood(value) { return 0.06 + 0.88 * value; }

  // The same curve for "neither", which is a claim about the middle of the axis
  // rather than either end: 0.5 is the best possible match, 0 and 1 the worst.
  function midLikelihood(value) { return 0.06 + 0.88 * (1 - 2 * Math.abs(value - 0.5)); }

  function entropy(weights) {
    var h = 0;
    for (var i = 0; i < weights.length; i++) {
      var p = weights[i];
      if (p > 1e-12) h -= p * Math.log2(p);
    }
    return h;
  }

  function normalise(weights) {
    var total = 0, i;
    for (i = 0; i < weights.length; i++) total += weights[i];
    if (total <= 0) { // everything got ruled out; fall back to uniform
      for (i = 0; i < weights.length; i++) weights[i] = 1 / weights.length;
      return weights;
    }
    for (i = 0; i < weights.length; i++) weights[i] /= total;
    return weights;
  }

  function Game(options) {
    options = options || {};
    this.items = options.items || Data.ITEMS;
    this.questions = options.questions || Data.QUESTIONS;
    this.random = options.random || Math.random;
    // An optional per-dish multiplier on the starting prior — how the taste
    // profile gets a say. Absent, every dish starts equally likely.
    this.bias = options.bias || null;

    // Which answers act as constraints rather than preferences.
    this.strict = {};
    // And which questions have a far end with a tag of its own, so that "no" is
    // read as a claim about that tag rather than as the absence of this one.
    this.opposite = {};
    // And which questions are about food whichever way they are answered. See
    // `countFrames` below for why that is worth knowing.
    this.foodOnly = {};
    this.questions.forEach(function (q) {
      if (q.strict) this.strict[q.tag] = q.strict;
      if (q.opposite) this.opposite[q.tag] = q.opposite;
      if (q.foodOnly) this.foodOnly[q.tag] = true;
    }, this);

    this.reset();
  }

  // Did the player ask for a drink? Not "would a drink do" — that is what
  // "either" says, and it is not the same claim.
  Game.prototype.wantsDrink = function () {
    for (var i = 0; i < this.answers.length; i++) {
      if (this.answers[i].tag === DRINK) return this.answers[i].value === 'yes';
    }
    return false;
  };

  Game.prototype.isStrict = function (tag, value) {
    var rule = this.strict[tag];
    return rule === true || rule === value;
  };

  // Where a dish sits on a question's axis: 1 at the "yes" end, 0 at the "no"
  // end, 0.5 in the middle.
  //
  // For most questions that is just the tag — cheese is there or it is not.
  // For a question with two real ends it is read from both tags, because one
  // tag cannot say it. `crunchy: 0` means "no crunch", which is not the same
  // claim as "soft", and reading it as soft made steak, coffee and a bag of
  // crisps all soft and tender. With `soft` carrying the far end, a pizza comes
  // out in the middle, where it belongs.
  Game.prototype.axis = function (item, tag) {
    var near = item.tags[tag] || 0;
    var far = this.opposite[tag];
    if (!far) return near;
    return (near - (item.tags[far] || 0) + 1) / 2;
  };

  // Does this dish contradict what was just said?
  //
  // Separate from the weighting on purpose — see `recompute` for why counting
  // contradictions matters more than multiplying them.
  //
  // ONLY THE FAR END CONTRADICTS. A dish in the middle of an axis never does,
  // whichever way the question was answered.
  //
  // This used to read the other way on a question with a `neither`: 0.5 was the
  // middle, so both ends excluded it and only the third reply found it. That is
  // a fair description of a club sandwich, and a disastrous one of the
  // catalogue, because 0.5 is also where every dish lands that nobody has
  // tagged at either end. Forty of 112 dishes sit in the middle of the
  // crunchy/soft axis — pizza, tacos, buffalo wings, spring rolls — not because
  // they are texturally ambiguous but because `soft` was only ever put on 48
  // dishes. Answering "Crunchy" faulted 88 of 112, "Soft and tender" faulted
  // 64, and a player who wanted a taco could not reach one by either route.
  // Measured against somebody answering from appetite rather than from the tag
  // table, the app found the right dish 55.6% of the time and 48 dishes were
  // unreachable outright.
  //
  // An untagged middle is a fact about the catalogue, not about the food, and
  // it must never be read as the player being contradicted. So the end answers
  // are back to excluding only their opposite end, and "neither" excludes both
  // ends and nothing else. The middle still *prefers* the third reply, through
  // `midLikelihood` — a real preference expressed in the weights, where being
  // wrong costs a place in the ranking rather than the whole dish.
  Game.prototype.contradicts = function (item, tag, value) {
    if (value === 'either' || !this.isStrict(tag, value)) return false;
    var v = this.axis(item, tag);
    if (value === 'neither') return v === 0 || v === 1;
    return value === 'yes' ? v === 0 : v === 1;
  };

  // Applying one answer to a set of weights — the soft part only.
  //
  // A tag of 1 counts as 0.94 rather than 1, so a single answer never drives a
  // dish to zero on its own. What a *stated requirement* does on top of this is
  // counted rather than multiplied; `recompute` explains why.
  Game.prototype.applyAnswer = function (weights, tag, value) {
    var self = this;
    return this.items.map(function (item, i) {
      var v = self.axis(item, tag);
      if (value === 'neither') return weights[i] * midLikelihood(v);
      var p = likelihood(v);
      return weights[i] * (value === 'yes' ? p : 1 - p);
    });
  };

  // What an answer says about the food beyond the tag it is about.
  //
  // Four of these questions have a frame rather than only a subject: "light
  // bite or proper meal?", "hands or cutlery?", "crunchy or soft?" and "can you
  // drink it from a bowl?" are questions you would only put to somebody
  // picturing something to eat. Answering either end of one of them says, as
  // clearly as the tag does, that this is not a drink.
  //
  // Without that, drinks were unfalsifiable. They carry almost no tags, so
  // nothing said about texture, cutlery or bread ever contradicted one, and
  // every "no" left them exactly where they were while ruling out the food
  // around them. Ask for a light bite and shrug at the rest and the answer was
  // a mango lassi; ask for something light and healthy and it was a protein
  // shake, which is not a bite by any definition. So an answer to one of these
  // counts against every drink — unless a drink is what was asked for, in which
  // case these questions are never put at all. `countFrames` does the counting.

  // Most questions can be put more than one way. Which way is settled once, when
  // the game starts, rather than at the moment of asking — so a question can
  // never be reworded halfway through, and undoing back past it and coming
  // forward again shows the same words it did the first time.
  //
  // A game never sees the same question twice: each tag is asked at most once,
  // and each tag has exactly one wording for the length of the game. The two
  // together are what "no repeats" means here.
  Game.prototype.pickWordings = function () {
    this.wording = {};
    this.questions.forEach(function (q) {
      this.wording[q.tag] = Math.floor(this.random() * Data.wordings(q));
    }, this);
  };

  // A question in the words this game is using for it.
  Game.prototype.phrase = function (question) {
    return Data.phrase(question, this.wording ? this.wording[question.tag] : 0);
  };

  Game.prototype.reset = function () {
    this.answers = [];      // { tag, value: 'yes' | 'no' | 'neither' | 'either' }
    this.rejected = {};     // dish name -> true, for "nope, something else"
    this.pickWordings();
    // Standing exclusions survive a restart: they come from the profile, not
    // from anything answered this game.
    this.bans = this.bans || [];
    this.excluded = this.excluded || [];
    // A touch of jitter so identical answers don't always land on the same dish,
    // times whatever the profile thinks of each one.
    //
    // The bias is bounded by its author and defended against here as well: a
    // zero or a NaN would take a dish out of the running permanently, and no
    // amount of history should be able to do that.
    var bias = this.bias;
    this.prior = this.items.map(function (item, i) {
      var jitter = 0.9 + 0.2 * this.random();
      if (!bias) return jitter;
      var b = bias(item, i);
      return jitter * (isFinite(b) && b > 0 ? b : 1);
    }, this);
    normalise(this.prior);
    this.recompute();
  };

  // Weights are always rebuilt from the full answer list, which makes undo free.
  //
  // COUNT CONTRADICTIONS, DO NOT MULTIPLY THEM.
  //
  // A stated requirement — sweet, no cheese, nothing fried — used to drop
  // everything that contradicted it to exactly zero. That is right about
  // requirements and wrong about people. Nobody answers eight questions
  // perfectly: they mistap, or they simply do not picture a cheeseburger as
  // "fried" the way the catalogue does. One such answer took the dish they
  // actually wanted out of the running for good, and because it was at zero
  // rather than merely behind, it could not come second either. Measured
  // against a player who gets one answer in twelve wrong, the app found the
  // right dish 61% of the time and had it in the top three 63% — the gap of two
  // points is the whole story: when it was wrong it was not close, it had
  // deleted the answer.
  //
  // So each dish carries a count of how many stated requirements it
  // contradicts, and the ranking is that count first, probability second. A
  // dish that contradicts nothing always beats one that contradicts something,
  // by a margin nothing can multiply away — which is what the hard filter was
  // for, and it still holds exactly. But when *everything* contradicts
  // something, the field is the dishes that contradict the least, rather than
  // the whole catalogue in catalogue order. That is the "I answered one of
  // those wrong" case, and it is the common one.
  //
  // Bans and strikes are counted the same way at a much higher price, because
  // they are decisions rather than guesses: a dish you struck off should only
  // ever come back if literally everything else has been struck off too.
  Game.prototype.recompute = function () {
    var self = this;
    this.weights = this.prior.slice();
    this.faults = this.items.map(function () { return 0; });

    this.answers.forEach(function (answer) {
      if (answer.value === 'either') return;
      self.weights = self.applyAnswer(self.weights, answer.tag, answer.value);
      self.items.forEach(function (item, i) {
        if (self.contradicts(item, answer.tag, answer.value)) self.faults[i] += 1;
      });
    });

    this.countFrames();
    this.countBans();
    this.countExclusions();

    this.items.forEach(function (item, i) {
      if (self.rejected[item.name]) self.weights[i] *= 0.0005;
    });

    // Everything is measured against the best anybody manages, so a game where
    // every dish contradicts something still has a live field rather than an
    // empty one. This is the safety valve that used to be a special case in
    // three separate places.
    var floor = Math.min.apply(null, this.faults);
    for (var i = 0; i < this.weights.length; i++) {
      var over = this.faults[i] - floor;
      if (over > 0) this.weights[i] *= Math.pow(FAULT, Math.min(over, 12));
    }
    normalise(this.weights);
  };

  // How far behind one contradiction puts a dish. Large enough that no run of
  // ordinary answers can multiply it back — one preference answer is worth
  // about sixteen times, so a million is sixteen answers of headroom — and
  // finite, so the dish is behind rather than gone.
  var FAULT = 1e-6;

  // The frame of a question, counted like any other requirement. See
  // `foodOnly` in the constructor for what a food-only question is, and the
  // note above `pickWordings` for why it matters.
  Game.prototype.countFrames = function () {
    if (this.wantsDrink()) return;
    var self = this;
    var framed = this.answers.some(function (a) {
      return self.foodOnly[a.tag] && a.value !== 'either';
    });
    if (!framed) return;
    this.items.forEach(function (item, i) {
      if ((item.tags[DRINK] || 0) === 1) self.faults[i] += 1;
    });
  };

  // Dishes struck off by name — "never again". Unlike a tag ban this is not a
  // rule about food, it is a decision about one dish, so it is exact.
  //
  // Counted at a heavy price rather than zeroed, for the same reason as
  // everything else: if the entire catalogue has been struck off, the game must
  // still hand back something rather than nothing. Four faults, so a struck
  // dish loses to anything that merely contradicts an answer or two.
  Game.prototype.countExclusions = function () {
    if (!this.excluded || !this.excluded.length) return;
    var self = this;
    this.items.forEach(function (item, i) {
      if (self.excluded.indexOf(item.name) !== -1) self.faults[i] += 4;
    });
  };

  Game.prototype.setExcluded = function (names) {
    this.excluded = (names || []).slice();
    this.recompute();
  };

  // Standing dietary rules. A dish tagged 0.5 — "depends how it's made" —
  // survives, the same latitude a stated requirement gives it. Counted at the
  // same weight as a strike: a rule you set on purpose outranks an answer you
  // gave in passing.
  Game.prototype.countBans = function () {
    if (!this.bans || !this.bans.length) return;
    var self = this;
    this.items.forEach(function (item, i) {
      self.bans.forEach(function (tag) {
        if ((item.tags[tag] || 0) === 1) self.faults[i] += 4;
      });
    });
  };

  // Which rules are actually in force — a rule that empties the menu is not.
  Game.prototype.activeBans = function () {
    if (!this.bans || !this.bans.length) return [];
    var self = this;
    return this.bans.filter(function (tag) {
      return self.items.some(function (item) { return (item.tags[tag] || 0) !== 1; });
    });
  };

  // Swapping the profile in or out mid-session rebuilds the prior, so it takes
  // effect on the next game rather than half way through this one.
  Game.prototype.setBias = function (bias) {
    this.bias = bias || null;
  };

  Game.prototype.setBans = function (tags) {
    this.bans = (tags || []).slice();
    this.recompute();
  };

  // Is there anything still in the running that this reply would actually fit?
  //
  // A requirement nothing can satisfy is not refused — the game has to keep
  // moving — so it would quietly become the one thing the app ignored: ask for
  // room temperature when nothing on the list is room temperature and it hands
  // back a hot drink, having heard the only thing you said and done nothing
  // with it. Better never to offer the reply. The question can still be asked;
  // the reply is simply not shown when it has no answer.
  //
  // "In the running" means the dishes contradicting the least so far, not the
  // whole catalogue: offering "no cheese" as a reply when the only cheese-free
  // things left are already ruled out twice over is offering nothing.
  Game.prototype.canAnswer = function (tag, value) {
    if (!this.isStrict(tag, value)) return true;
    var live = this.floor();
    for (var i = 0; i < this.items.length; i++) {
      if (this.faults[i] > live) continue;
      if (!this.contradicts(this.items[i], tag, value)) return true;
    }
    return false;
  };

  // How many contradictions the best-placed dishes are carrying. Zero in a game
  // answered consistently; one once somebody has said two things that cannot
  // both be true of anything on the menu.
  Game.prototype.floor = function () {
    return Math.min.apply(null, this.faults);
  };

  Game.prototype.asked = function () {
    var seen = {};
    this.answers.forEach(function (a) { seen[a.tag] = true; });
    return seen;
  };

  // What the field would look like if this question came back a given way.
  //
  // The same two steps as `recompute`: reweight, then price the contradictions
  // against the best anybody manages. Without the second step the engine cannot
  // see that a requirement splits the field hard — it scored every question as
  // if it were a mild preference, picked worse ones, and took half a question
  // longer to get anywhere.
  Game.prototype.branch = function (tag, value) {
    var self = this;
    var weights = this.applyAnswer(this.weights, tag, value);
    var faults = this.items.map(function (item, i) {
      return self.faults[i] + (self.contradicts(item, tag, value) ? 1 : 0);
    });
    // A food-framed question also puts every drink one behind, the first time
    // one is answered.
    if (this.foodOnly[tag] && value !== 'either' && !this.wantsDrink()) {
      var already = this.answers.some(function (a) {
        return self.foodOnly[a.tag] && a.value !== 'either';
      });
      if (!already) {
        this.items.forEach(function (item, i) {
          if ((item.tags[DRINK] || 0) === 1) faults[i] += 1;
        });
      }
    }

    var floor = Math.min.apply(null, faults);
    return weights.map(function (w, i) {
      var over = faults[i] - floor;
      return over > 0 ? w * Math.pow(FAULT, Math.min(over, 12)) : w;
    });
  };

  // Expected drop in entropy from asking about `tag`, given what we believe now.
  Game.prototype.gain = function (tag) {
    var yesBranch = this.branch(tag, 'yes');
    var noBranch = this.branch(tag, 'no');
    var pYes = 0, pNo = 0, i;

    for (i = 0; i < yesBranch.length; i++) { pYes += yesBranch[i]; pNo += noBranch[i]; }
    // Branch masses only sum to 1 for preference questions; normalise so strict
    // questions are scored on the same footing.
    var total = pYes + pNo;
    if (total <= 0) return 0;
    pYes /= total;
    pNo /= total;
    if (pYes < 1e-9 || pNo < 1e-9) return 0;

    for (i = 0; i < yesBranch.length; i++) { yesBranch[i] /= pYes; noBranch[i] /= pNo; }
    return entropy(this.weights) - (pYes * entropy(yesBranch) + pNo * entropy(noBranch));
  };

  Game.prototype.nextQuestion = function () {
    var seen = this.asked(), self = this;

    // Ask whichever question would tell us the most. Nothing random about it.
    //
    // There was, briefly: among questions within 8% of the best, one was taken
    // at random, on the theory that it would make two games read differently.
    // Measured, it did almost nothing — sixty games answered identically
    // produced two orders instead of one, because the field is usually not
    // close — while giving every game a chance of spending a turn on the worse
    // of two questions. Variety comes from the wordings, where it is free.
    function pick(pool) {
      var best = null, bestGain = -1;
      pool.forEach(function (q) {
        var g = self.gain(q.tag);
        if (g > bestGain) { bestGain = g; best = q; }
      });
      return best ? { question: best, gain: bestGain } : null;
    }

    // A banned tag is already decided, so asking about it wastes a question.
    var bans = this.activeBans();
    var drinking = this.wantsDrink();
    var remaining = this.questions.filter(function (q) {
      if (seen[q.tag] || bans.indexOf(q.tag) !== -1) return false;
      // "Hands or cutlery?" is not a question about a smoothie. Somebody who
      // has asked for a drink is never put a question whose frame is food —
      // the same flag that makes answering one rule drinks out.
      if (q.foodOnly && drinking) return false;
      // Both replies have to be live. A question where one answer fits nothing
      // left is not a choice — and because the safety valve in applyAnswer
      // turns an impossible constraint back into a preference, taking that
      // reply silently threw away what the player had just said. Asked for
      // something crunchy after asking for a drink, the game used to nod and
      // hand back a coffee.
      return self.canAnswer(q.tag, 'yes') && self.canAnswer(q.tag, 'no');
    });

    // Pure information gain opens with whatever splits the list best, which can
    // be something oddly specific — and it rates "drink or food?" poorly simply
    // because most dishes aren't drinks. People expect the broad strokes first,
    // in the obvious order, so the opening rounds follow `opens` instead.
    if (this.answers.length < OPENERS) {
      var opener = remaining
        .filter(function (q) { return q.opens; })
        .sort(function (a, b) { return a.opens - b.opens; })[0];
      if (opener) {
        var g = this.gain(opener.tag);
        if (g >= MIN_GAIN) return { question: this.phrase(opener), gain: g };
      }
    }

    var choice = pick(remaining);
    if (!choice || choice.gain < MIN_GAIN) return null;
    return { question: this.phrase(choice.question), gain: choice.gain };
  };

  // Contradictions first, probability second.
  //
  // The weights already carry the penalty, so sorting on score alone gives the
  // same order — but only while the numbers stay apart, and a million to the
  // power of twelve does not. Sorting on the count is exact at any depth, and
  // it says what it means.
  Game.prototype.ranking = function () {
    return this.items
      .map(function (item, i) {
        return { item: item, score: this.weights[i], faults: this.faults[i] };
      }, this)
      .sort(function (a, b) {
        if (a.faults !== b.faults) return a.faults - b.faults;
        return b.score - a.score;
      });
  };

  Game.prototype.best = function () { return this.ranking()[0]; };

  // The dishes still genuinely in the running, best first.
  //
  // Only the ones contradicting the least. A dish that contradicts something
  // the player said is not a runner-up, it is wrong — and the result screen
  // offers six alternates beside the winner, so this is the list that decides
  // whether somebody who ruled out meat is offered a cheeseburger as an
  // alternative. It is not the raw ranking for that reason.
  //
  // Turning a dish down does not fault it — a rejection is "not that one, now",
  // not "never" — so it stays in the ranking and can win again once nothing
  // else is left. That is how "not quite" came to hand back the dish it had
  // just been handed back, so what has been turned down is filtered here.
  Game.prototype.shortlist = function () {
    var self = this;
    var live = this.floor();
    return this.ranking()
      .filter(function (r) { return r.faults <= live && !self.rejected[r.item.name]; })
      .map(function (r) { return r.item; });
  };

  // What had to give.
  //
  // Ask for something crunchy and soupy and there is nothing on the menu that
  // is both, so whatever comes back fails one of them. The engine has always
  // had to make that choice; what it has never done is admit it. Silently
  // handing back a bowl of soup to somebody who asked for crunch reads as the
  // app not listening, which is exactly what people say about it.
  //
  // This is the list of stated requirements the winner does not meet, so the
  // result screen can say which one it let go of. In the ordinary game it is
  // empty, and nothing is said.
  Game.prototype.compromise = function (item) {
    var self = this;
    if (!item) return [];
    return this.answers
      .filter(function (a) { return self.contradicts(item, a.tag, a.value); })
      .map(function (a) {
        var q = self.questions.filter(function (x) { return x.tag === a.tag; })[0];
        if (!q) return null;
        var put = self.phrase(q);
        return {
          tag: a.tag,
          value: a.value,
          // The words the player actually pressed, not the canonical ones.
          label: a.value === 'neither' ? put.neither : (a.value === 'yes' ? put.yes : put.no)
        };
      })
      .filter(Boolean);
  };

  // Is there anything at all that meets everything asked for?
  Game.prototype.everythingFits = function () { return this.floor() === 0; };

  // Take back the most recent answer that is narrowing the field, and mark the
  // question as already asked so the game moves on rather than posing it again.
  //
  // This is what "not quite" does when there is genuinely nothing else that
  // fits: rather than re-offering the dish that was just refused, it gives back
  // the last thing the player was pinned to and carries on asking.
  Game.prototype.relax = function () {
    for (var i = this.answers.length - 1; i >= 0; i--) {
      var a = this.answers[i];
      if (a.value === 'either') continue;
      if (!this.isStrict(a.tag, a.value)) continue;
      var loosened = { tag: a.tag, value: a.value };
      a.value = 'either';
      this.recompute();
      return loosened;
    }
    return null;
  };

  // 0 when every dish is still equally likely, 1 when we're certain. Drives the
  // meter on screen, so it reads as "how close am I" rather than raw entropy.
  Game.prototype.confidence = function () {
    var max = Math.log2(this.items.length);
    return max ? Math.max(0, 1 - entropy(this.weights) / max) : 1;
  };

  Game.prototype.answer = function (tag, value) {
    this.answers.push({ tag: tag, value: value });
    this.recompute();
  };

  Game.prototype.undo = function () {
    if (!this.answers.length) return false;
    this.answers.pop();
    this.recompute();
    return true;
  };

  Game.prototype.reject = function (name) {
    this.rejected[name] = true;
    this.recompute();
  };

  // Should we stop asking and commit to a guess?
  Game.prototype.shouldGuess = function () {
    if (this.answers.length >= MAX_QUESTIONS) return true;
    var next = this.nextQuestion();
    if (!next) return true;
    if (this.answers.length < MIN_QUESTIONS) return false;
    if (this.best().score >= CONFIDENT) return true;
    return this.hasGivenUp();
  };

  // Somebody who has shrugged at the last few questions is not withholding
  // information, they are telling us they do not have any.
  //
  // "Either" barely moves the weights, so confidence never reaches the
  // threshold and the game ran all twenty questions at somebody who had already
  // said, four times over, that they did not mind. Twenty questions is the
  // limit, not the target. Three shrugs in a row and it commits to the best it
  // has — which is what the taste profile is for.
  var SHRUGS = 3;

  Game.prototype.hasGivenUp = function () {
    if (this.answers.length < SHRUGS) return false;
    for (var i = this.answers.length - SHRUGS; i < this.answers.length; i++) {
      if (this.answers[i].value !== 'either') return false;
    }
    return true;
  };

  // The answers that did most to single this dish out — used for "why this?".
  Game.prototype.reasons = function (item, limit) {
    var self = this;
    return this.answers
      .filter(function (a) {
        if (a.value === 'either') return false;
        // An answer can arrive without a question behind it: the mood shortcuts
        // take two answers as read, and they are free to use tags nobody is
        // asked about. There is no wording to show for those, so they shape the
        // guess without explaining it.
        return self.questions.some(function (x) { return x.tag === a.tag; });
      })
      .map(function (a) {
        // In the words this game used, not the default ones: a reason worded
        // differently from the question it came from reads like the app
        // answering a question nobody asked.
        var q = self.phrase(self.questions.filter(function (x) { return x.tag === a.tag; })[0]);
        // Read off the axis, so a dish in the middle is never offered either end
        // as the reason it was chosen: a pizza is not why-you-asked-for-crunchy
        // and it is not why-you-asked-for-soft either.
        var v = self.axis(item, a.tag);
        if (a.value === 'neither') {
          return { label: q.neither, icon: q.neitherIcon, support: midLikelihood(v) };
        }
        var p = likelihood(v);
        return {
          label: (a.value === 'yes') ? q.yes : q.no,
          icon: (a.value === 'yes') ? q.yesIcon : q.noIcon,
          support: (a.value === 'yes') ? p : (1 - p)
        };
      })
      .filter(function (r) { return r.support > 0.6; })
      .sort(function (a, b) { return b.support - a.support; })
      .slice(0, limit || 5);
  };

  return {
    Game: Game,
    MAX_QUESTIONS: MAX_QUESTIONS,
    likelihood: likelihood,
    midLikelihood: midLikelihood,
    entropy: entropy
  };
});
