import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { COLORS } from '../utils/constants.js'

export function AuthScreen() {
  const { signIn, signUp, signInWithGoogle } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('signin')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const fn = mode === 'signin' ? signIn : signUp
      const { error: err } = await fn(email, password)
      if (err) setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="screen" style={{ justifyContent: 'center' }}>
      <div style={{ padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <h1 className="gradient-text" style={{ fontSize: 36, fontWeight: 700 }}>Rizzvision</h1>
          <p style={{ fontSize: 14, color: COLORS.TEXT_MUTED, marginTop: 8 }}>AI-powered t-shirt analysis</p>
        </div>

        <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[['Email', email, setEmail, 'email'], ['Password', password, setPassword, 'password']].map(([label, val, set, type]) => (
            <input key={type} type={type} placeholder={label} value={val} onChange={(e) => set(e.target.value)} required
              style={{ width: '100%', padding: '16px', borderRadius: 14, border: `1px solid ${COLORS.BORDER}`,
                background: 'rgba(255,255,255,0.04)', color: COLORS.TEXT, fontSize: 15, outline: 'none' }} />
          ))}
          {error && <p style={{ fontSize: 13, color: COLORS.DANGER }}>{error}</p>}
          <button type="submit" disabled={loading}
            style={{ padding: '16px 0', borderRadius: 14, fontWeight: 700, fontSize: 16,
              background: `linear-gradient(135deg, ${COLORS.ACCENT} 0%, #5B21B6 100%)`, color: '#fff', minHeight: 56 }}>
            {loading ? '...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <button onClick={signInWithGoogle}
          style={{ width: '100%', padding: '14px 0', borderRadius: 14, fontSize: 15, fontWeight: 600,
            background: 'rgba(255,255,255,0.06)', border: `1px solid ${COLORS.BORDER}`, color: COLORS.TEXT, minHeight: 52 }}>
          Continue with Google
        </button>

        <button onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          style={{ fontSize: 14, color: COLORS.TEXT_DIM, minHeight: 44 }}>
          {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
        </button>
      </div>
    </div>
  )
}
