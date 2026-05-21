import { createContext, useContext, useState, useCallback } from 'react'

const STORAGE_KEY = 'rizzv_profile'

function loadProfile() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') || {} }
  catch { return {} }
}

const ProfileContext = createContext(null)

export function ProfileProvider({ children }) {
  const [profile, setProfileState] = useState(loadProfile)

  const saveProfile = useCallback((updates) => {
    setProfileState((prev) => {
      const next = { ...prev, ...updates }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const clearProfile = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setProfileState({})
  }, [])

  // Build a compact string to inject into AI prompts
  const profileContext = buildProfileContext(profile)

  return (
    <ProfileContext.Provider value={{ profile, saveProfile, clearProfile, profileContext }}>
      {children}
    </ProfileContext.Provider>
  )
}

export const useProfile = () => useContext(ProfileContext)

function buildProfileContext(p) {
  if (!p || Object.keys(p).length === 0) return ''
  const parts = []
  if (p.height) parts.push(`Height: ${p.height}`)
  if (p.weight) parts.push(`Weight: ${p.weight}`)
  if (p.bodyType) parts.push(`Body type: ${p.bodyType}`)
  if (p.colorPrefs?.length) parts.push(`Preferred colours: ${p.colorPrefs.join(', ')}`)
  if (p.avoidColors?.length) parts.push(`MUST AVOID these colours (never recommend or approve items in these colours): ${p.avoidColors.join(', ')}`)
  if (p.patterns?.length) parts.push(`Preferred patterns: ${p.patterns.join(', ')}`)
  if (p.stylePrefs) parts.push(`Preferred style: ${p.stylePrefs}`)
  return parts.length > 0 ? 'User preferences — ' + parts.join('. ') + '.' : ''
}
