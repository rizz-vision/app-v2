// RizzApp — full mobile app, theme-parameterized.
// Each iOS frame mounts one of these with a different theme.

const { useState, useEffect, useRef, useCallback } = React;

function RizzApp({ theme: t, density = 'comfortable', reducedMotion = false }) {
  // Nav stack
  const [stack, setStack] = useState([{ screen: 'HOME', params: {} }]);
  const current = stack[stack.length - 1];

  // Wardrobe state (per instance)
  const [wardrobe, setWardrobe] = useState(window.MOCK.wardrobe);

  // Voice state
  const [voiceState, setVoiceState] = useState('listening'); // off | listening | speaking | processing
  const [announcement, setAnnouncement] = useState('');

  const navigate = useCallback((screen, params = {}) => {
    setStack(s => [...s, { screen, params }]);
  }, []);

  const back = useCallback(() => {
    setStack(s => s.length > 1 ? s.slice(0, -1) : s);
  }, []);

  const announce = useCallback((text) => {
    setAnnouncement(text);
    setTimeout(() => setAnnouncement(''), 200);
  }, []);

  const speak = useCallback((text) => {
    setVoiceState('speaking');
    announce(text);
    setTimeout(() => setVoiceState('listening'), 2400);
  }, [announce]);

  const toggleVoice = useCallback(() => {
    setVoiceState(s => s === 'off' ? 'listening' : 'off');
  }, []);

  const app = {
    current, navigate, back, announce, speak,
    voiceState, setVoiceState, toggleVoice,
  };

  // Screen routing
  const Screen = {
    HOME: HomeScreen, SCAN: ScanScreen, WARDROBE: WardrobeScreen,
    OUTFIT: OutfitScreen, MIRROR: MirrorScreen, SHOPPING: ShoppingScreen, EDIT_ITEM: EditItemScreen,
  }[current.screen] || HomeScreen;

  const isVoltage = t.id === 'voltage';

  return (
    <div style={{
      width: '100%', height: '100%',
      background: t.bg, color: t.ink,
      fontFamily: t.fontUI,
      display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden',
      paddingTop: 56, // iOS status bar
      // Subtle texture/grain on Studio
      backgroundImage: t.id === 'studio'
        ? `radial-gradient(circle at 15% 0%, rgba(154,107,255,0.10) 0%, transparent 45%), radial-gradient(circle at 90% 100%, rgba(94,227,161,0.04) 0%, transparent 50%)`
        : t.id === 'voltage'
        ? `repeating-linear-gradient(0deg, transparent 0 39px, rgba(10,10,10,0.04) 39px 40px)`
        : 'none',
    }}>
      {/* a11y live region */}
      <div aria-live="polite" aria-atomic="true" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>
        {announcement}
      </div>

      {/* Active screen */}
      <div style={{ flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative' }}>
        <Screen t={t} app={app} wardrobe={wardrobe} setWardrobe={setWardrobe} />
      </div>

      {/* Persistent floating mic — accessibility entry point */}
      <FloatingMic
        t={t}
        listening={voiceState === 'listening' || voiceState === 'speaking' || voiceState === 'processing'}
        onToggle={toggleVoice}
        hint={current.screen === 'HOME' ? 'Try "show wardrobe" or "scan"' : null}
      />

      {/* Focus ring styles, scoped */}
      <style>{`
        button:focus-visible, input:focus-visible, textarea:focus-visible, [role="button"]:focus-visible {
          outline: 3px solid ${t.focus} !important;
          outline-offset: 2px !important;
        }
        input::placeholder, textarea::placeholder { color: ${t.inkDim}; }
      `}</style>
    </div>
  );
}

window.RizzApp = RizzApp;
