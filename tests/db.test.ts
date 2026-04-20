import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '$lib/db/local';
import { saveEntry } from '$lib/db/mutations';
import { getEntryForDate } from '$lib/db/queries';

beforeEach(async () => {
	await db.entries.clear();
	await db.tags.clear();
	await db.entry_tags.clear();
	await db.settings.clear();
});

describe('db schema v1', () => {
	it('mood value persists', async () => {
		// ENT-01
		await saveEntry({
			local_date: '2026-04-20',
			mood: 3,
			energy: null,
			workload: null,
			social_split: null,
			tagIds: []
		});
		const row = await getEntryForDate('2026-04-20');
		expect(row?.mood).toBe(3);
	});

	it('energy value persists', async () => {
		// ENT-02
		await saveEntry({
			local_date: '2026-04-20',
			mood: null,
			energy: 4,
			workload: null,
			social_split: null,
			tagIds: []
		});
		const row = await getEntryForDate('2026-04-20');
		expect(row?.energy).toBe(4);
	});

	it('workload enum', async () => {
		// ENT-03
		await saveEntry({
			local_date: '2026-04-20',
			mood: null,
			energy: null,
			workload: 'heavy',
			social_split: null,
			tagIds: []
		});
		const row = await getEntryForDate('2026-04-20');
		expect(row?.workload).toBe('heavy');

		// Runtime guard rejects invalid enum
		await expect(
			saveEntry({
				local_date: '2026-04-21',
				mood: null,
				energy: null,
				workload: 'chaotic' as unknown as null,
				social_split: null,
				tagIds: []
			})
		).rejects.toThrow();
	});

	it('social split ordinal', async () => {
		// ENT-04
		await saveEntry({
			local_date: '2026-04-20',
			mood: null,
			energy: null,
			workload: null,
			social_split: 2,
			tagIds: []
		});
		const row = await getEntryForDate('2026-04-20');
		expect(row?.social_split).toBe(2);

		await expect(
			saveEntry({
				local_date: '2026-04-21',
				mood: null,
				energy: null,
				workload: null,
				social_split: 0 as unknown as null,
				tagIds: []
			})
		).rejects.toThrow();
	});

	it('schema v1 round-trip', async () => {
		// DAT-01
		await saveEntry({
			local_date: '2026-04-20',
			mood: 5,
			energy: 4,
			workload: 'moderate',
			social_split: 3,
			tagIds: []
		});
		const row = await getEntryForDate('2026-04-20');
		expect(row).toBeDefined();
		expect(row).toMatchObject({
			local_date: '2026-04-20',
			mood: 5,
			energy: 4,
			workload: 'moderate',
			social_split: 3
		});
		expect(row!.id).toMatch(/^[0-9a-f-]{36}$/); // uuid
		expect(row!.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
		expect(row!.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
	});

	it('empty-field save persists as null (D-08)', async () => {
		await saveEntry({
			local_date: '2026-04-20',
			mood: null,
			energy: null,
			workload: null,
			social_split: null,
			tagIds: []
		});
		const row = await getEntryForDate('2026-04-20');
		expect(row).toMatchObject({ mood: null, energy: null, workload: null, social_split: null });
	});
});
