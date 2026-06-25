const CACHE_NAME = "thcm-v1";

const STATIC_ASSETS = ["/", "/index.html", "/manifest.json"];

// Cache static shell on install
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
  self.skipWaiting();
});

// Clean up old caches on activate
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

// Fetch strategy: cache-first for static, network-first for API
self.addEventListener("fetch", (event) => {
  // Never intercept API calls — always go to network
  if (event.request.url.includes("/api/")) return;

  // Never intercept non-GET requests
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request);
    }),
  );
});
