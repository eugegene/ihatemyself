import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';
import { goto } from '$app/navigation';
import { browser } from '$app/environment';
import { resolve } from '$app/paths';
import { buildApiUrl, unwrapResponse, parseErrorMessage } from '$lib/utils/api-helpers';


const BASE_URL = (env.PUBLIC_API_URL ?? '').replace(/\/$/, '');

export interface SendOptions {
	method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
	path: string;
	body?: unknown;
	token?: string;
}

async function send<T>({ method, path, body, token }: SendOptions): Promise<T> {
	const opts: RequestInit = { method, credentials: 'include' };
	opts.headers = {
		'Content-Type': 'application/json',
	};

	if (token) {
		opts.headers['Authorization'] = `Bearer ${token}`;
	}

	if (body) {
		opts.body = JSON.stringify(body);
	}
	const url = buildApiUrl(BASE_URL, path);
	try {
		const res = await fetch(url, opts);

		if (res.status === 401) {
			if (browser && window.location.pathname !== '/auth/login') {
				goto(resolve('/auth/login'));
			}
			throw error(401, 'Unauthorized');
		}

		if (!res.ok) {
			const errorText = await res.text();
			const errMessage = parseErrorMessage(errorText);
			throw error(res.status, errMessage);
		}

		if (res.status === 204) return {} as T;

		const responseData = await res.json();
		return unwrapResponse<T>(responseData);
	} catch (e) {
		console.error(`API Error [${method} ${path}]:`, e);
		throw e;
	}
}

export const api = {
	get: <T>	(path: string, token?: string) =>
		send<T>({ method: 'GET', path, token}),
	post: <T>	(path: string, body: unknown, token?: string) =>
		send<T>({ method: 'POST', path, body, token }),
	put: <T>	(path: string, body: unknown, token?: string) =>
		send<T>({ method: 'PUT', path, body, token}),
	delete: <T>	(path: string, token?: string) =>
		send<T>({ method: 'DELETE', path, token }),
};
