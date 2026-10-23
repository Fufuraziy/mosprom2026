// «Крафти» — маскот-наставник: медвежонок-пивовар в фирменной красной кепке «Очаково».
// Оригинальный персонаж (отсылка к медведю ЛЭП и олимпийскому 1980-му, но не копия).
export default function Krafty({ size = 64, mood = 'happy', className = '' }) {
  const eyes =
    mood === 'wink' ? (
      <>
        <path d="M39 54 q4 -4 8 0" stroke="#17110F" strokeWidth="3" fill="none" strokeLinecap="round" />
        <circle cx="74" cy="53" r="4.6" fill="#17110F" />
        <circle cx="75.6" cy="51.4" r="1.4" fill="#fff" />
      </>
    ) : mood === 'think' ? (
      <>
        <circle cx="44" cy="54" r="4.2" fill="#17110F" />
        <circle cx="74" cy="54" r="4.2" fill="#17110F" />
        <path d="M37 45 l12 -3 M68 42 l12 3" stroke="#17110F" strokeWidth="2.6" strokeLinecap="round" />
      </>
    ) : (
      <>
        <circle cx="44" cy="53" r="4.6" fill="#17110F" />
        <circle cx="74" cy="53" r="4.6" fill="#17110F" />
        <circle cx="45.6" cy="51.4" r="1.4" fill="#fff" />
        <circle cx="75.6" cy="51.4" r="1.4" fill="#fff" />
      </>
    )
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} className={className} role="img" aria-label="Крафти">
      {/* уши */}
      <circle cx="26" cy="40" r="15" fill="#A86A2E" stroke="#17110F" strokeWidth="3" />
      <circle cx="26" cy="40" r="7" fill="#EBC779" />
      <circle cx="94" cy="40" r="15" fill="#A86A2E" stroke="#17110F" strokeWidth="3" />
      <circle cx="94" cy="40" r="7" fill="#EBC779" />
      {/* голова */}
      <ellipse cx="60" cy="64" rx="41" ry="38" fill="#C08240" stroke="#17110F" strokeWidth="3" />
      {/* мордочка */}
      <ellipse cx="60" cy="76" rx="20" ry="15" fill="#F5EEE2" stroke="#17110F" strokeWidth="2.5" />
      <path d="M53 70 q7 -6 14 0 q-7 7 -14 0z" fill="#17110F" />
      {mood === 'think' ? (
        <path d="M54 84 h12" stroke="#17110F" strokeWidth="2.6" strokeLinecap="round" />
      ) : (
        <path d="M51 81 q9 9 18 0" stroke="#17110F" strokeWidth="2.6" fill="none" strokeLinecap="round" />
      )}
      {eyes}
      <ellipse cx="34" cy="68" rx="6" ry="3.6" fill="#EC1A42" opacity=".35" />
      <ellipse cx="86" cy="68" rx="6" ry="3.6" fill="#EC1A42" opacity=".35" />
      {/* кепка */}
      <path d="M22 40 q38 -34 76 0 l-2 4 q-36 -8 -72 0z" fill="#EC1A42" stroke="#17110F" strokeWidth="3" strokeLinejoin="round" />
      <path d="M94 42 q14 -2 20 6 q-12 4 -22 0z" fill="#AA0B2E" stroke="#17110F" strokeWidth="2.6" strokeLinejoin="round" />
      <rect x="51" y="19" width="16" height="16" fill="none" stroke="#fff" strokeWidth="2" />
      <circle cx="58" cy="29" r="4" fill="none" stroke="#fff" strokeWidth="3" />
      {/* колосок */}
      <path d="M86 92 q8 -10 6 -24" stroke="#C9922E" strokeWidth="2.4" fill="none" />
      <ellipse cx="90" cy="74" rx="2.6" ry="4.6" fill="#EBC779" stroke="#8E6418" strokeWidth="1.2" transform="rotate(20 90 74)" />
      <ellipse cx="93" cy="82" rx="2.6" ry="4.6" fill="#EBC779" stroke="#8E6418" strokeWidth="1.2" transform="rotate(-15 93 82)" />
    </svg>
  )
}
