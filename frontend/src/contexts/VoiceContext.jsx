import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { parseCommand } from '../voice/commandParser.js'
import { useApp } from './AppContext.jsx'
import { SCREENS, VOICE_LOCALE } from '../utils/constants.js'

const VoiceContext = createContext(null)

export function VoiceProvider({ children }) {
  const { navigate, goBack, toggleDescMode, setDescMode } = useApp()
  const [listening, setListening] = useState(false)
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef(null)
  const screenCommandRef = useRef(null)

  const registerScreenCommand = useCallback((fn) => {
    screenCommandRef.current = fn
    return () => { screenCommandRef.current = null }
  }, [])

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return

    const r = new SpeechRecognition()
    r.continuous = true
    r.interimResults = true
    r.lang = VOICE_LOCALE
    recognitionRef.current = r

    r.onresult = (e) => {
      const last = e.results[e.results.length - 1]
      const text = last[0].transcript
      setTranscript(text)
      if (!last.isFinal) return

      const cmd = parseCommand(text)
      if (!cmd) {
        screenCommandRef.current?.({ raw: text })
        return
      }

      switch (cmd.intent) {
        case 'navigate': navigate(SCREENS[cmd.screen]); break
        case 'back': goBack(); break
        case 'desc_mode':
          if (cmd.mode === 'toggle') toggleDescMode()
          else setDescMode(cmd.mode)
          break
        default:
          window.dispatchEvent(new CustomEvent('voiceCommand', { detail: cmd }))
      }
    }

    r.onstart = () => setListening(true)
    r.onend = () => { setListening(false); setTimeout(() => r.start(), 500) }
    r.start()

    return () => { r.onend = null; r.stop() }
  }, [navigate, goBack, toggleDescMode, setDescMode])

  return (
    <VoiceContext.Provider value={{ listening, transcript, registerScreenCommand }}>
      {children}
    </VoiceContext.Provider>
  )
}

export const useVoice = () => useContext(VoiceContext)
