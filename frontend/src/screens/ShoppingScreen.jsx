import { useState, useCallback, useEffect, useRef } from 'react'
import { CameraCapture } from '../components/CameraCapture.jsx'
import { useVoice } from '../contexts/VoiceContext.jsx'
import { useWardrobe } from '../contexts/WardrobeContext.jsx'
import { useApp } from '../contexts/AppContext.jsx'
import { shoppingAnalyze } from '../services/api.js'
import { COLORS } from '../utils/constants.js'

const LIVE_INTERVAL_MS = 7000

export function ShoppingScreen() {
  const { speak } = useVoice()
  const { items: wardrobeItems } = useWardrobe()
  const { goBack } = useApp()
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
      : `Shopping mode. I will compare against your ${wardrobeItems.length} wardrobe items.`)
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
      const data = await shoppingAnalyze(blob, wardrobeItems)
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
  }, [liveEnabled, wardrobeItems, speak])

  const continueScan = useCallback(() => {
    setLiveEnabled(true); setResult(null); setErrorMsg(''); lastSpokenRef.current = ''
    speak('Scanning resumed. Point at the next item.')
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
  const otherSegs = result?.speech_segments?.filter((s) => s.id !== 'verdict') ?? []
  const verdictColor = verdictSeg?.text?.match(/worth|good|works|great|buy/i) ? COLORS.SUCCESS
    : verdictSeg?.text?.match(/clash|avoid|not worth|skip/i) ? COLORS.DANGER
    : COLORS.ACCENT

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header with back button */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px',
        borderBottom: `2px solid ${COLORS.BORDER}`, background: COLORS.BG, flexShrink: 0,
      }}>
        <button onClick={goBack} aria-label="Go back"
          style={{ width: 44, height: 44, minWidth: 44, border: `2px solid ${COLORS.BORDER}`, borderRadius: COLORS.RADIUS, background: 'transparent', color: COLORS.TEXT, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}>
          ←
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 17, fontWeight: 700, color: COLORS.TEXT, lineHeight: 1.1 }}>Shopping Mode</div>
          <div style={{ fontSize: 12, color: COLORS.TEXT_MUTED, marginTop: 2 }}>
            {emptyWardrobe ? 'Style advice only' : `${wardrobeItems.length} wardrobe items loaded`}
          </div>
        </div>
        {/* Live status */}
        <div style={{
          border: `2px solid ${analyzing ? COLORS.ACCENT : liveEnabled ? COLORS.SUCCESS : COLORS.BORDER}`,
          borderRadius: COLORS.RADIUS, padding: '4px 10px', flexShrink: 0,
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: analyzing ? COLORS.ACCENT : liveEnabled ? COLORS.SUCCESS : COLORS.TEXT_DIM }}>
            {analyzing ? 'Checking' : liveEnabled ? '● Live' : 'Paused'}
          </span>
        </div>
      </div>

      {/* Camera */}
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        <CameraCapture captureRef={captureRef} onCapture={handleCapture} aspectRatio="unset" />
        {!result && !errorMsg && (
          <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', background: COLORS.BG, border: `2px solid ${COLORS.BORDER}`, borderRadius: COLORS.RADIUS, padding: '8px 16px', textAlign: 'center', whiteSpace: 'nowrap' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.TEXT_MUTED }}>Point at a clothing item to scan</span>
          </div>
        )}
      </div>

      {/* Result panel */}
      <div style={{ background: COLORS.BG, borderTop: `2px solid ${COLORS.BORDER}`, padding: '14px 14px 28px', flexShrink: 0, maxHeight: '52%', overflowY: 'auto' }}>

        {errorMsg && !result && (
          <div role="status" style={{ border: `2px solid ${COLORS.DANGER}`, borderRadius: COLORS.RADIUS, padding: 12, marginBottom: 12, background: COLORS.SURFACE }}>
            <p style={{ fontSize: 13, color: COLORS.DANGER, lineHeight: 1.6, margin: 0 }}>{errorMsg}</p>
          </div>
        )}

        {result && (
          <>
            {verdictSeg && (
              <div style={{ border: `2px solid ${verdictColor}`, borderRadius: COLORS.RADIUS, padding: 14, marginBottom: 10, background: COLORS.SURFACE }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: verdictColor, marginBottom: 6 }}>Verdict</div>
                <p style={{ fontSize: 15, color: COLORS.TEXT, lineHeight: 1.6, margin: 0 }}>{verdictSeg.text}</p>
              </div>
            )}

            {/* Occasions + archetypes chips */}
            {(result.suitable_occasions?.length > 0 || result.top_archetypes?.length > 0) && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
                {(result.suitable_occasions || []).map((o) => (
                  <span key={o} style={{ border: `2px solid ${COLORS.ACCENT}`, borderRadius: COLORS.RADIUS, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: COLORS.ACCENT }}>{o}</span>
                ))}
                {(result.top_archetypes || []).map((a) => (
                  <span key={a} style={{ border: `2px solid ${COLORS.BORDER}`, borderRadius: COLORS.RADIUS, padding: '3px 10px', fontSize: 11, fontWeight: 700, color: COLORS.TEXT_MUTED }}>{a}</span>
                ))}
              </div>
            )}

            {otherSegs.length > 0 && (
              <>
                <button onClick={() => setDetailsOpen((o) => !o)}
                  style={{ fontSize: 12, fontWeight: 700, color: COLORS.ACCENT, background: 'none', border: 'none', cursor: 'pointer', marginBottom: 8, padding: 0, letterSpacing: 0.5 }}>
                  {detailsOpen ? '▲ Hide Details' : '▼ Full Analysis'}
                </button>
                {detailsOpen && otherSegs.map((seg, i) => (
                  <div key={i} style={{ border: `2px solid ${COLORS.BORDER}`, borderRadius: COLORS.RADIUS, padding: 12, marginBottom: 8, background: COLORS.SURFACE }}>
                    <p style={{ fontSize: 14, color: COLORS.TEXT, lineHeight: 1.7, margin: 0 }}>{seg.text}</p>
                  </div>
                ))}
              </>
            )}
          </>
        )}

        {!result && !errorMsg && (
          <p style={{ fontSize: 14, color: COLORS.TEXT_MUTED, lineHeight: 1.6, margin: '4px 0 12px' }}>
            {emptyWardrobe
              ? 'No wardrobe saved yet. I will give standalone style advice.'
              : 'Auto-scanning every 7 seconds. Scanning pauses after a verdict.'}
          </p>
        )}

        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          {!liveEnabled && result ? (
            <button onClick={continueScan} style={{ flex: 1, minHeight: 52, border: `2px solid ${COLORS.SUCCESS}`, borderRadius: COLORS.RADIUS, background: 'transparent', color: COLORS.SUCCESS, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              Scan Next Item
            </button>
          ) : (
            <button onClick={() => { setLiveEnabled(false); speak('Scanning paused.') }}
              disabled={!liveEnabled || analyzing}
              style={{ flex: 1, minHeight: 52, border: `2px solid ${COLORS.DANGER}`, borderRadius: COLORS.RADIUS, background: 'transparent', color: COLORS.DANGER, fontSize: 14, fontWeight: 700, cursor: liveEnabled && !analyzing ? 'pointer' : 'not-allowed', opacity: liveEnabled && !analyzing ? 1 : 0.5 }}>
              Pause
            </button>
          )}
          <button disabled={!result}
            onClick={() => result && speak((result.speech_segments || []).map((s) => s.text).join(' '))}
            style={{ flex: 1, minHeight: 52, border: `2px solid ${COLORS.BORDER}`, borderRadius: COLORS.RADIUS, background: COLORS.SURFACE, color: result ? COLORS.TEXT : COLORS.TEXT_DIM, fontSize: 14, fontWeight: 700, cursor: result ? 'pointer' : 'not-allowed', opacity: result ? 1 : 0.45 }}>
            Read Again
          </button>
        </div>
      </div>
    </div>
  )
}
