import { COLORS } from '../utils/constants.js'

export function MicButton({ isListening, onClick, size = 120 }) {
  return (
    <button
      onClick={onClick}
      aria-label={isListening ? 'Stop listening' : 'Start voice commands'}
      aria-pressed={isListening}
      style={{
        width: size,
        height: size,
        borderRadius: 0,
        background: isListening ? COLORS.SURFACE_INVERSE : COLORS.SURFACE,
        border: `3px solid ${COLORS.BORDER}`,
        color: isListening ? COLORS.TEXT_ON_ACCENT : COLORS.TEXT,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        cursor: 'pointer',
        transition: `background ${COLORS.RADIUS}ms, color ${COLORS.RADIUS}ms`,
        WebkitTapHighlightColor: 'transparent',
        flexShrink: 0,
      }}
    >
      {/* Animated bars */}
      <div aria-hidden style={{ display: 'flex', alignItems: 'center', gap: 4, height: 28 }}>
        {[0, 1, 2, 3, 4].map(i => (
          <span key={i} style={{
            display: 'block',
            width: 5,
            background: isListening ? COLORS.TEXT_ON_ACCENT : COLORS.TEXT_DIM,
            borderRadius: 0,
            animation: isListening ? `mbar 900ms ease-in-out infinite` : 'none',
            animationDelay: `${i * 90}ms`,
            height: isListening ? '100%' : 8,
          }} />
        ))}
      </div>
      <span style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 1.4,
        textTransform: 'uppercase',
        color: isListening ? COLORS.TEXT_ON_ACCENT : COLORS.TEXT_DIM,
      }}>
        {isListening ? 'Listening' : 'Tap to speak'}
      </span>
      <style>{`
        @keyframes mbar {
          0%,100% { height: 30% }
          50% { height: 100% }
        }
      `}</style>
    </button>
  )
}
