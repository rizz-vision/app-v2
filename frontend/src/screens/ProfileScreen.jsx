import { useState, useCallback } from 'react'
import { Screen } from '../components/Screen.jsx'
import { BigButton } from '../components/BigButton.jsx'
import { useProfile } from '../contexts/ProfileContext.jsx'
import { useVoice } from '../contexts/VoiceContext.jsx'
import { useApp } from '../contexts/AppContext.jsx'
import { COLORS } from '../utils/constants.js'

const BODY_TYPES = ['Slim', 'Athletic', 'Average', 'Curvy', 'Plus size']
const COLOR_OPTIONS = ['Black', 'White', 'Navy', 'Grey', 'Beige', 'Brown', 'Red', 'Blue', 'Green', 'Yellow', 'Pink', 'Purple', 'Orange']
const PATTERN_OPTIONS = ['Solid', 'Stripes', 'Checks', 'Floral', 'Geometric', 'Abstract', 'Animal print']
const STYLE_OPTIONS = ['Casual', 'Smart casual', 'Formal', 'Streetwear', 'Minimalist', 'Classic', 'Bohemian', 'Sporty']

export function ProfileScreen() {
  const { profile, saveProfile } = useProfile()
  const { speak } = useVoice()
  const { goBack } = useApp()

  const [height, setHeight] = useState(profile.height || '')
  const [weight, setWeight] = useState(profile.weight || '')
  const [bodyType, setBodyType] = useState(profile.bodyType || '')
  const [colorPrefs, setColorPrefs] = useState(profile.colorPrefs || [])
  const [avoidColors, setAvoidColors] = useState(profile.avoidColors || [])
  const [patterns, setPatterns] = useState(profile.patterns || [])
  const [stylePrefs, setStylePrefs] = useState(profile.stylePrefs || '')
  const [outfits, setOutfits] = useState(profile.outfits || []) // array of dataUrls
  const [saved, setSaved] = useState(false)

  const toggleArr = (arr, setArr, val) => {
    setArr(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val])
  }

  const handleOutfitUpload = useCallback((e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const remaining = 5 - outfits.length
    files.slice(0, remaining).forEach((file) => {
      const reader = new FileReader()
      reader.onload = (ev) => setOutfits((prev) => [...prev, ev.target.result].slice(0, 5))
      reader.readAsDataURL(file)
    })
  }, [outfits])

  const handleSave = useCallback(() => {
    saveProfile({ height, weight, bodyType, colorPrefs, avoidColors, patterns, stylePrefs, outfits })
    setSaved(true)
    speak('Profile saved. The app will use this to personalise your suggestions.')
    setTimeout(() => setSaved(false), 2000)
  }, [height, weight, bodyType, colorPrefs, avoidColors, patterns, stylePrefs, outfits, saveProfile, speak])

  return (
    <Screen title="My Profile" subtitle="All fields are optional">

      <Section label="Measurements">
        <Row>
          <Field label="Height" placeholder="e.g. 5ft 9in or 175cm" value={height} onChange={setHeight} />
          <Field label="Weight" placeholder="e.g. 70kg" value={weight} onChange={setWeight} />
        </Row>
        <ChipGroup label="Body Type" options={BODY_TYPES} selected={[bodyType]} onToggle={(v) => setBodyType(bodyType === v ? '' : v)} single />
      </Section>

      <Section label="Colour Preferences">
        <ChipGroup label="Colours I like" options={COLOR_OPTIONS} selected={colorPrefs} onToggle={(v) => toggleArr(colorPrefs, setColorPrefs, v)} />
        <ChipGroup label="Colours I avoid" options={COLOR_OPTIONS} selected={avoidColors} onToggle={(v) => toggleArr(avoidColors, setAvoidColors, v)} accent={COLORS.DANGER} />
      </Section>

      <Section label="Style">
        <ChipGroup label="Patterns" options={PATTERN_OPTIONS} selected={patterns} onToggle={(v) => toggleArr(patterns, setPatterns, v)} />
        <ChipGroup label="Style" options={STYLE_OPTIONS} selected={[stylePrefs]} onToggle={(v) => setStylePrefs(stylePrefs === v ? '' : v)} single />
      </Section>

      <Section label={`My Outfits (${outfits.length}/5)`}>
        <p style={{ fontSize: 13, color: COLORS.TEXT_MUTED, lineHeight: 1.6, marginBottom: 12, marginTop: 0 }}>
          Upload up to 5 outfits you already wear. The AI will learn your style from them.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: outfits.length < 5 ? 12 : 0 }}>
          {outfits.map((src, i) => (
            <div key={i} style={{ position: 'relative', width: 72, height: 72 }}>
              <img src={src} alt={`Outfit ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: COLORS.RADIUS, border: `2px solid ${COLORS.BORDER}` }} />
              <button
                onClick={() => setOutfits(outfits.filter((_, j) => j !== i))}
                aria-label={`Remove outfit ${i + 1}`}
                style={{ position: 'absolute', top: -8, right: -8, width: 22, height: 22, borderRadius: '50%', background: COLORS.DANGER, border: 'none', color: '#fff', fontSize: 12, fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >×</button>
            </div>
          ))}
        </div>
        {outfits.length < 5 && (
          <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: `2px solid ${COLORS.BORDER}`, borderRadius: COLORS.RADIUS, padding: '10px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: COLORS.TEXT_MUTED }}>
            + Add Outfit Photo
            <input type="file" accept="image/*" multiple onChange={handleOutfitUpload} style={{ display: 'none' }} />
          </label>
        )}
      </Section>

      <div style={{ marginTop: 8 }}>
        <BigButton
          label={saved ? 'Saved!' : 'Save Profile'}
          icon={saved ? '✓' : '💾'}
          variant="primary"
          onClick={handleSave}
        />
      </div>
    </Screen>
  )
}

function Section({ label, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: 'uppercase', color: COLORS.TEXT_MUTED, marginBottom: 12 }}>{label}</div>
      {children}
    </div>
  )
}

function Row({ children }) {
  return <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>{children}</div>
}

function Field({ label, placeholder, value, onChange }) {
  return (
    <div style={{ flex: 1 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: COLORS.TEXT_MUTED, display: 'block', marginBottom: 6, letterSpacing: 1, textTransform: 'uppercase' }}>{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width: '100%', boxSizing: 'border-box', background: COLORS.SURFACE, border: `2px solid ${COLORS.BORDER}`, borderRadius: COLORS.RADIUS, padding: '10px 12px', fontSize: 14, color: COLORS.TEXT, outline: 'none', fontFamily: 'var(--font-ui)' }}
        onFocus={(e) => e.target.style.borderColor = COLORS.ACCENT}
        onBlur={(e) => e.target.style.borderColor = COLORS.BORDER}
      />
    </div>
  )
}

function ChipGroup({ label, options, selected, onToggle, accent, single }) {
  const activeColor = accent || COLORS.ACCENT
  return (
    <div style={{ marginBottom: 12 }}>
      {label && <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.TEXT_MUTED, marginBottom: 8, letterSpacing: 1, textTransform: 'uppercase' }}>{label}</div>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {options.map((opt) => {
          const active = selected.includes(opt)
          return (
            <button
              key={opt}
              onClick={() => onToggle(opt)}
              aria-pressed={active}
              style={{
                border: `2px solid ${active ? activeColor : COLORS.BORDER}`,
                borderRadius: COLORS.RADIUS,
                padding: '6px 12px',
                fontSize: 12, fontWeight: 700,
                background: active ? activeColor : 'transparent',
                color: active ? (accent ? '#fff' : COLORS.TEXT_ON_ACCENT) : COLORS.TEXT_MUTED,
                cursor: 'pointer', minHeight: 36,
              }}
            >{opt}</button>
          )
        })}
      </div>
    </div>
  )
}
