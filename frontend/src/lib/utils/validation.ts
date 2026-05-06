interface ValidationStrategy {
	validate(value: string, confirmValue?: string): string | null;
}

export const RequiredStrategy: ValidationStrategy = {
	validate: (value) => (value.trim() ? null : 'Це поле обов’язкове'),
};

export const EmailStrategy: ValidationStrategy = {
	validate: (value) => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(value) ? null : 'Невірний формат email';
	},
};

export const MinLengthStrategy = (min: number): ValidationStrategy => ({
	validate: (value) => (value.length >= min ? null : `Мінімальна довжина: ${min} символів`),
});

export const PasswordMatchStrategy: ValidationStrategy = {
	validate: (value, confirmValue) => (value === confirmValue ? null : 'Паролі не співпадають'),
};

export class Validator {
	static validate(
		value: string,
		strategies: ValidationStrategy[],
		confirmValue?: string,
	): string | null {
		for (const strategy of strategies) {
			const error = strategy.validate(value, confirmValue);
			if (error) return error;
		}
		return null;
	}
}
