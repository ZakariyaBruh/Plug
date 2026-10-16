/*
 * hub.js — everything after "what shall we eat".
 *
 * morsels45 started as a way to decide dinner. This file is the rest of the
 * food hub around that: planning the week, shopping for it, cooking it, and
 * the kitchen tools in between. Thirteen features in two new sections and
 * two existing ones, each one either free with an account or Premium:
 *
 *   PLANNER (#view-planner)
 *     Week          meal-prep calendar, with an AI that only ever works on
 *                   the calendar — fill the gaps, plan a prep session,
 *                   balance the week ................................ account
 *     Shopping list built from the week's recipes, merged, by aisle . Premium
 *     Nutrition     estimated per day against your targets ......... Premium
 *     Budget        estimated cost per meal, cheaper swaps ......... Premium
 *     Dinner party  a menu every guest can eat, and a timeline ..... Premium
 *
 *   KITCHEN (#view-kitchen)
 *     Cookbook      your own and imported recipes, synced ......... Premium
 *     Import        any recipe page, without the page ............. Premium
 *     Scan          a barcode, checked against your rules ......... Premium
 *     Fridge photo  what dinner is in there ....................... Premium
 *     Timers        several at once, plus a unit converter ........ account
 *     In season     what's good this month, and what to cook with it  account
 *
 *   NEWS          a one-minute AI briefing at the top .............. Premium
 *   COOK MODE     hands-free: voice commands, steps read aloud ..... Premium
 *
 * Ten Premium, three free with an account — the account ones are the ones
 * whose whole value is following you between devices.
 *
 * WHAT THIS FILE MAY TOUCH of the app is window.M45 (built in app.js) and
 * nothing else; what it may ask the server is the hub routes under /api,
 * every one of which checks the tier itself — what is gated here is gated
 * again there, so nothing here is the lock, only the sign on the door.
 */
