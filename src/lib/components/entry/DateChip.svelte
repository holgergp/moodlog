<!--
	Tappable date label → Popover + Calendar (D-11, D-12).
	- Today → "Today"; past → "Tue, 16 Apr" (UI-SPEC §Copywriting)
	- Future dates blocked at two layers: Calendar maxValue AND
	  onValueChange guard (belt-and-braces, D-13)
	- Uses shadcn-svelte Popover + Calendar (bits-ui underneath).
	  bits-ui Calendar expects DateValue (CalendarDate) from
	  @internationalized/date, NOT a native JS Date.
-->
<script lang="ts">
	import * as Popover from '$lib/components/ui/popover';
	import { Calendar } from '$lib/components/ui/calendar';
	import { localDate } from '$lib/db/mutations';
	import { parseDate, today, getLocalTimeZone, type DateValue } from '@internationalized/date';

	interface Props {
		date?: string; // "YYYY-MM-DD"
	}
	let { date = $bindable(localDate()) }: Props = $props();
	let open = $state(false);

	const todayStr = $derived(localDate());
	const tz = getLocalTimeZone();

	function displayLabel(d: string): string {
		if (d === todayStr) return 'Today';
		const [y, m, day] = d.split('-').map(Number);
		const dateObj = new Date(y, m - 1, day);
		return new Intl.DateTimeFormat(undefined, {
			weekday: 'short',
			day: 'numeric',
			month: 'short'
		}).format(dateObj);
	}

	function onValueChange(next: DateValue | undefined) {
		if (!next) return;
		const y = next.year;
		const mm = String(next.month).padStart(2, '0');
		const dd = String(next.day).padStart(2, '0');
		const nextStr = `${y}-${mm}-${dd}`;
		// Future blocked — belt-and-braces guard (D-13)
		if (nextStr > todayStr) return;
		date = nextStr;
		open = false;
	}

	// Calendar expects DateValue; parse the string form
	const calendarValue = $derived(parseDate(date));
	const maxValue = $derived(today(tz));
</script>

<Popover.Root bind:open>
	<Popover.Trigger
		class="inline-flex min-h-[44px] items-center rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-4 text-sm font-semibold
			focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/40"
		aria-label="Change date"
	>
		{displayLabel(date)}
	</Popover.Trigger>
	<Popover.Content class="p-0">
		<Calendar type="single" value={calendarValue} {onValueChange} {maxValue} />
	</Popover.Content>
</Popover.Root>
