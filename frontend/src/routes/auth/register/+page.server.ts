import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { env } from '$env/dynamic/public';
import type { TokensResponse } from '$lib/types/userTypes';

export const actions: Actions = {
	default: async ({ request, cookies, fetch }) => {
		const formData = await request.formData();
		const username = formData.get('username');
		const email = formData.get('email');
		const password = formData.get('password');
		const confirmPassword = formData.get('confirm_password');

		if (password !== confirmPassword) {
			return fail(400, { message: 'Паролі не співпадають', username, email });
		}

		try {
			// Відправляємо тільки те, що чекає RegisterRequest
			const res = await fetch(`${env.PUBLIC_API_URL}/profiles/register`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ username, email, password, confirmPassword }),
			});

			const responseData = await res.json();

			if (!res.ok) {
				// Backend зазвичай повертає масив помилок validation errors або поле error
				const errorMsg = responseData.error || 'Помилка реєстрації';
				return fail(res.status, { message: errorMsg, username, email });
			}

			// Автоматичний логін після реєстрації
			const user = (responseData.data || responseData) as TokensResponse;

			if (user.accessToken && user.refreshToken) {
				return { success: true, tokens: user };
			}
		} catch (error) {
			console.error(error);
			return fail(500, { message: 'Помилка сервера' });
		}
	},
};
