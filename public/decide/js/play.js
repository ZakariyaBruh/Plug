/*
 * play.js — Play with Dot, rebuilt a second time.
 *
 * The first rebuild drew everything in cream paper with a thick brown line and a mustard
 * header: a children's picture book dropped into an app that is charcoal and amber. This
 * one is made of the app's own materials. Every colour on the stage comes from the CSS
 * variables the rest of the app uses (--void, --raise, --hair, --ink, --amber), read when a
 * game opens, so the games follow whichever theme is on, light ones included. Food keeps its
 * own colours (that is the point of food) with a thin near-black edge and a soft shadow; the
 * chrome is the app's: hairlines, pills, amber for the one thing to press.
 *
 * It is also laid out as a game and not as a form. The stage takes the whole height of the
 * panel (a 9:16 canvas fitted to what is left after the header and the ad strip), the HUD
 * is on the stage, and there is no Pause/Quit bar under it for a thumb to hit by mistake:
 * pause is on the stage, back is in the header.
 *
 * Ten games, each with a rulebook, and the same shell under all of them: a start card that
 * says what to do, a countdown, a pause that waits, hit-stop and shake when something lands,
 * and a results card with stars. It is loaded on first use, not at startup: nobody opening the
 * app to decide dinner pays for it. app.js keeps a small stub called Play and fetches this.
 *
 *   M45Play.init({ Dot, Buddy, shell, reduceMotion })
 *   M45Play.open('arena')   or   M45Play.open()   for the shelf
 */
