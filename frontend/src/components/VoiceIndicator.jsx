import { useVoice } from '../contexts/VoiceContext.jsx'
import { COLORS } from '../utils/constants.js'

export function VoiceIndicator() {
  const { isListening } = useVoice()
  const label = isListening ? 'Listening' : 'Mic off'
  const color = isListening ? COLORS.ACCENT : COLORS.TEXT_DIM

  return (
    <div role="status" aria-label={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div aria-hidden style={{ display: 'flex', alignItems: 'center', gap: 3, height: 18 }}>
        {[0, 1, 2, 3, 4].map(i => (
          <span key={i} style={{
            display: 'block',
            width: 3,
            background: color,
            borderRadius: 0,
            animation: isListening ? `vi-bar 900ms ease-in-out infinite` : 'none',
            animationDelay: `${i * 80}ms`,
            height: isListening ? '100%' : 6,
            transition: 'height 0.2s',
          }} />
        ))}
      </div>
      <span style={{
        fontFamily: 'var(--font-ui)',
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: 1,
        textTransform: 'uppercase',
        color: isListening ? COLORS.TEXT : COLORS.TEXT_DIM,
      }}>{label}</span>
      <style>{`
        @keyframes vi-bar {
          0%,100% { height: 30% }
          50% { height: 100% }
        }
      `}</style>
    </div>
  )
}
