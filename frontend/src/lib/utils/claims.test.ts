import { describe, it, expect } from 'vitest';
import { mapUserFromClaims } from './claims';

describe('mapUserFromClaims', () => {
	it('maps standard JWT claims', () => {
		const result = mapUserFromClaims({
			email: 'test@example.com',
			role: 'Admin',
			unique_name: 'testuser',
			sub: '123',
		});

		expect(result).toEqual({
			email: 'test@example.com',
			role: 'Admin',
			username: 'testuser',
			id: '123',
		});
	});

	it('maps Microsoft long-form claim URIs', () => {
		const result = mapUserFromClaims({
			'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress': 'ms@test.com',
			'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': 'Moderator',
			'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name': 'msuser',
			sub: '456',
		});

		expect(result).toEqual({
			email: 'ms@test.com',
			role: 'Moderator',
			username: 'msuser',
			id: '456',
		});
	});

	it('prefers standard claims over Microsoft URIs', () => {
		const result = mapUserFromClaims({
			email: 'standard@test.com',
			'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress': 'ms@test.com',
			role: 'Admin',
			'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': 'User',
			unique_name: 'stduser',
			'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name': 'msuser',
			sub: '789',
		});

		expect(result.email).toBe('standard@test.com');
		expect(result.role).toBe('Admin');
		expect(result.username).toBe('stduser');
	});

	it('defaults role to "User" when missing', () => {
		const result = mapUserFromClaims({ sub: '1' });
		expect(result.role).toBe('User');
	});

	it('defaults username to "User" when missing', () => {
		const result = mapUserFromClaims({ sub: '1' });
		expect(result.username).toBe('User');
	});

	it('returns undefined email when missing', () => {
		const result = mapUserFromClaims({ sub: '1' });
		expect(result.email).toBeUndefined();
	});

	it('returns undefined id when sub missing', () => {
		const result = mapUserFromClaims({});
		expect(result.id).toBeUndefined();
	});

	it('uses nameid as username fallback', () => {
		const result = mapUserFromClaims({ nameid: 'byNameId', sub: '1' });
		expect(result.username).toBe('byNameId');
	});

	it('uses name as username fallback after nameid', () => {
		const result = mapUserFromClaims({ name: 'byName', sub: '1' });
		expect(result.username).toBe('byName');
	});

	it('prefers unique_name over nameid over name', () => {
		const result = mapUserFromClaims({
			unique_name: 'first',
			nameid: 'second',
			name: 'third',
			sub: '1',
		});
		expect(result.username).toBe('first');
	});
});
