import { useEffect } from 'react'
import { Screen } from '../components/Screen.jsx'
import { BigButton } from '../components/BigButton.jsx'
import { MicButton } from '../components/MicButton.jsx'
import { useApp } from '../contexts/AppContext.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useVoice } from '../contexts/VoiceContext.jsx'
import { useWardrobe } from '../contexts/WardrobeContext.jsx'
import { SCREENS, COLORS, RESPONSES } from '../utils/constants.js'

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
    <Screen title="Rizzvision" subtitle="Your AI style assistant." back={false}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, marginTop: 8 }}>

        <MicButton isListening={isListening} onClick={toggleListening} size={120} />

        <div role="status" aria-live="polite" aria-atomic="true"
          style={{ fontSize: 14, color: COLORS.TEXT_MUTED, textAlign: 'center', marginBottom: 4 }}>
          {isThinking ? 'Speaking...' : isListening ? 'Listening — say "scan", "wardrobe", "outfits"...' : 'Tap to start voice commands'}
        </div>

        {items.length > 0 && (
          <div style={{ background: COLORS.ACCENT_DIM, border: `1px solid rgba(124,58,237,0.3)`, borderRadius: 12, padding: '8px 18px', fontSize: 14, color: COLORS.ACCENT_LIGHT }}>
            {items.length} item{items.length !== 1 ? 's' : ''} in your wardrobe
          </div>
        )}

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <BigButton label="Scan T-Shirt" hint="Analyze a t-shirt and save it to your wardrobe" icon="📸" variant="primary" onClick={() => navigate(SCREENS.SCAN)} />
          <BigButton label="Outfit Suggestions" hint="Get AI outfit ideas for any occasion" icon="👔" onClick={() => navigate(SCREENS.OUTFIT)} />
          <BigButton label="My Wardrobe" hint="Browse and manage your saved items" icon="🗄️" onClick={() => navigate(SCREENS.WARDROBE)} />
        </div>

        <div style={{ width: '100%', display: 'flex', gap: 14 }}>
          <div style={{ flex: 1 }}>
            <BigButton label="Shopping" hint="Live wardrobe-aware shopping assistant" icon="🛍️" onClick={() => navigate(SCREENS.SHOPPING)} />
          </div>
          <div style={{ flex: 1 }}>
            <BigButton label="Mirror" hint="Instant full-outfit feedback" icon="🪞" onClick={() => navigate(SCREENS.MIRROR)} />
          </div>
        </div>

        <div style={{ marginTop: 8 }}>
          <BigButton label="Sign Out" hint="Sign out of your account" icon="→" variant="danger" onClick={signOut} />
        </div>

      </div>
    </Screen>
  )
}
