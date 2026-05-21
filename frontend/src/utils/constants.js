export const SCREENS = {
  HOME: 'HOME',
  SCAN: 'SCAN',
  WARDROBE: 'WARDROBE',
  OUTFIT: 'OUTFIT',
  SHOPPING: 'SHOPPING',
  MIRROR: 'MIRROR',
  EDIT_ITEM: 'EDIT_ITEM',
  IDENTIFY: 'IDENTIFY',
  PROFILE: 'PROFILE',
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

export const DESC_MODES = { SHORT: 'short', LONG: 'long' }

// ── Language support ─────────────────────────────────────────────────────────
// Kokoro TTS support: English ✓  Hindi ✓  Tamil ✗ (Web Speech API only)
export const LANGUAGES = [
  { id: 'en', label: 'English',    nativeLabel: 'English', locale: 'en-IN' },
  { id: 'hi', label: 'Hindi',      nativeLabel: 'हिंदी',    locale: 'hi-IN' },
  { id: 'ta', label: 'Tamil',      nativeLabel: 'தமிழ்',    locale: 'ta-IN' },
]

export const DEFAULT_LANGUAGE = 'en'

// Returns the locale string for SpeechRecognition / SpeechSynthesis
export function localeForLang(langId) {
  return LANGUAGES.find((l) => l.id === langId)?.locale ?? 'en-IN'
}

// ── Occasions ────────────────────────────────────────────────────────────────
export const OCCASIONS = [
  { id: 'casual',       label: 'Casual',        icon: '☕' },
  { id: 'smart_casual', label: 'Smart Casual',   icon: '🎯' },
  { id: 'formal',       label: 'Formal',         icon: '🎩' },
  { id: 'party',        label: 'Party',          icon: '🎉' },
  { id: 'sport',        label: 'Sport / Gym',    icon: '🏃' },
  { id: 'date',         label: 'Date Night',     icon: '✨' },
  { id: 'work',         label: 'Work / Office',  icon: '💼' },
  { id: 'outdoor',      label: 'Outdoor',        icon: '🌿' },
]

export const CATEGORIES = [
  { id: 'tops',        label: 'Tops',        icon: '👕' },
  { id: 'bottoms',     label: 'Bottoms',     icon: '👖' },
  { id: 'outerwear',   label: 'Outerwear',   icon: '🧥' },
  { id: 'shoes',       label: 'Shoes',       icon: '👟' },
  { id: 'accessories', label: 'Accessories', icon: '👜' },
  { id: 'other',       label: 'Other',       icon: '🔖' },
]

// ── Static spoken strings — keyed by language id ─────────────────────────────
// All strings must be TTS-friendly: short sentences, no markdown, no emoji.
export const RESPONSES = {
  en: {
    welcome:       'Welcome to Rizzvision. Say scan, wardrobe, outfit, shopping, or mirror to get started.',
    scanReady:     'Point the camera at a clothing item and tap capture, or say capture.',
    mirrorReady:   'Point the camera at your full outfit and tap capture.',
    mirrorAnalyzing: 'Analyzing your outfit. One moment.',
    outfitPrompt:  'What occasion are you dressing for?',
    generating:    'Working on your outfit suggestion.',
    wardrobeEmpty: 'Your wardrobe is empty. Say scan to add your first item.',
    wardrobeCount: (n) => `You have ${n} item${n !== 1 ? 's' : ''} in your wardrobe.`,
    saved:         (name) => `${name} saved to your wardrobe.`,
    itemDeleted:   (name) => `${name} removed from your wardrobe.`,
    itemUpdated:   (name) => `${name} updated.`,
    error:         'Something went wrong. Please try again.',
    thinking:      'One moment.',
    listening:     'Listening.',
    processing:    'Processing your request.',
    stillWorking:  'Still working on it.',
  },
  hi: {
    welcome:       'Rizzvision में आपका स्वागत है। शुरू करने के लिए स्कैन, वार्डरोब, आउटफिट, शॉपिंग या मिरर कहें।',
    scanReady:     'कैमरे को कपड़े की तरफ करें और कैप्चर पर टैप करें, या कैप्चर कहें।',
    mirrorReady:   'कैमरे को अपने पूरे आउटफिट की तरफ करें और कैप्चर पर टैप करें।',
    mirrorAnalyzing: 'आपका आउटफिट देख रहे हैं। एक पल रुकें।',
    outfitPrompt:  'आप किस अवसर के लिए तैयार हो रहे हैं?',
    generating:    'आपके आउटफिट का सुझाव तैयार हो रहा है।',
    wardrobeEmpty: 'आपका वार्डरोब खाली है। पहला आइटम जोड़ने के लिए स्कैन कहें।',
    wardrobeCount: (n) => `आपके वार्डरोब में ${n} आइटम हैं।`,
    saved:         (name) => `${name} आपके वार्डरोब में सेव हो गया।`,
    itemDeleted:   (name) => `${name} वार्डरोब से हटा दिया गया।`,
    itemUpdated:   (name) => `${name} अपडेट हो गया।`,
    error:         'कुछ गलत हो गया। कृपया फिर से कोशिश करें।',
    thinking:      'एक पल रुकें।',
    listening:     'सुन रहा हूं।',
    processing:    'आपका अनुरोध प्रोसेस हो रहा है।',
    stillWorking:  'अभी काम जारी है।',
  },
  ta: {
    welcome:       'Rizzvision-க்கு வரவேற்கிறோம். தொடங்க scan, wardrobe, outfit, shopping அல்லது mirror என்று சொல்லுங்கள்.',
    scanReady:     'கேமராவை உடையின் மீது திருப்பி capture என்று தட்டுங்கள் அல்லது சொல்லுங்கள்.',
    mirrorReady:   'கேமராவை உங்கள் முழு உடையின் மீது திருப்பி capture என்று தட்டுங்கள்.',
    mirrorAnalyzing: 'உங்கள் உடையை பகுப்பாய்வு செய்கிறோம். ஒரு நிமிடம் பொறுங்கள்.',
    outfitPrompt:  'நீங்கள் எந்த நிகழ்வுக்காக தயாராகிறீர்கள்?',
    generating:    'உங்கள் உடை பரிந்துரை தயாரிக்கப்படுகிறது.',
    wardrobeEmpty: 'உங்கள் wardrobe காலியாக உள்ளது. முதல் item சேர்க்க scan என்று சொல்லுங்கள்.',
    wardrobeCount: (n) => `உங்கள் wardrobe-ல் ${n} item${n !== 1 ? 'கள்' : ''} உள்ளன.`,
    saved:         (name) => `${name} உங்கள் wardrobe-ல் சேமிக்கப்பட்டது.`,
    itemDeleted:   (name) => `${name} wardrobe-லிருந்து நீக்கப்பட்டது.`,
    itemUpdated:   (name) => `${name} புதுப்பிக்கப்பட்டது.`,
    error:         'ஏதோ தவறு நடந்தது. மீண்டும் முயற்சிக்கவும்.',
    thinking:      'ஒரு நிமிடம் பொறுங்கள்.',
    listening:     'கேட்கிறேன்.',
    processing:    'உங்கள் கோரிக்கையை செயலாக்குகிறேன்.',
    stillWorking:  'இன்னும் செயலாக்குகிறேன்.',
  },
}

export const SCREEN_DESCRIPTIONS = {
  en: {
    HOME:      'You are on the home screen. Say scan, wardrobe, outfit, shopping, or mirror.',
    SCAN:      'You are on the scan screen. Point the camera at a clothing item and tap capture. I will identify it and you can save it to your wardrobe.',
    WARDROBE:  'You are in your wardrobe. Say read all items to hear everything saved, or tap an item to hear its description.',
    OUTFIT:    'You are on the outfit screen. Tell me the occasion and I will suggest combinations from your wardrobe.',
    SHOPPING:  'You are on the shopping screen. Point the camera at an item you are considering buying and I will tell you how it fits your wardrobe.',
    MIRROR:    'You are on the mirror screen. Point the camera at your full outfit for complete feedback.',
    EDIT_ITEM: 'You are editing a wardrobe item. You can update the name and category.',
    AUTH:      'You are on the sign in screen.',
  },
  hi: {
    HOME:      'आप होम स्क्रीन पर हैं। स्कैन, वार्डरोब, आउटफिट, शॉपिंग या मिरर कहें।',
    SCAN:      'आप स्कैन स्क्रीन पर हैं। कैमरे को कपड़े की तरफ करें और कैप्चर पर टैप करें। मैं उसे पहचानूंगा और आप इसे वार्डरोब में सेव कर सकते हैं।',
    WARDROBE:  'आप अपने वार्डरोब में हैं। सभी आइटम सुनने के लिए सभी आइटम पढ़ें कहें, या किसी आइटम का विवरण सुनने के लिए उसे टैप करें।',
    OUTFIT:    'आप आउटफिट स्क्रीन पर हैं। अवसर बताएं और मैं आपके वार्डरोब से सुझाव दूंगा।',
    SHOPPING:  'आप शॉपिंग स्क्रीन पर हैं। जो आइटम खरीदना चाहते हैं उस पर कैमरा करें और मैं बताऊंगा यह आपके वार्डरोब से मेल खाता है या नहीं।',
    MIRROR:    'आप मिरर स्क्रीन पर हैं। पूरे आउटफिट पर कैमरा करें और पूरी प्रतिक्रिया पाएं।',
    EDIT_ITEM: 'आप एक वार्डरोब आइटम संपादित कर रहे हैं। नाम और श्रेणी बदल सकते हैं।',
    AUTH:      'आप साइन इन स्क्रीन पर हैं।',
  },
  ta: {
    HOME:      'நீங்கள் home screen-ல் இருக்கிறீர்கள். scan, wardrobe, outfit, shopping அல்லது mirror என்று சொல்லுங்கள்.',
    SCAN:      'நீங்கள் scan screen-ல் இருக்கிறீர்கள். கேமராவை உடையின் மீது திருப்பி capture என்று தட்டுங்கள். நான் அதை அடையாளம் காண்பேன்.',
    WARDROBE:  'நீங்கள் wardrobe-ல் இருக்கிறீர்கள். அனைத்து items-ஐயும் கேட்க read all items என்று சொல்லுங்கள்.',
    OUTFIT:    'நீங்கள் outfit screen-ல் இருக்கிறீர்கள். நிகழ்வை சொல்லுங்கள், நான் உங்கள் wardrobe-லிருந்து பரிந்துரைக்கிறேன்.',
    SHOPPING:  'நீங்கள் shopping screen-ல் இருக்கிறீர்கள். வாங்க நினைக்கும் உடையை கேமராவில் காட்டுங்கள்.',
    MIRROR:    'நீங்கள் mirror screen-ல் இருக்கிறீர்கள். முழு உடையை கேமராவில் காட்டி முழு கருத்தைப் பெறுங்கள்.',
    EDIT_ITEM: 'நீங்கள் ஒரு wardrobe item-ஐ திருத்துகிறீர்கள். பெயர் மற்றும் வகையை மாற்றலாம்.',
    AUTH:      'நீங்கள் sign in screen-ல் இருக்கிறீர்கள்.',
  },
}

export const SCREEN_HELP = {
  en: {
    HOME:      'You can say: scan, wardrobe, outfit, shopping, mirror, or ask me any fashion question.',
    SCAN:      'You can say: capture, go back, or ask me anything about the item.',
    WARDROBE:  'You can say: read all items, go back, or tap an item to hear its description.',
    OUTFIT:    'Say the occasion out loud, then say generate.',
    SHOPPING:  'You can say: capture, go back, or ask whether this item suits your wardrobe.',
    MIRROR:    'You can say: capture, go back, or ask about your outfit.',
    EDIT_ITEM: 'You can say: save or go back.',
    AUTH:      'Enter your email and password to sign in.',
  },
  hi: {
    HOME:      'आप कह सकते हैं: स्कैन, वार्डरोब, आउटफिट, शॉपिंग, मिरर, या कोई भी फैशन सवाल पूछें।',
    SCAN:      'आप कह सकते हैं: कैप्चर, वापस जाएं, या आइटम के बारे में कुछ भी पूछें।',
    WARDROBE:  'आप कह सकते हैं: सभी आइटम पढ़ें, वापस जाएं, या विवरण सुनने के लिए आइटम टैप करें।',
    OUTFIT:    'अवसर जोर से बोलें, फिर जनरेट करें कहें।',
    SHOPPING:  'आप कह सकते हैं: कैप्चर, वापस जाएं, या पूछें कि यह आइटम आपके वार्डरोब से मेल खाता है या नहीं।',
    MIRROR:    'आप कह सकते हैं: कैप्चर, वापस जाएं, या अपने आउटफिट के बारे में पूछें।',
    EDIT_ITEM: 'आप कह सकते हैं: सेव करें या वापस जाएं।',
    AUTH:      'साइन इन करने के लिए ईमेल और पासवर्ड दर्ज करें।',
  },
  ta: {
    HOME:      'நீங்கள் சொல்லலாம்: scan, wardrobe, outfit, shopping, mirror, அல்லது எந்த fashion கேள்வியும் கேளுங்கள்.',
    SCAN:      'நீங்கள் சொல்லலாம்: capture, go back, அல்லது item பற்றி எதுவும் கேளுங்கள்.',
    WARDROBE:  'நீங்கள் சொல்லலாம்: read all items, go back, அல்லது விவரம் கேட்க item-ஐ தட்டுங்கள்.',
    OUTFIT:    'நிகழ்வை சத்தமாக சொல்லுங்கள், பின்னர் generate என்று சொல்லுங்கள்.',
    SHOPPING:  'நீங்கள் சொல்லலாம்: capture, go back, அல்லது இந்த item உங்கள் wardrobe-க்கு ஏற்றதா என்று கேளுங்கள்.',
    MIRROR:    'நீங்கள் சொல்லலாம்: capture, go back, அல்லது உங்கள் outfit பற்றி கேளுங்கள்.',
    EDIT_ITEM: 'நீங்கள் சொல்லலாம்: save அல்லது go back.',
    AUTH:      'Sign in செய்ய email மற்றும் password உள்ளிடுங்கள்.',
  },
}

export const VOICE_COMMANDS_HELP = {
  en: 'Here are the voice commands you can use. To navigate: say go to scan, go to wardrobe, go to outfit, go to shopping, go to mirror, or go home. To control playback: say repeat that, or stop talking. To get help: say what can I do, or where am I. In the wardrobe: say read all items. After scanning: say save this. You can also ask any fashion question and I will answer.',
  hi: 'यहां वे वॉयस कमांड हैं जो आप उपयोग कर सकते हैं। नेविगेट करने के लिए: स्कैन, वार्डरोब, आउटफिट, शॉपिंग, मिरर, या होम पर जाएं। प्लेबैक के लिए: दोबारा कहें, या रुको। वार्डरोब में: सभी आइटम पढ़ें। स्कैन के बाद: इसे सेव करें। आप कोई भी फैशन सवाल पूछ सकते हैं।',
  ta: 'இந்த voice commands பயன்படுத்தலாம். செல்ல: go to scan, go to wardrobe, go to outfit, go to shopping, go to mirror, அல்லது go home என்று சொல்லுங்கள். மீண்டும் கேட்க: repeat that. நிறுத்த: stop talking. wardrobe-ல்: read all items. scan செய்த பின்: save this. எந்த fashion கேள்வியும் கேட்கலாம்.',
}
