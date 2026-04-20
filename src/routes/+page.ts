// Dexie imports reference `indexedDB` which does not exist server-side.
// Disable SSR for this page; the layout (+layout.ts) still renders the
// shell with ssr=true so the user sees paint before the Dexie bundle
// executes.
// [CITED: A7 + Open Question 3 in RESEARCH.md — entry form is client-only.]
export const ssr = false;
export const prerender = false;
