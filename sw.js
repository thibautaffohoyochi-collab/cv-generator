/* ============================================================
   SERVICE WORKER — CV Generator Pro
   Stratégie : Cache First pour les assets statiques,
               Network First pour les pages HTML
   ============================================================ */

const CACHE_NAME = 'cvpro-v10';
const CACHE_STATIC = 'cvpro-static-v10';

/* Assets à mettre en cache immédiatement à l'installation */
const PRECACHE_URLS = [
  './app.html',
  './index.html',
  './main.js',
  './style.css',
  './404.html',
  './manifest.json',
  './templates/template1.css',
  './templates/template2.css',
  './templates/template3.css',
  './templates/template4.css',
  './templates/template5.css',
  './templates/template6.css',
  './templates/template7.css',
  './templates/template8.css',
  './templates/template9.css',
  './templates/template10.css',
  './templates/template11.css',
  './templates/template12.css',
  './templates/template13.css',
  './templates/template14.css',
  './templates/template15.css',
];

/* ── INSTALL : pré-cache des assets essentiels ── */
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_STATIC).then(function(cache) {
      return cache.addAll(PRECACHE_URLS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

/* ── ACTIVATE : supprime les anciens caches ── */
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames
          .filter(function(name) {
            return name !== CACHE_STATIC && name !== CACHE_NAME;
          })
          .map(function(name) {
            return caches.delete(name);
          })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

/* ── FETCH : Cache First pour assets, Network First pour HTML ── */
self.addEventListener('fetch', function(event) {
  const url = new URL(event.request.url);

  /* Ignorer les requêtes non-GET et les CDN externes */
  if (event.request.method !== 'GET') return;
  if (url.origin !== location.origin) return;

  /* HTML → Network First (toujours la version à jour si en ligne) */
  if (event.request.headers.get('accept') &&
      event.request.headers.get('accept').includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then(function(response) {
          const clone = response.clone();
          caches.open(CACHE_STATIC).then(function(cache) {
            cache.put(event.request, clone);
          });
          return response;
        })
        .catch(function() {
          return caches.match(event.request).then(function(cached) {
            return cached || caches.match('./404.html');
          });
        })
    );
    return;
  }

  /* Autres assets (CSS, JS, images) → Cache First */
  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) return cached;
      return fetch(event.request).then(function(response) {
        if (!response || response.status !== 200) return response;
        const clone = response.clone();
        caches.open(CACHE_STATIC).then(function(cache) {
          cache.put(event.request, clone);
        });
        return response;
      });
    })
  );
});
