import { useState, useCallback, useEffect, useRef } from 'react'
import { CameraCapture } from '../components/CameraCapture.jsx'
import { useVoice } from '../contexts/VoiceContext.jsx'
import { useWardrobe } from '../contexts/WardrobeContext.jsx'
import { analyzeImage } from '../services/api.js'
import { COLORS } from '../utils/constants.js'

const LIVE_INTERVAL_MS = 6500

export function ShoppingScreen() {
  const { speak } = useVoice()
  const { items: wardrobeItems } = useWardrobe()
  const [liveEnabled, setLiveEnabled] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [detailsOpen, setDetailsOpen] = useState(false)
  const analyzingRef = useRef(false)
  const lastSpokenRef = useRef('')
  const captureRef = useRef(null)
  const emptyWardrobe = wardrobeItems.length === 0

  useEffect(() => {
    speak(emptyWardrobe
      ? 'Live shopping mode. Point the camera at clothing for style advice.'
      : 'Live shopping mode. I will compare clothing with your wardrobe.')
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!liveEnabled) return
    const id = setInterval(() => { captureRef.current?.() }, LIVE_INTERVAL_MS)
    return () => clearInterval(id)
  }, [liveEnabled])

  const handleCapture = useCallback(async (blob) => {
    if (!liveEnabled || analyzingRef.current) return
    analyzingRef.current = true; setAnalyzing(true); setErrorMsg('')
    try {
      const wardrobeContext = emptyWardrobe ? '' : wardrobeItems.map((i) => `${i.name}: ${i.description || i.category || ''}`).join('\n')
      const data = await analyzeImage(blob, { occasion: wardrobeContext ? `Wardrobe context:\n${wardrobeContext}` : '', mode: 'shopping' })
      setResult(data); setDetailsOpen(false)
      const summary = (data.speech_segments || []).map((s) => s.text).join(' ')
      const key = summary.toLowerCase().trim()
      if (key !== lastSpokenRef.current) { speak(summary); lastSpokenRef.current = key }
      setLiveEnabled(false)
    } catch (err) {
      setErrorMsg(err.message || 'Having trouble reading the item. I will keep trying.')
    } finally {
      analyzingRef.current = false; setAnalyzing(false)
    }
  }, [liveEnabled, emptyWardrobe, wardrobeItems, speak])

  const continueScan = useCallback(() => {
    setLiveEnabled(true); setResult(null); setErrorMsg(''); lastSpokenRef.current = ''
    speak('Scanning resumed.')
  }, [speak])

  useEffect(() => {
    const handler = (e) => {
      const cmd = e.detail
      if (cmd.type === 'PAUSE_SCAN' && liveEnabled) { setLiveEnabled(false); speak('Scanning paused.') }
      else if (cmd.type === 'RESUME_SCAN' && !liveEnabled) continueScan()
      else if (cmd.type === 'READ_RESULT' && result) speak((result.speech_segments || []).map((s) => s.text).join(' '))
    }
    window.addEventListener('voiceCommand', handler)
    return () => window.removeEventListener('voiceCommand', handler)
  }, [liveEnabled, result, continueScan, speak])

  const verdictSeg = result?.speech_segments?.find((s) => s.id === 'verdict')
  const detailSegs = result?.speech_segments?.filter((s) => s.id !== 'verdict') ?? []
  const verdictColor = verdictSeg?.text?.match(/worth|works|great/i) ? COLORS.SUCCESS
    : verdictSeg?.text?.match(/clash|avoid|not worth/i) ? COLORS.DANGER
    : COLORS.ACCENT

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Camera */}
      <div style={{ flex: 1, position: 'relative', minHeight: '44vh' }}>
        <CameraCapture captureRef={captureRef} onCapture={handleCapture} aspectRatio="unset" />

        <div style={{ position: 'absolute', top: 10, left: 10, background: COLORS.BG, border: `2px solid ${analyzing ? COLORS.ACCENT : liveEnabled ? COLORS.SUCCESS : COLORS.BORDER}`, borderRadius: COLORS.RADIUS, padding: '6px 12px' }}>
          <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.5, color: analyzing ? COLORS.ACCENT : liveEnabled ? COLORS.SUCCESS : COLORS.TEXT_MUTED }}>
            {analyzing ? 'CHECKING' : liveEnabled ? '● LIVE' : '⏸ PAUSED'}
          </span>
        </div>
        <div style={{ position: 'absolute', top: 10, right: 10, background: COLORS.BG, border: `2px solid ${COLORS.BORDER}`, borderRadius: COLORS.RADIUS, padding: '6px 12px' }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: emptyWardrobe ? COLORS.TEXT_DIM : COLORS.SUCCESS }}>
            {emptyWardrobe ? 'No wardrobe' : `${wardrobeItems.length} items`}
          </span>
        </div>
      </div>

      {/* Panel */}
      <div style={{ background: COLORS.BG, borderTop: `2px solid ${COLORS.BORDER}`, padding: '16px 16px 32px', maxHeight: '56vh', overflowY: 'auto' }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', color: COLORS.TEXT_MUTED, marginBottom: 12 }}>
          LIVE SHOPPING
        </div>

        {!result && !errorMsg && (
          <p aria-live="polite" style={{ fontSize: 15, color: COLORS.TEXT_MUTED, lineHeight: 1.7, marginBottom: 14 }}>
            {emptyWardrobe ? 'Point the camera at clothing for style advice.' : 'Point the camera at clothing to compare with your wardrobe.'}
          </p>
        )}

        {errorMsg && !result && (
          <div role="status" style={{ border: `2px solid ${COLORS.DANGER}`, borderRadius: COLORS.RADIUS, padding: 14, marginBottom: 14, background: COLORS.SURFACE }}>
            <p style={{ fontSize: 14, color: COLORS.DANGER, lineHeight: 1.6, margin: 0 }}>{errorMsg}</p>
          </div>
        )}

        {result && (
          <>
            {verdictSeg && (
              <div style={{ border: `2px solid ${verdictColor}`, borderRadius: COLORS.RADIUS, padding: 14, marginBottom: 12, background: COLORS.SURFACE }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: verdictColor, marginBottom: 6 }}>Verdict</div>
                <p style={{ fontSize: 15, color: COLORS.TEXT, lineHeight: 1.6, margin: 0 }}>{verdictSeg.text}</p>
              </div>
            )}
            {detailSegs.length > 0 && (
              <>
                <button onClick={() => setDetailsOpen((o) => !o)}
                  style={{ fontSize: 12, fontWeight: 700, color: COLORS.ACCENT, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 10, padding: 0, letterSpacing: 0.5 }}>
                  {detailsOpen ? '▲ Hide Details' : '▼ Show Details'}
                </button>
                {detailsOpen && detailSegs.map((seg, i) => (
                  <div key={i} style={{ border: `2px solid ${COLORS.BORDER}`, borderRadius: COLORS.RADIUS, padding: 14, marginBottom: 8, background: COLORS.SURFACE }}>
                    <p style={{ fontSize: 14, color: COLORS.TEXT, lineHeight: 1.7, margin: 0 }}>{seg.text}</p>
                  </div>
                ))}
              </>
            )}
          </>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
          {!liveEnabled && result ? (
            <button onClick={continueScan} style={{ flex: 1, minHeight: 56, border: `2px solid ${COLORS.SUCCESS}`, borderRadius: COLORS.RADIUS, background: 'transparent', color: COLORS.SUCCESS, fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
              Continue
            </button>
          ) : (
            <button onClick={() => { setLiveEnabled(false); speak('Scanning paused.') }} disabled={!liveEnabled || analyzing}
              style={{ flex: 1, minHeight: 56, border: `2px solid ${COLORS.DANGER}`, borderRadius: COLORS.RADIUS, background: 'transparent', color: COLORS.DANGER, fontSize: 15, fontWeight: 700, cursor: liveEnabled && !analyzing ? 'pointer' : 'not-allowed', opacity: liveEnabled && !analyzing ? 1 : 0.5 }}>
              Pause
            </button>
          )}
          <button disabled={!result} onClick={() => result && speak((result.speech_segments || []).map((s) => s.text).join(' '))}
            style={{ flex: 1, minHeight: 56, border: `2px solid ${COLORS.BORDER}`, borderRadius: COLORS.RADIUS, background: COLORS.SURFACE, color: result ? COLORS.TEXT : COLORS.TEXT_DIM, fontSize: 15, fontWeight: 700, cursor: result ? 'pointer' : 'not-allowed', opacity: result ? 1 : 0.45 }}>
            Read Again
          </button>
        </div>
      </div>
    </div>
  )
}
