import { useState, useEffect, useCallback, useRef } from 'react'
import { Screen } from '../components/Screen.jsx'
import { BigButton } from '../components/BigButton.jsx'
import { CameraCapture } from '../components/CameraCapture.jsx'
import { ContextChat } from '../components/ContextChat.jsx'
import { useApp } from '../contexts/AppContext.jsx'
import { useVoice } from '../contexts/VoiceContext.jsx'
import { useWardrobe } from '../contexts/WardrobeContext.jsx'
import { quickScan } from '../services/api.js'
import { SCREENS, COLORS, RESPONSES } from '../utils/constants.js'

export function ScanScreen() {
  const { navigate, goBack } = useApp()
  const { speak } = useVoice()
  const { addItem } = useWardrobe()

  const [phase, setPhase] = useState('camera')
  const [previewUrl, setPreviewUrl] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [scanResult, setScanResult] = useState(null)
  const [customName, setCustomName] = useState('')
  const [descMode, setDescMode] = useState('short') // 'short' | 'long'
  const capturedBlobRef = useRef(null)
  const nameInputRef = useRef(null)
  const savingRef = useRef(false)

  useEffect(() => {
    if (phase === 'camera') speak(RESPONSES.scanReady)
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (phase === 'naming' && nameInputRef.current) nameInputRef.current.focus()
  }, [phase])

  const handleCapture = useCallback(async (blob, dataUrl) => {
    // Bail if already processing — prevents double-capture race
    setPhase((prev) => { if (prev !== 'camera') return prev; return 'analyzing' })
    setPreviewUrl(dataUrl)
    capturedBlobRef.current = blob
    speak('Identifying the item. One moment.')
    try {
      const result = await quickScan(blob)
      setScanResult(result)
      setCustomName(result.suggested_name || result.name || '')
      speak(result.short_description || result.suggested_name || 'Item identified.')
      setPhase('naming')
    } catch (err) {
      const msg = err.message || 'Could not identify the item. Please try a clearer photo.'
      const isNotClothing = err.error_code === 'not_clothing' || err.error_code === 'low_confidence'
      setErrorMsg(msg)
      speak(msg)
      setPhase(isNotClothing ? 'not_clothing' : 'error')
    }
  }, [speak])

  const handleSave = useCallback(async () => {
    if (!scanResult || savingRef.current) return
    savingRef.current = true
    const name = customName.trim() || scanResult.suggested_name || 'Clothing Item'
    setPhase('saving')
    try {
      await addItem(
        {
          name,
          type: scanResult.category || 'tops',
          category: scanResult.category || 'tops',
          color: scanResult.color || '',
          description: scanResult.long_description || scanResult.short_description || '',
        },
        capturedBlobRef.current
      )
      speak(RESPONSES.saved(name))
      setTimeout(() => navigate(SCREENS.HOME), 1200)
    } catch {
      speak(RESPONSES.error)
      savingRef.current = false
      setPhase('naming')
    }
  }, [scanResult, customName, addItem, speak, navigate])

  const reset = useCallback(() => {
    setScanResult(null); setPreviewUrl(null); setErrorMsg(''); setCustomName('')
    capturedBlobRef.current = null; savingRef.current = false; setPhase('camera')
  }, [])

  const handleUpload = useCallback((e) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const dataUrl = ev.target.result
      const byteString = atob(dataUrl.split(',')[1])
      const ab = new ArrayBuffer(byteString.length); const ia = new Uint8Array(ab)
      for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i)
      handleCapture(new Blob([ab], { type: 'image/jpeg' }), dataUrl)
    }
    reader.readAsDataURL(file)
  }, [handleCapture])

  const toggleDesc = useCallback(() => {
    const next = descMode === 'short' ? 'long' : 'short'
    setDescMode(next)
    const text = next === 'long'
      ? (scanResult?.long_description || scanResult?.short_description || '')
      : (scanResult?.short_description || '')
    speak(text)
  }, [descMode, scanResult, speak])

  useEffect(() => {
    const handler = (e) => {
      const cmd = e.detail
      if (cmd.type === 'SAVE_ITEM' && phase === 'naming') handleSave()
      else if (cmd.type === 'DISCARD_ITEM') reset()
    }
    window.addEventListener('voiceCommand', handler)
    return () => window.removeEventListener('voiceCommand', handler)
  }, [phase, handleSave, reset])

  // ── Camera ──
  if (phase === 'camera') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{
          background: COLORS.BG, borderBottom: `2px solid ${COLORS.BORDER}`,
          padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0,
        }}>
          <button onClick={goBack} aria-label="Go back" style={{
            width: 44, height: 44, minWidth: 44, border: `2px solid ${COLORS.BORDER}`,
            borderRadius: COLORS.RADIUS, background: 'transparent', color: COLORS.TEXT,
            fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
          }}>←</button>
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: COLORS.TEXT, lineHeight: 1.1 }}>Scan</div>
            <div style={{ fontSize: 12, color: COLORS.TEXT_MUTED, marginTop: 2 }}>Point camera at a clothing item</div>
          </div>
        </div>
        <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
          <CameraCapture onCapture={handleCapture} onFrameDescribed={(t) => speak(t)} aspectRatio="unset" />
          <div style={{ position: 'absolute', bottom: 140, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 10 }}>
            <label aria-label="Upload from gallery" style={{
              background: COLORS.BG, border: `2px solid ${COLORS.BORDER}`,
              borderRadius: COLORS.RADIUS, color: COLORS.TEXT,
              fontSize: 14, fontWeight: 700, padding: '10px 20px',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
            }}>
              🖼 Upload from Gallery
              <input type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />
            </label>
          </div>
        </div>
      </div>
    )
  }

  // ── Analyzing / Saving ──
  if (phase === 'analyzing' || phase === 'saving') {
    const subtitle = phase === 'saving' ? 'Saving to your wardrobe.' : 'Identifying your item…'
    return (
      <Screen title={phase === 'saving' ? 'Saving…' : 'Identifying…'} subtitle={subtitle}>
        {previewUrl && <img src={previewUrl} alt="" style={{ width: '100%', borderRadius: COLORS.RADIUS, marginBottom: 20, maxHeight: 300, objectFit: 'cover', border: `2px solid ${COLORS.BORDER}` }} />}
        <div role="status" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 40, gap: 20 }}>
          <LoadingBars />
          <p aria-live="polite" style={{ color: COLORS.TEXT_MUTED, fontSize: 12, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase', margin: 0 }}>{subtitle}</p>
        </div>
      </Screen>
    )
  }

  // ── Not Clothing ──
  if (phase === 'not_clothing') {
    return (
      <Screen title="Not a Clothing Item" subtitle="Only tops and bottoms can be saved.">
        {previewUrl && <img src={previewUrl} alt="" style={{ width: '100%', borderRadius: COLORS.RADIUS, marginBottom: 20, maxHeight: 280, objectFit: 'cover', opacity: 0.45, border: `2px solid ${COLORS.BORDER}` }} />}
        <div role="alert" style={{ border: `2px solid ${COLORS.BORDER}`, borderRadius: COLORS.RADIUS, padding: 18, marginBottom: 20, background: COLORS.SURFACE }}>
          <p style={{ fontSize: 15, color: COLORS.TEXT, lineHeight: 1.7, margin: 0 }}>{errorMsg}</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <BigButton label="Try Again" icon="📸" variant="primary" onClick={reset} />
          <BigButton label="Read Message Again" icon="🔊" onClick={() => speak(errorMsg)} />
        </div>
      </Screen>
    )
  }

  // ── Error ──
  if (phase === 'error') {
    return (
      <Screen title="Photo Issue" subtitle="Please retake the photo.">
        {previewUrl && <img src={previewUrl} alt="" style={{ width: '100%', borderRadius: COLORS.RADIUS, marginBottom: 20, maxHeight: 280, objectFit: 'cover', opacity: 0.55, border: `2px solid ${COLORS.BORDER}` }} />}
        <div role="alert" style={{ border: `2px solid ${COLORS.DANGER}`, borderRadius: COLORS.RADIUS, padding: 18, marginBottom: 20, background: COLORS.SURFACE }}>
          <p style={{ fontSize: 15, color: COLORS.DANGER, lineHeight: 1.7, margin: 0 }}>{errorMsg}</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <BigButton label="Retake Photo" icon="📸" variant="primary" onClick={reset} />
          <BigButton label="Read Error Again" icon="🔊" onClick={() => speak(errorMsg)} />
        </div>
      </Screen>
    )
  }

  // ── Naming & Save ──
  const displayDesc = descMode === 'long'
    ? (scanResult?.long_description || scanResult?.short_description || '')
    : (scanResult?.short_description || '')

  return (
    <Screen title="Save to Wardrobe" subtitle="Review and name this item">
      {previewUrl && <img src={previewUrl} alt="Clothing item to save" style={{ width: '100%', borderRadius: COLORS.RADIUS, marginBottom: 14, maxHeight: 260, objectFit: 'cover', border: `2px solid ${COLORS.BORDER}` }} />}

      {/* Description card with toggle */}
      {(scanResult?.short_description || scanResult?.long_description) && (
        <div style={{ border: `2px solid ${COLORS.BORDER}`, borderRadius: COLORS.RADIUS, marginBottom: 14, overflow: 'hidden' }}>
          <div style={{ display: 'flex', borderBottom: `2px solid ${COLORS.BORDER}` }}>
            {['short', 'long'].map((mode) => (
              <button key={mode} onClick={() => {
                setDescMode(mode)
                speak(mode === 'long'
                  ? (scanResult?.long_description || scanResult?.short_description || '')
                  : (scanResult?.short_description || ''))
              }}
                style={{
                  flex: 1, padding: '10px 0',
                  background: descMode === mode ? COLORS.SURFACE_INVERSE : COLORS.SURFACE,
                  color: descMode === mode ? COLORS.TEXT_ON_ACCENT : COLORS.TEXT_MUTED,
                  border: 'none', borderRight: mode === 'short' ? `2px solid ${COLORS.BORDER}` : 'none',
                  fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: 'uppercase',
                  cursor: 'pointer', borderRadius: 0,
                }}>
                {mode === 'short' ? 'Short' : 'Full Description'}
              </button>
            ))}
          </div>
          <div style={{ padding: 14, background: COLORS.SURFACE }}>
            <p style={{ fontSize: 15, color: COLORS.TEXT, lineHeight: 1.75, margin: 0 }}>{displayDesc}</p>
          </div>
          <button onClick={toggleDesc} aria-label="Read description aloud"
            style={{ width: '100%', padding: '10px 0', background: 'transparent', border: 'none', borderTop: `2px solid ${COLORS.BORDER}`, color: COLORS.ACCENT, fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer', borderRadius: 0 }}>
            🔊 Read Aloud
          </button>
        </div>
      )}

      <label htmlFor="item-name" style={{ fontSize: 11, fontWeight: 700, color: COLORS.TEXT_MUTED, display: 'block', marginBottom: 8, letterSpacing: 1.2, textTransform: 'uppercase' }}>
        Item Name
      </label>
      <input
        id="item-name" ref={nameInputRef} type="text"
        value={customName} onChange={(e) => setCustomName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSave()}
        placeholder={scanResult?.suggested_name || 'e.g. Navy Blue T-Shirt'}
        style={{ width: '100%', boxSizing: 'border-box', background: COLORS.SURFACE, border: `2px solid ${COLORS.BORDER}`, borderRadius: COLORS.RADIUS, padding: '14px 16px', fontSize: 16, color: COLORS.TEXT, outline: 'none', marginBottom: 14, fontFamily: 'var(--font-ui)' }}
        onFocus={(e) => e.target.style.borderColor = COLORS.ACCENT}
        onBlur={(e) => e.target.style.borderColor = COLORS.BORDER}
      />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <BigButton label="Save to Wardrobe" hint={`Save as: ${customName.trim() || 'Clothing Item'}`} icon="✓" variant="primary" onClick={handleSave} />
        <BigButton label="Retake Photo" hint="Discard and take a new photo" icon="📸" onClick={reset} />
      </div>
      <ContextChat
        resultContext={[scanResult?.short_description, scanResult?.long_description].filter(Boolean).join(' ')}
        feature="scan"
        speak={speak}
      />
    </Screen>
  )
}

function LoadingBars() {
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center', height: 40 }}>
      {[0,1,2,3,4].map(i => (
        <span key={i} style={{ display: 'block', width: 6, background: COLORS.ACCENT, borderRadius: 0, animation: `sbar 800ms ease-in-out infinite`, animationDelay: `${i * 100}ms`, height: '100%' }} />
      ))}
      <style>{`@keyframes sbar { 0%,100%{transform:scaleY(0.3)} 50%{transform:scaleY(1)} }`}</style>
    </div>
  )
}
