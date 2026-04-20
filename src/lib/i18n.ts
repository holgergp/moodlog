// Thin wrapper over Paraglide's generated runtime + locale detection.
//
// Phase 1 scope (per user decision):
// - No URL locale routing, no cookie strategy. Locale lives in Dexie
//   `settings.locale` and is pushed to Paraglide at runtime via setLocale
//   (configured with strategy=['globalVariable','baseLocale'] in vite.config.ts).
// - First-load detection: navigator.language prefix match ("de*" → "de",
//   else "en"). Persisted value wins on subsequent loads.
// - Manual toggle UI is deferred to a future Settings screen.
//
// Reactive locale signal lives in `$lib/state/locale.svelte.ts` so
// components can re-render on locale change without a page reload.
import {
	getLocale as paraglideGetLocale,
	setLocale as paraglideSetLocale,
	locales
} from './paraglide/runtime.js';

export type AppLocale = 'en' | 'de';

export const SUPPORTED_LOCALES = locales as readonly AppLocale[];

/**
 * Prefix-match the browser's preferred language against our supported
 * locales. `de`, `de-DE`, `de-AT` → `de`. Anything else → `en`.
 * Falls back to `'en'` on the server (no navigator).
 */
export function detectLocale(): AppLocale {
	if (typeof navigator === 'undefined') return 'en';
	const raw = navigator.language ?? 'en';
	const prefix = raw.toLowerCase().split('-')[0];
	if (prefix === 'de') return 'de';
	return 'en';
}

/** Read the currently active locale from Paraglide's runtime. */
export function getLocale(): AppLocale {
	return paraglideGetLocale() as AppLocale;
}

/**
 * Push a locale to Paraglide's runtime without triggering a full page
 * reload (`reload: false`). Paired with `activeLocale` in
 * `$lib/state/locale.svelte.ts` — the caller should update that signal
 * too so components that invoke `m.*` inside a reactive scope re-run.
 */
export function setLocale(code: AppLocale): void {
	if (code !== paraglideGetLocale()) {
		paraglideSetLocale(code, { reload: false });
	}
}
