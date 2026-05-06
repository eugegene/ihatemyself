/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	envDir: '..',
	plugins: [tailwindcss(), sveltekit()],
	test: {
		include: ['src/**/*.test.ts'],
		environment: 'jsdom',
	},
	resolve: {
		conditions: process.env.VITEST ? ['browser'] : [],
	},
	server: {
		proxy: {
			'/api': {
				target: 'http://localhost:80',
				changeOrigin: true,
			},
		},
	},
});
