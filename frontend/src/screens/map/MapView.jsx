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
  AlertCircle
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
  const [selectedItem, setSelectedItem] = useState(null)
  const [activePhoto, setActivePhoto] = useState(0)
  const [mapError, setMapError] = useState(false)
  const mapContainerRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const markersRef = useRef([])

  // Проверка, какие локации уже изучены
  const viewedLocations = state.telemetry?.viewed_map_locations || []
  const selectedWorkshopName = state.telemetry?.selected_map_workshop || null

  // Инициализация карты Leaflet
  useEffect(() => {
    if (!mapContainerRef.current) return

    try {
      if (!mapInstanceRef.current) {
        const initialCenter = mode === 'moscow' ? MOSCOW_CAMPUS_CENTER : RUSSIA_CENTER
        const initialZoom = mode === 'moscow' ? MOSCOW_CAMPUS_ZOOM : RUSSIA_ZOOM

        const map = L.map(mapContainerRef.current, {
          center: initialCenter,
          zoom: initialZoom,
          zoomControl: true,
          attributionControl: false,
        })

        // Тайлы CartoDB Voyager — быстрые, современные, чистые
        const tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          maxZoom: 19,
          subdomains: 'abcd',
        })

        tileLayer.on('tileerror', () => {
          // Если возникла сетевая ошибка подгрузки тайлов — мягко включаем векторный режим
          setMapError(true)
        })

        tileLayer.addTo(map)
        mapInstanceRef.current = map
      }
    } catch {
      setMapError(true)
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [])

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

    map.flyTo(targetCenter, targetZoom, { duration: 1.2 })

    items.forEach((item) => {
      const isSelected = selectedItem?.id === item.id
      const isWorkshop = mode === 'moscow'
      const isViewed = viewedLocations.includes(item.name || item.id)

      // Кастомный HTML-маркер в фирменном стиле «Очаково»
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
  }, [mode, selectedItem, viewedLocations])

  // Обработка выбора точки
  const handleSelectItem = (item) => {
    setSelectedItem(item)
    setActivePhoto(0)

    // Если это цех Москвы и он ещё не был изучен — начисляем +15 баллов
    if (item.targetVacancy && actions.viewMapLocation) {
      actions.viewMapLocation(item)
    }

    if (mapInstanceRef.current && item.coords) {
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
    <div className="relative flex flex-col h-[calc(100vh-64px)] min-h-[580px] bg-paper overflow-hidden select-none">
      {/* Верхняя плашка управления режимом */}
      <div className="absolute top-3 left-3 right-3 z-[400] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 pointer-events-none">
        <div className="flex p-1 bg-white/95 backdrop-blur-md rounded-lg shadow-md border border-line pointer-events-auto">
          <button
            type="button"
            onClick={() => {
              setMode('moscow')
              setSelectedItem(null)
            }}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-bold transition ${
              mode === 'moscow'
                ? 'bg-brand text-white shadow-sm'
                : 'text-ink-soft hover:text-ink hover:bg-paper'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>🏭 Кампус Москва (Рябиновая, 44)</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('russia')
              setSelectedItem(null)
            }}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-bold transition ${
              mode === 'russia'
                ? 'bg-brand text-white shadow-sm'
                : 'text-ink-soft hover:text-ink hover:bg-paper'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>🌍 География в РФ (10 заводов)</span>
          </button>
        </div>

        {/* Быстрый бейдж счетчика изученных цехов */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-graphite/90 backdrop-blur-md text-white rounded-lg shadow-md text-xs font-bold pointer-events-auto self-start sm:self-auto">
          <Sparkles className="w-4 h-4 text-malt-light" />
          <span>
            Изучено цехов: {viewedLocations.length} из {MOSCOW_WORKSHOPS.length} (+15 баллов за каждый)
          </span>
        </div>
      </div>

      {/* Основной контейнер карты */}
      <div className="relative flex-1 w-full h-full">
        {!mapError ? (
          <div ref={mapContainerRef} className="w-full h-full z-0" />
        ) : (
          /* Красивый векторный Fallback на случай отсутствия сети / тайлов */
          <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-stone-100 to-stone-200">
            <div className="max-w-md text-center bg-white p-6 rounded-xl border border-line shadow-lg">
              <Compass className="w-12 h-12 text-brand mx-auto mb-3" />
              <h3 className="text-base font-bold text-ink">
                Интерактивная карта «Очаково»
              </h3>
              <p className="text-xs text-ink-soft mt-1 mb-4">
                {mode === 'moscow'
                  ? 'Кампус Москва: выберите цех из интерактивного списка ниже для изучения оборудования и зарплат.'
                  : 'Федеральная сеть «Очаково»: 10 заводов от Москвы до Тюмени.'}
              </p>
              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                {(mode === 'moscow' ? MOSCOW_WORKSHOPS : RUSSIA_LOCATIONS).map((it) => (
                  <button
                    key={it.id}
                    onClick={() => handleSelectItem(it)}
                    className="flex items-center justify-between p-2.5 text-left border rounded-lg hover:border-brand hover:bg-paper transition"
                  >
                    <span className="text-xs font-bold text-ink">{it.name}</span>
                    <ChevronRight className="w-4 h-4 text-ink-soft shrink-0" />
                  </button>
                ))}
              </div>
            </div>
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
