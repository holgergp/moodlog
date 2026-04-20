import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Literal substring bans (case-sensitive; exact phrase). Per UI-SPEC
// §Copywriting Contract §"Banned phrases" + PITFALLS #11. Each entry
// matches via `.includes(...)`.
const BANNED_LITERAL_EN = [
	'streak',
	'Streak',
	'X-day streak',
	"don't break",
	"Don't break",
	'keep it up',
	'Keep it up',
	'good day',
	'Good day',
	'bad day',
	'Bad day',
	'average mood',
	'Average mood',
	'How do you feel?',
	'Missed!',
	'You skipped',
	'Fill in the gap'
];

// German equivalents for the same moralising / gamification space
// (PITFALLS #11 rationale extends across locales; a German "großartig"
// or "Serie" leaks the same affect/streak framing).
const BANNED_LITERAL_DE = [
	'Serie', // streak gamification (DE noun)
	'Weiter so', // "keep it up" moralising
	'weiter so'
];

// Word-boundary bans — short tokens that false-positive inside longer
// words (e.g. "greatly", "throughout", "savage"). Matched with `\b...\b`.
const BANNED_WORD_EN = ['great', 'Great', 'rough', 'Rough', 'avg', 'Avg'];

// German word-boundary bans aligned with the English rating-label bans:
// "großartig / toll" ≈ "great"; "mies / furchtbar" ≈ "rough"; "Streak"
// as a loaned English noun sometimes leaks into German UIs.
const BANNED_WORD_DE = [
	'großartig',
	'Großartig',
	'toll',
	'Toll',
	'mies',
	'Mies',
	'furchtbar',
	'Furchtbar',
	'streak',
	'Streak'
];

const BANNED_WORD_EN_RE = new RegExp('\\b(' + BANNED_WORD_EN.join('|') + ')\\b');
// JS RegExp doesn't understand Unicode word boundaries for non-ASCII
// letters without the `u` flag + \p{...} classes. Use a custom boundary
// that treats anything other than a Unicode letter/digit/underscore as
// a boundary, preserving the "no false-positives in longer words"
// semantics for accented German words (großartig).
const BANNED_WORD_DE_RE = new RegExp(
	'(?<![\\p{L}\\p{N}_])(' + BANNED_WORD_DE.join('|') + ')(?![\\p{L}\\p{N}_])',
	'u'
);

function walk(dir: string, acc: string[] = []): string[] {
	for (const name of readdirSync(dir)) {
		if (name === 'node_modules' || name.startsWith('.')) continue;
		const p = join(dir, name);
		const s = statSync(p);
		if (s.isDirectory()) {
			walk(p, acc);
		} else if (/\.(svelte|ts)$/.test(name) && !p.includes('tests/')) {
			// Exclude shadcn-svelte primitives — upstream library code that
			// ships tokens like `destructive` which are not user-facing copy.
			if (p.includes('components/ui/')) continue;
			// Exclude paraglide auto-generated output — source of truth is
			// messages/*.json which we scan separately below.
			if (p.includes('/paraglide/')) continue;
			acc.push(p);
		}
	}
	return acc;
}

function listMessageFiles(dir: string): string[] {
	try {
		return readdirSync(dir)
			.filter((n) => n.endsWith('.json'))
			.map((n) => join(dir, n));
	} catch {
		return [];
	}
}

describe('copy discipline (UI-SPEC banned phrases — EN + DE)', () => {
	it('no banned phrase appears in src/**/*.{svelte,ts}', () => {
		const files = walk('src');
		const violations: string[] = [];
		for (const f of files) {
			const contents = readFileSync(f, 'utf8');
			for (const phrase of BANNED_LITERAL_EN) {
				if (contents.includes(phrase)) violations.push(`${f}: "${phrase}"`);
			}
			const wordMatch = contents.match(BANNED_WORD_EN_RE);
			if (wordMatch) violations.push(`${f}: /\\b${wordMatch[1]}\\b/`);
		}
		expect(violations, violations.join('\n')).toHaveLength(0);
	});

	it('no English banned phrase appears in messages/en.json', () => {
		const files = listMessageFiles('messages').filter((f) => f.endsWith('en.json'));
		expect(files.length).toBeGreaterThan(0);
		const violations: string[] = [];
		for (const f of files) {
			const contents = readFileSync(f, 'utf8');
			for (const phrase of BANNED_LITERAL_EN) {
				if (contents.includes(phrase)) violations.push(`${f}: "${phrase}"`);
			}
			const wordMatch = contents.match(BANNED_WORD_EN_RE);
			if (wordMatch) violations.push(`${f}: /\\b${wordMatch[1]}\\b/`);
		}
		expect(violations, violations.join('\n')).toHaveLength(0);
	});

	it('no German banned phrase appears in messages/de.json', () => {
		const files = listMessageFiles('messages').filter((f) => f.endsWith('de.json'));
		expect(files.length).toBeGreaterThan(0);
		const violations: string[] = [];
		for (const f of files) {
			const contents = readFileSync(f, 'utf8');
			for (const phrase of BANNED_LITERAL_DE) {
				if (contents.includes(phrase)) violations.push(`${f}: "${phrase}"`);
			}
			const wordMatch = contents.match(BANNED_WORD_DE_RE);
			if (wordMatch) violations.push(`${f}: /\\b${wordMatch[1]}\\b/`);
		}
		expect(violations, violations.join('\n')).toHaveLength(0);
	});
});
