// Module-scoped reactive locale signal (Svelte 5 runes). Components read
// `activeLocale.value` inside their templates or derived expressions so
// their re-render graph depends on locale change.
//
// Paraglide's compiled message functions read `getLocale()` at call time;
// the paraglide runtime's locale is pushed via `setLocale()` in the layout.
// To make Svelte re-evaluate message calls on locale change, components
// should read `activeLocale.value` alongside each message call (either
// directly in the template via `{activeLocale.value, m.foo()}` or — for
// brevity — via the `mx()` wrapper in this module).
//
// The layout writes to `activeLocale.value` after reconciling with Dexie
// (persisted wins; otherwise navigator-detect + persist).
import type { AppLocale } from '$lib/i18n';

// `$state` at module scope — shared across every component that imports
// this file (RESEARCH §Svelte 5 sharing-across-modules).
let _locale = $state<AppLocale>('en');

export const activeLocale = {
	get value(): AppLocale {
		return _locale;
	},
	set value(next: AppLocale) {
		_locale = next;
	}
};

/**
 * Invoke a zero-arg message fn inside a reactive scope that depends on
 * `activeLocale.value`. The locale read is a pure dependency registration
 * — its value is discarded. Components call `mx(() => m.header_tonight)`
 * in templates or `$derived.by(...)` expressions so the message re-runs
 * when the layout flips the locale.
 */
export function mx(fn: () => () => string): string {
	// Touch the locale signal so this call depends on it reactively.
	void _locale;
	return fn()();
}

/**
 * Same as `mx` but for message fns that take an input object (e.g.
 * `{ name: 'Alice' }`). Example: `mxi(() => m.people_remove_aria, { name: tag.display_name })`.
 */
export function mxi<TInput extends Record<string, unknown>>(
	fn: () => (input: TInput) => string,
	input: TInput
): string {
	void _locale;
	return fn()(input);
}
