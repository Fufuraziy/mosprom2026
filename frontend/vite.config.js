import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' — относительные пути: сборка работает на хостинге ВКонтакте (vk-miniapps-deploy),
// GitHub Pages, Netlify, S3 и из любой подпапки.
export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 5173,
    host: true,
    // разрешаем открывать dev-сервер через HTTPS-туннель (тест мини-приложения на телефоне)
    allowedHosts: ['.vk-apps.com', '.trycloudflare.com', '.ngrok-free.app', '.loca.lt'],
  },
})
