import { supabase } from '../services/supabase.js'

export async function getWardrobeItems(userId) {
  const { data, error } = await supabase
    .from('wardrobe_items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map(normalise)
}

export async function addWardrobeItem(item) {
  const { data, error } = await supabase
    .from('wardrobe_items')
    .insert(item)
    .select()
    .single()
  if (error) throw error
  return normalise(data)
}

export async function updateWardrobeItem(id, updates) {
  const { data, error } = await supabase
    .from('wardrobe_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return normalise(data)
}

export async function deleteWardrobeItem(id) {
  const { error } = await supabase.from('wardrobe_items').delete().eq('id', id)
  if (error) throw error
}

// Upload image blob to the 'wardrobe-images' storage bucket.
// Returns public URL on success, null if bucket doesn't exist or upload fails.
export async function uploadWardrobeImage(userId, blob) {
  try {
    const ext = blob.type === 'image/png' ? 'png' : 'jpg'
    const path = `${userId}/${Date.now()}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('wardrobe-images')
      .upload(path, blob, { contentType: blob.type || 'image/jpeg', upsert: false })
    if (uploadError) throw uploadError
    const { data } = supabase.storage.from('wardrobe-images').getPublicUrl(path)
    return data.publicUrl
  } catch (err) {
    console.warn('Image upload skipped:', err.message)
    return null
  }
}

// Map DB snake_case image_url → camelCase imageUrl expected by components
function normalise(row) {
  if (!row) return row
  return { ...row, imageUrl: row.image_url || row.imageUrl || null }
}