(function () {
  'use strict';

  var M = window.M45;
  if (!M) return;
  var Data = M.Data;
  var Recipes = M.Recipes;
  var Sound = M.Sound;

  /* ------------------------------------------------------------ helpers -- */

  function el(tag, props, kids) {
    var node = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach(function (key) {
        var value = props[key];
        if (value === null || value === undefined || value === false) return;
        if (key === 'class') node.className = value;
        else if (key === 'text') node.textContent = value;
        else if (key === 'on') Object.keys(value).forEach(function (ev) { node.addEventListener(ev, value[ev]); });
        else if (key === 'dataset') Object.keys(value).forEach(function (d) { node.dataset[d] = value[d]; });
        else if (typeof value !== 'string' && key in node) node[key] = value;
        else node.setAttribute(key, value === true ? '' : value);
      });
    }
    (kids || []).forEach(function (kid) {
      if (kid === null || kid === undefined || kid === false) return;
      node.appendChild(typeof kid === 'string' ? document.createTextNode(kid) : kid);
    });
    return node;
  }

  function clear(node) { while (node.firstChild) node.removeChild(node.firstChild); return node; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function store(key, value) {
    try {
      if (value === undefined) return JSON.parse(localStorage.getItem('m45-' + key) || 'null');
      localStorage.setItem('m45-' + key, JSON.stringify(value));
    } catch (err) {}
    return null;
  }

  var ERRORS = {
    not_signed_in: 'Sign in to use this.',
    premium_required: 'This is part of Premium.',
    daily_limit: 'That is today’s limit for this — it resets at midnight (UTC).',
    busy: 'The AI is busy right now. Try again in a minute.',
    unavailable: 'That did not work just now. Try again in a minute.',
    no_answer: 'The AI came back with nothing usable. Try again.',
    storage_unavailable: 'Could not save just now. It is kept on this device and will sync next time.',
    nothing_to_fill: 'There are no empty slots of that kind this week.',
    empty_week: 'Put a few dishes in the week first.',
    bad_url: 'That does not look like a web address.',
    no_recipe: 'Could not find a recipe on that page. Check it is the page of the recipe itself, not a list of recipes \u2014 or copy the recipe and use \u201CPaste it in\u201D under Your own recipes.',
    refused: 'That site does not let apps read its pages \u2014 Allrecipes, Serious Eats and Simply Recipes block everyone. BBC Good Food, Bon App\u00E9tit, King Arthur, Food Network and most others work.',
    unreachable: 'That page did not answer.',
    not_a_page: 'That address is not a web page.',
    blocked: 'That address is not allowed.',
    not_found: 'That barcode is not in Open Food Facts yet.',
    bad_code: 'A barcode is 8 to 14 digits.',
    bad_image: 'That photo could not be read. Try another.',
    too_restrictive: 'Between them, the guests rule out nearly everything. Try fewer rules or fewer courses.',
    no_guests: 'Add at least one guest.',
    cookbook_full: 'You have 200 recipes saved, which is the most it can keep. Delete one to add another.',
    no_recipe_photo: 'Could not find a recipe in that photo. Try again in good light, with the whole recipe in the picture and the words in focus.',
    no_recipe_text: 'Could not find a recipe in that. Paste the ingredients and the steps together.',
    too_short: 'Paste a little more \u2014 the ingredients and the steps.'
  };

  function errorText(err) {
    return ERRORS[err && err.code] || 'Something went wrong. Try again.';
  }

  function api(path, options) {
    options = options || {};
    var init = { method: options.method || 'GET', headers: { Accept: 'application/json' } };
    if (options.body !== undefined) {
      init.headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(options.body);
    }
    return fetch(path, init).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (data) {
        if (!r.ok) {
          var err = new Error(data.error || 'http_' + r.status);
          err.code = data.error || (r.status === 401 ? 'not_signed_in' : r.status === 402 ? 'premium_required' : 'unavailable');
          err.status = r.status;
          throw err;
        }
        return data;
      });
    });
  }

  function signedIn() { return M.signedIn(); }
  function plus() { return M.isPlus(); }

  function signInHref(go) {
    return '/api/oauth/login?redirect_to=' + encodeURIComponent('/decide/?go=' + go);
  }

  function signInCard(what, why, go) {
    return el('div', { class: 'hub-gate' }, [
      el('p', { class: 'hub-gate-tier', text: 'Free with an account' }),
      el('p', { class: 'hub-gate-title', text: what }),
      el('p', { class: 'hub-gate-why', text: why }),
      el('p', { class: 'fine', text: 'Free — you only need to sign in. morsels45 uses Whop accounts: if you do not have one, you can make one in a minute with your email. Then it is the same on your phone and your computer.' }),
      // target="_top": see the note on #invite-signin in index.html.
      el('a', { class: 'go go-sm hub-gate-go', href: signInHref(go), target: '_top' }, [
        el('span', { class: 'go-label', text: 'Sign in with Whop' })
      ])
    ]);
  }

  function premiumCard(what, why, points) {
    return el('div', { class: 'hub-gate is-premium' }, [
      el('p', { class: 'hub-gate-tier', text: 'Premium' }),
      el('p', { class: 'hub-gate-title', text: what }),
      el('p', { class: 'hub-gate-why', text: why }),
      points && points.length ? el('ul', { class: 'hub-gate-points' }, points.map(function (p) { return el('li', { text: p }); })) : null,
      el('button', { class: 'go go-sm', type: 'button', on: { click: function () { M.goPremium(what); } } }, [
        el('span', { class: 'go-label', text: 'Seven days free' })
      ])
    ]);
  }

  function head(mechanic, title, sub) {
    return el('header', { class: 'head' }, [
      el('p', { class: 'mechanic', text: mechanic }),
      el('h1', { class: 'head-title', text: title }),
      sub ? el('p', { class: 'head-sub', text: sub }) : null
    ]);
  }

  function tabStrip(tabs, current, onPick) {
    return el('div', { class: 'filters hub-tabs', role: 'tablist' }, tabs.map(function (tab) {
      var on = tab.id === current;
      return el('button', {
        class: 'filter' + (on ? ' is-on' : ''),
        type: 'button',
        role: 'tab',
        'aria-selected': on ? 'true' : 'false',
        on: { click: function () { Sound.tick(); onPick(tab.id); } }
      }, [tab.label, tab.premium ? el('span', { class: 'tag-premium hub-tab-tag', text: 'Premium' }) : null]);
    }));
  }

  function note(text, kind) {
    return el('p', { class: 'hub-note' + (kind ? ' is-' + kind : ''), role: kind === 'error' ? 'alert' : null, text: text });
  }

  function busyButton(btn, busy, label) {
    btn.disabled = !!busy;
    if (label) btn.textContent = label;
  }

  /* ----------------------------------------------------- the catalogue -- */

  var FOOD = Data.ITEMS.filter(function (d) { return !(d.tags.drink > 0); });

  function allowedFood() {
    return FOOD.filter(function (d) { return !M.breaksRules(d); });
  }

  function dish(name) { return M.dishByName(name); }

  function recipeFor(name) {
    var list = Recipes.forDish(name);
    return list && list.length ? list[0] : null;
  }

  function searchFood(query, limit) {
    var q = query.trim().toLowerCase();
    var pool = allowedFood();
    if (!q) return pool.slice(0, limit);
    var starts = [];
    var contains = [];
    pool.forEach(function (d) {
      var n = d.name.toLowerCase();
      if (n.indexOf(q) === 0) starts.push(d);
      else if (n.indexOf(q) !== -1 || (d.blurb || '').toLowerCase().indexOf(q) !== -1) contains.push(d);
    });
    return starts.concat(contains).slice(0, limit);
  }

  /* --------------------------------------------------------- the week -- */

  var DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  var DAY_NAME = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' };
  var MEALS = ['breakfast', 'lunch', 'dinner', 'snack'];
  var MEAL_NAME = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' };

  function mondayOf(date) {
    var d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
    return d;
  }

  function isoDay(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }

  function fromIso(iso) {
    var p = iso.split('-');
    return new Date(Number(p[0]), Number(p[1]) - 1, Number(p[2]));
  }

  function dayDate(week, day) {
    var d = fromIso(week);
    d.setDate(d.getDate() + DAYS.indexOf(day));
    return d;
  }

  function shortDate(d) {
    try { return d.toLocaleDateString([], { day: 'numeric', month: 'short' }); } catch (err) { return d.getDate() + '/' + (d.getMonth() + 1); }
  }

  function emptyPlan() {
    return { v: 1, slots: {}, prepDay: 'sun', checked: {}, extras: [], people: 2, prep: null, prepDone: {} };
  }

  var plan = {
    week: isoDay(mondayOf(new Date())),
    data: null,
    loadedFor: null,
    loading: false,
    saveTimer: null,
    saving: false,
    status: '',
    listeners: []
  };

  function onPlan(fn) { plan.listeners.push(fn); }
  function planChanged() { plan.listeners.forEach(function (fn) { try { fn(); } catch (err) {} }); }

  function loadWeek(week, force) {
    if (!signedIn()) return Promise.resolve(null);
    if (!force && plan.loadedFor === week && plan.data) return Promise.resolve(plan.data);
    plan.loading = true;
    plan.week = week;
    var local = store('plan-' + week);
    return api('/api/planner?week=' + week).then(function (res) {
      plan.loading = false;
      plan.data = normalise(res.plan || local || emptyPlan());
      plan.loadedFor = week;
      store('plan-' + week, plan.data);
      planChanged();
      return plan.data;
    }).catch(function (err) {
      plan.loading = false;
      plan.data = normalise(local || emptyPlan());
      plan.loadedFor = week;
      plan.status = err.code === 'not_signed_in' ? '' : 'Offline copy — will sync when it can';
      planChanged();
      return plan.data;
    });
  }

  function normalise(data) {
    var base = emptyPlan();
    if (!data || typeof data !== 'object') return base;
    Object.keys(base).forEach(function (k) { if (data[k] === undefined) data[k] = base[k]; });
    if (!data.slots || typeof data.slots !== 'object') data.slots = {};
    return data;
  }

  function savePlan() {
    if (!plan.data) return;
    store('plan-' + plan.week, plan.data);
    plan.status = 'Saving…';
    planChanged();
    clearTimeout(plan.saveTimer);
    var week = plan.week;
    var data = plan.data;
    plan.saveTimer = setTimeout(function () {
      api('/api/planner', { method: 'PUT', body: { week: week, plan: data } }).then(function () {
        plan.status = 'Saved';
        planChanged();
      }).catch(function (err) {
        plan.status = errorText(err);
        planChanged();
      });
    }, 700);
  }

  function slotItems(key) {
    var list = plan.data && plan.data.slots[key];
    return Array.isArray(list) ? list : [];
  }

  function setSlot(key, items) {
    if (!plan.data) return;
    if (items.length) plan.data.slots[key] = items;
    else delete plan.data.slots[key];
    savePlan();
  }

  function addToSlot(key, item) {
    var items = slotItems(key).slice();
    if (items.length >= 4) items.shift();
    items.push(item);
    setSlot(key, items);
  }

  function weekDishNames() {
    var names = [];
    if (!plan.data) return names;
    Object.keys(plan.data.slots).forEach(function (key) {
      slotItems(key).forEach(function (item) {
        if (item.t === 'dish' && names.indexOf(item.name) === -1) names.push(item.name);
      });
    });
    return names;
  }

  // The week as "slot key -> catalogue names", which is what the calendar AI reads.
  function slotsForAi() {
    var out = {};
    if (!plan.data) return out;
    Object.keys(plan.data.slots).forEach(function (key) {
      var names = slotItems(key).filter(function (i) { return i.t === 'dish'; }).map(function (i) { return i.name; });
      if (names.length) out[key] = names;
    });
    return out;
  }

  function itemLabel(item) {
    if (item.t === 'note') return item.text;
    return item.name;
  }

  function itemIcon(item) {
    if (item.t === 'note') return '\u{1F4DD}';
    if (item.t === 'recipe') return '\u{1F4D6}';
    var d = dish(item.name);
    return d ? d.icon : '\u{1F37D}️';
  }

  /* ====================================================================
   * PLANNER
   * ==================================================================== */

  var planner = { tab: store('planner-tab') || 'week', root: null, ai: null };

  var PLANNER_TABS = [
    { id: 'week', label: 'My week' },
    { id: 'shop', label: 'Shopping list', premium: true },
    { id: 'nutrition', label: 'How healthy?', premium: true },
    { id: 'budget', label: 'What it costs', premium: true },
    { id: 'party', label: 'Dinner party', premium: true }
  ];

  function renderPlanner() {
    var root = M.$('view-planner');
    if (!root) return;
    planner.root = root;
    clear(root);
    root.appendChild(head('Plan the week', 'Meal planner',
      'Plan your meals for the week ahead. Then, with one tap, get the shopping list, see how healthy the week is and roughly what it costs.'));
    root.appendChild(tabStrip(PLANNER_TABS, planner.tab, function (id) {
      planner.tab = id;
      store('planner-tab', id);
      renderPlanner();
    }));
    var body = el('div', { class: 'hub-body' });
    root.appendChild(body);

    if (planner.tab === 'week') return renderWeek(body);
    if (planner.tab === 'shop') return renderShop(body);
    if (planner.tab === 'nutrition') return renderNutrition(body);
    if (planner.tab === 'budget') return renderBudget(body);
    if (planner.tab === 'party') return renderParty(body);
  }

  function needsWeek(body, render) {
    if (!signedIn()) {
      body.appendChild(signInCard('Your week, planned', 'Everything here starts from the meal calendar, which comes free with an account.', 'planner'));
      return false;
    }
    if (!plan.data || plan.loadedFor !== plan.week) {
      body.appendChild(note('Loading your week…'));
      loadWeek(plan.week).then(function () { if (planner.root && M.currentView() === 'planner') render(clear(body)); });
      return false;
    }
    return true;
  }

  /* -------------------------------------------------- week (account) -- */

  function renderWeek(body) {
    if (!signedIn()) {
      body.appendChild(signInCard('Meal-prep calendar',
        'Plan breakfast, lunch, dinner and a snack for every day of the week. Tap a slot to add a dish from the catalogue, one of your own recipes, or a note — and let the calendar’s AI fill the gaps, plan a prep session and check the balance.', 'planner'));
      return;
    }
    if (!needsWeek(body, renderWeek)) return;

    var monday = fromIso(plan.week);
    var sunday = dayDate(plan.week, 'sun');
    var thisWeek = isoDay(mondayOf(new Date()));
    var status = el('span', { class: 'hub-status', 'aria-live': 'polite', text: plan.status });

    body.appendChild(el('div', { class: 'hub-week-nav' }, [
      el('button', { class: 'hub-arrow', type: 'button', 'aria-label': 'Previous week', text: '‹', on: { click: function () { shiftWeek(-7); } } }),
      el('p', { class: 'hub-week-title', text: 'Week of ' + shortDate(monday) + ' – ' + shortDate(sunday) }),
      el('button', { class: 'hub-arrow', type: 'button', 'aria-label': 'Next week', text: '›', on: { click: function () { shiftWeek(7); } } }),
      plan.week !== thisWeek ? el('button', { class: 'quiet', type: 'button', text: 'This week', on: { click: function () { goWeek(thisWeek); } } }) : null,
      status
    ]));

    body.appendChild(howTo([
      'Under any meal, tap \u201C+ Add\u201D and choose a dish \u2014 or type a note, like \u201CLeftovers\u201D.',
      'Tap a dish any time to see its recipe.',
      'Short of ideas? Use \u201CFill my empty meals\u201D below and the app will suggest dishes for you.'
    ], 'How to plan your week'));
    body.appendChild(renderAiBar());

    var grid = el('div', { class: 'hub-week' });
    var todayIso = isoDay(new Date());
    DAYS.forEach(function (day) {
      var date = dayDate(plan.week, day);
      var hasMeals = MEALS.some(function (meal) { return slotItems(day + '-' + meal).length; });
      var row = el('div', { class: 'hub-day' + (isoDay(date) === todayIso ? ' is-today' : '') }, [
        el('div', { class: 'hub-day-head' }, [
          el('p', { class: 'hub-day-name' }, [DAY_NAME[day], el('span', { text: ' ' + shortDate(date) })]),
          hasMeals ? el('button', {
            class: 'hub-copy', type: 'button',
            'aria-label': 'Copy ' + DAY_NAME[day] + ' to other days',
            text: 'Copy to\u2026',
            on: { click: function () { openCopy(day); } }
          }) : null
        ])
      ]);
      MEALS.forEach(function (meal) { row.appendChild(renderSlot(day + '-' + meal, meal)); });
      grid.appendChild(row);
    });
    body.appendChild(grid);

    body.appendChild(el('p', { class: 'fine hub-foot', text: 'Saved to your account as you go, so it is the same on your phone and your laptop. Tap a dish to see its recipe.' }));
  }

  function shiftWeek(days) {
    var d = fromIso(plan.week);
    d.setDate(d.getDate() + days);
    goWeek(isoDay(d));
  }

  function goWeek(week) {
    plan.week = week;
    plan.data = null;
    planner.ai = null;
    plan.status = '';
    renderPlanner();
  }

  function renderSlot(key, meal) {
    var items = slotItems(key);
    var list = el('ul', { class: 'hub-slot-items' }, items.map(function (item, i) {
      return el('li', { class: 'hub-chip' + (item.ai ? ' is-ai' : '') }, [
        el('button', {
          class: 'hub-chip-main',
          type: 'button',
          title: item.t === 'note' ? 'Note' : 'Open ' + item.name,
          on: { click: function () { openItem(item); } }
        }, [el('span', { class: 'hub-chip-icon', 'aria-hidden': 'true', text: itemIcon(item) }), el('span', { class: 'hub-chip-name', text: itemLabel(item) })]),
        el('button', {
          class: 'hub-chip-x',
          type: 'button',
          'aria-label': 'Remove ' + itemLabel(item),
          text: '×',
          on: { click: function () {
            var next = slotItems(key).slice();
            next.splice(i, 1);
            setSlot(key, next);
            renderPlanner();
          } }
        })
      ]);
    }));
    return el('div', { class: 'hub-slot', dataset: { slot: key } }, [
      el('p', { class: 'hub-slot-label', text: MEAL_NAME[meal] }),
      list,
      el('button', { class: 'hub-add', type: 'button', 'aria-label': 'Add to ' + MEAL_NAME[meal], text: '+ Add', on: { click: function () { openPicker(key, meal); } } })
    ]);
  }

  function openItem(item) {
    if (item.t === 'dish') { M.openDish(item.name); return; }
    if (item.t === 'recipe') {
      var saved = (cookbook.list || []).filter(function (r) { return r.id === item.id; })[0];
      kitchen.tab = saved && isWeb(saved) ? 'web' : 'own';
      kitchen.open = item.id;
      store('kitchen-tab', kitchen.tab);
      M.setView('kitchen');
    }
  }

  /* ---- the picker: a dish, one of your recipes, or a note -------------- */

  var picker = { dialog: null, slot: null };

  function openPicker(slot, meal) {
    picker.slot = slot;
    if (!picker.dialog) {
      picker.dialog = el('dialog', { class: 'hub-picker', 'aria-label': 'Add to the calendar' });
      document.body.appendChild(picker.dialog);
      picker.dialog.addEventListener('click', function (e) { if (e.target === picker.dialog) picker.dialog.close(); });
    }
    var dlg = clear(picker.dialog);
    var parts = slot.split('-');
    var results = el('ul', { class: 'hub-picker-list' });
    var input = el('input', { class: 'hub-input', type: 'search', placeholder: 'Search 450 dishes, or type a note…', 'aria-label': 'Search dishes' });

    function add(item) {
      addToSlot(picker.slot, item);
      Sound.tick();
      dlg.close();
      renderPlanner();
    }

    function paint() {
      clear(results);
      var q = input.value;
      var foods = searchFood(q, 24);
      // Breakfast slots lead with breakfast food when nothing is typed.
      if (!q.trim() && meal === 'breakfast') foods = allowedFood().filter(function (d) { return d.tags.breakfast > 0; }).slice(0, 24);
      (cookbook.list || []).filter(function (r) { return !q.trim() || r.name.toLowerCase().indexOf(q.trim().toLowerCase()) !== -1; }).slice(0, 6).forEach(function (r) {
        results.appendChild(el('li', {}, [el('button', { class: 'hub-picker-item', type: 'button', on: { click: function () { add({ t: 'recipe', id: r.id, name: r.name }); } } }, [
          el('span', { 'aria-hidden': 'true', text: '\u{1F4D6}' }), ' ' + r.name, el('span', { class: 'hub-picker-meta', text: 'Your cookbook' })
        ])]));
      });
      foods.forEach(function (d) {
        results.appendChild(el('li', {}, [el('button', { class: 'hub-picker-item', type: 'button', on: { click: function () { add({ t: 'dish', name: d.name }); } } }, [
          el('span', { 'aria-hidden': 'true', text: d.icon }), ' ' + d.name, el('span', { class: 'hub-picker-meta', text: d.blurb })
        ])]));
      });
      // Last, not first: typing "pizza" and pressing Enter means the dish.
      if (q.trim()) {
        results.appendChild(el('li', {}, [el('button', { class: 'hub-picker-item is-note', type: 'button', on: { click: function () { add({ t: 'note', text: q.trim().slice(0, 80) }); } } }, [
          el('span', { 'aria-hidden': 'true', text: '\u{1F4DD}' }), ' Add “' + q.trim().slice(0, 40) + '” as a note'
        ])]));
      }
      if (!results.children.length) results.appendChild(el('li', { class: 'fine', text: 'Nothing matches. Type a note instead.' }));
    }

    input.addEventListener('input', paint);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        var first = results.querySelector('button');
        if (first) first.click();
      }
    });
    dlg.appendChild(el('div', { class: 'hub-picker-head' }, [
      el('p', { class: 'hub-picker-title', text: DAY_NAME[parts[0]] + ' · ' + MEAL_NAME[parts[1]] }),
      el('button', { class: 'quiet', type: 'button', text: 'Close', on: { click: function () { dlg.close(); } } })
    ]));
    dlg.appendChild(input);
    dlg.appendChild(el('p', { class: 'fine', text: 'Only dishes that keep your food rules are listed.' }));
    dlg.appendChild(results);
    paint();
    if (plus() && !cookbook.list && !cookbook.loading) loadCookbook().then(paint).catch(function () {});
    dlg.showModal();
    input.focus();
  }

  /* ---- copy a day across the week -------------------------------------- */

  var copier = { dialog: null };

  function cloneItems(list) {
    return list.map(function (item) { return JSON.parse(JSON.stringify(item)); });
  }

  // Copies `from`'s meals onto each day in `targets`. "fill" only touches meals
  // that are still empty, so a half-planned week is not overwritten; "replace"
  // makes the target day match the source exactly, empty meals included.
  function copyDay(from, targets, mode) {
    var before = JSON.stringify(plan.data.slots);
    var changed = 0;
    targets.forEach(function (day) {
      if (day === from) return;
      MEALS.forEach(function (meal) {
        var source = slotItems(from + '-' + meal);
        var key = day + '-' + meal;
        if (mode === 'fill' && slotItems(key).length) return;
        if (mode === 'fill' && !source.length) return;
        if (JSON.stringify(slotItems(key)) === JSON.stringify(source)) return;
        setSlot(key, cloneItems(source));
        changed++;
      });
    });
    return { before: before, changed: changed, days: targets.filter(function (d) { return d !== from; }).length };
  }

  function openCopy(from) {
    if (!copier.dialog) {
      copier.dialog = el('dialog', { class: 'hub-picker hub-copy-dialog', 'aria-label': 'Copy a day' });
      document.body.appendChild(copier.dialog);
      copier.dialog.addEventListener('click', function (e) { if (e.target === copier.dialog) copier.dialog.close(); });
    }
    var dlg = clear(copier.dialog);
    var boxes = {};
    var list = el('div', { class: 'hub-copy-days' });
    DAYS.forEach(function (day) {
      if (day === from) return;
      var box = el('input', { type: 'checkbox', checked: true });
      boxes[day] = box;
      list.appendChild(el('label', { class: 'hub-copy-day' }, [box, ' ' + DAY_NAME[day]]));
    });

    var mode = store('copy-mode') || 'fill';
    var fill = el('input', { type: 'radio', name: 'copy-mode', value: 'fill', checked: mode !== 'replace' });
    var replace = el('input', { type: 'radio', name: 'copy-mode', value: 'replace', checked: mode === 'replace' });
    var apply = el('button', { class: 'go go-sm', type: 'button' }, [el('span', { class: 'go-label', text: 'Copy' })]);
    var hint = el('p', { class: 'fine' });

    function chosen() { return DAYS.filter(function (d) { return boxes[d] && boxes[d].checked; }); }
    function refresh() {
      var n = chosen().length;
      apply.disabled = !n;
      hint.textContent = replace.checked
        ? 'Replaces everything on the ticked days, including meals you left empty here.'
        : 'Leaves any meal you have already planned on those days alone.';
    }
    list.addEventListener('change', refresh);
    fill.addEventListener('change', refresh);
    replace.addEventListener('change', refresh);

    function setAll(on) { Object.keys(boxes).forEach(function (d) { boxes[d].checked = on; }); refresh(); }

    apply.addEventListener('click', function () {
      var m = replace.checked ? 'replace' : 'fill';
      store('copy-mode', m);
      var done = copyDay(from, chosen(), m);
      dlg.close();
      planner.ai = { kind: 'copy', from: from, days: done.days, changed: done.changed, undo: done.before };
      if (done.changed) Sound.win();
      renderPlanner();
    });

    dlg.appendChild(el('div', { class: 'hub-picker-head' }, [
      el('p', { class: 'hub-picker-title', text: 'Copy this day to\u2026' }),
      el('button', { class: 'quiet', type: 'button', text: 'Close', on: { click: function () { dlg.close(); } } })
    ]));
    dlg.appendChild(el('div', { class: 'hub-copy-quick' }, [
      el('button', { class: 'quiet', type: 'button', text: 'Whole week', on: { click: function () { setAll(true); } } }),
      el('button', { class: 'quiet', type: 'button', text: 'Weekdays', on: { click: function () {
        Object.keys(boxes).forEach(function (d) { boxes[d].checked = ['mon', 'tue', 'wed', 'thu', 'fri'].indexOf(d) !== -1; });
        refresh();
      } } }),
      el('button', { class: 'quiet', type: 'button', text: 'Weekend', on: { click: function () {
        Object.keys(boxes).forEach(function (d) { boxes[d].checked = d === 'sat' || d === 'sun'; });
        refresh();
      } } }),
      el('button', { class: 'quiet', type: 'button', text: 'None', on: { click: function () { setAll(false); } } })
    ]));
    dlg.appendChild(list);
    dlg.appendChild(el('div', { class: 'hub-copy-modes' }, [
      el('label', {}, [fill, ' Only fill meals that are empty']),
      el('label', {}, [replace, ' Replace what is there'])
    ]));
    dlg.appendChild(hint);
    dlg.appendChild(apply);
    refresh();
    dlg.showModal();
  }

  /* ---- the calendar's AI ----------------------------------------------- */

  function emptySlots(which) {
    var meals = which === 'dinner' ? ['dinner'] : which === 'main' ? ['lunch', 'dinner'] : MEALS;
    var out = [];
    DAYS.forEach(function (day) {
      meals.forEach(function (meal) {
        var key = day + '-' + meal;
        if (!slotItems(key).length) out.push(key);
      });
    });
    return out;
  }

  function renderAiBar() {
    var wrap = el('section', { class: 'hub-ai', 'aria-label': 'Calendar assistant' });
    var fillWhich = el('select', { class: 'hub-select', 'aria-label': 'Which empty slots to fill' }, [
      el('option', { value: 'dinner', text: 'Empty dinners' }),
      el('option', { value: 'main', text: 'Empty lunches and dinners' }),
      el('option', { value: 'all', text: 'All empty meals' })
    ]);
    fillWhich.value = store('fill-which') || 'dinner';
    fillWhich.addEventListener('change', function () { store('fill-which', fillWhich.value); });

    var fillBtn = el('button', { class: 'go go-sm', type: 'button' }, [el('span', { class: 'go-label', text: '\u2728 Fill my empty meals' })]);
    var prepBtn = el('button', { class: 'quiet', type: 'button', text: '\u{1F961} Make a cook-ahead plan' });
    var balanceBtn = el('button', { class: 'quiet', type: 'button', text: '\u2696\uFE0F Is my week balanced?' });
    var out = el('div', { class: 'hub-ai-out', 'aria-live': 'polite' });

    fillBtn.addEventListener('click', function () {
      var slots = emptySlots(fillWhich.value);
      if (!slots.length) { clear(out).appendChild(note(ERRORS.nothing_to_fill)); return; }
      var before = JSON.stringify(plan.data.slots);
      busyButton(fillBtn, true);
      clear(out).appendChild(note('Filling ' + slots.length + ' slot' + (slots.length === 1 ? '' : 's') + '…'));
      api('/api/planner-ai', { method: 'POST', body: { action: 'fill', slots: slotsForAi(), fill: slots, rules: M.effectiveRules(), liked: M.likedNames() } })
        .then(function (res) {
          res.fills.forEach(function (f) { addToSlot(f.slot, { t: 'dish', name: f.name, ai: true }); });
          planner.ai = { kind: 'fill', count: res.fills.length, undo: before };
          Sound.win();
          renderPlanner();
        })
        .catch(function (err) { busyButton(fillBtn, false); clear(out).appendChild(note(errorText(err), 'error')); });
    });

    prepBtn.addEventListener('click', function () {
      busyButton(prepBtn, true);
      clear(out).appendChild(note('Planning your prep…'));
      api('/api/planner-ai', { method: 'POST', body: { action: 'prep', slots: slotsForAi(), rules: M.effectiveRules() } })
        .then(function (res) {
          plan.data.prep = { sessions: res.sessions, keeps: res.keeps };
          plan.data.prepDone = {};
          savePlan();
          planner.ai = { kind: 'prep' };
          renderPlanner();
        })
        .catch(function (err) { busyButton(prepBtn, false); clear(out).appendChild(note(errorText(err), 'error')); });
    });

    balanceBtn.addEventListener('click', function () {
      busyButton(balanceBtn, true);
      clear(out).appendChild(note('Reading your week…'));
      api('/api/planner-ai', { method: 'POST', body: { action: 'balance', slots: slotsForAi(), rules: M.effectiveRules() } })
        .then(function (res) {
          planner.ai = { kind: 'balance', notes: res.notes, swaps: res.swaps };
          renderPlanner();
        })
        .catch(function (err) { busyButton(balanceBtn, false); clear(out).appendChild(note(errorText(err), 'error')); });
    });

    wrap.appendChild(el('div', { class: 'hub-ai-head' }, [
      el('p', { class: 'hub-ai-title', text: 'Let the app help' }),
      el('p', { class: 'fine', text: 'Choose which meals to fill, then tap the button: it suggests dishes from our recipes, and only ones that keep your food rules. The cook-ahead plan tells you what to chop and cook on Sunday to make the week easy. You can undo anything it adds.' })
    ]));
    wrap.appendChild(el('div', { class: 'hub-ai-row' }, [fillWhich, fillBtn, prepBtn, balanceBtn]));
    wrap.appendChild(out);

    var ai = planner.ai;
    if (ai && ai.kind === 'fill') {
      out.appendChild(el('p', { class: 'hub-note is-good' }, [
        'Added ' + ai.count + ' dish' + (ai.count === 1 ? '' : 'es') + ' (marked ✨). ',
        el('button', { class: 'link-btn', type: 'button', text: 'Undo', on: { click: function () {
          plan.data.slots = JSON.parse(ai.undo);
          planner.ai = null;
          savePlan();
          renderPlanner();
        } } })
      ]));
    }
    if (ai && ai.kind === 'copy') {
      out.appendChild(el('p', { class: 'hub-note is-good' }, [
        ai.changed
          ? 'Copied to the days you chose. '
          : 'Nothing to copy \u2014 those days already match, or have those meals planned. ',
        ai.changed ? el('button', { class: 'link-btn', type: 'button', text: 'Undo', on: { click: function () {
          plan.data.slots = JSON.parse(ai.undo);
          planner.ai = null;
          savePlan();
          renderPlanner();
        } } }) : null
      ]));
    }
    if (ai && ai.kind === 'balance') {
      if (ai.notes.length) out.appendChild(el('ul', { class: 'hub-ai-notes' }, ai.notes.map(function (n) { return el('li', { text: n }); })));
      ai.swaps.forEach(function (s) {
        var parts = s.slot.split('-');
        out.appendChild(el('div', { class: 'hub-swap' }, [
          el('p', {}, [el('strong', { text: DAY_NAME[parts[0]] + ' ' + MEAL_NAME[parts[1]].toLowerCase() + ': ' }), s.icon + ' ' + s.name + ' — ' + s.why]),
          el('button', { class: 'quiet', type: 'button', text: 'Swap it in', on: { click: function () {
            setSlot(s.slot, [{ t: 'dish', name: s.name, ai: true }]);
            ai.swaps = ai.swaps.filter(function (x) { return x !== s; });
            renderPlanner();
          } } })
        ]));
      });
    }
    if (plan.data && plan.data.prep && plan.data.prep.sessions) out.appendChild(renderPrep(plan.data.prep));
    return wrap;
  }

  function renderPrep(prep) {
    var done = plan.data.prepDone || (plan.data.prepDone = {});
    // Folded away with a tap: it is long, and it sits above the calendar.
    var box = el('details', { class: 'hub-prep', open: !store('prep-folded') }, [el('summary', { class: 'hub-ai-title', text: '\u{1F961} Your prep plan' })]);
    box.addEventListener('toggle', function () { store('prep-folded', !box.open); });
    prep.sessions.forEach(function (s, si) {
      box.appendChild(el('p', { class: 'hub-prep-title', text: s.title + (s.minutes ? ' · about ' + s.minutes + ' min' : '') }));
      box.appendChild(el('ul', { class: 'hub-checks' }, s.tasks.map(function (task, ti) {
        var key = si + ':' + ti;
        var box2 = el('input', { type: 'checkbox', checked: !!done[key], on: { change: function () { done[key] = box2.checked; savePlan(); } } });
        return el('li', {}, [el('label', {}, [box2, ' ' + task])]);
      })));
    });
    if (prep.keeps && prep.keeps.length) {
      box.appendChild(el('p', { class: 'hub-prep-title', text: 'How long it keeps' }));
      box.appendChild(el('ul', { class: 'hub-ai-notes' }, prep.keeps.map(function (k) { return el('li', { text: k }); })));
    }
    box.appendChild(el('button', { class: 'link-btn', type: 'button', text: 'Clear the prep plan', on: { click: function () { plan.data.prep = null; savePlan(); renderPlanner(); } } }));
    return box;
  }

  /* ---------------------------------------------- shopping list (P) -- */

  var AISLES = [
    ['Fruit & veg', /onion|garlic|tomato|potato|carrot|bell pepper|red pepper|green pepper|yellow pepper|peppers\b|chilli|chili|lettuce|spinach|cabbage|leek|celery|cucumber|courgette|zucchini|aubergine|eggplant|mushroom|parsley|coriander|cilantro|basil|mint|thyme|rosemary|dill|sage|ginger|lemon|lime|apple|banana|berr|avocado|spring onion|scallion|shallot|kale|broccoli|cauliflower|squash|pumpkin|sweetcorn|corn on|\bpeas?\b|beansprout|bean sprout|rocket|orange|mango|pineapple|grape|herb|salad|radish|beetroot|fennel|asparagus|sweet potato|plantain|okra|pak choi|bok choy|lemongrass|chive/i],
    ['Meat & fish', /chicken|beef|pork|lamb|mince|bacon|sausage|\bham\b|turkey|duck|fish|salmon|cod|tuna|prawn|shrimp|steak|chorizo|anchov|mussel|squid|haddock|mackerel|crab|lobster|scallop|pancetta|prosciutto|veal|goat/i],
    ['Dairy & eggs', /milk|cream|butter|cheese|yoghurt|yogurt|\beggs?\b|parmesan|mozzarella|feta|cr[eè]me|ghee|halloumi|paneer|ricotta|mascarpone/i],
    ['Bread & bakery', /bread|\bbuns?\b|rolls?\b|tortilla|pitta|pita|naan|bagel|wraps?\b|baguette|brioche|croissant|crumpet|muffin/i],
    ['Tins & jars', /\btins?\b|\bcans?\b|tinned|canned|passata|stock|broth|sauce|paste|ketchup|mayo|mustard|vinegar|honey|\bjam\b|peanut butter|coconut milk|soy|chutney|pickle|olives|capers|syrup|tahini|miso|fish sauce/i],
    ['Cupboard', /flour|sugar|\brice\b|pasta|spaghetti|noodle|oats|lentil|chickpea|beans|spice|cumin|paprika|turmeric|cinnamon|nutmeg|cardamom|clove|chilli flakes|oregano|bay lea|salt|oil|baking|yeast|cocoa|chocolate|\bnuts?\b|almond|cashew|walnut|peanut|seeds?\b|stock cube|curry powder|garam masala|vanilla|cornflour|cornstarch|breadcrumb|couscous|quinoa|polenta|bulgur|semolina/i],
    ['Frozen', /frozen|ice cream/i]
  ];

  function aisleOf(name) {
    for (var i = 0; i < AISLES.length; i++) if (AISLES[i][1].test(name)) return AISLES[i][0];
    return 'Everything else';
  }

  var QTY_LINE = /^((?:\d+(?:\.\d+)?)(?:\s+\d+\/\d+)?|\d+\/\d+)\s*(kg|g|ml|l|tsp|tbsp|cups?|cloves?|tins?|cans?|slices?|handfuls?|bunch(?:es)?|pinch(?:es)?|x)?\b\.?\s*(.*)$/i

  function parseLine(line) {
    var m = QTY_LINE.exec(line.trim());
    var qty = null;
    var unit = '';
    var rest = line.trim();
    if (m) {
      qty = Recipes.parseQuantity(m[1]);
      unit = (m[2] || '').toLowerCase().replace(/s$/, '');
      rest = m[3] || '';
    }
    var name = rest.replace(/\([^)]*\)/g, ' ').split(',')[0].replace(/^(of|large|small|medium)\s+/i, '').replace(/\s+/g, ' ').trim();
    return { qty: qty, unit: unit, name: name || line.trim(), line: line.trim() };
  }

  function shoppingItems(people) {
    var merged = {};
    var meals = 0;
    if (!plan.data) return { items: [], meals: 0, missing: [] };
    var missing = [];
    Object.keys(plan.data.slots).forEach(function (key) {
      slotItems(key).forEach(function (item) {
        var recipe = null;
        var from = item.name;
        if (item.t === 'dish') recipe = recipeFor(item.name);
        else if (item.t === 'recipe') recipe = (cookbook.list || []).filter(function (r) { return r.id === item.id; })[0] || null;
        else return;
        if (!recipe) { if (missing.indexOf(from) === -1) missing.push(from); return; }
        meals++;
        Recipes.scale(recipe, people).forEach(function (line) {
          var p = parseLine(line);
          var k = p.name.toLowerCase() + '|' + p.unit;
          var e = merged[k];
          if (!e) e = merged[k] = { name: p.name, unit: p.unit, qty: 0, counted: true, lines: [], from: [] };
          if (p.qty === null || !isFinite(p.qty)) e.counted = false;
          else e.qty += p.qty;
          e.lines.push(p.line);
          if (e.from.indexOf(from) === -1) e.from.push(from);
        });
      });
    });
    var items = Object.keys(merged).map(function (k) {
      var e = merged[k];
      var text;
      if (e.counted && e.qty > 0) {
        var q = Recipes.formatQuantity(e.qty);
        text = q + (e.unit ? (['g', 'kg', 'ml', 'l'].indexOf(e.unit) !== -1 ? e.unit + ' ' : ' ' + e.unit + (e.qty > 1 && /^(tin|can|clove|slice|handful|cup|bunch|pinch)$/.test(e.unit) ? 's ' : ' ')) : ' ') + e.name;
      } else {
        text = e.lines.length === 1 ? e.lines[0] : e.name + ' (' + e.lines.length + ' recipes)';
      }
      return { key: k, text: text.replace(/\s+/g, ' ').trim(), aisle: aisleOf(e.name), from: e.from };
    });
    (plan.data.extras || []).forEach(function (x, i) {
      items.push({ key: 'extra:' + i, text: x, aisle: 'Your extras', from: [], extra: i });
    });
    return { items: items, meals: meals, missing: missing };
  }

  function renderShop(body) {
    if (!plus()) {
      body.appendChild(premiumCard('Shopping list from your week',
        'Every ingredient in every recipe on your calendar, worked out for how many you are feeding, merged into one list and sorted by aisle.',
        ['Two recipes that both need onions become one line with the total', 'Scaled to your household size', 'Tick things off in the shop; it syncs to your other devices', 'Copy or share it in one tap']));
      return;
    }
    if (!needsWeek(body, renderShop)) return;
    var people = plan.data.people || 2;
    var hideDone = !!store('shop-hide');
    var result = shoppingItems(people);
    if (!cookbook.list && !cookbook.loading && Object.keys(plan.data.slots).some(function (k) { return slotItems(k).some(function (i) { return i.t === 'recipe'; }); })) {
      loadCookbook().then(function () { renderPlanner(); }).catch(function () {});
    }

    var peopleSel = el('select', { class: 'hub-select', 'aria-label': 'How many people' }, [1, 2, 3, 4, 5, 6, 8].map(function (n) {
      return el('option', { value: String(n), text: n + (n === 1 ? ' person' : ' people') });
    }));
    peopleSel.value = String(people);
    peopleSel.addEventListener('change', function () { plan.data.people = Number(peopleSel.value); savePlan(); renderPlanner(); });

    var copyBtn = el('button', { class: 'quiet', type: 'button', text: 'Copy the list' });
    var shareBtn = navigator.share ? el('button', { class: 'quiet', type: 'button', text: 'Share' }) : null;
    var hideBtn = el('label', { class: 'hub-toggle' }, [el('input', { type: 'checkbox', checked: hideDone, on: { change: function (e) { store('shop-hide', e.target.checked); renderPlanner(); } } }), ' Hide ticked']);

    body.appendChild(el('div', { class: 'hub-row' }, [
      el('p', { class: 'hub-week-title', text: result.items.length + ' things for ' + result.meals + ' meal' + (result.meals === 1 ? '' : 's') }),
      peopleSel, hideBtn, copyBtn, shareBtn
    ]));
    // The shared browser, where a week's shop actually happens: one
    // supermarket basket, filled by both of you. "What's this?" opens the
    // same explainer as every other shared-browser button (see #beam-help).
    body.appendChild(el('div', { class: 'hub-row' }, [
      el('button', { class: 'go go-sm go-alt', type: 'button', on: { click: function () { M.openBeam('shop', 'This week\u2019s list'); } } }, [el('span', { class: 'go-label', text: '\u{1F6D2} Shop it together' })]),
      el('button', { class: 'link-btn beam-help-link', type: 'button', text: 'What\u2019s this?' }),
      el('span', { class: 'fine', text: 'One supermarket basket, filled by both of you from your own phones.' })
    ]));

    if (!result.items.length) {
      body.appendChild(note('Nothing to buy yet. Add dishes to this week’s calendar and their ingredients appear here.'));
    }

    var checked = plan.data.checked || (plan.data.checked = {});
    var byAisle = {};
    result.items.forEach(function (it) { (byAisle[it.aisle] = byAisle[it.aisle] || []).push(it); });
    var order = AISLES.map(function (a) { return a[0]; }).concat(['Everything else', 'Your extras']);
    var textLines = [];
    order.forEach(function (aisle) {
      var items = byAisle[aisle];
      if (!items) return;
      textLines.push('', aisle.toUpperCase());
      var ul = el('ul', { class: 'hub-checks hub-shop' });
      items.sort(function (a, b) { return a.text.localeCompare(b.text); }).forEach(function (it) {
        textLines.push((checked[it.key] ? '[x] ' : '[ ] ') + it.text);
        if (hideDone && checked[it.key]) return;
        var box = el('input', { type: 'checkbox', checked: !!checked[it.key], on: { change: function () {
          if (box.checked) checked[it.key] = true; else delete checked[it.key];
          savePlan();
          li.classList.toggle('is-done', box.checked);
        } } });
        var li = el('li', { class: checked[it.key] ? 'is-done' : '' }, [
          el('label', {}, [box, ' ', el('span', { text: it.text }), it.from.length ? el('span', { class: 'hub-from', text: ' · ' + it.from.slice(0, 3).join(', ') }) : null]),
          it.extra !== undefined ? el('button', { class: 'hub-chip-x', type: 'button', 'aria-label': 'Remove ' + it.text, text: '×', on: { click: function () {
            plan.data.extras.splice(it.extra, 1);
            savePlan();
            renderPlanner();
          } } }) : null
        ]);
        ul.appendChild(li);
      });
      body.appendChild(el('h2', { class: 'strip-title', text: aisle }));
      body.appendChild(ul);
    });

    var extra = el('input', { class: 'hub-input', type: 'text', maxlength: '80', placeholder: 'Add something else — kitchen roll, coffee…', 'aria-label': 'Add an item' });
    var addBtn = el('button', { class: 'go go-sm', type: 'button' }, [el('span', { class: 'go-label', text: 'Add' })]);
    function addExtra() {
      var v = extra.value.trim();
      if (!v) return;
      plan.data.extras = (plan.data.extras || []).concat([v.slice(0, 80)]).slice(-40);
      savePlan();
      renderPlanner();
    }
    addBtn.addEventListener('click', addExtra);
    extra.addEventListener('keydown', function (e) { if (e.key === 'Enter') addExtra(); });
    body.appendChild(el('div', { class: 'hub-row hub-add-row' }, [extra, addBtn]));

    if (result.missing.length) body.appendChild(note('No recipe on file for: ' + result.missing.join(', ') + ' — so nothing from those is on the list.'));

    var text = ('Shopping list — week of ' + shortDate(fromIso(plan.week)) + '\n' + textLines.join('\n')).trim();
    copyBtn.addEventListener('click', function () {
      try {
        navigator.clipboard.writeText(text).then(function () { copyBtn.textContent = 'Copied'; });
      } catch (err) { copyBtn.textContent = 'Could not copy'; }
    });
    if (shareBtn) shareBtn.addEventListener('click', function () { navigator.share({ title: 'Shopping list', text: text }).catch(function () {}); });
  }

  /* -------------------------------------------------- nutrition (P) -- */

  var nutrition = { data: {}, pending: [], loading: false, error: '' };

  function targets() {
    return store('nutrition-targets') || { kcal: 2000, protein: 60, carbs: 260, fat: 70, fibre: 30 };
  }

  function renderNutrition(body) {
    if (!plus()) {
      body.appendChild(premiumCard('Nutrition for your week',
        'Roughly what each day on your calendar adds up to — energy, protein, carbs, fat and fibre — against targets you set.',
        ['Estimated per serving from the recipe each dish actually uses', 'Day-by-day totals and a weekly average', 'Set your own daily targets', 'Estimates, clearly labelled — not a medical tool']));
      return;
    }
    if (!needsWeek(body, renderNutrition)) return;
    var names = weekDishNames();
    if (!names.length) {
      body.appendChild(note('Add dishes to this week’s calendar and their nutrition appears here.'));
      return;
    }
    var want = names.filter(function (n) { return !nutrition.data[n]; });
    if (want.length && !nutrition.loading && !nutrition.error) {
      nutrition.loading = true;
      api('/api/nutrition', { method: 'POST', body: { dishes: want } }).then(function (res) {
        nutrition.loading = false;
        Object.keys(res.nutrition || {}).forEach(function (n) { nutrition.data[n] = res.nutrition[n]; });
        nutrition.pending = res.pending || [];
        if (M.currentView() === 'planner' && planner.tab === 'nutrition') renderPlanner();
      }).catch(function (err) {
        nutrition.loading = false;
        nutrition.error = errorText(err);
        if (M.currentView() === 'planner' && planner.tab === 'nutrition') renderPlanner();
      });
    }

    var t = targets();
    var keys = [['kcal', 'Energy', 'kcal'], ['protein', 'Protein', 'g'], ['carbs', 'Carbs', 'g'], ['fat', 'Fat', 'g'], ['fibre', 'Fibre', 'g']];

    var form = el('div', { class: 'hub-row hub-targets' }, [el('span', { class: 'fine', text: 'Daily targets:' })].concat(keys.map(function (k) {
      var input = el('input', { class: 'hub-input hub-num', type: 'number', min: '0', value: String(t[k[0]]), 'aria-label': k[1] + ' target' });
      input.addEventListener('change', function () {
        var next = targets();
        next[k[0]] = Math.max(0, Number(input.value) || 0);
        store('nutrition-targets', next);
        renderPlanner();
      });
      return el('label', { class: 'hub-target' }, [k[1] + ' ', input, ' ' + k[2]]);
    })));
    body.appendChild(form);

    if (nutrition.loading) body.appendChild(note('Working out ' + want.length + ' dish' + (want.length === 1 ? '' : 'es') + '…'));
    if (nutrition.error) body.appendChild(el('p', { class: 'hub-note is-error' }, [nutrition.error + ' ', el('button', { class: 'link-btn', type: 'button', text: 'Try again', on: { click: function () { nutrition.error = ''; renderPlanner(); } } })]));

    var table = el('div', { class: 'hub-nutri' });
    var totalsAll = { kcal: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 };
    var plannedDays = 0;
    DAYS.forEach(function (day) {
      var sums = { kcal: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 };
      var count = 0;
      MEALS.forEach(function (meal) {
        slotItems(day + '-' + meal).forEach(function (item) {
          var n = item.t === 'dish' && nutrition.data[item.name];
          if (!n) return;
          count++;
          keys.forEach(function (k) { sums[k[0]] += n[k[0]]; });
        });
      });
      if (count) { plannedDays++; keys.forEach(function (k) { totalsAll[k[0]] += sums[k[0]]; }); }
      table.appendChild(el('div', { class: 'hub-nutri-day' }, [
        el('p', { class: 'hub-day-name', text: DAY_NAME[day] }),
        count ? el('div', { class: 'hub-bars' }, keys.map(function (k) {
          var pct = t[k[0]] ? Math.min(150, Math.round(100 * sums[k[0]] / t[k[0]])) : 0;
          return el('div', { class: 'hub-bar' + (pct > 115 ? ' is-over' : '') }, [
            el('span', { class: 'hub-bar-label', text: k[1] }),
            el('span', { class: 'hub-bar-track' }, [el('span', { class: 'hub-bar-fill', style: 'width:' + Math.min(100, pct) + '%' })]),
            el('span', { class: 'hub-bar-value', text: Math.round(sums[k[0]]) + ' ' + k[2] })
          ]);
        })) : el('p', { class: 'fine', text: 'Nothing planned with a known recipe.' })
      ]));
    });
    if (plannedDays) {
      body.appendChild(el('p', { class: 'hub-week-title', text: 'Average planned day: ' + Math.round(totalsAll.kcal / plannedDays) + ' kcal · ' + Math.round(totalsAll.protein / plannedDays) + ' g protein · ' + Math.round(totalsAll.fibre / plannedDays) + ' g fibre' }));
    }
    body.appendChild(table);
    body.appendChild(el('p', { class: 'fine hub-foot', text: 'Estimates per serving, worked out from the recipe each dish uses here — good for spotting a heavy week, not for medical or allergy decisions. Snacks and drinks you do not plan are not counted.' }));
  }

  /* ----------------------------------------------------- budget (P) -- */

  var CURRENCY_BY_REGION = { GB: 'GBP', US: 'USD', CA: 'CAD', AU: 'AUD', NZ: 'NZD', IN: 'INR', ZA: 'ZAR', SE: 'SEK', NO: 'NOK', DK: 'DKK', CH: 'CHF', JP: 'JPY', SG: 'SGD', AE: 'AED', IE: 'EUR', DE: 'EUR', FR: 'EUR', ES: 'EUR', IT: 'EUR', NL: 'EUR', BE: 'EUR', AT: 'EUR', PT: 'EUR', FI: 'EUR', GR: 'EUR' };
  var budget = { costs: {}, currency: null, loading: false, error: '' };

  function guessCurrency() {
    var saved = store('budget-currency');
    if (saved) return saved;
    var region = '';
    try { region = (new Intl.Locale(navigator.language)).maximize().region || ''; } catch (err) {}
    return CURRENCY_BY_REGION[region] || 'GBP';
  }

  function money(value, currency) {
    try { return new Intl.NumberFormat([], { style: 'currency', currency: currency, maximumFractionDigits: currency === 'JPY' ? 0 : 2 }).format(value); }
    catch (err) { return currency + ' ' + value.toFixed(2); }
  }

  function renderBudget(body) {
    if (!plus()) {
      body.appendChild(premiumCard('Budget for your week',
        'Roughly what the week on your calendar costs to cook, meal by meal, against a weekly budget you set — with cheaper swaps for the priciest nights.',
        ['Estimated from supermarket prices for the amounts each recipe uses', 'In your own currency, for your household size', 'Cheaper dishes that keep your food rules, swapped in with one tap']));
      return;
    }
    if (!needsWeek(body, renderBudget)) return;
    var currency = guessCurrency();
    if (budget.currency !== currency) { budget.costs = {}; budget.currency = currency; budget.error = ''; }
    var people = plan.data.people || 2;
    var names = weekDishNames();

    var curSel = el('select', { class: 'hub-select', 'aria-label': 'Currency' }, ['GBP', 'USD', 'EUR', 'CAD', 'AUD', 'NZD', 'INR', 'ZAR', 'SEK', 'NOK', 'DKK', 'CHF', 'JPY', 'SGD', 'AED'].map(function (c) { return el('option', { value: c, text: c }); }));
    curSel.value = currency;
    curSel.addEventListener('change', function () { store('budget-currency', curSel.value); renderPlanner(); });
    var limit = Number(store('budget-limit-' + currency)) || 0;
    var limitInput = el('input', { class: 'hub-input hub-num', type: 'number', min: '0', step: '1', value: limit ? String(limit) : '', placeholder: 'e.g. 60', 'aria-label': 'Weekly budget' });
    limitInput.addEventListener('change', function () { store('budget-limit-' + currency, Number(limitInput.value) || 0); renderPlanner(); });

    body.appendChild(el('div', { class: 'hub-row' }, [
      el('label', { class: 'hub-target' }, ['Weekly budget ', limitInput]), curSel,
      el('span', { class: 'fine', text: 'for ' + people + (people === 1 ? ' person' : ' people') + ' (change it on the Shopping list tab)' })
    ]));

    if (!names.length) { body.appendChild(note('Add dishes to this week’s calendar and their cost appears here.')); return; }

    var want = names.filter(function (n) { return budget.costs[n] === undefined; });
    if (want.length && !budget.loading && !budget.error) {
      budget.loading = true;
      api('/api/budget', { method: 'POST', body: { dishes: want, currency: currency } }).then(function (res) {
        budget.loading = false;
        Object.keys(res.costs || {}).forEach(function (n) { budget.costs[n] = res.costs[n]; });
        if (M.currentView() === 'planner' && planner.tab === 'budget') renderPlanner();
      }).catch(function (err) {
        budget.loading = false;
        budget.error = errorText(err);
        if (M.currentView() === 'planner' && planner.tab === 'budget') renderPlanner();
      });
    }
    if (budget.loading) body.appendChild(note('Pricing ' + want.length + ' dish' + (want.length === 1 ? '' : 'es') + '…'));
    if (budget.error) body.appendChild(el('p', { class: 'hub-note is-error' }, [budget.error + ' ', el('button', { class: 'link-btn', type: 'button', text: 'Try again', on: { click: function () { budget.error = ''; renderPlanner(); } } })]));

    var meals = [];
    var total = 0;
    DAYS.forEach(function (day) {
      MEALS.forEach(function (meal) {
        slotItems(day + '-' + meal).forEach(function (item) {
          if (item.t !== 'dish' || budget.costs[item.name] === undefined) return;
          var cost = budget.costs[item.name] * people;
          total += cost;
          meals.push({ day: day, meal: meal, name: item.name, cost: cost });
        });
      });
    });

    var pct = limit ? Math.round(100 * total / limit) : 0;
    body.appendChild(el('div', { class: 'hub-budget-total' }, [
      el('p', { class: 'hub-big', text: money(total, currency) }),
      el('p', { class: 'fine', text: limit ? (total <= limit ? money(limit - total, currency) + ' under your budget of ' + money(limit, currency) : money(total - limit, currency) + ' over your budget of ' + money(limit, currency)) : 'Set a weekly budget to compare against.' }),
      limit ? el('span', { class: 'hub-bar-track hub-bar-wide' }, [el('span', { class: 'hub-bar-fill' + (pct > 100 ? ' is-over' : ''), style: 'width:' + Math.min(100, pct) + '%' })]) : null
    ]));

    var ranked = meals.slice().sort(function (a, b) { return b.cost - a.cost; });
    var planned = weekDishNames();
    body.appendChild(el('h2', { class: 'strip-title', text: 'Priciest meals, and cheaper ideas' }));
    var list = el('ul', { class: 'hub-budget-list' });
    ranked.slice(0, 3).forEach(function (m) {
      var key = m.day + '-' + m.meal;
      var ideas = allowedFood().filter(function (d) {
        if (!(d.tags.cheap > 0) || planned.indexOf(d.name) !== -1) return false;
        if (m.meal === 'breakfast') return d.tags.breakfast > 0;
        return !(d.tags.breakfast > 0) && !(d.tags.sweet > 0);
      });
      // A stable, different handful per meal rather than the same three every time.
      var start = (m.name.length * 7) % Math.max(1, ideas.length);
      ideas = ideas.slice(start).concat(ideas.slice(0, start)).slice(0, 2);
      list.appendChild(el('li', {}, [
        el('p', {}, [el('strong', { text: DAY_NAME[m.day] + ' ' + MEAL_NAME[m.meal].toLowerCase() + ': ' }), m.name + ' — about ' + money(m.cost, currency)]),
        el('div', { class: 'hub-row' }, ideas.map(function (d) {
          return el('button', { class: 'quiet', type: 'button', text: 'Swap for ' + d.icon + ' ' + d.name, on: { click: function () {
            var items = slotItems(key).map(function (i) { return i.t === 'dish' && i.name === m.name ? { t: 'dish', name: d.name } : i; });
            setSlot(key, items);
            renderPlanner();
          } } });
        }))
      ]));
    });
    body.appendChild(list);
    body.appendChild(el('p', { class: 'fine hub-foot', text: 'Estimates from typical supermarket prices for the amounts each recipe uses, so a spoonful of spice costs pennies, not the jar. Your shop will differ; the comparison between nights is the useful part.' }));
  }

  /* ----------------------------------------------- dinner party (P) -- */

  var PARTY_RULES = [
    ['vegetarian', 'Vegetarian', ['meat', 'seafood']],
    ['vegan', 'Vegan', ['meat', 'seafood', 'dairy', 'egg']],
    ['pork', 'No pork', ['pork']],
    ['beef', 'No beef', ['beef']],
    ['shellfish', 'No shellfish', ['shellfish']],
    ['seafood', 'No fish', ['seafood']],
    ['dairy', 'No dairy', ['dairy']],
    ['egg', 'No egg', ['egg']],
    ['alcohol', 'No alcohol', ['alcohol']],
    ['allium', 'No onion or garlic', ['allium']],
    ['spicy', 'Nothing spicy', ['spicy']]
  ];

  var party = store('party') || { guests: [{ name: '', rules: [] }, { name: '', rules: [] }], courses: ['Starter', 'Main', 'Pudding'], time: '19:30', style: '', result: null };

  function saveParty() { store('party', party); }

  function partyTags(guest) {
    var tags = [];
    guest.rules.forEach(function (id) {
      PARTY_RULES.forEach(function (r) { if (r[0] === id) r[2].forEach(function (t) { if (tags.indexOf(t) === -1) tags.push(t); }); });
    });
    return tags;
  }

  function renderParty(body) {
    if (!plus()) {
      body.appendChild(premiumCard('Dinner party planner',
        'Tell it who is coming and what each of them does not eat. It plans a menu every one of them can eat, and a cooking timeline that works back from the moment you sit down.',
        ['Vegetarian, vegan, no pork, no dairy… for each guest separately', 'Starter, main and pudding that belong together', 'A clock-time timeline: what to start at 4:15, what goes in at 6:50', 'Put it in your calendar, get the shopping list']));
      return;
    }

    var form = el('div', { class: 'hub-party' });
    party.guests.forEach(function (g, gi) {
      var name = el('input', { class: 'hub-input', type: 'text', maxlength: '40', value: g.name, placeholder: 'Guest ' + (gi + 1), 'aria-label': 'Guest name' });
      name.addEventListener('input', function () { g.name = name.value; saveParty(); });
      form.appendChild(el('div', { class: 'hub-guest' }, [
        el('div', { class: 'hub-row' }, [name, party.guests.length > 1 ? el('button', { class: 'hub-chip-x', type: 'button', 'aria-label': 'Remove guest', text: '×', on: { click: function () { party.guests.splice(gi, 1); saveParty(); renderPlanner(); } } }) : null]),
        el('div', { class: 'hub-pills' }, PARTY_RULES.map(function (r) {
          var on = g.rules.indexOf(r[0]) !== -1;
          return el('button', { class: 'hub-pill' + (on ? ' is-on' : ''), type: 'button', 'aria-pressed': on ? 'true' : 'false', text: r[1], on: { click: function () {
            if (on) g.rules = g.rules.filter(function (x) { return x !== r[0]; }); else g.rules.push(r[0]);
            saveParty();
            renderPlanner();
          } } });
        }))
      ]));
    });
    form.appendChild(el('button', { class: 'quiet', type: 'button', text: '+ Add a guest', on: { click: function () { if (party.guests.length < 16) party.guests.push({ name: '', rules: [] }); saveParty(); renderPlanner(); } } }));

    var courses = el('div', { class: 'hub-pills' }, ['Nibbles', 'Starter', 'Main', 'Side', 'Pudding'].map(function (c) {
      var on = party.courses.indexOf(c) !== -1;
      return el('button', { class: 'hub-pill' + (on ? ' is-on' : ''), type: 'button', 'aria-pressed': on ? 'true' : 'false', text: c, on: { click: function () {
        if (on) party.courses = party.courses.filter(function (x) { return x !== c; }); else party.courses.push(c);
        party.courses.sort(function (a, b) { return ['Nibbles', 'Starter', 'Main', 'Side', 'Pudding'].indexOf(a) - ['Nibbles', 'Starter', 'Main', 'Side', 'Pudding'].indexOf(b); });
        saveParty();
        renderPlanner();
      } } });
    }));
    var time = el('input', { class: 'hub-input hub-time', type: 'time', value: party.time, 'aria-label': 'Sitting down at' });
    time.addEventListener('change', function () { party.time = time.value || '19:30'; saveParty(); if (party.result) renderPlanner(); });
    var style = el('input', { class: 'hub-input', type: 'text', maxlength: '160', value: party.style, placeholder: 'Anything else? “Autumnal, nothing too fiddly, one of them hates coriander”' , 'aria-label': 'Anything else' });
    style.addEventListener('input', function () { party.style = style.value; saveParty(); });

    var go = el('button', { class: 'go', type: 'button' }, [el('span', { class: 'go-label', text: 'Plan the party' })]);
    var out = el('div', { class: 'hub-party-out', 'aria-live': 'polite' });
    go.addEventListener('click', function () {
      if (!party.courses.length) { clear(out).appendChild(note('Pick at least one course.', 'error')); return; }
      busyButton(go, true);
      clear(out).appendChild(note('Planning a menu everybody can eat…'));
      api('/api/party', { method: 'POST', body: {
        guests: party.guests.map(function (g, i) { return { name: g.name || 'Guest ' + (i + 1), rules: partyTags(g) }; }),
        hostRules: M.effectiveRules(),
        courses: party.courses,
        style: party.style
      } }).then(function (res) {
        party.result = res;
        saveParty();
        Sound.win();
        renderPlanner();
      }).catch(function (err) { busyButton(go, false); clear(out).appendChild(note(errorText(err), 'error')); });
    });

    body.appendChild(el('h2', { class: 'strip-title', text: 'Who is coming' }));
    body.appendChild(form);
    body.appendChild(el('p', { class: 'fine', text: 'Your own food rules from Profile are added automatically.' }));
    body.appendChild(el('h2', { class: 'strip-title', text: 'The meal' }));
    body.appendChild(courses);
    body.appendChild(el('div', { class: 'hub-row' }, [el('label', { class: 'hub-target' }, ['Sitting down at ', time])]));
    body.appendChild(style);
    body.appendChild(el('div', { class: 'hub-row' }, [go]));
    body.appendChild(out);
    if (party.result) out.appendChild(renderPartyResult(party.result));
  }

  function clockAt(sitDown, minutesBefore) {
    var p = (sitDown || '19:30').split(':');
    var d = new Date();
    d.setHours(Number(p[0]) || 19, Number(p[1]) || 0, 0, 0);
    d.setMinutes(d.getMinutes() - minutesBefore);
    try { return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }); } catch (err) { return pad(d.getHours()) + ':' + pad(d.getMinutes()); }
  }

  function renderPartyResult(res) {
    var box = el('div', { class: 'hub-party-result' });
    box.appendChild(el('h2', { class: 'strip-title', text: 'The menu' }));
    box.appendChild(el('ul', { class: 'hub-menu' }, res.menu.map(function (m) {
      return el('li', {}, [el('button', { class: 'hub-menu-item', type: 'button', on: { click: function () { M.openDish(m.name); } } }, [
        el('span', { class: 'hub-menu-course', text: m.course }),
        el('span', { class: 'hub-menu-name', text: m.icon + ' ' + m.name }),
        el('span', { class: 'hub-from', text: m.why })
      ])]);
    })));
    box.appendChild(el('p', { class: 'fine', text: 'Safe for all ' + res.guests.length + ' guest' + (res.guests.length === 1 ? '' : 's') + (res.ruledOut.length ? ' — nothing with ' + res.ruledOut.join(', ') + '.' : '.') }));
    if (res.timeline.length) {
      box.appendChild(el('h2', { class: 'strip-title', text: 'Your timeline' }));
      box.appendChild(el('ol', { class: 'hub-timeline' }, res.timeline.map(function (t) {
        return el('li', {}, [el('time', { text: t.minutesBefore === 0 ? 'Sit down' : clockAt(party.time, t.minutesBefore) }), el('span', { text: t.task })]);
      })));
    }
    if (res.tips.length) box.appendChild(el('ul', { class: 'hub-ai-notes' }, res.tips.map(function (t) { return el('li', { text: t }); })));

    var daySel = el('select', { class: 'hub-select', 'aria-label': 'Which day' }, DAYS.map(function (d) { return el('option', { value: d, text: DAY_NAME[d] }); }));
    daySel.value = 'sat';
    var put = el('button', { class: 'quiet', type: 'button', text: 'Put it in this week’s calendar' });
    put.addEventListener('click', function () {
      loadWeek(plan.week).then(function () {
        if (!plan.data) return;
        setSlot(daySel.value + '-dinner', res.menu.slice(0, 4).map(function (m) { return { t: 'dish', name: m.name }; }));
        put.textContent = 'Added to ' + DAY_NAME[daySel.value] + ' dinner';
      });
    });
    var people = party.guests.length + 1;
    var listBtn = el('button', { class: 'quiet', type: 'button', text: 'Shopping list for ' + people });
    var listOut = el('div');
    listBtn.addEventListener('click', function () {
      clear(listOut);
      var lines = [];
      res.menu.forEach(function (m) {
        var r = recipeFor(m.name);
        if (r) Recipes.scale(r, people).forEach(function (l) { lines.push(l + ' — ' + m.name); });
      });
      listOut.appendChild(el('ul', { class: 'hub-checks' }, lines.map(function (l) { return el('li', { text: l }); })));
    });
    box.appendChild(el('div', { class: 'hub-row' }, [daySel, put, listBtn]));
    box.appendChild(listOut);
    return box;
  }

  /* ====================================================================
   * KITCHEN
   * ==================================================================== */

  var KITCHEN_TABS = [
    { id: 'own', label: 'Your own recipes', premium: true },
    { id: 'web', label: 'Recipes from websites', premium: true },
    { id: 'fridge', label: 'What can I cook?', premium: true },
    { id: 'timers', label: 'Timers & measurements' },
    { id: 'season', label: 'What’s in season' }
  ];
  var KITCHEN_IDS = KITCHEN_TABS.map(function (t) { return t.id; });
  // Tabs that used to exist, and where they live now. Scanning moved to its
  // own section, Scan food.
  var OLD_KITCHEN_TAB = { cookbook: 'own', 'import': 'web', scan: 'own' };

  var kitchen = { tab: 'own', root: null, open: null, editing: null, imported: null, read: null };
  (function () {
    var saved = store('kitchen-tab');
    kitchen.tab = KITCHEN_IDS.indexOf(saved) !== -1 ? saved : OLD_KITCHEN_TAB[saved] || 'own';
  })();

  function renderKitchen() {
    var root = M.$('view-kitchen');
    if (!root) return;
    kitchen.root = root;
    clear(root);
    root.appendChild(head('Your kitchen', 'Recipes & kitchen',
      'Keep your own recipes, save recipes from any website, find out what you can cook with what is in the fridge — plus kitchen timers, measurements and what is in season.'));
    root.appendChild(tabStrip(KITCHEN_TABS, kitchen.tab, function (id) {
      kitchen.tab = id;
      store('kitchen-tab', id);
      kitchen.open = null;
      kitchen.editing = null;
      renderKitchen();
    }));
    var body = el('div', { class: 'hub-body' });
    root.appendChild(body);
    if (kitchen.tab === 'own') return renderOwn(body);
    if (kitchen.tab === 'web') return renderWeb(body);
    if (kitchen.tab === 'fridge') return renderFridge(body);
    if (kitchen.tab === 'timers') return renderTimers(body);
    if (kitchen.tab === 'season') return renderSeason(body);
  }

  // "How it works", numbered, at the top of anything that is not obvious.
  // Written for somebody who has never used an app like this.
  function howTo(steps, title) {
    return el('div', { class: 'hub-how' }, [
      el('p', { class: 'hub-how-title', text: title || 'How it works' }),
      el('ol', {}, steps.map(function (s) { return el('li', { text: s }); }))
    ]);
  }

  /* ------------------------------------------------- the cookbook (P) -- */

  var cookbook = { list: null, loading: false, error: '' };

  function loadCookbook() {
    cookbook.loading = true;
    return api('/api/cookbook').then(function (res) {
      cookbook.loading = false;
      cookbook.list = res.recipes || [];
      cookbook.error = '';
      return cookbook.list;
    }).catch(function (err) {
      cookbook.loading = false;
      cookbook.error = errorText(err);
      throw err;
    });
  }

  function saveRecipe(recipe) {
    return api('/api/cookbook', { method: 'POST', body: { recipe: recipe } }).then(function (res) {
      var list = (cookbook.list || []).filter(function (r) { return r.id !== res.recipe.id; });
      list.unshift(res.recipe);
      cookbook.list = list;
      return res.recipe;
    });
  }

  function isWeb(r) { return r.origin ? r.origin === 'web' : !!r.source; }

  function hostOf(url) {
    try { return new URL(url).hostname.replace(/^www\./, ''); } catch (err) { return ''; }
  }

  // Shared by both recipe tabs: loading, an open recipe, the edit form.
  function cookbookReady(body) {
    if (kitchen.editing) { renderRecipeForm(body, kitchen.editing); return false; }
    if (!cookbook.list) {
      if (cookbook.error) {
        body.appendChild(el('p', { class: 'hub-note is-error' }, [cookbook.error + ' ', el('button', { class: 'link-btn', type: 'button', text: 'Try again', on: { click: function () { cookbook.error = ''; renderKitchen(); } } })]));
        return false;
      }
      body.appendChild(note('Opening your recipes…'));
      if (!cookbook.loading) loadCookbook().then(renderKitchen).catch(renderKitchen);
      return false;
    }
    if (kitchen.open) {
      var r = cookbook.list.filter(function (x) { return x.id === kitchen.open; })[0];
      if (r) { renderRecipe(body, r); return false; }
      kitchen.open = null;
    }
    return true;
  }

  function recipeCards(list) {
    return el('ul', { class: 'hub-cards' }, list.map(function (r) {
      var from = r.origin === 'photo' ? 'copied from a photo' : r.origin === 'text' ? 'pasted in' : isWeb(r) ? hostOf(r.source) : 'your recipe';
      return el('li', {}, [el('button', { class: 'hub-card', type: 'button', on: { click: function () { kitchen.open = r.id; renderKitchen(); } } }, [
        r.image ? el('img', { class: 'hub-card-img', src: r.image, alt: '', loading: 'lazy', referrerPolicy: 'no-referrer' }) : el('span', { class: 'hub-card-img is-blank', 'aria-hidden': 'true', text: isWeb(r) ? '\u{1F310}' : '\u{1F4D6}' }),
        el('span', { class: 'hub-card-name', text: r.name }),
        el('span', { class: 'hub-from', text: [r.time ? r.time + ' min' : '', 'serves ' + r.serves, from].filter(Boolean).join(' · ') })
      ])]);
    }));
  }

  /* ---- your own recipes ------------------------------------------------ */

  function renderOwn(body) {
    if (!plus()) {
      body.appendChild(premiumCard('Your own recipes',
        'Keep your family recipes safe in one place, on every device. Type them in, copy them from a photo of a cookbook or a handwritten card, or paste them from an email.',
        ['Copy a recipe from a photo — even handwriting', 'Paste one from an email or a message and it tidies it up', 'Change the number of people and the amounts change too', 'Cook it step by step, or add it to your week']));
      return;
    }
    if (!cookbookReady(body)) return;

    body.appendChild(howTo([
      'Choose how to add a recipe: type it, copy it from a photo, or paste it.',
      'Check it looks right, then tap “Save”.',
      'It is kept here, on every device you sign in on. Tap it any time to cook it.'
    ], 'Keep your recipes here'));

    var photoInput = el('input', { type: 'file', accept: 'image/*', capture: 'environment', class: 'hub-file', id: 'hub-recipe-photo' });
    var out = el('div', { 'aria-live': 'polite' });
    photoInput.addEventListener('change', function () {
      var file = photoInput.files && photoInput.files[0];
      if (!file) return;
      clear(out).appendChild(note('Reading your recipe… this takes about ten seconds.'));
      shrinkPhoto(file, 1600).then(function (photo) {
        return api('/api/recipe-import', { method: 'POST', body: { image: photo.base64, mime: photo.mime } });
      }).then(function (res) {
        res.recipe.origin = 'photo';
        kitchen.read = 'photo';
        kitchen.editing = res.recipe;
        renderKitchen();
      }).catch(function (err) { clear(out).appendChild(note(err && err.code ? errorText(err) : ERRORS.bad_image, 'error')); });
    });

    var pasteBox = el('div', { class: 'hub-paste', hidden: true }, [
      el('label', { class: 'hub-label', for: 'hub-paste-text', text: 'Paste the recipe here' }),
      el('textarea', { class: 'hub-input hub-area', id: 'hub-paste-text', rows: '8', placeholder: 'Paste the whole recipe — the ingredients and the method. It does not need to be tidy.' }),
      el('button', { class: 'go go-sm', type: 'button', on: { click: function (e) {
        var text = M.$('hub-paste-text').value.trim();
        if (text.length < 30) { clear(out).appendChild(note('Paste a little more — the ingredients and the steps.', 'error')); return; }
        var btn = e.currentTarget;
        busyButton(btn, true);
        clear(out).appendChild(note('Tidying it up…'));
        api('/api/recipe-import', { method: 'POST', body: { text: text } }).then(function (res) {
          res.recipe.origin = 'text';
          kitchen.read = 'text';
          kitchen.editing = res.recipe;
          renderKitchen();
        }).catch(function (err) { busyButton(btn, false); clear(out).appendChild(note(errorText(err), 'error')); });
      } } }, [el('span', { class: 'go-label', text: 'Tidy it up' })])
    ]);

    body.appendChild(el('div', { class: 'hub-big-actions' }, [
      el('button', { class: 'hub-big-btn', type: 'button', on: { click: function () { kitchen.read = null; kitchen.editing = { name: '', serves: 2, time: '', ingredients: [], steps: [], notes: '', origin: 'own' }; renderKitchen(); } } }, [
        el('span', { class: 'hub-big-icon', 'aria-hidden': 'true', text: '✍️' }),
        el('span', { class: 'hub-big-label', text: 'Type it in' }),
        el('span', { class: 'hub-big-sub', text: 'Write a recipe yourself' })
      ]),
      photoInput,
      el('label', { class: 'hub-big-btn', for: 'hub-recipe-photo' }, [
        el('span', { class: 'hub-big-icon', 'aria-hidden': 'true', text: '\u{1F4F7}' }),
        el('span', { class: 'hub-big-label', text: 'Copy it from a photo' }),
        el('span', { class: 'hub-big-sub', text: 'A cookbook page or a handwritten card' })
      ]),
      el('button', { class: 'hub-big-btn', type: 'button', on: { click: function () { pasteBox.hidden = !pasteBox.hidden; if (!pasteBox.hidden) M.$('hub-paste-text').focus(); } } }, [
        el('span', { class: 'hub-big-icon', 'aria-hidden': 'true', text: '\u{1F4CB}' }),
        el('span', { class: 'hub-big-label', text: 'Paste it in' }),
        el('span', { class: 'hub-big-sub', text: 'From an email or a message' })
      ])
    ]));
    body.appendChild(pasteBox);
    body.appendChild(out);

    var mine = cookbook.list.filter(function (r) { return !isWeb(r); });
    body.appendChild(el('h2', { class: 'strip-title', text: 'Your recipes (' + mine.length + ')' }));
    if (!mine.length) body.appendChild(note('None yet. Add one with the buttons above — a family favourite is a good start.'));
    else body.appendChild(recipeCards(mine));
  }

  /* ---- recipes from websites -------------------------------------------- */

  var READ_SAYS = {
    'recipe-card': 'Read from the website’s own recipe card.',
    microdata: 'Read from the recipe on the page.',
    plugin: 'Read from the recipe on the page.',
    headings: 'Read from the recipe on the page — worth a quick look before you save.',
    ai: 'This page had no recipe card, so the AI read it — please check the amounts before you cook.'
  };

  function renderWeb(body) {
    if (!plus()) {
      body.appendChild(premiumCard('Recipes from websites',
        'Found a recipe online? Paste its address and you get just the recipe — the ingredients and the steps — without the long story, the pop-ups and the adverts. It is saved for you on every device.',
        ['Works with most recipe websites and food blogs', 'Change the number of people and the amounts change too', 'Cook it step by step, or add it to your week']));
      return;
    }
    if (!cookbookReady(body)) return;

    body.appendChild(howTo([
      'Find a recipe you like on any website.',
      'Copy its address — the line at the very top of the screen that starts with “https”.',
      'Come back here, paste it in the box below, and tap “Get the recipe”.'
    ]));

    var input = el('input', { class: 'hub-input', type: 'url', inputmode: 'url', placeholder: 'Paste the recipe’s address here', 'aria-label': 'Recipe web address' });
    var go = el('button', { class: 'go go-sm', type: 'button' }, [el('span', { class: 'go-label', text: 'Get the recipe' })]);
    var pasteBtn = navigator.clipboard && navigator.clipboard.readText ? el('button', { class: 'quiet', type: 'button', text: '\u{1F4CB} Paste' }) : null;
    var out = el('div', { class: 'hub-import-out', 'aria-live': 'polite' });
    function run() {
      var url = input.value.trim();
      if (!url) { input.focus(); return; }
      if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
      busyButton(go, true);
      clear(out).appendChild(note('Reading the page…'));
      api('/api/recipe-import', { method: 'POST', body: { url: url } }).then(function (res) {
        busyButton(go, false);
        res.recipe.origin = 'web';
        kitchen.imported = res.recipe;
        kitchen.importedHow = res.method;
        paintImported(out);
      }).catch(function (err) { busyButton(go, false); clear(out).appendChild(note(errorText(err), 'error')); });
    }
    go.addEventListener('click', run);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') run(); });
    if (pasteBtn) pasteBtn.addEventListener('click', function () {
      navigator.clipboard.readText().then(function (t) { input.value = (t || '').trim(); if (input.value) run(); }).catch(function () { input.focus(); });
    });
    body.appendChild(el('div', { class: 'hub-row hub-add-row' }, [input, pasteBtn, go]));
    body.appendChild(out);
    if (kitchen.imported) paintImported(out);

    body.appendChild(el('details', { class: 'hub-details' }, [
      el('summary', { text: 'Which websites work?' }),
      el('p', { class: 'fine', text: 'Most recipe websites and food blogs do, including BBC Good Food, Bon Appétit, King Arthur Baking and Food Network. If a page has no recipe card, the AI reads it instead. A few big sites — Allrecipes, Serious Eats and Simply Recipes — block apps from reading them; for those, use “Paste it in” under Your own recipes.' })
    ]));

    var saved = cookbook.list.filter(isWeb);
    body.appendChild(el('h2', { class: 'strip-title', text: 'Saved from websites (' + saved.length + ')' }));
    if (!saved.length) body.appendChild(note('Recipes you save from websites will appear here.'));
    else body.appendChild(recipeCards(saved));
  }

  function paintImported(out) {
    var r = kitchen.imported;
    clear(out);
    var save = el('button', { class: 'go', type: 'button' }, [el('span', { class: 'go-label', text: 'Save this recipe' })]);
    save.addEventListener('click', function () {
      busyButton(save, true);
      saveRecipe(r).then(function (savedRecipe) {
        kitchen.imported = null;
        kitchen.open = savedRecipe.id;
        Sound.win();
        renderKitchen();
      }).catch(function (err) { busyButton(save, false); out.appendChild(note(errorText(err), 'error')); });
    });
    var how = READ_SAYS[kitchen.importedHow] || '';
    out.appendChild(el('article', { class: 'hub-recipe' }, [
      how ? el('p', { class: 'hub-note' + (kitchen.importedHow === 'ai' ? ' is-warn' : ' is-good'), text: how }) : null,
      r.image ? el('img', { class: 'hub-recipe-img', src: r.image, alt: '', referrerPolicy: 'no-referrer' }) : null,
      el('h2', { class: 'hub-recipe-name', text: r.name }),
      el('p', { class: 'fine', text: [r.time ? r.time + ' minutes' : '', 'serves ' + r.serves, 'from ' + hostOf(r.source)].filter(Boolean).join(' · ') }),
      el('div', { class: 'hub-row' }, [save, el('button', { class: 'quiet', type: 'button', text: 'Change something first', on: { click: function () { kitchen.read = kitchen.importedHow === 'ai' ? 'web-ai' : null; kitchen.editing = JSON.parse(JSON.stringify(r)); renderKitchen(); } } })]),
      el('h3', { class: 'strip-title', text: 'Ingredients (' + r.ingredients.length + ')' }),
      el('ul', { class: 'hub-ingredients' }, r.ingredients.map(function (l) { return el('li', { text: l }); })),
      el('h3', { class: 'strip-title', text: 'Method (' + r.steps.length + ' steps)' }),
      el('ol', { class: 'hub-steps' }, r.steps.map(function (s) { return el('li', { text: s }); }))
    ]));
  }

  /* ---- one recipe, and the form to write or change one ------------------ */

  function renderRecipe(body, r) {
    var serves = r.serves;
    var list = el('ul', { class: 'hub-ingredients' });
    function paintList() {
      clear(list);
      Recipes.scale(r, serves).forEach(function (line) { list.appendChild(el('li', { text: line })); });
    }
    var servesSel = el('select', { class: 'hub-select', 'aria-label': 'How many people' }, [1, 2, 3, 4, 5, 6, 8, 10, 12].concat([r.serves]).filter(function (v, i, a) { return a.indexOf(v) === i; }).sort(function (a, b) { return a - b; }).map(function (n) {
      return el('option', { value: String(n), text: 'For ' + n + (n === 1 ? ' person' : ' people') });
    }));
    servesSel.value = String(serves);
    servesSel.addEventListener('change', function () { serves = Number(servesSel.value); paintList(); });
    paintList();

    var slotDay = el('select', { class: 'hub-select', 'aria-label': 'Day' }, DAYS.map(function (d) { return el('option', { value: d, text: DAY_NAME[d] }); }));
    var slotMeal = el('select', { class: 'hub-select', 'aria-label': 'Meal' }, MEALS.map(function (m) { return el('option', { value: m, text: MEAL_NAME[m] }); }));
    slotMeal.value = 'dinner';
    var addCal = el('button', { class: 'quiet', type: 'button', text: 'Add to this week’s meals' });
    addCal.addEventListener('click', function () {
      loadWeek(plan.week).then(function () {
        if (!plan.data) return;
        addToSlot(slotDay.value + '-' + slotMeal.value, { t: 'recipe', id: r.id, name: r.name });
        addCal.textContent = 'Added to ' + DAY_NAME[slotDay.value] + ' ' + slotMeal.value + ' ✓';
      });
    });

    var backTo = isWeb(r) ? 'Recipes from websites' : 'Your own recipes';
    body.appendChild(el('div', { class: 'hub-row' }, [el('button', { class: 'quiet', type: 'button', text: '‹ Back to ' + backTo, on: { click: function () { kitchen.open = null; renderKitchen(); } } })]));
    body.appendChild(el('article', { class: 'hub-recipe' }, [
      r.image ? el('img', { class: 'hub-recipe-img', src: r.image, alt: '', referrerPolicy: 'no-referrer' }) : null,
      el('h2', { class: 'hub-recipe-name', text: r.name }),
      el('p', { class: 'fine', text: [r.time ? r.time + ' minutes' : '', isWeb(r) ? 'from ' + hostOf(r.source) : r.origin === 'photo' ? 'copied from a photo' : 'your own recipe'].filter(Boolean).join(' · ') }),
      r.notes ? el('p', { class: 'hub-recipe-notes', text: r.notes }) : null,
      el('div', { class: 'hub-row' }, [
        el('button', { class: 'go', type: 'button', on: { click: function () { M.openCookMode({ name: r.name, serves: r.serves, ingredients: r.ingredients, steps: r.steps.length ? r.steps : ['Cook it the way the notes say.'] }, serves, { name: r.name, icon: '\u{1F4D6}' }); } } }, [el('span', { class: 'go-label', text: 'Start cooking, step by step' })]),
        servesSel
      ]),
      el('h3', { class: 'strip-title', text: 'Ingredients' }),
      list,
      el('h3', { class: 'strip-title', text: 'Method' }),
      el('ol', { class: 'hub-steps' }, r.steps.map(function (s) { return el('li', { text: s }); })),
      isWeb(r) ? el('p', { class: 'fine' }, ['Original recipe: ', el('a', { href: r.source, target: '_blank', rel: 'noopener noreferrer', text: hostOf(r.source) })]) : null,
      el('div', { class: 'hub-row' }, [slotDay, slotMeal, addCal]),
      el('div', { class: 'hub-row' }, [
        el('button', { class: 'quiet', type: 'button', text: 'Change this recipe', on: { click: function () { kitchen.read = null; kitchen.editing = JSON.parse(JSON.stringify(r)); renderKitchen(); } } }),
        el('button', { class: 'quiet danger', type: 'button', text: 'Delete', on: { click: function (e) {
          var btn = e.currentTarget;
          if (btn.dataset.sure !== '1') { btn.dataset.sure = '1'; btn.textContent = 'Tap again to delete it for good'; return; }
          api('/api/cookbook?id=' + encodeURIComponent(r.id), { method: 'DELETE' }).then(function () {
            cookbook.list = cookbook.list.filter(function (x) { return x.id !== r.id; });
            kitchen.open = null;
            renderKitchen();
          }).catch(function (err) { btn.textContent = errorText(err); });
        } } })
      ])
    ]));
  }

  function renderRecipeForm(body, draft) {
    var name = el('input', { class: 'hub-input', type: 'text', maxlength: '120', value: draft.name || '', placeholder: 'For example: Grandma’s lasagne', 'aria-label': 'Recipe name', id: 'hub-form-name' });
    var serves = el('input', { class: 'hub-input hub-num', type: 'number', min: '1', max: '50', value: String(draft.serves || 2), 'aria-label': 'How many people it feeds' });
    var time = el('input', { class: 'hub-input hub-num', type: 'number', min: '1', max: '1440', value: draft.time ? String(draft.time) : '', placeholder: 'mins', 'aria-label': 'Minutes it takes' });
    var ingredients = el('textarea', { class: 'hub-input hub-area', rows: '8', placeholder: 'One on each line, for example:\n500g beef mince\n2 onions, chopped\n1 tin chopped tomatoes', 'aria-label': 'Ingredients, one on each line' });
    ingredients.value = (draft.ingredients || []).join('\n');
    var steps = el('textarea', { class: 'hub-input hub-area', rows: '8', placeholder: 'One step on each line, in order', 'aria-label': 'Method, one step on each line' });
    steps.value = (draft.steps || []).join('\n');
    var notes = el('textarea', { class: 'hub-input hub-area', rows: '3', placeholder: 'Anything else — who it came from, what to serve it with', 'aria-label': 'Notes' });
    notes.value = draft.notes || '';
    var out = el('div', { 'aria-live': 'polite' });
    var save = el('button', { class: 'go', type: 'button' }, [el('span', { class: 'go-label', text: 'Save this recipe' })]);
    save.addEventListener('click', function () {
      var recipe = {
        id: draft.id,
        name: name.value.trim(),
        serves: Number(serves.value) || 2,
        time: Number(time.value) || null,
        ingredients: ingredients.value.split('\n').map(function (l) { return l.trim(); }).filter(Boolean),
        steps: steps.value.split('\n').map(function (l) { return l.trim(); }).filter(Boolean),
        source: draft.source || '',
        image: draft.image || '',
        notes: notes.value.trim(),
        origin: draft.origin || (draft.source ? 'web' : 'own')
      };
      if (!recipe.name || (!recipe.ingredients.length && !recipe.steps.length)) {
        clear(out).appendChild(note('Give it a name, and add at least one ingredient or step.', 'error'));
        return;
      }
      busyButton(save, true);
      saveRecipe(recipe).then(function (savedRecipe) {
        kitchen.editing = null;
        kitchen.read = null;
        kitchen.imported = null;
        kitchen.tab = isWeb(savedRecipe) ? 'web' : 'own';
        store('kitchen-tab', kitchen.tab);
        kitchen.open = savedRecipe.id;
        Sound.win();
        renderKitchen();
      }).catch(function (err) { busyButton(save, false); clear(out).appendChild(note(errorText(err), 'error')); });
    });
    var banner = kitchen.read === 'photo' ? 'The AI copied this from your photo. Please check the amounts and steps against the photo, then save.'
      : kitchen.read === 'text' ? 'The AI tidied this up from what you pasted. Please check it, then save.'
      : kitchen.read === 'web-ai' ? 'The AI read this from the web page. Please check the amounts, then save.' : '';
    body.appendChild(el('div', { class: 'hub-form' }, [
      banner ? el('p', { class: 'hub-note is-warn', text: banner }) : null,
      el('label', { class: 'hub-label', for: 'hub-form-name', text: 'Recipe name' }), name,
      el('div', { class: 'hub-row' }, [el('label', { class: 'hub-target' }, ['Feeds ', serves, ' people']), el('label', { class: 'hub-target' }, ['Takes ', time, ' minutes'])]),
      el('label', { class: 'hub-label', text: 'Ingredients (one on each line)' }), ingredients,
      el('label', { class: 'hub-label', text: 'Method (one step on each line)' }), steps,
      el('label', { class: 'hub-label', text: 'Notes (optional)' }), notes,
      el('div', { class: 'hub-row' }, [save, el('button', { class: 'quiet', type: 'button', text: 'Cancel', on: { click: function () { kitchen.editing = null; kitchen.read = null; renderKitchen(); } } })]),
      out
    ]));
  }

  /* ====================================================================
   * SCAN FOOD (P) — its own section
   * ==================================================================== */

  var TAG_WORDS = { pork: 'pork', beef: 'beef', alcohol: 'alcohol', allium: 'onion or garlic', root: 'root vegetables', shellfish: 'shellfish', meat: 'meat', seafood: 'fish', dairy: 'dairy', egg: 'egg' };
  var VERDICT_ICON = { good: '\u{1F7E2}', ok: '\u{1F7E1}', treat: '\u{1F534}', unknown: '⚪' };
  var LEVEL_WORD = { low: 'Low', moderate: 'Medium', high: 'High' };

  /*
   * BLURRED BARCODES. A reader for the barcodes on food — EAN-13, and UPC-A,
   * which is the same thing with a 0 in front — that still works when the
   * picture is out of focus.
   *
   * Every ordinary reader starts by turning the picture into black and
   * white, then measures how wide each bar is. Out of focus, the thinnest
   * bars never get dark enough to count as black, and that is the end of it:
   * the old reader gave up on a barcode blurred by a third of a bar's width.
   * This one never decides what is black. It knows what each digit looks
   * like, blurs it the way the camera did, and asks which digit, blurred,
   * looks most like what the camera saw — through blur as wide as a whole
   * bar. The check digit says whether it got there; the scanner then wants
   * the same answer twice before it believes it.
   */
  var BlurEan = (function () {
    var L = ['0001101', '0011001', '0010011', '0111101', '0100011', '0110001', '0101111', '0111011', '0110111', '0001011'];
    var R = L.map(function (c) { return c.replace(/./g, function (b) { return b === '1' ? '0' : '1'; }); });
    var G = R.map(function (c) { return c.split('').reverse().join(''); });
    // The first digit is not drawn; it is which of L and G the next six use.
    var PARITY = ['LLLLLL', 'LLGLGG', 'LLGGLG', 'LLGGGL', 'LGLLGG', 'LGGLLG', 'LGGGLL', 'LGLGLG', 'LGLGGL', 'LGGLGL'];
    function bits(s) { return s.split('').map(Number); }
    // Left of the middle a digit is drawn as L or G (20 shapes), right of it as R.
    var LEFT = L.map(bits).concat(G.map(bits)), RIGHT = R.map(bits);

    // The bell curve's running total, from a table: the shape of the blur.
    var PHI = new Float64Array(1601);
    (function () {
      function erf(x) {
        var t = 1 / (1 + .3275911 * Math.abs(x));
        var y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - .284496736) * t + .254829592) * t * Math.exp(-x * x);
        return x >= 0 ? y : -y;
      }
      for (var i = 0; i <= 1600; i++) PHI[i] = .5 * (1 + erf((i / 200 - 4) / Math.SQRT2));
    })();
    function phi(z) {
      if (z <= -4) return 0;
      if (z >= 4) return 1;
      var f = (z + 4) * 200, i = f | 0;
      return PHI[i] + (PHI[i + 1] - PHI[i]) * (f - i);
    }

    // What is known about the 95 modules (stripes one module wide) before
    // reading any digit: the three guards, and that every digit on the left
    // starts light and ends dark, and on the right the other way round.
    var SKELETON = new Float64Array(95).fill(.5);
    [0, 2, 46, 48, 92, 94].forEach(function (i) { SKELETON[i] = 1; });
    [1, 45, 47, 49, 93].forEach(function (i) { SKELETON[i] = 0; });
    for (var k = 0; k < 6; k++) { SKELETON[3 + 7 * k] = 0; SKELETON[9 + 7 * k] = 1; SKELETON[50 + 7 * k] = 1; SKELETON[56 + 7 * k] = 0; }
    function moduleAt(mods, j) { return j < 0 || j > 94 ? 0 : mods[j]; }
    function digitStart(k) { return k < 6 ? 3 + 7 * k : 50 + 7 * (k - 6); }
    var GUARDS = [[-6, 3], [45, 50], [92, 101]];
    var MIN_FIT = .94;

    /*
     * The samples between modules a and b, and how much each of the modules
     * a-2 .. b+1 darkens each of them once blurred. Worked out once per line
     * up and shared by every digit tried there.
     */
    var CAP = 64, COLS = 14;
    function newWindow() { return { n: 0, cols: 0, W: new Float64Array(CAP * COLS), ys: new Float64Array(CAP), sy: 0, syy: 0 }; }
    var WINS = [], EDGE = new Float64Array(COLS + 1);
    for (k = 0; k < 15; k++) WINS.push(newWindow());

    function windowAt(w, y, x0, m, s, a, b) {
      var from = Math.max(0, Math.floor(x0 + a * m)), to = Math.min(y.length - 1, Math.ceil(x0 + b * m));
      var n = Math.min(CAP, Math.max(0, to - from + 1)), cols = b - a + 4, sy = 0, syy = 0;
      for (var i = 0; i < n; i++) {
        var x = from + i, u = (x + .5 - x0) / m, o = i * cols;
        for (var e = 0; e <= cols; e++) EDGE[e] = phi((u - (a - 2 + e)) / s);
        for (var c = 0; c < cols; c++) w.W[o + c] = EDGE[c] - EDGE[c + 1];
        w.ys[i] = y[x]; sy += y[x]; syy += y[x] * y[x];
      }
      w.n = n; w.cols = cols; w.sy = sy; w.syy = syy;
      return w;
    }

    /*
     * What is left unexplained once a pattern has been fitted to a window,
     * with its own brightness and contrast — so a shadow or a glare across
     * the label does not count against it — but with bars always darker.
     */
    function leftOver(w, n, sd, sdd, syd) {
      var vd = sdd - sd * sd / n, cov = syd - sd * w.sy / n, vy = w.syy - w.sy * w.sy / n;
      if (vd <= 1e-9) return vy;
      var gain = cov / vd;
      return gain >= 0 ? vy + 1e-6 : vy - gain * cov;
    }

    function fitFixed(w, mods) {
      var n = w.n, cols = w.cols, sd = 0, sdd = 0, syd = 0;
      if (n < 3) return Infinity;
      for (var i = 0, o = 0; i < n; i++, o += cols) {
        var dk = 0;
        for (var c = 0; c < cols; c++) dk += mods[c] * w.W[o + c];
        sd += dk; sdd += dk * dk; syd += w.ys[i] * dk;
      }
      return leftOver(w, n, sd, sdd, syd);
    }

    /*
     * Every shape a digit could have, scored against one digit's window. The
     * two modules either side are fixed; the seven in the middle are the
     * digit. Fitting is linear, so the sums each shape needs are made from
     * sums worked out once per window rather than going over every sample
     * thirty times.
     */
    var S = new Float64Array(7), Y = new Float64Array(7), GB = new Float64Array(7), GM = new Float64Array(49);
    function scoreDigit(w, outer, shapes, out) {
      var n = w.n, W = w.W, ys = w.ys, sb = 0, yb = 0, gbb = 0, i, j, q;
      S.fill(0); Y.fill(0); GB.fill(0); GM.fill(0);
      if (n < 3) { out.fill(Infinity); return; }
      for (i = 0; i < n; i++) {
        var o = i * 11, base = outer[0] * W[o] + outer[1] * W[o + 1] + outer[2] * W[o + 9] + outer[3] * W[o + 10];
        sb += base; yb += ys[i] * base; gbb += base * base;
        for (j = 0; j < 7; j++) {
          var wj = W[o + 2 + j];
          S[j] += wj; Y[j] += ys[i] * wj; GB[j] += base * wj;
          for (q = 0; q <= j; q++) GM[j * 7 + q] += wj * W[o + 2 + q];
        }
      }
      for (var c = 0; c < shapes.length; c++) {
        var b = shapes[c], sd = sb, syd = yb, sdd = gbb;
        for (j = 0; j < 7; j++) {
          if (!b[j]) continue;
          sd += S[j]; syd += Y[j]; sdd += 2 * GB[j] + GM[j * 7 + j];
          for (q = 0; q < j; q++) if (b[q]) sdd += 2 * GM[j * 7 + q];
        }
        out[c] = leftOver(w, n, sd, sdd, syd);
      }
    }

    /*
     * How badly every shape fits at each of the twelve places, for one line
     * up: where module 0 starts (x0), how wide a module is (m), and how wide
     * the blur is, in modules (s). A second pass fills in each digit's
     * neighbours from the first. The guards and quiet zones are scored too,
     * or a line up a whole digit out could fit as well as the right one.
     */
    function decodeWith(y, x0, m, s, passes) {
      var mods = new Float64Array(SKELETON), errs = [], best = [], outer = new Float64Array(4), total = 0, k, j;
      for (k = 0; k < 12; k++) {
        windowAt(WINS[k], y, x0, m, s, digitStart(k), digitStart(k) + 7);
        errs.push(new Float64Array(k < 6 ? 20 : 10));
      }
      for (var pass = 0; pass < passes; pass++) {
        total = 0;
        for (k = 0; k < 12; k++) {
          var st = digitStart(k), e = errs[k], bi = 0;
          outer[0] = moduleAt(mods, st - 2); outer[1] = moduleAt(mods, st - 1);
          outer[2] = moduleAt(mods, st + 7); outer[3] = moduleAt(mods, st + 8);
          scoreDigit(WINS[k], outer, k < 6 ? LEFT : RIGHT, e);
          for (j = 1; j < e.length; j++) if (e[j] < e[bi]) bi = j;
          best[k] = bi;
          total += e[bi];
        }
        for (k = 0; k < 12; k++) {
          var shape = (k < 6 ? LEFT : RIGHT)[best[k]];
          for (j = 0; j < 7; j++) mods[digitStart(k) + j] = shape[j];
        }
      }
      for (var g = 0; g < GUARDS.length; g++) {
        var r = GUARDS[g], w = windowAt(WINS[12 + g], y, x0, m, s, r[0], r[1]), gp = new Float64Array(w.cols);
        for (j = 0; j < w.cols; j++) gp[j] = moduleAt(mods, r[0] - 2 + j);
        total += fitFixed(w, gp);
      }
      var spread = 0;
      for (k = 0; k < 15; k++) { var wk = WINS[k]; if (wk.n) spread += wk.syy - wk.sy * wk.sy / wk.n; }
      return { errs: errs, total: total, spread: spread };
    }

    // The thirteen digits from the scores: the first is whichever L/G
    // pattern on the left fits best.
    function digitsOf(dec) {
      var best = null, k, d;
      for (var first = 0; first < 10; first++) {
        var pat = PARITY[first], err = 0, code = String(first);
        for (k = 0; k < 6; k++) {
          var off = pat[k] === 'L' ? 0 : 10, bd = 0;
          for (d = 1; d < 10; d++) if (dec.errs[k][off + d] < dec.errs[k][off + bd]) bd = d;
          err += dec.errs[k][off + bd]; code += bd;
        }
        if (!best || err < best.err) best = { err: err, code: code };
      }
      var code13 = best.code;
      for (k = 6; k < 12; k++) {
        var br = 0;
        for (d = 1; d < 10; d++) if (dec.errs[k][d] < dec.errs[k][br]) br = d;
        code13 += br;
      }
      return code13;
    }

    function checksumOk(code) {
      var sum = 0;
      for (var i = 0; i < 12; i++) sum += (+code[i]) * (i % 2 ? 3 : 1);
      return (10 - sum % 10) % 10 === +code[12];
    }

    // Roughly where the barcode is along the line, from where it crosses
    // half-way between its lightest and darkest: the longest run of
    // crossings with no gap in it as wide as a quiet zone.
    function roughly(y) {
      var sorted = Array.prototype.slice.call(y).sort(function (a, b) { return a - b; });
      var lo = sorted[Math.floor(sorted.length * .05)], hi = sorted[Math.floor(sorted.length * .95)];
      if (hi - lo < 12) return null;
      var mid = (lo + hi) / 2, xs = [], i;
      for (i = 1; i < y.length; i++) if ((y[i - 1] - mid) * (y[i] - mid) < 0) xs.push(i - 1 + (mid - y[i - 1]) / (y[i] - y[i - 1]));
      if (xs.length < 12) return null;
      var gaps = [];
      for (i = 1; i < xs.length; i++) gaps.push(xs[i] - xs[i - 1]);
      var typical = gaps.slice().sort(function (a, b) { return a - b; })[gaps.length >> 1];
      var quiet = Math.max(typical * 4, 6), from = 0, bestA = 0, bestB = 0;
      for (i = 1; i <= xs.length; i++) {
        if (i === xs.length || xs[i] - xs[i - 1] > quiet) {
          if (xs[i - 1] - xs[from] > xs[bestB] - xs[bestA]) { bestA = from; bestB = i - 1; }
          from = i;
        }
      }
      var span = xs[bestB] - xs[bestA];
      return span < 95 * 1.2 ? null : { x0: xs[bestA], m: span / 95 };
    }

    /*
     * One line across the barcode, already averaged down the bars. Resampled
     * to three and a half samples a module, so a sharp camera costs no more
     * than a blurry one; then the line up and the blur are found by trying a
     * coarse spread of them, and walking the best few downhill.
     */
    function readLine(line) {
      var ext = roughly(line);
      if (!ext) return null;
      var f = Math.min(1, 3.5 / ext.m);
      var lo = Math.max(0, Math.floor(ext.x0 - 16 * ext.m)), hi = Math.min(line.length, Math.ceil(ext.x0 + 112 * ext.m));
      var n = Math.max(1, Math.floor((hi - lo) * f)), y = new Float32Array(n), i;
      for (i = 0; i < n; i++) {
        var a = lo + i / f, b = lo + (i + 1) / f, acc = 0, wsum = 0;
        for (var x = Math.floor(a); x < Math.ceil(b) && x < line.length; x++) {
          var wgt = Math.min(b, x + 1) - Math.max(a, x);
          if (wgt > 0) { acc += line[x] * wgt; wsum += wgt; }
        }
        y[i] = wsum ? acc / wsum : 0;
      }
      var x0c = (ext.x0 - lo) * f, mc = ext.m * f, top = [];
      function consider(x0, m, s, passes) {
        var c = { x0: x0, m: m, s: s, total: decodeWith(y, x0, m, s, passes).total };
        if (top.length === 3 && c.total >= top[2].total) return;
        top.push(c);
        top.sort(function (p, q) { return p.total - q.total; });
        if (top.length > 3) top.length = 3;
      }
      [.3, .55, .85].forEach(function (s) {
        for (var mf = -4; mf <= 4; mf++) {
          var m = mc * (1 + mf * .02);
          for (var dx = -6; dx <= 6; dx++) consider(x0c + dx * .5 * m, m, s, 1);
        }
      });
      var winner = null;
      top.slice().forEach(function (c) {
        var here = { x0: c.x0, m: c.m, s: c.s, total: decodeWith(y, c.x0, c.m, c.s, 2).total };
        for (var step = 0; step < 16; step++) {
          var moves = [[.125, 0, 0], [-.125, 0, 0], [0, .005, 0], [0, -.005, 0], [0, 0, .08], [0, 0, -.08]], next = null;
          for (var q = 0; q < moves.length; q++) {
            var mv = moves[q], m = here.m * (1 + mv[1]), s = Math.max(.15, here.s + mv[2]);
            var t = { x0: here.x0 + mv[0] * m, m: m, s: s };
            t.total = decodeWith(y, t.x0, t.m, t.s, 2).total;
            if (t.total < (next ? next.total : here.total)) next = t;
          }
          if (!next) break;
          here = next;
        }
        if (!winner || here.total < winner.total) winner = here;
      });
      /*
       * Believed only if the check digit agrees, the blur found is one a
       * barcode could still be read through, and the pattern explains nearly
       * everything on the line. Real barcodes, however blurred, come out
       * above 0.97; wrong readings, print and noise never reached 0.92.
       */
      var dec = decodeWith(y, winner.x0, winner.m, winner.s, 2), code = digitsOf(dec);
      var fit = 1 - dec.total / Math.max(1e-9, dec.spread);
      return checksumOk(code) && winner.s <= 1.2 && fit >= MIN_FIT ? code : null;
    }

    // Both ways round: a barcode held upside down reads backwards.
    function read(line) {
      var code = readLine(line);
      if (code) return code;
      var back = new Float32Array(line.length);
      for (var i = 0; i < line.length; i++) back[i] = line[line.length - 1 - i];
      return readLine(back);
    }

    return { read: read };
  })();

  /*
   * READING BARCODES — three readers, the quickest first, on every frame:
   *
   *   1. The phone's own, where it has one (BarcodeDetector: Chrome on
   *      Android and on Macs).
   *   2. ZXing — the open-source reader most scanning apps are built on, in
   *      its C++ version compiled to WebAssembly. Fetched from jsDelivr the
   *      first time somebody scans, both halves checked against their hashes.
   *      It replaced the older JavaScript port, which gave up on a barcode
   *      blurred by a third of a bar's width.
   *   3. BlurEan (below), for food barcodes the other two cannot read
   *      because the picture is out of focus.
   *
   * And the camera is asked for what reading needs rather than whatever it
   * starts with: full HD rather than 640x480, focusing all the time, zoomed
   * in a little so the phone can be held far enough away to focus at all,
   * and not the fixed-focus wide-angle lens some phones open by default.
   */
  var ZXING_JS = 'https://cdn.jsdelivr.net/npm/zxing-wasm@3.1.4/dist/iife/reader/index.js';
  var ZXING_JS_SRI = 'sha384-PN2+TcV6o3ygq0xnuFCxKBra0Yt4uPsZhoQ/vGYAwE57BrG9nHTvynv6YPyluWaU';
  var ZXING_WASM = 'https://cdn.jsdelivr.net/npm/zxing-wasm@3.1.4/dist/reader/zxing_reader.wasm';
  var ZXING_WASM_SRI = 'sha384-uU3W9ksDBq9UOyHhv5S9GtsH9dlOsIMpeSy3WpglpRsLh12aEnMYcjZeSJq5MEum';
  var ZXING_FORMATS = ['EAN13', 'EAN8', 'UPCA', 'UPCE'];
  var scan = { stream: null, track: null, timer: null, run: 0, last: null, zxing: null };

  function loadZxing() {
    if (scan.zxing) return scan.zxing;
    scan.zxing = new Promise(function (resolve, reject) {
      if (window.ZXingWASM) return resolve(window.ZXingWASM);
      var s = document.createElement('script');
      s.src = ZXING_JS;
      s.integrity = ZXING_JS_SRI;
      s.crossOrigin = 'anonymous';
      s.async = true;
      s.onload = function () { window.ZXingWASM ? resolve(window.ZXingWASM) : reject(new Error('no reader')); };
      s.onerror = function () { reject(new Error('the reader would not load')); };
      document.head.appendChild(s);
    }).then(function (Z) {
      // The WebAssembly half is fetched here, hash checked, and handed over —
      // left to itself the reader would fetch it unchecked.
      return fetch(ZXING_WASM, { integrity: ZXING_WASM_SRI, mode: 'cors', credentials: 'omit' })
        .then(function (r) { if (!r.ok) throw new Error('wasm ' + r.status); return r.arrayBuffer(); })
        .then(function (wasm) { return Z.prepareZXingModule({ overrides: { wasmBinary: wasm }, fireImmediately: true }); })
        .then(function () { return Z; });
    });
    // A failed load is tried again next time; BlurEan reads on without it.
    scan.zxing.catch(function () { scan.zxing = null; });
    return scan.zxing;
  }

  function zxRead(Z, image) {
    return Z.readBarcodes(image, { formats: ZXING_FORMATS, tryHarder: true, maxNumberOfSymbols: 1 }).then(function (found) {
      for (var i = 0; i < found.length; i++) if (found[i].isValid && /^\d{8,14}$/.test(found[i].text)) return found[i].text;
      return null;
    }).catch(function () { return null; });
  }

  function nativeDetector() {
    if (!('BarcodeDetector' in window)) return null;
    try { return new window.BarcodeDetector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e'] }); } catch (err) { return null; }
  }

  function nativeRead(det, source) {
    if (!det) return Promise.resolve(null);
    return det.detect(source).then(function (codes) {
      for (var i = 0; i < codes.length; i++) if (/^\d{8,14}$/.test(codes[i].rawValue)) return codes[i].rawValue;
      return null;
    }).catch(function () { return null; });
  }

  /*
   * One line of brightness across the picture, averaged over `rows` rows
   * (or, `across`, columns) — down the bars, so the camera's grain averages
   * out and the bars themselves do not.
   */
  function barLine(img, at, rows, across) {
    var w = img.width, h = img.height, d = img.data, len = across ? h : w, line = new Float32Array(len), i, j;
    var from = Math.max(0, Math.min((across ? w : h) - rows, Math.round(at - rows / 2)));
    for (j = from; j < from + rows; j++) {
      for (i = 0; i < len; i++) {
        var o = across ? (i * w + j) * 4 : (j * w + i) * 4;
        line[i] += d[o] * .299 + d[o + 1] * .587 + d[o + 2] * .114;
      }
    }
    for (i = 0; i < len; i++) line[i] /= rows;
    return line;
  }

  /*
   * The same picture made easier for ZXing when it is soft: each run of
   * eight rows averaged into one, and sharpened across the bars. Mild blur
   * that stops ZXing on the picture as it is often does not stop it here.
   */
  function sharpened(img) {
    var w = img.width, rows = Math.floor(img.height / 8), out = new ImageData(w, Math.max(1, rows)), o = out.data;
    var line = new Float32Array(w), soft = new Float32Array(w);
    for (var r = 0; r < rows; r++) {
      line.set(barLine(img, r * 8 + 4, 8));
      var acc = 0, n = 0, rad = 5, i;
      for (i = 0; i < Math.min(w, rad + 1); i++) { acc += line[i]; n++; }
      for (i = 0; i < w; i++) {
        soft[i] = acc / n;
        if (i + rad + 1 < w) { acc += line[i + rad + 1]; n++; }
        if (i - rad >= 0) { acc -= line[i - rad]; n--; }
      }
      for (i = 0; i < w; i++) {
        var v = line[i] + 1.5 * (line[i] - soft[i]), p = (r * w + i) * 4;
        o[p] = o[p + 1] = o[p + 2] = v < 0 ? 0 : v > 255 ? 255 : v;
        o[p + 3] = 255;
      }
    }
    return out;
  }

  /*
   * BlurEan answers are believed once two separate looks agree — two lines
   * of the same photo, or two frames of the video — so a misreading has to
   * happen the same way twice to get through.
   */
  function agreement() {
    var seen = {};
    return function (code) {
      if (!code) return null;
      var now = Date.now(), prev = seen[code];
      seen[code] = { n: prev && now - prev.at < 4000 ? prev.n + 1 : 1, at: now };
      return seen[code].n >= 2 ? code : null;
    };
  }

  /* ---------------------------------------------------- the camera -- */

  function cameraConstraints(deviceId) {
    var video = { width: { ideal: 1920 }, height: { ideal: 1080 } };
    if (deviceId) video.deviceId = { exact: deviceId };
    else video.facingMode = { ideal: 'environment' };
    return { video: video, audio: false };
  }

  function canFocus(track) {
    var caps = track.getCapabilities ? track.getCapabilities() : null;
    // Browsers that do not say (Safari) are given the benefit of the doubt.
    if (!caps || !caps.focusMode) return true;
    return caps.focusMode.indexOf('continuous') !== -1;
  }

  function stopStream(stream) { if (stream) stream.getTracks().forEach(function (t) { t.stop(); }); }

  /*
   * Phones with three cameras on the back often open the wide-angle one,
   * which cannot focus close up — everything is a blur at barcode distance,
   * and no reader can fix that. So if the first camera cannot focus, the
   * other back cameras are tried for one that can, and the one that worked
   * is remembered for next time.
   */
  function openCamera() {
    var gum = function (c) { return navigator.mediaDevices.getUserMedia(c); };
    var saved = store('scan-camera');
    return (saved ? gum(cameraConstraints(saved)).catch(function () { return gum(cameraConstraints()); }) : gum(cameraConstraints()))
      .then(function (stream) {
        var track = stream.getVideoTracks()[0];
        if (canFocus(track) || !navigator.mediaDevices.enumerateDevices) return stream;
        var first = track.getSettings ? track.getSettings().deviceId : '';
        return navigator.mediaDevices.enumerateDevices().then(function (devices) {
          var others = devices.filter(function (d) {
            return d.kind === 'videoinput' && d.deviceId && d.deviceId !== first && !/front|user|facetime/i.test(d.label);
          }).slice(0, 4);
          if (!others.length) return stream;
          stopStream(stream);
          var tryNext = function (i) {
            if (i >= others.length) return gum(cameraConstraints(first));
            return gum(cameraConstraints(others[i].deviceId)).then(function (s) {
              if (canFocus(s.getVideoTracks()[0])) { store('scan-camera', others[i].deviceId); return s; }
              stopStream(s);
              return tryNext(i + 1);
            }, function () { return tryNext(i + 1); });
          };
          return tryNext(0);
        });
      });
  }

  // Focus all the time, and zoom in to twice where the camera can — so a
  // barcode fills the box with the phone far enough away to focus on it.
  function tuneCamera(track) {
    var caps = track.getCapabilities ? track.getCapabilities() : {};
    var want = {};
    if (caps.focusMode && caps.focusMode.indexOf('continuous') !== -1) want.focusMode = 'continuous';
    if (caps.zoom && caps.zoom.max >= 1.5) want.zoom = Math.max(caps.zoom.min || 1, Math.min(caps.zoom.max, 2));
    if (Object.keys(want).length) track.applyConstraints({ advanced: [want] }).catch(function () {});
    return { torch: !!caps.torch };
  }

  function stopCamera() {
    scan.run++;
    if (scan.timer) clearTimeout(scan.timer);
    scan.timer = null;
    stopStream(scan.stream);
    scan.stream = null;
    scan.track = null;
  }

  /*
   * The part of the frame to read: a little more than the white box, which
   * covers the middle 76% x 40% of the 4:3 picture shown — worked out on the
   * full frame the camera sends, which is wider than what is shown.
   */
  function scanRegion(video) {
    var vw = video.videoWidth, vh = video.videoHeight, shown = 4 / 3, w, h;
    if (vw / vh > shown) { h = vh; w = vh * shown; } else { w = vw; h = vw / shown; }
    var x = (vw - w) / 2, y = (vh - h) / 2;
    return { sx: Math.round(x + w * .04), sy: Math.round(y + h * .24), sw: Math.round(w * .92), sh: Math.round(h * .52) };
  }

  /*
   * Reads frames until something is found or the camera is stopped. Each
   * look: the phone's reader, then ZXing (every other frame on the
   * sharpened picture), then BlurEan on one line across the middle of the
   * box, moving between three heights frame to frame.
   */
  function readFrames(video, onCode, onLook) {
    var run = scan.run, det = nativeDetector(), Z = null, frame = 0, agree = agreement();
    var canvas = document.createElement('canvas'), ctx = canvas.getContext('2d', { willReadFrequently: true });
    loadZxing().then(function (z) { Z = z; }, function () {});
    function next() { if (run === scan.run) scan.timer = setTimeout(look, 60); }
    function done(code) { if (code && run === scan.run) { onCode(code); return true; } return false; }
    function look() {
      if (run !== scan.run) return;
      if (video.readyState < 2 || !video.videoWidth) return next();
      var r = scanRegion(video);
      canvas.width = r.sw; canvas.height = r.sh;
      ctx.drawImage(video, r.sx, r.sy, r.sw, r.sh, 0, 0, r.sw, r.sh);
      var img = ctx.getImageData(0, 0, r.sw, r.sh), f = frame++;
      onLook(f);
      nativeRead(det, canvas).then(function (code) {
        if (done(code)) return true;
        return Z ? zxRead(Z, f % 2 ? sharpened(img) : img).then(done) : false;
      }).then(function (found) {
        if (found || run !== scan.run) return;
        var at = img.height * [.5, .38, .62][f % 3];
        done(agree(BlurEan.read(barLine(img, at, Math.max(4, Math.round(img.height * .06))))));
      }).catch(function () {}).then(function () { if (run === scan.run) next(); });
    }
    look();
  }

  /* ------------------------------------------------ a photo instead -- */

  function photoPixels(file) {
    var fromBitmap = window.createImageBitmap
      ? createImageBitmap(file).catch(function () { return null; })
      : Promise.resolve(null);
    return fromBitmap.then(function (bmp) {
      if (bmp) return bmp;
      return new Promise(function (resolve, reject) {
        var url = URL.createObjectURL(file), im = new Image();
        im.onload = function () { URL.revokeObjectURL(url); resolve(im); };
        im.onerror = function () { URL.revokeObjectURL(url); reject(new Error('not a picture')); };
        im.src = url;
      });
    }).then(function (pic) {
      var w = pic.width, h = pic.height, k = Math.min(1, 2000 / Math.max(w, h));
      var c = document.createElement('canvas');
      c.width = Math.round(w * k); c.height = Math.round(h * k);
      var x = c.getContext('2d', { willReadFrequently: true });
      x.drawImage(pic, 0, 0, c.width, c.height);
      return { canvas: c, img: x.getImageData(0, 0, c.width, c.height) };
    });
  }

  /*
   * A photo of the barcode: the way that works everywhere, including inside
   * apps that will not share the live camera. The same three readers; for
   * BlurEan, lines across the photo at nine heights, both ways round in
   * case the barcode was photographed on its side, until two agree.
   */
  function readBarcodePhoto(file) {
    return photoPixels(file).then(function (p) {
      return nativeRead(nativeDetector(), p.canvas).then(function (code) {
        if (code) return code;
        return loadZxing().then(function (Z) {
          return zxRead(Z, p.img).then(function (c) { return c || zxRead(Z, sharpened(p.img)); });
        }, function () { return null; });
      }).then(function (code) {
        if (code) return code;
        var agree = agreement(), img = p.img;
        for (var side = 0; side < 2; side++) {
          var len = side ? img.width : img.height, rows = Math.max(4, Math.round(len * .02));
          for (var f = .3; f <= .701; f += .05) {
            var found = agree(BlurEan.read(barLine(img, len * f, rows, side === 1)));
            if (found) return found;
          }
        }
        return null;
      });
    });
  }

  function renderScanView() {
    var root = M.$('view-scan');
    if (!root) return;
    stopCamera();
    clear(root);
    root.appendChild(head('Check a product', 'Scan food',
      'Point your phone’s camera at the barcode on any packet, tin or bottle. You will see straight away how healthy it is, in plain words — and whether it has anything in it you do not eat.'));
    var body = el('div', { class: 'hub-body' });
    root.appendChild(body);

    if (!plus()) {
      body.appendChild(premiumCard('Scan food — is it good for you?',
        'Scan the barcode on anything in the shop or the cupboard and get a simple answer: a healthy choice, fine now and then, or best as a treat — with the reasons in everyday words.',
        ['A score out of 100 and a green, amber or red answer', 'Sugar in teaspoons, salt as a share of your daily limit', 'Warns you if it has something you have said you do not eat', 'Works on over three million products']));
      return;
    }

    body.appendChild(howTo([
      'Tap “Scan with my camera”. If your phone asks to use the camera, tap Allow.',
      'Hold the barcode (the black stripes) inside the white box on the screen, with the phone about 15 cm (6 inches) away — roughly the length of your hand. Hold it still for a moment.',
      'It does not need to look sharp: it reads blurry barcodes too. The answer appears by itself.',
      'If the camera will not work, tap “Take a photo of the barcode” instead.'
    ]));

    var video = el('video', { class: 'hub-camera', playsinline: true, muted: true, hidden: true });
    var hint = el('p', { class: 'hub-camera-hint', 'aria-live': 'polite' });
    var torch = el('button', { class: 'quiet hub-torch', type: 'button', hidden: true, 'aria-pressed': 'false', text: '\u{1F526} Turn the light on' });
    var stopBtn = el('button', { class: 'quiet', type: 'button', text: 'Stop the camera' });
    var frame = el('div', { class: 'hub-camera-wrap', hidden: true }, [
      el('div', { class: 'hub-camera-view' }, [video, el('span', { class: 'hub-camera-box', 'aria-hidden': 'true' })]),
      hint,
      el('div', { class: 'hub-row hub-camera-tools' }, [torch, stopBtn])
    ]);
    var out = el('div', { 'aria-live': 'polite' });
    var code = el('input', { class: 'hub-input', type: 'text', inputmode: 'numeric', pattern: '[0-9]*', maxlength: '14', placeholder: 'For example 5000157024671', 'aria-label': 'The numbers under the barcode', id: 'hub-scan-code' });
    var look = el('button', { class: 'go go-sm', type: 'button' }, [el('span', { class: 'go-label', text: 'Check it' })]);

    function lookup(value) {
      var c = String(value || '').replace(/\D/g, '');
      if (!/^\d{8,14}$/.test(c)) { clear(out).appendChild(note('A barcode number is 8 to 14 digits long. Check the numbers under the stripes.', 'error')); return; }
      stopCamera();
      frame.hidden = true;
      code.value = c;
      clear(out).appendChild(note('Looking it up…'));
      api('/api/scan?code=' + c).then(function (res) {
        scan.last = res.product;
        var recent = (store('scans') || []).filter(function (p) { return p.code !== res.product.code; });
        recent.unshift({ code: res.product.code, name: res.product.name, brand: res.product.brand, verdict: res.product.health && res.product.health.verdict });
        store('scans', recent.slice(0, 8));
        paintProduct(clear(out), res.product);
        try { out.scrollIntoView({ block: 'start', behavior: 'smooth' }); } catch (err) {}
      }).catch(function (err) {
        clear(out).appendChild(note(err.code === 'not_found'
          ? 'That product is not in the database yet. Try the numbers again, or try another product.'
          : errorText(err), 'error'));
      });
    }

    var camBtn = el('button', { class: 'hub-big-btn', type: 'button' }, [
      el('span', { class: 'hub-big-icon', 'aria-hidden': 'true', text: '\u{1F4F7}' }),
      el('span', { class: 'hub-big-label', text: 'Scan with my camera' }),
      el('span', { class: 'hub-big-sub', text: 'Point it at the barcode' })
    ]);
    // What to try next, said while it looks, for anybody it is not reading for.
    var HINTS = [
      [0, 'Hold the barcode inside the white box…'],
      [5000, 'Still looking. Move the phone a little further away, and hold it still.'],
      [12000, 'Make sure the whole barcode is inside the box, and that there is no shine on it. In a dim room, turn the light on.'],
      [22000, 'Still no luck? Tap “Stop the camera” and “Take a photo of the barcode” instead, or type the numbers under it.']
    ];

    camBtn.addEventListener('click', function () {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        clear(out).appendChild(note('This browser cannot use the camera here. Tap “Take a photo of the barcode” instead.', 'error'));
        return;
      }
      stopCamera();
      var run = scan.run;
      clear(out).appendChild(note('Starting the camera…'));
      loadZxing().catch(function () {});
      openCamera().then(function (stream) {
        if (run !== scan.run) { stopStream(stream); return; }
        scan.stream = stream;
        scan.track = stream.getVideoTracks()[0];
        var can = tuneCamera(scan.track);
        torch.hidden = !can.torch;
        torch.setAttribute('aria-pressed', 'false');
        torch.textContent = '\u{1F526} Turn the light on';
        video.srcObject = stream;
        video.hidden = false;
        frame.hidden = false;
        clear(out);
        var started = Date.now();
        hint.textContent = HINTS[0][1];
        var p = video.play();
        if (p && p.catch) p.catch(function () {});
        try { frame.scrollIntoView({ block: 'start', behavior: 'smooth' }); } catch (err) {}
        readFrames(video, function (value) {
          Sound.tick();
          if (navigator.vibrate) { try { navigator.vibrate(60); } catch (err) {} }
          lookup(value);
        }, function () {
          var since = Date.now() - started, say = HINTS[0][1];
          HINTS.forEach(function (h) { if (since >= h[0]) say = h[1]; });
          if (hint.textContent !== say) hint.textContent = say;
        });
      }).catch(cameraRefused);
    });

    torch.addEventListener('click', function () {
      if (!scan.track) return;
      var on = torch.getAttribute('aria-pressed') !== 'true';
      scan.track.applyConstraints({ advanced: [{ torch: on }] }).then(function () {
        torch.setAttribute('aria-pressed', on ? 'true' : 'false');
        torch.textContent = on ? '\u{1F526} Turn the light off' : '\u{1F526} Turn the light on';
      }).catch(function () { torch.hidden = true; });
    });

    stopBtn.addEventListener('click', function () {
      stopCamera();
      frame.hidden = true;
      video.hidden = true;
      clear(out);
    });

    function cameraRefused() {
      stopCamera();
      frame.hidden = true;
      clear(out).appendChild(note('The camera did not start — it may be blocked here. Tap “Take a photo of the barcode” instead; that always works.', 'error'));
    }

    var photo = el('input', { type: 'file', accept: 'image/*', capture: 'environment', class: 'hub-file', id: 'hub-barcode-photo' });
    photo.addEventListener('change', function () {
      var file = photo.files && photo.files[0];
      if (!file) return;
      stopCamera();
      frame.hidden = true;
      clear(out).appendChild(note('Reading the barcode in your photo…'));
      readBarcodePhoto(file).then(function (value) {
        if (value) lookup(value);
        else clear(out).appendChild(note('Could not read a barcode in that photo. Try again in good light, with the barcode filling about half the picture and no shine on it — or type the numbers below.', 'error'));
      }).catch(function () {
        clear(out).appendChild(note('Could not read that photo. Type the numbers under the barcode instead.', 'error'));
      }).then(function () { photo.value = ''; });
    });

    look.addEventListener('click', function () { lookup(code.value); });
    code.addEventListener('keydown', function (e) { if (e.key === 'Enter') lookup(code.value); });

    body.appendChild(el('div', { class: 'hub-big-actions' }, [
      camBtn,
      photo,
      el('label', { class: 'hub-big-btn', for: 'hub-barcode-photo' }, [
        el('span', { class: 'hub-big-icon', 'aria-hidden': 'true', text: '\u{1F5BC}️' }),
        el('span', { class: 'hub-big-label', text: 'Take a photo of the barcode' }),
        el('span', { class: 'hub-big-sub', text: 'Works on every phone' })
      ])
    ]));
    body.appendChild(frame);
    body.appendChild(el('label', { class: 'hub-label', for: 'hub-scan-code', text: 'Or type the numbers under the barcode' }));
    body.appendChild(el('div', { class: 'hub-row hub-add-row' }, [code, look]));
    body.appendChild(out);
    if (scan.last) paintProduct(out, scan.last);

    var recent = store('scans') || [];
    if (recent.length) {
      body.appendChild(el('h2', { class: 'strip-title', text: 'You checked recently' }));
      body.appendChild(el('div', { class: 'hub-row' }, recent.map(function (p) {
        return el('button', { class: 'quiet', type: 'button', on: { click: function () { lookup(p.code); } } }, [
          p.verdict ? el('span', { 'aria-hidden': 'true', text: VERDICT_ICON[p.verdict] + ' ' }) : null,
          p.name + (p.brand ? ' (' + p.brand + ')' : '')
        ]);
      })));
    }
    body.appendChild(el('p', { class: 'fine hub-foot' }, ['Product information from ', el('a', { href: 'https://world.openfoodfacts.org/', target: '_blank', rel: 'noopener noreferrer', text: 'Open Food Facts' }), ', written by volunteers. This is a guide, not medical advice — if you have an allergy, always read the packet.']));
  }

  function paintProduct(out, p) {
    var h = p.health || { verdict: 'unknown', title: 'Not enough information to judge', summary: '', lights: [], goods: [] };
    var rules = M.effectiveRules();
    var clashes = p.contains.filter(function (t) { return rules.indexOf(t) !== -1; });

    var verdict = el('div', { class: 'hub-health is-' + h.verdict }, [
      el('div', { class: 'hub-health-score' }, [
        el('span', { class: 'hub-health-num', text: h.score !== null && h.score !== undefined ? String(h.score) : '?' }),
        el('span', { class: 'hub-health-of', text: 'out of 100' })
      ]),
      el('div', { class: 'hub-health-text' }, [
        el('p', { class: 'hub-health-title', text: VERDICT_ICON[h.verdict] + ' ' + h.title }),
        h.summary ? el('p', { class: 'hub-health-summary', text: h.summary }) : null
      ])
    ]);

    var rulesCard;
    if (clashes.length) rulesCard = el('p', { class: 'hub-verdict is-bad', text: '⚠ This has ' + clashes.map(function (t) { return TAG_WORDS[t] || t; }).join(' and ') + ' in it — which you have said you do not eat.' });
    else if (!p.ingredientsKnown) rulesCard = el('p', { class: 'hub-verdict is-unknown', text: 'There is no ingredient list on record, so we cannot check it for things you do not eat. Read the packet.' });
    else if (rules.length) rulesCard = el('p', { class: 'hub-verdict is-good', text: '✓ Nothing in it that you have said you do not eat (going by its ingredient list).' });
    else rulesCard = el('p', { class: 'hub-verdict is-unknown', text: 'Tip: tell the app what you do not eat (in Profile) and it will warn you here.' });

    var lights = (h.lights || []).map(function (l) {
      return el('li', { class: 'hub-light is-' + l.level }, [
        el('span', { class: 'hub-light-dot', 'aria-hidden': 'true' }),
        el('span', { class: 'hub-light-name', text: l.label }),
        el('span', { class: 'hub-light-level', text: LEVEL_WORD[l.level] }),
        el('span', { class: 'hub-light-plain', text: l.plain })
      ]);
    });

    var per = p.per100g || {};
    var rows = [['Energy', per.kcal, 'kcal'], ['Fat', per.fat, 'g'], ['of which saturates', per.saturates, 'g'], ['Carbohydrate', per.carbs, 'g'], ['of which sugars', per.sugars, 'g'], ['Fibre', per.fibre, 'g'], ['Protein', per.protein, 'g'], ['Salt', per.salt, 'g']].filter(function (r) { return r[1] !== null && r[1] !== undefined; });
    var gradeText = h.grade ? 'The Nutri-Score is ' + h.grade + ' — the grade printed on many packets, from A (best) to E (least healthy).' : '';

    out.appendChild(el('article', { class: 'hub-product' }, [
      el('div', { class: 'hub-product-head' }, [
        p.image ? el('img', { class: 'hub-product-img', src: p.image, alt: '', referrerPolicy: 'no-referrer' }) : null,
        el('div', {}, [
          el('h2', { class: 'hub-recipe-name', text: p.name }),
          el('p', { class: 'fine', text: [p.brand, p.quantity].filter(Boolean).join(' · ') })
        ])
      ]),
      verdict,
      rulesCard,
      lights.length ? el('h3', { class: 'strip-title', text: 'What is in it (traffic lights, like on the packet)' }) : null,
      lights.length ? el('ul', { class: 'hub-lights' }, lights) : null,
      h.goods && h.goods.length ? el('p', { class: 'hub-good-line', text: '\u{1F44D} Good news: it is ' + h.goods.join(' and ') + '.' }) : null,
      h.processing ? el('p', { class: 'hub-processing' }, [el('strong', { text: 'How processed is it? ' }), h.processing]) : null,
      gradeText ? el('p', { class: 'fine', text: gradeText }) : null,
      rows.length ? el('details', { class: 'hub-details' }, [el('summary', { text: 'All the numbers (per ' + (h.per || '100 g') + ')' }), el('table', { class: 'hub-table' }, rows.map(function (r) {
        return el('tr', {}, [el('th', { scope: 'row', text: r[0] }), el('td', { text: r[1] + ' ' + r[2] })]);
      }))]) : null,
      p.ingredients ? el('details', { class: 'hub-details' }, [el('summary', { text: 'Ingredients' }), el('p', { class: 'fine', text: p.ingredients })]) : null,
      p.traces.length ? el('p', { class: 'fine', text: 'May contain traces of: ' + p.traces.join(', ') + '.' }) : null,
      el('button', { class: 'go go-sm', type: 'button', on: { click: function () { scan.last = null; renderScanView(); try { window.scrollTo(0, 0); } catch (err) {} } } }, [el('span', { class: 'go-label', text: 'Check another product' })])
    ]));
  }

  /* ------------------------------------------------------ fridge (P) -- */

  function shrinkPhoto(file, maxSide) {
    return new Promise(function (resolve, reject) {
      var url = URL.createObjectURL(file);
      var img = new Image();
      img.onload = function () {
        var max = maxSide || 1024;
        var scale = Math.min(1, max / Math.max(img.width, img.height));
        var canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        var data = canvas.toDataURL('image/jpeg', 0.8);
        resolve({ preview: data, base64: data.split(',')[1], mime: 'image/jpeg' });
      };
      img.onerror = function () { URL.revokeObjectURL(url); reject(new Error('bad image')); };
      img.src = url;
    });
  }

  function renderFridge(body) {
    if (!plus()) {
      body.appendChild(premiumCard('Dinner from a photo of your fridge',
        'Take a photo of the fridge, the cupboard or what is on the worktop. It works out what is there and which dishes you can make with it — and what, if anything, you would still need.',
        ['Only dishes that keep your food rules', 'What each one uses from the photo, and what is missing', 'Tap one for the recipe, or put it straight in your calendar', 'The photo is not stored anywhere']));
      return;
    }
    var input = el('input', { type: 'file', accept: 'image/*', capture: 'environment', class: 'hub-file', id: 'hub-fridge-file' });
    var label = el('label', { class: 'go hub-file-label', for: 'hub-fridge-file' }, [el('span', { class: 'go-label', text: '\u{1F4F8} Take or choose a photo' })]);
    var preview = el('img', { class: 'hub-fridge-preview', alt: 'Your photo', hidden: true });
    var out = el('div', { 'aria-live': 'polite' });
    input.addEventListener('change', function () {
      var file = input.files && input.files[0];
      if (!file) return;
      clear(out).appendChild(note('Looking in your fridge…'));
      shrinkPhoto(file).then(function (photo) {
        preview.src = photo.preview;
        preview.hidden = false;
        return api('/api/fridge', { method: 'POST', body: { image: photo.base64, mime: photo.mime, rules: M.effectiveRules() } });
      }).then(function (res) {
        clear(out);
        if (!res.seen.length) { out.appendChild(note('No food in that photo that the AI could make out. Try one with the fridge door open and the light on.')); return; }
        out.appendChild(el('p', {}, [el('strong', { text: 'I can see: ' }), res.seen.join(', ')]));
        if (!res.dishes.length) { out.appendChild(note('Nothing on the menu fits what is there and your food rules. Try adding the cupboard.')); return; }
        out.appendChild(el('ul', { class: 'hub-fridge' }, res.dishes.map(function (d) {
          return el('li', { class: 'hub-fridge-dish' }, [
            el('button', { class: 'hub-menu-item', type: 'button', on: { click: function () { M.openDish(d.name); } } }, [
              el('span', { class: 'hub-menu-name', text: d.icon + ' ' + d.name }),
              el('span', { class: 'hub-from', text: d.why })
            ]),
            d.uses.length ? el('p', { class: 'fine', text: 'Uses: ' + d.uses.join(', ') }) : null,
            el('p', { class: 'fine', text: d.missing.length ? 'Still need: ' + d.missing.join(', ') : 'Nothing else to buy.' })
          ]);
        })));
        Sound.win();
      }).catch(function (err) { clear(out).appendChild(note(err && err.code ? errorText(err) : ERRORS.bad_image, 'error')); });
    });
    body.appendChild(howTo([
      'Open the fridge (or the cupboard) so the food is easy to see.',
      'Tap \u201CTake or choose a photo\u201D and take a picture.',
      'In about ten seconds you will see what is there and the dishes you can make with it.'
    ]));
    body.appendChild(el('div', { class: 'hub-row' }, [input, label]));
    body.appendChild(preview);
    body.appendChild(out);
    body.appendChild(el('p', { class: 'fine hub-foot', text: 'The photo is shrunk on your device, looked at once by the AI to list the food in it, and not kept — not by us, not in a log.' }));
  }

  /* --------------------------------------- timers & converter (account) -- */

  var timers = { list: store('timers') || [], ticker: null };

  function saveTimers() { store('timers', timers.list); }

  function fmt(ms) {
    var s = Math.max(0, Math.round(ms / 1000));
    var h = Math.floor(s / 3600);
    var m = Math.floor((s % 3600) / 60);
    var sec = s % 60;
    return (h ? h + ':' + pad(m) : m) + ':' + pad(sec);
  }

  function remaining(t) { return t.paused ? t.left : t.ends - Date.now(); }

  // Runs whatever section is open, so a timer set in the Kitchen still goes
  // off while you are reading a recipe in Dishes.
  function tickTimers() {
    var now = Date.now();
    var changed = false;
    timers.list.forEach(function (t) {
      if (!t.paused && !t.done && t.ends <= now) {
        t.done = true;
        changed = true;
        Sound.win();
        M.toast('⏰', t.name + ' is done', 'Your ' + fmt(t.total) + ' timer just finished.');
        try { if (navigator.vibrate) navigator.vibrate([300, 150, 300]); } catch (err) {}
      }
    });
    if (changed) saveTimers();
    if (M.currentView() === 'kitchen' && kitchen.tab === 'timers') {
      M.$$('.hub-timer').forEach(function (row) {
        var t = timers.list.filter(function (x) { return x.id === row.dataset.id; })[0];
        if (!t) return;
        row.querySelector('.hub-timer-clock').textContent = t.done ? 'Done' : fmt(remaining(t));
        row.classList.toggle('is-done', !!t.done);
      });
      if (changed) renderKitchen();
    }
    var running = timers.list.some(function (t) { return !t.paused && !t.done; });
    if (!running && timers.ticker) { clearInterval(timers.ticker); timers.ticker = null; }
  }

  function ensureTicker() {
    if (!timers.ticker && timers.list.some(function (t) { return !t.paused && !t.done; })) timers.ticker = setInterval(tickTimers, 500);
  }

  function addTimer(name, minutes) {
    var ms = Math.round(minutes * 60000);
    if (!(ms > 0)) return;
    timers.list.push({ id: String(Date.now()) + Math.random().toString(36).slice(2, 6), name: name || 'Timer', total: ms, ends: Date.now() + ms, paused: false, left: 0, done: false });
    timers.list = timers.list.slice(-8);
    saveTimers();
    ensureTicker();
  }

  var CONVERT = {
    weight: { label: 'Weight', units: { g: 1, kg: 1000, oz: 28.3495, lb: 453.592 } },
    volume: { label: 'Volume', units: { ml: 1, l: 1000, tsp: 4.92892, tbsp: 14.7868, 'cup (US)': 236.588, 'fl oz': 29.5735, 'pint (UK)': 568.261, 'pint (US)': 473.176 } }
  };
  var CUP_GRAMS = { 'plain flour': 125, 'self-raising flour': 125, 'caster sugar': 200, 'granulated sugar': 200, 'brown sugar': 220, 'icing sugar': 120, butter: 227, 'rice (uncooked)': 185, 'rolled oats': 90, 'cocoa powder': 85, honey: 340, milk: 245, water: 240, 'grated cheese': 100, 'ground almonds': 96, 'chocolate chips': 170 };
  var GAS = [[1, 140], [2, 150], [3, 170], [4, 180], [5, 190], [6, 200], [7, 220], [8, 230], [9, 240]];

  function renderTimers(body) {
    if (!signedIn()) {
      body.appendChild(signInCard('Kitchen timers and converter',
        'Run several named timers at once — rice, oven, eggs — that keep going while you use the rest of the app, plus a converter for cups, ounces, grams, °F and gas marks.', 'kitchen'));
      return;
    }
    var name = el('input', { class: 'hub-input', type: 'text', maxlength: '30', placeholder: 'What for? (rice, oven…)', 'aria-label': 'Timer name' });
    var mins = el('input', { class: 'hub-input hub-num', type: 'number', min: '0', max: '600', step: '0.5', value: '10', 'aria-label': 'Minutes' });
    var start = el('button', { class: 'go go-sm', type: 'button' }, [el('span', { class: 'go-label', text: 'Start' })]);
    start.addEventListener('click', function () { addTimer(name.value.trim(), Number(mins.value)); Sound.tick(); renderKitchen(); });
    body.appendChild(el('h2', { class: 'strip-title', text: 'Timers' }));
    body.appendChild(el('div', { class: 'hub-row' }, [name, el('label', { class: 'hub-target' }, [mins, ' min']), start]));
    body.appendChild(el('div', { class: 'hub-row' }, [1, 3, 5, 8, 10, 12, 15, 20, 30, 45, 60].map(function (m) {
      return el('button', { class: 'hub-pill', type: 'button', text: m + ' min', on: { click: function () { addTimer(name.value.trim() || m + ' minutes', m); Sound.tick(); renderKitchen(); } } });
    })));
    var list = el('ul', { class: 'hub-timers' });
    timers.list.forEach(function (t) {
      list.appendChild(el('li', { class: 'hub-timer' + (t.done ? ' is-done' : ''), dataset: { id: t.id } }, [
        el('span', { class: 'hub-timer-name', text: t.name }),
        el('span', { class: 'hub-timer-clock', text: t.done ? 'Done' : fmt(remaining(t)) }),
        t.done ? null : el('button', { class: 'quiet', type: 'button', text: t.paused ? 'Resume' : 'Pause', on: { click: function () {
          if (t.paused) { t.ends = Date.now() + t.left; t.paused = false; } else { t.left = t.ends - Date.now(); t.paused = true; }
          saveTimers(); ensureTicker(); renderKitchen();
        } } }),
        el('button', { class: 'quiet', type: 'button', text: t.done ? 'Clear' : 'Cancel', on: { click: function () {
          timers.list = timers.list.filter(function (x) { return x !== t; });
          saveTimers(); renderKitchen();
        } } })
      ]));
    });
    if (timers.list.length) body.appendChild(list);
    else body.appendChild(note('No timers running. They keep going and ring wherever you are in the app.'));

    body.appendChild(el('h2', { class: 'strip-title', text: 'Converter' }));
    Object.keys(CONVERT).forEach(function (kind) {
      var c = CONVERT[kind];
      var amount = el('input', { class: 'hub-input hub-num', type: 'number', value: kind === 'weight' ? '100' : '250', step: 'any', 'aria-label': c.label + ' amount' });
      var from = el('select', { class: 'hub-select', 'aria-label': 'From' }, Object.keys(c.units).map(function (u) { return el('option', { value: u, text: u }); }));
      var result = el('p', { class: 'hub-convert-out' });
      function paint() {
        var base = (Number(amount.value) || 0) * c.units[from.value];
        result.textContent = Object.keys(c.units).filter(function (u) { return u !== from.value; }).map(function (u) {
          var v = base / c.units[u];
          return (v >= 100 ? Math.round(v) : Math.round(v * 100) / 100) + ' ' + u;
        }).join('  ·  ');
      }
      amount.addEventListener('input', paint);
      from.addEventListener('change', paint);
      paint();
      body.appendChild(el('div', { class: 'hub-convert' }, [el('p', { class: 'hub-label', text: c.label }), el('div', { class: 'hub-row' }, [amount, from]), result]));
    });

    var temp = el('input', { class: 'hub-input hub-num', type: 'number', value: '180', 'aria-label': 'Temperature' });
    var tUnit = el('select', { class: 'hub-select', 'aria-label': 'Unit' }, [el('option', { value: 'c', text: '°C' }), el('option', { value: 'f', text: '°F' }), el('option', { value: 'gas', text: 'Gas mark' })]);
    var tOut = el('p', { class: 'hub-convert-out' });
    function paintTemp() {
      var v = Number(temp.value) || 0;
      var c = tUnit.value === 'c' ? v : tUnit.value === 'f' ? (v - 32) * 5 / 9 : (GAS.filter(function (g) { return g[0] === Math.round(v); })[0] || [0, 0])[1];
      var gas = GAS.reduce(function (best, g) { return Math.abs(g[1] - c) < Math.abs(best[1] - c) ? g : best; }, GAS[0]);
      tOut.textContent = Math.round(c) + ' °C  ·  ' + Math.round(c * 9 / 5 + 32) + ' °F  ·  gas ' + gas[0] + '  ·  fan ' + Math.round(c - 20) + ' °C';
    }
    temp.addEventListener('input', paintTemp);
    tUnit.addEventListener('change', paintTemp);
    paintTemp();
    body.appendChild(el('div', { class: 'hub-convert' }, [el('p', { class: 'hub-label', text: 'Oven' }), el('div', { class: 'hub-row' }, [temp, tUnit]), tOut]));

    var cups = el('input', { class: 'hub-input hub-num', type: 'number', value: '1', step: 'any', 'aria-label': 'Cups' });
    var what = el('select', { class: 'hub-select', 'aria-label': 'Ingredient' }, Object.keys(CUP_GRAMS).map(function (k) { return el('option', { value: k, text: k }); }));
    var cOut = el('p', { class: 'hub-convert-out' });
    function paintCups() { cOut.textContent = (Number(cups.value) || 0) + ' cup of ' + what.value + ' ≈ ' + Math.round((Number(cups.value) || 0) * CUP_GRAMS[what.value]) + ' g'; }
    cups.addEventListener('input', paintCups);
    what.addEventListener('change', paintCups);
    paintCups();
    body.appendChild(el('div', { class: 'hub-convert' }, [el('p', { class: 'hub-label', text: 'Cups to grams (American recipes)' }), el('div', { class: 'hub-row' }, [cups, el('span', { text: 'cup of' }), what]), cOut]));
  }

  /* ------------------------------------------------ in season (account) -- */

  // What is good in a temperate northern-hemisphere kitchen (UK, northern
  // Europe, most of the US), month by month. South of the equator the
  // months turn round by half a year.
  var SEASON = [
    ['Leeks', 'Kale', 'Cabbage', 'Parsnips', 'Swede', 'Celeriac', 'Brussels sprouts', 'Cauliflower', 'Blood oranges', 'Clementines', 'Lemons', 'Forced rhubarb', 'Pears', 'Mussels'],
    ['Leeks', 'Kale', 'Cauliflower', 'Parsnips', 'Purple sprouting broccoli', 'Forced rhubarb', 'Blood oranges', 'Lemons', 'Celeriac', 'Chicory', 'Swede', 'Mussels'],
    ['Purple sprouting broccoli', 'Spring greens', 'Wild garlic', 'Leeks', 'Rhubarb', 'Cauliflower', 'Spinach', 'Radishes', 'Kale', 'Chicory'],
    ['Asparagus', 'Wild garlic', 'Spring onions', 'Radishes', 'Spinach', 'Rhubarb', 'Purple sprouting broccoli', 'Watercress', 'Morels', 'Lamb'],
    ['Asparagus', 'New potatoes', 'Peas', 'Broad beans', 'Radishes', 'Spring onions', 'Lettuce', 'Rhubarb', 'Strawberries', 'Watercress', 'Crab'],
    ['Strawberries', 'Cherries', 'Broad beans', 'Peas', 'Courgettes', 'New potatoes', 'Lettuce', 'Asparagus', 'Gooseberries', 'Elderflower', 'Beetroot', 'Mackerel'],
    ['Tomatoes', 'Courgettes', 'Raspberries', 'Blueberries', 'Cherries', 'Peas', 'Green beans', 'Cucumber', 'Fennel', 'Beetroot', 'Apricots', 'Peaches', 'Sweetcorn'],
    ['Tomatoes', 'Sweetcorn', 'Aubergine', 'Peppers', 'Courgettes', 'Plums', 'Blackberries', 'Peaches', 'Nectarines', 'Runner beans', 'Cucumber', 'Watermelon'],
    ['Apples', 'Pears', 'Plums', 'Blackberries', 'Sweetcorn', 'Tomatoes', 'Squash', 'Figs', 'Peppers', 'Aubergine', 'Mushrooms', 'Grapes'],
    ['Pumpkin', 'Squash', 'Apples', 'Pears', 'Mushrooms', 'Kale', 'Beetroot', 'Parsnips', 'Celeriac', 'Chestnuts', 'Quince', 'Leeks'],
    ['Pumpkin', 'Squash', 'Parsnips', 'Brussels sprouts', 'Kale', 'Celeriac', 'Leeks', 'Cranberries', 'Pomegranate', 'Chestnuts', 'Pears', 'Clementines'],
    ['Brussels sprouts', 'Parsnips', 'Chestnuts', 'Cranberries', 'Clementines', 'Red cabbage', 'Kale', 'Leeks', 'Celeriac', 'Pomegranate', 'Turnips', 'Oysters']
  ];
  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  var PRODUCE_EMOJI = { Leeks: '\u{1F96C}', Kale: '\u{1F96C}', Cabbage: '\u{1F96C}', 'Red cabbage': '\u{1F96C}', 'Spring greens': '\u{1F96C}', Spinach: '\u{1F96C}', Lettuce: '\u{1F96C}', Watercress: '\u{1F33F}', 'Wild garlic': '\u{1F33F}', Elderflower: '\u{1F33C}', Parsnips: '\u{1F955}', Swede: '\u{1F954}', Turnips: '\u{1F954}', Celeriac: '\u{1F954}', 'New potatoes': '\u{1F954}', 'Brussels sprouts': '\u{1F966}', Cauliflower: '\u{1F966}', 'Purple sprouting broccoli': '\u{1F966}', 'Blood oranges': '\u{1F34A}', Clementines: '\u{1F34A}', Lemons: '\u{1F34B}', 'Forced rhubarb': '\u{1F33F}', Rhubarb: '\u{1F33F}', Pears: '\u{1F350}', Apples: '\u{1F34E}', Mussels: '\u{1F9AA}', Oysters: '\u{1F9AA}', Crab: '\u{1F980}', Mackerel: '\u{1F41F}', Lamb: '\u{1F411}', Chicory: '\u{1F96C}', Radishes: '\u{1F955}', 'Spring onions': '\u{1F9C5}', Asparagus: '\u{1F33F}', Morels: '\u{1F344}', Mushrooms: '\u{1F344}', Peas: '\u{1FADB}', 'Broad beans': '\u{1FADB}', 'Green beans': '\u{1FADB}', 'Runner beans': '\u{1FADB}', Strawberries: '\u{1F353}', Cherries: '\u{1F352}', Courgettes: '\u{1F952}', Cucumber: '\u{1F952}', Gooseberries: '\u{1F347}', Grapes: '\u{1F347}', Beetroot: '\u{1F955}', Tomatoes: '\u{1F345}', Raspberries: '\u{1F353}', Blueberries: '\u{1FAD0}', Fennel: '\u{1F33F}', Apricots: '\u{1F351}', Peaches: '\u{1F351}', Nectarines: '\u{1F351}', Sweetcorn: '\u{1F33D}', Aubergine: '\u{1F346}', Peppers: '\u{1FAD1}', Plums: '\u{1F351}', Blackberries: '\u{1FAD0}', Watermelon: '\u{1F349}', Squash: '\u{1F383}', Pumpkin: '\u{1F383}', Figs: '\u{1F347}', Chestnuts: '\u{1F330}', Quince: '\u{1F350}', Cranberries: '\u{1F352}', Pomegranate: '\u{1F34E}' };
  // What to look for in an ingredient list, where the name alone would miss it.
  var PRODUCE_MATCH = {
    'Brussels sprouts': /sprout/i, 'Purple sprouting broccoli': /broccoli/i, Swede: /swede|rutabaga/i, 'Spring greens': /greens|cabbage/i,
    Courgettes: /courgette|zucchini/i, Aubergine: /aubergine|eggplant/i, Peppers: /bell pepper|red pepper|green pepper|yellow pepper|peppers\b|capsicum/i,
    Sweetcorn: /sweetcorn|corn kernel|corn on the cob|\bcorn\b/i, Squash: /squash|butternut/i, Pumpkin: /pumpkin|squash/i, 'Forced rhubarb': /rhubarb/i,
    'New potatoes': /potato/i, 'Blood oranges': /orange/i, Clementines: /clementine|satsuma|mandarin|orange/i, 'Red cabbage': /cabbage/i,
    'Wild garlic': /wild garlic|garlic/i, 'Spring onions': /spring onion|scallion|green onion/i, 'Broad beans': /broad bean|fava/i,
    'Green beans': /green bean|french bean/i, 'Runner beans': /runner bean|green bean/i, Morels: /mushroom/i, Mushrooms: /mushroom/i,
    Peas: /\bpeas?\b/i, Lamb: /\blamb\b/i, Mackerel: /mackerel/i, Crab: /\bcrab\b/i, Mussels: /mussel/i, Oysters: /oyster/i
  };

  function dishesUsing(produce) {
    var re = PRODUCE_MATCH[produce] || new RegExp(produce.replace(/(es|s)$/, '').replace(/[^a-z ]/gi, ''), 'i');
    return allowedFood().filter(function (d) {
      if (re.test(d.name) || re.test(d.blurb || '')) return true;
      return (Recipes.forDish(d.name) || []).some(function (r) { return r.ingredients.some(function (l) { return re.test(l); }); });
    }).slice(0, 12);
  }

  function renderSeason(body) {
    if (!signedIn()) {
      body.appendChild(signInCard('What is in season',
        'What is at its best this month where you are, and the dishes in the catalogue that use it — so you cook what is cheap, ripe and good right now.', 'kitchen'));
      return;
    }
    var south = !!store('season-south');
    var month = typeof kitchen.month === 'number' ? kitchen.month : new Date().getMonth();
    var index = south ? (month + 6) % 12 : month;
    var monthSel = el('select', { class: 'hub-select', 'aria-label': 'Month' }, MONTHS.map(function (m, i) { return el('option', { value: String(i), text: m }); }));
    monthSel.value = String(month);
    monthSel.addEventListener('change', function () { kitchen.month = Number(monthSel.value); kitchen.produce = null; renderKitchen(); });
    var hemi = el('label', { class: 'hub-toggle' }, [el('input', { type: 'checkbox', checked: south, on: { change: function (e) { store('season-south', e.target.checked); kitchen.produce = null; renderKitchen(); } } }), ' Southern hemisphere']);
    body.appendChild(el('div', { class: 'hub-row' }, [monthSel, hemi]));
    body.appendChild(el('p', { class: 'hub-week-title', text: 'At its best in ' + MONTHS[month] }));
    var grid = el('div', { class: 'hub-pills hub-season' }, SEASON[index].map(function (p) {
      var on = kitchen.produce === p;
      return el('button', { class: 'hub-pill' + (on ? ' is-on' : ''), type: 'button', 'aria-pressed': on ? 'true' : 'false', on: { click: function () { kitchen.produce = on ? null : p; renderKitchen(); } } }, [
        el('span', { 'aria-hidden': 'true', text: (PRODUCE_EMOJI[p] || '\u{1F33F}') + ' ' }), p
      ]);
    }));
    body.appendChild(grid);
    if (kitchen.produce) {
      var found = dishesUsing(kitchen.produce);
      body.appendChild(el('h2', { class: 'strip-title', text: 'Cook with ' + kitchen.produce.toLowerCase() }));
      if (!found.length) body.appendChild(note('Nothing in the catalogue uses it by name — a good excuse to try something new.'));
      else body.appendChild(el('ul', { class: 'hub-cards' }, found.map(function (d) {
        return el('li', {}, [el('button', { class: 'hub-card', type: 'button', on: { click: function () { M.openDish(d.name); } } }, [
          el('span', { class: 'hub-card-img is-blank', 'aria-hidden': 'true', text: d.icon }),
          el('span', { class: 'hub-card-name', text: d.name }),
          el('span', { class: 'hub-from', text: d.blurb })
        ])]);
      })));
    } else {
      body.appendChild(note('Tap something to see the dishes that use it.'));
    }
    body.appendChild(el('p', { class: 'fine hub-foot', text: 'For a temperate climate — the UK, northern Europe and most of the US. Further south it starts sooner and runs longer.' }));
  }

  /* ====================================================================
   * NEWS: TODAY'S BRIEFING (P)
   * ==================================================================== */

  var briefing = { data: null, loading: false, error: '' };

  function utcDay() { return new Date().toISOString().slice(0, 10); }

  function renderBriefing() {
    var view = M.$('view-news');
    if (!view) return;
    var box = M.$('hub-briefing');
    if (!box) {
      box = el('section', { id: 'hub-briefing', class: 'hub-briefing', 'aria-label': 'Today’s food briefing' });
      var headEl = view.querySelector('.head');
      if (headEl && headEl.nextSibling) view.insertBefore(box, headEl.nextSibling);
      else view.appendChild(box);
    }
    clear(box);
    if (!plus()) {
      box.classList.add('is-teaser');
      box.appendChild(el('p', { class: 'hub-gate-tier', text: 'Premium' }));
      box.appendChild(el('p', { class: 'hub-briefing-title', text: 'Today’s food news in a minute' }));
      box.appendChild(el('p', { class: 'fine', text: 'The five stories worth knowing from everything below, in plain words with a link to each, and one thing to cook today because of them.' }));
      box.appendChild(el('button', { class: 'quiet', type: 'button', text: 'Get the daily briefing', on: { click: function () { M.goPremium('The daily food briefing'); } } }));
      return;
    }
    box.classList.remove('is-teaser');
    if (briefing.data && briefing.data.day === utcDay()) return paintBriefing(box, briefing.data);
    if (briefing.error) {
      box.appendChild(el('p', { class: 'hub-note is-error' }, [briefing.error + ' ', el('button', { class: 'link-btn', type: 'button', text: 'Try again', on: { click: function () { briefing.error = ''; renderBriefing(); } } })]));
      return;
    }
    box.appendChild(el('p', { class: 'hub-briefing-title', text: 'Today’s briefing' }));
    box.appendChild(note('Reading this morning’s food news…'));
    if (briefing.loading) return;
    briefing.loading = true;
    api('/api/briefing').then(function (res) {
      briefing.loading = false;
      briefing.data = res.briefing;
      if (M.currentView() === 'news') renderBriefing();
    }).catch(function (err) {
      briefing.loading = false;
      briefing.error = errorText(err);
      if (M.currentView() === 'news') renderBriefing();
    });
  }

  function paintBriefing(box, b) {
    box.appendChild(el('p', { class: 'hub-gate-tier', text: 'Today’s briefing' }));
    box.appendChild(el('p', { class: 'hub-briefing-title', text: b.headline }));
    box.appendChild(el('ol', { class: 'hub-briefing-list' }, b.items.map(function (it) {
      return el('li', {}, [
        el('span', { text: it.text + ' ' }),
        el('a', { href: it.link, target: '_blank', rel: 'noopener noreferrer', class: 'hub-from', text: it.source + ' ↗' })
      ]);
    })));
    if (b.cook) {
      box.appendChild(el('button', { class: 'hub-menu-item', type: 'button', on: { click: function () { M.openDish(b.cook.name); } } }, [
        el('span', { class: 'hub-menu-course', text: 'Cook today' }),
        el('span', { class: 'hub-menu-name', text: b.cook.icon + ' ' + b.cook.name }),
        el('span', { class: 'hub-from', text: b.cook.why })
      ]));
    }
    box.appendChild(el('p', { class: 'fine', text: 'Summarised by AI from the stories below; each one links to the publisher’s own article.' }));
  }

  /* ====================================================================
   * COOK MODE: HANDS-FREE (P)
   * ==================================================================== */

  var voice = { on: false, rec: null, observer: null, btn: null, status: null };
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition;

  function stepText() {
    var kind = (M.$('cook-kind') || {}).textContent || '';
    var step = (M.$('cook-step') || {}).textContent || '';
    var list = M.$('cook-why');
    var items = list && !list.hidden ? Array.prototype.map.call(list.querySelectorAll('li'), function (li) { return li.textContent; }) : [];
    return kind + '. ' + step + (items.length ? ' ' + items.join(', ') + '.' : '');
  }

  function speak(text) {
    if (!('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.rate = 0.98;
      window.speechSynthesis.speak(u);
    } catch (err) {}
  }

  function click(id) {
    var b = M.$(id);
    if (b && !b.disabled && !b.hidden && b.offsetParent !== null) b.click();
  }

  function heard(raw) {
    var t = String(raw || '').toLowerCase();
    if (/\b(stop listening|hands off|voice off)\b/.test(t)) return stopVoice();
    if (/\b(repeat|again|say that again|pardon|what was that)\b/.test(t)) return speak(stepText());
    if (/\b(pause|stop) (the )?timer\b/.test(t)) {
      var btn = M.$('cook-timer-btn');
      if (btn && /pause/i.test(btn.textContent)) btn.click();
      return;
    }
    if (/\b(start|set|begin)\b.*\btimer\b|\btimer\b/.test(t)) return click('cook-timer-btn');
    if (/\b(back|previous|go back|last step)\b/.test(t)) return click('cook-prev');
    if (/\b(next|continue|done|go on|carry on|okay next|finished)\b/.test(t)) return click('cook-next');
  }

  function setVoiceStatus(text) {
    if (voice.status) { voice.status.textContent = text; voice.status.hidden = !text; }
  }

  function startVoice() {
    if (!plus()) { M.goPremium('Hands-free cook mode'); return; }
    voice.on = true;
    voice.btn.classList.add('is-on');
    voice.btn.setAttribute('aria-pressed', 'true');
    speak(stepText());
    var stage = M.$('cook-step');
    if (stage && 'MutationObserver' in window) {
      voice.observer = new MutationObserver(function () { if (voice.on) speak(stepText()); });
      voice.observer.observe(stage, { childList: true, characterData: true, subtree: true });
    }
    if (!SR) {
      setVoiceStatus('Reading the steps aloud. This browser cannot take voice commands — tap Next as usual.');
      return;
    }
    try {
      voice.rec = new SR();
      voice.rec.continuous = true;
      voice.rec.interimResults = false;
      voice.rec.lang = navigator.language || 'en-GB';
      voice.rec.onresult = function (e) {
        var last = e.results[e.results.length - 1];
        if (last && last[0]) heard(last[0].transcript);
      };
      voice.rec.onerror = function (e) {
        if (e && (e.error === 'not-allowed' || e.error === 'service-not-allowed')) {
          setVoiceStatus('The microphone is blocked, so it is reading the steps aloud only. Allow the microphone to talk back.');
          voice.rec = null;
        }
      };
      // Recognition stops itself after a pause; while hands-free is on, it
      // starts listening again.
      voice.rec.onend = function () {
        var dialog = M.$('cook-mode');
        if (voice.on && voice.rec && dialog && dialog.open) { try { voice.rec.start(); } catch (err) {} }
      };
      voice.rec.start();
      setVoiceStatus('Listening — say “next”, “back”, “repeat” or “start timer”.');
    } catch (err) {
      setVoiceStatus('Reading the steps aloud. Voice commands are not available here.');
    }
  }

  function stopVoice() {
    voice.on = false;
    if (voice.btn) { voice.btn.classList.remove('is-on'); voice.btn.setAttribute('aria-pressed', 'false'); }
    if (voice.rec) { var r = voice.rec; voice.rec = null; try { r.stop(); } catch (err) {} }
    if (voice.observer) { voice.observer.disconnect(); voice.observer = null; }
    try { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); } catch (err) {}
    setVoiceStatus('');
  }

  function setupVoice() {
    var dialog = M.$('cook-mode');
    if (!dialog || M.$('hub-voice')) return;
    var bar = dialog.querySelector('.cook-bar');
    voice.btn = el('button', { id: 'hub-voice', class: 'quiet hub-voice-btn', type: 'button', 'aria-pressed': 'false', title: 'Hands-free: steps read aloud, voice commands' }, [
      '\u{1F399}️ Hands-free', plus() ? null : el('span', { class: 'tag-premium', text: 'Premium' })
    ]);
    voice.btn.addEventListener('click', function () { if (voice.on) stopVoice(); else startVoice(); });
    voice.status = el('p', { class: 'fine hub-voice-status', hidden: true, 'aria-live': 'polite' });
    if (bar) { bar.appendChild(voice.btn); bar.parentNode.insertBefore(voice.status, bar.nextSibling); }
    dialog.addEventListener('close', stopVoice);
  }

  function refreshVoiceTag() {
    if (!voice.btn) return;
    var tag = voice.btn.querySelector('.tag-premium');
    if (plus() && tag) tag.remove();
    if (!plus() && !tag) voice.btn.appendChild(el('span', { class: 'tag-premium', text: 'Premium' }));
  }

  /* ====================================================================
   * HELP (#view-help)
   *
   * Every section of the app in a sentence anybody can follow, what it
   * costs, and a button that goes there. Written for somebody who has never
   * used an app like this and does not want to find out by tapping things:
   * no feature names that only make sense once you know them, and every word
   * on the screen that might stop someone explained at the bottom.
   *
   * The price line on each card reads the visitor's own status, so a
   * signed-in visitor is told "you have this" rather than "free with an
   * account" about something they already have.
   * ==================================================================== */

  var HELP_SECTIONS = [
    { view: 'decide', icon: '\u{1F3B2}', name: 'Decide', tier: 'free',
      what: 'Can’t decide what to eat? Answer a few easy questions — just tap the one you like more — and it picks a dish for you. In a hurry? “Tonight’s pick” gives you an answer with no questions at all.' },
    { view: 'dishes', icon: '\u{1F4D6}', name: 'Dishes', tier: 'free',
      what: 'Every dish in the app. Look through them, or search for one by name, and tap one to see what it is and how to make it.' },
    { view: 'planner', icon: '\u{1F5D3}️', name: 'Meal planner', tier: 'account', extra: 'The shopping list, healthy-week check, costs and dinner-party planner are Premium.',
      what: 'Plan breakfast, lunch, dinner and a snack for each day of the week. It is saved to your account, so it is the same on your phone and your computer.' },
    { view: 'kitchen', icon: '\u{1F373}', name: 'Recipes & kitchen', tier: 'mixed', extra: 'Kitchen timers and “In season” are free with an account. Your recipes and the fridge photo are Premium.',
      what: 'Keep your own recipes safe — type them in, or take a photo of a recipe card or cookbook page. Copy a recipe from any website without the adverts. See what you can cook from a photo of your fridge. Set kitchen timers.' },
    { view: 'scan', icon: '\u{1F4F7}', name: 'Scan food', tier: 'premium',
      what: 'Point your phone’s camera at the barcode on a packet, tin or bottle. It tells you in plain words how healthy it is — a healthy choice, fine now and then, or best as a treat.' },
    { view: 'menu', icon: '\u{1F37D}️', name: 'Menu', tier: 'free',
      what: 'Having people over? It writes a menu of five courses that go well together — something to nibble, a starter, a main, a pudding and something to finish.' },
    { view: 'nearby', icon: '\u{1F4CD}', name: 'Nearby', tier: 'free',
      what: 'Places to eat close to where you are. It asks to use your location for that one search, and does not keep it.' },
    { view: 'chat', icon: '\u{1F4AC}', name: 'Ask', tier: 'free', extra: 'Three questions a day are free. Premium has no limit.',
      what: 'Ask any food question in your own words, the way you would ask a friend — “what can I make with eggs and spinach?”' },
    { view: 'news', icon: '\u{1F4F0}', name: 'News', tier: 'free', extra: 'Premium adds a short summary of the day’s food news at the top.',
      what: 'The latest food stories from newspapers and food websites.' },
    { view: 'radio', icon: '\u{1F4FA}', name: 'TV & radio', tier: 'mixed', extra: 'One TV group and one radio group are free each day, picked at random; Premium has every group.',
      what: 'Something to watch or listen to while you cook and eat. Tap a group — cooking shows, music, comedy, travel, calm nature and more on the TV; jazz, classical, oldies, lo-fi and more on the radio.' },
    { view: 'daily', icon: '☀️', name: 'Daily', tier: 'account',
      what: 'A one-minute check-in each day: how you are feeling, one good thing, and a food question everybody gets the same day.' },
    { view: 'profile', icon: '\u{1F464}', name: 'Profile', tier: 'free',
      what: 'Your settings. Tell it what you do not eat — vegetarian, no pork, no nuts and so on — and it never suggests those again.' }
  ];

  var HELP_WORDS = [
    ['Premium', 'The paid version of the app. The first seven days are free. If you cancel before they are up, you pay nothing.'],
    ['Free with an account', 'Free, but you need to sign in, so the app can keep your things safe and show them on all your devices. Tap “Sign in” at the top.'],
    ['Whop', 'The company morsels45 uses for signing in and payments. If you do not have a Whop account, you can make one with your email address in a minute.'],
    ['Shared browser', 'A web page two people can use at the same time, each on their own phone — to order a takeaway or fill a supermarket basket together. It is Premium.'],
    ['Barcode', 'The black stripes with numbers underneath, printed on almost every packet. Scan food reads it.'],
    ['Nutri-Score', 'A letter from A (the healthiest) to E (the least healthy) that many food packets have. Scan food uses it when the product has one.'],
    ['Ultra-processed', 'Made mostly in a factory, with ingredients you would not have in your own kitchen. Fine sometimes, but best not every day.'],
    ['AI', 'A computer program that can read and write. Here it helps plan your week, read recipes from photos and answer questions. It can make mistakes, so always check anything to do with allergies yourself.'],
    ['XP and streaks', 'Points you collect for using the app, and how many days in a row you have used it. Just for fun.']
  ];

  function helpTier(section) {
    var inNow = signedIn(), plusNow = plus();
    if (section.tier === 'free') return { text: 'Free', cls: 'is-free' };
    if (section.tier === 'account') return inNow ? { text: 'Free — you have this', cls: 'is-yours' } : { text: 'Free with an account', cls: 'is-account' };
    if (section.tier === 'premium') return plusNow ? { text: 'Premium — you have this', cls: 'is-yours' } : { text: 'Premium', cls: 'is-premium' };
    if (plusNow) return { text: 'You have all of it', cls: 'is-yours' };
    return { text: 'Some free, some Premium', cls: 'is-mixed' };
  }

  function renderHelp() {
    var root = M.$('view-help');
    if (!root) return;
    clear(root);
    root.appendChild(head('Help', 'How to use morsels45',
      'Everything this app can do, in plain words. Tap “Open” on any of them to go straight there. You can come back to this page any time — it is “Help”, at the end of the menu.'));
    var body = el('div', { class: 'hub-body help' });
    root.appendChild(body);

    body.appendChild(howTo([
      'To get an idea for a meal, tap “Decide” in the menu, then the big “Decide for me” button. Tap the answer you like more each time, and it picks a dish.',
      'To plan your week, keep recipes, or watch food TV, sign in first. It is free: tap “Sign in” at the top of the screen.',
      'If the writing is too small, tap the “Aa” button at the top. Tap it again to make it bigger still, and a third time to go back to normal.',
      'Nothing you tap can break anything. If you get lost, tap “Help” in the menu to come back here.'
    ], 'Start here'));

    body.appendChild(el('h2', { class: 'strip-title', text: 'What each part does' }));
    body.appendChild(el('div', { class: 'help-grid' }, HELP_SECTIONS.map(function (s) {
      var t = helpTier(s);
      return el('article', { class: 'help-card' }, [
        el('div', { class: 'help-card-head' }, [
          el('span', { class: 'help-icon', 'aria-hidden': 'true', text: s.icon }),
          el('h3', { class: 'help-name', text: s.name }),
          el('span', { class: 'help-tier ' + t.cls, text: t.text })
        ]),
        el('p', { class: 'help-what', text: s.what }),
        s.extra ? el('p', { class: 'help-extra', text: s.extra }) : null,
        el('button', {
          class: 'help-open',
          type: 'button',
          'aria-label': 'Open ' + s.name,
          on: { click: function () { Sound.tick(); M.setView(s.view); } }
        }, ['Open ' + s.name, el('span', { 'aria-hidden': 'true', text: ' ›' })])
      ]);
    })));

    body.appendChild(el('h2', { class: 'strip-title', text: 'Words you might see' }));
    body.appendChild(el('dl', { class: 'help-words' }, HELP_WORDS.reduce(function (out, w) {
      out.push(el('dt', { text: w[0] }), el('dd', { text: w[1] }));
      return out;
    }, [])));

    body.appendChild(el('h2', { class: 'strip-title', text: 'Still stuck?' }));
    body.appendChild(el('div', { class: 'help-stuck' }, [
      el('p', { text: 'If something does not look right, try closing the app and opening it again — that fixes most things.' }),
      el('p', {}, [
        'The answers to the questions people ask most are on ',
        // target="_top": see the note on #invite-signin in index.html.
        el('a', { href: '/faq', target: '_top', text: 'the questions page' }),
        '. What Premium includes, and what it costs, is on ',
        el('a', { href: '/premium', target: '_top', text: 'the Premium page' }),
        '.'
      ])
    ]));
  }

  /* ====================================================================
   * WIRING
   * ==================================================================== */

  var lastTier = null;

  function tier() { return (signedIn() ? 'in' : 'out') + (plus() ? '+' : ''); }

  window.M45Hub = {
    // "Put it in your week" on the result screen: one dish into the planner,
    // on the day given. Resolves true once it is saved (or queued to save).
    addDish: function (name, date, meal) {
      if (!signedIn()) return Promise.resolve(false);
      var week = isoDay(mondayOf(date));
      var day = DAYS[(date.getDay() + 6) % 7];
      return loadWeek(week, plan.loadedFor !== week).then(function () {
        if (!plan.data || plan.week !== week) return false;
        addToSlot(day + '-' + (MEALS.indexOf(meal) !== -1 ? meal : 'dinner'), { t: 'dish', name: name });
        return true;
      }).catch(function () { return false; });
    },
    onView: function (name) {
      if (name !== 'scan') stopCamera();
      if (name === 'planner') renderPlanner();
      else if (name === 'kitchen') renderKitchen();
      else if (name === 'scan') renderScanView();
      else if (name === 'news') renderBriefing();
      else if (name === 'help') renderHelp();
    },
    // Called whenever the account status is checked again, which is on
    // every window focus. Only a change of tier redraws anything: redrawing
    // on every focus would throw away whatever somebody was typing.
    onStatus: function () {
      var now = tier();
      refreshVoiceTag();
      if (now === lastTier) return;
      var changedAccount = lastTier !== null && lastTier.charAt(1) !== now.charAt(1);
      lastTier = now;
      if (changedAccount) { plan.data = null; plan.loadedFor = null; cookbook.list = null; }
      var v = M.currentView();
      if (v === 'planner' || v === 'kitchen' || v === 'scan' || v === 'news' || v === 'help') window.M45Hub.onView(v);
    }
  };

  lastTier = tier();
  setupVoice();
  ensureTicker();
  // Opened before this file had loaded — ?go=planner at boot, say.
  var opened = M.currentView();
  if (opened === 'planner' || opened === 'kitchen' || opened === 'scan' || opened === 'news' || opened === 'help') window.M45Hub.onView(opened);
})();
