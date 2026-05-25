import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { parseCommand } from '../voice/commandParser.js'
import { useApp } from './AppContext.jsx'
import { useWardrobe } from './WardrobeContext.jsx'
import { SCREENS, SCREEN_DESCRIPTIONS, SCREEN_HELP, RESPONSES, VOICE_COMMANDS_HELP, localeForLang } from '../utils/constants.js'

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const VoiceContext = createContext(null)

// Play a 50ms silent mp3 blob to "trick" the browser into not triggering its
// own mic-activation sound before SpeechRecognition starts.
let _silentAudioUrl = null
function _getSilentUrl() {
  if (_silentAudioUrl) return _silentAudioUrl
  // Minimal valid MP3: 50ms silence
  const b64 = 'SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4LjI5LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//sQZAAP8AAAaQAAAAgAAA0gAAABAAABpAAAACAAADSAAAAETEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV'
  const bytes = atob(b64)
  const buf = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) buf[i] = bytes.charCodeAt(i)
  const blob = new Blob([buf], { type: 'audio/mpeg' })
  _silentAudioUrl = URL.createObjectURL(blob)
  return _silentAudioUrl
}

export function VoiceProvider({ children }) {
  const { navigate, goBack, toggleDescMode, setDescMode, current, language } = useApp()
  const { items: wardrobeItems } = useWardrobe()
  const locale = localeForLang(language)

  const [listening, setListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [transcript, setTranscript] = useState('')

  const recognitionRef = useRef(null)
  const audioRef = useRef(null)
  const processingRef = useRef(false)
  const lastSpokenRef = useRef('')
  const fatalErrorRef = useRef(false)
  const restartTimerRef = useRef(null)

  const r = useCallback((key, ...args) => {
    const map = RESPONSES[language] ?? RESPONSES.en
    const val = map[key]
    return typeof val === 'function' ? val(...args) : val
  }, [language])

  // ── Kokoro TTS — only speech path, no browser TTS fallback ────────────────
  const speak = useCallback(async (text) => {
    if (!text) return
    lastSpokenRef.current = text

    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setIsSpeaking(false)

    try {
      const fd = new FormData()
      fd.append('text', text)
      fd.append('language', language)
      const res = await fetch(`${BASE}/tts`, { method: 'POST', body: fd })
      if (!res.ok) throw new Error(`TTS ${res.status}`)

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const audio = new Audio(url)
      audioRef.current = audio
      setIsSpeaking(true)
      audio.onended = () => {
        setIsSpeaking(false)
        URL.revokeObjectURL(url)
        if (audioRef.current === audio) audioRef.current = null
      }
      audio.onerror = () => {
        setIsSpeaking(false)
        URL.revokeObjectURL(url)
        if (audioRef.current === audio) audioRef.current = null
      }
      audio.play()
    } catch {
      // TTS backend unavailable — fall back to browser SpeechSynthesis
      setIsSpeaking(false)
      try {
        if (window.speechSynthesis) {
          window.speechSynthesis.cancel()
          const utt = new SpeechSynthesisUtterance(text)
          utt.lang = language === 'hi' ? 'hi-IN' : 'en-US'
          utt.rate = 0.95
          window.speechSynthesis.speak(utt)
        }
      } catch {}
    }
  }, [language])

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    setIsSpeaking(false)
  }, [])

  // ── Start/stop mic ─────────────────────────────────────────────────────────
  const startListening = useCallback(() => {
    if (processingRef.current) return
    const rec = recognitionRef.current
    if (!rec || listening) return

    // Play silent audio first to suppress browser beep
    try {
      const silent = new Audio(_getSilentUrl())
      silent.volume = 0
      silent.play().catch(() => {})
    } catch {}

    fatalErrorRef.current = false
    try { rec.start() } catch {}
    speak(r('listening'))
  }, [listening, speak, r])

  const stopListening = useCallback(() => {
    const rec = recognitionRef.current
    if (rec && listening) rec.stop()
  }, [listening])

  const toggleListening = useCallback(() => {
    if (listening) stopListening()
    else startListening()
  }, [listening, startListening, stopListening])

  // ── Handle a recognised final transcript — pure local matching, no API ─────
  const handleFinal = useCallback((text) => {
    if (processingRef.current) return

    const cmd = parseCommand(text)

    if (!cmd) {
      // No match — tell the user what they can say, no Gemini call
      speak(r('notUnderstood'))
      return
    }

    switch (cmd.intent) {
      case 'navigate':
        navigate(SCREENS[cmd.screen])
        speak(r('navigating', cmd.screen))
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
      case 'describe_screen': {
        const descs = SCREEN_DESCRIPTIONS[language] ?? SCREEN_DESCRIPTIONS.en
        speak(descs[current.screen] ?? descs.HOME)
        break
      }
      case 'help': {
        const helps = SCREEN_HELP[language] ?? SCREEN_HELP.en
        speak(helps[current.screen] ?? helps.HOME)
        break
      }
      case 'describe_frame':
        window.dispatchEvent(new CustomEvent('voiceCommand', { detail: { type: 'DESCRIBE_FRAME' } }))
        break
      case 'read_wardrobe':
        window.dispatchEvent(new CustomEvent('voiceCommand', { detail: { type: 'READ_WARDROBE' } }))
        break
      case 'save_item':
        window.dispatchEvent(new CustomEvent('voiceCommand', { detail: { type: 'SAVE_ITEM' } }))
        break
      case 'capture':
        window.dispatchEvent(new CustomEvent('voiceCommand', { detail: { type: 'CAPTURE' } }))
        break
      default:
        window.dispatchEvent(new CustomEvent('voiceCommand', { detail: cmd }))
    }
  }, [navigate, goBack, toggleDescMode, setDescMode, speak, stop, language, current.screen, r])

  // ── SpeechRecognition setup ────────────────────────────────────────────────
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return

    const rec = new SpeechRecognition()
    rec.continuous = false      // single utterance — stops after one result, no endless capture
    rec.interimResults = false  // final results only — faster, no partial updates
    rec.lang = locale
    rec.maxAlternatives = 1
    recognitionRef.current = rec

    const FATAL = new Set(['not-allowed', 'service-not-allowed', 'audio-capture'])

    rec.onstart = () => { setListening(true); fatalErrorRef.current = false }
    rec.onend = () => { setListening(false) }
    rec.onerror = (e) => {
      if (FATAL.has(e.error)) {
        fatalErrorRef.current = true
        console.warn('SpeechRecognition fatal:', e.error)
      }
    }

    return () => {
      rec.onend = null
      clearTimeout(restartTimerRef.current)
      rec.stop()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Re-attach onresult when handleFinal changes
  useEffect(() => {
    const rec = recognitionRef.current
    if (!rec) return
    rec.onresult = (e) => {
      if (processingRef.current) return
      const text = e.results[0][0].transcript
      setTranscript(text)
      handleFinal(text.trim())
    }
  }, [handleFinal])

  // Update locale on language change
  useEffect(() => {
    const rec = recognitionRef.current
    if (!rec) return
    rec.lang = localeForLang(language)
  }, [language])

  const t = useCallback((key, ...args) => r(key, ...args), [r])

  return (
    <VoiceContext.Provider value={{
      listening, isSpeaking, isProcessing, transcript,
      speak, stop, toggleListening, startListening, stopListening, t, language
    }}>
      {children}
    </VoiceContext.Provider>
  )
}

export const useVoice = () => useContext(VoiceContext)
