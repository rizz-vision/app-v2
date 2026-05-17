import { useState, useRef } from 'react'
import { Screen } from '../components/Screen.jsx'
import { BigButton } from '../components/BigButton.jsx'
import { useAuth } from '../contexts/AuthContext.jsx'
import { COLORS } from '../utils/constants.js'

const inputStyle = {
  width: '100%',
  minHeight: 56,
  background: COLORS.SURFACE,
  border: `2px solid ${COLORS.BORDER}`,
  borderRadius: 14,
  color: COLORS.TEXT,
  fontSize: 18,
  padding: '14px 20px',
  boxSizing: 'border-box',
  outline: 'none',
}

export function AuthScreen() {
  const { signIn, signUp, signInWithGoogle } = useAuth()
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [googleSubmitting, setGoogleSubmitting] = useState(false)
  const modeRef = useRef(null)

  const isBusy = submitting || googleSubmitting

  const mapError = (msg) => {
    if (!msg) return 'Something went wrong. Please try again.'
    const n = msg.toLowerCase()
    if (n.includes('invalid login credentials')) return 'Email or password is incorrect.'
    if (n.includes('email not confirmed')) return 'Check your inbox and confirm your email first.'
    if (n.includes('already registered')) return 'That email is already registered. Try signing in.'
    if (n.includes('password should be at least')) return 'Password must be at least 6 characters.'
    return msg
  }

  const handleToggle = () => {
    const next = !isSignUp
    setIsSignUp(next); setError(null)
    setTimeout(() => {
      if (modeRef.current) {
        modeRef.current.textContent = ''
        setTimeout(() => { if (modeRef.current) modeRef.current.textContent = next ? 'Create Account form.' : 'Sign In form.' }, 80)
      }
    }, 0)
  }

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(null); setSubmitting(true)
    try {
      const { error: authError } = isSignUp ? await signUp(email, password) : await signIn(email, password)
      if (authError) setError(mapError(authError.message))
    } catch { setError('Something went wrong. Please try again.') }
    finally { setSubmitting(false) }
  }

  const handleGoogle = async () => {
    setError(null); setGoogleSubmitting(true)
    try {
      const { error: authError } = await signInWithGoogle()
      if (authError) setError(mapError(authError.message))
    } catch { setError('Google sign-in unavailable. Please try again.') }
    finally { setGoogleSubmitting(false) }
  }

  return (
    <>
      <div ref={modeRef} aria-live="polite" aria-atomic="true" style={{ position: 'absolute', left: -9999, width: 1, height: 1, overflow: 'hidden' }} />
      <Screen title={isSignUp ? 'Create Account' : 'Welcome Back'} subtitle={isSignUp ? 'Sign up to save your wardrobe.' : 'Sign in to access your wardrobe.'} back={false}>

        <button type="button" onClick={handleGoogle} disabled={isBusy} aria-label="Sign in with Google"
          style={{ width: '100%', minHeight: 56, borderRadius: 14, border: `2px solid ${COLORS.BORDER}`, background: COLORS.SURFACE, color: COLORS.TEXT, fontSize: 17, fontWeight: 700, cursor: isBusy ? 'not-allowed' : 'pointer', opacity: isBusy ? 0.6 : 1 }}>
          {googleSubmitting ? 'Redirecting to Google...' : 'Continue with Google'}
        </button>

        <div aria-hidden style={{ margin: '14px 0', width: '100%', borderTop: `1px solid ${COLORS.BORDER}` }} />

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 14, color: COLORS.TEXT_MUTED, letterSpacing: '0.05em' }}>EMAIL</span>
            <input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = COLORS.ACCENT}
              onBlur={(e) => e.target.style.borderColor = COLORS.BORDER}
            />
          </label>
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 14, color: COLORS.TEXT_MUTED, letterSpacing: '0.05em' }}>PASSWORD</span>
            <input type="password" autoComplete={isSignUp ? 'new-password' : 'current-password'} required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters"
              style={inputStyle}
              onFocus={(e) => e.target.style.borderColor = COLORS.ACCENT}
              onBlur={(e) => e.target.style.borderColor = COLORS.BORDER}
            />
          </label>

          {error && (
            <div role="alert" aria-live="assertive" style={{ background: 'rgba(239,68,68,0.12)', border: `1px solid ${COLORS.DANGER}`, borderRadius: 12, padding: '12px 16px', fontSize: 15, color: COLORS.DANGER }}>
              {error}
            </div>
          )}

          <BigButton type="submit" label={submitting ? 'Please wait...' : isSignUp ? 'Sign Up' : 'Sign In'} hint={isSignUp ? 'Create account' : 'Sign in to your account'} icon={isSignUp ? '✨' : '→'} variant="primary" disabled={isBusy} />
        </form>

        <button type="button" onClick={handleToggle} disabled={isBusy}
          style={{ background: 'transparent', border: 'none', color: COLORS.ACCENT_LIGHT, fontSize: 16, fontWeight: 700, cursor: isBusy ? 'not-allowed' : 'pointer', opacity: isBusy ? 0.5 : 1, padding: '20px 0', width: '100%', textAlign: 'center' }}>
          {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
        </button>
      </Screen>
    </>
  )
}
