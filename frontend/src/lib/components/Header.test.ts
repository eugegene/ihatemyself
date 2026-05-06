// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte';
import '@testing-library/jest-dom/vitest';

// Mock SvelteKit modules
vi.mock('$app/paths', () => ({
	resolve: (p: string) => p,
}));
vi.mock('$app/forms', () => ({
	enhance: () => ({ destroy: () => {} }),
}));

// Mock userStore — control auth state per test
let mockUser: { username: string; email: string; role: string; profilePicUrl?: string } | null =
	null;
vi.mock('$lib/stores/user.svelte', () => ({
	userStore: {
		get value() {
			return mockUser;
		},
		set(u: typeof mockUser) {
			mockUser = u;
		},
	},
}));

import Header from './Header.svelte';

describe('Header', () => {
	beforeEach(() => {
		cleanup();
		mockUser = null;
	});

	describe('guest (not authenticated)', () => {
		it('shows login link', () => {
			render(Header);
			const links = screen.getAllByRole('link', { name: /Вхід/i });
			expect(links.length).toBeGreaterThanOrEqual(1);
			expect(links[0]).toHaveAttribute('href', '/auth/login');
		});

		it('shows register link', () => {
			render(Header);
			const links = screen.getAllByRole('link', { name: /Реєстрація/i });
			expect(links.length).toBeGreaterThanOrEqual(1);
			expect(links[0]).toHaveAttribute('href', '/auth/register');
		});

		it('does not show username', () => {
			render(Header);
			expect(screen.queryByText('testuser')).not.toBeInTheDocument();
		});

		it('shows search input', () => {
			render(Header);
			expect(screen.getByPlaceholderText('Пошук...')).toBeInTheDocument();
		});

		it('shows catalog link', () => {
			render(Header);
			const links = screen.getAllByRole('link', { name: /Каталог/i });
			expect(links.length).toBeGreaterThanOrEqual(1);
		});
	});

	describe('authenticated user', () => {
		beforeEach(() => {
			mockUser = { username: 'testuser', email: 'test@example.com', role: 'User' };
		});

		it('shows username', () => {
			render(Header);
			expect(screen.getByText('testuser')).toBeInTheDocument();
		});

		it('does not show login/register links', () => {
			render(Header);
			expect(screen.queryByRole('link', { name: /^Вхід$/i })).not.toBeInTheDocument();
		});

		it('has profile link in dropdown', () => {
			render(Header);
			const links = screen.getAllByRole('link', { name: /Профіль/i });
			expect(links.length).toBeGreaterThanOrEqual(1);
		});

		it('has logout button', () => {
			render(Header);
			const buttons = screen.getAllByRole('button', { name: /Вихід/i });
			expect(buttons.length).toBeGreaterThanOrEqual(1);
		});

		it('has dropdown nav links', () => {
			render(Header);
			expect(screen.getAllByRole('link', { name: /Списки/i }).length).toBeGreaterThanOrEqual(1);
			expect(screen.getAllByRole('link', { name: /Добірки/i }).length).toBeGreaterThanOrEqual(1);
			expect(screen.getAllByRole('link', { name: /Рецензії/i }).length).toBeGreaterThanOrEqual(1);
			expect(screen.getAllByRole('link', { name: /Підписки/i }).length).toBeGreaterThanOrEqual(1);
		});
	});
});
