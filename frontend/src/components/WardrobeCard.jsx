import { COLORS } from '../utils/constants.js'

export function WardrobeCard({ item, onTap, onEdit, onDelete }) {
  const subtitle = item.description
    || `${item.colorDescription || item.color || ''} ${item.pattern || ''} ${item.type || item.category || ''}`.trim()

  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', animation: 'fadeUp 0.25s ease' }}>
      <button
        onClick={() => onTap(item)}
        aria-label={`${item.name}. ${subtitle}. Tap to hear description.`}
        style={{
          flex: 1,
          minHeight: 84,
          background: COLORS.SURFACE,
          border: `2px solid ${COLORS.BORDER}`,
          borderRadius: 18,
          color: COLORS.TEXT,
          fontSize: 18,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '14px 20px',
          textAlign: 'left',
          cursor: 'pointer',
          WebkitTapHighlightColor: 'rgba(124,58,237,0.15)',
        }}
      >
        {item.imageUrl ? (
          <img src={item.imageUrl} alt="" aria-hidden style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
        ) : (
          <div aria-hidden style={{ width: 52, height: 52, borderRadius: 10, flexShrink: 0, background: COLORS.BORDER, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
            👕
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700 }}>{item.name}</div>
          <div style={{ fontSize: 13, color: COLORS.TEXT_MUTED, marginTop: 4, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {subtitle}
          </div>
        </div>
        <span aria-hidden style={{ fontSize: 22, color: COLORS.TEXT_MUTED }}>🔊</span>
      </button>

      {(onEdit || onDelete) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
          {onEdit && (
            <button onClick={() => onEdit(item)} aria-label={`Edit ${item.name}`}
              style={{ width: 48, height: 48, borderRadius: 14, background: 'transparent', border: `2px solid ${COLORS.ACCENT}`, color: COLORS.ACCENT_LIGHT, fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ✎
            </button>
          )}
          {onDelete && (
            <button onClick={() => onDelete(item.id)} aria-label={`Delete ${item.name}`}
              style={{ width: 48, height: 48, borderRadius: 14, background: 'transparent', border: `2px solid ${COLORS.DANGER}`, color: COLORS.DANGER, fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              ✕
            </button>
          )}
        </div>
      )}
      <style>{`@keyframes fadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  )
}
