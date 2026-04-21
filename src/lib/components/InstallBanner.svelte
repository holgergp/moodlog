<!--
	Dismissible iOS Safari install banner (D-18).

	Visible when:
	- Running on iOS Safari (not Chrome/Firefox/Edge iOS WebKit shells)
	- AND app is NOT already installed (display-mode ≠ standalone)
	- AND user has NOT dismissed it this session

	Dismissal persists in sessionStorage — the banner re-appears on the
	next browser session (per D-18 "per-session basis, re-appears until
	dismissed again or install detected"). We do NOT write to Dexie for
	the session dismissal because the dismissal lifecycle is tab-scoped,
	not account-scoped.

	I18n: copy comes from Paraglide. `activeLocale.value` is read inside the
	$derived to register the locale dependency so the banner re-renders on
	locale toggle.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { isInstalledPWA, isIOSSafari } from '$lib/pwa/persist';
	import { activeLocale } from '$lib/state/locale.svelte';
	import * as m from '$lib/paraglide/messages';

	const DISMISS_KEY = 'moodlog.installBanner.dismissed';
	let shouldShow = $state(false);

	onMount(() => {
		// Guard: sessionStorage access inside onMount is safe (client-only
		// execution). iOS private mode throws on sessionStorage.setItem in
		// some versions; wrap defensively.
		let dismissed = false;
		try {
			dismissed = sessionStorage.getItem(DISMISS_KEY) === 'true';
		} catch {
			dismissed = false;
		}
		shouldShow = isIOSSafari() && !isInstalledPWA() && !dismissed;
	});

	function dismiss() {
		try {
			sessionStorage.setItem(DISMISS_KEY, 'true');
		} catch {
			// ignore — even if storage throws, the in-memory flag below hides
			// the banner for the rest of this session.
		}
		shouldShow = false;
	}

	const bannerText = $derived((activeLocale.value, m.install_banner_text()));
	const dismissAria = $derived((activeLocale.value, m.install_banner_dismiss_aria()));
</script>

{#if shouldShow}
	<div
		class="flex items-center justify-between gap-2 border-b border-[var(--color-border)] bg-[var(--color-card)] px-4 py-2"
		role="status"
		aria-live="polite"
	>
		<p class="text-sm">{bannerText}</p>
		<button
			type="button"
			onclick={dismiss}
			aria-label={dismissAria}
			class="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md
				focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/40"
		>
			×
		</button>
	</div>
{/if}
