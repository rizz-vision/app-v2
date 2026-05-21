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
  const [saved, setSaved] = useState(false)

  const toggleArr = (arr, setArr, val) => {
    setArr(arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val])
  }

  const handleSave = useCallback(() => {
    saveProfile({ height, weight, bodyType, colorPrefs, avoidColors, patterns, stylePrefs })
    setSaved(true)
    speak('Profile saved. Shopping mode and outfit suggestions will now respect your colour and style preferences.')
    setTimeout(() => setSaved(false), 2000)
  }, [height, weight, bodyType, colorPrefs, avoidColors, patterns, stylePrefs, saveProfile, speak])

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
