<script>
	import { resolve } from '$app/paths';
</script>

<footer class="bg-bkg-header text-text-muted py-8 mt-auto text-sm">
	<div
		class="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4"
	>
		<div class="text-center md:text-left">
			<span class="font-bold text-white/95 block mb-1">DIPLOMA</span>
			<p>© 2025 TrackList Project. Powered by .NET & SvelteKit.</p>
		</div>

		<div class="flex gap-6">
			<a href={resolve('/about')} class="hover:text-brand-accent transition-colors">About</a>
			<a href={resolve('/terms')} class="hover:text-brand-accent transition-colors">Terms</a>
			<a href={resolve('/privacy')} class="hover:text-brand-accent transition-colors"
				>Privacy</a
			>
			<a href={resolve('/contact')} class="hover:text-brand-accent transition-colors"
				>Contact</a
			>
		</div>
	</div>
</footer>
