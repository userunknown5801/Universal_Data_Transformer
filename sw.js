const CACHE_NAME = 'universal-pwa-v∞';

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;

  // Only handle GET
  if (req.method !== 'GET') return;

  const accept = req.headers.get('accept') || '';

  // HTML: network-first (fresh), fallback to cache
  if (accept.includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then(res => {
          // Only cache valid responses
          if (res && res.status === 200 && res.type === 'basic') {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
          }
          return res;
        })
        .catch(() => caches.match(req))
    );
    return;
  }

  // Assets: cache-first, then network
  event.respondWith(
    caches.match(req).then(cacheRes => {
      if (cacheRes) return cacheRes;

      return fetch(req)
        .then(netRes => {
          // Avoid caching opaque or error responses
          if (netRes && netRes.status === 200 && netRes.type === 'basic') {
            const clone = netRes.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
          }
          return netRes;
        })
        .catch(() => cacheRes);
    })
  );
});
