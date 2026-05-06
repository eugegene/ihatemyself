<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import { userStore } from '$lib/stores/user.svelte';

	let { children, data } = $props();

	$effect(() => {
		userStore.init(data.user);
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Diploma TrackList</title>
</svelte:head>

<div class="min-h-screen flex flex-col font-sans text-black">
	<Header />

	<main class="flex-1 w-full max-w-7xl mx-auto p-6">
		{@render children()}
	</main>

	<Footer />
</div>

<!-- {@render children()} -->
