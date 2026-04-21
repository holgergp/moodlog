import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import { paraglideVitePlugin } from '@inlang/paraglide-js';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
		// Paraglide emits compile-time, tree-shakable message functions
		// from `messages/{locale}.json` into `src/lib/paraglide/`. The
		// generated runtime is re-exported via `src/lib/i18n.ts` and
		// consumed by components as `import * as m from '$lib/paraglide/messages'`.
		//
		// Strategy order: our own localStorage-backed custom strategy is NOT
		// used — we persist in Dexie and push the resolved locale at runtime
		// via `setLocale`. The `baseLocale` fallback ensures messages resolve
		// before the layout has had a chance to push the Dexie-persisted value.
		paraglideVitePlugin({
			project: './project.inlang',
			outdir: './src/lib/paraglide',
			// `globalVariable` lets us push the resolved locale at runtime via
			// Paraglide's `setLocale()` without routing or cookies — the value
			// lives in the Paraglide runtime's module-scoped variable. Our
			// durable store is Dexie `settings.locale`; the layout reconciles
			// on mount (persisted wins; otherwise detect + persist).
			// `baseLocale` is the terminal fallback for the very first render
			// before setLocale has run.
			strategy: ['globalVariable', 'baseLocale']
		}),
		SvelteKitPWA({
			strategies: 'injectManifest',
			srcDir: 'src',
			filename: 'service-worker.ts',
			registerType: 'autoUpdate',
			manifest: {
				name: 'MoodLog',
				short_name: 'MoodLog',
				theme_color: '#FAFAF9',
				background_color: '#FAFAF9',
				display: 'standalone',
				start_url: '/',
				icons: [
					{
						src: '/manifest-icon-192.png',
						sizes: '192x192',
						type: 'image/png',
						purpose: 'any'
					},
					{
						src: '/manifest-icon-512.png',
						sizes: '512x512',
						type: 'image/png',
						purpose: 'any maskable'
					},
					{
						src: '/apple-touch-icon.png',
						sizes: '180x180',
						type: 'image/png'
					}
				]
			}
		})
	]
});
