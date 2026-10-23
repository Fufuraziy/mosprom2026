// «Крафти» — маскот-наставник: медвежонок в фирменной красной кепке ОЧАКОВО.
// Оригинальный персонаж в палитре брендбука: красный #D50032, серый Pantone 429, тёмно-серый Cool Gray 10.
export default function Krafty({ size = 64, mood = 'happy', className = '' }) {
  const eyes =
    mood === 'wink' ? (
      <>
        <path d="M39 54 q4 -4 8 0" stroke="#626262" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <circle cx="74" cy="53" r="4.6" fill="#4A4A4A" />
        <circle cx="75.6" cy="51.4" r="1.4" fill="#fff" />
      </>
    ) : mood === 'think' ? (
      <>
        <circle cx="44" cy="54" r="4.2" fill="#4A4A4A" />
        <circle cx="74" cy="54" r="4.2" fill="#4A4A4A" />
        <path d="M37 45 l12 -3 M68 42 l12 3" stroke="#4A4A4A" strokeWidth="2.6" strokeLinecap="round" />
      </>
    ) : (
      <>
        <circle cx="44" cy="53" r="4.6" fill="#4A4A4A" />
        <circle cx="74" cy="53" r="4.6" fill="#4A4A4A" />
        <circle cx="45.6" cy="51.4" r="1.4" fill="#fff" />
        <circle cx="75.6" cy="51.4" r="1.4" fill="#fff" />
      </>
    )
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className={className} role="img" aria-label="Крафти">
      {/* уши */}
      <circle cx="26" cy="40" r="15" fill="#8A9194" stroke="#626262" strokeWidth="2.5" />
      <circle cx="26" cy="40" r="7" fill="#E8EBEC" />
      <circle cx="94" cy="40" r="15" fill="#8A9194" stroke="#626262" strokeWidth="2.5" />
      <circle cx="94" cy="40" r="7" fill="#E8EBEC" />
      {/* голова */}
      <ellipse cx="60" cy="64" rx="41" ry="38" fill="#A2AAAD" stroke="#626262" strokeWidth="2.5" />
      {/* мордочка */}
      <ellipse cx="60" cy="76" rx="20" ry="15" fill="#F4F5F6" stroke="#626262" strokeWidth="2" />
      <path d="M53 70 q7 -6 14 0 q-7 7 -14 0z" fill="#4A4A4A" />
      {mood === 'think' ? (
        <path d="M54 84 h12" stroke="#4A4A4A" strokeWidth="2.6" strokeLinecap="round" />
      ) : (
        <path d="M51 81 q9 9 18 0" stroke="#4A4A4A" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      )}
      {eyes}
      <ellipse cx="34" cy="68" rx="6" ry="3.6" fill="#D50032" opacity=".35" />
      <ellipse cx="86" cy="68" rx="6" ry="3.6" fill="#D50032" opacity=".35" />
      {/* кепка */}
      <path d="M22 40 q38 -34 76 0 l-2 4 q-36 -8 -72 0z" fill="#D50032" stroke="#626262" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M94 42 q14 -2 20 6 q-12 4 -22 0z" fill="#AB2328" stroke="#4A4A4A" strokeWidth="2.6" strokeLinejoin="round" />
      <rect x="51" y="19" width="16" height="16" fill="none" stroke="#fff" strokeWidth="2" />
      <circle cx="58" cy="29" r="4" fill="none" stroke="#fff" strokeWidth="3" />
    </svg>
  )
}
