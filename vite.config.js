import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';

// Static SPA build — outputs to dist/, ready for Vercel/Netlify with zero config.
export default defineConfig({
  plugins: [svelte(), tailwindcss()],
});
