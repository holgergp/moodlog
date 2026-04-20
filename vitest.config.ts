import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

export default defineConfig({
	plugins: [sveltekit()],
	test: {
		environment: 'node',
		setupFiles: ['tests/setup.ts'],
		include: ['tests/**/*.test.ts'],
		globals: false
	}
});
