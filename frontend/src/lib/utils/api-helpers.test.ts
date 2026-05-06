import { describe, it, expect } from 'vitest';
import { buildApiUrl, unwrapResponse, parseErrorMessage } from './api-helpers';

describe('buildApiUrl', () => {
	it('joins base without trailing slash + path without leading slash', () => {
		expect(buildApiUrl('http://localhost:80/api', 'users')).toBe(
			'http://localhost:80/api/users',
		);
	});

	it('handles base with trailing slash', () => {
		expect(buildApiUrl('http://localhost:80/api/', 'users')).toBe(
			'http://localhost:80/api/users',
		);
	});

	it('handles path with leading slash', () => {
		expect(buildApiUrl('http://localhost:80/api', '/users')).toBe(
			'http://localhost:80/api/users',
		);
	});

	it('handles both trailing and leading slashes', () => {
		expect(buildApiUrl('http://localhost:80/api/', '/users')).toBe(
			'http://localhost:80/api/users',
		);
	});

	it('handles empty path', () => {
		expect(buildApiUrl('http://localhost:80/api', '')).toBe('http://localhost:80/api/');
	});

	it('handles nested path', () => {
		expect(buildApiUrl('http://localhost:80/api', 'auth/login')).toBe(
			'http://localhost:80/api/auth/login',
		);
	});
});

describe('unwrapResponse', () => {
	it('unwraps { data: T } response', () => {
		expect(unwrapResponse({ data: { id: 1, name: 'test' } })).toEqual({
			id: 1,
			name: 'test',
		});
	});

	it('returns raw response when no data wrapper', () => {
		expect(unwrapResponse({ id: 1, name: 'test' })).toEqual({ id: 1, name: 'test' });
	});

	it('returns null as-is', () => {
		expect(unwrapResponse(null)).toBeNull();
	});

	it('returns string as-is', () => {
		expect(unwrapResponse('hello')).toBe('hello');
	});

	it('returns array as-is (no data key)', () => {
		expect(unwrapResponse([1, 2, 3])).toEqual([1, 2, 3]);
	});

	it('unwraps even when data is null', () => {
		expect(unwrapResponse({ data: null })).toBeNull();
	});

	it('unwraps when data is a primitive', () => {
		expect(unwrapResponse({ data: 42 })).toBe(42);
	});
});

describe('parseErrorMessage', () => {
	it('extracts error from JSON with error field', () => {
		expect(parseErrorMessage('{"error": "Not found"}')).toBe('Not found');
	});

	it('extracts message from JSON with message field', () => {
		expect(parseErrorMessage('{"message": "Bad request"}')).toBe('Bad request');
	});

	it('prefers error over message', () => {
		expect(parseErrorMessage('{"error": "E", "message": "M"}')).toBe('E');
	});

	it('returns fallback when JSON has neither error nor message', () => {
		expect(parseErrorMessage('{"status": 500}')).toBe('Помилка сервера');
	});

	it('returns raw text for non-JSON', () => {
		expect(parseErrorMessage('Internal Server Error')).toBe('Internal Server Error');
	});

	it('returns fallback for empty string', () => {
		expect(parseErrorMessage('')).toBe('Помилка сервера');
	});

	it('uses custom fallback', () => {
		expect(parseErrorMessage('', 'Custom error')).toBe('Custom error');
	});

	it('returns fallback for JSON with empty error string', () => {
		expect(parseErrorMessage('{"error": ""}')).toBe('Помилка сервера');
	});
});
