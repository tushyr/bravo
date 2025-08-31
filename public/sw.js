/*
  Basic service worker for offline support and installability
  - Caches app shell and static assets
  - Network-first for navigations, cache-first for static assets
*/

const CACHE_NAME = 'tb-pwa-v4';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/tb_tab.svg',
  '/tb_tab.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : Promise.resolve())))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Only handle same-origin GET requests
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Navigations: network-first
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('/', clone));
          return res;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          return (await cache.match('/')) || cache.match('/index.html');
        })
    );
    return;
  }

  // Static assets: cache-first
  const assetExt = ['.js', '.css', '.svg', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico'];
  if (assetExt.some((ext) => url.pathname.endsWith(ext))) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          return res;
        });
      })
    );
  }
});
