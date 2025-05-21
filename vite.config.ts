// vite.config.ts
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    sveltekit()
  ],
  define: {
    'process.env.OPENROUTER_API_KEY': JSON.stringify(process.env.OPENROUTER_API_KEY)
  },
  ssr: {
    noExternal: ['lucide-svelte']
  }
});