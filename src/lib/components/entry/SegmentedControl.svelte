<!--
	Generic 3-option segmented control (D-05 workload, D-06 social).
	Parent passes verbatim labels from UI-SPEC §Copywriting.
	role=radiogroup per UI-SPEC §Accessibility.
-->
<script lang="ts">
	interface Option {
		value: string | number;
		label: string;
	}
	interface Props {
		value?: string | number | null;
		options: Option[];
		label: string; // group aria-label (e.g. "Workload", "Social")
	}
	let { value = $bindable(null), options, label }: Props = $props();

	function select(v: string | number) {
		// Tap selected to clear — D-08
		value = value === v ? null : v;
	}
</script>

<div
	role="radiogroup"
	aria-label={label}
	class="flex gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] p-1"
>
	{#each options as opt (opt.value)}
		<button
			type="button"
			role="radio"
			aria-checked={value === opt.value}
			aria-label={opt.label}
			onclick={() => select(opt.value)}
			class="flex-1 min-h-[44px] rounded-md px-3 text-sm font-semibold transition-colors
				focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/40
				{value === opt.value
				? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
				: 'bg-transparent text-[var(--color-primary)]'}"
		>
			{opt.label}
		</button>
	{/each}
</div>
