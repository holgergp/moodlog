// `[CITED: developer.mozilla.org Web/API/StorageManager/persist]`
//
// Thin browser-API wrappers for Phase 1 PWA signal:
// - `requestPersistence()` asks the browser not to evict our IndexedDB under
//   storage-pressure. Idempotent: safe to call on every open (D-16).
// - `isInstalledPWA()` / `isIOSSafari()` answer the two questions the install
//   banner needs: "are we already installed?" and "are we in the exact browser
//   where web-push + install-prompt need the user to manually add to Home
//   Screen?" (D-18).
//
// All three are SSR-safe — they short-circuit when `navigator` / `window` is
// undefined (layout `ssr=true` imports this module at module graph eval).

export async function requestPersistence(): Promise<boolean> {
	if (
		typeof navigator === 'undefined' ||
		!('storage' in navigator) ||
		!('persist' in navigator.storage)
	) {
		return false;
	}
	const alreadyPersistent = await navigator.storage.persisted();
	if (alreadyPersistent) return true;
	return await navigator.storage.persist();
}

export function isInstalledPWA(): boolean {
	if (typeof window === 'undefined') return false;
	return (
		window.matchMedia('(display-mode: standalone)').matches ||
		// iOS Safari legacy — `navigator.standalone` is a non-standard iOS-only
		// boolean that's true when the page is launched from a home-screen icon.
		(navigator as unknown as { standalone?: boolean }).standalone === true
	);
}

export function isIOSSafari(): boolean {
	if (typeof navigator === 'undefined' || typeof window === 'undefined') return false;
	const ua = navigator.userAgent;
	const isIOS =
		/iPad|iPhone|iPod/.test(ua) &&
		!(window as unknown as { MSStream?: unknown }).MSStream;
	// Exclude in-app browsers (Chrome iOS, Firefox iOS, Edge iOS) — they all
	// embed WebKit but identify themselves separately in the UA string.
	const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
	return isIOS && isSafari;
}
