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

// We only use cache-first for Cloudinary because its URLs are immutable
// (they embed a version hash, e.g. `/v1776193295/...`), so a cached copy is
// always correct. Local images (/assets/*.png, etc.) keep using network-first
// so they refresh when the server copy changes.
function isCloudinaryImageRequest(request) {
  return request.url.includes('res.cloudinary.com');
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
//   - Cloudinary images → cache-first (immutable URLs, kills refresh flicker)
//   - Everything else   → network-first with cache fallback
self.addEventListener('fetch', (event) => {
  const request = event.request;

  if (request.method !== 'GET') return;
  if (request.url.includes('/api/')) return;

  if (isCloudinaryImageRequest(request)) {
    event.respondWith(cacheFirstCloudinary(request));
    return;
  }

  event.respondWith(networkFirst(request));
});

function cacheFirstCloudinary(request) {
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
        });
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
