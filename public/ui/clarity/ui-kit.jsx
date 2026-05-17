// Shared UI primitives. All theme-aware — accept `t` (theme) as prop.
// Designed accessibility-first: 48px min targets, focus-visible rings, ARIA.

const { useState, useEffect, useRef, useCallback, useMemo } = React;

// ─── Icons (stroked, line, neutral) ───────────────────────────
function Icon({ name, size = 22, stroke = 'currentColor', strokeWidth = 1.75, fill = 'none' }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill, stroke, strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    back: <path d="M15 6l-6 6 6 6" />,
    mic: <><rect x="9" y="3" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></>,
    micOff: <><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 12V6a3 3 0 0 0-6 0v1M5 11a7 7 0 0 0 10.5 6.06M12 18v3M3 3l18 18" /></>,
    camera: <><path d="M4 8h3l2-2h6l2 2h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2z" /><circle cx="12" cy="13" r="4" /></>,
    mirror: <><ellipse cx="12" cy="9" rx="6" ry="7" /><path d="M12 16v6M9 22h6" /></>,
    wardrobe: <><path d="M4 8h16v13H4zM4 8l8-5 8 5M9 13h6" /></>,
    sparkle: <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5zM19 16l.7 2.1L22 19l-2.3.9L19 22l-.7-2.1L16 19l2.3-.9z" />,
    shop: <><path d="M5 9h14l-1 11H6L5 9zM9 9V6a3 3 0 0 1 6 0v3" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    check: <path d="M5 12l4 4 10-10" />,
    x: <path d="M6 6l12 12M6 18L18 6" />,
    play: <path d="M7 5l12 7-12 7z" fill={stroke} stroke="none" />,
    pause: <><rect x="6" y="5" width="4" height="14" /><rect x="14" y="5" width="4" height="14" /></>,
    speaker: <><path d="M5 9h3l5-4v14l-5-4H5zM16 8a5 5 0 0 1 0 8" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></>,
    home: <path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-4v-7H8v7H4a1 1 0 0 1-1-1z" />,
    dot: <circle cx="12" cy="12" r="3" fill={stroke} stroke="none" />,
    star: <path d="M12 3l2.8 6 6.2.9-4.5 4.4 1 6.2L12 17.8 6.5 20.5l1-6.2L3 9.9 9.2 9z" />,
    edit: <path d="M4 20h4l10-10-4-4L4 16zM14 6l4 4" />,
    trash: <><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /><path d="M10 11v6M14 11v6" /></>,
    wave: <path d="M4 12c2-4 4-4 4 0s2 4 4 0 4-4 4 0 2 4 4 0" />,
    chevron: <path d="M9 6l6 6-6 6" />,
    swatch: <circle cx="12" cy="12" r="9" />,
    waveform: <path d="M3 12h2M7 6v12M11 9v6M15 4v16M19 8v8M23 12h-2" />,
    occasion: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  };
  return <svg {...common}>{paths[name] || null}</svg>;
}

// ─── Button ────────────────────────────────────────────────────
function Button({ t, variant = 'primary', size = 'lg', icon, children, onClick, disabled, ariaLabel, full, style = {} }) {
  const heights = { lg: 56, md: 48, sm: 40 };
  const px = { lg: 22, md: 18, sm: 14 };
  const fs = { lg: 16, md: 15, sm: 13 };
  const isVoltage = t.id === 'voltage';
  const isClarity = t.id === 'clarity';

  let bg, color, border;
  if (variant === 'primary') {
    bg = t.accent; color = t.inkOnAccent;
    border = isVoltage || isClarity ? `2px solid ${t.ink}` : 'none';
  } else if (variant === 'secondary') {
    bg = t.surface; color = t.ink;
    border = `${isClarity || isVoltage ? 2 : 1}px solid ${t.border}`;
  } else if (variant === 'ghost') {
    bg = 'transparent'; color = t.ink; border = 'none';
  } else if (variant === 'danger') {
    bg = isVoltage ? t.bg : t.surface; color = t.danger;
    border = `${isClarity || isVoltage ? 2 : 1}px solid ${t.danger}`;
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      style={{
        height: heights[size],
        minHeight: heights[size],
        minWidth: heights[size],
        width: full ? '100%' : undefined,
        padding: `0 ${px[size]}px`,
        background: bg,
        color,
        border,
        borderRadius: variant === 'ghost' ? t.radiusSm : t.radius,
        fontFamily: t.fontUI,
        fontSize: fs[size],
        fontWeight: isVoltage ? 800 : 600,
        letterSpacing: isVoltage ? 0.4 : -0.1,
        textTransform: isVoltage ? 'uppercase' : 'none',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        transition: `transform ${t.motion}, background ${t.motion}, box-shadow ${t.motion}`,
        boxShadow: variant === 'primary' && isVoltage ? t.shadow : 'none',
        position: 'relative',
        ...style,
      }}
      onMouseDown={(e) => { if (!disabled && isVoltage && variant === 'primary') e.currentTarget.style.transform = 'translate(3px,3px)'; }}
      onMouseUp={(e) => { if (isVoltage) e.currentTarget.style.transform = ''; }}
      onMouseLeave={(e) => { if (isVoltage) e.currentTarget.style.transform = ''; }}
    >
      {icon && <Icon name={icon} size={size === 'sm' ? 16 : 20} strokeWidth={isVoltage ? 2.4 : 1.75} />}
      {children}
    </button>
  );
}

