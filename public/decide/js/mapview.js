/*
 * mapview.js — a small interactive map, drawn from scratch.
 *
 * Deliberately not Leaflet plus raster tiles: that would mean a CDN, a tile
 * server, and a basemap in somebody else's colours. This draws only what it
 * actually knows — where you are, where the places are, and how far that is —
 * as an SVG that inherits the app's own palette.
 *
 * Pan by dragging, zoom with the wheel, buttons or +/-, select a pin by
 * clicking or tabbing to it.
 */
(function (root, factory) {
  var mod = factory();
  if (typeof module === 'object' && module.exports) module.exports = mod;
  else root.FoodMap = mod;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';

  function el(name, attrs) {
    var node = document.createElementNS(NS, name);
    Object.keys(attrs || {}).forEach(function (k) { node.setAttribute(k, attrs[k]); });
    return node;
  }

  // Rings at a round number of metres, chosen so three or four fit on screen.
  // A width of zero — a frame measured before it has been laid out — would give
  // a step of zero, and `for (r = step; r <= across; r += step)` with a step of
  // zero never ends. Nothing else in here can hang the tab; this could.
  function ringStep(metresAcross) {
    if (!isFinite(metresAcross) || metresAcross <= 0) return 100;
    var raw = metresAcross / 4;
    var magnitude = Math.pow(10, Math.floor(Math.log10(raw)));
    var steps = [1, 2, 2.5, 5, 10];
    for (var i = 0; i < steps.length; i++) {
      if (steps[i] * magnitude >= raw) return steps[i] * magnitude;
    }
    return 10 * magnitude;
  }

  function label(metres) {
    return metres < 1000 ? Math.round(metres) + 'm' : (metres / 1000).toFixed(metres % 1000 ? 1 : 0) + 'km';
  }

  var EARTH = 6371000;
  function rad(deg) { return deg * Math.PI / 180; }

  // Great-circle distance and initial bearing. Both go through sin/cos of the
  // longitude difference, which is periodic, so a pair either side of the date
  // line comes out as the few hundred metres it is.
  function greatCircle(lat1, lon1, lat2, lon2) {
    var dLat = rad(lat2 - lat1);
    var dLon = rad(lon2 - lon1);
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * EARTH * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function bearingTo(lat1, lon1, lat2, lon2) {
    var dLon = rad(lon2 - lon1);
    var y = Math.sin(dLon) * Math.cos(rad(lat2));
    var x = Math.cos(rad(lat1)) * Math.sin(rad(lat2)) -
            Math.sin(rad(lat1)) * Math.cos(rad(lat2)) * Math.cos(dLon);
    return Math.atan2(y, x);
  }

  // Where a place sits relative to the middle of the map, in metres.
  //
  // This is azimuthal equidistant about wherever you are: distance from the
  // centre is true distance and the angle is true bearing, which is exactly
  // what the rings and the north marker claim to mean. It replaces a flat
  // projection that treated longitude as plain subtraction — fine in London,
  // and wrong by the width of the planet on the other side of the date line,
  // where a restaurant 400m away was drawn two million pixels off screen. The
  // same subtraction collapsed at the poles.
  //
  // The distance and bearing the caller already has are preferred, so the pin
  // lands at exactly the range the row beside it reads out.
  function offset(origin, place) {
    var metres = typeof place.metres === 'number' && isFinite(place.metres)
      ? place.metres
      : greatCircle(origin.lat, origin.lon, place.lat, place.lon);
    var theta = typeof place.bearing === 'number' && isFinite(place.bearing)
      ? rad(place.bearing)
      : bearingTo(origin.lat, origin.lon, place.lat, place.lon);
    return { x: metres * Math.sin(theta), y: -metres * Math.cos(theta) };
  }

  function create(container, options) {
    options = options || {};
    var onSelect = options.onSelect || function () {};

    var origin = null;
    var places = [];
    var selectedId = null;

    var scale = 0.25;          // pixels per metre
    var panX = 0, panY = 0;    // pixels
    var width = 0, height = 0;

    var svg = el('svg', { class: 'mapview', role: 'group', 'aria-label': 'Map of nearby places' });
    var gRings = el('g', { class: 'map-rings' });
    var gPins = el('g', { class: 'map-pins' });
    var gChrome = el('g', { class: 'map-chrome' });
    svg.appendChild(gRings);
    svg.appendChild(gPins);
    svg.appendChild(gChrome);

    var controls = document.createElement('div');
    controls.className = 'map-controls';
    controls.innerHTML =
      '<button type="button" class="map-btn" data-act="in" aria-label="Zoom in">+</button>' +
      '<button type="button" class="map-btn" data-act="out" aria-label="Zoom out">−</button>' +
      '<button type="button" class="map-btn" data-act="reset" aria-label="Recentre map">◎</button>';

    container.classList.add('mapview-wrap');
    container.appendChild(svg);
    container.appendChild(controls);

    /* ------------------------------------------------------------ geometry */
    function toScreen(metresPoint) {
      return {
        x: width / 2 + metresPoint.x * scale + panX,
        y: height / 2 + metresPoint.y * scale + panY
      };
    }

    // True once the frame has a real size. A map built while its panel is still
    // hidden measures 0x0, falls back to the minimums below, and would keep the
    // zoom it worked out from them — so `sized` is what tells the observer that
    // the first honest measurement has arrived and the fit is worth redoing.
    var sized = false;

    function measure() {
      var box = container.getBoundingClientRect();
      sized = box.width > 0 && box.height > 0;
      width = Math.max(240, Math.round(box.width));
      height = Math.max(200, Math.round(box.height));
      svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);
    }

    // Zoom so the furthest place sits comfortably inside the frame.
    function fit() {
      panX = 0;
      panY = 0;
      if (!places.length) { scale = 0.25; return; }
      var furthest = places.reduce(function (max, p) { return Math.max(max, p.metres); }, 0);
      var usable = Math.min(width, height) / 2 - 52;
      scale = furthest > 0 ? Math.max(0.02, usable / (furthest * 1.12)) : 0.25;
    }

    /* --------------------------------------------------------------- draw */
    function draw() {
      // Clear first, then decide whether to redraw. The other order leaves the
      // previous search's pins on screen when there is no origin to draw from,
      // which is how a map full of results ends up behind an error message.
      gRings.textContent = '';
      gPins.textContent = '';
      gChrome.textContent = '';
      if (!origin) return;

      var centre = toScreen({ x: 0, y: 0 });
      var across = Math.max(width, height) / scale;
      var step = ringStep(across);

      // Distance rings, labelled where the label will not fall off screen. The
      // count is bounded as well as the step: four rings is the design, and a
      // fifth would mean the arithmetic above has gone wrong.
      for (var r = step, rings = 0; r <= across && rings < 8; r += step, rings++) {
        var radius = r * scale;
        if (radius < 18) continue;
        gRings.appendChild(el('circle', {
          cx: centre.x, cy: centre.y, r: radius, class: 'map-ring'
        }));
        var ly = centre.y - radius;
        if (ly > 14 && ly < height - 6) {
          var text = el('text', { x: centre.x + 6, y: ly - 5, class: 'map-ring-label' });
          text.textContent = label(r);
          gRings.appendChild(text);
        }
      }

      // Where you are.
      gChrome.appendChild(el('circle', { cx: centre.x, cy: centre.y, r: 9, class: 'map-me-halo' }));
      gChrome.appendChild(el('circle', { cx: centre.x, cy: centre.y, r: 5, class: 'map-me' }));
      gChrome.appendChild(el('circle', { cx: centre.x, cy: centre.y, r: 5, class: 'map-me-ring' }));

      // North marker, so bearings mean something.
      var north = el('g', { class: 'map-north' });
      north.appendChild(el('path', {
        d: 'M ' + (width - 26) + ' 30 l 6 14 l -6 -4 l -6 4 z', class: 'map-north-arrow'
      }));
      var nLabel = el('text', { x: width - 26, y: 22, class: 'map-north-label' });
      nLabel.textContent = 'N';
      north.appendChild(nLabel);
      gChrome.appendChild(north);

      // Scale bar.
      var barMetres = step;
      var barPx = barMetres * scale;
      if (barPx > 30 && barPx < width - 80) {
        var y = height - 20;
        var x0 = 16;
        gChrome.appendChild(el('path', {
          d: 'M ' + x0 + ' ' + (y - 4) + ' v 8 M ' + x0 + ' ' + y + ' h ' + barPx +
             ' M ' + (x0 + barPx) + ' ' + (y - 4) + ' v 8',
          class: 'map-scale'
        }));
        var sLabel = el('text', { x: x0 + barPx + 8, y: y + 4, class: 'map-scale-label' });
        sLabel.textContent = label(barMetres);
        gChrome.appendChild(sLabel);
      }

      // Pins, furthest drawn first so nearer ones sit on top. They carry the
      // same numbers as the list, which stays legible when two places are close
      // together — names at every pin overlap into mush.
      places.slice().reverse().forEach(function (place, reverseIndex) {
        var rank = places.length - reverseIndex;
        var point = toScreen(offset(origin, place));
        if (!isFinite(point.x) || !isFinite(point.y)) return;
        var isSelected = place.id === selectedId;

        var group = el('g', {
          class: 'map-pin' + (isSelected ? ' is-selected' : ''),
          tabindex: '0',
          role: 'button',
          'aria-label': rank + '. ' + place.name + ', ' + place.distance + ' away'
        });

        // Generous invisible hit area — the visible dot is too small to tap.
        group.appendChild(el('circle', { cx: point.x, cy: point.y, r: 22, class: 'map-hit' }));
        group.appendChild(el('circle', { cx: point.x, cy: point.y, r: isSelected ? 15 : 12, class: 'map-dot' }));

        var number = el('text', { x: point.x, y: point.y + 4, class: 'map-pin-rank' });
        number.textContent = String(rank);
        group.appendChild(number);

        // Only the selected pin gets a name, so nothing ever collides.
        if (isSelected) {
          var name = el('text', { x: point.x, y: point.y - 22, class: 'map-pin-label' });
          name.textContent = place.name.length > 24 ? place.name.slice(0, 23) + '…' : place.name;
          group.appendChild(name);
        }

        function choose(event) {
          event.preventDefault();
          select(place.id);
          onSelect(place);
        }
        group.addEventListener('click', choose);
        group.addEventListener('keydown', function (event) {
          if (event.key === 'Enter' || event.key === ' ') choose(event);
        });

        gPins.appendChild(group);
      });
    }

    /* -------------------------------------------------------- interaction */
    var dragging = false, lastX = 0, lastY = 0, moved = 0;

    svg.addEventListener('pointerdown', function (event) {
      if (event.target.closest('.map-pin')) return;
      dragging = true;
      moved = 0;
      lastX = event.clientX;
      lastY = event.clientY;
      try { svg.setPointerCapture(event.pointerId); } catch (err) { /* drag without it */ }
      svg.classList.add('is-dragging');
    });

    svg.addEventListener('pointermove', function (event) {
      if (!dragging) return;
      var dx = event.clientX - lastX;
      var dy = event.clientY - lastY;
      moved += Math.abs(dx) + Math.abs(dy);
      panX += dx;
      panY += dy;
      lastX = event.clientX;
      lastY = event.clientY;
      draw();
    });

    function endDrag(event) {
      if (!dragging) return;
      dragging = false;
      svg.classList.remove('is-dragging');
      try { svg.releasePointerCapture(event.pointerId); } catch (err) { /* already gone */ }
    }
    svg.addEventListener('pointerup', endDrag);
    svg.addEventListener('pointercancel', endDrag);

    svg.addEventListener('wheel', function (event) {
      event.preventDefault();
      zoomBy(event.deltaY < 0 ? 1.18 : 1 / 1.18);
    }, { passive: false });

    function zoomBy(factor) {
      scale = Math.min(4, Math.max(0.008, scale * factor));
      draw();
    }

    controls.addEventListener('click', function (event) {
      var btn = event.target.closest('.map-btn');
      if (!btn) return;
      if (btn.dataset.act === 'in') zoomBy(1.35);
      else if (btn.dataset.act === 'out') zoomBy(1 / 1.35);
      else { fit(); draw(); }
    });

    svg.addEventListener('keydown', function (event) {
      var stepPx = 40;
      if (event.key === 'ArrowLeft') panX += stepPx;
      else if (event.key === 'ArrowRight') panX -= stepPx;
      else if (event.key === 'ArrowUp') panY += stepPx;
      else if (event.key === 'ArrowDown') panY -= stepPx;
      else if (event.key === '+' || event.key === '=') zoomBy(1.35);
      else if (event.key === '-') zoomBy(1 / 1.35);
      else return;
      event.preventDefault();
      draw();
    });

    var resize = null;
    window.addEventListener('resize', function () {
      clearTimeout(resize);
      resize = setTimeout(function () { measure(); draw(); }, 120);
    });

    // The frame can change size without the window doing anything — a panel
    // opening, a font arriving, the results list growing underneath it. Watch
    // the frame directly, and re-fit if this is the first time it has had a
    // real size to be fitted to.
    if (typeof ResizeObserver !== 'undefined') {
      new ResizeObserver(function () {
        var was = sized;
        measure();
        if (!was && sized) fit();
        draw();
      }).observe(container);
    }

    /* --------------------------------------------------------------- api */
    function select(id) {
      selectedId = id;
      draw();
    }

    function show(nextOrigin, nextPlaces) {
      origin = nextOrigin;
      places = nextPlaces || [];
      selectedId = null;
      measure();
      fit();
      draw();
    }

    return {
      show: show,
      select: select,
      redraw: function () { measure(); draw(); },
      node: svg
    };
  }

  return { create: create, ringStep: ringStep, label: label, offset: offset };
});
