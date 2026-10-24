import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'

// @vkontakte/icons помечает модули директивой "use-client" — Vite на неё ругается; убираем (как в шаблоне create-vk-mini-app).
function stripUseClient() {
  return {
    name: 'strip-use-client',
    transform(code, id) {
      if (id.includes('@vkontakte/icons')) return { code: code.replace(/"use-client";?/g, ''), map: null }
      return null
    },
  }
}

// base: './' — относительные пути: сборка работает на хостинге ВКонтакте (vk-miniapps-deploy),
// GitHub Pages, Netlify, S3 и из любой подпапки.
export default defineConfig({
  plugins: [react(), stripUseClient()],
  base: './',
  build: {
    // index.html — VK Mini App, hr.html — страница сотрудников (Панель HR, симулятор бота)
    rollupOptions: { input: { main: resolve(__dirname, 'index.html'), hr: resolve(__dirname, 'hr.html') } },
    chunkSizeWarningLimit: 1200,
  },
  server: {
    port: 5173,
    host: true,
    // разрешаем открывать dev-сервер через HTTPS-туннель (тест мини-приложения на телефоне)
    allowedHosts: ['.vk-apps.com', '.trycloudflare.com', '.ngrok-free.app', '.loca.lt'],
  },
})
