// src/registerServiceWorker.ts

export function registerServiceWorker() {
  // Service workers only work on HTTPS (or localhost for dev)
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then((registration) => {
          console.log("SW registered:", registration.scope);
        })
        .catch((error) => {
          console.error("SW registration failed:", error);
        });
    });
  }
}
