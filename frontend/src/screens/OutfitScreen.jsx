import { useState } from 'react'
import { useApp } from '../contexts/AppContext.jsx'
import { useWardrobe } from '../contexts/WardrobeContext.jsx'
import { useSpeechOutput } from '../hooks/useSpeechOutput.jsx'
import { getOutfitSuggestion } from '../services/api.js'
import { COLORS } from '../utils/constants.js'

export function OutfitScreen() {
  const { goBack } = useApp()
  const { items } = useWardrobe()
  const { speak } = useSpeechOutput()
  const [occasion, setOccasion] = useState('')
  const [loading, setLoading] = useState(false)
  const [suggestion, setSuggestion] = useState('')

  const getSuggestion = async () => {
    setLoading(true)
    try {
      const wardrobeSummary = items.map((i) => `${i.name} (${i.color || 'unknown color'})`).join(', ')
      const data = await getOutfitSuggestion({ wardrobeItems: wardrobeSummary, occasion, mode: items.length ? 'wardrobe' : 'general' })
      setSuggestion(data.suggestion)
      speak(data.suggestion)
    } catch (e) {
      setSuggestion(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="screen">
      <div style={{ padding: '16px 16px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={goBack} style={{ fontSize: 20, color: COLORS.TEXT_MUTED, minHeight: 44, minWidth: 44 }}>←</button>
        <h2 style={{ fontWeight: 700, fontSize: 18 }}>Outfit Suggestions</h2>
      </div>

      <div className="scroll" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <input
          type="text"
          placeholder="Occasion (optional, e.g. casual, office)"
          value={occasion}
          onChange={(e) => setOccasion(e.target.value)}
          style={{
            width: '100%', padding: '14px 16px', borderRadius: 12, border: `1px solid ${COLORS.BORDER}`,
            background: 'rgba(255,255,255,0.04)', color: COLORS.TEXT, fontSize: 14, outline: 'none',
          }}
        />

        <button onClick={getSuggestion} disabled={loading}
          style={{ width: '100%', padding: '16px 0', borderRadius: 14, fontWeight: 700, fontSize: 16,
            background: loading ? COLORS.ACCENT_DIM : `linear-gradient(135deg, ${COLORS.ACCENT} 0%, #5B21B6 100%)`,
            color: loading ? COLORS.ACCENT_LIGHT : '#fff', minHeight: 56 }}>
          {loading ? 'Getting suggestions...' : 'Suggest Outfits'}
        </button>

        {suggestion && (
          <div className="glass" style={{ padding: 20 }}>
            <p style={{ fontSize: 15, fontFamily: 'var(--font-body)', lineHeight: 1.7, color: COLORS.TEXT, whiteSpace: 'pre-wrap' }}>
              {suggestion}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
