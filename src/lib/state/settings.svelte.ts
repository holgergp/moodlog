// Reactive read-only views over the `settings` Dexie store. Each helper
// wraps useLiveQuery so the consuming component re-renders on any change
// to the underlying row (e.g. after onboarding writes reminder_time).
//
// All helpers must be invoked inside a component script — useLiveQuery
// registers an onDestroy cleanup, which requires a component context.
import { useLiveQuery } from './liveEntry.svelte';
import { db } from '$lib/db/local';

export function useReminderTime(): { readonly current: string } {
	return useLiveQuery<string>(
		async () => (await db.settings.get('reminder_time'))?.value ?? '21:00',
		'21:00'
	);
}

export function useOnboarded(): { readonly current: boolean } {
	return useLiveQuery<boolean>(
		async () => (await db.settings.get('onboarded'))?.value === 'true',
		false
	);
}

export function useStoragePersistent(): { readonly current: boolean | null } {
	return useLiveQuery<boolean | null>(async () => {
		const row = await db.settings.get('storage_persistent');
		if (!row) return null;
		return row.value === 'true';
	}, null);
}
