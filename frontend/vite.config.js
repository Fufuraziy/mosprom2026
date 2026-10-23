import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' — чтобы сборку можно было открыть с любого статического хостинга
// (GitHub Pages, Netlify, S3) и даже из подпапки.
export default defineConfig({
  plugins: [react()],
  base: './',
  server: { port: 5173, host: true },
})
