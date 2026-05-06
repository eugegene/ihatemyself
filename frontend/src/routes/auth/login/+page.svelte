<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { Validator, EmailStrategy } from '$lib/utils/validation';

	// Отримуємо дані, які повернув сервер
	let { form } = $props();

	let email = $state('');
	let password = $state('');
	let isLoading = $state(false);

	// Локальні помилки
	let clientErrors = $state({ email: '' });

	import type { SubmitFunction } from '@sveltejs/kit';

	// Функція для use:enhance
	const submitHandler: SubmitFunction = () => {
		isLoading = true;

		// Повертаємо функцію, яка виконається після відповіді сервера
		return async ({ update, result }) => {
			isLoading = false;

			if (result.type === 'success' && result.data?.success) {
				const redirectTo = page.url.searchParams.get('redirectTo') || '/profile';
				await goto(resolve(redirectTo), { invalidateAll: true });
			} else {
				// update() оновить форму і покаже повідомлення з form.message, якщо є помилка
				await update();
			}
		};
	};
</script>

<div class="flex items-center justify-center min-h-[80vh]">
	<div class="w-full max-w-md bg-bkg-header p-8 rounded-xl shadow-2xl border border-gray-800">
		<h1 class="text-3xl font-black text-white/95 mb-6 text-center tracking-wide">
			Вхід в <span class="text-brand-accent">Diploma</span>
		</h1>

		{#if form?.message}
			<div
				class="mb-4 p-3 rounded bg-red-500/10 border border-red-500/50 text-red-200 text-sm text-center"
			>
				{form.message}
			</div>
		{/if}

		<form
			method="POST"
			action="?/login"
			use:enhance={submitHandler}
			class="space-y-5"
			novalidate
		>
			<div>
				<label for="email" class="block text-sm font-medium text-text-muted mb-1"
					>Email</label
				>
				<input
					id="email"
					name="email"
					type="email"
					bind:value={email}
					oninput={() => (clientErrors.email = '')}
					onblur={() =>
						(clientErrors.email = Validator.validate(email, [EmailStrategy]) || '')}
					required
					placeholder="your@email.com"
					class="w-full bg-bkg-main text-white/95 px-4 py-3 rounded-lg border {clientErrors.email
						? 'border-red-500'
						: 'border-gray-700'} focus:border-brand-accent focus:ring-1 focus:ring-brand-accent outline-none transition-all placeholder-gray-600"
				/>
				{#if clientErrors.email}
					<p class="text-red-400 text-xs mt-1">{clientErrors.email}</p>
				{/if}
			</div>

			<div>
				<label for="password" class="block text-sm font-medium text-text-muted mb-1"
					>Пароль</label
				>
				<input
					id="password"
					name="password"
					type="password"
					bind:value={password}
					required
					placeholder="••••••••"
					class="w-full bg-bkg-main text-white/95 px-4 py-3 rounded-lg border border-gray-700 focus:border-brand-accent focus:ring-1 focus:ring-brand-accent outline-none transition-all placeholder-gray-600"
				/>
			</div>

			<button
				type="submit"
				disabled={isLoading}
				class="w-full bg-brand-accent hover:bg-brand-hover text-white/95 font-bold py-3 rounded-lg transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-accent/20"
			>
				{#if isLoading}
					<span
						class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"
					></span>
					Вхід...
				{:else}
					Увійти
				{/if}
			</button>
		</form>

		<div class="mt-6 text-center text-sm text-text-muted">
			Ще не маєте акаунту?
			<a
				href={resolve('/auth/register')}
				class="text-white/95 hover:text-brand-accent font-semibold transition-colors"
			>
				Зареєструватися
			</a>
		</div>
	</div>
</div>
