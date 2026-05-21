import { COLORS } from '../utils/constants.js'

export function MicButton({ isListening, isProcessing, onClick, size = 120 }) {
  const bg = isProcessing
    ? COLORS.ACCENT
    : isListening
    ? COLORS.SURFACE_INVERSE
    : COLORS.SURFACE

  const fg = isProcessing
    ? COLORS.TEXT_ON_ACCENT
    : isListening
    ? COLORS.TEXT_ON_ACCENT
    : COLORS.TEXT_DIM

  const label = isProcessing ? 'Processing' : isListening ? 'Listening' : 'Tap to speak'
  const ariaLabel = isProcessing
    ? 'Processing your request'
    : isListening
    ? 'Stop listening'
    : 'Start voice commands'

  return (
    <button
      onClick={onClick}
      disabled={isProcessing}
      aria-label={ariaLabel}
      aria-pressed={isListening}
      style={{
        width: size,
        height: size,
        borderRadius: 0,
        background: bg,
        border: `3px solid ${COLORS.BORDER}`,
        color: fg,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        cursor: isProcessing ? 'not-allowed' : 'pointer',
        opacity: isProcessing ? 0.85 : 1,
        transition: 'background 120ms, color 120ms',
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
            background: fg,
            borderRadius: 0,
            animation: (isListening || isProcessing) ? `mbar 900ms ease-in-out infinite` : 'none',
            animationDelay: `${i * 90}ms`,
            height: (isListening || isProcessing) ? '100%' : 8,
          }} />
        ))}
      </div>
      <span style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 1.4,
        textTransform: 'uppercase',
        color: fg,
      }}>
        {label}
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
