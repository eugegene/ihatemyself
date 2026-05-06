import { describe, it, expect, beforeEach } from 'vitest';
import { userStore } from './user.svelte';
import type { UserState } from './user.svelte';

const testUser: UserState = {
	username: 'testuser',
	email: 'test@example.com',
	role: 'User',
};

const adminUser: UserState = {
	username: 'admin',
	email: 'admin@example.com',
	role: 'Admin',
	profilePicUrl: '/img/admin.jpg',
};

describe('userStore', () => {
	beforeEach(() => {
		userStore.set(null);
	});

	describe('init', () => {
		it('sets user data', () => {
			userStore.init(testUser);
			expect(userStore.value).toEqual(testUser);
		});

		it('sets null clears user', () => {
			userStore.init(testUser);
			userStore.init(null);
			expect(userStore.value).toBeNull();
		});
	});

	describe('set', () => {
		it('updates user value', () => {
			userStore.set(adminUser);
			expect(userStore.value).toEqual(adminUser);
		});

		it('overwrites previous user', () => {
			userStore.set(testUser);
			userStore.set(adminUser);
			expect(userStore.value).toEqual(adminUser);
		});

		it('clears user with null', () => {
			userStore.set(testUser);
			userStore.set(null);
			expect(userStore.value).toBeNull();
		});
	});

	describe('value', () => {
		it('returns null initially', () => {
			expect(userStore.value).toBeNull();
		});

		it('returns current user after set', () => {
			userStore.set(testUser);
			expect(userStore.value?.username).toBe('testuser');
			expect(userStore.value?.email).toBe('test@example.com');
			expect(userStore.value?.role).toBe('User');
		});

		it('includes optional profilePicUrl', () => {
			userStore.set(adminUser);
			expect(userStore.value?.profilePicUrl).toBe('/img/admin.jpg');
		});

		it('profilePicUrl undefined when not set', () => {
			userStore.set(testUser);
			expect(userStore.value?.profilePicUrl).toBeUndefined();
		});
	});
});
