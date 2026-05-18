export const SCREENS = {
  HOME: 'HOME',
  SCAN: 'SCAN',
  WARDROBE: 'WARDROBE',
  OUTFIT: 'OUTFIT',
  SHOPPING: 'SHOPPING',
  MIRROR: 'MIRROR',
  EDIT_ITEM: 'EDIT_ITEM',
  AUTH: 'AUTH',
}

export const COLORS = {
  BG: '#0A0A08',
  BG_RAISED: '#141412',
  SURFACE: '#141412',
  SURFACE_INVERSE: '#F7F5EF',
  BORDER: '#F7F5EF',
  ACCENT: '#7AA0FF',
  ACCENT_SOFT: 'rgba(122,160,255,0.18)',
  ACCENT_STRONG: '#A7C0FF',
  // keep legacy aliases used in screens
  ACCENT_LIGHT: '#A7C0FF',
  ACCENT_DIM: 'rgba(122,160,255,0.18)',
  TEXT: '#F7F5EF',
  TEXT_MUTED: '#C2BEB6',
  TEXT_DIM: '#8A8780',
  TEXT_ON_ACCENT: '#0A0A08',
  DANGER: '#FF7777',
  SUCCESS: '#5EE3A1',
  RADIUS: 4,
}

export const VOICE_LOCALE = 'en-IN'
export const DESC_MODES = { SHORT: 'short', LONG: 'long' }

export const OCCASIONS = [
  { id: 'casual', label: 'Casual', icon: '☕' },
  { id: 'smart_casual', label: 'Smart Casual', icon: '🎯' },
  { id: 'formal', label: 'Formal', icon: '🎩' },
  { id: 'party', label: 'Party', icon: '🎉' },
  { id: 'sport', label: 'Sport / Gym', icon: '🏃' },
  { id: 'date', label: 'Date Night', icon: '✨' },
  { id: 'work', label: 'Work / Office', icon: '💼' },
  { id: 'outdoor', label: 'Outdoor', icon: '🌿' },
]

export const CATEGORIES = [
  { id: 'tops', label: 'Tops', icon: '👕' },
  { id: 'bottoms', label: 'Bottoms', icon: '👖' },
  { id: 'outerwear', label: 'Outerwear', icon: '🧥' },
  { id: 'shoes', label: 'Shoes', icon: '👟' },
  { id: 'accessories', label: 'Accessories', icon: '👜' },
  { id: 'other', label: 'Other', icon: '🔖' },
]

export const RESPONSES = {
  welcome: 'Welcome to Rizzvision. Say scan, wardrobe, outfit, shopping, or mirror to get started.',
  scanReady: 'Point the camera at a clothing item and tap capture, or say capture.',
  mirrorReady: 'Point the camera at your full outfit and tap capture.',
  mirrorAnalyzing: 'Analyzing your outfit. One moment.',
  outfitPrompt: 'What occasion are you dressing for?',
  generating: 'Working on your outfit suggestion.',
  wardrobeEmpty: 'Your wardrobe is empty. Say scan to add your first item.',
  wardrobeCount: (n) => `You have ${n} item${n !== 1 ? 's' : ''} in your wardrobe.`,
  saved: (name) => `${name} saved to your wardrobe.`,
  itemDeleted: (name) => `${name} removed from your wardrobe.`,
  itemUpdated: (name) => `${name} updated.`,
  error: 'Something went wrong. Please try again.',
  thinking: 'One moment.',
}

export const SCREEN_DESCRIPTIONS = {
  HOME:      'You are on the home screen. Say scan, wardrobe, outfit, shopping, or mirror.',
  SCAN:      'You are on the scan screen. Point the camera at a clothing item and tap capture. I will identify it and you can save it to your wardrobe.',
  WARDROBE:  'You are in your wardrobe. Say read all items to hear everything saved, or tap an item to hear its description.',
  OUTFIT:    'You are on the outfit screen. Tell me the occasion and I will suggest combinations from your wardrobe.',
  SHOPPING:  'You are on the shopping screen. Point the camera at an item you are considering buying and I will tell you how it fits your wardrobe.',
  MIRROR:    'You are on the mirror screen. Point the camera at your full outfit for complete feedback.',
  EDIT_ITEM: 'You are editing a wardrobe item. You can update the name and category.',
  AUTH:      'You are on the sign in screen.',
}

export const SCREEN_HELP = {
  HOME:      'You can say: scan, wardrobe, outfit, shopping, mirror, or ask me any fashion question.',
  SCAN:      'You can say: capture, go back, or ask me anything about the item.',
  WARDROBE:  'You can say: read all items, go back, or tap an item to hear its description.',
  OUTFIT:    'Say the occasion out loud, then say generate.',
  SHOPPING:  'You can say: capture, go back, or ask whether this item suits your wardrobe.',
  MIRROR:    'You can say: capture, go back, or ask about your outfit.',
  EDIT_ITEM: 'You can say: save or go back.',
  AUTH:      'Enter your email and password to sign in.',
}
