const CACHE_NAME = 'precisegovcon-cache-v2';
const APP_SHELL_URLS = ['/', '/dashboard'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL_URLS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      ),
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle safe, same-origin GET requests.
  if (req.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  // Never cache Next.js build assets/chunks to avoid stale ChunkLoadError after deploys.
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(fetch(req, { cache: 'no-store' }));
    return;
  }

  // API routes should always be network fresh.
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(req));
    return;
  }

  // Navigation/doc requests: network-first with cache fallback.
  const isDocument = req.mode === 'navigate' || req.destination === 'document';
  if (isDocument) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((cached) => cached || caches.match('/')))
    );
    return;
  }

  // Other static assets: cache-first, then backfill cache.
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((res) => {
        if (!res || res.status !== 200) return res;
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        return res;
      });
    })
  );
});