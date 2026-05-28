// Stylized Mapo-gu map. A calm illustration providing spatial context.
// Pins are HTML-positioned (perfectly round, tappable, predictable).
//
// Map decoration (river, roads, park, labels) lives in SVG with
// preserveAspectRatio="xMidYMid slice" so it crops gracefully when
// the container changes aspect ratio.

const MAP_THEME = {
  light: {
    land:      '#F2EFE8',
    park:      '#D7E1C6',
    river:     '#C6D6E0',
    road:      'rgba(0,0,0,0.10)',
    roadMajor: 'rgba(0,0,0,0.20)',
    label:     'rgba(50,40,30,0.55)',
    riverLabel:'#7A9AAB',
  },
};

function StreetMap({
  houses = HOUSES,
  selectedId = null,
  currentId = null,    // house user currently lives in (rendered green)
  onSelect,
  style = {},
  showLabels = true,
  showUserLocation = true,
}) {
  const M = MAP_THEME.light;

  return (
    <div style={{ position: 'relative', overflow: 'hidden', ...style }}>
      {/* Decorative SVG */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice"
        style={{ width: '100%', height: '100%', display: 'block', background: M.land }}>
        {/* Han river */}
        <path d="M -5 85 Q 25 78, 50 84 T 105 86 L 105 110 L -5 110 Z" fill={M.river}/>
        {/* Mangwon Park */}
        <path d="M 6 78 Q 18 72, 32 76 Q 36 80, 30 84 Q 18 86, 8 84 Z" fill={M.park}/>
        {/* Yeonhui hill */}
        <ellipse cx="20" cy="14" rx="14" ry="8" fill={M.park} opacity="0.7"/>

        {/* Major roads */}
        <g stroke={M.roadMajor} strokeLinecap="round" fill="none">
          <path d="M -5 50 Q 30 48, 60 52 T 105 50" strokeWidth="1.4"/>
          <path d="M 45 -5 Q 47 30, 50 60 T 55 105" strokeWidth="1.2"/>
          <path d="M -5 25 Q 30 22, 70 24 T 105 28" strokeWidth="0.9"/>
        </g>
        {/* Minor roads */}
        <g stroke={M.road} strokeLinecap="round" fill="none">
          <path d="M 15 -5 L 18 50 L 25 80" strokeWidth="0.5"/>
          <path d="M 30 -5 Q 32 30, 35 60 L 40 85" strokeWidth="0.5"/>
          <path d="M 70 -5 Q 72 30, 75 60 L 80 85" strokeWidth="0.5"/>
          <path d="M 85 -5 Q 87 30, 88 60 L 90 85" strokeWidth="0.5"/>
          <path d="M -5 10 L 50 12 L 105 14" strokeWidth="0.5"/>
          <path d="M -5 38 Q 30 36, 70 38 T 105 40" strokeWidth="0.5"/>
          <path d="M -5 65 Q 30 63, 70 65 T 105 67" strokeWidth="0.5"/>
        </g>

        {/* Subway markers (small dots near key stations) */}
        <g fill="#fff" stroke="#9CB3C5" strokeWidth="0.4">
          <circle cx="22" cy="44" r="1.2"/>{/* 망원역 */}
          <circle cx="46" cy="60" r="1.2"/>{/* 합정역 */}
          <circle cx="60" cy="54" r="1.2"/>{/* 상수역 */}
          <circle cx="36" cy="28" r="1.2"/>{/* 홍대입구 */}
          <circle cx="68" cy="32" r="1.2"/>{/* 아현역 */}
        </g>
      </svg>

      {/* HTML overlay — labels */}
      {showLabels && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          {[
            { x: 22, y: 41, label: '망원동' },
            { x: 46, y: 57, label: '합정동' },
            { x: 33, y: 25, label: '연남동' },
            { x: 60, y: 51, label: '상수동' },
            { x: 50, y: 36, label: '서교동' },
            { x: 18, y: 18, label: '연희동' },
            { x: 68, y: 29, label: '아현동' },
            { x: 50, y: 93, label: '한강', italic: true, color: M.riverLabel },
          ].map((l, i) => (
            <div key={i} style={{
              position: 'absolute', left: `${l.x}%`, top: `${l.y}%`,
              transform: 'translate(-50%, -100%)',
              fontSize: 10, fontWeight: 600, fontFamily: T.family,
              color: l.color || M.label, letterSpacing: -0.2,
              fontStyle: l.italic ? 'italic' : 'normal',
              whiteSpace: 'nowrap',
            }}>{l.label}</div>
          ))}
        </div>
      )}

      {/* User location dot */}
      {showUserLocation && (
        <div style={{
          position: 'absolute', left: '52%', top: '48%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
        }}>
          <div style={{
            width: 16, height: 16, borderRadius: 99,
            background: '#2C7CFF', border: '3px solid #fff',
            boxShadow: '0 0 0 6px rgba(44,124,255,0.18), 0 1px 4px rgba(0,0,0,0.2)',
          }}/>
        </div>
      )}

      {/* House pins */}
      {houses.map(h => {
        const pos = GEO[h.id];
        if (!pos) return null;
        const isSel = h.id === selectedId;
        const isCur = h.id === currentId;
        const color = isCur ? T.accent : T.pin;
        return (
          <button key={h.id}
            onClick={(e) => { e.stopPropagation(); onSelect && onSelect(h.id); }}
            style={{
              position: 'absolute',
              left: `${pos.x*100}%`, top: `${pos.y*100}%`,
              transform: `translate(-50%, -100%) ${isSel ? 'scale(1.12)' : ''}`,
              transformOrigin: 'bottom center',
              width: isSel ? 30 : 22, height: 'auto',
              padding: 0, border: 'none', background: 'transparent',
              cursor: 'pointer', transition: 'transform .15s ease',
              zIndex: isSel ? 10 : (isCur ? 5 : 2),
            }}>
            <svg viewBox="0 0 24 32" width={isSel ? 30 : 22}
              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.28))', display: 'block' }}>
              <path d="M12 0.5a9.5 9.5 0 019.5 9.5c0 6.5-9.5 21-9.5 21S2.5 16.5 2.5 10A9.5 9.5 0 0112 0.5z"
                fill={color} stroke="#fff" strokeWidth="1.6"/>
              <circle cx="12" cy="10" r="3" fill="#fff"/>
            </svg>
            {isSel && h.nick && (
              <div style={{
                position: 'absolute',
                bottom: 'calc(100% + 2px)', left: '50%',
                transform: 'translateX(-50%)',
                padding: '4px 10px', borderRadius: 6,
                background: color, color: '#fff',
                fontSize: 11, fontWeight: 600, fontFamily: T.family,
                whiteSpace: 'nowrap', pointerEvents: 'none',
                letterSpacing: -0.2,
              }}>{h.nick}</div>
            )}
          </button>
        );
      })}
    </div>
  );
}

window.StreetMap = StreetMap;
