/// <reference lib="webworker" />
// `[CITED: developer.mozilla.org Web/API/ServiceWorkerGlobalScope/notificationclick_event]`
//
// SvelteKit `injectManifest` strategy — this file is the service-worker
// entry point. `@vite-pwa/sveltekit` compiles it and injects the precache
// manifest at build time via `self.__WB_MANIFEST`.
//
// Phase 1 responsibilities:
// - `notificationclick` → deep-link to `/?date=today` (ENT-07, D-21).
// - `push` → explicit no-op (RESEARCH §Security T-01-21).
//
// Delegates click handling to the pure `handleNotificationClick` helper in
// `$lib/notifications/handle-click` — that function is unit-tested in
// `tests/sw.test.ts`. The SW here is the glue that wires browser globals
// (`self.clients`, `self.location.origin`) into the helper.

import { handleNotificationClick } from '$lib/notifications/handle-click';

declare const self: ServiceWorkerGlobalScope;

// Reserved for @vite-pwa/sveltekit injectManifest — workbox-build replaces
// the literal string `self.__WB_MANIFEST` with the precache manifest array.
// Phase 1 does not install a workbox precache router (app works offline via
// IndexedDB for data + browser HTTP cache for static assets), but the
// reference must (a) exist in the emitted SW source so workbox-build can
// find it, and (b) have observable side-effects so Vite does not tree-shake
// it. Assigning it to a self-scoped property satisfies both — the property
// is never read, but the assignment is a side-effect Vite preserves.
(self as unknown as { __moodlog_precache_manifest: unknown }).__moodlog_precache_manifest =
	self.__WB_MANIFEST;

// ENT-07 / D-21 — route notification clicks to the entry form with today's
// date pre-selected. The layout's deep-link reader (src/routes/+layout.svelte)
// consumes `?date=today` and resets the draft accordingly, then strips the
// param from history so refresh does not re-trigger the handler.
self.addEventListener('notificationclick', (event) => {
	event.waitUntil(
		handleNotificationClick(
			event,
			self.clients as unknown as Parameters<typeof handleNotificationClick>[1],
			self.location.origin
		)
	);
});

// Phase 1 has no push server. Explicit empty listener declares the zero
// attack surface (T-01-21); adding VAPID in Phase 2 is an additive change,
// not a retrofit of this file.
self.addEventListener('push', () => {
	// Intentionally empty.
});

// Re-export the pure helper so the service-worker module's public API
// surface includes it for anyone inspecting the bundle. Tests import
// directly from `$lib/notifications/handle-click`.
export { handleNotificationClick };
