// سِراج — Service Worker (offline caching)
const CACHE_NAME = 'seraj-v10';
const IMAGE_CACHE_NAME = 'seraj-images-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/app.js',
  '/styles.css',
  '/manifest.json',
  '/assets/logo/logo.svg',
  '/assets/logo/logo-icon.svg',
  '/assets/sharelinkbannar.png',
  '/assets/seraj.png',
  '/assets/khaled-v2.png',
  '/assets/family-photo.mp4',
  '/assets/1-.mp4',
  '/assets/2.mp4',
  '/assets/3.mp4',
  '/assets/instapay-qr.jpeg'
];

const IMAGE_EXTENSIONS = /\.(?:png|jpg|jpeg|gif|webp|avif|svg|ico)(?:\?.*)?$/i;

function isImageRequest(request) {
  if (request.destination === 'image') return true;
  const url = request.url;
  if (url.includes('res.cloudinary.com')) return true;
  return IMAGE_EXTENSIONS.test(url);
}

// Install — cache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches (keep current CACHE_NAME + image cache)
self.addEventListener('activate', (event) => {
  const KEEP = new Set([CACHE_NAME, IMAGE_CACHE_NAME]);
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => !KEEP.has(key)).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch handler
//   - Images  → cache-first (immutable by URL, kills the refresh flicker)
//   - Others  → network-first with cache fallback
self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (request.method !== 'GET') return;
  if (request.url.includes('/api/')) return;

  if (isImageRequest(request)) {
    event.respondWith(cacheFirstImage(request));
    return;
  }

  event.respondWith(networkFirst(request));
});

function cacheFirstImage(request) {
  return caches.open(IMAGE_CACHE_NAME).then((cache) => {
    return cache.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          // Cache successful + opaque (cross-origin) responses so Cloudinary
          // images survive future reloads.
          if (response && (response.ok || response.type === 'opaque')) {
            cache.put(request, response.clone()).catch(() => {});
          }
          return response;
        })
        .catch(() => cached);
    });
  });
}

function networkFirst(request) {
  return fetch(request)
    .then((response) => {
      if (response && response.ok) {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, clone).catch(() => {});
        });
      }
      return response;
    })
    .catch(() => caches.match(request));
}
