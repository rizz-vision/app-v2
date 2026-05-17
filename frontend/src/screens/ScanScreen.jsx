import { useState, useEffect, useCallback, useRef } from 'react'
import { Screen } from '../components/Screen.jsx'
import { BigButton } from '../components/BigButton.jsx'
import { CameraCapture } from '../components/CameraCapture.jsx'
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
  const capturedBlobRef = useRef(null)
  const nameInputRef = useRef(null)

  useEffect(() => {
    if (phase === 'camera') speak(RESPONSES.scanReady)
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (phase === 'naming' && nameInputRef.current) nameInputRef.current.focus()
  }, [phase])

  const handleCapture = useCallback(async (blob, dataUrl) => {
    setPhase('analyzing')
    setPreviewUrl(dataUrl)
    capturedBlobRef.current = blob
    speak('Identifying the item. One moment.')
    try {
      const result = await quickScan(blob)
      setScanResult(result)
      setCustomName(result.name || result.suggested_name || '')
      speak(result.short_description || result.name || result.suggested_name || 'Item identified.')
      setPhase('naming')
    } catch (err) {
      const msg = err.message || 'Could not identify the item. Please try a clearer photo.'
      setErrorMsg(msg); speak(msg); setPhase('error')
    }
  }, [speak])

  const handleSave = useCallback(async () => {
    if (!scanResult) return
    const name = customName.trim() || scanResult.name || scanResult.suggested_name || 'Clothing Item'
    setPhase('saving')
    try {
      await addItem({ name, type: scanResult.category || 'tops', category: scanResult.category || 'tops', color: scanResult.color || '', description: scanResult.short_description || '' })
      speak(RESPONSES.saved(name))
      setTimeout(() => navigate(SCREENS.WARDROBE), 1200)
    } catch {
      speak(RESPONSES.error); setPhase('naming')
    }
  }, [scanResult, customName, addItem, speak, navigate])

  const reset = useCallback(() => {
    setScanResult(null); setPreviewUrl(null); setErrorMsg(''); setCustomName('')
    capturedBlobRef.current = null; setPhase('camera')
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

  useEffect(() => {
    const handler = (e) => {
      const cmd = e.detail
      if (cmd.type === 'SAVE_ITEM' && phase === 'naming') handleSave()
      else if (cmd.type === 'DISCARD_ITEM') reset()
    }
    window.addEventListener('voiceCommand', handler)
    return () => window.removeEventListener('voiceCommand', handler)
  }, [phase, handleSave, reset])

  if (phase === 'camera') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <CameraCapture onCapture={handleCapture} aspectRatio="unset" />
        <div style={{ position: 'absolute', bottom: 140, left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 10 }}>
          <label aria-label="Upload from gallery" style={{
            background: COLORS.BG, border: `2px solid ${COLORS.BORDER}`,
            borderRadius: COLORS.RADIUS, color: COLORS.TEXT,
            fontSize: 14, fontWeight: 700, padding: '10px 20px',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
            letterSpacing: 0.5,
          }}>
            🖼 Upload from Gallery
            <input type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />
          </label>
        </div>
      </div>
    )
  }

  if (phase === 'analyzing' || phase === 'saving') {
    const subtitle = phase === 'saving' ? 'Saving to your wardrobe.' : 'Identifying your item…'
    return (
      <Screen title={phase === 'saving' ? 'Saving…' : 'Identifying…'} subtitle={subtitle}>
        {previewUrl && <img src={previewUrl} alt="" style={{ width: '100%', borderRadius: COLORS.RADIUS, marginBottom: 20, maxHeight: 320, objectFit: 'cover', border: `2px solid ${COLORS.BORDER}` }} />}
        <div role="status" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 40, gap: 20 }}>
          <Spinner />
          <p aria-live="polite" style={{ color: COLORS.TEXT_MUTED, fontSize: 14, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', margin: 0 }}>{subtitle}</p>
        </div>
      </Screen>
    )
  }

  if (phase === 'error') {
    return (
      <Screen title="Photo Issue" subtitle="Please retake the photo.">
        {previewUrl && <img src={previewUrl} alt="" style={{ width: '100%', borderRadius: COLORS.RADIUS, marginBottom: 20, maxHeight: 280, objectFit: 'cover', opacity: 0.55, border: `2px solid ${COLORS.BORDER}` }} />}
        <div role="alert" style={{ border: `2px solid ${COLORS.DANGER}`, borderRadius: COLORS.RADIUS, padding: 18, marginBottom: 24, background: COLORS.SURFACE }}>
          <p style={{ fontSize: 15, color: COLORS.DANGER, lineHeight: 1.7, margin: 0 }}>{errorMsg}</p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <BigButton label="Retake Photo" icon="📸" variant="primary" onClick={reset} />
          <BigButton label="Read Error Again" icon="🔊" onClick={() => speak(errorMsg)} />
        </div>
      </Screen>
    )
  }

  return (
    <Screen title="Save to Wardrobe" subtitle="Name this item">
      {previewUrl && <img src={previewUrl} alt="Clothing item to save" style={{ width: '100%', borderRadius: COLORS.RADIUS, marginBottom: 16, maxHeight: 280, objectFit: 'cover', border: `2px solid ${COLORS.BORDER}` }} />}

      {scanResult?.short_description && (
        <div style={{ border: `2px solid ${COLORS.BORDER}`, borderRadius: COLORS.RADIUS, padding: 16, marginBottom: 16, background: COLORS.SURFACE }}>
          <p style={{ fontSize: 15, color: COLORS.TEXT, lineHeight: 1.7, margin: 0 }}>{scanResult.short_description}</p>
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <label htmlFor="item-name" style={{ fontSize: 11, fontWeight: 700, color: COLORS.TEXT_MUTED, display: 'block', marginBottom: 8, letterSpacing: 1.2, textTransform: 'uppercase' }}>
          Item Name
        </label>
        <input
          id="item-name" ref={nameInputRef} type="text"
          value={customName} onChange={(e) => setCustomName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          placeholder={scanResult?.name || scanResult?.suggested_name || 'e.g. Navy Blue T-Shirt'}
          style={{
            width: '100%', boxSizing: 'border-box',
            background: COLORS.SURFACE, border: `2px solid ${COLORS.BORDER}`,
            borderRadius: COLORS.RADIUS, padding: '14px 16px',
            fontSize: 16, color: COLORS.TEXT, outline: 'none',
            marginBottom: 14, fontFamily: 'var(--font-ui)',
          }}
          onFocus={(e) => e.target.style.borderColor = COLORS.ACCENT}
          onBlur={(e) => e.target.style.borderColor = COLORS.BORDER}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <BigButton label="Save to Wardrobe" hint={`Save as: ${customName.trim() || 'Clothing Item'}`} icon="✓" variant="primary" onClick={handleSave} />
          <BigButton label="Retake Photo" hint="Discard and take a new photo" icon="📸" onClick={reset} />
        </div>
      </div>
    </Screen>
  )
}

function Spinner() {
  return (
    <div style={{ display: 'flex', gap: 5, alignItems: 'center', height: 40 }}>
      {[0,1,2,3,4].map(i => (
        <span key={i} style={{
          display: 'block', width: 6, background: COLORS.ACCENT,
          borderRadius: 0,
          animation: `sbar 800ms ease-in-out infinite`,
          animationDelay: `${i * 100}ms`,
          height: '100%',
        }} />
      ))}
      <style>{`@keyframes sbar { 0%,100%{transform:scaleY(0.3)} 50%{transform:scaleY(1)} }`}</style>
    </div>
  )
}