// ─── IconButton ────────────────────────────────────────────────
function IconButton({ t, icon, onClick, ariaLabel, size = 48, variant = 'ghost' }) {
  const isVoltage = t.id === 'voltage';
  const isClarity = t.id === 'clarity';
  const bg = variant === 'ghost' ? 'transparent' : t.surface;
  return (
    <button
      onClick={onClick} aria-label={ariaLabel}
      style={{
        width: size, height: size, minWidth: size, minHeight: size,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        background: bg, color: t.ink,
        border: variant !== 'ghost' ? `${isClarity || isVoltage ? 2 : 1}px solid ${t.border}` : 'none',
        borderRadius: t.radiusSm,
        cursor: 'pointer',
        transition: `background ${t.motion}`,
      }}
    >
      <Icon name={icon} size={22} strokeWidth={isVoltage ? 2.4 : 1.75} />
    </button>
  );
}

// ─── Card ──────────────────────────────────────────────────────
function Card({ t, children, style = {}, onClick, ariaLabel, padding = 18 }) {
  const isGlass = t.cardStyle === 'glass';
  const isBlock = t.cardStyle === 'block';
  const isOutlined = t.cardStyle === 'outlined';
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={ariaLabel}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } } : undefined}
      style={{
        background: t.surface,
        border: `${isBlock ? 2 : isOutlined ? 2 : 1}px solid ${t.border}`,
        borderRadius: t.radius,
        padding,
        cursor: onClick ? 'pointer' : 'default',
        backdropFilter: isGlass ? 'blur(20px) saturate(140%)' : 'none',
        WebkitBackdropFilter: isGlass ? 'blur(20px) saturate(140%)' : 'none',
        boxShadow: isBlock ? t.shadow : 'none',
        transition: `transform ${t.motion}, background ${t.motion}`,
        position: 'relative',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ─── ScreenHeader (back arrow + title) ─────────────────────────
function ScreenHeader({ t, title, onBack, trailing, subtitle }) {
  const isVoltage = t.id === 'voltage';
  return (
    <div style={{ padding: '8px 18px 14px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
      {onBack && <IconButton t={t} icon="back" onClick={onBack} ariaLabel="Go back" />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h1 style={{
          margin: 0,
          fontFamily: t.fontUI,
          fontSize: isVoltage ? 22 : 19,
          fontWeight: isVoltage ? 900 : 700,
          letterSpacing: isVoltage ? 0.4 : -0.3,
          textTransform: isVoltage ? 'uppercase' : 'none',
          color: t.ink,
          lineHeight: 1.1,
        }}>{title}</h1>
        {subtitle && <p style={{ margin: '4px 0 0', fontSize: 13, color: t.inkMuted, fontFamily: t.fontUI }}>{subtitle}</p>}
      </div>
      {trailing}
    </div>
  );
}

// ─── VoiceIndicator ────────────────────────────────────────────
function VoiceIndicator({ t, state = 'listening' }) {
  // state: 'off' | 'listening' | 'speaking' | 'processing'
  const color = state === 'off' ? t.inkDim : t.accent;
  const label = { off: 'Mic off', listening: 'Listening', speaking: 'Speaking', processing: 'Thinking' }[state];

  if (t.voiceStyle === 'bars') {
    // Clarity — literal sound bars
    return (
      <div role="status" aria-label={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 22 }} aria-hidden="true">
          {[0,1,2,3,4].map(i => (
            <span key={i} style={{
              display: 'block', width: 4, height: state === 'off' ? 6 : '100%',
              background: color, borderRadius: 1,
              animation: state !== 'off' ? `barwave-${i} 900ms ease-in-out infinite` : 'none',
              animationDelay: `${i * 80}ms`,
            }} />
          ))}
        </div>
        <span style={{ fontFamily: t.fontUI, fontSize: 13, fontWeight: 700, color: t.ink, letterSpacing: 0 }}>{label}</span>
        <style>{`
          @keyframes barwave-0 { 0%,100%{height:35%} 50%{height:90%} }
          @keyframes barwave-1 { 0%,100%{height:55%} 50%{height:100%} }
          @keyframes barwave-2 { 0%,100%{height:80%} 50%{height:40%} }
          @keyframes barwave-3 { 0%,100%{height:45%} 50%{height:95%} }
          @keyframes barwave-4 { 0%,100%{height:60%} 50%{height:30%} }
        `}</style>
      </div>
    );
  }

  if (t.voiceStyle === 'block') {
    // Voltage — blocky digital pulse
    return (
      <div role="status" aria-label={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ display: 'flex', gap: 2 }} aria-hidden="true">
          {[0,1,2,3,4,5,6].map(i => (
            <span key={i} style={{
              display: 'block', width: 5, height: 22,
              background: t.ink,
              opacity: state === 'off' ? 0.25 : 1,
              animation: state !== 'off' ? `blkpulse 600ms ease-in-out infinite` : 'none',
              animationDelay: `${i * 60}ms`,
            }} />
          ))}
        </div>
        <span style={{ fontFamily: t.fontUI, fontSize: 12, fontWeight: 900, color: t.ink, textTransform: 'uppercase', letterSpacing: 1.4 }}>{label}</span>
        <style>{`@keyframes blkpulse { 0%,100%{transform:scaleY(0.4)} 50%{transform:scaleY(1)} }`}</style>
      </div>
    );
  }

  // Studio — orbit / pulse
  return (
    <div role="status" aria-label={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ position: 'relative', width: 24, height: 24 }} aria-hidden="true">
        <span style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: color, opacity: state === 'off' ? 0.3 : 1,
          animation: state !== 'off' ? `orbcore 1.6s ease-in-out infinite` : 'none',
          boxShadow: state !== 'off' ? `0 0 16px ${color}` : 'none',
        }} />
        {state !== 'off' && (
          <>
            <span style={{ position: 'absolute', inset: -6, borderRadius: '50%', border: `1.5px solid ${color}`, opacity: 0.5, animation: 'orbring 1.6s ease-in-out infinite' }} />
            <span style={{ position: 'absolute', inset: -12, borderRadius: '50%', border: `1px solid ${color}`, opacity: 0.25, animation: 'orbring 1.6s ease-in-out infinite 0.4s' }} />
          </>
        )}
      </div>
      <span style={{ fontFamily: t.fontUI, fontSize: 12, color: state === 'off' ? t.inkDim : color, fontWeight: 600 }}>{label}</span>
      <style>{`
        @keyframes orbcore { 0%,100%{transform:scale(0.55)} 50%{transform:scale(1)} }
        @keyframes orbring { 0%{transform:scale(0.7);opacity:0.55} 100%{transform:scale(1.15);opacity:0} }
      `}</style>
    </div>
  );
}

