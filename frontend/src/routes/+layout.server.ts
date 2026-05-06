import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	// Повертаємо дані про користувача з locals у фронтенд
	return {
		user: locals.user
	};
};
