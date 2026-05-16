import { useState } from 'react'
import { useApp } from '../contexts/AppContext.jsx'
import { useWardrobe } from '../contexts/WardrobeContext.jsx'
import { GarmentCard } from '../components/GarmentCard.jsx'
import { COLORS, SCREENS } from '../utils/constants.js'

export function WardrobeScreen() {
  const { goBack, navigate } = useApp()
  const { items, loading, removeItem } = useWardrobe()
  const [search, setSearch] = useState('')

  const filtered = items.filter((i) =>
    !search || i.name?.toLowerCase().includes(search.toLowerCase()) ||
    i.description?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="screen">
      <div style={{ padding: '16px 16px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={goBack} style={{ fontSize: 20, color: COLORS.TEXT_MUTED, minHeight: 44, minWidth: 44 }}>←</button>
        <h2 style={{ fontWeight: 700, fontSize: 18, flex: 1 }}>Wardrobe</h2>
        <span style={{ fontSize: 13, color: COLORS.TEXT_DIM }}>{items.length} items</span>
      </div>

      <div style={{ padding: '12px 16px 0' }}>
        <input
          type="search"
          placeholder="Search items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: '100%', padding: '12px 16px', borderRadius: 12, border: `1px solid ${COLORS.BORDER}`,
            background: 'rgba(255,255,255,0.04)', color: COLORS.TEXT, fontSize: 14, outline: 'none',
          }}
        />
      </div>

      <div className="scroll" style={{ paddingTop: 12 }}>
        {loading && <p style={{ textAlign: 'center', color: COLORS.TEXT_DIM, paddingTop: 40 }}>Loading...</p>}
        {!loading && !filtered.length && (
          <p style={{ textAlign: 'center', color: COLORS.TEXT_DIM, paddingTop: 40, fontSize: 14 }}>
            {search ? 'No items match your search.' : 'No items yet. Scan a t-shirt to add one.'}
          </p>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {filtered.map((item) => (
            <GarmentCard
              key={item.id}
              item={item}
              onEdit={(i) => navigate(SCREENS.EDIT_ITEM, { item: i })}
              onDelete={removeItem}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
