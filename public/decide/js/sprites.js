/*
 * sprites.js — the food, the hazards and Dot, drawn.
 *
 * The games used to draw emoji with fillText, which is why they looked like
 * every other thing made quickly: the same glossy pictures in the same places,
 * at whatever size the phone's emoji font decided. These are drawn instead, in
 * one hand: flat colour, one dark outline, one small highlight, no gradients and
 * no glow. Everything is drawn once into a small bitmap and stamped from there,
 * so a hundred of them on a canvas cost about what a hundred images do.
 *
 *   Sprites.draw(g, 'tomato', x, y, size, rotation)
 *   Sprites.url('tomato', 96)       a data URL, for DOM use (cards, buttons)
 *   Sprites.FOODS                   the names of the edible ones
 *
 * Each is drawn in a 100-unit box centred on 0,0 and stays inside +-46.
 */
(function (root, factory) {
  root.Sprites = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var INK = '#2a1d16';
  var TAU = Math.PI * 2;

  function stroke(g, w) { g.strokeStyle = INK; g.lineWidth = w || 4.2; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); }
  function fillStroke(g, fill, w) { if (fill) { g.fillStyle = fill; g.fill(); } stroke(g, w); }
  function circle(g, x, y, r, fill, w) { g.beginPath(); g.arc(x, y, r, 0, TAU); fillStroke(g, fill, w); }
  function oval(g, x, y, rx, ry, fill, rot, w) { g.beginPath(); g.ellipse(x, y, rx, ry, rot || 0, 0, TAU); fillStroke(g, fill, w); }
  function poly(g, pts, fill, w) { g.beginPath(); pts.forEach(function (p, i) { if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }); g.closePath(); fillStroke(g, fill, w); }
  function shine(g, x, y, r, rot) { g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.ellipse(x, y, r, r * 0.55, rot === undefined ? -0.7 : rot, 0, TAU); g.fill(); }
  function line(g, pts, w, color) { g.beginPath(); pts.forEach(function (p, i) { if (i) g.lineTo(p[0], p[1]); else g.moveTo(p[0], p[1]); }); g.strokeStyle = color || INK; g.lineWidth = w || 3; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(); }
  function leaf(g, x, y, rot, s, fill) { g.save(); g.translate(x, y); g.rotate(rot); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(s * 0.5, -s * 0.55, s, 0); g.quadraticCurveTo(s * 0.5, s * 0.45, 0, 0); fillStroke(g, fill || '#5aa469', 3.4); g.restore(); }

  var P = {
    tomato: function (g) {
      circle(g, 0, 6, 37, '#e4572e'); shine(g, -15, -8, 9);
      leaf(g, 0, -29, -2.5, 20); leaf(g, 0, -29, -0.6, 20); leaf(g, 0, -29, 1.4, 14);
    },
    onion: function (g) {
      g.beginPath(); g.moveTo(0, -42); g.quadraticCurveTo(6, -26, 26, -18); g.bezierCurveTo(46, -6, 40, 40, 0, 40); g.bezierCurveTo(-40, 40, -46, -6, -26, -18); g.quadraticCurveTo(-6, -26, 0, -42); fillStroke(g, '#d8a4c8');
      line(g, [[-14, -14], [-20, 8], [-12, 30]], 3, '#a86f9a'); line(g, [[14, -14], [20, 8], [12, 30]], 3, '#a86f9a'); line(g, [[0, -18], [0, 32]], 3, '#a86f9a');
      shine(g, -16, -6, 7);
    },
    chilli: function (g) {
      g.beginPath(); g.moveTo(-32, -26); g.bezierCurveTo(14, -34, 44, -6, 34, 30); g.bezierCurveTo(32, 40, 22, 42, 20, 32); g.bezierCurveTo(22, 8, -6, -6, -32, -14); g.closePath(); fillStroke(g, '#d93a2b');
      shine(g, 12, -4, 7, 0.6);
      g.beginPath(); g.moveTo(-32, -26); g.quadraticCurveTo(-46, -34, -40, -16); g.quadraticCurveTo(-36, -12, -32, -14); g.closePath(); fillStroke(g, '#5aa469', 3.6);
      line(g, [[-40, -24], [-46, -34]], 4);
    },
    aubergine: function (g) {
      g.save(); g.rotate(0.5);
      g.beginPath(); g.moveTo(-10, -30); g.bezierCurveTo(-40, -20, -40, 36, -6, 42); g.bezierCurveTo(24, 46, 30, 8, 10, -26); g.closePath(); fillStroke(g, '#7a4a9c');
      shine(g, -18, 0, 6, 1.4);
      leaf(g, 0, -28, -2.6, 22); leaf(g, 0, -28, -0.4, 22);
      circle(g, 0, -36, 4, '#5aa469', 3.2);
      g.restore();
    },
    carrot: function (g) {
      poly(g, [[-18, -22], [20, -26], [4, 44]], '#f08a2a');
      line(g, [[-8, -8], [2, -8]], 3, '#c9661c'); line(g, [[-2, 8], [8, 8]], 3, '#c9661c'); line(g, [[0, 24], [4, 24]], 3, '#c9661c');
      leaf(g, 0, -24, -2.2, 24); leaf(g, 2, -24, -1.3, 26); leaf(g, 4, -24, -0.5, 22);
    },
    cheese: function (g) {
      poly(g, [[-42, 18], [-30, -22], [42, 4], [42, 28], [-42, 28]], '#f6c744');
      line(g, [[-42, 18], [42, 4]], 3.4);
      circle(g, -10, 8, 5, '#e6a82a', 3); circle(g, 14, 16, 4, '#e6a82a', 3); circle(g, -26, 18, 3.4, '#e6a82a', 3); circle(g, 30, 14, 3.2, '#e6a82a', 3);
      shine(g, -18, -6, 6, -0.3);
    },
    bread: function (g) {
      g.beginPath(); g.moveTo(-40, 8); g.bezierCurveTo(-48, -30, 48, -30, 40, 8); g.lineTo(38, 32); g.quadraticCurveTo(0, 40, -38, 32); g.closePath(); fillStroke(g, '#d9a45a');
      line(g, [[-20, -12], [-10, 6]], 3.4, '#a8702e'); line(g, [[-2, -16], [8, 4]], 3.4, '#a8702e'); line(g, [[16, -12], [26, 6]], 3.4, '#a8702e');
      shine(g, -26, -4, 6, -0.4);
    },
    egg: function (g) {
      g.beginPath(); g.moveTo(-38, 4); g.bezierCurveTo(-46, -26, -10, -42, 14, -36); g.bezierCurveTo(44, -32, 50, -2, 36, 14); g.bezierCurveTo(30, 40, -6, 44, -20, 34); g.bezierCurveTo(-34, 28, -34, 16, -38, 4); g.closePath(); fillStroke(g, '#fffaf0');
      circle(g, 0, -2, 15, '#f6b52b'); shine(g, -5, -8, 5, -0.6);
    },
    fish: function (g) {
      g.beginPath(); g.moveTo(-38, 0); g.quadraticCurveTo(-8, -34, 24, -6); g.lineTo(44, -22); g.lineTo(44, 22); g.lineTo(24, 6); g.quadraticCurveTo(-8, 34, -38, 0); g.closePath(); fillStroke(g, '#79b5d6');
      line(g, [[0, -16], [8, 0], [0, 16]], 3, '#4f8fb3'); circle(g, -22, -4, 4, '#fff', 3); circle(g, -22, -4, 1.5, INK, 1);
    },
    drumstick: function (g) {
      g.save(); g.rotate(-0.6);
      line(g, [[10, 8], [42, 8]], 11, INK); line(g, [[10, 8], [42, 8]], 5, '#fffaf0');
      circle(g, 44, 3, 6, '#fffaf0', 3.4); circle(g, 44, 13, 6, '#fffaf0', 3.4);
      g.beginPath(); g.moveTo(14, -6); g.bezierCurveTo(-30, -40, -52, 4, -22, 26); g.bezierCurveTo(-4, 38, 20, 24, 14, -6); g.closePath(); fillStroke(g, '#c4692f');
      shine(g, -20, -6, 8, -0.8);
      g.restore();
    },
    cake: function (g) {
      poly(g, [[-40, 26], [-40, -4], [40, -18], [40, 26]], '#f7b6cf');
      poly(g, [[-40, 10], [40, -4], [40, 6], [-40, 20]], '#fff3e0', 3.4);
      poly(g, [[-40, -4], [40, -18], [40, -26], [-40, -12]], '#8a5a3c', 3.4);
      circle(g, 4, -30, 8, '#d93a2b', 3.6); line(g, [[4, -38], [8, -46]], 3.4);
    },
    donut: function (g) {
      circle(g, 0, 0, 40, '#e3a76b'); g.beginPath(); g.arc(0, 0, 34, 0, TAU); g.fillStyle = '#f48fb1'; g.fill(); stroke(g, 3.4);
      circle(g, 0, 0, 12, '#f4ead8', 3.6);
      [[-20, -16, '#fff'], [14, -22, '#7ac1ee'], [24, 8, '#fff2a8'], [-8, 24, '#7ac1ee'], [-28, 8, '#fff2a8'], [8, 22, '#fff']].forEach(function (s) { line(g, [[s[0], s[1]], [s[0] + 5, s[1] + 3]], 4, s[2]); });
    },
    icecream: function (g) {
      poly(g, [[-22, -4], [22, -4], [0, 44]], '#e6b56a'); line(g, [[-12, 6], [10, 20]], 3, '#b98a40'); line(g, [[12, 6], [-8, 22]], 3, '#b98a40');
      circle(g, -10, -12, 20, '#f9a8c9'); circle(g, 12, -22, 19, '#fff2d6'); shine(g, 6, -30, 6);
      circle(g, 12, -40, 5, '#d93a2b', 3.2);
    },
    burger: function (g) {
      g.beginPath(); g.moveTo(-40, -6); g.bezierCurveTo(-40, -44, 40, -44, 40, -6); g.closePath(); fillStroke(g, '#e0a050');
      [[-16, -26], [0, -32], [16, -26]].forEach(function (s) { oval(g, s[0], s[1], 3.6, 2, '#fff2d6', 0.4, 2); });
      g.beginPath(); g.moveTo(-42, -4); g.quadraticCurveTo(-30, 8, -18, -2); g.quadraticCurveTo(-6, 8, 6, -2); g.quadraticCurveTo(18, 8, 42, -4); g.lineTo(42, 2); g.lineTo(-42, 2); g.closePath(); fillStroke(g, '#6fbf5e', 3.4);
      g.beginPath(); g.roundRect ? g.roundRect(-42, 4, 84, 14, 7) : g.rect(-42, 4, 84, 14); fillStroke(g, '#7a4a2c', 3.6);
      g.beginPath(); g.roundRect ? g.roundRect(-38, 20, 76, 18, [4, 4, 14, 14]) : g.rect(-38, 20, 76, 18); fillStroke(g, '#e0a050', 3.8);
    },
    pizza: function (g) {
      g.beginPath(); g.moveTo(-34, -32); g.quadraticCurveTo(0, -46, 34, -32); g.lineTo(0, 44); g.closePath(); fillStroke(g, '#f6c744');
      g.beginPath(); g.moveTo(-34, -32); g.quadraticCurveTo(0, -46, 34, -32); g.lineTo(31, -22); g.quadraticCurveTo(0, -36, -31, -22); g.closePath(); fillStroke(g, '#d9a45a', 3.6);
      circle(g, -9, -8, 7, '#d93a2b', 3.2); circle(g, 11, -6, 6, '#d93a2b', 3.2); circle(g, 0, 14, 6, '#d93a2b', 3.2);
    },
    sushi: function (g) {
      oval(g, 0, 8, 36, 22, '#2d4a3a'); oval(g, 0, -2, 36, 22, '#fffaf0');
      oval(g, 0, -4, 28, 15, '#f4977a', 0, 3.6); line(g, [[-16, -4], [10, -10]], 3, '#fff'); line(g, [[-8, 2], [18, -4]], 3, '#fff');
    },
    noodles: function (g) {
      g.beginPath(); g.moveTo(-42, -2); g.lineTo(42, -2); g.quadraticCurveTo(40, 40, 0, 42); g.quadraticCurveTo(-40, 40, -42, -2); g.closePath(); fillStroke(g, '#5b8fb9');
      line(g, [[-30, -4], [-18, -20], [-6, -6], [6, -22], [18, -8], [30, -20]], 6.5, INK); line(g, [[-30, -4], [-18, -20], [-6, -6], [6, -22], [18, -8], [30, -20]], 3, '#f6dc8a');
      circle(g, 18, -16, 7, '#fffaf0', 3.2); circle(g, 18, -16, 3, '#f6b52b', 1);
      line(g, [[-6, -44], [18, -14]], 4, INK); line(g, [[2, -44], [26, -14]], 4, INK);
    },
    cherry: function (g) {
      circle(g, -16, 22, 20, '#d1243a'); circle(g, 22, 18, 20, '#d1243a'); shine(g, -22, 14, 6); shine(g, 16, 10, 6);
      g.beginPath(); g.moveTo(-14, 4); g.quadraticCurveTo(-4, -26, 8, -40); g.moveTo(20, 0); g.quadraticCurveTo(14, -24, 8, -40); stroke(g, 4);
      leaf(g, 8, -40, -0.3, 22);
    },
    lemon: function (g) {
      g.save(); g.rotate(-0.4); g.beginPath(); g.moveTo(-44, 0); g.quadraticCurveTo(-34, -32, 0, -32); g.quadraticCurveTo(34, -32, 44, 0); g.quadraticCurveTo(34, 32, 0, 32); g.quadraticCurveTo(-34, 32, -44, 0); g.closePath(); fillStroke(g, '#f7dc4b'); shine(g, -14, -14, 8, -0.2); g.restore();
      leaf(g, 24, -30, -1, 16);
    },
    mushroom: function (g) {
      g.beginPath(); g.moveTo(-14, 6); g.lineTo(-10, 40); g.quadraticCurveTo(0, 44, 10, 40); g.lineTo(14, 6); g.closePath(); fillStroke(g, '#f4ead8');
      g.beginPath(); g.moveTo(-44, 8); g.bezierCurveTo(-44, -44, 44, -44, 44, 8); g.closePath(); fillStroke(g, '#d9382b');
      circle(g, -18, -10, 6, '#fff', 3); circle(g, 8, -24, 5.4, '#fff', 3); circle(g, 22, -6, 5, '#fff', 3);
    },
    apple: function (g) {
      g.beginPath(); g.moveTo(0, -24); g.bezierCurveTo(-14, -38, -46, -24, -40, 8); g.bezierCurveTo(-36, 36, -14, 44, 0, 36); g.bezierCurveTo(14, 44, 36, 36, 40, 8); g.bezierCurveTo(46, -24, 14, -38, 0, -24); g.closePath(); fillStroke(g, '#c9332e');
      shine(g, -20, -6, 7); line(g, [[0, -24], [4, -38]], 4); leaf(g, 5, -34, -0.5, 20);
    },
    croissant: function (g) {
      g.beginPath(); g.moveTo(-44, 12); g.bezierCurveTo(-40, -30, -10, -40, 0, -32); g.bezierCurveTo(10, -40, 40, -30, 44, 12); g.bezierCurveTo(30, 6, 24, 18, 16, 28); g.bezierCurveTo(8, 18, -8, 18, -16, 28); g.bezierCurveTo(-24, 18, -30, 6, -44, 12); g.closePath(); fillStroke(g, '#e3a64f');
      line(g, [[-22, -16], [-14, 8]], 3.2, '#b6782c'); line(g, [[0, -24], [0, 10]], 3.2, '#b6782c'); line(g, [[22, -16], [14, 8]], 3.2, '#b6782c');
    },
    cupcake: function (g) {
      poly(g, [[-30, -2], [30, -2], [22, 40], [-22, 40]], '#6bb7d6'); line(g, [[-14, 0], [-10, 38]], 3, '#3f86a8'); line(g, [[0, 0], [0, 38]], 3, '#3f86a8'); line(g, [[14, 0], [10, 38]], 3, '#3f86a8');
      g.beginPath(); g.moveTo(-34, -2); g.bezierCurveTo(-44, -26, -18, -22, -20, -34); g.bezierCurveTo(-12, -48, 12, -48, 20, -34); g.bezierCurveTo(18, -22, 44, -26, 34, -2); g.closePath(); fillStroke(g, '#f9a8c9');
      circle(g, 0, -42, 6, '#d93a2b', 3.4);
    },
    garlic: function (g) {
      g.beginPath(); g.moveTo(0, -42); g.bezierCurveTo(6, -30, 14, -24, 28, -16); g.bezierCurveTo(48, 0, 38, 40, 0, 40); g.bezierCurveTo(-38, 40, -48, 0, -28, -16); g.bezierCurveTo(-14, -24, -6, -30, 0, -42); g.closePath(); fillStroke(g, '#f6efe0');
      line(g, [[-12, -14], [-18, 12], [-8, 34]], 3, '#cfc2a4'); line(g, [[12, -14], [18, 12], [8, 34]], 3, '#cfc2a4'); line(g, [[0, -20], [0, 36]], 3, '#cfc2a4');
    },
    pot: function (g) {
      g.beginPath(); g.moveTo(-36, -14); g.lineTo(36, -14); g.quadraticCurveTo(40, 36, 18, 40); g.lineTo(-18, 40); g.quadraticCurveTo(-40, 36, -36, -14); g.closePath(); fillStroke(g, '#f0b429');
      oval(g, 0, -14, 38, 8, '#c58a14'); line(g, [[-44, -6], [-36, -6]], 6, INK); line(g, [[36, -6], [44, -6]], 6, INK); shine(g, -22, 12, 6, -0.4);
    },
    crown: function (g) {
      poly(g, [[-40, 28], [-44, -20], [-20, 0], [0, -30], [20, 0], [44, -20], [40, 28]], '#f6c744'); line(g, [[-40, 20], [40, 20]], 3.4);
      circle(g, -44, -22, 5, '#d93a2b', 3); circle(g, 0, -32, 5, '#6bb7d6', 3); circle(g, 44, -22, 5, '#d93a2b', 3);
    },
    heart: function (g) {
      g.beginPath(); g.moveTo(0, 38); g.bezierCurveTo(-52, 4, -34, -38, 0, -14); g.bezierCurveTo(34, -38, 52, 4, 0, 38); g.closePath(); fillStroke(g, '#e4572e'); shine(g, -18, -12, 8, -0.8);
    },
    star: function (g) {
      var pts = []; for (var i = 0; i < 10; i++) { var r = i % 2 ? 18 : 44, a = -Math.PI / 2 + i * Math.PI / 5; pts.push([Math.cos(a) * r, Math.sin(a) * r + 2]); }
      poly(g, pts, '#f6c744');
    },
    coin: function (g) { circle(g, 0, 0, 38, '#f6c744'); circle(g, 0, 0, 26, '#f0b429', 3); line(g, [[0, -14], [0, 14]], 5); line(g, [[-8, -8], [8, -8]], 4); line(g, [[-8, 8], [8, 8]], 4); },
    knife: function (g) {
      g.save(); g.rotate(0.8);
      poly(g, [[-6, -42], [8, -42], [8, 8], [-6, 8]], '#d8dde2'); poly(g, [[-6, -42], [8, -42], [8, -30], [-6, -26]], '#eef1f4', 3);
      g.beginPath(); g.roundRect ? g.roundRect(-8, 8, 18, 34, 6) : g.rect(-8, 8, 18, 34); fillStroke(g, '#7a4a2c'); circle(g, 1, 18, 2, '#e8c8a0', 2); circle(g, 1, 32, 2, '#e8c8a0', 2);
      g.restore();
    },
    flame: function (g) {
      g.beginPath(); g.moveTo(0, -44); g.bezierCurveTo(10, -24, 36, -12, 34, 14); g.bezierCurveTo(32, 36, 10, 44, 0, 44); g.bezierCurveTo(-12, 44, -34, 36, -34, 14); g.bezierCurveTo(-34, -2, -18, -10, -12, -26); g.bezierCurveTo(-6, -16, -4, -10, 0, -44); g.closePath(); fillStroke(g, '#f0762a');
      g.beginPath(); g.moveTo(0, -10); g.bezierCurveTo(8, 4, 20, 8, 18, 22); g.bezierCurveTo(16, 34, 6, 36, 0, 36); g.bezierCurveTo(-8, 36, -18, 30, -18, 22); g.bezierCurveTo(-18, 10, -6, 6, 0, -10); g.closePath(); fillStroke(g, '#ffd45e', 3);
    },
    trolley: function (g) {
      line(g, [[-40, -26], [-30, -26], [-22, 16], [30, 16]], 5, INK);
      poly(g, [[-30, -18], [40, -18], [34, 10], [-24, 10]], '#c9d3da', 3.6); line(g, [[-14, -18], [-12, 10]], 3); line(g, [[4, -18], [4, 10]], 3); line(g, [[22, -18], [20, 10]], 3);
      circle(g, -16, 32, 8, '#6b6b72', 3.6); circle(g, 22, 32, 8, '#6b6b72', 3.6);
    },
    rollingpin: function (g) {
      line(g, [[-46, 0], [-30, 0]], 7, INK); line(g, [[30, 0], [46, 0]], 7, INK);
      g.beginPath(); g.roundRect ? g.roundRect(-32, -15, 64, 30, 14) : g.rect(-32, -15, 64, 30); fillStroke(g, '#d9a45a'); shine(g, -12, -6, 8, 0);
    },
    plate: function (g) { circle(g, 0, 0, 42, '#f4ead8'); circle(g, 0, 0, 27, '#fffaf0', 3); },
    seed: function (g) { oval(g, 0, 0, 22, 12, '#f4ead8', 0.6); line(g, [[-8, -8], [8, 8]], 3, '#bba88c'); },
    jar: function (g) {
      g.beginPath(); g.moveTo(-26, -30); g.lineTo(26, -30); g.lineTo(34, -18); g.lineTo(34, 34); g.quadraticCurveTo(34, 42, 26, 42); g.lineTo(-26, 42); g.quadraticCurveTo(-34, 42, -34, 34); g.lineTo(-34, -18); g.closePath(); fillStroke(g, '#c33d4a');
      g.beginPath(); g.roundRect ? g.roundRect(-28, -44, 56, 14, 4) : g.rect(-28, -44, 56, 14); fillStroke(g, '#e8dcc4', 3.8);
      oval(g, 0, 8, 22, 16, '#f4ead8', 0, 3.4); shine(g, -22, -4, 5, 1.2);
    },
    spring: function (g) {
      g.beginPath(); g.moveTo(-30, 36); g.lineTo(30, 36); stroke(g, 5);
      line(g, [[-26, 28], [26, 20], [-26, 10], [26, 0], [-26, -10], [26, -20]], 7, INK); line(g, [[-26, 28], [26, 20], [-26, 10], [26, 0], [-26, -10], [26, -20]], 3.4, '#6bb7d6');
    },
    spoon: function (g) { g.save(); g.rotate(-0.7); oval(g, 0, -24, 15, 20, '#d8dde2'); line(g, [[0, -4], [0, 44]], 9, INK); line(g, [[0, -4], [0, 44]], 4.4, '#d8dde2'); g.restore(); },
    bolt: function (g) { poly(g, [[8, -44], [-26, 6], [-4, 6], [-12, 44], [28, -10], [4, -10]], '#f6c744'); },
    clock: function (g) { circle(g, 0, 0, 38, '#fffaf0'); line(g, [[0, 0], [0, -22]], 5); line(g, [[0, 0], [16, 8]], 5); circle(g, 0, 0, 4, INK, 1); },
    leafy: function (g) { leaf(g, -30, 20, -0.9, 70, '#5aa469'); leaf(g, -26, 26, -0.2, 60, '#6fbf5e'); },
    pepper: function (g) {
      g.beginPath(); g.moveTo(-30, -18); g.bezierCurveTo(-46, 0, -38, 40, -10, 40); g.bezierCurveTo(0, 44, 8, 36, 14, 40); g.bezierCurveTo(40, 40, 46, 0, 30, -18); g.bezierCurveTo(20, -28, 10, -22, 0, -26); g.bezierCurveTo(-10, -22, -20, -28, -30, -18); g.closePath(); fillStroke(g, '#4caf50'); shine(g, -22, -2, 6, 1.2);
      line(g, [[0, -26], [2, -40]], 5);
    }
  };

  // Dot, in the same hand as the food: a round face with an outline, a tuft and a blush.
  function dot(g, x, y, r, mouth, look) {
    g.save(); g.translate(x, y); var k = r / 40; g.scale(k, k);
    g.beginPath(); g.moveTo(-3, -34); g.quadraticCurveTo(-9, -52, 8, -54); g.quadraticCurveTo(6, -44, 2, -34); g.closePath(); fillStroke(g, '#fff6e2', 3.6);
    circle(g, 0, 0, 38, '#fff6e2', 4.4);
    circle(g, -22, 10, 7, 'rgba(240,138,42,.45)', 0.01); circle(g, 22, 10, 7, 'rgba(240,138,42,.45)', 0.01);
    var lx = (look && look.x) || 0, ly = (look && look.y) || 0;
    if (mouth === 'dead') { line(g, [[-15, -8], [-5, 2]], 3.6); line(g, [[-5, -8], [-15, 2]], 3.6); line(g, [[5, -8], [15, 2]], 3.6); line(g, [[15, -8], [5, 2]], 3.6); }
    else if (mouth === 'happy') { g.beginPath(); g.arc(-10, -3, 6, Math.PI * 1.1, Math.PI * 1.9); stroke(g, 3.6); g.beginPath(); g.arc(10, -3, 6, Math.PI * 1.1, Math.PI * 1.9); stroke(g, 3.6); }
    else { circle(g, -10 + lx, -4 + ly, 3.8, INK, 0.01); circle(g, 10 + lx, -4 + ly, 3.8, INK, 0.01); }
    if (mouth === 'open') { g.beginPath(); g.ellipse(0, 16, 7, 9, 0, 0, TAU); g.fillStyle = INK; g.fill(); }
    else if (mouth === 'sad' || mouth === 'dead') { g.beginPath(); g.arc(0, 24, 9, Math.PI * 1.2, Math.PI * 1.8); stroke(g, 3.6); }
    else if (mouth === 'flat') { line(g, [[-7, 18], [7, 18]], 3.6); }
    else { g.beginPath(); g.arc(0, 8, 11, Math.PI * 0.2, Math.PI * 0.8); stroke(g, 3.6); }
    g.restore();
  }

  var cache = {};
  var DPR = Math.min(2, (typeof window !== 'undefined' && window.devicePixelRatio) || 1);
  var BASE = 96;
  function bitmap(id) {
    if (cache[id]) return cache[id];
    var draw = P[id];
    if (!draw) return null;
    var size = Math.round(BASE * DPR);
    var c = document.createElement('canvas');
    c.width = size; c.height = size;
    var g = c.getContext('2d');
    g.translate(size / 2, size / 2);
    g.scale(size / 100, size / 100);
    draw(g);
    cache[id] = c;
    return c;
  }

  function drawSprite(g, id, x, y, size, rot, flip) {
    if (id === 'dot') { dot(g, x, y, size * 0.5, rot && typeof rot === 'string' ? rot : 'smile'); return; }
    var b = bitmap(id);
    if (!b) return;
    g.save();
    g.translate(x, y);
    if (typeof rot === 'number' && rot) g.rotate(rot);
    if (flip) g.scale(-1, 1);
    g.drawImage(b, -size / 2, -size / 2, size, size);
    g.restore();
  }

  function url(id, size) {
    var s = size || 96;
    var c = document.createElement('canvas');
    c.width = c.height = Math.round(s * DPR);
    var g = c.getContext('2d');
    g.translate(c.width / 2, c.height / 2);
    g.scale(c.width / 100, c.height / 100);
    if (id === 'dot') dot(g, 0, 4, 40, 'smile'); else if (P[id]) P[id](g);
    return c.toDataURL('image/png');
  }

  return {
    INK: INK,
    draw: drawSprite,
    dot: dot,
    url: url,
    has: function (id) { return !!P[id]; },
    names: Object.keys(P),
    FOODS: ['tomato', 'onion', 'chilli', 'aubergine', 'carrot', 'cheese', 'bread', 'egg', 'fish', 'drumstick', 'cake', 'donut', 'icecream', 'burger', 'pizza', 'sushi', 'noodles', 'cherry', 'lemon', 'mushroom', 'apple', 'croissant', 'cupcake', 'pepper']
  };
});
