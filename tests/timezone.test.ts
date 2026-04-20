import { describe, it, expect } from 'vitest';
import { localDate } from '$lib/db/mutations';

describe('timezone', () => {
	it('23:50 local lands on local day', () => {
		// PITFALLS #8 — construct a Date at 23:50 local; must land on THAT local day, not UTC next
		const local = new Date(2026, 3, 20, 23, 50); // 2026-04-20 23:50 LOCAL
		expect(localDate(local)).toBe('2026-04-20');
	});

	it('00:10 local lands on local day', () => {
		const local = new Date(2026, 0, 5, 0, 10); // 2026-01-05 00:10 LOCAL
		expect(localDate(local)).toBe('2026-01-05');
	});

	it('does not use toISOString (implementation check)', async () => {
		// Static check — read the file and assert `toISOString` is not present in localDate implementation
		const { readFileSync } = await import('node:fs');
		const src = readFileSync('src/lib/db/mutations.ts', 'utf8');
		// Allow toISOString elsewhere (saveEntry uses it for created_at), but not within the localDate function body
		const fnMatch = src.match(/export function localDate[^}]+}/s);
		expect(fnMatch, 'localDate function not found').not.toBeNull();
		expect(fnMatch![0]).not.toContain('toISOString');
	});
});
