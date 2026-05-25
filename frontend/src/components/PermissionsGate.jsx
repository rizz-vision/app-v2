import { useState, useEffect, useRef } from 'react'
import { COLORS } from '../utils/constants.js'

const STORAGE_KEY = 'rizzv2_perms_asked'

export function PermissionsGate({ children }) {
  const [asked, setAsked] = useState(() => !!localStorage.getItem(STORAGE_KEY))
  const [requesting, setRequesting] = useState(false)
  const [results, setResults] = useState({ camera: null, mic: null })
  const statusRef = useRef(null)

  // Announce screen purpose on mount via browser TTS (VoiceContext not yet available here)
  useEffect(() => {
    if (asked) return
    const utt = new window.SpeechSynthesisUtterance(
      'Rizzvision needs your camera to scan clothing, and your microphone for voice commands. Tap Allow permissions to continue, or Skip for now.'
    )
    utt.rate = 0.95
    window.speechSynthesis?.cancel()
    window.speechSynthesis?.speak(utt)
    return () => window.speechSynthesis?.cancel()
  }, [asked])

  const requestAll = async () => {
    setRequesting(true)
    const r = { camera: null, mic: null }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      stream.getTracks().forEach((t) => t.stop())
      r.camera = 'granted'
    } catch {
      r.camera = 'denied'
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((t) => t.stop())
      r.mic = 'granted'
    } catch {
      r.mic = 'denied'
    }

    setResults(r)
    setRequesting(false)
    localStorage.setItem(STORAGE_KEY, '1')

    // Announce results via TTS
    const parts = []
    if (r.camera === 'granted') parts.push('Camera allowed.')
    else parts.push('Camera denied.')
    if (r.mic === 'granted') parts.push('Microphone allowed.')
    else parts.push('Microphone denied.')
    if (r.camera === 'denied' || r.mic === 'denied') {
      parts.push('To fix denied permissions, tap the lock icon in your browser address bar.')
    } else {
      parts.push('Tap Continue to proceed.')
    }
    const utt = new window.SpeechSynthesisUtterance(parts.join(' '))
    utt.rate = 0.95
    window.speechSynthesis?.cancel()
    window.speechSynthesis?.speak(utt)

    setTimeout(() => setAsked(true), 600)
  }

  if (asked) return children

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', gap: 24, textAlign: 'center', background: 'var(--bg)' }}>
      <div aria-hidden="true" style={{ width: 72, height: 72, borderRadius: '50%', background: COLORS.ACCENT_DIM, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>
        📷
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Allow access</h1>
        <p style={{ fontSize: 15, color: COLORS.TEXT_MUTED, lineHeight: 1.6 }}>
          Rizzvision needs camera to scan clothes, and microphone for voice commands.
        </p>
      </div>

      {/* Permission status after request */}
      {(results.camera || results.mic) && (
        <div role="status" aria-live="polite" ref={statusRef} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[{ label: 'Camera', key: 'camera' }, { label: 'Microphone', key: 'mic' }].map(({ label, key }) => (
            <div key={key} className="glass" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14 }}>{label}</span>
              <span style={{ fontSize: 13, color: results[key] === 'granted' ? COLORS.SUCCESS : COLORS.DANGER, fontWeight: 600 }}>
                {results[key] === 'granted' ? 'Allowed' : 'Denied'}
              </span>
            </div>
          ))}
          {(results.camera === 'denied' || results.mic === 'denied') && (
            <p style={{ fontSize: 13, color: COLORS.TEXT_MUTED, lineHeight: 1.6 }}>
              To allow denied permissions: tap the lock icon in your browser address bar, then Permissions.
            </p>
          )}
        </div>
      )}

      <button
        aria-label={requesting ? 'Requesting permissions, please wait' : results.camera ? 'Continue to the app' : 'Allow camera and microphone permissions'}
        onClick={requesting ? undefined : results.camera ? () => { localStorage.setItem(STORAGE_KEY, '1'); setAsked(true) } : requestAll}
        disabled={requesting}
        style={{ width: '100%', padding: '16px 0', borderRadius: 16, fontWeight: 700, fontSize: 16, minHeight: 56,
          background: requesting ? COLORS.ACCENT_DIM : `linear-gradient(135deg, ${COLORS.ACCENT} 0%, #5B21B6 100%)`,
          color: requesting ? COLORS.ACCENT_LIGHT : '#fff', transition: 'opacity 200ms' }}>
        {requesting ? 'Requesting...' : results.camera ? 'Continue' : 'Allow permissions'}
      </button>

      <button
        aria-label="Skip permissions for now and go to the app"
        onClick={() => { localStorage.setItem(STORAGE_KEY, '1'); setAsked(true) }}
        style={{ fontSize: 13, color: COLORS.TEXT_DIM, minHeight: 44 }}>
        Skip for now
      </button>
    </div>
  )
}
