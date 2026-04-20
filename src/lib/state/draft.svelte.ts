// `[CITED: svelte.dev/docs/runes/$state#sharing-across-modules]`
// Module-scoped draft state for the entry form. Imported & mutated directly
// by widgets (ScaleDotPicker, SegmentedControl, TagChipPicker, DateChip)
// via `bind:value` bridges in `+page.svelte` (Plan 04).
//
// Never write to Dexie from here — persistence is an explicit user-action
// call to saveEntry() from `+page.svelte`'s form submit (RESEARCH
// §Anti-Patterns: "Never call db.entries.put(...) inside a $effect").
import type { Entry } from '$lib/db/local';
import { localDate } from '$lib/db/mutations';

export type Draft = {
	date: string; // YYYY-MM-DD in the user's local timezone (PITFALLS #8)
	mood: 1 | 2 | 3 | 4 | 5 | null;
	energy: 1 | 2 | 3 | 4 | 5 | null;
	workload: 'light' | 'moderate' | 'heavy' | null;
	socialSplit: 1 | 2 | 3 | null;
	tagIds: string[];
};

export const draft = $state<Draft>({
	date: localDate(),
	mood: null,
	energy: null,
	workload: null,
	socialSplit: null,
	tagIds: []
});

export function resetDraft(date: string = localDate()): void {
	draft.date = date;
	draft.mood = null;
	draft.energy = null;
	draft.workload = null;
	draft.socialSplit = null;
	draft.tagIds = [];
}

/**
 * Pre-fill the draft from an existing entry (D-11 edit flow) or clear to
 * the neutral empty form (D-14 backfill of a day with no entry).
 */
export function hydrateDraftFromEntry(e: Entry | undefined, tagIds: string[]): void {
	if (!e) {
		// Past date with no entry → keep the date but clear values (D-14 neutral form)
		const keepDate = draft.date;
		resetDraft(keepDate);
		return;
	}
	draft.date = e.local_date;
	draft.mood = e.mood;
	draft.energy = e.energy;
	draft.workload = e.workload;
	draft.socialSplit = e.social_split;
	draft.tagIds = [...tagIds];
}
