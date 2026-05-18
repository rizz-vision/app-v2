import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../services/supabase.js'
import { getWardrobeItems, addWardrobeItem, updateWardrobeItem, deleteWardrobeItem, uploadWardrobeImage } from '../utils/storage.js'
import { useAuth } from './AuthContext.jsx'

const WardrobeContext = createContext(null)

export function WardrobeProvider({ children }) {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) { setItems([]); return }
    setLoading(true)
    getWardrobeItems(user.id).then(setItems).finally(() => setLoading(false))

    const channel = supabase
      .channel('wardrobe')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wardrobe_items', filter: `user_id=eq.${user.id}` },
        () => getWardrobeItems(user.id).then(setItems)
      )
      .subscribe()

    return () => { channel.unsubscribe(); supabase.removeChannel(channel) }
  }, [user])

  // imageBlob is optional — if provided, uploads to storage and stores the URL
  const addItem = useCallback(async (item, imageBlob) => {
    let image_url = null
    if (imageBlob) {
      image_url = await uploadWardrobeImage(user.id, imageBlob)
    }
    const saved = await addWardrobeItem({ ...item, user_id: user.id, image_url })
    setItems((prev) => [saved, ...prev])
    return saved
  }, [user])

  const updateItem = useCallback(async (id, updates) => {
    const updated = await updateWardrobeItem(id, updates)
    setItems((prev) => prev.map((i) => (i.id === id ? updated : i)))
    return updated
  }, [])

  const removeItem = useCallback(async (id) => {
    await deleteWardrobeItem(id)
    setItems((prev) => prev.filter((i) => i.id !== id))
  }, [])

  const editItem = updateItem

  const removeLast = useCallback(async () => {
    if (items.length === 0) return
    await removeItem(items[0].id)
  }, [items, removeItem])

  return (
    <WardrobeContext.Provider value={{ items, loading, addItem, updateItem, editItem, removeItem, removeLast }}>
      {children}
    </WardrobeContext.Provider>
  )
}

export const useWardrobe = () => useContext(WardrobeContext)
