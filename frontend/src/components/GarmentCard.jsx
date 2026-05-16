import { COLORS } from '../utils/constants.js'

export function GarmentCard({ item, onEdit, onDelete, onSelect, selected }) {
  return (
    <div
      className="glass"
      onClick={onSelect}
      style={{
        padding: 12,
        cursor: onSelect ? 'pointer' : 'default',
        border: selected ? `1px solid ${COLORS.ACCENT_LIGHT}` : `1px solid ${COLORS.BORDER}`,
        transition: 'border-color 200ms',
      }}
    >
      {item.image_url && (
        <img
          src={item.image_url}
          alt={item.name || 'Garment'}
          style={{ width: '100%', aspectRatio: '3/4', objectFit: 'cover', borderRadius: 10, marginBottom: 10 }}
        />
      )}
      <p style={{ fontWeight: 600, fontSize: 14, marginBottom: 4, color: COLORS.TEXT }}>{item.name || 'Unnamed item'}</p>
      {item.color && (
        <p style={{ fontSize: 12, color: COLORS.TEXT_MUTED, marginBottom: 8 }}>{item.color}</p>
      )}
      {(onEdit || onDelete) && (
        <div style={{ display: 'flex', gap: 8 }}>
          {onEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(item) }}
              style={{ flex: 1, padding: '8px 0', fontSize: 12, background: COLORS.ACCENT_DIM,
                color: COLORS.ACCENT_LIGHT, borderRadius: 8, minHeight: 36 }}
            >Edit</button>
          )}
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(item.id) }}
              style={{ flex: 1, padding: '8px 0', fontSize: 12, background: 'rgba(239,68,68,0.1)',
                color: COLORS.DANGER, borderRadius: 8, minHeight: 36 }}
            >Remove</button>
          )}
        </div>
      )}
    </div>
  )
}
