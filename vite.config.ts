import { sveltekit } from '@sveltejs/kit/vite';
import { SvelteKitPWA } from '@vite-pwa/sveltekit';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		sveltekit(),
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
				icons: []
			},
			injectManifest: {
				// Phase 1: service-worker.ts doesn't exist yet (Plan 05 creates it).
				// Point injectManifest at an empty placeholder until then so the
				// build toolchain doesn't fail during scaffold verification.
				globPatterns: []
			}
		})
	]
});
