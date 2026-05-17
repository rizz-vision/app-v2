import { useState, useCallback, useEffect, useRef } from 'react'
import { Screen } from '../components/Screen.jsx'
import { BigButton } from '../components/BigButton.jsx'
import { CameraCapture } from '../components/CameraCapture.jsx'
import { ContextChat } from '../components/ContextChat.jsx'
import { useVoice } from '../contexts/VoiceContext.jsx'
import { analyzeImage } from '../services/api.js'
import { COLORS, RESPONSES } from '../utils/constants.js'

export function MirrorScreen() {
  const { speak } = useVoice()
  const [phase, setPhase] = useState('camera') // camera | analyzing | error | result
  const [result, setResult] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [previewUrl, setPreviewUrl] = useState(null)
  const resultRef = useRef(null)

  useEffect(() => {
    speak(RESPONSES.mirrorReady)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (phase === 'result' && resultRef.current) resultRef.current.focus()
  }, [phase])

  const handleCapture = useCallback(async (blob, dataUrl) => {
    setPhase('analyzing')
    setPreviewUrl(dataUrl)
    speak(RESPONSES.mirrorAnalyzing)

    try {
      const data = await analyzeImage(blob, { mode: 'mirror' })
      setResult(data)
      setPhase('result')
      const segs = data.speech_segments || []
      const shortText = segs.slice(0, 3).map((s) => s.text).join('  ')
      speak(shortText || segs.map((s) => s.text).join('  '))
    } catch (err) {
      const msg = err.message || RESPONSES.error
      setErrorMsg(msg)
      speak(msg)
      setPhase('error')
    }
  }, [speak])

  const reset = useCallback(() => {
    setPhase('camera'); setResult(null); setErrorMsg(''); setPreviewUrl(null)
    speak(RESPONSES.mirrorReady)
  }, [speak])

  const speakShort = useCallback(() => {
    if (!result?.speech_segments) return
    speak(result.speech_segments.slice(0, 3).map((s) => s.text).join('  '))
  }, [result, speak])

  const speakLong = useCallback(() => {
    if (!result?.speech_segments) return
    speak(result.speech_segments.map((s) => s.text).join('  '))
  }, [result, speak])

  useEffect(() => {
    const handler = (e) => {
      const cmd = e.detail
      if (cmd.type === 'SCAN_AGAIN') reset()
      else if (cmd.type === 'READ_RESULT' && phase === 'result') speakLong()
    }
    window.addEventListener('voiceCommand', handler)
    return () => window.removeEventListener('voiceCommand', handler)
  }, [phase, reset, speakLong])

  // ── Camera ──────────────────────────────────────────────────────────────────
  if (phase === 'camera') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div role="note" style={{ background: 'rgba(0,0,0,0.72)', borderBottom: `1px solid rgba(255,255,255,0.12)`, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span aria-hidden style={{ fontSize: 18 }}>🪞</span>
          <div>
            <div style={{ fontSize: 13, color: '#fff', fontWeight: 700, lineHeight: 1.3 }}>Instant feedback — nothing saved</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>Use Scan Clothing to add items to your wardrobe</div>
          </div>
        </div>
        <CameraCapture onCapture={handleCapture} aspectRatio="unset" facingMode="user" />
      </div>
    )
  }

  // ── Analyzing ───────────────────────────────────────────────────────────────
  if (phase === 'analyzing') {
    return (
      <Screen title="Analyzing..." subtitle="Reading your outfit.">
        {previewUrl && <img src={previewUrl} alt="Your outfit being analyzed" style={{ width: '100%', borderRadius: 16, marginBottom: 20, maxHeight: 320, objectFit: 'cover' }} />}
        <div role="status" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 40, gap: 20 }}>
          <div aria-hidden style={{ width: 56, height: 56, borderRadius: '50%', border: `4px solid ${COLORS.ACCENT}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p aria-live="polite" style={{ color: COLORS.TEXT_MUTED, fontSize: 15, margin: 0 }}>Reading colors, style, and occasion…</p>
        </div>
      </Screen>
    )
  }

  // ── Error ───────────────────────────────────────────────────────────────────
  if (phase === 'error') {
    return (
      <Screen title="Photo Issue" subtitle="Could not analyze this photo.">
        {previewUrl && <img src={previewUrl} alt="" style={{ width: '100%', borderRadius: 16, marginBottom: 20, maxHeight: 280, objectFit: 'cover', opacity: 0.55 }} />}
        <div role="alert" style={{ background: 'rgba(239,68,68,0.1)', borderRadius: 16, padding: 20, border: `1px solid ${COLORS.DANGER}`, marginBottom: 24 }}>
          <p style={{ fontSize: 17, color: COLORS.DANGER, lineHeight: 1.75, margin: 0 }}>{errorMsg}</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <BigButton label="Try Again" hint="Take another photo" icon="📸" variant="primary" onClick={reset} />
          <BigButton label="Read Error" hint="Hear the error message" icon="🔊" onClick={() => speak(errorMsg)} />
        </div>
      </Screen>
    )
  }

  // ── Result ──────────────────────────────────────────────────────────────────
  const mirrorChatContext = result ? (result.speech_segments || []).map((s) => s.text).join('\n') : ''

  return (
    <Screen title="Auditory Mirror" subtitle="Instant feedback — not saved to wardrobe.">
      <h2 ref={resultRef} tabIndex={-1} aria-label="Analysis complete." style={{ position: 'absolute', left: -9999, top: 'auto', width: 1, height: 1, overflow: 'hidden' }} />

      {previewUrl && <img src={previewUrl} alt="Your outfit" style={{ width: '100%', borderRadius: 16, marginBottom: 16, maxHeight: 320, objectFit: 'cover' }} />}

      {result?.speech_segments?.length > 0 && (
        <div aria-label="Full outfit analysis"
          style={{ background: COLORS.SURFACE, borderRadius: 14, padding: 18, border: `1px solid ${COLORS.BORDER}`, marginBottom: 20, maxHeight: 240, overflowY: 'auto' }}>
          {result.speech_segments.map((seg, i) => (
            <p key={i} style={{ fontSize: 15, color: COLORS.TEXT, lineHeight: 1.8, margin: '0 0 10px 0', fontFamily: 'var(--font-body)' }}>{seg.text}</p>
          ))}
        </div>
      )}

      {mirrorChatContext && <ContextChat context={mirrorChatContext} feature="mirror" speak={speak} />}

      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <BigButton label="Short Description" hint="Hear a quick summary" icon="🔊" onClick={speakShort} />
        <BigButton label="Long Description" hint="Hear the full breakdown" icon="📋" onClick={speakLong} />
        <BigButton label="Try Again" hint="Take a new photo" icon="📸" variant="primary" onClick={reset} />
      </div>
    </Screen>
  )
}
