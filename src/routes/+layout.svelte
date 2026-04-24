<!--
	App shell — CSS import, Toaster host, notification deep-link reader (D-21),
	i18n locale reconciler, PWA persist call (D-16), onboarding gate (D-15),
	and in-app reminder scheduler (ENT-07).

	Service worker routes notification clicks to `/?date=today`; when the URL
	has `date=today`, we set the draft date to today and strip the param
	from history (prevents the handler firing twice on refresh).

	Onboarding gate (D-15): on mount, if `settings.onboarded` is not "true"
	and we're not already on /onboarding, redirect there. This runs AFTER
	the persist call so a silent persist happens on every open regardless
	of onboarded state (D-16).

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
	import { onMount, onDestroy } from 'svelte';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resetDraft } from '$lib/state/draft.svelte';
	import { localDate, setSetting } from '$lib/db/mutations';
	import { getSetting } from '$lib/db/queries';
	import {
		detectLocale,
		setLocale as setAppLocale,
		type AppLocale
	} from '$lib/i18n';
	import { activeLocale } from '$lib/state/locale.svelte';
	import { requestPersistence } from '$lib/pwa/persist';
	import { startReminderScheduler } from '$lib/notifications/scheduler';
	import InstallBanner from '$lib/components/InstallBanner.svelte';

	let { children } = $props();

	let schedulerHandle: { stop: () => void } | null = null;

	onMount(async () => {
		// --- D-16 / ENT-08 — persist silently on EVERY open ---
		// Idempotent per RESEARCH §Pitfall 1; result is recorded to Dexie so
		// the install banner / Settings screen can reflect eviction risk.
		const persisted = await requestPersistence();
		await setSetting('storage_persistent', persisted ? 'true' : 'false');

		// --- I18n locale reconciliation ---
		// Persisted value (if any) wins; otherwise auto-detect + persist.
		// Run this before the onboarding gate so the redirected /onboarding
		// page receives the correct locale immediately.
		const persistedLocale = await getSetting('locale');
		let resolved: AppLocale;
		if (
			persistedLocale &&
			(persistedLocale.value === 'en' || persistedLocale.value === 'de')
		) {
			resolved = persistedLocale.value;
		} else {
			resolved = detectLocale();
			await setSetting('locale', resolved);
		}
		setAppLocale(resolved);
		activeLocale.value = resolved;

		// --- D-15 onboarding gate ---
		// Redirect to /onboarding on first open. Skip the gate when already
		// there (otherwise we'd loop) and when the user has onboarded before.
		const onboarded = await getSetting('onboarded');
		const currentPath = page.url.pathname;
		if (onboarded?.value !== 'true' && currentPath !== '/onboarding') {
			await goto('/onboarding');
			return;
		}

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

		// --- ENT-07 — start the in-app reminder scheduler ---
		// Best-effort while the tab is open (RESEARCH §Pitfall 2). The
		// scheduler reads `reminder_time` each tick so a future Settings
		// screen reflects changes on the next minute boundary.
		schedulerHandle = startReminderScheduler();
	});

	onDestroy(() => {
		// T-01-23 — clear the setInterval on teardown so a hot-module reload
		// or route change doesn't leak multiple concurrent schedulers.
		if (schedulerHandle) schedulerHandle.stop();
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
	<InstallBanner />
	{@render children()}
</div>
<Toaster position="top-center" duration={1500} />
