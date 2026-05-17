// Tweaks panel for Rizzvision: global light/dark + density + reduced motion.
const { useEffect } = React;

function TweaksApp() {
  const [t, setTweak] = useTweaks(/*EDITMODE-BEGIN*/{
    "mode": "auto",
    "density": "comfortable",
    "reducedMotion": false
  }/*EDITMODE-END*/);

  // Mirror tweaks to a global the React-rendered apps read on every render.
  useEffect(() => {
    window.__TWEAKS = t;
    window.dispatchEvent(new CustomEvent('rizz-tweaks-changed'));
  }, [t]);

  return (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Theme mode" />
      <TweakRadio label="Mode" value={t.mode} options={['auto', 'light', 'dark']}
        onChange={v => setTweak('mode', v)} />

      <TweakSection label="Density" />
      <TweakRadio label="Spacing" value={t.density}
        options={['compact', 'comfortable', 'spacious']}
        onChange={v => setTweak('density', v)} />

      <TweakSection label="Motion" />
      <TweakToggle label="Reduce motion" value={t.reducedMotion}
        onChange={v => setTweak('reducedMotion', v)} />
    </TweaksPanel>
  );
}

window.TweaksApp = TweaksApp;
