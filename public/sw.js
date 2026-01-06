const CACHE_NAME = 'joygrow-cache-v9';

// Updated with actual build filenames
const ASSETS = [
  '/',
  '/index.html',
  '/vite.svg',
  '/manifest.webmanifest',
  '/sql-wasm.wasm',
  '/assets/ebd33da1c91354be18169c74abee5c02fe5f89cc-Cw7PkGUw.png',
  '/assets/index-Bjqu8l4p.css',
  '/assets/index-Bps17DgH.js',
  '/assets/vendor-Cl23EvnB.js',
  '/assets/pdf-DzYlv8UN.js',
  '/assets/pdf.worker-DjmdXq8j.mjs',
  '/icon/icon-192.png',
  '/icon/icon-512.png',
  '/screenshots/home-mobile.png',
  '/screenshots/home-wide.png',
];

// Install: pre-cache core app shell
self.addEventListener('install', event => {
  console.log('[SW] Installing service worker v8...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[SW] Caching', ASSETS.length, 'assets');
        return cache.addAll(ASSETS);
      })
      .then(() => {
        console.log('[SW] All assets cached successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('[SW] Failed to cache assets:', error);
      })
  );
});

// Activate: clean up old caches
self.addEventListener('activate', event => {
  console.log('[SW] Activating service worker v8...');
  event.waitUntil(
    caches.keys()
      .then(keys => {
        console.log('[SW] Existing caches:', keys);
        return Promise.all(
          keys.map(key => {
            if (key !== CACHE_NAME) {
              console.log('[SW] Deleting old cache:', key);
              return caches.delete(key);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch: network-first for HTML, cache-first for assets
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Skip external requests and non-GET requests
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/screenshots/')) {
    // For screenshots, try cache first, then network
    event.respondWith(
      caches.match(event.request)
        .then(response => response || fetch(event.request))
        .catch(() => new Response('Image not available offline', { status: 503 }))
    );
    return;
  }
  if (event.request.method !== 'GET') return;

  // Always serve SPA shell for navigations from cache if available
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html')
        .then(response => {
          if (response) {
            console.log('[SW] Serving index.html from cache');
            // Try to update in background only if online
            if (navigator.onLine) {
              fetch(event.request)
                .then(networkResponse => {
                  if (networkResponse && networkResponse.ok) {
                    caches.open(CACHE_NAME).then(cache => {
                      cache.put('/index.html', networkResponse.clone());
                    });
                  }
                })
                .catch(() => {});
            }
            return response;
          }
          // Fallback to network if not in cache
          return fetch(event.request)
            .then(networkResponse => {
              if (networkResponse && networkResponse.ok) {
                caches.open(CACHE_NAME).then(cache => {
                  cache.put('/index.html', networkResponse.clone());
                });
              }
              return networkResponse;
            })
            .catch(() => new Response('Offline', { status: 503 }));
        })
    );
    return;
  }

  // For all other requests: cache-first strategy
  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        if (cached) {
          console.log('[SW] Serving from cache:', url.pathname);
          // Only try to update cache in background if online
          if (navigator.onLine) {
            fetch(event.request)
              .then(response => {
                if (response && response.ok) {
                  caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, response);
                  });
                }
              })
              .catch(() => {
                // Silent fail - we already have cached version
              });
          }
          return cached;
        }

        console.log('[SW] Not in cache, fetching:', url.pathname);
        // Not in cache: fetch from network and cache it
        return fetch(event.request)
          .then(response => {
            if (response && response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then(cache => {
                console.log('[SW] Caching new resource:', url.pathname);
                cache.put(event.request, clone);
              });
            }
            return response;
          })
          .catch(error => {
            console.error('[SW] Fetch failed for:', url.pathname, error);
            // Network failed and not in cache
            if (event.request.destination === 'document') {
              return caches.match('/index.html');
            }
            
            // For JS/CSS/images: return 503 to prevent MIME errors
            return new Response(`Offline - Resource not cached: ${url.pathname}`, { 
              status: 503, 
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'text/plain' }
            });
          });
      })
  );
});