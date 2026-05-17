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
  const [phase, setPhase] = useState('camera')
  const [result, setResult] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [previewUrl, setPreviewUrl] = useState(null)
  const resultRef = useRef(null)

  useEffect(() => { speak(RESPONSES.mirrorReady) }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (phase === 'result' && resultRef.current) resultRef.current.focus()
  }, [phase])

  const handleCapture = useCallback(async (blob, dataUrl) => {
    setPhase('analyzing'); setPreviewUrl(dataUrl)
    speak(RESPONSES.mirrorAnalyzing)
    try {
      const data = await analyzeImage(blob, { mode: 'mirror' })
      setResult(data); setPhase('result')
      speak((data.speech_segments || []).slice(0, 3).map((s) => s.text).join('  '))
    } catch (err) {
      const msg = err.message || RESPONSES.error
      setErrorMsg(msg); speak(msg); setPhase('error')
    }
  }, [speak])

  const reset = useCallback(() => {
    setPhase('camera'); setResult(null); setErrorMsg(''); setPreviewUrl(null)
    speak(RESPONSES.mirrorReady)
  }, [speak])

  useEffect(() => {
    const handler = (e) => {
      const cmd = e.detail
      if (cmd.type === 'SCAN_AGAIN') reset()
      else if (cmd.type === 'READ_RESULT' && phase === 'result') speak(result?.speech_segments?.map((s) => s.text).join('  ') || '')
    }
    window.addEventListener('voiceCommand', handler)
    return () => window.removeEventListener('voiceCommand', handler)
  }, [phase, reset, result, speak])

  if (phase === 'camera') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{
          background: COLORS.BG, borderBottom: `2px solid ${COLORS.BORDER}`,
          padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{ width: 36, height: 36, background: COLORS.SURFACE, border: `2px solid ${COLORS.BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
            🪞
          </div>
          <div>
            <div style={{ fontSize: 13, color: COLORS.TEXT, fontWeight: 700 }}>Instant feedback — nothing saved</div>
            <div style={{ fontSize: 11, color: COLORS.TEXT_MUTED, marginTop: 2 }}>Use Scan to add items to your wardrobe</div>
          </div>
        </div>
        <CameraCapture onCapture={handleCapture} aspectRatio="unset" facingMode="user" />
      </div>
    )
  }

  if (phase === 'analyzing') {
    return (
      <Screen title="Analyzing…" subtitle="Reading your outfit.">
        {previewUrl && <img src={previewUrl} alt="Your outfit being analyzed" style={{ width: '100%', borderRadius: COLORS.RADIUS, marginBottom: 20, maxHeight: 320, objectFit: 'cover', border: `2px solid ${COLORS.BORDER}` }} />}
        <div role="status" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 40, gap: 20 }}>
          <LoadingBars />
          <p aria-live="polite" style={{ color: COLORS.TEXT_MUTED, fontSize: 13, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', margin: 0 }}>Reading your outfit…</p>
        </div>
      </Screen>
    )
  }

  if (phase === 'error') {
    return (
      <Screen title="Photo Issue" subtitle="Could not analyze this photo.">
        {previewUrl && <img src={previewUrl} alt="" style={{ width: '100%', borderRadius: COLORS.RADIUS, marginBottom: 20, maxHeight: 280, objectFit: 'cover', opacity: 0.55, border: `2px solid ${COLORS.BORDER}` }} />}
        <div role="alert" style={{ border: `2px solid ${COLORS.DANGER}`, borderRadius: COLORS.RADIUS, padding: 18, marginBottom: 24, background: COLORS.SURFACE }}>
          <p style={{ fontSize: 15, color: COLORS.DANGER, lineHeight: 1.7, margin: 0 }}>{errorMsg}</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <BigButton label="Try Again" icon="📸" variant="primary" onClick={reset} />
          <BigButton label="Read Error" icon="🔊" onClick={() => speak(errorMsg)} />
        </div>
      </Screen>
    )
  }

  const mirrorChatContext = result ? (result.speech_segments || []).map((s) => s.text).join('\n') : ''

  return (
    <Screen title="Mirror Check" subtitle="Instant feedback — not saved.">
      <h2 ref={resultRef} tabIndex={-1} aria-label="Analysis complete." style={{ position: 'absolute', left: -9999, top: 'auto', width: 1, height: 1, overflow: 'hidden' }} />

      {previewUrl && <img src={previewUrl} alt="Your outfit" style={{ width: '100%', borderRadius: COLORS.RADIUS, marginBottom: 16, maxHeight: 300, objectFit: 'cover', border: `2px solid ${COLORS.BORDER}` }} />}

      {result?.speech_segments?.length > 0 && (
        <div aria-label="Full outfit analysis"
          style={{ border: `2px solid ${COLORS.BORDER}`, borderRadius: COLORS.RADIUS, padding: 18, marginBottom: 20, background: COLORS.SURFACE }}>
          {result.speech_segments.map((seg, i) => (
            <p key={i} style={{ fontSize: 15, color: COLORS.TEXT, lineHeight: 1.8, margin: i < result.speech_segments.length - 1 ? '0 0 12px' : 0 }}>{seg.text}</p>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <BigButton label="Short Description" icon="🔊" onClick={() => speak((result?.speech_segments || []).slice(0, 3).map((s) => s.text).join('  '))} />
        <BigButton label="Long Description" icon="📋" onClick={() => speak((result?.speech_segments || []).map((s) => s.text).join('  '))} />
        <BigButton label="Try Again" icon="📸" variant="primary" onClick={reset} />
      </div>

      {mirrorChatContext && <ContextChat context={mirrorChatContext} feature="mirror" speak={speak} />}
    </Screen>
  )
}

function LoadingBars() {
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center', height: 40 }}>
      {[0,1,2,3,4].map(i => (
        <span key={i} style={{ display: 'block', width: 6, background: COLORS.ACCENT, borderRadius: 0, animation: `mbar2 800ms ease-in-out infinite`, animationDelay: `${i * 100}ms`, height: '100%' }} />
      ))}
      <style>{`@keyframes mbar2 { 0%,100%{transform:scaleY(0.3)} 50%{transform:scaleY(1)} }`}</style>
    </div>
  )
}
