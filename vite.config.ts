import { defineConfig } from 'vite';

// Served from https://cjluc4s.github.io/nucleo-tower-defense/ on GitHub Pages, so every
// asset URL needs that path prefix. Runtime code must read it via import.meta.env.BASE_URL
// (see MenuScene.ts) — Vite only rewrites absolute paths inside index.html automatically.
export default defineConfig({
  base: '/nucleo-tower-defense/',
});
