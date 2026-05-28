// Visual primitives. All reference design tokens. No invented colors.

// ── Placeholder "photo" ─────────────────────────────────────────────────
function HousePhoto({ swatch, swatch2, style = {}, children }) {
  const id = React.useId();
  return (
    <div style={{
      background: `linear-gradient(155deg, ${swatch} 0%, ${swatch2} 100%)`,
      position: 'relative', overflow: 'hidden', ...style,
    }}>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
        <defs>
          <linearGradient id={`s${id}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="0.28"/>
            <stop offset="1" stopColor="#fff" stopOpacity="0"/>
          </linearGradient>
        </defs>
        <rect x="60" y="20" width="26" height="32" fill={`url(#s${id})`}/>
        <line x1="73" y1="20" x2="73" y2="52" stroke="rgba(255,255,255,0.18)" strokeWidth="0.4"/>
        <line x1="60" y1="36" x2="86" y2="36" stroke="rgba(255,255,255,0.18)" strokeWidth="0.4"/>
        <line x1="0" y1="80" x2="100" y2="80" stroke="rgba(0,0,0,0.10)" strokeWidth="0.4"/>
      </svg>
      {children}
    </div>
  );
}

// ── Icons (monoline) ───────────────────────────────────────────────────
const Icons = {
  plus:    (s=18,c='currentColor')=>(<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>),
  search:  (s=18,c='currentColor')=>(<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="11" cy="11" r="7" stroke={c} strokeWidth="1.8"/><path d="M20 20l-3.5-3.5" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>),
  filter:  (s=18,c='currentColor')=>(<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 6h16M7 12h10M10 18h4" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>),
  compare: (s=18,c='currentColor')=>(<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M8 3v18M16 3v18" stroke={c} strokeWidth="1.8" strokeLinecap="round"/><path d="M3 8l3-3 3 3M21 16l-3 3-3-3" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  user:    (s=18,c='currentColor')=>(<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3.5" stroke={c} strokeWidth="1.8"/><path d="M4 20c1.5-4 5-6 8-6s6.5 2 8 6" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>),
  home:    (s=18,c='currentColor')=>(<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1v-9z" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/></svg>),
  camera:  (s=16,c='currentColor')=>(<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M3 7h3l2-2h8l2 2h3v12H3V7z" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/><circle cx="12" cy="13" r="3.5" stroke={c} strokeWidth="1.8"/></svg>),
  list:    (s=18,c='currentColor')=>(<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h16" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>),
  map:     (s=18,c='currentColor')=>(<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/><path d="M9 4v14M15 6v14" stroke={c} strokeWidth="1.8"/></svg>),
  layers:  (s=18,c='currentColor')=>(<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/></svg>),
  arrowR:  (s=14,c='currentColor')=>(<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  arrowL:  (s=14,c='currentColor')=>(<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M19 12H5M11 18l-6-6 6-6" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  close:   (s=18,c='currentColor')=>(<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>),
  check:   (s=14,c='currentColor')=>(<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 12l5 5L20 6" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  pin:     (s=14,c='currentColor')=>(<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M12 22s7-7 7-13a7 7 0 10-14 0c0 6 7 13 7 13z" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/><circle cx="12" cy="9" r="2.5" stroke={c} strokeWidth="1.8"/></svg>),
  more:    (s=18,c='currentColor')=>(<svg width={s} height={s} viewBox="0 0 24 24" fill={c}><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>),
  chevR:   (s=14,c='currentColor')=>(<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M9 6l6 6-6 6" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  chevD:   (s=14,c='currentColor')=>(<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  locate:  (s=18,c='currentColor')=>(<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke={c} strokeWidth="1.8"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke={c} strokeWidth="1.8" strokeLinecap="round"/></svg>),
  edit:    (s=16,c='currentColor')=>(<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M16 3l5 5L8 21H3v-5L16 3z" stroke={c} strokeWidth="1.8" strokeLinejoin="round"/></svg>),
  trash:   (s=16,c='currentColor')=>(<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  share:   (s=16,c='currentColor')=>(<svg width={s} height={s} viewBox="0 0 24 24" fill="none"><circle cx="6" cy="12" r="2.5" stroke={c} strokeWidth="1.8"/><circle cx="17" cy="6" r="2.5" stroke={c} strokeWidth="1.8"/><circle cx="17" cy="18" r="2.5" stroke={c} strokeWidth="1.8"/><path d="M8 11l7-4M8 13l7 4" stroke={c} strokeWidth="1.8"/></svg>),
};

// ── Pips (5-dot meter) ─────────────────────────────────────────────────
function Pips({ value, size = 5, color, dim, gap = 3 }) {
  return (
    <div style={{ display: 'inline-flex', gap, alignItems: 'center' }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{
          width: size, height: size, borderRadius: '50%',
          background: i <= value ? (color || T.ink) : (dim || T.hairline),
        }}/>
      ))}
    </div>
  );
}

// ── Stat bar (horizontal) ──────────────────────────────────────────────
function StatBar({ value, max = 5, color, height = 6, dim }) {
  return (
    <div style={{
      width: '100%', height, borderRadius: 99, overflow: 'hidden',
      background: dim || T.hairline,
    }}>
      <div style={{
        width: `${(value/max)*100}%`, height: '100%',
        background: color || T.ink, borderRadius: 99,
      }}/>
    </div>
  );
}

// ── Map: stylised Mapo-gu vector ───────────────────────────────────────
function MapBase({ width, height, children, dark = false, showLabels = true }) {
  const land  = dark ? '#1B1A17' : T.mapLand;
  const water = dark ? '#0E1E1A' : T.mapWater;
  const road  = dark ? '#262420' : T.mapRoad;
  const stroke= dark ? 'rgba(255,255,255,0.06)' : T.mapStroke;
  const label = dark ? 'rgba(255,255,255,0.45)' : T.mapLabel;
  return (
    <svg width={width} height={height} viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
      style={{ display: 'block', background: land }}>
      {/* Han river */}
      <path d="M -5 80 C 25 92, 55 70, 105 88 L 105 105 L -5 105 Z" fill={water}/>
      {/* Stream */}
      <path d="M -2 8 C 30 6, 50 18, 102 14 L 102 22 C 50 24, 30 14, -2 16 Z" fill={water} opacity="0.6"/>
      {/* Park */}
      <path d="M 5 70 C 12 64, 22 66, 26 74 C 22 82, 10 82, 5 78 Z"
        fill={dark ? '#1F2A22' : '#E2E4D6'} opacity="0.9"/>
      {/* Roads */}
      <g stroke={road} strokeWidth="1.6" fill="none">
        <path d="M -5 50 L 105 48"/>
        <path d="M -5 35 L 105 32"/>
        <path d="M 30 -5 L 28 105"/>
        <path d="M 55 -5 L 60 105"/>
        <path d="M 78 -5 L 85 105"/>
        <path d="M 0 65 L 60 50 L 105 60"/>
      </g>
      <g stroke={stroke} strokeWidth="0.4" fill="none">
        {Array.from({length: 16}).map((_, i) => (
          <path key={i} d={`M ${i*7} 0 L ${i*7} 100`}/>
        ))}
        {Array.from({length: 16}).map((_, i) => (
          <path key={i} d={`M 0 ${i*7} L 100 ${i*7}`}/>
        ))}
      </g>
      {showLabels && (
        <g fontSize="2.2" fill={label} fontFamily={T.family} fontWeight="500">
          <text x="24" y="44">망원</text>
          <text x="49" y="62">합정</text>
          <text x="64" y="56">상수</text>
          <text x="33" y="29">홍대</text>
          <text x="14" y="22">연희</text>
          <text x="67" y="32">아현</text>
          <text x="51" y="92" fontSize="1.8" fontStyle="italic">한강</text>
        </g>
      )}
      {children}
    </svg>
  );
}

// ── Map pin — neutral by default. Selected = larger w/ label flag ──────
function MapPin({ x, y, label, selected = false, onClick, idx, current = false }) {
  const c = current ? T.accent : T.pin;
  return (
    <g transform={`translate(${x*100} ${y*100})`}
      style={{ cursor: 'pointer' }} onClick={onClick}>
      {selected && <circle r="6" fill={c} opacity="0.18"/>}
      <circle r={selected ? "3.2" : "2.4"} fill={c} stroke="#fff" strokeWidth="0.9"/>
      {idx != null && (
        <text x="0" y="0.9" fontSize="2.4" textAnchor="middle" fill="#fff"
          fontFamily={T.family} fontWeight="700">{idx}</text>
      )}
      {selected && label && (
        <g>
          <rect x="-14" y="-12" width="28" height="6" rx="2" fill={c}/>
          <text x="0" y="-7.8" fontSize="2.6" fill="#fff"
            textAnchor="middle" fontFamily={T.family} fontWeight="600">
            {label}
          </text>
        </g>
      )}
    </g>
  );
}

function StatusBarSpacer({ height = 62 }) {
  return <div style={{ height, flexShrink: 0 }}/>;
}

// ── Segmented control ─────────────────────────────────────────────────
function Segmented({ options, value, onChange, size = 'md' }) {
  const sm = size === 'sm';
  return (
    <div style={{
      display: 'inline-flex', padding: 3, borderRadius: 99,
      background: 'rgba(15,14,12,0.06)',
    }}>
      {options.map(o => {
        const on = o.id === value;
        return (
          <button key={o.id} onClick={() => onChange(o.id)} style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: sm ? '5px 10px' : '6px 14px', borderRadius: 99, border: 'none',
            background: on ? T.surface : 'transparent',
            boxShadow: on ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
            color: T.ink, cursor: 'pointer',
            fontSize: sm ? 12 : 13, fontWeight: 600, fontFamily: T.family,
            letterSpacing: -0.1,
          }}>
            {o.icon}
            <span>{o.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Bottom tab bar ────────────────────────────────────────────────────
function TabBar({ active, onChange }) {
  const tabs = [
    { id: 'records', icon: Icons.map,     label: '기록' },
    { id: 'compare', icon: Icons.compare, label: '비교' },
    { id: 'profile', icon: Icons.user,    label: '내 집들' },
  ];
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      height: 80, background: 'rgba(255,255,255,0.92)',
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      borderTop: `1px solid ${T.hairline}`,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-around',
      paddingTop: 10, zIndex: 50,
    }}>
      {tabs.map(t => {
        const a = t.id === active;
        const col = a ? T.ink : T.muted;
        return (
          <button key={t.id} onClick={() => onChange(t.id)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: col, padding: '0 18px',
          }}>
            {t.icon(22, col)}
            <span style={{
              fontSize: 10, fontWeight: 600, letterSpacing: -0.1, fontFamily: T.family,
            }}>{t.label}</span>
          </button>
        );
      })}
    </div>
  );
}

Object.assign(window, {
  HousePhoto, Icons, Pips, StatBar,
  MapBase, MapPin, StatusBarSpacer, Segmented, TabBar,
});
