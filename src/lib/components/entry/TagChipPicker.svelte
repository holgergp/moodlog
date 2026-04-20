<!--
	People-tag chip row + autocomplete input (D-07, D-09).
	- Chip row above input (UI-SPEC §Component Inventory)
	- Case-insensitive filter via listTagsPrefixed
	- "+ Create \"{text}\"" row only when no case-insensitive exact match
	- Svelte auto-escapes {tag.display_name} — NEVER use raw-HTML interpolation (T-01-11, XSS)
	- Input uses text-base (16px) to suppress iOS Safari auto-zoom (Pitfall 3)
	- No DB writes inside $effect — $effect only reads (RESEARCH §Anti-Patterns)
-->
<script lang="ts">
	import { listTagsPrefixed } from '$lib/db/queries';
	import { upsertTag } from '$lib/db/mutations';
	import { db } from '$lib/db/local';
	import type { Tag } from '$lib/db/local';

	interface Props {
		tagIds?: string[];
	}
	let { tagIds = $bindable([]) }: Props = $props();

	let query = $state('');
	let matches = $state<Tag[]>([]);
	let allTags = $state<Tag[]>([]);
	let selectedTags = $state<Tag[]>([]);

	// Read-only effect: resolve selected tag rows from ids
	$effect(() => {
		const ids = [...tagIds];
		(async () => {
			if (ids.length === 0) {
				selectedTags = [];
				return;
			}
			const rows = await db.tags.where('id').anyOf(ids).toArray();
			selectedTags = rows;
		})();
	});

	// Read-only effect: filter by prefix when the query changes; also probe
	// whether ANY tag exists (for the "No one yet" empty hint)
	$effect(() => {
		const q = query;
		(async () => {
			matches = await listTagsPrefixed(q, 20);
			if (q === '') {
				allTags = await listTagsPrefixed('', 1);
			}
		})();
	});

	function hasExactMatch(): boolean {
		const key = query.trim().toLowerCase();
		if (!key) return true; // empty query → no need to show Create row
		return matches.some((t) => t.lower_key === key);
	}

	function toggleTag(tag: Tag) {
		if (tagIds.includes(tag.id)) {
			tagIds = tagIds.filter((id) => id !== tag.id);
		} else {
			tagIds = [...tagIds, tag.id];
		}
	}

	async function createAndSelect() {
		const typed = query.trim();
		if (!typed) return;
		const tag = await upsertTag(typed);
		if (!tagIds.includes(tag.id)) tagIds = [...tagIds, tag.id];
		query = '';
	}
</script>

<div class="flex flex-col gap-2">
	{#if selectedTags.length > 0}
		<div class="flex flex-wrap gap-1" aria-label="Selected people">
			{#each selectedTags as tag (tag.id)}
				<button
					type="button"
					onclick={() => toggleTag(tag)}
					class="min-h-[32px] rounded-full bg-[var(--color-primary)] text-[var(--color-primary-foreground)] px-3 text-sm font-semibold
						focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/40"
					aria-label={`Remove ${tag.display_name}`}
				>
					{tag.display_name} ×
				</button>
			{/each}
		</div>
	{:else if allTags.length === 0}
		<p class="text-sm text-[var(--color-muted-foreground)]">No one yet</p>
	{/if}

	<input
		type="text"
		bind:value={query}
		placeholder="Add a person…"
		class="text-base h-11 rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-3
			focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/40"
		aria-label="Add a person"
	/>

	{#if query.length > 0}
		<ul
			role="listbox"
			class="flex flex-col gap-1 rounded-md border border-[var(--color-border)] bg-[var(--color-card)] p-1"
		>
			{#each matches.filter((t) => !tagIds.includes(t.id)) as tag (tag.id)}
				<li>
					<button
						type="button"
						role="option"
						aria-selected="false"
						onclick={() => {
							toggleTag(tag);
							query = '';
						}}
						class="w-full min-h-[44px] rounded-md px-3 text-left text-base
							focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/40
							hover:bg-[var(--color-background)]"
					>
						{tag.display_name}
					</button>
				</li>
			{/each}
			{#if !hasExactMatch()}
				<li>
					<button
						type="button"
						onclick={createAndSelect}
						class="w-full min-h-[44px] rounded-md px-3 text-left text-base
							focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/40
							hover:bg-[var(--color-background)]"
					>
						+ Create "{query.trim()}"
					</button>
				</li>
			{/if}
		</ul>
	{/if}
</div>
