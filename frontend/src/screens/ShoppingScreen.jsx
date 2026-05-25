import { useState, useCallback, useEffect, useRef } from 'react'
import { CameraCapture } from '../components/CameraCapture.jsx'
import { useVoice } from '../contexts/VoiceContext.jsx'
import { useWardrobe } from '../contexts/WardrobeContext.jsx'
import { useApp } from '../contexts/AppContext.jsx'
import { useProfile } from '../contexts/ProfileContext.jsx'
import { shoppingAnalyze } from '../services/api.js'
import { COLORS } from '../utils/constants.js'

export function ShoppingScreen() {
  const { speak, language } = useVoice()
  const { items: wardrobeItems } = useWardrobe()
  const { goBack } = useApp()
  const { profileContext } = useProfile()

  const [phase, setPhase] = useState('camera') // 'camera' | 'analyzing' | 'result'
  const [result, setResult] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [capturedUrl, setCapturedUrl] = useState(null)
  const analyzingRef = useRef(false)
  const cameraRef = useRef(null)

  const topsInWardrobe    = wardrobeItems.filter((i) => i.category === 'tops')
  const bottomsInWardrobe = wardrobeItems.filter((i) => i.category === 'bottoms')
  const emptyWardrobe     = wardrobeItems.length === 0

  useEffect(() => {
    const wardrobeNote = emptyWardrobe
      ? 'Tap the camera button to scan a clothing item for style advice.'
      : `Tap the camera button to scan a top or bottom. I will check it against your ${wardrobeItems.length} wardrobe items.`
    speak(`Shopping mode. ${wardrobeNote} Say "describe this" at any time to hear colour, pattern, and fabric details.`)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Voice: "describe this" triggers a live frame description ──────────────
  useEffect(() => {
    const handler = (e) => {
      const cmd = e.detail
      if (cmd.type === 'DESCRIBE_FRAME' && phase === 'camera') {
        cameraRef.current?.describe?.()
      }
    }
    window.addEventListener('voiceCommand', handler)
    return () => window.removeEventListener('voiceCommand', handler)
  }, [phase])

  const handleCapture = useCallback(async (blob, dataUrl) => {
    if (analyzingRef.current) return
    analyzingRef.current = true
    setCapturedUrl(dataUrl)
    setPhase('analyzing')
    setErrorMsg('')
    speak('Analyzing the item. This may take a few seconds.')

    try {
      const data = await shoppingAnalyze(blob, wardrobeItems, profileContext)
      setResult(data)
      setPhase('result')
      const spoken = (data.speech_segments || []).map((s) => s.text).join('  ')
      speak(spoken)
    } catch (err) {
      const msg = err.message || 'Could not analyze the item. Please try a clearer photo.'
      setErrorMsg(msg)
      speak(msg)
      setPhase('camera')
    } finally {
      analyzingRef.current = false
    }
  }, [wardrobeItems, profileContext, speak])

  const reset = useCallback(() => {
    setResult(null)
    setErrorMsg('')
    setCapturedUrl(null)
    setPhase('camera')
    speak('Ready. Tap the camera button to scan another item.')
  }, [speak])

  // ── Analyzing phase ────────────────────────────────────────────────────────
  if (phase === 'analyzing') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Header goBack={goBack} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, gap: 24 }}>
          {capturedUrl && (
            <img src={capturedUrl} alt="" style={{ width: '100%', maxHeight: 260, objectFit: 'cover', border: `2px solid ${COLORS.BORDER}`, borderRadius: COLORS.RADIUS, opacity: 0.7 }} />
          )}
          <LoadingBars />
          <p role="status" aria-live="polite" style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', color: COLORS.TEXT_MUTED, margin: 0, textAlign: 'center' }}>
            Checking against your wardrobe…
          </p>
          <p style={{ fontSize: 12, color: COLORS.TEXT_DIM, margin: 0, textAlign: 'center' }}>
            This usually takes 5–10 seconds
          </p>
        </div>
      </div>
    )
  }

  // ── Result phase ───────────────────────────────────────────────────────────
  if (phase === 'result' && result) {
    const isYes = result.buy_verdict === 'yes'
    const verdictColor = isYes ? COLORS.SUCCESS : COLORS.DANGER
    const verdictLabel = isYes ? 'Yes — Buy It' : 'No — Skip It'

    const itemSeg     = result.speech_segments?.find((s) => s.id === 'item')
    const verdictSeg  = result.speech_segments?.find((s) => s.id === 'verdict')
    const compatSeg   = result.speech_segments?.find((s) => s.id === 'compatible')
    const incompatSeg = result.speech_segments?.find((s) => s.id === 'incompatible')

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Header goBack={goBack} />
        <div className="scroll" style={{ flex: 1, padding: '16px 14px 32px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Captured photo */}
          {capturedUrl && (
            <img src={capturedUrl} alt="Scanned item" style={{ width: '100%', maxHeight: 240, objectFit: 'cover', border: `2px solid ${COLORS.BORDER}`, borderRadius: COLORS.RADIUS }} />
          )}

          {/* Item description */}
          {itemSeg && (
            <div style={{ border: `2px solid ${COLORS.BORDER}`, borderRadius: COLORS.RADIUS, padding: 14, background: COLORS.SURFACE }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: COLORS.TEXT_DIM, marginBottom: 6 }}>Detected</div>
              <p style={{ fontSize: 15, color: COLORS.TEXT, lineHeight: 1.6, margin: 0 }}>{itemSeg.text}</p>
            </div>
          )}

          {/* Buy verdict — big clear banner */}
          <div style={{ border: `3px solid ${verdictColor}`, borderRadius: COLORS.RADIUS, padding: 18, background: COLORS.SURFACE, textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 900, color: verdictColor, letterSpacing: 1, marginBottom: 8 }}>{verdictLabel}</div>
            {verdictSeg && <p style={{ fontSize: 14, color: COLORS.TEXT, lineHeight: 1.65, margin: 0 }}>{verdictSeg.text}</p>}
          </div>

          {/* Compatible wardrobe items */}
          {result.compatible_items?.length > 0 && (
            <div aria-label={`Pairs well with: ${result.compatible_items.join(', ')}`} style={{ border: `2px solid ${COLORS.SUCCESS}`, borderRadius: COLORS.RADIUS, padding: 14, background: COLORS.SURFACE }}>
              <div aria-hidden style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: COLORS.SUCCESS, marginBottom: 8 }}>Pairs well with</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {result.compatible_items.map((name) => (
                  <span key={name} style={{ border: `2px solid ${COLORS.SUCCESS}`, borderRadius: COLORS.RADIUS, padding: '4px 10px', fontSize: 12, fontWeight: 700, color: COLORS.SUCCESS }}>{name}</span>
                ))}
              </div>
            </div>
          )}

          {/* Incompatible wardrobe items */}
          {result.incompatible_items?.length > 0 && (
            <div aria-label={`Clashes with: ${result.incompatible_items.join(', ')}`} style={{ border: `2px solid ${COLORS.DANGER}`, borderRadius: COLORS.RADIUS, padding: 14, background: COLORS.SURFACE }}>
              <div aria-hidden style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: COLORS.DANGER, marginBottom: 8 }}>Clashes with</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {result.incompatible_items.map((name) => (
                  <span key={name} style={{ border: `2px solid ${COLORS.DANGER}`, borderRadius: COLORS.RADIUS, padding: '4px 10px', fontSize: 12, fontWeight: 700, color: COLORS.DANGER }}>{name}</span>
                ))}
              </div>
            </div>
          )}

          {!result.has_wardrobe && (
            <p style={{ fontSize: 13, color: COLORS.TEXT_DIM, textAlign: 'center', margin: 0 }}>
              Add tops and bottoms to your wardrobe for specific compatibility checks.
            </p>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button onClick={reset} aria-label="Scan another item"
              style={{ flex: 1, minHeight: 52, border: `2px solid ${COLORS.BORDER}`, borderRadius: COLORS.RADIUS, background: COLORS.SURFACE, color: COLORS.TEXT, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              Scan Another
            </button>
            <button onClick={() => speak((result.speech_segments || []).map((s) => s.text).join('  '))} aria-label="Read shopping result again"
              style={{ flex: 1, minHeight: 52, border: `2px solid ${COLORS.ACCENT}`, borderRadius: COLORS.RADIUS, background: 'transparent', color: COLORS.ACCENT, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              Read Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Camera phase ───────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Header goBack={goBack} />

      {errorMsg && (
        <div role="alert" style={{ margin: '10px 14px 0', border: `2px solid ${COLORS.DANGER}`, borderRadius: COLORS.RADIUS, padding: '10px 14px', background: COLORS.SURFACE }}>
          <p style={{ fontSize: 13, color: COLORS.DANGER, margin: 0 }}>{errorMsg}</p>
        </div>
      )}

      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <CameraCapture
          onCapture={handleCapture}
          captureRef={cameraRef}
          onFrameDescribed={(t) => speak(t)}
          describeMode="shopping"
          language={language}
          aspectRatio="unset"
        />
        <div style={{ position: 'absolute', bottom: 16, left: 14, right: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ background: 'rgba(10,10,8,0.85)', border: `2px solid ${COLORS.BORDER}`, borderRadius: COLORS.RADIUS, padding: '6px 14px', textAlign: 'center' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: COLORS.ACCENT, margin: 0, letterSpacing: 0.5 }}>
              Say "describe this" — hear colour, pattern &amp; fabric
            </p>
          </div>
          <div style={{ background: COLORS.BG, border: `2px solid ${COLORS.BORDER}`, borderRadius: COLORS.RADIUS, padding: '8px 16px', textAlign: 'center' }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: COLORS.TEXT_MUTED, margin: 0 }}>
              {emptyWardrobe
                ? 'Tap the shutter button to scan any clothing item'
                : `Tap shutter to scan a top or bottom — ${topsInWardrobe.length} top${topsInWardrobe.length !== 1 ? 's' : ''} and ${bottomsInWardrobe.length} bottom${bottomsInWardrobe.length !== 1 ? 's' : ''} in wardrobe`}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function Header({ goBack }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderBottom: `2px solid ${COLORS.BORDER}`, background: COLORS.BG, flexShrink: 0 }}>
      <button onClick={goBack} aria-label="Go back"
        style={{ width: 44, height: 44, minWidth: 44, border: `2px solid ${COLORS.BORDER}`, borderRadius: COLORS.RADIUS, background: 'transparent', color: COLORS.TEXT, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
        ←
      </button>
      <div>
        <div style={{ fontSize: 17, fontWeight: 700, color: COLORS.TEXT, lineHeight: 1.1 }}>Shopping Mode</div>
        <div style={{ fontSize: 12, color: COLORS.TEXT_MUTED, marginTop: 2 }}>Scan a top or bottom to check wardrobe compatibility</div>
      </div>
    </div>
  )
}

function LoadingBars() {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', height: 48 }}>
      {[0, 1, 2, 3, 4].map(i => (
        <span key={i} style={{ display: 'block', width: 8, background: COLORS.ACCENT, borderRadius: 0, animation: `sbar 800ms ease-in-out infinite`, animationDelay: `${i * 100}ms`, height: '100%' }} />
      ))}
      <style>{`@keyframes sbar { 0%,100%{transform:scaleY(0.25)} 50%{transform:scaleY(1)} }`}</style>
    </div>
  )
}
