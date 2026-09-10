/*
 * confetti.js — a one-off particle burst on a throwaway canvas.
 */
(function (root, factory) {
  root.FoodConfetti = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var COLORS = ['#ff8a5b', '#ffc46b', '#ff5f9e', '#7ee0c4', '#a98bff', '#fff1c9'];

  function reducedMotion() {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
    catch (err) { return false; }
  }

  function burst(options) {
    options = options || {};
    if (reducedMotion()) return;

    var canvas = document.createElement('canvas');
    canvas.className = 'confetti';
    document.body.appendChild(canvas);

    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = canvas.width = window.innerWidth * dpr;
    var h = canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';

    var originX = (options.x != null ? options.x : window.innerWidth / 2) * dpr;
    var originY = (options.y != null ? options.y : window.innerHeight * 0.38) * dpr;
    var count = options.count || 90;

    var bits = [];
    for (var i = 0; i < count; i++) {
      var angle = Math.random() * Math.PI * 2;
      var speed = (3 + Math.random() * 9) * dpr;
      bits.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 5 * dpr,
        size: (4 + Math.random() * 6) * dpr,
        color: COLORS[(Math.random() * COLORS.length) | 0],
        spin: (Math.random() - 0.5) * 0.4,
        angle: Math.random() * Math.PI,
        life: 1
      });
    }

    var gravity = 0.32 * dpr;
    var start = performance.now();

    function frame(now) {
      var elapsed = now - start;
      ctx.clearRect(0, 0, w, h);

      bits.forEach(function (b) {
        b.vy += gravity;
        b.vx *= 0.995;
        b.x += b.vx;
        b.y += b.vy;
        b.angle += b.spin;
        b.life = Math.max(0, 1 - elapsed / 2200);

        ctx.save();
        ctx.globalAlpha = b.life;
        ctx.translate(b.x, b.y);
        ctx.rotate(b.angle);
        ctx.fillStyle = b.color;
        ctx.fillRect(-b.size / 2, -b.size / 2, b.size, b.size * 0.6);
        ctx.restore();
      });

      if (elapsed < 2200) requestAnimationFrame(frame);
      else if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    }

    requestAnimationFrame(frame);
  }

  return { burst: burst };
});
