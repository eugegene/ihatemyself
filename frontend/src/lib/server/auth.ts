import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import type { Cookies } from '@sveltejs/kit';
import jwt from 'jsonwebtoken';

const BASE_URL = (publicEnv.PUBLIC_API_URL ?? '').replace(/\/$/, '');

function getJwtKey(): string {
	const key = env.JWT_PRIVATE_KEY;
	if (!key) {
		throw new Error('JWT_PRIVATE_KEY environment variable is not set');
	}
	return key;
}

export const verifyToken = (token: string): jwt.JwtPayload | null => {
	try {
		return jwt.verify(token, getJwtKey()) as jwt.JwtPayload;
	} catch {
		return null;
	}
};

export const refreshAuthToken = async (
	refreshToken: string,
): Promise<{ accessToken: string; refreshToken: string } | null> => {
	try {
		const response = await fetch(`${BASE_URL}/auth/renewToken`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ refreshToken }),
		});

		if (response.ok) {
			const data = await response.json();
			return data.data;
		}
	} catch (e) {
		console.error('Refresh token failed', e);
	}
	return null;
};

export const setAuthCookies = (cookies: Cookies, accessToken: string, refreshToken?: string) => {
	const secure = env.NODE_ENV === 'production';

	cookies.set('accessToken', accessToken, {
		path: '/',
		httpOnly: true,
		secure,
		sameSite: 'lax',
		maxAge: 60 * 15, // 15 хвилин
	});

	if (refreshToken) {
		cookies.set('refreshToken', refreshToken, {
			path: '/',
			httpOnly: true,
			secure,
			sameSite: 'lax',
			maxAge: 60 * 60 * 24 * 7, // 7 днів
		});
	}
};
