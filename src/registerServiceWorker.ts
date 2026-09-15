// src/registerServiceWorker.ts

export function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      const basePath = "/web/";
      console.log("Registering service worker with base path:", basePath);

      navigator.serviceWorker
        .register(`${basePath}service-worker.js`, { scope: basePath })
        .then((registration) => {
          console.log("SW registered:", registration.scope);
        })
        .catch((error) => {
          console.error("SW registration failed:", error);
        });
    });
  }
}
