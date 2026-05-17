import { COLORS } from '../utils/constants.js'
import { useApp } from '../contexts/AppContext.jsx'

export function Screen({ title, subtitle, children, back, onBack }) {
  const { goBack } = useApp()

  return (
    <div className="screen">
      <div style={{
        padding: '10px 16px 0',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        flexShrink: 0,
        borderBottom: `2px solid ${COLORS.BORDER}`,
        paddingBottom: 12,
      }}>
        {back !== false ? (
          <button
            onClick={onBack || goBack}
            aria-label="Go back"
            style={{
              width: 44, height: 44, minWidth: 44,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: COLORS.TEXT, fontSize: 20,
              border: `2px solid ${COLORS.BORDER}`,
              borderRadius: COLORS.RADIUS,
              background: 'transparent',
              flexShrink: 0,
            }}
          >
            ←
          </button>
        ) : (
          <div style={{ width: 8 }} />
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{
            fontSize: 20,
            fontWeight: 700,
            color: COLORS.TEXT,
            lineHeight: 1.1,
            letterSpacing: -0.3,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{ fontSize: 13, color: COLORS.TEXT_MUTED, marginTop: 2, lineHeight: 1.4 }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>
      <main
        tabIndex={-1}
        id="main"
        className="scroll"
        style={{ paddingBottom: 'max(120px, calc(env(safe-area-inset-bottom) + 100px))' }}
      >
        {children}
      </main>
    </div>
  )
}
