import { useState, useEffect } from 'react'
import { COLORS } from '../utils/constants.js'

const STORAGE_KEY = 'rizzv2_perms_asked'

export function PermissionsGate({ children }) {
  const [asked, setAsked] = useState(() => !!localStorage.getItem(STORAGE_KEY))
  const [requesting, setRequesting] = useState(false)
  const [results, setResults] = useState({ camera: null, mic: null })

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
    setTimeout(() => setAsked(true), 600)
  }

  if (asked) return children

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', gap: 24, textAlign: 'center', background: 'var(--bg)' }}>
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: COLORS.ACCENT_DIM, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>
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
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[{ label: 'Camera', key: 'camera', icon: '📷' }, { label: 'Microphone', key: 'mic', icon: '🎙️' }].map(({ label, key, icon }) => (
            <div key={key} className="glass" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 14 }}>{icon} {label}</span>
              <span style={{ fontSize: 13, color: results[key] === 'granted' ? COLORS.SUCCESS : COLORS.DANGER, fontWeight: 600 }}>
                {results[key] === 'granted' ? '✓ Allowed' : '✗ Denied'}
              </span>
            </div>
          ))}
          {(results.camera === 'denied' || results.mic === 'denied') && (
            <p style={{ fontSize: 13, color: COLORS.TEXT_MUTED, lineHeight: 1.6 }}>
              To allow denied permissions: tap the lock/info icon in your browser address bar → Permissions.
            </p>
          )}
        </div>
      )}

      <button
        onClick={requesting ? undefined : results.camera ? () => { localStorage.setItem(STORAGE_KEY, '1'); setAsked(true) } : requestAll}
        disabled={requesting}
        style={{ width: '100%', padding: '16px 0', borderRadius: 16, fontWeight: 700, fontSize: 16, minHeight: 56,
          background: requesting ? COLORS.ACCENT_DIM : `linear-gradient(135deg, ${COLORS.ACCENT} 0%, #5B21B6 100%)`,
          color: requesting ? COLORS.ACCENT_LIGHT : '#fff', transition: 'opacity 200ms' }}>
        {requesting ? 'Requesting...' : results.camera ? 'Continue' : 'Allow permissions'}
      </button>

      <button onClick={() => { localStorage.setItem(STORAGE_KEY, '1'); setAsked(true) }}
        style={{ fontSize: 13, color: COLORS.TEXT_DIM, minHeight: 44 }}>
        Skip for now
      </button>
    </div>
  )
}
