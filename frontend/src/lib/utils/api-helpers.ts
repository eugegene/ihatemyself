/**
 * Build a normalized API URL from base + path, avoiding double slashes.
 */
export function buildApiUrl(base: string, path: string): string {
	const safeBase = base.endsWith('/') ? base.slice(0, -1) : base;
	const safePath = path.startsWith('/') ? path.slice(1) : path;
	return `${safeBase}/${safePath}`;
}

/**
 * Unwrap API response: if response has { data: T }, return data; otherwise return as-is.
 */
export function unwrapResponse<T>(responseData: unknown): T {
	if (responseData && typeof responseData === 'object' && 'data' in responseData) {
		return (responseData as Record<string, unknown>).data as T;
	}
	return responseData as T;
}

/**
 * Parse error message from response text — try JSON first, fall back to raw text.
 */
export function parseErrorMessage(text: string, fallback = 'Помилка сервера'): string {
	try {
		const errData = JSON.parse(text);
		return errData.error || errData.message || fallback;
	} catch {
		return text || fallback;
	}
}
