import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

// Literal substring bans (case-sensitive; exact phrase). Per UI-SPEC §Copywriting
// Contract § "Banned phrases". Each entry matches via `.includes(...)`.
const BANNED_LITERAL = [
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

// Word-boundary bans — tokens short enough to false-positive inside longer
// words (e.g. "greatly", "throughout", "savage"). Matched with `\b...\b`.
const BANNED_WORD = ['great', 'Great', 'rough', 'Rough', 'avg', 'Avg'];
const BANNED_WORD_RE = new RegExp('\\b(' + BANNED_WORD.join('|') + ')\\b');

function walk(dir: string, acc: string[] = []): string[] {
	for (const name of readdirSync(dir)) {
		if (name === 'node_modules' || name.startsWith('.')) continue;
		const p = join(dir, name);
		const s = statSync(p);
		if (s.isDirectory()) {
			walk(p, acc);
		} else if (/\.(svelte|ts)$/.test(name) && !p.includes('tests/')) {
			// Exclude shadcn-svelte primitives — they are upstream library code
			// that ships tokens like `destructive` which are not user-facing copy.
			if (p.includes('components/ui/')) continue;
			acc.push(p);
		}
	}
	return acc;
}

describe('copy discipline (UI-SPEC banned phrases)', () => {
	it('no banned phrase appears in src/**/*.{svelte,ts}', () => {
		const files = walk('src');
		const violations: string[] = [];
		for (const f of files) {
			const contents = readFileSync(f, 'utf8');
			for (const phrase of BANNED_LITERAL) {
				if (contents.includes(phrase)) violations.push(`${f}: "${phrase}"`);
			}
			const wordMatch = contents.match(BANNED_WORD_RE);
			if (wordMatch) violations.push(`${f}: /\\b${wordMatch[1]}\\b/`);
		}
		expect(violations, violations.join('\n')).toHaveLength(0);
	});
});
