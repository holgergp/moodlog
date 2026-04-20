<!--
	`[CITED: svelte.dev/docs/runes/$bindable]`
	5-button 1–5 ordinal picker for mood and energy (D-04).
	Selected = filled accent dot; unselected = outline only (UI-SPEC
	§Accessibility — shape change + colour, not colour-only).
	No emoji. No red for low values (UI-SPEC negative-affect neutrality).
-->
<script lang="ts">
	interface Props {
		value?: 1 | 2 | 3 | 4 | 5 | null;
		label: string; // "Mood" or "Energy" — interpolated into aria-label
	}
	let { value = $bindable(null), label }: Props = $props();

	function toggle(n: 1 | 2 | 3 | 4 | 5) {
		// Tap selected to clear to null — D-08 (no required fields)
		value = value === n ? null : n;
	}
</script>

<div role="radiogroup" aria-label={label} class="flex gap-2">
	{#each [1, 2, 3, 4, 5] as n (n)}
		<button
			type="button"
			role="radio"
			aria-checked={value === n}
			aria-label={`${label} ${n} of 5`}
			onclick={() => toggle(n as 1 | 2 | 3 | 4 | 5)}
			class="min-h-[44px] min-w-[44px] rounded-full border-2 transition-colors
				focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/40
				{value === n
				? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-[var(--color-primary-foreground)]'
				: 'bg-transparent border-[var(--color-border)]'}"
		>
			<span class="sr-only">{n}</span>
		</button>
	{/each}
</div>
