import { supabase } from '../services/supabase.js'

export async function getWardrobeItems(userId) {
  const { data, error } = await supabase
    .from('wardrobe_items')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function addWardrobeItem(item) {
  const { data, error } = await supabase
    .from('wardrobe_items')
    .insert(item)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateWardrobeItem(id, updates) {
  const { data, error } = await supabase
    .from('wardrobe_items')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteWardrobeItem(id) {
  const { error } = await supabase.from('wardrobe_items').delete().eq('id', id)
  if (error) throw error
}
