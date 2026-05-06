import { fail } from '@sveltejs/kit';
import type { Actions } from './$types';
import { env } from '$env/dynamic/public';
import type { TokensResponse } from '$lib/types/userTypes';

export const actions: Actions = {
	login: async ({ request, cookies, fetch }) => {
		const formData = await request.formData();
		const email = formData.get('email');
		const password = formData.get('password');

		if (!email || !password) {
			return fail(400, { email, message: 'Всі поля обов’язкові' });
		}

		console.log('login attempt');
		try {
			const res = await fetch(`${env.PUBLIC_API_URL}/auth/login`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password }),
			});

			const responseData = await res.json();

			if (!res.ok) {
				// Обробка помилок у стилі вашого api.ts
				const errorMsg =
					responseData.error || responseData.message || 'Невірний логін або пароль';
				return fail(res.status, { email, message: errorMsg });
			}

			// Перевіряємо структуру відповіді (API повертає обгорнутий об'єкт або чистий DTO)
			// Припускаємо, що структура: { data: UserDto } або просто UserDto
			const tokens = (responseData.data || responseData) as TokensResponse;

			if (tokens.accessToken && tokens.refreshToken) {
				return { success: true, tokens };
			} else {
				return fail(500, { message: 'Сервер не повернув токени' });
			}
		} catch (error) {
			console.error('Login error:', error);
			return fail(500, { message: 'Помилка з’єднання з сервером' });
		}
	},
};
