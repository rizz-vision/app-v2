// All 7 Rizzvision screens, theme-aware.
// Receives { t, app, wardrobe } props. app provides nav + voice state.

const { useState, useEffect, useRef, useCallback, useMemo } = React;

// ─── Home ──────────────────────────────────────────────────────
function HomeScreen({ t, app, wardrobe }) {
  const isVoltage = t.id === 'voltage';
  const isClarity = t.id === 'clarity';

  const navItems = [
    { id: 'SCAN',     label: 'Scan',     desc: 'Analyze a single item',   icon: 'camera', big: true },
    { id: 'MIRROR',   label: 'Mirror',   desc: 'Full outfit check',       icon: 'mirror' },
    { id: 'WARDROBE', label: 'Wardrobe', desc: `${wardrobe.length} items`, icon: 'wardrobe' },
    { id: 'OUTFIT',   label: 'Outfit',   desc: 'Get a suggestion',        icon: 'sparkle' },
    { id: 'SHOPPING', label: 'Shopping', desc: 'Check it before you buy', icon: 'shop' },
  ];

  // Studio variant — refined, elegant
  if (t.id === 'studio') {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '12px 20px 160px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <p style={{ fontSize: 13, color: t.inkMuted, fontFamily: t.fontUI, fontWeight: 500 }}>Good morning, Arjun</p>
            <h1 style={{
              margin: '4px 0 0', fontFamily: t.fontDisplay, fontSize: 36, fontWeight: 400,
              fontStyle: 'italic', color: t.ink, letterSpacing: -0.5, lineHeight: 1,
            }}>Rizzvision</h1>
          </div>
          <VoiceIndicator t={t} state={app.voiceState} />
        </div>

        <p style={{
          fontFamily: t.fontBody, fontSize: 15, lineHeight: 1.55, color: t.inkMuted, marginBottom: 22,
        }}>
          Tuesday is dry, 18 degrees in the evening. <span style={{ color: t.accent }}>The cream cardigan</span> would suit today.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          {navItems.map((n, i) => (
            <Card key={n.id} t={t} onClick={() => app.navigate(n.id)} padding={16}
              ariaLabel={`${n.label}. ${n.desc}`}
              style={{
                gridColumn: n.big ? '1 / -1' : undefined,
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                minHeight: n.big ? 130 : 124, gap: 14,
                background: n.big ? `linear-gradient(140deg, ${t.accent} 0%, ${t.accentStrong} 100%)` : t.surface,
                border: n.big ? 'none' : `1px solid ${t.border}`,
                color: n.big ? t.inkOnAccent : t.ink,
              }}>
              <Icon name={n.icon} size={n.big ? 26 : 22} stroke={n.big ? t.inkOnAccent : t.accent} strokeWidth={1.5} />
              <div>
                <div style={{ fontFamily: t.fontDisplay, fontStyle: 'italic', fontWeight: 400, fontSize: n.big ? 26 : 22, lineHeight: 1.05, color: n.big ? t.inkOnAccent : t.ink }}>{n.label}</div>
                <div style={{ fontFamily: t.fontUI, fontSize: 12, color: n.big ? 'rgba(12,10,20,0.7)' : t.inkMuted, marginTop: 4 }}>{n.desc}</div>
              </div>
            </Card>
          ))}
        </div>

        <SectionLabel t={t}>Recently scanned</SectionLabel>
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6, scrollbarWidth: 'none' }}>
          {wardrobe.slice(0, 4).map(item => (
            <div key={item.id} style={{ flexShrink: 0, width: 86 }}>
              <GarmentVisual t={t} item={item} aspect="1/1" />
              <div style={{ fontSize: 11, fontFamily: t.fontUI, color: t.inkMuted, marginTop: 6, lineHeight: 1.2 }}>{item.name}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Clarity variant — accessibility-first, blueprint-bold
  if (t.id === 'clarity') {
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '12px 20px 160px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <h1 style={{ fontFamily: t.fontDisplay, fontSize: 28, fontWeight: 700, color: t.ink, letterSpacing: -0.5 }}>Rizzvision</h1>
          <VoiceIndicator t={t} state={app.voiceState} />
        </div>

        <div style={{
          border: `2px solid ${t.ink}`, padding: 18, marginBottom: 22, background: t.bgRaised,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: t.ink, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6 }}>Today</div>
          <p style={{ fontFamily: t.fontBody, fontSize: 18, lineHeight: 1.45, color: t.ink, fontWeight: 500 }}>
            Dry, 18 degrees in the evening. Your cream cardigan suits this weather.
          </p>
          <button style={{
            marginTop: 12, fontFamily: t.fontUI, fontSize: 14, fontWeight: 700,
            color: t.accent, background: 'transparent', border: 'none', padding: 0,
            textDecoration: 'underline', cursor: 'pointer',
          }} onClick={() => app.speak('Today is dry, 18 degrees in the evening. Your cream cardigan would suit this weather.')}>
            Read aloud
          </button>
        </div>

        <SectionLabel t={t}>What do you want to do?</SectionLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {navItems.map(n => (
            <button key={n.id} onClick={() => app.navigate(n.id)}
              aria-label={`${n.label}. ${n.desc}`}
              style={{
                display: 'flex', alignItems: 'center', gap: 16,
                minHeight: 72, padding: '14px 18px',
                background: t.bgRaised, border: `2px solid ${t.ink}`,
                cursor: 'pointer', textAlign: 'left', width: '100%',
                fontFamily: t.fontUI, color: t.ink,
              }}>
              <div style={{
                width: 44, height: 44, background: t.ink, color: t.bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <Icon name={n.icon} size={22} stroke={t.bg} strokeWidth={2} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 19, fontWeight: 700, color: t.ink, lineHeight: 1.1 }}>{n.label}</div>
                <div style={{ fontSize: 14, color: t.inkMuted, marginTop: 3 }}>{n.desc}</div>
              </div>
              <Icon name="chevron" size={20} stroke={t.ink} strokeWidth={2.5} />
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Voltage variant — loud, brutal, lime + black
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '12px 0 160px' }}>
      <div style={{ padding: '0 18px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 800, color: t.ink, textTransform: 'uppercase', letterSpacing: 2 }}>HEY ARJUN</p>
          <h1 style={{
            margin: '2px 0 0', fontFamily: t.fontDisplay, fontSize: 40, fontWeight: 900,
            color: t.ink, letterSpacing: -1.5, lineHeight: 0.9, textTransform: 'lowercase',
          }}>rizzvision</h1>
        </div>
        <VoiceIndicator t={t} state={app.voiceState} />
      </div>

      {/* Big call-out band */}
      <div style={{
        margin: '14px 18px 16px', padding: '16px 18px',
        background: t.ink, color: t.bg,
        border: `2px solid ${t.ink}`, boxShadow: `6px 6px 0 0 ${t.bg}, 6px 6px 0 2px ${t.ink}`,
      }}>
        <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.7 }}>TODAY ↓</div>
        <p style={{ fontFamily: t.fontDisplay, fontSize: 22, fontWeight: 900, lineHeight: 1.1, marginTop: 4, textTransform: 'uppercase' }}>
          dry. 18°. wear the cream cardigan.
        </p>
        <button onClick={() => app.speak('Today is dry, 18 degrees in the evening. Your cream cardigan suits this weather.')}
          style={{ marginTop: 12, fontFamily: t.fontUI, fontSize: 12, fontWeight: 900,
            color: t.bg, background: 'transparent', border: `2px solid ${t.bg}`,
            padding: '6px 12px', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: 1.4 }}>
          ▶ HEAR IT
        </button>
      </div>

      <div style={{ padding: '0 18px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {navItems.map(n => (
          <button key={n.id} onClick={() => app.navigate(n.id)} aria-label={`${n.label}. ${n.desc}`}
            style={{
              gridColumn: n.big ? '1 / -1' : undefined,
              background: n.big ? t.ink : t.bg, color: n.big ? t.bg : t.ink,
              border: `2px solid ${t.ink}`,
              padding: '16px 14px', textAlign: 'left',
              minHeight: n.big ? 110 : 110, cursor: 'pointer',
              display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              fontFamily: t.fontUI, position: 'relative',
            }}>
            <Icon name={n.icon} size={n.big ? 30 : 24} stroke={n.big ? t.bg : t.ink} strokeWidth={2.4} />
            <div>
              <div style={{ fontFamily: t.fontDisplay, fontSize: n.big ? 26 : 22, fontWeight: 900, textTransform: 'uppercase', letterSpacing: -0.5, lineHeight: 0.95 }}>{n.label}</div>
              <div style={{ fontSize: 11, fontWeight: 700, marginTop: 4, opacity: 0.8, textTransform: 'uppercase', letterSpacing: 1 }}>{n.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Scan ──────────────────────────────────────────────────────
function ScanScreen({ t, app, wardrobe, setWardrobe }) {
  const [state, setState] = useState('camera'); // camera | analyzing | result
  const [saved, setSaved] = useState(false);
  const result = window.MOCK.scanResult;

  useEffect(() => {
    if (state === 'analyzing') {
      const t1 = setTimeout(() => { setState('result'); app.setVoiceState('speaking'); app.announce(result.speech_segments[0].text); }, 1800);
      return () => clearTimeout(t1);
    }
    if (state === 'result') {
      const t2 = setTimeout(() => app.setVoiceState('listening'), 3500);
      return () => clearTimeout(t2);
    }
  }, [state]);

  const capture = () => { setState('analyzing'); app.setVoiceState('processing'); };
  const reset = () => { setSaved(false); setState('camera'); };
  const save = () => {
    setSaved(true);
    setWardrobe(w => [{ id: 'wn'+Date.now(), name: result.name, category: 'tops', color: result.color, colorHex: result.colorHex, audio: result.speech_segments.map(s=>s.text).join(' '), tags: ['casual'] }, ...w]);
    app.announce('Saved to your wardrobe.');
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <ScreenHeader t={t} title="Scan an item" onBack={() => app.back()} trailing={<VoiceIndicator t={t} state={app.voiceState} />} />

      <div style={{ flex: 1, position: 'relative', margin: '0 16px', overflow: 'hidden',
        borderRadius: t.radius, border: `${t.cardStyle === 'block' || t.cardStyle === 'outlined' ? 2 : 1}px solid ${t.border}` }}>
        {state === 'camera' && <CameraView t={t} />}
        {state === 'analyzing' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, background: t.surfaceInverse, color: t.bg }}>
            <Spinner t={t} inverse />
            <div style={{ fontFamily: t.fontUI, fontSize: 16, fontWeight: 700, color: t.bg, textTransform: t.id === 'voltage' ? 'uppercase' : 'none', letterSpacing: t.id === 'voltage' ? 1.4 : 0 }}>
              {t.id === 'voltage' ? 'READING…' : 'Reading the garment…'}
            </div>
          </div>
        )}
        {state === 'result' && <ScanResult t={t} result={result} />}
      </div>

      <div style={{ padding: '14px 16px 26px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {state === 'camera' && (
          <>
            <Button t={t} icon="camera" full onClick={capture} ariaLabel="Take photo for analysis">Capture</Button>
            <p style={{ textAlign: 'center', fontFamily: t.fontUI, fontSize: 12, color: t.inkMuted }}>or say "scan this"</p>
          </>
        )}
        {state === 'result' && (
          <>
            <Button t={t} icon={saved ? 'check' : 'plus'} full onClick={save} disabled={saved}>
              {saved ? 'Saved to wardrobe' : 'Save to wardrobe'}
            </Button>
            <Button t={t} variant="secondary" full onClick={reset}>Scan another</Button>
          </>
        )}
      </div>
    </div>
  );
}

function CameraView({ t }) {
  const isVoltage = t.id === 'voltage';
  return (
    <div style={{ position: 'absolute', inset: 0,
      background: `radial-gradient(circle at 50% 45%, #2a2a2e 0%, #0a0a0a 70%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* T-shirt silhouette */}
      <svg width="180" height="220" viewBox="0 0 180 220" style={{ opacity: 0.18 }}>
        <path d="M40 30L70 10h40l30 20 30 12-12 36-18-6v138H50V72l-18 6L20 42z" fill="none" stroke="#fff" strokeWidth="2" strokeDasharray="4 6"/>
      </svg>
      {/* Corner brackets */}
      {[[18,18,'tl'],[18,18,'tr'],[18,18,'bl'],[18,18,'br']].map((b,i) => (
        <div key={i} style={{
          position: 'absolute',
          [i<2?'top':'bottom']: 22, [i%2?'right':'left']: 22,
          width: 28, height: 28,
          borderTop: i<2 ? `3px solid ${t.accent}` : 'none',
          borderBottom: i>=2 ? `3px solid ${t.accent}` : 'none',
          borderLeft: i%2===0 ? `3px solid ${t.accent}` : 'none',
          borderRight: i%2===1 ? `3px solid ${t.accent}` : 'none',
        }} />
      ))}
      <div style={{ position: 'absolute', top: 18, left: '50%', transform: 'translateX(-50%)',
        fontSize: 11, fontFamily: t.fontUI, fontWeight: 700, color: '#fff',
        background: 'rgba(0,0,0,0.55)', padding: '6px 12px',
        borderRadius: isVoltage ? 0 : 12, letterSpacing: isVoltage ? 1.4 : 0.4,
        textTransform: isVoltage ? 'uppercase' : 'none',
      }}>
        Center the t-shirt
      </div>
    </div>
  );
}

function Spinner({ t, inverse }) {
  const c = inverse ? t.bg : t.accent;
  if (t.id === 'voltage') {
    return <div style={{ width: 36, height: 36, background: c, animation: 'voltspin 0.8s steps(8) infinite' }}>
      <style>{`@keyframes voltspin{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}`}</style>
    </div>;
  }
  return <div style={{ width: 40, height: 40, border: `3px solid ${c}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'rotate 0.8s linear infinite' }}>
    <style>{`@keyframes rotate{to{transform:rotate(360deg)}}`}</style>
  </div>;
}

function ScanResult({ t, result }) {
  const isVoltage = t.id === 'voltage';
  return (
    <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', padding: 20, background: t.surface }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
        <span style={{ width: 56, height: 56, background: result.colorHex, border: `${isVoltage?2:1}px solid ${t.border}`, borderRadius: t.cardStyle === 'block' ? 0 : '50%' }} />
        <div style={{ flex: 1 }}>
          <h2 style={{ fontFamily: t.fontDisplay, fontSize: isVoltage ? 22 : 20, fontWeight: isVoltage ? 900 : 600, color: t.ink, lineHeight: 1.1, textTransform: isVoltage ? 'uppercase' : 'none', fontStyle: t.id === 'studio' ? 'italic' : 'normal' }}>{result.name}</h2>
          <p style={{ fontSize: 12, color: t.inkMuted, fontFamily: t.fontUI, marginTop: 4 }}>{result.color} · {result.fit} fit · {Math.round(result.confidence*100)}% confidence</p>
        </div>
      </div>

      {result.speech_segments.map((s, i) => (
        <p key={s.id} style={{
          fontFamily: t.fontBody, fontSize: 15, lineHeight: 1.6,
          color: i === 0 ? t.ink : t.inkMuted,
          marginBottom: 12,
        }}>{s.text}</p>
      ))}

      <div style={{ marginTop: 14, padding: 12,
        background: t.accentSoft,
        border: t.id === 'clarity' || isVoltage ? `2px solid ${t.accent}` : 'none',
        borderLeft: t.id === 'studio' ? `3px solid ${t.accent}` : undefined,
        borderRadius: t.cardStyle === 'block' ? 0 : t.radiusSm,
      }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: t.accent, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6 }}>Pairing note</div>
        <p style={{ fontFamily: t.fontBody, fontSize: 14, color: t.ink, lineHeight: 1.5 }}>{result.color_feedback}</p>
      </div>
    </div>
  );
}

// ─── Wardrobe ──────────────────────────────────────────────────
function WardrobeScreen({ t, app, wardrobe, setWardrobe }) {
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const isVoltage = t.id === 'voltage';

  const cats = ['all', ...new Set(wardrobe.map(i => i.category))];
  const filtered = wardrobe.filter(i =>
    (cat === 'all' || i.category === cat) &&
    (!q || i.name.toLowerCase().includes(q.toLowerCase()) || i.color.toLowerCase().includes(q.toLowerCase()))
  );

  const remove = (id) => { setWardrobe(w => w.filter(x => x.id !== id)); app.announce('Removed from your wardrobe.'); };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <ScreenHeader t={t} title="Wardrobe" subtitle={`${wardrobe.length} items · ${wardrobe.filter(i=>i.tags.includes('casual')).length} casual`} onBack={() => app.back()} />

      <div style={{ padding: '0 18px 10px' }}>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: t.inkMuted }}>
            <Icon name="search" size={18} stroke={t.inkMuted} />
          </span>
          <input
            value={q} onChange={e => setQ(e.target.value)}
            placeholder="Search by name or color"
            aria-label="Search wardrobe"
            style={{
              width: '100%', padding: '12px 14px 12px 42px',
              borderRadius: t.radiusSm,
              border: `${t.cardStyle === 'block' || t.cardStyle === 'outlined' ? 2 : 1}px solid ${t.border}`,
              background: t.surface, color: t.ink,
              fontFamily: t.fontUI, fontSize: 15, outline: 'none',
              minHeight: 48,
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 10, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
          {cats.map(c => (
            <button key={c} onClick={() => setCat(c)}
              aria-pressed={cat === c}
              style={{
                flexShrink: 0, padding: '7px 14px', minHeight: 36,
                fontFamily: t.fontUI, fontSize: 12, fontWeight: 700,
                background: cat === c ? t.surfaceInverse : 'transparent',
                color: cat === c ? t.bg : t.ink,
                border: `${isVoltage ? 2 : 1}px solid ${cat === c ? t.surfaceInverse : t.border}`,
                borderRadius: t.radiusPill,
                cursor: 'pointer',
                textTransform: isVoltage ? 'uppercase' : 'capitalize',
                letterSpacing: isVoltage ? 1 : 0,
              }}>{c}</button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 18px 160px', scrollbarWidth: 'none' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {filtered.map(item => (
            <WardrobeItem key={item.id} t={t} item={item} onSpeak={() => app.speak(item.audio)} onRemove={() => remove(item.id)} onEdit={() => app.navigate('EDIT_ITEM', { item })} />
          ))}
        </div>
        {filtered.length === 0 && (
          <p style={{ textAlign: 'center', padding: 40, color: t.inkMuted, fontFamily: t.fontUI, fontSize: 14 }}>
            No items match. Scan one to add it.
          </p>
        )}
      </div>
    </div>
  );
}

function WardrobeItem({ t, item, onSpeak, onRemove, onEdit }) {
  const isVoltage = t.id === 'voltage';
  return (
    <Card t={t} padding={10}>
      <GarmentVisual t={t} item={item} aspect="4/5" />
      <div style={{ padding: '10px 2px 2px' }}>
        <div style={{ fontFamily: t.fontUI, fontWeight: 700, fontSize: 13, color: t.ink, lineHeight: 1.2, marginBottom: 2 }}>
          {item.name}
        </div>
        <div style={{ fontSize: 11, color: t.inkMuted, fontFamily: t.fontUI }}>{item.color}</div>
        <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
          <button onClick={onSpeak} aria-label={`Describe ${item.name}`} style={{
            flex: 1, padding: '7px 0', minHeight: 36,
            background: t.accentSoft, color: t.accent,
            border: 'none', borderRadius: t.radiusSm,
            fontFamily: t.fontUI, fontSize: 11, fontWeight: 700,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4,
            cursor: 'pointer', textTransform: isVoltage ? 'uppercase' : 'none', letterSpacing: isVoltage ? 1 : 0,
          }}>
            <Icon name="speaker" size={13} stroke={t.accent} strokeWidth={2} />
            Hear
          </button>
          <button onClick={onRemove} aria-label={`Remove ${item.name}`} style={{
            width: 36, height: 36, minHeight: 36, minWidth: 36,
            background: 'transparent', border: `1px solid ${t.border}`,
            borderRadius: t.radiusSm, cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            color: t.inkMuted,
          }}>
            <Icon name="trash" size={14} stroke={t.inkMuted} strokeWidth={1.8} />
          </button>
        </div>
      </div>
    </Card>
  );
}

// ─── Outfit ────────────────────────────────────────────────────
function OutfitScreen({ t, app, wardrobe }) {
  const [occasion, setOccasion] = useState('');
  const [state, setState] = useState('idle');
  const [picked, setPicked] = useState(null);
  const isVoltage = t.id === 'voltage';
  const occasions = window.OCCASIONS;
  const suggestion = window.MOCK.outfitSuggestion;

  const pickedItems = useMemo(() =>
    picked ? suggestion.items.map(id => wardrobe.find(i => i.id === id)).filter(Boolean) : []
  , [picked, wardrobe]);

  const generate = (occId) => {
    setOccasion(occId);
    setState('loading');
    setPicked(null);
    setTimeout(() => {
      setState('result');
      setPicked(suggestion);
      app.setVoiceState('speaking');
      app.announce(suggestion.speech_segments[0].text);
    }, 1400);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <ScreenHeader t={t} title="Outfit for…" onBack={() => app.back()} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 18px 160px', scrollbarWidth: 'none' }}>
        <SectionLabel t={t}>Pick an occasion</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 18 }}>
          {occasions.map(o => (
            <button key={o.id} onClick={() => generate(o.id)} aria-label={`Get outfit for ${o.label}`}
              aria-pressed={occasion === o.id}
              style={{
                padding: '14px 14px', minHeight: 64,
                background: occasion === o.id ? t.surfaceInverse : t.surface,
                color: occasion === o.id ? t.bg : t.ink,
                border: `${isVoltage ? 2 : 1}px solid ${occasion === o.id ? t.surfaceInverse : t.border}`,
                borderRadius: t.radius, cursor: 'pointer',
                textAlign: 'left', fontFamily: t.fontUI,
                display: 'flex', flexDirection: 'column', gap: 4,
              }}>
              <div style={{ fontSize: 14, fontWeight: isVoltage ? 900 : 700, lineHeight: 1.1, textTransform: isVoltage ? 'uppercase' : 'none' }}>{o.label}</div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>{o.note}</div>
            </button>
          ))}
        </div>

        {state === 'loading' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '30px 0' }}>
            <Spinner t={t} />
            <p style={{ fontFamily: t.fontUI, fontSize: 14, color: t.inkMuted }}>Building your look…</p>
          </div>
        )}

        {state === 'result' && picked && (
          <div>
            <SectionLabel t={t}>Suggested look</SectionLabel>
            <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              {pickedItems.map(item => (
                <div key={item.id} style={{ flex: 1 }}>
                  <GarmentVisual t={t} item={item} aspect="3/4" />
                  <div style={{ fontSize: 11, fontFamily: t.fontUI, color: t.inkMuted, marginTop: 6, lineHeight: 1.25 }}>{item.name}</div>
                </div>
              ))}
            </div>

            <Card t={t} padding={16} style={{ marginBottom: 12 }}>
              {suggestion.speech_segments.map(s => (
                <p key={s.id} style={{ fontFamily: t.fontBody, fontSize: 14, lineHeight: 1.55, color: t.ink, marginBottom: 10 }}>{s.text}</p>
              ))}
              <button onClick={() => app.speak(suggestion.speech_segments.map(s => s.text).join(' '))}
                style={{
                  marginTop: 4, padding: '8px 12px', minHeight: 36,
                  background: t.accentSoft, color: t.accent,
                  border: 'none', borderRadius: t.radiusSm,
                  fontFamily: t.fontUI, fontSize: 12, fontWeight: 700,
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  cursor: 'pointer', textTransform: isVoltage ? 'uppercase' : 'none', letterSpacing: isVoltage ? 1 : 0,
                }}>
                <Icon name="speaker" size={14} stroke={t.accent} strokeWidth={2} /> Hear the whole thing
              </button>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Mirror ────────────────────────────────────────────────────
function MirrorScreen({ t, app }) {
  const [state, setState] = useState('camera');
  const result = window.MOCK.mirrorResult;
  const isVoltage = t.id === 'voltage';

  const capture = () => {
    setState('analyzing'); app.setVoiceState('processing');
    setTimeout(() => { setState('result'); app.setVoiceState('speaking'); app.announce(result.speech_segments[0].text); }, 2000);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <ScreenHeader t={t} title="Mirror check" onBack={() => app.back()} trailing={<VoiceIndicator t={t} state={app.voiceState} />} />

      <div style={{ flex: 1, position: 'relative', margin: '0 16px', overflow: 'hidden',
        borderRadius: t.radius, border: `${t.cardStyle === 'block' || t.cardStyle === 'outlined' ? 2 : 1}px solid ${t.border}` }}>
        {state === 'camera' && <MirrorView t={t} />}
        {state === 'analyzing' && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, background: t.surfaceInverse, color: t.bg }}>
            <Spinner t={t} inverse />
            <div style={{ fontFamily: t.fontUI, fontSize: 16, fontWeight: 700, color: t.bg, textTransform: isVoltage ? 'uppercase' : 'none', letterSpacing: isVoltage ? 1.4 : 0 }}>
              {isVoltage ? 'CHECKING YOUR FIT…' : 'Looking you over…'}
            </div>
          </div>
        )}
        {state === 'result' && <MirrorResult t={t} result={result} />}
      </div>

      <div style={{ padding: '14px 16px 26px' }}>
        {state === 'camera' && <Button t={t} icon="camera" full onClick={capture}>Capture mirror</Button>}
        {state === 'result' && <Button t={t} variant="secondary" full onClick={() => setState('camera')}>Check again</Button>}
      </div>
    </div>
  );
}

