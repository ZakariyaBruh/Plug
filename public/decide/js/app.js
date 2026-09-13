/*
 * app.js — view routing, the dish browser, and the game wired into the shell.
 */
(function () {
  'use strict';

  var Data = window.FoodData;
  var Engine = window.FoodEngine;
  var Flavor = window.FoodFlavor;
  var Sound = window.FoodSound;
  var Confetti = window.FoodConfetti;
  var ProgressLib = window.FoodProgress;
  var Recipes = window.FoodRecipes;
  var Places = window.FoodPlaces;
  var MapView = window.FoodMap;
  var Taste = window.FoodTaste;
  var PremiumLib = window.FoodPremium;

  var $ = function (id) { return document.getElementById(id); };
  var $$ = function (sel) { return Array.prototype.slice.call(document.querySelectorAll(sel)); };

  var game = new Engine.Game();
  // Premium is this site's own Whop session — sign in with Whop, own the
  // product, done. No licence key, no per-browser account to create or
  // remember a passphrase for.
  var premiumApi = new PremiumLib.Premium();

  /* --------------------------------------------------------------- storage */
  // Everybody's progress — XP, streak, favourites, ratings — lives in plain
  // localStorage on this browser. That was always true for the free tier;
  // there is no separate encrypted "account" tier any more, because Premium
  // no longer needs one to unlock: it comes straight from the Whop account
  // somebody is signed into, checked server-side.
  //
  // Progress writes synchronously in about forty places, so everything reads
  // and writes an in-memory copy at once and a debounced flush puts it in
  // localStorage. Nothing is lost on the way out because the page also
  // flushes when hidden.
  var STATE_KEY = ProgressLib.KEY;
  var store = (function () {
    var mem = {};
    var timer = null;
    var pending = false;

    function plainStore() {
      try {
        localStorage.setItem('__probe__', '1');
        localStorage.removeItem('__probe__');
        return localStorage;
      } catch (err) { return null; }
    }

    function flush() {
      timer = null;
      pending = false;
      var raw = mem[STATE_KEY];
      var plain = plainStore();
      // A private window with storage switched off still plays; it just
      // forgets. Better that than refusing to open.
      if (plain) { try { plain.setItem(STATE_KEY, raw || '{}'); } catch (err) { pending = true; } }
    }

    // Reading it back. The writer above is only half a store: `mem` starts
    // empty on every load, so without this `getItem` answers null no matter
    // what was flushed, `progress.reload()` builds a blank profile, and the
    // first debounced write of that blank profile overwrites the real one.
    // Every visit was a first visit — no streak, no history, no saved dishes,
    // no ratings — and none of it was recoverable afterwards.
    //
    // The vault module used to do this seeding at boot. It was removed along
    // with the passphrase accounts it belonged to, and nothing took over the
    // one job of its that had nothing to do with accounts.
    (function primeFromDisk() {
      var plain = plainStore();
      if (!plain) return;
      try {
        var raw = plain.getItem(STATE_KEY);
        if (raw) mem[STATE_KEY] = raw;
      } catch (err) { /* unreadable is the same as empty: start fresh */ }
    })();

    return {
      getItem: function (k) { return k in mem ? mem[k] : null; },
      setItem: function (k, v) {
        mem[k] = String(v);
        pending = true;
        if (timer) clearTimeout(timer);
        timer = setTimeout(flush, 400);
      },
      removeItem: function (k) { delete mem[k]; this.setItem(STATE_KEY, mem[STATE_KEY] || ''); },
      seed: function (state) { mem[STATE_KEY] = JSON.stringify(state || {}); },
      raw: function () { return mem[STATE_KEY] || null; },
      flushNow: function () { if (pending || timer) { if (timer) clearTimeout(timer); flush(); } }
    };
  })();

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') store.flushNow();
  });
  window.addEventListener('pagehide', function () { store.flushNow(); });

  var progress = new ProgressLib.Progress(store, null);

  var current = null;    // question on screen
  var sessionXp = 0;     // banked while playing, awarded on a decision
  var rejections = 0;
  var busy = false;      // true during the reveal animation
  var shortcut = false;  // this result came off a list, not a game
  var tunedTo = null;    // the profile reasons behind the dish on screen, if any
  var guestTags = [];    // session-only extra avoids, from "guest at the table"
  var spinTimer = null;

  var reduceMotion = false;
  try { reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (err) {}

  // The primary buttons carry an arrow alongside their label, so their text
  // lives in a child node rather than on the button itself.
  function label(id, text) {
    var el = $(id);
    var slot = el.querySelector('.go-label');
    (slot || el).textContent = text;
  }

  /* ----------------------------------------------------------------- tier */
  // Premium controls stay visible and legible when the tier is off. Pressing
  // one says what it is rather than doing nothing, which is the only way
  // anybody finds out the feature exists.
  function isPlus() { return progress.isPlus(); }

  // How many picks of Endless a free profile gets in a day. Up here rather
  // than down with the rest of the mode's constants because the Premium list
  // on the profile screen quotes the number, and that list is built as the
  // file loads — read from where the mode declares it, it read "undefined
  // picks a day".
  //
  // It was sixty, from before the clock existed and a run went on until you
  // got bored. A run ends on the clock now, somewhere between twenty and a
  // hundred picks, so sixty was a day's play of one and a half goes — which
  // does not read as an allowance, it reads as a demo that stops before the
  // good part. Two hundred is three or four proper runs: enough to get good at
  // it, and still a wall.
  var ENDLESS_DAY = 200;

  function premium(what) {
    if (isPlus()) return true;
    Sound.reject();
    goPremium(what);
    return false;
  }

  /*
   * Open something that is not this app, and make sure it opens.
   *
   * Every outward link in here is an <a target="_blank">, which is right at
   * the top level and silently does nothing inside an iframe sandboxed
   * without allow-popups — the same hole that made the Premium button a dead
   * end, and one that applies to every affiliate link too. So the click is
   * intercepted and tried properly: a new tab if the browser will give one,
   * and this frame if it will not.
   *
   * The href stays on the element and is still the real URL, so middle-click,
   * "copy link" and a right-click menu all keep working, and the link is
   * still a link with JavaScript off.
   */
  function openOut(url) {
    if (!url) return;
    var opened = null;
    try { opened = window.open(url, '_blank'); } catch (err) {}
    if (opened) {
      // Severed by hand because 'noopener' would make the return value null
      // on success as well as on failure, and then there is no telling
      // whether anything opened.
      try { opened.opener = null; } catch (err) {}
      return;
    }
    try { window.location.assign(url); } catch (err) {}
  }

  /*
   * Delegated, not bound one by one at load. Half the outward links in this
   * app do not exist yet when it starts — every news headline, every link
   * inside a recipe, the escape hatch out of the shared browser — and binding
   * the ones present at boot would have covered the static offers and missed
   * exactly the ones that are built later.
   */
  document.addEventListener('click', function (e) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    var link = e.target.closest && e.target.closest('a[target="_blank"]');
    if (!link || !link.href) return;
    e.preventDefault();
    openOut(link.href);
  });

  // One tap from anywhere in the app to real checkout — no hunting for a
  // switch on the profile screen first. Opens in a new tab, so a game in
  // progress here is never lost; coming back to this tab re-checks Premium
  // on its own (see the boot section).
  function goPremium(what) {
    toast('\u{2728}', 'Part of Premium',
      what + ' comes with Premium — three days free, opening checkout\u2026');
    premiumApi.openUpgrade();
  }

  // Paid content is shown blurred rather than removed. An empty pane says
  // "nothing here"; a blurred one says "something here, and not yours yet".
  // The blurred layer is made inert and hidden from assistive tech so what gets
  // announced is the notice, not scrambled recipe steps.
  function paintVault(vaultId, lockId) {
    var vault = $(vaultId);
    if (!vault) return;
    var open = isPlus();
    var body = vault.querySelector('.vault-body');
    vault.classList.toggle('is-locked', !open);
    $(lockId).hidden = open;
    body.setAttribute('aria-hidden', open ? 'false' : 'true');
    if ('inert' in body) body.inert = !open;
  }

  /*
   * The unlock buttons behave like a checkout link: they take you to where the
   * tier is actually switched, rather than switching it behind your back.
   *
   * BOUND BY THE ATTRIBUTE, not by a class. This read `.vault-btn`, which is
   * the class that styles a button sitting inside a blurred vault — and the
   * Menu section's pitch is not a vault, so its button was written without it
   * and nothing was listening to "See what Premium gets you". It was a dead
   * button in every environment: no tab, no navigation, no toast, top level
   * and framed alike.
   *
   * data-unlock is what actually marks one of these — it carries the name of
   * the thing being unlocked, which is the whole payload — so that is what is
   * bound. A class is for looks and will be dropped the next time something
   * looks different.
   */
  $$('[data-unlock]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      Sound.reject();
      goPremium(btn.dataset.unlock);
    });
  });

  // Everything the profile knows, applied to the engine's starting prior — but
  // only for a paying profile with enough history to say anything.
  function tasteBias() {
    if (!isPlus() || !Taste.isWarm(progress.state)) return null;
    if (progress.state.adventure === 'wild') return null;
    var inner = Taste.biasFor(progress.state, Date.now());
    if (progress.state.adventure !== 'stick') return inner;
    return function (item) {
      var score = inner(item);
      return score * score;
    };
  }

  function applyTaste() {
    game.setBias(tasteBias());
  }

  // The dishes the profile would put first, with the standing rules and any
  // snoozes already applied. Used by the instant picks and the week plan.
  /*
   * "This is a guess, and here is why."
   *
   * Everything that ranks by taste — the shortlist, the deck, the pools the
   * game modes draw from — leans on a profile built out of answers already
   * given. On a new phone there are none, so the ranking is barely a ranking:
   * it is the catalogue in roughly its own order, presented with the same
   * confidence as a profile with two hundred answers behind it.
   *
   * Saying so is better than quietly being wrong. The threshold is decisions
   * rather than XP because XP can be earned by answering questions in a single
   * sitting, while a decision is a dish somebody actually accepted — which is
   * the thing the ranking is actually built from.
   */
  var THIN_DECISIONS = 5;
  /*
   * Swipe's own, lower bar.
   *
   * The questionnaire builds its answer out of the profile, so with nothing in
   * the profile the answer is nearly arbitrary and five decisions is a fair
   * place to stop apologising. A deck is not that: the profile only sets the
   * order the cards come out in, and the swiping does the rest, so it is worth
   * playing much sooner. Warning at the same threshold would be crying wolf on
   * a mode that works fine — so it warns only when there is essentially
   * nothing, which is exactly when the opening order is a coin toss.
   */
  var THIN_SWIPE = 2;

  function thinHistory(bar) {
    return (progress.state.decisions || 0) < (bar || THIN_DECISIONS);
  }

  function paintThinNote(el, what, bar) {
    if (!el) return;
    if (!thinHistory(bar)) { el.hidden = true; return; }
    var made = progress.state.decisions || 0;
    el.hidden = false;
    el.textContent = 'Early days \u2014 ' + what + ', and you have accepted ' +
      (made === 0 ? 'nothing yet' : made === 1 ? 'one dish so far' : made + ' dishes so far') +
      '. Expect this to be rough until there is more to go on.';
  }

  function favouredDishes(options) {
    options = options || {};
    var rules = progress.allRules();
    var now = Date.now();
    var pool = Data.ITEMS.filter(function (dish) {
      if (progress.isBanned(dish.name)) return false;
      if (rules.some(function (tag) { return (dish.tags[tag] || 0) === 1; })) return false;
      if (!options.keepSnoozed && progress.isSnoozed(dish.name, now)) return false;
      return true;
    });
    if (!pool.length) pool = Data.ITEMS.slice();
    return Taste.ranked(progress.state, pool, now);
  }

  // Weighted pick from the head of the list — the same dish every single time
  // would stop feeling like a suggestion and start feeling like a rut.
  function pickFavoured(ranked, count) {
    var pool = ranked.slice(0, count || 12);
    var total = pool.reduce(function (sum, r) { return sum + r.score; }, 0);
    var roll = Math.random() * total;
    for (var i = 0; i < pool.length; i++) {
      roll -= pool[i].score;
      if (roll <= 0) return pool[i].item;
    }
    return pool.length ? pool[pool.length - 1].item : null;
  }

  /* ------------------------------------------------------------------ maps */
  var MAPS = 'https://www.google.com/maps/';

  // A search page centred on whatever the dish is called locally.
  function mapsSearch(term) {
    return MAPS + 'search/?api=1&query=' + encodeURIComponent(term);
  }

  // Turn-by-turn to an exact point. Coordinates rather than a name: a name gets
  // geocoded and can land on a different branch of the same chain, which is
  // exactly the pin you did not choose.
  function mapsDirections(place) {
    // No travelmode: some of these are 200m away and some are eight kilometres,
    // so Google's own default beats anything guessed from here.
    return MAPS + 'dir/?api=1&destination=' + encodeURIComponent(place.lat + ',' + place.lon);
  }

  // What to type into Google Maps for a dish: the dish.
  //
  // This used to use the venue wording from the Overpass lookup, which is right
  // for querying OpenStreetMap by tag and wrong for a search box. Twenty-two of
  // the eighty dishes have no venue wording, so they fell through to the
  // catch-all and the button searched "places to eat near me" — which is what
  // it does when you have just been told to eat popcorn. Google is perfectly
  // good at "popcorn near me".
  function mapsTermFor(dish) {
    return dish.name + ' near me';
  }

  /* ---------------------------------------------------------------- routing */
  var view = 'decide';
  // 'home' is the landing — a full-screen overlay, not one of the panels in
  // #view-decide. While it is up no panel is current, which is what
  // setPanel('home') leaves behind.
  var panel = 'home';

  function setView(name) {
    view = name;
    $$('.view').forEach(function (el) {
      el.classList.toggle('is-current', el.id === 'view-' + name);
    });
    $$('.rail-link').forEach(function (el) {
      var on = el.dataset.view === name;
      el.classList.toggle('is-current', on);
      el.setAttribute('aria-current', on ? 'page' : 'false');
    });
    if (name === 'decide') renderIntro();
    if (name === 'profile') renderProfile();
    if (name === 'dishes') renderDishes();
    if (name === 'menu') renderMenuView();
    if (name === 'nearby') renderNearby();
    if (name === 'news') renderNews();
    if (name === 'chat') renderChat();
    // A half-written answer left running in a section nobody is looking at
    // keeps scrolling it into view from somewhere else in the app.
    else stopTyping();
    window.scrollTo(0, 0);
  }

  function setPanel(name) {
    panel = name;
    $$('#view-decide .panel').forEach(function (el) {
      el.classList.toggle('is-current', el.id === 'panel-' + name);
    });
    window.scrollTo(0, 0);
  }

  $$('.rail-link').forEach(function (el) {
    el.addEventListener('click', function () {
      // Decide means "take me to the deciding screen". Mid-question that is
      // where you already are, so the answers survive; anywhere else — a
      // finished result, a recipe — it means start again.
      if (el.dataset.view === 'decide' && panel !== 'question') return goHome();
      leaveEndless();
      // Now that the rail is reachable from the landing, going anywhere from
      // there has to put the landing away — otherwise the section loads
      // underneath it and the tap looks like it did nothing.
      hideLanding();
      setView(el.dataset.view);
    });
  });

  /*
   * How much of the top of the screen is already spoken for.
   *
   * The top bar is fixed and the rail is fixed beside it on a wide screen —
   * but under 60rem the rail becomes a second bar, sticky directly under the
   * first one. Anything else that wants to stick to the top has to clear both,
   * and how tall the rail is there depends on how many rows its links wrap
   * into, which depends on the width and the language. So it is measured and
   * published as a custom property rather than guessed at in the stylesheet,
   * where the guess would be wrong on exactly the screens that matter most.
   *
   * Without it a sticky element pins at the top bar's height and spends the
   * whole session hidden behind the rail, which looks precisely like a sticky
   * element that was never written.
   */
  var narrowRail = null;
  try { narrowRail = window.matchMedia('(max-width: 60rem)'); } catch (err) {}

  function measureStack() {
    var bar = document.querySelector('.topbar');
    var rail = document.querySelector('.rail');
    var top = bar ? bar.getBoundingClientRect().height : 0;
    if (rail && narrowRail && narrowRail.matches) top += rail.getBoundingClientRect().height;
    document.documentElement.style.setProperty('--stack-top', Math.round(top) + 'px');
  }

  measureStack();
  window.addEventListener('resize', measureStack);
  window.addEventListener('orientationchange', measureStack);

  // The brand in the top bar is a real link to /decide/, so it still works
  // opened in a new tab and still means something with no JavaScript. Once the
  // app is running, though, a full page load to get back to the home screen is
  // a waste of a reload: intercept it and go home in place. The rail used to
  // carry a second copy of this mark, directly beneath this one; it is gone.
  var topbarBrand = document.querySelector('.topbar-brand');
  if (topbarBrand) {
    topbarBrand.addEventListener('click', function (e) {
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      goHome();
    });
  }

  /* ----------------------------------------------------------------- intro */
  // The streak is the only progression marker left in the chrome; everything
  // else lives on the profile, where someone goes looking for it.
  function paintStreak() {
    var streak = progress.state.streak;
    $('rail-streak').hidden = streak < 1;
    $('streak-count').textContent = streak;
  }

  // `onRemove` adds a dismiss control beside the chip. Without it the only way
  // off a saved list was to find the dish again and un-save it from the result.
  function chip(entry, onClick, onRemove) {
    var li = document.createElement('li');
    if (!onClick) {
      li.textContent = entry.icon + ' ' + entry.name;
      return li;
    }
    if (onRemove) li.className = 'chip-wrap';

    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'chip-btn';
    btn.textContent = entry.icon + ' ' + entry.name;
    btn.addEventListener('click', function () { onClick(entry); });
    li.appendChild(btn);

    if (onRemove) {
      var x = document.createElement('button');
      x.type = 'button';
      x.className = 'chip-x';
      x.innerHTML = '&times;';
      x.setAttribute('aria-label', 'Remove ' + entry.name);
      x.addEventListener('click', function (event) {
        event.stopPropagation();
        onRemove(entry);
      });
      li.appendChild(x);
    }
    return li;
  }

  // A handful of dishes spread across the catalogue, so the sample looks varied
  // rather than like the first N rows of the list.
  function taster(count) {
    var step = Math.floor(Data.ITEMS.length / count);
    var offset = Math.floor(Math.random() * step);
    var out = [];
    for (var i = 0; i < count; i++) {
      var dish = Data.ITEMS[(i * step + offset) % Data.ITEMS.length];
      out.push({ name: dish.name, icon: dish.icon });
    }
    return out;
  }

  function dishByName(name) {
    return Data.ITEMS.filter(function (d) { return d.name === name; })[0] || null;
  }

  /*
   * Hello, for somebody who has been here before.
   *
   * The landing already opens with the best line in the app — "You're hungry.
   * You don't know what you want. That's alright, I might." — and a first-timer
   * should get that with nothing in front of it. Somebody on their ninth visit
   * has read it eight times, and a word that knows what time it is and that
   * they kept a streak going is worth more to them than the pitch is.
   *
   * Same voice: pleased to see you, not delighted to see you.
   */
  var HELLOS = [
    { until: 11, lines: ['Morning. Breakfast counts as a decision too.',
                         'Morning. Let us get the first one out of the way.',
                         'Morning. Nothing has gone wrong yet.'] },
    { until: 15, lines: ['Afternoon. Lunch, then.',
                         'Afternoon. Something to eat, is it?',
                         'Afternoon. Whatever is left in the fridge, probably.'] },
    /*
     * "Evening. This is the big one." was doing nothing. It announced that
     * something important was about to happen and then the same screen
     * appeared, which is the shape of a joke with no punchline — and worse,
     * it made a person's dinner sound like an event they had to rise to. The
     * evening ones now say something true about the evening instead: it is
     * the meal people actually argue about, the one where the answer is
     * usually "I don't mind", and the one you have been putting off since
     * about four o'clock.
     */
    { until: 21, lines: ['Evening. The one everybody argues about.',
                         'Evening. Nobody minds, apparently.',
                         'Evening. You have been putting this off since four.',
                         'Evening. Right then.'] },
    { until: 24, lines: ['Late one. Let us be quick about it.',
                         'Late. No judgement here.',
                         'Late. Toast is a valid answer, for the record.'] }
  ];

  function paintHello(state, played) {
    var el = $('landing-hello');
    if (!el) return;
    el.hidden = !played;
    if (!played) return;

    var hour = new Date().getHours();
    var band = HELLOS.filter(function (h) { return hour < h.until; })[0] || HELLOS[HELLOS.length - 1];
    var line = band.lines[Math.floor(Math.random() * band.lines.length)];

    // A streak is the one fact about somebody that is worth saying out loud
    // here: it is theirs, it took effort, and it is the reason they came back.
    var streak = state.streak || 0;
    el.textContent = streak > 1 ? line + ' ' + streak + ' days running, by the way.' : line;
  }

  function renderIntro() {
    var state = progress.state;
    var played = state.decisions > 0;
    var favourites = state.favourites || [];

    $('intro-fav-wrap').hidden = favourites.length === 0;

    /*
     * ALWAYS "Decide for me" HERE, never "Decide again".
     *
     * This read `played ? 'Decide again' : 'Decide for me'`, and `played` is
     * `state.decisions > 0` — a lifetime count. Two things were wrong with
     * that, and they compound.
     *
     * It never goes back. One accepted dish, ever, and this button says
     * "again" on every visit for the rest of the profile's life: opening the
     * app cold three weeks later was greeted as though a decision were still
     * in progress. "Again" is about a session and the number was about a
     * lifetime.
     *
     * And it counts accepts from every mode, because recordDecision is called
     * from accept() and every mode lands on the result screen — so a run of
     * Endless, Blitz or Swipe that ended in "That's the one" flipped this
     * label too. Somebody who has only ever played Endless has never once
     * used the thing this button does, and was still being told to do it
     * again.
     *
     * This screen is the way in. "Decide again" belongs on the screen you
     * reach by deciding, and that is where it still is — done-again-btn on
     * the reward panel, where it is true by construction.
     */
    label('landing-start', 'Decide for me');
    paintHello(state, played);
    paintEndlessCard();

    // "Surprise me" and the week plan need a profile worth shortcutting to:
    // offering them to someone the app knows nothing about is a random dish
    // with a confident label on it. That is a reason to hide them from a
    // subscriber who would get nothing, and not a reason to hide them from
    // everyone else — a locked control is how anybody finds out the feature
    // exists, which is why every other premium control here stays on screen
    // and says what it is when pressed.
    renderMoods();
    var warm = Taste.isWarm(state);
    $('mood-wrap').hidden = false;
    $('surprise-btn').hidden = isPlus() && !warm;
    $('week-wrap').hidden = isPlus() && !warm;
    $('duel-btn').classList.toggle('is-locked', !isPlus());
    $('knockout-btn').classList.toggle('is-locked', !isPlus());
    $('blitz-btn').classList.toggle('is-locked', !isPlus());
    $('spin-btn').classList.toggle('is-locked', !isPlus());
    $('together-btn').classList.toggle('is-locked', !isPlus());
    $('swipe-btn').classList.toggle('is-locked', !isPlus());
    $('mood-wrap').classList.toggle('is-locked', !isPlus());
    $('week-wrap').classList.toggle('is-locked', !isPlus());
    $('surprise-btn').classList.toggle('is-locked', !isPlus());
    $('intro-fav-wrap').classList.toggle('is-locked', !isPlus());
    paintKnobs();

    var plan = state.plan;
    var chips = $('week-chips');
    chips.innerHTML = '';
    if (plan && isPlus()) {
      plan.dishes.slice(0, 7).forEach(function (entry) {
        chips.appendChild(chip(entry, function (e) {
          var dish = dishByName(e.name);
          if (dish) openSheet(dish);
        }));
      });
    }
    $('week-btn').textContent = plan && isPlus() ? 'Plan it again' : 'Plan my week';
    $('week-blurb').textContent = isPlus()
      ? 'Seven dishes chosen from what you actually like, no two the same sort of thing.'
      : 'Premium plans a week from your history.';

    // Before there is any history, the same strip shows a few things off the
    // menu — a first visit should have something to look at, not a half-empty
    // page and a button.
    var recent = $('intro-recent');
    recent.innerHTML = '';
    $('intro-recent-wrap').hidden = false;
    $('intro-recent-title').textContent = state.recent.length ? 'Lately' : 'On the menu';

    var strip = state.recent.length ? state.recent.slice(0, 6) : taster(6);
    strip.forEach(function (entry) {
      recent.appendChild(chip(entry, function (e) {
        var dish = dishByName(e.name);
        if (dish) openSheet(dish);
      }));
    });

    var favs = $('intro-favs');
    favs.innerHTML = '';
    favourites.slice(0, 8).forEach(function (entry) {
      favs.appendChild(chip(entry, function (e) {
        var dish = dishByName(e.name);
        if (dish) openSheet(dish);
      }));
    });

    paintStreak();
  }

  /* ---------------------------------------------------------------- moods */
  // Each mood is two answers you would have given anyway, taken as read. The
  // game starts two questions in and already pointed the right way.
  var MOODS = [
    { id: 'starving', icon: '\u{1F62E}\u{200D}\u{1F4A8}', label: 'Starving',
      answers: [['quick', 'yes'], ['light', 'no']] },
    { id: 'light',    icon: '\u{1F957}', label: 'Something light',
      answers: [['light', 'yes'], ['healthy', 'yes']] },
    { id: 'treat',    icon: '\u{1F451}', label: 'Treat me',
      answers: [['indulgent', 'yes'], ['healthy', 'no']] },
    { id: 'comfort',  icon: '\u{1FAC2}', label: 'Comfort',
      answers: [['comfort', 'yes'], ['hot', 'yes']] },
    { id: 'kick',     icon: '\u{1F336}\u{FE0F}', label: 'Give it a kick',
      answers: [['spicy', 'yes'], ['hot', 'yes']] },
    { id: 'nothing',  icon: '\u{1F6CB}\u{FE0F}', label: 'Cannot be bothered',
      answers: [['quick', 'yes'], ['homemade', 'no']] }
  ];

  function renderMoods() {
    var wrap = $('moods');
    if (wrap.childNodes.length) return;      // fixed list, build once
    MOODS.forEach(function (mood) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'mood';
      btn.innerHTML = '<span class="mood-art" aria-hidden="true"></span><span></span>';
      btn.querySelector('.mood-art').textContent = mood.icon;
      btn.querySelector('span:last-child').textContent = mood.label;
      btn.addEventListener('click', function () { startWithMood(mood); });
      wrap.appendChild(btn);
    });
  }

  function startWithMood(mood) {
    if (!premium('Mood shortcuts')) return;
    hideLanding();
    resetGame();
    setView('decide');

    // A rule already answers its own question, so a mood must not contradict
    // one — "give it a kick" against "nothing spicy" would be the app arguing
    // with itself.
    var banned = progress.allRules();
    mood.answers.forEach(function (pair) {
      if (banned.indexOf(pair[0]) !== -1) return;
      sessionXp += progress.recordAnswer(pair[0], pair[1]);
      game.answer(pair[0], pair[1]);
    });

    Sound.tick();
    step();
    $('reaction').textContent = mood.icon + ' ' + mood.label + ', then.';
    replay($('reaction'));
  }

  /* --------------------------------------------------------- instant pick */
  // No questions at all. The whole point of the profile is that after enough
  // history it can skip straight to the answer.
  function showInstant(eyebrow) {
    var ranked = favouredDishes();
    var dish = pickFavoured(ranked, 10);
    if (!dish) return;

    resetGame();
    shortcut = true;
    rankedItems = ranked.slice(0, 8).map(function (r) { return r.item; });
    if (rankedItems.indexOf(dish) === -1) rankedItems = [dish].concat(rankedItems);

    setPanel('result');
    $('result-icon').classList.add('is-landed');
    showResult(dish, { animate: false });
    if (eyebrow) $('result-eyebrow').textContent = eyebrow;
    $('reject-btn').textContent = 'Not quite';
    $('accept-btn').disabled = false;
    $('reject-btn').disabled = false;
    Sound.reveal();
  }

  $('surprise-btn').addEventListener('click', function () {
    if (!premium('Instant picks')) return;
    hideLanding();
    setView('decide');
    showInstant('Going on what you like');
  });

  /* --------------------------------------------------------- this or that */
  // King of the hill rather than a bracket: the winner stays on, so there are
  // only ever two cards to read and no diagram to explain.
  //
  // Three things make it a game rather than a list of coin flips:
  //
  //   - The champion swaps sides at random. Otherwise "the left one" is a
  //     winning strategy and nobody reads the second card.
  //   - Challengers are matched, not drawn at random. "Coffee or steak?" is not
  //     a decision, and neither is a dish against its own twin.
  //   - What it learns is banked in one go rather than round by round, which
  //     makes undo exact. It banks at any natural end — the last round, "stop
  //     here", or navigating away — and is dropped only if you deliberately
  //     scrap the run with restart.
  var DUEL_ROUNDS = 7;

  var duel = {
    champion: null,     // the dish that has been winning
    challenger: null,   // what it is up against this round
    side: 'a',          // which card the champion is on this round
    run: 0,             // rounds the champion has survived
    round: 0,
    limit: DUEL_ROUNDS, // grows when the winner gets turned down
    pool: [],
    pending: [],        // [{ tag, value }] not yet written to the profile
    past: [],           // snapshots, for undo
    live: false         // a run is in progress, or its winner is on screen
  };

  function shuffled(list, random) {
    var out = list.slice();
    var rng = random || Math.random;
    for (var i = out.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var swap = out[i]; out[i] = out[j]; out[j] = swap;
    }
    return out;
  }

  function startDuel() {
    if (!premium('This or that')) return;
    hideLanding();

    var ranked = favouredDishes();
    duel.pool = shuffled(ranked.slice(0, 30).map(function (r) { return r.item; }));
    if (duel.pool.length < 2) return;

    duel.round = 0;
    duel.run = 0;
    duel.limit = DUEL_ROUNDS;
    duel.pending = [];
    duel.past = [];
    duel.live = true;
    duel.champion = duel.pool.shift();
    $('duel-reaction').textContent = '';
    setView('decide');
    setPanel('duel');
    nextDuel();
  }

  // Pick whoever makes the best match against the champion, from a shortlist
  // rather than the single best, so two runs are not identical.
  function takeChallenger() {
    if (!duel.pool.length) return null;

    var scored = duel.pool
      .map(function (dish, index) {
        return { dish: dish, index: index, fit: Taste.duelFit(duel.champion, dish) };
      })
      .sort(function (a, b) { return b.fit - a.fit; });

    var best = scored[0].fit;
    var contenders = scored.filter(function (c) { return c.fit >= best * 0.8; }).slice(0, 5);
    var choice = contenders[Math.floor(Math.random() * contenders.length)];
    duel.pool.splice(choice.index, 1);
    return choice.dish;
  }

  function nextDuel() {
    if (duel.round >= duel.limit || !duel.pool.length) return finishDuel();
    var challenger = takeChallenger();
    if (!challenger) return finishDuel();

    duel.round++;
    duel.challenger = challenger;
    duel.side = Math.random() < 0.5 ? 'a' : 'b';
    paintDuel();
  }

  function paintDuel() {
    var champSide = duel.side;
    var challSide = champSide === 'a' ? 'b' : 'a';

    // Once there is a champion the badge row is reserved on both cards, so the
    // two dishes stay level instead of one sitting lower than the other.
    $('duel-picks').classList.toggle('is-titled', duel.run >= 1);
    paintDuelCard(champSide, duel.champion, duel.run);
    paintDuelCard(challSide, duel.challenger, 0);

    $('duel-now').textContent = duel.round;
    $('duel-of').textContent = duel.limit;
    $('duel-back').disabled = duel.past.length === 0;
    $('duel-title').textContent = duel.round >= duel.limit
      ? 'Last one. Which is it?'
      : 'Which one, right now?';
    $('duel-hunch').textContent = duel.run === 0
      ? 'Winner stays on'
      : duel.champion.name + ' has seen off ' + duel.run +
        (duel.run === 1 ? ' other' : ' others');

    // Only the challenger card is new, so only the challenger card moves.
    replay($(challSide === 'a' ? 'duel-a' : 'duel-b'));
  }

  function paintDuelCard(side, dish, run) {
    $('duel-' + side + '-icon').textContent = dish.icon;
    $('duel-' + side + '-label').textContent = dish.name;
    $('duel-' + side + '-note').textContent = dish.blurb;
    var crown = $('duel-' + side + '-crown');
    crown.classList.toggle('is-on', run >= 1);
    if (run >= 1) $('duel-' + side + '-run').textContent = run;
  }

  // What a duel teaches: the tags where one dish plainly has it and the other
  // plainly does not. Anything blurrier is noise, and at most three a round so
  // a single tap cannot flood the profile.
  function votesFrom(winner, loser) {
    return shuffled(Taste.decisiveTags(winner, loser, Data.TAGS))
      .slice(0, 3)
      .map(function (q) {
        return { tag: q.tag, value: (winner.tags[q.tag] || 0) === 1 ? 'yes' : 'no' };
      });
  }

  function rememberDuel() {
    duel.past.push({
      champion: duel.champion,
      challenger: duel.challenger,
      side: duel.side,
      run: duel.run,
      round: duel.round,
      pool: duel.pool.slice(),
      votes: duel.pending.length
    });
  }

  function chooseDuel(which) {
    if (view !== 'decide' || panel !== 'duel' || busy) return;
    var champSide = duel.side;
    var winner = which === champSide ? duel.champion : duel.challenger;
    var loser = which === champSide ? duel.challenger : duel.champion;

    rememberDuel();
    duel.pending = duel.pending.concat(votesFrom(winner, loser));
    duel.run = winner === duel.champion ? duel.run + 1 : 1;
    duel.champion = winner;

    Sound.tick();
    nextDuel();

    $('duel-reaction').textContent = winner.icon + ' ' + winner.name +
      (loser ? ' over ' + loser.name + '.' : '.');
    replay($('duel-reaction'));
  }

  function undoDuel() {
    var last = duel.past.pop();
    if (!last) return;
    duel.champion = last.champion;
    duel.challenger = last.challenger;
    duel.side = last.side;
    duel.run = last.run;
    duel.round = last.round;
    duel.pool = last.pool;
    duel.pending.length = last.votes;   // drop exactly what that round added
    Sound.back();
    paintDuel();
    $('duel-reaction').textContent = '';
  }

  // Everything learned goes in at once, here or when the run is abandoned.
  function bankDuel() {
    var xp = 0;
    duel.pending.forEach(function (vote) {
      xp += progress.recordAnswer(vote.tag, vote.value);
    });
    duel.pending = [];
    progress.save();
    applyTaste();
    return xp;
  }

  // "Not quite" on a duel winner means keep going, not start over. The dish
  // that was turned down does not come back, whoever is next takes the crown,
  // and the run gets a few more rounds to settle it.
  function resumeDuel(rejected) {
    duel.pool = duel.pool.filter(function (dish) { return dish !== rejected; });
    if (duel.pool.length < 2) return false;

    duel.champion = duel.pool.shift();
    duel.run = 0;
    duel.past = [];
    duel.limit = duel.round + 3;
    duel.live = true;

    setPanel('duel');
    nextDuel();
    $('duel-reaction').textContent = 'Not ' + rejected.name + ', then. Keep going.';
    replay($('duel-reaction'));
    return true;
  }

  function finishDuel() {
    var champion = duel.champion;
    var run = duel.run;
    var banked = bankDuel();
    var runnersUp = duel.pool.slice(0, 6);

    resetGame();
    shortcut = true;
    duel.live = true;                   // its winner is on screen, so still live
    sessionXp = banked;                 // set after the reset, which clears it
    rankedItems = [champion].concat(runnersUp);

    setPanel('result');
    $('result-icon').classList.add('is-landed');
    showResult(champion, { animate: false });
    $('result-eyebrow').textContent = run > 0
      ? 'Beat ' + run + (run === 1 ? ' other' : ' others')
      : 'Last one standing';
    $('reject-btn').textContent = 'Not quite';
    $('accept-btn').disabled = false;
    $('reject-btn').disabled = false;
    Sound.reveal();
  }

  $('duel-btn').addEventListener('click', startDuel);
  $('duel-restart').addEventListener('click', startDuel);
  $('duel-back').addEventListener('click', undoDuel);
  $('duel-stop').addEventListener('click', finishDuel);
  $('duel-a').addEventListener('click', function () { chooseDuel('a'); });
  $('duel-b').addEventListener('click', function () { chooseDuel('b'); });

  // "Neither" retires both and starts again from a fresh pair. It costs the
  // round, so it is an escape hatch rather than a free reroll.
  $('duel-skip').addEventListener('click', function () {
    if (duel.pool.length < 2) return finishDuel();
    rememberDuel();
    Sound.shrug();
    duel.champion = duel.pool.shift();
    duel.run = 0;
    nextDuel();
    $('duel-reaction').textContent = 'Fine — two more.';
    replay($('duel-reaction'));
  });

  /* --------------------------------------------------------- order together */
  // A real browser, running somewhere else, that two people drive at once.
  //
  // Everything up to here answers "what should we eat". Nothing answered "so
  // where do we get it", except a Maps link that opens on one phone — which is
  // fine on your own and useless the moment there are two of you, because one
  // person ends up ordering while the other reads over their shoulder. This
  // opens one window with a cursor each.
  //
  // The session is started by the server, which holds the key and checks
  // Premium before spending anything. What comes back here is an embed URL and
  // a session id: no admin token, so this page cannot end anybody's session
  // but the one it started.
  //
  // `gen` is what makes closing safe while a session is still being created.
  // Starting one is a round trip to Hyperbeam, and a person who changes their
  // mind in that second used to leave a browser running that this page had no
  // handle on and no way to close — and, worse, a `session` set on a panel
  // that was already hidden, so every later click was silently ignored and the
  // feature stayed dead until the tab was reloaded. Every close bumps the
  // counter; a reply that comes back against an old one ends the session it
  // just created and paints nothing.
  var beam = { session: null, url: '', busy: false, gen: 0 };
  var beamEscape = null;
  var beamWatch = null;

  // Whether this page is itself inside another page's frame. On Whop it always
  // is. Reading window.top across origins throws in some browsers rather than
  // returning something useless, so the answer is worked out once and the
  // cautious reading — assume framed — is what a failure leaves behind.
  var framed = true;
  try { framed = window.self !== window.top; } catch (err) { framed = true; }

  // Four things two people might want to do — three about a dish, one about a
  // place. They differ only in what the shared browser opens on and what the
  // panel calls itself; the session, the teardown and the billing are the same
  // machine underneath.
  var BEAMS = {
    order: {
      title: 'Order it together',
      hint: 'Send the link to whoever you\u2019re eating with \u2014 you both get a cursor in the same window.'
    },
    cook: {
      title: 'Cook along',
      hint: 'Two kitchens, one video, in step. Send the link and whoever is cooking with you sees the same frame.'
    },
    shop: {
      title: 'Shop the list together',
      hint: 'One basket, filled by both of you. Send the link and you can each drop things in.'
    },
    venue: {
      title: 'Order from here',
      hint: 'That place\u2019s own ordering, in a browser running somewhere else. Send the link and whoever is eating with you can put their own order in.'
    }
  };

  function openBeam(kind, dish) {
    var spec = BEAMS[kind];
    if (!premium(spec.title)) return;

    // Already up. A second click used to do nothing at all, which is
    // indistinguishable from a broken button — so it brings the panel back
    // instead. This is what a click looks like after the panel was closed by
    // something other than the close button.
    if (beam.session || beam.url) {
      $('beam').hidden = false;
      document.body.classList.add('is-beaming');
      return;
    }
    if (beam.busy) {
      return toast('\u{23F3}', 'Still opening', 'The browser is starting up.');
    }

    var gen = beam.gen;
    beam.busy = true;
    $('beam-kind').textContent = spec.title;
    $('beam-hint').textContent = spec.hint;
    $('beam-dish').textContent = dish || '';
    $('beam-state').textContent = 'Opening a browser you can both use\u2026';
    $('beam-state').hidden = false;

    /*
     * The way out goes up now, not when the browser arrives.
     *
     * Inside somebody else's frame it is shown either way (see paintBeam: a
     * permission withheld further up can never be recovered from in here), so
     * revealing it at the end meant the stage was one row taller while the
     * browser was starting and one row shorter the moment it appeared — the
     * picture arriving and then immediately changing size. Up front, the stage
     * is its final height before anything is asked for, so the frame mounts
     * into the size it keeps.
     *
     * It also makes stageSize() right: that measures the stage to ask
     * Hyperbeam for a stream of the same shape, and it was measuring a stage
     * 66px taller than the one the stream would be shown in.
     *
     * The link has no href until the session comes back, which is a second in
     * which it does nothing — and nobody reaches for "nothing showing" while
     * the panel still says it is opening.
     */
    $('beam-escape').hidden = !framed;

    $('beam').hidden = false;
    document.body.classList.add('is-beaming');
    Sound.tick();

    fetch('/api/order-together', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ dish: dish || '', kind: kind, size: stageSize() })
    }).then(function (res) {
      return res.json().then(function (body) { return { ok: res.ok, body: body }; });
    }).catch(function () {
      return { ok: false, body: {} };
    }).then(function (answer) {
      // Somebody closed the panel while this was in the air. The session that
      // just came back is real and is already billing, so it gets ended here
      // and nothing is painted — the alternative is a browser nobody can see
      // and nobody can close.
      if (gen !== beam.gen) {
        if (answer.ok && answer.body && answer.body.sessionId) endSession(answer.body.sessionId);
        return;
      }
      beam.busy = false;
      if (!answer.ok || !answer.body || !answer.body.embedUrl) {
        // Nothing half-open is left behind: the panel closes and says why.
        closeBeam();
        var why = answer.body && answer.body.error;
        if (why === 'too_fast') {
          return toast('\u{23F1}\u{FE0F}', 'Slow down a moment',
            'That is a lot of browsers at once. Try again shortly.');
        }
        if (why === 'premium_required' || why === 'sign_in_required') return goPremium(spec.title);
        return toast('\u{1F6AB}', 'Could not open it',
          'The shared browser did not start. Try again in a moment.');
      }
      beam.session = answer.body.sessionId || null;
      beam.url = answer.body.embedUrl;
      $('beam-open').href = beam.url;
      paintBeam();
    });
  }

  /*
   * What shape the remote browser should be.
   *
   * It used to be 1280x720 for everybody, which is a desktop window — and on a
   * phone held upright that is a wide strip letterboxed into a tall panel with
   * text too small to read and links too small to hit. The browser running
   * somewhere else can be any shape, so it is asked for in the shape of the
   * space it is going to be shown in.
   *
   * The panel is not on screen yet when this is called, so it measures the
   * window and takes off what the bar, the hint and the padding will use. The
   * server clamps whatever arrives and ignores anything it does not like, so a
   * wrong answer here costs nothing.
   */
  function stageSize() {
    var stage = $('beam-stage');
    var box = stage.getBoundingClientRect();
    var w = Math.round(box.width);
    var h = Math.round(box.height);
    if (w < 120 || h < 120) {
      w = Math.round(window.innerWidth || 1280);
      h = Math.round((window.innerHeight || 720) - 180);
    }
    return { w: w, h: h };
  }

  function paintBeam() {
    var stage = $('beam-stage');
    // Never two. A second frame stacked on the first is two WebRTC clients
    // paying for one session, and the one underneath is the one that gets
    // torn down on close.
    var old = stage.querySelector('.beam-frame');
    if (old) stage.removeChild(old);

    var frame = document.createElement('iframe');
    frame.className = 'beam-frame';
    frame.src = beam.url;
    frame.title = 'A browser you and whoever you are eating with both control';
    // The stream is video and audio over WebRTC, and a frame that is not
    // allowed to play it shows nothing while looking like it worked. This app
    // is itself often inside somebody else's frame, and permissions have to be
    // granted at every level on the way down, so the list is explicit rather
    // than the minimum that happens to work at the top level.
    frame.allow = 'autoplay; fullscreen; clipboard-read; clipboard-write; ' +
      'encrypted-media; picture-in-picture; display-capture; microphone; camera';
    frame.setAttribute('allowfullscreen', '');

    // Two different failures look identical from out here — a frame that never
    // loaded at all, and one that loaded and is showing black because a
    // permission was withheld further up. This tells them apart: `load` fires
    // on a cross-origin frame even though nothing inside it can be read, so a
    // frame that has not fired it after ten seconds never arrived, and that is
    // worth saying plainly rather than leaving somebody watching a blank box.
    var landed = false;
    frame.addEventListener('load', function () { landed = true; });
    if (beamWatch) clearTimeout(beamWatch);
    beamWatch = setTimeout(function () {
      if (landed || !beam.url) return;
      $('beam-state').textContent =
        'The browser is taking longer than it should to appear. Opening it in a ' +
        'new tab usually works when this happens.';
      $('beam-state').hidden = false;
      $('beam-escape').hidden = false;
    }, 10000);

    stage.appendChild(frame);
    $('beam-state').hidden = true;

    // A blank frame is the one failure this cannot see from in here: the
    // session is live, the URL is right, and nothing renders. So the way out
    // is offered before anybody has to go looking for it — the same browser,
    // opened as a page, where no frame permissions apply at all.
    //
    // Straight away when this app is itself inside somebody else's frame,
    // which is how it is served on Whop. A permission has to be granted at
    // every level on the way down, and the outermost frame is not ours: if
    // autoplay was withheld up there, nothing this page does can get it back,
    // and the stream is blank however long anybody waits. A new tab is a top
    // level, where none of that applies.
    if (beamEscape) clearTimeout(beamEscape);
    if (framed) {
      $('beam-escape').hidden = false;
    } else {
      beamEscape = setTimeout(function () {
        if (beam.url) $('beam-escape').hidden = false;
      }, 6000);
    }
  }

  // Closing it is what ends the session — it bills for as long as it is up,
  // whether or not anybody is looking at it. keepalive matters here: without
  // it the request is cancelled when the tab goes away, which is exactly the
  // case this most needs to cover.
  function closeBeam() {
    var session = beam.session;
    beam.session = null;
    beam.url = '';
    beam.busy = false;
    // Anything still in flight is now closing something nobody asked for.
    beam.gen += 1;

    $('beam').hidden = true;
    document.body.classList.remove('is-beaming');
    var stage = $('beam-stage');
    var frame = stage.querySelector('.beam-frame');
    if (frame) stage.removeChild(frame);
    $('beam-state').textContent = 'Opening a browser you can both use\u2026';
    $('beam-state').hidden = false;
    $('beam-escape').hidden = true;
    // Never leave the last session's URL on the way-out link: pressed after a
    // failure to start the next one, it would open a browser that is gone.
    $('beam-open').removeAttribute('href');
    if (beamEscape) { clearTimeout(beamEscape); beamEscape = null; }
    if (beamWatch) { clearTimeout(beamWatch); beamWatch = null; }

    if (!session) return;
    endSession(session);
  }

  // Ending a session is the difference between paying for a browser and paying
  // for a browser nobody is looking at, so it has to survive the tab being
  // closed. sendBeacon is the only request a page can make on its way out that
  // the browser undertakes to deliver — fetch with keepalive is best-effort and
  // a plain fetch is cancelled outright. It can only POST, which is why the
  // endpoint takes a close on POST as well as on DELETE.
  function endSession(session) {
    var body = JSON.stringify({ close: session });
    try {
      if (navigator.sendBeacon) {
        var blob = new Blob([body], { type: 'application/json' });
        if (navigator.sendBeacon('/api/order-together', blob)) return;
      }
    } catch (err) { /* fall through to fetch */ }
    try {
      fetch('/api/order-together', {
        method: 'POST', body: body, keepalive: true,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (err) { /* the server's own idle timeout is the backstop */ }
  }

  // After a verdict: get it brought to you.
  $('order-btn').addEventListener('click', function () {
    openBeam('order', shownItem ? shownItem.name : '');
  });

  // In cook mode: the recipe is on this screen, the technique is on a video,
  // and the other person is in a different kitchen.
  //
  // Both of these launch from a <dialog> opened with showModal(), which lives
  // in the top layer and therefore sits above any z-index the shared browser
  // could be given. Closing it first is what puts the browser on screen at all
  // — and it is the right thing anyway, since this is a change of context, not
  // something to stack on top of the recipe.
  $('cook-along-btn').addEventListener('click', function () {
    var dish = $('cook-name').textContent || '';
    cookDialog.close();
    openBeam('cook', dish);
  });

  // With the list open: one basket rather than two half-full ones.
  $('list-shop-btn').addEventListener('click', function () {
    var dish = $('list-name').textContent || '';
    listSheet.close();
    openBeam('shop', dish);
  });

  $('beam-close').addEventListener('click', closeBeam);

  // Taking the way out. The new tab is the same session, so the frame in here
  // has to go: two connections to one browser is two streams billed as one,
  // they fight over the cursor, and closing this panel afterwards would kill
  // the tab the person is actually using. The panel stays open holding the
  // session so there is still something to press when they are done.
  $('beam-open').addEventListener('click', function () {
    if (!beam.url) return;
    var stage = $('beam-stage');
    var frame = stage.querySelector('.beam-frame');
    if (frame) stage.removeChild(frame);
    if (beamWatch) { clearTimeout(beamWatch); beamWatch = null; }
    $('beam-escape').hidden = true;
    $('beam-state').textContent =
      'It is open in the other tab. Come back here and close this when you are ' +
      'finished, so the browser stops running.';
    $('beam-state').hidden = false;
  });

  $('beam-copy').addEventListener('click', function () {
    if (!beam.url) return;
    var done = function () { toast('\u{1F517}', 'Link copied', 'Send it over and you are both in the same window.'); };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(beam.url).then(done, done);
    } else {
      done();
    }
  });

  // A tab that is closed rather than dismissed still has to stop paying.
  //
  // pagehide only — deliberately not visibilitychange, which fires when you
  // glance at another tab, switch apps, or the phone locks the screen. Ending
  // the session there would kill a browser two people are in the middle of
  // using, and coming back to a dead window is a worse outcome than a minute
  // of billing. A tab discarded in the background without firing anything is
  // what the server's 60-second idle timeout is for.
  window.addEventListener('pagehide', function () {
    if (beam.session) endSession(beam.session);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !$('beam').hidden) closeBeam();
  });

  /* -------------------------------------------------------------- together */
  // A table of up to six, one phone, one dish they can all live with.
  //
  // It reuses the ordinary questionnaire rather than inventing a second one:
  // the same questions, asked round the table, with the same replies — because
  // a second set of questions to learn would be a second thing to explain. All
  // that is added is a handover between each person and a different way of
  // reading the answer sets at the end.
  //
  // HOW TWO ANSWER SETS BECOME ONE DISH. Not by averaging: the average of "no
  // meat" and "meat please" is a dish that suits nobody. Each set is replayed
  // into its own game, and a dish is ranked by how many stated requirements it
  // breaks *across both people* first, and only then by how well it fits them.
  // So a dish neither of them ruled out always beats one that half the table
  // cannot eat, however much the other half would enjoy it.
  var TOGETHER_ASKS = 5;

  /*
   * mode 'phone' — the Premium one: a whole table, one device, passed round.
   * mode 'link'  — the free one: two people, two phones, one set of answers
   *                carried in the URL.
   *
   * The two used to be the same feature twice: two people, five questions
   * each, one dish. The link version is the better way to do that, because it
   * does not need everybody in the room. So the one that does need everybody
   * in the room now does the thing only it can — a table of up to six, and a
   * reveal of what the whole table actually agreed on.
   */
  var TABLE_MAX = 6;
  var together = { live: false, mode: 'phone', eaters: 2, sets: [], sending: false };

  /*
   * Five answers, small enough to travel in a link.
   *
   * WHY THE URL AND NOT A SERVER. The whole of one person's half of this is
   * five yes/nos. Storing that would mean a database, a row per invite, an
   * expiry policy, and a record of what somebody said they felt like eating —
   * to save ten characters. In the link it costs nothing, expires when the
   * message does, and works with the app offline.
   *
   * One character for the question, one for the answer. The question is its
   * index in the catalogue's own list, in base 36 — there are 28 questions, so
   * one character covers it with room to spare.
   */
  var ANSWER_CHARS = { yes: 'y', no: 'n', either: 'e', neither: 'x' };
  var CHAR_ANSWERS = { y: 'yes', n: 'no', e: 'either', x: 'neither' };

  function packAnswers(answers) {
    var out = '';
    for (var i = 0; i < answers.length; i++) {
      var at = -1;
      for (var q = 0; q < Data.QUESTIONS.length; q++) {
        if (Data.QUESTIONS[q].tag === answers[i].tag) { at = q; break; }
      }
      var letter = ANSWER_CHARS[answers[i].value];
      // A tag the catalogue no longer has, or an answer type that is not one of
      // the four, is dropped rather than encoded as something it is not.
      if (at < 0 || !letter) continue;
      out += at.toString(36) + letter;
    }
    return out;
  }

  // Anything at all can arrive here — this string comes out of a URL somebody
  // else wrote. Returns null unless the whole thing reads as real answers.
  function unpackAnswers(code) {
    if (typeof code !== 'string' || !code || code.length % 2 !== 0) return null;
    if (code.length > 40) return null;
    var out = [];
    for (var i = 0; i < code.length; i += 2) {
      var at = parseInt(code.charAt(i), 36);
      var value = CHAR_ANSWERS[code.charAt(i + 1)];
      if (isNaN(at) || at >= Data.QUESTIONS.length || !value) return null;
      out.push({ tag: Data.QUESTIONS[at].tag, value: value });
    }
    return out.length ? out : null;
  }

  function inviteUrl(code) {
    var origin = (typeof location !== 'undefined' && location.origin) ? location.origin : '';
    return origin ? origin + '/together/' + code : '';
  }


  // How many are eating. Asked first because everything after it — how many
  // handovers, what the reveal can say — depends on the answer.
  function startTogether() {
    if (!premium('Together')) return;
    hideLanding();
    resetGame();
    setView('decide');
    together.live = true;
    together.mode = 'phone';
    together.sending = false;
    together.sets = [];
    together.eaters = 2;
    paintTable();
    setPanel('table');
  }

  function paintTable() {
    var wrap = $('table-knobs');
    wrap.innerHTML = '';
    for (var n = 2; n <= TABLE_MAX; n++) {
      (function (count) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'knob' + (count === together.eaters ? ' is-on' : '');
        btn.textContent = String(count);
        btn.setAttribute('aria-pressed', count === together.eaters ? 'true' : 'false');
        btn.addEventListener('click', function () {
          together.eaters = count;
          Sound.tick();
          paintTable();
        });
        wrap.appendChild(btn);
      })(n);
    }
  }

  function beginTable() {
    resetGame();
    handover('Person 1 of ' + together.eaters + '.',
      'Five either-ors each, then one dish the whole table can live with.', 'Start');
  }

  /*
   * The same idea, over a link, and free.
   *
   * Together on one phone is Premium because it is a convenience: both of you
   * are already in the room. This one is not a convenience, it is the reason
   * somebody else installs the app — it does not work at all unless a second
   * person plays, so putting it behind the paywall would be charging for the
   * part that brings people in. It stays free on both ends deliberately.
   */
  function startTogetherLink() {
    hideLanding();
    resetGame();
    setView('decide');
    together.live = true;
    together.mode = 'link';
    together.sending = true;
    together.eaters = 2;
    together.sets = [];
    handover('Answer yours first.',
      'Five either-ors, then you get a link to send. Whatever comes back has to suit you both.',
      'Start');
  }

  // The other end: a link arrived with somebody's five answers in it.
  function joinTogether(first) {
    hideLanding();
    resetGame();
    setView('decide');
    together.live = true;
    together.mode = 'link';
    together.sending = false;
    together.eaters = 2;
    together.sets = [first];
    handover('Someone wants to eat with you.',
      'They have answered theirs. Five either-ors from you and you both get one dish.',
      'Answer mine');
  }

  function handover(title, sub, label) {
    $('hand-title').textContent = title;
    $('hand-sub').textContent = sub;
    $('hand-go-label').textContent = label;
    setPanel('hand');
  }

  // Called from step() in place of the ordinary flow, so the two runs are
  // capped at five questions each rather than running until the engine is
  // confident — ten taps between two people is already a lot to ask.
  function togetherStep() {
    if (game.answers.length < TOGETHER_ASKS) {
      var next = game.nextQuestion();
      if (next) {
        renderQuestion(next.question);
        setPanel('question');
        return;
      }
    }
    together.sets.push(game.answers.slice());

    // The link version stops here: the rest of it happens on somebody else's
    // phone, so what this person gets is a link rather than a handover.
    if (together.sending) {
      together.sending = false;
      return showInvite(together.sets[0]);
    }

    if (together.sets.length >= together.eaters) return finishTogether();

    var next = together.sets.length + 1;
    return handover('Pass it to person ' + next + '.',
      'Same questions, their answers. Nobody sees anybody else\u2019s.',
      'I\u2019m number ' + next);
  }

  // Replay one answer list into a game of its own, so each person's
  // requirements are counted the way they would be in a game they played alone.
  function playbackOf(answers) {
    var solo = new Engine.Game({ bias: tasteBias() });
    answers.forEach(function (a) { solo.answer(a.tag, a.value); });
    return solo;
  }

  /*
   * HOW A TABLE OF ANSWER SETS BECOMES ONE DISH. Not by averaging: the average
   * of "no meat" and "meat please" is a dish that suits nobody. Each set is
   * replayed into its own game, and a dish is ranked by how many stated
   * requirements it breaks *across everyone* first, and only then by how well
   * it fits them — the product of the scores rather than the sum, so a dish
   * one person actively does not want cannot be rescued by everybody else
   * loving it. That holds for two people and it holds for six.
   */
  function finishTogether() {
    var games = together.sets.map(playbackOf);
    var heads = games.length;

    var ranked = Data.ITEMS.map(function (item, i) {
      var faults = 0;
      var score = 1;
      games.forEach(function (g) {
        faults += g.faults[i];
        score *= g.weights[i];
      });
      return { item: item, faults: faults, score: score };
    }).sort(function (a, b) {
      if (a.faults !== b.faults) return a.faults - b.faults;
      return b.score - a.score;
    });

    var floor = ranked[0].faults;
    var agreed = ranked.filter(function (r) { return r.faults === floor; });
    var winner = agreed[0].item;

    // NOTHING IS RECORDED HERE. answer() already banked every tap as it
    // happened, for whoever was tapping. Replaying a set into the profile on
    // top of that counted somebody twice; and on a shared phone the guests'
    // answers are already in there, which is a separate problem this is not
    // the place to solve.
    var earned = sessionXp;
    progress.save();
    applyTaste();

    var words = agreementOf(together.sets);

    resetGame();
    shortcut = true;
    together.live = false;
    together.sets = [];
    together.sending = false;
    together.mode = 'phone';
    sessionXp = earned;
    rankedItems = agreed.slice(0, 7).map(function (r) { return r.item; });

    setPanel('result');
    $('result-icon').classList.add('is-landed');
    showResult(winner, { animate: false });
    $('result-eyebrow').textContent = floor === 0
      ? (heads > 2 ? 'All ' + heads + ' of you said yes to this' : 'You both said yes to this')
      : (heads > 2 ? 'The closest all ' + heads + ' of you got' : 'The closest you both got');

    // What the table actually had in common, in the questions' own words. It
    // is the one thing a shared phone can show that a link cannot: everybody
    // answered here, so everybody's agreement is knowable.
    var note = $('agreed');
    if (words.length) {
      note.hidden = false;
      $('agreed-why').textContent = (heads > 2 ? 'All ' + heads + ' of you wanted ' : 'You both wanted ') +
        listWords(words) + '.';
    } else {
      note.hidden = true;
    }

    $('reject-btn').textContent = 'Not quite';
    $('accept-btn').disabled = false;
    $('reject-btn').disabled = false;
    Sound.reveal();
  }

  // Tags every single person answered the same way, said back in the words the
  // questions themselves use — "something hot", not "hot: yes".
  function agreementOf(sets) {
    if (sets.length < 2) return [];
    var seen = {};
    sets.forEach(function (set) {
      set.forEach(function (a) {
        if (a.value !== 'yes' && a.value !== 'no') return;
        (seen[a.tag] || (seen[a.tag] = [])).push(a.value);
      });
    });
    var out = [];
    Object.keys(seen).forEach(function (tag) {
      var vals = seen[tag];
      if (vals.length !== sets.length) return;          // not everybody was asked
      var first = vals[0];
      for (var i = 1; i < vals.length; i++) if (vals[i] !== first) return;
      var w = TAG_WORDS[tag];
      if (w) out.push(first === 'yes' ? w.yes : w.no);
    });
    return out.slice(0, 4);
  }

  function listWords(list) {
    var words = list.map(function (w) { return String(w).toLowerCase(); });
    if (words.length === 1) return words[0];
    return words.slice(0, -1).join(', ') + ' and ' + words[words.length - 1];
  }

  /*
   * "Now send it." The half-finished state that only resolves when somebody
   * else plays — which is the whole point, so this screen has one job and says
   * one thing.
   */
  function showInvite(answers) {
    var code = packAnswers(answers);
    var url = inviteUrl(code);
    $('invite-link').value = url;
    $('invite-link').dataset.url = url;
    setPanel('invite');
    Sound.reveal();
  }

  function shareInvite() {
    var url = $('invite-link').dataset.url || '';
    if (!url) return;
    var text = 'I answered five questions about what I feel like eating. Answer yours and we get one dish that suits us both.';
    if (navigator.share) {
      navigator.share({ title: 'morsels45', text: text, url: url }).catch(function () {});
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text + ' ' + url).then(function () {
        toast('\u{1F4CB}', 'Copied', 'Send it to whoever you are eating with.');
      }).catch(function () {
        toast('\u{1F517}', 'Send this', url);
      });
      return;
    }
    toast('\u{1F517}', 'Send this', url);
  }

  function quitTogether() {
    together.live = false;
    together.sets = [];
    together.sending = false;
    together.eaters = 2;
    together.mode = 'phone';
    goHome();
  }

  $('together-btn').addEventListener('click', startTogether);
  $('invite-share').addEventListener('click', shareInvite);
  $('invite-quit').addEventListener('click', quitTogether);

  $('hand-go').addEventListener('click', function () {
    if (!together.live) return goHome();
    // Everyone after the first needs a clean run rather than the last
    // person's half-finished one.
    if (together.sets.length) resetGame();
    Sound.tick();
    step();
  });

  $('table-go').addEventListener('click', function () {
    Sound.tick();
    beginTable();
  });

  $('table-quit').addEventListener('click', quitTogether);
  $('hand-quit').addEventListener('click', quitTogether);

  /* -------------------------------------------------------------- knockout */
  // Eight dishes, straight elimination: round of eight, semifinal, final.
  // Duel is one dish defending a streak against a stream of challengers —
  // Knockout is a fixed field that only ever shrinks, and it always ends in
  // exactly three rounds, win or lose alongside it.
  var KNOCKOUT_SIZE = 8;
  var KNOCKOUT_ROUND_NAMES = ['Round of 8', 'Semifinal', 'Final'];

  var knockout = {
    round: 0,
    bracket: [],
    matchIndex: 0,
    matchesInRound: 0,
    winners: [],
    lastWinner: null,  // whoever most recently won a match, for an early stop
    history: [],    // one array per round, that round's winners in slot order
    pending: [],
    live: false
  };

  // The bracket is seeded before a single match is played, and shown as its
  // own screen — eight dishes, all at once, is a different opening beat than
  // Duel's "here are two, go" and is worth a second of its own before the
  // first pick.
  function startKnockout() {
    if (!premium('Knockout')) return;
    hideLanding();

    var favoured = shuffled(favouredDishes().slice(0, 30).map(function (r) { return r.item; }));
    var pool = favoured.slice(0, KNOCKOUT_SIZE);
    if (pool.length < KNOCKOUT_SIZE) {
      var seen = pool;
      var extra = shuffled(Data.ITEMS.filter(function (d) { return seen.indexOf(d) === -1; }));
      pool = pool.concat(extra).slice(0, KNOCKOUT_SIZE);
    }

    knockout.round = 0;
    knockout.bracket = pool;
    knockout.matchIndex = 0;
    knockout.matchesInRound = pool.length / 2;
    knockout.winners = [];
    knockout.history = [[], [], []];
    knockout.pending = [];
    knockout.live = true;

    $('knockout-reaction').textContent = '';
    paintKnockoutSeed(pool);
    setView('decide');
    setPanel('knockout-seed');
  }

  function paintKnockoutSeed(pool) {
    var list = $('knockout-seed-list');
    list.innerHTML = '';
    pool.forEach(function (dish, i) {
      var li = document.createElement('li');
      li.style.animationDelay = (i * 45) + 'ms';
      li.innerHTML = '<span class="seed-icon" aria-hidden="true"></span><span class="seed-name"></span>';
      li.querySelector('.seed-icon').textContent = dish.icon;
      li.querySelector('.seed-name').textContent = dish.name;
      list.appendChild(li);
    });
  }

  function beginKnockoutBracket() {
    setPanel('knockout');
    paintKnockoutMatch();
  }

  $('knockout-seed-start').addEventListener('click', beginKnockoutBracket);
  $('knockout-seed-back').addEventListener('click', function () {
    knockout.live = false;
    goHome();
  });

  function currentKnockoutPair() {
    return [knockout.bracket[knockout.matchIndex * 2], knockout.bracket[knockout.matchIndex * 2 + 1]];
  }

  // The bracket the player is actually watching fill in — three columns,
  // Round of 8 down to the Final, a "?" for anything not decided yet and the
  // round in progress picked out in amber.
  function paintKnockoutLadder() {
    var ladder = $('knockout-ladder');
    ladder.innerHTML = '';
    KNOCKOUT_ROUND_NAMES.forEach(function (name, ri) {
      var col = document.createElement('div');
      col.className = 'ladder-col';
      var label = document.createElement('p');
      label.className = 'ladder-col-label';
      label.textContent = name;
      col.appendChild(label);

      var size = KNOCKOUT_SIZE / Math.pow(2, ri + 1);
      var decided = knockout.history[ri] || [];
      for (var i = 0; i < size; i++) {
        var slot = document.createElement('span');
        var dish = decided[i];
        var isCurrentSlot = ri === knockout.round && i === knockout.matchIndex;
        slot.className = 'ladder-slot' + (dish ? ' is-decided' : '') + (isCurrentSlot && !dish ? ' is-current' : '');
        slot.textContent = dish ? dish.icon : '?';
        col.appendChild(slot);
      }
      ladder.appendChild(col);
    });
  }

  function paintKnockoutMatch() {
    var pair = currentKnockoutPair();
    paintKnockoutCard('a', pair[0]);
    paintKnockoutCard('b', pair[1]);
    paintKnockoutLadder();

    $('knockout-round').textContent = KNOCKOUT_ROUND_NAMES[knockout.round];
    $('knockout-title').textContent = 'Match ' + (knockout.matchIndex + 1) + ' of ' + knockout.matchesInRound;
    var standing = KNOCKOUT_SIZE - knockout.history.reduce(function (n, r) { return n + r.length; }, 0);
    $('knockout-hunch').textContent = knockout.round === KNOCKOUT_ROUND_NAMES.length - 1
      ? 'The final. Whoever wins this one is dinner.'
      : standing + ' dishes still standing.';

    replay($('knockout-a'));
    replay($('knockout-b'));
  }

  function paintKnockoutCard(side, dish) {
    $('knockout-' + side + '-icon').textContent = dish.icon;
    $('knockout-' + side + '-label').textContent = dish.name;
    $('knockout-' + side + '-note').textContent = dish.blurb;
  }

  function chooseKnockout(which) {
    if (view !== 'decide' || panel !== 'knockout' || busy) return;
    var pair = currentKnockoutPair();
    var winner = which === 'a' ? pair[0] : pair[1];
    var loser = which === 'a' ? pair[1] : pair[0];

    knockout.pending = knockout.pending.concat(votesFrom(winner, loser));
    knockout.winners.push(winner);
    knockout.lastWinner = winner;
    knockout.history[knockout.round].push(winner);
    paintKnockoutLadder();

    Sound.tick();
    $('knockout-reaction').textContent = winner.icon + ' ' + winner.name + ' moves on.';
    replay($('knockout-reaction'));

    knockout.matchIndex++;
    if (knockout.matchIndex < knockout.matchesInRound) return paintKnockoutMatch();

    // Round over. One winner left means it was the final.
    if (knockout.winners.length === 1) return finishKnockout(knockout.winners[0], knockout.round + 1);

    knockout.bracket = knockout.winners;
    knockout.winners = [];
    knockout.matchIndex = 0;
    knockout.matchesInRound = knockout.bracket.length / 2;
    knockout.round++;
    paintKnockoutMatch();
  }

  function bankKnockout() {
    var xp = 0;
    knockout.pending.forEach(function (vote) { xp += progress.recordAnswer(vote.tag, vote.value); });
    knockout.pending = [];
    progress.save();
    applyTaste();
    return xp;
  }

  // `roundsWon` is how many full rounds this dish's side of the bracket has
  // actually taken — 3 only when the whole thing played out, honest and
  // lower when "Stop here" cut it short partway through.
  function finishKnockout(champion, roundsWon) {
    var banked = bankKnockout();
    knockout.live = false;
    knockout.lastWinner = null;

    // The runners-up, in the order the bracket already put them: whoever went
    // out in the final first, then the semifinals, and so on. Without these
    // "not quite" had nothing to offer and the round ended on one dish.
    var alsoRan = [];
    for (var r = knockout.history.length - 1; r >= 0; r--) {
      knockout.history[r].forEach(function (dish) {
        if (dish !== champion && alsoRan.indexOf(dish) < 0) alsoRan.push(dish);
      });
    }

    resetGame();
    shortcut = true;
    sessionXp = banked;
    rankedItems = [champion].concat(alsoRan.slice(0, 7));

    setPanel('result');
    $('result-icon').classList.add('is-landed');
    showResult(champion, { animate: false });
    $('result-eyebrow').textContent = roundsWon >= KNOCKOUT_ROUND_NAMES.length
      ? 'Knockout champion — won all ' + KNOCKOUT_ROUND_NAMES.length + ' rounds'
      : roundsWon > 0
        ? 'Knockout — won ' + roundsWon + ' of ' + KNOCKOUT_ROUND_NAMES.length + ' rounds'
        : 'Knockout — called it early';
    $('reject-btn').textContent = 'Not quite';
    $('accept-btn').disabled = false;
    $('reject-btn').disabled = false;
    Sound.win();
    Confetti.burst({ y: window.innerHeight * 0.35 });
  }

  $('knockout-btn').addEventListener('click', startKnockout);
  $('knockout-restart').addEventListener('click', startKnockout);
  $('knockout-stop').addEventListener('click', function () {
    if (!knockout.live) return goHome();
    finishKnockout(knockout.lastWinner || currentKnockoutPair()[0], knockout.round);
  });
  $('knockout-a').addEventListener('click', function () { chooseKnockout('a'); });
  $('knockout-b').addEventListener('click', function () { chooseKnockout('b'); });

  /* ----------------------------------------------------------------- blitz */
  // The same head-to-head pick as Duel, against a thirty second clock instead
  // of a round count. What ends the run is time, not a number chosen in
  // advance — so the score that matters is how many you got through, not
  // who is left standing.
  var BLITZ_SECONDS = 30;

  var blitz = {
    timer: null,
    readyTimer: null,   // the 3-2-1 countdown, cancellable if you wander off
    secondsLeft: BLITZ_SECONDS,
    pool: [],
    champion: null,
    challenger: null,
    wild: null,        // a third dish, only set on a wildcard round
    special: null,     // the twist on this round, or null for a plain one
    sinceSpecial: 0,   // plain rounds since the last twist
    bonusSpent: 0,     // seconds won back so far, against BLITZ_BONUS_BUDGET
    side: 'a',
    count: 0,
    beaten: [],         // what the champion knocked out, most recent first
    streak: 0,          // consecutive picks made within BLITZ_STREAK_MS
    lastPickAt: 0,
    pending: [],
    live: false
  };

  var BLITZ_STREAK_MS = 2500;    // how quick "back to back" has to be
  var BLITZ_STREAK_BONUS = 2;    // seconds credited every 5-streak

  /*
   * The twists.
   *
   * There used to be one, a third card every fifth pick, which stopped being a
   * surprise the second time anybody counted. These fire on a coin toss
   * instead, so a round is only ever probably ordinary.
   *
   * NONE OF THEM MAKE A DISH WORTH PICKING FOR A REASON OTHER THAN WANTING IT.
   * Every pick here is fed to the taste model as a real opinion about food, so
   * a twist that put the reward on one particular card — pick this one for
   * three seconds — would buy time by teaching the model a lie. Each of these
   * either changes what is on the table, changes what the question means, or
   * pays out the same whichever card is tapped.
   */
  var BLITZ_SPECIALS = [
    { kind: 'wild',    badge: '\u{1F0CF} Wildcard',   title: 'Wildcard \u2014 any of these three?' },
    { kind: 'double',  badge: '\u{2716}\u{FE0F} Double',   title: 'Double \u2014 this one counts twice' },
    { kind: 'blind',   badge: '\u{1F648} Blind',      title: 'Blind \u2014 go on the picture alone' },
    { kind: 'reverse', badge: '\u{1F503} Reverse',    title: 'Reverse \u2014 which one would you NOT?' },
    { kind: 'bonus',   badge: '\u{23F1}\u{FE0F} Bonus',    title: 'Bonus \u2014 seconds either way' }
  ];

  var BLITZ_SPECIAL_CHANCE = 0.3;  // roughly one round in three, once eligible
  var BLITZ_SPECIAL_GAP = 2;       // plain rounds owed after each twist
  var BLITZ_BONUS_SECONDS = 3;

  /*
   * How much time a whole run can win back, in total.
   *
   * Without this the mode does not end. A streak pays two seconds every five
   * picks and a bonus round pays three more, so anybody tapping faster than
   * about two and a half picks a second earns time quicker than the clock
   * spends it and holds it at the ceiling for ever. The per-tick ceiling never
   * caught that — it bounds how much is on the clock, not how often it can be
   * put back. This bounds the run: thirty seconds, plus at most this many won.
   */
  var BLITZ_BONUS_BUDGET = 15;

  // Unpredictable, but not relentless: the gap keeps two twists apart so the
  // ordinary round still reads as the default, which is the only thing that
  // makes a twist land at all.
  function nextBlitzSpecial() {
    if (blitz.sinceSpecial < BLITZ_SPECIAL_GAP || Math.random() > BLITZ_SPECIAL_CHANCE) {
      blitz.sinceSpecial++;
      return null;
    }
    blitz.sinceSpecial = 0;
    return BLITZ_SPECIALS[Math.floor(Math.random() * BLITZ_SPECIALS.length)];
  }

  // One place that adds to the clock, so both limits are applied the same way
  // wherever the seconds came from. Returns what was actually credited, which
  // is not always what was offered — the reaction line should not promise
  // three seconds the budget could not pay.
  function addBlitzSeconds(n) {
    var left = Math.max(BLITZ_BONUS_BUDGET - blitz.bonusSpent, 0);
    var give = Math.min(n, left);
    if (give <= 0) return 0;
    blitz.bonusSpent += give;
    blitz.secondsLeft = Math.min(blitz.secondsLeft + give, BLITZ_SECONDS + 20);
    $('blitz-clock').textContent = String(blitz.secondsLeft);
    $('blitz-clock').classList.toggle('is-low', blitz.secondsLeft <= 10 && blitz.secondsLeft > 0);
    return give;
  }

  function blitzChallenger() {
    if (!blitz.pool.length) {
      blitz.pool = shuffled(favouredDishes().slice(0, 30).map(function (r) { return r.item; }))
        .filter(function (d) { return d !== blitz.champion; });
    }
    return blitz.pool.shift() || blitz.champion;
  }

  // "Ready?" and a 3-2-1 count is what makes the clock feel like it starts
  // on purpose, instead of the clock just being quietly already running by
  // the time the first pair of cards finishes fading in.
  function startBlitz() {
    if (!premium('Blitz')) return;
    hideLanding();
    if (blitz.readyTimer) { clearTimeout(blitz.readyTimer); blitz.readyTimer = null; }

    blitz.pool = shuffled(favouredDishes().slice(0, 30).map(function (r) { return r.item; }));
    blitz.champion = blitz.pool.shift();
    blitz.challenger = blitzChallenger();
    blitz.wild = null;
    // The first rounds are always plain: a twist on the opening pick is not a
    // twist, it is just what this game looks like.
    blitz.special = null;
    blitz.sinceSpecial = 0;
    blitz.bonusSpent = 0;
    blitz.side = Math.random() < 0.5 ? 'a' : 'b';
    blitz.count = 0;
    blitz.streak = 0;
    blitz.lastPickAt = 0;
    blitz.pending = [];
    blitz.beaten = [];
    blitz.secondsLeft = BLITZ_SECONDS;
    blitz.live = false;

    setView('decide');
    setPanel('blitz-ready');
    runBlitzCountdown(3);
  }

  $('blitz-ready-cancel').addEventListener('click', function () {
    if (blitz.readyTimer) { clearTimeout(blitz.readyTimer); blitz.readyTimer = null; }
    goHome();
  });

  function runBlitzCountdown(n) {
    // Cancelled the moment the player is no longer looking at this screen —
    // switching tabs mid-countdown should not silently start a clock nobody
    // is watching.
    if (view !== 'decide' || panel !== 'blitz-ready') { blitz.readyTimer = null; return; }

    var el = $('blitz-countdown');
    el.textContent = n > 0 ? String(n) : 'Go!';
    replay(el);
    Sound.tick();

    if (n > 0) {
      blitz.readyTimer = setTimeout(function () { runBlitzCountdown(n - 1); }, 700);
      return;
    }

    blitz.readyTimer = setTimeout(function () {
      blitz.readyTimer = null;
      blitz.live = true;
      $('blitz-reaction').textContent = '';
      $('blitz-clock').classList.remove('is-low');
      $('blitz-clock').textContent = String(BLITZ_SECONDS);
      $('blitz-count').textContent = '0 picks so far';
      setPanel('blitz');
      paintBlitz();
      Sound.win();
      if (blitz.timer) clearInterval(blitz.timer);
      blitz.timer = setInterval(tickBlitz, 1000);
    }, 500);
  }

  // Self-healing: if the player wanders off to another tab mid-run, the next
  // tick banks what was learned and lets the clock go rather than firing the
  // result panel behind their back on a screen they have since left.
  function tickBlitz() {
    if (view !== 'decide' || panel !== 'blitz') {
      if (blitz.timer) { clearInterval(blitz.timer); blitz.timer = null; }
      if (blitz.live) { blitz.live = false; bankBlitz(); }
      return;
    }
    blitz.secondsLeft--;
    $('blitz-clock').textContent = String(Math.max(blitz.secondsLeft, 0));
    $('blitz-clock').classList.toggle('is-low', blitz.secondsLeft <= 10 && blitz.secondsLeft > 0);
    if (blitz.secondsLeft <= 0) finishBlitz();
  }

  function paintBlitz() {
    var champSide = blitz.side;
    var challSide = champSide === 'a' ? 'b' : 'a';
    paintKnockoutCardOn('blitz', champSide, blitz.champion);
    paintKnockoutCardOn('blitz', challSide, blitz.challenger);
    replay($(challSide === 'a' ? 'blitz-a' : 'blitz-b'));

    var special = blitz.special;
    var kind = special ? special.kind : '';

    var wildOn = kind === 'wild' && !!blitz.wild;
    $('blitz-c').hidden = !wildOn;
    if (wildOn) {
      paintKnockoutCardOn('blitz', 'c', blitz.wild);
      replay($('blitz-c'));
    }

    // Blind hides the names, not the food: the picture and the description
    // stay, so it is still a choice about dinner rather than a coin toss.
    var picks = $('blitz-picks');
    picks.classList.toggle('is-blind', kind === 'blind');
    if (kind === 'blind') {
      ['a', 'b', 'c'].forEach(function (side) { $('blitz-' + side + '-label').textContent = '\u2014'; });
    }

    var badge = $('blitz-special');
    badge.hidden = !special;
    if (special) {
      badge.textContent = special.badge;
      replay(badge);
    }

    $('blitz-title').textContent = special ? special.title : 'Quick \u2014 which one?';
  }

  // Shared with Knockout's card painter — same three fields, different id
  // prefix — so a change to one card layout does not have to be made twice.
  function paintKnockoutCardOn(prefix, side, dish) {
    $(prefix + '-' + side + '-icon').textContent = dish.icon;
    $(prefix + '-' + side + '-label').textContent = dish.name;
    $(prefix + '-' + side + '-note').textContent = dish.blurb;
  }

  // Every pick has a winner and one or two losers now that a wildcard round
  // can put three dishes on screen at once — the taste model hears about
  // all of them, not just whichever pair happened to be on cards a/b.
  function chooseBlitz(which) {
    if (view !== 'decide' || panel !== 'blitz' || busy || !blitz.live) return;
    var champSide = blitz.side;
    var challSide = champSide === 'a' ? 'b' : 'a';

    var special = blitz.special;
    var kind = special ? special.kind : '';

    var winner, losers;
    if (kind === 'wild' && which === 'c' && blitz.wild) {
      winner = blitz.wild;
      losers = [blitz.champion, blitz.challenger];
    } else if (kind === 'reverse') {
      // The card you tapped is the one you would not eat, so it is the one
      // that loses. Two cards only — reverse never runs with a wildcard out,
      // because "which of these three would you not" has two right answers.
      winner = which === champSide ? blitz.challenger : blitz.champion;
      losers = [which === champSide ? blitz.champion : blitz.challenger];
    } else {
      winner = which === champSide ? blitz.champion : blitz.challenger;
      losers = [which === champSide ? blitz.challenger : blitz.champion];
      if (kind === 'wild' && blitz.wild) losers.push(blitz.wild);
    }

    // Double counts the same opinion twice rather than inventing a second one:
    // it is the round that is worth more, not a different thing being said.
    var times = kind === 'double' ? 2 : 1;
    losers.forEach(function (loser) {
      var votes = votesFrom(winner, loser);
      for (var n = 0; n < times; n++) blitz.pending = blitz.pending.concat(votes);
      // Kept so "not quite" at the end has somewhere to go: the most recent
      // losers are the ones that made it furthest against the champion.
      if (blitz.beaten.indexOf(loser) < 0) blitz.beaten.unshift(loser);
    });

    // The streak is the whole answer to "this gets boring fast": tap within
    // BLITZ_STREAK_MS of the last pick and it climbs; hesitate and it drops
    // back to one, so speed is worth chasing for its own sake, not just XP.
    var now = Date.now();
    blitz.streak = (blitz.lastPickAt && now - blitz.lastPickAt <= BLITZ_STREAK_MS) ? blitz.streak + 1 : 1;
    blitz.lastPickAt = now;

    var offered = 0;
    if (blitz.streak % 5 === 0) offered += BLITZ_STREAK_BONUS;
    // Paid whichever card was tapped, which is what keeps it from being a
    // reason to pick one dish over the other.
    if (kind === 'bonus') offered += BLITZ_BONUS_SECONDS;
    var bonus = offered ? addBlitzSeconds(offered) : 0;

    blitz.champion = winner;
    blitz.challenger = blitzChallenger();
    blitz.special = nextBlitzSpecial();
    blitz.wild = blitz.special && blitz.special.kind === 'wild' ? blitzChallenger() : null;
    blitz.side = Math.random() < 0.5 ? 'a' : 'b';
    blitz.count++;

    Sound.tick();
    $('blitz-count').textContent = blitz.count + (blitz.count === 1 ? ' pick so far' : ' picks so far');
    // On a blind round this line is the reveal, so it names the dish either
    // way; the suffix says what the round paid rather than which twist it was.
    $('blitz-reaction').textContent = winner.icon + ' ' + winner.name +
      (kind === 'double' ? ' \u2014 counted twice!'
        : bonus ? ' \u2014 +' + bonus + 's!'
        : '.');
    replay($('blitz-reaction'));

    var streakEl = $('blitz-streak');
    if (blitz.streak >= 3) {
      streakEl.hidden = false;
      $('blitz-streak-n').textContent = String(blitz.streak);
      streakEl.classList.toggle('is-hot', blitz.streak >= 8);
      replay(streakEl);
    } else {
      streakEl.hidden = true;
    }

    paintBlitz();
  }

  function bankBlitz() {
    var xp = 0;
    blitz.pending.forEach(function (vote) { xp += progress.recordAnswer(vote.tag, vote.value); });
    blitz.pending = [];
    progress.save();
    applyTaste();
    return xp;
  }

  function finishBlitz() {
    if (blitz.timer) { clearInterval(blitz.timer); blitz.timer = null; }
    if (!blitz.live) return;
    blitz.live = false;

    var champion = blitz.champion;
    var count = blitz.count;
    var banked = bankBlitz();
    // Most recently beaten first: those are the ones that got closest to
    // lasting, and the only ranking a sixty-tap run actually produces.
    var alsoRan = blitz.beaten.filter(function (d) { return d !== champion; }).slice(0, 7);

    resetGame();
    shortcut = true;
    sessionXp = banked;
    rankedItems = [champion].concat(alsoRan);

    setPanel('result');
    $('result-icon').classList.add('is-landed');
    showResult(champion, { animate: false });
    $('result-eyebrow').textContent = count > 0
      ? count + (count === 1 ? ' pick' : ' picks') + ' before the clock ran out'
      : 'Time\u2019s up';
    $('reject-btn').textContent = 'Not quite';
    $('accept-btn').disabled = false;
    $('reject-btn').disabled = false;
    Sound.win();
  }

  $('blitz-btn').addEventListener('click', startBlitz);
  $('blitz-restart').addEventListener('click', startBlitz);
  $('blitz-stop').addEventListener('click', finishBlitz);
  $('blitz-a').addEventListener('click', function () { chooseBlitz('a'); });
  $('blitz-b').addEventListener('click', function () { chooseBlitz('b'); });
  $('blitz-c').addEventListener('click', function () { chooseBlitz('c'); });

  /* ------------------------------------------------------------ week plan */
  var DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  function buildWeek() {
    var dishes = Taste.week(progress.state, Data.ITEMS, {
      now: Date.now(),
      exclude: progress.allRules()
    });
    progress.state.plan = {
      at: Date.now(),
      dishes: dishes.map(function (d) { return { name: d.name, icon: d.icon }; })
    };
    progress.save();
    return progress.state.plan;
  }

  function renderWeekPanel() {
    var plan = progress.state.plan;
    var list = $('week-list');
    list.innerHTML = '';
    if (!plan) return;

    // Days run from the day it was planned, not from a notional Monday.
    var start = new Date(plan.at).getDay();
    plan.dishes.forEach(function (entry, i) {
      var dish = dishByName(entry.name);
      var li = document.createElement('li');
      li.style.animationDelay = (i * 45) + 'ms';
      li.innerHTML = '<span class="week-day"></span><span class="week-art" aria-hidden="true"></span>' +
        '<button class="week-name plain"></button>';
      li.querySelector('.week-day').textContent = DAY_NAMES[(start + i + 6) % 7];
      li.querySelector('.week-art').textContent = entry.icon;
      var btn = li.querySelector('.week-name');
      btn.type = 'button';
      btn.textContent = entry.name;
      btn.addEventListener('click', function () { if (dish) openSheet(dish); });
      list.appendChild(li);
    });

    $('week-intro').textContent = plan.dishes.length +
      ' dishes, no two the same sort of thing. Tap one to read about it.';
  }

  /* ------------------------------------------------- something new */
  /*
   * A few questions, then suggestions argued from what somebody already liked.
   *
   * WHAT IT SENDS. Dish names, and only dish names: the ones rated well and
   * the ones landed on most, plus two answers about tonight. No profile, no
   * tag weights, nothing about who anybody is — the model is being asked to
   * reason about food, and everything it does not need is something not to
   * send.
   *
   * WHAT IT TRUSTS BACK. Nothing. /api/suggest matches every name it returns
   * against the real catalogue and drops the rest, so a dish this app does not
   * have can never reach this screen. That matters more than it sounds: an
   * invented dish has no recipe and no page, so it would be a dead end in the
   * app's own voice.
   *
   * WHY IT IS TWO QUESTIONS AND NOT EIGHT. The questionnaire already exists
   * and is better at that job. This is for the other case — you are not asking
   * it to decide, you are asking what you have been missing — so it needs
   * enough to know the occasion and no more.
   */
  var PICKS_QUESTIONS = [
    { key: 'occasion', text: 'What kind of evening is it?',
      options: ['Quick and easy', 'Worth some effort', 'Feeding other people', 'Comfort, badly needed'] },
    { key: 'mood', text: 'And what are you after?',
      options: ['Something new to me', 'Close to what I know', 'Lighter than usual', 'Properly indulgent'] }
  ];

  var picks = { at: 0, answers: {}, busy: false };

  function startPicks() {
    if (!premium('Something new')) return;
    hideLanding();
    picks.at = 0;
    picks.answers = {};
    picks.busy = false;
    setView('decide');
    setPanel('picks');
    paintPicksQuestion();
  }

  function paintPicksQuestion() {
    var q = PICKS_QUESTIONS[picks.at];
    $('picks-ask').hidden = false;
    $('picks-waiting').hidden = true;
    $('picks-out').hidden = true;
    $('picks-error').hidden = true;
    $('picks-step').textContent = 'Question ' + (picks.at + 1) + ' of ' + PICKS_QUESTIONS.length;
    $('picks-question').textContent = q.text;

    var wrap = $('picks-options');
    wrap.innerHTML = '';
    q.options.forEach(function (label) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'knob';
      btn.textContent = label;
      btn.addEventListener('click', function () {
        Sound.tick();
        picks.answers[q.key] = label;
        picks.at += 1;
        if (picks.at < PICKS_QUESTIONS.length) return paintPicksQuestion();
        askPicks();
      });
      wrap.appendChild(btn);
    });
  }

  /*
   * What this person has actually enjoyed, in the order it is worth knowing.
   *
   * Rated 'loved' first, because that is a judgement they made on purpose;
   * then the dishes they keep landing on, which is a judgement they made
   * without noticing. Anything rated 'no' goes on the do-not-suggest list —
   * being handed back something you rejected is the fastest way to stop
   * trusting a recommendation.
   */
  function pickedHistory() {
    var st = progress.state;
    var ratings = st.ratings || {};
    var counts = st.picks || {};
    var loved = [];
    var no = [];
    Object.keys(ratings).forEach(function (name) {
      if (ratings[name] === 'loved') loved.push(name);
      else if (ratings[name] === 'no') no.push(name);
    });
    var often = Object.keys(counts)
      .filter(function (n) { return loved.indexOf(n) === -1 && no.indexOf(n) === -1; })
      .sort(function (a, b) { return counts[b] - counts[a]; })
      .slice(0, 16);
    // Banned dishes are a standing rule, not a preference, so they go on the
    // same list as the ones that were rejected.
    Object.keys(st.banned || {}).forEach(function (n) { if (no.indexOf(n) === -1) no.push(n); });
    return { liked: loved.concat(often), avoid: no };
  }

  function askPicks() {
    if (picks.busy) return;
    picks.busy = true;
    $('picks-ask').hidden = true;
    $('picks-error').hidden = true;
    $('picks-out').hidden = true;
    $('picks-waiting').hidden = false;
    $('picks-step').textContent = 'Thinking';

    var history = pickedHistory();
    fetch('/api/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ liked: history.liked, avoid: history.avoid, answers: picks.answers })
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (body) {
        return { ok: res.ok, body: body };
      });
    }).catch(function () {
      return { ok: false, body: {} };
    }).then(function (answer) {
      picks.busy = false;
      $('picks-waiting').hidden = true;
      if (answer.ok && answer.body && answer.body.picks && answer.body.picks.length) {
        return paintPicks(answer.body.picks, history.liked.length);
      }
      $('picks-step').textContent = 'No luck';
      $('picks-error').hidden = false;
      $('picks-error-text').textContent = answer.body && answer.body.error === 'busy'
        ? 'The suggester is busy — that one is on us, not you.'
        : 'That did not come back. It usually works second time.';
    });
  }

  function paintPicks(list, known) {
    $('picks-step').textContent = 'Worth a try';
    $('picks-out').hidden = false;
    $('picks-intro').textContent = known
      ? 'Chosen from what you have liked before — none of these are dishes you already order.'
      : 'You have not rated much yet, so these are a starting point rather than a read on you.';

    var ul = $('picks-list');
    ul.innerHTML = '';
    list.forEach(function (pick, i) {
      var dish = dishByName(pick.name);
      var li = document.createElement('li');
      li.className = 'picks-row';
      li.style.animationDelay = (i * 70) + 'ms';
      li.innerHTML = '<span class="picks-art" aria-hidden="true"></span>' +
        '<button class="picks-name plain" type="button"></button>' +
        '<span class="picks-why"></span>';
      li.querySelector('.picks-art').textContent = pick.icon || (dish && dish.icon) || '';
      var btn = li.querySelector('.picks-name');
      btn.textContent = pick.name;
      btn.addEventListener('click', function () { if (dish) openSheet(dish); });
      // Written by a model, so it goes in as text and never as markup.
      li.querySelector('.picks-why').textContent = pick.why || '';
      ul.appendChild(li);
    });
  }

  $('picks-btn').addEventListener('click', function () { Sound.tick(); startPicks(); });
  $('picks-again').addEventListener('click', function () { Sound.tick(); startPicks(); });
  $('picks-retry').addEventListener('click', function () { Sound.tick(); askPicks(); });
  $('picks-back').addEventListener('click', goHome);
  $('picks-done').addEventListener('click', goHome);

  /* ------------------------------------------------------------ the menu */
  /*
   * Three courses that belong on the same table.
   *
   * The catalogue has no idea what a course is — there is no `starter` tag and
   * there should not be, because most of these dishes can be either depending
   * on how much of it you put on the plate. Sixty dishes read as a plausible
   * starter and sixty-seven as a plausible main, and thirty-six of them are
   * the same dishes. So nothing is classified; everything is scored, and the
   * best fit for each slot wins.
   *
   * The second half of the job is that the three have to get along. A fried
   * starter before a fried main before a fried pudding is three of the same
   * evening, so a course is marked down for repeating what has already been
   * chosen — which is what stops this being three separate random picks with
   * a menu drawn round them.
   */
  // `word` is how the course is named when it is being agreed to, because
  // "That's it" three times running tells nobody which it they just agreed
  // to. The labels are the table's order; the words are the plate's name.
  var COURSES = [
    { id: 'starter', label: 'To start', word: 'the starter',
      likes: ['light', 'fresh', 'shareable', 'soupy', 'crunchy'],
      dislikes: ['filling', 'indulgent', 'carby'] },
    { id: 'main', label: 'Then', word: 'the main',
      likes: ['filling', 'hot', 'comfort', 'carby', 'meat'],
      dislikes: ['light', 'breakfast'] },
    { id: 'pudding', label: 'And after', word: 'pudding',
      likes: ['sweet', 'indulgent', 'soft', 'fruity'],
      dislikes: [] }
  ];

  // What a course must never be, whatever it scores.
  function courseAllows(course, dish) {
    var sweet = (dish.tags.sweet || 0) > 0;
    var drink = (dish.tags.drink || 0) > 0;
    if (drink) return false;                         // a menu is food
    if (course.id === 'pudding') return sweet;
    return !sweet;
  }

  function courseScore(course, dish, taken) {
    var score = 0;
    course.likes.forEach(function (t) { score += (dish.tags[t] || 0) * 2; });
    course.dislikes.forEach(function (t) { score -= (dish.tags[t] || 0) * 2; });

    /*
     * Marked down for being the same evening twice. Not forbidden — sometimes
     * the best main really does share a tag with the starter — but enough that
     * a menu of three fried things loses to a menu that goes somewhere.
     */
    taken.forEach(function (other) {
      Object.keys(dish.tags).forEach(function (t) {
        if ((other.tags[t] || 0) > 0 && (dish.tags[t] || 0) > 0) score -= 0.6;
      });
    });

    return score;
  }

  /*
   * Chosen from the good-enough, not the single best.
   *
   * Scoring alone put Fattoush at the top of every starter this catalogue can
   * produce — five menus in a row opened with it — because one dish really is
   * the highest-scoring answer and a small random nudge cannot outvote a real
   * gap. Endless already had this problem and solved it with a band of
   * plausible partners to draw from (ENDLESS_BAND); this is the same idea.
   * A menu that is always the same menu is not a menu.
   */
  var MENU_BAND = 8;

  /*
   * Build a menu, optionally around courses that are staying put.
   *
   * `keep` maps a course id to a dish that has been kept and must come back
   * unchanged; `avoid` maps a course id to a dish that must NOT come back,
   * which is what makes "swap this one" mean something in a catalogue where
   * one dish can be the best answer several times running.
   *
   * Everything kept goes into `taken` before any picking starts, so a course
   * being re-chosen is scored against what is staying rather than against
   * nothing. Keep the main and the starter now knows about it — which is the
   * whole reason keeping is worth having rather than just rerolling until
   * something sticks.
   */
  function buildMenu(opts) {
    var keep = (opts && opts.keep) || {};
    var avoid = (opts && opts.avoid) || {};

    // favouredDishes has already applied bans, avoids and snoozes, so nothing
    // chosen here can break a rule somebody set.
    var pool = favouredDishes().map(function (r) { return r.item; });
    if (pool.length < 12) pool = Data.ITEMS.slice();

    var taken = [];
    COURSES.forEach(function (course) {
      if (keep[course.id]) taken.push(keep[course.id]);
    });

    var menu = [];
    COURSES.forEach(function (course) {
      if (keep[course.id]) {
        menu.push({ course: course, dish: keep[course.id], kept: true });
        return;
      }
      var no = avoid[course.id] ? [avoid[course.id].name] : [];
      var best = pickCourse(course, taken, no, pool);
      // A course with nothing eligible is left out rather than filled with
      // something wrong — a vegetarian with every pudding banned gets two
      // courses, not a steak for afters.
      if (best) { taken.push(best); menu.push({ course: course, dish: best, kept: false }); }
    });
    return menu;
  }

  /*
   * One course, scored against what is already on the table.
   *
   * Pulled out of buildMenu because the run (below) picks a single course at a
   * time and has to score it against the courses already agreed to — the same
   * arithmetic, asked one plate at a time instead of three. `refused` is a
   * list of names rather than one dish, because somebody can turn down the
   * same course three times and none of those three should come back.
   *
   * Not a top pick: a band of the best few, chosen from at random. Always
   * returning the single highest score would mean the same starter every
   * evening for the same profile, which is the opposite of what this is for.
   */
  function pickCourse(course, taken, refused, pool) {
    if (!pool) {
      pool = favouredDishes().map(function (r) { return r.item; });
      if (pool.length < 12) pool = Data.ITEMS.slice();
    }
    refused = refused || [];
    var ranked = [];
    pool.forEach(function (dish) {
      if (!courseAllows(course, dish)) return;
      if (taken.indexOf(dish) !== -1) return;
      if (refused.indexOf(dish.name) !== -1) return;
      ranked.push({ dish: dish, score: courseScore(course, dish, taken) });
    });
    ranked.sort(function (a, b) { return b.score - a.score; });
    var band = ranked.slice(0, MENU_BAND);
    return band.length ? band[Math.floor(Math.random() * band.length)].dish : null;
  }

  /*
   * The finished menu on screen.
   *
   * Held here rather than read back out of the DOM: a course is identified by
   * its dish, and a dish is an object from the catalogue, not a name.
   */
  var menuNow = [];

  /*
   * One course, as a row of a finished menu.
   *
   * No buttons on it any more. Keep and Swap lived here, and between them they
   * turned the menu into a slot machine: whatever the model chose could be
   * shuffled away one course at a time until three dishes somebody already
   * fancied happened to line up. Choosing is now done during the run, one
   * course at a time, before the row exists — so by the time a row is drawn
   * the answer is settled and there is nothing left to press.
   *
   * The name is still a button, because reading about a dish is not changing
   * it.
   */
  function courseRow(entry, i) {
    var li = document.createElement('li');
    li.className = 'menu-course';
    li.style.animationDelay = (i * 70) + 'ms';
    li.innerHTML = '<span class="menu-when"></span>' +
      '<span class="menu-art" aria-hidden="true"></span>' +
      '<button class="menu-name plain" type="button"></button>' +
      '<span class="menu-note"></span>';

    li.querySelector('.menu-when').textContent = entry.course.label;
    li.querySelector('.menu-art').textContent = entry.dish.icon;
    /*
     * The model's reason, when there is one, in place of the dish's own
     * blurb. The blurb says what the dish is; the reason says why it is in
     * THIS meal, which is the only thing asking a model bought us. A locally
     * scored course has no reason to give and falls back to the blurb.
     */
    li.querySelector('.menu-note').textContent = entry.why || entry.dish.blurb;

    var name = li.querySelector('.menu-name');
    name.textContent = entry.dish.name;
    name.addEventListener('click', function () { Sound.tick(); openSheet(entry.dish); });

    return li;
  }

  /* ------------------------------------------------------------- the run */
  /*
   * A MENU IS A RUN OF COURSES, NOT A PAGE OF THEM.
   *
   * All three used to arrive together. That sounds more generous and is
   * worse: with everything visible at once the only sensible move is to judge
   * the three as a set, reject the set, and press again — so the thing being
   * chosen was never a meal, it was a hand of cards. It also made saying yes
   * meaningless, because there was nothing left to say yes to.
   *
   * So: the starter alone, then the main, then the pudding, and each one only
   * after the last has been agreed. Two things follow from that, and both are
   * the point.
   *
   *   - Agreeing is final. A course that has been said yes to moves up into
   *     the settled list and has no buttons on it. You cannot go back and
   *     re-roll the starter once you have seen the main, which is exactly the
   *     hole the old screen had.
   *
   *   - Every course after the first is chosen against the ones already
   *     agreed (see pickCourse and courseScore's penalty for repeating a
   *     tag), so a heavy starter really does get a lighter main. That was
   *     always the arithmetic; nothing was ever in a position to use it.
   *
   * MENU_SWITCHES_PER_COURSE is the pressure valve. A first suggestion you
   * would never eat should not be the whole evening, but an unlimited switch
   * is the slot machine again with one extra tap. Three, per course, on the
   * free version — so nine across a menu, which is plenty to land somewhere
   * you are happy with and not enough to grind the catalogue. Premium is
   * unlimited, because the thing being sold is not having to ration this.
   */
  var MENU_SWITCHES_PER_COURSE = 3;

  /*
   * The run in progress, or null.
   *
   * `menu` is what the model (or the local scorer) proposed, one entry per
   * course, edited in place as courses are switched. `step` is how far down it
   * we are — and because a switch replaces the entry at `step` rather than
   * appending, everything before `step` is by definition what has been agreed,
   * so there is no second list to keep in step with this one. `used` is
   * switches spent on THIS course only and resets at each one; `refused`
   * remembers every dish turned down for a course id, so none of them comes
   * back later in the same run.
   */
  var menuRun = null;

  /* Is there a finished menu worth returning to rather than re-asking? */
  var menuWrapped = false;

  /*
   * A RUN HAS TO SURVIVE THE TAB CLOSING.
   *
   * The go is spent the moment the model answers, and the menu is then agreed
   * to one course at a time. Held only in memory, a reload between the starter
   * and the pudding would cost somebody the menu AND the next two days of
   * allowance, for nothing they did wrong — which is the single worst thing
   * this feature could do to a Standard profile.
   *
   * Stored as course ids and dish names. Dish objects would be stale copies of
   * a catalogue that gets added to, and a name that has since gone is a run
   * that should be dropped rather than half-restored.
   */
  function thinCourse(e) { return { c: e.course.id, n: e.dish.name, w: e.why || '' }; }

  function fatCourse(t) {
    var course = COURSES.filter(function (x) { return x.id === t.c; })[0];
    var dish = dishByName(t.n);
    return course && dish ? { course: course, dish: dish, why: t.w || '' } : null;
  }

  function thinMenu(menu) { return menu.map(thinCourse); }

  function fatMenu(thin) {
    if (!thin || !thin.length) return null;
    var out = [];
    for (var i = 0; i < thin.length; i++) {
      var e = fatCourse(thin[i]);
      if (!e) return null;                      // a dish has gone: drop the lot
      out.push(e);
    }
    return out;
  }

  function saveRun() {
    progress.state.menuRun = menuRun ? {
      menu: thinMenu(menuRun.menu),
      step: menuRun.step,
      used: menuRun.used,
      refused: menuRun.refused
    } : null;
    progress.save();
  }

  /* Pick the run back up after a reload, or answer no. */
  function restoreRun() {
    var saved = progress.state.menuRun;
    if (!saved || !saved.menu) return false;
    var menu = fatMenu(saved.menu);
    if (!menu || saved.step >= menu.length) { progress.state.menuRun = null; progress.save(); return false; }
    menuRun = {
      menu: menu,
      step: saved.step || 0,
      used: saved.used || 0,
      refused: saved.refused || {}
    };
    return true;
  }

  function restoreDone() {
    var menu = fatMenu(progress.state.menuDone);
    if (!menu) return false;
    menuNow = menu;
    return true;
  }

  function startRun(menu) {
    menuRun = { menu: menu, step: 0, used: 0, refused: {} };
    menuWrapped = false;
    progress.state.menuDone = null;
    saveRun();
    menuPanels('menu-run');
    paintRun(true);
  }

  /* What has been agreed, in order, and the dishes in it. */
  function settledCourses() {
    return menuRun.menu.slice(0, menuRun.step);
  }

  function settledDishes() {
    return settledCourses().map(function (e) { return e.dish; });
  }

  function paintRun(arriving) {
    if (!menuRun) return;

    // What is already agreed, above the course being asked about. Drawn every
    // time rather than appended, so the run survives leaving the tab and
    // coming back.
    var settled = $('menu-settled');
    var agreed = settledCourses();
    settled.innerHTML = '';
    agreed.forEach(function (entry, i) { settled.appendChild(courseRow(entry, i)); });
    settled.hidden = !agreed.length;

    var entry = menuRun.menu[menuRun.step];
    if (!entry) return finishRun();

    $('menu-now-step').textContent =
      'Course ' + (menuRun.step + 1) + ' of ' + menuRun.menu.length;
    $('menu-now-when').textContent = entry.course.label;
    $('menu-now-art').textContent = entry.dish.icon;
    $('menu-now-why').textContent = entry.why || entry.dish.blurb;
    $('menu-take-label').textContent = 'That’s ' + entry.course.word;

    var name = $('menu-now-name');
    name.textContent = entry.dish.name;
    name.setAttribute('aria-label', 'Read about ' + entry.dish.name);

    /*
     * How many switches are left, said plainly. A budget nobody can see is
     * indistinguishable from a button that randomly stops working.
     */
    var left = isPlus() ? Infinity : Math.max(0, MENU_SWITCHES_PER_COURSE - menuRun.used);
    var line = $('menu-switches');
    var swap = $('menu-switch');
    if (left === Infinity) {
      line.textContent = 'Change it as many times as you like.';
      swap.disabled = false;
      swap.textContent = 'Something else';
    } else if (left === 0) {
      line.textContent = 'That is all three changes on this course. Premium changes as ' +
        'many times as you like.';
      swap.disabled = true;
      swap.textContent = 'No changes left';
    } else {
      line.textContent = left === 1
        ? 'One more change on this course.'
        : left + ' changes left on this course.';
      swap.disabled = false;
      swap.textContent = 'Something else';
    }

    // Arriving is an event; a switch is a correction. Only the first gets the
    // entrance and the sound, or every tap would feel like a new course.
    var card = $('menu-now');
    card.classList.remove('is-arriving', 'is-swapped');
    void card.offsetWidth;                       // restart the animation
    if (!reduceMotion) card.classList.add(arriving ? 'is-arriving' : 'is-swapped');
    if (arriving) Sound.reveal();
  }

  /*
   * Yes to this course. Final, deliberately.
   *
   * The pudding is the end of the run for everybody; what differs afterwards
   * is whether there is another go to be had, and paintMenuTail says which.
   */
  function takeCourse() {
    if (!menuRun) return;
    var entry = menuRun.menu[menuRun.step];
    if (!entry) return;

    // Agreeing to a course is progress, not a tap — the same note the app
    // uses everywhere else something moves forward.
    Sound.climb();
    menuRun.step += 1;
    menuRun.used = 0;

    if (menuRun.step >= menuRun.menu.length) return finishRun();
    saveRun();
    paintRun(true);
  }

  /*
   * Not that one. Re-picks THIS course only, against what is already agreed.
   *
   * Local, not another model call: one menu is one request, and a switch is a
   * correction inside it rather than a fresh ask. The reason line goes with
   * it — the model never saw this dish, so printing its sentence under a dish
   * it did not choose would be a lie about where the sentence came from.
   */
  function switchCourse() {
    if (!menuRun) return;
    var entry = menuRun.menu[menuRun.step];
    if (!entry) return;

    if (!isPlus() && menuRun.used >= MENU_SWITCHES_PER_COURSE) {
      Sound.reject();
      return toast('\u{1F504}', 'That is all three',
        'Three changes a course on the free version. Premium changes as many times ' +
        'as you like.');
    }

    var id = entry.course.id;
    var refused = menuRun.refused[id] || (menuRun.refused[id] = []);
    if (refused.indexOf(entry.dish.name) === -1) refused.push(entry.dish.name);

    var next = pickCourse(entry.course, settledDishes(), refused);
    // Nothing else this course could be: say so rather than repaint the same
    // dish and look like a dead button. Costs nothing, because nothing changed.
    if (!next) {
      Sound.reject();
      return toast('\u{1F37D}\u{FE0F}', 'Nothing else fits',
        'Your rules have left only one thing that works for that course.');
    }

    Sound.tick();
    menuRun.menu[menuRun.step] = { course: entry.course, dish: next, why: '' };
    menuRun.used += 1;
    saveRun();
    paintRun(false);
  }

  /* The pudding was agreed. Show the meal, and celebrate it. */
  function finishRun() {
    var menu = menuRun ? settledCourses() : [];
    menuRun = null;
    if (!menu.length) { saveRun(); return menuPanels('menu-empty'); }
    menuWrapped = true;
    // The run is over; the meal it produced is what is worth keeping, and it
    // is worth keeping because "what am I cooking tonight" gets asked again at
    // six o'clock, on a reloaded tab.
    progress.state.menuRun = null;
    progress.state.menuDone = thinMenu(menu);
    progress.save();
    menuPanels('menu-wrap-view');
    landMenu(menu);
  }

  /*
   * What happens after the meal, which is not the same question for everybody.
   *
   * Premium goes again straight away. A Standard profile that has spent its go
   * is told when the next one is — not that the feature is not theirs, because
   * they just used it. A Standard profile whose go was NOT spent (the model
   * did not answer and the local scorer stood in) still has it, and gets the
   * button.
   */
  function paintMenuTail() {
    var another = isPlus() || menuAllowed();
    $('menu-again').hidden = !another;
    $('menu-after').hidden = another;
    if (!another) {
      $('menu-after-line').textContent =
        'That is your menu for now. The next free one is ready ' + menuWaitWords() + '.';
    }
  }

  /*
   * The menu landing, as an event rather than a repaint.
   *
   * Finishing one of these is the most work this app asks of anybody — five
   * questions or a typed sentence, a wait on a model, then three courses to
   * agree to one at a time — and it used to end with three rows quietly
   * appearing. Every other place in here that costs effort pays it back: a
   * decision gets a sound, confetti and XP; a badge gets a toast.
   *
   * So the courses walk in in the order they will be eaten, with the confetti
   * timed to the last one so it lands on a finished menu and not on an empty
   * list.
   */
  function landMenu(menu) {
    paintMenu(menu, true);
    Sound.reveal();

    var last = 240 + (menu.length - 1) * 220;
    setTimeout(function () {
      if (view !== 'menu') return;
      Sound.badge();
      if (!reduceMotion) Confetti.burst({ y: window.innerHeight * 0.3 });
    }, last);
  }

  /* Draw a menu that has already been chosen. Chooses nothing itself. */
  function paintMenu(menu, staged) {
    menuNow = menu.map(function (e) {
      return { course: e.course, dish: e.dish, why: e.why || '' };
    });

    var list = $('menu-list');
    list.innerHTML = '';
    menuNow.forEach(function (entry, i) {
      var row = courseRow(entry, i);
      // A staged arrival walks the courses in one at a time; a repaint has no
      // reason to re-animate what did not move.
      if (staged) row.style.animationDelay = (240 + i * 220) + 'ms';
      list.appendChild(row);
    });

    var cooking = menuNow.filter(function (e) { return Recipes.has(e.dish.name); }).length;
    $('menu-note').textContent = cooking === menuNow.length
      ? 'Every course has a recipe behind it — tap one to read it.'
      : 'Tap a course to read about it.';

    paintMenuTail();
  }

  /*
   * Paint the Menu section for whoever is looking at it.
   *
   * Three states, and only one of them is a menu. A free profile gets the
   * pitch instead of a toast, because this is now somewhere you can arrive by
   * tapping a tab in the rail: a tab that answers with a disappearing message
   * and an empty screen reads as broken, not as locked. A profile whose own
   * rules have ruled out too much gets told that, rather than a blank list.
   *
   * Called from setView, so every route in — the rail, the button on the
   * opening screen, a reload with the section already open — lands here.
   */
  /* ------------------------------------------------------ the menu, asked for */
  /*
   * ONE GO EVERY COUPLE OF DAYS ON STANDARD.
   *
   * This section used to be Premium or nothing, which meant a Standard
   * profile could see the pitch for it and never once find out whether it was
   * any good. A feature nobody has used is a feature nobody misses. One go
   * every forty-eight hours is enough to be worth having and not enough to be
   * the reason to not pay.
   *
   * Stored as the timestamp of the last menu rather than a count, because
   * that is the only fact needed: a count would also need resetting, and
   * something has to decide when, and that is a second thing to get wrong.
   *
   * Spent is not the same state as locked, and they say different things. A
   * spent profile has had the thing and is told when the next one is due; a
   * locked one never had it. Being told "this is not for you" when you used
   * it yesterday is the kind of wrong that reads as a bug.
   */
  var MENU_EVERY_MS = 2 * 24 * 60 * 60 * 1000;

  function menuNextAt() {
    return (progress.state.menuAt || 0) + MENU_EVERY_MS;
  }

  function menuAllowed() {
    return isPlus() || Date.now() >= menuNextAt();
  }

  /* "in about five hours", "tomorrow" — a wait nobody has to do arithmetic on. */
  function menuWaitWords() {
    var ms = menuNextAt() - Date.now();
    if (ms <= 0) return 'now';
    var hours = Math.ceil(ms / 3600000);
    if (hours <= 1) return 'in under an hour';
    if (hours < 24) return 'in about ' + hours + ' hours';
    var days = Math.round(hours / 24);
    return days <= 1 ? 'tomorrow' : 'in ' + days + ' days';
  }

  function paintMenuLeft() {
    var el = $('menu-left');
    if (isPlus()) { el.hidden = true; return; }
    el.hidden = false;
    el.textContent = 'One menu every couple of days on the free version. ' +
      'Premium writes as many as you like.';
  }

  /* Every panel in this section, so each state can be set by naming it. */
  function menuPanels(which) {
    ['menu-ask', 'menu-waiting', 'menu-run', 'menu-wrap-view', 'menu-spent',
     'menu-error', 'menu-empty']
      .forEach(function (id) { $(id).hidden = id !== which; });
  }

  function renderMenuView() {
    /*
     * A RUN IN PROGRESS OUTRANKS EVERYTHING BELOW.
     *
     * The go is spent the moment the model answers, so a Standard profile is
     * already out of allowance while it is still agreeing to its starter.
     * Checking the allowance first would therefore throw away the menu they
     * are in the middle of and show them the "come back in two days" screen —
     * for the menu they are standing in. Tab away, tab back, and it is gone.
     *
     * So: mid-run first, finished menu second, and only then the allowance.
     */
    if (!menuRun && !menuWrapped) {
      // First look since a reload: pick up whatever was left on the table.
      if (restoreRun()) menuWrapped = false;
      else if (restoreDone()) menuWrapped = true;
    }
    if (menuRun) { menuPanels('menu-run'); paintRun(false); return; }
    if (menuWrapped) { menuPanels('menu-wrap-view'); paintMenu(menuNow); return; }

    if (!menuAllowed()) {
      menuPanels('menu-spent');
      $('menu-spent-line').textContent =
        'You have had this one. The next free menu is ready ' + menuWaitWords() + '.';
      return;
    }
    menuAsk();
  }

  /* Back to the two ways in. */
  function menuAsk() {
    menuRun = null;
    menuWrapped = false;
    progress.state.menuRun = null;
    progress.save();
    menuPanels('menu-ask');
    $('menu-ways').hidden = false;
    $('menu-questions').hidden = true;
    $('menu-prompt').hidden = true;
    paintMenuLeft();
  }

  /*
   * The questions. Three, and none of them about food — the catalogue already
   * knows what this person likes (see favouredDishes). What it cannot know is
   * the room: how many chairs, how much effort is on offer, what kind of
   * evening it is meant to be.
   */
  var MENU_QUESTIONS = [
    /*
     * WHERE IT IS HAPPENING COMES FIRST, because it changes what every other
     * answer means. Three courses to cook at home and three courses to order
     * are different problems: effort is about your hob in one and about the
     * bill in the other, and a menu that assumes you are cooking when you
     * meant to go out is useless however well it is chosen. It was not asked
     * at all, so the model guessed, and it guessed "cooking" every time.
     */
    { key: 'where', text: 'Where is this happening?',
      options: ['Cooking at home', 'Ordering in', 'Going out somewhere'] },
    { key: 'who', text: 'Who is eating?',
      options: ['Just me', 'Two of us', 'Three or four', 'A houseful'] },
    /*
     * Time rather than "effort". Effort is a feeling and everyone scores it
     * differently; an hour is an hour, and it is the thing that actually
     * rules dishes in and out.
     */
    { key: 'time', text: 'How long have you got?',
      options: ['Half an hour', 'About an hour', 'All afternoon'] },
    { key: 'evening', text: 'What is the evening for?',
      options: ['Comfort', 'Showing off a bit', 'Light and fresh', 'A proper feast'] },
    /*
     * The one that saves a menu from being wrong for a reason nothing else
     * would have caught. Left as a skip rather than a list of allergies,
     * because a wrong list is worse than no list and the typed box is there
     * for anybody whose answer is more complicated than these.
     */
    { key: 'avoid', text: 'Anything off the table?',
      options: ['Nothing, all good', 'No meat', 'No fish or seafood', 'Nothing too spicy'] }
  ];

  var menuQ = { at: 0, answers: {} };

  function menuStartQuestions() {
    menuQ = { at: 0, answers: {} };
    menuPanels('menu-ask');
    $('menu-ways').hidden = true;
    $('menu-prompt').hidden = true;
    $('menu-questions').hidden = false;
    paintMenuQuestion();
  }

  function paintMenuQuestion() {
    var q = MENU_QUESTIONS[menuQ.at];
    $('menu-q-step').textContent = 'Question ' + (menuQ.at + 1) + ' of ' + MENU_QUESTIONS.length;
    $('menu-q-title').textContent = q.text;
    var wrap = $('menu-q-options');
    wrap.innerHTML = '';
    q.options.forEach(function (opt) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'knob';
      btn.textContent = opt;
      btn.addEventListener('click', function () {
        Sound.tick();
        menuQ.answers[q.key] = opt;
        menuQ.at += 1;
        if (menuQ.at < MENU_QUESTIONS.length) return paintMenuQuestion();
        askMenu({ answers: menuQ.answers });
      });
      wrap.appendChild(btn);
    });
  }

  function menuStartPrompt() {
    menuPanels('menu-ask');
    $('menu-ways').hidden = true;
    $('menu-questions').hidden = true;
    $('menu-prompt').hidden = false;
    focusQuietly($('menu-prompt-input'));
  }

  /*
   * Ask the model, and fall back to the app's own scorer if it will not answer.
   *
   * The go is spent on a menu that arrives, not on a request that is made: a
   * model that times out has cost this person nothing and should cost them
   * nothing. The fallback does not spend it either — a locally scored menu is
   * not the thing they asked for.
   */
  var menuAsked = null;

  function askMenu(ask) {
    /*
     * THE GATE LIVES HERE, and nowhere else.
     *
     * It was on renderMenuView and on the reroll button, which covered two of
     * the five ways into this function and none of the ones people actually
     * found. Finishing the questions, submitting the typed box and "Start
     * again" all called straight through, so a Standard profile could have as
     * many menus as it liked by pressing Start again — the allowance was
     * decorative.
     *
     * One choke point. Every route in passes through this function, so this is
     * the only place the check can be complete, and any new route added later
     * gets it for free.
     */
    if (!menuAllowed()) return renderMenuView();

    menuAsked = ask;
    menuPanels('menu-waiting');

    var liked = pickedHistory();
    fetch('/api/menu', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        prompt: ask.prompt || '',
        answers: ask.answers || null,
        liked: liked.liked,
        avoid: liked.avoid
      })
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (body) {
        return { ok: res.ok, body: body };
      });
    }).catch(function () {
      return { ok: false, body: {} };
    }).then(function (answer) {
      var courses = answer.ok && answer.body && answer.body.courses;
      if (!courses || !courses.length) return menuFellBack();

      var menu = [];
      courses.forEach(function (c) {
        var course = COURSES.filter(function (x) { return x.id === c.course; })[0];
        var dish = dishByName(c.name);
        if (course && dish) menu.push({ course: course, dish: dish, why: c.why || '' });
      });
      if (menu.length < 2) return menuFellBack();

      // Eating order, whatever order the answer came back in — the run walks
      // this list, so the starter has to actually be first.
      menu.sort(function (a, b) {
        return COURSES.indexOf(a.course) - COURSES.indexOf(b.course);
      });

      if (!isPlus()) {
        progress.state.menuAt = Date.now();
        progress.save();
      }
      startRun(menu);
    });
  }

  /*
   * The model did not answer, so the app answers. Says so, because a menu
   * that ignores what somebody just typed and does not admit it is worse than
   * an error — they would think it had read them and disagreed.
   */
  function menuFellBack() {
    var menu = buildMenu({ keep: {} });
    if (!menu.length) return menuPanels('menu-empty');
    startRun(menu);
    // Said on the course in hand rather than at the end, because at the end it
    // is too late to matter and they have already agreed to two courses on the
    // strength of something they think the model wrote.
    $('menu-now-why').textContent = 'Chosen from what you like rather than from what you ' +
      'said \u2014 the model did not answer, and this has not used up your go.';
  }

  $('menu-way-questions').addEventListener('click', function () { Sound.tick(); menuStartQuestions(); });
  $('menu-way-prompt').addEventListener('click', function () { Sound.tick(); menuStartPrompt(); });
  $('menu-q-back').addEventListener('click', function () { Sound.tick(); menuAsk(); });
  $('menu-prompt-back').addEventListener('click', function () { Sound.tick(); menuAsk(); });
  $('menu-restart').addEventListener('click', function () { Sound.tick(); menuAsk(); });
  $('menu-take').addEventListener('click', function () { takeCourse(); });
  $('menu-switch').addEventListener('click', function () { switchCourse(); });
  $('menu-now-name').addEventListener('click', function () {
    if (!menuRun) return;
    var entry = menuRun.menu[menuRun.step];
    if (!entry) return;
    Sound.tick();
    openSheet(entry.dish);
  });
  $('menu-retry').addEventListener('click', function () {
    Sound.tick();
    if (menuAsked) askMenu(menuAsked); else menuAsk();
  });

  $('menu-prompt-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var text = $('menu-prompt-input').value.trim();
    if (!text) return;
    askMenu({ prompt: text });
  });

  function openMenu() {
    hideLanding();
    setView('menu');
  }

  $('menu-btn').addEventListener('click', function () { Sound.tick(); openMenu(); });

  /*
   * "Go again" re-asks, with whatever was said the first time.
   *
   * A whole new run from the top, which is what Premium is buying here: the
   * pudding ends the meal for everybody, and the difference is whether there
   * is another meal to be had straight afterwards. Deliberately not the local
   * scorer — somebody who typed "one of us is vegetarian" and pressed this
   * used to get a menu chosen from tags, which knows nothing about that, with
   * no sign anything had changed. askMenu's own gate is the honest answer if
   * there is no go left.
   */
  $('menu-reroll').addEventListener('click', function () {
    Sound.tick();
    if (!menuAsked) return menuAsk();
    askMenu({ prompt: menuAsked.prompt, answers: menuAsked.answers });
  });

  function openWeek(fresh) {
    if (!premium('The week plan')) return;
    hideLanding();
    if (fresh || !progress.state.plan) buildWeek();
    renderWeekPanel();
    setView('decide');
    setPanel('week');
  }

  $('week-btn').addEventListener('click', function () { openWeek(true); });
  $('week-reroll').addEventListener('click', function () { Sound.tick(); openWeek(true); });
  $('week-back').addEventListener('click', goHome);
  $('week-done').addEventListener('click', goHome);

  /* -------------------------------------------------------------- question */
  function floatXp(amount, source) {
    if (reduceMotion || !source) return;
    var box = source.getBoundingClientRect();
    var el = document.createElement('span');
    el.className = 'xp-float';
    el.textContent = '+' + amount;
    el.style.left = (box.left + box.width / 2) + 'px';
    el.style.top = (box.top + box.height / 3) + 'px';
    document.body.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 900);
  }

  function replay(el) {
    el.classList.remove('is-new');
    void el.offsetWidth;
    el.classList.add('is-new');
  }

  function renderQuestion(q) {
    current = q;
    $('q-now').textContent = game.answers.length + 1;
    // Out of however many there actually are. It was hard-coded to 20, which
    // was a promise the game could not keep once the questionnaire was cut.
    // A together run is capped shorter than an ordinary one, and showing the
    // ordinary total here would promise ten more questions than either person
    // is going to be asked.
    $('q-total').textContent = '/' + (together.live
      ? TOGETHER_ASKS
      : Math.min(Engine.MAX_QUESTIONS, Data.QUESTIONS.length));
    $('q-text').textContent = q.text;
    $('yes-icon').textContent = q.yesIcon;
    $('yes-label').textContent = q.yes;
    $('no-icon').textContent = q.noIcon;
    $('no-label').textContent = q.no;
    // Never disabled: on question one there is nothing to undo, so back
    // means the same thing it means everywhere else on this screen — leave.
    $('back-btn').setAttribute('aria-label', game.answers.length === 0 ? 'Back home' : 'Undo last answer');

    // Some questions have a real middle — "hot or cold" has room temperature —
    // and it appears only where it means something. It is a separate control
    // from "either, honestly", because they are different answers: one says the
    // middle is what you want, the other says you do not mind.
    //
    // It also has to be a reply something can actually give. Offering "somewhere
    // in between" when nothing left is in between meant the answer was accepted
    // and then quietly discarded, and the game handed back a hot drink.
    var neither = $('choice-neither');
    neither.hidden = !q.neither || !game.canAnswer(q.tag, 'neither');
    if (!neither.hidden) {
      $('neither-icon').textContent = q.neitherIcon || '';
      $('neither-label').textContent = q.neither;
      neither.setAttribute('aria-label', q.neither + ' — neither ' +
        q.yes.toLowerCase() + ' nor ' + q.no.toLowerCase());
    }

    var confidence = game.confidence();
    $('meter-fill').style.width = Math.round(confidence * 100) + '%';
    $('hunch').textContent = game.answers.length ? Flavor.hunch(confidence) : 'Wide open';

    replay($('q-text'));
  }

  function step() {
    if (together.live) return togetherStep();
    if (game.shouldGuess()) return reveal();
    var next = game.nextQuestion();
    if (!next) return reveal();
    renderQuestion(next.question);
    setPanel('question');
  }

  function answer(value, source) {
    if (view !== 'decide' || panel !== 'question' || busy || !current) return;

    var gained = progress.recordAnswer(current.tag, value);
    sessionXp += gained;

    var line = Flavor.reaction(current.tag, value, Math.random);
    if (value === 'either') Sound.shrug(); else Sound.tick();
    floatXp(gained, source);

    var asked = game.answers.length;
    game.answer(current.tag, value);
    step();

    // After step(), so the new question's render doesn't clear it.
    $('reaction').textContent = line;
    replay($('reaction'));

    /*
     * The one prompt allowed inside the question flow, and only when this
     * game's budget is a big one.
     *
     * Four answers in is the quietest point in a run: past the broad strokes,
     * not yet close enough to an answer to be worth hurrying. It still costs
     * a beat in the middle of a game, so it is only taken when the budget is
     * more than the reward screen can comfortably spend on its own — at two
     * or three prompts they all go at the end, where nothing is waiting.
     */
    if (asked === 4 && gameBudget >= 4 && panel === 'question') {
      setTimeout(function () { if (panel === 'question') fillSlot(false); }, 900);
    }
  }

  /* ---------------------------------------------------------------- reveal */
  // `rankedItems` is fixed for the life of one result panel; `shownItem` is
  // whichever of those the player is currently looking at — the top pick at
  // first, or whatever alternate they tapped. Accept and reject both act on
  // shownItem, not on game.best(), so a swap actually means something.
  var rankedItems = [];
  var shownItem = null;

  function reveal() {
    rankedItems = game.shortlist();
    var top = rankedItems[0];

    setPanel('result');
    busy = true;
    $('accept-btn').disabled = true;
    $('reject-btn').disabled = true;

    $('result-eyebrow').textContent = Flavor.pick(Flavor.REVEALS, Math.random);
    $('result-blurb').textContent = '';
    $('reasons').innerHTML = '';
    $('alternates').hidden = true;
    $('result-name').textContent = '…';

    var art = $('result-icon');
    var pool = rankedItems.slice(0, 12);
    var spins = reduceMotion ? 0 : 14;
    var n = 0;

    function land() {
      art.classList.add('is-landed');
      showResult(top, { animate: false });

      $('reject-btn').textContent = game.answers.length >= Engine.MAX_QUESTIONS
        ? 'Show me another'
        : 'Not quite';

      $('accept-btn').disabled = false;
      $('reject-btn').disabled = false;
      busy = false;
      Sound.reveal();

      // The verdict is on screen and the game has stopped of its own accord,
      // so this is a slot. After the reveal has been read, and only if the
      // reader is still on it.
      if (gameBudget >= 3) {
        setTimeout(function () { if (panel === 'result') fillSlot(false); }, 2200);
      }
    }

    if (!spins) return land();
    art.classList.remove('is-landed');

    (function spin() {
      art.textContent = pool[n % pool.length].icon;
      Sound.roll();
      n++;
      if (n < spins) setTimeout(spin, 45 + n * 9);
      else land();
    })();
  }

  // Paints the result for `item` and rebuilds the alternates around it.
  // Called on first landing and again on every swap.
  function showResult(item, options) {
    shownItem = item;
    var animate = !options || options.animate !== false;

    $('result-icon').textContent = item.icon;
    $('result-eyebrow').textContent = shortcut
      ? 'From your list'
      : (item.tags.drink === 1 ? 'You should drink' : 'You should eat');
    $('result-name').textContent = item.name;
    $('result-blurb').textContent = item.blurb;

    var reasons = $('reasons');
    reasons.innerHTML = '';
    game.reasons(item, 5).forEach(function (r, i) {
      var li = document.createElement('li');
      li.textContent = r.icon + ' ' + r.label;
      li.style.animationDelay = (i * 60) + 'ms';
      reasons.appendChild(li);
    });

    // Nothing on the menu met everything asked for, so say which answer went.
    // Silently handing somebody who asked for crunch a bowl of soup is how an
    // app earns "it does not listen".
    var gave = shortcut ? [] : game.compromise(item);
    $('gave').hidden = !gave.length;
    if (gave.length) {
      $('gave-why').textContent = gave.length === 1
        ? 'Nothing was both, so I let \u201c' + gave[0].label.toLowerCase() + '\u201d go.'
        : 'Nothing matched all of that, so I let ' +
          gave.map(function (g) { return '\u201c' + g.label.toLowerCase() + '\u201d'; }).join(' and ') +
          ' go.';
    }

    paintFavButton(item);
    paintSnoozeButton(item);
    paintBanButton(item);

    // Only claimed when the profile actually moved this dish, and always with
    // the reason attached — an unexplained "tuned to you" is just a sticker.
    var why = isPlus() && Taste.isWarm(progress.state)
      ? Taste.explain(progress.state, item, Date.now())
      : [];
    tunedTo = why.length ? why : null;
    $('tuned').hidden = !tunedTo;
    if (tunedTo) {
      $('tuned-why').textContent = tunedTo.join(' \u00b7 ');
      $('tuned').querySelector('.tuned-mark').textContent =
        shortcut ? 'Picked for you' : 'Tuned to you';
    }

    var maps = $('maps-btn');
    maps.href = mapsSearch(mapsTermFor(item));
    maps.setAttribute('aria-label', 'Find ' + item.name + ' near you in Google Maps');
    // Drinks and food both work as a maps search; a homemade-only dish still
    // has somewhere selling it, so the link is never hidden.

    if (animate && !reduceMotion) {
      ['result-icon', 'result-name'].forEach(function (id) {
        var el = $(id);
        el.classList.remove('is-swapped');
        void el.offsetWidth;
        el.classList.add('is-swapped');
      });
    }

    fillAlternates(item);
    paintPair(item);
  }

  // Every alternate is a real button: tapping one swaps it into the result
  // in place, without losing the questions already answered.
  function fillAlternates(shown) {
    var row = $('alt-row');
    row.innerHTML = '';

    var picks = rankedItems.filter(function (d) { return d !== shown; }).slice(0, 6);
    $('alternates').hidden = picks.length === 0;
    if (!picks.length) return;

    // These come from the same tier as the winner, so where the winner had to
    // let an answer go, so did every one of them. Saying "Or" over a row that
    // all argues with something the player said is how the app gets called
    // deaf; saying which is the whole difference.
    $('alt-title').textContent = (!shortcut && !game.everythingFits())
      ? 'Or, with the same compromise'
      : 'Or';

    picks.forEach(function (dish) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'alt';
      btn.innerHTML = '<span class="alt-art" aria-hidden="true"></span><span class="alt-name"></span>';
      btn.querySelector('.alt-art').textContent = dish.icon;
      btn.querySelector('.alt-name').textContent = dish.name;
      btn.setAttribute('aria-label', 'Show ' + dish.name + ' instead');
      btn.addEventListener('click', function () {
        if (busy) return;
        Sound.tick();
        showResult(dish);
      });
      row.appendChild(btn);
    });
  }

  /* ------------------------------------------------------------- favourites */
  function paintFavButton(item) {
    var saved = progress.isFavourite(item.name);
    $('fav-btn-label').textContent = saved ? 'Saved' : 'Save it';
    $('fav-btn').setAttribute('aria-pressed', saved ? 'true' : 'false');
  }

  $('fav-btn').addEventListener('click', function () {
    if (!shownItem) return;
    // Saving is Premium, whole. It was three saves free, which is the shape of
    // a trial rather than a tier: enough to see the point and never enough to
    // use, so it annoyed people who were not going to pay and persuaded nobody.
    if (!premium('Saving a dish')) return;
    var result = progress.toggleFavourite(shownItem);

    if (result === 'full') {
      Sound.reject();
      return toast('\u{2728}', 'Saved list is full', 'That is as many as this profile holds.');
    }

    if (result === 'banned') {
      Sound.reject();
      return toast(shownItem.icon, 'Struck off',
        'Bring ' + shownItem.name + ' back before saving it.');
    }

    paintFavButton(shownItem);
    Sound.tick();
    toast(shownItem.icon, result === 'saved' ? 'Saved' : 'Removed',
      result === 'saved' ? shownItem.name + ' is on your list'
                         : shownItem.name + ' is off your list');
  });

  function paintSnoozeButton(item) {
    var off = progress.isSnoozed(item.name);
    $('snooze-btn').firstChild.nodeValue = off ? 'Back tomorrow ' : 'Not today ';
    $('snooze-btn').setAttribute('aria-pressed', off ? 'true' : 'false');
  }

  function paintBanButton(item) {
    var banned = progress.isBanned(item.name);
    $('ban-btn').firstChild.nodeValue = banned ? 'Bring it back ' : 'Never again ';
    $('ban-btn').setAttribute('aria-pressed', banned ? 'true' : 'false');
  }

  // The permanent one. A snooze lapses on its own; this does not, and it is
  // only reversible on purpose — from the profile, or from the dish itself.
  $('ban-btn').addEventListener('click', function () {
    if (!shownItem) return;
    if (!premium('Striking a dish off for good')) return;

    if (progress.isBanned(shownItem.name)) {
      progress.unban(shownItem.name);
      paintBanButton(shownItem);
      applyRules();
      return Sound.tick();
    }

    progress.ban(shownItem.name);
    paintBanButton(shownItem);
    paintFavButton(shownItem);
    applyRules();
    Sound.reject();
    toast(shownItem.icon, 'Struck off', shownItem.name + ' will not come up again.');
    rejectCurrent();
  });

  // "Not today" is the gentler cousin of a standing rule: off the menu until
  // midnight, then back as if nothing happened.
  $('snooze-btn').addEventListener('click', function () {
    if (!shownItem) return;
    if (!premium('Putting a dish off for the day')) return;
    if (progress.isSnoozed(shownItem.name)) {
      delete progress.state.snoozed[shownItem.name];
      progress.save();
      paintSnoozeButton(shownItem);
      return Sound.tick();
    }
    progress.snooze(shownItem.name);
    paintSnoozeButton(shownItem);
    Sound.shrug();
    toast(shownItem.icon, 'Not today', shownItem.name + ' is off the menu until tomorrow.');
    // Take it off the screen too, or the app is only pretending to listen.
    rejectCurrent();
  });

  // Straight from the saved list to a result, no questions at all.
  $('fav-decide-btn').addEventListener('click', function () {
    var rules = progress.state.rules || [];
    var favourites = (progress.state.favourites || [])
      .map(function (f) { return dishByName(f.name); })
      .filter(Boolean)
      .filter(function (dish) {
        return !rules.some(function (tag) { return (dish.tags[tag] || 0) === 1; });
      });

    if (!favourites.length) {
      Sound.reject();
      return toast('\u{1F914}', 'Nothing to pick from',
        'Everything you have saved is ruled out by your Always avoid list.');
    }

    // With a profile, even this short a list gets ordered rather than shuffled.
    var ordered = isPlus()
      ? Taste.ranked(progress.state, favourites, Date.now())
      : favourites.map(function (d) { return { item: d, score: 1 }; });

    resetGame();
    shortcut = true;
    rankedItems = ordered.map(function (r) { return r.item; });
    setPanel('result');
    $('result-icon').classList.add('is-landed');
    showResult(pickFavoured(ordered, ordered.length), { animate: false });
    $('reject-btn').textContent = 'Not quite';
    $('accept-btn').disabled = false;
    $('reject-btn').disabled = false;
    Sound.reveal();
  });

  /* ---------------------------------------------------------------- reward */
  // The dish this run actually ended on, kept apart from shownItem because
  // that one is cleared by the next reset and accept() can fall back to the
  // engine's best pick when it is already null. The share on the reward screen
  // has to name what was accepted, not what happens to be on screen.
  var acceptedItem = null;

  function accept() {
    if (busy) return;
    var item = shownItem || game.best().item;
    acceptedItem = item;
    var outcome = progress.recordDecision(item, {
      questions: game.answers.length,
      rejections: rejections,
      answerXp: sessionXp,
      shortcut: shortcut
    });

    if (isPlus() && progress.state.noRepeat) {
      progress.snoozeFor(item.name, 7 * 86400000);
    }

    /*
     * Told to the Whop pixel: somebody got an answer and took it.
     *
     * This is the only event this app reports, and it is this one because it
     * is the only moment the product has actually done its job. A page view
     * says an ad was clicked; this says the person who clicked it stayed long
     * enough to decide what to eat, which is the number worth judging an ad
     * on. Landing and using are different things and a campaign optimising on
     * the first will happily buy the wrong people all day.
     *
     * Guarded because the pixel is a third-party script that can be blocked,
     * fail to load, or be missing entirely when this file is opened from
     * something other than the real site. Nothing here is allowed to take the
     * game down over a metric.
     */
    try {
      if (typeof whop !== 'undefined' && whop && typeof whop.track === 'function') {
        whop.track('decided', { dish: item.name });
      }
    } catch (err) { /* a measurement is never worth an exception */ }

    $('done-icon').textContent = item.icon;
    $('done-name').textContent = item.name + '.';
    /*
     * The closing line, varied.
     *
     * It was one fixed sentence, which is fine the first time and wallpaper by
     * the fifth — and the fifth is the one that matters, because somebody on
     * their fifth decision is somebody who came back. These are the same voice
     * the rest of the app is written in, just pleased with you: dry and warm,
     * not peppy. Nothing here congratulates anybody on tapping a button.
     */
    $('done-text').textContent = DONE_LINES[Math.floor(Math.random() * DONE_LINES.length)];

    /*
     * The end of the game, and the last and largest of the prompt slots.
     *
     * Whatever is left of this game's budget is spent here, one prompt after
     * another, because this is the only screen in the game where nothing is
     * waiting on the reader. Delayed so the first lands after the answer has
     * been read rather than on top of it, and abandoned if they have moved on.
     *
     * THE PANEL NAME. This read `panel === 'done'` for as long as the prompts
     * have existed, and there has never been a panel called that — the screen
     * this lands on is #panel-reward, and setPanel names it 'reward'. The
     * guard was therefore false every single time, so neither prompt had ever
     * been shown to anybody: not a tuning problem, a name that was wrong from
     * the first commit. The ids inside the panel are done-icon and done-name,
     * which is where the wrong word came from and why it never looked wrong.
     */
    setTimeout(function () { if (panel === 'reward') fillSlot(true); }, 1400);
    $('xp-total').textContent = '+' + outcome.total;

    var list = $('awards');
    list.innerHTML = '';
    outcome.awards.forEach(function (award, i) {
      var li = document.createElement('li');
      li.style.animationDelay = (120 + i * 110) + 'ms';
      li.innerHTML = '<span></span><b></b>';
      li.querySelector('span').textContent =
        (award.badge ? award.badge.icon + ' ' : '') + award.label;
      li.querySelector('b').textContent = '+' + award.xp;
      list.appendChild(li);
    });

    $('levelup').hidden = !outcome.leveledUp;
    if (outcome.leveledUp) {
      $('levelup-icon').textContent = outcome.level.icon;
      $('levelup-text').textContent = 'You’re now a ' + outcome.level.name;
    }

    renderRating(item);
    setPanel('reward');
    paintStreak();
    Sound.win();
    Confetti.burst({ y: window.innerHeight * 0.3 });

    if (outcome.leveledUp) setTimeout(function () { Sound.levelUp(); }, 700);
    queueToasts(outcome.badges);
  }

  /* -------------------------------------------------------------- ratings */
  // The one signal worth more than everything the app infers: someone actually
  // telling us. It feeds straight back into the prior for the next game.
  var VERDICTS = [
    { id: 'loved', icon: '\u{1F60B}', label: 'Loved it' },
    { id: 'fine',  icon: '\u{1F44C}', label: 'It was fine' },
    { id: 'no',    icon: '\u{1F615}', label: 'Not for me' }
  ];

  var ratingDish = null;

  function renderRating(item) {
    ratingDish = item;
    $('rate-wrap').hidden = false;

    var current = progress.ratingOf(item.name);
    var wrap = $('rates');
    wrap.innerHTML = '';

    VERDICTS.forEach(function (verdict) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'rate' + (current === verdict.id ? ' is-on' : '');
      btn.setAttribute('aria-pressed', current === verdict.id ? 'true' : 'false');
      btn.innerHTML = '<span class="rate-art" aria-hidden="true"></span><span></span>';
      btn.querySelector('.rate-art').textContent = verdict.icon;
      btn.querySelector('span:last-child').textContent = verdict.label;
      btn.addEventListener('click', function () { rate(verdict); });
      wrap.appendChild(btn);
    });

    paintRatingNote(current);
  }

  function paintRatingNote(current) {
    if (!isPlus()) {
      $('rate-note').textContent = 'Premium remembers what you thought and picks better next time.';
      return;
    }
    $('rate-note').textContent = current
      ? 'Noted. That changes what comes up next time.'
      : 'Tell me and I get better at picking for you.';
  }

  function rate(verdict) {
    if (!ratingDish) return;
    if (!premium('Rating what you ate')) return;

    // Tapping the current verdict again clears it.
    var next = progress.ratingOf(ratingDish.name) === verdict.id ? null : verdict.id;
    progress.rate(ratingDish.name, next);
    Sound.tick();
    renderRating(ratingDish);
    // Takes effect from the next game, not half way through this one.
    applyTaste();
  }

  // Badges unlock in batches; showing them at once buries the result, so they
  // queue up and take turns.
  var toastQueue = [];
  var toasting = false;

  function queueToasts(badges) {
    toastQueue = toastQueue.concat(badges.map(function (b) {
      return { icon: b.icon, title: 'Badge unlocked', text: b.name + ' — ' + b.hint, sound: true };
    }));
    if (!toasting) setTimeout(nextToast, 850);
  }

  function toast(icon, title, text) {
    toastQueue.push({ icon: icon, title: title, text: text });
    if (!toasting) nextToast();
  }

  function nextToast() {
    var next = toastQueue.shift();
    if (!next) { toasting = false; return; }
    toasting = true;

    var el = document.createElement('div');
    el.className = 'toast';
    // Each node addressed by its own class: a bare 'div span' would match the
    // icon, since the toast is itself a div.
    el.innerHTML = '<span class="toast-icon"></span>' +
      '<div class="toast-body"><strong></strong><span class="toast-text"></span></div>';
    el.querySelector('.toast-icon').textContent = next.icon;
    el.querySelector('strong').textContent = next.title;
    el.querySelector('.toast-text').textContent = next.text;
    $('toasts').appendChild(el);
    if (next.sound) Sound.badge();

    setTimeout(function () { el.classList.add('is-out'); }, 2300);
    setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
      nextToast();
    }, 2750);
  }

  /* ------------------------------------------------------------ enjoying it? */
  /*
   * Asked once, at a good moment, and then never again.
   *
   * THE TENSION THIS HAS TO LIVE WITH. This app's own rule, written on the
   * Endless card and meant everywhere, is that nothing is blurred, nothing is
   * teased, and nobody is told what they are missing until they have had it.
   * A prompt that asks whether you like something and then tries to sell you
   * the paid version is, done carelessly, exactly the thing that rule exists
   * to prevent.
   *
   * So the rules are tight:
   *
   *   earned      it only appears after somebody has actually decided things
   *               with it. Not on the first open, not to a visitor, not to
   *               somebody who has bounced off it.
   *   never mid-  only on the screen you land on after an answer, which is the
   *   anything    one moment in the app that is already a resting point. Never
   *               during a run, a duel, or a questionnaire.
   *   once        the answer is kept for good. "Not really" is a complete
   *               answer and is never followed by a pitch, or by the question
   *               again. Closing it is a "not now" and costs another handful
   *               of decisions before it returns, twice at most, ever.
   *   honest      a Premium subscriber is never shown it, because there is
   *               nothing to sell them and the question on its own is a survey
   *               nobody asked for.
   */
  /*
   * HOW OFTEN, and the one rule that makes raising it safe.
   *
   * These three blocks of numbers are the whole frequency of the app's asks,
   * and they were set for an app with strangers in it. This one has almost
   * nobody in it yet, which is a different problem: a pitch nobody reaches is
   * worth less than a pitch somebody shrugs at. So they are turned up.
   *
   * What is NOT turned up is the refusals. "Not really" and "Not for me" are
   * still final and still honoured forever, and closing a prompt is still a
   * soft no that costs it a full run of decisions before it returns. That is
   * what stops "more often" becoming "until they leave": the ceiling on how
   * many times anybody sees these is set by them, not by the numbers here.
   */
  var ENJOY_AFTER = 4;        // decisions before it is first put to anybody
  var ENJOY_AGAIN = 8;        // ...and more decisions before a dismissal returns
  var ENJOY_MAX_SHOWS = 3;    // times it may ever appear, dismissals included

  function enjoyDue() {
    if (isPlus()) return false;
    var st = progress.state;
    // Answered, either way, is answered.
    if (st.enjoy === 'yes' || st.enjoy === 'no') return false;
    if ((st.enjoyShown || 0) >= ENJOY_MAX_SHOWS) return false;

    var decisions = st.decisions || 0;
    var need = st.enjoy === 'later'
      ? (st.enjoyAt || 0) + ENJOY_AGAIN
      : ENJOY_AFTER;
    return decisions >= need;
  }

  function openEnjoy(preview) {
    var st = progress.state;
    if (!preview) {
      st.enjoyShown = (st.enjoyShown || 0) + 1;
      progress.save();
    }

    $('enjoy-ask').hidden = false;
    $('enjoy-pitch').hidden = true;
    $('enjoy-thanks').hidden = true;
    $('enjoy-line').textContent = (st.decisions || 0) + ' decisions in — honestly, is it any good?';

    enjoyOpener = document.activeElement;
    var dlg = $('enjoy-sheet');
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
    focusQuietly($('enjoy-yes'));
  }

  function closeEnjoy() {
    var dlg = $('enjoy-sheet');
    if (dlg.close) dlg.close(); else dlg.removeAttribute('open');
    focusQuietly(enjoyOpener);
  }

  /*
   * Record a dismissal. Closes nothing, so it can hang off the close event.
   *
   * This used to live inside enjoyLater and therefore only ran on the two
   * routes wired to it — the X and Escape. Anything else that closed the
   * sheet recorded nothing, so `enjoy` stayed empty, `enjoyAt` was never set,
   * and the prompt was due again on the very next decision: bounded only by
   * ENJOY_MAX_SHOWS, which is three. Three prompts in three dinners, which is
   * exactly what it did when a test closed the dialog directly.
   *
   * Those two routes are the only ones a person has today, so this was
   * latent — but it is the kind of latent that gets shipped by the next
   * person to call closeEnjoy() from somewhere new, and the higher the
   * frequency the worse the failure. The dialog's own close event fires
   * however it closed, so the record is taken there instead.
   *
   * Idempotent: an answer of 'yes' or 'no' is final and this leaves it alone,
   * and recording 'later' twice writes the same two values.
   */
  function noteEnjoyLater() {
    var st = progress.state;
    if (st.enjoy !== 'yes' && st.enjoy !== 'no') {
      st.enjoy = 'later';
      st.enjoyAt = st.decisions || 0;
      progress.save();
    }
  }

  // A dismissal is not a no. It comes back, later, and not many more times.
  function enjoyLater() {
    noteEnjoyLater();
    closeEnjoy();
  }

  var enjoyOpener = null;

  $('enjoy-yes').addEventListener('click', function () {
    var st = progress.state;
    st.enjoy = 'yes';
    st.enjoyAt = st.decisions || 0;
    progress.save();
    Sound.badge();
    Confetti.burst({ y: window.innerHeight * 0.35 });

    /*
     * The price, put next to something everybody has bought this week.
     *
     * £3.45 a month is an abstraction; a coffee is not. The comparison is only
     * worth making because it is true — a month of this really does cost less
     * than one cup — and it is written as "a month of it" rather than a bare
     * price so it cannot be read as a one-off.
     */
    $('enjoy-pitch-line').textContent =
      'There is a Premium version with the other six ways to play, cook mode, ' +
      'and rules it never asks you about twice. A whole month of it costs less ' +
      'than one cup of coffee.';
    $('enjoy-pitch-fine').textContent =
      'Three days free first, and the game you are playing stays free forever either way.';

    $('enjoy-ask').hidden = true;
    $('enjoy-pitch').hidden = false;
    focusQuietly($('enjoy-try'));
  });

  $('enjoy-no').addEventListener('click', function () {
    var st = progress.state;
    st.enjoy = 'no';
    st.enjoyAt = st.decisions || 0;
    progress.save();
    Sound.tick();
    // Deliberately no pitch on this branch. Somebody who has just said they
    // are not enjoying it is the last person who should be sold anything.
    $('enjoy-ask').hidden = true;
    $('enjoy-thanks').hidden = false;
    focusQuietly($('enjoy-done'));
  });

  $('enjoy-try').addEventListener('click', function () {
    closeEnjoy();
    goPremium('Everything');
  });

  $('enjoy-nothanks').addEventListener('click', closeEnjoy);
  $('enjoy-done').addEventListener('click', closeEnjoy);
  $('enjoy-close').addEventListener('click', enjoyLater);
  $('enjoy-sheet').addEventListener('cancel', function (e) { e.preventDefault(); enjoyLater(); });
  // The backstop: whatever closed it, the dismissal is on the record. The two
  // handlers above stay because the no-<dialog> fallback removes the open
  // attribute by hand and fires no close event.
  $('enjoy-sheet').addEventListener('close', noteEnjoyLater);

  /*
   * Said when the app has just answered the question it exists to answer. In
   * its own voice — pleased, and still dry. "Sorted." survives because it was
   * the right line; the rest are there so it is not the only one.
   */
  var DONE_LINES = [
    'Sorted. Go and enjoy it.',
    'That is dinner. Nicely done.',
    'Decided. The hard part is behind you.',
    'There it is. Off you go.',
    'Settled — nothing left to think about.',
    'Good shout. And it took about a minute.',
    'Done. That is the deciding out of the way.',
    'Locked in. Enjoy the bit that comes next.'
  ];

  /* --------------------------------------------------------- earn with it */
  /*
   * The affiliate offer, on the same terms as the enjoy prompt.
   *
   * Never in the same sitting as it: being asked whether you like something
   * and then asked to go and sell it, one after the other, is two asks in a
   * row and reads as a sales funnel rather than an app. So this only comes up
   * when the other prompt is not what is due — which is the rule that still
   * holds now the two are only a few decisions apart rather than twenty.
   *
   * "Not for me" is final. There is no later on this one — somebody who does
   * not want to sell your app is not going to want to in a fortnight, and
   * asking again would just be nagging with extra steps. That refusal is the
   * ceiling on this prompt, not EARN_MAX_SHOWS.
   */
  var EARN_AFTER = 8;         // decisions before it is offered at all, and between showings
  var EARN_MAX_SHOWS = 4;     // times it may ever appear

  function earnDue() {
    var st = progress.state;
    if (st.earn === 'no') return false;
    if ((st.earnShown || 0) >= EARN_MAX_SHOWS) return false;
    // Never on top of the other prompt, and never in the same run as one.
    if (enjoyDue()) return false;
    var decisions = st.decisions || 0;
    if (decisions < EARN_AFTER) return false;
    // A second showing costs another full run of decisions.
    if ((st.earnShown || 0) > 0 && decisions < (st.earnAt || 0) + EARN_AFTER) return false;
    return true;
  }

  function openEarn(preview) {
    var st = progress.state;
    if (!preview) {
      st.earnShown = (st.earnShown || 0) + 1;
      st.earnAt = st.decisions || 0;
      progress.save();
    }

    /*
     * Open with what they have actually done here.
     *
     * The line was "if you like morsels45, you can get paid for telling
     * people about it" — a pitch that begins by admitting it does not know
     * whether you like it. Somebody twenty-five decisions deep has answered
     * that question with their thumbs. The streak is only mentioned from
     * three days, because two days is not a streak.
     */
    var decisions = st.decisions || 0;
    var streak = st.streak || 0;
    var lead = 'You have settled ' + decisions + ' ' +
      (decisions === 1 ? 'dinner' : 'dinners') + ' in here';
    if (streak >= 3) lead += ', ' + streak + ' days running';
    lead += '. If it is worth that to you, it is worth something to whoever you tell.';
    $('earn-lead').textContent = lead;

    earnOpener = document.activeElement;
    var dlg = $('earn-sheet');
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
    focusQuietly($('earn-go'));
  }

  function closeEarn() {
    var dlg = $('earn-sheet');
    if (dlg.close) dlg.close(); else dlg.removeAttribute('open');
    focusQuietly(earnOpener);
  }

  var earnOpener = null;

  /* ------------------------------------------------------- the prompt budget */
  /*
   * HOW MANY PROMPTS ONE GAME IS ALLOWED, and where they are allowed to land.
   *
   * A game is one play-through: from starting a decision to accepting one.
   * On Standard that game gets a budget of between two and five prompts,
   * drawn once when the game starts so the pace varies between games instead
   * of being the same every time. A Premium member gets one: they have
   * already bought the thing two of these are selling, and the affiliate
   * offer is worth making once.
   *
   * WHERE THEY LAND, and why not mid-question. Three modal dialogs thrown
   * across the question flow would hit the budget and wreck the game: every
   * one of them steals focus in the middle of a train of thought that takes
   * about a minute to finish. So the slots are the two places the game has
   * already stopped — the verdict and the reward screen — plus one quiet
   * point in the middle, and the reward screen then spends whatever is left
   * over, one prompt after the next, each waiting for the one before it to be
   * closed. Same count, and nothing interrupted.
   *
   * WHAT FILLS A SLOT, in order. The three bespoke prompts first, when they
   * are due: they are about a specific thing, they keep their own state and
   * they are rare by design. Then the ads, which are what makes a budget of
   * five reachable at all — an offer with nothing behind it but "not now"
   * comes back, where a survey answered is answered forever.
   */
  var GAME_BUDGET_MIN = 2;
  var GAME_BUDGET_MAX = 5;

  /*
   * A MEMBER GETS ONE KIND OF PROMPT, RARELY.
   *
   * One per game was already a tenth of what Standard sees, and it was still
   * wrong: one every game is every game. Somebody paying has bought the thing
   * two thirds of this roster is selling, and what they bought includes not
   * being sold to. So the only prompt they are ever shown is the affiliate
   * one — the only one that might pay them something back rather than ask
   * them for something — and it waits a dozen decisions between showings.
   *
   * Not asked at all until the first dozen, either. A prompt on the day
   * somebody pays reads as the app having been waiting for the money to clear.
   */
  var GAME_BUDGET_PLUS = 1;
  var PLUS_PROMPT_EVERY = 12;  // decisions between money prompts for a member

  function plusPromptDue() {
    var st = progress.state;
    // The same refusal that ends the affiliate offers for everybody. A member
    // who has said "not for me" is then done with prompts entirely, which is
    // the quietest this app can be and is exactly right.
    if (st.earn === 'no') return false;
    var decisions = st.decisions || 0;
    return decisions >= (st.plusPromptAt || 0) + PLUS_PROMPT_EVERY;
  }

  /*
   * HOW MANY SWAPS A MENU IS WORTH ON STANDARD.
   *
   * Swapping is local and free — it re-scores from the catalogue rather than
   * asking the model — and with three courses, three swaps is a brand new
   * menu for nothing. That made the one-every-two-days allowance a formality:
   * take your menu, then swap every course until you like it.
   *
   * Two is the number because two is what the feature is actually for: "the
   * main is right, the other two are not". Changing all three is not
   * adjusting a menu, it is asking for a different one, and that is what the
   * allowance covers. Premium swaps as much as it likes.
   */

  var gameBudget = 0;
  var gameSpent = 0;
  var gameAds = [];   // ad ids already used this game, so none repeats in it

  function startGameBudget() {
    gameSpent = 0;
    gameAds = [];
    gameBudget = isPlus()
      ? GAME_BUDGET_PLUS
      : GAME_BUDGET_MIN + Math.floor(Math.random() * (GAME_BUDGET_MAX - GAME_BUDGET_MIN + 1));
  }

  function anySheetOpen() {
    var ids = ['enjoy-sheet', 'earn-sheet', 'share-sheet', 'ad-sheet', 'dish-sheet'];
    for (var i = 0; i < ids.length; i++) {
      var dlg = document.getElementById(ids[i]);
      if (dlg && dlg.open) return true;
    }
    return false;
  }

  /*
   * Spend one prompt, if there is budget and something worth showing.
   *
   * `chain` keeps going after each one is closed until the budget is gone —
   * only used on the reward screen, where nothing is waiting. Returns whether
   * anything was shown, so a caller can tell a spent budget from an empty
   * roster.
   */
  function fillSlot(chain) {
    // Capped live rather than trusting the number drawn at the start of the
    // game: Premium is settled by a request to the server, so the very first
    // game of a session can begin before the answer is back. Reading isPlus()
    // here means a member never spends a Standard-sized budget.
    var plus = isPlus();
    var cap = plus ? Math.min(gameBudget, GAME_BUDGET_PLUS) : gameBudget;
    if (gameSpent >= cap) return false;
    if (anySheetOpen()) return false;
    if (plus && !plusPromptDue()) return false;

    /*
     * enjoyDue and shareDue already refuse a member on their own, so the two
     * of them could be left in the chain and would simply never fire. They
     * are guarded here as well because this is the line that has to be read
     * to answer "what does a member see?", and the answer should be legible
     * from it rather than from three functions in other places.
     */
    var shown = null;
    if (!plus && enjoyDue()) { openEnjoy(); shown = 'enjoy-sheet'; }
    else if (earnDue()) { openEarn(); shown = 'earn-sheet'; }
    else if (!plus && shareDue()) { openShare(); shown = 'share-sheet'; }
    else if (openAd(nextAd())) { shown = 'ad-sheet'; }

    if (!shown) return false;
    gameSpent += 1;

    if (plus) {
      progress.state.plusPromptAt = progress.state.decisions || 0;
      progress.save();
    }

    if (chain) {
      var dlg = $(shown);
      // The dialog's own close event, so the next one waits for this one to be
      // dealt with however it was dealt with. Two prompts on screen at once is
      // not two chances, it is one person closing two things.
      dlg.addEventListener('close', function once() {
        dlg.removeEventListener('close', once);
        setTimeout(function () { if (panel === 'reward') fillSlot(true); }, 500);
      });
    }
    return true;
  }

  /* --------------------------------------------------------------- the ads */
  /*
   * The rotating prompts, and the one place a new offer is added.
   *
   * ADD AN AFFILIATE HERE. One entry, and it joins the rotation: it will be
   * shown, spaced, counted against the per-game budget and silenced by the
   * same refusal as the rest, with nothing else to wire up. `kind` decides
   * who sees it and which refusal ends it — 'plus' is the upgrade pitch and
   * is never shown to somebody already paying; 'aff' is an affiliate offer
   * and is ended for good by the same "not for me" that ends all of them.
   *
   * NO NUMBERS THAT ARE NOT KNOWN HERE. None of these name a commission rate
   * or an amount, because this file does not know them and a made-up figure
   * in a money pitch is the one kind of wrong that costs somebody something
   * real. They say what the deal is and let the page at the other end say
   * what it pays.
   */
  var AFFILIATES_URL = 'https://whop.com/morsels45/affiliates';

  var ADS = [
    {
      id: 'plus-coffee',
      kind: 'plus',
      icon: '✨',
      title: 'Cheaper than a cup of coffee',
      body: 'Premium is the other six ways to play, cook mode, the menu builder, ' +
            'and rules it never asks you about twice. A whole month of it costs less ' +
            'than one coffee.',
      fine: 'Three days free first. The game you are playing stays free either way.',
      cta: 'Three days free'
    },
    {
      id: 'plus-modes',
      kind: 'plus',
      icon: '\u{1F3C6}',
      title: 'There are six more games in here',
      body: 'Knockout, Blitz, This or that, Shortlist, Swipe and Together are all ' +
            'sitting behind one switch. Same catalogue, six different ways to argue ' +
            'with it.',
      fine: 'Three days free, then less than a coffee a month.',
      cta: 'Have a look'
    },
    {
      id: 'aff-tell',
      kind: 'aff',
      icon: '\u{1F4B8}',
      title: 'Get paid for telling people',
      body: 'morsels45 has an affiliate programme. Share your own link, and when ' +
            'somebody signs up through it you take a cut — for as long as they stay.',
      fine: 'Free to join, nothing to pay, and it costs the people you send nothing extra.',
      cta: 'Show me how'
    },
    {
      id: 'aff-already',
      kind: 'aff',
      icon: '\u{1F4E3}',
      title: 'You are already recommending it',
      body: 'Every time you settle an argument about dinner with this, somebody else ' +
            'hears about it. With a link in your hand, that is worth something to you ' +
            'as well as to them.',
      fine: 'Takes a minute to set up and there is nothing to pay.',
      cta: 'Get my link'
    },
    {
      id: 'aff-recurring',
      kind: 'aff',
      icon: '\u{1F501}',
      title: 'It pays for as long as they stay',
      body: 'The cut is not a one-off finder’s fee. Sign somebody up and you keep ' +
            'earning from them every month they keep using it.',
      fine: 'Nothing to pay, nothing to ship, and no minimum.',
      cta: 'See the terms'
    },
    {
      id: 'aff-nothing-to-sell',
      kind: 'aff',
      icon: '\u{1F4E6}',
      title: 'Nothing to buy, nothing to post',
      body: 'This is not one of those where you have to buy a kit or put anything on ' +
            'social media. It is a link. You send it to people who cannot decide what ' +
            'to eat, which is everybody.',
      fine: 'Free to join and you can stop at any point.',
      cta: 'Get my link'
    },
    {
      id: 'aff-group',
      kind: 'aff',
      icon: '\u{1F465}',
      title: 'One link works for a whole group chat',
      body: 'The same link does not run out and does not care how many people use it. ' +
            'Put it somewhere a few people will see it once, rather than sending it ' +
            'over and over.',
      fine: 'Free to join, and it costs the people you send nothing extra.',
      cta: 'Show me how'
    },
    {
      id: 'aff-cancel',
      kind: 'aff',
      icon: '\u{1F513}',
      title: 'You keep your link if you stop paying',
      body: 'The affiliate programme is not part of Premium. Join it on the free ' +
            'version, keep it if you cancel, and keep earning either way.',
      fine: 'Nothing to pay, ever, to be an affiliate.',
      cta: 'Join it'
    }
  ];

  /*
   * Which ads this profile is allowed to see at all.
   *
   * Nothing here is about timing — that is the budget's job below. This is
   * only the question of whether an offer makes sense for this person and
   * whether they have told us to stop.
   */
  function adAllowed(ad) {
    var st = progress.state;
    if (ad.kind === 'plus') return !isPlus() && st.plusAd !== 'no';
    if (ad.kind === 'aff') return st.earn !== 'no';
    return true;
  }

  /*
   * The rotation cursor, saved.
   *
   * Held in progress rather than in a variable so the rotation carries across
   * games and across days. Without that, every game would open with the same
   * ad, which is how a roster of five ends up being one ad with four spares.
   */
  function nextAd() {
    var st = progress.state;
    var start = st.adAt || 0;
    for (var i = 0; i < ADS.length; i++) {
      var ad = ADS[(start + i) % ADS.length];
      if (!adAllowed(ad)) continue;
      // Never the same card twice in one game. With most of the roster
      // refused the cursor wraps inside a single game, and it did: a profile
      // that had ended the affiliate offers got "six more games in here",
      // then the coffee line, then both again, in one sitting. The same pitch
      // twice in five minutes is the exact thing that makes somebody leave.
      // Nothing new to say means the slot goes unfilled and the budget simply
      // is not spent — fewer prompts for somebody who has refused most of
      // them is the right answer, not a repeat.
      if (gameAds.indexOf(ad.id) !== -1) continue;
      st.adAt = (start + i + 1) % ADS.length;
      progress.save();
      gameAds.push(ad.id);
      return ad;
    }
    return null;
  }

  var adOpener = null;
  var adShowing = null;

  function openAd(ad, preview) {
    if (!ad) return false;
    adShowing = ad;

    $('ad-art').textContent = ad.icon;
    $('ad-title').textContent = ad.title;
    $('ad-body').textContent = ad.body;
    $('ad-fine').textContent = ad.fine;
    $('ad-go').textContent = ad.cta;
    $('ad-go').href = ad.kind === 'aff' ? AFFILIATES_URL : premiumApi.upgradeUrl();
    // The final refusal is named after what it ends, not after this one card:
    // "not for me" on an affiliate offer ends every affiliate offer, and it
    // should not take somebody three refusals to discover that.
    $('ad-never').textContent = ad.kind === 'aff' ? 'Not for me' : 'Not interested';

    if (!preview) {
      var st = progress.state;
      st.adShown = (st.adShown || 0) + 1;
      progress.save();
    }

    adOpener = document.activeElement;
    var dlg = $('ad-sheet');
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
    focusQuietly($('ad-go'));
    return true;
  }

  function closeAd() {
    var dlg = $('ad-sheet');
    if (dlg.close) dlg.close(); else dlg.removeAttribute('open');
    focusQuietly(adOpener);
  }

  $('ad-later').addEventListener('click', function () { Sound.tick(); closeAd(); });
  $('ad-close').addEventListener('click', closeAd);
  $('ad-sheet').addEventListener('cancel', function (e) { e.preventDefault(); closeAd(); });

  // Final, and for the whole kind rather than this one card.
  $('ad-never').addEventListener('click', function () {
    var st = progress.state;
    if (adShowing && adShowing.kind === 'aff') st.earn = 'no';
    if (adShowing && adShowing.kind === 'plus') st.plusAd = 'no';
    progress.save();
    Sound.tick();
    closeAd();
  });

  // Tapping the offer is an answer too: it should not be put to them again in
  // the same breath, and the sheet is a change of context anyway.
  $('ad-go').addEventListener('click', function () { closeAd(); });

  /* ----------------------------------------------------------- send it on */
  /*
   * The third prompt, and the only one that is not asking for money.
   *
   * It is deliberately last in the queue and deliberately the narrowest. The
   * other two are pitches; this one is a favour, and a favour asked of
   * somebody who has not yet said they like the thing is just another advert.
   * So it is only put to a profile that has already answered "yeah, I like
   * it" to the enjoy prompt.
   *
   * NOT TO MEMBERS. It used to go to anybody paying, on the grounds that they
   * had made that judgement with their own money. They had — and a member has
   * still paid to be left alone. The only prompt a member gets now is the one
   * that might pay them something back, and this is not it.
   *
   * A run of decisions apart, and never in the same breath as one of the other
   * two. Three prompts stacked on one screen is not three chances, it is one
   * person closing three things.
   */
  var SHARE_AFTER = 5;        // decisions before it is offered at all, and between showings
  var SHARE_MAX_SHOWS = 4;    // times it may ever appear

  function shareDue() {
    var st = progress.state;
    if (st.share === 'no') return false;
    if ((st.shareShown || 0) >= SHARE_MAX_SHOWS) return false;
    // Never to a member: they are owed quiet, not a favour.
    if (isPlus()) return false;
    // And only to somebody who has said, in so many words, that this is good.
    // Not "one way or the other" — a favour asked of somebody who said "not
    // really" is worse than no ask, and one asked of somebody who has
    // dismissed the question twice is an advert wearing a favour's clothes.
    // This is the last real throttle on this prompt; the numbers are not.
    if (st.enjoy !== 'yes') return false;
    // Never on top of, or in the same run as, one of the other prompts.
    if (enjoyDue() || earnDue()) return false;
    var decisions = st.decisions || 0;
    if (decisions < SHARE_AFTER) return false;
    if ((st.shareShown || 0) > 0 && decisions < (st.shareAt || 0) + SHARE_AFTER) return false;
    return true;
  }

  var shareOpener = null;

  function openShare(preview) {
    var st = progress.state;
    if (!preview) {
      st.shareShown = (st.shareShown || 0) + 1;
      st.shareAt = st.decisions || 0;
      progress.save();
    }

    $('share-ask').hidden = false;
    $('share-done').hidden = true;

    // The dish on screen is what gets sent, so the line names it — "send them
    // this" about nothing in particular is a link nobody clicks.
    var dish = acceptedItem || shownItem;
    $('share-line').textContent = dish
      ? 'Send them tonight\u2019s answer \u2014 ' + dish.name + ' \u2014 and they can have a go themselves.'
      : 'Send them this. It takes five questions and it settles the argument.';

    // Only offered where there is something to offer it with. On a desktop
    // browser navigator.share does not exist, and a Send button that silently
    // falls back to the clipboard is a button that lied.
    var canSend = !!navigator.share;
    $('share-go').hidden = !canSend;

    shareOpener = document.activeElement;
    var dlg = $('share-sheet');
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
    focusQuietly(canSend ? $('share-go') : $('share-copy'));
  }

  /* What goes out: the dish, the streak if it is one, and a link to the dish. */
  function shareText() {
    var dish = acceptedItem || shownItem;
    var text = dish ? 'morsels45 says eat ' + dish.name + '.' : 'morsels45 decides what to eat.';
    var streak = progress.state.streak;
    if (dish && streak >= 3) text += ' ' + streak + ' days running now.';
    var slug = dish ? slugFor(dish.name) : '';
    var url = (typeof location !== 'undefined' && location.origin)
      ? location.origin + (slug ? '/eat/' + slug : '/decide/')
      : '';
    return { text: text, url: url };
  }

  /* Swap the sheet to its confirmation, rather than closing on a guess. */
  function shareConfirm(title, line) {
    $('share-done-title').textContent = title;
    $('share-done-line').textContent = line;
    $('share-ask').hidden = true;
    $('share-done').hidden = false;
    focusQuietly($('share-done-ok'));
  }

  function closeShare() {
    var dlg = $('share-sheet');
    if (dlg.close) dlg.close(); else dlg.removeAttribute('open');
    focusQuietly(shareOpener);
  }

  $('share-go').addEventListener('click', function () {
    Sound.tick();
    var out = shareText();
    if (!navigator.share) return;
    navigator.share({ title: 'morsels45', text: out.text, url: out.url })
      .then(function () {
        Sound.badge();
        shareConfirm('Sent.', 'That is one fewer argument about dinner.');
      })
      // A cancelled share is not a failure and gets no message: the sheet is
      // still open with the same two buttons on it.
      .catch(function () {});
  });

  $('share-copy').addEventListener('click', function () {
    Sound.tick();
    var out = shareText();
    var whole = out.text + (out.url ? ' ' + out.url : '');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(whole).then(function () {
        Sound.badge();
        shareConfirm('Copied.', 'Paste it to whoever is being difficult about dinner.');
      }).catch(function () {
        // No clipboard permission: show the thing itself, which can at least
        // be selected by hand.
        shareConfirm('Here it is', whole);
      });
      return;
    }
    shareConfirm('Here it is', whole);
  });

  $('share-done-ok').addEventListener('click', closeShare);

  $('share-no').addEventListener('click', function () {
    progress.state.share = 'no';
    progress.save();
    closeShare();
  });

  $('share-close').addEventListener('click', closeShare);
  $('share-sheet').addEventListener('cancel', function (e) { e.preventDefault(); closeShare(); });

  $('earn-no').addEventListener('click', function () {
    progress.state.earn = 'no';
    progress.save();
    Sound.tick();
    closeEarn();
  });

  // The link is a real anchor with a real href, so it works on a middle click,
  // a long press and with the keyboard — and still goes somewhere if the
  // JavaScript on this page ever fails. Closing behind it just tidies up.
  $('earn-go').addEventListener('click', function () {
    progress.state.earn = 'seen';
    progress.save();
    setTimeout(closeEarn, 0);
  });

  $('earn-close').addEventListener('click', closeEarn);
  $('earn-sheet').addEventListener('cancel', function (e) { e.preventDefault(); closeEarn(); });

  function rejectCurrent() {
    if (busy) return;
    rejections++;
    Sound.reject();
    // Reject whichever dish is actually on screen — the top pick, or an
    // alternate the player swapped to — not necessarily game.best().
    var dropped = shownItem || game.best().item;
    game.reject(dropped.name);

    // A duel winner turned down means resume the duel, not scrap it.
    if (duel.live && resumeDuel(dropped)) return;

    /*
     * A shortcut has no questions behind it, so there is nothing to go back to.
     * What there is, is the running order the mode produced — so "not quite"
     * means the next one down it, and nothing else.
     *
     * IT USED TO PICK AT RANDOM. rankedItems is ranked; drawing from it with
     * Math.random threw that away and made every rejection a lottery, so the
     * second-best dish could turn up eighth and a mode that had just spent
     * seven rounds working out an order appeared to ignore it.
     *
     * AND IT USED TO CHANGE MODE. When the list ran out it called restart(),
     * which starts the ordinary questionnaire — so one tap of "not quite" in
     * Knockout or Blitz, both of which offered exactly one dish, dropped the
     * player into a different game without a word. Running out is now its own
     * outcome, said out loud, ending at the mode picker rather than inside
     * some other mode.
     */
    if (shortcut) {
      var left = rankedItems.filter(function (d) { return d !== dropped; });
      if (!left.length) {
        toast('\u{1F937}', 'That is the lot',
          'You have turned down everything that round came up with. Pick a way to play again.');
        return goHome();
      }
      rankedItems = left;
      return showResult(left[0]);
    }

    // Nothing else fits what has been said so far. Re-asking would hand back
    // the same dish, which is what "not quite" used to do — so give back the
    // narrowest thing the player is pinned to and carry on asking instead.
    var loosened = null;
    while (!game.shortlist().length) {
      var dropped2 = game.relax();
      if (!dropped2) return restart();
      loosened = dropped2;
    }

    step();
    $('reaction').textContent = loosened
      ? 'That is everything that fits. Dropping “' + answerLabel(loosened) + '”.'
      : Flavor.pick(Flavor.REJECTS, Math.random);
    replay($('reaction'));
  }

  // What the player actually tapped, so the message names the thing being
  // given back rather than reciting the question at them.
  function answerLabel(answer) {
    var q = Data.QUESTIONS.filter(function (x) { return x.tag === answer.tag; })[0];
    if (!q) return answer.tag;
    if (answer.value === 'neither') return q.neither || 'neither';
    return answer.value === 'yes' ? q.yes : q.no;
  }

  /* ------------------------------------------------------------------ plan */
  // What the player actually said about cooking, if they were asked at all.
  function cookingIntent() {
    var answer = game.answers.filter(function (a) { return a.tag === 'homemade'; })[0];
    if (!answer || answer.value === 'either') return null;
    return answer.value === 'yes' ? 'cook' : 'out';
  }

  var planDish = null;
  var map = null;

  function openPlan() {
    planDish = shownItem || game.best().item;
    $('plan-icon').textContent = planDish.icon;
    $('plan-name').textContent = planDish.name;

    // Default to whichever they asked for; both tabs stay available either way.
    var intent = cookingIntent();
    var startOn = intent || (Recipes.has(planDish.name) ? 'cook' : 'out');
    setPlanTab(startOn);
    setPanel('plan');
  }

  function setPlanTab(which) {
    var cooking = which === 'cook';
    $('seg-cook').classList.toggle('is-on', cooking);
    $('seg-out').classList.toggle('is-on', !cooking);
    $('seg-cook').setAttribute('aria-selected', cooking ? 'true' : 'false');
    $('seg-out').setAttribute('aria-selected', cooking ? 'false' : 'true');
    $('pane-cook').classList.toggle('is-current', cooking);
    $('pane-out').classList.toggle('is-current', !cooking);
    $('pane-cook').hidden = !cooking;
    $('pane-out').hidden = cooking;

    if (cooking) renderRecipes();
    else resetPlaces();

    paintVault('cook-vault', 'cook-lock');
    paintVault('out-vault', 'out-lock');
  }

  /* ---------- cook ---------- */
  function renderRecipes() {
    var list = Recipes.forDish(planDish.name);
    var wrap = $('recipe-list');
    wrap.innerHTML = '';

    if (!list.length) {
      $('cook-intro').textContent = 'No recipe written for this one yet — the Eat out tab will find you somewhere.';
      return;
    }

    $('cook-intro').textContent = !isPlus()
      ? (list.length === 1 ? 'One recipe, behind Premium.'
                           : list.length + ' recipes, behind Premium.')
      : (list.length === 1 ? 'One way to make it.'
                           : list.length + ' ways to make it.');
    list.forEach(function (recipe, i) { wrap.appendChild(recipeCard(recipe, i, planDish)); });
  }

  function metaText(recipe, serves) {
    var parts = [];
    if (recipe.time) parts.push(readableTime(recipe.time));
    if (serves) parts.push('Serves ' + serves);
    if (recipe.level) parts.push(recipe.level);
    return parts.join(' · ');
  }

  // Overnight recipes exist, and "720 min" is not how anyone reads a time.
  function readableTime(minutes) {
    if (minutes < 90) return minutes + ' min';
    var hours = minutes / 60;
    var rounded = Math.round(hours * 2) / 2;
    return (rounded % 1 ? rounded.toFixed(1) : rounded) + (rounded === 1 ? ' hour' : ' hours');
  }

  function recipeCard(recipe, index, dish, options) {
    options = options || {};
    var card = document.createElement('article');
    card.className = 'recipe';
    card.style.setProperty('--i', index);

    var head = document.createElement('button');
    head.type = 'button';
    head.className = 'recipe-head';
    head.setAttribute('aria-expanded', index === 0 ? 'true' : 'false');

    head.innerHTML =
      '<span class="recipe-title">' +
        '<span class="recipe-name"></span>' +
        '<span class="recipe-meta"></span>' +
      '</span>' +
      '<svg class="recipe-chevron" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
        '<path d="M6 9l6 6 6-6"/></svg>';
    head.querySelector('.recipe-name').textContent = recipe.name;
    head.querySelector('.recipe-meta').textContent = metaText(recipe, recipe.serves);

    var body = document.createElement('div');
    body.className = 'recipe-body';
    var inner = document.createElement('div');
    inner.innerHTML =
      '<div class="recipe-inner">' +
        '<div><p class="recipe-sub">You need</p><ul></ul></div>' +
        '<div><p class="recipe-sub">Method</p><ol></ol></div>' +
      '</div>';
    recipe.ingredients.forEach(function (line) {
      var li = document.createElement('li');
      li.textContent = line;
      inner.querySelector('ul').appendChild(li);
    });
    recipe.steps.forEach(function (line) {
      var li = document.createElement('li');
      li.textContent = line;
      inner.querySelector('ol').appendChild(li);
    });
    body.appendChild(inner);

    // The compact form is for the dish card, where a second modal for the
    // shopping list on top of the open one would be a mess. Cook mode is the
    // exception: it replaces the screen rather than stacking on it, and the
    // whole point of putting recipes on the dish card was to let somebody cook
    // one without playing a game first.
    var grid = inner.querySelector('.recipe-inner');
    if (options.compact) {
      grid.insertBefore(compactCookButton(recipe, dish), grid.firstChild);
    } else {
      grid.insertBefore(recipeTools(recipe, inner, head.querySelector('.recipe-meta'), dish),
        grid.firstChild);
    }

    head.addEventListener('click', function () {
      var open = card.classList.toggle('is-open');
      head.setAttribute('aria-expanded', open ? 'true' : 'false');
      Sound.tick();
    });

    card.appendChild(head);
    card.appendChild(body);
    if (index === 0) card.classList.add('is-open');
    return card;
  }

  // Scaling ingredients and a list to take to the shop. Both sit in the recipe
  // rather than behind a button somewhere else, because that is where you are
  // when you need them.
  // One button, on the dish card. No stepper and no shopping list: those open
  // things, and this card is already an open thing.
  function compactCookButton(recipe, dish) {
    var wrap = document.createElement('div');
    wrap.className = 'recipe-tools';
    wrap.style.gridColumn = '1 / -1';

    var marker = document.createElement('span');
    marker.className = 'tag-premium';
    marker.textContent = 'Premium';

    var cook = document.createElement('button');
    cook.type = 'button';
    cook.className = 'quiet';
    cook.textContent = 'Cook mode';
    cook.addEventListener('click', function () {
      if (!premium('Cook mode')) return;
      // The card goes first: cook mode is a screen, not a layer on top of one.
      closeSheet();
      openCookMode(recipe, recipe.serves, dish);
    });

    wrap.appendChild(marker);
    wrap.appendChild(cook);
    return wrap;
  }

  function recipeTools(recipe, inner, meta, dish) {
    var wrap = document.createElement('div');
    wrap.className = 'recipe-tools';
    wrap.style.gridColumn = '1 / -1';

    var serves = recipe.serves || 1;

    var marker = document.createElement('span');
    marker.className = 'tag-premium';
    marker.textContent = 'Premium';

    var stepper = document.createElement('div');
    stepper.className = 'stepper';
    stepper.innerHTML =
      '<span class="stepper-label">Serves</span>' +
      '<button class="step-btn" type="button" aria-label="Fewer servings">\u2212</button>' +
      '<span class="stepper-value" aria-live="polite"></span>' +
      '<button class="step-btn" type="button" aria-label="More servings">+</button>';

    var minus = stepper.querySelectorAll('.step-btn')[0];
    var plus = stepper.querySelectorAll('.step-btn')[1];
    var value = stepper.querySelector('.stepper-value');

    function paint() {
      value.textContent = serves;
      minus.disabled = serves <= 1;
      plus.disabled = serves >= 24;
      scaleIngredients(inner, recipe, serves);
      if (meta) meta.textContent = metaText(recipe, serves);
    }

    function nudge(by) {
      if (!premium('Scaling a recipe')) return;
      serves = Math.max(1, Math.min(24, serves + by));
      Sound.tick();
      paint();
    }

    minus.addEventListener('click', function () { nudge(-1); });
    plus.addEventListener('click', function () { nudge(1); });

    var list = document.createElement('button');
    list.type = 'button';
    list.className = 'quiet';
    list.textContent = 'Shopping list';
    list.addEventListener('click', function () {
      if (!premium('Shopping lists')) return;
      openList(recipe, serves, dish);
    });

    var cook = document.createElement('button');
    cook.type = 'button';
    cook.className = 'quiet';
    cook.textContent = 'Cook mode';
    cook.addEventListener('click', function () {
      if (!premium('Cook mode')) return;
      openCookMode(recipe, serves, dish);
    });

    wrap.appendChild(marker);
    wrap.appendChild(stepper);
    wrap.appendChild(cook);
    wrap.appendChild(list);
    paint();
    return wrap;
  }

  /* ------------------------------------------------------------- cook mode */
  // A recipe read off a phone propped against a bag of flour is a different
  // object from a recipe read on a sofa. Cook mode is the same recipe with the
  // reading conditions taken seriously: one step at a time, type you can read
  // from a step back, and the ingredients up front so nothing is discovered
  // halfway through.
  //
  // The timer is the part that earns its keep. Several steps say "20 minutes",
  // and the alternative to a timer here is everybody setting a kitchen timer
  // and losing track of which of the three is which.
  var cookDialog = $('cook-mode');
  var cookOpener = null;
  var cookPages = [];
  var cookAt = 0;
  var cookTimer = null;
  var cookLeft = 0;
  var cookRunning = false;

  // How long a step is asking you to wait, if it says. Only a bare number of
  // minutes or hours counts: "cook for a few minutes" is not a timer, and
  // guessing one would be worse than not offering it.
  function stepMinutes(text) {
    var hour = /(\d+(?:\.\d+)?)\s*(?:hours?|hrs?)\b/i.exec(text);
    if (hour) return Math.round(parseFloat(hour[1]) * 60);
    var minute = /(\d+)(?:\s*[-–]\s*(\d+))?\s*(?:minutes?|mins?)\b/i.exec(text);
    if (!minute) return 0;
    // A range gets the longer end, because a timer that goes off early is a
    // timer you stop trusting.
    return Number(minute[2] || minute[1]);
  }

  function buildCookPages(recipe, serves) {
    var pages = [{
      kind: 'Before you start',
      text: 'Get these together first.',
      // A list rather than a run-on line: this is read off a worktop, one item
      // at a time, and eleven ingredients separated by middots is a paragraph.
      list: Recipes.scale(recipe, serves),
      minutes: 0
    }];
    recipe.steps.forEach(function (step, i) {
      pages.push({
        kind: 'Step ' + (i + 1) + ' of ' + recipe.steps.length,
        text: step,
        minutes: stepMinutes(step)
      });
    });
    pages.push({ kind: 'Done', text: 'That is it. Go and eat it.', minutes: 0 });
    return pages;
  }

  function openCookMode(recipe, serves, dish) {
    cookOpener = document.activeElement;
    cookPages = buildCookPages(recipe, serves);
    cookAt = 0;
    var named = dish || planDish || recipe;
    $('cook-name').textContent = named.name;
    $('cook-icon').textContent = named.icon || '\u{1F373}';
    $('cook-total').textContent = String(cookPages.length);
    paintCook();
    cookDialog.showModal();
    focusQuietly($('cook-next'));
  }

  function paintCook() {
    var page = cookPages[cookAt];
    $('cook-now').textContent = String(cookAt + 1);
    $('cook-kind').textContent = page.kind;
    $('cook-step').textContent = page.text;
    var list = $('cook-why');
    list.hidden = !page.list;
    list.innerHTML = '';
    (page.list || []).forEach(function (line) {
      var li = document.createElement('li');
      li.textContent = line;
      list.appendChild(li);
    });
    $('cook-fill').style.width = Math.round(100 * (cookAt + 1) / cookPages.length) + '%';
    $('cook-prev').disabled = cookAt === 0;
    label('cook-next', cookAt === cookPages.length - 1 ? 'Finish' : 'Next step');

    stopCookTimer();
    $('cook-timer').hidden = !page.minutes;
    if (page.minutes) {
      cookLeft = page.minutes * 60;
      paintClock();
      $('cook-timer-btn').textContent = 'Start ' + page.minutes + ' minutes';
      $('cook-timer-reset').hidden = true;
    }
  }

  function paintClock() {
    var mins = Math.floor(cookLeft / 60);
    var secs = cookLeft % 60;
    $('cook-clock').textContent = mins + ':' + ('0' + secs).slice(-2);
  }

  function stopCookTimer() {
    if (cookTimer) clearInterval(cookTimer);
    cookTimer = null;
    cookRunning = false;
  }

  $('cook-timer-btn').addEventListener('click', function () {
    if (cookRunning) {
      stopCookTimer();
      $('cook-timer-btn').textContent = 'Keep going';
      return;
    }
    cookRunning = true;
    $('cook-timer-btn').textContent = 'Pause';
    $('cook-timer-reset').hidden = false;
    cookTimer = setInterval(function () {
      cookLeft = Math.max(0, cookLeft - 1);
      paintClock();
      if (cookLeft) return;
      stopCookTimer();
      $('cook-timer-btn').textContent = 'Time is up';
      $('cook-clock').classList.add('is-done');
      Sound.win();
    }, 1000);
  });

  $('cook-timer-reset').addEventListener('click', function () {
    stopCookTimer();
    cookLeft = (cookPages[cookAt].minutes || 0) * 60;
    $('cook-clock').classList.remove('is-done');
    $('cook-timer-btn').textContent = 'Start ' + cookPages[cookAt].minutes + ' minutes';
    paintClock();
  });

  $('cook-next').addEventListener('click', function () {
    if (cookAt >= cookPages.length - 1) return closeCookMode();
    cookAt++;
    Sound.tick();
    paintCook();
  });

  $('cook-prev').addEventListener('click', function () {
    if (!cookAt) return;
    cookAt--;
    Sound.tick();
    paintCook();
  });

  $('cook-exit').addEventListener('click', closeCookMode);

  function closeCookMode() {
    stopCookTimer();
    $('cook-clock').classList.remove('is-done');
    if (cookDialog.open) cookDialog.close();
    if (cookOpener && cookOpener.focus) focusQuietly(cookOpener);
    cookOpener = null;
  }

  cookDialog.addEventListener('close', stopCookTimer);
  cookDialog.addEventListener('cancel', function () { stopCookTimer(); });

  function scaleIngredients(inner, recipe, serves) {
    var items = inner.querySelectorAll('ul li');
    var lines = Recipes.scale(recipe, serves);
    for (var i = 0; i < items.length && i < lines.length; i++) {
      items[i].textContent = lines[i];
    }
  }

  var listSheet = $('list-sheet');
  var listOpener = null;
  var listText = '';

  function openList(recipe, serves, dish) {
    listOpener = document.activeElement;
    $('list-name').textContent = (dish || planDish || recipe).name;
    $('list-serves').textContent = recipe.name + ' \u00b7 serves ' + serves;

    var lines = Recipes.scale(recipe, serves);
    var items = $('list-items');
    items.innerHTML = '';
    lines.forEach(function (line) {
      var li = document.createElement('li');
      li.textContent = line;
      items.appendChild(li);
    });

    listText = lines.join('\n');
    $('list-copy').textContent = 'Copy the list';

    if (listSheet.showModal) listSheet.showModal();
    else listSheet.setAttribute('open', '');
    focusQuietly($('list-close'));
  }

  function closeList() {
    if (listSheet.close) listSheet.close();
    else listSheet.removeAttribute('open');
    focusQuietly(listOpener);
  }

  $('list-close').addEventListener('click', closeList);
  listSheet.addEventListener('click', function (event) {
    if (event.target === listSheet) closeList();
  });

  $('list-copy').addEventListener('click', function () {
    var done = function () {
      $('list-copy').textContent = 'Copied';
      Sound.tick();
    };
    // Clipboard access is refused in plenty of ordinary situations, so there is
    // always the old selection route behind it.
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(listText).then(done, fallbackCopy);
    } else fallbackCopy();

    function fallbackCopy() {
      var box = document.createElement('textarea');
      box.value = listText;
      box.setAttribute('readonly', '');
      box.style.position = 'fixed';
      box.style.opacity = '0';
      document.body.appendChild(box);
      box.select();
      try { document.execCommand('copy'); done(); }
      catch (err) { $('list-copy').textContent = 'Select and copy above'; }
      document.body.removeChild(box);
    }
  });

  /* ---------- eat out ---------- */
  function resetPlaces() {
    var spec = Places.lookupFor(planDish.name);
    $('out-intro').textContent = 'Find ' + spec.label + ' near you.';
    $('maps-search-btn').href = mapsSearch(mapsTermFor(planDish));
    $('locate').hidden = false;
    $('out-loading').hidden = true;
    $('out-results').hidden = true;
    $('out-error').hidden = true;
  }

  function showPlacesError(message, note) {
    $('locate').hidden = true;
    $('out-loading').hidden = true;
    $('out-results').hidden = true;
    $('out-error').hidden = false;
    $('out-error-text').textContent = message;
    $('out-error-note').textContent = note ||
      'The in-app map is drawn from OpenStreetMap, which is volunteer-mapped and ' +
      'thinner in some parts of the world than others. Google Maps does not have ' +
      'that problem.';
    // Always available, always works, and the actual thing you wanted.
    $('out-fallback').href = mapsSearch(mapsTermFor(planDish));

    // Wipe the results rather than only hiding them. Hiding alone leaves a map
    // full of pins from the last search sitting behind an error about this one,
    // one stray `hidden = false` away from being shown together.
    $('place-list').innerHTML = '';
    $('chosen').hidden = true;
    if (map) map.show(null, []);
  }

  // Which search the screen belongs to. Retrying, or changing your mind and
  // asking again, leaves the earlier lookup still running against servers that
  // answer in their own time — and whichever finished last would otherwise win,
  // painting stale places, or an old failure over a fresh set of results.
  var searchRun = 0;
  var searchNudge = null;

  function findPlaces() {
    if (!premium('Finding somewhere nearby')) return;
    var run = ++searchRun;
    clearInterval(searchNudge);

    $('locate').hidden = true;
    $('out-error').hidden = true;
    $('out-results').hidden = true;
    $('out-loading').hidden = false;
    $('out-status').textContent = 'Asking your browser where you are…';
    var waited = 0;
    searchNudge = setInterval(function () {
      waited += 3;
      if (waited >= 6 && run === searchRun && !$('out-loading').hidden) {
        $('out-status').textContent = 'Still waiting — your browser may be asking permission.';
      }
    }, 3000);
    function stopNudge() { if (run === searchRun) clearInterval(searchNudge); }

    Places.currentPosition()
      .then(function (origin) {
        if (run !== searchRun) return null;
        $('out-status').textContent = 'Looking for somewhere nearby…';
        return Places.search(planDish.name, origin).then(function (found) {
          return { origin: origin, found: found };
        });
      })
      .then(function (result) {
        if (run !== searchRun) return;
        stopNudge();
        $('out-loading').hidden = true;
        if (!result.found.places.length) {
          // Every map source answered and none of them knows of anywhere. That
          // is a fact about the neighbourhood, not a fault, and saying "could
          // not connect" here would be a lie about a search that worked.
          showPlacesError('Nothing mapped within ' +
            Places.formatDistance(result.found.radius) + ' of you.',
            'All the map sources answered — OpenStreetMap simply has nothing ' +
            'listed around you. Google Maps has far more of the world in it.');
          return;
        }
        renderPlaces(result.origin, result.found);
      })
      .catch(function (err) {
        if (run !== searchRun) return;
        stopNudge();
        $('out-loading').hidden = true;
        showPlacesError(err.message || 'Could not search just now.');
      });
  }

  function renderPlaces(origin, found) {
    $('out-results').hidden = false;
    $('chosen').hidden = true;

    var spec = Places.lookupFor(planDish.name);
    var within = Places.formatDistance(found.radius);
    // Say when these are not actually matched to the dish. Listing three kebab
    // shops under "pizza places" would be the app quietly lying about what it
    // found, and that was the old behaviour whenever the sources answered with
    // whatever happened to be close.
    if (spec === Places.DEFAULT_LOOKUP) {
      $('out-summary').textContent = found.places.length +
        ' places to eat within ' + within + ', nearest first.';
    } else if (found.generic) {
      $('out-summary').textContent = 'Nothing within ' + within + ' is listed as ' +
        spec.label + ' — so here is everywhere that serves food instead.';
    } else {
      $('out-summary').textContent = found.places.length + ' ' + spec.label +
        ' within ' + within + ', nearest first.';
    }

    if (!map) map = MapView.create($('map-frame'), { onSelect: selectPlace });
    map.show(origin, found.places);

    fillPlaceList($('place-list'), found.places, function (place) {
      selectPlace(place);
      map.select(place.id);
    });

    // The nearest one is the likely answer, so it arrives already chosen and
    // there is a destination on screen without touching anything.
    if (found.places.length) {
      selectPlace(found.places[0], { quiet: true });
      map.select(found.places[0].id);
    }
  }

  /* ------------------------------------------------------------ aggregator */
  // "What are my options" — the question the app could not answer until now.
  // Everything here is independent of the game: no dish, no verdict, no
  // filtering by what you were told to eat. One wide lookup, sorted into what
  // the neighbourhood actually has.
  var nearMap = null;
  var nearFound = null;
  var nearOrigin = null;
  var nearFilter = '';
  var nearRun = 0;
  var nearChosen = null;

  function renderNearby() {
    // Nothing to do on arrival but offer the button — the lookup costs somebody
    // their location and three network round trips, so it waits to be asked.
    if (!nearFound) return;
    paintNearby();
  }

  function findNearby() {
    // Free, deliberately. Scrolling through what is around you is the whole
    // feature and it stands on its own — the paid part is further in, at the
    // point where two people want to look at one of these together.
    var run = ++nearRun;
    $('near-locate').hidden = true;
    $('near-error').hidden = true;
    $('near-results').hidden = true;
    $('near-loading').hidden = false;
    $('near-status').textContent = 'Asking your browser where you are…';

    Places.currentPosition()
      .then(function (origin) {
        if (run !== nearRun) return null;
        $('near-status').textContent = 'Looking around you…';
        return Places.browse(origin).then(function (found) {
          return { origin: origin, found: found };
        });
      })
      .then(function (result) {
        if (run !== nearRun || !result) return;
        $('near-loading').hidden = true;
        if (!result.found.places.length) {
          return showNearbyError('Nothing mapped within ' +
            Places.formatDistance(result.found.radius) + ' of you.',
            'All the map sources answered — OpenStreetMap simply has nothing listed around you.');
        }
        nearOrigin = result.origin;
        nearFound = result.found;
        nearFilter = '';
        paintNearby();
      })
      .catch(function (err) {
        if (run !== nearRun) return;
        $('near-loading').hidden = true;
        showNearbyError(err.message || 'Could not search just now.');
      });
  }

  function showNearbyError(text, note) {
    $('near-error').hidden = false;
    $('near-error-text').textContent = text;
    $('near-error-note').textContent = note || '';
  }

  function paintNearby() {
    $('near-results').hidden = false;
    $('near-locate').hidden = true;
    $('near-error').hidden = true;

    var shown = nearFilter
      ? nearFound.places.filter(function (p) { return p.category === nearFilter; })
      : nearFound.places;

    var within = Places.formatDistance(nearFound.radius);
    // The category leads rather than being folded into the sentence: "1 coffee
    // & tea within 1.2 km" is not English, and every label has to work here.
    $('near-summary').textContent = nearFilter
      ? nearFilter + ' — ' + shown.length + (shown.length === 1 ? ' place' : ' places') +
        ' within ' + within + '.'
      : nearFound.places.length + ' places within ' + within + ', across ' +
        nearFound.groups.length + (nearFound.groups.length === 1 ? ' kind.' : ' kinds.');

    // The categories, biggest first, with counts — the point of an aggregator
    // is seeing what there is a lot of before picking one.
    var cats = $('near-cats');
    cats.innerHTML = '';
    cats.appendChild(catChip('Everything', nearFound.places.length, ''));
    nearFound.groups.forEach(function (group) {
      cats.appendChild(catChip(group.label, group.count, group.label));
    });

    if (!nearMap) nearMap = MapView.create($('near-map'), { onSelect: pickNearby });
    nearMap.show(nearOrigin, shown);
    fillPlaceList($('near-list'), shown, pickNearby);
    // A filter that hides the selected place should not leave its details
    // sitting under the list describing something no longer on it.
    if (nearChosen && shown.indexOf(nearChosen) === -1) {
      nearChosen = null;
      $('near-chosen').hidden = true;
    }
  }

  // The row highlights, the details appear, and nothing navigates until asked.
  // Same shape as choosing a place in the dish search, because it is the same
  // decision — this is the screen where it is not about a dish.
  function pickNearby(place) {
    nearChosen = place;
    Sound.tick();
    $$('#near-list .place').forEach(function (btn) {
      btn.classList.toggle('is-selected', btn.dataset.placeId === place.id);
    });
    $('near-chosen').hidden = false;
    $('near-chosen-name').textContent = place.name;
    $('near-chosen-meta').textContent =
      [place.distance + ' ' + place.compass, place.kind, place.address].filter(Boolean).join(' · ');
    $('near-chosen-go').href = mapsDirections(place);
    $('near-chosen-go').setAttribute('aria-label', 'Directions to ' + place.name + ' in Google Maps');
    nearMap.select(place.id);
  }

  function catChip(label, count, value) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'filter' + (nearFilter === value ? ' is-on' : '');
    btn.textContent = label + ' ' + count;
    btn.setAttribute('aria-pressed', nearFilter === value ? 'true' : 'false');
    btn.addEventListener('click', function () {
      nearFilter = nearFilter === value ? '' : value;
      Sound.tick();
      paintNearby();
    });
    return btn;
  }

  $('near-btn').addEventListener('click', findNearby);
  $('near-retry').addEventListener('click', findNearby);

  // The one paid thing on this screen. Deciding between four places with
  // somebody is the same problem the shared browser already solves for a
  // dish — except here what you both need to read is that place's menu.
  $('near-beam-btn').addEventListener('click', function () {
    if (!nearChosen) return;
    openBeam('venue', nearChosen.name);
  });

  /* ------------------------------------------------------------------- ask */
  /*
   * The food assistant. Free, for everybody, on purpose — it is the fastest
   * way into the catalogue for somebody who already half knows what they want
   * and does not fancy answering eight questions to get there.
   *
   * The key that pays for this is not here and never will be: /api/chat holds
   * it and this only ever sees the words that came back. See routes/api/chat.ts.
   *
   * EVERY LINE ON THIS SCREEN IS UNTRUSTED. Half of it was typed by whoever is
   * holding the phone and the other half came out of a model. Both go onto the
   * page with textContent, so neither can put markup into it.
   */
  var CHAT_SEEDS = [
    'Something warm, not too heavy',
    'What goes with lamb?',
    'I have twenty minutes',
    'How do I stop garlic burning?',
    'Explain sourdough to me',
    'Give me a tip for today'
  ];

  var chat = { turns: [], busy: false, typing: null };

  /*
   * The answer arriving as it is written, rather than all at once.
   *
   * NOT streaming, and worth being clear about that: /api/chat waits for the
   * whole reply and hands it over in one piece, so nothing here makes the
   * answer arrive sooner. What it changes is the reading — a paragraph that
   * appears instantly is a wall to be started, and one that writes itself is
   * already being read by the time it finishes.
   *
   * Capped in total, not just per character, so a long answer does not turn
   * into a long wait. Past about two seconds the effect has done its job and
   * anything more is just making somebody sit there.
   */
  var CHAT_TYPE_MS = 14;      // per character, at a comfortable pace
  var CHAT_TYPE_CAP = 1800;   // ...but never longer than this in total

  function stopTyping() {
    if (chat.typing) { clearInterval(chat.typing.timer); chat.typing = null; }
  }

  /*
   * Written with textContent one slice at a time. Never innerHTML: this is a
   * model's words, and the rest of the app is careful about that for a reason.
   * `then` runs when the last character lands, which is where the dish buttons
   * are added — they belong under a finished sentence, not a half-written one.
   */
  function typeInto(body, text, then) {
    stopTyping();
    if (reduceMotion || !text) {
      body.textContent = text;
      if (then) then();
      return;
    }

    body.textContent = '';
    var step = Math.max(1, Math.ceil(text.length / (CHAT_TYPE_CAP / CHAT_TYPE_MS)));
    var at = 0;
    var state = { timer: null };
    state.timer = setInterval(function () {
      at = Math.min(text.length, at + step);
      body.textContent = text.slice(0, at);
      // Kept in view as it grows, or a long answer writes itself off the
      // bottom of the screen.
      if (body.parentNode && body.parentNode.scrollIntoView) {
        body.parentNode.scrollIntoView({ block: 'nearest' });
      }
      if (at >= text.length) {
        stopTyping();
        if (then) then();
      }
    }, CHAT_TYPE_MS);
    chat.typing = state;
  }

  function renderChat() {
    paintChatSeeds();
    paintChatLeft();
    // Deliberately not focused: on a phone, focus throws the keyboard up over
    // half the screen, including the chips that mean you need not type at all.
  }

  function paintChatSeeds() {
    var wrap = $('chat-seeds');
    if (wrap.childNodes.length) return;   // built once
    CHAT_SEEDS.forEach(function (seed) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'filter';
      btn.textContent = seed;
      btn.addEventListener('click', function () {
        $('chat-input').value = seed;
        askChat();
      });
      wrap.appendChild(btn);
    });
  }

  // One row, whoever said it. `pending` is the row that stands in for an answer
  // that has not arrived, so it can be replaced in place rather than removed
  // and re-added, which would jump the scroll.
  function chatRow(role, text, pending) {
    var li = document.createElement('li');
    li.className = 'chat-row is-' + role + (pending ? ' is-pending' : '');
    var who = document.createElement('span');
    who.className = 'chat-who';
    who.textContent = role === 'user' ? 'You' : 'morsels45';
    var body = document.createElement('p');
    body.className = 'chat-text';
    body.textContent = text;
    li.appendChild(who);
    li.appendChild(body);
    return li;
  }

  /*
   * THE FREE THREE.
   *
   * The assistant costs money per question — a real model behind a real API
   * — and it was the one thing in here a Standard profile could use without
   * limit. Three is a trial: enough to find out whether it answers anything
   * useful, not enough to be the product.
   *
   * Counted for life rather than per day, deliberately. Three a day is not a
   * trial, it is a free tier, and somebody who wants this every day is
   * somebody the paid version is for.
   */
  var CHAT_FREE = 3;

  function chatLeft() {
    return Math.max(0, CHAT_FREE - (progress.state.chatAsks || 0));
  }

  /* Said before the last one is spent, not after it. */
  function paintChatLeft() {
    var el = $('chat-left');
    if (isPlus()) { el.hidden = true; return; }
    var left = chatLeft();
    el.hidden = false;
    el.textContent = left > 0
      ? left + (left === 1 ? ' free question left' : ' of ' + CHAT_FREE + ' free questions left') +
        '. Premium asks as many as you like.'
      : 'That is the three free questions used. Premium asks as many as you like.';
  }

  function askChat() {
    if (chat.busy) return;
    var field = $('chat-input');
    var text = field.value.trim().slice(0, 500);
    if (!text) return;

    // Checked before the question is sent, so nothing is spent on a request
    // that is about to be refused.
    if (!isPlus() && chatLeft() <= 0) {
      field.value = '';
      return goPremium('Asking anything');
    }

    field.value = '';
    // Asking again while the last answer is still writing itself: the old one
    // stops where it is rather than carrying on underneath the new question.
    stopTyping();
    $('chat-empty').hidden = true;
    // The chips stay. They were hidden after the first question, which left a
    // hungry person with nothing but a keyboard — and typing is the slowest
    // thing this app asks anybody to do.
    chat.busy = true;
    $('chat-send').disabled = true;

    var log = $('chat-log');
    log.appendChild(chatRow('user', text, false));

    // The assistant is what was asked for, so it is what answers — nothing
    // stands in for it while it works and nothing is substituted if it fails.
    var waiting = chatRow('bot', 'Thinking\u2026', true);
    log.appendChild(waiting);
    waiting.scrollIntoView({ block: 'nearest' });
    Sound.tick();

    chat.turns.push({ role: 'user', text: text });

    if (!isPlus()) {
      progress.state.chatAsks = (progress.state.chatAsks || 0) + 1;
      progress.save();
      paintChatLeft();
    }

    fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      // A relative path, so this is whatever host the app is actually being
      // served from — the phone's, not a machine it was written on.
      body: JSON.stringify({ messages: chat.turns.slice(-12) })
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (body) {
        return { ok: res.ok, status: res.status, body: body };
      });
    }).catch(function () {
      return { ok: false, status: 0, body: {} };
    }).then(function (answer) {
      chat.busy = false;
      $('chat-send').disabled = false;

      if (answer.ok && answer.body && answer.body.reply) {
        var reply = String(answer.body.reply);
        chat.turns.push({ role: 'model', text: reply });
        // Built empty, then written into. The dish buttons wait for the last
        // character so they do not appear under half a sentence.
        var row = chatRow('bot', '', false);
        waiting.replaceWith(row);
        row.scrollIntoView({ block: 'nearest' });
        typeInto(row.querySelector('.chat-text'), reply, function () {
          addDishTaps(row, reply);
          row.scrollIntoView({ block: 'nearest' });
        });
        return;
      }

      // The last question did not get an answer, so it does not belong in the
      // history either — leaving it there would send it again with the next one.
      chat.turns.pop();
      var why = (answer.body && answer.body.error) || '';
      var said = why === 'too_fast'
        ? 'That was a lot of questions at once'
        : why === 'busy'
          ? 'The assistant is busy'
          : why === 'no_answer'
            ? 'The assistant had nothing to say to that'
            : 'The assistant did not answer in time';

      var row = chatRow('bot', said + '. Ask again \u2014 it usually works second time.', false);
      waiting.replaceWith(row);
      row.scrollIntoView({ block: 'nearest' });
    });
  }

  /*
   * A named dish, made tappable.
   *
   * Being told "try Ramen" and then having to go and find Ramen is the point
   * at which a conversation stops being useful. Any dish from the catalogue
   * that appears in the answer gets a button under it that opens the real
   * thing — recipe, save, share, everything the rest of the app already does.
   *
   * Matched against the catalogue rather than parsed out of the sentence: the
   * only names that become buttons are ones this app already knows, so nothing
   * the model invents can turn into a control.
   */
  function addDishTaps(row, reply) {
    var lower = reply.toLowerCase();
    var found = [];
    Data.ITEMS.forEach(function (dish) {
      if (found.length >= 3) return;
      var at = lower.indexOf(dish.name.toLowerCase());
      if (at < 0) return;
      // Whole word only, so "Ice cream" does not match inside another name and
      // "Pho" does not light up on the word "phone".
      var before = at === 0 ? ' ' : lower.charAt(at - 1);
      var after = lower.charAt(at + dish.name.length) || ' ';
      if (/[a-z0-9]/.test(before) || /[a-z0-9]/.test(after)) return;
      if (found.indexOf(dish) < 0) found.push(dish);
    });
    if (!found.length) return;

    var wrap = document.createElement('div');
    wrap.className = 'chat-taps';
    found.forEach(function (dish) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chat-tap';
      btn.textContent = dish.icon + ' ' + dish.name;
      btn.addEventListener('click', function () {
        Sound.tick();
        openSheet(dish);
      });
      wrap.appendChild(btn);
    });
    row.appendChild(wrap);
  }

  $('chat-form').addEventListener('submit', function (e) {
    e.preventDefault();
    askChat();
  });


  /* ------------------------------------------------------------- food news */
  /*
   * Four publishers' feeds, merged by /api/news and listed newest first.
   *
   * Free, and on purpose: it is the one screen worth opening on a day you are
   * not deciding anything, which is the only reason anybody comes back to a
   * decision app twice.
   *
   * EVERY STRING BELOW WAS WRITTEN BY SOMEBODY ELSE. Titles, summaries and
   * links arrive from other people's servers, so they go onto the page with
   * textContent and into href only after the worker has already thrown away
   * anything that is not plain http(s). There is no innerHTML in here except
   * to empty a list.
   */
  var news = { stories: null, filter: '', open: null, busy: false, failed: false, at: 0 };

  function renderNews() {
    // Fetched once per visit and then kept. The worker already caches for
    // fifteen minutes and food writing does not move faster than that.
    if (news.stories || news.busy) return paintNews();
    loadNews();
  }

  /*
   * Fetch the feed. `again` means there is already a list on screen.
   *
   * A reload keeps the old list up and the skeleton down: blanking a page
   * somebody is reading, to replace it with the same stories a moment later,
   * is a worse answer than a button that goes quiet for a second. It also
   * means a failed reload costs nothing — the stories that were there are
   * still there, and the error goes in a toast rather than over the page.
   */
  function loadNews(again, then) {
    if (news.busy) return;
    news.busy = true;
    news.failed = false;
    if (!again) {
      $('news-loading').hidden = false;
      $('news-wrap').hidden = true;
      $('news-error').hidden = true;
    }
    paintNewsBar();

    fetch('/api/news', { headers: { Accept: 'application/json' } })
      .then(function (res) {
        if (!res.ok) throw new Error('news ' + res.status);
        return res.json();
      })
      .then(function (data) {
        var list = (data && data.stories) || [];
        if (!list.length) throw new Error('no stories');
        var had = news.stories ? news.stories.length : 0;
        news.stories = list;
        news.busy = false;
        news.at = 0;
        paintNews();
        if (then) then({ fresh: list.length !== had });
      })
      .catch(function () {
        news.busy = false;
        if (again) {
          // There is a readable page underneath. Leave it there.
          Sound.reject();
          toast('\u{1F4F0}', 'Could not reach the feeds',
            'The stories you have are still here. Try again in a minute.');
          return paintNews();
        }
        news.failed = true;
        $('news-loading').hidden = true;
        $('news-wrap').hidden = true;
        $('news-error').hidden = false;
      });
  }

  var NEWS_FREE = 6;   // headlines a Standard profile is shown

  /*
   * A BATCH, FOR A PROFILE THAT HAS THE WHOLE FEED.
   *
   * Premium used to get the lot in one list — fifty-odd headlines, which
   * nobody reads. Worse, it left nothing for a reader who had been through it
   * to do except leave, because "the lot" has no next.
   *
   * So it is read a batch at a time, with a button that moves on. Eighteen is
   * about a screen and a half on a phone: long enough that it does not feel
   * rationed, short enough that reaching the end of it is a thing that
   * actually happens. Nothing is hidden — the line above the button says which
   * stories these are out of how many, and the button walks the rest of them.
   */
  var NEWS_PAGE = 18;

  function paintNews() {
    if (!news.stories) return;
    $('news-loading').hidden = true;
    $('news-error').hidden = true;
    $('news-wrap').hidden = false;

    var shown = news.stories.filter(function (story) {
      return !news.filter || story.source === news.filter;
    });

    paintNewsSources();

    /*
     * HOW MUCH OF THE FEED STANDARD GETS.
     *
     * Six headlines, newest first, out of however many the four publishers
     * filed — usually three or four times that. Premium reads the lot.
     *
     * Chosen as a slice rather than a lockout because this section is worth
     * having at six: somebody who only wants to know whether anything
     * interesting happened gets an answer, and somebody who reads food
     * writing properly hits the end of it and can see exactly what is behind
     * the wall and how much. A section that refuses to open teaches nobody
     * what they are missing.
     *
     * The filter chips still count and still filter the whole feed, so the
     * number in a chip is honest even when the list under it is cut.
     */
    var cut = !isPlus() && shown.length > NEWS_FREE;

    /*
     * Which stories this is. Standard gets the newest six of the filtered
     * feed; Premium gets a batch, wherever it has read up to.
     */
    var batch;
    news.pages = 1;
    if (!isPlus()) {
      batch = cut ? shown.slice(0, NEWS_FREE) : shown;
    } else {
      news.pages = Math.max(1, Math.ceil(shown.length / NEWS_PAGE));
      // A filter that just got narrower can leave the window past the end.
      if (news.at >= news.pages) news.at = 0;
      batch = shown.slice(news.at * NEWS_PAGE, news.at * NEWS_PAGE + NEWS_PAGE);
    }

    /*
     * Newest first inside the batch.
     *
     * The worker hands back the whole pile ordered in rounds — everybody's
     * newest eight, then everybody's next eight — so that a window anywhere in
     * it draws from as many publishers as had something to give. A batch
     * boundary need not land on a round boundary, though, so a batch can
     * straddle the join and read Tuesday, Monday, Tuesday. The order the
     * worker chose decides WHICH stories are in this batch; the date decides
     * what order they are read in.
     */
    batch = batch.slice().sort(function (a, b) {
      return (b.published || 0) - (a.published || 0);
    });

    var list = $('news-list');
    // The open story is about to be thrown away with the rest of the list;
    // holding a reference to a row that is no longer on the page is how the
    // accordion ends up with two things open at once.
    news.open = null;
    list.innerHTML = '';
    batch.forEach(function (story, i) { list.appendChild(storyRow(story, i)); });

    var more = $('news-more');
    more.hidden = !cut;
    if (cut) {
      var held = shown.length - NEWS_FREE;
      $('news-more-line').textContent = held === 1
        ? 'One more story today, and the rest of every day, with Premium.'
        : held + ' more stories today, and the rest of every day, with Premium.';
    }

    paintNewsBar(shown.length);
  }

  /*
   * "Something else to read", and where in the feed you are.
   *
   * PREMIUM ONLY, and hidden rather than disabled for everybody else. A
   * Standard profile is already being told, six stories down, exactly what it
   * is not getting and what that costs; a second greyed-out control saying the
   * same thing again is nagging, and this one would sit under a list that has
   * been cut at six, where "something else to read" is not even the right
   * offer. One pitch per screen.
   *
   * The line above it counts the whole filtered feed, so moving through it
   * never feels like being handed a random selection: eighteen of fifty-four,
   * then the next eighteen, and the button says when it has wrapped.
   */
  function paintNewsBar(total) {
    var bar = $('news-bar');
    if (!bar) return;
    if (!isPlus() || !news.stories) { bar.hidden = true; return; }
    bar.hidden = false;

    var btn = $('news-fresh');
    btn.disabled = news.busy;
    btn.textContent = news.busy ? 'Finding more\u2026' : 'Something else to read';

    if (total === undefined) return;
    var from = news.at * NEWS_PAGE + 1;
    var to = Math.min(total, from + NEWS_PAGE - 1);
    $('news-at').textContent = news.pages > 1
      ? 'Stories ' + from + '\u2013' + to + ' of ' + total
      : total === 1 ? 'One story' : 'All ' + total + ' of today\u2019s stories';
  }

  // One chip per publisher, with how many they filed. Tapping the one that is
  // already on clears it, so there is always a way back to everything.
  function paintNewsSources() {
    var counts = {};
    var order = [];
    news.stories.forEach(function (story) {
      if (counts[story.source] === undefined) { counts[story.source] = 0; order.push(story.source); }
      counts[story.source] += 1;
    });

    var wrap = $('news-sources');
    wrap.innerHTML = '';
    wrap.appendChild(newsChip('Everything', news.stories.length, ''));
    order.forEach(function (source) {
      wrap.appendChild(newsChip(source, counts[source], source));
    });
  }

  function newsChip(label, count, value) {
    var on = news.filter === value;
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'filter' + (on ? ' is-on' : '');
    btn.textContent = label + ' ' + count;
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    btn.addEventListener('click', function () {
      news.filter = on ? '' : value;
      // Back to the newest of whatever was just picked. Landing on batch three
      // of a publisher because that is where you were in the merged feed is
      // not a filter, it is a shuffle.
      news.at = 0;
      Sound.tick();
      paintNews();
    });
    return btn;
  }

  function storyRow(story, i) {
    var li = document.createElement('li');
    li.className = 'story';
    li.style.setProperty('--i', Math.min(i, 12));

    var head = document.createElement('button');
    head.type = 'button';
    head.className = 'story-head';
    head.setAttribute('aria-expanded', 'false');

    var title = document.createElement('div');
    title.className = 'story-title';

    var name = document.createElement('span');
    name.className = 'story-name';
    name.textContent = story.title;

    var meta = document.createElement('span');
    meta.className = 'story-meta';
    var source = document.createElement('span');
    source.className = 'story-source';
    source.textContent = story.source;
    meta.appendChild(source);
    var ago = whenWords(story.published);
    if (ago) meta.appendChild(document.createTextNode(' \u00b7 ' + ago));

    title.appendChild(name);
    title.appendChild(meta);

    var chevron = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    chevron.setAttribute('class', 'story-chevron');
    chevron.setAttribute('viewBox', '0 0 24 24');
    chevron.setAttribute('aria-hidden', 'true');
    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M6 9l6 6 6-6');
    chevron.appendChild(path);

    head.appendChild(title);
    head.appendChild(chevron);

    // The standfirst, and the way out to the whole piece. Both live inside the
    // fold so a list of forty headlines stays a list of forty headlines.
    var body = document.createElement('div');
    body.className = 'story-body';
    var slot = document.createElement('div');
    var inner = document.createElement('div');
    inner.className = 'story-inner';

    var summary = document.createElement('p');
    summary.className = 'story-sum';
    summary.textContent = story.summary || '';

    var go = document.createElement('a');
    go.className = 'go go-sm';
    go.href = story.link;
    go.target = '_blank';
    go.rel = 'noopener noreferrer';
    var label = document.createElement('span');
    label.className = 'go-label';
    label.textContent = 'Read the full article';
    go.appendChild(label);

    inner.appendChild(summary);
    inner.appendChild(go);
    slot.appendChild(inner);
    body.appendChild(slot);

    head.addEventListener('click', function () {
      var opening = !li.classList.contains('is-open');
      // One at a time. Forty open standfirsts is not a list any more.
      if (news.open && news.open !== li) {
        news.open.classList.remove('is-open');
        var other = news.open.querySelector('.story-head');
        if (other) other.setAttribute('aria-expanded', 'false');
      }
      li.classList.toggle('is-open', opening);
      head.setAttribute('aria-expanded', opening ? 'true' : 'false');
      news.open = opening ? li : null;
      Sound.tick();
    });

    li.appendChild(head);
    li.appendChild(body);
    return li;
  }

  // "3 days ago" reads faster than a date you have to work out. Anything older
  // than a fortnight gets the actual date, because "23 days ago" does not.
  function whenWords(at) {
    if (!at) return '';
    var gap = Date.now() - at;
    if (gap < 0) return '';
    var hours = Math.floor(gap / 3600000);
    if (hours < 1) return 'just now';
    if (hours < 24) return hours + (hours === 1 ? ' hour ago' : ' hours ago');
    var days = Math.floor(hours / 24);
    if (days <= 14) return days + (days === 1 ? ' day ago' : ' days ago');
    try {
      return new Date(at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
    } catch (err) {
      return '';
    }
  }

  $('news-retry').addEventListener('click', function () {
    news.stories = null;
    loadNews();
  });

  /*
   * READ ON, and what happens at the end of the pile.
   *
   * Two different jobs behind one button, because from the reader's side they
   * are the same request. While there is another batch it moves to it: no
   * network, instant, and genuinely different writing rather than the same
   * headlines re-sorted. At the end of the pile it goes back to the feeds
   * instead — the worker caches for a quarter of an hour, so a reader who has
   * got through everything may well be handed something that was not there
   * when they arrived, and if nothing has been filed since they are told they
   * are back at the top rather than left wondering why it looks familiar.
   *
   * A dead end would have been the easy version of this, and it is the one
   * thing the button must never be.
   */
  $('news-fresh').addEventListener('click', function () {
    if (news.busy || !news.stories) return;

    if (news.at + 1 < (news.pages || 1)) {
      Sound.tick();
      news.at += 1;
      paintNews();
      scrollNewsUp();
      return;
    }

    /*
     * At the end of the pile, so go back to the publishers. Said afterwards
     * rather than on a timer, so the words describe the list that is actually
     * on screen — and only one page deep, because a reader who has been
     * through several batches is told they have wrapped, while a reader whose
     * whole feed fits in one batch is told there is nothing new yet. Those are
     * different facts and the same button produced both.
     */
    var oneBatch = (news.pages || 1) < 2;
    Sound.tick();
    loadNews(true, function (result) {
      if (view !== 'news') return;
      scrollNewsUp();
      if (oneBatch && !result.fresh) {
        toast('\u{1F4F0}', 'Nothing new yet',
          'You have read everything the publishers have filed. There will be more ' +
          'by this evening.');
      } else {
        toast('\u{1F4F0}', 'Back to the top', 'Newest first again.');
      }
    });
  });

  /* The top of the list, not the top of the page: the header has not moved. */
  function scrollNewsUp() {
    var list = $('news-sources') || $('news-list');
    if (!list) return;
    try {
      list.scrollIntoView({ block: 'start', behavior: reduceMotion ? 'auto' : 'smooth' });
    } catch (e) {
      list.scrollIntoView(true);
    }
  }

  // One row, built once. Both the dish search and the aggregator list the same
  // thing in the same shape, and two copies of this markup was two places to
  // fix anything that turned out to be wrong with it.
  function fillPlaceList(list, places, onPick) {
    list.innerHTML = '';
    places.forEach(function (place, i) {
      var li = document.createElement('li');
      li.className = 'place-line';

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'place';
      btn.style.setProperty('--i', Math.min(i, 12));
      btn.dataset.placeId = place.id;
      btn.innerHTML =
        '<span class="place-rank"></span>' +
        '<span class="place-main"><span class="place-name"></span><span class="place-meta"></span></span>' +
        '<span class="place-far"><span class="place-dist"></span><span class="place-dir"></span></span>';
      btn.querySelector('.place-rank').textContent = i + 1;
      btn.querySelector('.place-name').textContent = place.name;
      btn.querySelector('.place-meta').textContent =
        [place.kind, place.address].filter(Boolean).join(' · ') || 'No details listed';
      btn.querySelector('.place-dist').textContent = place.distance;
      btn.querySelector('.place-dir').textContent = place.compass;
      btn.addEventListener('click', function () { onPick(place); });

      // The row selects; the link leaves. Keeping them separate means tapping
      // a place to see it on the map never navigates away by accident.
      var go = document.createElement('a');
      go.className = 'quiet place-go';
      go.textContent = 'Take me there';
      go.href = mapsDirections(place);
      go.target = '_blank';
      go.rel = 'noopener noreferrer';
      go.setAttribute('aria-label', 'Directions to ' + place.name + ' in Google Maps');

      li.appendChild(btn);
      li.appendChild(go);
      list.appendChild(li);
    });
  }

  // Picking a place used to do nothing but highlight a row, leaving the only way
  // out a small text link at the end of it. Now the choice puts a real
  // destination on screen with one thing to do with it.
  function selectPlace(place, options) {
    options = options || {};
    if (!options.quiet) Sound.tick();
    $$('.place').forEach(function (btn) {
      btn.classList.toggle('is-selected', btn.dataset.placeId === place.id);
    });

    $('chosen').hidden = false;
    $('chosen-name').textContent = place.name;
    $('chosen-meta').textContent = [place.distance + ' ' + place.compass, place.kind, place.address]
      .filter(Boolean).join(' \u00b7 ');

    var go = $('chosen-go');
    go.href = mapsDirections(place);
    go.setAttribute('aria-label', 'Directions to ' + place.name + ' in Google Maps');

    if (options.quiet) return;
    var row = $$('.place').filter(function (b) { return b.dataset.placeId === place.id; })[0];
    if (row) row.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  $('plan-btn').addEventListener('click', openPlan);
  $('plan-back').addEventListener('click', function () { setPanel('reward'); });
  $('seg-cook').addEventListener('click', function () { setPlanTab('cook'); });
  $('seg-out').addEventListener('click', function () { setPlanTab('out'); });
  $('locate-btn').addEventListener('click', findPlaces);
  $('out-retry').addEventListener('click', findPlaces);

  /* ---------------------------------------------------------------- dishes */
  var FILTERS = [
    { id: 'all',     label: 'Everything', test: function () { return true; } },
    { id: 'food',    label: 'Food',       test: function (d) { return d.tags.drink !== 1; } },
    { id: 'drink',   label: 'Drinks',     test: function (d) { return d.tags.drink === 1; } },
    { id: 'sweet',   label: 'Sweet',      test: function (d) { return d.tags.sweet === 1; } },
    { id: 'savoury', label: 'Savoury',    test: function (d) { return d.tags.sweet !== 1; } },
    { id: 'quick',   label: 'Quick',      test: function (d) { return d.tags.quick > 0; } },
    { id: 'healthy', label: 'Healthy',    test: function (d) { return d.tags.healthy > 0; } },
    { id: 'veg',     label: 'Vegetarian', test: function (d) { return d.tags.veg === 1; } }
  ];

  var activeFilter = 'all';
  var query = '';
  var filtersBuilt = false;

  /* ----------------------------------------------------------------- pantry */
  // "What can I make?" is a different question from "what do I fancy", and it
  // is answered off the ingredient lists rather than off the tags: a dish
  // tagged `carby quick homemade` says nothing about whether there is rice in
  // the cupboard.
  //
  // What is in the cupboard is kept in the profile, because typing it in twice
  // is how a feature like this gets used once.
  function pantryList() { return (progress.state.pantry || []).slice(); }

  function renderPantry() {
    var have = pantryList();
    var chips = $('pantry-chips');
    chips.innerHTML = '';

    have.forEach(function (thing) {
      var li = document.createElement('li');
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip-btn chip-removable';
      btn.innerHTML = '<span></span><span class="chip-x" aria-hidden="true">×</span>';
      btn.children[0].textContent = thing;
      btn.setAttribute('aria-label', 'Take ' + thing + ' out of the cupboard');
      btn.addEventListener('click', function () {
        progress.state.pantry = pantryList().filter(function (t) { return t !== thing; });
        progress.save();
        Sound.tick();
        renderPantry();
      });
      li.appendChild(btn);
      chips.appendChild(li);
    });

    $('pantry-empty').hidden = have.length > 0;
    renderPantryHits(have);
  }

  function renderPantryHits(have) {
    var hits = $('pantry-hits');
    hits.innerHTML = '';
    if (!have.length) return;

    var found = Recipes.fromPantry(have.join(','), 8);
    if (!found.length) {
      var none = document.createElement('li');
      none.className = 'fine';
      none.textContent = 'Nothing close enough yet. Two or three more things should do it.';
      hits.appendChild(none);
      return;
    }

    found.forEach(function (hit) {
      var dish = dishByName(hit.dish);
      var li = document.createElement('li');
      li.className = 'pantry-hit' + (hit.missing.length ? '' : ' is-ready');
      li.innerHTML =
        '<span class="pantry-icon" aria-hidden="true"></span>' +
        '<span class="pantry-what"><b></b><small></small></span>' +
        '<span class="pantry-gap"></span>';
      li.querySelector('.pantry-icon').textContent = dish ? dish.icon : '\u{1F373}';
      li.querySelector('b').textContent = hit.dish + ' · ' + hit.recipe.name;
      li.querySelector('small').textContent = readableTime(hit.recipe.time) +
        ' · serves ' + hit.recipe.serves;
      li.querySelector('.pantry-gap').textContent = hit.missing.length
        ? 'need ' + hit.missing.map(shortIngredient).join(', ')
        : 'you have it all';

      // The whole point is to start cooking, so the row opens the recipe.
      var open = document.createElement('button');
      open.type = 'button';
      open.className = 'pantry-go';
      open.textContent = hit.missing.length ? 'Look at it' : 'Cook it';
      open.addEventListener('click', function () {
        if (!premium('Cooking from your cupboard')) return;
        if (hit.missing.length) return dish && openSheet(dish);
        openCookMode(hit.recipe, hit.recipe.serves, dish);
      });
      li.appendChild(open);
      hits.appendChild(li);
    });
  }

  // "2 tbsp gochujang" is not what somebody needs to read in a list of what
  // they are missing. The noun is.
  function shortIngredient(line) {
    var words = Recipes.nouns(line);
    return words.length ? words.slice(0, 2).join(' ') : line.toLowerCase();
  }

  function addToPantry(text) {
    var parsed = Recipes.readPantry(text);
    if (!parsed.length) return false;
    var have = pantryList();
    parsed.forEach(function (thing) {
      if (have.indexOf(thing) === -1) have.push(thing);
    });
    progress.state.pantry = have.slice(0, 40);
    progress.save();
    renderPantry();
    return true;
  }

  $('pantry-toggle').addEventListener('click', function () {
    var open = $('pantry-body').hidden;
    if (open && !premium('Cooking from your cupboard')) return;
    $('pantry-body').hidden = !open;
    $('pantry-toggle').setAttribute('aria-expanded', open ? 'true' : 'false');
    $('pantry-toggle').textContent = open ? 'Close the cupboard' : 'Open the cupboard';
    if (open) {
      renderPantry();
      focusQuietly($('pantry-input'));
    }
  });

  $('pantry-input').addEventListener('keydown', function (event) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    if (addToPantry($('pantry-input').value)) {
      $('pantry-input').value = '';
      Sound.tick();
    }
  });

  // Commas as you go, so a whole cupboard can be typed in one line.
  $('pantry-input').addEventListener('input', function () {
    var text = $('pantry-input').value;
    if (text.indexOf(',') === -1) return;
    var parts = text.split(',');
    var last = parts.pop();
    if (addToPantry(parts.join(','))) $('pantry-input').value = last.replace(/^\s+/, '');
  });

  /* ----------------------------------------------------------------- themes */
  // Six palettes, and nothing else changes. Each one is a set of custom
  // properties on the root element; every pair in them meets the same contrast
  // rules as the one it ships with, because a theme that fails the legibility
  // audit is not a theme, it is a bug with a name on it.
  var THEMES = [
    { id: '', name: 'Charcoal', note: 'The original' },
    { id: 'ember', name: 'Ember', note: 'Warmer, redder' },
    { id: 'matcha', name: 'Matcha', note: 'Green and calm' },
    { id: 'ink', name: 'Ink', note: 'Blue and cold' },
    { id: 'paper', name: 'Paper', note: 'Light, for daylight' },
    { id: 'neon', name: 'Neon', note: 'Loud on purpose' }
  ];

  function applyTheme() {
    // A theme is Premium, so a lapsed subscription goes back to the one the app
    // ships with rather than keeping a perk it is no longer paying for.
    var id = isPlus() ? (progress.state.theme || '') : '';
    if (id) document.documentElement.setAttribute('data-theme', id);
    else document.documentElement.removeAttribute('data-theme');
    // The browser chrome follows the page, and so does the colour scheme —
    // otherwise the one light palette gets dark form controls and a dark
    // scrollbar bolted onto it.
    var ground = getComputedStyle(document.documentElement).getPropertyValue('--void');
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta && ground) meta.setAttribute('content', ground.trim());
    var scheme = document.querySelector('meta[name="color-scheme"]');
    if (scheme) scheme.setAttribute('content', id === 'paper' ? 'light' : 'dark');
    document.documentElement.style.colorScheme = id === 'paper' ? 'light' : 'dark';
  }

  function paintThemeMarks() {
    var current = progress.state.theme || '';
    $$('#themes .theme').forEach(function (btn) {
      var on = (btn.dataset.palette || '') === current;
      btn.classList.toggle('is-on', on);
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    });
  }

  function renderThemes() {
    var wrap = $('themes');
    wrap.innerHTML = '';
    var current = progress.state.theme || '';
    THEMES.forEach(function (theme) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'theme' + (theme.id === current ? ' is-on' : '');
      btn.dataset.palette = theme.id;
      btn.setAttribute('aria-pressed', theme.id === current ? 'true' : 'false');
      btn.innerHTML = '<span class="theme-swatch" aria-hidden="true">' +
        '<i class="theme-a"></i><i class="theme-b"></i><i class="theme-c"></i></span>' +
        '<span class="theme-what"><b></b><small></small></span>';
      btn.querySelector('b').textContent = theme.name;
      btn.querySelector('small').textContent = theme.note;
      btn.addEventListener('click', function () {
        if (!premium('Choosing a palette')) return;
        progress.state.theme = theme.id;
        progress.save();
        applyTheme();
        // Move the mark rather than rebuilding the row, or the button that was
        // just pressed stops existing and focus goes back to the top of a long
        // profile screen.
        paintThemeMarks();
        Sound.tick();
      });
      wrap.appendChild(btn);
    });
  }

  function buildFilters() {
    if (filtersBuilt) return;
    var wrap = $('dish-filters');
    FILTERS.forEach(function (f) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'filter' + (f.id === activeFilter ? ' is-on' : '');
      btn.textContent = f.label;
      btn.dataset.filter = f.id;
      btn.setAttribute('aria-pressed', f.id === activeFilter ? 'true' : 'false');
      btn.addEventListener('click', function () {
        activeFilter = f.id;
        $$('.filter').forEach(function (b) {
          var on = b.dataset.filter === activeFilter;
          b.classList.toggle('is-on', on);
          b.setAttribute('aria-pressed', on ? 'true' : 'false');
        });
        renderDishes();
      });
      wrap.appendChild(btn);
    });
    filtersBuilt = true;
  }

  // The words a dish can be found by: its name, its blurb, its own tags, and
  // where it comes from.
  //
  // That last part matters once the catalogue is global. People look for
  // "korean" or "african", not for bibimbap and doro wat by name — and without
  // it, searching "korean" found exactly one dish out of the four that are.
  // The cuisine words already exist in the venue lookups, so they are reused
  // rather than written out a second time and left to drift.
  function haystack(dish) {
    if (!dish._search) {
      var tags = Object.keys(dish.tags).filter(function (t) { return dish.tags[t] > 0; });
      var spec = Places.LOOKUP[dish.name] || {};
      var origin = [spec.cuisine, spec.label].filter(Boolean).join(' ').replace(/[|_]/g, ' ');
      dish._search = (dish.name + ' ' + dish.blurb + ' ' + tags.join(' ') + ' ' + origin).toLowerCase();
    }
    return dish._search;
  }

  function renderDishes() {
    buildFilters();
    var filter = FILTERS.filter(function (f) { return f.id === activeFilter; })[0];
    var needle = query.trim().toLowerCase();

    var matches = Data.ITEMS.filter(function (dish) {
      return filter.test(dish) && (!needle || haystack(dish).indexOf(needle) !== -1);
    });

    var grid = $('dish-grid');
    grid.innerHTML = '';
    matches.forEach(function (dish) {
      var li = document.createElement('li');
      var row = document.createElement('button');
      row.type = 'button';
      row.className = 'dish';
      row.innerHTML = '<span class="dish-art" aria-hidden="true"></span>' +
        '<span class="dish-name"></span><span class="dish-note"></span>';
      row.querySelector('.dish-art').textContent = dish.icon;
      row.querySelector('.dish-name').textContent = dish.name;
      // Still browsable when struck off — you have to be able to find one to
      // bring it back — but plainly marked.
      row.classList.toggle('is-struck', progress.isBanned(dish.name));
      row.querySelector('.dish-note').textContent = progress.isBanned(dish.name)
        ? 'Struck off' : dish.blurb;
      row.addEventListener('click', function () { openSheet(dish); });
      li.appendChild(row);
      grid.appendChild(li);
    });

    $('dish-empty').hidden = matches.length > 0;
    $('dish-count-label').textContent = matches.length === Data.ITEMS.length
      ? Data.ITEMS.length + ' dishes'
      : matches.length + ' of ' + Data.ITEMS.length + ' dishes';
  }

  // Describe a dish in the same words the questions use.
  function describe(dish) {
    return Data.QUESTIONS.map(function (q) {
      var v = dish.tags[q.tag] || 0;
      if (v === 1) return q.yesIcon + ' ' + q.yes;
      if (v === 0.5) return q.yesIcon + ' Sometimes ' + q.yes.toLowerCase();
      return null;
    }).filter(Boolean);
  }

  var sheet = $('dish-sheet');
  var sheetOpener = null;

  var sheetDish = null;

  function openSheet(dish) {
    sheetOpener = document.activeElement;
    sheetDish = dish;
    $('sheet-icon').textContent = dish.icon;
    $('sheet-name').textContent = dish.name;
    $('sheet-blurb').textContent = dish.blurb;

    var tags = $('sheet-tags');
    tags.innerHTML = '';
    describe(dish).forEach(function (labelText) {
      var li = document.createElement('li');
      li.textContent = labelText;
      tags.appendChild(li);
    });

    // The recipe, right here on the card — no need to play a game first.
    var list = Recipes.forDish(dish.name);
    var wrap = $('sheet-recipes');
    wrap.innerHTML = '';
    list.forEach(function (recipe, i) {
      wrap.appendChild(recipeCard(recipe, i, dish, { compact: true }));
    });
    if (!list.length) {
      var none = document.createElement('p');
      none.className = 'fine';
      none.textContent = 'No recipe written for this one.';
      wrap.appendChild(none);
    }
    paintVault('sheet-vault', 'sheet-lock');
    paintSheetActions();

    if (sheet.showModal) sheet.showModal();
    else sheet.setAttribute('open', '');
    sheet.scrollTop = 0;
    // Without preventScroll the browser scrolls the page to "reveal" a control
    // that is already fixed in the viewport, throwing away your place in the
    // list behind it.
    focusQuietly($('sheet-close'));
  }

  function paintSheetActions() {
    if (!sheetDish) return;
    var banned = progress.isBanned(sheetDish.name);
    $('sheet-flag').hidden = !banned;
    $('sheet-flag').textContent = 'Struck off — this never comes up.';
    // The marker is on the control rather than beside it, so nobody finds out
    // saving is Premium by pressing it. It hides itself once the tier is on.
    $('sheet-save').innerHTML = '<span></span> <span class="tag-premium">Premium</span>';
    $('sheet-save').firstChild.textContent = progress.isFavourite(sheetDish.name) ? 'Saved' : 'Save it';
    $('sheet-save').setAttribute('aria-pressed', progress.isFavourite(sheetDish.name) ? 'true' : 'false');
    $('sheet-save').disabled = banned;
    $('sheet-ban').textContent = banned ? 'Bring it back' : 'Never again';
  }

  $('sheet-save').addEventListener('click', function () {
    if (!sheetDish) return;
    if (!premium('Saving a dish')) return;
    var result = progress.toggleFavourite(sheetDish);
    if (result === 'full') {
      Sound.reject();
      return toast('\u{2728}', 'Saved list is full', 'That is as many as this profile holds.');
    }
    Sound.tick();
    paintSheetActions();
    renderIntro();
  });

  $('sheet-ban').addEventListener('click', function () {
    if (!sheetDish) return;
    if (!premium('Striking a dish off for good')) return;
    if (progress.isBanned(sheetDish.name)) progress.unban(sheetDish.name);
    else {
      progress.ban(sheetDish.name);
      toast(sheetDish.icon, 'Struck off', sheetDish.name + ' will not come up again.');
    }
    Sound.tick();
    applyRules();
    paintSheetActions();
    renderDishes();
    renderIntro();
  });

  function closeSheet() {
    if (sheet.close) sheet.close();
    else sheet.removeAttribute('open');
    focusQuietly(sheetOpener);
  }

  function focusQuietly(el) {
    if (!el || !el.focus) return;
    try { el.focus({ preventScroll: true }); } catch (err) { el.focus(); }
  }

  $('sheet-close').addEventListener('click', closeSheet);
  // Clicking the backdrop (outside the panel) closes it too.
  sheet.addEventListener('click', function (event) {
    if (event.target === sheet) closeSheet();
  });

  $('dish-search').addEventListener('input', function (event) {
    query = event.target.value;
    renderDishes();
  });

  /* --------------------------------------------------------------- profile */
  function renderProfile() {
    var level = progress.level();
    var state = progress.state;

    /*
     * The affiliate block's own line, grounded the same way the prompt's is.
     *
     * This screen already knows how much somebody has used the app, and that
     * is the only honest argument for why they of all people should have a
     * link. No rate and no amount: this file does not know them, and the page
     * at the other end does.
     */
    var settled = state.decisions || 0;
    $('earn-wrap-line').textContent = settled
      ? 'You have settled ' + settled + ' ' + (settled === 1 ? 'dinner' : 'dinners') +
        ' in here. Somebody you know has the same problem.'
      : '';

    $('profile-name').textContent = level.name;
    $('profile-xp').textContent = state.xp;
    $('profile-xp-fill').style.width = Math.round(level.pct * 100) + '%';
    $('profile-next').textContent = level.next
      ? (level.needed - level.into) + ' XP to ' + level.next.name
      : 'top level reached';

    $('tile-decisions').textContent = state.decisions;
    $('tile-streak').textContent = state.streak;
    $('tile-dishes').textContent = Object.keys(state.picks).length;

    renderPlus();
    renderFavourites();
    renderRules();
    renderCustomRules();
    renderBanned();
    renderInsights();
    renderThemes();
    paintTuneSummary();

    var freezes = state.freezes || 0;
    $('freeze-note').hidden = !isPlus();
    if (isPlus()) {
      $('freeze-note').textContent = freezes === 1
        ? '1 streak freeze in hand — miss a day and your streak holds.'
        : freezes + ' streak freezes in hand — miss a day and your streak holds.';
    }

    var axes = $('axes');
    axes.innerHTML = '';
    progress.taste().forEach(function (axis) {
      var el = document.createElement('div');
      el.className = 'axis' + (axis.total ? '' : ' is-empty');
      el.innerHTML = '<span class="axis-end"></span><span class="axis-track"><i></i></span>' +
                     '<span class="axis-end axis-end-right"></span>';
      el.children[0].textContent = axis.no;
      el.children[2].textContent = axis.yes;
      el.querySelector('i').style.left = 'calc(' + (axis.lean * 100) + '% - .25rem)';
      axes.appendChild(el);
    });

    var badges = $('badges');
    badges.innerHTML = '';
    ProgressLib.BADGES.forEach(function (badge) {
      var earned = progress.hasBadge(badge.id);
      var el = document.createElement('div');
      el.className = 'badge' + (earned ? ' is-earned' : '');
      el.innerHTML = '<span class="badge-icon" aria-hidden="true"></span><b></b><small></small>';
      el.querySelector('.badge-icon').textContent = earned ? badge.icon : '🔒';
      el.querySelector('b').textContent = badge.name;
      el.querySelector('small').textContent = badge.hint;
      badges.appendChild(el);
    });
    $('badge-progress').textContent = state.badges.length + ' / ' + ProgressLib.BADGES.length;

    renderHistory();

    paintStreak();
    paintKnobs();
  }

  /* ----------------------------------------------------------- the tier */
  // The same five groups, in the same order, as the /premium page. A flat list
  // of twenty-four lines reads as noise; grouped, it reads as five things you
  // are buying. Each group is headed, and every head says Premium, because the
  // one question this list has to answer is what is on the other side of the
  // paywall.
  var PERK_SECTIONS = [
    {
      name: 'Ways to play',
      items: [
        'Knockout: an 8-dish bracket, watch it fill in round by round',
        'Blitz: thirty seconds, a streak to build, and rounds that change the rules',
        'This or that: a running champion against whatever challenges it',
        'Shortlist: eight dishes, tap out the ones you are not in the mood for',
        'Together: up to six of you round one phone, one dish you can all live with',
        'Swipe: like three out of the deck, then choose between the three',
        'Endless with no daily count on it \u2014 free stops at ' + ENDLESS_DAY + ' picks a day',
        'A second wind: one run-ending clock, survived, every run',
        'Themed runs \u2014 an evening of nothing but quick, or comfort, or veg'
      ]
    },
    {
      name: 'The shared browser',
      items: [
        'Order it together: one browser, a cursor each, from your own phones',
        'Order from here: a nearby place\u2019s own site, driven by both of you',
        'Cook along: two kitchens, one recipe video, kept in step',
        'Shop the list together: one basket, filled by both of you'
      ]
    },
    {
      name: 'Control what comes up',
      items: [
        'Always avoid: ban anything, not just the six standing rules',
        'Meal slot, heat dial, and mix-it-up on every decision',
        'Guest at the table \u2014 extra avoids for this sitting only',
        '\u201cNot today\u201d to shelve a dish, and don\u2019t repeat this week'
      ]
    },
    {
      name: 'Once you have decided',
      items: [
        'Cook mode: one step at a time, with a timer built in',
        'Cook from what is already in your kitchen',
        'Scale any recipe and take a shopping list to the shop',
        'A side with that, and a planned week of seven dishes',
        'Write me a menu: three courses that go together, with the recipes',
        'Mood shortcuts and instant picks \u2014 no questions at all'
      ]
    },
    {
      name: 'It gets to know you',
      items: [
        'Picks tuned to what you have actually liked',
        'Something new: two questions, then dishes chosen from what you liked',
        'Rate a dish and it changes what comes up next',
        'Save as many dishes as you like \u2014 the free tier saves none',
        'Streak freezes, so one missed day costs nothing',
        'Six palettes to pick from'
      ]
    }
  ];

  function renderPlus() {
    var on = isPlus();
    var signedIn = premiumApi.isSignedIn();

    $('plus-state').textContent = on ? 'On' : 'Off';
    $('plus-note').textContent = on
      ? 'Every Premium feature is live' + (premiumApi.status.username ? ', ' + premiumApi.status.username : '') + '.'
      : signedIn
        ? 'Signed in, but not subscribed yet. The first three days are free.'
        : 'Free profiles keep the game, the catalogue and the badges. Everything marked Premium is off \u2014 three days free switches all of it on.';

    $('plus-toggle').textContent = on ? 'Manage subscription' : 'Try it free';
    $('plus-toggle').href = on ? 'https://whop.com/@me/settings/memberships/' : premiumApi.upgradeUrl();

    $('buy-btn').hidden = on;
    $('buy-refresh').hidden = !on;
    $('buy-note').textContent = on
      ? 'Cancel any time — you keep Premium until the period you already paid for ' +
        'runs out.'
      : 'Free for three days, then $3.45/month — cancel before it ends and you ' +
        'are not charged. Tax may be added depending on where you are, so the ' +
        'total can come to a little over that; checkout shows it before you pay. ' +
        'Sign in on any device and Premium is already on.';

    var list = $('perks');
    list.innerHTML = '';
    PERK_SECTIONS.forEach(function (section) {
      var head = document.createElement('li');
      head.className = 'perk-head';
      head.appendChild(document.createTextNode(section.name));
      var tag = document.createElement('span');
      tag.className = 'perk-tag';
      tag.textContent = on ? 'Yours' : 'Premium';
      head.appendChild(tag);
      list.appendChild(head);

      section.items.forEach(function (text) {
        var li = document.createElement('li');
        li.className = on ? 'is-on' : '';
        li.textContent = text;
        list.appendChild(li);
      });
    });
  }

  function repaintVaults() {
    ['cook-vault:cook-lock', 'out-vault:out-lock', 'sheet-vault:sheet-lock']
      .forEach(function (pair) {
        var parts = pair.split(':');
        paintVault(parts[0], parts[1]);
      });
    // Every "Premium" marker in the page at once. They are there to sell the
    // tier, and once it is bought they are labels on things you already own.
    document.body.classList.toggle('is-premium', isPlus());
  }

  /* --------------------------------------------------------------- premium */
  // The one and only question, asked of this site's own session rather than
  // of a pasted key: is the Whop account signed into this browser one that
  // owns morsels45 Premium? Called on load, and again whenever this tab
  // regains focus — which is exactly what "opened checkout in a new tab,
  // paid, came back here" looks like.
  // The top bar is fixed above the whole page, landing included, so it is
  // the one place that always shows who is signed in — the same account
  // strip the rest of the site (home, /premium, /account) already carries.
  function paintTopbar(status) {
    var account = $('topbar-account');
    if (account) {
      account.classList.toggle('is-premium', !!status.hasPremium);
      if (status.signedIn) {
        account.textContent = status.hasPremium
          ? (status.username || 'Account') + ' · Premium'
          : status.username || 'Account';
        account.href = '/account';
      } else {
        account.textContent = 'Sign in';
        account.href = '/api/oauth/login?redirect_to=%2Fdecide%2F';
      }
    }
    var premiumLink = $('topbar-premium');
    if (premiumLink) premiumLink.textContent = status.hasPremium ? 'Premium ✓' : 'Premium';
  }

  function syncPremium(announce) {
    return premiumApi.refresh().then(function (status) {
      var was = isPlus();
      progress.setPlus(status.hasPremium);
      paintTopbar(status);
      applyTaste();
      applyRules();
      renderProfile();
      renderIntro();
      repaintVaults();
      // The news page reads isPlus() to decide how much of the feed to show
      // and whether to offer the rest of it. Somebody sitting on that page
      // when their status lands would otherwise keep the free six, and the
      // only way out of it was to leave the tab and come back.
      if (news.stories) paintNews();
      if (announce && status.hasPremium && !was) {
        Sound.win();
        Confetti.burst({ y: window.innerHeight * 0.35 });
        toast('\u{2728}', 'Premium is on', 'Picks now follow what you have liked.');
      }
      return status;
    });
  }

  window.addEventListener('focus', function () { syncPremium(true); });

  // Tag -> the words the questions actually use, so the profile reads back in
  // the app's own language: "Actual food", not "drink".
  var TAG_WORDS = {};
  Data.QUESTIONS.forEach(function (q) { TAG_WORDS[q.tag] = { yes: q.yes, no: q.no }; });

  function renderInsights() {
    var lines = Taste.insights(progress.state, Data.ITEMS, Date.now(), TAG_WORDS);
    var show = isPlus() ? lines : [];
    var list = $('insights');
    list.innerHTML = '';

    show.forEach(function (line) {
      var li = document.createElement('li');
      li.innerHTML = '<span class="insight-label"></span><span class="insight-value"></span>' +
        '<span class="insight-note"></span>';
      li.children[0].textContent = line.label;
      li.children[1].textContent = line.value;
      li.children[2].textContent = line.note;
      list.appendChild(li);
    });

    $('insight-empty').hidden = show.length > 0;
    $('insight-empty').textContent = !isPlus()
      ? 'Premium reads your history back to you.'
      : 'Not much yet. Make a few decisions and this fills in.';
  }

  function renderBanned() {
    var names = progress.bannedNames();
    var list = $('ban-list');
    list.innerHTML = '';
    names.forEach(function (name) {
      var dish = dishByName(name);
      if (!dish) return;
      list.appendChild(chip({ name: name, icon: dish.icon }, function () {
        openSheet(dish);
      }, function () {
        progress.unban(name);
        Sound.tick();
        applyRules();
        renderBanned();
        renderDishes();
        toast(dish.icon, 'Back on the menu', name + ' can come up again.');
      }));
    });
    $('ban-empty').hidden = names.length > 0;
  }

  // The six named rules cover the common ones; this covers everything else the
  // question bank knows about, which is the only honest way to say "anything".
  var NAMED_RULES = ProgressLib.RULES.map(function (r) { return r.tag; });

  function renderCustomRules() {
    var wrap = $('custom-rules');
    wrap.innerHTML = '';

    Data.QUESTIONS.forEach(function (question) {
      // Skip the three openers: banning "hot" or "sweet" outright removes half
      // the catalogue and the game with it.
      if (question.opens || NAMED_RULES.indexOf(question.tag) !== -1) return;

      var on = progress.hasCustomRule(question.tag);
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'filter' + (on ? ' is-on' : '');
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.textContent = question.ban;
      btn.title = 'Never serve me this, whatever I answer';
      btn.addEventListener('click', function () {
        if (!premium('Custom rules')) return;
        var nowOn = progress.toggleCustomRule(question.tag);
        btn.classList.toggle('is-on', nowOn);
        btn.setAttribute('aria-pressed', nowOn ? 'true' : 'false');
        applyRules();
        Sound.tick();
      });
      wrap.appendChild(btn);
    });
  }

  function renderHistory() {
    var entries = progress.state.history || [];
    var history = $('history');
    history.innerHTML = '';

    entries.slice(0, 12).forEach(function (entry) {
      var li = document.createElement('li');
      li.innerHTML = '<span aria-hidden="true"></span><b></b><time></time>' +
        '<button class="chip-x" type="button"></button>';
      li.children[0].textContent = entry.icon;

      var verdict = progress.ratingOf(entry.name);
      var mark = verdict && VERDICTS.filter(function (v) { return v.id === verdict; })[0];
      li.children[1].textContent = entry.name + (mark ? '  ' + mark.icon : '');
      if (mark) li.children[1].title = mark.label;

      li.children[2].textContent = when(entry.at);
      if (entry.at) li.children[2].dateTime = new Date(entry.at).toISOString();

      var x = li.children[3];
      x.innerHTML = '&times;';
      x.setAttribute('aria-label', 'Forget ' + entry.name + ' on ' + when(entry.at).toLowerCase());
      x.addEventListener('click', function () {
        progress.forget(entry.name, entry.at);
        Sound.tick();
        applyTaste();          // it was steering the picks; now it is not
        renderHistory();
        renderInsights();
        renderIntro();
      });

      history.appendChild(li);
    });

    $('history-empty').hidden = entries.length > 0;
  }

  function renderFavourites() {
    var favourites = progress.state.favourites || [];
    var list = $('fav-list');
    list.innerHTML = '';
    favourites.forEach(function (entry) {
      list.appendChild(chip(entry, function (e) {
        var dish = dishByName(e.name);
        if (dish) openSheet(dish);
      }, function (e) {
        var dish = dishByName(e.name);
        if (dish) progress.toggleFavourite(dish);
        Sound.tick();
        renderFavourites();
        renderIntro();
      }));
    });
    $('fav-empty').hidden = favourites.length > 0;
    $('fav-empty').textContent = isPlus()
      ? 'Nothing saved yet. Hit Save it on a result.'
      : 'Keeping a dish is part of Premium. Everything else here stays free.';
  }

  /* ------------------------------------------------------------ taste tuner */
  // What somebody is in the mood for changes, so this stays a screen you can
  // come back to rather than a question the sign-up only ever asked once.
  //
  // One control, three states: tap once for love, twice for never, three
  // times for neither — cheaper reading than two separate lists of
  // checkboxes for the same information. All four already exist and already
  // feed the engine (ratings, strikes, standing rules, taste leanings), so
  // this is a way into the model rather than a new one beside it.
  var tunerDialog = $('tuner');
  var setupLikes = {};      // tag or dish name -> 'loved' | 'banned'

  // A spread across the catalogue rather than the first twenty, so the
  // choice is representative of what is in here rather than of how it is
  // ordered.
  function tuneDishes() {
    var every = Math.max(1, Math.floor(Data.ITEMS.length / 24));
    return Data.ITEMS.filter(function (item, i) { return i % every === 0; }).slice(0, 24);
  }

  function tuneState(key) { return setupLikes[key] || ''; }

  function cycleTune(key, btn, label) {
    var now = tuneState(key);
    if (!now) setupLikes[key] = 'loved';
    else if (now === 'loved') setupLikes[key] = 'banned';
    else delete setupLikes[key];
    Sound.tick();
    // The pressed button repaints itself rather than the whole list being
    // rebuilt, which would drop the keyboard focus or the mouse hover on it.
    paintTune(btn, key, label);
    paintTuneCount();
  }

  function paintTune(btn, key, label) {
    var state = tuneState(key);
    btn.className = 'tune' + (state ? ' is-' + state : '');
    btn.setAttribute('aria-pressed', state ? 'true' : 'false');
    btn.querySelector('.tune-mark').textContent =
      state === 'loved' ? '\u2665' : state === 'banned' ? '\u2715' : '';
    btn.setAttribute('aria-label', label +
      (state === 'loved' ? ' \u2014 love it'
        : state === 'banned' ? ' \u2014 never'
        : ' \u2014 no opinion'));
  }

  function tuneButton(key, label, icon) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.innerHTML = '<span class="tune-icon" aria-hidden="true"></span>' +
      '<span class="tune-label"></span><span class="tune-mark" aria-hidden="true"></span>';
    btn.querySelector('.tune-icon').textContent = icon || '';
    btn.querySelector('.tune-label').textContent = label;
    paintTune(btn, key, label);
    btn.addEventListener('click', function () { cycleTune(key, btn, label); });
    return btn;
  }

  function renderTasteSetup() {
    var tags = $('setup-tags');
    tags.innerHTML = '';
    Data.TASTES.forEach(function (taste) {
      tags.appendChild(tuneButton('tag:' + taste.tag, taste.label, taste.icon));
    });

    var dishes = $('setup-dishes');
    dishes.innerHTML = '';
    tuneDishes().forEach(function (dish) {
      dishes.appendChild(tuneButton('dish:' + dish.name, dish.name, dish.icon));
    });

    paintTuneCount();
  }

  function paintTuneCount() {
    var loved = 0, banned = 0;
    Object.keys(setupLikes).forEach(function (key) {
      if (setupLikes[key] === 'loved') loved++; else banned++;
    });
    $('setup-count').textContent = !loved && !banned
      ? 'Nothing picked yet — that is fine, I will work it out as you play.'
      : loved + ' loved, ' + banned + ' never again.';
  }

  // What the taps mean, once. Tags become standing rules and taste leanings;
  // dishes become ratings and strikes.
  function applyTasteSetup() {
    Object.keys(setupLikes).forEach(function (key) {
      var parts = key.split(':');
      var what = parts[0], name = parts.slice(1).join(':');
      var verdict = setupLikes[key];

      if (what === 'dish') {
        if (verdict === 'loved') progress.rate(name, 'loved');
        else progress.ban(name);
        return;
      }

      if (verdict === 'banned') {
        progress.setCustomRule(name, true);
        return;
      }
      progress.setLove(name, true);
    });
    progress.state.tuned = progress.state.tuned || Object.keys(setupLikes).length > 0;
    progress.save();
  }

  // Rebuild the three lists from what is on screen rather than adding to
  // what was there, so unticking something removes it rather than leaving it
  // behind.
  function clearTasteChoices() {
    Object.keys(progress.state.ratings || {}).forEach(function (name) {
      if (progress.state.ratings[name] === 'loved') progress.rate(name, null);
    });
    progress.bannedNames().forEach(function (name) { progress.unban(name); });
    progress.lovedTags().forEach(function (tag) { progress.setLove(tag, false); });
    (progress.state.customRules || []).slice().forEach(function (tag) {
      progress.setCustomRule(tag, false);
    });
  }

  // Opening it seeds the controls from what the profile already says, so it
  // reads as editing rather than as starting again.
  function openTuner() {
    setupLikes = {};
    Object.keys(progress.state.ratings || {}).forEach(function (name) {
      if (progress.state.ratings[name] === 'loved') setupLikes['dish:' + name] = 'loved';
    });
    progress.bannedNames().forEach(function (name) { setupLikes['dish:' + name] = 'banned'; });
    progress.lovedTags().forEach(function (tag) { setupLikes['tag:' + tag] = 'loved'; });
    (progress.state.customRules || []).forEach(function (tag) {
      setupLikes['tag:' + tag] = 'banned';
    });
    renderTasteSetup();
    if (tunerDialog.showModal) tunerDialog.showModal();
    else tunerDialog.setAttribute('open', '');
  }

  function closeTuner() {
    setupLikes = {};
    if (tunerDialog.close) tunerDialog.close();
    else tunerDialog.removeAttribute('open');
  }

  $('tuner-cancel').addEventListener('click', closeTuner);
  $('tuner-close').addEventListener('click', closeTuner);

  $('tuner-save').addEventListener('click', function () {
    Sound.tick();
    clearTasteChoices();
    applyTasteSetup();
    closeTuner();
    applyRules();
    applyTaste();
    renderProfile();
    renderDishes();
    renderIntro();
    toast('\u{2764}', 'Noted', 'Your picks will follow that from now on.');
  });

  function paintTuneSummary() {
    var loved = progress.lovedTags().length + Object.keys(progress.state.ratings || {})
      .filter(function (n) { return progress.state.ratings[n] === 'loved'; }).length;
    var never = progress.bannedNames().length + (progress.state.customRules || []).length;
    $('tune-summary').textContent = !loved && !never
      ? 'Nothing set yet. I am going on how you play.'
      : loved + ' loved, ' + never + ' ruled out.';
  }

  $('tune-btn').addEventListener('click', function () {
    if (!premium('Tuning what you like')) return;
    openTuner();
  });

  // Standing rules feed straight into the engine, so a banned dish never comes
  // up and its question never gets asked again.
  function renderRules() {
    var wrap = $('diet-rules');
    wrap.innerHTML = '';
    ProgressLib.RULES.forEach(function (rule) {
      var on = isPlus() && progress.hasRule(rule.tag);
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'rule' + (on ? ' is-on' : '') + (isPlus() ? '' : ' is-locked');
      btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      btn.innerHTML = '<span></span><span class="rule-state"></span>';
      btn.children[0].textContent = rule.label;
      btn.children[1].textContent = on ? 'On' : (isPlus() ? 'Off' : 'Premium');
      btn.title = isPlus() ? rule.note : 'Always avoid is part of Premium';
      btn.addEventListener('click', function () {
        // Always avoid is Premium. On Standard the buttons are visible so
        // people can see the feature, but they must not actually ban anything.
        if (!premium('Always avoid')) return;
        var nowOn = progress.toggleRule(rule.tag);
        btn.classList.toggle('is-on', nowOn);
        btn.setAttribute('aria-pressed', nowOn ? 'true' : 'false');
        btn.children[1].textContent = nowOn ? 'On' : 'Off';
        applyRules();
        Sound.tick();
      });
      wrap.appendChild(btn);
    });
  }

  function applyRules() {
    // Standing bans (Always avoid, custom rules, Never again) are Premium.
    // A Standard profile that somehow has them stored must not have them
    // applied — otherwise the free tier quietly behaves like Premium.
    if (!isPlus()) {
      game.setBans([]);
      game.setExcluded([]);
      return;
    }
    var tags = progress.allRules().slice();
    guestTags.forEach(function (tag) {
      if (tags.indexOf(tag) === -1) tags.push(tag);
    });
    if (progress.state.heat === 'none' && tags.indexOf('spicy') === -1) tags.push('spicy');
    game.setBans(tags);
    game.setExcluded(progress.bannedNames());
  }

  // "Not today" has to hold inside a played game as well, or the promise only
  // covers the screens that happen to filter. A rejection is the right weight
  // for it: heavily suppressed, but not banned, so answering your way straight
  // back to it still works.
  function applySnoozes() {
    if (!isPlus()) return;
    var now = Date.now();
    Object.keys(progress.state.snoozed || {}).forEach(function (name) {
      if (progress.isSnoozed(name, now)) game.reject(name);
    });
  }

  function when(time) {
    if (!time) return '';
    var days = Math.floor((Date.now() - time) / 86400000);
    if (days <= 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return days + ' days ago';
    return new Date(time).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  }

  /* ------------------------------------------------------------- lifecycle */
  function resetGame() {
    toastQueue = [];
    duel.live = false;
    // A new game, and a fresh prompt budget for it. Every mode in the app
    // comes through here, which is what makes "per game" mean the same thing
    // in Endless, Knockout and the ordinary question flow alike.
    startGameBudget();
    // Order matters: the bias is read while the prior is built, and the bans are
    // applied to the weights afterwards.
    applyTaste();
    game.reset();
    applyRules();
    applySnoozes();
    current = null;
    shownItem = null;
    rankedItems = [];
    sessionXp = 0;
    rejections = 0;
    busy = false;
    shortcut = false;
    tunedTo = null;
    $('rate-wrap').hidden = true;
    $('reaction').textContent = '';
    $('q-text').textContent = 'What sounds better?';
  }

  function restart() {
    hideLanding();
    // "Decide for me" is the ordinary game, whatever was half-played before it.
    // Left live, a together run would keep intercepting step() and cap this one
    // at five questions.
    together.live = false;
    together.sets = [];
    together.sending = false;
    resetGame();
    applyKnobs();
    setView('decide');
    step();
  }

  function goHome() {
    // Walking away from a half-finished run still counts: those were real
    // preferences. Only an explicit restart throws them away.
    if (duel.pending.length) bankDuel();
    if (knockout.pending.length) bankKnockout();
    if (blitz.readyTimer) { clearTimeout(blitz.readyTimer); blitz.readyTimer = null; }
    if (blitz.timer) { clearInterval(blitz.timer); blitz.timer = null; }
    if (blitz.live) { blitz.live = false; bankBlitz(); }
    if (spinTimer) { clearTimeout(spinTimer); spinTimer = null; }
    // A half-played handover is over the moment somebody leaves it: it is a
    // mode rather than an answer set, and leaving it live would send the next
    // ordinary game through togetherStep() instead of the engine's own
    // stopping rule.
    together.live = false;
    together.sets = [];
    together.sending = false;
    // Same reasoning for the deck: leaving it is leaving it, and a live deck
    // would keep answering the arrow keys from wherever you went next.
    swipe.live = false;
    swipe.choosing = false;
    swipe.drag = null;
    leaveEndless();
    renderIntro();
    setPanel('home');
    setView('decide');
    showLanding();
  }

  /* ----------------------------------------------------------------- wiring */
  $('choice-yes').addEventListener('click', function (e) { answer('yes', e.currentTarget); });
  $('choice-no').addEventListener('click', function (e) { answer('no', e.currentTarget); });
  $('choice-either').addEventListener('click', function (e) { answer('either', e.currentTarget); });
  $('choice-neither').addEventListener('click', function (e) { answer('neither', e.currentTarget); });
  $('restart-btn').addEventListener('click', restart);
  $('accept-btn').addEventListener('click', accept);
  $('reject-btn').addEventListener('click', rejectCurrent);
  $('again-btn').addEventListener('click', goHome);
  $('done-again-btn').addEventListener('click', restart);
  // Sharing the dish they just accepted, not the one they were offered.
  $('done-share-btn').addEventListener('click', function () {
    shareDish(acceptedItem || shownItem, 'morsels45 says eat ');
  });

  // The other half of the ask: not "look what I got" but "what do you want".
  $('done-invite-btn').addEventListener('click', startTogetherLink);

  $('done-profile-btn').addEventListener('click', function () { setView('profile'); });

  function undo() {
    if (busy || shortcut) return;
    if (game.undo()) { Sound.back(); step(); $('reaction').textContent = ''; return; }
    // Nothing behind question one — back means home, not a dead button.
    goHome();
  }

  $('back-btn').addEventListener('click', undo);

  function toggleSound() {
    progress.state.muted = !progress.state.muted;
    progress.save();
    applyMute();
    if (!progress.state.muted) Sound.tick();
  }

  $('setting-sound').addEventListener('click', toggleSound);

  function applyMute() {
    var muted = progress.state.muted;
    Sound.setMuted(muted);
    $('setting-sound').textContent = muted ? 'Off' : 'On';
    $('setting-sound').setAttribute('aria-pressed', muted ? 'false' : 'true');
  }

  $('profile-reset-btn').addEventListener('click', function () {
    if (!window.confirm('Wipe all XP, badges, streaks, saved dishes, ratings and history? ' +
      'Your subscription and your palette are kept. This cannot be undone.')) return;
    progress.reset();
    applyTheme();
    applyRules();
    applyTaste();
    repaintVaults();
    renderProfile();
    renderIntro();
  });

  /* ------------------------------------------------------------- shortcuts */
  // The keys below have worked for a long time and nothing told anybody. This
  // is the card that does, on ? from anywhere and from the small ? beside the
  // question counter for people who are not going to guess a keystroke.
  var keysSheet = $('keys');
  var keysOpener = null;

  function openKeys() {
    keysOpener = document.activeElement;
    if (keysSheet.showModal) keysSheet.showModal();
    else keysSheet.setAttribute('open', '');
  }

  function closeKeys() {
    if (keysSheet.close) keysSheet.close();
    else keysSheet.removeAttribute('open');
    if (keysOpener && keysOpener.focus) keysOpener.focus();
    keysOpener = null;
  }

  $('keys-btn').addEventListener('click', openKeys);
  $('keys-close').addEventListener('click', closeKeys);

  document.addEventListener('keydown', function (event) {
    if (event.key !== '?') return;
    // Not while something else has the keyboard, and not mid-word in a search
    // box — "?" is a character there, not a command.
    var el = document.activeElement;
    var typing = el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
    if (typing) return;
    if (keysSheet.open) return closeKeys();
    if (sheet.open || cookDialog.open || listSheet.open) return;
    event.preventDefault();
    openKeys();
  });

  document.addEventListener('keydown', function (event) {
    if (keysSheet.open) return;
    if (sheet.open) return;
    if (view !== 'decide' || busy) return;

    if (panel === 'duel') {
      if (event.key === '1' || event.key === 'ArrowLeft') chooseDuel('a');
      else if (event.key === '2' || event.key === 'ArrowRight') chooseDuel('b');
      else return;
      return event.preventDefault();
    }

    // Same two keys as the duel, and nothing else: there is no undo in a run
    // that never stops, and no third answer to reach for.
    if (panel === 'endless') {
      if (!endless.live) return;
      // Not the key repeat. Holding 1 down fires keydown at whatever rate the
      // operating system repeats at — thirty a second on most — which buys
      // time faster than the clock can spend it and racks up a score nobody
      // played for. Every other mode here is untimed, so a held key was only
      // ever a way to answer questions slightly faster.
      if (event.repeat) return event.preventDefault();
      if (event.key === '1' || event.key === 'ArrowLeft') takeEndless('a');
      else if (event.key === '2' || event.key === 'ArrowRight') takeEndless('b');
      else return;
      return event.preventDefault();
    }

    if (panel === 'swipe') {
      // On the shortlist the deck is paused, so the arrows have nothing to
      // move and the numbers run left to right across the cards on screen.
      if (swipe.choosing) {
        var nth = Number(event.key);
        if (nth >= 1 && nth <= swipe.picks.length) landSwipe(swipe.picks[nth - 1]);
        else if (event.key === 'Backspace') undoSwipe();
        else return;
        return event.preventDefault();
      }
      if (event.key === 'ArrowLeft') takeSwipe('no');
      else if (event.key === 'ArrowRight') takeSwipe('yes');
      else if (event.key === 'Backspace') undoSwipe();
      else return;
      return event.preventDefault();
    }

    if (panel !== 'question') return;
    var key = event.key;
    // The number keys run left to right across whatever is actually on screen,
    // so 3 is the first way out of the question and 4 the second. On a question
    // with no middle there is only one, and 3 is it.
    var hasNeither = !$('choice-neither').hidden;
    if (key === '1' || key === 'ArrowLeft') answer('yes', $('choice-yes'));
    else if (key === '2' || key === 'ArrowRight') answer('no', $('choice-no'));
    else if (key === '3' && hasNeither) answer('neither', $('choice-neither'));
    else if (key === '3' || key === '4' || key === 'ArrowDown') answer('either', $('choice-either'));
    else if (key === 'Backspace') { event.preventDefault(); undo(); }
    else return;
    event.preventDefault();
  });

  /* --------------------------------------------------------------- extras */
  // Three free, seven Premium. All of them live on the same profile and the
  // same catalogue — they change how a sitting starts, not what the app is.

  var PARTY = [
    { id: '',      label: 'Doesn\u2019t matter' },
    { id: 'solo',  label: 'Just me' },
    { id: 'table', label: 'A table' }
  ];

  var MEALS = [
    { id: '',          label: 'Any time' },
    { id: 'breakfast', label: 'Breakfast' },
    { id: 'lunch',     label: 'Lunch' },
    { id: 'dinner',    label: 'Dinner' },
    { id: 'late',      label: 'Late' }
  ];

  var HEATS = [
    { id: '',     label: 'No view' },
    { id: 'none', label: 'Keep spice off' },
    { id: 'hot',  label: 'Give it a kick' }
  ];

  var ADVENTURES = [
    { id: '',      label: 'The usual mix' },
    { id: 'stick', label: 'Stick to what I like' },
    { id: 'wild',  label: 'Reach for the long tail' }
  ];

  var GUESTS = [
    { tag: 'meat',    label: 'No meat tonight' },
    { tag: 'seafood', label: 'No seafood' },
    { tag: 'spicy',   label: 'Nothing spicy' },
    { tag: 'cheesy',  label: 'No cheese' }
  ];

  var MEAL_ANSWERS = {
    breakfast: [['light', 'yes'], ['quick', 'yes']],
    lunch:     [['quick', 'yes']],
    dinner:    [['light', 'no']],
    late:      [['quick', 'yes'], ['homemade', 'no']]
  };

  function applyKnobs() {
    var answers = [];
    var party = progress.state.party || '';
    if (party === 'solo') answers.push(['shareable', 'no']);
    if (party === 'table') answers.push(['shareable', 'yes']);

    if (isPlus()) {
      var mealAnswers = MEAL_ANSWERS[progress.state.meal];
      if (mealAnswers) answers = answers.concat(mealAnswers);
      if (progress.state.heat === 'hot') answers.push(['spicy', 'yes']);
    }

    var banned = progress.allRules().concat(guestTags);
    answers.forEach(function (pair) {
      if (banned.indexOf(pair[0]) !== -1) return;
      game.answer(pair[0], pair[1]);
    });
  }

  function paintKnobRow(id, options, current, onPick, locked) {
    var wrap = $(id);
    if (!wrap) return;
    wrap.innerHTML = '';
    options.forEach(function (opt) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'knob' + (opt.id === current ? ' is-on' : '') + (locked ? ' is-locked' : '');
      btn.textContent = opt.label;
      btn.addEventListener('click', function () { onPick(opt.id); });
      wrap.appendChild(btn);
    });
  }

  function setParty(id) {
    progress.state.party = id;
    progress.save();
    paintKnobs();
    Sound.tick();
  }

  function setMeal(id) {
    if (!premium('Meal slot')) return;
    progress.state.meal = id;
    progress.save();
    paintKnobs();
    Sound.tick();
  }

  function setHeat(id) {
    if (!premium('Heat dial')) return;
    progress.state.heat = id;
    progress.save();
    applyRules();
    paintKnobs();
    Sound.tick();
  }

  function setAdventure(id) {
    if (!premium('Mix it up')) return;
    progress.state.adventure = id;
    progress.save();
    applyTaste();
    paintKnobs();
    Sound.tick();
  }

  function toggleGuest(tag) {
    if (!premium('Guest at the table')) return;
    var at = guestTags.indexOf(tag);
    if (at === -1) guestTags.push(tag);
    else guestTags.splice(at, 1);
    applyRules();
    paintKnobs();
    Sound.tick();
  }

  function paintKnobs() {
    paintKnobRow('party-knobs', PARTY, progress.state.party || '', setParty, false);
    paintKnobRow('meal-knobs', MEALS, progress.state.meal || '', setMeal, !isPlus());
    paintKnobRow('heat-knobs', HEATS, progress.state.heat || '', setHeat, !isPlus());
    paintKnobRow('adventure-knobs', ADVENTURES, progress.state.adventure || '', setAdventure, !isPlus());

    var guestWrap = $('guest-knobs');
    if (guestWrap) {
      guestWrap.innerHTML = '';
      GUESTS.forEach(function (opt) {
        var on = guestTags.indexOf(opt.tag) !== -1;
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'knob' + (on ? ' is-on' : '') + (isPlus() ? '' : ' is-locked');
        btn.textContent = opt.label;
        btn.addEventListener('click', function () { toggleGuest(opt.tag); });
        guestWrap.appendChild(btn);
      });
    }

    var noRepeat = !!progress.state.noRepeat;
    if ($('norepeat-state')) {
      $('norepeat-state').textContent = noRepeat ? 'On' : 'Off';
      $('norepeat-toggle').textContent = noRepeat ? 'On' : 'Off';
    }
  }

  $('norepeat-toggle').addEventListener('click', function () {
    if (!premium('Don\u2019t repeat this week')) return;
    progress.state.noRepeat = !progress.state.noRepeat;
    progress.save();
    paintKnobs();
    Sound.tick();
  });

  function pairingFor(dish) {
    var isDrink = (dish.tags.drink || 0) === 1;
    var pool = Data.ITEMS.filter(function (d) {
      if (d.name === dish.name) return false;
      if (progress.isBanned(d.name)) return false;
      if (isDrink) return (d.tags.drink || 0) !== 1 && ((d.tags.light || 0) === 1 || (d.tags.quick || 0) === 1);
      return (d.tags.drink || 0) === 1 || (d.tags.light || 0) === 1;
    });
    if (!pool.length) return null;
    pool.sort(function (a, b) {
      return Taste.similarity(dish, a) - Taste.similarity(dish, b);
    });
    return pool[Math.min(2, pool.length - 1)];
  }

  function paintPair(dish) {
    var wrap = $('pair');
    if (!wrap) return;
    if (!isPlus()) {
      wrap.hidden = false;
      $('pair-btn').textContent = 'Unlock a pairing';
      return;
    }
    var side = pairingFor(dish);
    if (!side) { wrap.hidden = true; return; }
    wrap.hidden = false;
    $('pair-btn').textContent = side.icon + ' ' + side.name;
    $('pair-btn').dataset.name = side.name;
  }

  $('pair-btn').addEventListener('click', function () {
    if (!premium('A side with that')) return;
    var name = $('pair-btn').dataset.name;
    var dish = name ? dishByName(name) : null;
    if (dish) openSheet(dish);
  });

  function shareVerdict() {
    shareDish(shownItem, 'morsels45 says eat ');
  }

  // Sharing is not only for a verdict. Anything with a name can be sent to
  // somebody — including a dish found by browsing, which until now could be
  // saved and banned but not passed on to the person you are eating with.
  // Must match slugify() in src/lib/dishes.ts — the server looks the slug up in
  // the real catalogue, and a link it cannot resolve loses the dish's name.
  function slugFor(name) {
    return String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }

  function shareDish(dish, lead) {
    if (!dish) return;
    var text = (lead || 'morsels45 says eat ') + dish.name + '.';
    // A streak is the one thing here worth bragging about, and a brag travels
    // further than a recommendation does. Only from three days — below that it
    // is not a streak, it is two days.
    var streak = progress.state.streak;
    if (streak >= 3) text += ' ' + streak + ' days running now.';
    // Land on the dish, not the front door. /eat/<dish> previews as the answer
    // that was actually sent — a name, a picture and a way in — where /decide/
    // arrived in the other person's messages as a bare URL under some text.
    var slug = slugFor(dish.name);
    var url = (typeof location !== 'undefined' && location.origin)
      ? location.origin + (slug ? '/eat/' + slug : '/decide/')
      : '';
    if (navigator.share) {
      navigator.share({ title: 'morsels45', text: text, url: url }).catch(function () {});
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text + (url ? ' ' + url : '')).then(function () {
        toast('\\u{1F4CB}', 'Copied', text);
      }).catch(function () {
        toast('\\u{1F37D}\\u{FE0F}', 'Share it', text);
      });
      return;
    }
    toast('\\u{1F37D}\\u{FE0F}', 'Share it', text);
  }

  $('share-btn').addEventListener('click', shareVerdict);

  // "How about" rather than "eat this": the browsed dish is a suggestion, not
  // the answer to a game somebody played.
  $('sheet-share').addEventListener('click', function () {
    shareDish(sheetDish, 'How about ');
  });

  function hashDay(str) {
    var n = 0;
    for (var i = 0; i < str.length; i++) n = ((n << 5) - n + str.charCodeAt(i)) | 0;
    return Math.abs(n);
  }

  function tonightDish() {
    var now = new Date();
    var hour = now.getHours();
    var key = now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate();
    var pool = Data.ITEMS.filter(function (d) {
      if (progress.isBanned(d.name)) return false;
      if (hour >= 5 && hour < 11) {
        return (d.tags.light === 1 || d.tags.sweet === 1 || d.tags.quick === 1) && d.tags.spicy !== 1;
      }
      if (hour >= 11 && hour < 16) {
        return d.tags.quick === 1 || d.tags.shareable === 1 || d.tags.light === 1;
      }
      if (hour >= 16 && hour < 22) {
        return d.tags.drink !== 1;
      }
      return d.tags.quick === 1 || d.tags.comfort === 1 || d.tags.fried === 1;
    });
    if (!pool.length) pool = Data.ITEMS.slice();
    return pool[hashDay(key) % pool.length];
  }

  function showTonight() {
    var dish = tonightDish();
    if (!dish) return;
    hideLanding();
    resetGame();
    shortcut = true;
    // The alternatives behind "not quite" used to be seven dishes drawn at
    // random from the whole catalogue — which ignored bans, snoozes and
    // everything the profile knows, and could hand back something the player
    // had explicitly said never again to. favouredDishes() honours all three.
    rankedItems = [dish].concat(
      favouredDishes()
        .map(function (r) { return r.item; })
        .filter(function (d) { return d !== dish; })
        .slice(0, 7),
    );
    setView('decide');
    setPanel('result');
    $('result-icon').classList.add('is-landed');
    showResult(dish, { animate: false });
    $('result-eyebrow').textContent = 'Tonight\u2019s pick';
    $('accept-btn').disabled = false;
    $('reject-btn').disabled = false;
    Sound.reveal();
  }

  $('tonight-btn').addEventListener('click', showTonight);

  /*
   * Shortlist: eight from what you like, and now a say in which eight.
   *
   * It used to deal eight dishes, spin, and land on one at random while the
   * player watched. Everything about that was decided before they touched
   * anything. Now the eight arrive struck-outable: tap the ones you are not in
   * the mood for, and it spins what is left. Two has to survive, because a
   * shortlist of one is not a shortlist and there is nothing to spin.
   */
  var spin = { pool: [], out: [], running: false, stopping: 0, at: 0 };

  function startSpin() {
    if (!premium('Shortlist')) return;
    hideLanding();
    var ranked = favouredDishes();
    var pool = ranked.slice(0, 8).map(function (r) { return r.item; });
    if (pool.length < 4) {
      pool = shuffled(Data.ITEMS, Math.random).slice(0, 8);
    }
    spin.pool = pool;
    spin.out = [];

    setView('decide');
    setPanel('spin');
    $('spin-name').textContent = 'Eight on the table';
    $('spin-face').textContent = pool[0].icon;
    paintSpin();
  }

  function spinLeft() {
    return spin.pool.filter(function (d) { return spin.out.indexOf(d) < 0; });
  }

  function paintSpin() {
    var list = $('spin-list');
    list.innerHTML = '';
    spin.pool.forEach(function (dish) {
      var li = document.createElement('li');
      var out = spin.out.indexOf(dish) >= 0;
      li.textContent = dish.icon + ' ' + dish.name;
      li.className = out ? 'is-out' : '';
      li.setAttribute('role', 'button');
      li.setAttribute('tabindex', '0');
      li.setAttribute('aria-pressed', out ? 'true' : 'false');
      li.title = out ? 'Put it back' : 'Not in the mood for this one';
      var toggle = function () {
        if (spin.running) return;                    // not mid-spin
        if (out) spin.out = spin.out.filter(function (d) { return d !== dish; });
        else if (spinLeft().length > 2) spin.out.push(dish);
        else return toast('\u{1F914}', 'Keep at least two',
          'A shortlist of one is just a dish.');
        Sound.tick();
        paintSpin();
      };
      li.addEventListener('click', toggle);
      li.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
      });
      list.appendChild(li);
    });

    var left = spinLeft().length;
    // Repainting while the reel is running would overwrite "Stop it" with
    // "Spin all eight" — the one label that must not lie mid-spin.
    if (spin.running) return;

    $('spin-status').textContent = spin.out.length
      ? 'Tap any back in, then stop the reel on the one you want.'
      : 'Eight on the table. Tap out anything you are not in the mood for, then stop the reel yourself.';
    $('spin-go-label').textContent = left === spin.pool.length
      ? 'Spin all ' + left
      : 'Spin the ' + left;
    $('spin-refill').hidden = !spin.out.length;
    paintThinNote($('spin-thin'), 'these are ranked on what you have liked before');
  }

  /*
   * YOU STOP IT. That is the whole mode.
   *
   * Striking dishes out first was the fix for "eight appeared and one landed
   * and I had no say", and it only got halfway: it made the odds yours, then
   * played an eighteen-tick cutscene and told you the answer. The moment the
   * thing actually lands — the only moment anybody cares about — was still
   * something you watched.
   *
   * So the reel does not stop on its own. It runs until you hit Stop, and
   * then it slows and lands on whatever it is showing. Where it stops really
   * is where you stopped it: the winner is read off the reel rather than
   * drawn separately, so timing it is a real thing you can get good at and a
   * real thing you can fluff.
   *
   * There is a ceiling on it anyway. A reel nobody stops would spin forever,
   * including after the phone goes in a pocket, so it gives up on its own
   * after a while and lands where it is.
   */
  var SPIN_MAX_TICKS = 90;      // about twelve seconds, then it lands itself
  var SPIN_SLOWING = 7;         // ticks spent decelerating after Stop

  function runSpin() {
    var pool = spinLeft();
    if (pool.length < 2) return;

    // Already spinning: this press is the Stop.
    if (spin.running) return stopSpin();

    var list = $('spin-list');
    var live = Array.prototype.filter.call(list.children, function (li) {
      return !li.classList.contains('is-out');
    });

    spin.running = true;
    spin.stopping = 0;
    spin.at = 0;
    $('spin-go-label').textContent = 'Stop it';
    $('spin-go').classList.add('is-stopping');
    $('spin-refill').hidden = true;
    $('spin-status').textContent = 'Stop it where you want it.';

    // reduceMotion still gets a choice, just a much shorter one to make.
    var floor = reduceMotion ? 220 : 70;

    (function tick() {
      // Walked away mid-spin — the rail, the back button, a shared link. The
      // reel stops where it is and lands nobody anywhere: without this the
      // timer kept running in a panel nobody was looking at and then yanked
      // them onto a result screen out of a section they had left.
      if (panel !== 'spin') return abandonSpin();

      var dish = pool[spin.at % pool.length];
      $('spin-face').textContent = dish.icon;
      $('spin-name').textContent = dish.name;
      live.forEach(function (li, i) { li.classList.toggle('is-on', pool[i % pool.length] === dish); });
      Sound.roll();
      spin.at += 1;

      if (spin.stopping) {
        spin.stopping += 1;
        if (spin.stopping > SPIN_SLOWING) return landSpin(pool, dish);
        // Each tick after Stop is slower than the last, so it visibly runs
        // out rather than being cut off.
        spinTimer = setTimeout(tick, floor + spin.stopping * spin.stopping * 14);
        return;
      }

      if (spin.at >= SPIN_MAX_TICKS) return landSpin(pool, dish);
      spinTimer = setTimeout(tick, floor);
    })();
  }

  /* Stop the reel and leave everything as it was. Lands nothing. */
  function abandonSpin() {
    if (spinTimer) clearTimeout(spinTimer);
    spinTimer = null;
    spin.running = false;
    spin.stopping = 0;
    $('spin-go').classList.remove('is-stopping');
  }

  function stopSpin() {
    if (!spin.running || spin.stopping) return;
    Sound.tick();
    spin.stopping = 1;
    $('spin-go-label').textContent = 'Landing\u2026';
  }

  /* Whatever the reel is showing is the answer. */
  function landSpin(pool, winner) {
    if (spinTimer) clearTimeout(spinTimer);
    spinTimer = null;
    spin.running = false;
    spin.stopping = 0;
    $('spin-go').classList.remove('is-stopping');

    resetGame();
    shortcut = true;
    // Only what survived: "not quite" should never hand back something the
    // player has just struck off the list themselves.
    rankedItems = pool.slice();
    setPanel('result');
    $('result-icon').classList.add('is-landed');
    showResult(winner, { animate: false });
    $('result-eyebrow').textContent = spin.out.length
      ? 'You stopped the ' + pool.length + ' you kept on'
      : 'You stopped it on';
    $('accept-btn').disabled = false;
    $('reject-btn').disabled = false;
    Sound.reveal();
    Confetti.burst({ y: window.innerHeight * 0.3 });
  }

  $('spin-btn').addEventListener('click', startSpin);
  $('spin-go').addEventListener('click', runSpin);
  $('spin-refill').addEventListener('click', function () {
    spin.out = [];
    Sound.tick();
    paintSpin();
  });
  $('spin-cancel').addEventListener('click', function () { abandonSpin(); goHome(); });

  /* ------------------------------------------------------------------ swipe */
  // A deck, one dish at a time: right for yes, left for no, and three yeses
  // end it with a choice between the three.
  //
  // WHAT A "NO" DOES, which is the only part that is not a dating app. Passing
  // on something is the most specific thing you have said all sitting, so the
  // rest of the deck re-sorts away from it: turn down the ramen and the other
  // noodle soups sink with it. Being picky is what makes the deck good, which
  // is the opposite of how a shuffle behaves — there, the twentieth card is as
  // random as the first, and by then you have stopped looking.
  //
  // Similarity is Taste.similarity, the same measure the duel uses to pick a
  // fair pairing, so "like the one you rejected" means the same thing here as
  // everywhere else in the app.
  //
  // Swipes are deliberately not written to the profile. A left swipe means
  // "not tonight", not "never again", and a mode somebody plays for ninety
  // seconds should not quietly rewrite what the app believes about them. The
  // result screen's own accept and reject still do that, as they do for every
  // other mode.
  var SWIPE_DECK = 24;
  var SWIPE_THROW = 0.26;   // of the card's width — how far commits a swipe
  var SWIPE_COOL = 2;       // how hard a rejection pushes its lookalikes down
  var SWIPE_LEAN = 90;      // px of drag at which a stamp is fully on
  /*
   * HOW MANY YESES END THE DECK.
   *
   * One used to. That is the wrong number for a deck, and it is the wrong
   * number for the reason a deck exists: the first thing you like is not the
   * best thing you like, it is the first thing you saw. Ending there turns
   * twenty-four cards into a stopwatch measuring how long somebody held out.
   *
   * Three is a decision with something in it. You swipe right on three, and
   * then you choose between three things you have already said yes to — which
   * is a much easier question than the one the deck was asking, and a much
   * better one than "was that first card good enough".
   *
   * And if none of the three survive being looked at together, the deck is
   * still there: keep going, and it ends on a decision or on the screen that
   * says no decision was made. There is no third exit.
   */
  var SWIPE_PICKS = 3;

  var swipe = { deck: [], seen: [], picks: [], live: false, choosing: false, drag: null };

  function startSwipe() {
    if (!premium('Swipe')) return;
    hideLanding();
    resetGame();
    setView('decide');
    swipe.live = true;
    swipe.choosing = false;
    swipe.seen = [];
    swipe.picks = [];
    swipe.deck = dealSwipe();
    setPanel('swipe');
    renderSwipe();
  }

  // The deck starts in profile order, so the first card is already a decent
  // guess rather than a random one. `base` keeps that opening opinion around:
  // re-sorting after a pass has to move a dish *relative to* what the profile
  // thought of it, or one rejection would throw the whole ranking away.
  function dealSwipe() {
    paintThinNote($('swipe-thin'), 'the deck is ordered by what you have liked before',
      THIN_SWIPE);
    var ranked = favouredDishes();
    if (ranked.length < 4) {
      ranked = shuffled(Data.ITEMS, Math.random).slice(0, SWIPE_DECK)
        .map(function (item) { return { item: item }; });
    }
    var pool = ranked.slice(0, SWIPE_DECK);
    return pool.map(function (entry, i) {
      return { item: entry.item, base: pool.length > 1 ? i / (pool.length - 1) : 0, cool: 0 };
    });
  }

  function coolOn(dish) {
    swipe.deck.forEach(function (entry) {
      entry.cool += Taste.similarity(dish, entry.item);
    });
    swipe.deck.sort(function (a, b) {
      return (a.base + a.cool * SWIPE_COOL) - (b.base + b.cool * SWIPE_COOL);
    });
  }

  /*
   * Three states, and the panel is always in exactly one of them:
   *
   *   dealing   — cards to swipe
   *   choosing  — the shortlist, waiting for one of them to be picked
   *   empty     — the deck ran out with nothing chosen
   *
   * `choosing` is set by the caller rather than worked out from the deck,
   * because "you have three, choose" and "the deck ended and here is what you
   * have" are the same screen reached two different ways, and the deck being
   * non-empty does not tell them apart.
   */
  // The card a finger would actually land on: the last one that is not already
  // on its way out.
  function topSwipeCard() {
    var kids = $('swipe-deck').children;
    for (var i = kids.length - 1; i >= 0; i--) {
      if (!kids[i].classList.contains('is-gone')) return kids[i];
    }
    return null;
  }

  function renderSwipe(choosing) {
    var deck = $('swipe-deck');

    /*
     * Cards still in flight are kept, and this is what unfroze the mode.
     *
     * Clearing the deck outright took any card mid-throw with it, so the only
     * way to make a throw look like a throw was to freeze everything until the
     * animation had finished — and that freeze silently ate the next swipe.
     * Measured: anything under 350ms between swipes was dropped, which is
     * ordinary swiping speed, so a deck gone through at a normal pace lost
     * most of it.
     *
     * A thrown card removes itself when it lands (see flingCard), so it does
     * not need this function's help to disappear. It only needs not to be
     * destroyed on the way out.
     */
    var flying = [];
    Array.prototype.forEach.call(deck.children, function (el) {
      if (el.classList.contains('is-gone')) flying.push(el);
    });
    deck.innerHTML = '';
    // Held on the state, not just in this call, so the keyboard and the drag
    // handler know the deck is paused. Without it the arrow keys go on
    // swiping cards nobody can see while the shortlist is up.
    swipe.choosing = !!choosing;
    var dealing = !choosing && swipe.deck.length > 0;

    deck.hidden = !dealing;
    $('swipe-actions').hidden = !dealing;
    $('swipe-status').hidden = !dealing;
    $('swipe-picks').hidden = !choosing;
    $('swipe-empty').hidden = dealing || !!choosing;

    if (choosing) return renderPicks();

    if (dealing) {
      // Last in the DOM is the card on top, so the stack needs building back
      // to front. Three deep: past that nothing is visible.
      swipe.deck.slice(0, 3).reverse().forEach(function (entry, i, all) {
        deck.appendChild(swipeCard(entry.item, all.length - 1 - i));
      });
      // Last in the DOM is the top of the stack, so the one being thrown goes
      // back on the end — it should fly over the new card, not under it.
      flying.forEach(function (el) { deck.appendChild(el); });
      // What is left to do, not what has been done: the count that matters in
      // this mode is how many more yeses end it. Past three there is no count
      // left to give — this is somebody who came back from the shortlist for
      // more, so it says what they can do rather than what they owe.
      var want = SWIPE_PICKS - swipe.picks.length;
      var left = swipe.deck.length + ' left';
      $('swipe-status').textContent = !swipe.picks.length
        ? 'Right for yes, left for no. Like three and you choose between them.'
        : want > 0
          ? 'Liked ' + swipe.picks.length + ' of ' + SWIPE_PICKS + ' \u00b7 ' +
            (want === 1 ? 'one more and you pick' : want + ' more and you pick') +
            ' \u00b7 ' + left
          : 'Liked ' + swipe.picks.length + ' \u00b7 like another to add it, or ' +
            'keep passing \u00b7 ' + left;
    }
    $('swipe-undo').disabled = !swipe.seen.length;
  }

  /*
   * The shortlist: the things this sitting already said yes to, side by side.
   *
   * Reached with three of them the ordinary way, and with one or two when the
   * deck runs out — because having liked two things and being shown "no
   * decision made" would be a lie about what just happened.
   */
  var COUNT_WORDS = ['no', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight'];

  function countWord(n) {
    return COUNT_WORDS[n] || String(n);
  }

  function renderPicks() {
    var n = swipe.picks.length;
    var full = n >= SWIPE_PICKS;
    // Short of three only ever means the deck ran out, and saying "pick one of
    // your three" over two cards is the kind of small lie that makes a screen
    // feel broken.
    $('swipe-picks-title').textContent = full
      ? countWord(n) + ' you liked. Pick one.'
      : 'That is the whole deck \u2014 and ' + countWord(n).toLowerCase() +
        (n === 1 ? ' you liked.' : ' you liked.');
    $('swipe-picks-line').textContent = full
      ? 'You swiped right on these. Whichever you pick is the answer; the rest go back in the pile.'
      : 'You did not get to three, but you did like ' + (n === 1 ? 'this one' : 'these') +
        '. It is still an answer.';

    var list = $('swipe-picked');
    list.innerHTML = '';
    swipe.picks.forEach(function (dish) {
      var li = document.createElement('li');
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'swipe-pick';

      var face = document.createElement('span');
      face.className = 'swipe-pick-face';
      face.setAttribute('aria-hidden', 'true');
      face.textContent = dish.icon;

      var name = document.createElement('span');
      name.className = 'swipe-pick-name';
      name.textContent = dish.name;

      var blurb = document.createElement('span');
      blurb.className = 'swipe-pick-blurb';
      blurb.textContent = dish.blurb;

      [face, name, blurb].forEach(function (el) { button.appendChild(el); });
      button.addEventListener('click', function () { landSwipe(dish); });
      li.appendChild(button);
      list.appendChild(li);
    });

    // "Keep looking" is only an offer when there is something left to look at.
    // With an empty deck the way on is a fresh one, which the empty screen
    // already offers, so the button would be a dead end wearing a promise.
    $('swipe-more').hidden = !swipe.deck.length;
  }

  function swipeCard(dish, depth) {
    var card = document.createElement('article');
    card.className = 'swipe-card';
    card.style.setProperty('--depth', String(depth));

    var yes = document.createElement('span');
    yes.className = 'swipe-stamp swipe-stamp-yes';
    yes.textContent = 'Yes';
    var no = document.createElement('span');
    no.className = 'swipe-stamp swipe-stamp-no';
    no.textContent = 'Nope';

    var face = document.createElement('span');
    face.className = 'swipe-face';
    face.setAttribute('aria-hidden', 'true');
    face.textContent = dish.icon;

    var name = document.createElement('h2');
    name.className = 'swipe-name';
    name.textContent = dish.name;

    // The dish's own strong tags, which already read as words — "hot",
    // "cheesy", "handheld". Three is enough to place it without becoming a
    // spec sheet.
    var tags = document.createElement('p');
    tags.className = 'swipe-tags';
    tags.textContent = Object.keys(dish.tags)
      .filter(function (t) { return dish.tags[t] === 1; })
      .slice(0, 3).join(' \u00b7 ');

    var blurb = document.createElement('p');
    blurb.className = 'swipe-blurb';
    blurb.textContent = dish.blurb;

    [yes, no, face, name, tags, blurb].forEach(function (el) { card.appendChild(el); });
    if (depth === 0) dragSwipe(card);
    return card;
  }

  // Pointer events rather than touch events: one path that covers a finger, a
  // trackpad and a mouse, and it comes with capture, so a fast flick that
  // leaves the card still ends on the card.
  function dragSwipe(card) {
    card.addEventListener('pointerdown', function (event) {
      if (swipe.drag || !swipe.live || swipe.choosing) return;
      swipe.drag = { id: event.pointerId, x: event.clientX, y: event.clientY, dx: 0 };
      card.classList.add('is-dragging');
      try { card.setPointerCapture(event.pointerId); } catch (err) { /* not fatal */ }
    });

    card.addEventListener('pointermove', function (event) {
      var drag = swipe.drag;
      if (!drag || drag.id !== event.pointerId) return;
      drag.dx = event.clientX - drag.x;
      leanCard(card, drag.dx, event.clientY - drag.y);
    });

    var release = function (event) {
      var drag = swipe.drag;
      if (!drag || drag.id !== event.pointerId) return;
      swipe.drag = null;
      card.classList.remove('is-dragging');

      /*
       * A throw that is not accepted has to come back.
       *
       * takeSwipe refuses while the previous card is still in flight, and this
       * used to hand that refusal straight back as `return takeSwipe(...)` —
       * so the card was left lying wherever the finger let go of it, tilted,
       * having done nothing at all. Two swipes out of three inside the fling
       * window vanished that way, which is exactly what a broken mode looks
       * like from the outside.
       *
       * Now the throw is only over if it was taken; otherwise the card snaps
       * home and the swipe can simply be made again.
       */
      var far = card.offsetWidth * SWIPE_THROW;
      var thrown = drag.dx > far ? 'yes' : drag.dx < -far ? 'no' : '';
      if (thrown && takeSwipe(thrown)) return;
      leanCard(card, 0, 0);
    };
    card.addEventListener('pointerup', release);
    card.addEventListener('pointercancel', release);
  }

  function leanCard(card, dx, dy) {
    card.style.transform = 'translate(' + dx + 'px, ' + dy + 'px) rotate(' + (dx / 18) + 'deg)';
    card.style.setProperty('--yes', String(Math.max(0, Math.min(1, dx / SWIPE_LEAN))));
    card.style.setProperty('--no', String(Math.max(0, Math.min(1, -dx / SWIPE_LEAN))));
  }

  // Answers whether the swipe was taken. The drag handler needs to know: a
  // refusal means the card has to be put back rather than left where it fell.
  // Answers whether the swipe was taken. The drag handler needs to know: a
  // refusal means the card has to be put back rather than left where it fell.
  function takeSwipe(dir) {
    if (!swipe.live || swipe.choosing || !swipe.deck.length) return false;
    var dish = swipe.deck[0].item;
    // The last child is not reliably the top card any more: a card still
    // flying is parked at the end of the deck so it draws over the new stack.
    // Throwing that one again would animate a card that has already left and
    // leave the real top card sitting there.
    var card = topSwipeCard();

    // The whole deck is banked before the change, so undo is a restore rather
    // than an attempt to run the re-sort backwards. The shortlist is banked
    // with it, so undoing a yes takes the dish back off the list too.
    swipe.seen.push({ deck: swipe.deck.slice(), picks: swipe.picks.slice(), dir: dir });
    swipe.deck = swipe.deck.slice(1);

    if (dir === 'yes') {
      swipe.picks.push(dish);
      Sound.roll();
    } else {
      coolOn(dish);
      Sound.tick();
    }

    /*
     * Thrown and redrawn in the same breath.
     *
     * The card leaves under its own animation and takes itself out of the DOM
     * when it lands; the deck behind it is rebuilt straight away, so the next
     * card is on top and draggable immediately rather than in three hundred
     * milliseconds. renderSwipe leaves the card in flight alone, which is what
     * makes doing both at once possible.
     */
    var way = dir === 'yes' ? 1 : -1;

    /*
     * Three liked, or the deck ran dry — either way this was the last swipe
     * and the shortlist is next.
     *
     * The ending keeps the old order: the card flies, THEN the screen changes.
     * Switching while it is still in the air makes it disappear rather than
     * leave, and this is the one throw worth watching. Nothing is lost by
     * waiting here because there is nothing left to swipe — choosing is set
     * straight away so a hurried extra swipe in those few hundred
     * milliseconds is turned down rather than half-applied.
     */
    if (swipe.picks.length >= SWIPE_PICKS || (!swipe.deck.length && swipe.picks.length)) {
      swipe.choosing = true;
      flingCard(card, way, chooseSwipe);
      return true;
    }

    // The ordinary case: the card leaves under its own animation and removes
    // itself when it lands, while the deck behind it is rebuilt immediately,
    // so the next card is draggable now rather than in three hundred
    // milliseconds.
    flingCard(card, way, null);
    renderSwipe();
    return true;
  }

  // Stop dealing and put the shortlist up. `live` stays on: the deck is not
  // finished with, it is only paused, and "keep looking" resumes it.
  function chooseSwipe() {
    Sound.reveal();
    renderSwipe(true);
  }

  function flingCard(card, way, then) {
    var land = function () {
      if (card && card.parentNode) card.parentNode.removeChild(card);
      if (then) then();
    };
    if (!card || reduceMotion) return land();
    card.classList.add('is-gone');
    card.style.transform = 'translate(' + (way * 140) + '%, 6%) rotate(' + (way * 18) + 'deg)';
    card.style.pointerEvents = 'none';
    setTimeout(land, 290);
  }

  // One of the shortlist wins. The others are not thrown away — they go to the
  // front of the "check again" pool, because two dishes this person has
  // already said yes to are the two best next answers in the building.
  function landSwipe(dish) {
    swipe.live = false;
    swipe.choosing = false;
    resetGame();
    shortcut = true;
    var others = swipe.picks.filter(function (d) { return d !== dish; });
    rankedItems = [dish].concat(others)
      .concat(swipe.deck.slice(0, 7).map(function (e) { return e.item; }));
    setPanel('result');
    $('result-icon').classList.add('is-landed');
    showResult(dish, { animate: false });
    $('result-eyebrow').textContent = 'Out of the three, you chose';
    $('accept-btn').disabled = false;
    $('reject-btn').disabled = false;
    Sound.reveal();
    Confetti.burst({ y: window.innerHeight * 0.3 });
  }

  function undoSwipe() {
    var last = swipe.seen.pop();
    if (!last) return;
    swipe.deck = last.deck;
    swipe.picks = last.picks || [];
    Sound.back();
    renderSwipe();
  }

  $('swipe-btn').addEventListener('click', startSwipe);
  $('swipe-yes').addEventListener('click', function () { takeSwipe('yes'); });
  $('swipe-no').addEventListener('click', function () { takeSwipe('no'); });
  $('swipe-undo').addEventListener('click', undoSwipe);
  $('swipe-cancel').addEventListener('click', goHome);

  // None of the three. Back to the deck exactly where it was, shortlist and
  // all — the three stay banked, so the next yes makes four to choose from
  // rather than starting the count again. The deck ends on a decision or on
  // the no-decision screen; there is no way out of it that is neither.
  $('swipe-more').addEventListener('click', function () {
    if (!swipe.deck.length) return;
    Sound.back();
    renderSwipe();
  });

  $('swipe-again').addEventListener('click', function () {
    swipe.seen = [];
    swipe.picks = [];
    swipe.deck = dealSwipe();
    renderSwipe();
  });
  $('swipe-ask').addEventListener('click', function () { swipe.live = false; restart(); });

  /* --------------------------------------------------------------- endless */
  /*
   * ENDLESS — the one mode here you are not meant to finish.
   *
   * Everything else in this app is built to stop. The questions stop when the
   * engine is confident, the duel stops after seven, the deck stops at three
   * yeses. That is right for a thing whose job is to answer "what should I
   * eat" — and it means there is nothing here for the ten minutes on a bus
   * when nobody is hungry yet, and nothing anybody opens twice in one day.
   *
   * So: two dishes, tap one, two more. What holds somebody is not the tapping,
   * it is what is missing between the taps. No round number, no confirmation,
   * no reveal, no Next button, no screen that congratulates you — the next
   * pair is painted in the same frame as the answer to the last one. There is
   * never a moment shaped like a place to stop.
   *
   * Three things keep sixty taps from being one tap sixty times:
   *
   *   the combo    answer quickly and the multiplier climbs; hesitate and it
   *                is gone. The only thing here under time pressure, and it is
   *                worth points rather than being required.
   *   the pairing  most pairs are the closest-matched two it can find, some
   *                are a perfect matchup worth double, and some drag in a dish
   *                the app has never once served you.
   *   the read     it says what it has worked out about you, from the pairs
   *                you actually chose. This is the part that is not a slot
   *                machine: what you get for playing is a fact about yourself,
   *                and it is true. How often one lands depends on the player —
   *                somebody with opinions earns one every six to ten taps,
   *                somebody tapping at random can go thirty without, because
   *                a finding has to be earned and there is nothing there to
   *                find. So nothing on the card promises a rate.
   *
   * And it ends on dinner. The dish the run kept choosing is offered as
   * tonight's answer on the way out, so sixty taps produce a decision rather
   * than only a number — which is this app's whole job, arrived at sideways.
   *
   * WHAT FREE MEANS HERE. A day's allowance of picks, printed on the card
   * before you start and counted down on screen while you play, and then it
   * stops until tomorrow. Premium takes the ceiling off. Nothing is blurred,
   * nothing is teased, and nobody is told what they are missing until they
   * have had it.
   */

  // ENDLESS_DAY — the free allowance — is declared up with the tier helpers,
  // because the Premium list on the profile screen quotes it and is built long
  // before this block runs.
  /*
   * THE CLOCK, which is the difference between a mode and a list.
   *
   * The first version of this had no clock. It was endless in the sense that
   * nothing ever stopped it, and boring in exactly the same sense: nothing was
   * ever at risk, nothing escalated, and tap fifty felt like tap five. A thing
   * you cannot lose is a thing you can put down at any moment without cost,
   * and people put it down.
   *
   * So: a few seconds on the clock, draining. Every pick buys some back. Stop
   * picking and the run is over. The amount it buys back shrinks every ten
   * picks, so a run that goes well gets harder rather than longer — which is
   * what makes a long run worth something and what makes the end of one always
   * feel like it was nearly avoidable.
   */
  var ENDLESS_TICK = 50;          // ms between clock repaints
  var ENDLESS_CLOCK = 7000;       // ms it opens with — a full bar
  var ENDLESS_CLOCK_MAX = 7000;   // ...and the most it can ever hold
  var ENDLESS_ADD = 2400;         // ms a pick buys back, at the start
  var ENDLESS_ADD_DROP = 150;     // ...less, per phase survived
  /*
   * The floor, and why it is far below any human tapping speed.
   *
   * It was 700ms, which is roughly how fast somebody actually taps when they
   * are trying. Measured: a bot answering every 700ms survived two hundred and
   * forty-two picks — because once the curve bottomed out at exactly its
   * speed, the difficulty stopped increasing and the run stopped being about
   * anything. It only died to jitter.
   *
   * A run has to end. That is the whole reason the score means something and
   * the whole reason the next one starts. So the floor sits below what anybody
   * can sustain: keep going long enough and it takes the run off you, and the
   * only question the mode ever asks is how long you lasted.
   */
  var ENDLESS_ADD_MIN = 260;
  var ENDLESS_PHASE = 10;         // picks per phase
  var ENDLESS_PANIC = 1600;       // ms of clock at which everything goes red
  var ENDLESS_RUSH = 700;         // ...and below which a tap is a reflex, not a preference

  // The picks that get a whole-screen moment rather than a step up.
  var ENDLESS_MARKS = [10, 25, 50, 75, 100, 150, 200, 300];

  /*
   * The combo window, narrowed from 1500ms when heat arrived.
   *
   * At 1500 it caught people who were not trying to be caught. Somebody
   * tapping at a comfortable 1300ms held the combo without meaning to, went
   * hot, and burned clock at a rate their pace could not feed — 56 picks,
   * where the same player tapping fractionally slower got 89. The worst
   * outcome in the mode belonged to the most ordinary way of playing it, which
   * is a trap rather than a difficulty.
   *
   * At 1100 the same tap is comfortably cool: 110 picks and a modest score.
   * Heat now has to be reached for, which is what makes it a decision — and
   * the run that commits to it still scores an order of magnitude more.
   */
  /*
   * THE FLOOR — below which a tap was not a choice.
   *
   * Heat made speed worth about thirteen times what considered play was worth,
   * and the fastest way to score is therefore to stop reading: hammer a side
   * of the screen and the multiplier climbs on its own. That does not merely
   * make the mode shallow, it makes the ending dishonest — Endless closes by
   * telling you something true about what you like, worked out from the pairs
   * you chose, and a hundred and forty taps nobody read are not choices to
   * work anything out from.
   *
   * There is a real number under this. Two dish names and two icons cannot be
   * taken in and decided between in much under four hundred milliseconds; a
   * hundred and fifty is a thumb, not a preference. So a tap below the floor
   * keeps nothing: no combo, no heat, and — see the learning rule further down
   * — nothing taught.
   *
   * It is a floor rather than a penalty on purpose. Mashing is not punished,
   * it simply earns nothing, and the run goes quietly nowhere. Nobody is
   * told off; the score just does not move.
   */
  var ENDLESS_FLOOR = 380;      // ms under which nobody read both cards
  var ENDLESS_QUICK = 1100;     // ms inside which an answer keeps the combo
  var ENDLESS_COMBO_MAX = 9;
  var ENDLESS_BASE = 10;        // points for a pick
  var ENDLESS_STEP = 5;         // ...plus this much per step of combo
  var ENDLESS_GOLD_ODDS = 0.1;  // how often it goes hunting for a perfect matchup
  var ENDLESS_GOLD = 0.97;      // ...and the duelFit that counts as having found one
  var ENDLESS_STRANGER = 0.18;  // how often it reaches for something never served
  var ENDLESS_KNOWN = 5;        // dishes tried before "never served" means anything
  var ENDLESS_POOL = 40;        // how deep into the profile ranking a lead is drawn
  var ENDLESS_BAND = 12;        // how many good-enough partners an ordinary pair picks from
  var ENDLESS_VOTES = 3;        // tags one tap may move, at most
  var ENDLESS_WEIGHT = 0.22;    // ...and what each is worth, in games
  var ENDLESS_READ_EVERY = 6;   // fewest picks between two reads
  var ENDLESS_READ_MIN = 4;     // times a tag must have been decisive to be read out
  var ENDLESS_READ_LEAN = 0.6;  // ...and how lopsided it has to have gone
  var ENDLESS_XP_CAP = 120;     // most XP one run can be worth

  /*
   * HEAT — the thing that turns a streak into a decision.
   *
   * The combo used to be free money. Answer quickly, score more, and there was
   * never a reason not to: no tap ever cost anything, so "should I push it?"
   * had one answer and therefore was not a question. Tap fifty played exactly
   * like tap five with a bigger number over it, which is the boredom.
   *
   * So heat now buys points with time. Three picks quick and the run goes hot:
   * more per tap, and the clock drains faster to pay for it. Three more and it
   * is blazing, which is genuinely hard to hold. Let the combo lapse and it
   * all comes off — the pace drops, the clock calms down, and you get to
   * breathe at the price of scoring like everyone else.
   *
   * That is a real choice, made every few seconds, and it is the same choice
   * whichever card you tap. THAT LAST PART IS NOT DECORATION. This mode ends
   * by telling you something true about what you like, worked out from the
   * pairs you chose — so a mechanic that made one card the correct answer
   * would turn taps into optimisation and quietly make the ending a lie. Heat
   * is deliberately symmetric: it changes what a pair is worth and never which
   * side of it to take.
   */
  var ENDLESS_HEAT = [
    // combo at which it starts, points multiplier, drain multiplier, name
    { at: 0, points: 1,   drain: 1,   name: '' },
    { at: 3, points: 1.5, drain: 1.3, name: 'Hot' },
    { at: 6, points: 2,   drain: 1.6, name: 'Blazing' }
  ];

  /*
   * The clutch bonus, which pays for nerve rather than speed.
   *
   * The red zone was pure dread: the bar goes red, everything shakes, and the
   * only thing on offer is not dying. Now a tap made down there is worth half
   * again — so the worst moment in a run is also the best-paid one, and
   * hanging on at two hundred milliseconds is a choice somebody might make on
   * purpose instead of a mistake they are recovering from.
   */
  var ENDLESS_CLUTCH = 1.5;

  /*
   * What a milestone hands back. Points inflate on their own; time is the only
   * currency this mode is actually short of, so a mark is worth a breath.
   */
  var ENDLESS_MARK_CLOCK = 2000;

  /*
   * SECOND WIND — Premium, and automatic on purpose.
   *
   * Every other revive in every other game is a screen: "Carry on? Yes / No",
   * a countdown, a button. This mode's one rule is that there is never a
   * moment shaped like a place to stop — the next pair is painted in the same
   * frame as the answer to the last one, and a dialog in the middle of that
   * would undo the whole thing. So the save is not offered, it just happens,
   * with a shout and half a clock, once per run.
   *
   * Which makes it a genuine Premium benefit rather than a nag: what a free
   * player loses at zero, a paying one survives, and neither is ever asked a
   * question.
   */
  var ENDLESS_WIND_CLOCK = 3500;

  /*
   * THEMED RUNS — Premium. The pool, narrowed.
   *
   * Variety in this mode came only from the pairing, which means every run
   * draws on the same hundred and twelve dishes and the fiftieth run feels
   * like the fifth. A theme changes what the whole run is made of: an evening
   * of nothing but quick things is a different game from an evening of nothing
   * but comfort food, using pairs that would otherwise almost never meet.
   *
   * Tags rather than a hand-written list, so this stays true if the catalogue
   * changes. A theme that cannot field enough dishes is not offered.
   */
  var ENDLESS_THEMES = [
    { tag: '', label: 'Everything' },
    { tag: 'quick', label: 'Quick' },
    { tag: 'comfort', label: 'Comfort' },
    { tag: 'healthy', label: 'Healthy' },
    { tag: 'veg', label: 'Veg' },
    { tag: 'spicy', label: 'Spicy' },
    { tag: 'sweet', label: 'Sweet' }
  ];
  var ENDLESS_THEME_MIN = 12;   // dishes a theme needs before it is offered

  // How often the pace marker re-reads. Every pick is too busy to look at.
  var ENDLESS_PACE_EVERY = 3;

  var endless = {
    live: false,
    a: null, b: null, kind: '', champ: null,
    at: 0, combo: 0, score: 0, picks: 0,
    best: 0, beaten: false,
    legal: [], queue: [],
    votes: {}, shown: {}, learned: [], won: {},
    lastRead: 0,
    // the clock
    left: 0, phase: 0, warned: false, timer: null, shoutTimer: null, readTimer: null,
    // heat: the index into ENDLESS_HEAT the run is currently at
    heat: 0, clutches: 0, hottest: 0,
    // the three newer things
    wind: false,      // has the second wind been spent this run
    curve: [],        // score banked at every tenth pick, for the next run to race
    theme: '',        // which pool this run drew from
    pace: null        // how far ahead or behind the best run, last time it was read
  };

  /*
   * The words a read is said in.
   *
   * Mostly taken from the questions, because they are already written as the
   * two ends of one choice and already say "Bring the spice" rather than
   * "spicy: true". Tags no question covers fall back to the nouns on the likes
   * screen. A tag neither knows about is never read out at all, which is
   * better than printing a field name at somebody.
   *
   * The overrides are for the replies that only mean anything standing next to
   * their question. "Anything goes" is a perfectly good way to say no to "is
   * this breakfast food?" and a useless thing to be told you keep choosing;
   * same for "Not especially", "None of those" and "Doesn't need to be". And
   * `filling` and `soft` have no question of their own at all — they are the
   * far ends of the light and crunchy ones — so they get their words here or
   * they are never read out, despite being two of the most-decided axes in the
   * catalogue.
   */
  var ENDLESS_SAYS = {
    breakfast: { no: 'Not breakfast food' },
    carby:     { no: 'Away from the carbs' },
    cheap:     { no: 'Not the cheap one' },
    veg:       { no: 'Not the vegetarian one' },
    quick:     { yes: 'Something quick', no: 'Worth the wait' },
    homemade:  { no: 'Somebody else cooks it' },
    fresh:     { no: 'Not the fresh one' },
    filling:   { yes: 'A proper meal', no: 'Just a bite' },
    soft:      { yes: 'Soft and tender', no: 'Something with a snap' }
  };

  var ENDLESS_WORDS = (function () {
    var map = {};
    Data.QUESTIONS.forEach(function (q) {
      if (q.yes && q.no) map[q.tag] = { yes: q.yes, no: q.no };
    });
    Data.TASTES.forEach(function (t) {
      if (!map[t.tag]) map[t.tag] = { yes: t.label, no: 'Anything but ' + t.label.toLowerCase() };
    });
    Object.keys(ENDLESS_SAYS).forEach(function (tag) {
      var said = ENDLESS_SAYS[tag];
      var base = map[tag];
      // Half a pair is not a pair: an axis that can only be described going one
      // way would report a lean towards it and go silent about a lean away.
      if (!base) {
        if (said.yes && said.no) map[tag] = { yes: said.yes, no: said.no };
        return;
      }
      if (said.yes) base.yes = said.yes;
      if (said.no) base.no = said.no;
    });
    return map;
  })();

  function endlessLeft() { return progress.endlessLeft(ENDLESS_DAY); }

  /* ----------------------------------------------------------- the clock */
  function startEndlessClock() {
    stopEndlessClock();
    endless.left = ENDLESS_CLOCK;
    endless.warned = false;
    endless.timer = setInterval(drainEndless, ENDLESS_TICK);
    paintEndlessClock();
  }

  function stopEndlessClock() {
    if (endless.timer) { clearInterval(endless.timer); endless.timer = null; }
  }

  /*
   * Walking out of a run. Banks what it learned, the way leaving a half-played
   * duel does — those taps were real preferences and the allowance has already
   * been spent on them.
   *
   * And it stops the clock, which is the part that is not optional now. Left
   * running behind another section it goes on draining, reaches zero, ends a
   * run nobody is looking at, plays the bust sound and throws confetti at
   * somebody halfway through reading a recipe.
   */
  function leaveEndless() {
    if (!endless.live) return;
    endless.live = false;
    stopEndlessClock();
    clearTimeout(endless.shoutTimer);
    clearTimeout(endless.readTimer);
    bankEndless();
  }

  // Which heat band a combo sits in. Walked from the top so the highest
  // qualifying band wins without depending on the array's order by luck.
  function heatFor(combo) {
    for (var i = ENDLESS_HEAT.length - 1; i > 0; i--) {
      if (combo >= ENDLESS_HEAT[i].at) return i;
    }
    return 0;
  }

  function heatNow() { return ENDLESS_HEAT[endless.heat] || ENDLESS_HEAT[0]; }

  function drainEndless() {
    // Heat is spent here, in the drain, which is the whole bargain: the run
    // scores faster because it is running out faster.
    endless.left -= ENDLESS_TICK * heatNow().drain;
    if (endless.left <= 0) {
      // Premium's one save, taken automatically rather than offered. Spent
      // before the run is allowed to end, so nothing on screen ever shows a
      // dead clock that then comes back — it simply never reaches zero.
      if (isPlus() && !endless.wind) {
        endless.wind = true;
        endless.left = ENDLESS_WIND_CLOCK;
        endless.warned = false;
        // The streak does not survive it. Being saved is not the same as
        // having kept going, and letting the combo through would hand a
        // blazing multiplier to a run that just died.
        endless.combo = 0;
        endless.heat = 0;
        paintEndlessHead();
        paintEndlessClock();
        shoutEndless('Second wind', true);
        Sound.levelUp();
        Confetti.burst({ y: window.innerHeight * 0.4 });
        return;
      }
      endless.left = 0;
      paintEndlessClock();
      return endEndless('clock');
    }
    if (!endless.warned && endless.left <= ENDLESS_PANIC) {
      endless.warned = true;
      Sound.warn();
    }
    paintEndlessClock();
  }

  // What a pick buys back. Less every phase, so a run that is going well gets
  // harder rather than merely longer — which is what makes a long one worth
  // something, and what makes the end of one always feel avoidable.
  function feedEndless() {
    var add = Math.max(ENDLESS_ADD_MIN, ENDLESS_ADD - endless.phase * ENDLESS_ADD_DROP);
    // Out of picks for today. The clock stops being fed rather than the screen
    // slamming shut between one tap and the next: the last few seconds play
    // out, the run ends the way every other run ends, and the summary is the
    // thing that explains why there is no "go again" under it.
    if (endlessLeft() <= 0) add = 0;
    endless.left = Math.min(ENDLESS_CLOCK_MAX, endless.left + add);
    if (endless.left > ENDLESS_PANIC) endless.warned = false;
  }

  function paintEndlessClock() {
    var frac = Math.max(0, Math.min(1, endless.left / ENDLESS_CLOCK_MAX));
    $('endless-clock-fill').style.width = (frac * 100) + '%';
    $('endless-run').classList.toggle('is-panic', endless.left <= ENDLESS_PANIC);
  }

  // A pause is not a loss. The clock keeps running in a background tab
  // otherwise, so taking a phone call mid-run costs the run — and dying to
  // something that happened while the app was not on screen is the one death
  // nobody accepts. Exploitable, in the sense that somebody could hide the tab
  // to think; there is nothing to win here but a number of their own.
  document.addEventListener('visibilitychange', function () {
    if (!endless.live) return;
    if (document.visibilityState === 'hidden') stopEndlessClock();
    else if (!endless.timer) endless.timer = setInterval(drainEndless, ENDLESS_TICK);
  });

  /* ------------------------------------------------------- noise and shouts */
  // The whole-screen moments. A phase step gets a word; a milestone gets the
  // word, the confetti and the fanfare. Neither blocks a tap: they are painted
  // over the run and taken away on a timer, because the one thing this mode
  // cannot afford is a screen you have to dismiss.
  function shoutEndless(text, big) {
    var el = $('endless-shout');
    $('endless-shout-line').textContent = text;
    el.classList.toggle('is-big', !!big);
    el.hidden = false;
    replay(el);
    clearTimeout(endless.shoutTimer);
    endless.shoutTimer = setTimeout(function () { el.hidden = true; }, big ? 1250 : 850);
  }

  function beatEndless() {
    var phase = Math.floor(endless.picks / ENDLESS_PHASE);
    var stepped = phase !== endless.phase;
    endless.phase = phase;

    if (ENDLESS_MARKS.indexOf(endless.picks) !== -1 || (endless.picks > 300 && endless.picks % 100 === 0)) {
      // Paid in time, not points. The score climbs on its own and another
      // thousand on it changes nothing about the next ten seconds; two seconds
      // of clock is the only reward this mode is ever actually short of, and
      // at a hundred and eighty picks it is the difference between carrying on
      // and not.
      endless.left = Math.min(ENDLESS_CLOCK_MAX, endless.left + ENDLESS_MARK_CLOCK);
      if (endless.left > ENDLESS_PANIC) endless.warned = false;
      paintEndlessClock();
      shoutEndless(endless.picks + ' in a row', true);
      Sound.win();
      Confetti.burst({ y: window.innerHeight * 0.35 });
    } else if (stepped && phase > 0) {
      shoutEndless('Faster', false);
    }
  }

  /*
   * The pop, which now has to explain itself.
   *
   * With one multiplier a bare "+30" was self-evident. With heat, gold and
   * clutch stacking, the same tap can be worth anything from ten to a couple
   * of hundred, and a number that moves that much without saying why reads as
   * random — which is the opposite of what a risk you chose should feel like.
   * So it carries the reason when there is one.
   */
  function popEndless(worth, why) {
    var pop = $('endless-pop');
    pop.textContent = '+' + worth + (why ? ' ' + why : '');
    pop.classList.toggle('is-big', !!why);
    replay(pop);
    replay($('endless-score'));
  }

  // The card on the landing screen, which has to say what the offer is before
  // anybody taps it — how many picks are left today, or that there is no count
  // at all. An allowance you were told about is an offer; one sprung on you at
  // the end is a trick.
  function paintEndlessCard() {
    paintEndlessThemes();

    var tag = $('endless-tag');
    var line = $('endless-card-line');
    if (!tag || !line) return;

    if (isPlus()) {
      tag.textContent = 'Yours';
      tag.classList.add('is-open');
      line.textContent = 'No daily count on it. The only thing that ends a run is the clock.';
      return;
    }

    tag.classList.remove('is-open');
    tag.textContent = 'Free';
    var left = endlessLeft();
    line.textContent = left > 0
      ? left + ' of today’s ' + ENDLESS_DAY + ' picks left · Premium takes the count off'
      : 'Today’s ' + ENDLESS_DAY + ' are spent — they come back tomorrow';
  }

  /*
   * The theme picker, on the card rather than inside the run.
   *
   * Choosing what kind of evening it is belongs before it starts, not as a
   * menu you can open mid-run — this mode has no pause and should not grow
   * one. Themes that the standing rules have already emptied out are simply
   * not offered, so a vegetarian is never shown a choice that would silently
   * do nothing.
   */
  function paintEndlessThemes() {
    var wrap = $('endless-themes');
    var knobs = $('endless-theme-knobs');
    if (!wrap || !knobs) return;

    wrap.hidden = !isPlus();
    if (!isPlus()) return;

    var pool = favouredDishes().map(function (r) { return r.item; });
    if (pool.length < 4) pool = Data.ITEMS.slice();
    var chosen = progress.state.endlessTheme || '';

    knobs.innerHTML = '';
    ENDLESS_THEMES.forEach(function (theme) {
      var fits = !theme.tag ||
        pool.filter(function (d) { return (d.tags[theme.tag] || 0) > 0; }).length >= ENDLESS_THEME_MIN;
      if (!fits) return;

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'knob' + (chosen === theme.tag ? ' is-on' : '');
      btn.textContent = theme.label;
      btn.setAttribute('aria-pressed', chosen === theme.tag ? 'true' : 'false');
      btn.addEventListener('click', function () {
        progress.state.endlessTheme = theme.tag;
        progress.save();
        Sound.tick();
        paintEndlessThemes();
      });
      knobs.appendChild(btn);
    });
  }

  function startEndless() {
    // Nothing gets started that cannot be played, and the landing stays where
    // it is while that is decided — hiding it first and putting it back is a
    // flash of the whole app for a tap that went nowhere. One toast costs a
    // sentence; opening the panel and stopping on the first tap costs the mode.
    if (endlessLeft() <= 0) {
      Sound.reject();
      toast('\u{267E}\u{FE0F}', 'That is today’s ' + ENDLESS_DAY,
        'They come back tomorrow — or Premium takes the daily count off entirely.');
      return renderIntro();
    }

    hideLanding();
    resetGame();
    setView('decide');

    // Bans, standing rules and snoozes are already applied by favouredDishes,
    // so nothing in here can serve a vegetarian a steak however long the run
    // goes on.
    endless.legal = favouredDishes().map(function (r) { return r.item; });
    if (endless.legal.length < 4) endless.legal = Data.ITEMS.slice();

    /*
     * The theme, applied after the standing rules rather than instead of them.
     *
     * favouredDishes() has already taken out bans, snoozes and always-avoids,
     * so narrowing what is left can only ever make the pool smaller — a
     * vegetarian who picks the "comfort" theme still cannot be served a steak.
     * And a theme that has left too little to make pairs from is dropped
     * rather than enforced: a run of four dishes over and over is worse than
     * no theme at all.
     */
    endless.theme = isPlus() ? (progress.state.endlessTheme || '') : '';
    if (endless.theme) {
      var themed = endless.legal.filter(function (d) { return (d.tags[endless.theme] || 0) > 0; });
      if (themed.length >= ENDLESS_THEME_MIN) endless.legal = themed;
      else endless.theme = '';
    }

    endless.queue = [];
    endless.live = true;
    endless.score = 0;
    endless.picks = 0;
    endless.combo = 0;
    endless.votes = {};
    endless.shown = {};
    endless.learned = [];
    endless.won = {};
    endless.champ = null;
    endless.lastRead = 0;
    endless.best = progress.state.endlessBest || 0;
    endless.beaten = false;
    endless.phase = 0;
    endless.heat = 0;
    endless.hottest = 0;
    endless.clutches = 0;
    endless.wind = false;
    endless.curve = [];
    endless.pace = null;
    $('endless-run').classList.remove('is-warm', 'is-blazing');

    clearTimeout(endless.shoutTimer);
    clearTimeout(endless.readTimer);
    $('endless-run').hidden = false;
    $('endless-over').hidden = true;
    $('endless-read').hidden = true;
    $('endless-shout').hidden = true;
    setPanel('endless');
    paintEndlessHead();
    endlessNext();
    // Last, so the first pair is on screen before a single millisecond is
    // charged for it.
    startEndlessClock();
  }

  // The lead dish comes off a shuffled queue of the profile's favourites,
  // drawn down and rebuilt when it empties. Picking at random each time would
  // show the same handful over and over on a long run; a shuffle that does not
  // repeat until it has been all the way round is what stops forty taps
  // turning into six dishes.
  function endlessDraw() {
    if (!endless.queue.length) endless.queue = shuffled(endless.legal.slice(0, ENDLESS_POOL));
    return endless.queue.shift();
  }

  // Who to put it against. duelFit is the same measure the duel uses: close
  // enough that both are plausible right now, far enough apart that answering
  // says something.
  //
  // An ordinary pair takes one of the dozen best rather than the best, so a
  // dish does not always drag the same opponent along with it — and so that
  // `best` has somewhere to go. When the run has decided to hunt for a perfect
  // matchup it takes the top of the list outright, which is the only thing
  // that makes the flag on that pair mean anything: if every pair were already
  // the best available, "perfect pairing" would be a label on all of them.
  function endlessPartner(dish, how) {
    if (!dish) return null;
    how = how || {};
    var tried = progress.state.picks || {};
    var field = endless.legal.filter(function (other) {
      if (other.name === dish.name) return false;
      return !how.strangers || !tried[other.name];
    });
    if (!field.length) return null;

    function bestOf(pool) {
      if (!pool.length) return null;
      var scored = pool
        .map(function (other) { return { dish: other, fit: Taste.duelFit(dish, other) }; })
        .sort(function (a, b) { return b.fit - a.fit; });
      // duelFit is zero for a pairing that is not a choice at all — a drink
      // against a plate — so a field of nothing but those is no field.
      if (!scored[0].fit) return null;
      if (how.best) return scored[0];
      var band = scored.filter(function (c) { return c.fit >= scored[0].fit * 0.8; }).slice(0, ENDLESS_BAND);
      return band[Math.floor(Math.random() * band.length)];
    }

    // Aimed at one axis, when the run has one half-finished. Narrowing to the
    // dishes that plainly differ on it is what turns a pair into a question
    // about that axis.
    var aimed = field;
    if (how.probe) {
      var asks = field.filter(function (other) {
        return Math.abs((dish.tags[how.probe] || 0) - (other.tags[how.probe] || 0)) === 1;
      });
      if (asks.length) aimed = asks;
    }

    var choice = bestOf(aimed);
    // The probe is a preference, not a requirement. Narrowing can leave a set
    // this lead cannot be paired with at all — a drink drawn while the probe
    // points at an axis only food differs on — and coming back empty from that
    // is how a mode called Endless ended after nineteen taps with forty picks
    // still in hand. Ask about something else instead.
    if (!choice && aimed !== field) choice = bestOf(field);
    return choice;
  }

  // What kind of pair this is, rolled before the dishes are chosen rather than
  // read off them afterwards. Reading it off afterwards was the first version
  // and it was wrong in a way worth remembering: the partner is picked to
  // maximise duelFit, so nearly every pair scored as a perfect matchup and
  // nearly every pair got flagged and doubled. A special round that happens
  // four times in five is not a special round, it is inflation.
  function endlessWant() {
    var roll = Math.random();
    if (roll < ENDLESS_GOLD_ODDS) return 'gold';
    if (roll < ENDLESS_GOLD_ODDS + ENDLESS_STRANGER) return 'stranger';
    return '';
  }

  /*
   * Which axis to ask about next: the one the run has half an answer on.
   *
   * This is the questionnaire's own trick, borrowed for a game. Left to
   * chance, two votes a tap scatter across thirty-one axes and almost none of
   * them reach the four observations a read needs — measured, sixty taps
   * produced three findings with a thirty-six tap drought in the middle, which
   * is not "every few taps it tells you something", it is a promise the card
   * makes and the mode breaks.
   *
   * Chosen by how much is already known and NOT by which way it is going.
   * That distinction is the whole of why this is honest: picking the axis with
   * the biggest lean would be hunting for findings, and a run could then chase
   * a three-nil that started as a coin toss into a five-nil "preference".
   * Picking the axis nearest to being answered just finishes what it started,
   * and an axis probed to four often comes back two-all and is never reported.
   * It changes which question gets asked. It cannot touch the answer.
   */
  function endlessProbe() {
    var pick = null, most = 0;
    Object.keys(endless.votes).forEach(function (tag) {
      if (endless.shown[tag] || !ENDLESS_WORDS[tag]) return;
      var seen = endless.votes[tag];
      var count = seen.yes + seen.no;
      if (count >= ENDLESS_READ_MIN) return;   // answered; nothing left to ask
      if (count > most) { most = count; pick = tag; }
    });
    return pick;
  }

  function endlessNext() {

    // A lead nothing can be paired with is a dead card, not the end of the
    // mode: draw another. Only a catalogue that cannot make a pair out of six
    // separate attempts is genuinely out, and on a hundred and twelve dishes
    // that does not happen.
    var lead = null, want = '', partner = null;
    for (var tries = 0; tries < 6 && !partner; tries++) {
      lead = endlessDraw();
      if (!lead) break;
      want = endlessWant();
      partner = want === 'gold' ? endlessPartner(lead, { best: true })
        : want === 'stranger' ? endlessPartner(lead, { strangers: true })
        : null;
      // A hunt that came back with nothing is an ordinary round, not a failure.
      if (!partner) { want = ''; partner = endlessPartner(lead, { probe: endlessProbe() }); }
    }
    if (!lead || !partner) return endEndless('empty');

    // And a flag has to be earned rather than merely intended. Nothing is a
    // stranger when everything is, either: on a profile that has never landed
    // on anything every dish in the catalogue is one, and flagging them all
    // would make the flag mean nothing on the one run where it should mean
    // most.
    var tried = progress.state.picks || {};
    var known = Object.keys(tried).length;
    var kind = want;
    if (kind === 'gold' && partner.fit < ENDLESS_GOLD) kind = '';
    if (kind === 'stranger' && (known < ENDLESS_KNOWN || tried[partner.dish.name])) kind = '';

    if (Math.random() < 0.5) { endless.a = lead; endless.b = partner.dish; }
    else { endless.a = partner.dish; endless.b = lead; }
    endless.kind = kind;
    endless.at = Date.now();
    paintEndlessPair();
  }

  function paintEndlessPair() {
    paintEndlessFace('a', endless.a);
    paintEndlessFace('b', endless.b);

    var picks = $('endless-picks');
    picks.classList.toggle('is-gold', endless.kind === 'gold');
    picks.classList.toggle('is-stranger', endless.kind === 'stranger');
    // The heading never changes. Saying "Double points." in front of it reads
    // well and wraps to a second line on a narrow phone, which shifts both
    // cards down a row between one tap and the next — in a mode built on
    // tapping the same place repeatedly, that is a mis-tap. The news goes on
    // the cards, where there is room reserved for it either way.
    // Both cards, not the grid around them: the lift animation is defined on
    // .pick, and replaying the container would animate nothing.
    replay($('endless-a'));
    replay($('endless-b'));
  }

  function paintEndlessFace(side, dish) {
    $('endless-' + side + '-icon').textContent = dish.icon;
    $('endless-' + side + '-label').textContent = dish.name;
    $('endless-' + side + '-note').textContent = dish.blurb;

    var tried = progress.state.picks || {};
    var flag = $('endless-' + side + '-flag');
    var says = endless.kind === 'gold' ? 'Perfect pairing \u00b7 double points'
      : (endless.kind === 'stranger' && !tried[dish.name]) ? 'Never served you this'
      : '';
    // A blank line rather than an empty one: the flag reserves its own height
    // on both cards whether or not either has anything to say, so a pair where
    // only one is flagged does not sit a row lower than its partner.
    flag.textContent = says || '\u00a0';
    flag.classList.toggle('is-on', !!says);
  }

  function paintEndlessHead() {
    $('endless-score').textContent = endless.score;
    $('endless-best-wrap').hidden = endless.best <= 0;
    $('endless-best').textContent = endless.best;

    var combo = $('endless-combo');
    combo.hidden = endless.combo < 1;
    $('endless-combo-n').textContent = endless.combo + 1;
    combo.classList.toggle('is-hot', endless.combo >= ENDLESS_COMBO_MAX);

    // The band, named on screen while it is running rather than only announced
    // as it changes — somebody who looked away for two taps still needs to know
    // why the clock is emptying at that speed.
    var heat = heatNow();
    var badge = $('endless-heat');
    if (badge) {
      badge.hidden = endless.heat < 1;
      badge.textContent = heat.name;
    }
    // On the run, not the badge: at blazing the whole screen should look like
    // it is costing something, which is the only honest way to draw a bargain
    // where the upside and the danger are the same lever.
    var run = $('endless-run');
    run.classList.toggle('is-warm', endless.heat === 1);
    run.classList.toggle('is-blazing', endless.heat >= 2);

    /*
     * Ahead or behind, in the words a player already has for it.
     *
     * Only shown once there is a best run to race and only while that run was
     * still going — past its last pick there is nothing true to compare
     * against, and "ahead" against a run that had already ended would be a
     * flattering lie.
     */
    var pace = $('endless-pace');
    if (pace) {
      var d = endless.pace;
      pace.hidden = d === null || d === undefined || endless.picks < ENDLESS_PACE_EVERY;
      if (!pace.hidden) {
        pace.textContent = d === 0 ? 'level with your best'
          : d > 0 ? '+' + d + ' on your best'
          : d + ' on your best';
        pace.classList.toggle('is-ahead', d > 0);
        pace.classList.toggle('is-behind', d < 0);
      }
    }

    var left = $('endless-left');
    left.hidden = isPlus();
    if (!isPlus()) $('endless-left-n').textContent = endlessLeft();
  }

  function takeEndless(which) {
    if (!endless.live || view !== 'decide' || panel !== 'endless') return;
    var winner = which === 'a' ? endless.a : endless.b;
    var loser = which === 'a' ? endless.b : endless.a;
    if (!winner || !loser) return;

    // Read before the clock is fed, because both of these are about the state
    // the tap was actually made in.
    // A band, not a ceiling: fast enough to be decisive AND slow enough to have
    // looked. Outside it either way, the streak goes.
    var took = Date.now() - endless.at;
    var mashed = took < ENDLESS_FLOOR;
    var quick = !mashed && took <= ENDLESS_QUICK;
    var reflex = endless.left <= ENDLESS_RUSH;

    // In the red when the tap was made, not after it was paid for — the bonus
    // is for having been down there, and feeding the clock is what gets you out.
    var clutch = endless.left <= ENDLESS_PANIC;

    endless.combo = quick ? Math.min(ENDLESS_COMBO_MAX, endless.combo + 1) : 0;

    var wasHeat = endless.heat;
    endless.heat = heatFor(endless.combo);
    if (endless.heat > endless.hottest) endless.hottest = endless.heat;

    var worth = ENDLESS_BASE + endless.combo * ENDLESS_STEP;
    if (endless.kind === 'gold') worth *= 2;
    worth = Math.round(worth * heatNow().points);
    if (clutch) {
      worth = Math.round(worth * ENDLESS_CLUTCH);
      endless.clutches++;
    }
    endless.score += worth;
    endless.picks++;

    // The curve this run is writing, for the next one to race. Sampled at the
    // same tenths endlessPaceAt() reads back.
    if (endless.picks % 10 === 0) endless.curve.push(endless.score);

    /*
     * Racing the best run, which is the free half of tonight's work.
     *
     * A best score can only be beaten at the very end, so for most of a run it
     * is a number with nothing to do. A curve can be raced the whole way: the
     * marker says whether this run is ahead of where the best one was at the
     * same pick, which gives a run you are losing a reason to keep going and a
     * run you are winning something to protect.
     *
     * Read every third pick. Every pick is a number moving too fast to read,
     * and this is meant to be caught in peripheral vision.
     */
    if (endless.picks % ENDLESS_PACE_EVERY === 0) {
      var was = progress.endlessPaceAt(endless.picks);
      endless.pace = was === null ? null : endless.score - was;
    }

    /*
     * Crossing into a band gets said out loud, and losing it does too.
     *
     * A multiplier that changes silently is a number nobody notices changing.
     * The drop matters more than the climb: the clock suddenly calming down is
     * the mode giving something back, and without a word for it that reads as
     * the game having gone quiet rather than having let you off.
     */
    if (endless.heat > wasHeat) {
      shoutEndless(heatNow().name, endless.heat >= ENDLESS_HEAT.length - 1);
      Sound.climb(endless.heat * 5);
    } else if (endless.heat < wasHeat && wasHeat > 0) {
      // Named when mashing is what broke it, because a streak that vanishes
      // while you are going faster than ever is otherwise unreadable. Only on
      // a streak worth losing — saying it on every stray tap would be its own
      // kind of spam.
      shoutEndless(mashed ? 'Too quick to have read it' : 'Cooled off', false);
    }
    endless.won[winner.name] = (endless.won[winner.name] || 0) + 1;

    /*
     * A tap nobody read buys no time either, and this is the part that makes
     * the floor work rather than merely look strict.
     *
     * Taking the combo away from mashing was not enough on its own: the clock
     * was still being fed two and a half seconds per tap, so hammering at a
     * hundred and twenty milliseconds refilled it faster than it could drain
     * and the run simply never ended. Simulated, that scored thirty thousand
     * against fifteen for playing properly — the exploit was better than the
     * game.
     *
     * So time is bought by choosing, not by touching. Mash and the clock keeps
     * emptying underneath you: seven seconds later the run is over with
     * nothing in it. One stray fast tap costs that tap's worth of time and
     * nothing more, which a real mis-tap can afford.
     */
    if (!mashed) feedEndless();

    // The winner goes back into the queue a few cards down.
    //
    // Without this nothing can ever win twice. The lead comes off a shuffled
    // queue of forty and is gone once it has been dealt, so fourteen taps
    // produced fourteen different winners and no favourite — which quietly
    // deleted the best thing about the ending, the dish you kept choosing
    // handed back as tonight's answer. Now what you keep choosing keeps coming
    // back to be chosen again, which is the truer game as well as the thing
    // that makes the ending real. Far enough down that it is not the very next
    // card, near enough that a run of sixty sees it several times.
    var back = 5 + Math.floor(Math.random() * 8);
    endless.queue.splice(Math.min(back, endless.queue.length), 0, winner);

    // What the tap taught: the tags where one plainly has it and the other
    // plainly does not. At most two, so one pair cannot flood an axis.
    //
    // WHICH two, when a pair differs in eight ways. Not at random, which is
    // what this did first: two taps on eight different axes each teach an
    // eighth as much as eight taps on two, and a run of twenty was still
    // finding nothing solid enough to say out loud. The axes the run is
    // already counting come first, so it digs a few deep holes rather than
    // thirty shallow ones.
    //
    // The order is by how often a tag has come up and never by which way it
    // went — shuffled first so equally-thin axes are not always taken in
    // catalogue order. A run cannot steer itself towards a finding it likes
    // the look of, because at the moment of choosing it has not looked.
    // An axis that has already been read out sinks to the bottom. More votes
    // on it can never produce another finding, and every one of them is a vote
    // not spent building the next one — which is exactly what went wrong the
    // first time this ran: the focus rule kept piling votes onto the two axes
    // it had already reported, and sixty taps produced two reads.
    var rankOf = function (tag) {
      if (endless.shown[tag]) return -1;
      var seen = endless.votes[tag];
      return seen ? seen.yes + seen.no : 0;
    };
    //
    // AND NOT AT ALL when the clock was nearly out. A tap made with six
    // hundred milliseconds left is a reflex aimed at staying alive, not an
    // opinion about dinner — it still scores, because the game is the game,
    // but "whichever one your thumb was nearest with the clock red" is not
    // something this app should quietly file away as a thing you like.
    /*
     * Nothing is learned from a tap nobody read, for the same reason nothing is
     * learned from a panic tap: nine hundred milliseconds of thought and a
     * hundred and fifty of thumb are different events, and only one of them is
     * an opinion about dinner. A run spent mashing therefore ends the way it
     * deserves to — a number, and "nothing it would swear to".
     */
    if (!reflex && !mashed) {
      shuffled(Taste.decisiveTags(winner, loser, Data.TAGS))
        .sort(function (x, y) { return rankOf(y.tag) - rankOf(x.tag); })
        .slice(0, ENDLESS_VOTES)
        .forEach(function (q) {
          var side = (winner.tags[q.tag] || 0) === 1 ? 'yes' : 'no';
          var bucket = endless.votes[q.tag] || (endless.votes[q.tag] = { yes: 0, no: 0 });
          bucket[side]++;
        });
    }

    // Spent and written on every tap, not tallied up at the end: a run
    // abandoned by closing the tab still costs what it used, or the allowance
    // is only an allowance for people who play politely.
    progress.spendEndless(ENDLESS_DAY);
    progress.save();

    if (!endless.beaten && endless.best > 0 && endless.score > endless.best) {
      endless.beaten = true;
      Sound.badge();
      toast('\u{1F3C6}', 'New best', 'Past ' + endless.best + '. Keep going.');
    } else {
      Sound.climb(endless.combo);
    }

    // Named in the order they multiply, longest-odds first, and only ever one
    // word: this is read in peripheral vision during the tap after it.
    popEndless(worth, endless.kind === 'gold' ? 'PERFECT'
      : clutch ? 'CLUTCH'
      : endless.heat >= 2 ? 'BLAZING'
      : '');
    beatEndless();

    // Tried on every tap once the gap has elapsed, rather than only on every
    // sixth one. Checking is a loop over a dozen keys; waiting is five taps
    // spent sitting on a finding that was ready.
    if (endless.picks - endless.lastRead >= ENDLESS_READ_EVERY) showEndlessRead();
    paintEndlessHead();
    endlessNext();
  }

  function showEndlessRead() {
    var read = endlessRead();
    // Nothing solid enough yet. The clock is deliberately not reset — asking
    // again on the next tap is what makes the gap a floor rather than a
    // timetable, and it was a timetable that produced two findings in sixty
    // taps: one attempt in six landed, so the other five waited their turn.
    if (!read) return;

    endless.lastRead = endless.picks;
    endless.learned.push(read);
    $('endless-read-line').textContent = read.line;
    $('endless-read-note').textContent = read.note;
    $('endless-read').hidden = false;
    replay($('endless-read'));
    Sound.reveal();
    // Taken away again. It used to sit there until the next one replaced it,
    // which on a screen with a clock on it is a paragraph competing with the
    // thing that is about to kill you. It says its piece and goes; the summary
    // is where all of them are kept, with time to read them.
    clearTimeout(endless.readTimer);
    endless.readTimer = setTimeout(function () { $('endless-read').hidden = true; }, 2600);
  }

  // What the run has worked out, in the app's own words.
  //
  // Every read has to be earned by taps that actually happened: a tag is only
  // read out once it has been the deciding difference four times and has gone
  // the same way in most of them. A guess dressed up as a finding is worse
  // than saying nothing at all, and this is the part of the mode somebody will
  // either believe or stop believing.
  //
  // Four rather than three, which is where this started. Three-nil looks like
  // a finding and is what a coin does one time in four, and a run tracking
  // thirty axes will turn up several of those without anybody having a
  // preference at all. Every read also prints its own denominator — "4 of the
  // 5 times it could have gone either way" — so the thinness of a thin finding
  // is on the screen next to it rather than left to be inferred.
  function endlessRead() {
    var pick = null, edge = 0;
    Object.keys(endless.votes).forEach(function (tag) {
      if (endless.shown[tag] || !ENDLESS_WORDS[tag]) return;
      var b = endless.votes[tag];
      var seen = b.yes + b.no;
      if (seen < ENDLESS_READ_MIN) return;
      var lean = Math.abs(b.yes - b.no) / seen;
      if (lean < ENDLESS_READ_LEAN) return;
      // Lopsidedness first, but a 5-of-6 beats a 3-of-3: the root keeps a
      // thin unanimous axis from outranking a thick, nearly-unanimous one.
      var weight = lean * Math.sqrt(seen);
      if (weight > edge) { edge = weight; pick = tag; }
    });
    if (!pick) return null;

    endless.shown[pick] = true;
    var bucket = endless.votes[pick];
    var yes = bucket.yes > bucket.no;
    var took = yes ? bucket.yes : bucket.no;
    var seen = bucket.yes + bucket.no;
    return {
      line: ENDLESS_WORDS[pick][yes ? 'yes' : 'no'],
      note: took + ' of the ' + seen + ' times it could have gone either way'
    };
  }

  function endEndless(why) {
    if (!endless.live) return;
    endless.live = false;
    stopEndlessClock();
    clearTimeout(endless.shoutTimer);
    clearTimeout(endless.readTimer);
    $('endless-shout').hidden = true;
    $('endless-run').classList.remove('is-panic');

    // Out of picks counts as spent however the run actually ended: once the
    // allowance is gone the clock stops being fed, so the last run of the day
    // reaches zero on the clock rather than on the counter, and it is still
    // the counter that is the reason.
    var spent = why === 'spent' || endlessLeft() <= 0;
    // Beating nothing is not beating anything: on a first run every score is a
    // record, and saying so is the kind of praise that teaches somebody to
    // stop reading the praise.
    var had = endless.best;
    var best = progress.recordEndless(endless.score, endless.curve) && had > 0;
    bankEndless();

    $('endless-run').hidden = true;
    $('endless-over').hidden = false;

    $('endless-over-eyebrow').textContent = best ? 'A new best'
      : why === 'clock' ? 'Out of time'
      : 'That is the run';
    $('endless-over-title').textContent = endless.score + (endless.score === 1 ? ' point' : ' points');
    $('endless-over-line').textContent = endless.picks + (endless.picks === 1 ? ' pick' : ' picks') +
      (endless.learned.length
        ? ', and it worked out ' + endless.learned.length +
          (endless.learned.length === 1 ? ' thing' : ' things') + ' about you.'
        : endless.picks < ENDLESS_READ_EVERY
          ? '. Not enough to work anything out — that takes about ' + ENDLESS_READ_EVERY + '.'
          : '. Nothing it would swear to, though — you have been too even-handed for that.');

    /*
     * How the run was played, not just how it went.
     *
     * The score already says how well; this says how — whether it was held at
     * a steady pace or pushed into the red for the multiplier. Two runs can
     * land on the same number by completely different nerve, and the mode now
     * has a way to tell them apart, so it should say which one this was.
     */
    var heatLine = $('endless-over-heat');
    if (heatLine) {
      var bits = [];
      if (endless.hottest >= 2) bits.push('You took it blazing');
      else if (endless.hottest === 1) bits.push('You got it hot');
      if (endless.clutches > 0) {
        bits.push(endless.clutches + (endless.clutches === 1 ? ' pick' : ' picks') + ' made on a red clock');
      }
      // Said plainly, because a run that was saved is not the same run as one
      // that was not, and the score does not distinguish them.
      if (endless.wind) bits.push('a second wind spent');
      heatLine.hidden = bits.length === 0;
      heatLine.textContent = bits.join(' \u00b7 ') + (bits.length ? '.' : '');
    }

    var list = $('endless-learned');
    list.innerHTML = '';
    endless.learned.forEach(function (read) {
      var li = document.createElement('li');
      var line = document.createElement('b');
      line.textContent = read.line;
      var note = document.createElement('span');
      note.textContent = read.note;
      li.appendChild(line);
      li.appendChild(note);
      list.appendChild(li);
    });

    paintEndlessChamp();

    $('endless-spent').hidden = !spent;
    $('endless-spent-n').textContent = ENDLESS_DAY;
    // Nothing offers a run that would stop on its first tap.
    $('endless-again').hidden = endlessLeft() <= 0;

    if (best) { Sound.win(); Confetti.burst({ y: window.innerHeight * 0.3 }); }
    else if (why === 'clock') Sound.bust();
    else if (spent) Sound.shrug();
    else Sound.reveal();

    renderIntro();
    window.scrollTo(0, 0);
  }

  /*
   * A dish, handed back, on the way out. A run that produces a score and
   * nothing else is a toy; this is the part that makes it belong to an app for
   * deciding what to eat.
   *
   * Two ways to name one, because there are two kinds of run.
   *
   * Long enough and something wins twice, and then "the one you kept choosing"
   * is a plain fact about what just happened. That was the only case handled
   * at first — and with a clock on the run, the runs that end at five or eight
   * picks are exactly the ones a beginner has, so the people who most need a
   * reason to come back were the ones being sent away with a number.
   *
   * So a short run offers the best-liked of whatever was picked instead, and
   * says that is what it is. `legal` is already the profile's ranking, best
   * first, so the first winner found in it is the answer. Neither line claims
   * more than the run did.
   */
  function paintEndlessChamp() {
    var box = $('endless-champ');
    endless.champ = null;

    var wins = Object.keys(endless.won);
    if (!wins.length) { box.hidden = true; return; }

    var top = wins.sort(function (a, b) { return endless.won[b] - endless.won[a]; })[0];
    var repeat = endless.won[top] >= 2;
    var name = top;
    if (!repeat) {
      var liked = endless.legal.filter(function (item) { return endless.won[item.name]; })[0];
      if (liked) name = liked.name;
    }

    var dish = Data.ITEMS.filter(function (d) { return d.name === name; })[0];
    if (!dish) { box.hidden = true; return; }

    endless.champ = dish;
    box.hidden = false;
    $('endless-champ-icon').textContent = dish.icon;
    $('endless-champ-name').textContent = dish.name;
    $('endless-champ-eyebrow').textContent = repeat ? 'The one you kept choosing' : 'Out of the ones you picked';
    $('endless-champ-note').textContent = repeat
      ? 'Won ' + endless.won[top] + ' of the pairs it was in.'
      : wins.length === 1
        ? 'The only one you got to. It is still an answer.'
        : 'The one of the ' + wins.length + ' you chose that fits you best.';
  }

  // Everything the run learned, into the profile in one go.
  //
  // At a third of a game's weight per tap, deliberately. A duel round is worth
  // a whole answer because there are seven of them; there can be hundreds of
  // these, and a mode somebody plays on a bus must not be able to shout down
  // eight questions they answered while actually hungry. Sixty taps come out
  // worth roughly a couple of games, which is about what they are.
  function bankEndless() {
    Object.keys(endless.votes).forEach(function (tag) {
      var bucket = endless.votes[tag];
      if (bucket.yes) progress.lean(tag, 'yes', bucket.yes * ENDLESS_WEIGHT);
      if (bucket.no) progress.lean(tag, 'no', bucket.no * ENDLESS_WEIGHT);
    });
    endless.votes = {};

    // A tenth of the score, capped, so a long run is worth something on the
    // profile without turning XP into a tap counter.
    var xp = Math.min(ENDLESS_XP_CAP, Math.floor(endless.score / 10));
    var out = xp > 0 ? progress.addXp(xp) : null;
    progress.save();
    applyTaste();
    if (out && out.leveledUp) {
      Sound.levelUp();
      toast(out.level.icon, 'Level ' + out.level.number, out.level.name + ' — from the run.');
    }
  }

  // Straight from the run into the app's own answer screen, with the rest of
  // what it kept choosing behind it as the alternates.
  function landEndless(dish) {
    var others = Object.keys(endless.won)
      .filter(function (name) { return name !== dish.name; })
      .sort(function (a, b) { return endless.won[b] - endless.won[a]; })
      .map(function (name) { return Data.ITEMS.filter(function (d) { return d.name === name; })[0]; })
      .filter(Boolean)
      .slice(0, 7);

    endless.live = false;
    resetGame();
    shortcut = true;
    rankedItems = [dish].concat(others);
    setPanel('result');
    $('result-icon').classList.add('is-landed');
    showResult(dish, { animate: false });
    $('result-eyebrow').textContent = $('endless-champ-eyebrow').textContent;
    $('accept-btn').disabled = false;
    $('reject-btn').disabled = false;
    Sound.reveal();
    Confetti.burst({ y: window.innerHeight * 0.3 });
  }

  $('endless-btn').addEventListener('click', startEndless);
  $('endless-a').addEventListener('click', function () { takeEndless('a'); });
  $('endless-b').addEventListener('click', function () { takeEndless('b'); });
  $('endless-stop').addEventListener('click', function () { endEndless('stop'); });
  $('endless-again').addEventListener('click', startEndless);
  $('endless-done').addEventListener('click', goHome);
  $('endless-upgrade').addEventListener('click', function () {
    goPremium('Endless with no daily count on it');
  });
  $('endless-champ-btn').addEventListener('click', function () {
    if (endless.champ) landEndless(endless.champ);
  });

  /* --------------------------------------------------------------- landing */
  // The first thing anybody sees, and the only screen in this app allowed to
  // raise its voice. What used to be here was a sign-up form — a name, a
  // passphrase, and a warning that there is no way to reset it — in front of an
  // app for deciding what to have for lunch. Nobody does that. It is gone, and
  // so is the idea that anything has to be filled in before the app works.

  // The views, not the whole app frame. While the landing is up everything
  // behind it has to be inert and hidden from assistive tech — but the rail is
  // no longer behind it, it is beside it, and making the navigation
  // unfocusable was the other half of why the sections could not be reached
  // from the front door.
  var shell = document.querySelector('.content');
  var landed = false;

  // The reel is decoration, and it is here on purpose: "112 dishes" as a number
  // does not land the way 112 dishes going past does.
  var reelTimer = null;

  function startReel() {
    if (reduceMotion || reelTimer) return;
    var reel = $('reel');
    var pool = Data.ITEMS.slice();
    var at = Math.floor(Math.random() * pool.length);
    reelTimer = setInterval(function () {
      at = (at + 1 + Math.floor(Math.random() * 5)) % pool.length;
      var span = document.createElement('span');
      span.className = 'reel-item';
      span.textContent = pool[at].icon;
      reel.appendChild(span);
      // Two frames, so the class change is a transition rather than a jump.
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          span.classList.add('is-on');
          var old = reel.querySelector('.reel-item:not(:last-child)');
          if (old) {
            old.classList.add('is-gone');
            setTimeout(function () { if (old.parentNode) old.parentNode.removeChild(old); }, 420);
          }
        });
      });
    }, 1400);
  }

  function stopReel() {
    if (!reelTimer) return;
    clearInterval(reelTimer);
    reelTimer = null;
  }

  function showLanding() {
    landed = false;
    $('landing').hidden = false;
    document.body.classList.add('is-landing');
    if ('inert' in shell) shell.inert = true;
    shell.setAttribute('aria-hidden', 'true');

    var state = progress.state;
    var played = state.decisions > 0;
    $('landing-back').hidden = !played;
    if (played) {
      var level = progress.level();
      $('landing-back-line').textContent = 'Level ' + level.number + ' · ' + level.name;
      $('landing-back-streak').textContent = String(state.streak || 0);
      $('landing-back-decisions').textContent = String(state.decisions || 0);
      $('landing-back-dishes').textContent = String(Object.keys(state.picks || {}).length);
    }

    // Lately, Saved and the mode locks are all painted here — this screen is
    // the only home screen now, so it has to be current every time it opens
    // and not only when a view change happens to have run first.
    renderIntro();
    startReel();
    focusQuietly($('landing-start'));
  }

  function hideLanding() {
    landed = true;
    stopReel();
    $('landing').hidden = true;
    document.body.classList.remove('is-landing');
    if ('inert' in shell) shell.inert = false;
    shell.removeAttribute('aria-hidden');
  }

  $('landing-start').addEventListener('click', function () {
    hideLanding();
    setView('decide');
    restart();
  });

  $('landing-browse').addEventListener('click', function () {
    hideLanding();
    setView('dishes');
  });

  // Its own way in from the front door. The rail sits behind the landing
  // overlay, so without this the only route to the aggregator was to start a
  // game first — which is exactly what somebody asking "what is around me" has
  // decided not to do.
  $('landing-nearby').addEventListener('click', function () {
    hideLanding();
    setView('nearby');
  });

  // Same reasoning as the line above: reading is a thing people arrive wanting
  // to do, not something they should have to play a round to reach.
  $('landing-ask').addEventListener('click', function () {
    hideLanding();
    setView('chat');
  });

  $('landing-news').addEventListener('click', function () {
    hideLanding();
    setView('news');
  });

  // Free, and on the front door rather than in the Premium grid — see
  // startTogetherLink() for why this particular one is not sold.
  $('landing-invite').addEventListener('click', startTogetherLink);

  /* --------------------------------------------------------- android build */
  // A real app for the phone this is running on, offered only to the phones
  // that can install it.
  //
  // userAgentData first — it is the answer the browser means to give, and it
  // outlives the user-agent string being frozen. The string is the fallback
  // for browsers without it, minus Chrome OS, which says "Android" in its user
  // agent and cannot install an APK. Decided here rather than served that way,
  // because this page is cached both in front of the app and behind it, and a
  // cached page that guessed on the server tells the next visitor the same
  // thing about a different phone.
  (function offerAndroid() {
    var android;
    var hints = navigator.userAgentData;
    if (hints && typeof hints.platform === 'string') {
      android = hints.platform === 'Android';
    } else {
      var ua = navigator.userAgent || '';
      android = /android/i.test(ua) && ua.indexOf('CrOS') === -1;
    }
    if (android) {
      $('apk-wrap').hidden = false;
      return;
    }

    // iPadOS 13 and later reports itself as a Mac; the touch points are what
    // give it away, because no Mac has them.
    var ua2 = navigator.userAgent || '';
    var ios = /iPad|iPhone|iPod/.test(ua2) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    if (!ios) return;

    $('clip-wrap').hidden = false;
  })();

  $('landing-premium').addEventListener('click', function () {
    hideLanding();
    setView('profile');
    flashPremium();
  });

  // Send somebody to where the tier is actually switched, and make it obvious
  // which part of a long screen they were sent to.
  function flashPremium() {
    var strip = $('plus-strip');
    strip.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
    strip.classList.add('is-flash');
    setTimeout(function () { strip.classList.remove('is-flash'); }, 1400);
  }

  /* --------------------------------------------------------------- install */
  // Off the home screen, and working with no signal.
  //
  // Deciding what to eat happens where phones are worst: a basement kitchen, a
  // train, a supermarket aisle. The whole game is static files and needs no
  // network once fetched, so a dead signal has no business being the thing
  // that stops dinner being decided. sw.js does the caching; this registers it
  // and offers the install when the browser says one is available.
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js').catch(function () {
        // No worker is a slower app, not a broken one. Nothing to say.
      });
    });
  }

  // Chromium fires this instead of showing its own bar, and only when the app
  // actually qualifies. Holding onto the event is the only way to ask later,
  // at a moment that makes sense, rather than the moment the page opens.
  var installPrompt = null;
  window.addEventListener('beforeinstallprompt', function (event) {
    event.preventDefault();
    installPrompt = event;
    $('install-wrap').hidden = false;
  });

  $('install-btn').addEventListener('click', function () {
    if (!installPrompt) return;
    installPrompt.prompt();
    installPrompt.userChoice.then(function (choice) {
      installPrompt = null;
      $('install-wrap').hidden = true;
      if (choice && choice.outcome === 'accepted') {
        toast('\u{1F4F1}', 'Added', 'It opens from your home screen now, signal or not.');
      }
    });
  });

  // Installed some other way — Safari's Share sheet, or a second visit after
  // accepting. Either way there is nothing left to offer.
  window.addEventListener('appinstalled', function () {
    installPrompt = null;
    $('install-wrap').hidden = true;
  });

  /* ------------------------------------------------------------------ boot */
  $('landing-dishes').textContent = String(Data.ITEMS.length);
  $('landing-recipes').textContent = String(Recipes.count());
  // Measured, not claimed: tools/check.js plays 2,800 games and reports the
  // average. Written here as the number it rounds to rather than as a promise.
  $('landing-questions').textContent = '8';

  // Everybody starts in the same local profile — there is no separate
  // account to sign into first. Premium, when it is on, is layered on top of
  // this same profile straight from the Whop session.
  progress.reload();
  progress.tidySnoozes();
  applyTheme();
  repaintVaults();
  applyMute();
  applyRules();
  applyTaste();
  goHome();
  renderProfile();
  showLanding();

  // The home-screen shortcuts in the manifest promise to land somewhere
  // specific. Honour them, or they are three taps to the same screen as the
  // icon itself.
  (function openWhereAsked() {
    var here;
    try { here = new URL(window.location.href); } catch (err) { return; }

    // Someone sent their half, which beats any shortcut: `with` carries five
    // answers and nothing else. unpackAnswers refuses anything that does not
    // read as real ones, and a refusal just means an ordinary visit rather
    // than an error page.
    var first = unpackAnswers(here.searchParams.get('with'));
    if (first) return joinTogether(first);

    var go = here.searchParams.get('go');
    if (go === 'decide') restart();
    else if (go === 'dishes') { hideLanding(); setView('dishes'); }
    else if (go === 'news') { hideLanding(); setView('news'); }
    else if (go === 'ask') { hideLanding(); setView('chat'); }

    /*
     * ?prompt= — see a prompt now, instead of playing until one is due.
     *
     * The three prompts are deliberately hard to trigger: the enjoy one is
     * never put to a Premium member at all, the affiliate one wants
     * twenty-five decisions behind it, and the share one only goes to
     * somebody who has already said they like this. Good rules for a
     * stranger, and useless if you are the person who has to check the thing
     * works — the honest answer to "why do I never see it" was "because you
     * are paying and you have not made twenty-five decisions", which is not
     * something anybody should have to take on trust.
     *
     * So: ?prompt=enjoy, ?prompt=earn, ?prompt=share, or ?prompt=all to walk
     * through all three. It spends nothing — no showing is counted and
     * nothing is saved — so previewing one does not use up a real one, and it
     * cannot be stumbled into, because nobody types a query string by
     * accident.
     */
    var wanted = (here.searchParams.get('prompt') || '').toLowerCase();
    if (wanted) {
      var queue = wanted === 'all' ? ['enjoy', 'earn', 'share', 'ads']
                : wanted === 'ads' ? ['ads']
                : [wanted];
      previewPrompts(queue);
    }
  })();

  /*
   * Show the named prompts one after another, each waiting for the one before
   * it to be closed. Chained on the dialog's own close event rather than a
   * timer, so a slow read does not stack two sheets on top of each other.
   */
  function previewPrompts(names) {
    var openers = { enjoy: openEnjoy, earn: openEarn, share: openShare };
    // 'ads' expands to one preview of every card in the roster, in order, so
    // the whole rotation can be read in one go rather than played for.
    var queue = [];
    names.forEach(function (n) {
      if (openers[n]) return queue.push(n);
      if (n !== 'ads') return;
      ADS.forEach(function (ad, i) { queue.push('ad:' + i); });
    });
    if (!queue.length) return;

    function next() {
      var name = queue.shift();
      if (!name) return;
      if (name.indexOf('ad:') === 0) openAd(ADS[Number(name.slice(3))], true);
      else openers[name](true);
      var dlg = $(name.indexOf('ad:') === 0 ? 'ad-sheet' : name + '-sheet');
      if (!dlg || !queue.length) return;
      // Native <dialog> fires this; the attribute fallback does not, in which
      // case the walk simply stops after the first one rather than misfiring.
      dlg.addEventListener('close', function once() {
        dlg.removeEventListener('close', once);
        setTimeout(next, 350);
      });
    }

    // After the landing has painted, or the sheet opens behind it.
    setTimeout(next, 900);
  }

  // Ask this site's own session whether this browser is signed into a Whop
  // account that owns Premium. No key to paste, no purchase to "claim" — the
  // checkout at /premium already attached access to the account directly, so
  // this is the same check every later load makes, just running once early.
  syncPremium(true);
})();
