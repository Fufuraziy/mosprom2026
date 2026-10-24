// «Крафти» — маскот-наставник (аватар-голова). Полная иллюстрация и 5 состояний — MascotStoryteller.jsx.
// Оригинальный персонаж в палитре брендбука: красный #D50032, серый Pantone 429, тёмно-серый Cool Gray 10.
import { MascotHead } from './MascotStoryteller.jsx'

export default function Krafty({ size = 64, mood = 'happy', className = '' }) {
  return <MascotHead size={size} mood={mood} className={className} />
}
