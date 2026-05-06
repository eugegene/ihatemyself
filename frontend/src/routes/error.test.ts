// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte';
import '@testing-library/jest-dom/vitest';

const { mockPage } = vi.hoisted(() => {
	const { writable } = require('svelte/store');
	return {
		mockPage: writable({
			status: 404,
			error: { message: 'Сторінку не знайдено' },
			url: new URL('http://localhost/missing'),
			params: {},
			route: { id: null },
			data: {},
			form: null,
		}),
	};
});

vi.mock('$app/stores', () => ({
	page: mockPage,
}));
vi.mock('$app/paths', () => ({
	resolve: (p: string) => p,
}));

import ErrorPage from './+error.svelte';

describe('+error.svelte', () => {
	beforeEach(() => {
		cleanup();
	});

	it('shows error status code', () => {
		mockPage.set({
			status: 404,
			error: { message: 'Сторінку не знайдено' },
			url: new URL('http://localhost/missing'),
			params: {},
			route: { id: null },
			data: {},
			form: null,
		});
		render(ErrorPage);
		expect(screen.getByText(/404/)).toBeInTheDocument();
	});

	it('shows error message', () => {
		mockPage.set({
			status: 500,
			error: { message: 'Внутрішня помилка' },
			url: new URL('http://localhost/broken'),
			params: {},
			route: { id: null },
			data: {},
			form: null,
		});
		render(ErrorPage);
		expect(screen.getByText('Внутрішня помилка')).toBeInTheDocument();
	});

	it('shows Ukrainian heading text', () => {
		render(ErrorPage);
		expect(screen.getByText(/Упс! Сталася помилка/)).toBeInTheDocument();
	});

	it('has home link', () => {
		render(ErrorPage);
		const link = screen.getByRole('link', { name: /Повернутися на головну/i });
		expect(link).toBeInTheDocument();
		expect(link).toHaveAttribute('href', '/');
	});

	it('shows fallback message when error.message missing', () => {
		mockPage.set({
			status: 503,
			error: null,
			url: new URL('http://localhost/down'),
			params: {},
			route: { id: null },
			data: {},
			form: null,
		});
		render(ErrorPage);
		expect(screen.getByText(/Щось пішло не так/)).toBeInTheDocument();
	});
});
