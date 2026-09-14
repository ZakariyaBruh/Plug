/*
 * sw.js — so the app opens on a bad connection, and off the home screen.
 *
 * Deciding what to eat happens in the places phones are worst: a basement
 * kitchen, a train, a supermarket aisle, somebody's flat with two bars. The
 * whole game — the whole catalogue, the questions, the engine, the recipes — is a few
 * hundred kilobytes of static files and needs no network at all once it has
 * been fetched. There is no good reason for a dead signal to be the thing that
 * stops dinner being decided.
 *
 * WHAT IS NEVER CACHED, and why it matters more than what is:
 *
 *   /api/**  — above all /api/premium-status. A stale "yes" hands Premium to
 *   somebody who cancelled; a stale "no" takes it from somebody who is paying.
 *   Both are worse than an error, so these never touch the cache in either
 *   direction: no reads, no writes, no fallback.
 *
 *   The .apk. Six megabytes that get installed once, in a cache sized for a
 *   few hundred kilobytes of app, and no help to anybody offline.
 *
 *   Anything cross-origin — the shared browser, fonts. Opaque
 *   responses cannot be inspected, cost a disproportionate amount of quota,
 *   and none of them are any use offline anyway.
 *
 * CACHE NAME. Stamped with a build id computed from the contents of the files
 * themselves (see routes/decide/$.ts). Any change to any of them is a new
 * cache and a clean sweep of the old one, which is what stops a new index.html
 * being paired with a stale app.js.
 */
var BUILD = '__BUILD__';
var CACHE = 'morsels45-' + BUILD;

// The whole app. Small enough to take in one go, and useless in pieces.
var SHELL = [
  './',
  'index.html',
  'styles.css',
  'manifest.webmanifest',
  'icon.svg',
  'icon-maskable.svg',
  'js/app.js',
  'js/confetti.js',
  'js/config.js',
  'js/data.js',
  'js/engine.js',
  'js/flavor.js',
  'js/i18n.js',
  'js/mapview.js',
  'js/places.js',
  'js/premium.js',
  'js/progress.js',
  'js/recipes.js',
  'js/sound.js',
  'js/taste.js'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE)
      // One miss must not fail the whole install and leave no cache at all, so
      // each file is added on its own and a failure is survivable.
      .then(function (cache) {
        return Promise.all(SHELL.map(function (path) {
          return cache.add(new Request(path, { cache: 'reload' })).catch(function () {});
        }));
      })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys()
      .then(function (names) {
        return Promise.all(names.map(function (name) {
          if (name !== CACHE && name.indexOf('morsels45-') === 0) return caches.delete(name);
        }));
      })
      .then(function () { return self.clients.claim(); })
  );
});

function isApi(url) {
  return url.pathname.indexOf('/api/') === 0;
}

// The Android build. Six megabytes, downloaded once and installed, and of no
// use whatsoever to a browser that is offline — so it is left to the browser's
// own download machinery rather than being copied into a cache meant to hold a
// few hundred kilobytes of app.
function isDownload(url) {
  return /\.apk$/i.test(url.pathname);
}

self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET') return;

  var url;
  try { url = new URL(request.url); } catch (err) { return; }

  // Not ours, or must be live: leave it entirely alone. Not calling
  // respondWith is what hands it back to the browser untouched.
  if (url.origin !== self.location.origin) return;
  if (isApi(url)) return;
  if (isDownload(url)) return;

  // A page load goes to the network first, so a deploy is picked up on the
  // next visit rather than whenever the cache happens to turn over — and falls
  // back to the cached page when there is no network, which is the whole
  // point.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(function (response) {
          var copy = response.clone();
          caches.open(CACHE).then(function (cache) { cache.put(request, copy); });
          return response;
        })
        .catch(function () {
          return caches.match(request).then(function (hit) {
            return hit || caches.match('index.html') || caches.match('./');
          });
        })
    );
    return;
  }

  // Everything else under /decide/: answer from the cache at once and refresh
  // it in the background, so the app starts instantly and is at most one visit
  // behind.
  event.respondWith(
    caches.match(request).then(function (hit) {
      var live = fetch(request).then(function (response) {
        if (response && response.ok) {
          var copy = response.clone();
          caches.open(CACHE).then(function (cache) { cache.put(request, copy); });
        }
        return response;
      }).catch(function () { return hit; });
      return hit || live;
    })
  );
});
