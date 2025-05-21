// svelte.config.js
import adapter from '@sveltejs/adapter-auto'; // or your specific adapter
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(), // This will pick up PostCSS config by default

  kit: {
    adapter: adapter(),
    // ... other kit config
  }
};

export default config;