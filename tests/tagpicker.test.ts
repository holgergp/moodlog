import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '$lib/db/local';
import { upsertTag } from '$lib/db/mutations';
import { listTagsPrefixed } from '$lib/db/queries';

beforeEach(async () => {
	await db.tags.clear();
	await db.entry_tags.clear();
});

describe('tag upsert', () => {
	it('case-insensitive', async () => {
		// ENT-05 / D-09
		const first = await upsertTag('Alice');
		expect(first.display_name).toBe('Alice');
		expect(first.lower_key).toBe('alice');

		const second = await upsertTag('alice');
		expect(second.id).toBe(first.id); // same row
		expect(second.display_name).toBe('Alice'); // original casing preserved

		const whitespace = await upsertTag('  Alice  ');
		expect(whitespace.id).toBe(first.id); // trim + lowercase match

		await expect(upsertTag('')).rejects.toThrow();
		await expect(upsertTag('   ')).rejects.toThrow();
	});

	it('listTagsPrefixed is case-insensitive', async () => {
		await upsertTag('Alice');
		await upsertTag('Bob');
		await upsertTag('annie');

		const aPrefix = await listTagsPrefixed('A'); // uppercase A
		expect(aPrefix.map((t) => t.lower_key).sort()).toEqual(['alice', 'annie']);
	});
});
