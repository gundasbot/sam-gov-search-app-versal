const CACHE_NAME = 'precisegovcon-cache-v6';
const APP_SHELL_URLS = ['/'];

const AUTH_BYPASS_PREFIXES = [
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/auth/',
  '/api/auth/',
];

function isAuthBypassPath(pathname) {
  return AUTH_BYPASS_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

const NAVIGATION_BYPASS_PREFIXES = [
  '/pricing',
  '/checkout',
  '/account',
];

function isNavigationBypassPath(pathname) {
  return NAVIGATION_BYPASS_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL_URLS).catch(() => {}))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      ),
    ])
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  if (req.method !== 'GET') return;

  let url;
  try {
    url = new URL(req.url);
  } catch {
    return;
  }

  // Only handle same-origin GET requests.
  if (url.origin !== self.location.origin) return;

  // Never intercept Next.js build assets/chunks to avoid stale MIME/content issues.
  if (url.pathname.startsWith('/_next/')) return;

  // Never intercept auth routes/callbacks.
  if (isAuthBypassPath(url.pathname)) return;

  // API routes should always be network-fresh with a JSON fallback.
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(req).catch(() =>
        new Response(
          JSON.stringify({ ok: false, error: 'offline', message: 'Network unavailable' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        )
      )
    );
    return;
  }

  const isDocument = req.mode === 'navigate' || req.destination === 'document';

  // Stripe/auth-sensitive navigations should bypass SW completely.
  if (isDocument && isNavigationBypassPath(url.pathname)) return;

  if (isDocument) {
    event.respondWith(
      fetch(req, { cache: 'no-store' })
        .then((res) => res)
        .catch(() => caches.match('/').then((cached) => cached || fetch('/')))
    );
    return;
  }

  // Other same-origin assets: network-first with cache fallback.
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (!res || res.status !== 200) return res;
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(req).then((cached) => cached || Response.error()))
  );
});
