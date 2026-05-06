// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import '@testing-library/jest-dom/vitest';

vi.mock('$app/paths', () => ({
	resolve: (p: string) => p,
}));

import Footer from './Footer.svelte';

describe('Footer', () => {
	it('shows copyright text', () => {
		render(Footer);
		expect(screen.getByText(/TrackList Project/i)).toBeInTheDocument();
	});

	it('has About link', () => {
		render(Footer);
		const links = screen.getAllByRole('link', { name: /About/i });
		expect(links.length).toBeGreaterThanOrEqual(1);
		expect(links[0]).toHaveAttribute('href', '/about');
	});

	it('has Privacy link', () => {
		render(Footer);
		const links = screen.getAllByRole('link', { name: /Privacy/i });
		expect(links.length).toBeGreaterThanOrEqual(1);
		expect(links[0]).toHaveAttribute('href', '/privacy');
	});

	it('has Terms link', () => {
		render(Footer);
		const links = screen.getAllByRole('link', { name: /Terms/i });
		expect(links.length).toBeGreaterThanOrEqual(1);
		expect(links[0]).toHaveAttribute('href', '/terms');
	});

	it('has Contact link', () => {
		render(Footer);
		const links = screen.getAllByRole('link', { name: /Contact/i });
		expect(links.length).toBeGreaterThanOrEqual(1);
		expect(links[0]).toHaveAttribute('href', '/contact');
	});
});
