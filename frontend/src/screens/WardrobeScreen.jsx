import { useState, useEffect, useCallback, useRef } from 'react'
import { Screen } from '../components/Screen.jsx'
import { BigButton } from '../components/BigButton.jsx'
import { WardrobeCard } from '../components/WardrobeCard.jsx'
import { ContextChat } from '../components/ContextChat.jsx'
import { useWardrobe } from '../contexts/WardrobeContext.jsx'
import { useVoice } from '../contexts/VoiceContext.jsx'
import { useApp } from '../contexts/AppContext.jsx'
import { SCREENS, COLORS, CATEGORIES, RESPONSES } from '../utils/constants.js'

export function WardrobeScreen() {
  const { items, loading, removeItem } = useWardrobe()
  const { speak } = useVoice()
  const { navigate } = useApp()
  const [filter, setFilter] = useState(null)
  const [chatItem, setChatItem] = useState(null)

  const filtered = filter ? items.filter((i) => i.category === filter) : items

  const hasSpokenRef = useRef(false)
  useEffect(() => {
    if (loading || hasSpokenRef.current) return
    hasSpokenRef.current = true
    const t = setTimeout(() => {
      speak(items.length === 0 ? RESPONSES.wardrobeEmpty : RESPONSES.wardrobeCount(items.length))
    }, 400)
    return () => clearTimeout(t)
  }, [loading]) // eslint-disable-line react-hooks/exhaustive-deps

  const readAll = useCallback(() => {
    if (filtered.length === 0) { speak(RESPONSES.wardrobeEmpty); return }
    const text = filtered.map((item, i) => `Item ${i + 1}: ${item.name}. ${item.color || ''} ${item.category || ''}.`).join(' ')
    speak(`You have ${filtered.length} items. ${text}`)
  }, [filtered, speak])

  const handleTap = useCallback((item) => {
    speak(item.description || `${item.name}. ${item.color || ''} ${item.category || ''}.`)
    setChatItem(item)
  }, [speak])

  const handleDelete = useCallback((id) => {
    const item = items.find((i) => i.id === id)
    removeItem(id)
    if (item) speak(RESPONSES.itemDeleted(item.name))
  }, [items, removeItem, speak])

  const handleEdit = useCallback((item) => {
    navigate(SCREENS.EDIT_ITEM, { item })
  }, [navigate])

  useEffect(() => {
    const handler = (e) => {
      const cmd = e.detail
      if (cmd.type === 'READ_WARDROBE') readAll()
      else if (cmd.type === 'FILTER_WARDROBE') setFilter(cmd.category)
    }
    window.addEventListener('voiceCommand', handler)
    return () => window.removeEventListener('voiceCommand', handler)
  }, [readAll])

  const wardrobeChatContext = items.map((i) => `- ${i.name} (${i.category})${i.description ? ': ' + i.description : ''}`).join('\n') || 'Wardrobe is empty.'
  const activeChatContext = chatItem
    ? `Item tapped: ${chatItem.name} (${chatItem.category})\n${chatItem.description || ''}\n\nFull wardrobe:\n${wardrobeChatContext}`
    : wardrobeChatContext

  if (loading) {
    return (
      <Screen title="My Wardrobe" subtitle="Loading your items...">
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', border: `4px solid ${COLORS.ACCENT}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </Screen>
    )
  }

  if (items.length === 0) {
    return (
      <Screen title="My Wardrobe" subtitle="Your wardrobe is empty.">
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>🗄️</div>
          <p style={{ fontSize: 18, color: COLORS.TEXT_MUTED, lineHeight: 1.7, marginBottom: 24, fontFamily: 'var(--font-body)' }}>
            Scan your first item to start building your wardrobe.
          </p>
          <BigButton label="Scan Clothing" icon="📸" variant="primary" onClick={() => navigate(SCREENS.SCAN)} />
        </div>
      </Screen>
    )
  }

  return (
    <Screen title="My Wardrobe" subtitle={`${filtered.length} item${filtered.length !== 1 ? 's' : ''}${filter ? ` in ${filter}` : ''}`}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        <FilterChip label="All" active={!filter} onClick={() => setFilter(null)} />
        {CATEGORIES.map((cat) => (
          <FilterChip key={cat.id} label={cat.label} active={filter === cat.id} onClick={() => setFilter(cat.id)} />
        ))}
      </div>

      <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <BigButton label="Read My Wardrobe" hint="Hear all items read aloud" icon="🔊" onClick={readAll} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map((item) => (
          <WardrobeCard key={item.id} item={item} onTap={handleTap} onEdit={handleEdit} onDelete={handleDelete} />
        ))}
      </div>

      <ContextChat context={activeChatContext} feature="wardrobe" speak={speak} />
    </Screen>
  )
}

function FilterChip({ label, active, onClick }) {
  return (
    <button onClick={onClick} aria-pressed={active}
      style={{ background: active ? COLORS.ACCENT : COLORS.SURFACE, color: active ? '#fff' : COLORS.TEXT, border: `2px solid ${active ? COLORS.ACCENT : COLORS.BORDER}`, borderRadius: 20, padding: '8px 16px', fontSize: 14, fontWeight: active ? 700 : 500, cursor: 'pointer', minHeight: 40 }}>
      {label}
    </button>
  )
}
