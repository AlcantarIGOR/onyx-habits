const CACHE_NAME = 'mi-espacio-v1';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/manifest.json',
        '/icons/icon.svg'
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version if found
      if (response) {
        return response;
      }
      
      // Otherwise fetch from network
      return fetch(event.request).catch(() => {
        // Fallback for API or other failures if necessary
      });
    })
  );
});
