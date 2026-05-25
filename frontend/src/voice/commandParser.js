// Pure local command matching — no API calls, zero latency.
// If a transcript matches, return a command object. Otherwise return null
// and the caller will say "didn't catch that".

export function parseCommand(transcript) {
  const t = transcript.toLowerCase().trim()

  // ── Navigation ─────────────────────────────────────────────────────────────
  // Broad keyword matching — user just needs to say the screen name anywhere
  if (/\b(home|main menu|go home)\b/.test(t))                              return { intent: 'navigate', screen: 'HOME' }
  if (/\b(scan|camera|take photo|photograph|capture item)\b/.test(t))      return { intent: 'navigate', screen: 'SCAN' }
  if (/\b(wardrobe|my clothes|my items|closet)\b/.test(t))                 return { intent: 'navigate', screen: 'WARDROBE' }
  if (/\b(outfit|suggestion|what to wear|dress)\b/.test(t))                return { intent: 'navigate', screen: 'OUTFIT' }
  if (/\b(shopping|shop|buying|before i buy)\b/.test(t))                   return { intent: 'navigate', screen: 'SHOPPING' }
  if (/\b(mirror|full (body|look)|full outfit)\b/.test(t))                 return { intent: 'navigate', screen: 'MIRROR' }
  if (/\b(profile|settings|my profile)\b/.test(t))                         return { intent: 'navigate', screen: 'PROFILE' }
  if (/\b(back|go back|previous|return)\b/.test(t))                        return { intent: 'back' }

  // ── Playback ───────────────────────────────────────────────────────────────
  if (/\b(repeat|again|say that again|say again)\b/.test(t))               return { intent: 'repeat' }
  if (/\b(stop|quiet|silence|enough)\b/.test(t))                           return { intent: 'stop_speech' }

  // ── Wardrobe actions ───────────────────────────────────────────────────────
  if (/\b(read|list|show) (all |my )?(items|clothes|wardrobe)\b/.test(t))  return { intent: 'read_wardrobe' }
  if (/\b(save|add to wardrobe|keep this)\b/.test(t))                      return { intent: 'save_item' }
  if (/\b(capture|take|shoot)\b/.test(t))                                  return { intent: 'capture' }

  // ── Live frame description ─────────────────────────────────────────────────
  if (/\b(describe (this|what (i see|you see|is here))|what (is this|am i holding|do i see)|what('s| is) (in front of me|this))\b/.test(t)) return { intent: 'describe_frame' }

  // ── Help ───────────────────────────────────────────────────────────────────
  if (/\b(help|what can i (say|do)|commands|options)\b/.test(t))           return { intent: 'help' }
  if (/\b(where am i|what screen|current screen)\b/.test(t))               return { intent: 'describe_screen' }

  return null
}
