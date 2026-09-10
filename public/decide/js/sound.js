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
    back:    function () { note(300, 0, 0.09, 'sine', 0.08); },
    roll:    function () { note(880, 0, 0.03, 'square', 0.03); },
    reveal:  function () { chord([523, 659, 784], 0.07, 0.32, 'triangle', 0.13); },
    reject:  function () { note(300, 0, 0.12, 'sawtooth', 0.07); note(220, 0.09, 0.16, 'sine', 0.07); },
    win:     function () { chord([523, 659, 784, 1046], 0.09, 0.42, 'triangle', 0.15); },
    badge:   function () { chord([784, 1046, 1318], 0.06, 0.30, 'sine', 0.13); },
    levelUp: function () { chord([523, 698, 880, 1174, 1568], 0.08, 0.45, 'triangle', 0.15); }
  };
});
