import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  root: 'playground',
  base: './',
  plugins: [tailwindcss()],
  build: {
    outDir: '../docs',
  },
  server: {
    fs: {
      allow: ['..'],
    },
  },
})