(function () {
  'use strict';

  var Sound = window.FoodSound;
  var S = window.Sprites;
  var D = null;
  var TAU = Math.PI * 2;
  var FONT = "'Bricolage Grotesque', system-ui, -apple-system, 'Segoe UI', sans-serif";
  var reduce = false;
  var GOLD = '#f6c744', TOMATO = '#e4572e', LEAF = '#6fbf5e', SKY = '#6bb7d6';

  /* --------------------------------------------------------------- the theme */
  // Read from the app's own variables each time a game opens, so a theme change is picked up.
  var T = {};
  function lum(hex) {
    var m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(String(hex).trim());
    if (!m) return 0.5;
    var c = [1, 2, 3].map(function (i) { var v = parseInt(m[i], 16) / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function theme() {
    var cs = getComputedStyle(document.documentElement);
    function v(n, d) { var x = cs.getPropertyValue(n).trim(); return x || d; }
    T.bg = v('--void', '#131316'); T.floor = v('--char', '#17171a'); T.raise = v('--raise', '#1e1e22');
    T.hair = v('--hair', '#2c2c31'); T.hairLit = v('--hair-lit', '#3d3d44');
    T.ink = v('--ink', '#f3efe8'); T.ink2 = v('--ink-2', '#c8c3ba'); T.ink3 = v('--ink-3', '#9d988f');
    T.amber = v('--amber', '#e0a340'); T.amberDim = v('--amber-dim', '#6b4d19');
    T.dark = lum(T.bg) < 0.4;
    T.onAmber = lum(T.amber) > 0.3 ? '#17120a' : '#ffffff';
    T.scrim = T.dark ? 'rgba(8,8,10,' : 'rgba(246,242,234,';
    T.shade = T.dark ? 'rgba(0,0,0,' : 'rgba(40,30,20,';
    T.edge = T.dark ? '#0d0b09' : '#2a2018';
  }
  theme();

  var open = false, root = null, body = null, sayEl = null, dotEl = null, back = null, shellEl = null, titleEl = null, backBtn = null;
  var cleanup = null, token = null;
  var BEST = 'morsels-dot-best-v2', COUNT = 'morsels-dot-games';
  var stats = {};
  try { var sv = JSON.parse(localStorage.getItem(COUNT) || 'null'); if (sv) for (var k in sv) if (typeof sv[k] === 'number') stats[k] = sv[k]; } catch (err) { /* fine */ }

  /* ----------------------------------------------------------- small tools */
  function h(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function rint(a, b) { return Math.floor(rnd(a, b + 1)); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function pick(list) { return list[Math.floor(Math.random() * list.length)]; }
  function shuffle(list) { var a = list.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function dist(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }
  function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
  function easeBack(t) { var c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); }
  function bestAll() { try { return JSON.parse(localStorage.getItem(BEST) || '{}') || {}; } catch (err) { return {}; } }
  function saveBest(id, score) {
    var all = bestAll(), beat = score > (all[id] || 0);
    if (beat) { all[id] = score; try { localStorage.setItem(BEST, JSON.stringify(all)); } catch (err) { /* fine */ } }
    return { best: Math.max(all[id] || 0, score), beat: beat };
  }
  function bump(id) { stats[id] = (stats[id] || 0) + 1; try { localStorage.setItem(COUNT, JSON.stringify(stats)); } catch (err) { /* fine */ } }
  function say(text, mood, hold) {
    if (!sayEl) return;
    sayEl.textContent = text;
    sayEl.classList.remove('is-in'); void sayEl.offsetWidth; sayEl.classList.add('is-in');
    if (mood && D) D.Dot.mood(dotEl, mood, hold || 1500);
  }

  /* ------------------------------------------------------ canvas drawing kit */
  function text(g, str, x, y, size, color, align, weight, outline) {
    g.font = (weight || 700) + ' ' + size + 'px ' + FONT;
    g.textAlign = align || 'center'; g.textBaseline = 'middle';
    if (outline) { g.lineWidth = Math.max(3, size / 5); g.lineJoin = 'round'; g.strokeStyle = outline === true ? T.shade + '.75)' : outline; g.strokeText(str, x, y); }
    g.fillStyle = color || T.ink; g.fillText(str, x, y);
  }
  function rrect(g, x, y, w, hh, r) {
    r = Math.min(r, w / 2, hh / 2);
    g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + hh, r); g.arcTo(x + w, y + hh, x, y + hh, r); g.arcTo(x, y + hh, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }
  // The one surface the games share: the app's raised panel, with its hairline.
  function panel(g, x, y, w, hh, r, fill, line) {
    rrect(g, x, y, w, hh, r === undefined ? 12 : r); g.fillStyle = fill || T.raise; g.fill();
    g.lineWidth = 1.5; g.strokeStyle = line || T.hairLit; g.stroke();
  }
  function disc(g, x, y, r, fill, w, stroke) { g.beginPath(); g.arc(x, y, r, 0, TAU); if (fill) { g.fillStyle = fill; g.fill(); } if (w !== 0) { g.lineWidth = w || 1.5; g.strokeStyle = stroke || T.edge; g.stroke(); } }
  function shadow(g, x, y, rx, ry) { g.fillStyle = T.shade + '.34)'; g.beginPath(); g.ellipse(x, y, rx, ry === undefined ? rx * 0.35 : ry, 0, 0, TAU); g.fill(); }
  function sprite(g, id, x, y, size, rot, flip) { S.draw(g, id, x, y, size, rot, flip); }
  function pattern(g, w, hh, paint) {
    var c = document.createElement('canvas'); c.width = w; c.height = hh; paint(c.getContext('2d'), w, hh);
    return g.createPattern(c, 'repeat');
  }
  // The floor of most games: the app's black, with a faint dotted grid so a still screen is not a flat slab.
  function floorPattern(g, size, tint) {
    return pattern(g, size, size, function (c, w, hh) {
      c.fillStyle = T.bg; c.fillRect(0, 0, w, hh);
      c.fillStyle = tint || T.hair; c.globalAlpha = 0.7; c.beginPath(); c.arc(w / 2, hh / 2, 1.4, 0, TAU); c.fill();
    });
  }
  function wrapText(g, str, x, y, maxW, lh, align) {
    var words = String(str).split(' '), line = '', lines = [];
    words.forEach(function (w) { var t = line ? line + ' ' + w : w; if (g.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; });
    lines.push(line);
    g.textAlign = align || 'left';
    lines.forEach(function (l, i) { g.fillText(l, x, y + (i - (lines.length - 1) / 2) * lh); });
    return lines.length;
  }
  function pill(g, x, y, w, hh, fill, line) { panel(g, x, y, w, hh, hh / 2, fill, line); }
  // The old name for a panel, kept so a game written against it still draws; the fill is the app's.
  function tab(g, x, y, w, hh, fill, r) { panel(g, x, y, w, hh, r, fill && /^#f6c744/i.test(fill) ? T.amber : T.raise); }
  // A bar: a track and a fill, for time, xp and the like.
  function bar(g, x, y, w, hh, k, color) {
    rrect(g, x, y, w, hh, hh / 2); g.fillStyle = T.shade + '.5)'; g.fill(); g.lineWidth = 1; g.strokeStyle = T.hair; g.stroke();
    if (k > 0.001) { g.save(); rrect(g, x, y, w, hh, hh / 2); g.clip(); g.fillStyle = color || T.amber; g.fillRect(x, y, Math.max(hh, w * clamp(k, 0, 1)), hh); g.restore(); }
  }

  /* ------------------------------------------------------------ the arcade shell */
  /*
   * One of these runs every game. A game is a definition:
   *   id, name, W, H, color         the stage (default 360x640) and the game's accent
   *   how: [[sprite, line], ...]    what the start card says
   *   lives                         hearts (0 for none)
   *   hud(st)                       the line in the score pill (default 'Score n')
   *   setup(st)                     build the state (st.* is yours)
   *   update(st, dt)                fixed 1/60 steps while playing
   *   draw(st, g)                   the world, under the effects
   *   down/move/up(st, p)           pointer, in stage coordinates
   *   key(st, e)                    keys
   *   stars: [one, two, three]      score for each star
   *   notes: [lines]                what Dot says when it goes badly
   * and the shell supplies st.add, st.hurt, st.burst, st.pop, st.hit, st.end.
   */
  var STEP = 1 / 60;
  function arcade(def) {
    theme();
    var W = def.W || 360, H = def.H || 640;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var wrap = h('div', 'pg-stage');
    var cv = h('canvas', 'pg-canvas');
    cv.setAttribute('aria-label', def.name + '. A game; the controls are on the card before it starts.');
    cv.setAttribute('role', 'img');
    var g = cv.getContext('2d');
    var kScale = dpr;
    // Fit the stage to what is left of the panel, keeping its shape, and keep the bitmap sharp at that size.
    function fit() {
      var aw = wrap.clientWidth, ah = wrap.clientHeight;
      if (aw < 40 || ah < 40) return;
      var s = Math.min(aw / W, ah / H);
      cv.style.width = Math.floor(W * s) + 'px'; cv.style.height = Math.floor(H * s) + 'px';
      var k = clamp(s * dpr, 1, 3);
      if (Math.abs(k - kScale) > 0.01 || cv.width !== Math.round(W * k)) { kScale = k; cv.width = Math.round(W * k); cv.height = Math.round(H * k); }
    }
    wrap.appendChild(cv);
    body.appendChild(wrap);
    body.classList.add('is-stage');
    var ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(fit) : null;
    if (ro) ro.observe(wrap); else window.addEventListener('resize', fit);
    fit();

    var st = {
      W: W, H: H, g: g, cv: cv, def: def, t: 0, score: 0, over: false, paused: false,
      phase: 'intro', phaseT: 0, count: 0, lives: def.lives === undefined ? 3 : def.lives, maxLives: def.lives === undefined ? 3 : def.lives,
      shake: 0, flash: 0, hitstop: 0, slow: 1, fx: [], pops: [], inv: 0, T: T,
      p: { x: W / 2, y: H * 0.7, down: false, id: -1 }, keys: {}, hooks: [], timers: [], stars: 0
    };
    var raf = 0, last = performance.now(), acc = 0, ended = false;

    st.add = function (n, x, y, color) { st.score += n; if (x !== undefined) st.pop(x, y, '+' + n, color); };
    st.pop = function (x, y, str, color) { st.pops.push({ x: x, y: y, s: str, c: color || T.ink, life: 0.9, age: 0 }); };
    st.burst = function (x, y, color, n, o) {
      o = o || {};
      for (var i = 0; i < (n || 10); i++) {
        var a = o.arc ? o.arc[0] + Math.random() * (o.arc[1] - o.arc[0]) : Math.random() * TAU, v = (o.v || 150) * (0.35 + Math.random() * 0.8);
        st.fx.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (o.up || 30), life: (o.life || 0.55) * (0.6 + Math.random() * 0.7), age: 0, c: color || GOLD, r: (o.r || 3) * (0.6 + Math.random() * 0.9), g: o.g === undefined ? 380 : o.g, sq: !!o.sq });
      }
    };
    st.hit = function (ms) { if (!reduce) st.hitstop = Math.max(st.hitstop, (ms || 50) / 1000); };
    st.rumble = function (n) { if (!reduce) st.shake = Math.max(st.shake, n || 6); try { if (navigator.vibrate) navigator.vibrate(18); } catch (err) { /* fine */ } };
    st.on = function (target, ev, fn, o) { target.addEventListener(ev, fn, o); st.hooks.push([target, ev, fn, o]); };
    st.later = function (ms, fn) { var id = setTimeout(function () { if (!ended) fn(); }, ms); st.timers.push(id); return id; };
    st.hurt = function (x, y) {
      if (st.over || st.inv > 0) return false;
      st.lives--; st.inv = 1.1; st.flash = 1; st.rumble(9); st.hit(80); Sound.bust(); D.Dot.mood(dotEl, 'sad', 800);
      if (x !== undefined) st.burst(x, y, TOMATO, 14, { v: 190 });
      if (st.lives <= 0) st.end();
      return true;
    };
    st.heal = function () { if (st.lives < st.maxLives) { st.lives++; return true; } return false; };
    st.end = function () {
      if (st.over) return;
      st.over = true; st.phase = 'over'; st.phaseT = 0; st.flash = 1; st.rumble(10);
    };

    function pt(e) { var r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; }
    function over(p, x, y, w, hh) { return p.x >= x && p.x <= x + w && p.y >= y && p.y <= y + hh; }

    function begin() { st.phase = 'count'; st.count = 3.4; st.phaseT = 0; Sound.count(false); }
    function togglePause() {
      if (st.phase !== 'play' && !st.paused) return;
      st.paused = !st.paused;
      cv.classList.toggle('is-paused', st.paused);
    }
    st.togglePause = togglePause;

    cv.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      var p = pt(e); st.p.x = p.x; st.p.y = p.y; st.p.down = true; st.p.id = e.pointerId;
      try { cv.setPointerCapture(e.pointerId); } catch (err) { /* fine */ }
      if (st.phase === 'intro') { if (e.isTrusted !== false) begin(); return; }
      if (st.paused) { if (over(p, W / 2 - 100, H / 2 + 6, 200, 44)) { menu(); return; } togglePause(); return; }
      if (st.phase === 'play' && over(p, W - 52, 6, 46, 40)) { togglePause(); return; }
      if (st.phase === 'play' && def.down) def.down(st, p, e);
    });
    cv.addEventListener('pointermove', function (e) {
      var p = pt(e); st.p.x = p.x; st.p.y = p.y;
      if (st.phase === 'play' && !st.paused && def.move) def.move(st, p, e);
    });
    function release(e) { var p = pt(e); st.p.x = p.x; st.p.y = p.y; st.p.down = false; if (st.phase === 'play' && !st.paused && def.up) def.up(st, p, e); }
    cv.addEventListener('pointerup', release);
    cv.addEventListener('pointercancel', function () { st.p.down = false; });
    st.on(document, 'keydown', function (e) {
      if (!open) return;
      if (e.key === 'p' || e.key === 'P') { togglePause(); return; }
      if (st.phase === 'intro' && (e.key === ' ' || e.key === 'Enter')) { e.preventDefault(); begin(); return; }
      st.keys[e.key] = true;
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].indexOf(e.key) !== -1) e.preventDefault();
      if (st.phase === 'play' && !st.paused && def.key) def.key(st, e);
    });
    st.on(document, 'keyup', function (e) { st.keys[e.key] = false; });
    st.on(document, 'visibilitychange', function () { if (document.hidden && st.phase === 'play' && !st.paused) togglePause(); });

    /* ---- drawing of everything that is not the game */
    function hud() {
      var label = def.hud ? def.hud(st) : String(st.score);
      g.font = '800 17px ' + FONT;
      var w = Math.max(92, g.measureText(label).width + 48);
      pill(g, 8, 8, w, 34, T.shade + '.62)', T.hairLit);
      disc(g, 25, 25, 4.5, def.color || T.amber, 0);
      text(g, label, 38, 26, 17, T.ink, 'left', 800);
      if (st.maxLives > 0) {
        for (var i = 0; i < st.maxLives; i++) {
          var on = i < st.lives;
          g.globalAlpha = on ? 1 : 0.25;
          var beat = on && st.lives === 1 ? 1 + Math.sin(st.t * 9) * 0.1 : 1;
          sprite(g, 'heart', 18 + i * 24, 58, 21 * beat, 0);
        }
        g.globalAlpha = 1;
      }
      // pause
      pill(g, W - 46, 8, 38, 34, T.shade + '.62)', T.hairLit);
      g.fillStyle = T.ink; rrect(g, W - 34, 17, 4, 16, 2); g.fill(); rrect(g, W - 24, 17, 4, 16, 2); g.fill();
    }
    function effects(dt) {
      for (var i = st.fx.length - 1; i >= 0; i--) {
        var f = st.fx[i]; f.age += dt; f.x += f.vx * dt; f.y += f.vy * dt; f.vy += f.g * dt;
        if (f.age >= f.life) { st.fx.splice(i, 1); continue; }
        var a = 1 - f.age / f.life; g.globalAlpha = Math.min(1, a * 1.6); g.fillStyle = f.c;
        if (f.sq) g.fillRect(f.x - f.r, f.y - f.r, f.r * 2, f.r * 2); else { g.beginPath(); g.arc(f.x, f.y, f.r * (0.5 + a * 0.5), 0, TAU); g.fill(); }
      }
      g.globalAlpha = 1;
      for (var j = st.pops.length - 1; j >= 0; j--) {
        var p = st.pops[j]; p.age += dt; p.y -= 34 * dt;
        if (p.age >= p.life) { st.pops.splice(j, 1); continue; }
        var k = Math.min(1, p.age * 9), sc = 0.6 + 0.5 * Math.sin(k * 1.9);
        g.save(); g.translate(p.x, p.y); g.scale(sc, sc); g.globalAlpha = Math.min(1, (p.life - p.age) * 3); text(g, p.s, 0, 0, 18, p.c, 'center', 800, true); g.restore();
      }
      g.globalAlpha = 1;
    }
    function veil(a) { g.fillStyle = T.scrim + a + ')'; g.fillRect(0, 0, W, H); }
    function card() {
      veil(0.72);
      var rows = def.how || [];
      var x = 22, w = W - 44, hh = 150 + rows.length * 64, y = Math.max(70, (H - hh) / 2 - 10);
      panel(g, x, y, w, hh, 20, T.raise, T.hairLit);
      g.fillStyle = def.color || T.amber; rrect(g, x + 20, y + 22, 28, 4, 2); g.fill();
      text(g, def.name, x + 20, y + 52, 28, T.ink, 'left', 800);
      var all = bestAll();
      text(g, all[def.id] ? 'Best ' + all[def.id] : 'Your first go', x + 20, y + 80, 14, T.ink3, 'left', 600);
      rows.forEach(function (row, i) {
        var yy = y + 120 + i * 64;
        disc(g, x + 44, yy, 22, T.shade + '.4)', 1, T.hair);
        sprite(g, row[0], x + 44, yy, 32, 0);
        g.font = '600 15px ' + FONT; g.textBaseline = 'middle'; g.fillStyle = T.ink2;
        wrapText(g, row[1], x + 80, yy, w - 100, 19, 'left');
      });
      var pulse = 1 + Math.sin(st.t * 5) * 0.03;
      g.save(); g.translate(W / 2, y + hh - 38); g.scale(pulse, pulse);
      pill(g, -96, -22, 192, 44, T.amber, T.amber); text(g, 'Tap to start', 0, 1, 17, T.onAmber, 'center', 800); g.restore();
    }
    function counting() {
      veil(0.5);
      var n = Math.ceil(st.count - 0.4), frac = (st.count - 0.4) - Math.floor(st.count - 0.4);
      if (n >= 1) { var pop = 1 + 0.35 * Math.pow(frac, 3); g.save(); g.translate(W / 2, H / 2); g.scale(pop, pop); text(g, String(n), 0, 0, 110, T.ink, 'center', 800, true); g.restore(); }
      else { var s = 1 + (0.4 - Math.max(0, st.count)) * 2; g.save(); g.translate(W / 2, H / 2); g.scale(s, s); g.globalAlpha = Math.max(0, st.count / 0.4); text(g, 'Go', 0, 0, 90, T.amber, 'center', 800, true); g.restore(); g.globalAlpha = 1; }
    }
    function pauseCard() {
      veil(0.78);
      panel(g, W / 2 - 120, H / 2 - 70, 240, 140, 20, T.raise, T.hairLit);
      text(g, 'Paused', W / 2, H / 2 - 36, 28, T.ink, 'center', 800);
      text(g, 'Tap anywhere to carry on', W / 2, H / 2 - 8, 13, T.ink3, 'center', 600);
      pill(g, W / 2 - 100, H / 2 + 6, 200, 44, 'rgba(0,0,0,0)', T.hairLit); text(g, 'Leave this game', W / 2, H / 2 + 29, 15, T.ink2, 'center', 700);
    }

    function frame(now) {
      var raw = Math.min(0.05, (now - last) / 1000); last = now;
      var dt = raw;
      st.phaseT += raw;
      if (st.phase === 'count') {
        st.count -= raw;
        if (Math.ceil(st.count - 0.4) !== st._lastN && st.count > 0.4) { st._lastN = Math.ceil(st.count - 0.4); if (st._lastN < 3) Sound.count(false); }
        if (st.count <= 0.4 && !st._go) { st._go = true; Sound.count(true); }
        if (st.count <= 0) { st.phase = 'play'; st.phaseT = 0; if (def.start) def.start(st); }
      }
      if (st.phase === 'play' && !st.paused) {
        if (st.hitstop > 0) st.hitstop -= raw;
        else {
          acc += dt * st.slow;
          while (acc >= STEP) {
            st.t += STEP; if (st.inv > 0) st.inv -= STEP;
            def.update(st, STEP);
            acc -= STEP;
            if (st.over) break;
          }
        }
      } else if (st.phase === 'over') { st.t += raw; if (def.settle) def.settle(st, raw); }
      else st.t += raw * 0.5;
      st.shake = Math.max(0, st.shake - raw * 28); st.flash = Math.max(0, st.flash - raw * 3);

      g.setTransform(kScale, 0, 0, kScale, 0, 0);
      g.save();
      g.clearRect(0, 0, W, H);
      if (st.shake > 0.3 && !reduce) g.translate((Math.random() - 0.5) * st.shake, (Math.random() - 0.5) * st.shake);
      def.draw(st, g);
      effects(st.phase === 'play' && st.hitstop > 0 ? 0 : raw);
      g.restore();
      if (st.flash > 0 && !reduce) { g.fillStyle = 'rgba(255,255,255,' + st.flash * 0.3 + ')'; g.fillRect(0, 0, W, H); }
      if (st.phase !== 'intro') hud();
      if (st.phase === 'intro') card();
      else if (st.phase === 'count') counting();
      else if (st.paused) pauseCard();
      if (st.phase === 'over') {
        var a = Math.min(1, st.phaseT / 0.9);
        veil(a * 0.6);
        if (st.phaseT > 0.25) { var k = easeBack(Math.min(1, (st.phaseT - 0.25) * 3)); g.save(); g.translate(W / 2, H / 2); g.scale(k, k); text(g, def.overText || 'Oof.', 0, 0, 56, T.ink, 'center', 800, true); g.restore(); }
        if (st.phaseT > 1.3 && !ended) { ended = true; results(def, st); return; }
      }
      raf = requestAnimationFrame(frame);
    }
    cleanup = function () {
      ended = true; cancelAnimationFrame(raf); st.over = true;
      if (ro) ro.disconnect(); else window.removeEventListener('resize', fit);
      st.hooks.forEach(function (k) { k[0].removeEventListener(k[1], k[2], k[3]); });
      st.timers.forEach(clearTimeout);
      if (def.teardown) def.teardown(st);
    };
    def.setup(st);
    raf = requestAnimationFrame(frame);
    M45Play._st = st;
    return st;
  }

  /* --------------------------------------------------------------- the screens */
  function screen() { body.textContent = ''; body.scrollTop = 0; body.classList.remove('is-stage'); return body; }
  function stop() { token = null; if (cleanup) { var f = cleanup; cleanup = null; f(); } }
  function starsFor(def, score) { var t = def.stars || [10, 30, 60]; return score >= t[2] ? 3 : score >= t[1] ? 2 : score >= t[0] ? 1 : 0; }

  function results(def, st) {
    stop();
    var b = saveBest(def.id, st.score);
    var stars = starsFor(def, st.score);
    bump(def.id);
    if (D.Buddy && D.Buddy.played) D.Buddy.played(def.id, b.beat || st.score > 0);
    var s = screen();
    var card = h('div', 'pg-card pg-result');
    card.appendChild(h('p', 'pg-kicker', def.name));
    var big = h('p', 'pg-big', '0'); card.appendChild(big);
    var from = performance.now();
    (function tick(now) { var k = Math.min(1, (now - from) / 900); big.textContent = Math.round(st.score * easeOut(k)); if (k < 1 && open) requestAnimationFrame(tick); })(from);
    var row = h('div', 'pg-stars');
    for (var i = 0; i < 3; i++) {
      var img = h('img', i < stars ? 'is-on' : ''); img.alt = ''; img.src = S.url('star', 80); img.style.animationDelay = (0.5 + i * 0.28) + 's';
      row.appendChild(img);
      if (i < stars) (function (n) { setTimeout(function () { if (open) Sound.star(n); }, 500 + n * 280); })(i);
    }
    card.appendChild(row);
    card.appendChild(h('p', 'pg-best' + (b.beat ? ' is-new' : ''), b.beat ? 'New best' : 'Best ' + b.best));
    var acts = h('div', 'pg-actions');
    var again = h('button', 'pg-btn is-main', 'Play again'); again.type = 'button'; again.addEventListener('click', function () { Sound.tick(); launch(def.id); });
    var other = h('button', 'pg-btn', 'Another game'); other.type = 'button'; other.addEventListener('click', function () { Sound.tick(); menu(); });
    acts.appendChild(again); acts.appendChild(other);
    card.appendChild(acts);
    s.appendChild(card);
    setBack(true);
    var lines = def.notes || ['Again?'];
    say(b.beat ? pick(['A new best. I am not crying. You are.', 'Record. I will tell the dishes.']) : st.score >= b.best * 0.8 ? pick(['So close to your best.', 'Nearly. Again?']) : pick(lines), b.beat ? 'celebrate' : 'shrug');
    again.focus();
  }

  var SHELF = [];   // filled by the games below, in order
  function register(def) { SHELF.push(def); }

  // The picture on a tile: the game's colour as a dark wash, a pale disc behind the scene, and the sprites it uses.
  function cover(def) {
    var c = document.createElement('canvas'); var w = 320, hh = 200, dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = w * dpr; c.height = hh * dpr; c.className = 'pg-cover'; c.setAttribute('aria-hidden', 'true');
    var g = c.getContext('2d'); g.scale(dpr, dpr);
    g.fillStyle = T.floor; g.fillRect(0, 0, w, hh);
    g.globalAlpha = T.dark ? 0.22 : 0.3; g.fillStyle = def.color || T.amber; g.beginPath(); g.arc(w * 0.5, hh * 0.52, 118, 0, TAU); g.fill();
    g.globalAlpha = T.dark ? 0.12 : 0.18; g.beginPath(); g.arc(w * 0.5, hh * 0.52, 82, 0, TAU); g.fill(); g.globalAlpha = 1;
    (def.cover || []).forEach(function (it) { shadow(g, it[1], it[2] + it[3] * 0.42, it[3] * 0.34); sprite(g, it[0], it[1], it[2], it[3], it[4] || 0); });
    return c;
  }

  function menu() {
    stop();
    theme();
    var s = screen();
    setBack(false);
    say(pick(['Pick a game. I will lose gracefully. Probably.', 'Games. My favourite thing after dishes.', 'Go on. Choose. I have all day.']), 'happy');
    var shuffleBtn = h('button', 'pg-btn is-main pg-shuffle', 'Pick one for me'); shuffleBtn.type = 'button';
    shuffleBtn.addEventListener('click', function () { Sound.tick(); launch(pick(SHELF).id); });
    s.appendChild(shuffleBtn);
    var grid = h('div', 'pg-grid');
    var all = bestAll();
    SHELF.forEach(function (def) {
      var cardBtn = h('button', 'pg-tile'); cardBtn.type = 'button';
      cardBtn.style.setProperty('--accent', def.color || T.amber);
      cardBtn.appendChild(cover(def));
      var info = h('span', 'pg-tile-info');
      info.appendChild(h('strong', '', def.name));
      info.appendChild(h('span', 'pg-tile-blurb', def.blurb));
      var best = all[def.id], stars = best ? starsFor(def, best) : 0;
      var foot = h('span', 'pg-tile-foot');
      var st3 = h('span', 'pg-tile-stars'); st3.setAttribute('aria-hidden', 'true');
      for (var k = 0; k < 3; k++) { var im = h('img', k < stars ? 'is-on' : ''); im.alt = ''; im.src = S.url('star', 40); st3.appendChild(im); }
      foot.appendChild(st3); foot.appendChild(h('span', '', best ? 'Best ' + best : 'New'));
      info.appendChild(foot);
      cardBtn.appendChild(info);
      cardBtn.addEventListener('click', function () { Sound.tick(); launch(def.id); });
      grid.appendChild(cardBtn);
    });
    s.appendChild(grid);
  }

  function launch(id) {
    var def = SHELF.filter(function (d) { return d.id === id; })[0];
    if (!def) return menu();
    stop();
    screen();
    setBack(true);
    token = {};
    if (titleEl) titleEl.textContent = def.name;
    say(def.intro || 'Here we go.', 'happy');
    arcade(def);
  }

  function setBack(on) { if (backBtn) backBtn.hidden = !on; if (titleEl && !on) titleEl.textContent = 'Play with Dot'; }

  /* ------------------------------------------------------------- the dialog */
  function build() {
    root = h('div', 'pg');
    root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-labelledby', 'pg-title');
    root.hidden = true;
    var panelEl = h('div', 'pg-panel');
    var head = h('header', 'pg-head');
    backBtn = h('button', 'pg-x pg-back'); backBtn.type = 'button'; backBtn.innerHTML = '<svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 10H4m5.5-5.5L4 10l5.5 5.5"/></svg>'; backBtn.setAttribute('aria-label', 'Back to the games'); backBtn.hidden = true; backBtn.addEventListener('click', function () { Sound.tick(); menu(); });
    dotEl = h('span', 'mascot pg-dot'); D.Dot.mount(dotEl);
    var txt = h('div', 'pg-headtext');
    titleEl = h('h2', '', 'Play with Dot'); titleEl.id = 'pg-title';
    sayEl = h('p', 'pg-say'); sayEl.setAttribute('aria-live', 'polite');
    txt.appendChild(titleEl); txt.appendChild(sayEl);
    var x = h('button', 'pg-x', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Close'); x.addEventListener('click', close);
    head.appendChild(backBtn); head.appendChild(dotEl); head.appendChild(txt); head.appendChild(x);
    body = h('div', 'pg-body');
    panelEl.appendChild(head); panelEl.appendChild(body);
    root.appendChild(panelEl);
    root.addEventListener('click', function (e) { if (e.target === root) close(); });
    document.addEventListener('keydown', function (e) { if (open && e.key === 'Escape') close(); });
    document.body.appendChild(root);
  }
  function openGames(which) {
    if (open) return;
    if (!root) build();
    open = true; back = document.activeElement;
    theme();
    if (D.Buddy) D.Buddy.sync();
    root.hidden = false;
    document.body.classList.add('is-games');
    root.classList.remove('is-in'); void root.offsetWidth; root.classList.add('is-in');
    var sh = D.shell(); if (sh && 'inert' in sh) sh.inert = true;
    if (which && SHELF.some(function (d) { return d.id === which; })) launch(which); else menu();
    var first = body.querySelector('button'); if (first) first.focus({ preventScroll: true });
  }
  function close() {
    if (!open) return;
    open = false; stop();
    root.hidden = true;
    document.body.classList.remove('is-games');
    var sh = D.shell(); if (sh && 'inert' in sh && !document.body.classList.contains('is-landing')) sh.inert = false;
    if (D.Buddy) D.Buddy.sync();
    if (back && back.focus) try { back.focus(); } catch (err) { /* fine */ }
  }

  var M45Play = window.M45Play = {
    init: function (deps) { D = deps; reduce = !!deps.reduceMotion; },
    open: openGames, close: close, isOpen: function () { return open; }, stats: function () { return stats; },
    shelf: function () { return SHELF.map(function (d) { return d.id; }); },
    _kit: { h: h, rnd: rnd, rint: rint, clamp: clamp, lerp: lerp, pick: pick, shuffle: shuffle, dist: dist, easeOut: easeOut, easeBack: easeBack, text: text, rrect: rrect, panel: panel, tab: tab, pill: pill, bar: bar, disc: disc, shadow: shadow, sprite: sprite, pattern: pattern, register: register, T: T, FONT: FONT, TAU: TAU, say: say, Sound: Sound }
  };

  /* =============================================================== 1. FOOD FIGHT */
  /*
   * A survivor game. Dot throws seeds at whatever is nearest and you do the
   * steering; stars drop from what you beat and a level is a choice of one of
   * three perks. The enemies are different kinds of trouble, not the same one
   * with more health: onions are slow and take punishment, chillies arrive in
   * bunches and are quick, aubergines are the heavy ones, and knives warn you
   * with a line before they charge. Every fifth wave a pot comes in and throws
   * flames in a ring.
   */
  (function () {
    var PERKS = [
      { id: 'rate', name: 'Quick hands', text: 'Throw 25% faster', icon: 'spoon' },
      { id: 'multi', name: 'Extra seed', text: 'One more seed per throw', icon: 'seed' },
      { id: 'pierce', name: 'Piercing', text: 'Seeds go through one more', icon: 'knife' },
      { id: 'mag', name: 'Star magnet', text: 'Pull stars from further away', icon: 'star' },
      { id: 'spd', name: 'Sprinter', text: 'Move 15% faster', icon: 'bolt' },
      { id: 'plate', name: 'Plate shield', text: 'A plate circles Dot', icon: 'plate' },
      { id: 'dmg', name: 'Spicy seeds', text: 'Seeds hit 50% harder', icon: 'chilli' },
      { id: 'heal', name: 'Snack break', text: 'Get a heart back', icon: 'heart' }
    ];
    var KINDS = {
      onion: { hp: 3, r: 15, sp: 34, spr: 'onion', gem: 1, pts: 15, body: '#d8a4c8' },
      chilli: { hp: 1, r: 11, sp: 84, spr: 'chilli', gem: 1, pts: 10, body: '#d93a2b' },
      aubergine: { hp: 7, r: 19, sp: 24, spr: 'aubergine', gem: 3, pts: 35, body: '#7a4a9c' },
      knife: { hp: 1, r: 10, sp: 0, spr: 'knife', gem: 1, pts: 20, body: '#d8dde2' },
      pot: { hp: 40, r: 34, sp: 22, spr: 'pot', gem: 12, pts: 300, body: GOLD }
    };

    function spawn(st, kind, x, y) {
      var K = KINDS[kind], scale = 1 + (st.wave - 1) * 0.14;
      var e = { k: kind, x: x, y: y, hp: Math.ceil(K.hp * (kind === 'pot' ? 1 + st.wave * 0.25 : scale)), r: K.r, vx: 0, vy: 0, hit: 0, ph: Math.random() * 6, cd: 0, state: 'walk', t: 0, dx: 0, dy: 0 };
      e.max = e.hp;
      if (kind === 'knife') { e.state = 'aim'; e.t = 0.8; }
      if (kind === 'pot') e.cd = 2;
      st.en.push(e);
    }
    function edge(st) {
      var side = Math.floor(Math.random() * 4), m = 24;
      if (side === 0) return [rnd(0, st.W), 56 - m];
      if (side === 1) return [rnd(0, st.W), st.H + m];
      if (side === 2) return [-m, rnd(60, st.H)];
      return [st.W + m, rnd(60, st.H)];
    }
    function nearest(st, range) {
      var best = null, bd = range;
      st.en.forEach(function (e) { var d = dist(e.x, e.y, st.x, st.y); if (d < bd) { bd = d; best = e; } });
      return best;
    }
    function levelUp(st) {
      st.lvl++; st.xp = 0; st.need = Math.round(st.need * 1.28) + 2;
      var pool = PERKS.filter(function (p) { return !(p.id === 'heal' && st.lives >= st.maxLives) && !(p.id === 'multi' && st.multi >= 4) && !(p.id === 'plate' && st.orbit >= 3) && !(p.id === 'rate' && st.rate < 0.2); });
      st.choice = shuffle(pool).slice(0, 3); st.rects = []; st.pickAt = st.t;
      Sound.levelUp(); st.burst(st.x, st.y, '#f6c744', 22, { v: 220 }); D.Dot.mood(dotEl, 'celebrate', 900);
    }
    function apply(st, id) {
      if (id === 'rate') st.rate *= 0.78;
      if (id === 'multi') st.multi++;
      if (id === 'pierce') st.pierce++;
      if (id === 'mag') st.mag += 38;
      if (id === 'spd') st.spd *= 1.15;
      if (id === 'plate') st.orbit++;
      if (id === 'dmg') st.dmg *= 1.5;
      if (id === 'heal') st.heal();
    }
    function kill(st, e) {
      var K = KINDS[e.k];
      st.burst(e.x, e.y, K.body, e.k === 'pot' ? 40 : 12, { v: 170, sq: e.k === 'knife' });
      st.score += K.pts; st.pop(e.x, e.y - 8, '+' + K.pts, T.ink); st.kills++; Sound.pop(Math.min(8, st.kills % 9));
      for (var i = 0; i < K.gem; i++) st.gems.push({ x: e.x + rnd(-8, 8), y: e.y + rnd(-8, 8), vx: rnd(-60, 60), vy: rnd(-90, -20), v: 1, t: 0 });
      st.hit(e.k === 'pot' ? 160 : 30);
      if (e.k === 'pot') { st.rumble(10); st.flash = 0.6; }
    }

    register({
      id: 'arena', name: 'Food Fight', blurb: 'Survive the kitchen. Level up. Pick a perk.', color: TOMATO,
      cover: [['chilli', 64, 104, 70, -0.5], ['onion', 252, 96, 74, 0.3], ['dot', 160, 108, 100], ['knife', 214, 146, 52, 0.5], ['star', 100, 150, 34, 0.3]],
      intro: 'They are coming. I throw seeds. You do the moving.',
      how: [['dot', 'Drag anywhere to steer. Dot throws seeds by itself. Tap to dash.', T.ink], ['star', 'Pick up the stars. Every level, choose a perk.', '#fff2a8'], ['knife', 'Knives show a line before they charge. Step aside.', '#ffd9c8']],
      lives: 3, stars: [500, 1400, 3000], overText: 'Eaten.',
      notes: ['Chillies everywhere. I did warn you.', 'It was the onions. It is always the onions.', 'You were doing so well, and then you were not.'],
      hud: function (st) { return 'Wave ' + st.wave + '  ·  ' + st.score; },
      __levelUp: function (st) { levelUp(st); },   // for the driver
      setup: function (st) {
        st.x = st.W / 2; st.y = st.H * 0.58; st.vx = 0; st.vy = 0; st.en = []; st.sh = []; st.gems = []; st.fl = []; st.fire = 0.4; st.wave = 1; st.waveT = 0; st.spawnT = 0.5;
        st.xp = 0; st.need = 5; st.lvl = 1; st.rate = 0.62; st.dmg = 1; st.multi = 1; st.pierce = 0; st.mag = 56; st.spd = 134; st.orbit = 0; st.oa = 0; st.choice = null; st.kills = 0; st.stick = null; st.dash = 0; st.dashCd = 0; st.dashDir = { x: 0, y: -1 }; st.tapAt = 0; st.tapMoved = false; st.banner = 1.6; st.sfx = 0; st.face = 'smile';
        st.floor = floorPattern(st.g, 28);
      },
      down: function (st, p) {
        if (st.choice) {
          if (st.t - st.pickAt < 0.35) return;
          st.rects.forEach(function (r, i) { if (p.x >= r[0] && p.x <= r[0] + r[2] && p.y >= r[1] && p.y <= r[1] + r[3]) { apply(st, st.choice[i].id); st.choice = null; Sound.reveal(); } });
          return;
        }
        st.stick = { ax: p.x, ay: p.y, x: p.x, y: p.y }; st.tapAt = st.t; st.tapMoved = false;
      },
      move: function (st, p) { if (st.stick) { st.stick.x = p.x; st.stick.y = p.y; if (dist(p.x, p.y, st.stick.ax, st.stick.ay) > 10) st.tapMoved = true; } },
      // A quick tap, with no drag, is a dash: a short burst in the way you are going (or away from the nearest thing), safe while it lasts.
      up: function (st) {
        if (st.stick && !st.tapMoved && st.t - st.tapAt < 0.24 && st.dashCd <= 0 && !st.choice) {
          var d = Math.hypot(st.vx, st.vy), dx = st.vx, dy = st.vy;
          if (d < 30) { var n = nearest(st, 200); if (n) { dx = st.x - n.x; dy = st.y - n.y; d = Math.hypot(dx, dy) || 1; } else { dx = 0; dy = -1; d = 1; } }
          st.dashDir = { x: dx / d, y: dy / d }; st.dash = 0.2; st.dashCd = 1.3; st.inv = Math.max(st.inv, 0.3);
          Sound.whoosh(); st.burst(st.x, st.y, T.ink, 8, { v: 90, life: 0.3, r: 2 });
        }
        st.stick = null;
      },
      update: function (st, dt) {
        if (st.choice) return;
        st.banner -= dt;
        // steering: a drag from wherever the thumb landed, so the thumb never covers Dot
        var ix = 0, iy = 0;
        if (st.stick) { var dx = st.stick.x - st.stick.ax, dy = st.stick.y - st.stick.ay, m = Math.hypot(dx, dy); if (m > 4) { var k = Math.min(1, m / 38); ix = dx / m * k; iy = dy / m * k; } }
        var kx = (st.keys.ArrowRight || st.keys.d || st.keys.D ? 1 : 0) - (st.keys.ArrowLeft || st.keys.a || st.keys.A ? 1 : 0);
        var ky = (st.keys.ArrowDown || st.keys.s || st.keys.S ? 1 : 0) - (st.keys.ArrowUp || st.keys.w || st.keys.W ? 1 : 0);
        if (kx || ky) { var km = Math.hypot(kx, ky); ix = kx / km; iy = ky / km; }
        var a = 1 - Math.exp(-14 * dt);
        st.dashCd = Math.max(0, st.dashCd - dt);
        if (st.dash > 0) { st.dash -= dt; st.vx = st.dashDir.x * 430; st.vy = st.dashDir.y * 430; if (Math.random() < 0.5) st.burst(st.x, st.y + 6, T.ink3, 1, { v: 20, life: 0.25, r: 2.4, g: 0 }); }
        else { st.vx += (ix * st.spd - st.vx) * a; st.vy += (iy * st.spd - st.vy) * a; }
        st.x = clamp(st.x + st.vx * dt, 16, st.W - 16); st.y = clamp(st.y + st.vy * dt, 84, st.H - 46);

        // waves
        st.waveT += dt;
        if (st.waveT > 18) {
          st.waveT = 0; st.wave++; st.banner = 1.8; Sound.whoosh();
          st.score += st.wave * 20;
          if (st.wave % 5 === 0) { var e0 = edge(st); spawn(st, 'pot', e0[0], e0[1]); }
        }
        st.spawnT -= dt;
        if (st.spawnT <= 0) {
          st.spawnT = Math.max(0.28, 1.25 - st.wave * 0.075);
          var roll = Math.random(), w = st.wave, kind = 'onion';
          if (w >= 3 && roll > 0.82) kind = 'aubergine'; else if (w >= 2 && roll > 0.7) kind = 'knife'; else if (roll > 0.42) kind = 'chilli';
          var pos = edge(st);
          if (kind === 'chilli') { var bunch = 2 + Math.min(4, Math.floor(w / 2)); for (var b = 0; b < bunch; b++) spawn(st, 'chilli', pos[0] + rnd(-26, 26), pos[1] + rnd(-26, 26)); }
          else spawn(st, kind, pos[0], pos[1]);
        }

        // throwing
        st.fire -= dt; st.sfx -= dt;
        if (st.fire <= 0) {
          var tgt = nearest(st, 280);
          if (tgt) {
            st.fire = st.rate;
            var base = Math.atan2(tgt.y - st.y, tgt.x - st.x), n = st.multi, spread = 0.2;
            for (var i = 0; i < n; i++) { var ang = base + (i - (n - 1) / 2) * spread; st.sh.push({ x: st.x, y: st.y, vx: Math.cos(ang) * 330, vy: Math.sin(ang) * 330, a: ang, pierce: st.pierce, life: 1.1, hit: {} }); }
            if (st.sfx <= 0) { Sound.shoot(); st.sfx = 0.1; }
            st.face = 'open'; st.later(120, function () { st.face = 'smile'; });
          } else st.fire = 0.05;
        }
        for (var s = st.sh.length - 1; s >= 0; s--) {
          var sh = st.sh[s]; sh.x += sh.vx * dt; sh.y += sh.vy * dt; sh.life -= dt;
          if (sh.life <= 0 || sh.x < -20 || sh.x > st.W + 20 || sh.y < 40 || sh.y > st.H + 20) { st.sh.splice(s, 1); continue; }
          for (var q = 0; q < st.en.length; q++) {
            var e = st.en[q];
            if (sh.hit[q + ':' + e.ph] || dist(sh.x, sh.y, e.x, e.y) > e.r + 7) continue;
            sh.hit[q + ':' + e.ph] = 1; e.hp -= st.dmg; e.hit = 0.12; Sound.hit(); st.burst(sh.x, sh.y, T.ink, 4, { v: 90, life: 0.25, r: 2 });
            e.x += sh.vx * 0.02; e.y += sh.vy * 0.02;
            if (sh.pierce > 0) sh.pierce--; else { st.sh.splice(s, 1); }
            break;
          }
        }

        // the plates
        st.oa += dt * 3.2;
        for (var o = 0; o < st.orbit; o++) {
          var oa = st.oa + o * TAU / st.orbit, ox = st.x + Math.cos(oa) * 38, oy = st.y + Math.sin(oa) * 38;
          st.en.forEach(function (e) { if (dist(ox, oy, e.x, e.y) < e.r + 12 && (!e.pl || st.t - e.pl > 0.35)) { e.pl = st.t; e.hp -= 1.5 * st.dmg; e.hit = 0.12; Sound.hit(); var an = Math.atan2(e.y - st.y, e.x - st.x); e.x += Math.cos(an) * 14; e.y += Math.sin(an) * 14; } });
        }

        // the enemies
        for (var i2 = st.en.length - 1; i2 >= 0; i2--) {
          var en = st.en[i2], K = KINDS[en.k];
          en.hit -= dt; en.t -= dt;
          if (en.hp <= 0) { kill(st, en); st.en.splice(i2, 1); continue; }
          var tx = st.x - en.x, ty = st.y - en.y, td = Math.hypot(tx, ty) || 1;
          if (en.k === 'knife') {
            if (en.state === 'aim') { en.dx = tx / td; en.dy = ty / td; en.ang = Math.atan2(ty, tx); if (en.t <= 0) { en.state = 'dash'; en.t = 1.1; Sound.whoosh(); } }
            else { en.x += en.dx * 300 * dt; en.y += en.dy * 300 * dt; if (en.t <= 0 || en.x < -40 || en.x > st.W + 40 || en.y < 20 || en.y > st.H + 40) { en.state = 'aim'; en.t = 0.9; } }
          } else {
            var sp = K.sp * (1 + (st.wave - 1) * 0.03);
            en.vx = tx / td * sp; en.vy = ty / td * sp;
            if (en.k === 'chilli') { en.vx += Math.cos(st.t * 5 + en.ph) * 26; en.vy += Math.sin(st.t * 5 + en.ph) * 26; }
            en.x += en.vx * dt; en.y += en.vy * dt;
            if (en.k === 'pot') { en.cd -= dt; if (en.cd <= 0) { en.cd = 2.4; Sound.whoosh(); for (var f = 0; f < 8; f++) { var fa = f * TAU / 8 + st.t; st.fl.push({ x: en.x, y: en.y, vx: Math.cos(fa) * 96, vy: Math.sin(fa) * 96, life: 4 }); } } }
          }
          // soft separation, so a crowd is a crowd and not a stack
          for (var j = i2 - 1; j >= 0 && j > i2 - 8; j--) { var o2 = st.en[j], dd = dist(en.x, en.y, o2.x, o2.y), min = en.r + o2.r - 4; if (dd < min && dd > 0.1 && en.k !== 'knife' && o2.k !== 'knife') { var px = (en.x - o2.x) / dd * (min - dd) * 0.5, py = (en.y - o2.y) / dd * (min - dd) * 0.5; en.x += px; en.y += py; o2.x -= px; o2.y -= py; } }
          if (dist(en.x, en.y, st.x, st.y) < en.r + 9 && (en.k !== 'knife' || en.state === 'dash')) {
            if (st.hurt(st.x, st.y)) { var ka = Math.atan2(en.y - st.y, en.x - st.x); en.x += Math.cos(ka) * 40; en.y += Math.sin(ka) * 40; if (en.k === 'knife') { en.state = 'aim'; en.t = 1; } }
          }
        }
        for (var f2 = st.fl.length - 1; f2 >= 0; f2--) { var fl = st.fl[f2]; fl.x += fl.vx * dt; fl.y += fl.vy * dt; fl.life -= dt; if (fl.life <= 0 || fl.x < -20 || fl.x > st.W + 20 || fl.y < 20 || fl.y > st.H + 20) { st.fl.splice(f2, 1); continue; } if (dist(fl.x, fl.y, st.x, st.y) < 15) { if (st.hurt(st.x, st.y)) st.fl.splice(f2, 1); } }

        // the stars
        for (var gi = st.gems.length - 1; gi >= 0; gi--) {
          var gm = st.gems[gi]; gm.t += dt;
          if (gm.t < 0.35) { gm.x += gm.vx * dt; gm.y += gm.vy * dt; gm.vy += 260 * dt; gm.vx *= 0.96; continue; }
          var gd = dist(gm.x, gm.y, st.x, st.y);
          if (gd < st.mag) { var gs = 260 + (st.mag - gd) * 3; gm.x += (st.x - gm.x) / gd * gs * dt; gm.y += (st.y - gm.y) / gd * gs * dt; }
          if (gd < 14) { st.gems.splice(gi, 1); st.xp++; Sound.coin(); if (st.xp >= st.need) levelUp(st); }
        }
      },
      draw: function (st, g) {
        g.fillStyle = st.floor; g.fillRect(0, 0, st.W, st.H);
        // the edge of the kitchen
        rrect(g, 6, 70, st.W - 12, st.H - 70 - 40, 18); g.lineWidth = 2; g.strokeStyle = T.hair; g.stroke();
        st.gems.forEach(function (gm) { var bob = Math.sin(st.t * 6 + gm.x) * 2; shadow(g, gm.x, gm.y + 8, 6); sprite(g, 'star', gm.x, gm.y + bob, 17, st.t * 2); });
        st.en.forEach(function (e) {
          var K = KINDS[e.k], sq = 1 + Math.sin(st.t * 10 + e.ph) * 0.05;
          shadow(g, e.x, e.y + e.r * 0.8, e.r * 0.9);
          if (e.k === 'knife') {
            if (e.state === 'aim') { g.save(); g.setLineDash([6, 7]); g.strokeStyle = 'rgba(228,87,46,' + (0.35 + 0.4 * Math.sin(st.t * 24)) + ')'; g.lineWidth = 3; g.beginPath(); g.moveTo(e.x, e.y); g.lineTo(e.x + Math.cos(e.ang) * 420, e.y + Math.sin(e.ang) * 420); g.stroke(); g.restore(); }
            sprite(g, 'knife', e.x, e.y, 38, (e.ang || 0) - 2.4 + 0.8 + 0.8);
          } else {
            g.save(); g.translate(e.x, e.y); g.scale(sq, 2 - sq);
            sprite(g, K.spr, 0, 0, e.r * 3, e.hit > 0 ? Math.sin(st.t * 60) * 0.12 : 0);
            if (e.hit > 0) disc(g, 0, 0, e.r * 0.85, 'rgba(255,255,255,.4)', 0);
            g.restore();
            if (e.max > 3 && e.hp < e.max) bar(g, e.x - e.r * 0.9, e.y - e.r - 12, e.r * 1.8, 6, e.hp / e.max, TOMATO);
          }
        });
        st.fl.forEach(function (f) { sprite(g, 'flame', f.x, f.y, 22, Math.sin(st.t * 12 + f.x) * 0.2); });
        st.sh.forEach(function (s) { sprite(g, 'seed', s.x, s.y, 15, s.a); });
        // the plates, round Dot
        for (var o = 0; o < st.orbit; o++) { var oa = st.oa + o * TAU / st.orbit; sprite(g, 'plate', st.x + Math.cos(oa) * 38, st.y + Math.sin(oa) * 38, 24, 0); }
        // Dot
        shadow(g, st.x, st.y + 13, 12);
        var blink = st.inv > 0 && Math.floor(st.t * 16) % 2 === 0;
        if (!blink) { var bounce = 1 + Math.hypot(st.vx, st.vy) / st.spd * Math.sin(st.t * 22) * 0.07; g.save(); g.translate(st.x, st.y); g.scale(1 / bounce, bounce); S.dot(g, 0, 0, 17, st.over ? 'dead' : st.inv > 0 ? 'sad' : st.face); g.restore(); }
        if (st.dashCd > 0) { g.beginPath(); g.arc(st.x, st.y + 2, 26, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - st.dashCd / 1.3)); g.lineWidth = 2; g.strokeStyle = T.hairLit; g.stroke(); }
        if (st.stick) {
          var dx = st.stick.x - st.stick.ax, dy = st.stick.y - st.stick.ay, m = Math.hypot(dx, dy) || 1, kk = Math.min(1, m / 38) * 18;
          disc(g, st.stick.ax, st.stick.ay, 30, 'rgba(255,255,255,.05)', 1.5, T.hairLit);
          disc(g, st.stick.ax + dx / m * kk, st.stick.ay + dy / m * kk, 13, T.amber, 0);
        }
        // xp, along the bottom
        bar(g, 20, st.H - 30, st.W - 40, 14, st.xp / st.need, GOLD);
        text(g, 'LEVEL ' + st.lvl, st.W / 2, st.H - 23, 10, T.ink, 'center', 800, true);
        if (st.banner > 0 && st.phase === 'play') { g.globalAlpha = Math.min(1, st.banner); text(g, st.wave % 5 === 0 ? 'BOSS WAVE ' + st.wave : 'WAVE ' + st.wave, st.W / 2, 130, 32, st.wave % 5 === 0 ? TOMATO : T.ink, 'center', 800, true); g.globalAlpha = 1; }
        if (st.choice) {
          g.fillStyle = T.scrim + '.86)'; g.fillRect(0, 0, st.W, st.H);
          text(g, 'Level up', st.W / 2, 118, 34, T.amber, 'center', 800);
          text(g, 'Pick one', st.W / 2, 148, 14, T.ink3, 'center', 600);
          var cw = 104, gap = 10, x0 = (st.W - (cw * 3 + gap * 2)) / 2;
          st.choice.forEach(function (c, i) {
            var cx = x0 + i * (cw + gap), cy = 190, hov = Math.abs(st.p.x - (cx + cw / 2)) < cw / 2 && st.p.y > cy && st.p.y < cy + 210, rise = easeBack(Math.min(1, (st.t - st.pickAt) * 4 - i * 0.15 > 0 ? (st.t - st.pickAt) * 4 - i * 0.15 : 0));
            st.rects[i] = [cx, cy, cw, 210];
            g.save(); g.translate(cx + cw / 2, cy + 105); g.scale(rise, rise); g.translate(-(cx + cw / 2), -(cy + 105));
            panel(g, cx, cy - (hov ? 4 : 0), cw, 210, 16, T.raise, hov ? T.amber : T.hairLit);
            disc(g, cx + cw / 2, cy + 56 - (hov ? 4 : 0), 34, T.shade + '.4)', 1, T.hair); sprite(g, c.icon, cx + cw / 2, cy + 56 - (hov ? 4 : 0), 48, 0);
            text(g, c.name, cx + cw / 2, cy + 118, 14, T.ink, 'center', 800);
            g.font = '600 12px ' + FONT; g.fillStyle = T.ink2; g.textBaseline = 'middle';
            wrapText(g, c.text, cx + cw / 2, cy + 152, cw - 18, 16, 'center');
            g.restore();
          });
        }
      }
    });
  })();

  /* ================================================================ 2. DOT JUMP */
  /*
   * Up the kitchen, shelf by shelf. Dot bounces by itself and you steer: shelves
   * that crumble once you have stood on them, shelves that slide, jam jars that
   * throw you three times as high, and a flame that patrols higher up. Stars are
   * worth a bite of score; a bolt is a few seconds of flying.
   */
  register({
    id: 'jump', name: 'Dot Jump', blurb: 'Bounce up the kitchen. Do not fall.', color: '#6bb7d6',
    cover: [['dot', 150, 70, 92], ['jar', 260, 150, 66], ['coin', 60, 96, 40, 0.2], ['bolt', 66, 150, 40, 0.1]],
    intro: 'Up we go. Land on the shelves. Do not fall.',
    how: [['dot', 'Drag left and right. Dot bounces on its own.', T.ink], ['jar', 'Jam jars throw you high. Cracked shelves crumble.', '#ffd9c8'], ['bolt', 'A bolt is a few seconds of flying. Mind the flames.', '#fff2a8']],
    lives: 0, stars: [120, 400, 900], overText: 'Splat.',
    notes: ['The floor is very firm.', 'You were so nearly on the shelf.', 'Gravity wins again. It always does.'],
    hud: function (st) { return 'Height ' + st.score; },
    setup: function (st) {
      st.px = st.W / 2; st.py = st.H - 110; st.vy = -680; st.cam = 0; st.coins = 0; st.pl = []; st.items = []; st.en = []; st.fly = 0; st.tx = st.W / 2; st.top = st.H - 70; st.squash = 0; st.lastY = st.py;
      st.pl.push({ x: st.W / 2 - 40, y: st.H - 70, w: 80, t: 'plank' });
      st.wall = floorPattern(st.g, 28);
      st.grab = null;
      gen(st);
    },
    // Relative, not absolute: Dot moves with the thumb instead of leaping to wherever it lands.
    down: function (st, p) { st.grab = { x: p.x, px: st.tx }; },
    move: function (st, p) { if (st.p.down && st.grab) st.tx = st.grab.px + (p.x - st.grab.x) * 1.25; },
    up: function (st) { st.grab = null; },
    update: function (st, dt) {
      var spd = 420, kx = (st.keys.ArrowRight || st.keys.d ? 1 : 0) - (st.keys.ArrowLeft || st.keys.a ? 1 : 0);
      if (kx) st.tx = st.px + kx * 80;
      st.px += (st.tx - st.px) * Math.min(1, 12 * dt);
      if (st.px < -10) { st.px += st.W + 20; st.tx += st.W + 20; } if (st.px > st.W + 10) { st.px -= st.W + 20; st.tx -= st.W + 20; }
      var prevBottom = st.py + 16;
      if (st.fly > 0) { st.fly -= dt; st.vy = -520; if (Math.random() < 0.6) st.burst(st.px, st.py + 18, '#f6c744', 1, { v: 40, up: -60, life: 0.4, r: 3 }); }
      else st.vy += 1750 * dt;
      st.py += st.vy * dt; st.squash = Math.max(0, st.squash - dt * 5);
      if (st.vy > 0 && st.fly <= 0) {
        for (var i = 0; i < st.pl.length; i++) {
          var p = st.pl[i]; if (p.fall) continue;
          if (prevBottom <= p.y + 4 && st.py + 16 >= p.y - 2 && st.px > p.x - 8 && st.px < p.x + p.w + 8) {
            if (p.t === 'crumble') { p.fall = true; p.vy = 0; Sound.thud(); st.burst(p.x + p.w / 2, p.y, '#d8c39a', 8, { sq: true, v: 100 }); }
            st.vy = p.spring ? -1180 : -700; st.py = p.y - 16; st.squash = 1;
            p.spring ? Sound.boing() : Sound.jump(); if (p.spring) st.burst(st.px, p.y, '#6bb7d6', 8, { v: 120 });
            break;
          }
        }
      }
      st.pl.forEach(function (p) {
        if (p.t === 'move') { p.x += p.dx * dt; if (p.x < 6 || p.x + p.w > st.W - 6) p.dx = -p.dx; }
        if (p.fall) { p.vy += 1400 * dt; p.y += p.vy * dt; }
      });
      st.items.forEach(function (it) {
        if (it.got) return;
        if (dist(it.x, it.y, st.px, st.py) < 24) { it.got = true; if (it.k === 'coin') { st.coins++; Sound.coin(); st.burst(it.x, it.y, '#f6c744', 8, { v: 110 }); st.pop(it.x, it.y - 8, '+25', T.ink); } else { st.fly = 2.6; Sound.whoosh(); st.burst(it.x, it.y, '#f6c744', 14, { v: 160 }); } }
      });
      st.en.forEach(function (e) {
        e.x += e.dx * dt; if (e.x < 20 || e.x > st.W - 20) e.dx = -e.dx;
        if (dist(e.x, e.y, st.px, st.py) < 24 && st.fly <= 0) { st.burst(st.px, st.py, '#e4572e', 16, { v: 200 }); st.end(); }
      });
      var target = st.py - st.H * 0.42; if (target < st.cam) st.cam += (target - st.cam) * Math.min(1, 9 * dt);
      st.hgt = Math.max(st.hgt || 0, Math.round(-st.cam / 8)); st.score = st.hgt + st.coins * 25;
      gen(st);
      st.pl = st.pl.filter(function (p) { return p.y < st.cam + st.H + 140; });
      st.items = st.items.filter(function (it) { return !it.got && it.y < st.cam + st.H + 60; });
      if (st.py - st.cam > st.H + 30) { st.end(); }
    },
    draw: function (st, g) {
      var cam = st.cam;
      g.fillStyle = st.wall; g.fillRect(0, 0, st.W, st.H);
      // far shelves, going by slower than the near ones: the pantry behind
      var off = (cam * 0.35) % 190;
      for (var k = -1; k < 5; k++) {
        var sy = k * 190 - off + 120; g.fillStyle = T.hair; g.globalAlpha = 0.55; g.fillRect(20, sy, st.W - 40, 6);
        for (var j = 0; j < 4; j++) { g.globalAlpha = 0.3; rrect(g, 36 + j * 80, sy - 32 - (j % 2) * 10, 38, 32 + (j % 2) * 10, 6); g.fill(); }
        g.globalAlpha = 1;
      }
      st.pl.forEach(function (p) {
        var y = p.y - cam; if (y < -30 || y > st.H + 30) return;
        var top = p.t === 'crumble' ? '#d8c39a' : p.t === 'move' ? '#7fb7d1' : '#d9984f', under = p.t === 'crumble' ? '#a89470' : p.t === 'move' ? '#4f86a3' : '#a8702e';
        g.save(); if (p.fall) { g.translate(p.x + p.w / 2, y); g.rotate(p.vy * 0.0016); g.translate(-p.w / 2, 0); } else g.translate(p.x, y);
        rrect(g, 0, 3, p.w, 11, 5); g.fillStyle = under; g.fill();
        rrect(g, 0, 0, p.w, 10, 5); g.fillStyle = top; g.fill();
        g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(6, 2, p.w - 12, 2);
        if (p.t === 'crumble') { g.strokeStyle = T.edge; g.lineWidth = 2; g.beginPath(); g.moveTo(p.w * 0.4, 0); g.lineTo(p.w * 0.46, 6); g.lineTo(p.w * 0.38, 12); g.stroke(); }
        if (p.spring) sprite(g, 'jar', p.w / 2, -14, 36, 0);
        g.restore();
      });
      st.items.forEach(function (it) { if (it.got) return; var y = it.y - cam + Math.sin(st.t * 5 + it.x) * 3; if (it.k === 'coin') { g.save(); g.translate(it.x, y); g.scale(Math.abs(Math.cos(st.t * 4 + it.x)) * 0.8 + 0.2, 1); sprite(g, 'coin', 0, 0, 28, 0); g.restore(); } else sprite(g, 'bolt', it.x, y, 32, Math.sin(st.t * 6) * 0.2); });
      st.en.forEach(function (e) { var y = e.y - cam; shadow(g, e.x, y + 22, 14); sprite(g, 'flame', e.x, y, 38, Math.sin(st.t * 14 + e.x) * 0.12); });
      // Dot, stretched going up and squashed on landing
      var sy2 = 1 + clamp(-st.vy / 2400, -0.12, 0.18) + st.squash * -0.18, sx = 2 - sy2;
      g.save(); g.translate(st.px, st.py - st.cam + 16); g.scale(sx, sy2);
      if (st.fly > 0) { sprite(g, 'bolt', -20, -8, 22, -0.6); sprite(g, 'bolt', 20, -8, 22, 0.6); }
      S.dot(g, 0, -17, 18, st.over ? 'dead' : st.vy < 0 ? 'open' : 'smile');
      g.restore();
    }
  });
  function gen(st) {
    while (st.top > st.cam - 140) {
      var h2 = -st.top, gap = rnd(62, Math.min(124, 78 + h2 / 70));
      st.top -= gap;
      var roll = Math.random(), t = 'plank', w = rnd(54, 70);
      var crumbleP = Math.min(0.32, h2 / 5000), moveP = Math.min(0.28, 0.05 + h2 / 6000);
      if (roll < crumbleP) t = 'crumble'; else if (roll < crumbleP + moveP) t = 'move';
      var p = { x: rnd(8, st.W - 8 - w), y: st.top, w: w, t: t, dx: t === 'move' ? (Math.random() < 0.5 ? -1 : 1) * rnd(40, 80) : 0 };
      if (t === 'plank' && Math.random() < 0.07) p.spring = true;
      st.pl.push(p);
      if (!p.spring && Math.random() < 0.3) st.items.push({ k: 'coin', x: p.x + p.w / 2, y: p.y - 30 });
      else if (!p.spring && h2 > 600 && Math.random() < 0.025) st.items.push({ k: 'bolt', x: p.x + p.w / 2, y: p.y - 34 });
      if (h2 > 500 && Math.random() < Math.min(0.1, h2 / 12000)) st.en.push({ x: rnd(30, st.W - 30), y: st.top - 40, dx: (Math.random() < 0.5 ? -1 : 1) * rnd(40, 70) });
    }
    st.en = st.en.filter(function (e) { return e.y < st.cam + st.H + 100; });
  }

  /* ================================================================= 3. MERGE POT */
  /*
   * Drop food into the jar. Two of the same merge into the next one up, all the
   * way to a crown. The jar is real: the pieces have weight, roll off each other
   * and settle, so a good drop sets up the next one and a careless one wedges a
   * big piece against a small one that cannot move. If the pile stays over the
   * line for long enough, that is the game.
   */
  register({
    id: 'merge', name: 'Merge Pot', blurb: 'Drop food. Merge twins up to a crown.', color: GOLD,
    cover: [['cherry', 80, 150, 44], ['lemon', 130, 146, 56], ['tomato', 190, 140, 70, 0.2], ['pizza', 250, 110, 74, -0.2], ['crown', 160, 70, 60]],
    intro: 'Drop. Merge. Climb from a cherry to a crown. Mind the rim.',
    how: [['cherry', 'Move, then let go to drop. Two of a kind merge.', '#ffd9d9'], ['crown', 'Keep merging all the way up to the crown.', '#fff2a8'], ['heart', 'If the pile stays over the line, it is over.', '#ffd9c8']],
    lives: 0, stars: [140, 420, 900], overText: 'Overflowing.',
    notes: ['The jar is full. I did say.', 'So close to a crown.', 'One more cherry would have fixed it. Probably.'],
    setup: function (st) {
      st.LV = [
        { r: 13, s: 'cherry', pts: 1 }, { r: 18, s: 'lemon', pts: 3 }, { r: 24, s: 'tomato', pts: 6 }, { r: 30, s: 'apple', pts: 10 }, { r: 37, s: 'onion', pts: 15 },
        { r: 44, s: 'donut', pts: 21 }, { r: 52, s: 'pizza', pts: 28 }, { r: 60, s: 'burger', pts: 36 }, { r: 68, s: 'cake', pts: 45 }, { r: 76, s: 'crown', pts: 120 }
      ];
      st.jx0 = 34; st.jx1 = st.W - 34; st.floor = st.H - 62; st.line = 168;
      st.b = []; st.aim = st.W / 2; st.cool = 0; st.next = rl(); st.cur = rl(); st.over_t = 0; st.combo = 0; st.comboT = 0; st.id = 0; st.maxL = 0;
      st.wall = floorPattern(st.g, 28);
      function rl() { var r = Math.random(); return r < 0.4 ? 0 : r < 0.72 ? 1 : r < 0.92 ? 2 : 3; }
      st.rl = rl;
    },
    down: function (st, p) { st.aim = p.x; },
    move: function (st, p) { if (st.p.down) st.aim = p.x; },
    up: function (st, p) { st.aim = p.x; drop(st); },
    key: function (st, e) { if (e.key === ' ' || e.key === 'ArrowDown') drop(st); },
    update: function (st, dt) {
      var kx = (st.keys.ArrowRight ? 1 : 0) - (st.keys.ArrowLeft ? 1 : 0); if (kx) st.aim += kx * 220 * dt;
      st.cool -= dt; st.comboT -= dt; if (st.comboT <= 0) st.combo = 0;
      var SUB = 4, h = dt / SUB;
      for (var s = 0; s < SUB; s++) {
        st.b.forEach(function (o) {
          o.vy += 1100 * h; o.x += o.vx * h; o.y += o.vy * h; o.rot += o.vx * h * 0.012;
          var L = st.jx0 + o.r, R = st.jx1 - o.r;
          if (o.x < L) { o.x = L; o.vx = Math.abs(o.vx) * 0.3; } if (o.x > R) { o.x = R; o.vx = -Math.abs(o.vx) * 0.3; }
          if (o.y > st.floor - o.r) { o.y = st.floor - o.r; o.vy = -Math.abs(o.vy) * 0.18; o.vx *= 0.985; if (Math.abs(o.vy) < 14) o.vy = 0; }
        });
        for (var i = 0; i < st.b.length; i++) for (var j = i + 1; j < st.b.length; j++) {
          var a = st.b[i], c = st.b[j]; if (a.dead || c.dead) continue;
          var dx = c.x - a.x, dy = c.y - a.y, d = Math.hypot(dx, dy), min = a.r + c.r;
          if (d >= min || d < 0.001) continue;
          if (a.l === c.l && a.l < 9 && a.age > 0.08 && c.age > 0.08) { mergeInto(st, a, c); continue; }
          if (a.l === 9 && c.l === 9) { mergeInto(st, a, c); continue; }
          var nx = dx / d, ny = dy / d, over = min - d, ma = a.r * a.r, mc = c.r * c.r, tot = ma + mc;
          a.x -= nx * over * (mc / tot); a.y -= ny * over * (mc / tot); c.x += nx * over * (ma / tot); c.y += ny * over * (ma / tot);
          var rvx = c.vx - a.vx, rvy = c.vy - a.vy, vn = rvx * nx + rvy * ny;
          if (vn < 0) { var imp = -(1 + 0.12) * vn / (1 / ma + 1 / mc); a.vx -= imp * nx / ma; a.vy -= imp * ny / ma; c.vx += imp * nx / mc; c.vy += imp * ny / mc;
            var tx = -ny, ty = nx, vt = rvx * tx + rvy * ty; a.vx += tx * vt * 0.02; a.vy += ty * vt * 0.02; c.vx -= tx * vt * 0.02; c.vy -= ty * vt * 0.02; }
        }
        st.b = st.b.filter(function (o) { return !o.dead; });
      }
      st.b.forEach(function (o) { o.age += dt; o.pop = Math.max(0, o.pop - dt * 4); });
      // over the line for long enough
      var above = st.b.some(function (o) { return o.age > 1.1 && o.y - o.r < st.line && Math.abs(o.vy) < 60; });
      st.over_t = above ? st.over_t + dt : Math.max(0, st.over_t - dt * 2);
      if (st.over_t > 2.2) st.end();
    },
    draw: function (st, g) {
      g.fillStyle = st.wall; g.fillRect(0, 0, st.W, st.H);
      // the counter, with the line of what a cherry grows into along it
      g.fillStyle = T.floor; g.fillRect(0, st.H - 56, st.W, 56); g.fillStyle = T.hair; g.fillRect(0, st.H - 56, st.W, 2);
      var n = st.LV.length, x0c = 26, step = (st.W - 52) / (n - 1);
      for (var q = 0; q < n; q++) {
        var cx2 = x0c + q * step, reached = q <= Math.max(st.maxL, 3);
        g.globalAlpha = reached ? 1 : 0.38; sprite(g, st.LV[q].s, cx2, st.H - 26, 14 + q * 1.4, 0); g.globalAlpha = 1;
        if (q < n - 1) { g.fillStyle = T.hairLit; g.fillRect(cx2 + 10 + q * 0.7, st.H - 26, step - 20 - q * 1.4, 1.5); }
      }
      // the jar
      var x0 = st.jx0, x1 = st.jx1, top = 124;
      g.fillStyle = T.raise; g.globalAlpha = 0.7; rrect(g, x0, top, x1 - x0, st.floor - top, 14); g.fill(); g.globalAlpha = 1;
      // the line
      var warn = st.over_t > 0; g.save(); g.setLineDash([8, 8]); g.lineWidth = 2.5; g.strokeStyle = warn ? 'rgba(228,87,46,' + (0.5 + 0.5 * Math.sin(st.t * 14)) + ')' : T.hairLit; g.beginPath(); g.moveTo(x0, st.line); g.lineTo(x1, st.line); g.stroke(); g.restore();
      st.b.forEach(function (o) {
        var L = st.LV[o.l], sc = 1 + o.pop * 0.25; shadow(g, o.x, st.floor + 2, o.r * 0.5, 3);
        sprite(g, L.s, o.x, o.y, o.r * 2.2 * sc, o.rot);
      });
      // the glass, over everything in the jar
      g.lineWidth = 3; g.strokeStyle = T.hairLit; g.lineJoin = 'round'; g.beginPath(); g.moveTo(x0 - 5, top - 8); g.lineTo(x0, top); g.lineTo(x0, st.floor - 10); g.quadraticCurveTo(x0, st.floor, x0 + 12, st.floor); g.lineTo(x1 - 12, st.floor); g.quadraticCurveTo(x1, st.floor, x1, st.floor - 10); g.lineTo(x1, top); g.lineTo(x1 + 5, top - 8); g.stroke();
      g.fillStyle = 'rgba(255,255,255,.07)'; rrect(g, x0 + 7, top + 12, 6, 170, 3); g.fill();
      // what is in hand, and where it will go
      var cur = st.LV[st.cur], ax = clamp(st.aim, x0 + cur.r + 2, x1 - cur.r - 2);
      if (st.cool <= 0) {
        var below = st.floor, aimR = cur.r;
        st.b.forEach(function (o) { var dxx = Math.abs(o.x - ax); if (dxx < o.r + aimR - 2) { var yy = o.y - Math.sqrt(Math.max(0, Math.pow(o.r + aimR, 2) - dxx * dxx)); if (yy < below) below = yy; } });
        if (below === st.floor) below = st.floor - aimR;
        g.save(); g.setLineDash([3, 8]); g.lineCap = 'round'; g.lineWidth = 2.5; g.strokeStyle = T.ink3; g.beginPath(); g.moveTo(ax, 96 + cur.r); g.lineTo(ax, below - aimR); g.stroke(); g.restore();
        g.globalAlpha = 0.22; sprite(g, cur.s, ax, below, cur.r * 2.2, 0); g.globalAlpha = 1;
        sprite(g, cur.s, ax, 84, cur.r * 2.2, Math.sin(st.t * 3) * 0.08);
      } else { g.globalAlpha = Math.max(0, 1 - st.cool * 3); sprite(g, cur.s, ax, 84, cur.r * 2.2, 0); g.globalAlpha = 1; }
      // next
      pill(g, 8, 50, 70, 34, T.shade + '.5)', T.hair); text(g, 'NEXT', 26, 67, 10, T.ink3, 'center', 700); sprite(g, st.LV[st.next].s, 56, 67, 24, 0);
      if (st.combo > 1) { text(g, 'x' + st.combo + ' combo', st.W / 2, 196, 22, GOLD, 'center', 800, true); }
    }
  });
  function drop(st) {
    if (st.cool > 0 || st.phase !== 'play') return;
    var L = st.LV[st.cur], x = clamp(st.aim, st.jx0 + L.r + 2, st.jx1 - L.r - 2);
    st.b.push({ x: x, y: 96 + L.r * 0.4, vx: 0, vy: 40, r: L.r, l: st.cur, rot: 0, age: 0, pop: 0, id: st.id++ });
    st.cur = st.next; st.next = st.rl(); st.cool = 0.45; Sound.tone(300 + st.cur * 40, 0.06, 'triangle', 0.09);
  }
  function mergeInto(st, a, c) {
    var l = a.l, nl = Math.min(9, l + 1), N = st.LV[nl];
    a.dead = c.dead = true;
    if (a.l === 9) { st.score += 400; st.pop(a.x, a.y, '+400', '#f6c744'); st.burst((a.x + c.x) / 2, (a.y + c.y) / 2, '#f6c744', 40, { v: 260 }); st.flash = 0.7; st.rumble(12); Sound.win(); return; }
    var nb = { x: (a.x + c.x) / 2, y: (a.y + c.y) / 2, vx: (a.vx + c.vx) / 2, vy: (a.vy + c.vy) / 2 - 20, r: N.r, l: nl, rot: 0, age: 0.2, pop: 1, id: st.id++ };
    st.b.push(nb);
    st.combo = st.comboT > 0 ? st.combo + 1 : 1; st.comboT = 0.9;
    var pts = N.pts * (st.combo > 1 ? st.combo : 1);
    st.score += pts; st.pop(nb.x, nb.y - N.r * 0.5, '+' + pts, st.combo > 1 ? '#f6c744' : T.ink);
    st.burst(nb.x, nb.y, T.ink, 10 + nl * 2, { v: 130 + nl * 12, r: 3 }); Sound.merge(nl); st.hit(nl > 4 ? 60 : 20);
    if (nl > 3) st.rumble(3 + nl); if (nl > st.maxL) { st.maxL = nl; if (nl >= 5) D.Dot.mood(dotEl, 'celebrate', 900); }
  }

  /* ================================================================== 4. DISH POP */
  /*
   * A bubble shooter with a plate of five foods instead of five colours. Aim, let
   * go, match three or more, and whatever was hanging off what you cleared falls
   * with it. Every few shots the ceiling comes down a row, faster as you go, and
   * the game is over when the cluster reaches the line above the cannon. Each
   * food has its own colour AND its own picture, so it can be read either way.
   */
  (function () {
    var KINDS = [{ s: 'tomato', c: '#e4572e' }, { s: 'lemon', c: '#f7dc4b' }, { s: 'pepper', c: '#6fbf5e' }, { s: 'aubergine', c: '#8c5fa8' }, { s: 'fish', c: '#6bb7d6' }];
    var R = 18, D = 36, RH = 31.2, COLS = 9, ROWS = 14;

    function shift(st, row) { return (row + st.par) % 2; }
    function cols(st, row) { return shift(st, row) ? COLS - 1 : COLS; }
    function cell(st, row, col) { return { x: st.gx + col * D + R + (shift(st, row) ? R : 0), y: st.gy + row * RH + R }; }
    function nbrs(st, row, col) {
      var s = shift(st, row), out = [[row, col - 1], [row, col + 1]];
      var up = s ? [col, col + 1] : [col - 1, col], dn = up;
      up.forEach(function (c) { out.push([row - 1, c]); }); dn.forEach(function (c) { out.push([row + 1, c]); });
      return out.filter(function (n) { return n[0] >= 0 && n[0] < ROWS + 2 && n[1] >= 0 && n[1] < cols(st, n[0]); });
    }
    function at(st, r, c) { return st.grid[r] ? st.grid[r][c] : -1; }
    function present(st) { var seen = {}; st.grid.forEach(function (row) { row.forEach(function (v) { if (v >= 0) seen[v] = 1; }); }); var l = Object.keys(seen).map(Number); return l.length ? l : [0, 1, 2]; }
    function newRow(st, row) { var a = []; for (var c = 0; c < cols(st, row); c++) a.push(rint(0, 4)); return a; }
    function ball() { return { k: rint(0, 4) }; }
    function draw1(g, k, x, y, rr, rot) {
      var K = KINDS[k]; disc(g, x, y, rr, K.c, 1.5, T.edge); g.fillStyle = 'rgba(255,255,255,.28)'; g.beginPath(); g.arc(x - rr * 0.3, y - rr * 0.35, rr * 0.26, 0, TAU); g.fill();
      sprite(g, K.s, x, y + 1, rr * 1.35, rot || 0);
    }

        register({
      id: 'pop', name: 'Dish Pop', blurb: 'Aim, bounce, match three. Drop the lot.', color: '#a07ac0',
      cover: [['tomato', 70, 70, 56], ['lemon', 124, 100, 56], ['pepper', 180, 70, 56], ['aubergine', 240, 100, 56], ['fish', 160, 150, 60]],
      intro: 'Aim, bounce, match three. Bring the ceiling down.',
      how: [['tomato', 'Drag to aim, let go to shoot. It bounces off the walls.', '#ffd9c8'], ['lemon', 'Three of a kind pop. What they held up falls too.', '#fff2a8'], ['fish', 'Tap the next one to swap. The ceiling creeps down.', '#d6ecf5']],
      lives: 0, stars: [400, 1200, 2600], overText: 'Crowded.',
      notes: ['The ceiling won. It usually does.', 'So many aubergines. Never enough fish.', 'One more shot would have done it.'],
      setup: function (st) {
        st.gx = (st.W - COLS * D) / 2; st.gy = 62; st.par = 0; st.grid = []; st.fly = null; st.fall = []; st.gone = []; st.shots = 0; st.every = 7; st.cx = st.W / 2; st.cy = st.H - 84;
        for (var r = 0; r < 6; r++) st.grid.push(newRow(st, r));
        for (var e = 6; e < ROWS + 2; e++) st.grid.push([]);
        st.cur = ball(); st.next = ball(); st.aim = -Math.PI / 2; st.cool = 0; st.chain = 0;
        st.bg = floorPattern(st.g, 28);
      },
      down: function (st, p) { if (dist(p.x, p.y, st.cx + 59, st.cy + 11) < 36) { var t = st.cur; st.cur = st.next; st.next = t; Sound.swap(); return; } aim(st, p); },
      move: function (st, p) { if (st.p.down) aim(st, p); },
      up: function (st, p) { aim(st, p); shoot(st); },
      key: function (st, e) { if (e.key === 'ArrowLeft') st.aim = clamp(st.aim - 0.08, -Math.PI + 0.2, -0.2); if (e.key === 'ArrowRight') st.aim = clamp(st.aim + 0.08, -Math.PI + 0.2, -0.2); if (e.key === ' ' || e.key === 'ArrowUp') shoot(st); },
      update: function (st, dt) {
        st.cool -= dt;
        if (st.fly) {
          var f = st.fly, steps = Math.ceil(620 * dt / 5), sd = dt / steps;
          for (var i = 0; i < steps && st.fly; i++) {
            f.x += f.vx * sd; f.y += f.vy * sd;
            if (f.x < st.gx + R) { f.x = st.gx + R; f.vx = Math.abs(f.vx); Sound.tone(520, 0.03, 'triangle', 0.05); }
            if (f.x > st.gx + COLS * D - R) { f.x = st.gx + COLS * D - R; f.vx = -Math.abs(f.vx); Sound.tone(520, 0.03, 'triangle', 0.05); }
            var stop = f.y <= st.gy + R;
            if (!stop) for (var r = 0; r < st.grid.length && !stop; r++) for (var c = 0; c < st.grid[r].length; c++) if (st.grid[r][c] >= 0) { var q = cell(st, r, c); if (dist(f.x, f.y, q.x, q.y) < D * 0.86) { stop = true; break; } }
            if (stop) land(st, f);
          }
        }
        for (var j = st.fall.length - 1; j >= 0; j--) { var b = st.fall[j]; b.vy += 1300 * dt; b.y += b.vy * dt; b.x += b.vx * dt; b.rot += dt * b.vx * 0.02; if (b.y > st.H + 40) st.fall.splice(j, 1); }
        for (var k = st.gone.length - 1; k >= 0; k--) { st.gone[k].t += dt; if (st.gone[k].t > 0.22) st.gone.splice(k, 1); }
        // lose: anything in the last rows
        for (var rr = ROWS - 1; rr < st.grid.length; rr++) if (st.grid[rr].some(function (v) { return v >= 0; })) { st.end(); break; }
      },
      draw: function (st, g) {
        g.fillStyle = st.bg; g.fillRect(0, 0, st.W, st.H);
        // the ceiling
        rrect(g, st.gx - 6, 52, COLS * D + 12, 9, 4); g.fillStyle = T.hairLit; g.fill();
        // the line
        g.save(); g.setLineDash([8, 8]); g.lineWidth = 2.5; g.strokeStyle = 'rgba(228,87,46,.6)'; var ly = st.gy + (ROWS - 1) * RH; g.beginPath(); g.moveTo(st.gx, ly); g.lineTo(st.gx + COLS * D, ly); g.stroke(); g.restore();
        for (var r = 0; r < st.grid.length; r++) for (var c = 0; c < st.grid[r].length; c++) { var v = st.grid[r][c]; if (!(v >= 0)) continue; var q = cell(st, r, c); draw1(g, v, q.x, q.y, R - 1, 0); }
        st.gone.forEach(function (p) { var k = 1 - p.t / 0.22; draw1(g, p.k, p.x, p.y, (R - 1) * (0.4 + 0.9 * (1 - k)), 0); g.globalAlpha = 1; });
        st.fall.forEach(function (b) { draw1(g, b.k, b.x, b.y, R - 1, b.rot); });
        // the aim
        if (!st.fly && st.phase === 'play') {
          var x = st.cx, y = st.cy, a = st.aim, vx = Math.cos(a), vy = Math.sin(a), bounces = 0;
          g.fillStyle = T.amber;
          for (var s = 0; s < 120 && bounces < 3; s++) {
            x += vx * 7; y += vy * 7;
            if (x < st.gx + R) { x = st.gx + R; vx = Math.abs(vx); bounces++; } if (x > st.gx + COLS * D - R) { x = st.gx + COLS * D - R; vx = -Math.abs(vx); bounces++; }
            var hit = y <= st.gy + R;
            if (!hit) outer: for (var rr = 0; rr < st.grid.length; rr++) for (var cc = 0; cc < st.grid[rr].length; cc++) if (st.grid[rr][cc] >= 0) { var qq = cell(st, rr, cc); if (dist(x, y, qq.x, qq.y) < D * 0.86) { hit = true; break outer; } }
            if (hit) break;
            if (s % 2 === 0) { g.globalAlpha = Math.max(0.2, 0.8 - s / 110); g.beginPath(); g.arc(x, y, 2.6, 0, TAU); g.fill(); }
          }
          g.globalAlpha = 1;
        }
        // the cannon
        shadow(g, st.cx, st.cy + 24, 28, 8);
        g.save(); g.translate(st.cx, st.cy); g.rotate(st.aim + Math.PI / 2); rrect(g, -9, -42, 18, 44, 7); g.fillStyle = T.amber; g.fill(); g.lineWidth = 1.5; g.strokeStyle = T.edge; g.stroke(); g.restore();
        S.dot(g, st.cx, st.cy + 8, 22, st.fly ? 'open' : 'smile');
        if (!st.fly && st.cool <= 0) draw1(g, st.cur.k, st.cx, st.cy - 2, R - 1, 0);
        if (st.fly) draw1(g, st.fly.k, st.fly.x, st.fly.y, R - 1, 0);
        // next, tap to swap
        pill(g, st.cx + 30, st.cy - 8, 58, 38, T.shade + '.5)', T.hair); draw1(g, st.next.k, st.cx + 59, st.cy + 11, 11, 0);
        text(g, 'TAP TO SWAP', st.cx + 59, st.cy - 16, 8, T.ink3, 'center', 700);
        // how long until the ceiling comes down
        var left = st.every - (st.shots % st.every);
        for (var i = 0; i < st.every; i++) { g.fillStyle = i < st.every - left ? T.amber : T.hair; g.beginPath(); g.arc(18 + i * 12, st.H - 22, 4, 0, TAU); g.fill(); }
        text(g, 'ceiling comes down', 18 + st.every * 12 + 10, st.H - 22, 10, T.ink3, 'left', 600);
      }
    });
    function aim(st, p) {
      var a = Math.atan2(p.y - st.cy, p.x - st.cx);
      st.aim = clamp(a, -Math.PI + 0.22, -0.22);
    }
    function shoot(st) {
      if (st.fly || st.cool > 0 || st.phase !== 'play' || st.over) return;
      st.fly = { x: st.cx, y: st.cy - 4, vx: Math.cos(st.aim) * 620, vy: Math.sin(st.aim) * 620, k: st.cur.k };
      Sound.shoot(); st.cur = st.next; st.next = { k: pick(present(st)) }; st.cool = 0.12;
    }
    function land(st, f) {
      var best = null, bd = 1e9;
      for (var r = 0; r < ROWS + 1; r++) for (var c = 0; c < cols(st, r); c++) {
        if (at(st, r, c) >= 0) continue;
        var q = cell(st, r, c), d = dist(f.x, f.y, q.x, q.y);
        var touch = r === 0 || nbrs(st, r, c).some(function (n) { return at(st, n[0], n[1]) >= 0; });
        if (touch && d < bd) { bd = d; best = [r, c]; }
      }
      st.fly = null;
      if (!best) return;
      while (st.grid.length <= best[0]) st.grid.push([]);
      var row = st.grid[best[0]]; for (var i = 0; i < cols(st, best[0]); i++) if (row[i] === undefined) row[i] = -1;
      row[best[1]] = f.k; Sound.thud(); st.shots++;
      // match
      var seen = {}, stack = [best], group = [];
      seen[best[0] + ',' + best[1]] = 1;
      while (stack.length) { var cur = stack.pop(); group.push(cur); nbrs(st, cur[0], cur[1]).forEach(function (n) { var key = n[0] + ',' + n[1]; if (!seen[key] && at(st, n[0], n[1]) === f.k) { seen[key] = 1; stack.push(n); } }); }
      if (group.length >= 3) {
        group.forEach(function (n) { var q = cell(st, n[0], n[1]); st.gone.push({ x: q.x, y: q.y, k: f.k, t: 0 }); st.burst(q.x, q.y, KINDS[f.k].c, 6, { v: 150 }); st.grid[n[0]][n[1]] = -1; });
        var pts = group.length * 10 + (group.length - 3) * 15; st.score += pts; st.pop(f.x, f.y, '+' + pts, T.ink); Sound.pop(Math.min(8, group.length)); st.hit(25);
        // what is left hanging
        var held = {}, q2 = [];
        (st.grid[0] || []).forEach(function (v, c) { if (v >= 0) { held['0,' + c] = 1; q2.push([0, c]); } });
        while (q2.length) { var h2 = q2.pop(); nbrs(st, h2[0], h2[1]).forEach(function (n) { var k2 = n[0] + ',' + n[1]; if (!held[k2] && at(st, n[0], n[1]) >= 0) { held[k2] = 1; q2.push(n); } }); }
        var dropped = 0;
        for (var rr = 0; rr < st.grid.length; rr++) for (var cc = 0; cc < st.grid[rr].length; cc++) if (st.grid[rr][cc] >= 0 && !held[rr + ',' + cc]) { var qd = cell(st, rr, cc); st.fall.push({ x: qd.x, y: qd.y, vx: rnd(-50, 50), vy: rnd(-200, -60), k: st.grid[rr][cc], rot: 0 }); st.grid[rr][cc] = -1; dropped++; }
        if (dropped) { var bonus = dropped * 20 + (dropped > 4 ? dropped * 10 : 0); st.score += bonus; st.pop(st.W / 2, 200, 'Drop! +' + bonus, '#f6c744'); st.rumble(5 + dropped); Sound.merge(Math.min(6, dropped)); }
        var left = st.grid.reduce(function (n, row) { return n + row.filter(function (v) { return v >= 0; }).length; }, 0);
        if (!left) { st.score += 500; st.pop(st.W / 2, 220, 'Clear! +500', '#f6c744'); Sound.win(); st.flash = 0.6; for (var nr = 0; nr < 5; nr++) { st.grid.unshift(newRow(st, 0)); st.par ^= 1; } st.grid.length = ROWS + 2; D1(st); }
      }
      if (st.shots % st.every === 0) { st.grid.unshift(newRow(st, 0)); st.par ^= 1; st.grid.length = Math.max(st.grid.length, ROWS + 2); st.rumble(4); Sound.thud(); st.every = Math.max(4, 7 - Math.floor(st.score / 900)); }
      st.cool = 0.1;
      var live = present(st); if (live.indexOf(st.cur.k) < 0) st.cur = { k: pick(live) }; if (live.indexOf(st.next.k) < 0) st.next = { k: pick(live) };
    }
    function D1(st) { st.grid.forEach(function (row, r) { while (row.length < cols(st, r) && r < 6) row.push(rint(0, 4)); }); }
  })();

  /* ================================================================ 5. MATCH MEAL */
  /*
   * Sixty seconds of swap-and-match on a board of seven foods... six, in fact:
   * each with its own colour and its own picture. Four in a row makes a chilli
   * (it takes out its whole line), five makes a star (it takes out every tile of
   * the colour it is swapped with), and an L or a T makes a pot (a blast three
   * wide). Cascades multiply, the big ones add time, and if there is no move left
   * the board reshuffles rather than leaving you stuck.
   */
  (function () {
    var KINDS = [{ s: 'tomato', c: '#e4572e' }, { s: 'lemon', c: '#f7dc4b' }, { s: 'pepper', c: '#6fbf5e' }, { s: 'aubergine', c: '#8c5fa8' }, { s: 'fish', c: '#6bb7d6' }, { s: 'carrot', c: '#f08a2a' }];
    var NC = 7, NR = 9, CS = 48, TIME = 60;

    function pos(st, r, c) { return { x: st.gx + c * CS + CS / 2, y: st.gy + r * CS + CS / 2 }; }
    function mk(st, r, c, k, fromAbove) {
      var p = pos(st, r, c);
      return { k: k === undefined ? rint(0, 5) : k, sp: null, x: p.x, y: fromAbove ? p.y - NR * CS - rnd(0, 60) : p.y, vy: 0, s: 1, dead: false };
    }
    function runs(st) {
      var cells = {}, lines = [];
      function mark(r, c) { cells[r + ',' + c] = [r, c]; }
      for (var r = 0; r < NR; r++) { var c = 0; while (c < NC) { var t = st.cells[r][c]; if (!t) { c++; continue; } var e = c; while (e + 1 < NC && st.cells[r][e + 1] && st.cells[r][e + 1].k === t.k) e++; if (e - c >= 2) { lines.push({ dir: 'h', r: r, c: c, n: e - c + 1, k: t.k }); for (var i = c; i <= e; i++) mark(r, i); } c = e + 1; } }
      for (var c2 = 0; c2 < NC; c2++) { var r2 = 0; while (r2 < NR) { var t2 = st.cells[r2][c2]; if (!t2) { r2++; continue; } var e2 = r2; while (e2 + 1 < NR && st.cells[e2 + 1][c2] && st.cells[e2 + 1][c2].k === t2.k) e2++; if (e2 - r2 >= 2) { lines.push({ dir: 'v', r: r2, c: c2, n: e2 - r2 + 1, k: t2.k }); for (var j = r2; j <= e2; j++) mark(j, c2); } r2 = e2 + 1; } }
      return { cells: cells, lines: lines };
    }
    function anyMove(st) { return findMove(st) !== null; }
    function swapCells(st, a, b) { var t = st.cells[a[0]][a[1]]; st.cells[a[0]][a[1]] = st.cells[b[0]][b[1]]; st.cells[b[0]][b[1]] = t; }
    function findMove(st) {
      for (var r = 0; r < NR; r++) for (var c = 0; c < NC; c++) {
        var ds = [[0, 1], [1, 0]];
        for (var d = 0; d < 2; d++) {
          var r2 = r + ds[d][0], c2 = c + ds[d][1]; if (r2 >= NR || c2 >= NC) continue;
          var a = st.cells[r][c], b = st.cells[r2][c2]; if (!a || !b) continue;
          if (a.sp === 'color' || b.sp === 'color') return [[r, c], [r2, c2]];
          swapCells(st, [r, c], [r2, c2]); var ok = Object.keys(runs(st).cells).length > 0; swapCells(st, [r, c], [r2, c2]);
          if (ok) return [[r, c], [r2, c2]];
        }
      }
      return null;
    }
    function fill(st) {
      st.cells = [];
      for (var r = 0; r < NR; r++) { st.cells.push([]); for (var c = 0; c < NC; c++) { var k; do { k = rint(0, 5); } while ((c >= 2 && st.cells[r][c - 1].k === k && st.cells[r][c - 2].k === k) || (r >= 2 && st.cells[r - 1][c].k === k && st.cells[r - 2][c].k === k)); st.cells[r].push(mk(st, r, c, k, true)); } }
    }
    function addTime(st, n) { st.time = Math.min(TIME + 20, st.time + n); st.pop(st.W / 2, st.gy - 30, '+' + n + 's', '#f6c744'); }
    function activate(st, r, c, out, ctx) {
      var t = st.cells[r] && st.cells[r][c]; if (!t || out[r + ',' + c]) return;
      out[r + ',' + c] = [r, c];
      if (t.sp === 'line') { for (var i = 0; i < NC; i++) activate(st, r, i, out, ctx); if (t.dir === 'v') for (var j = 0; j < NR; j++) activate(st, j, c, out, ctx); st.pop(t.x, t.y, 'Zap', T.ink); }
      else if (t.sp === 'bomb') { for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) if (st.cells[r + dr] && st.cells[r + dr][c + dc]) activate(st, r + dr, c + dc, out, ctx); }
      else if (t.sp === 'color') { var kk = ctx.color === undefined ? rint(0, 5) : ctx.color; for (var a = 0; a < NR; a++) for (var b = 0; b < NC; b++) if (st.cells[a][b] && st.cells[a][b].k === kk) activate(st, a, b, out, ctx); }
    }
    function check(st) {
      var R = runs(st), keys = Object.keys(R.cells), forced = st.forced || []; st.forced = null;
      if (!keys.length && !forced.length) { st.combo = 0; st.state = 'idle'; st.idle = 0; if (!anyMove(st)) { st.state = 'shuffle'; st.stT = 0; st.pop(st.W / 2, 200, 'No moves. Shuffle!', T.ink); Sound.whoosh(); } return; }
      st.combo++;
      var out = {}, made = [];
      // specials earned
      R.lines.forEach(function (L) {
        if (L.n >= 5) made.push({ at: L.dir === 'h' ? [L.r, L.c + 2] : [L.r + 2, L.c], sp: 'color', k: L.k });
        else if (L.n === 4) made.push({ at: L.dir === 'h' ? [L.r, L.c + 1] : [L.r + 1, L.c], sp: 'line', dir: L.dir === 'h' ? 'h' : 'v', k: L.k });
      });
      var hset = {}, vset = {};
      R.lines.forEach(function (L) { for (var i = 0; i < L.n; i++) { var key = (L.dir === 'h' ? L.r : L.r + i) + ',' + (L.dir === 'h' ? L.c + i : L.c); (L.dir === 'h' ? hset : vset)[key] = L.k; } });
      Object.keys(hset).forEach(function (key) { if (vset[key] !== undefined && hset[key] === vset[key]) { var p = key.split(',').map(Number); if (!made.some(function (m) { return m.at[0] === p[0] && m.at[1] === p[1]; })) made.push({ at: p, sp: 'bomb', k: hset[key] }); } });
      var ctx = {}; if (forced.length) ctx.color = st.forcedColor;
      forced.forEach(function (p) { activate(st, p[0], p[1], out, ctx); });
      keys.forEach(function (key) { var p = R.cells[key]; activate(st, p[0], p[1], out, { color: undefined }); });
      // an earned special stays, as a new tile in the place it was made
      var keep = {};
      made.forEach(function (m) { var key = m.at[0] + ',' + m.at[1]; keep[key] = m; });
      var n = 0;
      Object.keys(out).forEach(function (key) {
        var p = out[key], t = st.cells[p[0]][p[1]];
        if (keep[key]) { t.sp = keep[key].sp; t.dir = keep[key].dir; t.s = 1.4; t.k = keep[key].k; return; }
        t.dead = true; n++; st.burst(t.x, t.y, KINDS[t.k].c, 7, { v: 160, sq: true, r: 3 });
      });
      var pts = n * 10 * st.combo + made.length * 50; st.score += pts;
      var c0 = pos(st, 3, 3); st.pop(st.W / 2, st.gy - 12, '+' + pts, st.combo > 1 ? '#f6c744' : T.ink);
      if (st.combo > 1) st.pop(st.W / 2, st.gy + 50, 'x' + st.combo + ' combo', '#f6c744');
      if (made.length) { addTime(st, 2); Sound.merge(4); st.rumble(4); } else Sound.pop(Math.min(8, st.combo * 2));
      if (st.combo >= 3) addTime(st, 1);
      st.hit(made.length ? 55 : 25);
      st.state = 'clear'; st.stT = 0;
    }
    function settle(st) {
      // drop what is left, then refill from above
      for (var c = 0; c < NC; c++) {
        var col = []; for (var r = NR - 1; r >= 0; r--) if (st.cells[r][c] && !st.cells[r][c].dead) col.push(st.cells[r][c]);
        for (var r2 = NR - 1, i = 0; r2 >= 0; r2--, i++) { if (i < col.length) st.cells[r2][c] = col[i]; else st.cells[r2][c] = mk(st, r2, c, undefined, true); }
      }
      st.state = 'fall'; st.stT = 0;
    }

    register({
      id: 'match', name: 'Match Meal', blurb: 'Swap, match, chain. Sixty seconds.', color: TOMATO,
      cover: [['tomato', 80, 80, 52], ['lemon', 130, 80, 52], ['tomato', 180, 80, 52], ['pepper', 240, 130, 56], ['chilli', 150, 140, 62, 0.3]],
      intro: 'Swap two neighbours. Line up three. Chain them.',
      how: [['tomato', 'Swap two neighbours to line up three or more.', '#ffd9c8'], ['chilli', 'Four makes a chilli. Five makes a star. An L makes a pot.', '#ffe9b0'], ['clock', 'Sixty seconds. Big chains add time.', T.ink]],
      lives: 0, stars: [900, 2600, 5200], overText: 'Time!',
      notes: ['The kitchen closed. Mostly.', 'So many combos left on the board.', 'You were one cascade from a record.'],
      hud: function (st) { return 'Score ' + st.score; },
      // for the driver: the two places to tap for a move that works
      __move: function (st) { var m = findMove(st); if (!m) return null; return m.map(function (q) { var p = pos(st, q[0], q[1]); return [p.x, p.y]; }); },
      setup: function (st) { st.gx = (st.W - NC * CS) / 2; st.gy = 92; st.time = TIME; st.combo = 0; st.state = 'idle'; st.sel = null; st.idle = 0; st.stT = 0; st.drag = null; st.bgp = floorPattern(st.g, 28); fill(st); st.state = 'fall'; },
      start: function (st) { st.time = TIME; },
      down: function (st, p) {
        if (st.state !== 'idle') return;
        var c = Math.floor((p.x - st.gx) / CS), r = Math.floor((p.y - st.gy) / CS);
        if (r < 0 || r >= NR || c < 0 || c >= NC) return;
        st.idle = 0; st.hint = null;
        if (st.sel && Math.abs(st.sel[0] - r) + Math.abs(st.sel[1] - c) === 1) { try_(st, st.sel, [r, c]); st.sel = null; return; }
        st.sel = [r, c]; st.drag = { r: r, c: c, x: p.x, y: p.y }; Sound.tick();
      },
      move: function (st, p) {
        if (!st.drag || st.state !== 'idle') return;
        var dx = p.x - st.drag.x, dy = p.y - st.drag.y;
        if (Math.hypot(dx, dy) > 16) {
          var r = st.drag.r + (Math.abs(dy) > Math.abs(dx) ? (dy > 0 ? 1 : -1) : 0), c = st.drag.c + (Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 1 : -1) : 0);
          var from = [st.drag.r, st.drag.c]; st.drag = null; st.sel = null;
          if (r >= 0 && r < NR && c >= 0 && c < NC) try_(st, from, [r, c]);
        }
      },
      up: function (st) { st.drag = null; },
      update: function (st, dt) {
        if (st.state !== 'fall' || st.stT > 0.1) { if (st.time > 0) st.time -= dt; }
        if (st.time <= 0 && (st.state === 'idle')) { st.time = 0; st.end(); return; }
        st.stT += dt;
        // tiles ease and fall toward their cells
        var moving = false;
        for (var r = 0; r < NR; r++) for (var c = 0; c < NC; c++) {
          var t = st.cells[r][c]; if (!t) continue; var p = pos(st, r, c);
          if (st.state === 'swap' || st.state === 'back') { t.x += (p.x - t.x) * Math.min(1, 18 * dt); t.y += (p.y - t.y) * Math.min(1, 18 * dt); }
          else { t.x += (p.x - t.x) * Math.min(1, 20 * dt); if (t.y < p.y - 0.5) { t.vy += 2600 * dt; t.y = Math.min(p.y, t.y + t.vy * dt); if (t.y >= p.y) { t.vy = 0; } moving = true; } else { t.y = p.y; t.vy = 0; } }
          if (t.s > 1) t.s = Math.max(1, t.s - dt * 2.2);
          if (Math.abs(p.x - t.x) > 1) moving = true;
        }
        if (st.state === 'swap' && st.stT > 0.14) { if (st.trial && st.trial.ok) st.state = 'check'; else { swapCells(st, st.trial.a, st.trial.b); st.state = 'back'; st.stT = 0; Sound.nope(); } }
        else if (st.state === 'back' && st.stT > 0.14) { st.state = 'idle'; st.idle = 0; }
        else if (st.state === 'check') check(st);
        else if (st.state === 'clear') { if (st.stT > 0.2) settle(st); }
        else if (st.state === 'fall') { if (!moving && st.stT > 0.12) { st.state = 'check'; } }
        else if (st.state === 'shuffle') { if (st.stT > 0.5) { do { fill(st); } while (!anyMove(st) || Object.keys(runs(st).cells).length); st.state = 'fall'; st.stT = 0; } }
        else if (st.state === 'idle') { st.idle += dt; if (st.idle > 4.5 && !st.hint) st.hint = findMove(st); }
      },
      draw: function (st, g) {
        g.fillStyle = st.bgp; g.fillRect(0, 0, st.W, st.H);
        // the board
        panel(g, st.gx - 8, st.gy - 8, NC * CS + 16, NR * CS + 16, 18, T.raise, T.hairLit);
        for (var r = 0; r < NR; r++) for (var c = 0; c < NC; c++) { g.fillStyle = (r + c) % 2 ? T.shade + '.16)' : T.shade + '.05)'; g.fillRect(st.gx + c * CS, st.gy + r * CS, CS, CS); }
        g.save(); rrect(g, st.gx, st.gy, NC * CS, NR * CS, 10); g.clip();
        for (var r2 = 0; r2 < NR; r2++) for (var c2 = 0; c2 < NC; c2++) {
          var t = st.cells[r2][c2]; if (!t) continue;
          var K = KINDS[t.k], sc = t.dead ? Math.max(0, 1 - st.stT / 0.2) : t.s;
          var sel = st.sel && st.sel[0] === r2 && st.sel[1] === c2, hint = st.hint && st.hint.some(function (h2) { return h2[0] === r2 && h2[1] === c2; });
          var bob = hint ? 1 + Math.sin(st.t * 10) * 0.09 : sel ? 1.1 : 1;
          g.save(); g.translate(t.x, t.y); g.scale(sc * bob, sc * bob);
          rrect(g, -CS / 2 + 3, -CS / 2 + 3, CS - 6, CS - 6, 12); g.fillStyle = K.c; g.fill(); g.lineWidth = sel ? 3 : 1.5; g.strokeStyle = sel ? T.ink : T.edge; g.stroke();
          g.fillStyle = 'rgba(255,255,255,.22)'; rrect(g, -CS / 2 + 8, -CS / 2 + 8, CS - 22, 6, 3); g.fill();
          sprite(g, K.s, 0, 1, CS - 14, 0);
          if (t.sp === 'line') { sprite(g, 'chilli', 0, 0, CS - 6, 0); g.fillStyle = T.ink; g.fillRect(-CS / 2 + 5, -1.5, CS - 10, 3); }
          if (t.sp === 'bomb') { sprite(g, 'pot', 0, 2, CS - 6, 0); }
          if (t.sp === 'color') { g.rotate(st.t * 2); sprite(g, 'star', 0, 0, CS + 2, 0); }
          g.restore();
        }
        g.restore();
        // time
        var k = clamp(st.time / TIME, 0, 1);
        bar(g, 24, st.H - 60, st.W - 48, 22, k, k < 0.25 ? TOMATO : LEAF);
        text(g, Math.ceil(st.time) + 's', st.W / 2, st.H - 49, 13, T.ink, 'center', 800, true);
        if (st.combo > 1 && st.state !== 'idle') text(g, 'x' + st.combo, st.W - 40, st.gy - 24, 24, GOLD, 'center', 800, true);
      }
    });
    function try_(st, a, b) {
      if (st.state !== 'idle') return;
      var A = st.cells[a[0]][a[1]], B = st.cells[b[0]][b[1]];
      swapCells(st, a, b); st.moves = (st.moves || 0) + 1;
      var ok = Object.keys(runs(st).cells).length > 0 || A.sp === 'color' || B.sp === 'color';
      st.hint = null; st.sel = null; st.stT = 0; st.state = 'swap'; st.combo = 0; st.trial = { a: a, b: b, ok: ok };
      st.forced = null;
      // a star swapped with anything takes out every tile of that colour, line or no line
      if (A.sp === 'color') { st.forced = [b]; st.forcedColor = B.k; } else if (B.sp === 'color') { st.forced = [a]; st.forcedColor = A.k; }
      Sound.swap();
    }
  })();

  /* ============================================================ 6. CHILLI INVADERS */
  /*
   * The old one, with a pantry. A rank of onions, chillies and aubergines walks
   * down the screen and speeds up as you thin it. Cheese blocks eat bombs (and
   * your own seeds, so mind where you shoot from). A pot crosses the top now and
   * then; hit it and it drops something useful. Dot fires by itself: the whole
   * game is where you stand.
   */
  (function () {
    var KIND = [{ s: 'aubergine', hp: 2, pts: 30 }, { s: 'chilli', hp: 1, pts: 20 }, { s: 'chilli', hp: 1, pts: 20 }, { s: 'onion', hp: 1, pts: 10 }, { s: 'onion', hp: 1, pts: 10 }];
    var PW = { rapid: { s: 'bolt', t: 8, text: 'Rapid fire' }, spread: { s: 'plate', t: 8, text: 'Triple shot' }, heart: { s: 'heart', t: 0, text: 'Heart' } };
    var SX = 36, SY = 30, COLS = 7;

    function wave(st) {
      var rows = Math.min(5, 3 + Math.floor((st.wave - 1) / 2));
      st.inva = []; st.ox = 24; st.oy = 100; st.dir = 1;
      for (var r = 0; r < rows; r++) for (var c = 0; c < COLS; c++) { var K = KIND[r + (5 - rows)]; st.inva.push({ r: r, c: c, k: K.s, hp: K.hp, pts: K.pts, hit: 0 }); }
      st.total = st.inva.length; st.banner = 1.6; st.bombT = 1.2;
    }
    function shields(st) {
      st.blocks = [];
      for (var k = 0; k < 3; k++) {
        var x0 = 36 + k * 112, y0 = st.H - 168;
        for (var r = 0; r < 5; r++) for (var c = 0; c < 10; c++) { if (r >= 3 && c >= 3 && c <= 6) continue; if (r === 0 && (c === 0 || c === 9)) continue; st.blocks.push({ x: x0 + c * 6, y: y0 + r * 6 }); }
      }
    }
    function chew(st, x, y, rad) {
      var n = 0;
      st.blocks = st.blocks.filter(function (b) { if (Math.abs(b.x + 3 - x) < rad && Math.abs(b.y + 3 - y) < rad) { n++; return false; } return true; });
      if (n) { st.burst(x, y, '#f6c744', 4, { v: 80, sq: true, life: 0.3, r: 2 }); }
      return n > 0;
    }
    function pos(st, v) { return { x: st.ox + v.c * SX + 14, y: st.oy + v.r * SY }; }

    register({
      id: 'invade', name: 'Chilli Invaders', blurb: 'Hold the line against the marching veg.', color: LEAF,
      cover: [['aubergine', 90, 60, 50], ['chilli', 150, 60, 50, 0.3], ['onion', 210, 60, 50], ['dot', 160, 140, 74], ['seed', 160, 96, 22, 1.57]],
      intro: 'They march. I fire. You stand in the right place.',
      how: [['dot', 'Drag left and right. Dot fires by itself.', T.ink], ['cheese', 'Cheese blocks stop bombs. Your own seeds chew them too.', '#fff2a8'], ['pot', 'Hit the pot for a power-up. Do not let them land.', '#ffe3a0']],
      lives: 3, stars: [600, 1800, 3800], overText: 'Overrun.',
      notes: ['They reached the cheese. It did not end well for the cheese.', 'It was always going to be the aubergines.', 'Faster at the end. It is always faster at the end.'],
      hud: function (st) { return 'Wave ' + st.wave + '  ·  ' + st.score; },
      setup: function (st) { st.px = st.W / 2; st.tx = st.px; st.wave = 1; st.bul = []; st.bomb = []; st.pw = { rapid: 0, spread: 0 }; st.fire = 0.4; st.ufo = null; st.ufoT = 12; st.drops = []; st.py = st.H - 78; shields(st); wave(st); st.bg = floorPattern(st.g, 28); },
      down: function (st, p) { st.tx = p.x; },
      move: function (st, p) { if (st.p.down) st.tx = p.x; },
      update: function (st, dt) {
        var kx = (st.keys.ArrowRight ? 1 : 0) - (st.keys.ArrowLeft ? 1 : 0); if (kx) st.tx = clamp(st.px + kx * 120, 18, st.W - 18);
        st.px += (clamp(st.tx, 18, st.W - 18) - st.px) * Math.min(1, 16 * dt);
        st.banner -= dt;
        // the march
        var alive = st.inva.length; if (!alive) { st.wave++; st.score += 100 * st.wave; st.pop(st.W / 2, 200, 'Wave cleared +' + 100 * st.wave, '#f6c744'); Sound.win(); shieldsTopUp(st); wave(st); return; }
        var sp = (26 + st.wave * 5) * (1 + (st.total - alive) / st.total * 2.4);
        st.ox += st.dir * sp * dt;
        var minC = 99, maxC = -1; st.inva.forEach(function (v) { if (v.c < minC) minC = v.c; if (v.c > maxC) maxC = v.c; });
        if (st.ox + minC * SX < 8 && st.dir < 0) { st.dir = 1; st.oy += 12; Sound.tone(150, 0.05, 'square', 0.05); }
        if (st.ox + maxC * SX + 28 > st.W - 8 && st.dir > 0) { st.dir = -1; st.oy += 12; Sound.tone(150, 0.05, 'square', 0.05); }
        // fire
        st.fire -= dt; Object.keys(st.pw).forEach(function (k) { if (st.pw[k] > 0) st.pw[k] -= dt; });
        if (st.fire <= 0) {
          st.fire = st.pw.rapid > 0 ? 0.14 : 0.36;
          var shots = st.pw.spread > 0 ? [-0.18, 0, 0.18] : [0];
          shots.forEach(function (a) { st.bul.push({ x: st.px, y: st.py - 22, vx: Math.sin(a) * 520, vy: -Math.cos(a) * 520, a: a }); });
          Sound.shoot();
        }
        for (var i = st.bul.length - 1; i >= 0; i--) {
          var b = st.bul[i]; b.x += b.vx * dt; b.y += b.vy * dt; var gone = b.y < 54 || b.x < 0 || b.x > st.W;
          if (!gone && chew(st, b.x, b.y, 7)) gone = true;
          if (!gone) for (var j = 0; j < st.inva.length; j++) { var v = st.inva[j], q = pos(st, v); if (Math.abs(q.x - b.x) < 15 && Math.abs(q.y - b.y) < 14) { v.hp--; v.hit = 0.1; gone = true; st.burst(b.x, b.y, T.ink, 4, { v: 90, life: 0.25 }); if (v.hp <= 0) { st.score += v.pts; st.pop(q.x, q.y - 8, '+' + v.pts, T.ink); st.burst(q.x, q.y, v.k === 'chilli' ? '#d93a2b' : v.k === 'onion' ? '#d8a4c8' : '#7a4a9c', 10, { v: 150 }); st.inva.splice(j, 1); Sound.pop(rint(2, 6)); st.hit(20); } else Sound.hit(); break; } }
          if (!gone && st.ufo && Math.abs(st.ufo.x - b.x) < 24 && Math.abs(st.ufo.y - b.y) < 14) { gone = true; ufoHit(st); }
          if (gone) st.bul.splice(i, 1);
        }
        // bombs
        st.bombT -= dt;
        if (st.bombT <= 0 && st.inva.length) {
          st.bombT = Math.max(0.45, 1.5 - st.wave * 0.09 - (1 - alive / st.total) * 0.6);
          var col = pick(st.inva).c, low = null; st.inva.forEach(function (v) { if (v.c === col && (!low || v.r > low.r)) low = v; });
          var lp = pos(st, low); st.bomb.push({ x: lp.x, y: lp.y + 12, vy: 150 + st.wave * 9 });
        }
        for (var k = st.bomb.length - 1; k >= 0; k--) {
          var bm = st.bomb[k]; bm.y += bm.vy * dt; var rm = bm.y > st.H || chew(st, bm.x, bm.y + 8, 8);
          if (!rm && Math.abs(bm.x - st.px) < 15 && Math.abs(bm.y - st.py) < 20) { rm = true; st.hurt(st.px, st.py); }
          if (rm) st.bomb.splice(k, 1);
        }
        // the pot
        st.ufoT -= dt;
        if (!st.ufo && st.ufoT <= 0) { st.ufo = { x: Math.random() < 0.5 ? -30 : st.W + 30, y: 72, dir: 0 }; st.ufo.dir = st.ufo.x < 0 ? 1 : -1; st.ufoT = rnd(14, 22); Sound.whoosh(); }
        if (st.ufo) { st.ufo.x += st.ufo.dir * 95 * dt; if (st.ufo.x < -50 || st.ufo.x > st.W + 50) st.ufo = null; }
        for (var d = st.drops.length - 1; d >= 0; d--) {
          var dp = st.drops[d]; dp.y += 90 * dt;
          if (Math.abs(dp.x - st.px) < 22 && Math.abs(dp.y - st.py) < 24) { st.drops.splice(d, 1); Sound.coin(); var P2 = PW[dp.k]; if (dp.k === 'heart') { if (!st.heal()) st.score += 100; } else st.pw[dp.k] = P2.t; st.pop(st.px, st.py - 30, P2.text, '#f6c744'); continue; }
          if (dp.y > st.H + 20) st.drops.splice(d, 1);
        }
        // the landing
        st.inva.forEach(function (v) { var q = pos(st, v); if (q.y > st.H - 180) chew(st, q.x, q.y + 8, 16); if (q.y > st.H - 120) { st.lives = 0; st.end(); } });
      },
      draw: function (st, g) {
        g.fillStyle = st.bg; g.fillRect(0, 0, st.W, st.H);
        g.fillStyle = T.floor; g.fillRect(0, st.H - 40, st.W, 40); g.fillStyle = T.hair; g.fillRect(0, st.H - 40, st.W, 2);
        st.blocks.forEach(function (b) { g.fillStyle = GOLD; g.fillRect(b.x, b.y, 6, 6); g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(b.x + 1, b.y + 4, 5, 2); });
        st.inva.forEach(function (v) { var q = pos(st, v), wob = Math.sin(st.t * 5 + v.c * 0.7 + v.r) * 2; sprite(g, v.k, q.x, q.y + wob, v.hit > 0 ? 36 : 32, Math.sin(st.t * 4 + v.c) * 0.1); v.hit -= 1 / 60; });
        st.bomb.forEach(function (b) { sprite(g, 'knife', b.x, b.y, 28, 2.4 + Math.sin(st.t * 14) * 0.2); });
        st.bul.forEach(function (b) { sprite(g, 'seed', b.x, b.y, 16, -Math.PI / 2 + b.a); });
        if (st.ufo) { shadow(g, st.ufo.x, st.ufo.y + 22, 20); sprite(g, 'pot', st.ufo.x, st.ufo.y + Math.sin(st.t * 8) * 2, 44, Math.sin(st.t * 6) * 0.1); }
        st.drops.forEach(function (d) { sprite(g, PW[d.k].s, d.x, d.y, 30, Math.sin(st.t * 6) * 0.2); });
        shadow(g, st.px, st.py + 22, 18);
        if (!(st.inv > 0 && Math.floor(st.t * 16) % 2 === 0)) { S.dot(g, st.px, st.py, 22, st.over ? 'dead' : 'smile'); }
        // gun
        rrect(g, st.px - 5, st.py - 34, 10, 16, 4); g.fillStyle = '#d8dde2'; g.fill(); g.lineWidth = 1.5; g.strokeStyle = T.edge; g.stroke();
        if (st.pw.rapid > 0) text(g, 'RAPID FIRE ' + Math.ceil(st.pw.rapid), 70, st.H - 20, 11, GOLD, 'center', 800);
        if (st.pw.spread > 0) text(g, 'TRIPLE SHOT ' + Math.ceil(st.pw.spread), st.W - 74, st.H - 20, 11, GOLD, 'center', 800);
        if (st.banner > 0 && st.phase === 'play') { g.globalAlpha = Math.min(1, st.banner); text(g, 'WAVE ' + st.wave, st.W / 2, 300, 38, T.ink, 'center', 800, true); g.globalAlpha = 1; }
      }
    });
    function ufoHit(st) {
      var u = st.ufo; st.ufo = null; var pts = pick([50, 100, 150]); st.score += pts; st.pop(u.x, u.y, '+' + pts, '#f6c744'); st.burst(u.x, u.y, GOLD, 18, { v: 200 }); Sound.win(); st.rumble(6); st.hit(60);
      st.drops.push({ x: clamp(u.x, 24, st.W - 24), y: u.y + 10, k: pick(['rapid', 'spread', 'rapid', 'spread', 'heart']) });
    }
    function shieldsTopUp(st) {
      // a few blocks back each wave, never the whole wall
      var have = st.blocks.length; if (have < 90) shields(st);
    }
  })();

  /* ============================================================ 7. KITCHEN CROSSING */
  /*
   * Hop up through an endless kitchen. Counters are safe (and have things on them
   * you cannot walk through), trolleys and rolling pins cross the lanes between,
   * and the hot oil has to be crossed on plates that carry you along. The screen
   * keeps creeping forward, so standing still is not a plan.
   */
  (function () {
    var TS = 40, NC = 9;

    function rowAt(st, r) { return st.rows[r]; }
    function make(st) {
      var r = st.rows.length, type;
      if (r < 3) type = 'safe';
      else {
        var last = st.rows[r - 1].type, prev = st.rows[r - 2].type, roll = Math.random();
        if (last !== 'safe' && prev !== 'safe' && roll < 0.55) type = 'safe';
        else if (roll < 0.40) type = 'road'; else if (roll < 0.58) type = 'pin'; else if (roll < 0.80 + Math.min(0.1, r / 800)) type = 'oil'; else type = last === 'fire' ? 'safe' : 'fire';
        if (type === 'oil' && last === 'oil' && prev === 'oil') type = 'safe';
      }
      var dir = Math.random() < 0.5 ? -1 : 1, sp = rnd(50, 90) + Math.min(60, r * 0.8), row = { r: r, type: type, dir: dir, sp: sp, items: [], blocks: {}, coins: {} };
      if (type === 'road' || type === 'pin') {
        var n = rint(1, type === 'pin' ? 2 : 3), gap = (NC * TS) / n;
        for (var i = 0; i < n; i++) row.items.push({ x: i * gap + rnd(0, gap * 0.4), w: type === 'pin' ? TS * 1.1 : TS * pick([1.6, 2, 2]) });
        if (type === 'pin') row.sp *= 1.45;
      } else if (type === 'oil') {
        var np = rint(3, 4), g2 = (NC * TS + 120) / np;
        for (var j = 0; j < np; j++) row.items.push({ x: j * g2 + rnd(0, 20), w: pick([TS * 2, TS * 2, TS * 2.6]) });
        row.sp = rnd(34, 62) + Math.min(30, r * 0.4);
      } else if (type === 'fire') {
        row.t = rnd(0, 3); row.cols = []; for (var c = 0; c < NC; c++) row.cols.push(Math.random() < 0.5);
      } else {
        var open = 0; for (var c2 = 0; c2 < NC; c2++) { if (Math.random() < 0.22 && c2 !== 4) row.blocks[c2] = pick(['pot', 'jar', 'bread']); else open++; if (Math.random() < 0.12 && !row.blocks[c2]) row.coins[c2] = true; }
        if (open < 4) row.blocks = {};
      }
      st.rows.push(row);
    }
    function fireOn(st, row, col) { var ph = (st.t + row.t) % 3; return row.cols[col] ? ph > 1.8 && ph < 2.7 : ph > 0.3 && ph < 1.2 ? false : false; }
    function fireWarn(st, row, col) { var ph = (st.t + row.t) % 3; return row.cols[col] && ph > 1.2 && ph <= 1.8; }
    function rowY(st, r) { return -r * TS - st.cam; }

    function die(st, why) {
      if (st.dead) return; st.dead = why; st.dyingT = 0;
      if (why === 'oil') { st.burst(st.dx, rowY(st, st.dr) + TS / 2, '#e6a82a', 18, { v: 200, up: 120 }); Sound.splat(); }
      else if (why === 'fire') { st.burst(st.dx, rowY(st, st.dr) + TS / 2, '#f0762a', 16, { v: 180 }); Sound.bust(); }
      else { st.burst(st.dx, rowY(st, st.dr) + TS / 2, T.ink, 16, { v: 200 }); Sound.thud(); }
      st.rumble(9); st.hit(90); st.later(380, function () { st.end(); });
    }
    function hop(st, dc, dr) {
      if (st.dead || st.hopT > 0 && st.hopT < 0.5) return;
      var c = clamp(Math.round((st.dx - TS / 2) / TS) + dc, 0, NC - 1), r = Math.max(0, st.dr + dr);
      if (dr < 0 && rowY(st, r) > st.H - 30) return;
      while (st.rows.length <= r + 8) make(st);
      var row = rowAt(st, r);
      if (row.type === 'safe' && row.blocks[c]) { st.bump = 0.2; Sound.tone(180, 0.06, 'square', 0.06); return; }
      st.fx0 = st.dx; st.fr0 = st.dr; st.dc = c; st.dtr = r; st.hopT = 0.0001; Sound.jump(); st.idle = 0;
      st.flip = dc ? dc : st.flip;
    }

    register({
      id: 'cross', name: 'Kitchen Crossing', blurb: 'Hop the trolleys. Ride the plates.', color: '#4dd6d0',
      cover: [['trolley', 90, 110, 70], ['dot', 170, 90, 74], ['plate', 250, 150, 56], ['flame', 244, 80, 46]],
      intro: 'Hop. Dodge. Ride the plates over the oil.',
      how: [['dot', 'Tap to hop forward. Swipe to hop sideways or back.', T.ink], ['trolley', 'Trolleys and rolling pins cross the lanes. Time it.', '#d6f1ef'], ['plate', 'Hot oil: only plates are safe, and they carry you. Keep moving.', '#ffe3a0']],
      lives: 0, stars: [20, 50, 100], overText: 'Squashed.',
      notes: ['The trolley did not stop. They never do.', 'The oil was exactly as hot as it looked.', 'Always one more lane. Always.'],
      hud: function (st) { return 'Rows ' + st.score; },
      setup: function (st) {
        st.rows = []; for (var i = 0; i < 14; i++) make(st);
        st.cam = -(st.H - 150); st.dr = 0; st.dc = 4; st.dx = 4 * TS + TS / 2; st.dtr = 0; st.hopT = 0; st.fx0 = st.dx; st.fr0 = 0; st.dead = null; st.best = 0; st.idle = 0; st.bump = 0; st.flip = 1; st.carry = 0; st.coinN = 0;
        st.rows[0].blocks = {}; st.rows[1].blocks = {}; st.rows[0].coins = {};
        st.sw = null;
      },
      down: function (st, p) { st.sw = { x: p.x, y: p.y, t: st.t }; },
      up: function (st, p) {
        if (!st.sw) return;
        var dx = p.x - st.sw.x, dy = p.y - st.sw.y, d = Math.hypot(dx, dy); st.sw = null;
        if (d < 18) hop(st, 0, 1); else if (Math.abs(dx) > Math.abs(dy)) hop(st, dx > 0 ? 1 : -1, 0); else hop(st, 0, dy < 0 ? 1 : -1);
      },
      key: function (st, e) { if (e.key === 'ArrowUp' || e.key === 'w' || e.key === ' ') hop(st, 0, 1); else if (e.key === 'ArrowLeft' || e.key === 'a') hop(st, -1, 0); else if (e.key === 'ArrowRight' || e.key === 'd') hop(st, 1, 0); else if (e.key === 'ArrowDown' || e.key === 's') hop(st, 0, -1); },
      update: function (st, dt) {
        if (st.dead) { st.dyingT += dt; return; }
        st.idle += dt; st.bump = Math.max(0, st.bump - dt);
        // the creep: faster the further you are
        var creep = 9 + Math.min(46, st.best * 0.55);
        if (st.idle > 1.2) creep += 12;
        st.cam -= creep * dt;
        // a hop
        if (st.hopT > 0) {
          st.hopT += dt / 0.11;
          if (st.hopT >= 1) {
            st.hopT = 0; st.dr = st.dtr; st.dx = st.dc * TS + TS / 2;
            var row = rowAt(st, st.dr);
            if (st.dr > st.best) { st.best = st.dr; st.score = st.best; Sound.climb(Math.min(14, st.best % 15)); }
            if (row.coins && row.coins[st.dc]) { delete row.coins[st.dc]; st.coinN++; st.score += 3; st.pop(st.dx, rowY(st, st.dr), '+3', '#f6c744'); Sound.coin(); }
            if (row.type === 'oil') { var on = row.items.some(function (it) { var x = ((it.x + row.dir * row.sp * st.t) % (NC * TS + 120) + (NC * TS + 120)) % (NC * TS + 120) - 60; return st.dx > x - 4 && st.dx < x + it.w + 4; }); if (!on) return die(st, 'oil'); }
            while (st.rows.length < st.dr + 14) make(st);
          }
        }
        var rowNow = rowAt(st, st.dr);
        // carried by a plate
        if (st.hopT === 0 && rowNow.type === 'oil') { st.dx += rowNow.dir * rowNow.sp * dt; if (st.dx < 6 || st.dx > NC * TS - 6) return die(st, 'edge'); }
        // the lanes
        var px = st.hopT > 0 ? lerp(st.fx0, st.dc * TS + TS / 2, st.hopT) : st.dx, pr = st.hopT > 0 ? lerp(st.fr0, st.dtr, st.hopT) : st.dr;
        var rr = Math.round(pr), r2 = rowAt(st, rr);
        if (r2 && (r2.type === 'road' || r2.type === 'pin')) {
          for (var i = 0; i < r2.items.length; i++) { var it = r2.items[i], x = ((it.x + r2.dir * r2.sp * st.t) % (NC * TS + it.w) + (NC * TS + it.w)) % (NC * TS + it.w) - it.w; if (px + 11 > x && px - 11 < x + it.w && Math.abs(pr - rr) < 0.4) return die(st, 'hit'); }
        }
        if (r2 && r2.type === 'fire' && st.hopT === 0) { var cc = Math.floor(st.dx / TS); if (r2.cols[cc] && ((st.t + r2.t) % 3) > 1.8 && ((st.t + r2.t) % 3) < 2.7) return die(st, 'fire'); }
        // the screen creeps past you
        var sy = rowY(st, pr) + TS / 2; if (sy > st.H + 10) return die(st, 'behind');
        var want = -(pr * TS) - st.H * 0.52; if (want < st.cam) st.cam += (want - st.cam) * Math.min(1, 6 * dt);
      },
      draw: function (st, g) {
        g.fillStyle = T.bg; g.fillRect(0, 0, st.W, st.H);
        // rows, far to near
        var first = Math.max(0, Math.floor((-st.cam - st.H) / TS) - 1), last = Math.min(st.rows.length - 1, Math.ceil((-st.cam + 40) / TS) + 1);
        for (var r = first; r <= last; r++) {
          var row = st.rows[r]; if (!row) continue; var y = rowY(st, r);
          if (row.type === 'safe') { g.fillStyle = r % 2 ? '#25221e' : '#2a2723'; g.fillRect(0, y, st.W, TS); for (var c = 0; c < NC; c++) { if ((c + r) % 2) { g.fillStyle = 'rgba(255,255,255,.025)'; g.fillRect(c * TS, y, TS, TS); } } }
          else if (row.type === 'road' || row.type === 'pin') { g.fillStyle = row.type === 'pin' ? '#302e38' : '#2b2c33'; g.fillRect(0, y, st.W, TS); g.fillStyle = 'rgba(255,255,255,.16)'; for (var d = 0; d < NC; d++) g.fillRect(d * TS + 8, y + TS / 2 - 1.5, 14, 3); g.fillStyle = T.hair; g.fillRect(0, y, st.W, 1.5); g.fillRect(0, y + TS - 1.5, st.W, 1.5); }
          else if (row.type === 'oil') { g.fillStyle = '#7a4d12'; g.fillRect(0, y, st.W, TS); g.fillStyle = '#b57a1c'; for (var b = 0; b < 8; b++) { var bx = (b * 47 + st.t * 12 * (b % 2 ? 1 : -1) + 400) % st.W, by = y + 8 + (b % 3) * 11; g.beginPath(); g.arc(bx, by, 3 + (b % 2), 0, TAU); g.fill(); } g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, y, st.W, 1.5); g.fillRect(0, y + TS - 1.5, st.W, 1.5); }
          else { g.fillStyle = '#25221e'; g.fillRect(0, y, st.W, TS); }
          if (row.type === 'safe') { for (var cb in row.blocks) { shadow(g, cb * TS + TS / 2, y + TS - 6, 14, 4); sprite(g, row.blocks[cb], cb * TS + TS / 2, y + TS / 2, TS - 6, 0); } for (var cn in row.coins) { g.save(); g.translate(cn * TS + TS / 2, y + TS / 2); g.scale(Math.abs(Math.cos(st.t * 4 + +cn)) * 0.8 + 0.2, 1); sprite(g, 'coin', 0, 0, 22, 0); g.restore(); } }
          if (row.type === 'fire') { for (var f = 0; f < NC; f++) { if (!row.cols[f]) continue; var on = fireOn(st, row, f), warn = fireWarn(st, row, f); g.fillStyle = on ? 'rgba(240,118,42,.4)' : warn ? 'rgba(228,87,46,' + (0.2 + 0.25 * Math.sin(st.t * 24)) + ')' : 'rgba(255,255,255,.04)'; g.fillRect(f * TS + 2, y + 2, TS - 4, TS - 4); g.strokeStyle = T.hairLit; g.lineWidth = 1.5; g.strokeRect(f * TS + 5, y + 5, TS - 10, TS - 10); if (on) sprite(g, 'flame', f * TS + TS / 2, y + TS / 2 - 2, TS + 4, Math.sin(st.t * 16 + f) * 0.1); } }
          if (row.type === 'road') row.items.forEach(function (it) { var w = NC * TS + it.w, x = ((it.x + row.dir * row.sp * st.t) % w + w) % w - it.w; g.save(); g.translate(x + it.w / 2, y + TS / 2); if (row.dir < 0) g.scale(-1, 1); sprite(g, 'trolley', 0, 2, it.w * 0.95, 0); g.restore(); });
          if (row.type === 'pin') row.items.forEach(function (it) { var w = NC * TS + it.w, x = ((it.x + row.dir * row.sp * st.t) % w + w) % w - it.w; sprite(g, 'rollingpin', x + it.w / 2, y + TS / 2, it.w, row.dir * st.t * 6); });
          if (row.type === 'oil') row.items.forEach(function (it) { var w = NC * TS + 120, x = ((it.x + row.dir * row.sp * st.t) % w + w) % w - 60; var n = Math.round(it.w / TS); for (var k = 0; k < n; k++) sprite(g, 'plate', x + k * (it.w / n) + it.w / n / 2, y + TS / 2, TS * 0.98, 0); });
        }
        // Dot
        var pr = st.hopT > 0 ? lerp(st.fr0, st.dtr, st.hopT) : st.dr, px = st.hopT > 0 ? lerp(st.fx0, st.dc * TS + TS / 2, st.hopT) : st.dx;
        var py = rowY(st, pr) + TS / 2, arc = st.hopT > 0 ? Math.sin(st.hopT * Math.PI) * 12 : 0, sq = st.hopT > 0 ? 1 + Math.sin(st.hopT * Math.PI) * 0.14 : 1 - st.bump * 0.4;
        shadow(g, px, py + 14, 13 - arc * 0.2);
        if (st.dead) { var k2 = Math.min(1, st.dyingT * 3); g.save(); g.translate(px, py + 4); g.scale(1 + k2 * 0.4, Math.max(0.1, 1 - k2 * (st.dead === 'oil' ? 1 : 0.8))); S.dot(g, 0, 0, 16, 'dead'); g.restore(); }
        else { g.save(); g.translate(px, py - arc); g.scale(2 - sq, sq); S.dot(g, 0, 0, 16, st.hopT > 0 ? 'open' : 'smile'); g.restore(); }
        // the creep, as a shadow coming up from underneath
        var ey = st.H - 30 + Math.sin(st.t * 3) * 2; g.fillStyle = T.scrim + '.55)'; g.fillRect(0, ey, st.W, st.H - ey);
      }
    });
  })();

  /* ================================================================== 8. DISH STACK */
  /*
   * Build the tallest burger you can. A layer slides across the top; tap to drop
   * it, and whatever hangs over the edge is sliced off, so the next layer is
   * narrower. Land one dead centre and it keeps its full width; land five dead
   * centre in a row and it grows a little back. It speeds up as it goes.
   */
  (function () {
    var ING = [
      { n: 'bun', c: '#d9a45a', d: '#a8702e' }, { n: 'cheese', c: '#f6c744', d: '#d9a02a' }, { n: 'lettuce', c: '#6fbf5e', d: '#4f9944' },
      { n: 'tomato', c: '#e4572e', d: '#b83c1c' }, { n: 'patty', c: '#7a4a2c', d: '#5a3219' }, { n: 'egg', c: '#fffaf0', d: '#f6b52b' }, { n: 'onion', c: '#d8a4c8', d: '#a86f9a' }
    ];
    var LH = 26;

    function layerY(st, i) { return st.H - 74 - (i + 1) * LH + st.cam; }
    function slab(g, x, y, w, ing, o) {
      var h2 = LH - 2;
      rrect(g, x, y, w, h2, ing.n === 'lettuce' ? 4 : 9); g.fillStyle = ing.c; g.fill(); g.lineWidth = 1.5; g.strokeStyle = T.edge; g.stroke();
      g.save(); rrect(g, x + 1, y + 1, w - 2, h2 - 2, 8); g.clip();
      g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(x, y + 2, w, 5);
      g.fillStyle = ing.d;
      if (ing.n === 'bun') for (var i = 0; i < w / 18; i++) g.fillRect(x + 8 + i * 18, y + 9, 5, 2);
      else if (ing.n === 'tomato') for (var j = 0; j < w / 22; j++) { g.beginPath(); g.arc(x + 10 + j * 22, y + 13, 2.4, 0, TAU); g.fill(); }
      else if (ing.n === 'cheese') { g.beginPath(); g.arc(x + w * 0.3, y + 13, 3, 0, TAU); g.arc(x + w * 0.7, y + 12, 2.4, 0, TAU); g.fill(); }
      else if (ing.n === 'patty') for (var k = 0; k < w / 16; k++) g.fillRect(x + 6 + k * 16, y + 14, 6, 2);
      else if (ing.n === 'egg') { g.beginPath(); g.arc(x + w / 2, y + 13, 7, 0, TAU); g.fillStyle = ing.d; g.fill(); }
      g.restore();
    }
    function nextLayer(st) {
      var i = st.layers.length, w = st.cw;
      st.cur = { w: w, x: st.dir > 0 ? -w : st.W, ing: i === 0 ? ING[0] : ING[1 + (i % (ING.length - 1))] };
      st.speed = Math.min(430, 140 + i * 7);
    }

    register({
      id: 'stack', name: 'Dish Stack', blurb: 'Stack the burger. Time it right.', color: '#e0a340',
      cover: [['bread', 160, 150, 90], ['tomato', 160, 120, 54], ['cheese', 160, 92, 64], ['bread', 160, 62, 80, 3.14]],
      intro: 'Stack it. Time it. Do not drop the lettuce.',
      how: [['bread', 'Tap to drop the layer. It slices off what hangs over.', '#ffe3a0'], ['star', 'Dead centre keeps the whole width. Five in a row grow it back.', '#fff2a8'], ['cheese', 'It gets faster. The tower gets taller. That is the game.', T.ink]],
      lives: 0, stars: [18, 40, 70], overText: 'Timber.',
      notes: ['It was straight. Then it was not.', 'The lettuce did not stand a chance.', 'A tower is only as tall as its worst tap.'],
      hud: function (st) { return 'Layers ' + st.layers.length; },
      setup: function (st) {
        st.layers = [{ x: st.W / 2 - 80, w: 160, ing: ING[0] }]; st.cw = 160; st.dir = 1; st.cam = 0; st.camT = 0; st.cut = []; st.streak = 0; st.ring = null; st.sway = 0; st.drop = null; st.fallen = false;
        nextLayer(st); st.wall = floorPattern(st.g, 28);
      },
      down: function (st) { drop(st); },
      key: function (st, e) { if (e.key === ' ' || e.key === 'ArrowDown') drop(st); },
      update: function (st, dt) {
        st.sway = Math.sin(st.t * 1.7) * Math.min(7, st.layers.length * 0.25);
        // the sliding layer
        if (!st.drop && st.cur) { st.cur.x += st.dir * st.speed * dt; if (st.cur.x + st.cur.w > st.W + 30) { st.dir = -1; } if (st.cur.x < -30) { st.dir = 1; } }
        if (st.drop) { st.drop.vy += 2600 * dt; st.drop.y += st.drop.vy * dt; var top = layerY(st, st.layers.length - 1); if (st.drop.y >= top - LH + 2 || st.drop.y >= top - LH) { land(st); } }
        st.cut.forEach(function (c) { c.vy += 1800 * dt; c.y += c.vy * dt; c.x += c.vx * dt; c.rot += c.vr * dt; });
        st.cut = st.cut.filter(function (c) { return c.y < st.H + 80; });
        // the camera follows the top down the screen
        var want = Math.max(0, (st.layers.length * LH) - (st.H * 0.46)); st.cam += (want - st.cam) * Math.min(1, 4 * dt);
        if (st.ring) { st.ring.t += dt; if (st.ring.t > 0.4) st.ring = null; }
        if (st.fallen) { st.fallT = (st.fallT || 0) + dt; }
      },
      draw: function (st, g) {
        g.fillStyle = st.wall; g.fillRect(0, 0, st.W, st.H);
        var floorY = st.H - 74 + st.cam; g.fillStyle = T.floor; g.fillRect(0, floorY, st.W, st.H - floorY + 80); g.fillStyle = T.hair; g.fillRect(0, floorY, st.W, 2);
        // the plate under it all
        g.beginPath(); g.ellipse(st.W / 2, floorY + 2, 112, 13, 0, 0, TAU); g.fillStyle = '#e9e1d2'; g.fill(); g.lineWidth = 1.5; g.strokeStyle = T.edge; g.stroke();
        g.beginPath(); g.ellipse(st.W / 2, floorY + 1, 84, 7, 0, 0, TAU); g.strokeStyle = 'rgba(0,0,0,.18)'; g.lineWidth = 2; g.stroke();
        var n = st.layers.length;
        st.layers.forEach(function (L, i) { var y = layerY(st, i), s = Math.pow(i / Math.max(1, n), 2) * st.sway; slab(g, L.x + s, y, L.w, L.ing); });
        st.cut.forEach(function (c) { g.save(); g.translate(c.x + c.w / 2, c.y + LH / 2); g.rotate(c.rot); g.translate(-c.w / 2, -LH / 2); slab(g, 0, 0, c.w, c.ing); g.restore(); });
        if (st.cur && !st.fallen) { var cy = st.drop ? st.drop.y : layerY(st, n - 1) - LH - 12; var cx = st.drop ? st.drop.x : st.cur.x; slab(g, cx, cy, st.cur.w, st.cur.ing); if (!st.drop) { g.save(); g.setLineDash([4, 8]); g.strokeStyle = T.ink3; g.lineWidth = 2; g.beginPath(); g.moveTo(cx, cy + LH); g.lineTo(cx, layerY(st, n - 1)); g.moveTo(cx + st.cur.w, cy + LH); g.lineTo(cx + st.cur.w, layerY(st, n - 1)); g.stroke(); g.restore(); } }
        if (st.ring) { var top2 = st.layers[n - 1], k = st.ring.t / 0.4; g.globalAlpha = 1 - k; g.lineWidth = 4; g.strokeStyle = '#f6c744'; rrect(g, top2.x - 4 - k * 12, layerY(st, n - 1) - 4 - k * 8, top2.w + 8 + k * 24, LH + 6 + k * 16, 12); g.stroke(); g.globalAlpha = 1; }
        if (st.streak > 1) text(g, st.streak + ' perfect', st.W / 2, 100, 20, GOLD, 'center', 800, true);
      }
    });
    function drop(st) {
      if (st.drop || !st.cur || st.fallen || st.phase !== 'play') return;
      st.drop = { x: st.cur.x, y: layerY(st, st.layers.length - 1) - LH - 12, vy: 120 }; Sound.whoosh();
    }
    function land(st) {
      var top = st.layers[st.layers.length - 1], cur = st.cur, d = st.drop; st.drop = null;
      var left = Math.max(top.x, d.x), right = Math.min(top.x + top.w, d.x + cur.w), ov = right - left;
      if (ov <= 2) {
        // missed it altogether
        st.cut.push({ x: d.x, y: layerY(st, st.layers.length - 1) - LH, w: cur.w, ing: cur.ing, vy: 0, vx: (d.x < top.x ? -60 : 60), rot: 0, vr: d.x < top.x ? -2 : 2 });
        st.fallen = true; st.cur = null; Sound.thud(); st.rumble(6); st.later(500, function () { st.end(); }); return;
      }
      var off = Math.abs((d.x + cur.w / 2) - (top.x + top.w / 2));
      var perfect = off < 4;
      var nx = perfect ? top.x : left, nw = perfect ? top.w : ov;
      if (!perfect) {
        var over = cur.w - ov;
        if (d.x < top.x) st.cut.push({ x: d.x, y: layerY(st, st.layers.length - 1) - LH, w: top.x - d.x, ing: cur.ing, vy: 0, vx: -40, rot: 0, vr: -1.5 });
        else st.cut.push({ x: top.x + top.w, y: layerY(st, st.layers.length - 1) - LH, w: d.x + cur.w - (top.x + top.w), ing: cur.ing, vy: 0, vx: 40, rot: 0, vr: 1.5 });
        st.streak = 0; Sound.thud(); st.rumble(2);
      } else {
        st.streak++; st.ring = { t: 0 }; Sound.merge(Math.min(8, st.streak)); st.pop(top.x + top.w / 2, layerY(st, st.layers.length - 1) - 30, st.streak > 1 ? 'Perfect x' + st.streak : 'Perfect!', '#f6c744'); st.burst(top.x + top.w / 2, layerY(st, st.layers.length - 1), '#f6c744', 12, { v: 160 });
        if (st.streak >= 5) { nw = Math.min(160, nw + 10); nx = Math.max(0, nx - 5); st.streak = 0; st.pop(st.W / 2, 130, 'Grew back!', T.ink); }
      }
      st.layers.push({ x: nx, w: nw, ing: cur.ing }); st.cw = nw; st.score = (st.layers.length - 1) + (st.bonus = (st.bonus || 0) + (perfect ? 1 : 0));
      st.dir = Math.random() < 0.5 ? -1 : 1; nextLayer(st);
      if (nw < 10) { st.cur.w = nw; }
    }
  })();

  /* ===================================================================== 9. SLICE */
  /*
   * Food is thrown up from below and you cut it in the air with a swipe. Everything
   * you cut in one stroke counts as a chain. Three things to know: a food that falls
   * uncut costs a heart, a bomb that is cut costs a heart (it is not the end, the
   * game is for fun), and a heart that is cut gives one back. It starts with one thing
   * at a time and slow, and ends with bursts of four and a bomb hidden in them.
   *
   * It replaces Seed Spit, which was a drag-and-release aiming game against the wind:
   * a lot of rules to learn for something that was over in ten throws. This is
   * understood in one swipe.
   */
  (function () {
    var FOOD = ['tomato', 'apple', 'lemon', 'onion', 'aubergine', 'carrot', 'pepper', 'donut', 'egg', 'mushroom', 'cheese', 'bread', 'pizza', 'burger', 'croissant', 'cupcake'];
    var JUICE = { tomato: '#e4572e', apple: '#c9332e', lemon: '#f7dc4b', onion: '#d8a4c8', aubergine: '#8a5aac', carrot: '#f08a2a', pepper: '#6fbf5e', donut: '#f48fb1', egg: '#f6b52b', mushroom: '#e8e0d0', cheese: '#f6c744', bread: '#d9a45a', pizza: '#f6c744', burger: '#e0a050', croissant: '#e3a64f', cupcake: '#f9a8c9' };
    var G = 880;

    function throwOne(st, kind) {
      var x = rnd(40, st.W - 40), apex = rnd(300, 470), vy = -Math.sqrt(2 * G * apex), tt = -vy / G;
      var tx = st.W / 2 + rnd(-80, 80);
      st.items.push({ kind: kind, spr: kind === 'bomb' ? 'bomb' : kind === 'heart' ? 'heart' : pick(FOOD), x: x, y: st.H + 40, vx: (tx - x) / tt, vy: vy, rot: 0, vr: rnd(-4, 4), r: kind === 'bomb' ? 24 : 27, gone: false, age: 0 });
    }
    function wave(st) {
      var d = Math.min(1, st.t / 75);
      var n = 1 + (Math.random() < 0.3 + d * 0.45 ? 1 : 0) + (Math.random() < d * 0.4 ? 1 : 0) + (Math.random() < d * 0.25 ? 1 : 0);
      for (var i = 0; i < n; i++) {
        var kind = 'food';
        if (st.t > 7 && Math.random() < 0.05 + d * 0.2) kind = 'bomb';
        else if (st.lives < st.maxLives && Math.random() < 0.035) kind = 'heart';
        throwOne(st, kind);
      }
      st.waveT = Math.max(0.5, rnd(1.0, 1.55) - d * 0.6);
    }
    function lose(st, x, y, why) {
      if (st.over) return;
      st.lives--; st.flash = 0.45; st.rumble(8); Sound.bust(); D.Dot.mood(dotEl, 'sad', 700);
      st.burst(x, y, TOMATO, 10, { v: 170 }); st.pop(x, y - 20, why, TOMATO);
      st.combo = 0;
      if (st.lives <= 0) st.end();
    }
    function slice(st, it, ang) {
      it.gone = true;
      if (it.kind === 'bomb') { st.burst(it.x, it.y, '#f0762a', 22, { v: 260 }); st.burst(it.x, it.y, '#2b2a2f', 10, { v: 200 }); Sound.splat(); st.hit(70); lose(st, it.x, it.y, 'Boom'); return; }
      if (it.kind === 'heart') { st.heal(); st.burst(it.x, it.y, TOMATO, 14, { v: 200 }); st.pop(it.x, it.y, '+1 heart', '#ff8f9a'); Sound.win(); return; }
      var n = Math.cos(ang + Math.PI / 2), m = Math.sin(ang + Math.PI / 2);
      for (var s = -1; s <= 1; s += 2) st.halves.push({ spr: it.spr, side: s, x: it.x, y: it.y, vx: it.vx * 0.5 + n * s * 90, vy: it.vy * 0.4 + m * s * 90 - 60, rot: it.rot, vr: s * rnd(2, 6), a: ang, r: it.r, life: 1.4 });
      st.burst(it.x, it.y, JUICE[it.spr] || GOLD, 12, { v: 220, up: 40, r: 3.2 }); st.burst(it.x, it.y, T.ink, 4, { v: 120, r: 2 });
      st.score += 10; st.cnt++; Sound.pop(Math.min(8, st.cmb.n)); st.hit(18);
      st.cmb.n = st.cmb.t > 0 ? st.cmb.n + 1 : 1; st.cmb.t = 0.3; st.cmb.x = it.x; st.cmb.y = it.y;
    }
    function segHits(x0, y0, x1, y1, cx, cy, r) {
      var dx = x1 - x0, dy = y1 - y0, l2 = dx * dx + dy * dy || 1, t = clamp(((cx - x0) * dx + (cy - y0) * dy) / l2, 0, 1);
      return dist(x0 + dx * t, y0 + dy * t, cx, cy) < r;
    }
    function cut(st, x0, y0, x1, y1) {
      if (dist(x0, y0, x1, y1) < 3) return;
      var ang = Math.atan2(y1 - y0, x1 - x0);
      st.items.forEach(function (it) { if (!it.gone && it.age > 0.05 && segHits(x0, y0, x1, y1, it.x, it.y, it.r + 5)) slice(st, it, ang); });
    }

    register({
      id: 'slice', name: 'Slice', blurb: 'Swipe through the food. Skip the bombs.', color: '#f08a2a',
      cover: [['tomato', 100, 100, 70, 0.4], ['bomb', 230, 90, 56, -0.2], ['lemon', 190, 150, 54, 0.8], ['carrot', 70, 156, 50, 2]],
      intro: 'Swipe through it. Not the bombs.',
      how: [['tomato', 'Swipe across food to slice it. Cut a few in one stroke for a chain.', T.ink], ['bomb', 'Do not cut the bombs. A bomb costs a heart.', T.ink], ['heart', 'Food that falls uncut costs a heart too. Cut a heart to get one back.', T.ink]],
      lives: 3, stars: [200, 600, 1300], overText: 'Too slow.',
      notes: ['The tomatoes got away. They always do.', 'It was the bomb. It is always the bomb.', 'Fast hands. Almost fast enough.'],
      hud: function (st) { return String(st.score); },
      setup: function (st) {
        st.items = []; st.halves = []; st.trail = []; st.last = null; st.waveT = 0.6; st.cnt = 0; st.cmb = { n: 0, t: 0, x: 0, y: 0 }; st.bg = floorPattern(st.g, 28); st.mood = 0;
      },
      down: function (st, p) { st.last = { x: p.x, y: p.y }; st.trail = [{ x: p.x, y: p.y, t: st.t }]; },
      move: function (st, p) {
        if (!st.p.down || !st.last) return;
        cut(st, st.last.x, st.last.y, p.x, p.y);
        st.trail.push({ x: p.x, y: p.y, t: st.t }); st.last = { x: p.x, y: p.y };
      },
      up: function (st) { st.last = null; },
      update: function (st, dt) {
        st.waveT -= dt; if (st.waveT <= 0) wave(st);
        for (var i = st.items.length - 1; i >= 0; i--) {
          var it = st.items[i]; it.age += dt; it.vy += G * dt; it.x += it.vx * dt; it.y += it.vy * dt; it.rot += it.vr * dt;
          if (it.x < 16) { it.x = 16; it.vx = Math.abs(it.vx) * 0.6; } if (it.x > st.W - 16) { it.x = st.W - 16; it.vx = -Math.abs(it.vx) * 0.6; }
          if (it.gone) { st.items.splice(i, 1); continue; }
          if (it.vy > 0 && it.y > st.H + 50) { st.items.splice(i, 1); if (it.kind === 'food') lose(st, clamp(it.x, 40, st.W - 40), st.H - 50, 'Missed'); }
        }
        for (var j = st.halves.length - 1; j >= 0; j--) { var h2 = st.halves[j]; h2.vy += G * dt; h2.x += h2.vx * dt; h2.y += h2.vy * dt; h2.rot += h2.vr * dt; h2.life -= dt; if (h2.y > st.H + 60 || h2.life <= 0) st.halves.splice(j, 1); }
        // a chain is paid when the stroke has been quiet for a moment
        if (st.cmb.t > 0) { st.cmb.t -= dt; if (st.cmb.t <= 0) { if (st.cmb.n >= 3) { var b = st.cmb.n * 5; st.score += b; st.pop(clamp(st.cmb.x, 60, st.W - 60), clamp(st.cmb.y, 100, st.H - 100), st.cmb.n + ' chain +' + b, GOLD); Sound.merge(Math.min(8, st.cmb.n)); st.rumble(3); } st.cmb.n = 0; } }
        st.trail = st.trail.filter(function (t) { return st.t - t.t < 0.2; });
      },
      draw: function (st, g) {
        g.fillStyle = st.bg; g.fillRect(0, 0, st.W, st.H);
        // the floor, where what you miss goes
        g.fillStyle = 'rgba(228,87,46,.07)'; g.fillRect(0, st.H - 36, st.W, 36); g.fillStyle = 'rgba(228,87,46,.4)'; g.fillRect(0, st.H - 36, st.W, 1.5);
        st.halves.forEach(function (hv) {
          var sz = hv.r * 2.3; g.save(); g.translate(hv.x, hv.y); g.rotate(hv.rot); g.globalAlpha = Math.min(1, hv.life * 2.2);
          g.beginPath(); if (hv.side < 0) g.rect(-sz / 2, -sz / 2, sz / 2, sz); else g.rect(0, -sz / 2, sz / 2, sz); g.clip();
          sprite(g, hv.spr, 0, 0, sz, 0); g.restore();
        });
        st.items.forEach(function (it) {
          shadow(g, it.x, it.y + it.r + 10, it.r * 0.5, 3);
          sprite(g, it.spr, it.x, it.y, it.r * 2.3, it.rot);
          if (it.kind === 'bomb' && Math.floor(st.t * 10) % 2 === 0) disc(g, it.x + Math.cos(it.rot - 0.7) * 30, it.y + Math.sin(it.rot - 0.7) * 30 - 8, 3, GOLD, 0);
        });
        // the stroke, thick where it is new
        if (st.trail.length > 1) {
          for (var k = 1; k < st.trail.length; k++) {
            var a = st.trail[k - 1], b2 = st.trail[k], age = (st.t - b2.t) / 0.2, w = (1 - age) * 9;
            if (w <= 0.3) continue;
            g.globalAlpha = 1 - age; g.strokeStyle = T.ink; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b2.x, b2.y); g.stroke();
            g.globalAlpha = (1 - age) * 0.8; g.strokeStyle = T.amber; g.lineWidth = w * 0.45; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b2.x, b2.y); g.stroke();
          }
          g.globalAlpha = 1;
        }
        if (st.cmb.n >= 2 && st.cmb.t > 0) text(g, 'x' + st.cmb.n, clamp(st.cmb.x, 40, st.W - 40), clamp(st.cmb.y, 90, st.H - 90) - 34, 22, GOLD, 'center', 800, true);
        S.dot(g, st.W / 2, st.H - 18, 16, st.over ? 'dead' : st.inv > 0 || st.flash > 0.2 ? 'sad' : 'smile');
      }
    });
  })();


  /* ==================================================================== 10. CHOP CHOP */
  /*
   * Ingredients come down four lanes toward the board; tap the lane as one reaches
   * the line. Closer to the line is more points, a run of clean chops raises the
   * multiplier, and the beat gets quicker the longer you last. A bomb in a lane is not
   * to be chopped (it drops off the bottom on its own). A food that gets past costs a
   * heart; a long run gives one back.
   *
   * It replaces Dot Says, a copy-the-pattern memory game: fine for a minute, but there
   * was nothing to do with your hands. This is the opposite, all hands.
   */
  (function () {
    var FOOD = ['tomato', 'apple', 'lemon', 'onion', 'aubergine', 'carrot', 'pepper', 'donut', 'egg', 'mushroom', 'cheese', 'bread', 'pizza', 'burger', 'croissant', 'cupcake', 'sushi', 'fish'];
    var JUICE = { tomato: '#e4572e', apple: '#c9332e', lemon: '#f7dc4b', onion: '#d8a4c8', aubergine: '#8a5aac', carrot: '#f08a2a', pepper: '#6fbf5e', donut: '#f48fb1', egg: '#f6b52b', mushroom: '#e8e0d0', cheese: '#f6c744', bread: '#d9a45a', pizza: '#f6c744', burger: '#e0a050', croissant: '#e3a64f', cupcake: '#f9a8c9', sushi: '#f4977a', fish: '#79b5d6' };
    var LANES = 4, LX = 12, LW = 84, ITEM = 54;
    function zoneY(st) { return st.H - 138; }
    function laneX(l) { return LX + l * LW + LW / 2; }

    function spawn(st) {
      var lanes = [0, 1, 2, 3];
      var l = pick(lanes.filter(function (x) { return x !== st.lastLane || st.repeat < 2; }));
      st.repeat = l === st.lastLane ? st.repeat + 1 : 0; st.lastLane = l;
      var bomb = st.t > 12 && Math.random() < Math.min(0.2, 0.06 + st.t * 0.0015);
      st.items.push({ lane: l, y: -ITEM, spr: bomb ? 'bomb' : pick(FOOD), bomb: bomb, gone: false });
      // later, two at once
      if (st.t > 28 && Math.random() < Math.min(0.4, (st.t - 28) * 0.008)) {
        var l2 = (l + rint(1, 3)) % LANES; st.items.push({ lane: l2, y: -ITEM - rnd(0, 20), spr: pick(FOOD), bomb: false, gone: false });
      }
    }
    function lose(st, x, y, why) {
      if (st.over) return;
      st.lives--; st.flash = 0.4; st.rumble(7); Sound.bust(); D.Dot.mood(dotEl, 'sad', 700); st.pop(x, y, why, TOMATO); st.combo = 0; st.mult = 1;
      if (st.lives <= 0) st.end();
    }
    function chop(st, it, dy) {
      it.gone = true;
      var grade = dy <= 16 ? 'Perfect' : dy <= 40 ? 'Great' : 'Good', base = dy <= 16 ? 30 : dy <= 40 ? 20 : 10;
      st.combo++; st.mult = 1 + Math.min(3, Math.floor(st.combo / 8));
      var pts = base * st.mult; st.score += pts; st.hits++;
      var x = laneX(it.lane), y = it.y;
      st.pop(x, y - 30, grade + (st.mult > 1 ? ' x' + st.mult : ''), grade === 'Perfect' ? GOLD : T.ink);
      for (var s = -1; s <= 1; s += 2) st.halves.push({ spr: it.spr, side: s, x: x, y: y, vx: s * rnd(70, 140), vy: rnd(-200, -90), rot: 0, vr: s * rnd(2, 7), life: 1.1 });
      st.burst(x, y, JUICE[it.spr] || GOLD, 10, { v: 190, up: 40, r: 3 });
      Sound.pop(Math.min(8, st.combo % 9)); st.hit(12); st.chopT = 0.14;
      if (st.combo % 20 === 0) { if (st.heal()) st.pop(st.W / 2, 120, '+1 heart', '#ff8f9a'); Sound.win(); }
    }
    function tap(st, lane) {
      if (lane < 0 || lane >= LANES || st.phase !== 'play' || st.paused) return;
      st.pad[lane] = 0.16;
      var zy = zoneY(st), low = null;
      st.items.forEach(function (it) { if (it.lane === lane && !it.gone && it.y > zy - 130 && it.y < zy + 60 && (!low || it.y > low.y)) low = it; });
      if (!low) { st.padBad[lane] = 0.2; if (st.combo > 0) st.pop(laneX(lane), zy - 40, 'Whiff', T.ink3); st.combo = 0; st.mult = 1; Sound.nope(); return; }
      if (low.bomb) { low.gone = true; st.burst(laneX(lane), low.y, '#f0762a', 18, { v: 240 }); Sound.splat(); st.hit(60); lose(st, laneX(lane), low.y - 30, 'Boom'); return; }
      chop(st, low, Math.abs(low.y - zy));
    }

    register({
      id: 'chop', name: 'Chop Chop', blurb: 'Tap each lane as the food hits the line.', color: '#4dd6d0',
      cover: [['board', 160, 150, 120], ['carrot', 100, 80, 56, 0.6], ['tomato', 160, 62, 56], ['pizza', 220, 96, 60, -0.3], ['knife', 214, 156, 56, 0.2]],
      intro: 'Tap the lane when it reaches the line.',
      how: [['board', 'Four lanes. Tap a lane as its food reaches the line.', T.ink], ['star', 'Closer to the line is worth more. A clean run raises the multiplier.', T.ink], ['bomb', 'Leave the bombs alone. Food that gets past costs a heart.', T.ink]],
      lives: 3, stars: [800, 2400, 5000], overText: 'Out of time.',
      notes: ['The beat got away from you. It does that.', 'Good hands. Faster feet next time.', 'The carrots won. Quietly.'],
      hud: function (st) { return String(st.score); },
      setup: function (st) {
        st.items = []; st.halves = []; st.spawnT = 0.7; st.combo = 0; st.mult = 1; st.hits = 0; st.pad = [0, 0, 0, 0]; st.padBad = [0, 0, 0, 0]; st.lastLane = -1; st.repeat = 0; st.chopT = 0; st.bg = floorPattern(st.g, 28);
      },
      down: function (st, p) { tap(st, Math.floor((p.x - LX) / LW)); },
      key: function (st, e) { var m = { ArrowLeft: 0, ArrowDown: 1, ArrowUp: 2, ArrowRight: 3, d: 0, f: 1, j: 2, k: 3, D: 0, F: 1, J: 2, K: 3 }[e.key]; if (m !== undefined) tap(st, m); },
      update: function (st, dt) {
        var speed = 250 + Math.min(280, st.t * 3.4), zy = zoneY(st);
        st.spawnT -= dt; if (st.spawnT <= 0) { spawn(st); st.spawnT = Math.max(0.3, 0.8 - st.t * 0.0075); }
        for (var i = st.items.length - 1; i >= 0; i--) {
          var it = st.items[i]; it.y += speed * dt;
          if (it.gone) { st.items.splice(i, 1); continue; }
          if (it.y > zy + 64) { st.items.splice(i, 1); if (!it.bomb) lose(st, laneX(it.lane), zy + 20, 'Missed'); }
        }
        for (var j = st.halves.length - 1; j >= 0; j--) { var hv = st.halves[j]; hv.vy += 900 * dt; hv.x += hv.vx * dt; hv.y += hv.vy * dt; hv.rot += hv.vr * dt; hv.life -= dt; if (hv.life <= 0 || hv.y > st.H + 40) st.halves.splice(j, 1); }
        for (var l = 0; l < LANES; l++) { st.pad[l] = Math.max(0, st.pad[l] - dt); st.padBad[l] = Math.max(0, st.padBad[l] - dt); }
        st.chopT = Math.max(0, st.chopT - dt);
      },
      draw: function (st, g) {
        g.fillStyle = st.bg; g.fillRect(0, 0, st.W, st.H);
        var zy = zoneY(st);
        // the lanes
        for (var l = 0; l < LANES; l++) { g.fillStyle = l % 2 ? 'rgba(255,255,255,.03)' : 'rgba(255,255,255,.012)'; g.fillRect(LX + l * LW, 70, LW, st.H - 70); if (l) { g.fillStyle = T.hair; g.fillRect(LX + l * LW - 0.5, 70, 1, st.H - 70); } }
        // the board and its four pads
        panel(g, LX - 4, zy - 40, LANES * LW + 8, 80, 16, T.raise, T.hairLit);
        for (var p = 0; p < LANES; p++) {
          var on = st.pad[p] > 0, bad = st.padBad[p] > 0;
          rrect(g, LX + p * LW + 7, zy - 26, LW - 14, 52, 12); g.fillStyle = bad ? 'rgba(228,87,46,.5)' : on ? T.amber : T.shade + '.4)'; g.fill(); g.lineWidth = 1.5; g.strokeStyle = on ? T.amber : T.hairLit; g.stroke();
          g.globalAlpha = on ? 0.9 : 0.2; sprite(g, 'knife', laneX(p), zy, 26, 0.4); g.globalAlpha = 1;
        }
        // the line
        g.fillStyle = T.amber; g.globalAlpha = 0.55; g.fillRect(LX, zy - 1, LANES * LW, 2); g.globalAlpha = 1;
        st.halves.forEach(function (hv) {
          var sz = ITEM * 1.05; g.save(); g.translate(hv.x, hv.y); g.rotate(hv.rot); g.globalAlpha = Math.min(1, hv.life * 2.4);
          g.beginPath(); if (hv.side < 0) g.rect(-sz / 2, -sz / 2, sz / 2, sz); else g.rect(0, -sz / 2, sz / 2, sz); g.clip(); sprite(g, hv.spr, 0, 0, sz, 0); g.restore();
        });
        st.items.forEach(function (it) {
          var x = laneX(it.lane), near = Math.abs(it.y - zy) < 40 && !it.bomb;
          shadow(g, x, it.y + ITEM * 0.5, ITEM * 0.34, 4);
          sprite(g, it.spr, x, it.y, ITEM * (near ? 1.08 : 1), 0);
        });
        S.dot(g, st.W / 2, st.H - 38, 20, st.over ? 'dead' : st.chopT > 0 ? 'open' : 'smile');
        if (st.combo >= 3) { text(g, st.combo + ' in a row', st.W / 2, 92, 18, st.mult > 1 ? GOLD : T.ink2, 'center', 800, true); if (st.mult > 1) text(g, 'x' + st.mult, st.W / 2, 116, 22, GOLD, 'center', 800, true); }
      }
    });
  })();

})();
