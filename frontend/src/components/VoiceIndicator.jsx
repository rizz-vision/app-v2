import { useVoice } from '../contexts/VoiceContext.jsx'
import { COLORS } from '../utils/constants.js'

export function VoiceIndicator() {
  const { listening } = useVoice()
  return (
    <div
      aria-label={listening ? 'Listening' : 'Microphone off'}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        fontSize: 12, color: listening ? COLORS.ACCENT_LIGHT : COLORS.TEXT_DIM,
      }}
    >
      <span style={{
        width: 8, height: 8, borderRadius: '50%',
        background: listening ? COLORS.ACCENT_LIGHT : COLORS.TEXT_DIM,
        boxShadow: listening ? `0 0 8px ${COLORS.ACCENT_LIGHT}` : 'none',
        animation: listening ? 'pulse 1.5s infinite' : 'none',
      }} />
      {listening ? 'Listening' : 'Mic off'}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  )
}
