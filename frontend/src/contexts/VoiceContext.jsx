import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { parseCommand } from '../voice/commandParser.js'
import { useApp } from './AppContext.jsx'
import { voiceQuery } from '../services/api.js'
import { SCREENS, VOICE_LOCALE, SCREEN_DESCRIPTIONS, SCREEN_HELP, RESPONSES } from '../utils/constants.js'

const VoiceContext = createContext(null)

export function VoiceProvider({ children }) {
  const { navigate, goBack, toggleDescMode, setDescMode, current } = useApp()
  const [listening, setListening] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef(null)
  const synthRef = useRef(window.speechSynthesis)
  const pausedRef = useRef(false)
  const lastSpokenRef = useRef('')

  // ── speak ──────────────────────────────────────────────────────────────────
  const speak = useCallback((text) => {
    if (!text) return
    lastSpokenRef.current = text
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
    if (listening) { r.stop() } else { try { r.start() } catch {} }
  }, [listening])

  // ── handle navigation commands returned from the API ───────────────────────
  const handleApiCommand = useCallback((command) => {
    if (!command) return
    const key = command.trim().toUpperCase()
    if (SCREENS[key]) navigate(SCREENS[key])
  }, [navigate])

  // ── fall back to /voice-query for anything the parser doesn't recognise ────
  const askAssistant = useCallback(async (text) => {
    speak(RESPONSES.thinking)
    try {
      const result = await voiceQuery(text, current.screen)
      if (result.answer) speak(result.answer)
      if (result.command) handleApiCommand(result.command)
    } catch {
      speak(RESPONSES.error)
    }
  }, [current.screen, speak, handleApiCommand])

  // ── process a final transcript ─────────────────────────────────────────────
  const handleFinal = useCallback((text) => {
    const cmd = parseCommand(text)

    if (!cmd) {
      // Nothing matched locally → hand off to the AI assistant
      askAssistant(text)
      return
    }

    switch (cmd.intent) {
      case 'navigate':
        navigate(SCREENS[cmd.screen])
        break
      case 'back':
        goBack()
        break
      case 'desc_mode':
        if (cmd.mode === 'toggle') toggleDescMode()
        else setDescMode(cmd.mode)
        break
      case 'repeat':
        if (lastSpokenRef.current) speak(lastSpokenRef.current)
        break
      case 'stop_speech':
        stop()
        break
      case 'describe_screen':
        speak(SCREEN_DESCRIPTIONS[current.screen] || SCREEN_DESCRIPTIONS.HOME)
        break
      case 'help':
        speak(SCREEN_HELP[current.screen] || SCREEN_HELP.HOME)
        break
      case 'read_wardrobe':
        window.dispatchEvent(new CustomEvent('voiceCommand', { detail: { type: 'READ_WARDROBE' } }))
        break
      case 'save_item':
        window.dispatchEvent(new CustomEvent('voiceCommand', { detail: { type: 'SAVE_ITEM' } }))
        break
      default:
        window.dispatchEvent(new CustomEvent('voiceCommand', { detail: cmd }))
    }
  }, [navigate, goBack, toggleDescMode, setDescMode, speak, stop, askAssistant, current.screen])

  // ── SpeechRecognition — always-on, auto-restarts on end ───────────────────
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return

    const r = new SpeechRecognition()
    r.continuous = true
    r.interimResults = true
    r.lang = VOICE_LOCALE
    recognitionRef.current = r

    r.onstart = () => setListening(true)
    r.onend = () => {
      setListening(false)
      if (!pausedRef.current) setTimeout(() => { try { r.start() } catch {} }, 300)
    }
    r.onerror = (e) => {
      if (e.error !== 'no-speech') console.warn('SpeechRecognition error:', e.error)
    }

    r.start()

    const pause = () => { pausedRef.current = true; r.stop() }
    const resume = () => { pausedRef.current = false; try { r.start() } catch {} }
    window.addEventListener('pauseGlobalVoice', pause)
    window.addEventListener('resumeGlobalVoice', resume)

    return () => {
      r.onend = null
      r.stop()
      window.removeEventListener('pauseGlobalVoice', pause)
      window.removeEventListener('resumeGlobalVoice', resume)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Re-attach onresult whenever handleFinal changes (screen navigation, etc.)
  // without tearing down and recreating the recognition instance
  useEffect(() => {
    const r = recognitionRef.current
    if (!r) return
    r.onresult = (e) => {
      if (pausedRef.current) return
      const last = e.results[e.results.length - 1]
      const text = last[0].transcript
      setTranscript(text)
      if (last.isFinal) handleFinal(text.trim())
    }
  }, [handleFinal])

  return (
    <VoiceContext.Provider value={{ listening, isThinking, transcript, speak, stop, toggleListening }}>
      {children}
    </VoiceContext.Provider>
  )
}

export const useVoice = () => useContext(VoiceContext)
