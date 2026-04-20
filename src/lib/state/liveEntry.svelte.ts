// `[CITED: context7 /dexie/dexie.js — liveQuery]`
// Minimal Svelte 5 rune wrapper over Dexie's liveQuery Observable.
// Subscribes on construction inside a component scope; unsubscribes on
// component destroy. Error path logs only err?.name — never entry payloads
// (PITFALLS #12 — no data exfil in console).
import { liveQuery, type Observable } from 'dexie';
import { onDestroy } from 'svelte';

export function useLiveQuery<T>(query: () => Promise<T>, initial: T): { readonly current: T } {
	let current = $state<T>(initial);
	const obs: Observable<T> = liveQuery(query);
	const sub = obs.subscribe({
		next: (v) => (current = v),
		error: (e) => console.error('liveQuery error', (e as Error)?.name ?? 'unknown')
	});
	onDestroy(() => sub.unsubscribe());
	return {
		get current() {
			return current;
		}
	};
}
