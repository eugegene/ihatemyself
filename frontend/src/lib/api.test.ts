import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock SvelteKit modules
vi.mock('$env/dynamic/public', () => ({
	env: { PUBLIC_API_URL: 'http://localhost/api' },
}));
vi.mock('$app/navigation', () => ({
	goto: vi.fn(),
}));
vi.mock('$app/environment', () => ({
	browser: false, // default: SSR context
}));
vi.mock('$app/paths', () => ({
	resolve: (p: string) => p,
}));

import { api } from './api';

function mockFetch(status: number, body?: unknown, headers?: Record<string, string>) {
	const res = {
		ok: status >= 200 && status < 300,
		status,
		json: () => Promise.resolve(body),
		text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body ?? '')),
		headers: new Headers(headers),
	};
	return vi.fn().mockResolvedValue(res);
}

describe('api', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	describe('get', () => {
		it('calls fetch with GET and correct URL', async () => {
			const fetch = mockFetch(200, { data: { id: 1 } });
			vi.stubGlobal('fetch', fetch);

			const result = await api.get('users/1');

			expect(fetch).toHaveBeenCalledWith(
				'http://localhost/api/users/1',
				expect.objectContaining({ method: 'GET', credentials: 'include' }),
			);
			expect(result).toEqual({ id: 1 }); // unwrapped
		});
	});

	describe('post', () => {
		it('sends JSON body', async () => {
			const fetch = mockFetch(200, { data: { ok: true } });
			vi.stubGlobal('fetch', fetch);

			await api.post('auth/login', { email: 'a@b.com', password: 'p' });

			expect(fetch).toHaveBeenCalledWith(
				'http://localhost/api/auth/login',
				expect.objectContaining({
					method: 'POST',
					body: JSON.stringify({ email: 'a@b.com', password: 'p' }),
				}),
			);
		});
	});

	describe('put', () => {
		it('sends PUT with body', async () => {
			const fetch = mockFetch(204);
			vi.stubGlobal('fetch', fetch);

			const result = await api.put('profiles/me', { username: 'new' });

			expect(fetch).toHaveBeenCalledWith(
				'http://localhost/api/profiles/me',
				expect.objectContaining({ method: 'PUT' }),
			);
			expect(result).toEqual({}); // 204 → empty object
		});
	});

	describe('delete', () => {
		it('sends DELETE request', async () => {
			const fetch = mockFetch(204);
			vi.stubGlobal('fetch', fetch);

			await api.delete('profiles/me/avatar');

			expect(fetch).toHaveBeenCalledWith(
				'http://localhost/api/profiles/me/avatar',
				expect.objectContaining({ method: 'DELETE' }),
			);
		});
	});

	describe('auth header', () => {
		it('includes Bearer token when provided', async () => {
			const fetch = mockFetch(200, { data: {} });
			vi.stubGlobal('fetch', fetch);

			await api.get('protected', 'my-token');

			const callOpts = fetch.mock.calls[0][1] as RequestInit;
			expect((callOpts.headers as Record<string, string>)['Authorization']).toBe('Bearer my-token');
		});

		it('no Authorization header when token omitted', async () => {
			const fetch = mockFetch(200, { data: {} });
			vi.stubGlobal('fetch', fetch);

			await api.get('public');

			const callOpts = fetch.mock.calls[0][1] as RequestInit;
			expect((callOpts.headers as Record<string, string>)['Authorization']).toBeUndefined();
		});
	});

	describe('error handling', () => {
		it('throws on 401', async () => {
			vi.stubGlobal('fetch', mockFetch(401));

			await expect(api.get('secret')).rejects.toMatchObject({ status: 401 });
		});

		it('throws with parsed error message on non-ok response', async () => {
			vi.stubGlobal('fetch', mockFetch(400, '{"error": "Bad input"}'));

			await expect(api.post('bad', {})).rejects.toMatchObject({
				status: 400,
			});
		});

		it('returns empty object for 204', async () => {
			vi.stubGlobal('fetch', mockFetch(204));

			const result = await api.delete('item/1');
			expect(result).toEqual({});
		});
	});

	describe('response unwrapping', () => {
		it('unwraps { data: T } response', async () => {
			vi.stubGlobal('fetch', mockFetch(200, { data: { name: 'test' } }));

			const result = await api.get<{ name: string }>('items/1');
			expect(result).toEqual({ name: 'test' });
		});

		it('returns raw when no data wrapper', async () => {
			vi.stubGlobal('fetch', mockFetch(200, { name: 'raw' }));

			const result = await api.get<{ name: string }>('items/1');
			expect(result).toEqual({ name: 'raw' });
		});
	});
});
