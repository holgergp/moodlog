// Default SSR on for the app shell — produces the initial HTML quickly
// and shows the background token while Dexie boots client-side.
// The layout contains no Dexie calls (Toaster is client-only, deep-link
// handler runs inside onMount), so SSR is safe here.
// Prerender=false because page contents depend on client-side state
// (Dexie + runtime URL params).
export const ssr = true;
export const prerender = false;
