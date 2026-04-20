import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '$lib/db/local';
import { draft, resetDraft, hydrateDraftFromEntry } from '$lib/state/draft.svelte';
import { saveEntry } from '$lib/db/mutations';

beforeEach(async () => {
	await db.entries.clear();
	await db.tags.clear();
	await db.entry_tags.clear();
	resetDraft('2026-04-20');
});

describe('draft state', () => {
	it('resetDraft clears all fields except date', () => {
		draft.mood = 3;
		draft.energy = 4;
		resetDraft('2026-04-20');
		expect(draft.mood).toBeNull();
		expect(draft.energy).toBeNull();
		expect(draft.date).toBe('2026-04-20');
	});

	it('hydrateDraftFromEntry pre-fills for D-11 edit flow', async () => {
		const e = await saveEntry({
			local_date: '2026-04-20',
			mood: 5,
			energy: 4,
			workload: 'heavy',
			social_split: 3,
			tagIds: []
		});
		hydrateDraftFromEntry(e, ['tag-a', 'tag-b']);
		expect(draft.mood).toBe(5);
		expect(draft.energy).toBe(4);
		expect(draft.workload).toBe('heavy');
		expect(draft.socialSplit).toBe(3);
		expect(draft.tagIds).toEqual(['tag-a', 'tag-b']);
	});

	it('hydrateDraftFromEntry with undefined keeps neutral empty form (D-14)', () => {
		draft.mood = 3;
		hydrateDraftFromEntry(undefined, []);
		expect(draft.mood).toBeNull();
		expect(draft.date).toBe('2026-04-20'); // preserved
	});
});
