import { useState, useEffect, useRef } from 'react'
import { Screen } from '../components/Screen.jsx'
import { BigButton } from '../components/BigButton.jsx'
import { useApp } from '../contexts/AppContext.jsx'
import { useWardrobe } from '../contexts/WardrobeContext.jsx'
import { useVoice } from '../contexts/VoiceContext.jsx'
import { COLORS, CATEGORIES, RESPONSES } from '../utils/constants.js'

export function EditItemScreen() {
  const { navParams, goBack } = useApp()
  const { editItem } = useWardrobe()
  const { speak } = useVoice()
  const item = navParams?.item

  const [formValues, setFormValues] = useState({
    name: item?.name ?? '',
    category: item?.category ?? '',
    color: item?.color ?? '',
    pattern: item?.pattern ?? '',
    description: item?.description ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (item) speak(`Editing ${item.name}. Tap a field to change it, then tap Save.`)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSaveRef = useRef(null)
  useEffect(() => { handleSaveRef.current = handleSave })

  useEffect(() => {
    const handler = (e) => { if (e.detail?.type === 'CONFIRM' && !saving) handleSaveRef.current?.() }
    window.addEventListener('voiceCommand', handler)
    return () => window.removeEventListener('voiceCommand', handler)
  }, [saving])

  if (!item) { goBack(); return null }

  const handleSave = async () => {
    setSaving(true); setError(null)
    try {
      await editItem(item.id, formValues)
      speak(RESPONSES.itemUpdated(item.name))
      goBack()
    } catch {
      speak(RESPONSES.error)
      setError('Failed to save. Please try again.')
      setSaving(false)
    }
  }

  const field = (label, key, multiline = false) => (
    <div style={{ marginBottom: 20 }}>
      <label htmlFor={`edit-${key}`} style={{ display: 'block', fontSize: 13, color: COLORS.TEXT_MUTED, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>
        {label}
      </label>
      {multiline ? (
        <textarea
          id={`edit-${key}`}
          value={formValues[key]}
          onChange={(e) => setFormValues((v) => ({ ...v, [key]: e.target.value }))}
          rows={3}
          style={{ width: '100%', boxSizing: 'border-box', background: COLORS.SURFACE, border: `2px solid ${COLORS.BORDER}`, borderRadius: COLORS.RADIUS, padding: '14px 16px', fontSize: 16, color: COLORS.TEXT, resize: 'vertical', outline: 'none', fontFamily: 'var(--font-ui)' }}
          onFocus={(e) => { e.target.style.borderColor = COLORS.ACCENT; speak(`${label}. Current: ${formValues[key] || 'empty'}`) }}
          onBlur={(e) => (e.target.style.borderColor = COLORS.BORDER)}
        />
      ) : (
        <input
          id={`edit-${key}`}
          type="text"
          value={formValues[key]}
          onChange={(e) => setFormValues((v) => ({ ...v, [key]: e.target.value }))}
          style={{ width: '100%', boxSizing: 'border-box', background: COLORS.SURFACE, border: `2px solid ${COLORS.BORDER}`, borderRadius: COLORS.RADIUS, padding: '14px 16px', fontSize: 16, color: COLORS.TEXT, outline: 'none', fontFamily: 'var(--font-ui)' }}
          onFocus={(e) => { e.target.style.borderColor = COLORS.ACCENT; speak(`${label}. Current: ${formValues[key] || 'empty'}`) }}
          onBlur={(e) => (e.target.style.borderColor = COLORS.BORDER)}
        />
      )}
    </div>
  )

  return (
    <Screen title="Edit Item" subtitle={item.name}>
      {field('Name', 'name')}

      <div style={{ marginBottom: 20 }}>
        <div id="edit-category-label" style={{ fontSize: 13, color: COLORS.TEXT_MUTED, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>Category</div>
        <div role="group" aria-labelledby="edit-category-label" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {CATEGORIES.map((cat) => {
            const active = formValues.category === cat.id
            return (
              <button key={cat.id} onClick={() => { setFormValues((v) => ({ ...v, category: cat.id })); speak(`Category: ${cat.label}`) }}
                aria-pressed={active}
                style={{ background: active ? COLORS.SURFACE_INVERSE : COLORS.SURFACE, color: active ? COLORS.TEXT_ON_ACCENT : COLORS.TEXT, border: `2px solid ${active ? COLORS.SURFACE_INVERSE : COLORS.BORDER}`, borderRadius: COLORS.RADIUS, padding: '8px 16px', fontSize: 14, fontWeight: active ? 700 : 500, cursor: 'pointer', minHeight: 40 }}>
                {cat.icon} {cat.label}
              </button>
            )
          })}
        </div>
      </div>

      {field('Color', 'color')}
      {field('Pattern', 'pattern')}
      {field('Description', 'description', true)}

      {error && <p role="alert" style={{ fontSize: 14, color: COLORS.DANGER, marginBottom: 16 }}>{error}</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <BigButton label={saving ? 'Saving...' : 'Save Changes'} hint="Save your edits" icon="✓" variant="success" onClick={handleSave} disabled={saving} />
        <BigButton label="Cancel" hint="Discard changes and go back" icon="✕" onClick={goBack} disabled={saving} />
      </div>
    </Screen>
  )
}
