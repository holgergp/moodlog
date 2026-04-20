import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '$lib/db/local';
import { saveEntry, upsertTag } from '$lib/db/mutations';
import { getEntryForDate, getEntryTagIds } from '$lib/db/queries';

beforeEach(async () => {
	await db.entries.clear();
	await db.tags.clear();
	await db.entry_tags.clear();
});

describe('entry edit round-trip', () => {
	it('edit preserves PK', async () => {
		// ENT-06 + D-11
		const first = await saveEntry({
			local_date: '2026-04-20',
			mood: 3,
			energy: 3,
			workload: 'light',
			social_split: 2,
			tagIds: []
		});
		const firstId = first.id;
		const firstCreated = first.created_at;

		// Edit same date
		const second = await saveEntry({
			local_date: '2026-04-20',
			mood: 5,
			energy: 2,
			workload: 'heavy',
			social_split: 1,
			tagIds: []
		});

		expect(second.id).toBe(firstId); // same PK
		expect(second.created_at).toBe(firstCreated); // created_at frozen
		expect(second.updated_at >= firstCreated).toBe(true); // updated_at bumped

		const row = await getEntryForDate('2026-04-20');
		expect(row).toMatchObject({ mood: 5, energy: 2, workload: 'heavy', social_split: 1 });

		// Only one entry for this date (unique local_date index)
		const all = await db.entries.toArray();
		expect(all).toHaveLength(1);
	});

	it('tag joins are replaced on edit (not accumulated)', async () => {
		const alice = await upsertTag('Alice');
		const bob = await upsertTag('Bob');
		const carol = await upsertTag('Carol');

		const first = await saveEntry({
			local_date: '2026-04-20',
			mood: null,
			energy: null,
			workload: null,
			social_split: null,
			tagIds: [alice.id, bob.id]
		});
		let joins = await getEntryTagIds(first.id);
		expect(joins.sort()).toEqual([alice.id, bob.id].sort());

		// Edit: drop Alice, add Carol
		await saveEntry({
			local_date: '2026-04-20',
			mood: null,
			energy: null,
			workload: null,
			social_split: null,
			tagIds: [bob.id, carol.id]
		});
		joins = await getEntryTagIds(first.id);
		expect(joins.sort()).toEqual([bob.id, carol.id].sort());
		expect(joins).not.toContain(alice.id);
	});
});
