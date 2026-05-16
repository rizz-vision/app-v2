import { useRef, useState, useCallback } from 'react'
import { useApp } from '../contexts/AppContext.jsx'
import { useWardrobe } from '../contexts/WardrobeContext.jsx'
import { useSpeechOutput } from '../hooks/useSpeechOutput.jsx'
import { analyzeImage } from '../services/api.js'
import { COLORS } from '../utils/constants.js'

export function ShoppingScreen() {
  const { goBack } = useApp()
  const { items } = useWardrobe()
  const { speak, stop } = useSpeechOutput()
  const fileRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const analyze = useCallback(async (blob) => {
    setLoading(true); setResult(null); setError('')
    try {
      const wardrobeSummary = items.map((i) => i.name).join(', ')
      const data = await analyzeImage(blob, { occasion: `Shopping mode. My wardrobe: ${wardrobeSummary}` })
      setResult(data)
      speak(data.speech_segments.map((s) => s.text).join(' '))
    } catch (e) {
      setError(e.message); speak(e.message)
    } finally {
      setLoading(false)
    }
  }, [items, speak])

  const onFileChange = (e) => {
    const file = e.target.files[0]
    if (file) analyze(file)
  }

  return (
    <div className="screen">
      <div style={{ padding: '16px 16px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => { stop(); goBack() }} style={{ fontSize: 20, color: COLORS.TEXT_MUTED, minHeight: 44, minWidth: 44 }}>←</button>
        <h2 style={{ fontWeight: 700, fontSize: 18 }}>Shopping Check</h2>
      </div>

      <div className="scroll" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="glass" style={{ padding: 20, textAlign: 'center' }}>
          <p style={{ fontSize: 14, color: COLORS.TEXT_MUTED, marginBottom: 16 }}>
            Photo a t-shirt in a store to see if it works with your wardrobe.
          </p>
          <button onClick={() => fileRef.current?.click()} disabled={loading}
            style={{ padding: '14px 28px', borderRadius: 14, fontWeight: 700, fontSize: 15,
              background: `linear-gradient(135deg, ${COLORS.ACCENT} 0%, #5B21B6 100%)`, color: '#fff', minHeight: 52 }}>
            {loading ? 'Analyzing...' : 'Choose Photo'}
          </button>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={onFileChange} style={{ display: 'none' }} />
        </div>

        {error && <p style={{ fontSize: 14, color: COLORS.DANGER, textAlign: 'center' }}>{error}</p>}

        {result && (
          <div className="glass" style={{ padding: 20 }}>
            {result.speech_segments.map((s) => (
              <p key={s.id} style={{ fontSize: 14, fontFamily: 'var(--font-body)', lineHeight: 1.7, marginBottom: 10, color: COLORS.TEXT }}>
                {s.text}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
