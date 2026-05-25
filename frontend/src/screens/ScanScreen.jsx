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

const SAVEABLE = ['tops', 'bottoms', 'footwear', 'outerwear', 'dress']

export function ScanScreen() {
  const { navigate, goBack } = useApp()
  const { speak } = useVoice()
  const { addItem } = useWardrobe()

  const [phase, setPhase] = useState('camera')
  const [previewUrl, setPreviewUrl] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [items, setItems] = useState([])   // [{ scanResult, customName, removed }]
  const [savingIndex, setSavingIndex] = useState(-1)
  const capturedBlobRef = useRef(null)
  const savingRef = useRef(false)

  useEffect(() => {
    if (phase === 'camera') speak(RESPONSES.scanReady)
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCapture = useCallback(async (blob, dataUrl) => {
    setPhase((prev) => { if (prev !== 'camera') return prev; return 'analyzing' })
    setPreviewUrl(dataUrl)
    capturedBlobRef.current = blob
    speak('Identifying items. One moment.')
    try {
      const result = await quickScan(blob)

      // Normalise: new API returns items[], old API returns flat object
      const rawItems = result.items?.length
        ? result.items
        : [{ suggested_name: result.suggested_name, category: result.category, color: result.color, short_description: result.short_description, long_description: result.long_description }]

      const saveableItems = rawItems.filter(i => SAVEABLE.includes((i.category || '').toLowerCase()))

      if (saveableItems.length === 0) {
        const msg = 'This app only accepts clothing items. Please point the camera at a garment and try again.'
        setErrorMsg(msg)
        speak(msg)
        setPhase('not_clothing')
        return
      }

      const itemState = saveableItems.map(i => ({ scanResult: i, customName: i.suggested_name || '', removed: false }))
      setItems(itemState)

      const names = saveableItems.map(i => i.suggested_name).join(', ')
      const msg = saveableItems.length === 1
        ? `Found ${saveableItems[0].suggested_name}. Review and save.`
        : `Found ${saveableItems.length} items: ${names}. Review and save all.`
      speak(msg)
      setPhase('naming')
    } catch (err) {
      const msg = err.message || 'Could not identify the item. Please try a clearer photo.'
      const isNotClothing = err.error_code === 'not_clothing' || err.error_code === 'low_confidence'
      setErrorMsg(msg)
      speak(msg)
      setPhase(isNotClothing ? 'not_clothing' : 'error')
    }
  }, [speak])

  const handleSaveAll = useCallback(async (overrideItems) => {
    if (savingRef.current) return
    savingRef.current = true
    const toSave = (overrideItems || items).filter(i => !i.removed)
    if (toSave.length === 0) { savingRef.current = false; return }

    setPhase('saving')
    let saved = 0
    for (let idx = 0; idx < toSave.length; idx++) {
      setSavingIndex(idx)
      const { scanResult, customName } = toSave[idx]
      const name = customName.trim() || scanResult.suggested_name || 'Clothing Item'
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
        saved++
      } catch {
        // Continue saving remaining items even if one fails
      }
    }

    const msg = saved === 1
      ? RESPONSES.saved(toSave[0].customName.trim() || toSave[0].scanResult.suggested_name)
      : `Saved ${saved} item${saved !== 1 ? 's' : ''} to your wardrobe.`
    speak(msg)
    setTimeout(() => navigate(SCREENS.HOME), 1200)
  }, [items, addItem, speak, navigate])

  const reset = useCallback(() => {
    setItems([]); setPreviewUrl(null); setErrorMsg('')
    capturedBlobRef.current = null; savingRef.current = false
    setSavingIndex(-1); setPhase('camera')
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
      if (cmd.type === 'SAVE_ITEM' && phase === 'naming') handleSaveAll()
      else if (cmd.type === 'DISCARD_ITEM') reset()
    }
    window.addEventListener('voiceCommand', handler)
    return () => window.removeEventListener('voiceCommand', handler)
  }, [phase, handleSaveAll, reset])

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
            <div style={{ fontSize: 12, color: COLORS.TEXT_MUTED, marginTop: 2 }}>Point camera at clothing items</div>
          </div>
        </div>
        <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>
          <CameraCapture onCapture={handleCapture} onFrameDescribed={(t) => speak(t)} aspectRatio="unset" />
        </div>
        <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'center', padding: '10px 16px', background: COLORS.BG, borderTop: `2px solid ${COLORS.BORDER}` }}>
          <label aria-label="Upload from gallery" style={{
            background: COLORS.SURFACE, border: `2px solid ${COLORS.BORDER}`,
            borderRadius: COLORS.RADIUS, color: COLORS.TEXT,
            fontSize: 14, fontWeight: 700, padding: '10px 28px',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
          }}>
            Upload from Gallery
            <input type="file" accept="image/*" onChange={handleUpload} style={{ display: 'none' }} />
          </label>
        </div>
      </div>
    )
  }

  // ── Analyzing / Saving ──
  if (phase === 'analyzing' || phase === 'saving') {
    const toSave = items.filter(i => !i.removed)
    const subtitle = phase === 'saving'
      ? savingIndex >= 0 && toSave[savingIndex]
        ? `Saving ${toSave[savingIndex].customName || toSave[savingIndex].scanResult.suggested_name} (${savingIndex + 1} of ${toSave.length})…`
        : 'Saving to your wardrobe…'
      : 'Identifying items…'
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
      <Screen title="Cannot Save" subtitle="Only clothing items can be added to your wardrobe.">
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

  // ── Naming & Save (multi-item) ──
  const activeItems = items.filter(i => !i.removed)
  const subtitle = activeItems.length === 1
    ? 'Review and name this item'
    : `${activeItems.length} items detected — review and save all`

  return (
    <Screen title="Save to Wardrobe" subtitle={subtitle}>
      {previewUrl && <img src={previewUrl} alt="Scanned clothing" style={{ width: '100%', borderRadius: COLORS.RADIUS, marginBottom: 14, maxHeight: 220, objectFit: 'cover', border: `2px solid ${COLORS.BORDER}` }} />}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
        {items.map((item, idx) => {
          if (item.removed) return null
          return (
            <ItemCard
              key={idx}
              scanResult={item.scanResult}
              customName={item.customName}
              onNameChange={(val) => setItems(prev => prev.map((it, i) => i === idx ? { ...it, customName: val } : it))}
              onRemove={() => {
                setItems(prev => prev.map((it, i) => i === idx ? { ...it, removed: true } : it))
                speak(`${item.scanResult.suggested_name} removed.`)
              }}
              onReadAloud={(text) => speak(text)}
              showRemove={activeItems.length > 1}
            />
          )
        })}
      </div>

      {activeItems.length === 0 ? (
        <BigButton label="Retake Photo" icon="📸" variant="primary" onClick={reset} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <BigButton
            label={activeItems.length === 1 ? 'Save to Wardrobe' : `Save All ${activeItems.length} Items`}
            hint={activeItems.map(i => i.customName.trim() || i.scanResult.suggested_name).join(', ')}
            icon="✓"
            variant="primary"
            onClick={() => handleSaveAll()}
          />
          <BigButton label="Retake Photo" hint="Discard and take a new photo" icon="📸" onClick={reset} />
        </div>
      )}

      <ContextChat
        resultContext={items.map(i => [i.scanResult?.short_description, i.scanResult?.long_description].filter(Boolean).join(' ')).join(' ')}
        feature="scan"
        speak={speak}
      />
    </Screen>
  )
}

