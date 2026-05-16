import { createContext, useContext, useState, useCallback } from 'react'
import { SCREENS, DESC_MODES } from '../utils/constants.js'

const AppContext = createContext(null)

export function AppProvider({ children }) {
  const [stack, setStack] = useState([{ screen: SCREENS.HOME, params: {} }])
  const [descMode, setDescModeState] = useState(
    () => localStorage.getItem('rizzv2_desc_mode') || DESC_MODES.LONG
  )

  const current = stack[stack.length - 1]

  const navigate = useCallback((screen, params = {}) => {
    setStack((s) => [...s, { screen, params }])
  }, [])

  const goBack = useCallback(() => {
    setStack((s) => (s.length > 1 ? s.slice(0, -1) : s))
  }, [])

  const setDescMode = useCallback((mode) => {
    setDescModeState(mode)
    localStorage.setItem('rizzv2_desc_mode', mode)
  }, [])

  const toggleDescMode = useCallback(() => {
    setDescMode((m) => (m === DESC_MODES.SHORT ? DESC_MODES.LONG : DESC_MODES.SHORT))
  }, [setDescMode])

  return (
    <AppContext.Provider value={{ current, stack, navigate, goBack, descMode, setDescMode, toggleDescMode }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
