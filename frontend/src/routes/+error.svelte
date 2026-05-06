<script lang="ts">
	import { page } from '$app/stores';
	import { resolve } from '$app/paths';
</script>

<div class="error-container">
	<h1>Упс! Сталася помилка {$page.status}</h1>

	<p>{$page.error?.message || 'Щось пішло не так.'}</p>
	<a href={resolve('/')}>Повернутися на головну</a>
</div>

<style>
	.error-container {
		text-align: center;
		padding: 50px;
		font-family: sans-serif;
	}
	h1 {
		color: #d32f2f;
	}
</style>
