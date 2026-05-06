import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';

const TEST_KEY = 'test_secret_key_for_unit_tests';

// Mock SvelteKit env modules
vi.mock('$env/dynamic/private', () => ({
	env: { JWT_PRIVATE_KEY: 'test_secret_key_for_unit_tests', NODE_ENV: 'production' },
}));
vi.mock('$env/dynamic/public', () => ({
	env: { PUBLIC_API_URL: 'http://localhost/api' },
}));

import { verifyToken, refreshAuthToken, setAuthCookies } from './auth';

// Helper: sign a real JWT with test key
function signToken(payload: object, expiresIn: string | number = '15m'): string {
	return jwt.sign(payload, TEST_KEY, { expiresIn });
}

describe('verifyToken', () => {
	it('returns payload for valid token', () => {
		const token = signToken({ id: '123', role: 'User' });
		const result = verifyToken(token);
		expect(result).not.toBeNull();
		expect(result!.id).toBe('123');
		expect(result!.role).toBe('User');
	});

	it('returns null for expired token', () => {
		const token = signToken({ id: '123' }, -1); // already expired
		expect(verifyToken(token)).toBeNull();
	});

	it('returns null for token signed with wrong key', () => {
		const token = jwt.sign({ id: '123' }, 'wrong_key');
		expect(verifyToken(token)).toBeNull();
	});

	it('returns null for malformed token', () => {
		expect(verifyToken('not.a.jwt')).toBeNull();
	});

	it('returns null for empty string', () => {
		expect(verifyToken('')).toBeNull();
	});
});

describe('refreshAuthToken', () => {
	beforeEach(() => {
		vi.restoreAllMocks();
	});

	it('returns token pair on success', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn().mockResolvedValue({
				ok: true,
				json: () => Promise.resolve({ data: { accessToken: 'new-at', refreshToken: 'new-rt' } }),
			}),
		);

		const result = await refreshAuthToken('old-refresh-token');
		expect(result).toEqual({ accessToken: 'new-at', refreshToken: 'new-rt' });
	});

	it('calls correct URL with POST', async () => {
		const mockFetch = vi.fn().mockResolvedValue({ ok: false });
		vi.stubGlobal('fetch', mockFetch);

		await refreshAuthToken('rt');

		expect(mockFetch).toHaveBeenCalledWith('http://localhost/api/auth/renewToken', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ refreshToken: 'rt' }),
		});
	});

	it('returns null on non-ok response', async () => {
		vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
		expect(await refreshAuthToken('bad-token')).toBeNull();
	});

	it('returns null on network error', async () => {
		vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));
		expect(await refreshAuthToken('rt')).toBeNull();
	});
});

describe('setAuthCookies', () => {
	it('sets accessToken cookie with correct options', () => {
		const cookies = { set: vi.fn() };
		setAuthCookies(cookies as any, 'at-value');

		expect(cookies.set).toHaveBeenCalledWith('accessToken', 'at-value', {
			path: '/',
			httpOnly: true,
			secure: true, // NODE_ENV=production
			sameSite: 'lax',
			maxAge: 900, // 15 min
		});
	});

	it('sets refreshToken cookie when provided', () => {
		const cookies = { set: vi.fn() };
		setAuthCookies(cookies as any, 'at', 'rt-value');

		expect(cookies.set).toHaveBeenCalledTimes(2);
		expect(cookies.set).toHaveBeenCalledWith('refreshToken', 'rt-value', {
			path: '/',
			httpOnly: true,
			secure: true,
			sameSite: 'lax',
			maxAge: 604800, // 7 days
		});
	});

	it('skips refreshToken cookie when not provided', () => {
		const cookies = { set: vi.fn() };
		setAuthCookies(cookies as any, 'at');

		expect(cookies.set).toHaveBeenCalledTimes(1);
		expect(cookies.set).toHaveBeenCalledWith('accessToken', 'at', expect.any(Object));
	});

	it('sets secure=false when NODE_ENV is not production', async () => {
		// Re-import with different env
		vi.resetModules();
		vi.doMock('$env/dynamic/private', () => ({
			env: { JWT_PRIVATE_KEY: TEST_KEY, NODE_ENV: 'development' },
		}));
		vi.doMock('$env/dynamic/public', () => ({
			env: { PUBLIC_API_URL: 'http://localhost/api' },
		}));

		const { setAuthCookies: devSetCookies } = await import('./auth');
		const cookies = { set: vi.fn() };
		devSetCookies(cookies as any, 'at');

		expect(cookies.set).toHaveBeenCalledWith(
			'accessToken',
			'at',
			expect.objectContaining({ secure: false }),
		);
	});
});
