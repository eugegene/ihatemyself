<script lang="ts">
	import { resolve } from '$app/paths';
	import { enhance } from '$app/forms';
	import { userStore } from '$lib/stores/user.svelte';

	import type { SubmitFunction } from '@sveltejs/kit';

	const handleLogout: SubmitFunction = () => {
		return async ({ update }) => {
			userStore.set(null);
			await update();
		};
	};
</script>

<header
	class="w-full bg-bkg-header text-text-main py-3 px-6 shadow-md flex items-center justify-between sticky top-0 z-50"
>
	<div class="flex items-center gap-8">
		<a
			href={resolve('/')}
			class="text-2xl font-black tracking-wide hover:text-brand-accent transition-colors uppercase"
		>
			Diploma
		</a>

		<div class="relative hidden md:block group/search">
			<div class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
				<svg
					class="w-4 h-4 text-text-muted group-focus-within/search:text-brand-accent transition-colors"
					aria-hidden="true"
					xmlns="http://www.w3.org/2000/svg"
					fill="none"
					viewBox="0 0 20 20"
				>
					<path
						stroke="currentColor"
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"
					/>
				</svg>
			</div>
			<input
				type="search"
				placeholder="Пошук..."
				class="bg-bkg-main text-sm text-white/95 pl-10 pr-4 py-2 rounded-full w-64 border border-transparent focus:border-brand-accent focus:outline-none focus:ring-1 focus:ring-brand-accent transition-all placeholder-text-muted"
			/>
		</div>
	</div>

	<nav class="flex items-center gap-6 font-medium text-sm">
		<a
			href={resolve('/catalog')}
			class="text-text-muted hover:text-white/95 transition-colors text-base"
		>
			Каталог
		</a>

		<div class="h-6 w-px bg-gray-700 hidden sm:block"></div>

		{#if userStore.value}
			<div class="relative group">
				<a
					href={resolve('/profile')}
					class="flex items-center gap-3 py-1 px-2 rounded hover:bg-white/10 transition-colors"
				>
					<div class="text-right hidden sm:block">
						<span
							class="block text-white/95 text-sm font-semibold group-hover:text-brand-accent transition-colors"
							>{userStore.value.username}</span
						>
					</div>
					<div
						class="w-9 h-9 rounded-full bg-gray-600 overflow-hidden border-2 border-transparent group-hover:border-brand-accent transition-all"
					>
						<img
							src="https://ui-avatars.com/api/?name=User&background=random&color=fff"
							alt="Avatar"
							class="w-full h-full object-cover"
						/>
					</div>
				</a>

				<div
					class="absolute right-0 top-full pt-2 w-48 invisible opacity-0 group-hover:visible group-hover:opacity-100 transition-all duration-200 ease-in-out transform origin-top-right"
				>
					<div
						class="bg-bkg-header border border-gray-700 rounded-lg shadow-xl overflow-hidden text-sm"
					>
						<div class="py-1">
							<a
								href={resolve('/profile')}
								class="block px-4 py-2 text-gray-300 hover:bg-white/10 hover:text-white/95 transition-colors"
								>Профіль</a
							>
							<a
								href={resolve('/settings')}
								class="block px-4 py-2 text-gray-300 hover:bg-white/10 hover:text-white/95 transition-colors"
								>Налаштування</a
							>
						</div>

						<div class="border-t border-gray-700"></div>

						<div class="py-1">
							<a
								href={resolve('/lists')}
								class="block px-4 py-2 text-gray-300 hover:bg-white/10 hover:text-white/95 transition-colors"
								>Списки</a
							>
							<a
								href={resolve('/collections')}
								class="block px-4 py-2 text-gray-300 hover:bg-white/10 hover:text-white/95 transition-colors"
								>Добірки</a
							>
							<a
								href={resolve('/reviews')}
								class="block px-4 py-2 text-gray-300 hover:bg-white/10 hover:text-white/95 transition-colors"
								>Рецензії</a
							>
							<a
								href={resolve('/following')}
								class="block px-4 py-2 text-gray-300 hover:bg-white/10 hover:text-white/95 transition-colors"
								>Підписки</a
							>
						</div>

						<div class="border-t border-gray-700"></div>

						<div class="py-1">
							<form method="POST" action="/auth/logout" use:enhance={handleLogout}>
								<button
									type="submit"
									class="w-full text-left px-4 py-2 text-red-400 hover:bg-white/10 hover:text-red-300 transition-colors cursor-pointer"
								>
									Вихід
								</button>
							</form>
						</div>
					</div>
				</div>
			</div>
		{:else}
			<div class="flex items-center gap-4">
				<a
					href={resolve('/auth/login')}
					class="text-white/95 hover:text-brand-accent transition-colors"
				>
					Вхід
				</a>
				<a
					href={resolve('/auth/register')}
					class="bg-brand-accent hover:bg-brand-hover text-white/95 px-5 py-2 rounded-full font-bold transition-transform hover:scale-105 shadow-lg shadow-brand-accent/20"
				>
					Реєстрація
				</a>
			</div>
		{/if}
	</nav>
</header>
