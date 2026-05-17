import { useState, useEffect, useCallback } from 'react'
import { Screen } from '../components/Screen.jsx'
import { BigButton } from '../components/BigButton.jsx'
import { ContextChat } from '../components/ContextChat.jsx'
import { useApp } from '../contexts/AppContext.jsx'
import { useVoice } from '../contexts/VoiceContext.jsx'
import { useWardrobe } from '../contexts/WardrobeContext.jsx'
import { getOutfitSuggestion } from '../services/api.js'
import { OCCASIONS, SCREENS, COLORS, RESPONSES, DESC_MODES } from '../utils/constants.js'

const MIN_WARDROBE = 5

export function OutfitScreen() {
  const { navigate, navParams, descMode, toggleDescMode } = useApp()
  const { speak } = useVoice()
  const { items } = useWardrobe()

  const [phase, setPhase] = useState('occasion') // occasion | mode | loading | result
  const [occasion, setOccasion] = useState(null)
  const [suggestionMode, setSuggestionMode] = useState(null)
  const [result, setResult] = useState('')

  const anchorItem = navParams?.anchorItem || null
  const canUseWardrobe = items.length >= MIN_WARDROBE

  useEffect(() => {
    if (items.length === 0) {
      speak('Your wardrobe is empty. Add some items first by scanning clothing.')
      return
    }
    speak(anchorItem ? `Building an outfit around your ${anchorItem.name}. What occasion?` : RESPONSES.outfitPrompt)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const proceedFromOccasion = useCallback(() => {
    if (!occasion) return
    if (canUseWardrobe) {
      setPhase('mode')
      speak('Would you like suggestions based on your wardrobe, or general advice?')
    } else {
      setSuggestionMode('general')
      setPhase('loading')
    }
  }, [occasion, canUseWardrobe, speak])

  const generateOutfit = useCallback(async (mode) => {
    if (!occasion) return
    setPhase('loading')
    speak(RESPONSES.generating)

    const occasionLabel = OCCASIONS.find((o) => o.id === occasion)?.label || occasion
    const wardrobeText = mode === 'general' ? '' : items.map((i) => `${i.name} (${i.category}): ${i.description || ''}`).join('\n')

    try {
      const data = await getOutfitSuggestion({ wardrobeItems: wardrobeText, occasion: occasionLabel, mode })
      const text = data.suggestion || data.response || data.text || ''
      setResult(text)
      setPhase('result')
      speak(text)
    } catch {
      speak(RESPONSES.error)
      setPhase('occasion')
    }
  }, [occasion, items, speak])

  const handleModeSelect = useCallback((mode) => {
    setSuggestionMode(mode)
    generateOutfit(mode)
  }, [generateOutfit])

  useEffect(() => {
    const handler = (e) => {
      const cmd = e.detail
      if (cmd.type === 'SELECT_OCCASION' && phase === 'occasion') {
        setOccasion(cmd.id)
        speak(OCCASIONS.find((o) => o.id === cmd.id)?.label ?? cmd.id)
      } else if (cmd.type === 'CONFIRM' && phase === 'occasion' && occasion) {
        proceedFromOccasion()
      } else if (cmd.type === 'READ_RESULT' && phase === 'result') {
        speak(result)
      }
    }
    window.addEventListener('voiceCommand', handler)
    return () => window.removeEventListener('voiceCommand', handler)
  }, [phase, occasion, result, proceedFromOccasion, speak])

  if (items.length === 0) {
    return (
      <Screen title="Outfit Help" subtitle="You need items in your wardrobe first.">
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <p style={{ fontSize: 18, color: COLORS.TEXT_MUTED, lineHeight: 1.7, marginBottom: 24, fontFamily: 'var(--font-body)' }}>
            Scan some clothing items to build your wardrobe, then come back for outfit suggestions.
          </p>
          <BigButton label="Scan Clothing" icon="📸" variant="primary" onClick={() => navigate(SCREENS.SCAN)} />
        </div>
      </Screen>
    )
  }

  // ── Occasion picker ──────────────────────────────────────────────────────────
  if (phase === 'occasion') {
    return (
      <Screen title="Outfit Help" subtitle={anchorItem ? `Building around: ${anchorItem.name}` : "What's the occasion?"}>
        <p style={{ fontSize: 13, color: COLORS.TEXT_MUTED, marginBottom: 16, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Pick your occasion</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
          {OCCASIONS.map((o) => (
            <button key={o.id} onClick={() => setOccasion(o.id)} aria-pressed={occasion === o.id}
              style={{ padding: '16px 20px', borderRadius: 16, border: `2px solid ${occasion === o.id ? COLORS.ACCENT : COLORS.BORDER}`, background: occasion === o.id ? COLORS.ACCENT_DIM : COLORS.SURFACE, color: COLORS.TEXT, fontSize: 17, fontWeight: occasion === o.id ? 700 : 500, textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, minHeight: 60 }}>
              <span style={{ fontSize: 24 }}>{o.icon}</span> {o.label}
            </button>
          ))}
        </div>
        <BigButton label="Next" hint="Continue to suggestion options" variant="primary" disabled={!occasion} onClick={proceedFromOccasion} />
      </Screen>
    )
  }

  // ── Mode picker ──────────────────────────────────────────────────────────────
  if (phase === 'mode') {
    const occasionLabel = OCCASIONS.find((o) => o.id === occasion)?.label || occasion
    return (
      <Screen title="Outfit Help" subtitle={`For ${occasionLabel}`}>
        <p style={{ fontSize: 16, color: COLORS.TEXT_MUTED, lineHeight: 1.7, marginBottom: 24, fontFamily: 'var(--font-body)' }}>
          You have {items.length} items in your wardrobe. How would you like suggestions?
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 16 }}>
          <button onClick={() => handleModeSelect('wardrobe')} style={{ background: COLORS.SURFACE, border: `2px solid ${COLORS.ACCENT}`, borderRadius: 18, padding: '20px 24px', textAlign: 'left', cursor: 'pointer', color: COLORS.TEXT }}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Based on My Wardrobe</div>
            <div style={{ fontSize: 14, color: COLORS.TEXT_MUTED, lineHeight: 1.5 }}>Pairs specific items from your {items.length} saved pieces.</div>
          </button>
          <button onClick={() => handleModeSelect('general')} style={{ background: COLORS.SURFACE, border: `2px solid ${COLORS.BORDER}`, borderRadius: 18, padding: '20px 24px', textAlign: 'left', cursor: 'pointer', color: COLORS.TEXT }}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>General Advice</div>
            <div style={{ fontSize: 14, color: COLORS.TEXT_MUTED, lineHeight: 1.5 }}>Broad styling tips for the occasion.</div>
          </button>
        </div>
        <BigButton label="Back" hint="Back to occasion selection" onClick={() => setPhase('occasion')} />
      </Screen>
    )
  }

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (phase === 'loading') {
    return (
      <Screen title="Styling you up..." subtitle="Give me a second.">
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', border: `4px solid ${COLORS.ACCENT}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </Screen>
    )
  }

  // ── Result ───────────────────────────────────────────────────────────────────
  const occasionLabel = OCCASIONS.find((o) => o.id === occasion)?.label || occasion
  const outfitChatContext = result ? `Occasion: ${occasionLabel}\nSuggestion: ${result}` : ''
  const displayResult = descMode === DESC_MODES.SHORT
    ? result.split(/(?<=[.!?])\s+/).slice(0, 2).join(' ')
    : result

  return (
    <Screen title="Your Outfit" subtitle={`For ${occasionLabel}`}>
      <div role="region" aria-label="Outfit suggestion"
        style={{ background: COLORS.SURFACE, borderRadius: 16, padding: 20, border: `1px solid ${COLORS.BORDER}`, marginBottom: 16 }}>
        <p style={{ fontSize: 18, color: COLORS.TEXT, lineHeight: 1.8, margin: 0, fontFamily: 'var(--font-body)' }}>{displayResult}</p>
      </div>

      <BigButton
        label={descMode === DESC_MODES.SHORT ? 'Full Description' : 'Brief Description'}
        hint={descMode === DESC_MODES.SHORT ? 'Hear the complete suggestion' : 'Hear a shorter summary'}
        icon={descMode === DESC_MODES.SHORT ? '📋' : '🔊'}
        onClick={toggleDescMode}
      />

      {outfitChatContext && <ContextChat context={outfitChatContext} feature="outfit" speak={speak} />}

      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <BigButton label="Read Again" hint="Hear the suggestion again" icon="🔊" onClick={() => speak(result)} />
        <BigButton label="Try Different Options" hint="Choose a new occasion" icon="🔄" onClick={() => { setPhase('occasion'); setOccasion(null); setResult(''); setSuggestionMode(null) }} />
      </div>
    </Screen>
  )
}
