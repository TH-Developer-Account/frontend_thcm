// ─────────────────────────────────────────────────────────────────────────────
// tokenEvents.ts
//
// A single-purpose pub/sub: notifies subscribers whenever the access token
// is refreshed. Exists so ServerAxios.ts (which owns the refresh flow) and
// useNotifications.ts (which needs to reopen its EventSource with the new
// token) don't need to import each other directly — ServerAxios shouldn't
// know notifications exist, and the hook shouldn't reach into axios
// internals. This is the decoupling point between them.
//
// Deliberately not a generic event bus — one event, one purpose. If a
// second consumer ever needs "token refreshed" (e.g. a future websocket),
// it subscribes here too; this file doesn't grow new event types casually.
// ─────────────────────────────────────────────────────────────────────────────

type TokenRefreshedListener = (newToken: string) => void;

const listeners = new Set<TokenRefreshedListener>();

export function emitTokenRefreshed(newToken: string): void {
  listeners.forEach((listener) => listener(newToken));
}

// Returns an unsubscribe function — call it in a useEffect cleanup.
export function onTokenRefreshed(listener: TokenRefreshedListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
