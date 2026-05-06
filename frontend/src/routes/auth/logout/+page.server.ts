import { redirect } from '@sveltejs/kit';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ cookies }) => {
		// Видаляємо куки сесії
		cookies.delete('accessToken', { path: '/' });
		cookies.delete('refreshToken', { path: '/' });
		
		// Редирект на сторінку входу
		throw redirect(303, '/auth/login');
	}
};
