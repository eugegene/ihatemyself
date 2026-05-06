import { redirect, type Handle } from '@sveltejs/kit';
import { verifyToken, refreshAuthToken, setAuthCookies } from '$lib/server/auth';
import { mapUserFromClaims } from '$lib/utils/claims';

export const handle: Handle = async ({ event, resolve }) => {
	const accessToken = event.cookies.get('accessToken');
	const refreshToken = event.cookies.get('refreshToken');

	let user = null;

	if (accessToken) {
		const decoded = verifyToken(accessToken);
		if (decoded) {
			user = mapUserFromClaims(decoded);
		}
	}

	// Якщо токен невалідний, але є refresh token - пробуємо оновити
	if (!user && refreshToken) {
		try {
			const response = await refreshAuthToken(refreshToken);

			if (response && response.accessToken) {
				const decoded = verifyToken(response.accessToken);
				if (decoded) {
					user = mapUserFromClaims(decoded);
				}

				setAuthCookies(event.cookies, response.accessToken, response.refreshToken);
			}
		} catch {
			event.cookies.delete('accessToken', { path: '/' });
			event.cookies.delete('refreshToken', { path: '/' });
		}
	}

	event.locals.user = user;

	// Захист маршрутів
	const protectedRoutes = ['/profile', '/settings', '/lists', '/collections', '/reviews', '/following'];
	const isProtectedRoute = protectedRoutes.some((path) => event.url.pathname.startsWith(path));

	if (isProtectedRoute && !user) {
		const from = event.url.pathname + event.url.search;
		throw redirect(303, `/auth/login?redirectTo=${encodeURIComponent(from)}`);
	}

	return await resolve(event);
};
