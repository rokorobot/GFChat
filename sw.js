const CACHE_NAME = 'gfchat-pwa-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/public/manifest.json',
  '/public/icons/icon-192x192.png',
  '/public/icons/icon-512x512.png',
  // Můžete přidat další statické soubory
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME).map(name => caches.delete(name))
      );
    })
  );
});
