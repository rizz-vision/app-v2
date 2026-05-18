import { useApp } from './contexts/AppContext.jsx'
import { useAuth } from './contexts/AuthContext.jsx'
import { LiveRegions } from './components/LiveRegions.jsx'
import { PermissionsGate } from './components/PermissionsGate.jsx'
import { ErrorBoundary } from './components/ErrorBoundary.jsx'
import { SCREENS } from './utils/constants.js'

import { HomeScreen } from './screens/HomeScreen.jsx'
import { ScanScreen } from './screens/ScanScreen.jsx'
import { WardrobeScreen } from './screens/WardrobeScreen.jsx'
import { OutfitScreen } from './screens/OutfitScreen.jsx'
import { ShoppingScreen } from './screens/ShoppingScreen.jsx'
import { MirrorScreen } from './screens/MirrorScreen.jsx'
import { EditItemScreen } from './screens/EditItemScreen.jsx'
import { IdentifyScreen } from './screens/IdentifyScreen.jsx'
import { ProfileScreen } from './screens/ProfileScreen.jsx'
import { AuthScreen } from './screens/AuthScreen.jsx'

function Screen({ name }) {
  switch (name) {
    case SCREENS.HOME:      return <HomeScreen />
    case SCREENS.SCAN:      return <ScanScreen />
    case SCREENS.WARDROBE:  return <WardrobeScreen />
    case SCREENS.OUTFIT:    return <OutfitScreen />
    case SCREENS.SHOPPING:  return <ShoppingScreen />
    case SCREENS.MIRROR:    return <MirrorScreen />
    case SCREENS.EDIT_ITEM: return <EditItemScreen />
    case SCREENS.IDENTIFY:  return <IdentifyScreen />
    case SCREENS.PROFILE:   return <ProfileScreen />
    default:                return <HomeScreen />
  }
}

export default function App() {
  const { current } = useApp()
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '2px solid #7C3AED', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (!user) return <PermissionsGate><AuthScreen /></PermissionsGate>

  return (
    <PermissionsGate>
      <ErrorBoundary>
        <div style={{ height: '100%', position: 'relative' }}>
          <LiveRegions />
          <Screen name={current.screen} />
        </div>
      </ErrorBoundary>
    </PermissionsGate>
  )
}
