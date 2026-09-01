const CACHE_NAME = "thcm-v1";

// Only truly static files — never React Router routes
const STATIC_ASSETS = [
  "/index.html",
  "/manifest.json",
  "/icons/logo.svg",
  "/icons/test.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Allow everything except explicitly cached static files to go to network
  const isCachedAsset = STATIC_ASSETS.includes(url.pathname);

  if (!isCachedAsset) {
    // Network only — don't intercept at all
    return;
  }

  // Cache first only for explicitly listed static assets
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request);
    }),
  );
});
