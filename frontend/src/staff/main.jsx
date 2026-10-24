// Страница для сотрудников ОЧАКОВО и жюри (hr.html): Панель HR, симулятор ВК-бота и предпросмотр мини-приложения в рамке телефона.
// Это обычная веб-страница для компьютера, она не открывается внутри ВКонтакте.
import React from 'react'
import ReactDOM from 'react-dom/client'
import '@fontsource/montserrat/300.css'
import '@fontsource/montserrat/400.css'
import '@fontsource/montserrat/600.css'
import '@fontsource/montserrat/700.css'
import '@fontsource/montserrat/800.css'
import '@fontsource/jetbrains-mono/500.css'
import '@fontsource/jetbrains-mono/700.css'
import '../index.css'
import App from '../App.jsx'
import { GameProvider } from '../state/GameContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GameProvider>
      <App />
    </GameProvider>
  </React.StrictMode>,
)
