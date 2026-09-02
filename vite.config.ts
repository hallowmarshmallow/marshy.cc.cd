import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 3000, host: true },
  // Vitest: run in browser-like environment with the React JSX transform.
  test: {
    environment: 'jsdom',
    globals: false,
  },
})
