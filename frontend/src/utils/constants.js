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
  welcome: 'Welcome to Rizzvision. Tap Scan to analyze a t-shirt.',
  scanReady: 'Point the camera at a t-shirt and tap capture.',
  mirrorReady: 'Point the camera at your full outfit and tap capture.',
  mirrorAnalyzing: 'Analyzing your outfit. One moment.',
  outfitPrompt: 'What occasion are you dressing for?',
  generating: 'Working on your outfit suggestion.',
  wardrobeEmpty: 'Your wardrobe is empty. Scan some items to get started.',
  wardrobeCount: (n) => `You have ${n} item${n !== 1 ? 's' : ''} in your wardrobe.`,
  saved: (name) => `${name} saved to your wardrobe.`,
  itemDeleted: (name) => `${name} removed from your wardrobe.`,
  itemUpdated: (name) => `${name} updated.`,
  error: 'Something went wrong. Please try again.',
}
