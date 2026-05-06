<script>
	import { api } from '$lib/api';

	async function testRequest() {
		try {
			await api.get('test-protected-route');
		} catch (e) {
			console.log(e, 'Запит впав, але це нормально, нам треба глянути заголовки');
		}
	}
</script>

<button onclick={testRequest} class="bg-red-500 text-white/95 p-4 m-4"> ТЕСТ ІНТЕРЦЕПТОРА </button>