// ─── ColorSwatch (large, accessible, named) ────────────────────
function ColorSwatch({ t, hex, name, size = 60 }) {
  const isVoltage = t.id === 'voltage';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span aria-label={`Color: ${name}`} style={{
        width: size, height: size, borderRadius: t.cardStyle === 'block' ? 0 : '50%',
        background: hex, border: `${isVoltage ? 2 : 1}px solid ${t.border}`,
        flexShrink: 0, display: 'block',
      }} />
      {name && <span style={{ fontFamily: t.fontUI, fontWeight: 600, fontSize: 14, color: t.ink }}>{name}</span>}
    </div>
  );
}

// ─── Floating mic (persistent, always-accessible voice entry) ──
function FloatingMic({ t, listening, onToggle, onLongPress, hint }) {
  const isVoltage = t.id === 'voltage';
  const isClarity = t.id === 'clarity';
  return (
    <div style={{
      position: 'absolute',
      left: 0, right: 0, bottom: 38,
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
      pointerEvents: 'none',
      zIndex: 30,
    }}>
      {hint && <div style={{
        pointerEvents: 'auto',
        fontSize: 12, fontFamily: t.fontUI, fontWeight: 600,
        color: t.inkMuted, background: t.bgRaised,
        padding: '6px 12px', borderRadius: t.radiusPill,
        border: `1px solid ${t.border}`,
        textTransform: isVoltage ? 'uppercase' : 'none',
        letterSpacing: isVoltage ? 1 : 0,
      }}>{hint}</div>}
      <button
        onClick={onToggle}
        aria-label={listening ? 'Stop listening. Currently listening for voice commands.' : 'Tap to start voice command. Hold to record a question.'}
        aria-pressed={listening}
        style={{
          pointerEvents: 'auto',
          width: 72, height: 72,
          borderRadius: isVoltage ? 0 : '50%',
          background: listening ? t.accent : t.surfaceInverse,
          color: listening ? t.inkOnAccent : t.bg,
          border: `${isClarity || isVoltage ? 3 : 0}px solid ${t.ink}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: isVoltage ? t.shadow : (listening ? `0 0 0 8px ${t.accentSoft}, 0 8px 30px -8px ${t.accent}` : `0 6px 22px -6px rgba(0,0,0,0.5)`),
          transition: `box-shadow ${t.motion}, background ${t.motion}, transform ${t.motion}`,
          animation: listening ? 'micpulse 1.6s ease-in-out infinite' : 'none',
        }}
      >
        <Icon name={listening ? 'mic' : 'mic'} size={30} strokeWidth={2} stroke={listening ? t.inkOnAccent : t.bg} />
      </button>
      <style>{`@keyframes micpulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }`}</style>
    </div>
  );
}

// ─── Color-tinted garment placeholder ──────────────────────────
function GarmentVisual({ t, item, size = '100%', aspect = '3/4' }) {
  const isVoltage = t.id === 'voltage';
  const cat = item.category;
  const iconMap = { tops: 'wardrobe', bottoms: 'wardrobe', outerwear: 'wardrobe', shoes: 'shop', accessories: 'sparkle', other: 'dot' };
  // Determine if color is dark to know what ink to use on it
  const hex = item.colorHex || '#888';
  const dark = isDark(hex);
  const fg = dark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.78)';
  return (
    <div style={{
      width: size, aspectRatio: aspect, borderRadius: isVoltage ? 0 : t.radiusSm,
      background: hex,
      position: 'relative', overflow: 'hidden',
      border: `${isVoltage ? 2 : 1}px solid ${t.border}`,
    }} aria-hidden="true">
      {/* Subtle stripe texture */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `repeating-linear-gradient(135deg, ${fg.replace('0.85','0.07').replace('0.78','0.06')} 0 1px, transparent 1px 14px)`,
      }} />
      {/* Category glyph */}
      <div style={{ position: 'absolute', left: 10, top: 10, color: fg }}>
        <Icon name={iconMap[cat] || 'dot'} size={18} stroke={fg} strokeWidth={1.6} />
      </div>
      {/* Category label */}
      <div style={{
        position: 'absolute', right: 10, top: 10,
        fontFamily: t.fontUI, fontSize: 10, fontWeight: 800,
        textTransform: 'uppercase', letterSpacing: 1.2,
        color: fg, opacity: 0.85,
      }}>{cat}</div>
    </div>
  );
}

function isDark(hex) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16);
  // YIQ luminance
  return (r*299 + g*587 + b*114) / 1000 < 145;
}

// ─── Section divider / label ───────────────────────────────────
function SectionLabel({ t, children, style = {} }) {
  const isVoltage = t.id === 'voltage';
  return (
    <h2 style={{
      margin: '4px 4px 10px',
      fontFamily: t.fontUI,
      fontSize: isVoltage ? 13 : 11,
      fontWeight: isVoltage ? 900 : 700,
      textTransform: 'uppercase',
      letterSpacing: isVoltage ? 1.6 : 1.2,
      color: t.inkMuted,
      ...style,
    }}>{children}</h2>
  );
}

Object.assign(window, {
  Icon, Button, IconButton, Card, ScreenHeader,
  VoiceIndicator, ColorSwatch, FloatingMic, GarmentVisual, SectionLabel,
  isDark,
});
