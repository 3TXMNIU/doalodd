const CACHE_NAME = 'yalla-music-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Activate Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch resources
self.addEventListener('fetch', event => {
  // Handle share target
  const url = new URL(event.request.url);
  
  if (url.pathname === '/share') {
    event.respondWith(
      (async () => {
        const formData = await event.request.formData();
        const sharedUrl = formData.get('url') || formData.get('text') || '';
        const title = formData.get('title') || '';
        
        // Redirect to main page with shared data
        return Response.redirect(`/index.html?shared_url=${encodeURIComponent(sharedUrl)}&title=${encodeURIComponent(title)}`, 303);
      })()
    );
    return;
  }

  // Normal fetch with cache fallback
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(response => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
          return response;
        });
      })
  );
});

// Handle messages
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
