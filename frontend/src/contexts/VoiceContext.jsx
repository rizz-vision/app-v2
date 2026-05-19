import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { parseCommand } from '../voice/commandParser.js'
import { useApp } from './AppContext.jsx'
import { useWardrobe } from './WardrobeContext.jsx'
import { voiceQuery } from '../services/api.js'
import { SCREENS, SCREEN_DESCRIPTIONS, SCREEN_HELP, RESPONSES, localeForLang } from '../utils/constants.js'

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const VoiceContext = createContext(null)

export function VoiceProvider({ children }) {
  const { navigate, goBack, toggleDescMode, setDescMode, current, language } = useApp()
  const { items: wardrobeItems } = useWardrobe()
  const locale = localeForLang(language)
  const [listening, setListening] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [transcript, setTranscript] = useState('')
  const recognitionRef = useRef(null)
  const audioRef = useRef(null)        // current HTMLAudioElement (Kokoro path)
  const synthRef = useRef(window.speechSynthesis)
  const pausedRef = useRef(false)
  const lastSpokenRef = useRef('')
  const fatalErrorRef = useRef(false)  // set true on not-allowed; cleared on manual tap

  // ── helpers ────────────────────────────────────────────────────────────────
  const r = useCallback((key, ...args) => {
    const map = RESPONSES[language] ?? RESPONSES.en
    const val = map[key]
    return typeof val === 'function' ? val(...args) : val
  }, [language])

  // ── stop any current speech (both paths) ──────────────────────────────────
  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    synthRef.current?.cancel()
    setIsThinking(false)
  }, [])

  // ── Web Speech API fallback ───────────────────────────────────────────────
  const _fallbackSpeak = useCallback((text) => {
    const synth = synthRef.current
    synth.cancel()
    const utt = new SpeechSynthesisUtterance(text)
    utt.lang = locale
    utt.rate = 0.95
    utt.pitch = 1
    utt.onstart = () => setIsThinking(true)
    utt.onend = () => setIsThinking(false)
    utt.onerror = () => setIsThinking(false)
    synth.speak(utt)
  }, [locale])

  // ── primary speak — Kokoro via /tts, fallback to Web Speech API ───────────
  const speak = useCallback(async (text) => {
    if (!text) return
    lastSpokenRef.current = text
    stop()

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
      setIsThinking(true)
      audio.onended = () => {
        setIsThinking(false)
        URL.revokeObjectURL(url)
        if (audioRef.current === audio) audioRef.current = null
      }
      audio.onerror = () => {
        setIsThinking(false)
        URL.revokeObjectURL(url)
        if (audioRef.current === audio) audioRef.current = null
      }
      audio.play()
    } catch {
      // /tts unavailable (local dev without backend, or network error) → fallback
      _fallbackSpeak(text)
    }
  }, [language, stop, _fallbackSpeak])

  const toggleListening = useCallback(() => {
    const rec = recognitionRef.current
    if (!rec) return
    if (listening) {
      rec.stop()
    } else {
      fatalErrorRef.current = false   // user explicitly requesting mic — clear any fatal error
      try { rec.start() } catch {}
    }
  }, [listening])

  // ── handle navigation commands returned from the API ───────────────────────
  const handleApiCommand = useCallback((command) => {
    if (!command) return
    const key = command.trim().toUpperCase()
    if (SCREENS[key]) navigate(SCREENS[key])
  }, [navigate])

  // ── AI assistant fallback for unrecognised speech ─────────────────────────
  const askAssistant = useCallback(async (text) => {
    speak(r('thinking'))
    try {
      const wardrobeCtx = wardrobeItems.length > 0
        ? `Wardrobe has ${wardrobeItems.length} items: ` + wardrobeItems.slice(0, 20).map((i) => `${i.name} (${i.category})`).join(', ')
        : 'Wardrobe is empty.'
      const result = await voiceQuery(text, current.screen, language, wardrobeCtx)
      if (result.answer) speak(result.answer)
      if (result.command) handleApiCommand(result.command)
    } catch {
      speak(r('error'))
    }
  }, [current.screen, language, wardrobeItems, speak, handleApiCommand, r])

  // ── process a final transcript ─────────────────────────────────────────────
  const handleFinal = useCallback((text) => {
    const cmd = parseCommand(text)

    if (!cmd) {
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
      case 'read_wardrobe':
        window.dispatchEvent(new CustomEvent('voiceCommand', { detail: { type: 'READ_WARDROBE' } }))
        break
      case 'save_item':
        window.dispatchEvent(new CustomEvent('voiceCommand', { detail: { type: 'SAVE_ITEM' } }))
        break
      default:
        window.dispatchEvent(new CustomEvent('voiceCommand', { detail: cmd }))
    }
  }, [navigate, goBack, toggleDescMode, setDescMode, speak, stop, askAssistant, language, current.screen])

  // ── SpeechRecognition — always-on, auto-restarts with backoff ────────────
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) return

    const rec = new SpeechRecognition()
    rec.continuous = true
    rec.interimResults = true
    rec.lang = locale
    recognitionRef.current = rec

    let backoff = 300      // ms — doubles on each consecutive failure, caps at 10s
    let restartTimer = null
    // Fatal errors — do not restart, require user to tap mic manually
    const FATAL_ERRORS = new Set(['not-allowed', 'service-not-allowed', 'audio-capture'])

    rec.onstart = () => { setListening(true); backoff = 300; fatalErrorRef.current = false }
    rec.onend = () => {
      setListening(false)
      if (pausedRef.current || fatalErrorRef.current) return
      restartTimer = setTimeout(() => { try { rec.start() } catch {} }, backoff)
      backoff = Math.min(backoff * 2, 10_000)
    }
    rec.onerror = (e) => {
      if (FATAL_ERRORS.has(e.error)) {
        fatalErrorRef.current = true
        console.warn('SpeechRecognition: fatal error —', e.error, '— mic disabled until user taps')
      } else if (e.error !== 'no-speech') {
        console.warn('SpeechRecognition error:', e.error)
      }
    }

    rec.start()

    const pause = () => { pausedRef.current = true; clearTimeout(restartTimer); rec.stop() }
    const resume = () => { pausedRef.current = false; try { rec.start() } catch {} }
    window.addEventListener('pauseGlobalVoice', pause)
    window.addEventListener('resumeGlobalVoice', resume)

    return () => {
      rec.onend = null
      clearTimeout(restartTimer)
      rec.stop()
      window.removeEventListener('pauseGlobalVoice', pause)
      window.removeEventListener('resumeGlobalVoice', resume)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Re-attach onresult whenever handleFinal changes (screen/language)
  useEffect(() => {
    const rec = recognitionRef.current
    if (!rec) return
    rec.onresult = (e) => {
      if (pausedRef.current) return
      const last = e.results[e.results.length - 1]
      const text = last[0].transcript
      setTranscript(text)
      if (last.isFinal) handleFinal(text.trim())
    }
  }, [handleFinal])

  // Restart recognition with new locale when language changes
  useEffect(() => {
    const rec = recognitionRef.current
    if (!rec) return
    rec.lang = locale
    try { rec.stop() } catch {}
  }, [locale])

  const t = useCallback((key, ...args) => r(key, ...args), [r])

  return (
    <VoiceContext.Provider value={{ listening, isThinking, transcript, speak, stop, toggleListening, t, language }}>
      {children}
    </VoiceContext.Provider>
  )
}

export const useVoice = () => useContext(VoiceContext)
