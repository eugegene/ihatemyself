import { describe, it, expect } from 'vitest';
import {
	RequiredStrategy,
	EmailStrategy,
	MinLengthStrategy,
	PasswordMatchStrategy,
	Validator,
} from './validation';

describe('RequiredStrategy', () => {
	it('returns null for non-empty string', () => {
		expect(RequiredStrategy.validate('hello')).toBeNull();
	});

	it('returns error for empty string', () => {
		expect(RequiredStrategy.validate('')).not.toBeNull();
	});

	it('returns error for whitespace-only string', () => {
		expect(RequiredStrategy.validate('   ')).not.toBeNull();
	});

	it('returns error for tab-only string', () => {
		expect(RequiredStrategy.validate('\t')).not.toBeNull();
	});
});

describe('EmailStrategy', () => {
	it('returns null for valid email', () => {
		expect(EmailStrategy.validate('user@example.com')).toBeNull();
	});

	it('returns error for missing @', () => {
		expect(EmailStrategy.validate('userexample.com')).toBe('Невірний формат email');
	});

	it('returns error for missing domain', () => {
		expect(EmailStrategy.validate('user@')).toBe('Невірний формат email');
	});

	it('returns error for missing TLD', () => {
		expect(EmailStrategy.validate('user@example')).toBe('Невірний формат email');
	});

	it('returns error for empty string', () => {
		expect(EmailStrategy.validate('')).toBe('Невірний формат email');
	});

	it('returns error for spaces in email', () => {
		expect(EmailStrategy.validate('user @example.com')).toBe('Невірний формат email');
	});
});

describe('MinLengthStrategy', () => {
	it('returns null when length equals minimum', () => {
		expect(MinLengthStrategy(6).validate('abcdef')).toBeNull();
	});

	it('returns null when length exceeds minimum', () => {
		expect(MinLengthStrategy(6).validate('abcdefg')).toBeNull();
	});

	it('returns error when length below minimum', () => {
		expect(MinLengthStrategy(6).validate('abcde')).toBe('Мінімальна довжина: 6 символів');
	});

	it('returns error for empty string with min 1', () => {
		expect(MinLengthStrategy(1).validate('')).toBe('Мінімальна довжина: 1 символів');
	});
});

describe('PasswordMatchStrategy', () => {
	it('returns null when passwords match', () => {
		expect(PasswordMatchStrategy.validate('pass123', 'pass123')).toBeNull();
	});

	it('returns error when passwords differ', () => {
		expect(PasswordMatchStrategy.validate('pass123', 'pass456')).toBe(
			'Паролі не співпадають',
		);
	});

	it('returns error when confirmValue is undefined', () => {
		expect(PasswordMatchStrategy.validate('pass123', undefined)).toBe(
			'Паролі не співпадають',
		);
	});
});

describe('Validator.validate', () => {
	it('returns null when all strategies pass', () => {
		const result = Validator.validate('test@example.com', [RequiredStrategy, EmailStrategy]);
		expect(result).toBeNull();
	});

	it('returns first failing strategy error', () => {
		const result = Validator.validate('', [RequiredStrategy, EmailStrategy]);
		// RequiredStrategy fails first — its error returned, not EmailStrategy's
		expect(result).not.toBe('Невірний формат email');
		expect(result).not.toBeNull();
	});

	it('returns null for empty strategies array', () => {
		expect(Validator.validate('anything', [])).toBeNull();
	});

	it('passes confirmValue to strategies', () => {
		const result = Validator.validate('pass123', [PasswordMatchStrategy], 'pass456');
		expect(result).toBe('Паролі не співпадають');
	});

	it('chains MinLength + PasswordMatch', () => {
		const result = Validator.validate(
			'ab',
			[MinLengthStrategy(6), PasswordMatchStrategy],
			'ab',
		);
		// MinLength fails first
		expect(result).toBe('Мінімальна довжина: 6 символів');
	});
});
