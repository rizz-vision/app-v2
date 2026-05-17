import { COLORS } from '../utils/constants.js'

export function MicButton({ isListening, onClick, size = 120 }) {
  return (
    <button
      onClick={onClick}
      aria-label={isListening ? 'Stop listening' : 'Start voice commands — tap and speak'}
      aria-pressed={isListening}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: isListening
          ? `radial-gradient(circle, ${COLORS.ACCENT} 0%, #5B21B6 100%)`
          : 'rgba(255,255,255,0.06)',
        border: `3px solid ${isListening ? COLORS.ACCENT_LIGHT : COLORS.BORDER}`,
        color: isListening ? '#fff' : COLORS.TEXT_MUTED,
        fontSize: size * 0.35,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        boxShadow: isListening ? `0 0 40px ${COLORS.ACCENT_DIM}, 0 0 80px rgba(124,58,237,0.1)` : 'none',
        animation: isListening ? 'micPulse 2s ease infinite' : 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      <span aria-hidden>{isListening ? '🎙️' : '🎤'}</span>
      <style>{`
        @keyframes micPulse {
          0%, 100% { box-shadow: 0 0 40px rgba(124,58,237,0.4), 0 0 80px rgba(124,58,237,0.1); }
          50% { box-shadow: 0 0 60px rgba(124,58,237,0.7), 0 0 120px rgba(124,58,237,0.2); }
        }
      `}</style>
    </button>
  )
}
