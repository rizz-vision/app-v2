export function parseCommand(transcript) {
  const t = transcript.toLowerCase().trim()

  // Navigation
  if (/\b(go home|home screen|main menu|go to home)\b/.test(t)) return { intent: 'navigate', screen: 'HOME' }
  if (/\b(scan|analyze|check my shirt|check this|take a photo|identify)\b/.test(t)) return { intent: 'navigate', screen: 'SCAN' }
  if (/\b(wardrobe|my clothes|my items|my collection)\b/.test(t)) return { intent: 'navigate', screen: 'WARDROBE' }
  if (/\b(outfit|what should i wear|suggest an outfit|outfit suggestion)\b/.test(t)) return { intent: 'navigate', screen: 'OUTFIT' }
  if (/\b(shopping|check before (i )?buy|new item)\b/.test(t)) return { intent: 'navigate', screen: 'SHOPPING' }
  if (/\b(mirror|full body|full outfit|full look)\b/.test(t)) return { intent: 'navigate', screen: 'MIRROR' }
  if (/\b(go back|back|previous( screen)?|return)\b/.test(t)) return { intent: 'back' }

  // Playback control
  if (/\b(repeat|say again|again|say that again)\b/.test(t)) return { intent: 'repeat' }
  if (/\b(stop|quiet|silence|shut up|pause)\b/.test(t)) return { intent: 'stop_speech' }

  // Description mode
  if (/\b(short|brief|quick)\b.*\b(description|mode)\b/.test(t)) return { intent: 'desc_mode', mode: 'short' }
  if (/\b(long|full|detailed)\b.*\b(description|mode)\b/.test(t)) return { intent: 'desc_mode', mode: 'long' }
  if (/\btoggle description\b/.test(t)) return { intent: 'desc_mode', mode: 'toggle' }

  // Wardrobe actions
  if (/\b(read (all|my) (items|clothes|wardrobe)|list (my )?(items|clothes))\b/.test(t)) return { intent: 'read_wardrobe' }
  if (/\b(save|add to wardrobe|add this)\b/.test(t)) return { intent: 'save_item' }

  // Screen description / help — handled locally, no API call
  if (/\b(where am i|what (screen|page) (am i|is this)|current (screen|page))\b/.test(t)) return { intent: 'describe_screen' }
  if (/\b(what can (i|you) (do|say)|help|what are my options|how (do i|does this) work)\b/.test(t)) return { intent: 'help' }

  return null
}
