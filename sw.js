// sw.js (Universal PWA Service Worker)
const CACHE_NAME = 'universal-pwa-v1';

// Install -> prepare cache
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
  );
});

// Activate -> cleanup old caches (optional)
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch -> network first for HTML, cache first for assets
self.addEventListener('fetch', event => {
  const req = event.request;

  // Only handle GET requests
  if (req.method !== 'GET') return;

  // If request is HTML -> network first (always fresh)
  if (req.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then(res => {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, resClone));
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // For other assets (JS, CSS, images) -> cache first
  event.respondWith(
    caches.match(req).then(cacheRes => {
      return cacheRes || fetch(req).then(netRes => {
        const netClone = netRes.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, netClone));
        return netRes;
      });
    })
  );
});