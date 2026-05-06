import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock $app/environment
vi.mock('$app/environment', () => ({ browser: true }));

// Mock localStorage (Node 22+ has a partial localStorage that lacks .clear())
const store: Record<string, string> = {};
const mockLocalStorage = {
	getItem: (key: string) => store[key] ?? null,
	setItem: (key: string, value: string) => { store[key] = value; },
	removeItem: (key: string) => { delete store[key]; },
	clear: () => { for (const k in store) delete store[k]; },
};
vi.stubGlobal('localStorage', mockLocalStorage);

import { storage } from './storage';

describe('storage (browser=true)', () => {
	beforeEach(() => {
		mockLocalStorage.clear();
	});

	describe('setToken', () => {
		it('stores token in localStorage', () => {
			storage.setToken('abc123');
			expect(mockLocalStorage.getItem('auth_token')).toBe('abc123');
		});

		it('overwrites existing token', () => {
			storage.setToken('old');
			storage.setToken('new');
			expect(mockLocalStorage.getItem('auth_token')).toBe('new');
		});
	});

	describe('getToken', () => {
		it('retrieves token from localStorage', () => {
			mockLocalStorage.setItem('auth_token', 'xyz');
			expect(storage.getToken()).toBe('xyz');
		});

		it('returns null when no token stored', () => {
			expect(storage.getToken()).toBeNull();
		});
	});

	describe('removeToken', () => {
		it('deletes token from localStorage', () => {
			mockLocalStorage.setItem('auth_token', 'toDelete');
			storage.removeToken();
			expect(mockLocalStorage.getItem('auth_token')).toBeNull();
		});

		it('no-op when no token exists', () => {
			storage.removeToken();
			expect(mockLocalStorage.getItem('auth_token')).toBeNull();
		});
	});
});

describe('storage (SSR — browser=false)', () => {
	beforeEach(() => {
		vi.resetModules();
		mockLocalStorage.clear();
	});

	it('setToken is no-op when not in browser', async () => {
		vi.doMock('$app/environment', () => ({ browser: false }));
		const { storage: ssrStorage } = await import('./storage');
		ssrStorage.setToken('should-not-store');
		expect(mockLocalStorage.getItem('auth_token')).toBeNull();
	});

	it('getToken returns null when not in browser', async () => {
		vi.doMock('$app/environment', () => ({ browser: false }));
		mockLocalStorage.setItem('auth_token', 'exists');
		const { storage: ssrStorage } = await import('./storage');
		expect(ssrStorage.getToken()).toBeNull();
	});

	it('removeToken is no-op when not in browser', async () => {
		vi.doMock('$app/environment', () => ({ browser: false }));
		mockLocalStorage.setItem('auth_token', 'keep');
		const { storage: ssrStorage } = await import('./storage');
		ssrStorage.removeToken();
		expect(mockLocalStorage.getItem('auth_token')).toBe('keep');
	});
});
