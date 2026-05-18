import { useState, useEffect, useCallback } from 'react'
import { Screen } from '../components/Screen.jsx'
import { BigButton } from '../components/BigButton.jsx'
import { ContextChat } from '../components/ContextChat.jsx'
import { useApp } from '../contexts/AppContext.jsx'
import { useVoice } from '../contexts/VoiceContext.jsx'
import { useWardrobe } from '../contexts/WardrobeContext.jsx'
import { getOutfitSuggestion } from '../services/api.js'
import { OCCASIONS, SCREENS, COLORS, RESPONSES, DESC_MODES } from '../utils/constants.js'

const MIN_WARDROBE = 8

export function OutfitScreen() {
  const { navigate, navParams, descMode, toggleDescMode } = useApp()
  const { speak } = useVoice()
  const { items } = useWardrobe()

  const [phase, setPhase] = useState('occasion')
  const [occasion, setOccasion] = useState(null)
  const [result, setResult] = useState('')
  const [usedWardrobe, setUsedWardrobe] = useState(false)

  const anchorItem = navParams?.anchorItem || null
  const canUseWardrobe = items.length >= MIN_WARDROBE

  useEffect(() => {
    if (items.length === 0) { speak('Your wardrobe is empty. Add some items first.'); return }
    speak(anchorItem ? `Building an outfit around your ${anchorItem.name}. What occasion?` : RESPONSES.outfitPrompt)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const generateOutfit = useCallback(async (mode) => {
    if (!occasion) return
    setPhase('loading')
    speak(RESPONSES.generating)
    const occasionLabel = OCCASIONS.find((o) => o.id === occasion)?.label || occasion
    // Only pass wardrobe if user has enough items AND mode is wardrobe
    const wardrobeText = (mode === 'wardrobe' && items.length >= MIN_WARDROBE)
      ? items.map((i) => `${i.name} (${i.category}): ${i.description || ''}`).join('\n')
      : ''
    try {
      const data = await getOutfitSuggestion({ wardrobeItems: wardrobeText, occasion: occasionLabel, mode })
      const text = data.suggestion || data.response || data.text || ''
      setUsedWardrobe(wardrobeText.length > 0)
      setResult(text); setPhase('result'); speak(text)
    } catch {
      speak(RESPONSES.error); setPhase('occasion')
    }
  }, [occasion, items, speak])

  const proceedFromOccasion = useCallback(() => {
    if (!occasion) return
    if (canUseWardrobe) {
      setPhase('mode')
      speak('You have enough wardrobe items for personalised suggestions. Would you like to use your wardrobe or get general advice?')
    } else {
      generateOutfit('general')
    }
  }, [occasion, canUseWardrobe, generateOutfit, speak])

  useEffect(() => {
    const handler = (e) => {
      const cmd = e.detail
      if (cmd.type === 'SELECT_OCCASION' && phase === 'occasion') { setOccasion(cmd.id); speak(OCCASIONS.find((o) => o.id === cmd.id)?.label ?? cmd.id) }
      else if (cmd.type === 'CONFIRM' && phase === 'occasion' && occasion) proceedFromOccasion()
      else if (cmd.type === 'READ_RESULT' && phase === 'result') speak(result)
    }
    window.addEventListener('voiceCommand', handler)
    return () => window.removeEventListener('voiceCommand', handler)
  }, [phase, occasion, result, proceedFromOccasion, speak])

  if (items.length === 0) {
    return (
      <Screen title="Outfit Help" subtitle="You need items in your wardrobe first.">
        <p style={{ fontSize: 15, color: COLORS.TEXT_MUTED, lineHeight: 1.7, marginBottom: 24 }}>
          Scan some clothing to build your wardrobe, then come back.
        </p>
        <BigButton label="Scan Clothing" icon="📸" variant="primary" onClick={() => navigate(SCREENS.SCAN)} />
      </Screen>
    )
  }

  if (phase === 'occasion') {
    return (
      <Screen title="Outfit For…" subtitle={anchorItem ? `Around: ${anchorItem.name}` : "Pick your occasion"}>
        <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 20 }}>
          {OCCASIONS.map((o) => (
            <button key={o.id} onClick={() => setOccasion(o.id)} aria-pressed={occasion === o.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 0,
                minHeight: 64, width: '100%',
                background: occasion === o.id ? COLORS.SURFACE_INVERSE : COLORS.SURFACE,
                color: occasion === o.id ? COLORS.TEXT_ON_ACCENT : COLORS.TEXT,
                border: 'none',
                borderBottom: `2px solid ${COLORS.BORDER}`,
                cursor: 'pointer', textAlign: 'left', padding: 0,
              }}>
              <div style={{
                width: 64, height: 64, minWidth: 64, fontSize: 22,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRight: `2px solid ${COLORS.BORDER}`,
                background: occasion === o.id ? COLORS.TEXT_DIM : 'transparent',
              }}>
                {o.icon}
              </div>
              <div style={{ padding: '0 18px', flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{o.label}</div>
              </div>
              {occasion === o.id && <div style={{ paddingRight: 18, fontSize: 18, color: COLORS.TEXT_ON_ACCENT }}>✓</div>}
            </button>
          ))}
        </div>
        <BigButton label="Next" variant="primary" disabled={!occasion} onClick={proceedFromOccasion} />
      </Screen>
    )
  }

  if (phase === 'mode') {
    const occasionLabel = OCCASIONS.find((o) => o.id === occasion)?.label || occasion
    return (
      <Screen title="Outfit Help" subtitle={`For ${occasionLabel}`}>
        <p style={{ fontSize: 14, color: COLORS.TEXT_MUTED, lineHeight: 1.6, marginBottom: 20 }}>
          You have {items.length} items in your wardrobe.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, marginBottom: 16 }}>
          {[
            { mode: 'wardrobe', label: 'Based on My Wardrobe', desc: `Uses your ${items.length} saved pieces to build a specific look.` },
            { mode: 'general',  label: 'General Advice',       desc: 'Broad styling tips for the occasion.' },
          ].map(({ mode, label, desc }) => (
            <button key={mode} onClick={() => generateOutfit(mode)}
              style={{
                display: 'flex', alignItems: 'center', gap: 0,
                minHeight: 72, width: '100%',
                background: COLORS.SURFACE, border: 'none',
                borderBottom: `2px solid ${COLORS.BORDER}`,
                cursor: 'pointer', textAlign: 'left', padding: 0, color: COLORS.TEXT,
              }}>
              <div style={{ flex: 1, padding: '0 18px' }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{label}</div>
                <div style={{ fontSize: 13, color: COLORS.TEXT_MUTED, marginTop: 3 }}>{desc}</div>
              </div>
              <div style={{ paddingRight: 18, fontSize: 18, color: COLORS.TEXT_DIM }}>›</div>
            </button>
          ))}
        </div>
        <BigButton label="Back" onClick={() => setPhase('occasion')} />
      </Screen>
    )
  }

  if (phase === 'loading') {
    return (
      <Screen title="Styling you up…" subtitle="Give me a second.">
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <LoadingBars />
        </div>
      </Screen>
    )
  }

  const occasionLabel = OCCASIONS.find((o) => o.id === occasion)?.label || occasion
  const outfitChatContext = result ? `Occasion: ${occasionLabel}\nSuggestion: ${result}` : ''
  const displayResult = descMode === DESC_MODES.SHORT
    ? result.split(/(?<=[.!?])\s+/).slice(0, 2).join(' ')
    : result

  return (
    <Screen title="Your Outfit" subtitle={`For ${occasionLabel}`}>
      {!usedWardrobe && items.length < MIN_WARDROBE && (
        <div style={{ border: `2px solid ${COLORS.ACCENT}`, borderRadius: COLORS.RADIUS, padding: '10px 14px', marginBottom: 14, background: COLORS.SURFACE, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
          <p style={{ fontSize: 13, color: COLORS.ACCENT, lineHeight: 1.5, margin: 0 }}>
            General advice — scan {MIN_WARDROBE - items.length} more item{MIN_WARDROBE - items.length !== 1 ? 's' : ''} to unlock personalised wardrobe suggestions.
          </p>
        </div>
      )}
      <div role="region" aria-label="Outfit suggestion"
        style={{ border: `2px solid ${COLORS.BORDER}`, borderRadius: COLORS.RADIUS, padding: 18, marginBottom: 16, background: COLORS.SURFACE }}>
        <p style={{ fontSize: 16, color: COLORS.TEXT, lineHeight: 1.8, margin: 0 }}>{displayResult}</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <BigButton
          label={descMode === DESC_MODES.SHORT ? 'Full Description' : 'Brief Description'}
          icon={descMode === DESC_MODES.SHORT ? '📋' : '🔊'}
          onClick={toggleDescMode}
        />
        <BigButton label="Read Again" icon="🔊" onClick={() => speak(result)} />
        <BigButton label="Try Different Options" icon="🔄" onClick={() => { setPhase('occasion'); setOccasion(null); setResult(''); setUsedWardrobe(false) }} />
      </div>

      {outfitChatContext && <ContextChat resultContext={outfitChatContext} feature="outfit" speak={speak} />}
    </Screen>
  )
}

function LoadingBars() {
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center', height: 40 }}>
      {[0,1,2,3,4].map(i => (
        <span key={i} style={{ display: 'block', width: 6, background: COLORS.ACCENT, borderRadius: 0, animation: `lbar2 800ms ease-in-out infinite`, animationDelay: `${i * 100}ms`, height: '100%' }} />
      ))}
      <style>{`@keyframes lbar2 { 0%,100%{transform:scaleY(0.3)} 50%{transform:scaleY(1)} }`}</style>
    </div>
  )
}
