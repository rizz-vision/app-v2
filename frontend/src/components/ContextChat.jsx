import { useState, useRef, useCallback, useEffect } from 'react'
import { contextChat } from '../services/api.js'
import { useWardrobe } from '../contexts/WardrobeContext.jsx'
import { useApp } from '../contexts/AppContext.jsx'
import { COLORS } from '../utils/constants.js'

const PLACEHOLDERS = {
  scan:     'e.g. Why does this colour not work?',
  mirror:   'e.g. What should I change first?',
  outfit:   'e.g. Can I swap one of these items?',
  shopping: 'e.g. Would this work for a wedding?',
  wardrobe: 'e.g. What goes with my white polo?',
}

// resultContext: the AI-generated result text shown on the current screen
export function ContextChat({ resultContext = '', feature, speak }) {
  const { items: wardrobeItems } = useWardrobe()
  const { language } = useApp()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(false)
  const [listening, setListening] = useState(false)
  const inputRef = useRef(null)
  const bottomRef = useRef(null)
  const recognitionRef = useRef(null)

  const wardrobeContext = wardrobeItems.length > 0
    ? `${wardrobeItems.length} items: ` + wardrobeItems.slice(0, 20).map((i) => `${i.name} (${i.category}${i.color ? ', ' + i.color : ''})`).join(', ')
    : 'empty'

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
      const data = await contextChat({
        question: q,
        feature,
        resultContext,
        wardrobeContext,
        history,
        language,
      })
      const answer = data.answer || 'No response.'
      setHistory([...nextHistory, { role: 'assistant', text: answer }])
      speak?.(answer)
    } catch {
      const errMsg = 'Something went wrong. Please try again.'
      setHistory([...nextHistory, { role: 'assistant', text: errMsg }])
      speak?.(errMsg)
    } finally {
      setLoading(false)
    }
  }, [history, resultContext, wardrobeContext, feature, language, loading, speak])

  const startVoice = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) { speak?.('Voice input not supported.'); return }
    window.dispatchEvent(new CustomEvent('pauseGlobalVoice'))
    const rec = new SR()
    rec.interimResults = false
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

  const exchangeCount = Math.floor(history.length / 2)

  return (
    <div role="region" aria-label="Follow-up questions" style={{ marginTop: 16 }}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          width: '100%',
          background: 'transparent',
          border: `2px solid ${open ? COLORS.ACCENT : COLORS.BORDER}`,
          borderRadius: open ? `${COLORS.RADIUS}px ${COLORS.RADIUS}px 0 0` : COLORS.RADIUS,
          padding: '14px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer',
          color: open ? COLORS.ACCENT : COLORS.TEXT_MUTED,
          fontSize: 13, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          Ask a question
          {exchangeCount > 0 && (
            <span style={{ background: COLORS.ACCENT, color: COLORS.TEXT_ON_ACCENT, borderRadius: 2, padding: '1px 7px', fontSize: 11, fontWeight: 900 }}>
              {exchangeCount}
            </span>
          )}
        </span>
        <span aria-hidden style={{ fontSize: 14 }}>{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div style={{
          background: COLORS.BG,
          border: `2px solid ${COLORS.ACCENT}`,
          borderTop: 'none',
          borderRadius: `0 0 ${COLORS.RADIUS}px ${COLORS.RADIUS}px`,
          display: 'flex', flexDirection: 'column',
        }}>
          {/* History */}
          <div
            role="log"
            aria-live="polite"
            style={{ overflowY: 'auto', maxHeight: 240, padding: '14px 14px 0', display: 'flex', flexDirection: 'column', gap: 8 }}
          >
            {history.length === 0 && (
              <p style={{ fontSize: 13, color: COLORS.TEXT_MUTED, margin: 0, lineHeight: 1.6 }}>
                Ask anything about your {feature === 'wardrobe' ? 'wardrobe' : 'result'} — outfit advice, styling tips, wardrobe questions.
              </p>
            )}
            {history.map((turn, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: turn.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '85%',
                  background: turn.role === 'user' ? COLORS.SURFACE_INVERSE : COLORS.SURFACE,
                  color: turn.role === 'user' ? COLORS.TEXT_ON_ACCENT : COLORS.TEXT,
                  border: `2px solid ${turn.role === 'user' ? COLORS.SURFACE_INVERSE : COLORS.BORDER}`,
                  borderRadius: COLORS.RADIUS,
                  padding: '10px 14px', fontSize: 14, lineHeight: 1.65,
                }}>
                  {turn.text}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex' }}>
                <div style={{ background: COLORS.SURFACE, border: `2px solid ${COLORS.BORDER}`, borderRadius: COLORS.RADIUS, padding: '10px 16px', fontSize: 18, color: COLORS.TEXT_MUTED, letterSpacing: 4 }}>
                  <span aria-label="Thinking" role="status">• • •</span>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input row */}
          <div style={{ display: 'flex', gap: 8, padding: 12, borderTop: `2px solid ${COLORS.BORDER}`, marginTop: 8 }}>
            <button
              onClick={listening ? stopVoice : startVoice}
              aria-label={listening ? 'Stop voice input' : 'Voice input'}
              aria-pressed={listening}
              style={{
                width: 44, height: 44, flexShrink: 0,
                border: `2px solid ${listening ? COLORS.ACCENT : COLORS.BORDER}`,
                borderRadius: COLORS.RADIUS,
                background: listening ? COLORS.ACCENT : 'transparent',
                color: listening ? COLORS.TEXT_ON_ACCENT : COLORS.TEXT_MUTED,
                fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
              }}
            >
              {listening ? '⏹' : '🎤'}
            </button>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit(input)}
              placeholder={PLACEHOLDERS[feature] || 'Ask anything about fashion…'}
              aria-label="Type your question"
              disabled={loading || listening}
              style={{
                flex: 1,
                background: COLORS.SURFACE,
                border: `2px solid ${COLORS.BORDER}`,
                borderRadius: COLORS.RADIUS,
                padding: '10px 14px', fontSize: 14, color: COLORS.TEXT, outline: 'none',
                opacity: loading || listening ? 0.5 : 1,
                fontFamily: 'var(--font-ui)',
              }}
              onFocus={(e) => e.target.style.borderColor = COLORS.ACCENT}
              onBlur={(e) => e.target.style.borderColor = COLORS.BORDER}
            />
            <button
              onClick={() => submit(input)}
              disabled={!input.trim() || loading}
              aria-label="Send question"
              style={{
                width: 44, height: 44, flexShrink: 0,
                border: `2px solid ${input.trim() && !loading ? COLORS.ACCENT : COLORS.BORDER}`,
                borderRadius: COLORS.RADIUS,
                background: input.trim() && !loading ? COLORS.ACCENT : 'transparent',
                color: input.trim() && !loading ? COLORS.TEXT_ON_ACCENT : COLORS.TEXT_MUTED,
                fontSize: 18, fontWeight: 900, cursor: input.trim() && !loading ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
