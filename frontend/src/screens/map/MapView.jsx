import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MapPin,
  Building2,
  Coins,
  CheckCircle,
  ArrowRight,
  ExternalLink,
  ChevronRight,
  X,
  Compass,
  Layers,
  Sparkles,
  Info,
  Clock,
  Briefcase,
  Wrench,
  Package,
  GraduationCap,
  Home,
  ShieldCheck,
  AlertCircle,
  RotateCcw
} from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useGame } from '../../state/GameContext.jsx'
import {
  RUSSIA_LOCATIONS,
  MOSCOW_WORKSHOPS,
  RUSSIA_CENTER,
  RUSSIA_ZOOM,
  MOSCOW_CAMPUS_CENTER,
  MOSCOW_CAMPUS_ZOOM
} from '../../data/mapData.js'

// Фикс иконок по умолчанию в Leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

export default function MapView({ onNavigateToApply }) {
  const { state, actions, toast } = useGame()
  const [mode, setMode] = useState('moscow') // 'russia' | 'moscow'
  const [viewType, setViewType] = useState('map') // 'map' | 'scheme'
  const [selectedItem, setSelectedItem] = useState(null)
  const [activePhoto, setActivePhoto] = useState(0)
  const [mapReady, setMapReady] = useState(false)
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])

  // Проверка, какие локации уже изучены
  const viewedLocations = state.telemetry?.viewed_map_locations || []
  const selectedWorkshopName = state.telemetry?.selected_map_workshop || null

  // Инициализация карты Leaflet с надежными зеркалами OpenStreetMap
  useEffect(() => {
    if (!mapContainerRef.current) return

    let map = mapInstanceRef.current
    if (!map) {
      try {
        const initialCenter = mode === 'moscow' ? MOSCOW_CAMPUS_CENTER : RUSSIA_CENTER
        const initialZoom = mode === 'moscow' ? MOSCOW_CAMPUS_ZOOM : RUSSIA_ZOOM

        map = L.map(mapContainerRef.current, {
          center: initialCenter,
          zoom: initialZoom,
          zoomControl: true,
          attributionControl: false,
        })

        // Список надежных зеркал OpenStreetMap (без API-ключей и блокировок)
        const tileSources = [
          'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
          'https://tile.openstreetmap.de/{z}/{x}/{y}.png',
          'https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
        ]
        let currentSourceIdx = 0

        const tileLayer = L.tileLayer(tileSources[0], {
          maxZoom: 19,
          subdomains: ['a', 'b', 'c'],
          attribution: '&copy; OpenStreetMap contributors',
          crossOrigin: true,
        })

        tileLayer.on('tileerror', () => {
          // При ошибке переключаемся на следующее надежное зеркало без скрытия карты
          currentSourceIdx = (currentSourceIdx + 1) % tileSources.length
          tileLayer.setUrl(tileSources[currentSourceIdx])
        })

        tileLayer.addTo(map)
        mapInstanceRef.current = map
        setMapReady(true)
      } catch (e) {
        console.warn('Leaflet map init warning:', e)
      }
    }

    const invalidate = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize()
      }
    }

    const t1 = setTimeout(invalidate, 50)
    const t2 = setTimeout(invalidate, 250)
    const t3 = setTimeout(invalidate, 600)

    let resizeObserver = null
    if (typeof ResizeObserver !== 'undefined' && mapContainerRef.current) {
      resizeObserver = new ResizeObserver(() => invalidate())
      resizeObserver.observe(mapContainerRef.current)
    }

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
      if (resizeObserver) resizeObserver.disconnect()
    }
  }, [])

  // Автоматический пересчет размеров Leaflet при смене режима или вкладки
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize()
      }
    }, 100)
    return () => clearTimeout(timer)
  }, [mode, viewType, mapReady])

  // Обновление маркеров при переключении режима (РФ / Москва)
  useEffect(() => {
    const map = mapInstanceRef.current
    if (!map) return

    // Удаляем старые маркеры
    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []

    const items = mode === 'moscow' ? MOSCOW_WORKSHOPS : RUSSIA_LOCATIONS
    const targetCenter = mode === 'moscow' ? MOSCOW_CAMPUS_CENTER : RUSSIA_CENTER
    const targetZoom = mode === 'moscow' ? MOSCOW_CAMPUS_ZOOM : RUSSIA_ZOOM

    map.flyTo(targetCenter, targetZoom, { duration: 1.0 })

    items.forEach((item) => {
      const isSelected = selectedItem?.id === item.id
      const isWorkshop = mode === 'moscow'
      const isViewed = viewedLocations.includes(item.name || item.id)

      // Кастомный HTML-маркер в цветах брендбука «Очаково»
      const iconHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group">
          ${
            isSelected
              ? '<span class="absolute -inset-2 rounded-full bg-brand/30 animate-ping"></span>'
              : ''
          }
          <div class="flex items-center justify-center w-9 h-9 rounded-full shadow-lg border-2 ${
            isSelected
              ? 'bg-brand border-white text-white scale-110 ring-4 ring-brand/40'
              : isViewed
              ? 'bg-graphite border-brand text-white'
              : 'bg-white border-brand text-brand hover:bg-brand hover:text-white'
          } transition-all duration-200">
            ${
              isWorkshop
                ? '<svg class="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 3L2 12h3v8h14v-8h3L12 3zm0 3.5l6 5.5v7H6v-7l6-5.5z"/></svg>'
                : '<svg class="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>'
            }
          </div>
          <div class="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center pointer-events-none z-50">
            <div class="bg-graphite text-white text-[11px] font-bold px-2 py-1 rounded shadow-md whitespace-nowrap">
              ${item.name || item.city}
            </div>
            <div class="w-2 h-2 bg-graphite rotate-45 -mt-1"></div>
          </div>
        </div>
      `

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'custom-ochakovo-marker',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      })

      const marker = L.marker(item.coords, { icon: customIcon }).addTo(map)

      marker.on('click', () => {
        handleSelectItem(item)
      })

      markersRef.current.push(marker)
    })
  }, [mode, selectedItem, viewedLocations, mapReady])

  // Обработка выбора точки
  const handleSelectItem = (item) => {
    setSelectedItem(item)
    setActivePhoto(0)

    // Если это цех Москвы и он ещё не был изучен — начисляем +15 баллов
    if (item.targetVacancy && actions.viewMapLocation) {
      actions.viewMapLocation(item)
    }

    if (mapInstanceRef.current && item.coords && viewType === 'map') {
      mapInstanceRef.current.panTo(item.coords, { animate: true, duration: 0.8 })
    }
  }

  // Переключение масштаба на Москву
  const handleFocusMoscow = () => {
    setMode('moscow')
    setSelectedItem(null)
  }

  // Выбор цеха для практики / стажировки
  const handleSelectWorkshop = (workshop) => {
    if (actions.selectMapWorkshop) {
      actions.selectMapWorkshop(workshop)
    }
    toast(`Выбран цех: ${workshop.name}! Вакансия записана в анкету.`, 'points')
  }

  return (
    <div className="relative w-full h-[calc(100vh-125px)] sm:h-[calc(100vh-140px)] flex flex-col overflow-hidden bg-stone-100">
      {/* Верхняя панель управления: выбор локации + переключатель Карта/Схема */}
      <div className="absolute top-3 left-3 right-3 z-[400] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2 pointer-events-none">
        {/* Режим 1 / Режим 2 (Москва / Россия) */}
        <div className="flex p-1 bg-white/95 backdrop-blur-md rounded-xl shadow-md border border-line pointer-events-auto">
          <button
            type="button"
            onClick={() => {
              setMode('moscow')
              setSelectedItem(null)
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition ${
              mode === 'moscow'
                ? 'bg-brand text-white shadow-sm'
                : 'text-ink-soft hover:text-ink hover:bg-paper'
            }`}
          >
            <Building2 className="w-4 h-4 shrink-0" />
            <span className="truncate">🏭 Кампус Москва (Рябиновая, 44)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('russia')
              setSelectedItem(null)
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition ${
              mode === 'russia'
                ? 'bg-brand text-white shadow-sm'
                : 'text-ink-soft hover:text-ink hover:bg-paper'
            }`}
          >
            <Compass className="w-4 h-4 shrink-0" />
            <span className="truncate">🌍 География в РФ (10 заводов)</span>
          </button>
        </div>

        {/* Правая секция: переключатель режима отображения и счётчик баллов */}
        <div className="flex items-center gap-2 pointer-events-auto self-start md:self-auto">
          {/* Переключатель Карта OSM / Векторная Схема */}
          <div className="flex p-1 bg-white/95 backdrop-blur-md rounded-xl shadow-md border border-line">
            <button
              type="button"
              onClick={() => setViewType('map')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                viewType === 'map'
                  ? 'bg-graphite text-white shadow-sm'
                  : 'text-ink-soft hover:text-ink hover:bg-paper'
              }`}
              title="Реальная карта улиц OpenStreetMap (без API-ключей)"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Карта OSM</span>
            </button>
            <button
              type="button"
              onClick={() => setViewType('scheme')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                viewType === 'scheme'
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-ink-soft hover:text-ink hover:bg-paper'
              }`}
              title="Интерактивная архитектурная план-схема предприятия"
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Схема</span>
            </button>
          </div>

          {/* Счётчик изученных цехов */}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-graphite/95 backdrop-blur-md text-white rounded-xl shadow-md text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-malt-light shrink-0" />
            <span>
              {viewedLocations.length}/{MOSCOW_WORKSHOPS.length} цехов (+15 б.)
            </span>
          </div>
        </div>
      </div>

      {/* Основной контейнер карты */}
      <div className="relative flex-1 w-full h-full">
        {/* Реальная карта Leaflet (OpenStreetMap) */}
        <div
          ref={mapContainerRef}
          className={`w-full h-full z-0 transition-opacity duration-300 ${
            viewType === 'map' ? 'opacity-100' : 'opacity-0 pointer-events-none absolute inset-0'
          }`}
        />

        {/* Интерактивная архитектурная векторная схема (когда viewType === 'scheme') */}
        {viewType === 'scheme' && (
          <div className="w-full h-full flex flex-col p-4 pt-16 sm:pt-16 pb-20 overflow-y-auto bg-gradient-to-b from-stone-100 via-stone-50 to-stone-200">
            {mode === 'moscow' ? (
              /* Схема кампуса Москвы: Рябиновая, 44 */
              <div className="max-w-4xl mx-auto w-full space-y-4">
                <div className="bg-white/90 backdrop-blur p-4 rounded-2xl border border-line shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-ink flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-brand" />
                      <span>Генеральный план кампуса «Очаково» (ул. Рябиновая, 44)</span>
                    </h3>
                    <p className="text-xs text-ink-soft mt-0.5">
                      Кликните на любой цех или объект для изучения оборудования, условий и уровня зарплаты.
                    </p>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-malt-light/40 text-graphite border border-line self-start sm:self-auto">
                    Площадь комбината: 15 га
                  </span>
                </div>

                {/* Интерактивная SVG-схема территории */}
                <div className="bg-white p-3 sm:p-5 rounded-2xl border-2 border-line shadow-md relative overflow-hidden">
                  <div className="absolute top-3 right-3 text-[10px] font-bold text-ink-soft bg-paper px-2 py-1 rounded border border-line">
                    м. Озёрная · авт. 275, 610
                  </div>

                  <svg
                    viewBox="0 0 800 460"
                    className="w-full h-auto max-h-[380px] drop-shadow-sm select-none"
                  >
                    {/* Фон территории завода */}
                    <rect x="20" y="20" width="760" height="420" rx="16" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
                    
                    {/* Улица Рябиновая вдоль территории */}
                    <rect x="20" y="20" width="760" height="34" fill="#334155" />
                    <text x="360" y="42" fill="#ffffff" fontSize="12" fontWeight="bold" letterSpacing="1">
                      УЛИЦА РЯБИНОВАЯ (ГЛАВНЫЙ ВЪЕЗД И КПП)
                    </text>
                    <line x1="20" y1="37" x2="780" y2="37" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="8 6" />

                    {/* Газоны и благоустройство */}
                    <rect x="35" y="70" width="730" height="30" rx="6" fill="#ecfdf5" stroke="#a7f3d0" strokeWidth="1" />
                    <text x="50" y="89" fill="#047857" fontSize="10" fontWeight="bold">
                      🌳 Озеленение и аллея ветеранов Олимпиады-80
                    </text>

                    {/* Цех 1: Центральная Лаборатория и R&D */}
                    <g
                      onClick={() => handleSelectItem(MOSCOW_WORKSHOPS.find((w) => w.id === 'lab'))}
                      className="cursor-pointer group"
                    >
                      <rect
                        x="45"
                        y="120"
                        width="215"
                        height="100"
                        rx="10"
                        fill={selectedItem?.id === 'lab' ? '#991b1b' : '#ffffff'}
                        stroke="#b91c1c"
                        strokeWidth={selectedItem?.id === 'lab' ? '3' : '2'}
                        className="transition-all duration-200 group-hover:filter group-hover:brightness-95"
                      />
                      <rect x="45" y="120" width="215" height="24" rx="8" fill="#fee2e2" />
                      <text x="55" y="136" fill="#991b1b" fontSize="10" fontWeight="bold">
                        🔬 R&D ЛАБОРАТОРИЯ
                      </text>
                      <text x="55" y="162" fill={selectedItem?.id === 'lab' ? '#ffffff' : '#0f172a'} fontSize="11" fontWeight="bold">
                        Контроль качества & Вкусы
                      </text>
                      <text x="55" y="180" fill={selectedItem?.id === 'lab' ? '#fecaca' : '#64748b'} fontSize="9.5">
                        Рефрактометры ATAGO RX-7000i
                      </text>
                      <rect x="55" y="194" width="95" height="18" rx="4" fill="#b91c1c" />
                      <text x="63" y="206" fill="#ffffff" fontSize="9" fontWeight="bold">
                        от 60 000 ₽ / мес
                      </text>
                    </g>

                    {/* Цех 2: Технологический цех (Варка, CO2, ЛЭП) */}
                    <g
                      onClick={() => handleSelectItem(MOSCOW_WORKSHOPS.find((w) => w.id === 'tech'))}
                      className="cursor-pointer group"
                    >
                      <rect
                        x="280"
                        y="120"
                        width="240"
                        height="130"
                        rx="10"
                        fill={selectedItem?.id === 'tech' ? '#991b1b' : '#ffffff'}
                        stroke="#d97706"
                        strokeWidth={selectedItem?.id === 'tech' ? '3' : '2'}
                        className="transition-all duration-200 group-hover:filter group-hover:brightness-95"
                      />
                      <rect x="280" y="120" width="240" height="24" rx="8" fill="#fef3c7" />
                      <text x="290" y="136" fill="#b45309" fontSize="10" fontWeight="bold">
                        🍺 ТЕХНОЛОГИЧЕСКИЙ ЦЕХ
                      </text>
                      <text x="290" y="162" fill={selectedItem?.id === 'tech' ? '#ffffff' : '#0f172a'} fontSize="11" fontWeight="bold">
                        Варка кваса и станция CO₂
                      </text>
                      <text x="290" y="180" fill={selectedItem?.id === 'tech' ? '#fef08a' : '#64748b'} fontSize="9.5">
                        Чан ЛЭП №1 · Schenk · МЭА-контур
                      </text>
                      <rect x="290" y="204" width="95" height="18" rx="4" fill="#d97706" />
                      <text x="298" y="216" fill="#ffffff" fontSize="9" fontWeight="bold">
                        от 70 000 ₽ / мес
                      </text>
                    </g>

                    {/* Цех 3: Цех розлива и упаковки */}
                    <g
                      onClick={() => handleSelectItem(MOSCOW_WORKSHOPS.find((w) => w.id === 'bottling'))}
                      className="cursor-pointer group"
                    >
                      <rect
                        x="540"
                        y="120"
                        width="225"
                        height="150"
                        rx="10"
                        fill={selectedItem?.id === 'bottling' ? '#991b1b' : '#ffffff'}
                        stroke="#b91c1c"
                        strokeWidth={selectedItem?.id === 'bottling' ? '3' : '2'}
                        className="transition-all duration-200 group-hover:filter group-hover:brightness-95"
                      />
                      <rect x="540" y="120" width="225" height="24" rx="8" fill="#fee2e2" />
                      <text x="550" y="136" fill="#991b1b" fontSize="10" fontWeight="bold">
                        🥫 ЦЕХ РОЗЛИВА И УПАКОВКИ
                      </text>
                      <text x="550" y="162" fill={selectedItem?.id === 'bottling' ? '#ffffff' : '#0f172a'} fontSize="11" fontWeight="bold">
                        Скоростные линии SMI SK 500 P
                      </text>
                      <text x="550" y="180" fill={selectedItem?.id === 'bottling' ? '#fecaca' : '#64748b'} fontSize="9.5">
                        Банки, ПЭТ, термоусадка и паллетайзеры
                      </text>
                      <rect x="550" y="222" width="95" height="18" rx="4" fill="#b91c1c" />
                      <text x="558" y="234" fill="#ffffff" fontSize="9" fontWeight="bold">
                        от 70 000 ₽ / мес
                      </text>
                    </g>

                    {/* Цех 4: Офис ИТ, Учебный центр и Музей */}
                    <g
                      onClick={() => handleSelectItem(MOSCOW_WORKSHOPS.find((w) => w.id === 'office'))}
                      className="cursor-pointer group"
                    >
                      <rect
                        x="45"
                        y="245"
                        width="215"
                        height="105"
                        rx="10"
                        fill={selectedItem?.id === 'office' ? '#991b1b' : '#ffffff'}
                        stroke="#6366f1"
                        strokeWidth={selectedItem?.id === 'office' ? '3' : '2'}
                        className="transition-all duration-200 group-hover:filter group-hover:brightness-95"
                      />
                      <rect x="45" y="245" width="215" height="24" rx="8" fill="#e0e7ff" />
                      <text x="55" y="261" fill="#4338ca" fontSize="10" fontWeight="bold">
                        🏛️ МУЗЕЙ, ИТ И КАБ. 525
                      </text>
                      <text x="55" y="287" fill={selectedItem?.id === 'office' ? '#ffffff' : '#0f172a'} fontSize="11" fontWeight="bold">
                        Учебный центр и Дизайн
                      </text>
                      <text x="55" y="305" fill={selectedItem?.id === 'office' ? '#e0e7ff' : '#64748b'} fontSize="9.5">
                        Mirapolis, сдача сессий на заводе
                      </text>
                      <rect x="55" y="320" width="130" height="18" rx="4" fill="#4f46e5" />
                      <text x="63" y="332" fill="#ffffff" fontSize="9" fontWeight="bold">
                        Оплачиваемые стажировки
                      </text>
                    </g>

                    {/* Цех 5: Логистический склад */}
                    <g
                      onClick={() => handleSelectItem(MOSCOW_WORKSHOPS.find((w) => w.id === 'warehouse'))}
                      className="cursor-pointer group"
                    >
                      <rect
                        x="280"
                        y="275"
                        width="240"
                        height="100"
                        rx="10"
                        fill={selectedItem?.id === 'warehouse' ? '#991b1b' : '#ffffff'}
                        stroke="#475569"
                        strokeWidth={selectedItem?.id === 'warehouse' ? '3' : '2'}
                        className="transition-all duration-200 group-hover:filter group-hover:brightness-95"
                      />
                      <rect x="280" y="275" width="240" height="24" rx="8" fill="#f1f5f9" />
                      <text x="290" y="291" fill="#334155" fontSize="10" fontWeight="bold">
                        📦 СКЛАДСКОЙ КОМПЛЕКС
                      </text>
                      <text x="290" y="317" fill={selectedItem?.id === 'warehouse' ? '#ffffff' : '#0f172a'} fontSize="11" fontWeight="bold">
                        WMS · Экспорт в 60 регионов
                      </text>
                      <text x="290" y="335" fill={selectedItem?.id === 'warehouse' ? '#e2e8f0' : '#64748b'} fontSize="9.5">
                        Электропогрузчики и автоэстакада
                      </text>
                      <rect x="290" y="347" width="95" height="18" rx="4" fill="#334155" />
                      <text x="298" y="359" fill="#ffffff" fontSize="9" fontWeight="bold">
                        от 60 000 ₽ / мес
                      </text>
                    </g>

                    {/* Объект 6: Общежитие комбината */}
                    <g
                      onClick={() => handleSelectItem(MOSCOW_WORKSHOPS.find((w) => w.id === 'dorm'))}
                      className="cursor-pointer group"
                    >
                      <rect
                        x="540"
                        y="290"
                        width="225"
                        height="85"
                        rx="10"
                        fill={selectedItem?.id === 'dorm' ? '#991b1b' : '#ffffff'}
                        stroke="#059669"
                        strokeWidth={selectedItem?.id === 'dorm' ? '3' : '2'}
                        className="transition-all duration-200 group-hover:filter group-hover:brightness-95"
                      />
                      <rect x="540" y="290" width="225" height="24" rx="8" fill="#d1fae5" />
                      <text x="550" y="306" fill="#047857" fontSize="10" fontWeight="bold">
                        🏠 ОБЩЕЖИТИЕ (РЯБИНОВАЯ, 36К2)
                      </text>
                      <text x="550" y="332" fill={selectedItem?.id === 'dorm' ? '#ffffff' : '#0f172a'} fontSize="11" fontWeight="bold">
                        Столовая -50% & Комнаты
                      </text>
                      <rect x="550" y="347" width="105" height="18" rx="4" fill="#059669" />
                      <text x="558" y="359" fill="#ffffff" fontSize="9" fontWeight="bold">
                        3 400 ₽ / мес (50% скидка)
                      </text>
                    </g>

                    {/* Дорожки и логистика внутри завода */}
                    <path
                      d="M260 170 H280 M520 180 H540 M150 220 V245 M400 250 V275 M650 270 V290"
                      stroke="#94a3b8"
                      strokeWidth="3"
                      strokeDasharray="4 4"
                      fill="none"
                    />
                  </svg>
                </div>

                {/* Быстрые карточки для мгновенного выбора */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {MOSCOW_WORKSHOPS.map((it) => {
                    const isViewed = viewedLocations.includes(it.name || it.id)
                    const isSelected = selectedItem?.id === it.id
                    return (
                      <button
                        key={it.id}
                        type="button"
                        onClick={() => handleSelectItem(it)}
                        className={`p-3 text-left rounded-xl border-2 transition shadow-sm flex flex-col justify-between ${
                          isSelected
                            ? 'bg-brand text-white border-brand scale-[1.02]'
                            : 'bg-white border-line hover:border-brand/40 text-ink'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-paper text-ink-soft'
                            }`}
                          >
                            {it.badge}
                          </span>
                          {isViewed && (
                            <CheckCircle className={`w-3.5 h-3.5 ${isSelected ? 'text-lime-light' : 'text-lime'}`} />
                          )}
                        </div>
                        <div className="text-xs font-bold leading-snug line-clamp-2">{it.name}</div>
                        <div className={`text-[11px] font-bold mt-2 ${isSelected ? 'text-white' : 'text-brand'}`}>
                          {it.salary || 'Практика и трудоустройство'}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : (
              /* Схема 10 заводов в России */
              <div className="max-w-4xl mx-auto w-full space-y-4">
                <div className="bg-white/90 backdrop-blur p-4 rounded-2xl border border-line shadow-sm">
                  <h3 className="text-sm sm:text-base font-bold text-ink flex items-center gap-2">
                    <Compass className="w-5 h-5 text-brand" />
                    <span>География «Очаково» в России (10 заводов, построенных с нуля)</span>
                  </h3>
                  <p className="text-xs text-ink-soft mt-0.5">
                    100% отечественный капитал без иностранных инвесторов. Собственные солодовни, заводы и виноградники.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {RUSSIA_LOCATIONS.map((loc) => {
                    const isSelected = selectedItem?.id === loc.id
                    return (
                      <button
                        key={loc.id}
                        type="button"
                        onClick={() => handleSelectItem(loc)}
                        className={`p-4 rounded-xl border-2 text-left transition shadow-sm ${
                          isSelected
                            ? 'bg-brand text-white border-brand'
                            : 'bg-white border-line hover:border-brand/40 text-ink'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-paper text-brand'
                            }`}
                          >
                            {loc.badge}
                          </span>
                          <span className={`text-[11px] font-bold ${isSelected ? 'text-white/80' : 'text-ink-soft'}`}>
                            с {loc.year} г.
                          </span>
                        </div>
                        <h4 className="text-sm font-bold mt-2">{loc.name}</h4>
                        <p className={`text-xs mt-1 line-clamp-2 ${isSelected ? 'text-white/90' : 'text-ink-soft'}`}>
                          {loc.description}
                        </p>
                        <div className="flex items-center gap-1 mt-3 text-xs font-bold underline">
                          <span>Подробнее о предприятии</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Нижняя федеральная инфо-плашка для режима РФ */}
        {mode === 'russia' && !selectedItem && (
          <div className="absolute bottom-4 left-4 right-4 z-[400] bg-white/95 backdrop-blur-md border border-line p-3 sm:p-4 rounded-xl shadow-lg max-w-3xl mx-auto pointer-events-auto">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-brand shrink-0 mt-0.5" />
              <div className="text-xs text-ink-soft leading-relaxed">
                <strong className="text-ink font-bold block mb-1">
                  100% российское предприятие без иностранного капитала
                </strong>
                10 высокотехнологичных заводов, построенных с нуля на отечественные инвестиции.
                Собственная сырьевая база (поля и солодовня в Липецкой обл., виноградники на Тамани).
                Поставки в 60 регионов РФ и 30+ стран мира (США, Германия, Греция, Китай, страны СНГ).
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Информационная шторка / модальное окно выбранного объекта */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 280 }}
            className="absolute bottom-0 left-0 right-0 z-[500] max-h-[82vh] bg-white border-t-2 border-brand shadow-2xl rounded-t-2xl flex flex-col overflow-hidden"
          >
            {/* Шапка шторки */}
            <div className="sticky top-0 bg-white/95 backdrop-blur border-b border-line px-4 py-3 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-brand/10 text-brand">
                  {selectedItem.badge || 'Очаково'}
                </span>
                {viewedLocations.includes(selectedItem.name || selectedItem.id) && (
                  <span className="flex items-center gap-1 text-[11px] font-bold text-lime">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Изучено (+15 баллов)
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className="p-1 rounded-full text-ink-soft hover:bg-paper hover:text-ink transition"
                aria-label="Закрыть"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Контент шторки со скроллом */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-ink leading-tight">
                  {selectedItem.name}
                </h3>
                <p className="text-xs text-ink-soft flex items-center gap-1.5 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-brand shrink-0" />
                  <span>{selectedItem.address}</span>
                </p>
              </div>

              {/* Фотогалерея (кадры из реальных обучающих видео) */}
              {selectedItem.photos && selectedItem.photos.length > 0 && (
                <div className="space-y-2">
                  <div className="relative aspect-video w-full rounded-xl overflow-hidden border border-line bg-paper shadow-inner">
                    <img
                      src={selectedItem.photos[activePhoto]}
                      alt={selectedItem.name}
                      className="w-full h-full object-cover transition-all duration-300"
                    />
                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-graphite/80 backdrop-blur rounded text-[10px] font-bold text-white">
                      Кадр с производства Очаково · {activePhoto + 1} из {selectedItem.photos.length}
                    </div>
                  </div>
                  {/* Миниатюры */}
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {selectedItem.photos.map((ph, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActivePhoto(idx)}
                        className={`relative w-16 h-12 rounded-lg overflow-hidden border-2 shrink-0 transition ${
                          activePhoto === idx ? 'border-brand scale-105' : 'border-line opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={ph} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Блок для филиалов РФ */}
              {selectedItem.stats && Array.isArray(selectedItem.stats) && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {selectedItem.stats.map((st, i) => (
                    <div key={i} className="p-2.5 rounded-lg border border-line bg-paper text-xs">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-ink-soft">{st.label}</div>
                      <div className="text-xs font-bold text-ink mt-0.5">{st.value}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Кнопка "Приблизить цеха Москвы", если кликнули по Москве на карте РФ */}
              {selectedItem.hasWorkshops && mode === 'russia' && (
                <button
                  type="button"
                  onClick={handleFocusMoscow}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-brand text-white font-bold text-xs uppercase tracking-wider hover:bg-brand-dark transition shadow"
                >
                  <Building2 className="w-4 h-4" />
                  <span>🔍 Приблизить цеха Москвы (6 объектов на Рябиновой)</span>
                </button>
              )}

              {/* Описание */}
              {selectedItem.description && (
                <div className="text-xs sm:text-sm text-ink-soft leading-relaxed border-l-2 border-brand pl-3">
                  {selectedItem.description}
                </div>
              )}

              {/* Специфические блоки для цехов Москвы */}
              {selectedItem.targetVacancy && (
                <div className="space-y-3 pt-2">
                  {/* Зарплата и график */}
                  <div className="p-3.5 rounded-xl border border-brand/20 bg-malt-light/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-brand">
                        Доход и график работы
                      </div>
                      <div className="text-base font-bold text-graphite mt-0.5">
                        {selectedItem.salary}
                      </div>
                      {selectedItem.salaryNote && (
                        <div className="text-[11px] text-ink-soft">{selectedItem.salaryNote}</div>
                      )}
                    </div>
                    <div className="text-xs font-semibold text-ink-soft bg-white/80 px-2.5 py-1.5 rounded-md border border-line">
                      <Clock className="w-3.5 h-3.5 inline mr-1 text-brand" />
                      {selectedItem.schedule}
                    </div>
                  </div>

                  {/* Кого ждут */}
                  <div className="p-3 rounded-lg border border-line bg-paper text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-ink">
                      <GraduationCap className="w-4 h-4 text-brand shrink-0" />
                      <span>Кого ждут в цехе:</span>
                    </div>
                    <div className="text-ink-soft pl-5">{selectedItem.who}</div>
                  </div>

                  {/* Чем занимаются и задачи */}
                  <div className="p-3 rounded-lg border border-line bg-paper text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-ink">
                      <Briefcase className="w-4 h-4 text-brand shrink-0" />
                      <span>Задачи и реальные производственные процессы:</span>
                    </div>
                    <div className="text-ink-soft pl-5 leading-relaxed">{selectedItem.tasks}</div>
                  </div>

                  {/* Оборудование */}
                  {selectedItem.equipment && (
                    <div className="p-3 rounded-lg border border-line bg-paper text-xs space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-ink">
                        <Wrench className="w-4 h-4 text-brand shrink-0" />
                        <span>Технологическое оборудование цеха:</span>
                      </div>
                      <ul className="list-disc list-inside text-ink-soft pl-5 space-y-0.5">
                        {Array.isArray(selectedItem.equipment) ? (
                          selectedItem.equipment.map((eq, idx) => <li key={idx}>{eq}</li>)
                        ) : (
                          <li>{selectedItem.equipment}</li>
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Что производят / создают */}
                  {selectedItem.products && (
                    <div className="p-3 rounded-lg border border-line bg-paper text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-ink">
                        <Package className="w-4 h-4 text-brand shrink-0" />
                        <span>Выпускаемая продукция и бренды:</span>
                      </div>
                      <div className="text-ink-soft pl-5 font-medium">{selectedItem.products}</div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Подвал шторки с целевыми действиями */}
            {selectedItem.targetVacancy && (
              <div className="sticky bottom-0 bg-white border-t border-line p-3 sm:p-4 flex flex-col sm:flex-row items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectWorkshop(selectedItem)}
                  className={`w-full sm:flex-1 py-3 px-4 rounded-lg font-bold text-xs uppercase tracking-wider transition shadow flex items-center justify-center gap-2 ${
                    selectedWorkshopName === selectedItem.name
                      ? 'bg-lime text-graphite border-2 border-lime ring-2 ring-lime/40'
                      : 'bg-brand text-white hover:bg-brand-dark'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>
                    {selectedWorkshopName === selectedItem.name
                      ? '✓ Цех выбран для практики'
                      : '✅ Выбрать этот цех для практики / стажировки'}
                  </span>
                </button>

                {onNavigateToApply && (
                  <button
                    type="button"
                    onClick={() => {
                      handleSelectWorkshop(selectedItem)
                      onNavigateToApply()
                    }}
                    className="w-full sm:w-auto py-3 px-4 rounded-lg bg-graphite text-white font-bold text-xs uppercase tracking-wider hover:bg-ink transition shadow flex items-center justify-center gap-2"
                  >
                    <span>К анкете 18+</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
