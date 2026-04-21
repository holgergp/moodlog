<!--
	Two-step onboarding flow (D-15):
	1. Install-to-Home-Screen explainer. Platform-aware copy: iOS users see
	   the Share-icon path; everyone else sees the Chrome/Android menu
	   "Install app" path. `requestPersistence()` runs silently on mount
	   (D-16) regardless of which path the user takes through the sheet.
	2. Reminder time picker (default 21:00, D-19) + notification permission
	   request. Permission result is surfaced inline as denied-copy before
	   the final redirect so the user can see why their reminders are off.

	"Skip for now" (D-17) goes straight to `/` without writing
	`reminder_time`; it DOES write `onboarded=true` so the layout gate
	doesn't bounce back here on next load.

	Copy comes from Paraglide and honours activeLocale. The entry-form
	convention (Plan 03/04) maps UI-SPEC "accent" → shadcn `--primary`
	token, so CTA buttons use `bg-[var(--color-primary)]` here too.
-->
<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button';
	import { requestPersistence, isIOSSafari } from '$lib/pwa/persist';
	import { requestNotificationPermission } from '$lib/notifications/permission';
	import { setSetting } from '$lib/db/mutations';
	import { activeLocale } from '$lib/state/locale.svelte';
	import * as m from '$lib/paraglide/messages';

	let step = $state<1 | 2>(1);
	let reminderTime = $state('21:00'); // D-19 default
	let permissionResult = $state<NotificationPermission | null>(null);
	let platformIsIOS = $state(false);

	onMount(async () => {
		platformIsIOS = isIOSSafari();
		// D-16 — call persist() silently regardless of onboarding choices.
		// Result is recorded so the iOS banner (and future Settings screen)
		// can reflect eviction risk honestly.
		const persisted = await requestPersistence();
		await setSetting('storage_persistent', persisted ? 'true' : 'false');
	});

	async function skip() {
		await setSetting('onboarded', 'true');
		await goto('/');
	}

	function advanceToStep2() {
		step = 2;
	}

	async function continueFromStep2() {
		// Request permission BEFORE writing settings — if denied, the inline
		// copy surfaces and the user can read it before we redirect.
		permissionResult = await requestNotificationPermission();
		await setSetting('reminder_time', reminderTime);
		await setSetting('onboarded', 'true');
		// Brief delay lets the user read the denied-copy if it rendered —
		// only applied when permission was denied. For granted/default we
		// navigate immediately. Kept short (1200ms) to stay under the 30s
		// tap-budget for the full onboarding flow.
		if (permissionResult === 'denied') {
			await new Promise((resolve) => setTimeout(resolve, 1200));
		}
		await goto('/');
	}

	// All visible copy runs through Paraglide; reading activeLocale inside
	// $derived registers the reactivity so locale changes re-render copy
	// without a page reload.
	const step1Heading = $derived((activeLocale.value, m.onboarding_step1_heading()));
	const step1Body = $derived.by(() => {
		activeLocale.value;
		return platformIsIOS ? m.onboarding_step1_body_ios() : m.onboarding_step1_body_other();
	});
	const continueLabel = $derived((activeLocale.value, m.onboarding_continue()));
	const skipLabel = $derived((activeLocale.value, m.onboarding_skip()));
	const step2Heading = $derived((activeLocale.value, m.onboarding_step2_heading()));
	const step2Body = $derived((activeLocale.value, m.onboarding_step2_body()));
	const reminderLabel = $derived((activeLocale.value, m.onboarding_reminder_label()));
	const permissionDeniedCopy = $derived(
		(activeLocale.value, m.onboarding_permission_denied())
	);
</script>

<section class="mx-auto flex max-w-md flex-col gap-6 p-6 pt-12">
	{#if step === 1}
		<h1 class="text-[28px] font-semibold leading-tight">{step1Heading}</h1>
		<p class="text-base leading-relaxed">{step1Body}</p>
		<div class="flex flex-col gap-2">
			<Button
				type="button"
				onclick={advanceToStep2}
				class="h-11 w-full rounded-md bg-[var(--color-primary)] text-[var(--color-primary-foreground)] font-semibold
					focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/40"
			>
				{continueLabel}
			</Button>
			<Button
				type="button"
				onclick={skip}
				class="h-11 w-full rounded-md border border-[var(--color-border)] bg-transparent text-[var(--color-primary)] font-semibold
					focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/40"
			>
				{skipLabel}
			</Button>
		</div>
	{:else}
		<h1 class="text-[28px] font-semibold leading-tight">{step2Heading}</h1>
		<p class="text-base leading-relaxed">{step2Body}</p>
		<label class="flex flex-col gap-1">
			<span class="text-[14px] font-semibold">{reminderLabel}</span>
			<input
				type="time"
				bind:value={reminderTime}
				class="h-11 rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-3 text-base
					focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/40"
			/>
		</label>
		{#if permissionResult === 'denied'}
			<p class="text-sm text-[var(--color-muted-foreground)]">{permissionDeniedCopy}</p>
		{/if}
		<Button
			type="button"
			onclick={continueFromStep2}
			class="h-11 w-full rounded-md bg-[var(--color-primary)] text-[var(--color-primary-foreground)] font-semibold
				focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/40"
		>
			{continueLabel}
		</Button>
	{/if}
</section>
