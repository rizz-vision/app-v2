import { useState } from 'react'
import { useApp } from '../contexts/AppContext.jsx'
import { useWardrobe } from '../contexts/WardrobeContext.jsx'
import { COLORS } from '../utils/constants.js'

export function EditItemScreen() {
  const { goBack, current } = useApp()
  const { updateItem } = useWardrobe()
  const item = current.params?.item || {}
  const [name, setName] = useState(item.name || '')
  const [color, setColor] = useState(item.color || '')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    try {
      await updateItem(item.id, { name, color })
      goBack()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="screen">
      <div style={{ padding: '16px 16px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={goBack} style={{ fontSize: 20, color: COLORS.TEXT_MUTED, minHeight: 44, minWidth: 44 }}>←</button>
        <h2 style={{ fontWeight: 700, fontSize: 18 }}>Edit Item</h2>
      </div>

      <div className="scroll" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {[['Name', name, setName, 'e.g. White cotton tee'], ['Color', color, setColor, 'e.g. Off-white']].map(([label, val, set, ph]) => (
          <div key={label}>
            <label style={{ fontSize: 12, color: COLORS.TEXT_MUTED, display: 'block', marginBottom: 6 }}>{label}</label>
            <input
              type="text" value={val} placeholder={ph}
              onChange={(e) => set(e.target.value)}
              style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: `1px solid ${COLORS.BORDER}`,
                background: 'rgba(255,255,255,0.04)', color: COLORS.TEXT, fontSize: 14, outline: 'none' }}
            />
          </div>
        ))}

        <button onClick={save} disabled={saving}
          style={{ width: '100%', padding: '16px 0', borderRadius: 14, fontWeight: 700, fontSize: 16,
            background: `linear-gradient(135deg, ${COLORS.ACCENT} 0%, #5B21B6 100%)`, color: '#fff', minHeight: 56 }}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
