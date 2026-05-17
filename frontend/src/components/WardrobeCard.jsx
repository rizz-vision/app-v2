import { COLORS } from '../utils/constants.js'

export function WardrobeCard({ item, onTap, onEdit, onDelete }) {
  const subtitle = item.description
    || `${item.colorDescription || item.color || ''} ${item.pattern || ''} ${item.type || item.category || ''}`.trim()

  return (
    <div style={{ display: 'flex', gap: 0, alignItems: 'stretch', border: `2px solid ${COLORS.BORDER}`, borderRadius: COLORS.RADIUS }}>
      <button
        onClick={() => onTap(item)}
        aria-label={`${item.name}. ${subtitle}. Tap to hear description.`}
        style={{
          flex: 1,
          minHeight: 72,
          background: COLORS.SURFACE,
          border: 'none',
          borderRadius: 0,
          color: COLORS.TEXT,
          fontSize: 16,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          padding: '12px 16px',
          textAlign: 'left',
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        {item.imageUrl ? (
          <img src={item.imageUrl} alt="" aria-hidden style={{ width: 48, height: 48, borderRadius: 0, objectFit: 'cover', flexShrink: 0, border: `1px solid ${COLORS.TEXT_DIM}` }} />
        ) : (
          <div aria-hidden style={{
            width: 48, height: 48, flexShrink: 0,
            background: COLORS.BG,
            border: `1px solid ${COLORS.TEXT_DIM}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22,
          }}>
            👕
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{item.name}</div>
          <div style={{ fontSize: 12, color: COLORS.TEXT_MUTED, marginTop: 3, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {subtitle}
          </div>
        </div>
        <span aria-hidden style={{ fontSize: 16, color: COLORS.ACCENT, flexShrink: 0 }}>▶</span>
      </button>

      {(onEdit || onDelete) && (
        <div style={{ display: 'flex', flexDirection: 'column', borderLeft: `2px solid ${COLORS.BORDER}`, flexShrink: 0 }}>
          {onEdit && (
            <button onClick={() => onEdit(item)} aria-label={`Edit ${item.name}`}
              style={{
                flex: 1, width: 48,
                background: 'transparent', border: 'none',
                borderBottom: onDelete ? `2px solid ${COLORS.BORDER}` : 'none',
                color: COLORS.ACCENT, fontSize: 16, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 0,
              }}>
              ✎
            </button>
          )}
          {onDelete && (
            <button onClick={() => onDelete(item.id)} aria-label={`Delete ${item.name}`}
              style={{
                flex: 1, width: 48,
                background: 'transparent', border: 'none',
                color: COLORS.DANGER, fontSize: 18, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 0,
              }}>
              ✕
            </button>
          )}
        </div>
      )}
    </div>
  )
}
