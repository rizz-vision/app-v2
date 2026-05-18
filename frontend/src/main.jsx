import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AppProvider } from './contexts/AppContext.jsx'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { WardrobeProvider } from './contexts/WardrobeContext.jsx'
import { VoiceProvider } from './contexts/VoiceContext.jsx'
import { ProfileProvider } from './contexts/ProfileContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <AppProvider>
        <WardrobeProvider>
          <ProfileProvider>
            <VoiceProvider>
              <App />
            </VoiceProvider>
          </ProfileProvider>
        </WardrobeProvider>
      </AppProvider>
    </AuthProvider>
  </StrictMode>,
)
