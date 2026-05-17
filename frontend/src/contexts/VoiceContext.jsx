import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { parseCommand } from '../voice/commandParser.js'
import { useApp } from './AppContext.jsx'
import { SCREENS, VOICE_LOCALE } from '../utils/constants.js'

const VoiceContext = createContext(null)

export function VoiceProvider({ children }) {
  const { navigate, goBack, toggleDescMode, setDescMode } = useApp()
  const [listening, setListening] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef(null)
  const synthRef = useRef(window.speechSynthesis)
  const pausedRef = useRef(false)

  const speak = useCallback((text) => {
    if (!text) return
    const synth = synthRef.current
    synth.cancel()
    const utt = new SpeechSynthesisUtterance(text)
    utt.lang = VOICE_LOCALE
    utt.rate = 0.95
    utt.pitch = 1
    utt.onstart = () => setIsThinking(true)
    utt.onend = () => setIsThinking(false)
    utt.onerror = () => setIsThinking(false)
    synth.speak(utt)
  }, [])

  const stop = useCallback(() => {
    synthRef.current?.cancel()
    setIsThinking(false)
  }, [])

  const toggleListening = useCallback(() => {
    const r = recognitionRef.current
    if (!r) return
    if (listening) {
      r.stop()
    } else {
      try { r.start() } catch {}
    }
  }, [listening])

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return

    const r = new SpeechRecognition()
    r.continuous = true
    r.interimResults = true
    r.lang = VOICE_LOCALE
    recognitionRef.current = r

    r.onresult = (e) => {
      if (pausedRef.current) return
      const last = e.results[e.results.length - 1]
      const text = last[0].transcript
      setTranscript(text)
      if (!last.isFinal) return

      const cmd = parseCommand(text)
      if (!cmd) {
        window.dispatchEvent(new CustomEvent('voiceCommand', { detail: { type: 'RAW', text } }))
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
    r.onend = () => {
      setListening(false)
      if (!pausedRef.current) setTimeout(() => { try { r.start() } catch {} }, 500)
    }
    r.start()

    const pause = () => { pausedRef.current = true; r.stop() }
    const resume = () => { pausedRef.current = false; try { r.start() } catch {} }
    window.addEventListener('pauseGlobalVoice', pause)
    window.addEventListener('resumeGlobalVoice', resume)

    return () => {
      r.onend = null; r.stop()
      window.removeEventListener('pauseGlobalVoice', pause)
      window.removeEventListener('resumeGlobalVoice', resume)
    }
  }, [navigate, goBack, toggleDescMode, setDescMode])

  return (
    <VoiceContext.Provider value={{ listening, isThinking, transcript, speak, stop, toggleListening }}>
      {children}
    </VoiceContext.Provider>
  )
}

export const useVoice = () => useContext(VoiceContext)
