import { useState, useCallback } from 'react'
import { CameraCapture } from '../components/CameraCapture.jsx'
import { Screen } from '../components/Screen.jsx'
import { BigButton } from '../components/BigButton.jsx'
import { useVoice } from '../contexts/VoiceContext.jsx'
import { useWardrobe } from '../contexts/WardrobeContext.jsx'
import { useApp } from '../contexts/AppContext.jsx'
import { identifyItem } from '../services/api.js'
import { COLORS } from '../utils/constants.js'

export function IdentifyScreen() {
  const { speak } = useVoice()
  const { items } = useWardrobe()
  const { goBack } = useApp()
  const [phase, setPhase] = useState('camera') // camera | analyzing | result | error
  const [result, setResult] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  const handleCapture = useCallback(async (blob, dataUrl) => {
    setPhase('analyzing')
    setPreviewUrl(dataUrl)
    speak('Searching your wardrobe. One moment.')
    try {
      const data = await identifyItem(blob, items)
      setResult(data)
      setPhase('result')

      if (data.matched_id && data.matched_id !== 'none' && data.confidence !== 'low') {
        const matched = items.find((i) => String(i.id) === String(data.matched_id))
        const idx = matched ? items.indexOf(matched) + 1 : null
        const spoken = data.spoken || (matched
          ? `This looks like item ${idx}: ${matched.name}.`
          : 'I found a match in your wardrobe.')
        speak(spoken)
      } else {
        speak(data.spoken || "I couldn't confidently match this to any saved item.")
      }
    } catch (err) {
      const msg = err.message || 'Could not identify the item. Please try again.'
      setErrorMsg(msg); speak(msg); setPhase('error')
    }
  }, [items, speak])

  const reset = useCallback(() => {
    setPhase('camera'); setResult(null); setPreviewUrl(null); setErrorMsg('')
    speak('Ready. Point the camera at a clothing item from your wardrobe.')
  }, [speak])

  const matchedItem = result?.matched_id && result.matched_id !== 'none'
    ? items.find((i) => String(i.id) === String(result.matched_id))
    : null
  const matchedIndex = matchedItem ? items.indexOf(matchedItem) + 1 : null

  if (phase === 'camera') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{
          background: COLORS.BG, borderBottom: `2px solid ${COLORS.BORDER}`,
          padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
        }}>
          <button onClick={goBack} aria-label="Go back" style={{
            width: 44, height: 44, minWidth: 44, border: `2px solid ${COLORS.BORDER}`,
            borderRadius: COLORS.RADIUS, background: 'transparent', color: COLORS.TEXT,
            fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
          }}>←</button>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: COLORS.TEXT, lineHeight: 1.1 }}>Identify Item</div>
            <div style={{ fontSize: 12, color: COLORS.TEXT_MUTED, marginTop: 2 }}>
              {items.length} wardrobe item{items.length !== 1 ? 's' : ''} to match against
            </div>
          </div>
        </div>
        <CameraCapture
          onCapture={handleCapture}
          onFrameDescribed={(t) => speak(t)}
          aspectRatio="unset"
        />
      </div>
    )
  }

  if (phase === 'analyzing') {
    return (
      <Screen title="Searching…" subtitle="Matching against your wardrobe.">
        {previewUrl && <img src={previewUrl} alt="" style={{ width: '100%', borderRadius: COLORS.RADIUS, marginBottom: 20, maxHeight: 300, objectFit: 'cover', border: `2px solid ${COLORS.BORDER}` }} />}
        <div role="status" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 40, gap: 20 }}>
          <LoadingBars />
          <p aria-live="polite" style={{ color: COLORS.TEXT_MUTED, fontSize: 12, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', margin: 0 }}>Matching against wardrobe…</p>
        </div>
      </Screen>
    )
  }

  if (phase === 'error') {
    return (
      <Screen title="Couldn't Identify" subtitle="Try a clearer photo.">
        {previewUrl && <img src={previewUrl} alt="" style={{ width: '100%', borderRadius: COLORS.RADIUS, marginBottom: 20, maxHeight: 280, objectFit: 'cover', opacity: 0.55, border: `2px solid ${COLORS.BORDER}` }} />}
        <div role="alert" style={{ border: `2px solid ${COLORS.DANGER}`, borderRadius: COLORS.RADIUS, padding: 18, marginBottom: 20, background: COLORS.SURFACE }}>
          <p style={{ fontSize: 15, color: COLORS.DANGER, lineHeight: 1.7, margin: 0 }}>{errorMsg}</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <BigButton label="Try Again" icon="📸" variant="primary" onClick={reset} />
        </div>
      </Screen>
    )
  }

  // Result
  const isMatch = matchedItem && result?.confidence !== 'low'
  const confidenceColor = result?.confidence === 'high' ? COLORS.SUCCESS
    : result?.confidence === 'medium' ? COLORS.ACCENT
    : COLORS.TEXT_MUTED

  return (
    <Screen title="Identify Result" subtitle={isMatch ? 'Item found in wardrobe' : 'No confident match'}>
      {previewUrl && <img src={previewUrl} alt="Captured item" style={{ width: '100%', borderRadius: COLORS.RADIUS, marginBottom: 16, maxHeight: 260, objectFit: 'cover', border: `2px solid ${COLORS.BORDER}` }} />}

      {isMatch ? (
        <div style={{ border: `2px solid ${COLORS.ACCENT}`, borderRadius: COLORS.RADIUS, marginBottom: 16, overflow: 'hidden' }}>
          <div style={{ padding: '8px 14px', background: COLORS.SURFACE, borderBottom: `2px solid ${COLORS.BORDER}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: COLORS.TEXT_MUTED }}>Matched Item</span>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: confidenceColor }}>{result.confidence} confidence</span>
          </div>
          <div style={{ padding: 14, background: COLORS.BG }}>
            <div style={{ fontSize: 18, fontWeight: 700, color: COLORS.TEXT, marginBottom: 4 }}>
              Item {matchedIndex}: {matchedItem.name}
            </div>
            <div style={{ fontSize: 13, color: COLORS.TEXT_MUTED, marginBottom: 8 }}>
              {matchedItem.category}{matchedItem.color ? ` · ${matchedItem.color}` : ''}
            </div>
            {matchedItem.description && (
              <p style={{ fontSize: 14, color: COLORS.TEXT, lineHeight: 1.7, margin: 0 }}>{matchedItem.description}</p>
            )}
          </div>
        </div>
      ) : (
        <div style={{ border: `2px solid ${COLORS.BORDER}`, borderRadius: COLORS.RADIUS, padding: 18, marginBottom: 16, background: COLORS.SURFACE }}>
          <p style={{ fontSize: 15, color: COLORS.TEXT_MUTED, lineHeight: 1.7, margin: 0 }}>
            {result?.spoken || "This item doesn't closely match anything saved in your wardrobe."}
          </p>
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <BigButton
          label="Read Result"
          icon="🔊"
          variant="primary"
          onClick={() => speak(result?.spoken || (isMatch ? `Item ${matchedIndex}: ${matchedItem.name}.` : "No match found."))}
        />
        <BigButton label="Try Another Item" icon="📸" onClick={reset} />
        <BigButton label="Back to Wardrobe" icon="←" onClick={goBack} />
      </div>
    </Screen>
  )
}

function LoadingBars() {
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center', height: 40 }}>
      {[0,1,2,3,4].map(i => (
        <span key={i} style={{ display: 'block', width: 6, background: COLORS.ACCENT, borderRadius: 0, animation: `ibar 800ms ease-in-out infinite`, animationDelay: `${i * 100}ms`, height: '100%' }} />
      ))}
      <style>{`@keyframes ibar { 0%,100%{transform:scaleY(0.3)} 50%{transform:scaleY(1)} }`}</style>
    </div>
  )
}
