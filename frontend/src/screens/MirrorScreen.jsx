import { useRef, useState, useCallback } from 'react'
import { useApp } from '../contexts/AppContext.jsx'
import { useSpeechOutput } from '../hooks/useSpeechOutput.jsx'
import { CameraCapture } from '../components/CameraCapture.jsx'
import { analyzeImage } from '../services/api.js'
import { COLORS } from '../utils/constants.js'

const STATE = { CAMERA: 'CAMERA', LOADING: 'LOADING', RESULT: 'RESULT', ERROR: 'ERROR' }

export function MirrorScreen() {
  const { goBack } = useApp()
  const { speak, stop } = useSpeechOutput()
  const captureRef = useRef(null)
  const [state, setState] = useState(STATE.CAMERA)
  const [preview, setPreview] = useState(null)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const handleCapture = useCallback(async (blob, dataUrl) => {
    setPreview(dataUrl)
    setState(STATE.LOADING)
    try {
      const data = await analyzeImage(blob, { mode: 'mirror' })
      setResult(data)
      setState(STATE.RESULT)
      const text = data.speech_segments.map((s) => s.text).join(' ')
      speak(text)
      if (data.personal_appearance) speak(data.personal_appearance)
    } catch (e) {
      setError(e.message)
      setState(STATE.ERROR)
      speak(e.message)
    }
  }, [speak])

  const reset = useCallback(() => {
    stop(); setResult(null); setError(''); setPreview(null); setState(STATE.CAMERA)
  }, [stop])

  return (
    <div className="screen">
      <div style={{ padding: '16px 16px 8px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <button onClick={() => { stop(); goBack() }} aria-label="Go back"
          style={{ fontSize: 20, color: COLORS.TEXT_MUTED, minHeight: 44, minWidth: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>←</button>
        <h2 style={{ fontWeight: 700, fontSize: 18 }}>Mirror Check</h2>
      </div>

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', margin: '0 12px' }}>
        {state === STATE.CAMERA && (
          <CameraCapture captureRef={captureRef} onCapture={handleCapture} aspectRatio="unset" facingMode="user" />
        )}
        {state === STATE.LOADING && (
          <div style={{ position: 'absolute', inset: 0, background: '#000', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
            {preview && <img src={preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.4 }} />}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', border: `3px solid ${COLORS.ACCENT}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
              <p style={{ color: COLORS.ACCENT_LIGHT, fontSize: 15 }}>Analyzing your look...</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
            </div>
          </div>
        )}
        {state === STATE.RESULT && result && (
          <div className="scroll" style={{ position: 'absolute', inset: 0, borderRadius: 'var(--radius)', background: 'var(--bg-card)', border: '1px solid var(--border)', padding: 20 }}>
            {result.speech_segments.map((s, i) => (
              <p key={i} style={{ fontSize: 15, fontFamily: 'var(--font-body)', lineHeight: 1.7, marginBottom: 12 }}>{s.text}</p>
            ))}
            {result.personal_appearance && (
              <p style={{ fontSize: 14, color: COLORS.ACCENT_LIGHT, lineHeight: 1.6, marginTop: 8 }}>{result.personal_appearance}</p>
            )}
          </div>
        )}
        {state === STATE.ERROR && (
          <div style={{ position: 'absolute', inset: 0, borderRadius: 'var(--radius)', background: 'var(--bg-card)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12, textAlign: 'center' }}>
            <p style={{ fontSize: 32 }}>⚠️</p>
            <p style={{ fontSize: 15, color: COLORS.DANGER, lineHeight: 1.6 }}>{error}</p>
          </div>
        )}
      </div>

      <div style={{ padding: '12px 16px', paddingBottom: 'max(16px, env(safe-area-inset-bottom))', flexShrink: 0 }}>
        {(state === STATE.RESULT || state === STATE.ERROR) && (
          <button onClick={reset}
            style={{ width: '100%', padding: '15px 0', borderRadius: 14, fontWeight: 700, fontSize: 15, background: `linear-gradient(135deg, ${COLORS.ACCENT} 0%, #5B21B6 100%)`, color: '#fff', minHeight: 54 }}>
            Try Again
          </button>
        )}
      </div>
    </div>
  )
}
