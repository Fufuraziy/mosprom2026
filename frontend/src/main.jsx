// VK Mini App «ОЧАКОВО: Секретный код 1978» — точка входа (index.html).
// Страница для сотрудников (Панель HR и симулятор ВК-бота) — отдельная: hr.html → src/staff/main.jsx.
import React from 'react'
import ReactDOM from 'react-dom/client'
import '@fontsource/montserrat/200.css'
import '@fontsource/montserrat/300.css'
import '@fontsource/montserrat/400.css'
import '@fontsource/montserrat/500.css'
import '@fontsource/montserrat/600.css'
import '@fontsource/montserrat/700.css'
import '@fontsource/montserrat/800.css'
import '@fontsource/jetbrains-mono/500.css'
import '@fontsource/jetbrains-mono/700.css'
import '@vkontakte/vkui/dist/vkui.css'
import './index.css'
import './brand-tokens.css'
import AppConfig from './miniapp/AppConfig.jsx'
import { GameProvider } from './state/GameContext.jsx'
import { initVK } from './services/vk.js'
import { FrameCapsule } from './components/PhoneFrame.jsx'

initVK() // VKWebAppInit до рендера (правило ВК 2.2.1); вне ВК — ничего не делает

const VK_FRAME = new URLSearchParams(window.location.search).has('vk_frame')

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GameProvider>
      <AppConfig />
      {VK_FRAME && <FrameCapsule />}
    </GameProvider>
  </React.StrictMode>,
)

if (import.meta.env.DEV && new URLSearchParams(window.location.search).has('eruda')) {
  // консоль разработчика на телефоне: открыть мини-приложение с ?eruda
  import('eruda').then((m) => m.default.init())
}
