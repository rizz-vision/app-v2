const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

const TIMEOUTS = {
  default: 25_000,
  analyze: 60_000,
  tts: 20_000,
}

async function post(path, formData, timeoutMs = TIMEOUTS.default) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(`${BASE}${path}`, { method: 'POST', body: formData, signal: controller.signal })
    const json = await res.json()
    if (!res.ok) {
      const err = new Error(json.user_message || 'Request failed')
      err.error_code = json.error_code
      err.status = res.status
      throw err
    }
    return json
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('Request timed out. Please try again.')
    throw err
  } finally {
    clearTimeout(timer)
  }
}

export async function analyzeImage(imageBlob, { occasion = '', mode = '' } = {}) {
  const fd = new FormData()
  fd.append('image', imageBlob, 'photo.jpg')
  fd.append('occasion', occasion.slice(0, 200))
  fd.append('mode', mode.slice(0, 50))
  return post('/analyze', fd, TIMEOUTS.analyze)
}

export async function quickScan(imageBlob) {
  const fd = new FormData()
  fd.append('image', imageBlob, 'photo.jpg')
  return post('/quick-scan', fd, TIMEOUTS.analyze)
}

export async function getOutfitSuggestion({ wardrobeItems = '', occasion = '', mode = 'general', profileContext = '' } = {}) {
  const fd = new FormData()
  fd.append('wardrobe_items', wardrobeItems)
  fd.append('occasion', occasion.slice(0, 200))
  fd.append('mode', mode.slice(0, 50))
  fd.append('profile_context', profileContext.slice(0, 500))
  return post('/outfit-suggestion', fd)
}

export async function shoppingAnalyze(imageBlob, wardrobe = [], profileContext = '') {
  const fd = new FormData()
  fd.append('image', imageBlob, 'photo.jpg')
  fd.append('wardrobe', wardrobe.length ? wardrobe.map((i) => `${i.name} (${i.category}): ${i.description || ''} color: ${i.color || ''}`).join('\n') : '')
  fd.append('profile_context', profileContext.slice(0, 600))
  return post('/shopping-analyze', fd, TIMEOUTS.analyze)
}

export async function contextChat({ question, feature = 'scan', resultContext = '', wardrobeContext = '', history = [], language = 'en' }) {
  const fd = new FormData()
  fd.append('question', question.slice(0, 500))
  fd.append('feature', feature.slice(0, 50))
  fd.append('result_context', resultContext.slice(0, 2000))
  fd.append('wardrobe_context', wardrobeContext.slice(0, 1500))
  fd.append('history', JSON.stringify(history.slice(-6)))
  fd.append('language', language.slice(0, 10))
  return post('/context-chat', fd)
}

export async function describeFrame(imageBlob, language = 'en') {
  const fd = new FormData()
  fd.append('image', imageBlob, 'frame.jpg')
  fd.append('language', language)
  return post('/describe-frame', fd, TIMEOUTS.analyze)
}

export async function identifyItem(imageBlob, wardrobe = []) {
  const fd = new FormData()
  fd.append('image', imageBlob, 'photo.jpg')
  fd.append('wardrobe', JSON.stringify(wardrobe))
  return post('/identify-item', fd, TIMEOUTS.analyze)
}

export async function voiceQuery(query, appContext = '', language = 'en', wardrobeContext = '') {
  const fd = new FormData()
  fd.append('query', query.slice(0, 500))
  fd.append('app_context', appContext.slice(0, 200))
  fd.append('language', language.slice(0, 10))
  fd.append('wardrobe_context', wardrobeContext.slice(0, 2000))
  return post('/voice-query', fd)
}
