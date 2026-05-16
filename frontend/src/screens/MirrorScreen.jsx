import { useRef, useState, useCallback } from 'react'
import { useApp } from '../contexts/AppContext.jsx'
import { useSpeechOutput } from '../hooks/useSpeechOutput.jsx'
import { analyzeImage } from '../services/api.js'
import { COLORS } from '../utils/constants.js'

export function MirrorScreen() {
  const { goBack } = useApp()
  const { speak, stop } = useSpeechOutput()
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [active, setActive] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const startCamera = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
    streamRef.current = stream
    videoRef.current.srcObject = stream
    setActive(true)
  }, [])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    setActive(false)
  }, [])

  const capture = useCallback(async () => {
    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth; canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    stopCamera()
    canvas.toBlob(async (blob) => {
      setLoading(true); setResult(null); setError('')
      try {
        const data = await analyzeImage(blob, { mode: 'mirror' })
        setResult(data)
        speak(data.speech_segments.map((s) => s.text).join(' '))
        if (data.personal_appearance) speak(data.personal_appearance)
      } catch (e) {
        setError(e.message); speak(e.message)
      } finally {
        setLoading(false)
      }
    }, 'image/jpeg', 0.92)
  }, [stopCamera, speak])

  return (
    <div className="screen">
      <div style={{ padding: '16px 16px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => { stop(); stopCamera(); goBack() }} style={{ fontSize: 20, color: COLORS.TEXT_MUTED, minHeight: 44, minWidth: 44 }}>←</button>
        <h2 style={{ fontWeight: 700, fontSize: 18 }}>Mirror Check</h2>
      </div>

      <div className="scroll" style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
        <div className="glass" style={{ width: '100%', aspectRatio: '9/16', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover', display: active ? 'block' : 'none' }} />
          {!active && !loading && !result && (
            <div style={{ textAlign: 'center', color: COLORS.TEXT_MUTED }}>
              <p style={{ fontSize: 40, marginBottom: 12 }}>⬡</p>
              <p style={{ fontSize: 14 }}>Full outfit analysis</p>
            </div>
          )}
          {loading && <p style={{ color: COLORS.ACCENT_LIGHT, fontSize: 14 }}>Analyzing your look...</p>}
          {result && (
            <div className="scroll" style={{ width: '100%', padding: 16 }}>
              {result.speech_segments.map((s) => (
                <p key={s.id} style={{ fontSize: 14, fontFamily: 'var(--font-body)', lineHeight: 1.6, marginBottom: 10 }}>{s.text}</p>
              ))}
              {result.personal_appearance && (
                <p style={{ fontSize: 14, fontFamily: 'var(--font-body)', lineHeight: 1.6, color: COLORS.ACCENT_LIGHT }}>{result.personal_appearance}</p>
              )}
            </div>
          )}
        </div>

        {!active && !loading && !result && (
          <button onClick={startCamera}
            style={{ width: '100%', padding: '16px 0', borderRadius: 14, fontWeight: 700, fontSize: 16,
              background: `linear-gradient(135deg, ${COLORS.ACCENT} 0%, #5B21B6 100%)`, color: '#fff', minHeight: 56 }}>
            Start Mirror
          </button>
        )}
        {active && (
          <button onClick={capture}
            style={{ width: 72, height: 72, borderRadius: '50%', border: `3px solid ${COLORS.ACCENT_LIGHT}`,
              background: COLORS.ACCENT_DIM, color: COLORS.ACCENT_LIGHT, fontSize: 28 }}>●</button>
        )}
        {(result || error) && (
          <button onClick={() => { setResult(null); setError('') }}
            style={{ width: '100%', padding: '12px 0', borderRadius: 14, fontSize: 15,
              background: 'rgba(255,255,255,0.04)', color: COLORS.TEXT_MUTED, minHeight: 48 }}>
            Try Again
          </button>
        )}
      </div>
    </div>
  )
}
