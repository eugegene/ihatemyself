import { browser } from '$app/environment';

const TOKEN_KEY = 'auth_token';

export const storage = {
	setToken: (token: string) => {
		if (browser) {
			localStorage.setItem(TOKEN_KEY, token);
		}
	},
	getToken: (): string | null => {
		if (browser) {
			return localStorage.getItem(TOKEN_KEY);
		}
		return null;
	},
	removeToken: () => {
		if (browser) {
			localStorage.removeItem(TOKEN_KEY);
		}
	},
};
