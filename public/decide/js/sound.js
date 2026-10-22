/*
 * sound.js — tiny synthesised blips. No audio files, no dependencies.
 *
 * Everything is wrapped defensively: audio is a garnish, and a browser that
 * refuses to play it should never break the game.
 */
(function (root, factory) {
  root.FoodSound = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var ctx = null;
  var muted = false;

  function context() {
    try {
      var Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return null;
      if (!ctx) ctx = new Ctor();
      // Browsers start the context suspended until a user gesture.
      if (ctx.state === 'suspended' && ctx.resume) ctx.resume();
      return ctx;
    } catch (err) {
      return null;
    }
  }

  // One short note with a quick decay, so nothing ever rings or clips.
  function note(freq, start, duration, type, peak) {
    var ac = context();
    if (!ac || muted) return;
    try {
      var osc = ac.createOscillator();
      var gain = ac.createGain();
      var t = ac.currentTime + start;

      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(peak || 0.16, t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

      osc.connect(gain).connect(ac.destination);
      osc.start(t);
      osc.stop(t + duration + 0.02);
    } catch (err) { /* silence is an acceptable outcome */ }
  }

  // A burst of filtered noise: a thud, a whoosh, a pop. `from` and `to` are the
  // low-pass sweep in Hz, so a falling sweep is a thump and a rising one a swish.
  function noise(duration, peak, from, to, start) {
    var ac = context();
    if (!ac || muted) return;
    try {
      var len = Math.max(1, Math.floor(ac.sampleRate * duration));
      var buf = ac.createBuffer(1, len, ac.sampleRate);
      var data = buf.getChannelData(0);
      for (var i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      var src = ac.createBufferSource();
      src.buffer = buf;
      var filter = ac.createBiquadFilter();
      filter.type = 'lowpass';
      var t = ac.currentTime + (start || 0);
      filter.frequency.setValueAtTime(from || 1200, t);
      filter.frequency.exponentialRampToValueAtTime(Math.max(40, to || 300), t + duration);
      var gain = ac.createGain();
      gain.gain.setValueAtTime(peak || 0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
      src.connect(filter).connect(gain).connect(ac.destination);
      src.start(t);
    } catch (err) { /* silence is an acceptable outcome */ }
  }

  // A note that slides, for jumps and boings.
  function slide(f0, f1, duration, type, peak, start) {
    var ac = context();
    if (!ac || muted) return;
    try {
      var osc = ac.createOscillator();
      var gain = ac.createGain();
      var t = ac.currentTime + (start || 0);
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(f0, t);
      osc.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + duration);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(peak || 0.12, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
      osc.connect(gain).connect(ac.destination);
      osc.start(t);
      osc.stop(t + duration + 0.02);
    } catch (err) { /* silence is an acceptable outcome */ }
  }

  function chord(freqs, gap, duration, type, peak) {
    freqs.forEach(function (f, i) { note(f, i * gap, duration, type, peak); });
  }

  return {
    setMuted: function (value) { muted = !!value; },
    isMuted: function () { return muted; },

    tick:    function () { note(520, 0, 0.08, 'triangle', 0.10); },

    // Endless. The pitch of a pick rises with the streak, which is the whole
    // reason the sound is here: a run that sounds the same on the fortieth tap
    // as the first is a run that feels the same, and the point of the mode is
    // that it does not. Capped so a very long run does not end up whistling.
    climb:   function (step) {
      var up = Math.max(0, Math.min(14, step || 0));
      note(500 * Math.pow(1.055, up), 0, 0.06, 'triangle', 0.09);
    },
    // The clock is nearly out. Low and flat, under everything else.
    warn:    function () { note(190, 0, 0.14, 'sawtooth', 0.07); },
    // And it ran out.
    bust:    function () { note(300, 0, 0.15, 'sawtooth', 0.09); note(150, 0.11, 0.34, 'sine', 0.09); },

    shrug:   function () { note(360, 0, 0.10, 'sine', 0.08); },

    /*
     * Turning a dish down is not an error and should not sound like one.
     *
     * "Not quite" played `reject` — a descending sawtooth buzz, the noise a
     * form makes when you have typed your password wrong. Tapping it is the
     * player steering, which is the single most common thing they do here,
     * and the app was scolding them for it every time. This goes UP, briefly,
     * and means "right, next".
     */
    next:    function () { note(440, 0, 0.05, 'triangle', 0.08); note(587, 0.05, 0.09, 'triangle', 0.08); },
    back:    function () { note(300, 0, 0.09, 'sine', 0.08); },
    roll:    function () { note(880, 0, 0.03, 'square', 0.03); },
    reveal:  function () { chord([523, 659, 784], 0.07, 0.32, 'triangle', 0.13); },
    reject:  function () { note(300, 0, 0.12, 'sawtooth', 0.07); note(220, 0.09, 0.16, 'sine', 0.07); },
    win:     function () { chord([523, 659, 784, 1046], 0.09, 0.42, 'triangle', 0.15); },
    badge:   function () { chord([784, 1046, 1318], 0.06, 0.30, 'sine', 0.13); },
    levelUp: function () { chord([523, 698, 880, 1174, 1568], 0.08, 0.45, 'triangle', 0.15); },

    // The games. Short, dry and varied in pitch, so a hundred of them in a minute
    // do not sound like one.
    tone:    function (freq, duration, type, peak) { note(freq, 0, duration || 0.15, type || 'triangle', peak || 0.12); },
    pop:     function (level) { slide(420 + (level || 0) * 70, 900 + (level || 0) * 110, 0.09, 'sine', 0.13); noise(0.05, 0.05, 3000, 900); },
    thud:    function () { noise(0.16, 0.16, 500, 70); slide(110, 55, 0.14, 'sine', 0.14); },
    whoosh:  function () { noise(0.22, 0.07, 400, 4000); },
    coin:    function () { note(988, 0, 0.07, 'square', 0.06); note(1319, 0.06, 0.16, 'square', 0.06); },
    boing:   function () { slide(240, 760, 0.2, 'sine', 0.14); },
    jump:    function () { slide(300, 620, 0.12, 'triangle', 0.1); },
    shoot:   function () { slide(900, 300, 0.09, 'square', 0.04); },
    hit:     function () { noise(0.09, 0.12, 2400, 500); note(180, 0, 0.08, 'square', 0.06); },
    merge:   function (level) { var f = 330 * Math.pow(1.122, (level || 0) * 2); note(f, 0, 0.12, 'triangle', 0.13); note(f * 1.5, 0.06, 0.2, 'triangle', 0.12); },
    splat:   function () { noise(0.14, 0.1, 1400, 200); },
    swap:    function () { slide(500, 700, 0.06, 'triangle', 0.08); },
    nope:    function () { slide(260, 180, 0.14, 'sawtooth', 0.06); },
    star:    function (n) { note(659 + (n || 0) * 220, 0, 0.18, 'triangle', 0.13); },
    count:   function (last) { note(last ? 880 : 520, 0, last ? 0.22 : 0.1, 'square', 0.06); }
  };
});
