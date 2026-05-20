const CACHE_NAME = 'tufix-v3';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
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
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Never cache JS, CSS bundles, or media files — always fetch fresh from network
  if (
    event.request.url.includes('/assets/') ||
    event.request.url.endsWith('.js') ||
    event.request.url.endsWith('.css') ||
    event.request.url.endsWith('.mp4') ||
    event.request.url.endsWith('.webm') ||
    event.request.url.endsWith('.mp3') ||
    event.request.url.endsWith('.wav')
  ) {
    event.respondWith(fetch(event.request));
    return;
  }

  // For everything else, try cache first, fall back to network
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});