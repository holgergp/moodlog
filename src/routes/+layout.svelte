<!--
	App shell — CSS import, Toaster host, notification deep-link reader (D-21),
	and i18n locale reconciler.

	Service worker (Plan 05) routes notification clicks to `/?date=today`; when
	the URL has `date=today`, we set the draft date to today and strip the
	param from history (prevents the handler firing twice on refresh).

	I18n lifecycle:
	- On first load, read the persisted locale from Dexie `settings`. If set,
	  push it to Paraglide's runtime. Otherwise, auto-detect from
	  navigator.language (prefix match — "de*" → "de", else "en") and persist
	  the detected value so the next load is a cheap read.
	- The active locale is mirrored into a Svelte `$state` signal so the
	  `<html lang>` attribute reflects it after reconciliation.

	[CITED: svelte.dev/docs/kit/$app-state — page.url.searchParams replaces
	the `$page` store in runes mode.]
-->
<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { Toaster } from '$lib/components/ui/sonner';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { resetDraft } from '$lib/state/draft.svelte';
	import { localDate, setSetting } from '$lib/db/mutations';
	import { getSetting } from '$lib/db/queries';
	import {
		detectLocale,
		setLocale as setAppLocale,
		type AppLocale
	} from '$lib/i18n';
	import { activeLocale } from '$lib/state/locale.svelte';

	let { children } = $props();

	onMount(async () => {
		// --- Notification deep-link handler (D-21 + RESEARCH §Pattern 4) ---
		// Runs client-side only — the handler is in onMount, and +layout.ts
		// keeps ssr=true for the shell; the browser-only branch is safe here
		// because window/history are referenced only inside onMount.
		const params = page.url.searchParams;
		// Only honour the exact string `today` (T-01-16 — IDs outside
		// {today} are ignored; prevents crafted links from setting arbitrary
		// state via the deep-link channel).
		if (params.get('date') === 'today') {
			resetDraft(localDate());
			// Clean the URL so refresh does not re-trigger the handler and
			// the param does not persist in shareable URLs.
			const url = new URL(window.location.href);
			url.searchParams.delete('date');
			history.replaceState({}, '', url.toString());
		}

		// --- I18n locale reconciliation ---
		// Persisted value (if any) wins; otherwise auto-detect + persist.
		const persisted = await getSetting('locale');
		let resolved: AppLocale;
		if (persisted && (persisted.value === 'en' || persisted.value === 'de')) {
			resolved = persisted.value;
		} else {
			resolved = detectLocale();
			await setSetting('locale', resolved);
		}
		setAppLocale(resolved);
		activeLocale.value = resolved;
	});

	// Push the active locale onto <html lang>. This reacts to
	// activeLocale.value changes (post-reconciliation on mount, and any
	// future Settings toggle). `document` is browser-only — the guard keeps
	// SSR safe even though the layout's +layout.ts leaves ssr=true.
	$effect(() => {
		if (typeof document !== 'undefined') {
			document.documentElement.lang = activeLocale.value;
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="min-h-screen">
	{@render children()}
</div>
<Toaster position="top-center" duration={1500} />
