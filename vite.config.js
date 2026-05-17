import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  root: 'playground',
  plugins: [tailwindcss()],
  server: {
    fs: {
      allow: ['..'],
    },
  },
})
