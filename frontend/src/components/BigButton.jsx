import { COLORS } from '../utils/constants.js'

export function BigButton({ label, hint, icon, onClick, variant = 'default', disabled, type = 'button', style: extraStyle }) {
  const isPrimary = variant === 'primary'
  const isSuccess = variant === 'success'
  const isDanger  = variant === 'danger'

  let bg, fg, borderColor
  if (isPrimary) {
    bg = COLORS.SURFACE_INVERSE; fg = COLORS.TEXT_ON_ACCENT; borderColor = COLORS.SURFACE_INVERSE
  } else if (isSuccess) {
    bg = COLORS.SUCCESS; fg = COLORS.TEXT_ON_ACCENT; borderColor = COLORS.SUCCESS
  } else if (isDanger) {
    bg = 'transparent'; fg = COLORS.DANGER; borderColor = COLORS.DANGER
  } else {
    bg = 'transparent'; fg = COLORS.TEXT; borderColor = COLORS.BORDER
  }

  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-label={hint ? `${label}. ${hint}` : label}
      aria-disabled={disabled}
      style={{
        width: '100%',
        minHeight: 64,
        background: disabled ? COLORS.SURFACE : bg,
        border: `2px solid ${disabled ? COLORS.TEXT_DIM : borderColor}`,
        borderRadius: COLORS.RADIUS,
        color: disabled ? COLORS.TEXT_DIM : fg,
        fontSize: 17,
        fontWeight: 700,
        letterSpacing: -0.2,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '0 20px',
        textAlign: 'left',
        transition: `opacity ${COLORS.RADIUS}ms`,
        opacity: disabled ? 0.45 : 1,
        WebkitTapHighlightColor: 'transparent',
        ...extraStyle,
      }}
    >
      {icon && (
        <div aria-hidden style={{
          width: 42, height: 42, minWidth: 42,
          background: disabled ? COLORS.TEXT_DIM : (isPrimary ? COLORS.TEXT_ON_ACCENT : COLORS.BORDER),
          color: disabled ? COLORS.SURFACE : (isPrimary ? COLORS.SURFACE_INVERSE : COLORS.BG),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, borderRadius: 0, flexShrink: 0,
        }}>
          {icon}
        </div>
      )}
      <span style={{ flex: 1 }}>{label}</span>
      <span aria-hidden style={{ fontSize: 18, color: disabled ? COLORS.TEXT_DIM : 'inherit', opacity: 0.6 }}>›</span>
    </button>
  )
}
