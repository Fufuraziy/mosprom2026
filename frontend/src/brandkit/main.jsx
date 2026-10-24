// brandkit.html — Бренд-Кит отдельной страницей: печать листовок А4 и разделов в PDF из браузера.
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
import BrandKit from './BrandKit.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrandKit standalone />
  </React.StrictMode>,
)
