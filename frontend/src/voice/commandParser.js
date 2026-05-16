export function parseCommand(transcript) {
  const t = transcript.toLowerCase().trim()

  if (/\b(go home|home screen|main menu)\b/.test(t)) return { intent: 'navigate', screen: 'HOME' }
  if (/\b(scan|analyze|check my|check this)\b/.test(t)) return { intent: 'navigate', screen: 'SCAN' }
  if (/\b(wardrobe|my clothes|my items)\b/.test(t)) return { intent: 'navigate', screen: 'WARDROBE' }
  if (/\b(outfit|what should i wear|suggest)\b/.test(t)) return { intent: 'navigate', screen: 'OUTFIT' }
  if (/\b(shopping|buy|purchase|new item)\b/.test(t)) return { intent: 'navigate', screen: 'SHOPPING' }
  if (/\b(mirror|full body|full outfit)\b/.test(t)) return { intent: 'navigate', screen: 'MIRROR' }
  if (/\b(go back|back)\b/.test(t)) return { intent: 'back' }

  if (/\b(short|brief|quick)\b.*\b(description|mode)\b/.test(t)) return { intent: 'desc_mode', mode: 'short' }
  if (/\b(long|full|detailed)\b.*\b(description|mode)\b/.test(t)) return { intent: 'desc_mode', mode: 'long' }
  if (/\btoggle description\b/.test(t)) return { intent: 'desc_mode', mode: 'toggle' }

  if (/\b(repeat|say again|again)\b/.test(t)) return { intent: 'repeat' }
  if (/\b(stop|quiet|silence)\b/.test(t)) return { intent: 'stop_speech' }
  if (/\b(save|add to wardrobe)\b/.test(t)) return { intent: 'save_item' }

  return null
}
