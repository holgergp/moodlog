// src/lib/db/mutations.ts
import { db } from './local';
import type { Entry, Tag, SettingKey } from './local';

/**
 * Return local date "YYYY-MM-DD" in the user's timezone.
 * MUST NOT use toISOString (that's UTC — PITFALLS #8).
 */
export function localDate(d: Date = new Date()): string {
	const yyyy = d.getFullYear();
	const mm = String(d.getMonth() + 1).padStart(2, '0');
	const dd = String(d.getDate()).padStart(2, '0');
	return `${yyyy}-${mm}-${dd}`;
}

// Runtime guards — last line of defence for V5 (RESEARCH §Security Domain).
const MOOD_VALUES = new Set<unknown>([1, 2, 3, 4, 5, null]);
const ENERGY_VALUES = new Set<unknown>([1, 2, 3, 4, 5, null]);
const WORKLOAD_VALUES = new Set<unknown>(['light', 'moderate', 'heavy', null]);
const SOCIAL_VALUES = new Set<unknown>([1, 2, 3, null]);

function assertDraft(input: {
	mood: unknown;
	energy: unknown;
	workload: unknown;
	social_split: unknown;
}): void {
	if (!MOOD_VALUES.has(input.mood)) throw new RangeError(`invalid mood: ${input.mood}`);
	if (!ENERGY_VALUES.has(input.energy)) throw new RangeError(`invalid energy: ${input.energy}`);
	if (!WORKLOAD_VALUES.has(input.workload))
		throw new RangeError(`invalid workload: ${input.workload}`);
	if (!SOCIAL_VALUES.has(input.social_split))
		throw new RangeError(`invalid social_split: ${input.social_split}`);
}

export async function saveEntry(input: {
	local_date: string;
	mood: 1 | 2 | 3 | 4 | 5 | null;
	energy: 1 | 2 | 3 | 4 | 5 | null;
	workload: 'light' | 'moderate' | 'heavy' | null;
	social_split: 1 | 2 | 3 | null;
	tagIds: string[];
}): Promise<Entry> {
	assertDraft(input);
	if (!/^\d{4}-\d{2}-\d{2}$/.test(input.local_date)) {
		throw new RangeError(`invalid local_date: ${input.local_date}`);
	}

	// `[CITED: context7 /dexie/dexie.js — transactions, put, bulkPut]`
	return db.transaction('rw', db.entries, db.entry_tags, async () => {
		const existing = await db.entries.where('local_date').equals(input.local_date).first();
		const now = new Date().toISOString();
		const entry: Entry = {
			id: existing?.id ?? crypto.randomUUID(),
			local_date: input.local_date,
			mood: input.mood,
			energy: input.energy,
			workload: input.workload,
			social_split: input.social_split,
			created_at: existing?.created_at ?? now,
			updated_at: now
		};
		await db.entries.put(entry);

		// Replace entry_tags rows for this entry (D-11 — edits overwrite, not accumulate)
		const current = await db.entry_tags.where('entry_id').equals(entry.id).toArray();
		if (current.length > 0) {
			await db.entry_tags.bulkDelete(current.map((r) => [r.entry_id, r.tag_id] as const));
		}
		if (input.tagIds.length > 0) {
			await db.entry_tags.bulkPut(
				input.tagIds.map((tag_id) => ({ entry_id: entry.id, tag_id }))
			);
		}

		return entry;
	});
}

export async function upsertTag(rawName: string): Promise<Tag> {
	const display_name = rawName.trim();
	const lower_key = display_name.toLowerCase();
	if (!display_name) throw new Error('empty tag');

	return db.transaction('rw', db.tags, async () => {
		const existing = await db.tags.where('lower_key').equals(lower_key).first();
		if (existing) return existing;
		const now = new Date().toISOString();
		const tag: Tag = {
			id: crypto.randomUUID(),
			display_name,
			lower_key,
			created_at: now
		};
		await db.tags.put(tag);
		return tag;
	});
}

export async function setSetting(key: SettingKey, value: string): Promise<void> {
	await db.settings.put({ key, value, updated_at: new Date().toISOString() });
}
