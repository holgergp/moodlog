// `[CITED: context7 /dexie/dexie.js — liveQuery]`
// Svelte 5 rune wrapper over Dexie's liveQuery Observable.
//
// Why $effect (not a one-shot subscribe at module/function call time):
// Dexie's liveQuery re-emits only when the observed tables change. It does NOT
// re-subscribe when an external Svelte rune (e.g. `draft.date`) mutates. So if
// the caller passes `() => db.entries.where('local_date').equals(draft.date).first()`,
// a single long-lived subscription stays bound to whatever `draft.date` was at
// subscription time — navigating to a past date silently keeps the old row
// visible (regression → D-14 violation).
//
// Fix: create the subscription inside `$effect`. We call `queryFn()` eagerly
// inside the effect body to register any `$state` reads as reactive deps, then
// spin up a fresh liveQuery subscription. When deps change, Svelte runs the
// effect cleanup (which unsubscribes the old observable) and re-executes the
// effect body with a new subscription bound to the new deps.
//
// Error path logs only err?.name — never entry payloads (PITFALLS #12).
import { liveQuery, type Observable } from 'dexie';

export function useLiveQuery<T>(
	queryFn: () => Promise<T>,
	initial: T
): { readonly current: T } {
	let current = $state<T>(initial);
	$effect(() => {
		// Call the queryFn synchronously so any `$state` reads it performs
		// (e.g. `draft.date`) register as reactive dependencies of this effect.
		// The returned Promise is intentionally discarded here — the value will
		// arrive via the liveQuery subscription below.
		queryFn();
		const obs: Observable<T> = liveQuery(queryFn);
		const sub = obs.subscribe({
			next: (v) => (current = v),
			error: (e) => console.error('liveQuery error', (e as Error)?.name ?? 'unknown')
		});
		return () => sub.unsubscribe();
	});
	return {
		get current() {
			return current;
		}
	};
}
