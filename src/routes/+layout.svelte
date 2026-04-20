<!--
	App shell — CSS import, Toaster host, notification deep-link reader (D-21).
	Service worker (Plan 05) routes the notification click to `/?date=today`.
	We honour that contract here: when the URL query has `date=today`, set
	the draft date to today and strip the param from history (keeps shared
	URLs clean and prevents the handler firing twice on refresh).
	[CITED: svelte.dev/docs/kit/$app-state — `page.url.searchParams` replaces
	`$page` store in runes mode.]
-->
<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { Toaster } from '$lib/components/ui/sonner';
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import { resetDraft } from '$lib/state/draft.svelte';
	import { localDate } from '$lib/db/mutations';

	let { children } = $props();

	// Notification deep-link handler (D-21 + RESEARCH §Pattern 4).
	// Runs client-side only — the handler is in onMount, and +layout.ts
	// keeps ssr=true for the shell; the browser-only branch is safe here
	// because window/history are referenced only inside onMount.
	onMount(() => {
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
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

<div class="min-h-screen bg-[var(--color-background)] text-[var(--color-accent)]">
	{@render children()}
</div>
<Toaster position="top-center" duration={1500} />
