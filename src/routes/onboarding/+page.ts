// Onboarding reads from IndexedDB (Dexie) via `$lib/db` and calls
// browser-only APIs (`navigator.storage`, `Notification`). Disabling SSR
// keeps the import graph from trying to touch those at server build time.
export const ssr = false;
export const prerender = false;
