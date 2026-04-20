// `[CITED: context7 /dexie/dexie.js — schema versioning, compound & multi-entry indexes]`
import Dexie, { type EntityTable } from 'dexie';

export type Entry = {
	id: string; // crypto.randomUUID()
	local_date: string; // "YYYY-MM-DD" local TZ (PITFALLS #8)
	mood: 1 | 2 | 3 | 4 | 5 | null; // ENT-01 (D-04)
	energy: 1 | 2 | 3 | 4 | 5 | null; // ENT-02 (D-04)
	workload: 'light' | 'moderate' | 'heavy' | null; // ENT-03 (D-05)
	social_split: 1 | 2 | 3 | null; // ENT-04 (D-06; 1=Mostly alone, 2=Mixed, 3=Mostly with others)
	created_at: string; // ISO-8601 UTC — set on first insert only
	updated_at: string; // ISO-8601 UTC — set on every put
};

export type Tag = {
	id: string;
	display_name: string; // user's original casing (D-09)
	lower_key: string; // display_name.trim().toLowerCase() (D-09)
	created_at: string;
};

export type EntryTag = { entry_id: string; tag_id: string }; // compound PK

export type SettingKey =
	| 'reminder_time' // "HH:MM" default "21:00" (D-19)
	| 'onboarded' // "true" | "false"
	| 'install_banner_dismissed_at' // ISO-8601 UTC — D-18 per-session basis, but key persists last dismissal
	| 'storage_persistent'; // "true" | "false" — result of persist() (PITFALLS #7)

export type Settings = {
	key: SettingKey;
	value: string; // stringified small blob
	updated_at: string;
};

export const db = new Dexie('moodlog') as Dexie & {
	entries: EntityTable<Entry, 'id'>;
	tags: EntityTable<Tag, 'id'>;
	entry_tags: EntityTable<EntryTag, never>;
	settings: EntityTable<Settings, 'key'>;
};

db.version(1).stores({
	entries: 'id, &local_date, updated_at',
	tags: 'id, &lower_key, display_name',
	entry_tags: '[entry_id+tag_id], entry_id, tag_id',
	settings: 'key'
});

// Future phases: db.version(2).stores({...}).upgrade(trans => ...);
