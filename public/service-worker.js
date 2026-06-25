const CACHE_NAME = "thcm-v1";

// Only truly static files — never React Router routes
const STATIC_ASSETS = [
  "/index.html",
  "/manifest.json",
  "/icons/logo.svg",
  "/icons/test.svg",
];

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

self.addEventListener("fetch", (event) => {
  // Let API calls go straight to network — never cache these
  if (event.request.url.includes("/api/")) return;

  // Let React Router handle all navigation (page routes like /login, /dashboard)
  if (event.request.mode === "navigate") return;

  // Only handle GET requests
  if (event.request.method !== "GET") return;

  // Cache-first for everything else (icons, fonts, static assets)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request);
    }),
  );
});
