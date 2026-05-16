import { useRef, useState, useCallback } from 'react'
import { useApp } from '../contexts/AppContext.jsx'
import { useWardrobe } from '../contexts/WardrobeContext.jsx'
import { useSpeechOutput } from '../hooks/useSpeechOutput.jsx'
import { analyzeImage } from '../services/api.js'
import { COLORS, DESC_MODES } from '../utils/constants.js'
import { announce } from '../components/LiveRegions.jsx'

const STATE = { IDLE: 'IDLE', CAPTURING: 'CAPTURING', LOADING: 'LOADING', RESULT: 'RESULT', ERROR: 'ERROR' }

export function ScanScreen() {
  const { goBack, descMode } = useApp()
  const { addItem } = useWardrobe()
  const { speakSegments, speak, stop } = useSpeechOutput()
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [state, setState] = useState(STATE.IDLE)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [capturedBlob, setCapturedBlob] = useState(null)

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      streamRef.current = stream
      videoRef.current.srcObject = stream
      setState(STATE.CAPTURING)
    } catch {
      setError('Camera access denied.'); setState(STATE.ERROR)
    }
  }, [])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }, [])

  const capture = useCallback(async () => {
    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    stopCamera()

    canvas.toBlob(async (blob) => {
      setCapturedBlob(blob)
      setState(STATE.LOADING)
      announce('Analyzing your t-shirt...')
      try {
        const data = await analyzeImage(blob)
        setResult(data)
        setState(STATE.RESULT)
        const segments = descMode === DESC_MODES.SHORT ? data.speech_segments.slice(0, 2) : data.speech_segments
        speakSegments(segments)
        announce(segments.map((s) => s.text).join(' '))
      } catch (e) {
        setError(e.message)
        setState(STATE.ERROR)
        speak(e.message)
        announce(e.message, 'assertive')
      }
    }, 'image/jpeg', 0.92)
  }, [stopCamera, descMode, speakSegments, speak])

  const reset = useCallback(() => {
    stop()
    setResult(null); setError(''); setSaved(false); setCapturedBlob(null)
    setState(STATE.IDLE)
  }, [stop])

  const saveToWardrobe = useCallback(async () => {
    if (!result || saved) return
    await addItem({
      name: result.speech_segments[0]?.text?.split('.')[0] || 'T-shirt',
      description: result.wardrobe_description,
      category: 'top',
    })
    setSaved(true)
    speak('Saved to your wardrobe.')
  }, [result, saved, addItem, speak])

  return (
    <div className="screen">
      <div style={{ padding: '16px 16px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => { stop(); stopCamera(); goBack() }}
          style={{ fontSize: 20, color: COLORS.TEXT_MUTED, minHeight: 44, minWidth: 44 }}>←</button>
        <h2 style={{ fontWeight: 700, fontSize: 18 }}>Scan T-Shirt</h2>
      </div>

      <div className="scroll" style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
        {/* Camera / preview */}
        <div className="glass" style={{ width: '100%', aspectRatio: '3/4', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {state === STATE.CAPTURING && (
            <video ref={videoRef} autoPlay playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
          {(state === STATE.IDLE || state === STATE.ERROR) && (
            <div style={{ textAlign: 'center', color: COLORS.TEXT_MUTED }}>
              <p style={{ fontSize: 40, marginBottom: 12 }}>◎</p>
              <p style={{ fontSize: 14 }}>{state === STATE.ERROR ? error : 'Tap to start camera'}</p>
            </div>
          )}
          {state === STATE.LOADING && (
            <div style={{ textAlign: 'center', color: COLORS.ACCENT_LIGHT }}>
              <p style={{ fontSize: 14 }}>Analyzing...</p>
            </div>
          )}
          {state === STATE.RESULT && result && (
            <div className="scroll" style={{ width: '100%', padding: 16 }}>
              {result.speech_segments.map((s) => (
                <p key={s.id} style={{ fontSize: 14, fontFamily: 'var(--font-body)', lineHeight: 1.6, marginBottom: 10, color: COLORS.TEXT }}>
                  {s.text}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        {state === STATE.IDLE && (
          <button onClick={startCamera}
            style={{ width: '100%', padding: '16px 0', borderRadius: 14, fontWeight: 700, fontSize: 16,
              background: `linear-gradient(135deg, ${COLORS.ACCENT} 0%, #5B21B6 100%)`, color: '#fff', minHeight: 56 }}>
            Open Camera
          </button>
        )}
        {state === STATE.CAPTURING && (
          <button onClick={capture}
            style={{ width: 72, height: 72, borderRadius: '50%', border: `3px solid ${COLORS.ACCENT_LIGHT}`,
              background: COLORS.ACCENT_DIM, color: COLORS.ACCENT_LIGHT, fontSize: 28 }}>
            ●
          </button>
        )}
        {state === STATE.RESULT && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button onClick={saveToWardrobe} disabled={saved}
              style={{ width: '100%', padding: '14px 0', borderRadius: 14, fontWeight: 700, fontSize: 15,
                background: saved ? 'rgba(16,185,129,0.15)' : COLORS.ACCENT_DIM,
                color: saved ? COLORS.SUCCESS : COLORS.ACCENT_LIGHT, minHeight: 52 }}>
              {saved ? '✓ Saved to Wardrobe' : 'Save to Wardrobe'}
            </button>
            <button onClick={reset}
              style={{ width: '100%', padding: '12px 0', borderRadius: 14, fontSize: 15,
                background: 'rgba(255,255,255,0.04)', color: COLORS.TEXT_MUTED, minHeight: 48 }}>
              Scan Again
            </button>
          </div>
        )}
        {state === STATE.ERROR && (
          <button onClick={reset}
            style={{ width: '100%', padding: '14px 0', borderRadius: 14, fontSize: 15,
              background: COLORS.ACCENT_DIM, color: COLORS.ACCENT_LIGHT, fontWeight: 600, minHeight: 52 }}>
            Try Again
          </button>
        )}
      </div>
    </div>
  )
}
