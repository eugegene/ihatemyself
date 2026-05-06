import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Cookies, RequestEvent } from '@sveltejs/kit';

// Mock auth module
const mockVerifyToken = vi.fn();
const mockRefreshAuthToken = vi.fn();
const mockSetAuthCookies = vi.fn();

vi.mock('$lib/server/auth', () => ({
	verifyToken: (...args: unknown[]) => mockVerifyToken(...args),
	refreshAuthToken: (...args: unknown[]) => mockRefreshAuthToken(...args),
	setAuthCookies: (...args: unknown[]) => mockSetAuthCookies(...args),
}));

vi.mock('$lib/utils/claims', () => ({
	mapUserFromClaims: (decoded: Record<string, string>) => ({
		username: decoded.unique_name ?? 'User',
		email: decoded.email,
		role: decoded.role ?? 'User',
		id: decoded.sub,
	}),
}));

// Must import after mocks
import { handle } from './hooks.server';

function createMockEvent(
	pathname: string,
	cookies: Record<string, string> = {},
): { event: RequestEvent; resolve: ReturnType<typeof vi.fn> } {
	const cookieStore = { ...cookies };
	const event = {
		cookies: {
			get: (name: string) => cookieStore[name] ?? undefined,
			set: vi.fn(),
			delete: vi.fn((name: string) => { delete cookieStore[name]; }),
		} as unknown as Cookies,
		url: new URL(`http://localhost${pathname}`),
		locals: {} as App.Locals,
	} as unknown as RequestEvent;

	const resolve = vi.fn().mockResolvedValue(new Response('ok'));
	return { event, resolve };
}

describe('hooks.server handle', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('sets locals.user from valid accessToken', async () => {
		mockVerifyToken.mockReturnValue({ email: 'a@b.com', role: 'Admin', unique_name: 'admin', sub: '1' });
		const { event, resolve } = createMockEvent('/', { accessToken: 'valid-at' });

		await handle({ event, resolve });

		expect(mockVerifyToken).toHaveBeenCalledWith('valid-at');
		expect(event.locals.user).toEqual({
			username: 'admin',
			email: 'a@b.com',
			role: 'Admin',
			id: '1',
		});
		expect(resolve).toHaveBeenCalledWith(event);
	});

	it('sets locals.user=null when no tokens', async () => {
		const { event, resolve } = createMockEvent('/');

		await handle({ event, resolve });

		expect(event.locals.user).toBeNull();
		expect(resolve).toHaveBeenCalled();
	});

	it('refreshes token when accessToken invalid but refreshToken exists', async () => {
		mockVerifyToken
			.mockReturnValueOnce(null) // first call: invalid accessToken
			.mockReturnValueOnce({ email: 'r@t.com', role: 'User', unique_name: 'refreshed', sub: '2' }); // second call: new token

		mockRefreshAuthToken.mockResolvedValue({
			accessToken: 'new-at',
			refreshToken: 'new-rt',
		});

		const { event, resolve } = createMockEvent('/', {
			accessToken: 'expired-at',
			refreshToken: 'valid-rt',
		});

		await handle({ event, resolve });

		expect(mockRefreshAuthToken).toHaveBeenCalledWith('valid-rt');
		expect(mockSetAuthCookies).toHaveBeenCalledWith(event.cookies, 'new-at', 'new-rt');
		expect(event.locals.user?.username).toBe('refreshed');
	});

	it('clears cookies when refresh fails with exception', async () => {
		mockVerifyToken.mockReturnValue(null);
		mockRefreshAuthToken.mockRejectedValue(new Error('refresh broke'));

		const { event, resolve } = createMockEvent('/', {
			refreshToken: 'bad-rt',
		});

		await handle({ event, resolve });

		expect(event.cookies.delete).toHaveBeenCalledWith('accessToken', { path: '/' });
		expect(event.cookies.delete).toHaveBeenCalledWith('refreshToken', { path: '/' });
		expect(event.locals.user).toBeNull();
	});

	it('redirects unauthenticated user from protected route', async () => {
		const { event, resolve } = createMockEvent('/profile');

		await expect(handle({ event, resolve })).rejects.toMatchObject({
			status: 303,
			location: '/auth/login?redirectTo=%2Fprofile',
		});
	});

	it('redirects from protected route with search params preserved', async () => {
		const { event, resolve } = createMockEvent('/settings?tab=security');

		await expect(handle({ event, resolve })).rejects.toMatchObject({
			status: 303,
			location: '/auth/login?redirectTo=%2Fsettings%3Ftab%3Dsecurity',
		});
	});

	it('allows unauthenticated access to public route', async () => {
		const { event, resolve } = createMockEvent('/auth/login');

		await handle({ event, resolve });

		expect(event.locals.user).toBeNull();
		expect(resolve).toHaveBeenCalled();
	});

	it('allows authenticated user on protected route', async () => {
		mockVerifyToken.mockReturnValue({ email: 'u@t.com', role: 'User', unique_name: 'usr', sub: '3' });
		const { event, resolve } = createMockEvent('/profile', { accessToken: 'valid' });

		await handle({ event, resolve });

		expect(event.locals.user).not.toBeNull();
		expect(resolve).toHaveBeenCalled();
	});

	it('protects all defined routes', async () => {
		const routes = ['/profile', '/settings', '/lists', '/collections', '/reviews', '/following'];

		for (const route of routes) {
			const { event, resolve } = createMockEvent(route);
			await expect(handle({ event, resolve })).rejects.toMatchObject({ status: 303 });
		}
	});

	it('does not refresh when accessToken is valid', async () => {
		mockVerifyToken.mockReturnValue({ sub: '1', unique_name: 'u', role: 'User' });
		const { event, resolve } = createMockEvent('/', {
			accessToken: 'valid',
			refreshToken: 'also-present',
		});

		await handle({ event, resolve });

		expect(mockRefreshAuthToken).not.toHaveBeenCalled();
	});
});
