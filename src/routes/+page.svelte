<!--
	Entry form — Phase 1's single screen.
	Composes Plan 03 widgets (ScaleDotPicker, SegmentedControl, TagChipPicker,
	DateChip) over the module-scoped `draft` $state. On submit, calls
	`saveEntry` via `use:enhance` (RESEARCH §Pattern 1, PITFALLS #7 — no
	+page.server.ts anywhere). CTA label toggles Save → Update when an
	entry exists for the selected date (D-11).

	Hard rules enforced:
	- Save is ALWAYS enabled (D-08) — no required-field gate, no submit-blocking state.
	- No confirmation modal (D-03); toast auto-dismisses in ~1.5s.
	- Past dates with no entry show the same neutral empty form (D-14).
	- Future dates are blocked in the DateChip (D-13, two-layer guard in child).
	- No `+page.server.ts` exists (Pitfall 7 / tier-misassignment guardrail).
	- Error logs scrub payload (PITFALLS #12 — log err.name only).

	I18n: all user-visible copy comes from Paraglide (`$lib/paraglide/messages`).
	Derived labels read `activeLocale.value` so Svelte re-evaluates them when
	the layout reconciles locale on mount (or when a future Settings screen
	toggles it). See `$lib/state/locale.svelte.ts`.
-->
<script lang="ts">
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { draft, hydrateDraftFromEntry } from '$lib/state/draft.svelte';
	import { useLiveQuery } from '$lib/state/liveEntry.svelte';
	import { activeLocale } from '$lib/state/locale.svelte';
	import { db } from '$lib/db/local';
	import { saveEntry, localDate } from '$lib/db/mutations';
	import { getEntryTagIds } from '$lib/db/queries';
	import { Button } from '$lib/components/ui/button';
	import ScaleDotPicker from '$lib/components/entry/ScaleDotPicker.svelte';
	import SegmentedControl from '$lib/components/entry/SegmentedControl.svelte';
	import TagChipPicker from '$lib/components/entry/TagChipPicker.svelte';
	import DateChip from '$lib/components/entry/DateChip.svelte';
	import * as m from '$lib/paraglide/messages';
	import type { Entry } from '$lib/db/local';

	// Reactive read of the entry for the current draft date (D-11 edit flow).
	// `undefined` = not loaded yet OR no entry for this date; the two are
	// indistinguishable to the UI and both render the neutral form (D-14).
	const entryForDate = useLiveQuery<Entry | undefined>(
		() => db.entries.where('local_date').equals(draft.date).first(),
		undefined
	);

	// Guard against $effect write-loop (T-01-17): only rehydrate when the
	// underlying entry id changes or transitions to/from undefined. Editing
	// a field on a loaded entry must NOT retrigger hydration and overwrite
	// the user's typing.
	let lastHydratedId = $state<string | null>(null);
	$effect(() => {
		const current = entryForDate.current;
		(async () => {
			if (current && current.id !== lastHydratedId) {
				const tagIds = await getEntryTagIds(current.id);
				hydrateDraftFromEntry(current, tagIds);
				lastHydratedId = current.id;
			} else if (!current && lastHydratedId !== null) {
				// Entry was cleared OR the user moved to a date with no entry:
				// neutral empty form (D-14) — no guilt framing.
				hydrateDraftFromEntry(undefined, []);
				lastHydratedId = null;
			}
		})();
	});

	// CTA label toggles on whether an entry exists for this date (D-11).
	const ctaLabel = $derived.by(() => {
		activeLocale.value; // register locale dep
		return entryForDate.current ? m.cta_update() : m.cta_save();
	});
	const isUpdate = $derived(!!entryForDate.current);

	// Header title — `Tonight` / `Heute Abend` when today; full-weekday format
	// for past dates, localised via Intl.DateTimeFormat passed the active locale.
	const titleLabel = $derived.by(() => {
		const locale = activeLocale.value;
		if (draft.date === localDate()) return m.header_tonight();
		const [y, mm, d] = draft.date.split('-').map(Number);
		const dateObj = new Date(y, mm - 1, d);
		return new Intl.DateTimeFormat(locale, {
			weekday: 'long',
			day: 'numeric',
			month: 'short'
		}).format(dateObj);
	});

	// Widget option labels — re-derive on locale change so the segmented
	// controls re-render with translated labels without a page reload.
	const workloadOptions = $derived.by(() => {
		activeLocale.value;
		return [
			{ value: 'light', label: m.workload_light() },
			{ value: 'moderate', label: m.workload_moderate() },
			{ value: 'heavy', label: m.workload_heavy() }
		];
	});
	const socialOptions = $derived.by(() => {
		activeLocale.value;
		return [
			{ value: 1, label: m.social_alone() },
			{ value: 2, label: m.social_mixed() },
			{ value: 3, label: m.social_with_others() }
		];
	});

	// Static section headings / scale endpoint labels — derived so they
	// re-evaluate when the active locale changes.
	const moodHeading = $derived((activeLocale.value, m.section_mood()));
	const energyHeading = $derived((activeLocale.value, m.section_energy()));
	const workloadHeading = $derived((activeLocale.value, m.section_workload()));
	const socialHeading = $derived((activeLocale.value, m.section_social()));
	const peopleHeading = $derived((activeLocale.value, m.section_people()));

	// Short aria-group labels for the scale widgets (ScaleDotPicker renders
	// each button as `${label} ${n} of 5`, so we want a concise noun —
	// "Mood" / "Stimmung" — not the full prompt).
	const moodWidgetLabel = $derived((activeLocale.value, m.scale_mood_label()));
	const energyWidgetLabel = $derived((activeLocale.value, m.scale_energy_label()));

	const moodLowLabel = $derived((activeLocale.value, m.scale_mood_low()));
	const moodHighLabel = $derived((activeLocale.value, m.scale_mood_high()));
	const energyLowLabel = $derived((activeLocale.value, m.scale_energy_low()));
	const energyHighLabel = $derived((activeLocale.value, m.scale_energy_high()));
</script>

<main class="mx-auto flex max-w-md flex-col gap-6 p-6 pb-12">
	<header class="flex items-center justify-between">
		<h1 class="text-[20px] font-semibold leading-tight">{titleLabel}</h1>
		<DateChip bind:date={draft.date} />
	</header>

	<form
		method="POST"
		use:enhance={() => {
			return async ({ update }) => {
				try {
					await saveEntry({
						local_date: draft.date,
						mood: draft.mood,
						energy: draft.energy,
						workload: draft.workload,
						social_split: draft.socialSplit,
						tagIds: draft.tagIds
					});
					// D-03 — explicit per-call duration to guarantee 1.5s auto-dismiss
					// even if svelte-sonner does not cascade <Toaster duration={1500}>
					// to individual toast() invocations.
					toast(isUpdate ? m.toast_updated() : m.toast_logged(), {
						duration: 1500
					});
				} catch (err) {
					// PITFALLS #12 — do not log payload; log only error.name
					console.error('saveEntry failed', (err as Error)?.name ?? 'unknown');
					toast(m.toast_save_error(), { duration: 1500 });
				}
				// Do not reset the form — keep values visible for the user to verify
				// (D-03 "show feedback, don't interrupt flow"; D-11 edit flow stays hydrated).
				await update({ reset: false });
			};
		}}
		class="flex flex-col gap-6"
	>
		<!--
			Section headings are rendered as <span> (not <label>) because the
			custom widgets (ScaleDotPicker, SegmentedControl, TagChipPicker)
			own their own `role="radiogroup"` + `aria-label={label}` surface;
			a native <label for> has nothing to associate with (the widgets
			render buttons, not form-control inputs with ids). Using <label>
			without a `for` attribute triggers svelte-check a11y_label warnings
			and would be misleading to screen readers.
		-->
		<section class="flex flex-col gap-2">
			<span class="text-[14px] font-semibold">{moodHeading}</span>
			<ScaleDotPicker bind:value={draft.mood} label={moodWidgetLabel} />
			<!--
				Scale endpoint labels: subtle-gray hint pairing, arrow line between.
				Keeps ScaleDotPicker generic; labels are form-section specific.
				Colour token only (no hardcoded hex, per design system).
			-->
			<div
				class="mt-1 flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]"
				aria-hidden="true"
			>
				<span>{moodLowLabel}</span>
				<span class="flex-1 self-center border-t border-[var(--color-border)]"></span>
				<span>{moodHighLabel}</span>
			</div>
		</section>

		<section class="flex flex-col gap-2">
			<span class="text-[14px] font-semibold">{energyHeading}</span>
			<ScaleDotPicker bind:value={draft.energy} label={energyWidgetLabel} />
			<div
				class="mt-1 flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]"
				aria-hidden="true"
			>
				<span>{energyLowLabel}</span>
				<span class="flex-1 self-center border-t border-[var(--color-border)]"></span>
				<span>{energyHighLabel}</span>
			</div>
		</section>

		<section class="flex flex-col gap-2">
			<span class="text-[14px] font-semibold">{workloadHeading}</span>
			<SegmentedControl
				bind:value={draft.workload}
				options={workloadOptions}
				label={workloadHeading}
			/>
		</section>

		<section class="flex flex-col gap-2">
			<span class="text-[14px] font-semibold">{socialHeading}</span>
			<SegmentedControl
				bind:value={draft.socialSplit}
				options={socialOptions}
				label={socialHeading}
			/>
		</section>

		<section class="flex flex-col gap-2">
			<span class="text-[14px] font-semibold">{peopleHeading}</span>
			<TagChipPicker bind:tagIds={draft.tagIds} />
		</section>

		<Button
			type="submit"
			class="h-11 w-full rounded-md bg-[var(--color-primary)] text-[var(--color-primary-foreground)] text-[16px] font-semibold
				focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/40"
		>
			{ctaLabel}
		</Button>
	</form>
</main>
