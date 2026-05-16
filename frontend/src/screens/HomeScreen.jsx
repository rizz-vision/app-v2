import { useApp } from '../contexts/AppContext.jsx'
import { useWardrobe } from '../contexts/WardrobeContext.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { VoiceIndicator } from '../components/VoiceIndicator.jsx'
import { SCREENS, COLORS, DESC_MODES } from '../utils/constants.js'

const NAV_ITEMS = [
  { screen: SCREENS.SCAN, label: 'Scan', icon: '◎', desc: 'Analyze a t-shirt' },
  { screen: SCREENS.MIRROR, label: 'Mirror', icon: '⬡', desc: 'Full outfit check' },
  { screen: SCREENS.WARDROBE, label: 'Wardrobe', icon: '▤', desc: 'Your saved items' },
  { screen: SCREENS.OUTFIT, label: 'Outfits', icon: '✦', desc: 'Get suggestions' },
  { screen: SCREENS.SHOPPING, label: 'Shopping', icon: '◈', desc: 'Check new items' },
]

export function HomeScreen() {
  const { navigate, descMode, toggleDescMode } = useApp()
  const { items } = useWardrobe()
  const { user, signOut } = useAuth()

  return (
    <div className="screen" style={{ padding: 0 }}>
      {/* Header */}
      <div style={{ padding: '20px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="gradient-text" style={{ fontSize: 28, fontWeight: 700, letterSpacing: -0.5 }}>
            Rizzvision
          </h1>
          {user && (
            <p style={{ fontSize: 12, color: COLORS.TEXT_DIM, marginTop: 2 }}>
              {user.email?.split('@')[0]}
            </p>
          )}
        </div>
        <VoiceIndicator />
      </div>

      <div className="scroll" style={{ paddingTop: 20 }}>
        {/* Stats bar */}
        <div className="glass" style={{ padding: '14px 18px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: 22, fontWeight: 700, color: COLORS.ACCENT_LIGHT }}>{items.length}</p>
            <p style={{ fontSize: 12, color: COLORS.TEXT_MUTED }}>items saved</p>
          </div>
          <button
            onClick={toggleDescMode}
            style={{
              padding: '8px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600,
              background: COLORS.ACCENT_DIM, color: COLORS.ACCENT_LIGHT, minHeight: 36,
            }}
          >
            {descMode === DESC_MODES.SHORT ? 'Short desc' : 'Long desc'}
          </button>
        </div>

        {/* Nav grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          {NAV_ITEMS.map(({ screen, label, icon, desc }) => (
            <button
              key={screen}
              className="glass"
              onClick={() => navigate(screen)}
              style={{
                padding: '20px 16px', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 8,
                background: COLORS.CARD, transition: 'background 200ms',
                gridColumn: screen === SCREENS.SCAN ? '1 / -1' : undefined,
              }}
            >
              <span style={{ fontSize: screen === SCREENS.SCAN ? 28 : 22, color: COLORS.ACCENT_LIGHT }}>{icon}</span>
              <span style={{ fontWeight: 700, fontSize: screen === SCREENS.SCAN ? 18 : 15 }}>{label}</span>
              <span style={{ fontSize: 12, color: COLORS.TEXT_MUTED }}>{desc}</span>
            </button>
          ))}
        </div>

        {/* Sign out */}
        {user && (
          <button
            onClick={signOut}
            style={{ width: '100%', padding: '12px 0', fontSize: 13, color: COLORS.TEXT_DIM, minHeight: 44 }}
          >
            Sign out
          </button>
        )}
      </div>
    </div>
  )
}
