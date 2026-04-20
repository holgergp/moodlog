// `[CITED: context7 /dexie/dexie.js — where, startsWith, first, toArray]`
import { db } from './local';
import type { Entry, Tag, Settings, SettingKey } from './local';

export async function getEntryForDate(local_date: string): Promise<Entry | undefined> {
	return db.entries.where('local_date').equals(local_date).first();
}

export async function listTagsPrefixed(lowerPrefix: string, limit = 50): Promise<Tag[]> {
	if (lowerPrefix === '') return db.tags.orderBy('display_name').limit(limit).toArray();
	return db.tags
		.where('lower_key')
		.startsWith(lowerPrefix.toLowerCase())
		.limit(limit)
		.toArray();
}

export async function getEntryTagIds(entry_id: string): Promise<string[]> {
	const rows = await db.entry_tags.where('entry_id').equals(entry_id).toArray();
	return rows.map((r) => r.tag_id);
}

export async function getSetting(key: SettingKey): Promise<Settings | undefined> {
	return db.settings.get(key);
}

export async function getAllEntries(): Promise<Entry[]> {
	return db.entries.orderBy('local_date').toArray();
}
