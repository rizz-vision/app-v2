import { COLORS } from '../utils/constants.js'

export function BigButton({ label, hint, icon, onClick, variant = 'default', disabled, type = 'button', style: extraStyle }) {
  const bg = variant === 'primary' ? COLORS.ACCENT
           : variant === 'success' ? COLORS.SUCCESS
           : variant === 'danger'  ? COLORS.DANGER
           : COLORS.SURFACE

  const fg = variant === 'primary' ? '#fff'
           : variant === 'success' ? '#fff'
           : variant === 'danger'  ? '#fff'
           : COLORS.TEXT

  const border = variant === 'default' ? COLORS.BORDER : bg

  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-label={hint ? `${label}. ${hint}` : label}
      aria-disabled={disabled}
      style={{
        width: '100%',
        minHeight: 88,
        background: disabled ? 'rgba(255,255,255,0.03)' : bg,
        border: `2px solid ${disabled ? COLORS.BORDER : border}`,
        borderRadius: 20,
        color: disabled ? COLORS.TEXT_DIM : fg,
        fontSize: 20,
        fontWeight: 800,
        letterSpacing: '0.02em',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        padding: '0 28px',
        textAlign: 'left',
        transition: 'opacity 0.15s',
        opacity: disabled ? 0.45 : 1,
        WebkitTapHighlightColor: 'rgba(124,58,237,0.2)',
        ...extraStyle,
      }}
    >
      {icon && <span aria-hidden style={{ fontSize: 34, flexShrink: 0 }}>{icon}</span>}
      <span style={{ flex: 1 }}>{label}</span>
    </button>
  )
}