function ItemCard({ scanResult, customName, onNameChange, onRemove, onReadAloud, showRemove }) {
  const [descMode, setDescMode] = useState('short')

  const displayDesc = descMode === 'long'
    ? (scanResult?.long_description || scanResult?.short_description || '')
    : (scanResult?.short_description || '')

  return (
    <div style={{ border: `2px solid ${COLORS.BORDER}`, borderRadius: COLORS.RADIUS, overflow: 'hidden', background: COLORS.SURFACE }}>
      {/* Header: category + remove */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: `2px solid ${COLORS.BORDER}`, background: COLORS.BG }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: COLORS.TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 1 }}>
          {scanResult.category}
        </span>
        {showRemove && (
          <button onClick={onRemove} aria-label={`Remove ${scanResult.suggested_name}`} style={{
            background: 'transparent', border: `1px solid ${COLORS.BORDER}`, borderRadius: 4,
            color: COLORS.TEXT_MUTED, fontSize: 11, fontWeight: 700, padding: '2px 8px',
            cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 0.8,
          }}>Remove</button>
        )}
      </div>

      {/* Description */}
      {(scanResult.short_description || scanResult.long_description) && (
        <div style={{ borderBottom: `2px solid ${COLORS.BORDER}` }}>
          <div style={{ display: 'flex', borderBottom: `1px solid ${COLORS.BORDER}` }}>
            {['short', 'long'].map((mode) => (
              <button key={mode} onClick={() => setDescMode(mode)}
                style={{
                  flex: 1, padding: '7px 0',
                  background: descMode === mode ? COLORS.SURFACE_INVERSE : 'transparent',
                  color: descMode === mode ? COLORS.TEXT_ON_ACCENT : COLORS.TEXT_MUTED,
                  border: 'none', borderRight: mode === 'short' ? `1px solid ${COLORS.BORDER}` : 'none',
                  fontSize: 10, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', cursor: 'pointer',
                }}>
                {mode === 'short' ? 'Short' : 'Full'}
              </button>
            ))}
          </div>
          <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <p style={{ fontSize: 13, color: COLORS.TEXT, lineHeight: 1.6, margin: 0, flex: 1 }}>{displayDesc}</p>
            <button onClick={() => onReadAloud(displayDesc)} aria-label="Read aloud" style={{
              background: 'transparent', border: 'none', color: COLORS.ACCENT,
              fontSize: 16, cursor: 'pointer', flexShrink: 0, padding: 0,
            }}>🔊</button>
          </div>
        </div>
      )}

      {/* Name input */}
      <div style={{ padding: '10px 12px' }}>
        <label style={{ fontSize: 10, fontWeight: 700, color: COLORS.TEXT_MUTED, display: 'block', marginBottom: 6, letterSpacing: 1, textTransform: 'uppercase' }}>
          Item Name
        </label>
        <input
          type="text"
          value={customName}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder={scanResult.suggested_name || 'e.g. Navy Blue T-Shirt'}
          style={{
            width: '100%', boxSizing: 'border-box', background: COLORS.BG,
            border: `2px solid ${COLORS.BORDER}`, borderRadius: COLORS.RADIUS,
            padding: '10px 12px', fontSize: 14, color: COLORS.TEXT,
            outline: 'none', fontFamily: 'var(--font-ui)',
          }}
          onFocus={(e) => e.target.style.borderColor = COLORS.ACCENT}
          onBlur={(e) => e.target.style.borderColor = COLORS.BORDER}
        />
      </div>
    </div>
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