function MirrorView({ t }) {
  return (
    <div style={{ position: 'absolute', inset: 0,
      background: `linear-gradient(180deg, #1a1a1e 0%, #0a0a0a 100%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Full-body silhouette */}
      <svg width="120" height="320" viewBox="0 0 120 320" style={{ opacity: 0.18 }}>
        <circle cx="60" cy="36" r="22" fill="none" stroke="#fff" strokeWidth="2" strokeDasharray="4 6"/>
        <path d="M30 70L90 70L100 160L80 160L75 310L60 310L58 200L60 200L62 200L60 200L45 310L40 310L20 160z" fill="none" stroke="#fff" strokeWidth="2" strokeDasharray="4 6"/>
      </svg>
      <div style={{ position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
        fontSize: 11, fontFamily: t.fontUI, fontWeight: 700, color: '#fff',
        background: 'rgba(0,0,0,0.55)', padding: '6px 12px',
        borderRadius: t.id === 'voltage' ? 0 : 12, letterSpacing: t.id === 'voltage' ? 1.4 : 0.4,
        textTransform: t.id === 'voltage' ? 'uppercase' : 'none',
      }}>Step back · full body</div>
    </div>
  );
}

function MirrorResult({ t, result }) {
  const isVoltage = t.id === 'voltage';
  return (
    <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', padding: 20, background: t.surface }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 800, color: t.inkMuted, textTransform: 'uppercase', letterSpacing: 1.3 }}>Reads as</p>
          <h2 style={{ fontFamily: t.fontDisplay, fontSize: isVoltage ? 24 : 22, fontWeight: isVoltage ? 900 : 600, color: t.ink, lineHeight: 1.05, marginTop: 4, textTransform: isVoltage ? 'uppercase' : 'none', fontStyle: t.id === 'studio' ? 'italic' : 'normal' }}>{result.occasion}</h2>
        </div>
        <div style={{
          padding: isVoltage ? '10px 14px' : '8px 14px', background: t.accent, color: t.inkOnAccent,
          fontFamily: t.fontDisplay, fontSize: 22, fontWeight: 900,
          borderRadius: t.cardStyle === 'block' ? 0 : 12, border: isVoltage ? `2px solid ${t.ink}` : 'none',
        }}>{result.score}</div>
      </div>

      {result.speech_segments.map(s => (
        <p key={s.id} style={{ fontFamily: t.fontBody, fontSize: 15, lineHeight: 1.6, color: t.ink, marginBottom: 12 }}>{s.text}</p>
      ))}

      <div style={{
        marginTop: 8, padding: 12,
        background: t.accentSoft,
        border: t.id === 'clarity' || isVoltage ? `2px solid ${t.accent}` : 'none',
        borderLeft: t.id === 'studio' ? `3px solid ${t.accent}` : undefined,
        borderRadius: t.cardStyle === 'block' ? 0 : t.radiusSm,
      }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: t.accent, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 6 }}>You</div>
        <p style={{ fontFamily: t.fontBody, fontSize: 14, color: t.ink, lineHeight: 1.5 }}>{result.personal_appearance}</p>
      </div>
    </div>
  );
}

// ─── Shopping ──────────────────────────────────────────────────
function ShoppingScreen({ t, app, wardrobe }) {
  const [state, setState] = useState('idle');
  const result = window.MOCK.shoppingResult;
  const isVoltage = t.id === 'voltage';

  const start = () => {
    setState('loading');
    setTimeout(() => { setState('result'); app.setVoiceState('speaking'); app.announce(result.speech_segments[0].text); }, 1500);
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <ScreenHeader t={t} title="Shopping check" onBack={() => app.back()} subtitle="Will this work with what you already own?" />

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 18px 160px', scrollbarWidth: 'none' }}>
        {state === 'idle' && (
          <Card t={t} padding={22} style={{ textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', padding: 14, background: t.accentSoft, borderRadius: t.cardStyle === 'block' ? 0 : '50%', marginBottom: 14 }}>
              <Icon name="shop" size={28} stroke={t.accent} strokeWidth={1.8} />
            </div>
            <h2 style={{ fontFamily: t.fontDisplay, fontSize: 20, fontWeight: isVoltage ? 900 : 600, color: t.ink, marginBottom: 8, textTransform: isVoltage ? 'uppercase' : 'none', fontStyle: t.id === 'studio' ? 'italic' : 'normal' }}>Snap it in the store</h2>
            <p style={{ fontFamily: t.fontBody, fontSize: 14, color: t.inkMuted, lineHeight: 1.5, marginBottom: 18 }}>
              We will check the colour, fit and gap against your wardrobe. Audio verdict in ten seconds.
            </p>
            <Button t={t} icon="camera" full onClick={start}>Take photo</Button>
          </Card>
        )}

        {state === 'loading' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '40px 0' }}>
            <Spinner t={t} />
            <p style={{ fontFamily: t.fontUI, fontSize: 14, color: t.inkMuted }}>Cross-referencing your wardrobe…</p>
          </div>
        )}

        {state === 'result' && (
          <div>
            <div style={{
              padding: 16, marginBottom: 14,
              background: result.verdict === 'good' ? (isVoltage ? t.ink : t.accent) : t.danger,
              color: result.verdict === 'good' ? (isVoltage ? t.bg : t.inkOnAccent) : '#fff',
              border: isVoltage ? `2px solid ${t.ink}` : 'none',
              borderRadius: t.radius,
              boxShadow: isVoltage ? t.shadow : 'none',
            }}>
              <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.4, opacity: 0.8 }}>Verdict</div>
              <h2 style={{ fontFamily: t.fontDisplay, fontSize: 26, fontWeight: 900, marginTop: 4, textTransform: 'uppercase', lineHeight: 1 }}>
                {result.verdict === 'good' ? 'BUY IT' : 'SKIP IT'}
              </h2>
            </div>

            <Card t={t} padding={16} style={{ marginBottom: 14 }}>
              {result.speech_segments.map(s => (
                <p key={s.id} style={{ fontFamily: t.fontBody, fontSize: 14, lineHeight: 1.55, color: t.ink, marginBottom: 10 }}>{s.text}</p>
              ))}
            </Card>

            <SectionLabel t={t}>Pairs with</SectionLabel>
            <div style={{ display: 'flex', gap: 10 }}>
              {result.matches.map(id => {
                const item = wardrobe.find(i => i.id === id);
                if (!item) return null;
                return (
                  <div key={id} style={{ flex: 1 }}>
                    <GarmentVisual t={t} item={item} aspect="1/1" />
                    <div style={{ fontSize: 11, fontFamily: t.fontUI, color: t.inkMuted, marginTop: 6, lineHeight: 1.2 }}>{item.name}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── EditItem ──────────────────────────────────────────────────
function EditItemScreen({ t, app, wardrobe, setWardrobe }) {
  const item = app.current.params?.item || wardrobe[0];
  const [name, setName] = useState(item.name);
  const [color, setColor] = useState(item.color);
  const [audio, setAudio] = useState(item.audio);
  const isVoltage = t.id === 'voltage';

  const save = () => {
    setWardrobe(w => w.map(i => i.id === item.id ? { ...i, name, color, audio } : i));
    app.announce('Updated.');
    app.back();
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <ScreenHeader t={t} title="Edit item" onBack={() => app.back()} />

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 18px 30px', scrollbarWidth: 'none' }}>
        <div style={{ width: 120, margin: '4px auto 22px' }}>
          <GarmentVisual t={t} item={{...item, colorHex: item.colorHex}} aspect="1/1" />
        </div>

        {[
          ['Name', name, setName, 'e.g. White cotton tee', false],
          ['Colour', color, setColor, 'e.g. Off-white', false],
          ['Audio description', audio, setAudio, 'How it looks, feels, fits…', true],
        ].map(([label, val, set, ph, multi]) => (
          <div key={label} style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontFamily: t.fontUI, fontSize: 12, fontWeight: 700, color: t.inkMuted, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>{label}</label>
            {multi ? (
              <textarea value={val} onChange={e => set(e.target.value)} placeholder={ph} rows={4}
                style={{ width: '100%', padding: 14, fontFamily: t.fontBody, fontSize: 15, lineHeight: 1.5,
                  border: `${isVoltage || t.id === 'clarity' ? 2 : 1}px solid ${t.border}`,
                  borderRadius: t.radiusSm, background: t.surface, color: t.ink, outline: 'none', resize: 'vertical' }} />
            ) : (
              <input value={val} onChange={e => set(e.target.value)} placeholder={ph}
                style={{ width: '100%', padding: 14, fontFamily: t.fontUI, fontSize: 15, minHeight: 48,
                  border: `${isVoltage || t.id === 'clarity' ? 2 : 1}px solid ${t.border}`,
                  borderRadius: t.radiusSm, background: t.surface, color: t.ink, outline: 'none' }} />
            )}
          </div>
        ))}

        <Button t={t} full onClick={save}>Save changes</Button>
      </div>
    </div>
  );
}

window.OCCASIONS = [
  { id: 'casual',     label: 'Casual',       note: 'Coffee, weekend' },
  { id: 'work',       label: 'Work',         note: 'Office, meetings' },
  { id: 'date',       label: 'Date night',   note: 'Dinner, drinks' },
  { id: 'formal',     label: 'Formal',       note: 'Wedding, event' },
  { id: 'sport',      label: 'Active',       note: 'Gym, outdoor' },
  { id: 'travel',     label: 'Travel',       note: 'Long day out' },
];

Object.assign(window, {
  HomeScreen, ScanScreen, WardrobeScreen,
  OutfitScreen, MirrorScreen, ShoppingScreen, EditItemScreen,
});
