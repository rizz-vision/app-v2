import { useEffect } from 'react'
import { MicButton } from '../components/MicButton.jsx'
import { VoiceIndicator } from '../components/VoiceIndicator.jsx'
import { useApp } from '../contexts/AppContext.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useVoice } from '../contexts/VoiceContext.jsx'
import { useWardrobe } from '../contexts/WardrobeContext.jsx'
import { SCREENS, COLORS, RESPONSES } from '../utils/constants.js'

const NAV_ITEMS = [
  { screen: SCREENS.SCAN,     label: 'Scan',     desc: 'Analyze a t-shirt',        icon: '📸' },
  { screen: SCREENS.OUTFIT,   label: 'Outfit',   desc: 'Get a suggestion',          icon: '👔' },
  { screen: SCREENS.WARDROBE, label: 'Wardrobe', desc: 'Browse saved items',        icon: '🗄️' },
  { screen: SCREENS.SHOPPING, label: 'Shopping', desc: 'Check before you buy',      icon: '🛍️' },
  { screen: SCREENS.MIRROR,   label: 'Mirror',   desc: 'Full outfit feedback',       icon: '🪞' },
]

export function HomeScreen() {
  const { navigate } = useApp()
  const { signOut } = useAuth()
  const { speak, isListening, isThinking, toggleListening } = useVoice()
  const { items } = useWardrobe()

  useEffect(() => {
    const t = setTimeout(() => speak(RESPONSES.welcome), 600)
    return () => clearTimeout(t)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="screen">
      {/* Header */}
      <div style={{
        padding: '12px 18px',
        borderBottom: `2px solid ${COLORS.BORDER}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: COLORS.TEXT_MUTED, marginBottom: 2 }}>
            RIZZVISION
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: COLORS.TEXT, letterSpacing: -0.4, lineHeight: 1 }}>
            Style Assistant
          </h1>
        </div>
        <VoiceIndicator />
      </div>

      <main className="scroll" tabIndex={-1} id="main" style={{ paddingBottom: 'max(120px, calc(env(safe-area-inset-bottom) + 100px))' }}>
        {/* Mic */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '20px 0 24px', borderBottom: `2px solid ${COLORS.BORDER}`, marginBottom: 0 }}>
          <MicButton isListening={isListening} onClick={toggleListening} size={100} />
          <div role="status" aria-live="polite" aria-atomic="true"
            style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: COLORS.TEXT_MUTED, textAlign: 'center' }}>
            {isThinking ? 'Speaking…' : isListening ? 'Say "scan", "wardrobe", "outfits"…' : 'Tap to speak'}
          </div>
          {items.length > 0 && (
            <div style={{ fontSize: 12, color: COLORS.ACCENT, fontWeight: 700 }}>
              {items.length} item{items.length !== 1 ? 's' : ''} in wardrobe
            </div>
          )}
        </div>

        {/* Nav list */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {NAV_ITEMS.map((n, i) => (
            <button
              key={n.screen}
              onClick={() => navigate(n.screen)}
              aria-label={`${n.label}. ${n.desc}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 0,
                minHeight: 72, width: '100%',
                background: 'transparent',
                border: 'none',
                borderBottom: `2px solid ${COLORS.BORDER}`,
                cursor: 'pointer',
                textAlign: 'left',
                color: COLORS.TEXT,
                padding: 0,
              }}
            >
              <div style={{
                width: 72, height: 72, minWidth: 72,
                background: i === 0 ? COLORS.SURFACE_INVERSE : COLORS.SURFACE,
                color: i === 0 ? COLORS.TEXT_ON_ACCENT : COLORS.TEXT,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24,
                borderRight: `2px solid ${COLORS.BORDER}`,
                flexShrink: 0,
              }}>
                {n.icon}
              </div>
              <div style={{ flex: 1, padding: '0 18px' }}>
                <div style={{ fontSize: 17, fontWeight: 700, color: COLORS.TEXT, lineHeight: 1.1 }}>{n.label}</div>
                <div style={{ fontSize: 13, color: COLORS.TEXT_MUTED, marginTop: 3 }}>{n.desc}</div>
              </div>
              <div style={{ paddingRight: 18, fontSize: 18, color: COLORS.TEXT_DIM }}>›</div>
            </button>
          ))}
        </div>

        {/* Sign out */}
        <div style={{ padding: '20px 0 0' }}>
          <button
            onClick={signOut}
            style={{
              width: '100%', minHeight: 56,
              background: 'transparent',
              border: `2px solid ${COLORS.DANGER}`,
              borderRadius: COLORS.RADIUS,
              color: COLORS.DANGER,
              fontSize: 15, fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: 0.5,
            }}
          >
            Sign Out
          </button>
        </div>
      </main>
    </div>
  )
}
