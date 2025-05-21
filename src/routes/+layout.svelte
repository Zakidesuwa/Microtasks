<script lang="ts">
 	import '../app.css';
 	import { onMount } from 'svelte';
	import FcmManager from '$lib/components/FcmManager.svelte'; // Import FcmManager
  
 	let { children } = $props();

 	onMount(() => {
 		const savedTheme = localStorage.getItem('theme');
 		const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
 		if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
 			document.body.classList.add('dark');
 		} else {
 			document.body.classList.remove('dark');
 		}
 	});
</script>

<FcmManager /> <!-- Add FcmManager component here -->
 
{@render children()}
