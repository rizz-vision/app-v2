import { useState, useRef, useCallback, useEffect } from 'react'
import { contextChat } from '../services/api.js'
import { COLORS } from '../utils/constants.js'

const PLACEHOLDERS = {
  scan: 'e.g. Why does this colour not work?',
  mirror: 'e.g. What should I change first?',
  outfit: 'e.g. Can I swap one of these items?',
  shopping: 'e.g. Would this work for a wedding?',
  wardrobe: 'e.g. What goes with my white polo?',
}

export function ContextChat({ context, feature, speak, announce }) {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const inputRef = useRef(null)
  const bottomRef = useRef(null)
  const recognitionRef = useRef(null)

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [history, open])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 80)
  }, [open])

  const submit = useCallback(async (text) => {
    const q = text.trim()
    if (!q || loading) return
    setInput('')

    const userTurn = { role: 'user', text: q }
    const nextHistory = [...history, userTurn]
    setHistory(nextHistory)
    setLoading(true)

    try {
      const data = await contextChat({ question: q, context, feature })
      const answer = data.answer || data.response || 'No response.'
      const assistantTurn = { role: 'assistant', text: answer }
      setHistory([...nextHistory, assistantTurn])
      speak?.(answer)
      announce?.(answer, 'polite')
    } catch {
      const errMsg = 'Something went wrong. Please try again.'
      setHistory([...nextHistory, { role: 'assistant', text: errMsg }])
      speak?.(errMsg)
    } finally {
      setLoading(false)
    }
  }, [history, context, feature, loading, speak, announce])

  const startVoice = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { speak?.('Voice input is not supported in this browser.'); return }
    window.dispatchEvent(new CustomEvent('pauseGlobalVoice'))
    const rec = new SR()
    rec.interimResults = false
    rec.maxAlternatives = 1
    rec.onresult = (e) => {
      const t = e.results[0][0].transcript.trim()
      setListening(false)
      window.dispatchEvent(new CustomEvent('resumeGlobalVoice'))
      submit(t)
    }
    rec.onerror = rec.onend = () => {
      setListening(false)
      window.dispatchEvent(new CustomEvent('resumeGlobalVoice'))
    }
    recognitionRef.current = rec
    rec.start()
    setListening(true)
    speak?.('Listening. Ask your question.')
  }, [speak, submit])

  const stopVoice = useCallback(() => {
    recognitionRef.current?.stop()
    setListening(false)
    window.dispatchEvent(new CustomEvent('resumeGlobalVoice'))
  }, [])

  return (
    <div role="region" aria-label="Follow-up chat" style={{ marginTop: 16 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          width: '100%',
          background: open ? COLORS.SURFACE : 'transparent',
          border: `2px solid ${open ? COLORS.ACCENT : COLORS.BORDER}`,
          borderRadius: open ? '14px 14px 0 0' : 14,
          padding: '14px 18px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer',
          color: open ? COLORS.ACCENT_LIGHT : COLORS.TEXT_MUTED,
          fontSize: 14, fontWeight: 700, letterSpacing: '0.06em',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span aria-hidden>💬</span>
          Ask a follow-up question
          {history.length > 0 && (
            <span style={{ background: COLORS.ACCENT, color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 900 }}>
              {Math.floor(history.length / 2)}
            </span>
          )}
        </span>
        <span aria-hidden style={{ fontSize: 16 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{ background: COLORS.SURFACE, border: `2px solid ${COLORS.ACCENT}`, borderTop: 'none', borderRadius: '0 0 14px 14px', padding: '0 0 14px 0', maxHeight: 340, display: 'flex', flexDirection: 'column' }}>
          <div role="log" aria-live="polite" style={{ overflowY: 'auto', flex: 1, padding: '14px 16px 0', display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 220 }}>
            {history.length === 0 && (
              <p style={{ fontSize: 14, color: COLORS.TEXT_MUTED, margin: 0, lineHeight: 1.6 }}>
                Ask anything about this result.
              </p>
            )}
            {history.map((turn, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: turn.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '82%',
                  background: turn.role === 'user' ? COLORS.ACCENT : 'rgba(255,255,255,0.08)',
                  color: COLORS.TEXT,
                  borderRadius: turn.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  padding: '10px 14px', fontSize: 14, lineHeight: 1.6,
                }}>
                  {turn.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex' }}>
                <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: '14px 14px 14px 4px', padding: '10px 18px', fontSize: 20, color: COLORS.TEXT_MUTED, letterSpacing: 4 }}>
                  <span aria-label="Thinking" role="status">•••</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div style={{ display: 'flex', gap: 8, padding: '10px 14px 0', borderTop: `1px solid ${COLORS.BORDER}`, marginTop: 10 }}>
            <button onClick={listening ? stopVoice : startVoice} aria-label={listening ? 'Stop voice' : 'Voice input'} aria-pressed={listening}
              style={{ width: 44, height: 44, flexShrink: 0, borderRadius: '50%', background: listening ? COLORS.ACCENT : 'transparent', border: `2px solid ${listening ? COLORS.ACCENT : COLORS.BORDER}`, color: listening ? '#fff' : COLORS.TEXT_MUTED, fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <span aria-hidden>{listening ? '⏹' : '🎤'}</span>
            </button>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit(input)}
              placeholder={PLACEHOLDERS[feature] || 'Ask anything…'}
              aria-label="Type your follow-up question"
              disabled={loading || listening}
              style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: `1px solid ${COLORS.BORDER}`, borderRadius: 10, padding: '10px 14px', fontSize: 14, color: COLORS.TEXT, outline: 'none', opacity: loading || listening ? 0.5 : 1 }}
              onFocus={(e) => e.target.style.borderColor = COLORS.ACCENT}
              onBlur={(e) => e.target.style.borderColor = COLORS.BORDER}
            />
            <button onClick={() => submit(input)} disabled={!input.trim() || loading}
              aria-label="Send"
              style={{ width: 44, height: 44, flexShrink: 0, borderRadius: 10, background: input.trim() && !loading ? COLORS.ACCENT : 'transparent', color: input.trim() && !loading ? '#fff' : COLORS.TEXT_MUTED, border: `2px solid ${input.trim() && !loading ? COLORS.ACCENT : COLORS.BORDER}`, fontSize: 18, fontWeight: 900, cursor: input.trim() && !loading ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
