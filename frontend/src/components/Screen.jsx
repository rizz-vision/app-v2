import { COLORS } from '../utils/constants.js'
import { useApp } from '../contexts/AppContext.jsx'

export function Screen({ title, subtitle, children, back, onBack }) {
  const { goBack } = useApp()

  return (
    <div className="screen">
      {back !== false && (
        <div style={{ padding: '12px 16px 0', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <button
            onClick={onBack || goBack}
            aria-label="Go back"
            style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.TEXT_MUTED, fontSize: 20, borderRadius: 10, background: 'rgba(255,255,255,0.05)' }}
          >
            ←
          </button>
        </div>
      )}
      <main
        tabIndex={-1}
        id="main"
        className="scroll"
        style={{ paddingBottom: 'max(120px, calc(env(safe-area-inset-bottom) + 100px))' }}
      >
        <header style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 11, color: COLORS.ACCENT_LIGHT, letterSpacing: '0.3em', textTransform: 'uppercase', marginBottom: 6, fontWeight: 600 }}>
            RIZZVISION
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 900, color: COLORS.TEXT, lineHeight: 1.15, marginBottom: subtitle ? 10 : 0 }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{ fontSize: 17, color: COLORS.TEXT_MUTED, lineHeight: 1.7, fontFamily: 'var(--font-body)' }}>
              {subtitle}
            </p>
          )}
        </header>
        {children}
      </main>
    </div>
  )
}
