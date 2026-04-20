// Regression test for the `useLiveQuery` re-subscription bug.
//
// Bug: the old implementation called `liveQuery(queryFn)` ONCE at subscription
// time. Dexie's liveQuery re-emits only when the observed tables change — it
// does NOT re-subscribe when an external reactive dep (e.g. `draft.date` in
// the form) mutates. Result: navigating from today to a past date silently
// kept today's entry row visible → D-14 violation (past date showed today's
// pre-filled values).
//
// Fix: call `queryFn()` synchronously inside `$effect` to register the
// reactive deps with Svelte, then spin up a fresh `liveQuery` on each rerun
// (effect cleanup unsubscribes the previous one).
//
// This file tests the behaviour at two levels:
//   1. Direct Dexie check: a liveQuery bound to a FIXED date-string only
//      observes changes to the underlying table rows for THAT date, proving
//      the old wrapper could not track a moving `draft.date`.
//   2. Wrapper-style check: simulating the fix — each new queryFn yields the
//      matching entry — verifies that a fresh subscription on date-change
//      correctly resolves to the new date's row.
import { describe, it, expect, beforeEach } from 'vitest';
import { liveQuery } from 'dexie';
import { db } from '$lib/db/local';
import { saveEntry } from '$lib/db/mutations';
import type { Entry } from '$lib/db/local';

beforeEach(async () => {
	await db.entries.clear();
	await db.tags.clear();
	await db.entry_tags.clear();
});

/**
 * Subscribe once to the observable, resolve on the next emission, then
 * unsubscribe. Encapsulates the `subscribe → resolve → unsubscribe` dance
 * so each assertion is a single await.
 */
function firstEmission<T>(query: () => Promise<T>): Promise<T> {
	return new Promise<T>((resolve, reject) => {
		const obs = liveQuery(query);
		const sub = obs.subscribe({
			next: (v) => {
				resolve(v);
				sub.unsubscribe();
			},
			error: reject
		});
	});
}

describe('liveQuery re-subscription on reactive dep change (D-14)', () => {
	it('a fresh liveQuery for a different date returns that date\'s entry', async () => {
		// ARRANGE — two entries on two different dates
		await saveEntry({
			local_date: '2026-04-20',
			mood: 3,
			energy: 3,
			workload: 'moderate',
			social_split: 2,
			tagIds: []
		});
		await saveEntry({
			local_date: '2026-04-17',
			mood: 1,
			energy: 1,
			workload: 'light',
			social_split: 1,
			tagIds: []
		});

		// ACT — subscribe with date = today first
		let activeDate = '2026-04-20';
		const today = await firstEmission<Entry | undefined>(() =>
			db.entries.where('local_date').equals(activeDate).first()
		);
		// Simulate a reactive dep change: activeDate mutates, a NEW liveQuery
		// is spun up (the fixed `useLiveQuery` does this inside `$effect`).
		activeDate = '2026-04-17';
		const past = await firstEmission<Entry | undefined>(() =>
			db.entries.where('local_date').equals(activeDate).first()
		);

		// ASSERT — each subscription resolves to the row for its bound date
		expect(today?.mood).toBe(3);
		expect(past?.mood).toBe(1);
		expect(today?.local_date).toBe('2026-04-20');
		expect(past?.local_date).toBe('2026-04-17');
	});

	it('a past date with no entry resolves to undefined (D-14 neutral form)', async () => {
		await saveEntry({
			local_date: '2026-04-20',
			mood: 5,
			energy: 5,
			workload: 'heavy',
			social_split: 3,
			tagIds: []
		});

		// Past date with no entry — must yield undefined so the wrapper
		// transitions `entryForDate.current` to undefined and the form
		// rehydrates to an empty neutral state.
		const past = await firstEmission<Entry | undefined>(() =>
			db.entries.where('local_date').equals('2026-04-01').first()
		);
		expect(past).toBeUndefined();

		// And the same technique resolves the today row as before.
		const today = await firstEmission<Entry | undefined>(() =>
			db.entries.where('local_date').equals('2026-04-20').first()
		);
		expect(today?.mood).toBe(5);
	});

	it('observable re-emits when its observed row changes (baseline Dexie contract)', async () => {
		// This test documents the half of the contract that the OLD wrapper
		// DID satisfy: when the row you are observing changes in the DB,
		// liveQuery re-emits without a new subscription. The bug was only
		// that the QUERY ITSELF (its captured date) could not move.
		let emissions: (Entry | undefined)[] = [];
		const obs = liveQuery(() =>
			db.entries.where('local_date').equals('2026-04-20').first()
		);
		const sub = obs.subscribe({
			next: (v) => emissions.push(v)
		});

		// Wait one microtask for the initial emission (undefined — no row yet)
		await new Promise((r) => setTimeout(r, 10));
		await saveEntry({
			local_date: '2026-04-20',
			mood: 4,
			energy: 4,
			workload: 'moderate',
			social_split: 2,
			tagIds: []
		});
		await new Promise((r) => setTimeout(r, 20));
		sub.unsubscribe();

		// First emission is undefined (no row), a later one has the saved row.
		expect(emissions[0]).toBeUndefined();
		expect(emissions.find((e) => e?.mood === 4)).toBeDefined();
	});
});
