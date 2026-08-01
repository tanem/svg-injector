import { defineConfig } from 'vite'

export default defineConfig({
  // The built examples are served from a shared static server under
  // <example>/dist/, so asset URLs have to be relative to the page.
  base: './',
})
