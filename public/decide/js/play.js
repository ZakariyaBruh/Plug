/*
 * play.js — Play with Dot, rebuilt.
 *
 * The first set were forty lines each, drawn with emoji on a gradient, with a
 * 340px stage, one life of feedback and nothing that made a second run different
 * from the first. These are ten games with a rulebook each, drawn in one hand
 * (js/sprites.js: flat colour, one dark outline, no glow), with a start card that
 * says what to do, a countdown, a pause that waits, hit-stop and shake when
 * something lands, and a results card with stars.
 *
 * It is loaded on first use, not at startup: nobody opening the app to decide
 * dinner pays for it. app.js keeps a small stub called Play and fetches this.
 *
 *   M45Play.init({ Dot, Buddy, shell, reduceMotion })
 *   M45Play.open('arena')   or   M45Play.open()   for the shelf
 *
 * Layout of this file: the arcade shell (one loop, one set of effects, one HUD),
 * then the games in the order they sit on the shelf.
 */
(function () {
  'use strict';

  var Sound = window.FoodSound;
  var S = window.Sprites;
  var D = null;
  var TAU = Math.PI * 2;
  var INK = '#2a1d16', PAPER = '#f4ead8', CREAM = '#fff8e8';
  var FONT = "'Bricolage Grotesque', system-ui, -apple-system, 'Segoe UI', sans-serif";
  var reduce = false;

  var open = false, root = null, body = null, sayEl = null, dotEl = null, back = null, shellEl = null;
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
  function text(g, str, x, y, size, color, align, weight, stroke) {
    g.font = (weight || 800) + ' ' + size + 'px ' + FONT;
    g.textAlign = align || 'center'; g.textBaseline = 'middle';
    if (stroke) { g.lineWidth = Math.max(3, size / 5); g.lineJoin = 'round'; g.strokeStyle = stroke; g.strokeText(str, x, y); }
    g.fillStyle = color || INK; g.fillText(str, x, y);
  }
  function rrect(g, x, y, w, hh, r) {
    r = Math.min(r, w / 2, hh / 2);
    g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + hh, r); g.arcTo(x + w, y + hh, x, y + hh, r); g.arcTo(x, y + hh, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }
  // The one container the games share: a flat rounded tab with an outline and a hard offset shadow.
  function tab(g, x, y, w, hh, fill, r, lift) {
    var o = lift === undefined ? 3 : lift;
    rrect(g, x + o, y + o, w, hh, r === undefined ? 8 : r); g.fillStyle = INK; g.fill();
    rrect(g, x, y, w, hh, r === undefined ? 8 : r); g.fillStyle = fill || CREAM; g.fill(); g.lineWidth = 3; g.strokeStyle = INK; g.stroke();
  }
  function disc(g, x, y, r, fill, w) { g.beginPath(); g.arc(x, y, r, 0, TAU); if (fill) { g.fillStyle = fill; g.fill(); } g.lineWidth = w || 3; g.strokeStyle = INK; g.stroke(); }
  function shadow(g, x, y, rx, ry) { g.fillStyle = 'rgba(42,29,22,.22)'; g.beginPath(); g.ellipse(x, y, rx, ry === undefined ? rx * 0.35 : ry, 0, 0, TAU); g.fill(); }
  function sprite(g, id, x, y, size, rot, flip) { S.draw(g, id, x, y, size, rot, flip); }
  // A pattern tile drawn once and repeated: the floor, the wall, the tablecloth.
  function pattern(g, w, hh, paint) {
    var c = document.createElement('canvas'); c.width = w; c.height = hh; paint(c.getContext('2d'), w, hh);
    return g.createPattern(c, 'repeat');
  }
  function checker(a, b, size) { return function (g, w, hh) { g.fillStyle = a; g.fillRect(0, 0, w, hh); g.fillStyle = b; g.fillRect(0, 0, w / 2, hh / 2); g.fillRect(w / 2, hh / 2, w / 2, hh / 2); }; }

  /* ------------------------------------------------------------ the arcade shell */
  /*
   * One of these runs every game. A game is a definition:
   *   id, name, W, H, bg            the stage and its flat colour
   *   how: [[sprite, line], ...]    what the start card says
   *   lives                         hearts (0 for none)
   *   hud(st)                       the line in the score tab (default 'Score n')
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
    var W = def.W || 360, H = def.H || 560;
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    var wrap = h('div', 'pg-stage');
    var cv = h('canvas', 'pg-canvas');
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    cv.style.setProperty('--ar', W / H);
    cv.style.aspectRatio = W + ' / ' + H;
    cv.setAttribute('aria-label', def.name + '. A game; the controls are on the card before it starts.');
    cv.setAttribute('role', 'img');
    var g = cv.getContext('2d');
    g.scale(dpr, dpr);
    wrap.appendChild(cv);
    var bar = h('div', 'pg-bar');
    var pauseBtn = h('button', 'pg-btn pg-pause', 'Pause'); pauseBtn.type = 'button';
    var quitBtn = h('button', 'pg-btn pg-quit', 'Quit'); quitBtn.type = 'button';
    bar.appendChild(pauseBtn); bar.appendChild(quitBtn);
    body.appendChild(wrap); body.appendChild(bar);

    var st = {
      W: W, H: H, g: g, cv: cv, def: def, t: 0, score: 0, over: false, paused: false,
      phase: 'intro', phaseT: 0, count: 0, lives: def.lives === undefined ? 3 : def.lives, maxLives: def.lives === undefined ? 3 : def.lives,
      shake: 0, flash: 0, hitstop: 0, slow: 1, fx: [], pops: [], inv: 0,
      p: { x: W / 2, y: H * 0.7, down: false, id: -1 }, keys: {}, hooks: [], timers: [], stars: 0
    };
    var raf = 0, last = performance.now(), acc = 0, ended = false, quit = false;

    st.add = function (n, x, y, color) { st.score += n; if (x !== undefined) st.pop(x, y, '+' + n, color); };
    st.pop = function (x, y, str, color) { st.pops.push({ x: x, y: y, s: str, c: color || CREAM, life: 0.9, age: 0 }); };
    st.burst = function (x, y, color, n, o) {
      o = o || {};
      for (var i = 0; i < (n || 10); i++) {
        var a = o.arc ? o.arc[0] + Math.random() * (o.arc[1] - o.arc[0]) : Math.random() * TAU, v = (o.v || 150) * (0.35 + Math.random() * 0.8);
        st.fx.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - (o.up || 30), life: (o.life || 0.55) * (0.6 + Math.random() * 0.7), age: 0, c: color || '#f0b429', r: (o.r || 3) * (0.6 + Math.random() * 0.9), g: o.g === undefined ? 380 : o.g, sq: !!o.sq });
      }
    };
    st.hit = function (ms) { if (!reduce) st.hitstop = Math.max(st.hitstop, (ms || 50) / 1000); };
    st.rumble = function (n) { if (!reduce) st.shake = Math.max(st.shake, n || 6); try { if (navigator.vibrate) navigator.vibrate(18); } catch (err) { /* fine */ } };
    st.on = function (target, ev, fn, o) { target.addEventListener(ev, fn, o); st.hooks.push([target, ev, fn, o]); };
    st.later = function (ms, fn) { var id = setTimeout(function () { if (!ended) fn(); }, ms); st.timers.push(id); return id; };
    st.hurt = function (x, y) {
      if (st.over || st.inv > 0) return false;
      st.lives--; st.inv = 1.1; st.flash = 1; st.rumble(9); st.hit(80); Sound.bust(); D.Dot.mood(dotEl, 'sad', 800);
      if (x !== undefined) st.burst(x, y, '#e4572e', 14, { v: 190 });
      if (st.lives <= 0) st.end();
      return true;
    };
    st.heal = function () { if (st.lives < st.maxLives) { st.lives++; return true; } return false; };
    st.end = function () {
      if (st.over) return;
      st.over = true; st.phase = 'over'; st.phaseT = 0; st.flash = 1; st.rumble(10);
    };
    st.rand = Math.random;

    function pt(e) { var r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H }; }
    function over(p, x, y, w, hh) { return p.x >= x && p.x <= x + w && p.y >= y && p.y <= y + hh; }

    function begin() { st.phase = 'count'; st.count = 3.4; st.phaseT = 0; Sound.count(false); }
    function togglePause() {
      if (st.phase !== 'play' && !st.paused) return;
      st.paused = !st.paused; pauseBtn.textContent = st.paused ? 'Resume' : 'Pause';
      cv.classList.toggle('is-paused', st.paused);
    }

    cv.addEventListener('pointerdown', function (e) {
      e.preventDefault();
      var p = pt(e); st.p.x = p.x; st.p.y = p.y; st.p.down = true; st.p.id = e.pointerId;
      try { cv.setPointerCapture(e.pointerId); } catch (err) { /* fine */ }
      if (st.phase === 'intro') { if (e.isTrusted !== false) begin(); return; }
      if (st.paused) { togglePause(); return; }
      if (st.phase === 'play' && over(p, W - 40, 8, 32, 32)) { togglePause(); return; }
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
    pauseBtn.addEventListener('click', togglePause);
    quitBtn.addEventListener('click', function () { quit = true; menu(); });

    /* ---- drawing of everything that is not the game */
    function hud() {
      var label = def.hud ? def.hud(st) : 'Score ' + st.score;
      g.font = '800 15px ' + FONT;
      var w = Math.max(92, g.measureText(label).width + 28);
      tab(g, 8, 8, w, 32, CREAM, 10, 3);
      text(g, label, 8 + w / 2, 25, 15, INK);
      if (st.maxLives > 0) {
        for (var i = 0; i < st.maxLives; i++) {
          var on = i < st.lives;
          g.globalAlpha = on ? 1 : 0.3;
          var beat = on && st.lives === 1 ? 1 + Math.sin(st.t * 9) * 0.1 : 1;
          sprite(g, 'heart', 14 + i * 24, 56, 22 * beat, 0);
        }
        g.globalAlpha = 1;
      }
      // pause
      tab(g, W - 40, 8, 32, 32, CREAM, 10, 3);
      g.fillStyle = INK; g.fillRect(W - 29, 16, 4, 16); g.fillRect(W - 21, 16, 4, 16);
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
        g.save(); g.translate(p.x, p.y); g.scale(sc, sc); g.globalAlpha = Math.min(1, (p.life - p.age) * 3); text(g, p.s, 0, 0, 17, p.c, 'center', 800, INK); g.restore();
      }
      g.globalAlpha = 1;
    }
    function card() {
      g.fillStyle = 'rgba(42,29,22,.55)'; g.fillRect(0, 0, W, H);
      var x = 24, y = 70, w = W - 48, hh = Math.min(H - 150, 100 + (def.how || []).length * 62 + 70);
      tab(g, x, y, w, hh, CREAM, 18, 5);
      text(g, def.name, W / 2, y + 36, 30, INK);
      var all = bestAll();
      text(g, all[def.id] ? 'Best ' + all[def.id] : 'Your first go', W / 2, y + 66, 14, '#8a7a68', 'center', 700);
      (def.how || []).forEach(function (row, i) {
        var yy = y + 108 + i * 62;
        disc(g, x + 44, yy, 22, row[2] || '#f4ead8', 2.5);
        sprite(g, row[0], x + 44, yy, 34, 0);
        g.font = '700 15px ' + FONT; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = INK;
        wrapText(g, row[1], x + 80, yy, w - 100, 18);
      });
      var pulse = 1 + Math.sin(st.t * 5) * 0.04;
      g.save(); g.translate(W / 2, y + hh - 38); g.scale(pulse, pulse);
      tab(g, -92, -22, 184, 44, '#f0b429', 22, 4); text(g, 'TAP TO START', 0, 1, 17, INK); g.restore();
    }
    function wrapText(g2, str, x, y, maxW, lh) {
      var words2 = str.split(' '), line2 = '', lines = [];
      words2.forEach(function (w2) { var t2 = line2 ? line2 + ' ' + w2 : w2; if (g2.measureText(t2).width > maxW && line2) { lines.push(line2); line2 = w2; } else line2 = t2; });
      lines.push(line2);
      lines.forEach(function (l, i) { g2.fillText(l, x, y + (i - (lines.length - 1) / 2) * lh); });
    }
    function counting() {
      g.fillStyle = 'rgba(42,29,22,.45)'; g.fillRect(0, 0, W, H);
      var n = Math.ceil(st.count - 0.4), frac = (st.count - 0.4) - Math.floor(st.count - 0.4);
      if (n >= 1) { var pop = 1 + 0.35 * Math.pow(frac, 3); g.save(); g.translate(W / 2, H / 2); g.scale(pop, pop); text(g, String(n), 0, 0, 96, CREAM, 'center', 800, INK); g.restore(); }
      else { var s = 1 + (0.4 - Math.max(0, st.count)) * 2; g.save(); g.translate(W / 2, H / 2); g.scale(s, s); g.globalAlpha = Math.max(0, st.count / 0.4); text(g, 'GO!', 0, 0, 80, '#f0b429', 'center', 800, INK); g.restore(); g.globalAlpha = 1; }
    }
    function pauseCard() {
      g.fillStyle = 'rgba(42,29,22,.6)'; g.fillRect(0, 0, W, H);
      tab(g, W / 2 - 100, H / 2 - 44, 200, 88, CREAM, 18, 5);
      text(g, 'Paused', W / 2, H / 2 - 12, 28, INK); text(g, 'Tap to carry on', W / 2, H / 2 + 22, 14, '#8a7a68', 'center', 700);
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

      g.save();
      g.clearRect(0, 0, W, H);
      if (st.shake > 0.3 && !reduce) g.translate((Math.random() - 0.5) * st.shake, (Math.random() - 0.5) * st.shake);
      def.draw(st, g);
      effects(st.phase === 'play' && st.hitstop > 0 ? 0 : raw);
      g.restore();
      if (st.flash > 0 && !reduce) { g.fillStyle = 'rgba(255,255,255,' + st.flash * 0.45 + ')'; g.fillRect(0, 0, W, H); }
      if (st.phase !== 'intro') hud();
      if (st.phase === 'intro') card();
      else if (st.phase === 'count') counting();
      else if (st.paused) pauseCard();
      if (st.phase === 'over') {
        var a = Math.min(1, st.phaseT / 0.9);
        g.fillStyle = 'rgba(42,29,22,' + a * 0.55 + ')'; g.fillRect(0, 0, W, H);
        if (st.phaseT > 0.25) { var k = easeBack(Math.min(1, (st.phaseT - 0.25) * 3)); g.save(); g.translate(W / 2, H / 2); g.scale(k, k); text(g, def.overText || 'Oof.', 0, 0, 54, CREAM, 'center', 800, INK); g.restore(); }
        if (st.phaseT > 1.3 && !ended) { ended = true; results(def, st); return; }
      }
      raf = requestAnimationFrame(frame);
    }
    cleanup = function () {
      ended = true; cancelAnimationFrame(raf); st.over = true;
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
  function screen() { body.textContent = ''; body.scrollTop = 0; return body; }
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
    card.appendChild(h('p', 'pg-best', b.beat ? 'New best' : 'Best ' + b.best));
    var acts = h('div', 'pg-actions');
    var again = h('button', 'pg-btn is-main', 'Play again'); again.type = 'button'; again.addEventListener('click', function () { Sound.tick(); launch(def.id); });
    var other = h('button', 'pg-btn', 'Another game'); other.type = 'button'; other.addEventListener('click', function () { Sound.tick(); menu(); });
    acts.appendChild(again); acts.appendChild(other);
    card.appendChild(acts);
    s.appendChild(card);
    var lines = def.notes || ['Again?'];
    say(b.beat ? pick(['A new best. I am not crying. You are.', 'Record. I will tell the dishes.']) : st.score >= b.best * 0.8 ? pick(['So close to your best.', 'Nearly. Again?']) : pick(lines), b.beat ? 'celebrate' : 'shrug');
    again.focus();
  }

  var SHELF = [];   // filled by the games below, in order
  function register(def) { SHELF.push(def); }

  function cover(def) {
    var c = document.createElement('canvas'); var w = 320, hh = 200, dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = w * dpr; c.height = hh * dpr; c.className = 'pg-cover'; c.setAttribute('aria-hidden', 'true');
    var g = c.getContext('2d'); g.scale(dpr, dpr);
    g.fillStyle = def.color; g.fillRect(0, 0, w, hh);
    // a little scene, made of the same sprites the game uses
    g.fillStyle = 'rgba(42,29,22,.12)'; g.fillRect(0, hh - 52, w, 52);
    (def.cover || []).forEach(function (it) { shadow(g, it[1], it[2] + it[3] * 0.42, it[3] * 0.34); sprite(g, it[0], it[1], it[2], it[3], it[4] || 0); });
    return c;
  }

  function menu() {
    stop();
    var s = screen();
    say(pick(['Pick a game. I will lose gracefully. Probably.', 'Games. My favourite thing after dishes.', 'Go on. Choose. I have all day.']), 'happy');
    var shuffleBtn = h('button', 'pg-btn is-main pg-shuffle', 'Pick one for me'); shuffleBtn.type = 'button';
    shuffleBtn.addEventListener('click', function () { Sound.tick(); launch(pick(SHELF).id); });
    s.appendChild(shuffleBtn);
    var grid = h('div', 'pg-grid');
    var all = bestAll();
    SHELF.forEach(function (def, i) {
      var cardBtn = h('button', 'pg-tile'); cardBtn.type = 'button';
      cardBtn.style.setProperty('--tilt', ((i % 2 ? 1 : -1) * (0.6 + (i % 3) * 0.35)) + 'deg');
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
    token = {};
    say(def.intro || 'Here we go.', 'happy');
    arcade(def);
  }

  /* ------------------------------------------------------------- the dialog */
  function build() {
    root = h('div', 'pg');
    root.setAttribute('role', 'dialog'); root.setAttribute('aria-modal', 'true'); root.setAttribute('aria-labelledby', 'pg-title');
    root.hidden = true;
    var panel = h('div', 'pg-panel');
    var head = h('header', 'pg-head');
    dotEl = h('span', 'mascot pg-dot'); D.Dot.mount(dotEl);
    var txt = h('div', 'pg-headtext');
    var title = h('h2', '', 'Play with Dot'); title.id = 'pg-title';
    sayEl = h('p', 'pg-say'); sayEl.setAttribute('aria-live', 'polite');
    txt.appendChild(title); txt.appendChild(sayEl);
    var x = h('button', 'pg-x', '×'); x.type = 'button'; x.setAttribute('aria-label', 'Close'); x.addEventListener('click', close);
    head.appendChild(dotEl); head.appendChild(txt); head.appendChild(x);
    body = h('div', 'pg-body');
    panel.appendChild(head); panel.appendChild(body);
    root.appendChild(panel);
    root.addEventListener('click', function (e) { if (e.target === root) close(); });
    document.addEventListener('keydown', function (e) { if (open && e.key === 'Escape') close(); });
    document.body.appendChild(root);
  }
  function openGames(which) {
    if (open) return;
    if (!root) build();
    open = true; back = document.activeElement;
    if (D.Buddy) D.Buddy.sync();
    root.hidden = false;
    root.classList.remove('is-in'); void root.offsetWidth; root.classList.add('is-in');
    var sh = D.shell(); if (sh && 'inert' in sh) sh.inert = true;
    if (which && SHELF.some(function (d) { return d.id === which; })) launch(which); else menu();
    var first = body.querySelector('button'); if (first) first.focus({ preventScroll: true });
  }
  function close() {
    if (!open) return;
    open = false; stop();
    root.hidden = true;
    var sh = D.shell(); if (sh && 'inert' in sh && !document.body.classList.contains('is-landing')) sh.inert = false;
    if (D.Buddy) D.Buddy.sync();
    if (back && back.focus) try { back.focus(); } catch (err) { /* fine */ }
  }

  var M45Play = window.M45Play = {
    init: function (deps) { D = deps; reduce = !!deps.reduceMotion; },
    open: openGames, close: close, isOpen: function () { return open; }, stats: function () { return stats; },
    shelf: function () { return SHELF.map(function (d) { return d.id; }); },
    _kit: { h: h, rnd: rnd, rint: rint, clamp: clamp, lerp: lerp, pick: pick, shuffle: shuffle, dist: dist, easeOut: easeOut, easeBack: easeBack, text: text, rrect: rrect, tab: tab, disc: disc, shadow: shadow, sprite: sprite, pattern: pattern, checker: checker, register: register, INK: INK, PAPER: PAPER, CREAM: CREAM, FONT: FONT, TAU: TAU, say: say, Sound: Sound }
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
      pot: { hp: 40, r: 34, sp: 22, spr: 'pot', gem: 12, pts: 300, body: '#f0b429' }
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
      st.score += K.pts; st.pop(e.x, e.y - 8, '+' + K.pts, '#fff8e8'); st.kills++; Sound.pop(Math.min(8, st.kills % 9));
      for (var i = 0; i < K.gem; i++) st.gems.push({ x: e.x + rnd(-8, 8), y: e.y + rnd(-8, 8), vx: rnd(-60, 60), vy: rnd(-90, -20), v: 1, t: 0 });
      st.hit(e.k === 'pot' ? 160 : 30);
      if (e.k === 'pot') { st.rumble(10); st.flash = 0.6; }
    }

    register({
      id: 'arena', name: 'Food Fight', blurb: 'Survive the kitchen. Level up. Pick a perk.', color: '#e4572e',
      cover: [['chilli', 64, 104, 70, -0.5], ['onion', 252, 96, 74, 0.3], ['dot', 160, 108, 100], ['knife', 214, 146, 52, 0.5], ['star', 100, 150, 34, 0.3]],
      intro: 'They are coming. I throw seeds. You do the moving.',
      how: [['dot', 'Drag anywhere to steer. Dot throws seeds by itself.', '#fff8e8'], ['star', 'Pick up the stars. Every level, choose a perk.', '#fff2a8'], ['knife', 'Knives show a line before they charge. Step aside.', '#ffd9c8']],
      lives: 3, stars: [500, 1400, 3000], overText: 'Eaten.',
      notes: ['Chillies everywhere. I did warn you.', 'It was the onions. It is always the onions.', 'You were doing so well, and then you were not.'],
      hud: function (st) { return 'Wave ' + st.wave + '  ·  ' + st.score; },
      __levelUp: function (st) { levelUp(st); },   // for the driver
      setup: function (st) {
        st.x = st.W / 2; st.y = st.H * 0.58; st.vx = 0; st.vy = 0; st.en = []; st.sh = []; st.gems = []; st.fl = []; st.fire = 0.4; st.wave = 1; st.waveT = 0; st.spawnT = 0.5;
        st.xp = 0; st.need = 5; st.lvl = 1; st.rate = 0.62; st.dmg = 1; st.multi = 1; st.pierce = 0; st.mag = 56; st.spd = 124; st.orbit = 0; st.oa = 0; st.choice = null; st.kills = 0; st.stick = null; st.banner = 1.6; st.sfx = 0; st.face = 'smile';
        st.floor = pattern(st.g, 64, 64, checker('#f1e3c8', '#e8d6b4'));
      },
      down: function (st, p) {
        if (st.choice) {
          if (st.t - st.pickAt < 0.35) return;
          st.rects.forEach(function (r, i) { if (p.x >= r[0] && p.x <= r[0] + r[2] && p.y >= r[1] && p.y <= r[1] + r[3]) { apply(st, st.choice[i].id); st.choice = null; Sound.reveal(); } });
          return;
        }
        st.stick = { ax: p.x, ay: p.y, x: p.x, y: p.y };
      },
      move: function (st, p) { if (st.stick) { st.stick.x = p.x; st.stick.y = p.y; } },
      up: function (st) { st.stick = null; },
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
        st.vx += (ix * st.spd - st.vx) * a; st.vy += (iy * st.spd - st.vy) * a;
        st.x = clamp(st.x + st.vx * dt, 14, st.W - 14); st.y = clamp(st.y + st.vy * dt, 74, st.H - 14);

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
            sh.hit[q + ':' + e.ph] = 1; e.hp -= st.dmg; e.hit = 0.12; Sound.hit(); st.burst(sh.x, sh.y, '#fff8e8', 4, { v: 90, life: 0.25, r: 2 });
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
        g.fillStyle = 'rgba(42,29,22,.08)'; g.fillRect(0, 0, st.W, 56);
        st.gems.forEach(function (gm) { var bob = Math.sin(st.t * 6 + gm.x) * 2; shadow(g, gm.x, gm.y + 8, 6); sprite(g, 'star', gm.x, gm.y + bob, 17, st.t * 2); });
        st.en.forEach(function (e) {
          var K = KINDS[e.k], sq = 1 + Math.sin(st.t * 10 + e.ph) * 0.05;
          shadow(g, e.x, e.y + e.r * 0.8, e.r * 0.9);
          if (e.k === 'knife') {
            if (e.state === 'aim') { g.save(); g.setLineDash([6, 7]); g.strokeStyle = 'rgba(217,58,43,' + (0.35 + 0.4 * Math.sin(st.t * 24)) + ')'; g.lineWidth = 3; g.beginPath(); g.moveTo(e.x, e.y); g.lineTo(e.x + Math.cos(e.ang) * 420, e.y + Math.sin(e.ang) * 420); g.stroke(); g.restore(); }
            sprite(g, 'knife', e.x, e.y, 38, (e.ang || 0) - 2.4 + 0.8 + 0.8);
          } else {
            g.save(); g.translate(e.x, e.y); g.scale(sq, 2 - sq);
            sprite(g, K.spr, 0, 0, e.r * 3, e.hit > 0 ? Math.sin(st.t * 60) * 0.12 : 0);
            if (e.hit > 0) { g.globalCompositeOperation = 'source-atop'; }
            g.restore();
            if (e.max > 3 && e.hp < e.max) { var bw = e.r * 1.8; g.fillStyle = INK; g.fillRect(e.x - bw / 2 - 1, e.y - e.r - 12, bw + 2, 7); g.fillStyle = '#e4572e'; g.fillRect(e.x - bw / 2, e.y - e.r - 11, bw * Math.max(0, e.hp / e.max), 5); }
          }
        });
        st.fl.forEach(function (f) { sprite(g, 'flame', f.x, f.y, 22, Math.sin(st.t * 12 + f.x) * 0.2); });
        st.sh.forEach(function (s) { sprite(g, 'seed', s.x, s.y, 15, s.a); });
        // the plates, behind and in front of Dot as they go round
        for (var o = 0; o < st.orbit; o++) { var oa = st.oa + o * TAU / st.orbit; sprite(g, 'plate', st.x + Math.cos(oa) * 38, st.y + Math.sin(oa) * 38, 24, 0); }
        // Dot
        shadow(g, st.x, st.y + 13, 12);
        var blink = st.inv > 0 && Math.floor(st.t * 16) % 2 === 0;
        if (!blink) { var bounce = 1 + Math.hypot(st.vx, st.vy) / st.spd * Math.sin(st.t * 22) * 0.07; g.save(); g.translate(st.x, st.y); g.scale(1 / bounce, bounce); S.dot(g, 0, 0, 17, st.over ? 'dead' : st.inv > 0 ? 'sad' : st.face); g.restore(); }
        if (st.stick) { g.save(); g.globalAlpha = 0.5; disc(g, st.stick.ax, st.stick.ay, 30, 'rgba(255,248,232,.5)', 2.5); var dx = st.stick.x - st.stick.ax, dy = st.stick.y - st.stick.ay, m = Math.hypot(dx, dy) || 1, kk = Math.min(1, m / 38) * 18; disc(g, st.stick.ax + dx / m * kk, st.stick.ay + dy / m * kk, 13, CREAM, 2.5); g.restore(); }
        // xp, along the bottom
        var bw2 = st.W - 40; tab(g, 20, st.H - 26, bw2, 14, CREAM, 7, 2);
        g.save(); rrect(g, 21, st.H - 25, Math.max(10, (bw2 - 2) * st.xp / st.need), 12, 6); g.clip(); g.fillStyle = '#f0b429'; g.fillRect(21, st.H - 25, bw2, 12); g.restore();
        text(g, 'LV ' + st.lvl, st.W / 2, st.H - 19, 10, INK);
        if (st.banner > 0 && st.phase === 'play') { g.globalAlpha = Math.min(1, st.banner); text(g, st.wave % 5 === 0 ? 'BOSS WAVE ' + st.wave : 'WAVE ' + st.wave, st.W / 2, 108, 30, CREAM, 'center', 800, INK); g.globalAlpha = 1; }
        if (st.choice) {
          g.fillStyle = 'rgba(42,29,22,.7)'; g.fillRect(0, 0, st.W, st.H);
          text(g, 'LEVEL UP', st.W / 2, 96, 34, '#f6c744', 'center', 800, INK);
          text(g, 'Pick one', st.W / 2, 126, 14, CREAM, 'center', 700);
          var cw = 100, gap = 10, x0 = (st.W - (cw * 3 + gap * 2)) / 2;
          st.choice.forEach(function (c, i) {
            var cx = x0 + i * (cw + gap), cy = 160, hov = Math.abs(st.p.x - (cx + cw / 2)) < cw / 2 && st.p.y > cy && st.p.y < cy + 190, rise = easeBack(Math.min(1, (st.t - st.pickAt) * 4 - i * 0.15 > 0 ? (st.t - st.pickAt) * 4 - i * 0.15 : 0));
            st.rects[i] = [cx, cy, cw, 190];
            g.save(); g.translate(cx + cw / 2, cy + 95); g.scale(rise, rise); g.translate(-(cx + cw / 2), -(cy + 95));
            tab(g, cx, cy - (hov ? 4 : 0), cw, 190, CREAM, 14, 4);
            disc(g, cx + cw / 2, cy + 52 - (hov ? 4 : 0), 32, '#f4ead8', 3); sprite(g, c.icon, cx + cw / 2, cy + 52 - (hov ? 4 : 0), 46, 0);
            text(g, c.name, cx + cw / 2, cy + 108, 14, INK);
            g.font = '700 12px ' + FONT; g.fillStyle = '#6b5a48'; g.textAlign = 'center';
            var words = c.text.split(' '), line = '', ly = cy + 132;
            words.forEach(function (w) { var t = line ? line + ' ' + w : w; if (g.measureText(t).width > cw - 16 && line) { g.fillText(line, cx + cw / 2, ly); ly += 15; line = w; } else line = t; });
            g.fillText(line, cx + cw / 2, ly);
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
    how: [['dot', 'Drag left and right. Dot bounces on its own.', '#fff8e8'], ['jar', 'Jam jars throw you high. Cracked shelves crumble.', '#ffd9c8'], ['bolt', 'A bolt is a few seconds of flying. Mind the flames.', '#fff2a8']],
    lives: 0, stars: [120, 400, 900], overText: 'Splat.',
    notes: ['The floor is very firm.', 'You were so nearly on the shelf.', 'Gravity wins again. It always does.'],
    hud: function (st) { return 'Height ' + st.score; },
    setup: function (st) {
      st.px = st.W / 2; st.py = st.H - 110; st.vy = -680; st.cam = 0; st.coins = 0; st.pl = []; st.items = []; st.en = []; st.fly = 0; st.tx = st.W / 2; st.top = st.H - 70; st.squash = 0; st.lastY = st.py;
      st.pl.push({ x: st.W / 2 - 40, y: st.H - 70, w: 80, t: 'plank' });
      st.wall = pattern(st.g, 60, 60, function (g, w, hh) { g.fillStyle = '#e9dcc2'; g.fillRect(0, 0, w, hh); g.fillStyle = '#e0d1b4'; g.fillRect(0, 0, w / 2, hh); g.fillStyle = 'rgba(42,29,22,.08)'; g.fillRect(w / 2 - 1, 0, 2, hh); });
      gen(st);
    },
    down: function (st, p) { st.tx = p.x; },
    move: function (st, p) { if (st.p.down) st.tx = p.x; },
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
            if (p.t === 'crumble') { p.fall = true; p.vy = 0; Sound.thud(); st.burst(p.x + p.w / 2, p.y, '#d9a45a', 8, { sq: true, v: 100 }); }
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
        if (dist(it.x, it.y, st.px, st.py) < 24) { it.got = true; if (it.k === 'coin') { st.coins++; Sound.coin(); st.burst(it.x, it.y, '#f6c744', 8, { v: 110 }); st.pop(it.x, it.y - 8, '+25', '#fff8e8'); } else { st.fly = 2.6; Sound.whoosh(); st.burst(it.x, it.y, '#f6c744', 14, { v: 160 }); } }
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
      // far shelves, going by slower than the near ones
      var off = (cam * 0.35) % 190;
      for (var k = -1; k < 5; k++) { var sy = k * 190 - off + 100; g.fillStyle = 'rgba(42,29,22,.09)'; g.fillRect(20, sy, st.W - 40, 8); for (var j = 0; j < 4; j++) { g.fillStyle = 'rgba(42,29,22,.07)'; g.fillRect(34 + j * 82, sy - 34 - (j % 2) * 10, 40, 34 + (j % 2) * 10); } }
      st.pl.forEach(function (p) {
        var y = p.y - cam; if (y < -30 || y > st.H + 30) return;
        var col = p.t === 'crumble' ? '#e8d3a8' : p.t === 'move' ? '#9ec9de' : '#d9a45a';
        g.save(); if (p.fall) { g.translate(p.x + p.w / 2, y); g.rotate(p.vy * 0.0016); g.translate(-p.w / 2, 0); } else g.translate(p.x, y);
        rrect(g, 0, 0, p.w, 13, 6); g.fillStyle = col; g.fill(); g.lineWidth = 3; g.strokeStyle = INK; g.stroke();
        g.strokeStyle = 'rgba(42,29,22,.28)'; g.lineWidth = 2; g.beginPath(); g.moveTo(10, 5); g.lineTo(p.w * 0.45, 5); g.moveTo(p.w * 0.55, 8); g.lineTo(p.w - 10, 8); g.stroke();
        if (p.t === 'crumble') { g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); g.moveTo(p.w * 0.4, 0); g.lineTo(p.w * 0.46, 7); g.lineTo(p.w * 0.38, 13); g.stroke(); }
        if (p.spring) sprite(g, 'jar', p.w / 2, -14, 36, 0);
        g.restore();
      });
      st.items.forEach(function (it) { if (it.got) return; var y = it.y - cam + Math.sin(st.t * 5 + it.x) * 3; if (it.k === 'coin') { g.save(); g.translate(it.x, y); g.scale(Math.abs(Math.cos(st.t * 4 + it.x)) * 0.8 + 0.2, 1); sprite(g, 'coin', 0, 0, 28, 0); g.restore(); } else sprite(g, 'bolt', it.x, y, 32, Math.sin(st.t * 6) * 0.2); });
      st.en.forEach(function (e) { var y = e.y - cam; shadow(g, e.x, y + 22, 14); sprite(g, 'flame', e.x, y, 38, Math.sin(st.t * 14 + e.x) * 0.12); });
      // Dot, stretched going up and squashed on landing
      var sy = 1 + clamp(-st.vy / 2400, -0.12, 0.18) + st.squash * -0.18, sx = 2 - sy;
      g.save(); g.translate(st.px, st.py - st.cam + 16); g.scale(sx, sy);
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
    id: 'merge', name: 'Merge Pot', blurb: 'Drop food. Merge twins up to a crown.', color: '#f0b429',
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
      st.jx0 = 34; st.jx1 = st.W - 34; st.floor = st.H - 46; st.line = 150;
      st.b = []; st.aim = st.W / 2; st.cool = 0; st.next = rl(); st.cur = rl(); st.over_t = 0; st.combo = 0; st.comboT = 0; st.id = 0; st.maxL = 0;
      st.wall = pattern(st.g, 48, 48, function (g, w, hh) { g.fillStyle = '#f2d9a0'; g.fillRect(0, 0, w, hh); g.fillStyle = '#ecce8c'; g.fillRect(0, 0, w / 2, hh / 2); g.fillRect(w / 2, hh / 2, w / 2, hh / 2); });
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
      // the counter
      g.fillStyle = '#b7855a'; g.fillRect(0, st.H - 40, st.W, 40); g.fillStyle = INK; g.fillRect(0, st.H - 40, st.W, 3);
      g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(0, st.H - 37, st.W, 4);
      // the jar
      var x0 = st.jx0, x1 = st.jx1, top = 112;
      g.fillStyle = 'rgba(255,255,255,.55)'; rrect(g, x0 - 2, top, x1 - x0 + 4, st.floor - top + 4, 14); g.fill();
      g.fillStyle = 'rgba(107,183,214,.12)'; rrect(g, x0, top, x1 - x0, st.floor - top, 12); g.fill();
      g.lineWidth = 4; g.strokeStyle = INK; g.beginPath(); g.moveTo(x0 - 4, top - 8); g.lineTo(x0, top); g.lineTo(x0, st.floor - 8); g.quadraticCurveTo(x0, st.floor, x0 + 12, st.floor); g.lineTo(x1 - 12, st.floor); g.quadraticCurveTo(x1, st.floor, x1, st.floor - 8); g.lineTo(x1, top); g.lineTo(x1 + 4, top - 8); g.stroke();
      // the line
      var warn = st.over_t > 0; g.save(); g.setLineDash([8, 8]); g.lineWidth = 3; g.strokeStyle = warn ? 'rgba(228,87,46,' + (0.5 + 0.5 * Math.sin(st.t * 14)) + ')' : 'rgba(42,29,22,.28)'; g.beginPath(); g.moveTo(x0, st.line); g.lineTo(x1, st.line); g.stroke(); g.restore();
      st.b.forEach(function (o) {
        var L = st.LV[o.l], sc = 1 + o.pop * 0.25; shadow(g, o.x, st.floor + 2, o.r * 0.5, 3);
        sprite(g, L.s, o.x, o.y, o.r * 2.2 * sc, o.rot);
      });
      // glass shine, over everything in the jar
      g.fillStyle = 'rgba(255,255,255,.35)'; rrect(g, x0 + 8, top + 12, 7, 160, 3); g.fill(); rrect(g, x0 + 8, top + 180, 7, 14, 3); g.fill();
      // what is in hand, and where it will go
      var cur = st.LV[st.cur], ax = clamp(st.aim, x0 + cur.r + 2, x1 - cur.r - 2);
      if (st.cool <= 0) {
        var below = st.floor, aimR = cur.r;
        st.b.forEach(function (o) { var dxx = Math.abs(o.x - ax); if (dxx < o.r + aimR - 2) { var yy = o.y - Math.sqrt(Math.max(0, Math.pow(o.r + aimR, 2) - dxx * dxx)); if (yy < below) below = yy; } });
        if (below === st.floor) below = st.floor - aimR;
        g.save(); g.setLineDash([3, 8]); g.lineCap = 'round'; g.lineWidth = 3; g.strokeStyle = 'rgba(42,29,22,.35)'; g.beginPath(); g.moveTo(ax, 96 + cur.r); g.lineTo(ax, below - aimR); g.stroke(); g.restore();
        g.globalAlpha = 0.28; sprite(g, cur.s, ax, below, cur.r * 2.2, 0); g.globalAlpha = 1;
        sprite(g, cur.s, ax, 82, cur.r * 2.2, Math.sin(st.t * 3) * 0.08);
      } else { g.globalAlpha = Math.max(0, 1 - st.cool * 3); sprite(g, cur.s, ax, 82, cur.r * 2.2, 0); g.globalAlpha = 1; }
      // next
      tab(g, 8, 48, 74, 40, CREAM, 10, 3); text(g, 'NEXT', 28, 62, 10, '#6b5a48'); sprite(g, st.LV[st.next].s, 58, 70, 30, 0);
      if (st.combo > 1) { text(g, 'x' + st.combo + ' combo', st.W / 2, 156, 18, CREAM, 'center', 800, INK); }
      st.hudNote = st.maxL;
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
    st.score += pts; st.pop(nb.x, nb.y - N.r * 0.5, '+' + pts, st.combo > 1 ? '#f6c744' : CREAM);
    st.burst(nb.x, nb.y, '#fff8e8', 10 + nl * 2, { v: 130 + nl * 12, r: 3 }); Sound.merge(nl); st.hit(nl > 4 ? 60 : 20);
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
    var R = 18, D = 36, RH = 31.2, COLS = 9, ROWS = 12;

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
      var K = KINDS[k]; disc(g, x, y, rr, K.c, 3); g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.arc(x - rr * 0.3, y - rr * 0.35, rr * 0.28, 0, TAU); g.fill();
      sprite(g, K.s, x, y + 1, rr * 1.35, rot || 0);
    }

    register({
      id: 'pop', name: 'Dish Pop', blurb: 'Aim, bounce, match three. Drop the lot.', color: '#8c5fa8',
      cover: [['tomato', 70, 70, 56], ['lemon', 124, 100, 56], ['pepper', 180, 70, 56], ['aubergine', 240, 100, 56], ['fish', 160, 150, 60]],
      intro: 'Aim, bounce, match three. Bring the ceiling down.',
      how: [['tomato', 'Drag to aim, let go to shoot. It bounces off the walls.', '#ffd9c8'], ['lemon', 'Three of a kind pop. What they held up falls too.', '#fff2a8'], ['fish', 'Tap the next one to swap. The ceiling creeps down.', '#d6ecf5']],
      lives: 0, stars: [400, 1200, 2600], overText: 'Crowded.',
      notes: ['The ceiling won. It usually does.', 'So many aubergines. Never enough fish.', 'One more shot would have done it.'],
      setup: function (st) {
        st.gx = (st.W - COLS * D) / 2; st.gy = 52; st.par = 0; st.grid = []; st.fly = null; st.fall = []; st.gone = []; st.shots = 0; st.every = 7; st.cx = st.W / 2; st.cy = st.H - 62;
        for (var r = 0; r < 6; r++) st.grid.push(newRow(st, r));
        for (var e = 6; e < ROWS + 2; e++) st.grid.push([]);
        st.cur = ball(); st.next = ball(); st.aim = -Math.PI / 2; st.cool = 0; st.chain = 0;
        st.bg = pattern(st.cv.getContext('2d'), 40, 40, function (g, w, hh) { g.fillStyle = '#f5e6cc'; g.fillRect(0, 0, w, hh); g.fillStyle = '#eddcbc'; g.beginPath(); g.arc(w / 2, hh / 2, 3, 0, TAU); g.fill(); });
      },
      down: function (st, p) { if (dist(p.x, p.y, st.cx + 50, st.cy + 10) < 30) { var t = st.cur; st.cur = st.next; st.next = t; Sound.swap(); return; } aim(st, p); },
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
        g.fillStyle = '#d9a45a'; g.fillRect(st.gx - 6, 46, COLS * D + 12, 8); g.fillStyle = INK; g.fillRect(st.gx - 6, 52, COLS * D + 12, 3);
        // the line
        g.save(); g.setLineDash([8, 8]); g.lineWidth = 3; g.strokeStyle = 'rgba(228,87,46,.55)'; var ly = st.gy + (ROWS - 1) * RH; g.beginPath(); g.moveTo(st.gx, ly); g.lineTo(st.gx + COLS * D, ly); g.stroke(); g.restore();
        for (var r = 0; r < st.grid.length; r++) for (var c = 0; c < st.grid[r].length; c++) { var v = st.grid[r][c]; if (!(v >= 0)) continue; var q = cell(st, r, c); draw1(g, v, q.x, q.y, R - 1, 0); }
        st.gone.forEach(function (p) { var k = 1 - p.t / 0.22; draw1(g, p.k, p.x, p.y, (R - 1) * (0.4 + 0.9 * (1 - k)), 0); g.globalAlpha = 1; });
        st.fall.forEach(function (b) { draw1(g, b.k, b.x, b.y, R - 1, b.rot); });
        // the aim
        if (!st.fly && st.phase === 'play') {
          var x = st.cx, y = st.cy, a = st.aim, vx = Math.cos(a), vy = Math.sin(a), n = 0, bounces = 0;
          g.fillStyle = 'rgba(42,29,22,.55)';
          for (var s = 0; s < 120 && bounces < 3; s++) {
            x += vx * 7; y += vy * 7;
            if (x < st.gx + R) { x = st.gx + R; vx = Math.abs(vx); bounces++; } if (x > st.gx + COLS * D - R) { x = st.gx + COLS * D - R; vx = -Math.abs(vx); bounces++; }
            var hit = y <= st.gy + R;
            if (!hit) outer: for (var rr = 0; rr < st.grid.length; rr++) for (var cc = 0; cc < st.grid[rr].length; cc++) if (st.grid[rr][cc] >= 0) { var qq = cell(st, rr, cc); if (dist(x, y, qq.x, qq.y) < D * 0.86) { hit = true; break outer; } }
            if (hit) break;
            if (s % 2 === 0) { g.globalAlpha = Math.max(0.25, 1 - s / 90); g.beginPath(); g.arc(x, y, 2.6, 0, TAU); g.fill(); }
          }
          g.globalAlpha = 1;
        }
        // the cannon
        shadow(g, st.cx, st.cy + 24, 28, 8);
        g.save(); g.translate(st.cx, st.cy); g.rotate(st.aim + Math.PI / 2); rrect(g, -9, -42, 18, 44, 7); g.fillStyle = '#d9a45a'; g.fill(); g.lineWidth = 3; g.strokeStyle = INK; g.stroke(); g.restore();
        S.dot(g, st.cx, st.cy + 8, 22, st.fly ? 'open' : 'smile');
        if (!st.fly && st.cool <= 0) draw1(g, st.cur.k, st.cx, st.cy - 2, R - 1, 0);
        if (st.fly) draw1(g, st.fly.k, st.fly.x, st.fly.y, R - 1, 0);
        // next, tap to swap
        tab(g, st.cx + 28, st.cy - 6, 44, 34, CREAM, 10, 3); draw1(g, st.next.k, st.cx + 50, st.cy + 11, 11, 0);
        text(g, 'NEXT', st.cx + 50, st.cy - 14, 9, '#6b5a48');
        // how long until the ceiling comes down
        var left = st.every - (st.shots % st.every);
        for (var i = 0; i < st.every; i++) { g.fillStyle = i < st.every - left ? INK : 'rgba(42,29,22,.2)'; g.beginPath(); g.arc(14 + i * 12, st.H - 18, 4, 0, TAU); g.fill(); }
        text(g, 'ceiling', 14 + st.every * 12 + 22, st.H - 18, 10, '#6b5a48', 'left', 700);
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
        var pts = group.length * 10 + (group.length - 3) * 15; st.score += pts; st.pop(f.x, f.y, '+' + pts, CREAM); Sound.pop(Math.min(8, group.length)); st.hit(25);
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
    var NC = 7, NR = 8, CS = 46, TIME = 60;

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
    function addTime(st, n) { st.time = Math.min(TIME + 20, st.time + n); st.pop(st.W / 2, 78, '+' + n + 's', '#f6c744'); }
    function activate(st, r, c, out, ctx) {
      var t = st.cells[r] && st.cells[r][c]; if (!t || out[r + ',' + c]) return;
      out[r + ',' + c] = [r, c];
      if (t.sp === 'line') { for (var i = 0; i < NC; i++) activate(st, r, i, out, ctx); if (t.dir === 'v') for (var j = 0; j < NR; j++) activate(st, j, c, out, ctx); st.pop(t.x, t.y, 'Zap', '#fff8e8'); }
      else if (t.sp === 'bomb') { for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) if (st.cells[r + dr] && st.cells[r + dr][c + dc]) activate(st, r + dr, c + dc, out, ctx); }
      else if (t.sp === 'color') { var kk = ctx.color === undefined ? rint(0, 5) : ctx.color; for (var a = 0; a < NR; a++) for (var b = 0; b < NC; b++) if (st.cells[a][b] && st.cells[a][b].k === kk) activate(st, a, b, out, ctx); }
    }
    function check(st) {
      var R = runs(st), keys = Object.keys(R.cells), forced = st.forced || []; st.forced = null;
      if (!keys.length && !forced.length) { st.combo = 0; st.state = 'idle'; st.idle = 0; if (!anyMove(st)) { st.state = 'shuffle'; st.stT = 0; st.pop(st.W / 2, 200, 'No moves. Shuffle!', CREAM); Sound.whoosh(); } return; }
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
      var c0 = pos(st, 3, 3); st.pop(st.W / 2, 90 + 24, '+' + pts, st.combo > 1 ? '#f6c744' : CREAM);
      if (st.combo > 1) st.pop(st.W / 2, 150, 'x' + st.combo + ' combo', '#f6c744');
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
      id: 'match', name: 'Match Meal', blurb: 'Swap, match, chain. Sixty seconds.', color: '#e4572e',
      cover: [['tomato', 80, 80, 52], ['lemon', 130, 80, 52], ['tomato', 180, 80, 52], ['pepper', 240, 130, 56], ['chilli', 150, 140, 62, 0.3]],
      intro: 'Swap two neighbours. Line up three. Chain them.',
      how: [['tomato', 'Swap two neighbours to line up three or more.', '#ffd9c8'], ['chilli', 'Four makes a chilli. Five makes a star. An L makes a pot.', '#ffe9b0'], ['clock', 'Sixty seconds. Big chains add time.', '#fff8e8']],
      lives: 0, stars: [900, 2600, 5200], overText: 'Time!',
      notes: ['The kitchen closed. Mostly.', 'So many combos left on the board.', 'You were one cascade from a record.'],
      hud: function (st) { return 'Score ' + st.score; },
      // for the driver: the two places to tap for a move that works
      __move: function (st) { var m = findMove(st); if (!m) return null; return m.map(function (q) { var p = pos(st, q[0], q[1]); return [p.x, p.y]; }); },
      setup: function (st) { st.gx = (st.W - NC * CS) / 2; st.gy = 100; st.time = TIME; st.combo = 0; st.state = 'idle'; st.sel = null; st.idle = 0; st.stT = 0; st.drag = null; fill(st); st.state = 'fall'; },
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
        g.fillStyle = '#f5e6cc'; g.fillRect(0, 0, st.W, st.H);
        g.fillStyle = '#eddcbc'; for (var y = 0; y < st.H; y += 28) g.fillRect(0, y, st.W, 14);
        // the board
        tab(g, st.gx - 8, st.gy - 8, NC * CS + 16, NR * CS + 16, '#fff3d8', 14, 4);
        for (var r = 0; r < NR; r++) for (var c = 0; c < NC; c++) { g.fillStyle = (r + c) % 2 ? 'rgba(42,29,22,.05)' : 'rgba(42,29,22,.0)'; g.fillRect(st.gx + c * CS, st.gy + r * CS, CS, CS); }
        g.save(); rrect(g, st.gx, st.gy, NC * CS, NR * CS, 8); g.clip();
        for (var r2 = 0; r2 < NR; r2++) for (var c2 = 0; c2 < NC; c2++) {
          var t = st.cells[r2][c2]; if (!t) continue;
          var K = KINDS[t.k], sc = t.dead ? Math.max(0, 1 - st.stT / 0.2) : t.s;
          var sel = st.sel && st.sel[0] === r2 && st.sel[1] === c2, hint = st.hint && st.hint.some(function (h2) { return h2[0] === r2 && h2[1] === c2; });
          var bob = hint ? 1 + Math.sin(st.t * 10) * 0.09 : sel ? 1.1 : 1;
          g.save(); g.translate(t.x, t.y); g.scale(sc * bob, sc * bob);
          rrect(g, -CS / 2 + 3, -CS / 2 + 3, CS - 6, CS - 6, 11); g.fillStyle = K.c; g.fill(); g.lineWidth = 3; g.strokeStyle = INK; g.stroke();
          g.fillStyle = 'rgba(255,255,255,.28)'; rrect(g, -CS / 2 + 7, -CS / 2 + 7, CS - 20, 7, 3); g.fill();
          sprite(g, K.s, 0, 1, CS - 12, 0);
          if (t.sp === 'line') { sprite(g, 'chilli', 0, 0, CS - 4, 0); g.fillStyle = INK; g.fillRect(-CS / 2 + 4, -2, CS - 8, 4); }
          if (t.sp === 'bomb') { sprite(g, 'pot', 0, 2, CS - 4, 0); }
          if (t.sp === 'color') { g.rotate(st.t * 2); sprite(g, 'star', 0, 0, CS + 2, 0); }
          g.restore();
        }
        g.restore();
        // time
        var bw = st.W - 40, k = clamp(st.time / TIME, 0, 1);
        tab(g, 20, st.H - 56, bw, 22, CREAM, 11, 3);
        g.save(); rrect(g, 22, st.H - 54, Math.max(8, (bw - 4) * k), 18, 9); g.clip(); g.fillStyle = k < 0.25 ? '#e4572e' : '#6fbf5e'; g.fillRect(22, st.H - 54, bw, 18); g.restore();
        text(g, Math.ceil(st.time) + 's', st.W / 2, st.H - 44, 13, INK);
        if (st.combo > 1 && st.state !== 'idle') text(g, 'x' + st.combo, st.W - 34, st.gy - 22, 22, '#f6c744', 'center', 800, INK);
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
      st.inva = []; st.ox = 24; st.oy = 92; st.dir = 1;
      for (var r = 0; r < rows; r++) for (var c = 0; c < COLS; c++) { var K = KIND[r + (5 - rows)]; st.inva.push({ r: r, c: c, k: K.s, hp: K.hp, pts: K.pts, hit: 0 }); }
      st.total = st.inva.length; st.banner = 1.6; st.bombT = 1.2;
    }
    function shields(st) {
      st.blocks = [];
      for (var k = 0; k < 3; k++) {
        var x0 = 36 + k * 112, y0 = st.H - 138;
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
      id: 'invade', name: 'Chilli Invaders', blurb: 'Hold the line against the marching veg.', color: '#6fbf5e',
      cover: [['aubergine', 90, 60, 50], ['chilli', 150, 60, 50, 0.3], ['onion', 210, 60, 50], ['dot', 160, 140, 74], ['seed', 160, 96, 22, 1.57]],
      intro: 'They march. I fire. You stand in the right place.',
      how: [['dot', 'Drag left and right. Dot fires by itself.', '#fff8e8'], ['cheese', 'Cheese blocks stop bombs. Your own seeds chew them too.', '#fff2a8'], ['pot', 'Hit the pot for a power-up. Do not let them land.', '#ffe3a0']],
      lives: 3, stars: [600, 1800, 3800], overText: 'Overrun.',
      notes: ['They reached the cheese. It did not end well for the cheese.', 'It was always going to be the aubergines.', 'Faster at the end. It is always faster at the end.'],
      hud: function (st) { return 'Wave ' + st.wave + '  ·  ' + st.score; },
      setup: function (st) { st.px = st.W / 2; st.tx = st.px; st.wave = 1; st.bul = []; st.bomb = []; st.pw = { rapid: 0, spread: 0 }; st.fire = 0.4; st.ufo = null; st.ufoT = 12; st.drops = []; st.py = st.H - 62; shields(st); wave(st); st.bg = pattern(st.g, 48, 48, function (g, w, hh) { g.fillStyle = '#e9dcc2'; g.fillRect(0, 0, w, hh); g.fillStyle = 'rgba(42,29,22,.07)'; g.fillRect(0, hh - 3, w, 3); g.fillRect(w - 3, 0, 3, hh); }); },
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
          if (!gone) for (var j = 0; j < st.inva.length; j++) { var v = st.inva[j], q = pos(st, v); if (Math.abs(q.x - b.x) < 15 && Math.abs(q.y - b.y) < 14) { v.hp--; v.hit = 0.1; gone = true; st.burst(b.x, b.y, '#fff8e8', 4, { v: 90, life: 0.25 }); if (v.hp <= 0) { st.score += v.pts; st.pop(q.x, q.y - 8, '+' + v.pts, CREAM); st.burst(q.x, q.y, v.k === 'chilli' ? '#d93a2b' : v.k === 'onion' ? '#d8a4c8' : '#7a4a9c', 10, { v: 150 }); st.inva.splice(j, 1); Sound.pop(rint(2, 6)); st.hit(20); } else Sound.hit(); break; } }
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
        st.inva.forEach(function (v) { var q = pos(st, v); if (q.y > st.H - 150) chew(st, q.x, q.y + 8, 16); if (q.y > st.H - 92) { st.lives = 0; st.end(); } });
      },
      draw: function (st, g) {
        g.fillStyle = st.bg; g.fillRect(0, 0, st.W, st.H);
        g.fillStyle = '#b7855a'; g.fillRect(0, st.H - 38, st.W, 38); g.fillStyle = INK; g.fillRect(0, st.H - 38, st.W, 3);
        st.blocks.forEach(function (b) { g.fillStyle = '#f6c744'; g.fillRect(b.x, b.y, 6, 6); g.fillStyle = 'rgba(42,29,22,.35)'; g.fillRect(b.x + 1, b.y + 4, 5, 2); });
        st.inva.forEach(function (v) { var q = pos(st, v), wob = Math.sin(st.t * 5 + v.c * 0.7 + v.r) * 2; sprite(g, v.k, q.x, q.y + wob, v.hit > 0 ? 36 : 32, Math.sin(st.t * 4 + v.c) * 0.1); v.hit -= 1 / 60; });
        st.bomb.forEach(function (b) { sprite(g, 'knife', b.x, b.y, 28, 2.4 + Math.sin(st.t * 14) * 0.2); });
        st.bul.forEach(function (b) { sprite(g, 'seed', b.x, b.y, 16, -Math.PI / 2 + b.a); });
        if (st.ufo) { shadow(g, st.ufo.x, st.ufo.y + 22, 20); sprite(g, 'pot', st.ufo.x, st.ufo.y + Math.sin(st.t * 8) * 2, 44, Math.sin(st.t * 6) * 0.1); }
        st.drops.forEach(function (d) { sprite(g, PW[d.k].s, d.x, d.y, 30, Math.sin(st.t * 6) * 0.2); });
        shadow(g, st.px, st.py + 22, 18);
        if (!(st.inv > 0 && Math.floor(st.t * 16) % 2 === 0)) { S.dot(g, st.px, st.py, 22, st.over ? 'dead' : 'smile'); }
        // gun
        rrect(g, st.px - 5, st.py - 34, 10, 16, 4); g.fillStyle = '#d8dde2'; g.fill(); g.lineWidth = 3; g.strokeStyle = INK; g.stroke();
        if (st.pw.rapid > 0) text(g, 'RAPID ' + Math.ceil(st.pw.rapid), 54, st.H - 18, 11, INK, 'center', 800);
        if (st.pw.spread > 0) text(g, 'TRIPLE ' + Math.ceil(st.pw.spread), st.W - 54, st.H - 18, 11, INK, 'center', 800);
        if (st.banner > 0 && st.phase === 'play') { g.globalAlpha = Math.min(1, st.banner); text(g, 'WAVE ' + st.wave, st.W / 2, 260, 36, CREAM, 'center', 800, INK); g.globalAlpha = 1; }
      }
    });
    function ufoHit(st) {
      var u = st.ufo; st.ufo = null; var pts = pick([50, 100, 150]); st.score += pts; st.pop(u.x, u.y, '+' + pts, '#f6c744'); st.burst(u.x, u.y, '#f0b429', 18, { v: 200 }); Sound.win(); st.rumble(6); st.hit(60);
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
    var T = 40, NC = 9;

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
        var n = rint(1, type === 'pin' ? 2 : 3), gap = (NC * T) / n;
        for (var i = 0; i < n; i++) row.items.push({ x: i * gap + rnd(0, gap * 0.4), w: type === 'pin' ? T * 1.1 : T * pick([1.6, 2, 2]) });
        if (type === 'pin') row.sp *= 1.45;
      } else if (type === 'oil') {
        var np = rint(3, 4), g2 = (NC * T + 120) / np;
        for (var j = 0; j < np; j++) row.items.push({ x: j * g2 + rnd(0, 20), w: pick([T * 2, T * 2, T * 2.6]) });
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
    function rowY(st, r) { return -r * T - st.cam; }

    function die(st, why) {
      if (st.dead) return; st.dead = why; st.dyingT = 0;
      if (why === 'oil') { st.burst(st.dx, rowY(st, st.dr) + T / 2, '#e6a82a', 18, { v: 200, up: 120 }); Sound.splat(); }
      else if (why === 'fire') { st.burst(st.dx, rowY(st, st.dr) + T / 2, '#f0762a', 16, { v: 180 }); Sound.bust(); }
      else { st.burst(st.dx, rowY(st, st.dr) + T / 2, '#fff8e8', 16, { v: 200 }); Sound.thud(); }
      st.rumble(9); st.hit(90); st.later(380, function () { st.end(); });
    }
    function hop(st, dc, dr) {
      if (st.dead || st.hopT > 0 && st.hopT < 0.5) return;
      var c = clamp(Math.round((st.dx - T / 2) / T) + dc, 0, NC - 1), r = Math.max(0, st.dr + dr);
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
      how: [['dot', 'Tap to hop forward. Swipe to hop sideways or back.', '#fff8e8'], ['trolley', 'Trolleys and rolling pins cross the lanes. Time it.', '#d6f1ef'], ['plate', 'Hot oil: only plates are safe, and they carry you. Keep moving.', '#ffe3a0']],
      lives: 0, stars: [20, 50, 100], overText: 'Squashed.',
      notes: ['The trolley did not stop. They never do.', 'The oil was exactly as hot as it looked.', 'Always one more lane. Always.'],
      hud: function (st) { return 'Rows ' + st.score; },
      setup: function (st) {
        st.rows = []; for (var i = 0; i < 14; i++) make(st);
        st.cam = -(st.H - 150); st.dr = 0; st.dc = 4; st.dx = 4 * T + T / 2; st.dtr = 0; st.hopT = 0; st.fx0 = st.dx; st.fr0 = 0; st.dead = null; st.best = 0; st.idle = 0; st.bump = 0; st.flip = 1; st.carry = 0; st.coinN = 0;
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
            st.hopT = 0; st.dr = st.dtr; st.dx = st.dc * T + T / 2;
            var row = rowAt(st, st.dr);
            if (st.dr > st.best) { st.best = st.dr; st.score = st.best; Sound.climb(Math.min(14, st.best % 15)); }
            if (row.coins && row.coins[st.dc]) { delete row.coins[st.dc]; st.coinN++; st.score += 3; st.pop(st.dx, rowY(st, st.dr), '+3', '#f6c744'); Sound.coin(); }
            if (row.type === 'oil') { var on = row.items.some(function (it) { var x = ((it.x + row.dir * row.sp * st.t) % (NC * T + 120) + (NC * T + 120)) % (NC * T + 120) - 60; return st.dx > x - 4 && st.dx < x + it.w + 4; }); if (!on) return die(st, 'oil'); }
            while (st.rows.length < st.dr + 14) make(st);
          }
        }
        var rowNow = rowAt(st, st.dr);
        // carried by a plate
        if (st.hopT === 0 && rowNow.type === 'oil') { st.dx += rowNow.dir * rowNow.sp * dt; if (st.dx < 6 || st.dx > NC * T - 6) return die(st, 'edge'); }
        // the lanes
        var px = st.hopT > 0 ? lerp(st.fx0, st.dc * T + T / 2, st.hopT) : st.dx, pr = st.hopT > 0 ? lerp(st.fr0, st.dtr, st.hopT) : st.dr;
        var rr = Math.round(pr), r2 = rowAt(st, rr);
        if (r2 && (r2.type === 'road' || r2.type === 'pin')) {
          for (var i = 0; i < r2.items.length; i++) { var it = r2.items[i], x = ((it.x + r2.dir * r2.sp * st.t) % (NC * T + it.w) + (NC * T + it.w)) % (NC * T + it.w) - it.w; if (px + 11 > x && px - 11 < x + it.w && Math.abs(pr - rr) < 0.4) return die(st, 'hit'); }
        }
        if (r2 && r2.type === 'fire' && st.hopT === 0) { var cc = Math.floor(st.dx / T); if (r2.cols[cc] && ((st.t + r2.t) % 3) > 1.8 && ((st.t + r2.t) % 3) < 2.7) return die(st, 'fire'); }
        // the screen creeps past you
        var sy = rowY(st, pr) + T / 2; if (sy > st.H + 10) return die(st, 'behind');
        var want = -(pr * T) - st.H * 0.52; if (want < st.cam) st.cam += (want - st.cam) * Math.min(1, 6 * dt);
      },
      draw: function (st, g) {
        // rows, far to near
        var first = Math.max(0, Math.floor((-st.cam - st.H) / T) - 1), last = Math.min(st.rows.length - 1, Math.ceil((-st.cam + 40) / T) + 1);
        for (var r = first; r <= last; r++) {
          var row = st.rows[r]; if (!row) continue; var y = rowY(st, r);
          if (row.type === 'safe') { g.fillStyle = r % 2 ? '#e9dcc2' : '#efe3cb'; g.fillRect(0, y, st.W, T); for (var c = 0; c < NC; c++) { if ((c + r) % 2) { g.fillStyle = 'rgba(42,29,22,.04)'; g.fillRect(c * T, y, T, T); } } }
          else if (row.type === 'road' || row.type === 'pin') { g.fillStyle = '#8c8c94'; g.fillRect(0, y, st.W, T); g.fillStyle = 'rgba(255,255,255,.35)'; for (var d = 0; d < NC; d++) g.fillRect(d * T + 8, y + T / 2 - 2, 14, 4); g.fillStyle = INK; g.fillRect(0, y, st.W, 2); g.fillRect(0, y + T - 2, st.W, 2); }
          else if (row.type === 'oil') { g.fillStyle = '#e0a02a'; g.fillRect(0, y, st.W, T); g.fillStyle = '#f0b84a'; for (var b = 0; b < 8; b++) { var bx = (b * 47 + st.t * 12 * (b % 2 ? 1 : -1) + 400) % st.W, by = y + 8 + (b % 3) * 11; g.beginPath(); g.arc(bx, by, 3 + (b % 2), 0, TAU); g.fill(); } g.fillStyle = INK; g.fillRect(0, y, st.W, 2); g.fillRect(0, y + T - 2, st.W, 2); }
          else { g.fillStyle = '#e9dcc2'; g.fillRect(0, y, st.W, T); }
          if (row.type === 'safe') { for (var cb in row.blocks) sprite(g, row.blocks[cb], cb * T + T / 2, y + T / 2, T - 6, 0); for (var cn in row.coins) { g.save(); g.translate(cn * T + T / 2, y + T / 2); g.scale(Math.abs(Math.cos(st.t * 4 + +cn)) * 0.8 + 0.2, 1); sprite(g, 'coin', 0, 0, 22, 0); g.restore(); } }
          if (row.type === 'fire') { for (var f = 0; f < NC; f++) { if (!row.cols[f]) continue; var on = fireOn(st, row, f), warn = fireWarn(st, row, f); g.fillStyle = on ? 'rgba(240,118,42,.35)' : warn ? 'rgba(228,87,46,' + (0.2 + 0.25 * Math.sin(st.t * 24)) + ')' : 'rgba(42,29,22,.08)'; g.fillRect(f * T + 2, y + 2, T - 4, T - 4); g.strokeStyle = 'rgba(42,29,22,.25)'; g.lineWidth = 2; g.strokeRect(f * T + 5, y + 5, T - 10, T - 10); if (on) sprite(g, 'flame', f * T + T / 2, y + T / 2 - 2, T + 4, Math.sin(st.t * 16 + f) * 0.1); } }
          if (row.type === 'road') row.items.forEach(function (it) { var w = NC * T + it.w, x = ((it.x + row.dir * row.sp * st.t) % w + w) % w - it.w; g.save(); g.translate(x + it.w / 2, y + T / 2); if (row.dir < 0) g.scale(-1, 1); sprite(g, 'trolley', 0, 2, it.w * 0.95, 0); g.restore(); });
          if (row.type === 'pin') row.items.forEach(function (it) { var w = NC * T + it.w, x = ((it.x + row.dir * row.sp * st.t) % w + w) % w - it.w; sprite(g, 'rollingpin', x + it.w / 2, y + T / 2, it.w, row.dir * st.t * 6); });
          if (row.type === 'oil') row.items.forEach(function (it) { var w = NC * T + 120, x = ((it.x + row.dir * row.sp * st.t) % w + w) % w - 60; var n = Math.round(it.w / T); for (var k = 0; k < n; k++) sprite(g, 'plate', x + k * (it.w / n) + it.w / n / 2, y + T / 2, T * 0.98, 0); });
        }
        // Dot
        var pr = st.hopT > 0 ? lerp(st.fr0, st.dtr, st.hopT) : st.dr, px = st.hopT > 0 ? lerp(st.fx0, st.dc * T + T / 2, st.hopT) : st.dx;
        var py = rowY(st, pr) + T / 2, arc = st.hopT > 0 ? Math.sin(st.hopT * Math.PI) * 12 : 0, sq = st.hopT > 0 ? 1 + Math.sin(st.hopT * Math.PI) * 0.14 : 1 - st.bump * 0.4;
        shadow(g, px, py + 14, 13 - arc * 0.2);
        if (st.dead) { var k2 = Math.min(1, st.dyingT * 3); g.save(); g.translate(px, py + 4); g.scale(1 + k2 * 0.4, Math.max(0.1, 1 - k2 * (st.dead === 'oil' ? 1 : 0.8))); S.dot(g, 0, 0, 16, 'dead'); g.restore(); }
        else { g.save(); g.translate(px, py - arc); g.scale(2 - sq, sq); S.dot(g, 0, 0, 16, st.hopT > 0 ? 'open' : 'smile'); g.restore(); }
        // the creep, as a shadow coming up from underneath
        var ey = st.H - 24 + Math.sin(st.t * 3) * 2; g.fillStyle = 'rgba(42,29,22,.16)'; g.fillRect(0, ey, st.W, st.H - ey);
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
      rrect(g, x, y, w, h2, ing.n === 'lettuce' ? 4 : 9); g.fillStyle = ing.c; g.fill(); g.lineWidth = 3; g.strokeStyle = INK; g.stroke();
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
      how: [['bread', 'Tap to drop the layer. It slices off what hangs over.', '#ffe3a0'], ['star', 'Dead centre keeps the whole width. Five in a row grow it back.', '#fff2a8'], ['cheese', 'It gets faster. The tower gets taller. That is the game.', '#fff8e8']],
      lives: 0, stars: [18, 40, 70], overText: 'Timber.',
      notes: ['It was straight. Then it was not.', 'The lettuce did not stand a chance.', 'A tower is only as tall as its worst tap.'],
      hud: function (st) { return 'Layers ' + st.layers.length; },
      setup: function (st) {
        st.layers = [{ x: st.W / 2 - 80, w: 160, ing: ING[0] }]; st.cw = 160; st.dir = 1; st.cam = 0; st.camT = 0; st.cut = []; st.streak = 0; st.ring = null; st.sway = 0; st.drop = null; st.fallen = false;
        nextLayer(st); st.wall = pattern(st.g, 56, 56, function (g, w, hh) { g.fillStyle = '#efe3cb'; g.fillRect(0, 0, w, hh); g.fillStyle = 'rgba(42,29,22,.06)'; g.fillRect(0, hh - 2, w, 2); g.fillRect(w - 2, 0, 2, hh); });
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
        var floorY = st.H - 74 + st.cam; g.fillStyle = '#b7855a'; g.fillRect(0, floorY, st.W, st.H - floorY + 80); g.fillStyle = INK; g.fillRect(0, floorY, st.W, 3);
        // the plate under it all
        g.beginPath(); g.ellipse(st.W / 2, floorY + 2, 112, 13, 0, 0, TAU); g.fillStyle = '#f4ead8'; g.fill(); g.lineWidth = 3; g.strokeStyle = INK; g.stroke();
        g.beginPath(); g.ellipse(st.W / 2, floorY + 1, 84, 7, 0, 0, TAU); g.strokeStyle = 'rgba(42,29,22,.22)'; g.lineWidth = 2; g.stroke();
        var n = st.layers.length;
        st.layers.forEach(function (L, i) { var y = layerY(st, i), s = Math.pow(i / Math.max(1, n), 2) * st.sway; slab(g, L.x + s, y, L.w, L.ing); });
        st.cut.forEach(function (c) { g.save(); g.translate(c.x + c.w / 2, c.y + LH / 2); g.rotate(c.rot); g.translate(-c.w / 2, -LH / 2); slab(g, 0, 0, c.w, c.ing); g.restore(); });
        if (st.cur && !st.fallen) { var cy = st.drop ? st.drop.y : layerY(st, n - 1) - LH - 12; var cx = st.drop ? st.drop.x : st.cur.x; slab(g, cx, cy, st.cur.w, st.cur.ing); if (!st.drop) { g.save(); g.setLineDash([4, 8]); g.strokeStyle = 'rgba(42,29,22,.3)'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx, cy + LH); g.lineTo(cx, layerY(st, n - 1)); g.moveTo(cx + st.cur.w, cy + LH); g.lineTo(cx + st.cur.w, layerY(st, n - 1)); g.stroke(); g.restore(); } }
        if (st.ring) { var top2 = st.layers[n - 1], k = st.ring.t / 0.4; g.globalAlpha = 1 - k; g.lineWidth = 4; g.strokeStyle = '#f6c744'; rrect(g, top2.x - 4 - k * 12, layerY(st, n - 1) - 4 - k * 8, top2.w + 8 + k * 24, LH + 6 + k * 16, 12); g.stroke(); g.globalAlpha = 1; }
        if (st.streak > 1) text(g, st.streak + ' perfect', st.W / 2, 100, 20, '#f6c744', 'center', 800, INK);
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
        if (st.streak >= 5) { nw = Math.min(160, nw + 10); nx = Math.max(0, nx - 5); st.streak = 0; st.pop(st.W / 2, 130, 'Grew back!', CREAM); }
      }
      st.layers.push({ x: nx, w: nw, ing: cur.ing }); st.cw = nw; st.score = st.layers.length - 1 + st.score * 0 + 0; st.score = (st.layers.length - 1) + (st.bonus = (st.bonus || 0) + (perfect ? 1 : 0));
      st.dir = Math.random() < 0.5 ? -1 : 1; nextLayer(st);
      if (nw < 10) { st.cur.w = nw; }
    }
  })();


  /* ================================================================== 9. SEED SPIT */
  /*
   * Ten seeds and a plate on a shelf. Drag back from Dot like a catapult, let go,
   * and mind the draught: the arrow at the top is the wind, and it changes every
   * shot. The plate gets further away and starts to move. The bullseye is worth
   * fifty and a run of hits multiplies; a cherry drifts across the top now and
   * then for a hundred.
   */
  (function () {
    var SHOTS = 10, GRAV = 520;

    function newTarget(st) {
      var n = st.shotN, far = Math.min(1, n / 8);
      st.tx = rnd(215, 318); st.ty = rnd(210, 330); st.tr = 30 - far * 9 - rnd(0, 3); st.tamp = n < 2 ? 0 : rnd(10, 18) + n * 4; st.tspd = rnd(1.1, 1.8) + n * 0.12; st.tph = rnd(0, 6); st.horiz = n >= 5 && Math.random() < 0.5;
      st.wind = n < 1 ? 0 : rnd(-3, 3);
    }
    function targetPos(st) {
      var o = Math.sin(st.t * st.tspd + st.tph) * st.tamp;
      return st.horiz ? { x: st.tx + o, y: st.ty } : { x: st.tx, y: st.ty + o };
    }
    function shoot(st, p) {
      if (st.seed || st.fired >= SHOTS || st.shotLeft <= 0) return;
      var dx = st.dx0 - p.x, dy = st.dy0 - p.y, d = Math.hypot(dx, dy);
      if (d < 14) return;
      var pw = Math.min(1, d / 95), ang = Math.atan2(dy, dx);
      st.seed = { x: st.dx0, y: st.dy0, vx: Math.cos(ang) * pw * 620, vy: Math.sin(ang) * pw * 620, a: 0, t: 0, stuck: null };
      st.fired++; st.shotLeft--; st.pull = null; Sound.whoosh(); D.Dot.mood(dotEl, 'open', 500);
    }

    register({
      id: 'spit', name: 'Seed Spit', blurb: 'Drag back, let go. Mind the wind.', color: '#8ae06a',
      cover: [['dot', 70, 120, 72], ['plate', 250, 90, 74], ['seed', 150, 96, 24, -0.5], ['seed', 190, 84, 18, -0.2], ['cherry', 270, 150, 44]],
      intro: 'Ten seeds. One plate. Mind the wind.',
      how: [['dot', 'Drag back from Dot, then let go. Further back is harder.', '#fff8e8'], ['plate', 'The bullseye is fifty. Hits in a row multiply.', '#fff2a8'], ['cherry', 'The arrow is the wind. A cherry is a hundred.', '#ffd9d9']],
      lives: 0, stars: [260, 560, 900], overText: 'Out of seeds.',
      notes: ['The wind did that. Not me.', 'Close. The plate flinched.', 'Bullseye is mostly about not trying too hard.'],
      hud: function (st) { return 'Seeds ' + st.shotLeft + '  ·  ' + st.score; },
      setup: function (st) {
        st.dx0 = 62; st.dy0 = st.H - 150; st.shotN = 0; st.fired = 0; st.shotLeft = SHOTS; st.seed = null; st.pull = null; st.streak = 0; st.cherry = null; st.cherryT = 6; st.stuck = []; st.waitT = 0; newTarget(st);
        st.wall = pattern(st.g, 50, 50, function (g, w, hh) { g.fillStyle = '#e9dcc2'; g.fillRect(0, 0, w, hh); g.fillStyle = 'rgba(42,29,22,.07)'; g.fillRect(0, hh - 3, w, 3); g.fillRect(w - 3, 0, 3, hh); });
      },
      down: function (st, p) { if (st.seed) return; st.pull = { x: p.x, y: p.y }; },
      move: function (st, p) { if (st.pull) { var dx = p.x - st.dx0, dy = p.y - st.dy0, d = Math.hypot(dx, dy), max = 95; st.pull = d > max ? { x: st.dx0 + dx / d * max, y: st.dy0 + dy / d * max } : { x: p.x, y: p.y }; } },
      up: function (st, p) { if (st.pull) { shoot(st, st.pull); st.pull = null; } },
      update: function (st, dt) {
        var tp = targetPos(st);
        // the cherry
        st.cherryT -= dt; if (!st.cherry && st.cherryT <= 0) { st.cherry = { x: -20, y: rnd(110, 170), dir: 1 }; st.cherryT = rnd(8, 14); }
        if (st.cherry) { st.cherry.x += 110 * dt; if (st.cherry.x > st.W + 30) st.cherry = null; }
        if (st.seed) {
          var s = st.seed; s.t += dt;
          if (s.stuck) { s.x = tp.x + s.stuck.x; s.y = tp.y + s.stuck.y; if (s.t > 1.1) { st.seed = null; st.waitT = 0; if (st.shotLeft <= 0) { st.later(300, function () { st.end(); }); } else { st.shotN++; newTarget(st); } } }
          else {
            s.vy += GRAV * dt; s.vx += st.wind * 14 * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.a = Math.atan2(s.vy, s.vx);
            if (st.cherry && dist(s.x, s.y, st.cherry.x, st.cherry.y) < 18) { st.score += 100; st.pop(st.cherry.x, st.cherry.y, 'Cherry +100', '#f6c744'); st.burst(st.cherry.x, st.cherry.y, '#d1243a', 14, { v: 170 }); Sound.coin(); st.cherry = null; }
            var d = dist(s.x, s.y, tp.x, tp.y);
            if (d < st.tr + 4 && s.vx > 0) {
              var ring = d < st.tr * 0.28 ? 50 : d < st.tr * 0.62 ? 25 : 10, mult = 1 + Math.min(3, st.streak) * 0.5, pts = Math.round(ring * mult);
              s.stuck = { x: s.x - tp.x, y: s.y - tp.y }; s.t = 0; st.streak++; st.score += pts; st.pop(s.x, s.y - 10, (ring === 50 ? 'Bullseye ' : '') + '+' + pts, ring === 50 ? '#f6c744' : CREAM);
              st.burst(s.x, s.y, '#fff8e8', 10, { v: 130 }); Sound.thud(); if (ring === 50) { Sound.win(); st.rumble(8); st.hit(70); D.Dot.mood(dotEl, 'celebrate', 900); } else Sound.pop(ring === 25 ? 5 : 2);
            } else if (s.x > st.W + 20 || s.y > st.H - 40 || s.x < -40) {
              st.streak = 0; Sound.nope(); st.burst(clamp(s.x, 0, st.W), Math.min(s.y, st.H - 46), '#bba88c', 6, { v: 80 }); st.pop(clamp(s.x, 30, st.W - 30), Math.min(s.y, st.H - 60), 'Miss', '#e4572e');
              st.seed = null; st.waitT = 0;
              if (st.shotLeft <= 0) st.later(500, function () { st.end(); }); else { st.shotN++; newTarget(st); }
            }
          }
        }
      },
      draw: function (st, g) {
        g.fillStyle = st.wall; g.fillRect(0, 0, st.W, st.H);
        // shelf and counter
        g.fillStyle = '#b7855a'; g.fillRect(0, st.H - 100, st.W, 100); g.fillStyle = INK; g.fillRect(0, st.H - 100, st.W, 3); g.fillStyle = 'rgba(255,255,255,.2)'; g.fillRect(0, st.H - 97, st.W, 4);
        // wind
        tab(g, st.W / 2 - 30, 8, 124, 32, CREAM, 10, 3); text(g, 'WIND', st.W / 2 - 2, 24, 10, '#6b5a48');
        var wx = st.W / 2 + 46, wlen = Math.abs(st.wind) * 9; g.strokeStyle = INK; g.fillStyle = INK; g.lineWidth = 3; g.lineCap = 'round';
        if (Math.abs(st.wind) < 0.25) text(g, 'calm', wx, 24, 12, INK); else { var dir = Math.sign(st.wind); g.beginPath(); g.moveTo(wx - dir * wlen / 2, 24); g.lineTo(wx + dir * wlen / 2, 24); g.stroke(); g.beginPath(); g.moveTo(wx + dir * wlen / 2, 24); g.lineTo(wx + dir * (wlen / 2 - 6), 18); g.lineTo(wx + dir * (wlen / 2 - 6), 30); g.fill(); }
        // target
        var tp = targetPos(st), R = st.tr;
        shadow(g, tp.x, st.H - 98, R * 0.8, 5); line(g, tp.x, st.H - 100, tp.x, tp.y + R, '#8a5a3c');
        disc(g, tp.x, tp.y, R, '#fffaf0', 3); disc(g, tp.x, tp.y, R * 0.62, '#e4572e', 3); disc(g, tp.x, tp.y, R * 0.28, '#fffaf0', 3); g.fillStyle = INK; g.beginPath(); g.arc(tp.x, tp.y, 3, 0, TAU); g.fill();
        if (st.cherry) sprite(g, 'cherry', st.cherry.x, st.cherry.y + Math.sin(st.t * 8) * 3, 36, Math.sin(st.t * 6) * 0.2);
        // Dot, the pull, and the guide
        var px = st.pull ? st.pull.x : st.dx0, py = st.pull ? st.pull.y : st.dy0;
        shadow(g, st.dx0, st.dy0 + 26, 22, 7);
        if (st.pull && !st.seed) {
          var dx = st.dx0 - px, dy = st.dy0 - py, d = Math.hypot(dx, dy), pw = Math.min(1, d / 95), ang = Math.atan2(dy, dx), vx = Math.cos(ang) * pw * 620, vy = Math.sin(ang) * pw * 620, x = st.dx0, y = st.dy0;
          g.fillStyle = 'rgba(42,29,22,.55)';
          for (var i = 1; i < 26; i++) { var t = i * 0.035; x = st.dx0 + vx * t; y = st.dy0 + vy * t + 0.5 * GRAV * t * t; if (i % 2) { g.globalAlpha = 1 - i / 30; g.beginPath(); g.arc(x, y, 2.8, 0, TAU); g.fill(); } }
          g.globalAlpha = 1;
          g.strokeStyle = INK; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(st.dx0 - 12, st.dy0 - 2); g.lineTo(px, py); g.lineTo(st.dx0 + 12, st.dy0 - 2); g.stroke();
          sprite(g, 'seed', px, py, 18, ang);
        }
        S.dot(g, st.dx0, st.dy0, 26, st.pull ? 'flat' : st.seed ? 'open' : 'smile');
        st.stuck.forEach(function () {});
        if (st.seed) sprite(g, 'seed', st.seed.x, st.seed.y, 18, st.seed.a);
        // seeds left, along the counter
        for (var k = 0; k < SHOTS; k++) { g.globalAlpha = k < st.shotLeft ? 1 : 0.25; sprite(g, 'seed', 22 + k * 22, st.H - 36, 18, 0.5); } g.globalAlpha = 1;
        if (st.streak > 1) text(g, st.streak + ' in a row', st.W / 2, 62, 16, '#f6c744', 'center', 800, INK);
      }
    });
    function line(g, x1, y1, x2, y2, c) { g.strokeStyle = c || INK; g.lineWidth = 5; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); g.strokeStyle = INK; g.lineWidth = 2; g.beginPath(); g.moveTo(x1 + 3, y1); g.lineTo(x2 + 3, y2); g.stroke(); }
  })();


  /* ================================================================== 10. DOT SAYS */
  /*
   * Memory, with four pads and a note each. Dot plays a pattern, you play it back,
   * and every round adds one. Every fifth round is called backwards: you play it
   * in reverse, and Dot says so first. It speeds up a little as the pattern gets
   * long. One wrong pad ends it; there is no clock, so there is no excuse.
   */
  (function () {
    var PADS = [
      { s: 'tomato', c: '#e4572e', l: '#ff9a7a', f: 330, a0: Math.PI, a1: Math.PI * 1.5 },
      { s: 'lemon', c: '#f0b429', l: '#ffe27a', f: 392, a0: Math.PI * 1.5, a1: Math.PI * 2 },
      { s: 'pepper', c: '#6fbf5e', l: '#b6f0a0', f: 494, a0: 0, a1: Math.PI * 0.5 },
      { s: 'fish', c: '#6bb7d6', l: '#b5e6fa', f: 587, a0: Math.PI * 0.5, a1: Math.PI }
    ];
    var CX = 180, CY = 300, RO = 148, RI = 56;

    function padAt(x, y) {
      var dx = x - CX, dy = y - CY, d = Math.hypot(dx, dy); if (d < RI || d > RO + 6) return -1;
      var a = Math.atan2(dy, dx); if (a < 0) a += TAU;
      for (var i = 0; i < 4; i++) if (a >= PADS[i].a0 && a < PADS[i].a1) return i;
      return -1;
    }
    function flash(st, i, ms) { st.lit = { i: i, t: st.t, ms: (ms || 380) / 1000 }; Sound.tone(PADS[i].f, (ms || 380) / 1000 * 0.9, 'triangle', 0.16); }
    function round(st) {
      st.seq.push(Math.floor(Math.random() * 4)); st.at = 0; st.mode = 'show'; st.back = st.seq.length % 5 === 0;
      var gap = Math.max(250, 560 - st.seq.length * 16), lead = 800;
      st.say = st.back ? 'Backwards!' : 'Watch'; st.face = 'smile';
      if (st.back) { D.Dot.mood(dotEl, 'surprised', 900); Sound.whoosh(); }
      st.seq.forEach(function (p, k) { st.later(lead + k * gap, function () { flash(st, p, gap * 0.7); st.face = 'open'; st.later(gap * 0.4, function () { st.face = 'smile'; }); }); });
      st.later(lead + st.seq.length * gap + 120, function () { st.mode = 'input'; st.say = st.back ? 'Your turn, in reverse' : 'Your turn'; st.face = 'smile'; D.Dot.mood(dotEl, 'wink', 900); });
    }
    function press(st, i) {
      if (st.mode !== 'input' || st.over) return;
      flash(st, i, 220);
      var want = st.back ? st.seq[st.seq.length - 1 - st.at] : st.seq[st.at];
      if (i !== want) { st.mode = 'dead'; st.face = 'dead'; Sound.bust(); st.rumble(8); st.flash = 0.7; st.later(500, function () { st.end(); }); return; }
      st.at++; st.pop(CX + Math.cos((PADS[i].a0 + PADS[i].a1) / 2) * 100, CY + Math.sin((PADS[i].a0 + PADS[i].a1) / 2) * 100, '' + st.at, CREAM);
      if (st.at === st.seq.length) {
        st.mode = 'wait'; st.score = st.seq.length * 10 + (st.back ? 10 : 0); st.say = 'Yes'; st.face = 'happy'; Sound.merge(Math.min(8, st.seq.length)); st.burst(CX, CY, '#f6c744', 14, { v: 190 });
        D.Dot.mood(dotEl, 'happy', 800); st.later(900, function () { round(st); });
      }
    }

    register({
      id: 'says', name: 'Dot Says', blurb: 'Watch the pads. Play it back.', color: '#ff8fe0',
      cover: [['tomato', 110, 70, 62], ['lemon', 210, 70, 62], ['fish', 110, 140, 62], ['pepper', 210, 140, 62], ['dot', 160, 105, 52]],
      intro: 'Watch the pads. Then copy me. I will not make it easy.',
      how: [['tomato', 'Watch the pattern, then tap it back.', '#ffd9c8'], ['star', 'Every round adds one. It speeds up as it grows.', '#fff2a8'], ['fish', 'Every fifth round is backwards. Dot warns you first.', '#d6ecf5']],
      lives: 0, stars: [60, 130, 230], overText: 'Wrong pad.',
      notes: ['I made it too hard. Sorry. Not sorry.', 'Memory is overrated.', 'It was the red one. It is always the red one.'],
      hud: function (st) { return 'Round ' + st.seq.length + '  ·  ' + st.score; },
      setup: function (st) { st.seq = []; st.at = 0; st.mode = 'wait'; st.lit = null; st.say = 'Watch'; st.face = 'smile'; st.back = false; },
      start: function (st) { st.later(500, function () { round(st); }); },
      down: function (st, p) { var i = padAt(p.x, p.y); if (i >= 0) press(st, i); },
      key: function (st, e) { var m = { '1': 0, '2': 1, '3': 2, '4': 3 }[e.key]; if (m !== undefined) press(st, m); },
      update: function () {},
      draw: function (st, g) {
        g.fillStyle = '#f5e6cc'; g.fillRect(0, 0, st.W, st.H);
        g.fillStyle = '#eddcbc'; for (var y = 0; y < st.H; y += 28) g.fillRect(0, y, st.W, 14);
        // the plate under the pads
        disc(g, CX, CY, RO + 18, '#fff3d8', 4); disc(g, CX, CY, RO + 8, '#f4ead8', 2);
        var on = st.lit && (st.t - st.lit.t) < st.lit.ms ? st.lit.i : -1;
        for (var i = 0; i < 4; i++) {
          var P = PADS[i], lit = i === on, gap = 0.05, a0 = P.a0 + gap, a1 = P.a1 - gap, ro = RO + (lit ? 6 : 0), mid = (P.a0 + P.a1) / 2;
          g.beginPath(); g.arc(CX, CY, ro, a0, a1); g.arc(CX, CY, RI, a1, a0, true); g.closePath();
          g.fillStyle = lit ? P.l : P.c; g.fill(); g.lineWidth = lit ? 5 : 3.5; g.strokeStyle = INK; g.lineJoin = 'round'; g.stroke();
          g.fillStyle = 'rgba(255,255,255,.22)'; g.beginPath(); g.arc(CX, CY, ro - 8, a0 + 0.08, a0 + 0.55); g.stroke && 0; g.arc(CX, CY, ro - 22, a0 + 0.55, a0 + 0.08, true); g.closePath(); g.fill();
          var sx = CX + Math.cos(mid) * (RI + RO) / 2 * 1.0, sy = CY + Math.sin(mid) * (RI + RO) / 2;
          var k = lit ? 1.3 : 1; sprite(g, P.s, sx, sy, 62 * k, lit ? Math.sin(st.t * 30) * 0.12 : 0);
        }
        // Dot in the middle, saying what is going on
        disc(g, CX, CY, RI - 4, '#fff8e8', 4);
        S.dot(g, CX, CY + 2, 36, st.face);
        text(g, st.say || '', CX, 74, 26, INK, 'center', 800);
        if (st.back && st.mode !== 'dead') { tab(g, CX - 70, 96, 140, 28, '#f0b429', 14, 3); text(g, 'BACKWARDS', CX, 110, 14, INK); }
        // progress through the pattern
        if (st.mode === 'input') { for (var j = 0; j < st.seq.length; j++) { g.fillStyle = j < st.at ? INK : 'rgba(42,29,22,.2)'; g.beginPath(); g.arc(CX - (st.seq.length - 1) * 7 + j * 14, CY + RO + 46, 4, 0, TAU); g.fill(); } }
        else if (st.mode === 'show') { text(g, 'watching…', CX, CY + RO + 46, 14, '#6b5a48', 'center', 700); }
      }
    });
  })();

  //@GAMES
})();
