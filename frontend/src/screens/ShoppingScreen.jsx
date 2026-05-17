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
    const msg = emptyWardrobe
      ? 'Live shopping mode. Point the camera at clothing for style advice.'
      : 'Live shopping mode. I will compare clothing with your wardrobe.'
    speak(msg)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-capture loop
  useEffect(() => {
    if (!liveEnabled) return
    const id = setInterval(() => { captureRef.current?.() }, LIVE_INTERVAL_MS)
    return () => clearInterval(id)
  }, [liveEnabled])

  const handleCapture = useCallback(async (blob) => {
    if (!liveEnabled || analyzingRef.current) return
    analyzingRef.current = true
    setAnalyzing(true)
    setErrorMsg('')

    try {
      const wardrobeContext = emptyWardrobe ? '' : wardrobeItems.map((i) => `${i.name}: ${i.description || i.category || ''}`).join('\n')
      const data = await analyzeImage(blob, { occasion: wardrobeContext ? `Wardrobe context:\n${wardrobeContext}` : '', mode: 'shopping' })
      setResult(data)
      setDetailsOpen(false)

      const verdictSeg = data.speech_segments?.find((s) => s.id === 'verdict') || data.speech_segments?.[0]
      const summary = data.speech_segments?.map((s) => s.text).join(' ') || ''
      const key = summary.toLowerCase().trim()
      if (key !== lastSpokenRef.current) {
        speak(summary || verdictSeg?.text || '')
        lastSpokenRef.current = key
      }
      setLiveEnabled(false) // auto-pause after verdict
    } catch (err) {
      const msg = err.message || 'Having trouble reading the item. I will keep trying.'
      setErrorMsg(msg)
    } finally {
      analyzingRef.current = false
      setAnalyzing(false)
    }
  }, [liveEnabled, emptyWardrobe, wardrobeItems, speak])

  const continueScan = useCallback(() => {
    setLiveEnabled(true); setResult(null); setErrorMsg(''); lastSpokenRef.current = ''
    speak('Scanning resumed. Point the camera at the next item.')
  }, [speak])

  useEffect(() => {
    const handler = (e) => {
      const cmd = e.detail
      if (cmd.type === 'PAUSE_SCAN' && liveEnabled) { setLiveEnabled(false); speak('Scanning paused.') }
      else if (cmd.type === 'RESUME_SCAN' && !liveEnabled) continueScan()
      else if (cmd.type === 'READ_RESULT' && result) speak(result.speech_segments?.map((s) => s.text).join(' ') || '')
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

        <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.78)', borderRadius: 12, padding: '6px 14px' }}>
          <span style={{ fontSize: 12, color: emptyWardrobe ? COLORS.TEXT_MUTED : COLORS.SUCCESS }}>
            {emptyWardrobe ? 'No wardrobe' : `${wardrobeItems.length} items`}
          </span>
        </div>

        <div aria-live="polite" style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,0.82)', borderRadius: 12, border: `1px solid ${analyzing ? COLORS.ACCENT : liveEnabled ? COLORS.SUCCESS : COLORS.BORDER}`, padding: '8px 14px' }}>
          <span style={{ fontSize: 13, color: analyzing ? COLORS.ACCENT_LIGHT : liveEnabled ? COLORS.SUCCESS : COLORS.TEXT_MUTED }}>
            {analyzing ? 'Checking...' : liveEnabled ? '● Live' : '⏸ Paused'}
          </span>
        </div>
      </div>

      {/* Panel */}
      <div style={{ padding: 20, background: 'var(--bg)', borderTop: `2px solid ${COLORS.BORDER}`, maxHeight: '56vh', overflowY: 'auto' }}>
        <div style={{ fontSize: 11, color: COLORS.ACCENT_LIGHT, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 12, fontWeight: 600 }}>
          LIVE SHOPPING MODE
        </div>

        {!result && !errorMsg && (
          <p aria-live="polite" style={{ fontSize: 17, color: COLORS.TEXT_MUTED, lineHeight: 1.7, marginBottom: 14, fontFamily: 'var(--font-body)' }}>
            {emptyWardrobe ? 'Point the camera at clothing for style advice.' : 'Point the camera at clothing to compare with your wardrobe.'}
          </p>
        )}

        {errorMsg && !result && (
          <div role="status" style={{ background: 'rgba(239,68,68,0.1)', border: `1px solid ${COLORS.DANGER}`, borderRadius: 12, padding: 14, marginBottom: 14 }}>
            <p style={{ fontSize: 15, color: COLORS.DANGER, lineHeight: 1.6, margin: 0 }}>{errorMsg}</p>
          </div>
        )}

        {result && (
          <>
            {verdictSeg && (
              <div style={{ background: COLORS.SURFACE, borderRadius: 14, padding: '12px 16px', border: `2px solid ${verdictColor}`, marginBottom: 12 }}>
                <div style={{ fontSize: 10, color: verdictColor, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: 4 }}>Verdict</div>
                <p style={{ fontSize: 16, color: COLORS.TEXT, lineHeight: 1.6, margin: 0, fontFamily: 'var(--font-body)' }}>{verdictSeg.text}</p>
              </div>
            )}
            {detailSegs.length > 0 && (
              <>
                <button onClick={() => setDetailsOpen((o) => !o)}
                  style={{ fontSize: 13, color: COLORS.ACCENT_LIGHT, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 8, padding: 0 }}>
                  {detailsOpen ? 'Hide details ▲' : 'Show details ▼'}
                </button>
                {detailsOpen && detailSegs.map((seg, i) => (
                  <div key={i} style={{ background: COLORS.SURFACE, borderRadius: 12, padding: 14, border: `1px solid ${COLORS.BORDER}`, marginBottom: 10 }}>
                    <p style={{ fontSize: 15, color: COLORS.TEXT, lineHeight: 1.7, margin: 0, fontFamily: 'var(--font-body)' }}>{seg.text}</p>
                  </div>
                ))}
              </>
            )}
          </>
        )}

        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          {!liveEnabled && result ? (
            <button onClick={continueScan}
              style={{ flex: 1, minHeight: 64, borderRadius: 14, border: 'none', background: COLORS.SUCCESS, color: '#fff', fontSize: 18, fontWeight: 900, cursor: 'pointer' }}>
              Continue Scanning
            </button>
          ) : (
            <button onClick={() => { setLiveEnabled(false); speak('Scanning paused.') }} disabled={!liveEnabled || analyzing}
              style={{ flex: 1, minHeight: 64, borderRadius: 14, border: 'none', background: COLORS.DANGER, color: '#fff', fontSize: 18, fontWeight: 900, cursor: liveEnabled && !analyzing ? 'pointer' : 'not-allowed', opacity: liveEnabled && !analyzing ? 1 : 0.6 }}>
              Pause
            </button>
          )}
          <button disabled={!result && !errorMsg}
            onClick={() => { if (result) speak(result.speech_segments?.map((s) => s.text).join(' ') || '') }}
            style={{ flex: 1, minHeight: 64, borderRadius: 14, border: `2px solid ${COLORS.BORDER}`, background: COLORS.SURFACE, color: result || errorMsg ? COLORS.TEXT : COLORS.TEXT_MUTED, fontSize: 18, fontWeight: 900, cursor: result || errorMsg ? 'pointer' : 'not-allowed', opacity: result || errorMsg ? 1 : 0.45 }}>
            Read Again
          </button>
        </div>
      </div>
    </div>
  )
}
