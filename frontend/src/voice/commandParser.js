export function parseCommand(transcript) {
  const t = transcript.toLowerCase().trim()

  // Navigation — require explicit "go to" / "open" phrasing so conversational
  // mentions of a screen name fall through to the AI assistant instead
  if (/\b(go home|home screen|main menu|go to home|open home)\b/.test(t)) return { intent: 'navigate', screen: 'HOME' }
  if (/\b(go to (the )?(scan|camera)|open (scan|camera)|start scanning|take a photo|scan (a |this )?(item|shirt|top|clothing))\b/.test(t)) return { intent: 'navigate', screen: 'SCAN' }
  if (/\b(go to (the )?wardrobe|open (my )?wardrobe|show (my )?wardrobe|open (my )?clothes)\b/.test(t)) return { intent: 'navigate', screen: 'WARDROBE' }
  if (/\b(go to (the )?outfit|open outfit|get outfit (help|suggestion)|suggest (an |my )?outfit)\b/.test(t)) return { intent: 'navigate', screen: 'OUTFIT' }
  if (/\b(go to (the )?shopping|open shopping( mode)?|shopping mode)\b/.test(t)) return { intent: 'navigate', screen: 'SHOPPING' }
  if (/\b(go to (the )?mirror|open (the )?mirror|mirror mode|full (body|look) (check|scan))\b/.test(t)) return { intent: 'navigate', screen: 'MIRROR' }
  if (/\b(go back|previous screen|return to previous)\b/.test(t)) return { intent: 'back' }

  // Playback control
  if (/\b(repeat( that)?|say (that |it )?again)\b/.test(t)) return { intent: 'repeat' }
  if (/\b(stop (talking|speaking)|be quiet|silence|shut up)\b/.test(t)) return { intent: 'stop_speech' }

  // Description mode
  if (/\b(short|brief|quick)\b.*\b(description|mode)\b/.test(t)) return { intent: 'desc_mode', mode: 'short' }
  if (/\b(long|full|detailed)\b.*\b(description|mode)\b/.test(t)) return { intent: 'desc_mode', mode: 'long' }
  if (/\btoggle description( mode)?\b/.test(t)) return { intent: 'desc_mode', mode: 'toggle' }

  // Wardrobe actions — explicit phrasing only
  if (/\b(read (all|my) (items|clothes|wardrobe)|list (my )?(items|clothes|wardrobe))\b/.test(t)) return { intent: 'read_wardrobe' }
  if (/\b(save (this|it|the item)|add (this |it )?to (my )?wardrobe)\b/.test(t)) return { intent: 'save_item' }

  // Screen description / help — local, no API call
  if (/\b(where am i|what (screen|page) (am i( on)?|is this)|current (screen|page))\b/.test(t)) return { intent: 'describe_screen' }
  if (/\b(what can (i|you) (do|say)|what are my options|how (do i|does this) work)\b/.test(t)) return { intent: 'help' }

  // Everything else → AI assistant
  return null
}
