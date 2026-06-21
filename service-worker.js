const CACHE_NAME = 'ecotwin-cache-v11';
const ASSETS = [
  './',
  './index.html',
  './carbon-footprint-101.html',
  './css/bundle.css',
  './config.js',
  './js/utils.js',
  './js/data.js',
  './js/pledges.js',
  './js/app.js',
  './js/features/tradeoff-machine.js',
  './js/features/street-2080.js',
  './js/features/time-capsule.js',
  './js/features/receipt.js',
  './js/features/misc.js',
  './js/features/diet.js',
  './js/features.js',
  './js/gamification.js',
  './js/diagnostics.js',
  './js/ai-chat.js',
  './js/profile.js',
  './js/db-sync.js',
  './js/init.js',
  './google-auth.js',
  './assets/eco_ai_avatar.webp'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Only handle GET requests and http/https schemes
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith('http')) return;

  e.respondWith(
    fetch(e.request)
      .then(response => {
        // If valid, cache it and return
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(e.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Offline: try to serve matching cached response
        return caches.match(e.request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // Fallback to index.html
          return caches.match('./index.html');
        });
      })
  );
});
