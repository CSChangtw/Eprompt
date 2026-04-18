// sw.js — 土木建築工程提示詞生成器 PWA Service Worker
const CACHE_NAME = 'prompt-pwa-v1';

const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './favicon.ico',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700&family=Bebas+Neue&display=swap'
];

// ── Install：預快取所有資源 ──────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.allSettled(
        PRECACHE.map(url =>
          cache.add(url).catch(err => console.warn('Cache miss:', url, err))
        )
      );
    })
  );
  self.skipWaiting();
});

// ── Activate：清除舊快取 ─────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch：Cache First，miss 時 Network ─────────────
self.addEventListener('fetch', event => {
  // 只攔截 GET
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request)
        .then(response => {
          // 只快取成功的同源或 CDN 回應
          if (
            response &&
            response.status === 200 &&
            (response.type === 'basic' || response.type === 'cors')
          ) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          // 離線且找不到快取時，回傳主頁
          return caches.match('./index.html');
        });
    })
  );
});
