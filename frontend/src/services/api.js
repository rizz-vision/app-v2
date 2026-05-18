const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

async function post(path, formData) {
  const res = await fetch(`${BASE}${path}`, { method: 'POST', body: formData })
  const json = await res.json()
  if (!res.ok) {
    const err = new Error(json.user_message || 'Request failed')
    err.error_code = json.error_code
    err.status = res.status
    throw err
  }
  return json
}

export async function analyzeImage(imageBlob, { occasion = '', mode = '' } = {}) {
  const fd = new FormData()
  fd.append('image', imageBlob, 'photo.jpg')
  fd.append('occasion', occasion)
  fd.append('mode', mode)
  return post('/analyze', fd)
}

export async function quickScan(imageBlob) {
  const fd = new FormData()
  fd.append('image', imageBlob, 'photo.jpg')
  return post('/quick-scan', fd)
}

export async function getOutfitSuggestion({ wardrobeItems = '', occasion = '', mode = 'general' } = {}) {
  const fd = new FormData()
  fd.append('wardrobe_items', wardrobeItems)
  fd.append('occasion', occasion)
  fd.append('mode', mode)
  return post('/outfit-suggestion', fd)
}

export async function shoppingAnalyze(imageBlob, wardrobe = []) {
  const fd = new FormData()
  fd.append('image', imageBlob, 'photo.jpg')
  fd.append('wardrobe', wardrobe.length ? wardrobe.map((i) => `${i.name} (${i.category}): ${i.description || ''}`).join('\n') : '')
  return post('/shopping-analyze', fd)
}

export async function contextChat({ question, context = '', feature = 'scan' }) {
  const fd = new FormData()
  fd.append('question', question)
  fd.append('context', context)
  fd.append('feature', feature)
  return post('/context-chat', fd)
}

export async function identifyItem(imageBlob, wardrobe = []) {
  const fd = new FormData()
  fd.append('image', imageBlob, 'photo.jpg')
  fd.append('wardrobe', JSON.stringify(wardrobe))
  return post('/identify-item', fd)
}

export async function voiceQuery(query, appContext = '', language = 'en') {
  const fd = new FormData()
  fd.append('query', query)
  fd.append('app_context', appContext)
  fd.append('language', language)
  return post('/voice-query', fd)
}
