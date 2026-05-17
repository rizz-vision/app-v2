import { useCallback, useRef } from 'react'
import { VOICE_LOCALE } from '../utils/constants.js'

export function useSpeechOutput() {
  const utteranceRef = useRef(null)

  const speak = useCallback((text, { onEnd } = {}) => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.lang = VOICE_LOCALE
    u.rate = 0.95
    u.pitch = 1.0
    if (onEnd) u.onend = onEnd
    utteranceRef.current = u
    window.speechSynthesis.speak(u)
  }, [])

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel()
  }, [])

  const speakSegments = useCallback((segments, { onEnd } = {}) => {
    if (!segments?.length) return
    const texts = segments.map((s) => s.text).join(' ')
    speak(texts, { onEnd })
  }, [speak])

  return { speak, stop, speakSegments }
}
